"""Post replies back to Discourse with labeling.

Takes an SLA candidate + RAG result, formats a labeled bot reply with
citations, and posts it to Discourse. Low-confidence results get an
escalation message instead of an answer. All posts are idempotent via
the StateStore.
"""

import logging
from typing import Any

from neutrinos_bot.confidence import ConfidenceResult
from neutrinos_bot.discourse_client import DiscourseClient
from neutrinos_bot.generator import GenerationResult
from neutrinos_bot.state import StateStore

logger = logging.getLogger(__name__)

AI_LABEL = "> **AI-generated answer** 🤖\n>\n> "
FOOTER = (
    "\n\n---\n\n"
    "*Was this helpful? React with 👍 or reply to flag a human expert. "
    "This answer was generated from Neutrinos documentation.*"
)

ESCALATE_TEMPLATE = (
    "> **AI assistant** 🤖\n>\n> "
    "I don't have a confident source for this question in the current documentation. "
    "Pinging a human expert to help — @neutrinos_champion"
)


def format_answer(question: str, result: GenerationResult, confidence: ConfidenceResult) -> str:
    """Format a confident answer post with citations."""
    citations_str = ""
    if result.citations:
        citations_str = "\n\n**Sources:** " + ", ".join(result.citations)

    body = f"{AI_LABEL}{result.answer}{citations_str}{FOOTER}"
    return body


def format_escalation(question: str) -> str:
    """Format a low-confidence escalation post."""
    return ESCALATE_TEMPLATE


async def post_reply(
    topic_id: int,
    question: str,
    gen_result: GenerationResult,
    conf_result: ConfidenceResult,
    client: DiscourseClient,
    state: StateStore,
) -> dict[str, Any]:
    """Post a bot reply (answer or escalation) to a topic. Idempotent."""
    if state.is_bot_answered(topic_id):
        logger.info("Topic #%d already answered, skipping", topic_id)
        return {"skipped": True, "topic_id": topic_id}

    if conf_result.confident:
        body = format_answer(question, gen_result, conf_result)
        answer_type = "answer"
    else:
        body = format_escalation(question)
        answer_type = "escalate"

    response = await client.create_post(topic_id=topic_id, raw=body)
    post_id = response.get("id") if not response.get("dry_run") else None

    state.mark_answered(
        topic_id=topic_id,
        post_id=post_id,
        answer_type=answer_type,
        confidence=conf_result.score,
    )

    logger.info(
        "Posted %s to topic #%d (conf=%.3f)",
        answer_type,
        topic_id,
        conf_result.score,
    )
    return {
        "topic_id": topic_id,
        "answer_type": answer_type,
        "confidence": conf_result.score,
        "post_id": post_id,
        "body_preview": body[:200],
    }
