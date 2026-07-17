"""Tests for the SLA answered-rule logic (no external APIs)."""

import time

from neutrinos_bot.sla_monitor import is_resolved


def _post(username, created_at, bot=False):
    return {"username": username, "created_at": created_at}


def test_no_posts_unresolved():
    assert not is_resolved([], None, grace_seconds=600)


def test_accepted_solution_resolved():
    posts = [_post("user_a", "2025-01-01T00:00:00Z")]
    assert is_resolved(posts, accepted_answer_post_id=1, grace_seconds=600)


def test_op_last_post_unresolved():
    posts = [_post("user_a", "2025-01-01T00:00:00Z"), _post("user_a", "2025-01-01T00:05:00Z")]
    assert not is_resolved(posts, None, grace_seconds=600)


def test_bot_last_post_unresolved():
    posts = [
        _post("user_a", "2025-01-01T00:00:00Z"),
        _post("neutrinos_bot", "2025-01-01T00:05:00Z"),
    ]
    assert not is_resolved(posts, None, grace_seconds=600)


def test_human_last_post_resolved():
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    posts = [
        _post("user_a", "2025-01-01T00:00:00Z"),
        _post("champion_sara", now_iso),
    ]
    assert is_resolved(posts, None, grace_seconds=600)


def test_topic3_trap():
    """OP follow-up unanswered even though an earlier reply exists."""
    posts = [
        _post("ops_karan", "2025-01-01T00:00:00Z"),
        _post("champion_leo", "2025-01-01T00:30:00Z"),
        _post("ops_karan", "2025-01-01T01:00:00Z"),
    ]
    assert not is_resolved(posts, None, grace_seconds=600)
