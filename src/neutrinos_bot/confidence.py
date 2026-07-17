"""Confidence scoring gate — answer vs decline/escalate.

Computes a weighted confidence score from retrieved chunks and decides
whether the bot should answer (score >= threshold) or decline + escalate
(score < threshold). This is the critical anti-hallucination gate.
"""

import logging
from dataclasses import dataclass

from neutrinos_bot.config import get_settings
from neutrinos_bot.retriever import RetrievedChunk

logger = logging.getLogger(__name__)


@dataclass
class ConfidenceResult:
    confident: bool
    score: float
    reason: str = ""


def compute_score(chunks: list[RetrievedChunk]) -> float:
    """Weighted combo: 0.5 * max_sim + 0.3 * mean_top3_sim + 0.2 * source_bonus."""
    if not chunks:
        return 0.0

    similarities = [c["similarity"] for c in chunks]
    max_sim = max(similarities)

    top3 = sorted(similarities, reverse=True)[:3]
    mean_top3 = sum(top3) / len(top3) if top3 else 0.0

    doc_count = sum(1 for c in chunks if c.get("source") == "doc")
    community_count = sum(1 for c in chunks if c.get("source") == "community")
    total = doc_count + community_count
    source_bonus = (doc_count * 1.0 + community_count * 0.5) / total if total > 0 else 0.0

    return 0.5 * max_sim + 0.3 * mean_top3 + 0.2 * source_bonus


def evaluate(
    chunks: list[RetrievedChunk],
    threshold: float | None = None,
) -> ConfidenceResult:
    """Decide whether to answer or escalate based on chunk quality."""
    settings = get_settings()
    threshold = threshold if threshold is not None else settings.confidence_threshold

    score = compute_score(chunks)

    if score >= threshold:
        return ConfidenceResult(
            confident=True,
            score=score,
            reason=f"Score {score:.3f} >= threshold {threshold}",
        )

    return ConfidenceResult(
        confident=False,
        score=score,
        reason=f"Score {score:.3f} < threshold {threshold} — escalating to human",
    )
