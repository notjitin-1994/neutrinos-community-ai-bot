"""Tests for StateStore — SQLite idempotency tracking."""

import os
import tempfile

import pytest

from neutrinos_bot.state import StateStore


@pytest.fixture
def store():
    """Fresh StateStore with a temp database."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    s = StateStore(db_path=db_path)
    s.connect()
    yield s
    s.close()
    os.unlink(db_path)


def test_topic_not_answered_initially(store):
    assert not store.is_bot_answered(999)


def test_mark_answered(store):
    store.mark_answered(topic_id=42, post_id=100, answer_type="answer", confidence=0.85)
    assert store.is_bot_answered(42)


def test_mark_answered_idempotent(store):
    store.mark_answered(topic_id=42, post_id=100)
    store.mark_answered(topic_id=42, post_id=101)
    assert store.is_bot_answered(42)
    state = store.get_state(42)
    assert state["post_id"] == 101


def test_record_topic_seen(store):
    store.record_topic_seen(topic_id=55, last_human_at=1000.0)
    state = store.get_state(55)
    assert state is not None
    assert state["last_human_at"] == 1000.0


def test_get_all_answered(store):
    store.mark_answered(topic_id=1)
    store.mark_answered(topic_id=2)
    store.mark_answered(topic_id=3)
    answered = store.get_all_answered()
    assert set(answered) == {1, 2, 3}


def test_get_state_none_for_unknown(store):
    assert store.get_state(99999) is None
