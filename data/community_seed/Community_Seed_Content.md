# Neutrinos Community — Seed Content for Trial Discourse Instance

Post these as real topics in your free-trial Discourse instance to simulate an active community. They're designed to give your AI bot realistic RAG material and realistic test cases — including some that are **already solved by a human** (control group) and some that are **deliberately left unanswered** (so you can test the SLA-triggered bot response).

Suggested categories to create first: `Getting Started`, `Workflow Builder`, `API & Integrations`, `Bugs & Troubleshooting`.

---

## Category: Getting Started

### Topic 1 — "Credentials work in Dev but fail in Test with 401"
**Original post (user: dev_amit):**
> I built a flow in Dev, everything runs fine. Promoted it to Test and now the connector step throws a 401 Connector Not Authorized error. I didn't change anything. What's going on?

**Reply (user: neutrinos_champion_sara) — marked Solution:**
> Credentials are environment-scoped in Neutrinos, they don't carry over automatically when you promote a flow. Go to Environment Settings in Test and re-authenticate the connector there — that fixes it every time.

*(Status: SOLVED — use as a control case, bot should NOT need to respond here.)*

---

### Topic 2 — "First flow — Test Run button greyed out"
**Original post (user: newbie_priya):**
> Trying to build my first flow — added a Manual Trigger + Send Email action, but the Test Run button is greyed out. Am I missing a step?

*(No replies yet — leave this UNANSWERED past your SLA window. This is the key "no documentation exists" test case: there is no Getting Started PDF in the knowledge base, so the bot has nothing authoritative to retrieve. Watch for whether the bot fabricates a confident-sounding answer anyway, or correctly signals low confidence / escalates to a human. If you want this one to be answerable, the most plausible real cause is a required field left unmapped on the Action node — but the bot should only say this if it has genuine grounds to, not because it's a common-sense guess dressed up as a sourced answer.)*

---

## Category: Workflow Builder

### Topic 3 — "Flow stuck — is this a bug?"
**Original post (user: ops_karan):**
> My flow has been sitting at one step for 2 days, status shows "in progress" but nothing is happening. Is the engine down?

**Reply (user: neutrinos_champion_leo):**
> Which node is it stuck at? If it's a Human Task node that's expected — it's just waiting on the assignee.

**Reply (user: ops_karan):**
> Yeah it's a Human Task. But the assignee left the company, is there a way to reassign?

*(Leave the thread ending here, UNANSWERED — this is a great SLA test case: partially answered but the actual follow-up question is unresolved. Correct answer per docs: use Run Monitor's "Reassign Task" action; also recommend setting an SLA timer on the Human Task node going forward.)*

---

### Topic 4 — "Loop node failing on large dataset"
**Original post (user: builder_meera):**
> Processing a CSV upload with ~1,500 rows through a Loop node and it fails partway with 'Loop Limit Exceeded'. Anyone hit this?

*(No replies — UNANSWERED, leave for bot. Correct answer per docs: default max iteration guard is 1000; raise the guard limit in Loop Settings, or split into batches.)*

---

## Category: API & Integrations

### Topic 5 — "Webhook from our system isn't triggering the flow"
**Original post (user: partner_dev_ravi):**
> Set up a webhook connector, tested with Postman and it works, but our production system's calls never trigger the flow. Payloads look identical to me.

**Reply (user: neutrinos_champion_sara) — marked Solution:**
> 9 times out of 10 this is a webhook secret mismatch — double check the secret configured on the Neutrinos side matches exactly what your system is sending in the signature header.

*(SOLVED — control case.)*

---

### Topic 6 — "Getting 429 errors during bulk sync"
**Original post (user: partner_dev_ravi):**
> Running a nightly bulk sync of ~5,000 records through the API and hitting a wall of 429s about a third of the way through. How are people handling this?

*(No replies — UNANSWERED, leave for bot. Correct answer per docs: rate limit is 100 req/min with a 20 burst allowance; implement client-side backoff and respect the Retry-After header, or batch differently.)*

---

### Topic 7 — "OAuth token keeps expiring mid-flow"
**Original post (user: newbie_priya):**
> My integration flow calls out to a third-party API using OAuth client credentials, and about 1 hour in, calls start failing. Token expiry?

*(No replies — UNANSWERED, leave for bot. Correct answer per docs: tokens expire after 60 minutes and must be refreshed; recommend adding a token-refresh step or using the connector's built-in refresh handling.)*

---

## Category: Bugs & Troubleshooting

### Topic 8 — "Data type mismatch error on inbound webhook"
**Original post (user: builder_meera):**
> Getting a schema mismatch error right after my Webhook Trigger node. The external system sends "true"/"false" as strings and I think Neutrinos wants a real boolean?

*(No replies — UNANSWERED, leave for bot. Correct answer per docs: add a Data Mapper transform immediately after the Webhook Trigger node to coerce types before further processing.)*

---

### Topic 9 — "Flow run history shows 504 errors intermittently"
**Original post (user: ops_karan):**
> Seeing random 504 timeouts on one Action node calling an external legacy system that's known to be slow. Not every run, maybe 1 in 10.

**Reply (user: neutrinos_champion_leo) — marked Solution:**
> Increase the timeout on that node above the default 30s, and add a retry with exponential backoff as a fallback path — that's the standard pattern for known-slow external systems.

*(SOLVED — control case.)*

---

### Topic 10 — "Rollback after a bad release — did it affect Dev?"
**Original post (user: builder_meera):**
> We rolled back a flow version in Production after a bad release. Just want to confirm — does rollback touch our Dev drafts at all? Nervous about losing work in progress.

*(No replies — UNANSWERED, leave for bot. Correct answer per docs: rollback only restores the active published version in the given environment; it does not affect Dev drafts.)*

---

## Suggested SLA & Test Plan

| Topic | Human answered? | Use this to test... |
|---|---|---|
| 1, 5, 9 | Yes (Solution marked) | Bot should recognize these are resolved and **not** intervene |
| 2, 3, 4, 6, 7, 8, 10 | No | Bot should detect SLA breach and respond using Documentation + resolved Community threads as its knowledge source |

**Suggested SLA for the prototype:** 24 hours (compressed to a few minutes in your own test run — just backdate the `created_at` timestamps on the seeded unanswered topics, or set a short polling interval, so you don't have to literally wait a day to demo this).

Note: topics 3's second reply is a good edge case — it shows the bot needs to evaluate whether the *actual question* was answered, not just whether *any* reply exists in the thread.
