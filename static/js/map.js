const EcoRelocateDropoffMap = (() => {
  function render(container, zones, selectedZoneId, cityName, onSelectZone) {
    if (!container) return;
    const utils = window.EcoRelocateUtils;
    const list = Array.isArray(zones) ? zones : [];
    if (list.length === 0) {
      container.innerHTML = `<p class="empty-copy">Нет данных о зонах приёма.</p>`;
      return;
    }

    const activeZone = list.find((z) => z.id === selectedZoneId) || list[0];

    const nodesHtml = list
      .map((z) => {
        const isSelected = z.id === activeZone.id;
        return `
          <button
            type="button"
            class="zone-node ${isSelected ? "is-selected" : ""}"
            data-zone-id="${utils.escapeHtml(z.id)}"
            aria-pressed="${isSelected}"
          >
            <span class="zone-node-label">${utils.escapeHtml(z.label)}</span>
            <span class="zone-node-meta">${utils.escapeHtml(z.meta)}</span>
          </button>
        `;
      })
      .join("");

    const cardsHtml = list
      .map(
        (z) => `
        <article class="info-card">
        <h3 class="info-card-title">${utils.escapeHtml(z.title)}</h3>
            <p class="dropoff-type"><strong>Что принимают:</strong> ${utils.escapeHtml(z.type)}</p>
            <p class="info-card-copy">${utils.escapeHtml(z.note)}</p>
        </article>
        `
        )
        .join("");

    container.innerHTML = `
        <div class="map-layout">
        <div class="schematic-board">
                <p class="schematic-title">Схематическая модель приёма · ${utils.escapeHtml(cityName || "Город")} (без координат)</p>
            <div class="zone-nodes">${nodesHtml}</div>
          <div class="info-card" style="margin-top: 12px;">
            <h3 class="info-card-title">${utils.escapeHtml(activeZone.title)}</h3>
            <p class="dropoff-type"><strong>Фракции:</strong> ${utils.escapeHtml(activeZone.type)}</p>
            <p class="info-card-copy">${utils.escapeHtml(activeZone.note)}</p>
                </div>
        </div>
        <div class="dropoff-grid">${cardsHtml}</div>
        </div>
    `;

    container.querySelectorAll("[data-zone-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
        if (typeof onSelectZone === "function") {
            onSelectZone(btn.dataset.zoneId);
        }
        });
    });
    }

    return { render };
})();