import {
  App,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables,
} from "@modelcontextprotocol/ext-apps";
import {
  calculateRewards,
  createApplicationJourney,
  createDeliveryTracker,
  estimateBalanceTransfer,
  getCategoryMerchants,
  getCompareRecommendation,
  getCardComparison,
  restoreApplicationDraft,
  runEligibilityCheck,
  serializeApplicationDraft,
  toModelContext,
} from "./demo-data.js";
import { createFeatureViews } from "./feature-views.js";
import "./global.css";
import "./mcp-app.css";

const DRAFT_STORAGE_KEY = "blackwell-application-draft";
const DEMO_MODE_STORAGE_KEY = "blackwell-demo-mode";
const DEFAULT_DEMO_CARD_ID = "blackwell-rewards";

// ─── State ───────────────────────────────────────────────────────────────────

const state = {
  mode: "full",
  entryMode: null,
  journeyPhase: null,
  showJourney: false,
  recommendations: null,
  eligibility: null,
  applicationJourney: null,
  selectedCardId: null,
  submitted: false,
  profile: null,
  compareIds: [],
  calculator: null,
  balanceTransfer: null,
  hub: null,
  spendInsights: null,
  merchantOffers: null,
  travelNotice: null,
  creditLimit: null,
  wallet: null,
  comparison: null,
  stepIndex: 0,
  formData: {},
  verificationStatus: "not-started",
  verificationIdUploaded: false,
  verificationSelfieUploaded: false,
  underwritingStatus: null,
  underwritingDecision: null,
  applicantName: "Alex",
  offerActivationFeedback: null,
  activeSpendCategory: null,
  lastModelContext: null,
};

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const appRoot = document.getElementById("app-root");
const expandBtn = document.getElementById("expand-btn");
const demoToolbar = document.getElementById("demo-toolbar");
const modelContextPanel = document.getElementById("model-context-panel");
const modelContextCustomer = document.getElementById("model-context-customer");
const modelContextModel = document.getElementById("model-context-model");

// ─── App instance ─────────────────────────────────────────────────────────────

const app = new App({ name: "Blackwell Bank Card Services", version: "1.0.0" });
const IS_EMBEDDED = window.parent !== window;

let features;
let demoModeEnabled = false;

function formatPretty(value) {
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

function renderModelContextPanel() {
  if (!modelContextPanel) return;
  const shouldShow = demoModeEnabled && Boolean(state.lastModelContext);
  modelContextPanel.classList.toggle("hidden", !shouldShow);
  if (!shouldShow) return;

  if (modelContextCustomer) {
    modelContextCustomer.textContent = formatPretty(state.lastModelContext.customer ?? {});
  }
  if (modelContextModel) {
    modelContextModel.textContent = formatPretty(state.lastModelContext.model ?? "{}");
  }
}

function pushModelContext(event, payload) {
  const text = toModelContext(event, payload);
  state.lastModelContext = {
    event,
    customer: payload,
    model: text,
    at: new Date().toISOString(),
  };
  if (!IS_EMBEDDED) {
    renderModelContextPanel();
    return;
  }
  try {
    app.updateModelContext({ content: [{ type: "text", text }] }).catch(() => {});
  } catch {
    // Host may not support model context updates
  }
  renderModelContextPanel();
}

function initFeatures() {
  features = createFeatureViews({
    state,
    app,
    DRAFT_STORAGE_KEY,
    callServerTool,
    showViewForMode,
    notifyHostSize,
    render,
    pushModelContext,
    renderModelContextPanel,
    demoData: {
      calculateRewards,
      createDeliveryTracker,
      estimateBalanceTransfer,
      getCategoryMerchants,
      getCompareRecommendation,
      getCardComparison,
      restoreApplicationDraft,
      serializeApplicationDraft,
    },
  });
}

// ─── Host context ─────────────────────────────────────────────────────────────

function applyHostContext(ctx) {
  if (ctx.theme) applyDocumentTheme(ctx.theme);
  if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
  if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
  if (ctx.safeAreaInsets && appRoot) {
    appRoot.style.paddingTop    = `${ctx.safeAreaInsets.top + 24}px`;
    appRoot.style.paddingRight  = `${ctx.safeAreaInsets.right + 24}px`;
    appRoot.style.paddingBottom = `${ctx.safeAreaInsets.bottom + 24}px`;
    appRoot.style.paddingLeft   = `${ctx.safeAreaInsets.left + 24}px`;
  }
}

// ─── View switching ───────────────────────────────────────────────────────────

function showView(viewId) {
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  document.getElementById(viewId)?.classList.remove("hidden");
}

const VIEW_BY_MODE = {
  full: "view-full",
  "card-detail": "view-card-detail",
  journey: "view-journey",
  eligibility: "view-journey",
  application: "view-journey",
  compare: "view-compare",
  calculator: "view-calculator",
  "balance-transfer": "view-balance-transfer",
  hub: "view-hub",
  "spend-insights": "view-spend-insights",
  "merchant-offers": "view-merchant-offers",
  "travel-notice": "view-travel-notice",
  "credit-limit": "view-credit-limit",
  wallet: "view-wallet",
};

async function callServerTool(name, args = {}) {
  try {
    const result = await app.callServerTool({ name, arguments: args });
    handleToolResult(result);
    return result;
  } catch (err) {
    console.error(`Tool ${name} failed:`, err);
    return null;
  }
}

function loadDraftFromStorage() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraftToStorage(draft) {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // storage unavailable in sandbox
  }
}

function readDemoModeFromStorage() {
  try {
    return localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDemoModeToStorage(enabled) {
  try {
    if (enabled) {
      localStorage.setItem(DEMO_MODE_STORAGE_KEY, "1");
      return;
    }
    localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
  } catch {
    // storage unavailable in sandbox
  }
}

function hasDemoQueryParam() {
  try {
    return new URLSearchParams(window.location.search).get("demo") === "1";
  } catch {
    return false;
  }
}

function setDemoMode(enabled) {
  demoModeEnabled = Boolean(enabled);
  if (demoToolbar) {
    demoToolbar.classList.toggle("hidden", !demoModeEnabled);
  }
  renderModelContextPanel();
}

function showViewForMode(mode) {
  showView(VIEW_BY_MODE[mode] ?? "view-full");
}

async function resetDemoSession(destination = "hub") {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // storage unavailable in sandbox
  }
  state.journeyPhase = null;
  state.showJourney = false;
  state.eligibility = null;
  state.applicationJourney = null;
  state.submitted = false;
  state.stepIndex = 0;
  state.formData = {};
  state.verificationStatus = "not-started";
  state.verificationIdUploaded = false;
  state.verificationSelfieUploaded = false;
  state.underwritingStatus = null;
  state.underwritingDecision = null;
  state.compareIds = [];
  state.comparison = null;
  state.calculator = null;
  state.balanceTransfer = null;
  state.activeSpendCategory = null;
  state.offerActivationFeedback = null;
  state.lastModelContext = null;
  document.getElementById("full-journey-section")?.classList.add("hidden");
  renderModelContextPanel();

  if (destination === "products") {
    state.entryMode = "full";
    const result = await callServerTool("blackwell-browse-cards");
    if (!result) {
      state.mode = "full";
      showViewForMode("full");
      render();
    }
    return;
  }

  state.entryMode = "hub";
  const result = await callServerTool("blackwell-open-hub");
  if (!result) {
    state.mode = "hub";
    showViewForMode("hub");
    render();
  }
}

async function runDemoToolbarAction(action) {
  if (action === "hub") {
    const result = await callServerTool("blackwell-open-hub");
    if (!result) {
      state.mode = "hub";
      state.entryMode = "hub";
      showViewForMode("hub");
      render();
    }
    return;
  }

  if (action === "products") {
    const result = await callServerTool("blackwell-browse-cards");
    if (!result) {
      state.mode = "full";
      state.entryMode = "full";
      showViewForMode("full");
      render();
    }
    return;
  }

  if (action === "spend") {
    const result = await callServerTool("blackwell-spend-insights");
    if (!result) {
      state.mode = "spend-insights";
      showViewForMode("spend-insights");
      render();
    }
    return;
  }

  if (action === "apply") {
    state.selectedCardId = state.selectedCardId ?? DEFAULT_DEMO_CARD_ID;
    const result = await callServerTool("blackwell-apply", { cardId: DEFAULT_DEMO_CARD_ID });
    if (!result) {
      state.mode = "journey";
      state.entryMode = "journey";
      state.applicationJourney = createApplicationJourney({ cardId: DEFAULT_DEMO_CARD_ID });
      state.journeyPhase = "application";
      state.showJourney = true;
      showViewForMode("journey");
      render();
    }
    return;
  }

  if (action === "reset") {
    await resetDemoSession("hub");
  }
}

function wireDemoToolbar() {
  const queryEnabled = hasDemoQueryParam();
  if (queryEnabled) {
    writeDemoModeToStorage(true);
  }
  setDemoMode(queryEnabled || readDemoModeFromStorage());

  demoToolbar?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-demo-action]");
    if (!button) return;
    runDemoToolbarAction(button.dataset.demoAction);
  });

  document.addEventListener("keydown", (event) => {
    if (!event.shiftKey || event.key.toLowerCase() !== "d") return;
    event.preventDefault();
    const nextMode = !demoModeEnabled;
    setDemoMode(nextMode);
    writeDemoModeToStorage(nextMode);
  });
}

function notifyHostSize() {
  if (!IS_EMBEDDED) return;
  try {
    const height = Math.ceil(Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      appRoot?.scrollHeight ?? 0,
      280,
    ));
    const width = Math.ceil(Math.max(
      document.documentElement.offsetWidth,
      document.body.offsetWidth,
      360,
    ));
    app.sendSizeChanged({ width, height }).catch(() => {});
  } catch {
    // Host not ready yet
  }
}

function journeyTargets() {
  if (state.mode === "full") {
    return {
      progressId: "full-journey-progress",
      bodyId: "full-journey-body",
      titleId: "full-journey-title",
    };
  }
  return {
    progressId: "fragment-journey-progress",
    bodyId: "fragment-journey-body",
    titleId: "fragment-journey-title",
  };
}

function setJourneyTitle(label) {
  const { titleId } = journeyTargets();
  const el = document.getElementById(titleId);
  if (el) el.textContent = label;
}

function focusJourneyContent(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  requestAnimationFrame(() => {
    const scrollTarget = container.closest("#full-journey-section, #view-journey") ?? container;
    scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
    const heading = container.querySelector("h2, h3");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    notifyHostSize();
  });
}

function renderJourneyPhase() {
  const { progressId, bodyId } = journeyTargets();
  const progressEl = document.getElementById(progressId);
  if (!progressEl || !document.getElementById(bodyId)) return;

  switch (state.journeyPhase) {
    case "eligibility-form":
      progressEl.classList.add("hidden");
      setJourneyTitle("Eligibility");
      renderEligibilityForm(bodyId);
      break;
    case "eligibility-result":
      progressEl.classList.add("hidden");
      setJourneyTitle("Eligibility");
      renderEligibilityResult(bodyId);
      break;
    case "application":
      progressEl.classList.remove("hidden");
      setJourneyTitle("Application");
      features?.renderJourney(progressId, bodyId, getFormFieldsForStep);
      break;
    case "confirmation":
      progressEl.classList.add("hidden");
      setJourneyTitle("Application");
      features?.renderConfirmation(document.getElementById(bodyId), state.applicationJourney?.card);
      break;
    default:
      break;
  }
  notifyHostSize();
}

function beginJourney(phase) {
  state.journeyPhase = phase;
  state.showJourney = true;
  if (state.mode === "full") {
    document.getElementById("full-journey-section")?.classList.remove("hidden");
    renderJourneyPhase();
    return;
  }
  state.mode = "journey";
  showViewForMode("journey");
  renderJourneyPhase();
}

// ─── Tool result routing ──────────────────────────────────────────────────────

function extractPayload(result) {
  if (!result || typeof result !== "object") return {};
  if (result.structuredContent && typeof result.structuredContent === "object") {
    return result.structuredContent;
  }
  if (result.params?.structuredContent && typeof result.params.structuredContent === "object") {
    return result.params.structuredContent;
  }
  if (result.kind) return result;
  return {};
}

function hasRenderableData(payload) {
  if (!payload || typeof payload !== "object") return false;
  const kinds = [
    "embedded-sales-demo", "card-recommendations", "eligibility-check",
    "application-journey", "card-comparison", "rewards-calculator",
    "balance-transfer-estimate", "card-hub", "spend-insights",
    "merchant-offers", "travel-notice", "credit-limit-offer", "wallet-provision",
  ];
  if (kinds.includes(payload.kind)) return true;
  if (payload.kind === "application-journey") return Boolean(payload.steps?.length || payload.card);
  return Boolean(payload.recommendations?.cards?.length || payload.cards?.length);
}

function showBootstrapError(message) {
  showView("view-loading");
  const text = document.querySelector("#view-loading .loading-text");
  if (text) text.textContent = message;
  notifyHostSize();
}

// Returns true when the UI was updated with real content.
function handleToolResult(result) {
  const payload = extractPayload(result);

  // App-only tool echoes — merge data but never change view/mode
  if (payload.kind === "card-selected") {
    if (payload.selectedCardId) state.selectedCardId = payload.selectedCardId;
    if (payload.recommendations) state.recommendations = payload.recommendations;
    render();
    return true;
  }
  if (payload.kind === "compare-basket") {
    state.compareIds = payload.compareIds ?? state.compareIds;
    render();
    return true;
  }
  if (payload.kind === "application-submitted") {
    state.submitted = true;
    state.underwritingStatus = payload.underwritingStatus ?? "reviewing";
    state.applicantName = payload.applicantName ?? state.applicantName;
    features?.beginAsyncUnderwriting();
    render();
    return true;
  }
  if (payload.kind === "application-saved") {
    if (payload.draft) saveDraftToStorage(payload.draft);
    return true;
  }
  if (payload.kind === "verification-uploaded") {
    state.verificationStatus = "pending";
    return true;
  }
  if (payload.kind === "underwriting-complete") {
    state.underwritingStatus = "complete";
    state.underwritingDecision = payload;
    features?.notifyUnderwritingDecision(payload);
    renderJourneyPhase();
    return true;
  }
  if (payload.kind === "offer-activated" || payload.kind === "travel-notice-submitted" || payload.kind === "wallet-provisioned") {
    if (payload.offers) state.merchantOffers = payload;
    if (payload.kind === "offer-activated") {
      state.offerActivationFeedback = payload.activationCopy ?? payload.message ?? "Offer activated";
    }
    if (payload.reference) state.travelNotice = payload;
    if (payload.status === "provisioned") state.wallet = payload;
    render();
    return true;
  }

  if (!hasRenderableData(payload)) return false;

  if (payload.kind === "embedded-sales-demo") {
    state.recommendations    = payload.recommendations;
    state.applicationJourney = payload.applicationJourney;
    state.profile            = payload.profile ?? null;
    state.submitted          = false;
    state.selectedCardId     = payload.recommendations?.cards?.[0]?.id ?? null;
    state.showJourney        = false;
    state.journeyPhase       = null;
    state.eligibility        = null;
    state.underwritingStatus = null;
    state.underwritingDecision = null;
    state.activeSpendCategory = null;
    features?.tryResumeDraft();
  }

  if (payload.kind === "card-recommendations") {
    state.recommendations = payload;
    state.selectedCardId = payload.selectedCardId ?? payload.cards?.[0]?.id ?? state.selectedCardId;
  }

  if (payload.kind === "card-comparison") {
    state.comparison = payload;
    state.compareIds = payload.cardIds ?? [];
  }

  if (payload.kind === "rewards-calculator") state.calculator = payload;
  if (payload.kind === "balance-transfer-estimate") state.balanceTransfer = payload;
  if (payload.kind === "card-hub") state.hub = payload;
  if (payload.kind === "spend-insights") {
    state.spendInsights = payload;
    state.activeSpendCategory = null;
  }
  if (payload.kind === "merchant-offers") state.merchantOffers = payload;
  if (payload.kind === "travel-notice") state.travelNotice = payload;
  if (payload.kind === "credit-limit-offer") state.creditLimit = payload;
  if (payload.kind === "wallet-provision" || payload.kind === "wallet-provisioned") state.wallet = payload;

  if (payload.kind === "eligibility-check") {
    state.eligibility = payload;
  }

  if (payload.kind === "application-journey") {
    state.applicationJourney = payload;
    state.submitted          = false;
    state.stepIndex          = payload.steps?.findIndex((s) => s.status === "current") ?? 0;
    state.formData           = payload.draftFormData ?? state.formData;
    if (payload.resumed) {
      state.journeyPhase = "application";
      state.showJourney = true;
    }
  }

  const incomingMode = payload.mode;

  // Fold eligibility/application into full panel only — other modes get their own view
  const foldIntoFull = incomingMode === "eligibility" || incomingMode === "application";
  if (state.entryMode === "full" && foldIntoFull) {
    if (incomingMode === "eligibility") {
      state.journeyPhase = state.eligibility ? "eligibility-result" : "eligibility-form";
      state.showJourney = true;
    }
    if (incomingMode === "application") {
      state.journeyPhase = "application";
      state.showJourney = true;
    }
    state.mode = "full";
    showViewForMode("full");
    render();
    return true;
  }

  // Hub and servicing modes always take over the view
  if (incomingMode === "hub") {
    state.mode = "hub";
    state.entryMode = "hub";
    showViewForMode("hub");
    render();
    return true;
  }

  if (incomingMode === "eligibility") {
    state.mode = "journey";
    state.journeyPhase = state.eligibility ? "eligibility-result" : "eligibility-form";
    if (!state.entryMode) state.entryMode = "journey";
    showViewForMode("journey");
    render();
    return true;
  }

  if (incomingMode === "application") {
    state.mode = "journey";
    state.journeyPhase = "application";
    if (!state.entryMode) state.entryMode = "journey";
    showViewForMode("journey");
    render();
    return true;
  }

  if (incomingMode) {
    state.mode = incomingMode === "eligibility" || incomingMode === "application"
      ? "journey"
      : incomingMode;
    if (!state.entryMode) state.entryMode = state.mode;
  }

  showViewForMode(state.mode);
  render();
  return true;
}

// ─── Render orchestrator ──────────────────────────────────────────────────────

function render() {
  renderPersonalisationBanner();
  switch (state.mode) {
    case "full":
      renderCards();
      renderCardDetail("full-card-detail-body");
      if (state.showJourney && state.journeyPhase) {
        document.getElementById("full-journey-section")?.classList.remove("hidden");
        renderJourneyPhase();
      }
      break;
    case "card-detail":
      renderCardDetail("fragment-card-detail-body");
      break;
    case "compare":
      features?.renderComparison();
      break;
    case "calculator":
      features?.renderCalculator();
      break;
    case "balance-transfer":
      features?.renderBalanceTransfer();
      break;
    case "hub":
      features?.renderHub();
      break;
    case "spend-insights":
      features?.renderSpendInsights();
      break;
    case "merchant-offers":
      features?.renderMerchantOffers();
      break;
    case "travel-notice":
      features?.renderTravelNotice();
      break;
    case "credit-limit":
      features?.renderCreditLimit();
      break;
    case "wallet":
      features?.renderWallet();
      break;
    case "journey":
    case "eligibility":
    case "application":
      if (state.mode !== "journey") {
        state.journeyPhase ??= state.mode === "application" ? "application" : "eligibility-form";
        state.mode = "journey";
      }
      renderJourneyPhase();
      break;
  }
  renderModelContextPanel();
  notifyHostSize();
}

// ─── renderCards ─────────────────────────────────────────────────────────────

function renderPersonalisationBanner() {
  const banner = document.getElementById("personalisation-banner");
  if (!banner) return;
  if (!state.profile) {
    banner.classList.add("hidden");
    return;
  }
  banner.classList.remove("hidden");
  banner.innerHTML = `
    <div class="personalisation-copy">
      <strong>${state.profile.greeting}</strong>
      <span>${state.profile.subline}</span>
      ${state.profile.personalisedReason ? `<p class="personalisation-reason">${state.profile.personalisedReason}</p>` : ""}
    </div>
    <span style="font-size:0.78rem;font-weight:600;opacity:0.9">Pre-approved ${state.profile.preApprovedLimit}</span>
  `;
}

function toggleCompare(cardId) {
  const ids = new Set(state.compareIds);
  if (ids.has(cardId)) ids.delete(cardId);
  else ids.add(cardId);
  state.compareIds = [...ids];
  renderCards();
  callServerTool("blackwell-toggle-compare", { cardId, compareIds: state.compareIds });
}

function renderCards() {
  const container = document.getElementById("card-list-items");
  if (!container || !state.recommendations) return;

  const headline = document.getElementById("card-list-headline");
  if (headline) headline.textContent = state.recommendations.headline ?? "Recommended for you";

  const needSummary = document.getElementById("need-summary");
  if (needSummary) {
    if (state.recommendations.needSummary) {
      needSummary.textContent = state.recommendations.needSummary;
      needSummary.classList.remove("hidden");
    } else {
      needSummary.classList.add("hidden");
    }
  }

  const compareCount = document.getElementById("compare-count");
  if (compareCount) compareCount.textContent = `(${state.compareIds.length})`;

  const { cards } = state.recommendations;
  container.innerHTML = cards
    .map(
      (card) => `
      <div class="card-list-item ${card.id === state.selectedCardId ? "active" : ""}"
           data-card-id="${card.id}" role="button" tabindex="0"
           aria-label="Select ${card.name}">
        <h3>${card.name}</h3>
        <p class="card-list-summary">${card.summary}</p>
        <p class="card-list-benefit">${card.strengths[0]}</p>
        <p class="card-list-benefit">${card.strengths[1] ?? ""}</p>
        <label class="card-compare-toggle" data-compare-id="${card.id}">
          <input type="checkbox" ${state.compareIds.includes(card.id) ? "checked" : ""} />
          Compare
        </label>
        <span class="card-list-view-link">View details</span>
        <div class="card-list-mini-visual" aria-hidden="true">
          <div class="mini-card-top"><div class="mini-card-chip"></div></div>
          <div class="mini-card-crest">♞</div>
          <div class="mini-card-bottom">
            <span class="mini-card-bank">BLACKWELL</span>
            <span class="mini-card-network">${card.network}</span>
          </div>
        </div>
      </div>`,
    )
    .join("");

  container.querySelectorAll(".card-list-item").forEach((item) => {
    const cardId = item.dataset.cardId;
    item.querySelector(".card-compare-toggle")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleCompare(cardId);
    });
    const handler = () => {
      if (cardId === state.selectedCardId) return;
      state.selectedCardId = cardId;
      renderCards();
      renderCardDetail("full-card-detail-body");
      callServerTool("blackwell-select-card", { cardId });
    };
    item.addEventListener("click", (e) => {
      if (e.target.closest(".card-compare-toggle")) return;
      handler();
    });
    item.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") handler(); });
  });
}

// ─── renderCardDetail ─────────────────────────────────────────────────────────

function renderCardDetail(containerId) {
  const container = document.getElementById(containerId);
  if (!container || !state.recommendations) return;

  const cards = state.recommendations.cards ?? [];
  const card  = cards.find((c) => c.id === state.selectedCardId) ?? cards[0];
  if (!card) return;

  container.innerHTML = `
    <h2 class="card-detail-name">${card.name}</h2>
    <p class="card-detail-desc">${card.summary}</p>
    <div class="card-detail-columns">
      <div class="card-detail-left">
        <ul class="card-features">
          ${card.strengths.map((s) => `<li>${s}</li>`).join("")}
        </ul>
        <div class="apr-banner">
          <strong>Representative ${card.apr} APR (variable)</strong>
          <small>Credit subject to status. T&amp;Cs apply.</small>
        </div>
        <button class="btn-primary" data-action="check-eligibility">Check your eligibility</button>
        <button class="btn-secondary" data-action="rewards-calc">Rewards calculator</button>
        <button class="btn-secondary" data-action="balance-transfer">Balance transfer estimator</button>
      </div>
      <div class="card-detail-right">
        <div class="card-visual" aria-label="${card.name} card image" role="img">
          <div class="card-visual-top">
            <div class="card-chip"></div>
            <span class="card-bank-name">BLACKWELL<br>BANK</span>
          </div>
          <div class="card-visual-crest">♞</div>
          <div class="card-visual-bottom">
            <span></span>
            <span class="card-network">${card.network ?? "VISA"}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector("[data-action='check-eligibility']")?.addEventListener("click", () => {
    state.eligibility = null;
    beginJourney("eligibility-form");
  });
  container.querySelector("[data-action='rewards-calc']")?.addEventListener("click", () => {
    state.calculator = calculateRewards(card.id, 1500);
    state.mode = "calculator";
    showViewForMode("calculator");
    features?.renderCalculator();
  });
  container.querySelector("[data-action='balance-transfer']")?.addEventListener("click", () => {
    state.balanceTransfer = estimateBalanceTransfer({ cardId: card.id });
    state.mode = "balance-transfer";
    showViewForMode("balance-transfer");
    features?.renderBalanceTransfer();
  });
}

// ─── renderEligibilityForm ────────────────────────────────────────────────────

function renderEligibilityForm(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cardName = state.recommendations?.cards?.find((c) => c.id === state.selectedCardId)?.name
    ?? "this card";

  container.innerHTML = `
    <h2 class="eligibility-heading">Check your eligibility</h2>
    <p class="eligibility-subtitle">Tell us a little about yourself to see if you're likely to be approved for ${cardName}.</p>
    <form class="app-form" id="frag-eligibility-form">
      <div class="form-field">
        <label for="frag-creditBand">Credit band</label>
        <select id="frag-creditBand" name="creditBand">
          <option value="fair">Fair</option>
          <option value="good" selected>Good</option>
          <option value="excellent">Excellent</option>
        </select>
      </div>
      <div class="form-field">
        <label for="frag-annualIncome">Annual income (£)</label>
        <input type="number" id="frag-annualIncome" name="annualIncome" value="42000" min="0" step="1000" />
      </div>
      <div class="form-field">
        <label for="frag-employmentStatus">Employment status</label>
        <select id="frag-employmentStatus" name="employmentStatus">
          <option value="employed">Employed</option>
          <option value="self-employed">Self-employed</option>
          <option value="student">Student</option>
        </select>
      </div>
      <button type="submit" class="btn-primary">Check my eligibility</button>
    </form>
  `;

  document.getElementById("frag-eligibility-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Checking…"; }

    const payload = runEligibilityCheck({
      creditBand:       fd.get("creditBand"),
      annualIncome:     Number(fd.get("annualIncome")),
      employmentStatus: fd.get("employmentStatus"),
      cardId:           state.selectedCardId ?? "blackwell-rewards",
    });
    state.eligibility = payload;
    state.journeyPhase = "eligibility-result";
    renderEligibilityResult(containerId);
    focusJourneyContent(containerId);
    pushModelContext("eligibility", payload);
  });
}

// ─── renderEligibilityResult ─────────────────────────────────────────────────

function renderEligibilityResult(containerId) {
  const container = document.getElementById(containerId);
  if (!container || !state.eligibility) return;

  const { decision, creditLimit, recommendedCard } = state.eligibility;
  const isPreQualified = decision === "pre-qualified";

  const successBoxHtml = `
    <h2 class="eligibility-heading">Your eligibility result</h2>
    <p class="eligibility-subtitle">Based on the information you've provided</p>
    ${isPreQualified ? `
    <div class="eligibility-success-box">
      <div class="eligibility-check-circle">✓</div>
      <div>
        <h3 class="eligibility-success-title">You're likely to be eligible</h3>
        <p class="eligibility-success-desc">Congratulations! Based on the information you've entered, you're likely to be approved for the ${recommendedCard?.name ?? "card"}.</p>
      </div>
    </div>
  ` : `
    <div class="eligibility-recovery">
      <div class="eligibility-badge refer">We'll review this with you</div>
      <p class="eligibility-success-desc">You are not declined. We just need a little more information before we can confirm the best card for you.</p>
    </div>`}`;

  const statsHtml = isPreQualified && recommendedCard ? `
    <div class="eligibility-stats">
      <div class="stat-cell">
        <p class="stat-label">Credit limit</p>
        <p class="stat-value">${creditLimit ?? "£4,000"}</p>
      </div>
      <div class="stat-cell">
        <p class="stat-label">Purchase rate</p>
        <p class="stat-value">${recommendedCard.apr}</p>
        <p class="stat-sub">(variable)</p>
      </div>
      <div class="stat-cell">
        <p class="stat-label">Representative</p>
        <p class="stat-value">${recommendedCard.apr}</p>
        <p class="stat-sub">(variable)</p>
      </div>
    </div>
    <div class="eligibility-notice">
      ℹ This is not a guarantee. Your application is subject to full credit checks and status.
    </div>
    <button class="btn-primary" data-action="continue-application">Continue to application</button>
    <button class="btn-secondary" data-action="check-different">Check a different card</button>
  ` : `
    <div class="recovery-panel">
      <h3>Next steps</h3>
      <ul>
        <li>Try a different card if your priorities have changed.</li>
        <li>Visit a branch for one-to-one support.</li>
        <li>Run the check again with updated details when ready.</li>
      </ul>
    </div>
    <button class="btn-primary" data-action="try-different-card">Try a different card</button>
    <button class="btn-secondary" data-action="visit-branch">Visit a branch</button>
    <button class="btn-secondary" data-action="check-different">Check eligibility again</button>
  `;

  container.innerHTML = `
    ${successBoxHtml}
    ${statsHtml}
  `;

  container.querySelector("[data-action='continue-application']")?.addEventListener("click", () => {
    state.applicationJourney = createApplicationJourney({
      cardId: recommendedCard?.id ?? "blackwell-rewards",
    });
    state.submitted = false;
    state.verificationStatus = "not-started";
    state.verificationIdUploaded = false;
    state.verificationSelfieUploaded = false;
    state.journeyPhase = "application";
    renderJourneyPhase();
    focusJourneyContent(containerId);
  });

  focusJourneyContent(containerId);

  container.querySelector("[data-action='check-different']")?.addEventListener("click", () => {
    state.eligibility = null;
    state.journeyPhase = "eligibility-form";
    renderEligibilityForm(containerId);
  });

  container.querySelector("[data-action='try-different-card']")?.addEventListener("click", () => {
    state.eligibility = null;
    state.journeyPhase = null;
    state.showJourney = false;
    if (state.entryMode === "full") {
      document.getElementById("full-journey-section")?.classList.add("hidden");
      state.mode = "full";
      showViewForMode("full");
    } else {
      state.mode = "card-detail";
      showViewForMode("card-detail");
    }
    render();
  });

  container.querySelector("[data-action='visit-branch']")?.addEventListener("click", () => {
    const panel = container.querySelector(".recovery-panel");
    if (!panel || panel.querySelector(".recovery-note")) return;
    panel.insertAdjacentHTML(
      "beforeend",
      `<p class="recovery-note">Bring photo ID and proof of address if you visit us in branch.</p>`,
    );
  });
}


// ─── getFormFieldsForStep ─────────────────────────────────────────────────────

function getFormFieldsForStep(stepTitle) {
  const fieldMap = {
    "Personal details": `
      <div class="form-row">
        <div class="form-field"><label>Full name</label><input type="text" name="fullName" placeholder="Alex Morgan" autocomplete="name" /></div>
        <div class="form-field"><label>Date of birth</label><input type="text" name="dob" placeholder="DD / MM / YYYY" /></div>
      </div>
      <div class="form-field"><label>Email address</label><input type="email" name="email" placeholder="alex.morgan@email.com" autocomplete="email" /></div>
      <div class="form-field"><label>Mobile number</label><input type="tel" name="mobile" placeholder="+44 7700 900123" autocomplete="tel" /></div>
    `,
    "Address": `
      <div class="form-field"><label>Address line 1</label><input type="text" name="address1" placeholder="12 Example Street" autocomplete="address-line1" /></div>
      <div class="form-field"><label>Town / City</label><input type="text" name="city" placeholder="London" autocomplete="address-level2" /></div>
      <div class="form-row">
        <div class="form-field"><label>Postcode</label><input type="text" name="postcode" placeholder="EC4N 1HQ" autocomplete="postal-code" /></div>
        <div class="form-field"><label>Years at address</label><input type="number" name="yearsAtAddress" placeholder="3" min="0" max="99" /></div>
      </div>
    `,
    "Employment": `
      <div class="form-field">
        <label>Employment status</label>
        <select name="employmentStatus">
          <option value="employed">Employed</option>
          <option value="self-employed">Self-employed</option>
          <option value="student">Student</option>
          <option value="retired">Retired</option>
        </select>
      </div>
      <div class="form-field"><label>Annual income (£)</label><input type="number" name="annualIncome" placeholder="42000" min="0" step="1000" /></div>
      <div class="form-field"><label>Employer name</label><input type="text" name="employer" placeholder="Company name" /></div>
    `,
    "Review": `
      <div style="background:var(--bw-sage-bg);border:1px solid var(--bw-sage-border);border-radius:12px;padding:14px;font-size:0.84rem;color:var(--bw-muted);margin-bottom:4px;">
        Please review the details you've provided. By submitting you confirm they are accurate and
        you consent to a credit check being performed.
      </div>
    `,
  };
  return fieldMap[stepTitle] ?? fieldMap["Personal details"];
}

// ─── Event listeners ──────────────────────────────────────────────────────────

document.getElementById("journey-back")?.addEventListener("click", () => {
  if (state.journeyPhase === "application" || state.journeyPhase === "confirmation") {
    state.journeyPhase = "eligibility-result";
    state.submitted = false;
    renderJourneyPhase();
    return;
  }
  state.journeyPhase = null;
  state.showJourney = false;
  state.eligibility = null;
  if (state.entryMode === "full") {
    state.mode = "full";
    showViewForMode("full");
  } else {
    state.mode = "card-detail";
    showViewForMode("card-detail");
  }
  render();
});

// Expand to fullscreen button
expandBtn?.addEventListener("click", async () => {
  await app.requestDisplayMode({ mode: "fullscreen" }).catch(() => {});
});

wireDemoToolbar();

// ─── Bootstrap ────────────────────────────────────────────────────────────────

let bootstrapped = false;

async function bootstrapFromFallback() {
  if (bootstrapped) return true;

  const candidates = [
    "https://bank.myareareport.com/api/demo",
    "http://localhost:3001/api/demo",
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;
      const payload = await res.json();
      if (handleToolResult({ structuredContent: payload })) {
        bootstrapped = true;
        return true;
      }
    } catch {
      // try next candidate
    }
  }
  return false;
}

app.onhostcontextchanged = (ctx) => {
  applyHostContext(ctx);
};
app.ontoolresult = (result) => {
  if (handleToolResult(result)) bootstrapped = true;
};
app.onerror = (error) => {
  if (IS_EMBEDDED) console.error(error);
};
app.onteardown = async () => ({});

async function startApp() {
  initFeatures();
  features?.wireGlobalNav();
  const ctx = app.getHostContext();
  if (ctx) applyHostContext(ctx);

  // ChatGPT may fire ontoolresult before structuredContent is populated — retry.
  for (const delay of [400, 1200, 2500]) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    if (bootstrapped) return;
    await bootstrapFromFallback();
  }

  if (!bootstrapped) {
    showBootstrapError("Unable to load cards. Try: Show me Blackwell Bank credit cards");
  }
}

if (!IS_EMBEDDED) {
  startApp();
} else {
  app.connect().catch(() => null).then(startApp);
}
