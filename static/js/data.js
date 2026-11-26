// FILE: data.js
(() => {
  if (window.__ECORELOCATE_APP_MOUNTED__) return;
  window.__ECORELOCATE_APP_MOUNTED__ = true;

  const fallbackUtils = {
    escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },

    svgIcon(name, size = 18) {
      const icons = {
        brand: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 2v10l7 7"/></svg>`,
        "arrow-right": `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
        search: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
        info: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
        delta: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m12 3 9 18H3z"/></svg>`,
        "chevron-down": `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`
      };
      return icons[name] || "";
    },

    getRuleDeltaText(item, originId, city) {
      if (!item || !item.ruleDeltaByOrigin) return "";
      if (originId && item.ruleDeltaByOrigin[originId]) {
        return item.ruleDeltaByOrigin[originId];
      }
      if (city && city.id && item.ruleDeltaByOrigin[city.id]) {
        return item.ruleDeltaByOrigin[city.id];
      }
      return item.ruleDeltaByOrigin.other || "";
    },

    filterItems(items, { query = "", category = "all", originId = "by", city = null, onlyDelta = false }) {
      const q = String(query || "").trim().toLowerCase();
      return (items || []).filter((item) => {
        if (category && category !== "all" && item.category !== category) {
          return false;
        }
        if (onlyDelta) {
          const delta = this.getRuleDeltaText(item, originId, city);
          if (!delta) return false;
        }
        if (!q) return true;
        const haystack = [
          item.title,
          item.action,
          item.binLabel,
          item.outcome,
          ...(item.keywords || [])
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    },

    calculateChecklistProgress(allIds, checkedSet) {
      const total = Array.isArray(allIds) ? allIds.length : 0;
      if (!total) return { done: 0, total: 0, percent: 0 };
      const done = allIds.filter((id) => checkedSet && checkedSet.has(id)).length;
      const percent = Math.round((done / total) * 100);
      return { done, total, percent };
    },

    getCityZones(zones, city) {
      const list = Array.isArray(zones) ? zones : [];
      if (!city || !Array.isArray(city.allowedZoneIds) || city.allowedZoneIds.length === 0) {
        return list;
      }
      const allowed = new Set(city.allowedZoneIds);
      const filtered = list.filter((z) => allowed.has(z.id));
      return filtered.length > 0 ? filtered : list;
    }
  };

  const utils = { ...fallbackUtils, ...(window.EcoRelocateUtils || {}) };
  window.EcoRelocateUtils = utils;

  const dropoffMap = window.EcoRelocateDropoffMap || null;

  let data = null;

  const state = {
    view: "sorting",
    originId: "by",
    cityId: "minsk",
    category: "all",
    query: "",
    onlyDelta: false,
    expandedItemIds: new Set(),
    loopMaterial: "paper",
    selectedZoneId: "",
    checkedChecklistIds: new Set(["fw-1"]),
    loading: true,
    error: ""
  };

  const els = {
    brandLogo: document.getElementById("brand-logo-slot"),
    routeArrow: document.getElementById("route-arrow-slot"),
    searchIcon: document.getElementById("search-icon-slot"),
    originSelect: document.getElementById("origin-country"),
    citySelect: document.getElementById("destination-city"),
    routeSummary: document.getElementById("route-delta-summary"),
    binsLegend: document.getElementById("city-bins-legend"),
    categoryFilters: document.getElementById("category-filters"),
    searchInput: document.getElementById("item-search"),
    clearSearchBtn: document.getElementById("clear-search-btn"),
    onlyDeltaToggle: document.getElementById("only-delta-toggle"),
    resultsCount: document.getElementById("results-count"),
    itemsList: document.getElementById("items-list"),
    emptyState: document.getElementById("empty-state"),
    resetFiltersBtn: document.getElementById("reset-filters-btn"),
    materialLoopDiagram: document.getElementById("material-loop-diagram"),
    checklistList: document.getElementById("first-week-list"),
    checklistProgressText: document.getElementById("checklist-progress-text"),
    checklistProgressBar: document.getElementById("checklist-progress-bar"),
    symbolsGrid: document.getElementById("symbols-grid"),
    dropoffMapContainer: document.getElementById("dropoff-map-container"),
    navTabs: Array.from(document.querySelectorAll(".nav-tab")),
    viewPanels: {
      sorting: document.getElementById("view-sorting"),
      "first-week": document.getElementById("view-first-week"),
      "symbols-dropoff": document.getElementById("view-symbols-dropoff")
    },
    loopBtns: Array.from(document.querySelectorAll(".loop-btn"))
  };

  function getActiveCity() {
    if (!data || !data.cities) return null;
    return data.cities[state.cityId] || Object.values(data.cities)[0] || null;
  }

  function initStaticIcons() {
    if (els.brandLogo) els.brandLogo.innerHTML = utils.svgIcon("brand", 22);
    if (els.routeArrow) els.routeArrow.innerHTML = utils.svgIcon("arrow-right", 18);
    if (els.searchIcon) els.searchIcon.innerHTML = utils.svgIcon("search", 18);
  }

  function renderLoadingOrError() {
    if (!els.resultsCount || !els.itemsList || !els.emptyState) return true;

    if (state.loading) {
      els.resultsCount.textContent = "Загружаем данные из /api/bootstrap...";
      els.itemsList.innerHTML = `
        <article class="item-card"><p class="item-action">Загрузка правил сортировки и городов...</p></article>
        <article class="item-card"><p class="item-action">Подготовка подсказок по сдвигу привычек...</p></article>
      `;
      els.emptyState.hidden = true;
      return true;
    }

    if (state.error || !data) {
      els.resultsCount.textContent = "Не удалось загрузить данные";
      els.itemsList.innerHTML = "";
      els.emptyState.hidden = false;
      const titleEl = els.emptyState.querySelector(".empty-title");
      const copyEl = els.emptyState.querySelector(".empty-copy");
      if (titleEl) titleEl.textContent = "Ошибка связи с API (/api/bootstrap)";
      if (copyEl) copyEl.textContent = state.error || "Проверьте запуск сервера FastAPI.";
      return true;
    }

    return false;
  }

  function populateSelects() {
    if (!data || !els.originSelect || !els.citySelect) return;
    const origins = data.origins || [];
    const cities = data.cities || {};

    els.originSelect.innerHTML = origins
      .map((o) => `<option value="${utils.escapeHtml(o.id)}">${utils.escapeHtml(o.label)}</option>`)
      .join("");

    els.citySelect.innerHTML = Object.values(cities)
      .map((c) => `<option value="${utils.escapeHtml(c.id)}">${utils.escapeHtml(c.name)}</option>`)
      .join("");

    if (!origins.some((o) => o.id === state.originId)) {
      state.originId = origins[0]?.id || "by";
    }
    if (!cities[state.cityId]) {
      state.cityId = Object.keys(cities)[0] || "minsk";
    }

    els.originSelect.value = state.originId;
    els.citySelect.value = state.cityId;
  }

  function renderCategoryFilters() {
    if (!data || !els.categoryFilters) return;
    els.categoryFilters.innerHTML = (data.categories || [])
      .map((cat) => {
        const active = cat.id === state.category;
        return `<button type="button" class="filter-pill ${active ? "is-active" : ""}" data-category="${utils.escapeHtml(cat.id)}" aria-pressed="${active}">${utils.escapeHtml(cat.label)}</button>`;
      })
      .join("");
  }

  function renderRouteAndBins() {
    const city = getActiveCity();
    if (!city) return;

    if (els.routeSummary) {
      els.routeSummary.innerHTML = `
        <span class="route-badge">${utils.svgIcon("info", 15)} <strong>${utils.escapeHtml(city.name)}</strong></span>
        <span class="route-note">${utils.escapeHtml(city.housingNote)}</span>
      `;
    }

    if (els.binsLegend) {
      els.binsLegend.innerHTML = (city.bins || [])
        .map(
          (b) => `
          <div class="bin-chip">
            <span class="bin-swatch bin-${utils.escapeHtml(b.code)}" aria-hidden="true"></span>
            <div class="bin-chip-text">
              <span class="bin-name">${utils.escapeHtml(b.name)}</span>
              <span class="bin-hint">${utils.escapeHtml(b.hint)}</span>
            </div>
          </div>
        `
        )
        .join("");
    }
  }

  function renderItems() {
    if (renderLoadingOrError()) return;

    const city = getActiveCity();
    const filtered = utils.filterItems(data.items || [], {
      query: state.query,
      category: state.category,
      originId: state.originId,
      city,
      onlyDelta: state.onlyDelta
    });

    if (els.clearSearchBtn) els.clearSearchBtn.hidden = state.query.length === 0;
    if (els.resultsCount) {
      els.resultsCount.textContent =
        filtered.length === 0
          ? "Подходящих предметов не найдено"
          : `Найдено предметов: ${filtered.length} · Город: ${city ? city.name : ""}`;
    }

    if (filtered.length === 0) {
      if (els.itemsList) els.itemsList.innerHTML = "";
      if (els.emptyState) els.emptyState.hidden = false;
      return;
    }

    if (els.emptyState) els.emptyState.hidden = true;
    if (els.itemsList) {
      els.itemsList.innerHTML = filtered
        .map((item) => {
          const isExpanded = state.expandedItemIds.has(item.id);
          const deltaText = utils.getRuleDeltaText(item, state.originId, city);
          const prepHtml = (item.prepSteps || [])
            .map((step) => `<li>${utils.escapeHtml(step)}</li>`)
            .join("");

          return `
            <article class="item-card" data-item-id="${utils.escapeHtml(item.id)}">
              <div class="item-top">
                <span class="bin-pill bin-pill-${utils.escapeHtml(item.binCode)}">${utils.escapeHtml(item.binLabel)}</span>
                ${deltaText ? `<span class="delta-pill">${utils.svgIcon("delta", 13)} Сдвиг привычки</span>` : ""}
              </div>
              <h3 class="item-title">${utils.escapeHtml(item.title)}</h3>
              <p class="item-action">${utils.escapeHtml(item.action)}</p>
              ${
                deltaText
                  ? `<div class="delta-box"><strong>Что иначе в вашей привычке:</strong> ${utils.escapeHtml(deltaText)}</div>`
                  : ""
              }
              <button
                type="button"
                class="details-toggle"
                data-toggle-item="${utils.escapeHtml(item.id)}"
                aria-expanded="${isExpanded}"
              >
                <span>${isExpanded ? "Скрыть подготовку и путь материала" : "Как подготовить и во что переработается"}</span>
                ${utils.svgIcon("chevron-down", 16)}
              </button>
              <div class="item-details" ${isExpanded ? "" : "hidden"}>
                <div class="detail-block">
                  <h4 class="detail-heading">Подготовка перед выносом</h4>
                  <ul class="prep-list">${prepHtml}</ul>
                </div>
                <div class="detail-block">
                  <h4 class="detail-heading">Путь материала</h4>
                  <p class="outcome-copy">${utils.escapeHtml(item.outcome)}</p>
                </div>
              </div>
            </article>
          `;
        })
        .join("");
    }
  }

  function renderMaterialLoop() {
    if (!data || !data.materialLoops || !els.materialLoopDiagram) return;
    const steps = data.materialLoops[state.loopMaterial] || [];
    els.materialLoopDiagram.innerHTML = steps
      .map(
        (s, idx) => `
        <div class="loop-step">
          <div class="loop-step-header">
            <span class="loop-index">0${idx + 1}</span>
            <span class="loop-stage">${utils.escapeHtml(s.step)}</span>
          </div>
          <p class="loop-text">${utils.escapeHtml(s.text)}</p>
        </div>
      `
      )
      .join("");
  }

  function renderChecklist() {
    if (!data || !els.checklistList) return;
    const list = data.firstWeekChecklist || [];
    const ids = list.map((c) => c.id);
    const progress = utils.calculateChecklistProgress(ids, state.checkedChecklistIds);
    if (els.checklistProgressText) {
      els.checklistProgressText.textContent = `${progress.done} из ${progress.total} выполнено (${progress.percent}%)`;
    }
    if (els.checklistProgressBar) {
      els.checklistProgressBar.style.width = `${progress.percent}%`;
    }

    els.checklistList.innerHTML = list
      .map((entry) => {
        const checked = state.checkedChecklistIds.has(entry.id);
        return `
          <li class="checklist-row ${checked ? "is-done" : ""}">
            <label class="checklist-label">
              <input
                type="checkbox"
                class="checklist-checkbox"
                data-checklist-id="${utils.escapeHtml(entry.id)}"
                ${checked ? "checked" : ""}
              />
              <span class="checklist-content">
                <span class="checklist-title">${utils.escapeHtml(entry.title)}</span>
                <span class="checklist-detail">${utils.escapeHtml(entry.detail)}</span>
              </span>
            </label>
          </li>
        `;
      })
      .join("");
  }

  function renderSymbolsAndDropoff() {
    if (!data) return;
    const city = getActiveCity();

    if (els.symbolsGrid) {
      els.symbolsGrid.innerHTML = (data.symbols || [])
        .map(
          (sym) => `
          <article class="info-card">
            <span class="symbol-code">${utils.escapeHtml(sym.code)}</span>
            <h3 class="info-card-title">${utils.escapeHtml(sym.name)}</h3>
            <p class="info-card-copy">${utils.escapeHtml(sym.meaning)}</p>
          </article>
        `
        )
        .join("");
    }

    if (dropoffMap && typeof dropoffMap.render === "function" && els.dropoffMapContainer) {
      const cityZones = utils.getCityZones(data.dropoffZones || [], city);
      if (!cityZones.some((z) => z.id === state.selectedZoneId)) {
        state.selectedZoneId = cityZones[0]?.id || "";
      }
      dropoffMap.render(els.dropoffMapContainer, cityZones, state.selectedZoneId, city?.name, (zoneId) => {
        state.selectedZoneId = zoneId;
        renderSymbolsAndDropoff();
      });
    }
  }

  function switchView(nextView) {
    state.view = nextView;
    els.navTabs.forEach((tab) => {
      const active = tab.dataset.view === nextView;
      tab.classList.toggle("is-active", active);
      if (active) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
    Object.entries(els.viewPanels).forEach(([key, panel]) => {
      if (panel) panel.hidden = key !== nextView;
    });
  }

  function bindEvents() {
    if (els.originSelect) {
      els.originSelect.addEventListener("change", (e) => {
        state.originId = e.target.value;
        renderRouteAndBins();
        renderItems();
      });
    }

    if (els.citySelect) {
      els.citySelect.addEventListener("change", (e) => {
        state.cityId = e.target.value;
        renderRouteAndBins();
        renderItems();
        renderSymbolsAndDropoff();
      });
    }

    if (els.searchInput) {
      els.searchInput.addEventListener("input", (e) => {
        state.query = e.target.value;
        renderItems();
      });
    }

    if (els.clearSearchBtn) {
      els.clearSearchBtn.addEventListener("click", () => {
        state.query = "";
        if (els.searchInput) {
          els.searchInput.value = "";
          els.searchInput.focus();
        }
        renderItems();
      });
    }

    if (els.onlyDeltaToggle) {
      els.onlyDeltaToggle.addEventListener("change", (e) => {
        state.onlyDelta = e.target.checked;
        renderItems();
      });
    }

    if (els.categoryFilters) {
      els.categoryFilters.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-category]");
        if (!btn) return;
        state.category = btn.dataset.category;
        renderCategoryFilters();
        renderItems();
      });
    }

    if (els.resetFiltersBtn) {
      els.resetFiltersBtn.addEventListener("click", () => {
        if (!data) {
          loadBootstrap();
          return;
        }
        state.category = "all";
        state.query = "";
        state.onlyDelta = false;
        if (els.searchInput) els.searchInput.value = "";
        if (els.onlyDeltaToggle) els.onlyDeltaToggle.checked = false;
        renderCategoryFilters();
        renderItems();
      });
    }

    if (els.itemsList) {
      els.itemsList.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-toggle-item]");
        if (!btn) return;
        const id = btn.dataset.toggleItem;
        if (state.expandedItemIds.has(id)) state.expandedItemIds.delete(id);
        else state.expandedItemIds.add(id);
        renderItems();
      });
    }

    els.loopBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.loopMaterial = btn.dataset.loopMaterial;
        els.loopBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
        renderMaterialLoop();
      });
    });

    if (els.checklistList) {
      els.checklistList.addEventListener("change", (e) => {
        const cb = e.target.closest("[data-checklist-id]");
        if (!cb) return;
        const id = cb.dataset.checklistId;
        if (cb.checked) state.checkedChecklistIds.add(id);
        else state.checkedChecklistIds.delete(id);
        renderChecklist();
      });
    }

    els.navTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        switchView(tab.dataset.view);
      });
    });
  }

  async function loadBootstrap() {
    state.loading = true;
    state.error = "";
    renderItems();

    try {
      const response = await fetch("/api/bootstrap", { headers: { Accept: "application/json" } });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      data = await response.json();
      state.loading = false;
      state.error = "";

      populateSelects();
      renderCategoryFilters();
      renderRouteAndBins();
      renderItems();
      renderMaterialLoop();
      renderChecklist();
      renderSymbolsAndDropoff();
    } catch (err) {
      state.loading = false;
      state.error = `Не удалось получить данные с сервера: ${err && err.message ? err.message : "ошибка сети"}`;
      renderItems();
    }
  }

  initStaticIcons();
  bindEvents();
  loadBootstrap();
})();