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

    # If the last author is neither the OP nor the bot, a human expert has replied.
    return True


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
        
        # Ignore system-generated topics like Guidelines, Welcome to Discourse
        first_post = posts[0] if posts else {}
        if first_post.get("username") == "system":
            state.mark_ingested(topic_id)  # Mark so we don't keep polling it
            continue

        if is_resolved(posts, accepted_pid, grace_seconds):
            if not state.is_ingested(topic_id):
                try:
                    from neutrinos_bot.ingest import ingest_community_thread
                    title = topic.get("title", "")
                    question = posts[0].get("cooked", posts[0].get("raw", "")) if posts else ""
                    # Combine all human replies as the "answer"
                    human_replies = [p.get("cooked", p.get("raw", "")) for p in posts[1:] if p.get("username") != "neutrinos_bot"]
                    answer = "\n\n".join(human_replies)
                    if answer:
                        # Call ingest, but it's an async function so we await it
                        logger.info("Dynamically ingesting resolved topic #%d", topic_id)
                        await ingest_community_thread(topic_id, title, question, answer)
                        state.mark_ingested(topic_id)
                except Exception as e:
                    logger.error("Failed to dynamically ingest topic #%d: %s", topic_id, e)
            continue

        first_post = posts[0] if posts else {}
        last_post = posts[-1] if posts else {}
        
        human_replies = [p.get("cooked", p.get("raw", "")) for p in posts[1:] if p.get("username") != "neutrinos_bot"]

        state.record_topic_seen(topic_id)
        
        # Guardrail: don't fire if a human (e.g. OP) replied in the last N minutes
        last_created_str = last_post.get("created_at", "")
        if last_created_str:
            try:
                from datetime import datetime, timezone
                last_created_time = datetime.fromisoformat(last_created_str.replace("Z", "+00:00")).timestamp()
                last_post_age_minutes = (now - last_created_time) / 60
                if last_post_age_minutes < grace_minutes:
                    continue
            except (ValueError, AttributeError):
                pass

        # The pending question is the last post, which provides the most recent context
        pending_question = last_post.get("cooked", last_post.get("raw", ""))

        candidates.append(SLACandidate(
            topic_id=topic_id,
            title=topic.get("title", ""),
            question=pending_question,
            created_at=created_str,
            last_post_author=last_post.get("username", ""),
            posts=posts,
        ))
        # Add a new field dynamically without breaking dataclass if it doesn't exist, but we can just use posts.
        # Actually, let's just pass human_replies as part of the SLACandidate or we can reconstruct it in generator.

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
