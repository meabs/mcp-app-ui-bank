# Feature implementation progress

Tracks chunked delivery of acquisition (A) and hub domain (B) features.

**Legend:** `[ ]` not started · `[~]` in progress · `[x]` done

**Last updated:** Phase 2 complete (Sprints A–E + D). All user-demo sprints done.

---

## Phase 1 — Platform & hub features (complete)

Chunks 0–6 delivered acquisition (A), hub domains (B), server tools, and docs. See sections below.

---

## Phase 2 — User-demo polish (current focus)

Audience: live presenters and product stakeholders — **not** architects. Prioritise emotional closure, hero visuals, and scripted journeys over gateway/audit backend work.

**Legend:** `[ ]` not started · `[~]` in progress · `[x]` done

### Sprint A — Story polish (complete)

| # | Feature | What the audience sees | Status |
|---|---|---|---|
| A.1 | **Card delivery tracker** | After approval: Dispatched → Out for delivery → Activate | [x] |
| A.2 | **Offer activated feedback** | Toast / success card when activating a merchant offer | [x] |
| A.3 | **Travel confirmation card** | Polished ack with dates, countries, reference | [x] |
| A.4 | **Spend category drill-down** | Click category → filtered tokenised merchant list | [x] |
| A.5 | **Decline + recovery path** | Calm referred/declined screen with branch / try another card | [x] |

**Files:** `demo-data.js`, `feature-views.js`, `mcp-app.js`, `mcp-app.css`, tests, `PROMPTS.md`

### Sprint B — Hero visuals

| # | Feature | Status |
|---|---|---|
| B.1 | Signature screen per hub tile (delta vs last month, logos, limit gauge) | [x] |
| B.2 | Compare “Best for you” column highlight | [x] |
| B.3 | Sarah personalisation with spend-based reason | [x] |

### Sprint C — Presenter mode

| # | Feature | Status |
|---|---|---|
| C.1 | Demo toolbar (`?demo=1`) — jump to Hub / Products / Spend / Apply | [x] |
| C.2 | Reset session / clear saved application | [x] |
| C.3 | 90-second scripts in `PROMPTS.md` | [x] |

### Sprint D — Chat/UI alignment

| # | Feature | Status |
|---|---|---|
| D.1 | Tool result copy aligned with on-screen numbers | [x] |
| D.2 | Model follow-up prompt hints in tool descriptions | [x] |

### Sprint E — LLM sync demo (“iframe talks back”)

Show audiences that **UI actions update what the model knows** — without exposing app-only noise.

| # | Feature | SDK / pattern | Status |
|---|---|---|---|
| E.1 | Eligibility → `updateModelContext` (redacted) | Silent context push after check | [x] |
| E.2 | Underwriting → `sendMessage` (already partial) | User-role message → model replies | [x] |
| E.3 | Offer / travel / wallet → `updateModelContext` | Servicing events as tokens | [x] |
| E.4 | **“What the model sees”** panel (`?demo=1`) | Side-by-side customer vs model payload | [x] |
| E.5 | Scripted **LLM sync demo** in `PROMPTS.md` | 5-min presenter runbook | [x] |

See **LLM sync demo plan** section below.

---

## Current sprint

**Active:** Phase 2 complete — ready for live demo

**Completed:** Sprints A–E + D (user-demo polish + LLM sync + chat alignment)

**Deferred (architect demo — see `build.md`):**
- In-process gateway / correlation IDs
- Redaction toggle / architecture trace drawer
- MCP prompts registration
- Fragment manifest catalogue

---

## Phase 1 detail — Chunks 0–6 (complete)

| # | Task | Status |
|---|---|---|
| 0.1 | Create this progress tracker | [x] |
| 0.2 | Extend `demo-data.js` with shared types, card metadata, hub tiles | [x] |
| 0.3 | Add unit tests for new data functions | [x] |

## Chunk 1 — Data layer (`demo-data.js`)

| # | Feature | Status |
|---|---|---|
| 1.1 | Existing-customer personalisation | [x] |
| 1.2 | Needs-based recommendation wizard | [x] |
| 1.3 | Card comparison | [x] |
| 1.4 | Rewards / cashback calculator | [x] |
| 1.5 | Balance transfer estimator | [x] |
| 1.6 | Application draft (save/resume) | [x] |
| 1.7 | Identity verification | [x] |
| 1.8 | Async underwriting | [x] |
| 1.9 | Spend insights | [x] |
| 1.10 | Merchant offers | [x] |
| 1.11 | Travel notice | [x] |
| 1.12 | Credit limit soft offer | [x] |
| 1.13 | Wallet provisioning | [x] |
| 1.14 | Card Hub launcher | [x] |

## Chunk 2 — Server tools (`server.js`)

| # | Tool | Status |
|---|---|---|
| 2.1–2.9 | Model-visible tools (compare, calculator, BT, hub, insights, offers, travel, limit, wallet) | [x] |
| 2.10–2.16 | App-only tools (compare toggle, save, verify, offer, travel, wallet, hub nav) | [x] |
| 2.17 | Enhanced `blackwell-browse-cards` (`loungeAccess`, personalisation) | [x] |
| 2.18 | Enhanced submit + `blackwell-underwriting-decision` | [x] |

## Chunk 3 — HTML shell & CSS

| # | View / component | Status |
|---|---|---|
| 3.1–3.10 | All new views + personalisation banner | [x] |
| 3.11 | Hub tiles, donut, sliders, upload zone, reviewing state | [x] |

## Chunk 4 — Client: acquisition (`mcp-app.js` + `feature-views.js`)

| # | Feature | Status |
|---|---|---|
| 4.1 | State extensions + mode routing | [x] |
| 4.2 | Existing-customer banner | [x] |
| 4.3 | Compare basket + compare view | [x] |
| 4.4 | Rewards calculator sliders | [x] |
| 4.5 | Balance transfer estimator | [x] |
| 4.6 | Save & resume (localStorage + app tool) | [x] |
| 4.7 | Identity verification step | [x] |
| 4.8 | Async underwriting + `sendMessage` | [x] |

## Chunk 5 — Client: hub domains (`feature-views.js`)

| # | Feature | Status |
|---|---|---|
| 5.1 | Hub launcher + tile navigation | [x] |
| 5.2 | Spend insights | [x] |
| 5.3 | Merchant offers carousel | [x] |
| 5.4 | Travel notice form | [x] |
| 5.5 | Credit limit soft offer | [x] |
| 5.6 | Wallet / Apple Pay mock | [x] |

## Chunk 6 — Docs & verification

| # | Task | Status |
|---|---|---|
| 6.1 | Extend `PROMPTS.md` | [x] |
| 6.2 | `npm test` passes (17 tests) | [x] |
| 6.3 | `npm run build` succeeds | [x] |

---

## LLM sync demo plan (Sprint E)

**Goal:** Prove the iframe can **push structured context to the model** and **trigger a visible chat reply** — while app-only clicks stay private.

### Three channels (teach this on stage)

| Channel | SDK call | Audience sees in **chat** | When to use |
|---|---|---|---|
| **Silent context** | `updateModelContext` | Model “just knows” on next turn — no new user bubble | Eligibility result, offer activated, travel registered |
| **Visible ping** | `sendMessage` | New user message appears → model replies out loud | Application approved / referred |
| **Hidden** | App-only `callServerTool` | Nothing — model not involved | Card select, compare toggle, ID upload |

### 5-minute scripted demo — “The panel whispers to the model”

**Setup:** Enable presenter mode (`Shift+D`). Open chat side-by-side with panel.

| Step | You say | You do in UI | What hits the LLM | What to say to audience |
|---|---|---|---|---|
| 1 | *Show me Blackwell Bank credit cards* | — | Tool opens panel only | “Model chose the tool; UI renders locally.” |
| 2 | — | Click **Cashback** in list | **Nothing** (app-only) | “I switched cards. Model wasn’t called — that’s visibility control.” |
| 3 | — | Fill eligibility → **Check** | **`updateModelContext`** — redacted: `decision: pre-qualified`, limit bucket `£3k–£5k`, card name | “Panel pushes context silently. Customer sees £4,000; model gets a bucket.” |
| 4 | *What did you learn about my eligibility?* | — | Model answers from context **without** you retyping income | “It read what the iframe sent — not the raw form.” |
| 5 | — | Hub → Offers → **Activate Tesco** | **`updateModelContext`** — `offer: activated`, partner name only | “Servicing event as a token, not a tool call storm.” |
| 6 | — | Hub → Travel → submit | **`updateModelContext`** — countries + dates, no card number | “Travel registered; model can summarise next steps.” |
| 7 | *Let's apply for the Cashback card* | Complete apply → submit | App-only submit, then **`sendMessage`** on decision | “Writes use app-only tools; **sendMessage** is the ‘tell the chat’ moment.” |
| 8 | — | Wait for approval + tracker | Model replies to approval message | “Async bank systems → panel notifies chat when ready.” |

**Optional punchline (demo mode):** Toggle **“What the model sees”** panel to show customer screen vs redacted JSON side-by-side.

### Redaction rules (customer vs model)

| Customer UI | Model `updateModelContext` |
|---|---|
| Credit limit **£4,000** | `creditLimitBucket: "£3,000–£5,000"` |
| Merchant **Tesco** | `merchantToken: "MERCHANT_TOKEN_A1B2"` or `partner: Tesco` (offers only) |
| Annual income **£42,000** | Omit or `incomeBand: "£40k–£50k"` |
| Full applicant name | `applicantFirstName` only |
| ID upload status | `verification: pending` — never “passport uploaded” |

### Implementation map (Sprint E build)

| Event | File | Function |
|---|---|---|
| Eligibility submit | `mcp-app.js` | `pushEligibilityContext(payload)` after `renderEligibilityResult` |
| Offer activated | `feature-views.js` | after `blackwell-activate-offer` success |
| Travel submitted | `feature-views.js` | after travel notice success |
| Wallet provisioned | `feature-views.js` | after Apple Pay success |
| Underwriting decision | `feature-views.js` | `sendMessage` (exists) + optional `updateModelContext` with decision token |
| Redaction helpers | `demo-data.js` | `toModelContext(event, payload)` |
| Demo inspector UI | `mcp-app.js` + CSS | `#model-context-panel` when demo mode on |

### Follow-up prompts (after each push)

| After event | Ask the model |
|---|---|
| Eligibility | *What eligibility result did you get for me?* |
| Offer | *Which offers are active on my card?* |
| Travel | *Where am I travelling and is my card protected?* |
| Approval | *(automatic)* or *What happened with my application?* |

### What not to demo

- Don’t call the model on every card click — that’s the anti-pattern.
- Don’t send raw income/PAN/document content — undermines the banking story.

---
