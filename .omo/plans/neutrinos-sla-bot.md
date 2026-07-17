# Plan: neutrinos-sla-bot — AI SLA-Escalation Bot for Discourse

## TL;DR (For humans)

Goal: Build a real, running bot that auto-replies to unanswered questions on a Pro-trial Discourse instance (nutrinosbotdemo.discourse.group) when they breach an SLA window — grounded in 2 Neutrinos doc PDFs + resolved community threads — with guardrails that prevent fabrication and avoid undercutting human experts. Deliverable for a 5-day Neutrinos hiring assignment (deadline Sun 19 Jul 2026; live panel Mon 20 Jul 2026).

Stack: Python 3.11 + FastAPI - NVIDIA NIM (OpenAI-compatible: nv-embed-v1 + llama-3.1-70b-instruct) - LangChain + local Chroma - poll-based SLA monitor - Discourse API.

What makes this win the rubric: end-to-end real replies (25%), grounded non-hallucinated RAG with citations + honest low-confidence declines (25%), thoughtful SLA/"answered" logic incl. the topic-3 partial-reply trap (15%), guardrails that know when NOT to answer (15%), and a production/risk design built around rate-limit resilience + "don't kill human engagement" (20%).

First execution step: bootstrap the repo + secrets (.env), then seed the Discourse instance with the 10 mock topics (3 solved, 7 unanswered) — exactly as the user requested.

To start: review this plan, then run /start-work. Worker executes top-to-bottom.

---

## 1. Context & Goal

New members post questions in the Neutrinos Community (Discourse). If a human hasn't answered within an SLA window, an AI bot answers — grounded in Neutrinos docs + prior resolved threads — so no question is left hanging, without replacing human experts. The assignment is a real build (not a mockup) and is scored on a weighted rubric (see Section 9).

Hard constraints:
- Real Discourse instance, real API posts (free hosted plan lacks API -> we use the Pro-trial instance).
- NVIDIA NIM free tier ~40 RPM shared -> every external call must be rate-limit-resilient.
- Deliberate retrieval-honesty traps in the seed data (topic 2: no Getting-Started docs; topic 3: partial reply).

## 2. Architecture & Data Flow

Discourse (Pro trial) --(1) poll /latest.json + topic details every ~30s--> SLA Monitor --"answered?" rule--> breach + no recent human reply? --> enqueue --> RAG Pipeline [Retriever: embed query (nv-embed-v1, input_type=query) -> Chroma top-k (sources: 2 doc PDFs + resolved community threads); Confidence gate: similarity + source coverage threshold -> HIGH: Generator (llama-3.1-70b-instruct, answer ONLY from context, cite sources) | LOW: Decline + escalate (@mention human)] --> Post-back (Discourse API) [confident: post reply labeled "AI-generated" + citations + "was this helpful? / flag a human"; low-conf: post polite "not sure, pinging @expert" OR silent escalate] --> State store (SQLite) mark topic bot-answered (idempotent, no double-post).

Bonus: /webhook endpoint for event-driven triggering (polling remains the primary path).

## 3. Tech Stack & Key Decisions

- Language: Python 3.11 + FastAPI — Best RAG ecosystem; fast in 3 days.
- LLM + embeddings: NVIDIA NIM (nv-embed-v1, llama-3.1-70b-instruct) — User's account; OpenAI-compatible; one key.
- RAG framework: LangChain (langchain-nvidia-ai-endpoints) — Direct NVIDIA integration; recognizable.
- Vector store: Chroma (local, disk-persisted) — Zero infra; survives restart (no re-embed).
- PDF parsing: pypdf (fallback pdfplumber) — Proven to extract these exact PDFs.
- Trigger: Polling (~30s) — No public bot URL needed; robust; assignment-allowed.
- Secrets: .env (gitignored) + pydantic-settings — Key never committed.
- State: SQLite (state.db) — Idempotent post tracking.

Rate-limit resilience (applies to ALL NVIDIA + Discourse calls): token-bucket throttle capped <40 RPM (default 30), exponential backoff + jitter on 429/timeout, batched embeddings (many chunks/request), persisted vectors (embed once), idempotent posting (DB flag), graceful degradation (queue+retry, never crash, never post garbage).

## 4. Project Structure (decision-complete paths)

neutrinos-demo/
  .gitignore                      # secrets, venv, chroma/, __pycache__
  .env                            # gitignored — real keys (created Task 0.1)
  .env.example                    # tracked template
  pyproject.toml                  # deps + ruff/pytest config
  README.md
  docs/                           # assignment problem statement + our deliverable docs
    Community_AI_SLA_Bot_Discourse.pdf
    architecture.mmd              # Mermaid diagram (Task 7.1)
    rag-design-notes.md           # (Task 7.2)
    sla-definition.md             # (Task 7.3)
    design-doc.md                 # (Task 7.4)
  data/                           # source data (committed; small)
    knowledge_base/*.pdf
    community_seed/Community_Seed_Content.md
  scripts/
    seed_discourse.py             # Task 1.1 — seed the instance
  src/neutrinos_bot/
    config.py                     # pydantic-settings from .env
    nvidia_client.py              # rate-limited OpenAI-compatible LLM+embed wrapper
    discourse_client.py           # rate-limited Discourse API client
    ingest.py                     # PDF + thread -> chunk -> embed -> Chroma
    retriever.py                  # query embed -> Chroma top-k -> filter/rerank
    generator.py                  # prompt -> NVIDIA gen -> answer + citations
    confidence.py                 # score -> answer vs decline/escalate
    sla_monitor.py                # poll loop + "answered?" rule
    post_back.py                  # post labeled reply / escalate
    state.py                      # SQLite idempotency store
    main.py                       # FastAPI (/health, /run, optional /webhook) + CLI
  tests/                          # unit + integration (seed test cases)
  chroma/                         # gitignored persisted vector store

## 5. The "Answered?" Rule (rubric 15% — defined here, decision-complete)

A topic is resolved (bot must NOT intervene) if ALL of:
1. It has >=1 reply from a non-bot user; AND
2. It has an accepted solution (Solved plugin) OR the most recent human reply is within the recent-reply grace window (default 10 min).

A topic is an SLA candidate if: now - created_at > SLA_WINDOW AND not resolved AND no bot reply already posted AND no human reply in the last grace minutes.

Topic-3 trap handling: if the last post in the thread is the OP asking a follow-up that no human addressed, the topic is unresolved even though an earlier reply exists -> it remains an SLA candidate. Logic: resolved = accepted_solution OR (last_post.author != OP AND last_post.author != bot AND age(last_post) < grace); otherwise unresolved.

## 6. Confidence & Grounding (rubric 25% — the topic-2 trap)

- Retrieve top-k (default 5) chunks from the combined collection (docs + solved threads). Each chunk carries metadata source in {doc, community}, source_ref (PDF name+page or topic_id), similarity.
- Confidence score = weighted combo: max similarity + mean top-3 similarity + source-type bonus (doc > community).
- Threshold (default 0.35, tunable):
  - >= threshold -> answer: generator prompt strictly constrains to context; output must include inline citations ([Workflow Builder Reference, Section 2]). Post labeled reply.
  - < threshold -> decline + escalate: post "I don't have a confident source for this — pinging @neutrinos_champion_* for a human expert" (or silent escalate per config). Never fabricate. This is exactly what topic 2 (no Getting-Started docs) must trigger.

## 7. Todos (task batches — decision-complete)

Each todo: refs (exact files) - does - acceptance - QA (happy + failure, tool + invocation, evidence) - commit.

### Phase 0 — Bootstrap & secrets
- [x] Bootstrap repo + secrets — refs: repo root.
  - does: git init; write .gitignore (secrets/venv/chroma/__pycache__), .env (real DISCOURSE_* + NVIDIA_* + models + RATE_LIMIT_RPM + SLA_*), .env.example; pyproject.toml (fastapi, uvicorn, langchain, langchain-nvidia-ai-endpoints, chromadb, pypdf, pydantic-settings, httpx, pytest, ruff); README.md; create dir tree from Section 4; python -m venv .venv && pip install -e .
  - acceptance: git check-ignore .env prints .env; .env absent from git status; pip install -e . succeeds; python -c "from neutrinos_bot.config import settings; print(settings.discourse_base_url)" prints the URL.
  - QA: happy = config loads from .env; failure = rename .env -> import errors with clear message; evidence = pytest tests/test_config.py. Secret-scan committed tree (no real keys).
  - commit: chore: bootstrap project, secrets, deps.

### Phase 1 — Seed Discourse (user-requested execution step)
- [1.1] Seed script — refs: scripts/seed_discourse.py, data/community_seed/Community_Seed_Content.md, src/neutrinos_bot/discourse_client.py.
  - does: idempotent script: enable Solved plugin if off; create 4 categories (Getting Started, Workflow Builder, API & Integrations, Bugs & Troubleshooting); create 7 seed users + 1 bot user (neutrinos_bot); post 10 topics verbatim from seed MD into correct categories; post human replies on #1,#3,#5,#9; mark accepted solution on #1,#5,#9; leave #2,#3,#4,#6,#7,#8,#10 unanswered (#3 with the partial OP->champion->OP exchange). Tag every seeded entity with custom field/flag for idempotent re-runs.
  - acceptance: API GET /categories.json shows 4; GET /latest.json shows 10 topics; topics #1,#5,#9 have accepted_answer; 7+1 users exist; re-running script is a no-op (skip existing).
  - QA: happy = fresh instance -> 10 topics, 3 solved; failure = run twice -> no duplicates; evidence = pytest -q tests/test_seed.py (uses recorded API responses / a dry-run flag).
  - commit: feat: idempotent Discourse seeding script.

### Phase 2 — Ingestion & vector store
- [2.1] PDF ingest — refs: src/neutrinos_bot/ingest.py, nvidia_client.py, data/knowledge_base/.
  - does: parse 2 PDFs -> recursive char split (~600 tokens, 100 overlap) -> embed via nv-embed-v1 (input_type=passage, batched) -> store Chroma (persisted chroma/) with metadata {source: doc, source_ref: "<pdf> p<page> <heading>"}. Load existing store if present (idempotent).
- [2.2] Community ingest — refs: ingest.py, discourse_client.py.
  - does: fetch solved topics + accepted solutions via API -> chunk -> embed -> store in same collection with {source: community, source_ref: "topic #<id>", solved: true}.
  - acceptance (2.1+2.2): chroma/ persisted; collection.count() > 0; query "Loop Limit Exceeded" returns the Workflow Builder chunk; throttle stays <30 RPM (logged).
  - QA: happy = ingest completes, counts asserted; failure = simulate 429 mid-batch -> backoff + resume, no crash; evidence = tests/test_ingest.py + throttle log.
  - commit: feat: ingestion pipeline (PDFs + solved threads) -> Chroma.

### Phase 3 — RAG retrieval + generation + confidence
- [3.1] Retriever — src/neutrinos_bot/retriever.py. query embed (input_type=query) -> top-k -> metadata-rich.
- [3.2] Generator — src/neutrinos_bot/generator.py. Strict prompt ("answer ONLY from context; cite; if insufficient say so"); NVIDIA gen; returns {answer, citations, raw}.
- [3.3] Confidence gate — src/neutrinos_bot/confidence.py. Per Section 6; returns {confident: bool, score}.
  - acceptance: topic-4 query -> confident answer citing Workflow Builder ref; topic-6/7 -> API Integration guide; topic-2 (no docs) -> decline; topic-3 follow-up -> confident answer (Run Monitor reassign) citing docs.
  - QA: tests/test_rag.py with all 7 unanswered cases as fixtures; assert citations present / decline on #2.
  - commit: feat: retriever, generator, confidence gate.

### Phase 4 — SLA monitor + post-back + state
- [4.1] Discourse client — src/neutrinos_bot/discourse_client.py. Rate-limited httpx wrapper: list topics, get topic+posts, create post, set accepted solution. Throttle + backoff.
- [4.2] State store — src/neutrinos_bot/state.py. SQLite: topics(topic_id, bot_answered, first_seen, last_human_at, last_checked). Idempotent.
- [4.3] SLA monitor — src/neutrinos_bot/sla_monitor.py. Poll loop (Section 2) applying the Section 5 rule; enqueue SLA candidates.
- [4.4] Post-back — src/neutrinos_bot/post_back.py. Confident -> post reply prefixed "AI-generated answer" + citations + "Was this helpful? React or reply to flag a human expert." Low -> escalate. Write state.
  - acceptance (4.x): end-to-end live run on the trial instance: an unanswered topic past SLA gets exactly one labeled bot reply; solved topics (#1,#5,#9) never get a bot reply; #3 follow-up gets answered; #2 gets an escalate reply. No double-posts.
  - QA: dry-run mode logs instead of posting; then one live cycle; evidence = screenshot/JSON of posted replies + state.db rows.
  - commit: feat: SLA monitor, post-back, idempotent state.

### Phase 5 — Guardrails hardening
- [5.1] Active-conversation guard — don't fire if any human reply in last grace min even if unsolved.
- [5.2] Rate-limit + degradation — central throttle/backoff wrapper verified; 429 -> retry not crash; queue+retry on generation failure; never double-post.
- [5.3] Bot-reply labeling + human-engagement UX — every bot reply clearly AI-labeled + offers flag-a-human.
  - QA: tests/test_guardrails.py — inject 429, inject recent-human-reply; assert no-fire + no-crash.
  - commit: feat: guardrails (active-conversation, rate-limit, labeling).

### Phase 6 — Service layer / entrypoints
- [6.1] FastAPI app + CLI — src/neutrinos_bot/main.py. /health, /run (one cycle), optional /webhook. CLI: python -m neutrinos_bot.main run [--once|--watch] [--dry-run].
  - acceptance: uvicorn neutrinos_bot.main:app serves /health; /run triggers a monitor cycle.
  - commit: feat: FastAPI service + CLI entrypoints.

### Phase 7 — Deliverables (rubric-aligned docs)
- [7.1] Architecture diagram — docs/architecture.mmd (Mermaid) + exported PNG; matches Section 2.
- [7.2] RAG design notes — docs/rag-design-notes.md: chunking strategy, retrieval method (vector), model choice + why, hallucination mitigation (strict prompt + confidence gate + citations).
- [7.3] SLA & "answered" definition — docs/sla-definition.md: rationale for Section 5 rule incl. topic-3.
- [7.4] Design doc — docs/design-doc.md: continuous production operation, measurement (answer-rate, human-acceptance, time-to-first-response, engagement delta), and the "don't kill human engagement" risk + mitigations (SLA tuned above median human response, escalate-not-replace, only fill gaps).
- [7.5] Demo script + recording — docs/demo-script.md + screen recording: seeded unanswered topic -> SLA breach -> retrieval -> labeled reply; plus the edge cases (#2 decline, #3 partial).
  - commit: docs: architecture, RAG notes, SLA definition, design doc, demo.

## 8. Verification & QA strategy

- Unit/integration: pytest covers config, seed idempotency, ingest, RAG on all 7 unanswered fixtures, guardrails (429/recent-human), state idempotency.
- Rate-limit QA: a logging throttle proves every external call stays <30 RPM; a forced-429 test proves backoff+resume.
- End-to-end QA (agent-executed, zero human): a live cycle on the trial instance posts to an unanswered topic; solved topics untouched; state.db prevents double-post. Evidence saved as JSON + screenshot.
- Test strategy: tests-after for glue, but RAG/confidence/seed-logic get fixture-driven tests (the 7 seed cases are the spec).

## 9. Rubric mapping

- End-to-end function (25%): Phases 1, 4, 6 — real instance, real posts.
- RAG quality & grounding (25%): Phases 2, 3, Section 6 — citations + honest decline on #2.
- SLA & "answered" logic (15%): Phase 4 + Section 5 — topic-3 trap handled.
- Guardrails & judgment (15%): Phase 5 + Section 6 — knows when NOT to answer.
- Production & risk (20%): Phase 7.4 + rate-limit resilience + human-engagement design.

## 10. Risks & mitigations
- NVIDIA 40 RPM hit -> throttle <30, batch+cache embeddings, backoff, queue+retry. (Mitigates demo crash.)
- Solved plugin API endpoint differs -> seeding falls back to accepted_answer endpoint variants; document whichever works.
- Low answer quality from open 70B -> strong prompt + retrieved context; fallback model swap is one env var.
- Bot races a human -> active-conversation guard + SLA tuned above median human response time.
- Trial expiry near panel day -> keep instance active; dry-run/demo recorded as backup evidence.

## 11. Open inputs (resolve before/at start-work)
1. DISCOURSE_API_USERNAME (admin/bot username on nutrinosbotdemo).
2. NVIDIA_API_KEY.
3. Confirm SLA_WINDOW_MINUTES (demo) + confidence threshold defaults.

---
Status: awaiting user review -> /start-work.

NOTE: This plan was authored in a session rooted at /home/jitin/einfach-design-studio. The user will open a new session rooted at /home/jitin/neutrinos-demo to review + execute, so all writes target the correct codebase.
