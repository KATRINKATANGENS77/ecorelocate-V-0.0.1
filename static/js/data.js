export const CITY_DATA = {
    berlin: {
        name: "Берлин",
        coords: [52.5200, 13.4050],
        zoom: 13,
        checklist: [
            { title: "Залоговая тара (Pfand)", icon: "fa-wine-bottle", desc: "На большинство пластиковых и стеклянных бутылок установлен залог €0.08–0.25. Сдавайте в фандоматы в магазинах.", color: "text-amber-600", bg: "bg-amber-50" },
            { title: "Крупногабарит (Sperrmüll)", icon: "fa-couch", desc: "Мебель нельзя выставлять на тротуар! Заказывайте вывоз BSR или отвозите в спец. пункт Wertstoffhof.", color: "text-indigo-600", bg: "bg-indigo-50" },
            { title: "Желтый бак (Wertstoff)", icon: "fa-dumpster", desc: "Принимает пластик, металл и тетрапаки. Мыть не нужно, главное — опустошить.", color: "text-emerald-600", bg: "bg-emerald-50" },
            { title: "Приложение BSR", icon: "fa-mobile-screen-button", desc: "Скачайте BSR App для проверки календаря вывоза мусора и адресов эко-центров.", color: "text-sky-600", bg: "bg-sky-50" }
        ],
        bins: [
            { name: "Gelbe Tonne", type: "Пластик, металл и тетрапак", color: "bg-yellow-400 text-slate-900 border-yellow-500" },
            { name: "Blaue Tonne", type: "Бумага и картон", color: "bg-blue-600 text-white border-blue-700" },
            { name: "Biotonne", type: "Органические пищевые отходы", color: "bg-amber-800 text-white border-amber-900" },
            { name: "Altglas", type: "Стекло (Прозрачное / Зеленое / Коричневое)", color: "bg-emerald-700 text-white border-emerald-800" },
            { name: "Restmüll", type: "Неперерабатываемый остаточный мусор", color: "bg-slate-800 text-white border-slate-900" }
        ],
        mapMarkers: [
            { id: 1, lat: 52.5225, lng: 13.4110, title: "BSR Wertstoffhof Alexanderstraße", type: "hub", desc: "Городской центр приема техники, мебели и опасных отходов.", address: "Alexanderstraße 16" },
            { id: 2, lat: 52.5180, lng: 13.3950, title: "Контейнеры Altglas", type: "glass", desc: "Раздельные баки для белого, зеленого и коричневого стекла.", address: "Unter den Linden" },
            { id: 3, lat: 52.5290, lng: 13.4010, title: "Контейнер Humana", type: "clothing", desc: "Прием чистой одежды и обуви.", address: "Torstraße 110" },
            { id: 4, lat: 52.5120, lng: 13.4200, title: "Сбор батареек Saturn", type: "ewaste", desc: "Бесплатный прием батареек и мелкой бытовой техники.", address: "East Side Mall" }
        ]
    },
    warsaw: {
        name: "Варшава",
        coords: [52.2297, 21.0122],
        zoom: 13,
        checklist: [
            { title: "Залоговая система (Kaucja)", icon: "fa-bottle-water", desc: "Стеклянные пивные бутылки можно сдать в супермаркетах с чеком или в автоматах.", color: "text-amber-600", bg: "bg-amber-50" },
            { title: "Крупногабарит (Gabarity)", icon: "fa-bed", desc: "Выносится в строго определенные дни недели к altana śmieciowa. Уточняйте график у администрации.", color: "text-indigo-600", bg: "bg-indigo-50" },
            { title: "Центры PSZOK", icon: "fa-warehouse", desc: "Пункты бесплатного приема лаков, шин, техники и строительного мусора для жителей.", color: "text-emerald-600", bg: "bg-emerald-50" },
            { title: "Приложение 19115", icon: "fa-mobile-screen-button", desc: "Используйте приложение Warszawa 19115 для отслеживания вызова спецтехники.", color: "text-sky-600", bg: "bg-sky-50" }
        ],
        bins: [
            { name: "Metale i Tworzywa", type: "Желтый — Пластик и металл", color: "bg-yellow-400 text-slate-900 border-yellow-500" },
            { name: "Papier", type: "Синий — Чистая бумага", color: "bg-blue-600 text-white border-blue-700" },
            { name: "Szkło", type: "Зеленый — Стеклянная тара", color: "bg-emerald-600 text-white border-emerald-700" },
{ name: "Bio", type: "Коричневый — Пищевые отходы", color: "bg-amber-800 text-white border-amber-900" },
            { name: "Zmieszane", type: "Черный — Смешанные отходы", color: "bg-slate-800 text-white border-slate-900" }
        ],
        mapMarkers: [
            { id: 1, lat: 52.2350, lng: 21.0080, title: "Пункт PSZOK Centrum", type: "hub", desc: "Прием любых специфических отходов.", address: "ul. Marszałkowska" },
            { id: 2, lat: 52.2240, lng: 21.0200, title: "Контейнер Electro-Eko", type: "ewaste", desc: "Сбор мелкой электроники и кабелей.", address: "ul. Piękna" }
        ]
    },
    london: {
        name: "Лондон",
        coords: [51.5074, -0.1278],
        zoom: 12,
        checklist: [
            { title: "Различие по районам", icon: "fa-map-pin", desc: "В каждом из 33 районов Лондона свои правила и цвета баков. Проверяйте ваш Council.", color: "text-indigo-600", bg: "bg-indigo-50" },
            { title: "Вывоз крупной техники", icon: "fa-truck-pickup", desc: "Требуется предварительный заказ через сайт совета района (платная услуга ~£20-40).", color: "text-amber-600", bg: "bg-amber-50" }
        ],
        bins: [
            { name: "Dry Recycling Bin", type: "Зеленый/Синий — Бумага, банки, пластик", color: "bg-emerald-600 text-white border-emerald-700" },
            { name: "Food Waste Caddy", type: "Маленький бак — Пищевые отходы", color: "bg-amber-800 text-white border-amber-900" },
            { name: "General Waste", type: "Черный бак — Неперерабатываемый мусор", color: "bg-slate-800 text-white border-slate-900" }
        ],
        mapMarkers: [
            { id: 1, lat: 51.5120, lng: -0.1150, title: "Holborn Recycling Bank", type: "glass", desc: "Контейнеры для стекла и металла.", address: "Holborn" }
        ]
    },
    paris: {
        name: "Париж",
        coords: [48.8566, 2.3522],
        zoom: 13,
        checklist: [
            { title: "Единый Bac Jaune", icon: "fa-box-archive", desc: "В Париже ВЕСЬ пластик, металл и бумага бросаются в желтый бак.", color: "text-amber-600", bg: "bg-amber-50" }
        ],
        bins: [
            { name: "Bac Jaune (Желтый)", type: "Пластик, металл, упаковка, бумага", color: "bg-yellow-400 text-slate-900 border-yellow-500" },
            { name: "Bac Blanc (Белый)", type: "Стеклянные бутылки и банки", color: "bg-slate-100 text-slate-900 border-slate-300" },
            { name: "Bac Vert (Зеленый)", type: "Остаточный мусор", color: "bg-slate-800 text-white border-slate-900" }
        ],
        mapMarkers: [
            { id: 1, lat: 48.8600, lng: 2.3470, title: "Station Trilib' Châtelet", type: "hub", desc: "Модульная уличная станция сортировки.", address: "Rue de Rivoli" }
        ]
    },
    nyc: {
        name: "Нью-Йорк",
        coords: [40.7128, -74.0060],
        zoom: 12,
        checklist: [
            { title: "Bottle Bill (5¢)", icon: "fa-sack-dollar", desc: "Залог 5 центов за банки и бутылки от напитков.", color: "text-emerald-600", bg: "bg-emerald-50" }
        ],
        bins: [
            { name: "Blue Bin", type: "Металл, стекло, пластик", color: "bg-blue-600 text-white border-blue-700" },
            { name: "Green Bin", type: "Бумага и картон", color: "bg-emerald-600 text-white border-emerald-700" },
            { name: "Black Bin", type: "Смешанный мусор", color: "bg-slate-800 text-white border-slate-900" }
        ],
        mapMarkers: []
    },
    tbilisi: {
        name: "Тбилиси",
        coords: [41.7151, 44.8271],
        zoom: 13,
        checklist: [
            { title: "Частные инициативы", icon: "fa-hands-holding-child", desc: "Сбор пластика осуществляется через эко-боксы Parki Tene и Tene.", color: "text-emerald-600", bg: "bg-emerald-50" }
        ],
        bins: [
            { name: "Общие баки", type: "Смешанные мусорные баки", color: "bg-slate-700 text-white border-slate-800" },
            { name: "Parki Tene", type: "Сбор чистого пластика", color: "bg-emerald-600 text-white border-emerald-700" }
        ],
        mapMarkers: []
    }
};
export const ITEMS_DATABASE = [
    {
        id: "pizza-box",
        title: "Коробка от пиццы",
        category: "paper",
        icon: "🍕",
        prep: ["Удалите остатки еды и сыра.", "Если дно сильно пропитано жиром, оторвите его.", "Чистую крышку можно выкинуть в бумагу."],
        pitfall: "Жирный картон портит переработку бумаги! В большинстве городов жирное дно выбрасывают в общий мусор.",
        cityBin: {
            berlin: "Restmüll (если жирная) / Blaue Tonne (только чистый вершок)",
            warsaw: "Zmieszane (если жирная) / Papier (чистая часть)",
            london: "General Waste / Dry Recycling (чистая часть)",
            paris: "Bac Jaune (чистая часть) / Bac Vert (жирное дно)",
            nyc: "Brown Bin (компост) / Black Trash",
            tbilisi: "Общий мусорный бак"
        }
    },
    {
        id: "batteries",
        title: "Батарейки (AA / AAA)",
        category: "ewaste",
        icon: "🔋",
        prep: ["Заклейте контакты скотчем.", "Собирайте отдельно дома.", "Сдавайте в боксы в магазинах."],
        pitfall: "Выброшенные батарейки вызывают пожары в мусоровозах и отравляют почву!",
        cityBin: {
            berlin: "Боксы в супермаркетах (Batt-Box) / BSR Yard",
            warsaw: "Красные контейнеры в супермаркетах",
            london: "Боксы в продуктовых магазинах",
            paris: "Контейнеры в магазине / Станции Trilib",
            nyc: "Магазины Staples / Best Buy",
            tbilisi: "Боксы Parki Tene / Магазины техники"
        }
    },
    {
        id: "glass-bottle",
        title: "Стеклянные бутылки",
        category: "glass",
        icon: "🍾",
        prep: ["Опустошите жидкость.", "Снимите крышку (пластик/металл — в другой бак)."],
        pitfall: "Не бросайте оконные стекла и бокалы в контейнеры для бутылок — у них разная температура плавления!",
        cityBin: {
            berlin: "Altglas (сортируйте по цвету)",
            warsaw: "Зеленый бак (Szkło)",
            london: "Dry Recycling / Bottle Bank",
            paris: "Bac Blanc (белый бак)",
            nyc: "Blue Bin",
            tbilisi: "Пункты сбора стекла"
        }
    },
    {
        id: "milk-carton",
        title: "Тетрапак (молоко / сок)",
        category: "plastic",
        icon: "🧃",
        prep: ["Слейте остатки.", "Сплющите упаковку для экономии места.", "Закрутите крышку обратно."],
        pitfall: "Тетрапак содержит фольгу и пластик, его нельзя кидать в чистую бумагу!",
        cityBin: {
            berlin: "Gelbe Tonne (Желтый бак)",
            warsaw: "Yellow Bin (Metale i Tworzywa)",
            london: "Dry Recycling",
            paris: "Bac Jaune",
            nyc: "Blue Bin",
            tbilisi: "Общий бак"
        }
    },
    {
        id: "old-clothes",
        title: "Старая одежда и обувь",
        category: "textile",
        icon: "👕",
        prep: ["Вещи должны быть сухими и чистыми.", "Сложите в пакет перед броском в контейнер."],
        pitfall: "Влажные вещи плесневеют и портят весь контейнер текстиля.",
        cityBin: {
            berlin: "Контейнеры Altkleider / Humana",
            warsaw: "Контейнеры PCK",
            london: "Благотворительные магазины Oxfam",
            paris: "Контейнеры Le Relais",
            nyc: "Пункты приема одежды",
            tbilisi: "Благотворительные боксы"
        }
    }
];