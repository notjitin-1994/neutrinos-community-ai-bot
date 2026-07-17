# Demo Script

## Prerequisites

1. `.env` configured with real `DISCOURSE_API_KEY`, `DISCOURSE_API_USERNAME`, `NVIDIA_API_KEY`
2. Discourse instance seeded: `python scripts/seed_discourse.py`
3. Knowledge base ingested: `python -c "import asyncio; from neutrinos_bot.ingest import ingest_pdfs; asyncio.run(ingest_pdfs())"`
4. Virtualenv activated: `source .venv/bin/activate`

## Demo Flow (5 minutes)

### Step 1: Show the Seeded Community (30 seconds)

- Open `https://nutrinosbotdemo.discourse.group/` in browser
- Point out 4 categories, 10 topics
- Highlight: Topics #1, #5, #9 have green checkmarks (solved by humans)
- Highlight: Topics #2, #3, #4, #6, #7, #8, #10 are unanswered

### Step 2: Dry Run (1 minute)

```bash
python -m neutrinos_bot.main run --once --dry-run
```

- Show log output: SLA monitor finds candidates
- Point out the "answered?" rule in action: solved topics skipped
- Point out topic-3 trap detected (partially answered but follow-up unresolved)

### Step 3: Live Run — Confident Answer (1 minute)

```bash
python -m neutrinos_bot.main run --once
```

- Bot processes topic #4 ("Loop node failing on large dataset")
- RAG retrieves Workflow Builder doc about "Loop Limit Exceeded" + default max iteration guard
- Confidence score HIGH → bot posts labeled answer with citation
- Refresh Discourse → show the AI-generated reply with citation

### Step 4: Edge Case — Topic 2 Decline (1 minute)

- Topic #2 ("Test Run button greyed out") — no Getting Started docs in knowledge base
- RAG retrieves low-similarity chunks from unrelated docs
- Confidence score LOW (< 0.35) → bot posts escalation, NOT a fabricated answer
- Show the escalation message: "I don't have a confident source... pinging a human expert"

### Step 5: Edge Case — Topic 3 Partial Reply (30 seconds)

- Topic #3 — champion replied but OP's follow-up is unanswered
- The "answered?" rule correctly identifies this as unresolved (last post is from OP)
- Bot answers the reassignment question citing the Workflow Builder docs

### Step 6: Show Idempotency (30 seconds)

```bash
python -m neutrinos_bot.main run --once
```

- Run again → no new posts (state.db marks topics as answered)
- Show `state.db` contents: `SELECT * FROM bot_state WHERE bot_answered = 1`

## Edge Cases to Highlight

| Case | Topic | Expected Behavior |
|------|-------|-------------------|
| Solved by human | #1, #5, #9 | Bot skips entirely |
| No docs available | #2 | Bot declines + escalates (honesty test) |
| Partial reply (topic-3 trap) | #3 | Bot detects unresolved follow-up, answers it |
| Clear doc-backed question | #4, #6, #7 | Bot posts confident answer with citations |
| Data type question | #8 | Bot answers citing API Integration Guide |
| Process question | #10 | Bot answers citing rollback documentation |

## Recording Tips

- Use screen recording (OBS / QuickTime)
- Show terminal + browser side by side
- narrate each step
- Keep under 5 minutes total
