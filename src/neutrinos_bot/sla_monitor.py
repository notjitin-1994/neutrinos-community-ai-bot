"""SLA monitoring poll loop with answered-rule logic.

Polls Discourse /latest.json, evaluates each topic against the SLA rule from
Section 5 of the plan, and enqueues unresolved SLA-breaching candidates for
the RAG pipeline + post-back to handle.

Answered rule (Section 5):
  A topic is resolved if it has an accepted_solution OR the last post is from
  a non-bot, non-OP human within the grace window.
  Topic-3 trap: if the last post is the OP asking a follow-up that nobody
  answered, the topic is unresolved even though an earlier reply exists.
"""

import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Any

from neutrinos_bot.config import get_settings
from neutrinos_bot.discourse_client import DiscourseClient
from neutrinos_bot.state import StateStore

logger = logging.getLogger(__name__)


@dataclass
class SLACandidate:
    topic_id: int
    title: str
    question: str
    created_at: str
    last_post_author: str
    posts: list[dict[str, Any]]


def is_resolved(
    posts: list[dict[str, Any]],
    accepted_answer_post_id: int | None,
    grace_seconds: int,
    bot_username: str = "neutrinos_bot",
) -> bool:
    """Apply the Section 5 'answered?' rule to a topic's posts."""
    if accepted_answer_post_id:
        return True

    if not posts:
        return False

    last_post = posts[-1]
    last_author = last_post.get("username", "")
    last_created = last_post.get("created_at", "")
    op_username = posts[0].get("username", "") if posts else ""

    if last_author == bot_username:
        return False
    if last_author == op_username:
        return False

    now = time.time()
    from datetime import datetime, timezone

    try:
        post_time = datetime.fromisoformat(last_created.replace("Z", "+00:00")).timestamp()
    except (ValueError, AttributeError):
        return False

    age = now - post_time
    return age < grace_seconds


async def find_sla_candidates(
    client: DiscourseClient,
    state: StateStore,
    sla_minutes: int | None = None,
    grace_minutes: int | None = None,
) -> list[SLACandidate]:
    """Scan latest topics and return those breaching SLA that the bot hasn't answered."""
    settings = get_settings()
    sla_minutes = sla_minutes or settings.sla_window_minutes
    grace_minutes = grace_minutes or settings.sla_grace_minutes
    grace_seconds = grace_minutes * 60

    data = await client.list_latest_topics()
    topic_list = data.get("topic_list", {}).get("topics", [])

    candidates: list[SLACandidate] = []
    now = time.time()

    for topic in topic_list:
        topic_id = topic["id"]
        if state.is_bot_answered(topic_id):
            continue

        created_str = topic.get("created_at", "")
        try:
            from datetime import datetime, timezone
            created_time = datetime.fromisoformat(created_str.replace("Z", "+00:00")).timestamp()
        except (ValueError, AttributeError):
            continue

        age_minutes = (now - created_time) / 60
        if age_minutes < sla_minutes:
            continue

        full_topic = await client.get_topic(topic_id)
        posts = full_topic.get("post_stream", {}).get("posts", [])
        accepted_pid = full_topic.get("accepted_answer_post_id")

        if is_resolved(posts, accepted_pid, grace_seconds):
            continue

        first_post = posts[0] if posts else {}
        last_post = posts[-1] if posts else {}

        state.record_topic_seen(topic_id)

        candidates.append(SLACandidate(
            topic_id=topic_id,
            title=topic.get("title", ""),
            question=first_post.get("cooked", first_post.get("raw", "")),
            created_at=created_str,
            last_post_author=last_post.get("username", ""),
            posts=posts,
        ))
        logger.info("SLA breach: topic #%d '%s' (age %.0fmin)", topic_id, topic.get("title", ""), age_minutes)

    logger.info("Found %d SLA candidates", len(candidates))
    return candidates


async def run_cycle(
    client: DiscourseClient,
    state: StateStore,
    dry_run: bool = False,
) -> list[SLACandidate]:
    """Run one SLA scan cycle. Returns candidates found."""
    candidates = await find_sla_candidates(client, state)
    if dry_run:
        for c in candidates:
            logger.info("[DRY-RUN] Would process topic #%d: %s", c.topic_id, c.title)
    return candidates


async def run_watch(
    client: DiscourseClient,
    state: StateStore,
    interval_seconds: int = 30,
    max_cycles: int | None = None,
) -> None:
    """Continuously poll for SLA breaches."""
    cycle = 0
    while max_cycles is None or cycle < max_cycles:
        cycle += 1
        logger.info("=== SLA monitor cycle %d ===", cycle)
        await run_cycle(client, state)
        await asyncio.sleep(interval_seconds)
