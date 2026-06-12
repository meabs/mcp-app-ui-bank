/** Feature views and journey helpers — imported by mcp-app.js */

export function createFeatureViews(ctx) {
  const {
    state,
    app,
    DRAFT_STORAGE_KEY,
    callServerTool,
    showViewForMode,
    notifyHostSize,
    pushModelContext,
  } = ctx;
  const {
    calculateRewards,
    createDeliveryTracker,
    estimateBalanceTransfer,
    getCreditLimitOffer,
    getCategoryMerchants,
    getCompareRecommendation,
    getCardComparison,
    getDemoPayload,
    getHubPayload,
    getMerchantOffers,
    getSpendInsights,
    getTravelNoticeForm,
    getWalletProvisioning,
    restoreApplicationDraft,
    serializeApplicationDraft,
  } = ctx.demoData;
  const { handleToolResult } = ctx;
  let offerFeedbackTimer = null;

  function extractPayload(result) {
    if (!result || typeof result !== "object") return {};
    if (result.structuredContent && typeof result.structuredContent === "object") return result.structuredContent;
    if (result.params?.structuredContent && typeof result.params.structuredContent === "object") return result.params.structuredContent;
    if (result.kind) return result;
    return {};
  }

  function saveDraftToStorage(draft) {
    try { localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft)); } catch { /* sandbox */ }
  }

  function renderPanelState(el, title, message, actionLabel = null) {
    if (!el) return;
    el.innerHTML = `
      <div class="empty-state">
        <strong>${title}</strong>
        <p>${message}</p>
        ${actionLabel ? `<button type="button" class="btn-secondary" data-state-action>${actionLabel}</button>` : ""}
      </div>`;
  }

  function needLabel(need) {
    const labels = {
      travel: "travel",
      "everyday-spend": "everyday",
      "credit-building": "credit building",
    };
    return labels[need] ?? "everyday";
  }

  function localHubPayload(hubId) {
    const map = {
      products: getDemoPayload?.({ existingCustomer: true }),
      "spend-insights": getSpendInsights?.(),
      "merchant-offers": getMerchantOffers?.(),
      travel: getTravelNoticeForm?.(),
      "card-controls": getCreditLimitOffer?.(true),
      wallet: getWalletProvisioning?.(),
      hub: getHubPayload?.(),
    };
    return map[hubId] ?? null;
  }

  function loadDraftFromStorage() {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function tryResumeDraft() {
    const draft = loadDraftFromStorage();
    if (!draft?.cardId) return;
    state.applicationJourney = restoreApplicationDraft(draft);
    state.formData = draft.formData ?? {};
    state.applicantName = draft.applicantName ?? "Alex";
  }

  function beginAsyncUnderwriting() {
    setTimeout(async () => {
      if (state.underwritingStatus !== "reviewing") return;
      await callServerTool("blackwell-underwriting-decision", {
        applicantName: state.applicantName,
        creditBand: state.eligibility?.applicant?.creditBand ?? "good",
      });
    }, 2800);
  }

  function notifyUnderwritingDecision(decision) {
    const decisionMessage = decision?.status === "approved"
      ? `Application approved: ${decision.applicantName ?? "Applicant"} can continue with onboarding.`
      : `Application referred: ${decision.applicantName ?? "Applicant"} needs follow-up review.`;
    if (window.parent === window) {
      pushModelContext?.("underwriting-decision", decision);
      return;
    }
    try {
      app.sendMessage({
        role: "user",
        content: [{ type: "text", text: decisionMessage }],
      }).catch(() => {});
    } catch { /* optional */ }
    pushModelContext?.("underwriting-decision", decision);
  }

  function bindSaveExit(formId, steps, formContainer) {
    document.getElementById(`${formId}-save`)?.addEventListener("click", () => {
      const form = document.getElementById(`${formId}-form`);
      if (form) {
        const fd = new FormData(form);
        for (const [k, v] of fd.entries()) state.formData[k] = v.toString();
      }
      const stepIndex = steps.findIndex((s) => s.status === "current");
      const draft = serializeApplicationDraft({
        cardId: state.applicationJourney.card.id,
        stepIndex,
        formData: state.formData,
        applicantName: state.applicantName,
      });
      saveDraftToStorage(draft);
      callServerTool("blackwell-save-application", {
        cardId: draft.cardId,
        stepIndex: draft.stepIndex,
      });
      formContainer.innerHTML = `<p style="text-align:center;padding:24px;color:var(--bw-muted);">Application saved. Reopen to resume.</p>`;
    });
  }

  function advanceStep(steps, progressId, formId, formContainer, card, getFormFieldsForStep) {
    const idx = steps.findIndex((s) => s.status === "current");
    if (idx < 0 || idx >= steps.length - 1) return;
    steps[idx].status = "done";
    steps[idx + 1].status = "current";
    state.stepIndex = idx + 1;
    renderJourney(progressId, formId, getFormFieldsForStep);
  }

  function renderConfirmation(container, card) {
    if (state.underwritingStatus === "reviewing") {
      container.innerHTML = `
        <div class="reviewing-panel">
          <div class="reviewing-spinner"></div>
          <h2 class="confirmation-title">Reviewing your application</h2>
          <p class="confirmation-subtitle">Thanks, ${state.applicantName}. This usually takes a few moments…</p>
        </div>`;
      return;
    }

    const decision = state.underwritingDecision;
    const approved = decision?.status === "approved";
    const referred = decision?.status === "referred";
    const deliveryTracker = approved
      ? (createDeliveryTracker?.() ?? {
        steps: [
          { id: "approved", label: "Approved", status: "done" },
          { id: "dispatched", label: "Card dispatched", status: "current" },
          { id: "out-for-delivery", label: "Out for delivery", status: "up-next" },
          { id: "activate", label: "Activate in app", status: "up-next" },
        ],
      })
      : null;
    container.innerHTML = `
      <div class="confirmation-panel">
        <div class="confirmation-sparkle-wrap" aria-hidden="true">
          <div class="confirmation-icon ${approved ? "is-approved" : "is-referred"}">${approved ? "✓" : "…"}</div>
        </div>
        <h2 class="confirmation-title ${approved ? "decision-approved" : "decision-referred"}">
          ${approved ? "Application approved" : "Application update"}
        </h2>
        <p class="confirmation-subtitle">${decision?.message ?? `Thanks, ${state.applicantName}.`}</p>
        ${approved && decision?.creditLimit ? `<p class="calc-result">Credit limit: <strong>${decision.creditLimit}</strong></p>` : ""}
        ${approved && deliveryTracker ? `
          <div class="delivery-tracker">
            <h3 class="delivery-tracker-title">Your card journey</h3>
            <div class="delivery-tracker-steps">
              ${deliveryTracker.steps.map((step, index) => `
                <div class="delivery-step ${step.status}">
                  <div class="delivery-step-dot">${step.status === "done" ? "✓" : index + 1}</div>
                  <span>${step.label}</span>
                </div>`).join("")}
            </div>
          </div>
        ` : ""}
        ${referred ? `
          <div class="recovery-panel">
            <h3>What happens next</h3>
            <p>Thanks for your application. We need a little more information to complete this review.</p>
            <ul>
              <li>Most referrals are resolved quickly once details are confirmed.</li>
              <li>You can choose another card option today.</li>
            </ul>
          </div>
        ` : ""}
        ${referred ? `
          <div class="confirmation-actions">
            <button class="btn-primary" id="try-different-card-btn">Try a different card</button>
            <button class="btn-secondary" id="visit-branch-btn">Visit a branch</button>
            <button class="btn-secondary" id="check-eligibility-again-btn">Check eligibility again</button>
          </div>
        ` : `<button class="btn-secondary" id="return-to-card-btn">Return to card details</button>`}
      </div>`;
    container.innerHTML = container.innerHTML.replace(/motion\.div>/g, "div>").replace(/<\/motion\.div>/g, "</div>");

    document.getElementById("return-to-card-btn")?.addEventListener("click", () => {
      state.submitted = false;
      state.underwritingStatus = null;
      state.underwritingDecision = null;
      state.showJourney = false;
      state.journeyPhase = null;
      state.eligibility = null;
      document.getElementById("full-journey-section")?.classList.add("hidden");
      state.mode = state.entryMode === "full" ? "full" : "journey";
      showViewForMode(state.mode);
      ctx.render();
    });

    document.getElementById("try-different-card-btn")?.addEventListener("click", () => {
      state.submitted = false;
      state.underwritingStatus = null;
      state.underwritingDecision = null;
      state.showJourney = false;
      state.journeyPhase = null;
      state.eligibility = null;
      document.getElementById("full-journey-section")?.classList.add("hidden");
      state.mode = state.entryMode === "full" ? "full" : "card-detail";
      showViewForMode(state.mode);
      ctx.render();
    });

    document.getElementById("visit-branch-btn")?.addEventListener("click", () => {
      const panel = container.querySelector(".recovery-panel");
      if (!panel || panel.querySelector(".recovery-note")) return;
      panel.insertAdjacentHTML(
        "beforeend",
        `<p class="recovery-note">Branch support can confirm next steps and help complete your application.</p>`,
      );
    });

    document.getElementById("check-eligibility-again-btn")?.addEventListener("click", () => {
      state.submitted = false;
      state.underwritingStatus = null;
      state.underwritingDecision = null;
      state.journeyPhase = "eligibility-form";
      state.showJourney = true;
      state.eligibility = null;
      if (state.entryMode === "full") {
        state.mode = "full";
        document.getElementById("full-journey-section")?.classList.remove("hidden");
        showViewForMode("full");
      } else {
        state.mode = "journey";
        showViewForMode("journey");
      }
      ctx.render();
    });
  }

  function renderJourney(progressId, formId, getFormFieldsForStep) {
    const progressContainer = document.getElementById(progressId);
    const formContainer = document.getElementById(formId);
    if (!progressContainer || !formContainer || !state.applicationJourney) return;

    const { steps, card } = state.applicationJourney;

    if (state.submitted || state.underwritingStatus) {
      renderConfirmation(formContainer, card);
      return;
    }

    progressContainer.innerHTML = steps.map((step, i) => {
      const node = `<div class="step-node ${step.status}"><div class="step-dot">${step.status === "done" ? "✓" : i + 1}</div><span class="step-label">${step.title}</span></div>`;
      const line = i < steps.length - 1 ? `<div class="step-line ${step.status === "done" ? "done" : ""}"></div>` : "";
      return node + line;
    }).join("").replace(/motion\.div/g, "div");

    const currentStep = steps.find((s) => s.status === "current") ?? steps[0];

    if (currentStep.title === "Identity verification") {
      formContainer.innerHTML = `
        <h3 style="margin:0 0 8px;font-size:1rem;font-weight:700;">Verify your identity</h3>
        <p style="margin:0 0 14px;font-size:0.82rem;color:var(--bw-muted);">Upload a photo ID and take a quick selfie check.</p>
        <button type="button" class="upload-zone" id="${formId}-upload-id">Upload photo ID</button>
        <button type="button" class="upload-zone" id="${formId}-upload-selfie">Take a selfie</button>
        <p class="disclaimer-text">Model sees verification: pending only.</p>
        <div class="form-actions">
          <button type="button" class="btn-link" id="${formId}-save">Save and exit</button>
          <button type="button" class="btn-primary form-continue-btn" id="${formId}-verify-continue" disabled>Continue</button>
        </div>`;
      const syncContinue = () => {
        const btn = document.getElementById(`${formId}-verify-continue`);
        if (btn) btn.disabled = !(state.verificationIdUploaded && state.verificationSelfieUploaded);
      };
      const markUploaded = (zoneId, label) => {
        const zone = document.getElementById(zoneId);
        if (!zone) return;
        zone.classList.add("is-done");
        zone.textContent = label;
      };
      document.getElementById(`${formId}-upload-id`)?.addEventListener("click", () => {
        if (state.verificationIdUploaded) return;
        state.verificationIdUploaded = true;
        markUploaded(`${formId}-upload-id`, "Photo ID uploaded");
        callServerTool("blackwell-upload-verification", { documentType: "passport" });
        syncContinue();
      });
      document.getElementById(`${formId}-upload-selfie`)?.addEventListener("click", () => {
        if (state.verificationSelfieUploaded) return;
        state.verificationSelfieUploaded = true;
        markUploaded(`${formId}-upload-selfie`, "Selfie captured");
        syncContinue();
      });
      document.getElementById(`${formId}-verify-continue`)?.addEventListener("click", () => advanceStep(steps, progressId, formId, formContainer, card, getFormFieldsForStep));
      bindSaveExit(formId, steps, formContainer);
      return;
    }

    formContainer.innerHTML = `
      <form class="app-form" id="${formId}-form" novalidate>
        <h3 style="margin:0 0 4px;font-size:1rem;font-weight:700;">${currentStep.title}</h3>
        <p style="margin:0 0 14px;font-size:0.82rem;color:var(--bw-muted);">${currentStep.detail ?? ""}</p>
        ${getFormFieldsForStep(currentStep.title)}
        <div class="form-actions">
          <button type="button" class="btn-link" id="${formId}-save">Save and exit</button>
          <button type="submit" class="btn-primary form-continue-btn">${currentStep.title === "Review" ? "Submit application" : "Continue"}</button>
        </div>
      </form>`;
    formContainer.innerHTML = formContainer.innerHTML.replace(/motion\.div>/, "div>").replace(/<\/motion\.div>/, "</div>");

    bindSaveExit(formId, steps, formContainer);
    document.getElementById(`${formId}-form`)?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      for (const [k, v] of fd.entries()) state.formData[k] = v.toString();
      if (fd.get("fullName")) state.applicantName = fd.get("fullName").toString().trim();
      if (currentStep.title === "Review") {
        state.submitted = true;
        state.journeyPhase = "confirmation";
        state.underwritingStatus = "reviewing";
        await callServerTool("blackwell-submit-application", { cardId: card.id, applicantName: state.applicantName });
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        renderConfirmation(formContainer, card);
        return;
      }
      advanceStep(steps, progressId, formId, formContainer, card, getFormFieldsForStep);
    });
  }

  function renderComparison(targetId = "compare-body") {
    const el = document.getElementById(targetId);
    const data = state.comparison ?? getCardComparison(state.compareIds);
    if (!el) return;
    if (!data.cards?.length) {
      renderPanelState(el, "Nothing to compare yet", "Select at least two cards, or open Products to compare all available cards.", "Open Products");
      el.querySelector("[data-state-action]")?.addEventListener("click", () => {
        state.mode = "full";
        state.productTab = "cards";
        showViewForMode("full");
        ctx.render();
      });
      notifyHostSize();
      return;
    }
    const inferredNeed = state.comparison?.need ?? state.recommendations?.filters?.need ?? "everyday-spend";
    const recommendedCardId = data.recommendedCardId
      ?? getCompareRecommendation?.(data.cardIds ?? data.cards.map((card) => card.id), inferredNeed)
      ?? null;
    const recommendedCard = data.cards.find((card) => card.id === recommendedCardId) ?? data.cards[0];
    const summaryCards = [
      {
        label: "Best for travel",
        card: data.cards.find((card) => card.loungeAccess) ?? data.cards[0],
        detail: "Lounge access and travel rewards",
      },
      {
        label: "Best everyday",
        card: data.cards.slice().sort((a, b) => (b.cashbackRate ?? 0) - (a.cashbackRate ?? 0))[0] ?? data.cards[0],
        detail: "Cashback and daily spend value",
      },
      {
        label: "Credit building",
        card: data.cards.find((card) => card.minIncome <= 18000) ?? data.cards[data.cards.length - 1],
        detail: "Lower entry criteria",
      },
    ];
    const headers = data.cards.map((c) => `
      <th class="${c.id === recommendedCardId ? "compare-col-best" : ""}">
        ${c.name}
        ${c.id === recommendedCardId ? '<span class="compare-best-badge">Best for you</span>' : ""}
      </th>
    `).join("");
    const rows = data.rows.map((row) => `
      <tr>
        <th>${row.label}</th>
        ${row.values.map((v, index) => `<td class="${data.cards[index].id === recommendedCardId ? "compare-col-best" : ""}">${v}</td>`).join("")}
      </tr>`).join("");
    el.innerHTML = `
      <section class="compare-summary-strip" aria-label="Comparison summary">
        <div class="compare-summary-main">
          <span>Recommended for ${needLabel(inferredNeed)}</span>
          <strong>${recommendedCard?.name ?? "Best matched card"}</strong>
        </div>
        <div class="compare-summary-grid">
          ${summaryCards.map((item) => `
            <div class="compare-summary-card ${item.card?.id === recommendedCardId ? "active" : ""}">
              <span>${item.label}</span>
              <strong>${item.card?.name ?? "Unavailable"}</strong>
              <p>${item.detail}</p>
            </div>`).join("")}
        </div>
      </section>
      <div class="compare-table-wrap" tabindex="0" aria-label="Card comparison table">
        <table class="compare-table"><thead><tr><th>Feature</th>${headers}</tr></thead><tbody>${rows}</tbody></table>
      </div>`;
    notifyHostSize();
  }

  function renderCalculator() {
    const el = document.getElementById("calculator-body");
    const calc = state.calculator ?? calculateRewards(state.selectedCardId ?? "blackwell-rewards", 1500);
    if (!el) return;
    if (!calc) {
      renderPanelState(el, "Calculator unavailable", "Choose a card before estimating rewards.");
      notifyHostSize();
      return;
    }
    el.innerHTML = `
      <p class="eligibility-subtitle">${calc.cardName}</p>
      <div class="slider-field">
        <label>Monthly spend: <span class="slider-value" id="calc-spend-label">£${calc.monthlySpend.toLocaleString("en-GB")}</span></label>
        <input type="range" id="calc-spend" min="200" max="5000" step="100" value="${calc.monthlySpend}" />
      </div>
      <div class="calc-result" id="calc-result">${calc.headline}</div>
      <p class="disclaimer-text">${calc.disclaimer}</p>`;
    el.innerHTML = el.innerHTML.replace(/motion\.div>/, "div>");
    const slider = document.getElementById("calc-spend");
    slider?.addEventListener("input", () => {
      const spend = Number(slider.value);
      const updated = calculateRewards(calc.cardId, spend);
      state.calculator = updated;
      document.getElementById("calc-spend-label").textContent = `£${spend.toLocaleString("en-GB")}`;
      document.getElementById("calc-result").textContent = updated.headline;
    });
    notifyHostSize();
  }

  function renderBalanceTransfer() {
    const el = document.getElementById("balance-transfer-body");
    const bt = state.balanceTransfer ?? estimateBalanceTransfer({});
    if (!el) return;
    if (!bt) {
      renderPanelState(el, "Estimator unavailable", "Choose a card before estimating a balance transfer.");
      notifyHostSize();
      return;
    }
    el.innerHTML = `
      <p class="eligibility-subtitle">${bt.cardName} — ${bt.headline}</p>
      <form class="app-form" id="bt-form">
        <div class="form-field"><label>Balance to transfer (£)</label><input type="number" name="amount" value="${bt.transferAmount}" min="100" step="100" /></div>
        <div class="form-field"><label>Current APR (%)</label><input type="number" name="currentApr" value="${bt.currentApr}" min="0" step="0.1" /></div>
        <button type="submit" class="btn-primary">Recalculate</button>
      </form>
      <div class="calc-result" id="bt-result">
        Fee: £${bt.fee} · Est. saving over ${bt.promoMonths} months: £${bt.estimatedSaving}
      </div>
      <p class="disclaimer-text">${bt.disclaimer}</p>`;
    el.innerHTML = el.innerHTML.replace(/motion\.div>/g, "div>").replace(/<\/motion\.div>/g, "</div>").replace(/motion\.div/g, "div");
    document.getElementById("bt-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      state.balanceTransfer = estimateBalanceTransfer({
        amount: Number(fd.get("amount")),
        currentApr: Number(fd.get("currentApr")),
        cardId: bt.cardId,
      });
      renderBalanceTransfer();
    });
    notifyHostSize();
  }

  function renderHub() {
    const el = document.getElementById("hub-body");
    if (!el) return;
    if (!state.hub?.tiles?.length) {
      renderPanelState(el, "Card Hub is loading", "Your products, spend, offers, travel, wallet and controls will appear here.");
      notifyHostSize();
      return;
    }
    el.innerHTML = `
      <h2 style="margin:0 0 12px;font-size:1rem;">${state.hub.headline}</h2>
      ${state.hub.subtitle ? `<p class="hub-subtitle">${state.hub.subtitle}</p>` : ""}
      <div class="hub-grid">${state.hub.tiles.map((t) => `
        <button type="button" class="hub-tile" data-hub-id="${t.id}">
          <div class="hub-tile-icon" aria-hidden="true">${t.icon}</div>
          <h3>${t.label}</h3>
          <p>${t.description}</p>
        </button>`).join("")}</div>`;
    el.innerHTML = el.innerHTML.replace(/motion\.div>/, "div>");
    el.querySelectorAll(".hub-tile").forEach((tile) => {
      tile.addEventListener("click", async () => {
        const result = await callServerTool("blackwell-navigate-hub", { hubId: tile.dataset.hubId });
        if (result) return;
        const payload = localHubPayload(tile.dataset.hubId);
        if (payload) handleToolResult?.({ structuredContent: payload });
      });
    });
    notifyHostSize();
  }

  function renderSpendInsights() {
    const el = document.getElementById("spend-insights-body");
    const data = state.spendInsights;
    if (!el) return;
    if (!data?.categories?.length) {
      renderPanelState(el, "No spend insights yet", "Recent card activity will appear here after transactions are available.");
      notifyHostSize();
      return;
    }
    const gradient = data.categories.map((c, i, arr) => {
      const start = arr.slice(0, i).reduce((s, x) => s + x.pct, 0);
      return `${c.color} ${start}% ${start + c.pct}%`;
    }).join(", ");
    const selectedCategory = data.categories.find((category) => category.id === state.activeSpendCategory);
    const categoryMerchants = selectedCategory ? getCategoryMerchants(state.activeSpendCategory) : [];
    const deltaPct = Number(data.spendDeltaPct ?? 0);
    const deltaUp = deltaPct >= 0;
    el.innerHTML = `
      <div class="hero-strip">
        <p class="eligibility-subtitle">${data.period}</p>
        <div class="spend-hero-total">Total £${data.totalSpend.toLocaleString("en-GB")}</div>
        <div class="spend-delta ${deltaUp ? "up" : "down"}">
          <span class="spend-delta-arrow">${deltaUp ? "▲" : "▼"}</span>
          <span>${deltaPct > 0 ? "+" : ""}${deltaPct}% vs last month</span>
        </div>
      </div>
      <div class="spend-donut-wrap">
        <div class="spend-donut" style="background:conic-gradient(${gradient})"></div>
        <div class="spend-legend">${data.categories.map((c) => `
          <button type="button" class="spend-legend-item ${state.activeSpendCategory === c.id ? "active" : ""}" data-category-id="${c.id}">
            <span class="spend-legend-swatch" style="background:${c.color}"></span>${c.label} · £${c.amount} (${c.pct}%)
          </button>`).join("")}</div>
      </div>
      <div class="merchant-list">
        <h3 style="font-size:0.88rem;margin:0 0 8px;">
          ${selectedCategory ? `${selectedCategory.label} merchants` : "Top merchants"}
        </h3>
        ${selectedCategory ? `<button type="button" class="spend-back-link" id="spend-back-overview">← Back to overview</button>` : ""}
        ${(selectedCategory ? categoryMerchants : data.topMerchants).map((m) => `
          <div class="merchant-row"><span>${m.token}</span><span>£${m.amount}</span></div>`).join("")}
      </div>
      <p class="disclaimer-text">${data.disclaimer}</p>`;
    el.innerHTML = el.innerHTML.replace(/motion\.div>/g, "div>").replace(/<\/motion\.div>/g, "</div>");
    el.querySelectorAll("[data-category-id]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeSpendCategory = button.dataset.categoryId;
        renderSpendInsights();
      });
    });
    document.getElementById("spend-back-overview")?.addEventListener("click", () => {
      state.activeSpendCategory = null;
      renderSpendInsights();
    });
    notifyHostSize();
  }

  function renderMerchantOffers() {
    const el = document.getElementById("merchant-offers-body");
    const data = state.merchantOffers;
    if (!el) return;
    if (!data?.offers?.length) {
      renderPanelState(el, "No offers available", "Personalised merchant offers will appear here when available.");
      notifyHostSize();
      return;
    }
    const savings = data.estimatedOfferSavings ?? 0;
    const logoBubbles = data.offers.slice(0, 4).map((offer) => {
      const initials = offer.partner
        .split(/\s+/)
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      return `<span class="partner-logo-bubble" title="${offer.partner}">${initials}</span>`;
    }).join("");
    el.innerHTML = `
      <div class="hero-strip offers-hero">
        <div class="partner-logo-row">${logoBubbles}</div>
        <p class="offer-savings-headline">You could save ~£${savings} this month</p>
      </div>
      ${state.offerActivationFeedback ? `<div class="offer-toast">${state.offerActivationFeedback}</div>` : ""}
      ${data.offers.map((o) => `
      <div class="offer-card ${o.activated ? "activated" : ""}">
        <div>
          <div class="offer-partner-wrap">
            <span class="partner-logo-bubble inline" aria-hidden="true">${o.partner.slice(0, 2).toUpperCase()}</span>
            <div class="offer-partner">${o.partner}</div>
          </div>
          <div class="offer-headline">${o.headline}</div>
          <div class="offer-expires">Expires ${o.expires}</div>
        </div>
        ${o.activated ? "<span class='offer-active-pill'>✓ Active</span>" : `<button type="button" class="btn-secondary" data-offer="${o.id}" style="width:auto;margin:0;padding:8px 14px;">Activate</button>`}
      </div>`).join("")}
    `;
    el.innerHTML = el.innerHTML.replace(/motion\.div>/g, "div>").replace(/<\/motion\.div>/g, "</div>");
    el.querySelectorAll("[data-offer]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const result = await callServerTool("blackwell-activate-offer", { offerId: btn.dataset.offer });
        const payload = extractPayload(result);
        if (payload.kind === "offer-activated") {
          pushModelContext?.("offer-activated", payload);
        }
      });
    });
    if (state.offerActivationFeedback) {
      clearTimeout(offerFeedbackTimer);
      offerFeedbackTimer = setTimeout(() => {
        state.offerActivationFeedback = null;
        if (state.mode === "merchant-offers") renderMerchantOffers();
      }, 2200);
    }
    notifyHostSize();
  }

  function renderTravelNotice() {
    const el = document.getElementById("travel-notice-body");
    const data = state.travelNotice;
    if (!el) return;
    if (!data) {
      renderPanelState(el, "Travel notice unavailable", "Open Card Hub again to start a travel notice.");
      notifyHostSize();
      return;
    }
    if (data.reference) {
      const countries = data.countries?.length ? data.countries.join(", ") : "No countries selected";
      el.innerHTML = `
        <div class="travel-success-card">
          <div class="travel-success-header">
            <strong>Travel notice registered</strong>
            <span class="travel-reference">Ref ${data.reference}</span>
          </div>
          <p class="travel-success-message">${data.message}</p>
          <div class="travel-summary-grid">
            <div><span>Countries</span><strong>${countries}</strong></div>
            <div><span>Travel dates</span><strong>${data.departure} → ${data.returnDate}</strong></div>
            <div><span>Card</span><strong>•••• ${data.cardLastFour ?? "4821"}</strong></div>
          </div>
          <p class="disclaimer-text">This register helps reduce card declines while travelling. It is not travel insurance.</p>
        </div>
      `;
      el.innerHTML = el.innerHTML.replace(/motion\.div>/, "div>");
      return;
    }
    el.innerHTML = `
      <p class="eligibility-subtitle">Card ending ${data.cardLastFour}</p>
      <div class="travel-timeline">
        <div class="travel-timeline-stop">
          <span class="travel-stop-label">Home</span>
          <strong>${data.defaultDeparture}</strong>
        </div>
        <div class="travel-timeline-line" aria-hidden="true"></div>
        <div class="travel-timeline-stop">
          <span class="travel-stop-label">Abroad</span>
          <strong>${data.defaultDeparture} → ${data.defaultReturn}</strong>
        </div>
        <div class="travel-timeline-line" aria-hidden="true"></div>
        <div class="travel-timeline-stop">
          <span class="travel-stop-label">Home</span>
          <strong>${data.defaultReturn}</strong>
        </div>
      </div>
      <form class="app-form" id="travel-form">
        <div class="form-field"><label>Departure</label><input type="date" name="departure" value="${data.defaultDeparture}" /></div>
        <div class="form-field"><label>Return</label><input type="date" name="returnDate" value="${data.defaultReturn}" /></div>
        <div class="form-field"><label>Countries (hold Ctrl/Cmd to select multiple)</label>
          <select name="countries" multiple size="4">${data.countries.map((c) => `<option value="${c}">${c}</option>`).join("")}</select>
        </div>
        <button type="submit" class="btn-primary">Register travel</button>
      </form>
      <p class="disclaimer-text">${data.disclaimer}</p>`;
    el.innerHTML = el.innerHTML.replace(/motion\.div>/g, "div>").replace(/<\/motion\.div>/g, "</div>");
    document.getElementById("travel-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const countries = [...e.target.querySelector('[name="countries"]').selectedOptions].map((o) => o.value);
      (async () => {
        const result = await callServerTool("blackwell-submit-travel-notice", {
          countries,
          departure: fd.get("departure"),
          returnDate: fd.get("returnDate"),
        });
        const payload = extractPayload(result);
        if (payload.kind === "travel-notice-submitted") {
          pushModelContext?.("travel-notice-submitted", payload);
        }
      })();
    });
    notifyHostSize();
  }

  function renderCreditLimit() {
    const el = document.getElementById("credit-limit-body");
    const data = state.creditLimit;
    if (!el) return;
    if (!data) {
      renderPanelState(el, "No limit offer", "We'll show eligible credit limit controls here.");
      notifyHostSize();
      return;
    }
    const currentLimitAmount = Number(data.currentLimitAmount ?? 3500);
    const newLimitAmount = Number(data.newLimitAmount ?? 4000);
    const ratio = Math.max(0, Math.min(100, (currentLimitAmount / newLimitAmount) * 100));
    el.innerHTML = `
      <div class="hero-strip">
        <div class="calc-result">Current limit: ${data.currentLimit}</div>
        <div class="limit-gauge" role="img" aria-label="Current limit ${data.currentLimit}, offered limit ${data.newLimit}">
          <div class="limit-gauge-track">
            <div class="limit-gauge-current" style="width:${ratio}%"></div>
          </div>
          <div class="limit-gauge-labels">
            <span>${data.currentLimit}</span>
            <span>Offered ${data.newLimit}</span>
          </div>
        </div>
      </div>
      <p style="font-size:0.9rem;margin:12px 0;">You may be eligible for an indicative increase of <strong>${data.indicativeIncrease}</strong> (new limit ${data.newLimit}).</p>
      <button type="button" class="btn-secondary" data-nav="wallet">Add to Apple Pay</button>
      <p class="disclaimer-text">${data.disclaimer}</p>`;
    el.querySelector("[data-nav='wallet']")?.addEventListener("click", () => callServerTool("blackwell-wallet-provision", { cardId: "blackwell-rewards" }));
    notifyHostSize();
  }

  function renderWallet() {
    const el = document.getElementById("wallet-body");
    const data = state.wallet;
    if (!el) return;
    if (!data) {
      renderPanelState(el, "Wallet not ready", "Choose a card before adding it to a digital wallet.");
      notifyHostSize();
      return;
    }
    if (data.status === "provisioned") {
      el.innerHTML = `<div class="wallet-success"><strong>✓ ${data.message}</strong></div>`;
      el.innerHTML = el.innerHTML.replace(/motion\.div>/, "div>");
      return;
    }
    el.innerHTML = `
      <p class="eligibility-subtitle">${data.cardName} ·••• ${data.lastFour}</p>
      <div class="wallet-hero">
        <div class="wallet-card-art" aria-hidden="true">
          <span class="wallet-card-chip"></span>
          <span class="wallet-card-brand">BLACKWELL</span>
        </div>
        <span class="wallet-ready-badge">${data.statusLabel ?? "Ready to add"}</span>
      </div>
      <button type="button" class="wallet-btn" id="apple-pay-btn"> Add to Apple Pay</button>
      <button type="button" class="btn-secondary" id="google-pay-btn">Add to Google Pay</button>`;
    document.getElementById("apple-pay-btn")?.addEventListener("click", async () => {
      const result = await callServerTool("blackwell-provision-wallet", { cardId: data.cardId, wallet: "Apple Pay" });
      const payload = extractPayload(result);
      if (payload.kind === "wallet-provisioned") {
        pushModelContext?.("wallet-provisioned", payload);
      }
    });
    document.getElementById("google-pay-btn")?.addEventListener("click", async () => {
      const result = await callServerTool("blackwell-provision-wallet", { cardId: data.cardId, wallet: "Google Pay" });
      const payload = extractPayload(result);
      if (payload.kind === "wallet-provisioned") {
        pushModelContext?.("wallet-provisioned", payload);
      }
    });
    notifyHostSize();
  }

  function wireGlobalNav() {
    document.querySelectorAll(".back-link[data-nav]").forEach((link) => {
      link.addEventListener("click", () => {
        const target = link.dataset.nav;
        if (target === "hub" && !state.hub?.tiles?.length) {
          state.hub = getHubPayload?.() ?? state.hub;
        }
        state.mode = target === "hub" ? "hub" : "full";
        if (state.mode === "full") state.entryMode = "full";
        if (state.mode === "hub") state.entryMode = "hub";
        showViewForMode(state.mode);
        ctx.render();
      });
    });
    document.getElementById("compare-btn")?.addEventListener("click", () => {
      if (state.compareIds.length < 2) {
        state.compareIds = (state.recommendations?.cards ?? []).map((c) => c.id);
      }
      const need = state.recommendations?.filters?.need ?? "everyday-spend";
      state.comparison = getCardComparison(state.compareIds, need);
      state.comparison.need = need;
      state.comparison.recommendedCardId = state.comparison.recommendedCardId
        ?? getCompareRecommendation?.(state.compareIds, need);
      state.mode = "compare";
      showViewForMode("compare");
      renderComparison();
    });
  }

  return {
    tryResumeDraft,
    beginAsyncUnderwriting,
    notifyUnderwritingDecision,
    renderJourney,
    renderConfirmation,
    renderComparison,
    renderCalculator,
    renderBalanceTransfer,
    renderHub,
    renderSpendInsights,
    renderMerchantOffers,
    renderTravelNotice,
    renderCreditLimit,
    renderWallet,
    wireGlobalNav,
  };
}
