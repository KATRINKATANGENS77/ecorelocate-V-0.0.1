const EcoRelocateUtils = (() => {
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function svgIcon(name, size = 18) {
    const attrs = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
    switch (name) {
      case "brand":
        return `<svg ${attrs}><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/><path d="M13 9l3 3-3 3"/></svg>`;
      case "arrow-right":
        return `<svg ${attrs}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>`;
      case "search":
        return `<svg ${attrs}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>`;
      case "delta":
        return `<svg ${attrs}><path d="M12 3 20 19H4z"/></svg>`;
      case "info":
        return `<svg ${attrs}><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
      case "chevron-down":
        return `<svg ${attrs}><path d="m6 9 6 6 6-6"/></svg>`;
      default:
        return `<svg ${attrs}><circle cx="12" cy="12" r="8"/></svg>`;
    }
  }

  function getCityZones(zones, city) {
    const list = Array.isArray(zones) ? zones : [];
    if (!city || !Array.isArray(city.allowedZoneIds) || city.allowedZoneIds.length === 0) {
      return list;
    }
    const allowed = new Set(city.allowedZoneIds);
    const filtered = list.filter((z) => allowed.has(z.id));
    return filtered.length > 0 ? filtered : list;
  }

  function getRuleDeltaText(item, originId, city) {
    if (!item || !item.ruleDeltaByOrigin) return "";
    const baseDelta = item.ruleDeltaByOrigin[originId] || item.ruleDeltaByOrigin.other || "";
    if (!baseDelta) return "";
    return city && city.name ? `${baseDelta} Текущий город: ${city.name}.` : baseDelta;
  }

  function filterItems(items, { query = "", category = "all", originId = "by", city = null, onlyDelta = false }) {
    const normalized = query.trim().toLowerCase();
    return (items || []).filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      if (!matchesCategory) return false;

      const deltaText = getRuleDeltaText(item, originId, city);
      if (onlyDelta && !deltaText) return false;

      if (!normalized) return true;
      const haystack = [
        item.title,
        item.action,
        item.binLabel,
        deltaText,
        ...(item.keywords || [])
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }

  function calculateChecklistProgress(checklistIds, checkedSet) {
    const total = (checklistIds || []).length;
    const done = (checklistIds || []).filter((id) => checkedSet.has(id)).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
  }

  return {
    escapeHtml,
    svgIcon,    
    getCityZones,
    getRuleDeltaText,
    filterItems,
    calculateChecklistProgress
  };
})();