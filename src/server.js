import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  CARDS,
  CUSTOMER_TYPES,
  EMPLOYMENT_STATUSES,
  activateOffer,
  calculateRewards,
  createApplicationJourney,
  createUnderwritingDecision,
  estimateBalanceTransfer,
  getCardComparison,
  getCardRecommendations,
  getCreditLimitOffer,
  getDemoPayload,
  getHubPayload,
  getMerchantOffers,
  getSpendInsights,
  getTravelNoticeForm,
  getWalletProvisioning,
  markVerificationUploaded,
  formatToolResultText,
  provisionWallet,
  restoreApplicationDraft,
  runEligibilityCheck,
  serializeApplicationDraft,
  submitTravelNotice,
} from "./demo-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, "..", "dist");
const RESOURCE_URI = "ui://blackwell/app.html";

async function readBundledAppHtml() {
  const candidatePaths = [
    path.join(DIST_DIR, "mcp-app.html"),
    path.join(DIST_DIR, "src", "mcp-app.html"),
  ];
  for (const candidatePath of candidatePaths) {
    try {
      return await fs.readFile(candidatePath, "utf8");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new Error("Bundled MCP App HTML not found. Run `npm run build` first.");
}

const CARD_IDS = /** @type {[string, ...string[]]} */ (CARDS.map((c) => c.id));

const READ_ONLY_TOOL = {
  readOnlyHint: true,
  openWorldHint: false,
  destructiveHint: false,
};
const PRIVATE_STATE_TOOL = {
  readOnlyHint: false,
  openWorldHint: false,
  destructiveHint: false,
};
const OUTPUT_SCHEMA = z.object({
  kind: z.string().optional(),
  mode: z.string().optional(),
}).passthrough();

export function createServer() {
  const server = new McpServer({
    name: "Blackwell Bank Card Services",
    version: "1.1.0",
  });

  // ── Scenario 1: Full sales UI ─────────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-browse-cards",
    {
      title: "Browse Blackwell Bank cards",
      description:
        "Opens the full Blackwell Bank card catalogue — browse cards, check eligibility, and apply. Use when the user wants credit card products or acquisition. Do NOT use for Card Hub, spend insights, merchant offers, travel notice, credit limit, or wallet — use the dedicated servicing/hub tools instead. Never call alongside blackwell-card-detail, blackwell-check-eligibility, or blackwell-apply. Follow-up: Summarise the recommended cards briefly; ask if the user wants eligibility or the Card Hub.",
      inputSchema: {
        need: z.enum(["everyday-spend", "travel", "credit-building"]).optional(),
        creditBand: z.enum(["fair", "good", "excellent"]).optional(),
        annualIncome: z.number().optional(),
        employmentStatus: z.enum(EMPLOYMENT_STATUSES.map((i) => i.id)).optional(),
        existingCustomer: z.boolean().optional(),
        loungeAccess: z.boolean().optional(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: READ_ONLY_TOOL,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      const payload = getDemoPayload(args);
      return {
        content: [{ type: "text", text: formatToolResultText("blackwell-browse-cards", payload) }],
        structuredContent: payload,
      };
    },
  );

  // ── Scenario 2: Single card detail fragment ───────────────────────────────
  registerAppTool(
    server,
    "blackwell-card-detail",
    {
      title: "Blackwell Bank card details",
      description:
        "Shows a focused detail panel for one specific Blackwell Bank card. Use INSTEAD OF blackwell-browse-cards when the user asks about a single card only, not the full catalogue. Follow-up: Highlight the key benefits of the selected card and ask if they want to check eligibility.",
      inputSchema: {
        cardId: z.enum(CARD_IDS).optional(),
        existingCustomer: z.boolean().optional(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: READ_ONLY_TOOL,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      const recommendations = getCardRecommendations({ existingCustomer: args.existingCustomer });
      const selectedCard = args.cardId
        ? CARDS.find((c) => c.id === args.cardId)
        : recommendations.cards[0];
      return {
        content: [{ type: "text", text: `Showing ${selectedCard?.name ?? "card"} details.` }],
        structuredContent: {
          ...recommendations,
          mode: "card-detail",
          selectedCardId: selectedCard?.id ?? recommendations.cards[0]?.id,
        },
      };
    },
  );

  // ── Scenario 3: Eligibility widget fragment ───────────────────────────────
  registerAppTool(
    server,
    "blackwell-check-eligibility",
    {
      title: "Check Blackwell Bank card eligibility",
      description:
        "Shows only the Blackwell Bank eligibility result widget for given profile details. Use INSTEAD OF blackwell-browse-cards when the user wants only an eligibility check, not the full catalogue. Follow-up: Explain the eligibility result in plain English; do not quote exact credit limit — use the bucket from the tool result.",
      inputSchema: {
        creditBand: z.enum(["fair", "good", "excellent"]),
        annualIncome: z.number(),
        employmentStatus: z.enum(EMPLOYMENT_STATUSES.map((i) => i.id)),
        cardId: z.enum(CARD_IDS).optional(),
        existingCustomer: z.boolean().optional(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: READ_ONLY_TOOL,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      const payload = runEligibilityCheck(args);
      return {
        content: [
          {
            type: "text",
            text: formatToolResultText("blackwell-check-eligibility", payload),
          },
        ],
        structuredContent: payload,
      };
    },
  );

  // ── Scenario 4: Application stepper fragment ──────────────────────────────
  registerAppTool(
    server,
    "blackwell-apply",
    {
      title: "Apply for a Blackwell Bank card",
      description:
        "Shows only the Blackwell Bank application form. Use INSTEAD OF blackwell-browse-cards when the user explicitly asks to apply for a specific card directly. Follow-up: Confirm the application has started and mention the next required step.",
      inputSchema: {
        cardId: z.enum(CARD_IDS).optional(),
        customerType: z.enum(CUSTOMER_TYPES.map((i) => i.id)).optional(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: READ_ONLY_TOOL,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      const payload = createApplicationJourney({
        cardId: args.cardId ?? "blackwell-rewards",
        customerType: args.customerType ?? "new-to-bank",
        leadSource: "digital-banking",
      });
      return {
        content: [{ type: "text", text: `Starting application for ${payload.card.name}.` }],
        structuredContent: payload,
      };
    },
  );

  // ── Card comparison fragment ───────────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-compare-cards",
    {
      title: "Compare Blackwell Bank cards",
      description:
        "Shows a side-by-side comparison of Blackwell Bank credit cards. Use when the user wants to compare products. Follow-up: Call out the best-for-you card and ask if they want to apply or run eligibility.",
      inputSchema: {
        cardIds: z.array(z.enum(CARD_IDS)).optional(),
        need: z.enum(["everyday-spend", "travel", "credit-building"]).optional(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: READ_ONLY_TOOL,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      const payload = getCardComparison(args.cardIds ?? [], args.need ?? null);
      return {
        content: [{ type: "text", text: formatToolResultText("blackwell-compare-cards", payload) }],
        structuredContent: payload,
      };
    },
  );

  // ── Rewards calculator fragment ───────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-rewards-calculator",
    {
      title: "Blackwell rewards calculator",
      description:
        "Interactive calculator showing projected rewards or cashback based on monthly spend. Follow-up: Summarise the projected yearly value and offer to compare with another card.",
      inputSchema: {
        cardId: z.enum(CARD_IDS).optional(),
        monthlySpend: z.number().optional(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: READ_ONLY_TOOL,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      const payload = calculateRewards(
        args.cardId ?? "blackwell-rewards",
        args.monthlySpend ?? 1500,
      );
      return {
        content: [{ type: "text", text: payload.headline }],
        structuredContent: payload,
      };
    },
  );

  // ── Balance transfer estimator ─────────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-balance-transfer",
    {
      title: "Balance transfer estimator",
      description:
        "Estimates fees and savings for transferring a balance to a Blackwell Bank card. Illustrative only. Follow-up: Explain estimated savings and remind the user this is illustrative.",
      inputSchema: {
        amount: z.number().optional(),
        currentApr: z.number().optional(),
        cardId: z.enum(CARD_IDS).optional(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: READ_ONLY_TOOL,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      const payload = estimateBalanceTransfer(args);
      return {
        content: [{ type: "text", text: payload.headline }],
        structuredContent: payload,
      };
    },
  );

  // ── Card Hub launcher ─────────────────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-open-hub",
    {
      title: "Open Blackwell Card Hub",
      description:
        "Opens the Blackwell Card Hub launcher — a tile dashboard for Products, Spend Insights, Merchant Offers, Travel, and Card Controls. Use when the user says 'Card Hub', 'open my hub', 'show my Blackwell Card Hub', or wants the main card dashboard. Use INSTEAD OF blackwell-browse-cards for hub requests — browse-cards is only the Products tile, not the hub. Follow-up: Tell the user which hub tiles are available and what each does.",
      inputSchema: {},
      outputSchema: OUTPUT_SCHEMA,
      annotations: READ_ONLY_TOOL,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async () => {
      const payload = getHubPayload();
      return {
        content: [{ type: "text", text: formatToolResultText("blackwell-open-hub", payload) }],
        structuredContent: payload,
      };
    },
  );

  // ── Spend insights ────────────────────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-spend-insights",
    {
      title: "View spend insights",
      description:
        "Shows category breakdown and tokenised top merchants for the current period. Follow-up: Summarise top categories; mention figures match the panel.",
      inputSchema: {},
      outputSchema: OUTPUT_SCHEMA,
      annotations: READ_ONLY_TOOL,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async () => {
      const payload = getSpendInsights();
      return {
        content: [{ type: "text", text: formatToolResultText("blackwell-spend-insights", payload) }],
        structuredContent: payload,
      };
    },
  );

  // ── Merchant offers ───────────────────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-merchant-offers",
    {
      title: "View merchant offers",
      description:
        "Shows partner cashback and discount offers available on your card. Follow-up: Summarise active or available partners and ask if the user wants to activate one.",
      inputSchema: {},
      outputSchema: OUTPUT_SCHEMA,
      annotations: READ_ONLY_TOOL,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async () => {
      const payload = getMerchantOffers();
      return {
        content: [{ type: "text", text: formatToolResultText("blackwell-merchant-offers", payload) }],
        structuredContent: payload,
      };
    },
  );

  // ── Travel notice ─────────────────────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-travel-notice",
    {
      title: "Register travel notice",
      description:
        "Register upcoming travel on your credit card to help protect it abroad. Follow-up: Explain this registers travel dates and destinations, then ask if they want to submit now.",
      inputSchema: {},
      outputSchema: OUTPUT_SCHEMA,
      annotations: READ_ONLY_TOOL,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async () => {
      const payload = getTravelNoticeForm();
      return {
        content: [{ type: "text", text: "Register a travel notice on your card." }],
        structuredContent: payload,
      };
    },
  );

  // ── Credit limit soft offer ─────────────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-credit-limit-offer",
    {
      title: "Credit limit increase check",
      description:
        "Shows an indicative credit limit increase offer. Read-only soft check — not a guarantee. Follow-up: Explain the increase is indicative and ask whether they want to proceed.",
      inputSchema: {
        existingCustomer: z.boolean().optional(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: READ_ONLY_TOOL,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      const payload = getCreditLimitOffer(args.existingCustomer ?? true);
      return {
        content: [{ type: "text", text: `Indicative increase of ${payload.indicativeIncrease}.` }],
        structuredContent: payload,
      };
    },
  );

  // ── Wallet provisioning ───────────────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-wallet-provision",
    {
      title: "Add card to digital wallet",
      description:
        "Shows Apple Pay / Google Pay provisioning for your Blackwell card. Follow-up: Confirm wallet availability and ask which wallet they want to use.",
      inputSchema: {
        cardId: z.enum(CARD_IDS).optional(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: READ_ONLY_TOOL,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      const payload = getWalletProvisioning(args.cardId);
      return {
        content: [{ type: "text", text: `Add ${payload.cardName} to your digital wallet.` }],
        structuredContent: payload,
      };
    },
  );

  // ── App-only: card selection (hidden from LLM) ────────────────────────────
  registerAppTool(
    server,
    "blackwell-select-card",
    {
      title: "Select card",
      description: "Switch the selected card in the catalogue view.",
      inputSchema: {
        cardId: z.enum(CARD_IDS),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: PRIVATE_STATE_TOOL,
      _meta: {
        ui: {
          visibility: ["app"],
        },
      },
    },
    async (args) => {
      const card = CARDS.find((c) => c.id === args.cardId) ?? CARDS[0];
      const recommendations = getCardRecommendations();
      return {
        content: [{ type: "text", text: `Selected ${card.name}.` }],
        structuredContent: {
          kind: "card-selected",
          selectedCardId: card.id,
          recommendations,
        },
      };
    },
  );

  // ── App-only: application form submission (hidden from LLM) ───────────────
  registerAppTool(
    server,
    "blackwell-submit-application",
    {
      title: "Submit application",
      description: "Submit the card application form and return a confirmation payload.",
      inputSchema: {
        cardId: z.enum(CARD_IDS),
        applicantName: z.string().optional(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: PRIVATE_STATE_TOOL,
      _meta: {
        ui: {
          visibility: ["app"],
        },
      },
    },
    async (args) => {
      const card = CARDS.find((c) => c.id === args.cardId) ?? CARDS[0];
      const applicantName = args.applicantName ?? "Alex";
      return {
        content: [
          {
            type: "text",
            text: `Application submitted for ${card.name}. Decision expected within minutes.`,
          },
        ],
        structuredContent: {
          kind: "application-submitted",
          submitted: true,
          cardId: card.id,
          cardName: card.name,
          applicantName,
          underwritingStatus: "reviewing",
        },
      };
    },
  );

  // ── App-only: compare basket toggle ───────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-toggle-compare",
    {
      title: "Toggle card in compare basket",
      description: "Add or remove a card from the compare basket.",
      inputSchema: {
        cardId: z.enum(CARD_IDS),
        compareIds: z.array(z.enum(CARD_IDS)),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: PRIVATE_STATE_TOOL,
      _meta: { ui: { visibility: ["app"] } },
    },
    async (args) => {
      const ids = new Set(args.compareIds);
      if (ids.has(args.cardId)) ids.delete(args.cardId);
      else ids.add(args.cardId);
      const compareIds = [...ids];
      const payload = compareIds.length >= 2
        ? getCardComparison(compareIds)
        : { kind: "compare-basket", compareIds, mode: "full" };
      return {
        content: [{ type: "text", text: `Compare basket: ${compareIds.length} cards.` }],
        structuredContent: payload,
      };
    },
  );

  // ── App-only: save application draft ──────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-save-application",
    {
      title: "Save application draft",
      description:
        "Marks simulated application progress as saved. The app keeps entered form details locally; this tool receives only card and step metadata.",
      inputSchema: {
        cardId: z.enum(CARD_IDS),
        stepIndex: z.number(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: PRIVATE_STATE_TOOL,
      _meta: { ui: { visibility: ["app"] } },
    },
    async (args) => {
      return {
        content: [{ type: "text", text: "Application saved. You can resume later." }],
        structuredContent: {
          kind: "application-saved",
          cardId: args.cardId,
          stepIndex: args.stepIndex,
          savedAt: new Date().toISOString(),
        },
      };
    },
  );

  // ── App-only: identity verification upload ────────────────────────────────
  registerAppTool(
    server,
    "blackwell-upload-verification",
    {
      title: "Upload identity documents",
      description:
        "Marks the simulated identity verification step as uploaded. This demo tool receives document type only and does not receive files, images, or biometrics.",
      inputSchema: {
        documentType: z.enum(["passport", "driving-licence"]).optional(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: PRIVATE_STATE_TOOL,
      _meta: { ui: { visibility: ["app"] } },
    },
    async () => {
      const result = markVerificationUploaded();
      return {
        content: [{ type: "text", text: "Verification: pending" }],
        structuredContent: result,
      };
    },
  );

  // ── App-only: activate merchant offer ─────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-activate-offer",
    {
      title: "Activate merchant offer",
      description: "Activate a partner offer on the customer's card.",
      inputSchema: { offerId: z.string() },
      outputSchema: OUTPUT_SCHEMA,
      annotations: PRIVATE_STATE_TOOL,
      _meta: { ui: { visibility: ["app"] } },
    },
    async (args) => {
      const result = activateOffer(args.offerId);
      return {
        content: [{ type: "text", text: result.message }],
        structuredContent: { ...getMerchantOffers(), ...result },
      };
    },
  );

  // ── App-only: submit travel notice ────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-submit-travel-notice",
    {
      title: "Submit travel notice",
      description: "Register travel dates and countries on the card.",
      inputSchema: {
        countries: z.array(z.string()),
        departure: z.string(),
        returnDate: z.string(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: PRIVATE_STATE_TOOL,
      _meta: { ui: { visibility: ["app"] } },
    },
    async (args) => {
      const result = submitTravelNotice(args);
      return {
        content: [{ type: "text", text: result.message }],
        structuredContent: { ...getTravelNoticeForm(), ...result, mode: "travel-notice" },
      };
    },
  );

  // ── App-only: provision wallet ────────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-provision-wallet",
    {
      title: "Provision digital wallet",
      description: "Add card to Apple Pay or Google Pay.",
      inputSchema: { cardId: z.enum(CARD_IDS).optional(), wallet: z.string().optional() },
      outputSchema: OUTPUT_SCHEMA,
      annotations: PRIVATE_STATE_TOOL,
      _meta: { ui: { visibility: ["app"] } },
    },
    async (args) => {
      const result = provisionWallet(args.cardId);
      return {
        content: [{ type: "text", text: result.message }],
        structuredContent: { ...result, mode: "wallet" },
      };
    },
  );

  // ── App-only: hub navigation ──────────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-navigate-hub",
    {
      title: "Navigate Card Hub",
      description: "Route to a hub domain without involving the LLM.",
      inputSchema: { hubId: z.string() },
      outputSchema: OUTPUT_SCHEMA,
      annotations: PRIVATE_STATE_TOOL,
      _meta: { ui: { visibility: ["app"] } },
    },
    async (args) => {
      const hub = getHubPayload();
      const tile = hub.tiles.find((t) => t.id === args.hubId);
      const mode = tile?.mode ?? "hub";
      const payloads = {
        full: getDemoPayload(),
        "spend-insights": getSpendInsights(),
        "merchant-offers": getMerchantOffers(),
        "travel-notice": getTravelNoticeForm(),
        "credit-limit": getCreditLimitOffer(true),
        wallet: getWalletProvisioning(),
      };
      const payload = payloads[mode] ?? hub;
      return {
        content: [{ type: "text", text: `Navigated to ${tile?.label ?? args.hubId}.` }],
        structuredContent: { ...payload, mode: mode === "full" ? "full" : payload.mode },
      };
    },
  );

  // ── App-only: resume application ──────────────────────────────────────────
  registerAppTool(
    server,
    "blackwell-resume-application",
    {
      title: "Resume saved application",
      description:
        "Restore simulated application progress from card and step metadata. Entered form details remain local to the app.",
      inputSchema: {
        cardId: z.enum(CARD_IDS),
        stepIndex: z.number(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: PRIVATE_STATE_TOOL,
      _meta: { ui: { visibility: ["app"] } },
    },
    async (args) => {
      const journey = restoreApplicationDraft(serializeApplicationDraft(args));
      return {
        content: [{ type: "text", text: `Resuming application for ${journey.card.name}.` }],
        structuredContent: journey,
      };
    },
  );

  // ── App-only: underwriting decision (async) ───────────────────────────────
  registerAppTool(
    server,
    "blackwell-underwriting-decision",
    {
      title: "Fetch underwriting decision",
      description: "Returns the async credit decision after review.",
      inputSchema: {
        applicantName: z.string().optional(),
        creditBand: z.enum(["fair", "good", "excellent"]).optional(),
      },
      outputSchema: OUTPUT_SCHEMA,
      annotations: PRIVATE_STATE_TOOL,
      _meta: { ui: { visibility: ["app"] } },
    },
    async (args) => {
      const decision = createUnderwritingDecision(
        args.applicantName ?? "Alex",
        args.creditBand ?? "good",
      );
      return {
        content: [{ type: "text", text: formatToolResultText("blackwell-underwriting-decision", decision) }],
        structuredContent: { kind: "underwriting-complete", mode: "application", ...decision },
      };
    },
  );

  // ── UI resource ───────────────────────────────────────────────────────────
  registerAppResource(
    server,
    "Blackwell Bank Card Services UI",
    RESOURCE_URI,
    {
      mimeType: RESOURCE_MIME_TYPE,
      description:
        "Blackwell Bank MCP App UI — Card Hub, card catalogue, spend insights, offers, travel, controls, eligibility and application.",
    },
    async () => {
      const html = await readBundledAppHtml();
      return {
        contents: [
          {
            uri: RESOURCE_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: {
              ui: {
                csp: {
                  connectDomains: [
                    "https://bank.myareareport.com",
                    "http://localhost:3001",
                  ],
                },
              },
            },
          },
        ],
      };
    },
  );

  return server;
}
