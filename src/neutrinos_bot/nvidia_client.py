"""Rate-limited NVIDIA NIM client for embeddings + LLM generation.

Uses the OpenAI-compatible interface against NVIDIA's integrate.api.nvidia.com.
Implements batched embeddings, token-bucket throttling, and exponential backoff.
"""

import logging

from openai import AsyncOpenAI

from neutrinos_bot.config import get_settings
from neutrinos_bot.rate_limit import RateLimiter, with_backoff

logger = logging.getLogger(__name__)


class NvidiaClient:
    """Async client wrapping NVIDIA NIM for embeddings and chat completion."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        embed_model: str | None = None,
        gen_model: str | None = None,
        rpm: int | None = None,
    ) -> None:
        settings = get_settings()
        self._api_key = api_key or settings.nvidia_api_key
        self._base_url = base_url or settings.nvidia_base_url
        self._embed_model = embed_model or settings.nvidia_embed_model
        self._gen_model = gen_model or settings.nvidia_gen_model
        self._limiter = RateLimiter(rpm=rpm or settings.rate_limit_rpm)
        self._client = AsyncOpenAI(api_key=self._api_key, base_url=self._base_url)

    # ---- Embeddings ----

    async def embed_query(self, text: str) -> list[float]:
        """Embed a single search query (input_type=query)."""
        return (await self.embed_queries([text]))[0]

    async def embed_queries(self, texts: list[str]) -> list[list[float]]:
        """Embed multiple search queries in one batched call."""
        return await self._embed_batch(texts, input_type="query")

    async def embed_passages(self, texts: list[str]) -> list[list[float]]:
        """Embed document passages for storage (input_type=passage)."""
        return await self._embed_batch(texts, input_type="passage")

    async def _embed_batch(
        self, texts: list[str], input_type: str, batch_size: int = 32
    ) -> list[list[float]]:
        """Embed texts in batches, respecting rate limits."""
        all_embeddings: list[list[float]] = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            await self._limiter.acquire()
            logger.info("Embedding batch %d-%d (%s)", i, i + len(batch), input_type)
            response = await with_backoff(
                self._client.embeddings.create,
                model=self._embed_model,
                input=batch,
                extra_body={"input_type": input_type},
            )
            all_embeddings.extend([d.embedding for d in response.data])
        return all_embeddings

    # ---- Generation ----

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        """Generate a completion with the configured LLM."""
        await self._limiter.acquire()
        logger.info("Generating with %s", self._gen_model)
        response = await with_backoff(
            self._client.chat.completions.create,
            model=self._gen_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""
