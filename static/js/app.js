import { CITY_DATA, ITEMS_DATABASE } from './data.js';

let currentCity = 'berlin';

function renderCityBins() {
    const city = CITY_DATA[currentCity];
    const container = document.getElementById('binSchemeGrid');
    
    if (!city || !container) return;

    document.getElementById('binSchemeCityName').textContent = city.name;

    container.innerHTML = city.bins.map(bin => 
        <div class="p-3.5 rounded-xl border flex flex-col justify-between ${bin.color}">
            <span class="font-bold text-sm">${bin.name}</span>
            <span class="text-xs opacity-90">${bin.type}</span>
        </div>
    ).join('');
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    renderCityBins();
});