const CREDIT_RANK = {
  poor: 0,
  fair: 1,
  good: 2,
  excellent: 3,
};

export const BRAND = {
  name: "Blackwell Bank",
  tagline: "Built around you",
};

export const CHANNELS = [
  { id: "merchant-checkout", label: "Merchant checkout" },
  { id: "marketplace", label: "Marketplace wallet" },
  { id: "digital-banking", label: "Digital banking cross-sell" },
  { id: "contact-centre", label: "Contact centre assisted journey" },
];

export const NEEDS = [
  { id: "everyday-spend", label: "Everyday spend" },
  { id: "travel", label: "Travel rewards" },
  { id: "credit-building", label: "Credit building" },
];

export const EMPLOYMENT_STATUSES = [
  { id: "employed", label: "Employed" },
  { id: "self-employed", label: "Self-employed" },
  { id: "student", label: "Student" },
];

export const CUSTOMER_TYPES = [
  { id: "new-to-bank", label: "New to bank" },
  { id: "existing-customer", label: "Existing customer" },
  { id: "pre-approved-partner", label: "Pre-approved partner lead" },
];

export const CARDS = [
  {
    id: "blackwell-rewards",
    name: "Blackwell Rewards Card",
    apr: "24.9% variable",
    aprNumeric: 24.9,
    annualFee: "£0",
    network: "VISA",
    summary: "Travel rewards. No annual fee.",
    strengths: [
      "Earn up to 1.5 points per £1 on travel and everyday spend",
      "Airport lounge access on qualifying spend",
      "No annual fee",
      "0% on purchases for 9 months",
      "Contactless payments",
      "Apple Pay & Google Pay",
    ],
    minCreditBand: "good",
    minIncome: 26000,
    rewardsRate: 1.5,
    rewardsUnit: "points",
    cashbackRate: 0,
    balanceTransferMonths: 12,
    balanceTransferFeePct: 2.9,
    loungeAccess: true,
    needs: ["travel", "everyday-spend"],
  },
  {
    id: "blackwell-cashback",
    name: "Blackwell Cashback Card",
    apr: "24.9% variable",
    aprNumeric: 24.9,
    annualFee: "£0",
    network: "Mastercard",
    summary: "Earn up to 1% cashback on everyday spending.",
    strengths: [
      "Earn up to 1% cashback on everyday spending",
      "No annual fee",
      "0% on balance transfers for 6 months",
      "Contactless payments",
      "Apple Pay & Google Pay",
    ],
    minCreditBand: "fair",
    minIncome: 16000,
    rewardsRate: 0,
    rewardsUnit: "cashback",
    cashbackRate: 1,
    balanceTransferMonths: 6,
    balanceTransferFeePct: 3.0,
    loungeAccess: false,
    needs: ["everyday-spend", "credit-building"],
  },
];

export const HUB_TILES = [
  { id: "products", label: "Products Hub", description: "Browse and compare credit cards", icon: "CC", mode: "full" },
  { id: "spend-insights", label: "Spend Insights", description: "Category breakdown and top merchants", icon: "SP", mode: "spend-insights" },
  { id: "merchant-offers", label: "Merchant Offers", description: "Activate partner cashback deals", icon: "OF", mode: "merchant-offers" },
  { id: "travel", label: "Travel Hub", description: "Register travel plans on your card", icon: "TR", mode: "travel-notice" },
  { id: "card-controls", label: "Card Controls", description: "Limits, wallet and card settings", icon: "CL", mode: "credit-limit" },
  { id: "wallet", label: "Wallet", description: "Add your card to a digital wallet", icon: "WL", mode: "wallet" },
];

const SPEND_CATEGORIES = [
  { id: "groceries", label: "Groceries", amount: 412, pct: 28, color: "#1a6647" },
  { id: "dining", label: "Dining", amount: 286, pct: 19, color: "#2d8a5e" },
  { id: "travel", label: "Travel", amount: 245, pct: 17, color: "#3aa872" },
  { id: "shopping", label: "Shopping", amount: 198, pct: 13, color: "#5bc48a" },
  { id: "utilities", label: "Utilities", amount: 156, pct: 11, color: "#7dd4a3" },
  { id: "other", label: "Other", amount: 178, pct: 12, color: "#a8e4c4" },
];

const MERCHANT_OFFERS = [
  { id: "offer-tesco", partner: "Tesco", headline: "5% back at Tesco", expires: "2026-06-30", activated: false },
  { id: "offer-trainline", partner: "Trainline", headline: "£10 off rail over £50", expires: "2026-07-15", activated: false },
  { id: "offer-deliveroo", partner: "Deliveroo", headline: "15% off first 3 orders", expires: "2026-05-31", activated: false },
];

const CATEGORY_MERCHANTS = {
  groceries: [
    { token: "MERCHANT_TOKEN_A1B2", amount: 186 },
    { token: "MERCHANT_TOKEN_J9K0", amount: 134 },
    { token: "MERCHANT_TOKEN_L1M2", amount: 92 },
  ],
  dining: [
    { token: "MERCHANT_TOKEN_C3D4", amount: 142 },
    { token: "MERCHANT_TOKEN_N3P4", amount: 88 },
    { token: "MERCHANT_TOKEN_Q5R6", amount: 56 },
  ],
  travel: [
    { token: "MERCHANT_TOKEN_E5F6", amount: 128 },
    { token: "MERCHANT_TOKEN_S7T8", amount: 74 },
    { token: "MERCHANT_TOKEN_U9V0", amount: 43 },
  ],
  shopping: [
    { token: "MERCHANT_TOKEN_G7H8", amount: 95 },
    { token: "MERCHANT_TOKEN_W1X2", amount: 62 },
    { token: "MERCHANT_TOKEN_Y3Z4", amount: 41 },
  ],
  utilities: [
    { token: "MERCHANT_TOKEN_B5C6", amount: 79 },
    { token: "MERCHANT_TOKEN_D7E8", amount: 51 },
    { token: "MERCHANT_TOKEN_F9G0", amount: 26 },
  ],
  other: [
    { token: "MERCHANT_TOKEN_H1I2", amount: 73 },
    { token: "MERCHANT_TOKEN_J3K4", amount: 59 },
    { token: "MERCHANT_TOKEN_L5M6", amount: 46 },
  ],
};

const activatedOffers = new Set();

function bandAllows(card, creditBand) {
  return CREDIT_RANK[creditBand] >= CREDIT_RANK[card.minCreditBand];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseSterlingAmount(value) {
  if (typeof value !== "string") return null;
  const numeric = Number(value.replace(/[^0-9.-]+/g, ""));
  if (!Number.isFinite(numeric)) return null;
  return numeric;
}

function toCreditLimitBucket(limit) {
  const amount = typeof limit === "number" ? limit : parseSterlingAmount(limit);
  if (!Number.isFinite(amount)) return null;
  if (amount >= 3000 && amount <= 5000) return "£3,000-£5,000";
  if (amount < 3000) return "Below £3,000";
  return "Above £5,000";
}

export function toEligibilityModelContext(eligibilityResult = {}) {
  return {
    event: "eligibility-checked",
    decision: eligibilityResult.decision ?? "unknown",
    cardName: eligibilityResult.recommendedCard?.name ?? null,
    creditLimitBucket: toCreditLimitBucket(eligibilityResult.creditLimit),
  };
}

export function toOfferModelContext(offerResult = {}) {
  return {
    event: "offer-activated",
    status: "activated",
    offerId: offerResult.offerId ?? null,
    partner: offerResult.partner ?? null,
    headline: offerResult.headline ?? null,
  };
}

export function toTravelModelContext(travelResult = {}) {
  return {
    event: "travel-notice-registered",
    reference: travelResult.reference ?? null,
    countries: Array.isArray(travelResult.countries) ? travelResult.countries : [],
    departure: travelResult.departure ?? null,
    returnDate: travelResult.returnDate ?? null,
  };
}

export function toWalletModelContext(walletResult = {}) {
  return {
    event: "wallet-provisioning",
    status: walletResult.status ?? "unknown",
    cardName: walletResult.cardName ?? null,
    network: walletResult.network ?? null,
    wallet: walletResult.wallet ?? "Apple Pay",
  };
}

export function toUnderwritingModelContext(decision = {}) {
  return {
    event: "underwriting-decision",
    status: decision.status ?? "unknown",
  };
}

export function toModelContext(event, payload = {}) {
  let context;
  switch (event) {
    case "eligibility":
    case "eligibility-checked":
      context = toEligibilityModelContext(payload);
      break;
    case "offer":
    case "offer-activated":
      context = toOfferModelContext(payload);
      break;
    case "travel":
    case "travel-notice-submitted":
      context = toTravelModelContext(payload);
      break;
    case "wallet":
    case "wallet-provisioned":
      context = toWalletModelContext(payload);
      break;
    case "underwriting":
    case "underwriting-decision":
      context = toUnderwritingModelContext(payload);
      break;
    default:
      context = {
        event,
        kind: payload?.kind ?? "unknown",
      };
      break;
  }
  return JSON.stringify(context);
}

function formatCurrencyAmount(amount) {
  if (!Number.isFinite(amount)) return null;
  return `£${Math.round(amount).toLocaleString("en-GB")}`;
}

function formatList(items = []) {
  const values = items.filter(Boolean);
  if (!values.length) return "";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

export function formatToolResultText(toolId, payload = {}) {
  if (toolId === "blackwell-check-eligibility") {
    const context = toEligibilityModelContext(payload);
    const cardCopy = context.cardName ? ` for ${context.cardName}` : "";
    const bucketCopy = context.creditLimitBucket ? `, limit bucket ${context.creditLimitBucket}` : "";
    return `Eligibility ${context.decision}${cardCopy}${bucketCopy}.`;
  }

  if (toolId === "blackwell-browse-cards") {
    const headline = payload?.recommendations?.headline;
    const names = payload?.recommendations?.cards?.map((card) => card.name) ?? [];
    const headlineCopy = headline ? `${headline}: ` : "";
    return `${headlineCopy}${formatList(names)}.`;
  }

  if (toolId === "blackwell-open-hub") {
    const tileNames = payload?.tiles?.map((tile) => tile.label) ?? [];
    return `Card Hub tiles: ${formatList(tileNames)}.`;
  }

  if (toolId === "blackwell-spend-insights") {
    const period = payload?.period ?? "current period";
    const totalSpend = formatCurrencyAmount(payload?.totalSpend);
    const spendCopy = totalSpend ? `total spend ${totalSpend}` : "spend totals available";
    const deltaValue = Number(payload?.spendDeltaPct);
    const deltaCopy = Number.isFinite(deltaValue) ? `, delta ${deltaValue > 0 ? "+" : ""}${deltaValue}%` : "";
    return `Spend insights for ${period}: ${spendCopy}${deltaCopy}.`;
  }

  if (toolId === "blackwell-merchant-offers") {
    const offers = Array.isArray(payload?.offers) ? payload.offers : [];
    const partners = offers.map((offer) => offer.partner);
    return `${offers.length} merchant offers from ${formatList(partners)}.`;
  }

  if (toolId === "blackwell-compare-cards") {
    const names = payload?.cards?.map((card) => card.name) ?? [];
    const recommendedId = payload?.recommendedCardId;
    const recommendedCard = payload?.cards?.find((card) => card.id === recommendedId);
    const bestForYouCopy = recommendedCard ? ` Best for you: ${recommendedCard.name}.` : "";
    return `Comparing ${formatList(names)}.${bestForYouCopy}`;
  }

  if (toolId === "blackwell-underwriting-decision") {
    return payload?.status === "approved"
      ? `Application approved: ${payload.applicantName ?? "Applicant"} can continue with onboarding.`
      : `Application referred: ${payload.applicantName ?? "Applicant"} needs follow-up review.`;
  }

  return null;
}

export function getCardRecommendations({
  channel = "digital-banking",
  need = "everyday-spend",
  existingCustomer = false,
  loungeAccess = false,
} = {}) {
  let cards = rankCardsByNeed(need, { loungeAccess, existingCustomer });

  return {
    kind: "card-recommendations",
    mode: "card-detail",
    filters: { channel, need, existingCustomer, loungeAccess },
    headline: need === "travel" ? "Best for travel" : "Recommended for you",
    cards: clone(cards),
    needSummary: describeNeed(need, loungeAccess),
  };
}

export function rankCardsByNeed(need = "everyday-spend", { loungeAccess = false, existingCustomer = false } = {}) {
  const cards = [...CARDS];

  if (need === "travel" || loungeAccess) {
    cards.sort((a, b) => {
      if (a.loungeAccess !== b.loungeAccess) return a.loungeAccess ? -1 : 1;
      return a.id === "blackwell-rewards" ? -1 : 1;
    });
  } else if (need === "credit-building") {
    cards.sort((a) => (a.id === "blackwell-cashback" ? -1 : 1));
  } else {
    cards.sort((a) => (a.id === "blackwell-cashback" ? -1 : 1));
  }

  if (existingCustomer) {
    cards.sort((a, b) => {
      if (a.id === "blackwell-cashback") return -1;
      if (b.id === "blackwell-cashback") return 1;
      return 0;
    });
  }

  return cards;
}

function describeNeed(need, loungeAccess) {
  if (loungeAccess || need === "travel") {
    return "Ranked for travel rewards and lounge access";
  }
  if (need === "credit-building") {
    return "Ranked for credit building and everyday cashback";
  }
  return "Ranked for everyday spending value";
}

export function getPersonalisedProfile(existingCustomer = false) {
  if (!existingCustomer) return null;
  return {
    firstName: "Sarah",
    customerSince: "2019",
    preApprovedLimit: "£4,500",
    productHoldings: ["Current account", "Rewards Card"],
    greeting: "Welcome back, Sarah",
    subline: "You're pre-approved for up to £4,500 on a new card",
    personalisedReason: "Based on your grocery spend, Cashback could earn you ~£14/month",
  };
}

export function getCompareRecommendation(cardIds = [], need = "everyday-spend") {
  const cards = cardIds.map((id) => CARDS.find((c) => c.id === id)).filter(Boolean);
  if (!cards.length) return null;

  if (need === "travel") {
    return cards.find((card) => card.id === "blackwell-rewards")?.id
      ?? cards.find((card) => card.loungeAccess)?.id
      ?? cards[0].id;
  }

  if (need === "everyday-spend" || need === "credit-building") {
    return cards.find((card) => card.id === "blackwell-cashback")?.id
      ?? cards.sort((a, b) => b.cashbackRate - a.cashbackRate)[0].id;
  }

  return cards[0].id;
}

export function getCardComparison(cardIds = [], need = null) {
  const ids = cardIds.length >= 2 ? cardIds : CARDS.map((c) => c.id);
  const cards = ids.map((id) => CARDS.find((c) => c.id === id)).filter(Boolean);
  const rows = [
    { label: "Annual fee", key: "annualFee" },
    { label: "Representative APR", key: "apr" },
    { label: "Rewards rate", fn: (c) => (c.cashbackRate ? `${c.cashbackRate}% cashback` : `${c.rewardsRate} ${c.rewardsUnit}/£1`) },
    { label: "Lounge access", fn: (c) => (c.loungeAccess ? "Yes" : "No") },
    { label: "0% balance transfer", fn: (c) => `${c.balanceTransferMonths} months` },
    { label: "Min. income", fn: (c) => `£${c.minIncome.toLocaleString("en-GB")}` },
  ];

  return {
    kind: "card-comparison",
    mode: "compare",
    cardIds: cards.map((c) => c.id),
    recommendedCardId: need ? getCompareRecommendation(cards.map((c) => c.id), need) : null,
    cards: clone(cards),
    rows: rows.map((row) => ({
      label: row.label,
      values: cards.map((card) => (row.fn ? row.fn(card) : card[row.key])),
    })),
  };
}

export function calculateRewards(cardId = "blackwell-rewards", monthlySpend = 1500) {
  const card = CARDS.find((c) => c.id === cardId) ?? CARDS[0];
  const spend = Math.max(0, Number(monthlySpend));
  let annualValue;
  let displayUnit;

  if (card.cashbackRate > 0) {
    annualValue = Math.round(spend * 12 * (card.cashbackRate / 100));
    displayUnit = "cashback";
  } else {
    annualValue = Math.round(spend * 12 * card.rewardsRate);
    displayUnit = card.rewardsUnit;
  }

  return {
    kind: "rewards-calculator",
    mode: "calculator",
    cardId: card.id,
    cardName: card.name,
    monthlySpend: spend,
    annualValue,
    displayUnit,
    headline: card.cashbackRate
      ? `Up to £${annualValue}/year cashback`
      : `Up to ${annualValue.toLocaleString("en-GB")} ${displayUnit}/year`,
    disclaimer: "Illustrative only. Actual rewards depend on spend categories and T&Cs.",
  };
}

export function estimateBalanceTransfer({ amount = 3000, currentApr = 19.9, cardId = "blackwell-cashback" } = {}) {
  const card = CARDS.find((c) => c.id === cardId) ?? CARDS[0];
  const transferAmount = Math.max(0, Number(amount));
  const fee = Math.round(transferAmount * (card.balanceTransferFeePct / 100));
  const promoMonths = card.balanceTransferMonths;
  const monthlyInterestSaved = Math.round((transferAmount * (currentApr / 100)) / 12);
  const promoSaving = monthlyInterestSaved * promoMonths;
  const netSaving = promoSaving - fee;

  return {
    kind: "balance-transfer-estimate",
    mode: "balance-transfer",
    cardId: card.id,
    cardName: card.name,
    transferAmount,
    currentApr,
    fee,
    feePct: card.balanceTransferFeePct,
    promoMonths,
    estimatedSaving: Math.max(0, netSaving),
    headline: `0% for ${promoMonths} months on balance transfers`,
    disclaimer:
      "This is an estimate, not a guarantee. Assumes no further spending and minimum payments. Credit subject to status.",
  };
}

export function serializeApplicationDraft({ cardId, stepIndex, formData, applicantName }) {
  return {
    kind: "application-draft",
    savedAt: new Date().toISOString(),
    cardId,
    stepIndex,
    formData,
    applicantName: applicantName ?? "Alex",
  };
}

export function restoreApplicationDraft(draft) {
  if (!draft?.cardId) return null;
  const journey = createApplicationJourney({ cardId: draft.cardId });
  const idx = Math.min(draft.stepIndex ?? 0, journey.steps.length - 1);
  journey.steps = journey.steps.map((step, i) => ({
    ...step,
    status: i < idx ? "done" : i === idx ? "current" : "up-next",
  }));
  journey.resumed = true;
  journey.draftFormData = draft.formData ?? {};
  journey.applicantName = draft.applicantName;
  return journey;
}

export function createVerificationStep() {
  return {
    title: "Identity verification",
    status: "up-next",
    detail: "Upload a photo ID and take a quick selfie check.",
    verificationStatus: "pending",
  };
}

export function markVerificationUploaded() {
  return {
    kind: "verification-uploaded",
    verificationStatus: "pending",
    message: "Documents received — verification in progress",
  };
}

export function createUnderwritingDecision(applicantName = "Alex", creditBand = "good") {
  const approved = creditBand !== "fair" || Math.random() > 0.3;
  return {
    kind: "underwriting-decision",
    status: approved ? "approved" : "referred",
    applicantName,
    decisionAt: new Date().toISOString(),
    creditLimit: approved ? "£4,000" : null,
    message: approved
      ? `${applicantName}, your application has been approved.`
      : `${applicantName}, we need a little more time to review your application.`,
  };
}

export function createDeliveryTracker(currentStepId = "dispatched") {
  const steps = [
    { id: "approved", label: "Approved" },
    { id: "dispatched", label: "Card dispatched" },
    { id: "out-for-delivery", label: "Out for delivery" },
    { id: "activate", label: "Activate in app" },
  ];
  const currentIndex = Math.max(0, steps.findIndex((step) => step.id === currentStepId));
  return {
    kind: "delivery-tracker",
    currentStepId: steps[currentIndex].id,
    steps: steps.map((step, index) => ({
      ...step,
      status: index < currentIndex ? "done" : index === currentIndex ? "current" : "up-next",
    })),
  };
}

export function getCategoryMerchants(categoryId) {
  if (!categoryId || !CATEGORY_MERCHANTS[categoryId]) return [];
  return clone(CATEGORY_MERCHANTS[categoryId]);
}

export function getSpendInsights() {
  const total = SPEND_CATEGORIES.reduce((sum, c) => sum + c.amount, 0);
  const topMerchants = Object.entries(CATEGORY_MERCHANTS)
    .flatMap(([categoryId, merchants]) =>
      merchants.map((merchant) => ({
        ...merchant,
        categoryId,
        category: SPEND_CATEGORIES.find((c) => c.id === categoryId)?.label ?? "Other",
      })),
    )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);
  return {
    kind: "spend-insights",
    mode: "spend-insights",
    period: "April 2026",
    totalSpend: total,
    spendDeltaPct: 8,
    categories: clone(SPEND_CATEGORIES),
    topMerchants: clone(topMerchants),
    disclaimer: "Merchant names are tokenised in model-visible context.",
  };
}

export function getMerchantOffers() {
  return {
    kind: "merchant-offers",
    mode: "merchant-offers",
    estimatedOfferSavings: 37,
    offers: MERCHANT_OFFERS.map((o) => ({
      ...o,
      activated: activatedOffers.has(o.id),
    })),
  };
}

export function activateOffer(offerId) {
  activatedOffers.add(offerId);
  const offer = MERCHANT_OFFERS.find((o) => o.id === offerId);
  const activationCopy = offer?.partner === "Tesco"
    ? "Tesco offer activated - 5% back on your next shop"
    : `${offer?.partner ?? "Partner"} offer activated - ready on your next eligible purchase`;
  return {
    kind: "offer-activated",
    offerId,
    partner: offer?.partner ?? "Partner",
    headline: offer?.headline ?? "",
    activationCopy,
    message: activationCopy,
  };
}

export function getTravelNoticeForm() {
  return {
    kind: "travel-notice",
    mode: "travel-notice",
    countries: ["France", "Spain", "United States", "Japan", "Australia"],
    defaultDeparture: "2026-06-01",
    defaultReturn: "2026-06-14",
    cardLastFour: "4821",
    disclaimer: "Registering travel helps us protect your card abroad. This is not travel insurance.",
  };
}

export function submitTravelNotice({ countries = [], departure, returnDate }) {
  return {
    kind: "travel-notice-submitted",
    reference: `TN-${Date.now().toString(36).toUpperCase()}`,
    countries,
    departure,
    returnDate,
    cardLastFour: "4821",
    message: "Travel notice registered on card ending 4821",
  };
}

export function getCreditLimitOffer(existingCustomer = true) {
  return {
    kind: "credit-limit-offer",
    mode: "credit-limit",
    currentLimit: "£3,500",
    indicativeIncrease: "£500",
    newLimit: "£4,000",
    currentLimitAmount: 3500,
    newLimitAmount: 4000,
    eligible: existingCustomer,
    disclaimer:
      "Indicative only — not a guarantee. A soft check has been run; a hard check applies if you accept.",
  };
}

export function getWalletProvisioning(cardId = "blackwell-rewards") {
  const card = CARDS.find((c) => c.id === cardId) ?? CARDS[0];
  return {
    kind: "wallet-provision",
    mode: "wallet",
    cardId: card.id,
    cardName: card.name,
    network: card.network,
    lastFour: "4821",
    wallets: ["Apple Pay", "Google Pay"],
    status: "ready",
    statusLabel: "Ready to add",
  };
}

export function provisionWallet(cardId) {
  const payload = getWalletProvisioning(cardId);
  return {
    kind: "wallet-provisioned",
    ...payload,
    status: "provisioned",
    message: `${payload.cardName} added to Apple Pay`,
  };
}

export function getHubPayload() {
  return {
    kind: "card-hub",
    mode: "hub",
    brand: BRAND,
    tiles: clone(HUB_TILES),
    headline: "Your Blackwell Card Hub",
    subtitle: "Everyday controls and insights in one place",
  };
}

export function runEligibilityCheck({
  creditBand = "good",
  annualIncome = 42000,
  employmentStatus = "employed",
  existingCustomer = false,
  cardId = null,
} = {}) {
  const normalizedIncome = Number(annualIncome);
  const eligibleCards = CARDS.filter(
    (card) => bandAllows(card, creditBand) && normalizedIncome >= card.minIncome,
  );

  const decision = eligibleCards.length ? "pre-qualified" : "refer";
  const targetCard = cardId ? CARDS.find((c) => c.id === cardId) : null;
  const recommendedCard =
    targetCard ??
    eligibleCards.find((card) => existingCustomer && card.id === "blackwell-cashback") ??
    eligibleCards[0] ??
    null;

  return {
    kind: "eligibility-check",
    mode: "eligibility",
    applicant: { creditBand, annualIncome: normalizedIncome, employmentStatus, existingCustomer },
    decision,
    creditLimit: eligibleCards.length ? "£4,000" : null,
    recommendedCard: clone(recommendedCard),
    eligibleCards: clone(eligibleCards),
  };
}

export function createApplicationJourney({
  cardId = "blackwell-cashback",
  customerType = "new-to-bank",
  leadSource = "digital-banking",
  includeVerification = true,
} = {}) {
  const card = CARDS.find((item) => item.id === cardId) ?? CARDS[0];
  const isExistingCustomer = customerType === "existing-customer";

  const steps = [
    {
      title: "Personal details",
      status: "current",
      detail: "Name, date of birth, email and mobile number.",
    },
    {
      title: "Address",
      status: "up-next",
      detail: isExistingCustomer
        ? "Pre-fill address details from your profile."
        : "Your current and previous addresses.",
    },
    {
      title: "Employment",
      status: "up-next",
      detail: "Employment status and annual income.",
    },
  ];

  if (includeVerification) {
    steps.push(createVerificationStep());
  }

  steps.push(
    {
      title: "Review",
      status: "up-next",
      detail: "Check your application before submitting.",
    },
    {
      title: "Decision",
      status: "up-next",
      detail: "Instant decision in most cases.",
    },
  );

  return {
    kind: "application-journey",
    mode: "application",
    card: clone(card),
    customerType,
    leadSource,
    steps,
    verificationStatus: "not-started",
  };
}

export function getDemoPayload({
  channel = "digital-banking",
  need = "everyday-spend",
  creditBand = "good",
  annualIncome = 42000,
  employmentStatus = "employed",
  existingCustomer = false,
  customerType,
  loungeAccess = false,
} = {}) {
  const recommendations = getCardRecommendations({ channel, need, existingCustomer, loungeAccess });
  const eligibility = runEligibilityCheck({ creditBand, annualIncome, employmentStatus, existingCustomer });
  const applicationJourney = createApplicationJourney({
    cardId: eligibility.recommendedCard?.id ?? recommendations.cards[0]?.id,
    customerType: customerType ?? (existingCustomer ? "existing-customer" : "new-to-bank"),
    leadSource: channel,
  });
  const profile = getPersonalisedProfile(existingCustomer);

  return {
    kind: "embedded-sales-demo",
    mode: "full",
    brand: BRAND,
    profile,
    recommendations,
    eligibility,
    applicationJourney,
    existingCustomer,
  };
}
