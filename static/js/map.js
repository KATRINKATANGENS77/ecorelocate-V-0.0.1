// Инициализация карты Leaflet
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Берлин по умолчанию [52.5200, 13.4050]
    mapInstance = L.map('map').setView([52.5200, 13.4050], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    L.marker([52.5200, 13.4050]).addTo(mapInstance)
        .bindPopup('<b>Пункт сбора стекла и текстиля</b><br>Alexanderplatz, Berlin')
        .openPopup();
}