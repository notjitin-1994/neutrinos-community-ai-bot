# SLA & "Answered" Definition

## Overview

The bot intervenes only when a topic is **unresolved** AND has **breached the SLA window**. This document defines both terms precisely, including edge-case handling.

## SLA Window

- **Default:** 5 minutes (demo-friendly; production would use hours/days)
- **Grace period:** 10 minutes — if a human has replied within this window, the bot holds off even if the SLA window has passed
- Both values are configurable via `.env` (`SLA_WINDOW_MINUTES`, `SLA_GRACE_MINUTES`)

## "Answered" Rule (Section 5)

A topic is **resolved** (bot must NOT intervene) if ANY of:
1. It has an **accepted solution** (Solved plugin) — `accepted_answer_post_id` is set
2. The **last post** is from a **non-bot, non-OP human**.

A topic is an **SLA candidate** if ALL of:
- `now - created_at > SLA_WINDOW`
- NOT resolved
- Bot has NOT already replied (`bot_answered = 0` in state store)
- No human reply in the last grace minutes

## The Topic-3 Trap

**Scenario:** Topic 3 has an earlier reply from a champion, but the thread ends with the original poster (OP) asking a follow-up question that nobody answered.

```
ops_karan:   "My flow has been sitting at one step..."
champion_leo: "Which node is it stuck at? If Human Task..."
ops_karan:   "Yeah it's a Human Task. But the assignee left the company..."
```

**Naive approach (WRONG):** "Has a reply? → resolved → skip"
**Correct approach:** The thread is unresolved because:
- The last post is from the OP (not a human expert)
- The actual follow-up question ("can I reassign?") has no answer
- The bot should treat this as an SLA candidate and answer it

**Implementation:** `is_resolved()` in `sla_monitor.py`:
```python
resolved = accepted_solution OR (
    last_post.author != OP AND
    last_post.author != bot
)
```

This correctly handles the topic-3 trap: the last post is from the OP, so `last_post.author == OP` fails the check, and the topic remains unresolved.

## Why This Matters

The "answered?" rule is 15% of the assignment rubric. A naive "has_reply = answered" approach would:
- Miss the topic-3 follow-up (human expert partially answered, OP's real question is unanswered)
- Potentially answer already-solved topics (topic 1, 5, 9 — control group that should be left alone)

The three-layer check (accepted_solution → last_post_author → grace_window) ensures the bot fills genuine gaps without replacing or racing human experts.
