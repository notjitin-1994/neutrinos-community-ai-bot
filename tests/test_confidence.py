"""Tests for confidence scoring gate."""

import pytest

from neutrinos_bot.confidence import compute_score, evaluate, ConfidenceResult
from neutrinos_bot.retriever import RetrievedChunk


def _make_chunk(source: str, source_ref: str, sim: float) -> RetrievedChunk:
    return RetrievedChunk(text="x", source=source, source_ref=source_ref, similarity=sim)


def test_empty_chunks_zero_score():
    assert compute_score([]) == 0.0


def test_high_similarity_doc_chunks_confident():
    chunks = [
        _make_chunk("doc", "Guide p1", 0.85),
        _make_chunk("doc", "Guide p2", 0.80),
        _make_chunk("doc", "Guide p3", 0.75),
    ]
    result = evaluate(chunks, threshold=0.35)
    assert result.confident is True
    assert result.score > 0.5


def test_low_similarity_triggers_decline():
    chunks = [
        _make_chunk("community", "topic #5", 0.15),
        _make_chunk("community", "topic #6", 0.10),
    ]
    result = evaluate(chunks, threshold=0.35)
    assert result.confident is False
    assert "escalating" in result.reason.lower()


def test_doc_bonus_boosts_score():
    doc_chunks = [_make_chunk("doc", "Guide p1", 0.6), _make_chunk("doc", "Guide p2", 0.55)]
    community_chunks = [_make_chunk("community", "topic #1", 0.6), _make_chunk("community", "topic #2", 0.55)]
    doc_score = compute_score(doc_chunks)
    community_score = compute_score(community_chunks)
    assert doc_score > community_score


def test_custom_threshold():
    chunks = [_make_chunk("doc", "Guide p1", 0.5)]
    result = evaluate(chunks, threshold=0.9)
    assert result.confident is False
