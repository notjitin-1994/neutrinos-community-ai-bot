import pytest
import time
from unittest.mock import AsyncMock, MagicMock
from neutrinos_bot.sla_monitor import find_sla_candidates
from neutrinos_bot.state import StateStore
from neutrinos_bot.config import Settings

@pytest.fixture
def state_store():
    # Use in-memory SQLite for testing
    return StateStore(":memory:")

@pytest.fixture
def mock_client():
    client = MagicMock()
    client.list_latest_topics = AsyncMock()
    client.get_topic = AsyncMock()
    return client

@pytest.mark.asyncio
async def test_e2e_sla_breach_detection(mock_client, state_store):
    now = time.time()
    
    # 1. Topic solved (should be skipped)
    # 2. Topic unanswered but SLA window hasn't expired (should be skipped)
    # 3. Topic has human reply within grace period (should be skipped)
    # 4. Topic has OP follow-up outside grace period (should be processed)
    # 5. Topic already answered by bot (should be skipped)
    # 6. Normal unanswered topic past SLA (should be processed)
    
    def ts(minutes_ago):
        return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now - minutes_ago * 60))

    mock_client.list_latest_topics.return_value = {
        "topic_list": {
            "topics": [
                {"id": 1, "title": "Solved", "created_at": ts(20)},
                {"id": 2, "title": "Too new", "created_at": ts(2)},
                {"id": 3, "title": "Human replied recently", "created_at": ts(20)},
                {"id": 4, "title": "OP followed up", "created_at": ts(30)},
                {"id": 5, "title": "Bot already answered", "created_at": ts(20)},
                {"id": 6, "title": "Normal unanswered", "created_at": ts(20)},
            ]
        }
    }
    
    def get_topic_side_effect(topic_id):
        if topic_id == 1:
            return {
                "accepted_answer_post_id": 100,
                "post_stream": {"posts": [{"username": "op"}, {"username": "champ"}]}
            }
        elif topic_id == 3:
            return {
                "post_stream": {"posts": [
                    {"username": "op", "created_at": ts(20)},
                    {"username": "champ", "created_at": ts(2)}
                ]}
            }
        elif topic_id == 4:
            return {
                "post_stream": {"posts": [
                    {"username": "op", "created_at": ts(30)},
                    {"username": "champ", "created_at": ts(20)},
                    {"username": "op", "created_at": ts(15)} # OP follow up > grace (10)
                ]}
            }
        elif topic_id == 5:
            return {
                "post_stream": {"posts": [{"username": "op"}, {"username": "neutrinos_bot"}]}
            }
        elif topic_id == 6:
            return {
                "post_stream": {"posts": [{"username": "op", "created_at": ts(20)}]}
            }
        return {}

    mock_client.get_topic.side_effect = get_topic_side_effect
    
    # Mark topic 5 as answered in state
    state_store.mark_answered(5, 500)
    
    candidates = await find_sla_candidates(mock_client, state_store, sla_minutes=5, grace_minutes=10)
    
    candidate_ids = [c.topic_id for c in candidates]
    
    assert 1 not in candidate_ids, "Solved topic should be skipped"
    assert 2 not in candidate_ids, "New topic under SLA should be skipped"
    assert 3 not in candidate_ids, "Human reply in grace period should be skipped"
    assert 5 not in candidate_ids, "Already answered topic should be skipped"
    
    assert 4 in candidate_ids, "OP follow up outside grace period should be processed"
    assert 6 in candidate_ids, "Normal unanswered topic should be processed"
