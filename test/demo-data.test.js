import test from "node:test";
import assert from "node:assert/strict";
import {
  activateOffer,
  calculateRewards,
  createDeliveryTracker,
  createApplicationJourney,
  estimateBalanceTransfer,
  formatToolResultText,
  getCategoryMerchants,
  getCardComparison,
  getCompareRecommendation,
  getCardRecommendations,
  getCreditLimitOffer,
  getDemoPayload,
  getHubPayload,
  getMerchantOffers,
  getPersonalisedProfile,
  getSpendInsights,
  getWalletProvisioning,
  rankCardsByNeed,
  restoreApplicationDraft,
  runEligibilityCheck,
  serializeApplicationDraft,
  toEligibilityModelContext,
  toOfferModelContext,
  toTravelModelContext,
} from "../src/demo-data.js";

test("card recommendations put cashback first for everyday-spend need", () => {
  const result = getCardRecommendations({
    channel: "merchant-checkout",
    need: "everyday-spend",
    existingCustomer: true,
  });

  assert.equal(result.kind, "card-recommendations");
  assert.equal(result.cards[0].id, "blackwell-cashback");
  assert.ok(result.cards.length >= 2);
});

test("card recommendations put rewards first for travel need", () => {
  const result = getCardRecommendations({ channel: "marketplace", need: "travel" });
  assert.equal(result.cards[0].id, "blackwell-rewards");
});

test("rankCardsByNeed prioritises lounge access for travel", () => {
  const cards = rankCardsByNeed("travel", { loungeAccess: true });
  assert.equal(cards[0].id, "blackwell-rewards");
  assert.equal(cards[0].loungeAccess, true);
});

test("eligibility check returns a referred path when profile is too weak", () => {
  const result = runEligibilityCheck({
    creditBand: "fair",
    annualIncome: 12000,
    employmentStatus: "student",
    existingCustomer: false,
  });

  assert.equal(result.decision, "refer");
  assert.equal(result.recommendedCard, null);
  assert.equal(result.creditLimit, null);
});

test("eligibility check includes credit limit for pre-qualified applicant", () => {
  const result = runEligibilityCheck({
    creditBand: "good",
    annualIncome: 42000,
    employmentStatus: "employed",
  });

  assert.equal(result.decision, "pre-qualified");
  assert.equal(result.creditLimit, "£4,000");
  assert.ok(result.recommendedCard !== null);
});

test("application journey includes identity verification step", () => {
  const result = createApplicationJourney({
    cardId: "blackwell-cashback",
    customerType: "existing-customer",
    leadSource: "digital-banking",
  });

  assert.equal(result.steps.length, 6);
  assert.equal(result.steps[0].status, "current");
  assert.match(result.steps[1].detail, /Pre-fill address/);
  assert.equal(result.steps[3].title, "Identity verification");
});

test("demo payload combines discovery, eligibility and journey for travel intent", () => {
  const result = getDemoPayload({
    channel: "marketplace",
    need: "travel",
    creditBand: "excellent",
    annualIncome: 70000,
    employmentStatus: "employed",
  });

  assert.equal(result.kind, "embedded-sales-demo");
  assert.equal(result.mode, "full");
  assert.equal(result.recommendations.cards[0].id, "blackwell-rewards");
  assert.ok(result.recommendations.cards.length >= 2);
});

test("personalised profile returns data for existing customers only", () => {
  assert.equal(getPersonalisedProfile(false), null);
  const profile = getPersonalisedProfile(true);
  assert.equal(profile.firstName, "Sarah");
  assert.match(profile.subline, /£4,500/);
  assert.match(profile.personalisedReason, /Cashback could earn/);
});

test("card comparison returns rows for two cards", () => {
  const result = getCardComparison(["blackwell-rewards", "blackwell-cashback"], "everyday-spend");
  assert.equal(result.mode, "compare");
  assert.equal(result.cards.length, 2);
  assert.ok(result.rows.length >= 4);
  assert.equal(result.recommendedCardId, "blackwell-cashback");
});

test("comparison recommendation picks rewards card for travel", () => {
  const recommended = getCompareRecommendation(["blackwell-cashback", "blackwell-rewards"], "travel");
  assert.equal(recommended, "blackwell-rewards");
});

test("comparison recommendation picks cashback card for everyday spend", () => {
  const recommended = getCompareRecommendation(["blackwell-rewards", "blackwell-cashback"], "everyday-spend");
  assert.equal(recommended, "blackwell-cashback");
});

test("rewards calculator returns annual value", () => {
  const result = calculateRewards("blackwell-cashback", 1000);
  assert.equal(result.annualValue, 120);
  assert.equal(result.displayUnit, "cashback");
});

test("balance transfer estimate includes fee and saving", () => {
  const result = estimateBalanceTransfer({ amount: 3000, currentApr: 19.9 });
  assert.equal(result.fee, 90);
  assert.ok(result.estimatedSaving > 0);
});

test("application draft round-trips through restore", () => {
  const draft = serializeApplicationDraft({
    cardId: "blackwell-rewards",
    stepIndex: 2,
    formData: { fullName: "Alex Morgan" },
  });
  const journey = restoreApplicationDraft(draft);
  assert.equal(journey.resumed, true);
  assert.equal(journey.steps[2].status, "current");
  assert.equal(journey.draftFormData.fullName, "Alex Morgan");
});

test("spend insights returns categories and tokenised merchants", () => {
  const result = getSpendInsights();
  assert.equal(result.mode, "spend-insights");
  assert.ok(result.categories.length >= 4);
  assert.match(result.topMerchants[0].token, /MERCHANT_TOKEN/);
});

test("category merchant drill-down returns merchants for a category", () => {
  const merchants = getCategoryMerchants("groceries");
  assert.equal(merchants.length, 3);
  assert.match(merchants[0].token, /MERCHANT_TOKEN/);
});

test("delivery tracker marks approved as done immediately", () => {
  const tracker = createDeliveryTracker("dispatched");
  assert.equal(tracker.steps[0].status, "done");
  assert.equal(tracker.steps[1].status, "current");
  assert.equal(tracker.steps[3].status, "up-next");
});

test("merchant offer activation updates state", () => {
  const before = getMerchantOffers();
  const inactive = before.offers.find((o) => !o.activated);
  activateOffer(inactive.id);
  const after = getMerchantOffers();
  assert.equal(after.offers.find((o) => o.id === inactive.id).activated, true);
});

test("hub payload includes domain tiles", () => {
  const hub = getHubPayload();
  assert.equal(hub.mode, "hub");
  assert.ok(hub.tiles.some((t) => t.id === "spend-insights"));
});

test("credit limit offer is indicative only", () => {
  const offer = getCreditLimitOffer(true);
  assert.match(offer.disclaimer, /not a guarantee/i);
});

test("wallet provisioning lists Apple Pay", () => {
  const wallet = getWalletProvisioning("blackwell-rewards");
  assert.ok(wallet.wallets.includes("Apple Pay"));
});

test("eligibility model context buckets limit and omits raw income", () => {
  const eligibility = runEligibilityCheck({
    creditBand: "good",
    annualIncome: 42000,
    employmentStatus: "employed",
    cardId: "blackwell-cashback",
  });
  const context = toEligibilityModelContext(eligibility);
  assert.equal(context.creditLimitBucket, "£3,000-£5,000");
  assert.equal(context.cardName, "Blackwell Cashback Card");
  assert.equal(context.decision, "pre-qualified");
  assert.equal("annualIncome" in context, false);
});

test("travel model context has no sensitive fields", () => {
  const context = toTravelModelContext({
    countries: ["France", "Spain"],
    departure: "2026-06-01",
    returnDate: "2026-06-14",
    reference: "TN-XYZ",
    cardLastFour: "4821",
    pan: "4111111111111111",
    documentContent: "passport-image",
  });
  assert.equal(context.reference, "TN-XYZ");
  assert.deepEqual(context.countries, ["France", "Spain"]);
  assert.equal("cardLastFour" in context, false);
  assert.equal("pan" in context, false);
  assert.equal("documentContent" in context, false);
});

test("offer model context shape is stable", () => {
  const context = toOfferModelContext({
    offerId: "offer-tesco",
    partner: "Tesco",
    headline: "5% back at Tesco",
  });
  assert.deepEqual(context, {
    event: "offer-activated",
    status: "activated",
    offerId: "offer-tesco",
    partner: "Tesco",
    headline: "5% back at Tesco",
  });
});

test("tool result copy for eligibility uses bucketed limit and card name", () => {
  const eligibility = runEligibilityCheck({
    creditBand: "good",
    annualIncome: 42000,
    employmentStatus: "employed",
    cardId: "blackwell-cashback",
  });
  const copy = formatToolResultText("blackwell-check-eligibility", eligibility);
  assert.match(copy, /pre-qualified/);
  assert.match(copy, /Blackwell Cashback Card/);
  assert.match(copy, /£3,000-£5,000/);
  assert.equal(copy.includes("£4,000"), false);
});

test("tool result copy for spend insights includes period, total, and delta", () => {
  const copy = formatToolResultText("blackwell-spend-insights", getSpendInsights());
  assert.match(copy, /April 2026/);
  assert.match(copy, /£1,475/);
  assert.match(copy, /\+8%/);
});

test("tool result copy for compare cards includes recommendation", () => {
  const comparison = getCardComparison(["blackwell-cashback", "blackwell-rewards"], "everyday-spend");
  const copy = formatToolResultText("blackwell-compare-cards", comparison);
  assert.match(copy, /Blackwell Cashback Card/);
  assert.match(copy, /Blackwell Rewards Card/);
  assert.match(copy, /Best for you: Blackwell Cashback Card/);
});

test("tool result copy for underwriting matches chat phrasing", () => {
  const approvedCopy = formatToolResultText("blackwell-underwriting-decision", {
    status: "approved",
    applicantName: "Alex",
  });
  assert.equal(
    approvedCopy,
    "Application approved: Alex can continue with onboarding.",
  );
  const referredCopy = formatToolResultText("blackwell-underwriting-decision", {
    status: "referred",
    applicantName: "Alex",
  });
  assert.equal(
    referredCopy,
    "Application referred: Alex needs follow-up review.",
  );
});
