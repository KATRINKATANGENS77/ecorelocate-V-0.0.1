// ==========================================================================
// EcoRelocate — Main Application Logic (Industrial / Expat Utility)
// ==========================================================================

// Переменные состояния
let currentCategory = 'all';
let mapInstance = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    renderBinScheme();
    renderItems();
    renderCommunityTips();
});

// Навигация между страницами (SPA)
function navigateTo(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(`page-${pageId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Обновляем активную кнопку в меню
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.classList.remove('bg-emerald-50', 'text-emerald-700');
        btn.classList.add('text-slate-300');
    });

    const activeNavBtn = document.getElementById(`nav-${pageId}`);
    if (activeNavBtn) {
        activeNavBtn.classList.add('bg-emerald-50', 'text-emerald-700');
        activeNavBtn.classList.remove('text-slate-300');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToHomeAndScroll(elementId) {
    navigateTo('home');
    setTimeout(() => {
        const elem = document.getElementById(elementId);
        if (elem) {
            elem.scrollIntoView({ behavior: 'smooth' });
        }
    }, 100);
}

function navigateToHomeFilter(cat) {
    navigateTo('home');
    filterCategory(cat);
    setTimeout(() => {
        scrollToEngine();
    }, 100);
}

function scrollToEngine() {
    const engine = document.getElementById('wasteEngine');
    if (engine) {
        engine.scrollIntoView({ behavior: 'smooth' });
    }
}

// Поиск и фильтрация
function syncAndSearch(value) {
    const engineInput = document.getElementById('engineSearch');
    if (engineInput) {
        engineInput.value = value;
    }
    renderItems();
}

function quickSearch(query) {
    const heroSearch = document.getElementById('heroSearch');
    if (heroSearch) {
        heroSearch.value = query;
        syncAndSearch(query);
    }
    scrollToEngine();
}

function filterCategory(cat) {
    currentCategory = cat;
    
    // Переключение стилей активной кнопки категории
    const buttons = document.querySelectorAll('#categoryFilterContainer .cat-btn');
    buttons.forEach(btn => {
        btn.classList.remove('bg-slate-900', 'text-white', 'border-slate-900');
        btn.classList.add('bg-white', 'text-slate-700', 'border-slate-300');
    });

    // Если событие вызвано кликом, подсвечиваем нужную кнопку
    if (event && event.currentTarget) {
        event.currentTarget.classList.remove('bg-white', 'text-slate-700', 'border-slate-300');
        event.currentTarget.classList.add('bg-slate-900', 'text-white', 'border-slate-900');
    }

    renderItems();
}

// Отрисовка схемы баков
function renderBinScheme() {
    const container = document.getElementById('binSchemeGrid');
    if (!container) return;

    const bins = [
        { color: 'bg-amber-400', name: 'Желтый бак', desc: 'Пластик, металл, упаковка' },
        { color: 'bg-blue-600', name: 'Синий бак', desc: 'Бумага, картон, газеты' },
        { color: 'bg-amber-800', name: 'Коричневый бак', desc: 'Биоотходы, органика' },
        { color: 'bg-slate-700', name: 'Серый/Черный бак', desc: 'Смешанный мусор (Restmüll)' },
        { color: 'bg-emerald-600', name: 'Зеленый бак', desc: 'Стекло (сортировка по цветам)' }
    ];

    container.innerHTML = bins.map(bin => `
        <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between shadow-sm">
            <div class="flex items-center gap-2 mb-2">
                <span class="w-3.5 h-3.5 rounded-sm ${bin.color} inline-block shadow"></span>
                <span class="font-bold text-xs text-white">${bin.name}</span>
            </div>
            <p class="text-xs text-slate-400 leading-snug">${bin.desc}</p>
        </div>
    `).join('');
}

// Отрисовка карточек предметов
function renderItems() {
    const grid = document.getElementById('itemsGrid');
    const noResults = document.getElementById('noResults');
    const searchVal = (document.getElementById('engineSearch')?.value || document.getElementById('heroSearch')?.value || '').toLowerCase();
    
    if (!grid) return;

    const sampleItems = [
        { name: 'Коробка от пиццы', category: 'paper', bin: 'Blaue Tonne (если чистая)', tip: 'Жирный картон не перерабатывается — его в Restmüll.' },
        { name: 'Батарейки и аккумуляторы', category: 'ewaste', bin: 'Контейнеры в супермаркетах', tip: 'Категорически запрещено бросать в бытовые баки из-за риска возгорания.' },
        { name: 'Пластиковые бутылки (PET)', category: 'plastic', bin: 'Gelbe Tonne / Фандомат', tip: 'Сдавайте в автоматы магазинов для возврата залога (Pfand).' },
        { name: 'Стеклянные бутылки', category: 'glass', bin: 'Altglas контейнеры', tip: 'Обязательно сортируйте по цветам: белое, зеленое, коричневое.' }
    ];

    const filtered = sampleItems.filter(item => {
        const matchesCat = currentCategory === 'all' || item.category === currentCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchVal);
        return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '';
        noResults?.classList.remove('hidden');
        return;
    }

    noResults?.classList.add('hidden');
    grid.innerHTML = filtered.map(item => `
        <div class="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:border-emerald-600 transition-colors space-y-4">
            <div class="flex items-start justify-between">
                <h3 class="font-bold text-slate-900 text-base">${item.name}</h3>
                <span class="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 uppercase">${item.category}</span>
            </div>
            <div class="inline-block px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <i class="fa-solid fa-recycle mr-1"></i> ${item.bin}
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
                <i class="fa-solid fa-lightbulb text-amber-500 mr-1"></i> ${item.tip}
            </p>
        </div>
    `).join('');
}

// Инициализация карты Leaflet
function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || mapInstance) return;

    // Координаты Берлина по умолчанию
    mapInstance = L.map('map').setView([52.5200, 13.4050], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(mapInstance);

    // Пример маркера пункта приема
    L.marker([52.5200, 13.4050]).addTo(mapInstance)
        .bindPopup('<b>Центр утилизации BSR</b><br>Прием стекла, техники и крупного мусора.')
        .openPopup();
}

// Работа с советами сообщества
const defaultTips = [
    { author: 'Мария (Берлин)', text: 'Во многих супермаркетах стоит Pfand-автомат для бутылок. Главное — не сминайте штрихкод!' },
    { author: 'Дмитрий (Варшава)', text: 'Старую одежду в хорошем состоянии можно сдать в специальные контейнеры Красного Креста.' }
];

function renderCommunityTips() {
    const container = document.getElementById('communityTipsList');
    if (!container) return;

    container.innerHTML = defaultTips.map(tip => `
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-user-circle text-emerald-700 text-sm"></i>
                <span class="font-bold text-xs text-slate-900">${tip.author}</span>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">${tip.text}</p>
        </div>
    `).join('');
}

function addCommunityTip(event) {
    if (event) event.preventDefault();
    const authorInput = document.getElementById('tipAuthor');
    const textInput = document.getElementById('tipText');

    if (authorInput && textInput && authorInput.value.trim() && textInput.value.trim()) {
        defaultTips.unshift({
            author: authorInput.value.trim(),
            text: textInput.value.trim()
        });
        
        renderCommunityTips();
        authorInput.value = '';
        textInput.value = '';
    }
}

// Привязка поиска из главного инпута (Hero)
document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'heroSearch') {
        syncAndSearch(e.target.value);
    }
    if (e.target && e.target.id === 'engineSearch') {
        renderItems();
    }
});