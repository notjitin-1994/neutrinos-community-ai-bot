# Draft: neutrinos-sla-bot

- **Slug:** `neutrinos-sla-bot`
- **Intent:** CLEAR — the assignment (docs/Community_AI_SLA_Bot_Discourse.pdf) precisely specifies the outcome: an AI SLA-escalation bot that answers unanswered Discourse topics via a grounded RAG pipeline.
- **Review required:** false (user did not request high-accuracy review).
- **Status:** awaiting-approval — plan written; user reviews .omo/plans/neutrinos-sla-bot.md, then runs /start-work.
- **Pending action:** user review + explicit go-ahead to begin execution.

## Context (compressed)
Build a real, running bot against a Pro-trial Discourse instance (nutrinosbotdemo.discourse.group) that auto-replies to questions breaching an SLA window, grounded in 2 Neutrinos doc PDFs + resolved community threads, with strong guardrails (don't fabricate, don't undercut humans). 3 days to deadline (Sun 19 Jul 2026); presentation Mon 20 Jul 2026.

## Decisions (LOCKED — user chose)
- Runtime: Python 3.11 + FastAPI.
- AI: NVIDIA NIM (OpenAI-compatible, https://integrate.api.nvidia.com/v1) — nvidia/nv-embed-v1 embeddings + nvidia/llama-3.1-70b-instruct generation, single key.
- RAG: LangChain (langchain-nvidia-ai-endpoints) + local Chroma (disk-persisted).
- Discourse target: Pro-trial https://nutrinosbotdemo.discourse.group (API key in user's possession).
- Knowledge sources: 2 doc PDFs + resolved community threads (live-ingested).

## Adopted DEFAULTS (object-to; reversible)
- Run model: polling every ~30s; webhook optional/bonus.
- "Answered" rule: human reply exists AND (marked Solution OR last human reply recent). Topic-3 trap (OP follow-up unanswered) -> treated unresolved.
- Confidence: similarity+source threshold -> above = answer w/ citations; below = decline + @escalate.
- SLA window: configurable; demo-friendly minutes (backdate timestamps).
- Rate-limit resilience: throttle <40 RPM, exp backoff, batched+cached embeddings, idempotent posting, graceful degradation.

## Inputs still needed from the user (owner-decisions / missing data)
1. DISCOURSE_API_USERNAME — admin/bot account username on the instance (API calls need Api-Key AND Api-Username).
2. NVIDIA_API_KEY — user has the account; key not yet provided.
3. Confirm/adjust the adopted defaults above (SLA minutes, confidence threshold).

## Ledgers
- Assets on disk: docs/Community_AI_SLA_Bot_Discourse.pdf; data/knowledge_base/{Neutrinos_API_Integration_Guide,Neutrinos_Workflow_Builder_Reference}.pdf; data/community_seed/Community_Seed_Content.md. All byte-verified.
- API key: currently only in chat, NOT on disk. Repo NOT git-initialized -> no leak. Task 0.1 creates gitignored .env before any git op.
- Seed facts: 10 topics, 4 categories. Solved (control): #1, #5, #9. Unanswered (SLA tests): #2,#3,#4,#6,#7,#8,#10. Traps: #2 (no docs -> honesty), #3 (partial reply). 7 seed users + 1 bot user.

## Approval gate
Present the plan summary; user reviews .omo/plans/neutrinos-sla-bot.md; on "go" -> /start-work. Execution begins at Task 0.1 (bootstrap + secrets), then Task 1.x (seed Discourse — the step the user explicitly asked for).

## IMPORTANT session note
This plan was authored in a session pinned to /home/jitin/einfach-design-studio. The user wants ALL work in /home/jitin/neutrinos-demo. The user will open a NEW session rooted at /home/jitin/neutrinos-demo to review this plan and run /start-work, so that planning writes and execution target the correct codebase.
