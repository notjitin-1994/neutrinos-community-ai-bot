"""Shared async rate limiter with exponential backoff for all external API calls.

Token-bucket throttle capped at configurable RPM, with jittered exponential
backoff on 429/timeout responses. Used by both nvidia_client and discourse_client.
"""

import asyncio
import logging
import random
import time
from collections.abc import Callable, Coroutine
from typing import Any

logger = logging.getLogger(__name__)


class RateLimiter:
    """Token-bucket rate limiter that enforces a max-requests-per-minute cap."""

    def __init__(self, rpm: int = 30) -> None:
        self._min_interval = 60.0 / rpm if rpm > 0 else 0
        self._last_call: float = 0.0
        self._lock = asyncio.Lock()
        self._call_count = 0

    async def acquire(self) -> None:
        """Block until it's safe to make the next call."""
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_call
            if elapsed < self._min_interval:
                wait = self._min_interval - elapsed
                logger.debug("RateLimiter: waiting %.2fs (call #%d)", wait, self._call_count)
                await asyncio.sleep(wait)
            self._last_call = time.monotonic()
            self._call_count += 1

    @property
    def call_count(self) -> int:
        return self._call_count


async def with_backoff(
    func: Callable[..., Coroutine[Any, Any, Any]],
    *args: Any,
    max_retries: int = 5,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    **kwargs: Any,
) -> Any:
    """Call an async function with exponential backoff + jitter on failure.

    Retries on:
    - HTTP 429 (rate limited)
    - httpx.TimeoutException
    - Any exception with .status == 429 or .response.status_code == 429

    Raises the last exception if all retries are exhausted.
    """
    last_exc: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            return await func(*args, **kwargs)
        except Exception as exc:
            last_exc = exc
            should_retry = _is_retryable(exc)
            if not should_retry or attempt == max_retries:
                raise

            delay = min(max_delay, base_delay * (2**attempt) + random.uniform(0, 1))
            logger.warning(
                "with_backoff: attempt %d/%d failed (%s), retrying in %.1fs",
                attempt + 1,
                max_retries,
                type(exc).__name__,
                delay,
            )
            await asyncio.sleep(delay)

    assert last_exc is not None
    raise last_exc


def _is_retryable(exc: Exception) -> bool:
    """Check if an exception is retryable (429 or timeout)."""
    # Check for status code attribute
    status = getattr(exc, "status_code", None) or getattr(exc, "status", None)
    if status == 429:
        return True

    # Check for response attribute with status_code
    response = getattr(exc, "response", None)
    if response is not None:
        resp_status = getattr(response, "status_code", None)
        if resp_status == 429:
            return True

    # Check for timeout errors
    exc_name = type(exc).__name__
    if "Timeout" in exc_name or "timeout" in exc_name.lower():
        return True

    # httpx specific
    if "ConnectError" in exc_name or "ReadTimeout" in exc_name:
        return True

    return False
