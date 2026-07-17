# Design Document: Neutrinos SLA Bot

## 1. Architecture Summary

The bot is a Python/FastAPI service that polls a Discourse instance for unresolved topics breaching an SLA window, retrieves grounded answers from a RAG pipeline (NVIDIA NIM + Chroma), and posts labeled replies with citations or escalations. All operations are rate-limited and idempotent.

**Data flow:**
```
Discourse → SLA Monitor (poll) → "Answered?" Rule → RAG Pipeline → Confidence Gate → Post-back → Discourse
                                                              ↓
                                                    State Store (SQLite, idempotent)
```

## 2. Continuous Production Operation

### Polling Model
- Primary trigger: polling `/latest.json` every 30 seconds
- Bonus: `/webhook` endpoint for event-driven triggering
- Polling is robust: no public URL needed, survives restarts, handles transient failures via exponential backoff

### State Persistence
- **Chroma vectors:** disk-persisted at `chroma/` — survive restarts, no re-embedding needed
- **Bot state:** SQLite at `state.db` — idempotent post tracking prevents double-posts across restarts
- **Configuration:** `.env` file — all settings externalized

### Health Monitoring
- `GET /health` endpoint for uptime checks
- Structured logging at INFO level for all operations
- Rate limiter call-count tracking for throttle observability

## 3. Measurement & KPIs

| Metric | Definition | Target |
|--------|------------|--------|
| **Answer Rate** | % of SLA-breaching topics that receive a bot reply | > 90% |
| **Human Acceptance** | % of bot answers NOT flagged/rejected by humans | > 80% |
| **Time to First Response** | Median time from topic creation to bot reply | < SLA window + 1 min |
| **Engagement Delta** | Change in human reply volume after bot deployment | > -10% (minimal displacement) |
| **Escalation Rate** | % of topics where bot declines (low confidence) | 10-20% (honesty indicator) |
| **Double-Post Rate** | Duplicate bot replies per topic | 0 (idempotent) |

## 4. The "Don't Kill Human Engagement" Risk

### The Problem
An overly aggressive bot could:
1. Answer too quickly, discouraging human experts from participating
2. Provide answers that humans would have given better, reducing community quality
3. Create a dependency where members wait for the bot instead of engaging

### Mitigations

**1. SLA Tuned Above Median Human Response**
- The SLA window should be set ABOVE the median human response time
- Default demo: 5 minutes (artificially short for demonstration)
- Production recommendation: 24 hours (only intervene when humans truly haven't responded)
- The bot fills **gaps**, not races

**2. Escalate-Not-Replace**
- Low-confidence topics get escalation messages ("pinging a human expert"), not guesses
- Every bot reply offers "Was this helpful? React or reply to flag a human expert"
- The bot explicitly positions itself as a fallback, not a replacement

**3. Active-Conversation Guard**
- If any human has replied within the grace window, the bot holds off
- Even if the SLA window has passed, recent human activity means the conversation is alive
- This prevents the bot from "interrupting" active discussions

**4. Clear AI Labeling**
- Every bot reply is prefixed with `> **AI-generated answer** 🤖`
- Citations are always included so humans can verify the source
- Community members know exactly which replies are AI-generated

## 5. Rate Limit Resilience

NVIDIA NIM free tier allows ~40 RPM shared. The bot stays well under this:

- **Token-bucket throttle:** 30 RPM default (configurable via `RATE_LIMIT_RPM`)
- **Batched embeddings:** Up to 32 passages per API call
- **Persisted vectors:** Embed once, reuse across runs (no re-embedding)
- **Exponential backoff:** `with_backoff()` retries on 429/timeout with jittered delays (1s base, 60s max, 5 retries)
- **Graceful degradation:** On sustained failures, the bot queues and retries rather than crashing or posting garbage

## 6. Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | Python 3.11+ | Best RAG ecosystem; LangChain/Chroma/pypdf native |
| Web framework | FastAPI | Async-native; clean API + CLI dual entrypoint |
| LLM | NVIDIA NIM (llama-3.1-70b) | Free tier; OpenAI-compatible; strong instruction-following |
| Embeddings | NVIDIA nv-embed-v1 | Asymmetric query/passage embedding; retrieval-optimized |
| Vector store | Chroma (local) | Zero infrastructure; disk-persisted; sufficient for this scale |
| State | SQLite | Simple; file-based; no server needed; atomic writes |
| Trigger | Polling | No public URL needed; robust; assignment-allowed |
