# Blackwell Bank — Demo Runbook

Step-by-step scripts for presenting the MCP App demo in ChatGPT, Claude.ai, or Claude Desktop.

**Server URL**

- Cloud: `https://garry-demo.meaburn.com/mcp`
- Local: `http://localhost:3001/mcp`

Prompts do not need to be word-perfect — the model matches intent. Tool descriptions include **Follow-up:** hints so the assistant knows what to say after the panel renders.

---

## 1. Before you present

Run through this once before the audience arrives.

| # | Do this | Why |
|---|---------|-----|
| 1 | `npm run build && npm run start:cloud` | Serves the latest UI over the public tunnel |
| 2 | Reconnect the MCP integration in ChatGPT if tools look stale | You should see **24 tools**, not 6 |
| 3 | Open a fresh chat connected to the server | Avoids leftover context from earlier runs |
| 4 | Press **`Shift + D`** inside the panel | Turns on **presenter mode** (toolbar + inspector) |
| 5 | Confirm the toolbar appears: **Hub · Products · Spend · Apply · Reset** | Quick jumps between demo sections |
| 6 | Confirm **“What the model sees”** appears at the bottom of the panel | Used for redaction and LLM-sync beats |

**Presenter mode shortcuts**

| Control | What it does |
|---------|--------------|
| `Shift + D` | Toggle presenter mode on/off |
| `?demo=1` in URL | Same as above (basic-host / local testing) |
| Toolbar **Reset** | Clear draft, journey, compare — back to Hub |
| **⤢** button | Fullscreen (`requestDisplayMode`) |

---

## 2. What you are showing

Three ideas, one story:

1. **One MCP server, many UIs** — hub tiles, catalogue, compare, apply — not one giant form.
2. **The iframe talks to the model** — some clicks push context silently; some stay invisible on purpose.
3. **Banking redaction** — the customer sees exact numbers; the model sees buckets and tokens.

Use the **inspector** (`Shift + D`) to prove each beat. Point at the **Customer** vs **Model** columns when eligibility runs — that is the clearest redaction moment.

---

## 3. Main demo (~8 minutes)

**Story:** Existing customer explores the hub → silent context sync → new customer applies for a card → chat replies with the decision.

Work through the steps in order. **Say** = prompt to the assistant. **Click** = action in the panel. **Ask** = follow-up prompt to prove the model learned something. **Narrate** = optional line to the audience.

### Part A — Hub and invisible clicks (~2 min)

| Step | Say | Click | Ask | Narrate |
|------|-----|-------|-----|---------|
| 1 | *Open my Blackwell Card Hub* | — | — | “One server, composable domains — not a single sales form.” |
| 2 | — | **Spend Insights** | — | “Spend breakdown with tokenised merchants.” |
| 3 | — | **Groceries** in the chart legend | — | “Category drill-down never hits the model.” |
| 4 | — | **← Hub** → **Merchant Offers** → **Activate** on Tesco | — | “Servicing event pushed silently — check the inspector.” |
| 5 | — | — | *Which offers are active on my card?* | “It knew because the iframe told it — I didn’t retype anything.” |

### Part B — Travel and personalisation (~1 min)

| Step | Say | Click | Ask | Narrate |
|------|-----|-------|-----|---------|
| 6 | — | **Hub** → **Travel** → submit (e.g. France, Spain) | — | “No card number in what the model sees.” |
| 7 | — | — | *Where am I travelling — is my card protected?* | — |
| 8 | — | Toolbar **Products** | — | — |
| 9 | *I'm already a Blackwell customer — what cards can I get?* | — | — | “Simulated logged-in customer — Sarah banner + spend reason.” |

### Part C — Compare and eligibility (~2 min)

| Step | Say | Click | Ask | Narrate |
|------|-----|-------|-----|---------|
| 10 | — | Tick **Compare** on two cards → **Compare selected** | — | “Best for you follows the spend need.” |
| 11 | — | **Check your eligibility** → submit (good credit, £42k) | — | “Customer sees **£4,000**; model gets bucket **£3k–£5k** — point at the inspector.” |
| 12 | — | — | *What did you learn about my eligibility?* | “Model uses the bucket, not the exact limit.” |
| 13 | — | Click a **different card** in the list | — | “Card select is invisible to the model — by design.” |

### Part D — Apply and chat reply (~3 min)

| Step | Say | Click | Ask | Narrate |
|------|-----|-------|-----|---------|
| 14 | *Let's apply for the Cashback card* | Toolbar **Apply**, or **Continue to application** | — | — |
| 15 | — | Fill Personal details → Address → Employment → upload ID + selfie → **Review** → **Submit** | — | “Write path stays in the iframe.” |
| 16 | — | Wait for reviewing spinner → decision | — | “Now the **chat** should speak — visible user message.” |
| 17 | — | — | — | On approval: delivery tracker — “Card is on its way.” |
| 18 | — | — | *What happened with my application?* | — |
| 19 | — | Press **⤢** fullscreen briefly | — | “Same app, one HTML bundle, fullscreen on demand.” |

**End:** Toolbar **Reset** → ready for the next audience.

---

## 4. Short demos (90 seconds)

Turn on presenter mode first (`Shift + D`). Pick one script.

### A — Existing customer hub tour

**Opening prompt:** *I'm already a Blackwell customer — what cards can I get?*

| Time | Do |
|------|-----|
| 0–20s | Note Sarah banner + personalisation reason |
| 20–40s | Toolbar **Hub** → **Spend Insights** → click one category |
| 40–60s | **Hub** → **Merchant Offers** → **Activate** → ask *Which offers are active on my card?* |
| 60–90s | **Travel** → submit → ask *Where am I travelling?* |

### B — New customer acquisition

**Opening prompt:** *Show me Blackwell Bank credit cards*

| Time | Do |
|------|-----|
| 0–25s | Compare two cards → **Compare selected** → note **Best for you** |
| 25–45s | **Check your eligibility** → ask *What did you learn about my eligibility?* |
| 45–70s | Toolbar **Apply** → quick fill through steps → **Submit** |
| 70–90s | Narrate delivery tracker → ask *What happened with my application?* |

### C — Recovery path

**Opening prompt:** *Check my eligibility — I earn £12,000 and have fair credit*

| Time | Do |
|------|-----|
| 0–35s | Show calm recovery screen — not a hard decline |
| 35–55s | **Try a different card** → toolbar **Products** |
| 55–85s | Re-run eligibility with good credit / £42,000 |
| 85–90s | “Same session, recovered without leaving chat.” |

---

## 5. Prompt cheat sheet

Copy any of these into the chat. Rough wording is fine.

### Hub and servicing

| Say this | Opens |
|----------|-------|
| *Open my Blackwell Card Hub* | Hub tile launcher |
| *Show my spend insights* | Category donut + drill-down |
| *What merchant offers do I have?* | Offers carousel |
| *Register travel to France in June* | Travel notice form |
| *Am I eligible for a credit limit increase?* | Limit gauge + wallet link |
| *Add my card to Apple Pay* | Wallet provisioning |

### Acquisition

| Say this | Opens |
|----------|-------|
| *Show me Blackwell Bank credit cards* | Full catalogue |
| *Tell me about the Blackwell Rewards Card* | Single-card detail |
| *Check if I'm eligible for the Cashback Card* | Eligibility widget |
| *Apply for the Blackwell Rewards Card* | Application stepper |
| *Compare the Rewards and Cashback cards* | Side-by-side compare |
| *I travel a lot — what card fits?* | Travel-ranked catalogue |
| *How much cashback on £2,000/month?* | Rewards calculator |
| *Estimate balance transfer on £3,000 at 19.9%* | Balance transfer estimator |

### Small widgets (fragment flow)

Use when you want a **compact panel** instead of the full catalogue:

1. *What's the APR on the Rewards Card?* → card detail
2. *Check my eligibility for that card* → eligibility
3. *Apply for it* → application
4. *Now show me everything* → full catalogue

### Follow-up prompts (after silent context pushes)

Ask these **after** a panel action — the model should answer from context you did not retype:

- *What eligibility result did you get for me?*
- *Which offers are active on my card?*
- *Where am I travelling and is my card protected?*
- *What happened with my application?*

---

## 6. What the model sees (reference)

| You do in the panel | SDK call | Model gets | Customer sees |
|---------------------|----------|------------|---------------|
| Click a card in the list | — | Nothing | Card detail updates |
| Submit eligibility | `updateModelContext` | Decision, card name, limit **bucket** | Exact limit (e.g. £4,000) |
| Activate an offer | `updateModelContext` | Offer token, partner name | Success feedback |
| Submit travel notice | `updateModelContext` | Countries, dates, reference | Confirmation card |
| Add to wallet | `updateModelContext` | Card name, wallet, status | Apple Pay success |
| Application decision | `sendMessage` | User-role approval/refer text | Tracker or recovery screen |
| Toggle compare basket | — | Nothing | Compare basket updates |

**Presenter toolbar**

| Button | Tool / effect |
|--------|----------------|
| **Hub** | `blackwell-open-hub` |
| **Products** | Full card catalogue |
| **Spend** | Spend insights |
| **Apply** | Application stepper |
| **Reset** | Clear session, return to Hub |

---

## 7. Live tips

- **Lead with the main demo (Section 3)** — it covers hub, LLM sync, and acquisition in one arc.
- **Open the inspector before eligibility** — the £4,000 vs £3k–£5k bucket is the money shot.
- **Do not apologise for silent clicks** — card select with no chat activity is the feature.
- **Wait for the underwriting spinner** — `sendMessage` needs the async beat before you ask follow-ups.
- **Rebuild and restart** after code changes; reconnect ChatGPT if tool count ≠ 24.

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| Hub opens the card catalogue instead | Stale server — rebuild, restart tunnel, reconnect MCP |
| Only 6 tools in ChatGPT | Old deployment — kill port 3001, run `npm run start:cloud`, reconnect |
| Model doesn’t know eligibility result | Host may not support `updateModelContext` — try Claude Desktop |
| Inspector not visible | Press `Shift + D` inside the panel |
| Application stuck on identity step | Click **both** upload zones (photo ID + selfie), then **Continue** |
| Eligibility result off-screen | Panel should auto-scroll after submit — scroll down manually if needed |
