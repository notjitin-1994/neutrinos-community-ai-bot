"""Rate-limited Discourse API client.

Async httpx wrapper for Discourse forum operations: list topics, read
topic+posts, create posts, and manage accepted solutions. All calls go
through the shared RateLimiter + exponential backoff.
"""

import logging
from typing import Any

import httpx

from neutrinos_bot.config import get_settings
from neutrinos_bot.rate_limit import RateLimiter, with_backoff

logger = logging.getLogger(__name__)


class DiscourseClient:
    """Async client for the Discourse REST API."""

    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        api_username: str | None = None,
        rpm: int | None = None,
        dry_run: bool = False,
    ) -> None:
        settings = get_settings()
        self._base_url = (base_url or settings.discourse_base_url).rstrip("/")
        self._api_key = api_key or settings.discourse_api_key
        self._api_username = api_username or settings.discourse_api_username
        self._limiter = RateLimiter(rpm=rpm or settings.rate_limit_rpm)
        self._dry_run = dry_run

        self._headers = {
            "Api-Key": self._api_key,
            "Api-Username": self._api_username,
            "Content-Type": "application/json",
        }
        self._http = httpx.AsyncClient(
            base_url=self._base_url,
            headers=self._headers,
            timeout=httpx.Timeout(30.0, connect=10.0),
        )

    async def close(self) -> None:
        await self._http.aclose()

    async def __aenter__(self) -> "DiscourseClient":
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()

    # ---- Read ----

    async def list_latest_topics(self, page: int = 0) -> dict[str, Any]:
        """GET /latest.json — list latest topics."""
        return await self._get("/latest.json", params={"page": page})

    async def get_topic(self, topic_id: int) -> dict[str, Any]:
        """GET /t/{id}.json — topic details including posts."""
        return await self._get(f"/t/{topic_id}.json")

    async def get_topic_posts(self, topic_id: int) -> list[dict[str, Any]]:
        """Get all posts in a topic."""
        topic = await self.get_topic(topic_id)
        posts = topic.get("post_stream", {}).get("posts", [])
        stream_ids = topic.get("post_stream", {}).get("stream", [])
        if len(stream_ids) > len(posts):
            missing_ids = stream_ids[len(posts) :]
            if missing_ids:
                extra = await self._get(
                    f"/t/{topic_id}/posts.json", params={"post_ids[]": missing_ids}
                )
                posts.extend(extra.get("post_stream", {}).get("posts", []))
        return posts

    async def get_categories(self) -> list[dict[str, Any]]:
        data = await self._get("/categories.json")
        return data.get("category_list", {}).get("categories", [])

    async def get_users(self) -> list[dict[str, Any]]:
        data = await self._get("/users.json")
        return data.get("users", [])

    # ---- Write ----

    async def create_post(
        self, topic_id: int, raw: str, reply_to_post_number: int | None = None, api_username: str | None = None
    ) -> dict[str, Any]:
        """POST /posts.json — create a new post in a topic."""
        payload: dict[str, Any] = {"topic_id": topic_id, "raw": raw}
        if reply_to_post_number is not None:
            payload["reply_to_post_number"] = reply_to_post_number
        if self._dry_run:
            logger.info("[DRY-RUN] Would post to topic %d: %s", topic_id, raw[:200])
            return {"dry_run": True, "topic_id": topic_id}
        return await self._post("/posts.json", json=payload, api_username=api_username)

    async def create_topic(
        self, title: str, raw: str, category: int, tags: list[str] | None = None, api_username: str | None = None
    ) -> dict[str, Any]:
        """Create a new topic (Discourse creates topics via the posts endpoint)."""
        payload: dict[str, Any] = {"title": title, "raw": raw, "category": category}
        if tags:
            payload["tags"] = tags
        if self._dry_run:
            logger.info("[DRY-RUN] Would create topic: %s", title)
            return {"dry_run": True, "title": title}
        return await self._post("/posts.json", json=payload, api_username=api_username)

    async def set_accepted_answer(self, topic_id: int, post_id: int, api_username: str | None = None) -> dict[str, Any]:
        """Mark a post as accepted solution (Solved plugin)."""
        if self._dry_run:
            logger.info("[DRY-RUN] Would mark post %d as solution for topic %d", post_id, topic_id)
            return {"dry_run": True}
        try:
            return await self._post("/solution/accept.json", json={"id": post_id}, api_username=api_username)
        except httpx.HTTPStatusError as exc:
            logger.warning("set_accepted_answer failed: %s (plugin may not be enabled)", exc)
            return {"error": str(exc)}

    async def delete_topic(self, topic_id: int, api_username: str | None = None) -> dict[str, Any]:
        """DELETE /t/{id}.json — delete a topic."""
        if self._dry_run:
            logger.info("[DRY-RUN] Would delete topic %d", topic_id)
            return {"dry_run": True}
        return await self._delete(f"/t/{topic_id}.json", api_username=api_username)

    # ---- Low-level ----

    async def _get(self, path: str, **kwargs: Any) -> dict[str, Any]:
        await self._limiter.acquire()
        resp = await with_backoff(self._http.get, path, **kwargs)
        resp.raise_for_status()
        return resp.json()

    async def _post(self, path: str, api_username: str | None = None, **kwargs: Any) -> dict[str, Any]:
        import asyncio
        if api_username:
            headers = self._headers.copy()
            headers["Api-Username"] = api_username
            if "headers" in kwargs:
                headers.update(kwargs["headers"])
            kwargs["headers"] = headers
        
        for attempt in range(5):
            await self._limiter.acquire()
            resp = await with_backoff(self._http.post, path, **kwargs)
            if resp.status_code == 429:
                wait_time = 20
                if "Retry-After" in resp.headers:
                    try:
                        wait_time = int(resp.headers["Retry-After"])
                    except ValueError:
                        pass
                else:
                    try:
                        data = resp.json()
                        if "extras" in data and "wait_seconds" in data["extras"]:
                            wait_time = int(data["extras"]["wait_seconds"])
                    except Exception:
                        pass
                wait_time += 1  # Add a 1s safety buffer
                logger.warning("Got 429 Too Many Requests, sleeping %ds and retrying...", wait_time)
                await asyncio.sleep(wait_time)
                continue
            resp.raise_for_status()
            return resp.json()
        
        raise Exception("Max retries exceeded for 429 Too Many Requests")

    async def _delete(self, path: str, api_username: str | None = None, **kwargs: Any) -> dict[str, Any]:
        await self._limiter.acquire()
        if api_username:
            headers = self._headers.copy()
            headers["Api-Username"] = api_username
            if "headers" in kwargs:
                headers.update(kwargs["headers"])
            kwargs["headers"] = headers
        resp = await with_backoff(self._http.delete, path, **kwargs)
        resp.raise_for_status()
        try:
            return resp.json()
        except Exception:
            return {}
