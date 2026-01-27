// Dashboard Module - Heatmap & Dual Tabs (Markers & Centering Fix)
console.log('📊 Cargando Dashboard MEJORADO (MARKERS)...');

if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

const dashboardModule = (() => {
    let allData = [];

    // Facility components
    let lineChartDate = null;
    let barChartAgent = null;
    let pieChartPoints = null;
    let map = null;
    let heatLayer = null;
    let markersLayer = null; // Group for facility markers

    // Security components
    let lineChartDateSec = null;
    let barChartAgentSec = null;
    let pieChartPointsSec = null;
    let mapSec = null;
    let heatLayerSec = null;
    let markersLayerSec = null; // Group for security markers

    const init = () => {
        console.log('📊 Init Dashboard (Dual Tabs)');
        if (!window.db || !window.firebaseReady) {
            setTimeout(init, 500);
            return;
        }
        fetchData();
        setupTabListeners();
        setupDateFilters();
    };

    const setupTabListeners = () => {
        const tabBtns = document.querySelectorAll('.facility-security-tabs .tab-btn');
        tabBtns.forEach(btn => btn.addEventListener('click', switchTab));
    };

    const switchTab = (e) => {
        const page = e.currentTarget.closest('.page');
        if (!page || page.id !== 'dashboardPage') return;

        const tabs = page.querySelectorAll('.facility-security-tabs .tab-btn');
        const contents = page.querySelectorAll('.tab-content');

        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        e.currentTarget.classList.add('active');
        const tabName = e.currentTarget.dataset.tab;
        const content = document.getElementById(tabName + 'Content');
        if (content) content.classList.add('active');

        triggerMapResize();
    };

    const triggerMapResize = () => {
        if (map) map.invalidateSize();
        if (mapSec) mapSec.invalidateSize();

        setTimeout(() => {
            if (map) map.invalidateSize();
            if (mapSec) mapSec.invalidateSize();
        }, 100);

        setTimeout(() => {
            if (map) map.invalidateSize();
            if (mapSec) mapSec.invalidateSize();
        }, 400);
    };

    const setupDateFilters = () => {
        const container = document.getElementById('dashboardFilterContainer');
        if (container && container.innerHTML.trim() === '') {
            container.innerHTML = `
                 <div style="display:flex; gap:10px; margin-bottom:20px; align-items:flex-end;">
                     <div>
                         <label style="display:block; font-size:12px; font-weight:bold;">Desde</label>
                         <input type="date" id="dashFrom" style="padding:8px; border:1px solid #ccc; border-radius:6px;">
                     </div>
                     <div>
                         <label style="display:block; font-size:12px; font-weight:bold;">Hasta</label>
                         <input type="date" id="dashTo" style="padding:8px; border:1px solid #ccc; border-radius:6px;">
                     </div>
                     <button id="dashFilterBtn" style="background:#dc2626; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">Filtrar</button>
                     <button id="dashResetBtn" style="background:#fff; color:#333; border:1px solid #ccc; padding:8px 16px; border-radius:6px; cursor:pointer;">Limpiar</button>
                 </div>
             `;
            document.getElementById('dashFilterBtn').addEventListener('click', () => filterDashboard());
            document.getElementById('dashResetBtn').addEventListener('click', () => {
                document.getElementById('dashFrom').value = '';
                document.getElementById('dashTo').value = '';
                processData(allData);
            });
        }
    };

    const filterDashboard = () => {
        const f = document.getElementById('dashFrom').value;
        const t = document.getElementById('dashTo').value;
        if (!f || !t) return alert('Seleccione fechas');

        const fromDate = new Date(f);
        const toDate = new Date(t);
        toDate.setHours(23, 59, 59);

        const filtered = allData.filter(d => {
            const date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
            return date >= fromDate && date <= toDate;
        });
        processData(filtered);
    };

    const fetchData = async () => {
        try {
            const snapshot = await window.db.collection('IncidenciasEU').get();
            allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            processData(allData);
        } catch (err) {
            console.error(err);
        }
    };

    const processData = (data) => {
        const facilityData = data.filter(d => !d.tipoServicio || d.tipoServicio === 'Facility');
        const securityData = data.filter(d => d.tipoServicio === 'Security');

        updateFacilityDashboard(facilityData);
        updateSecurityDashboard(securityData);
    };

    const updateFacilityDashboard = (data) => {
        document.getElementById('totalRecords').textContent = data.length;
        const dateCounts = getDateCounts(data);
        const agentCounts = getAgentCounts(data);
        const pointCounts = getPointCounts(data);
        updateChart('lineChartDate', 'line', dateCounts, 'Incidencias', '#dc2626', (chart) => lineChartDate = chart);
        updateChart('barChartAgent', 'bar', agentCounts, 'Registros', '#dc2626', (chart) => barChartAgent = chart, { indexAxis: 'y' });
        updateChart('pieChartPoints', 'doughnut', pointCounts, 'Puntos', ['#dc2626', '#b91c1c', '#f87171'], (chart) => pieChartPoints = chart);
        updateMap(data, 'map', 'facility');
    };

    const updateSecurityDashboard = (data) => {
        document.getElementById('totalRecordsSec').textContent = data.length;
        const dateCounts = getDateCounts(data);
        const agentCounts = getAgentCounts(data);
        const pointCounts = getPointCounts(data);
        updateChart('lineChartDateSec', 'line', dateCounts, 'Incidencias', '#4f46e5', (chart) => lineChartDateSec = chart);
        updateChart('barChartAgentSec', 'bar', agentCounts, 'Registros', '#4f46e5', (chart) => barChartAgentSec = chart, { indexAxis: 'y' });
        updateChart('pieChartPointsSec', 'doughnut', pointCounts, 'Puntos', ['#4f46e5', '#4338ca', '#818cf8'], (chart) => pieChartPointsSec = chart);
        updateMap(data, 'mapSec', 'security');
    };

    const updateChart = (canvasId, type, dataMap, label, color, setterRef, extraOptions = {}) => {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();
        const labels = Object.keys(dataMap);
        const values = Object.values(dataMap);
        const bg = Array.isArray(color) ? color : (type === 'line' ? color + '1A' : color);
        const border = Array.isArray(color) ? color : color;
        const chart = new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: values,
                    backgroundColor: bg,
                    borderColor: border,
                    borderWidth: 1,
                    fill: type === 'line',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                ...extraOptions,
                plugins: { legend: { display: type === 'doughnut' } }
            }
        });
        setterRef(chart);
    };

    // ================= MAP LOGIC (Markers + Heatmap) =================
    const updateMap = (data, elementId, type) => {
        if (!L) return;
        const mapElement = document.getElementById(elementId);
        if (!mapElement) return;

        let targetMap = (type === 'facility') ? map : mapSec;

        if (!targetMap) {
            targetMap = L.map(elementId).setView([37.0902, -95.7129], 4);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(targetMap);
            if (type === 'facility') map = targetMap;
            else mapSec = targetMap;
            const resizeObserver = new ResizeObserver(() => targetMap.invalidateSize());
            resizeObserver.observe(mapElement);
        }

        // --- Clear Layers ---
        let currentHeat = (type === 'facility') ? heatLayer : heatLayerSec;
        if (currentHeat) targetMap.removeLayer(currentHeat);

        let currentMarkers = (type === 'facility') ? markersLayer : markersLayerSec;
        if (currentMarkers) targetMap.removeLayer(currentMarkers);

        const heatPoints = [];
        const markerArray = [];
        const validPoints = [];

        data.forEach(item => {
            if (item.ubicacion && item.ubicacion.lat && item.ubicacion.lng) {
                const lat = parseFloat(item.ubicacion.lat);
                const lng = parseFloat(item.ubicacion.lng);
                if (!isNaN(lat) && !isNaN(lng)) {
                    // Heatmap point
                    heatPoints.push([lat, lng, 0.8]);
                    validPoints.push([lat, lng]);

                    // Marker
                    const markerColor = (type === 'facility') ? '#dc2626' : '#4f46e5'; // Red vs Blue/Indigo

                    // Simple Circle Marker for performance and aesthetics
                    const marker = L.circleMarker([lat, lng], {
                        radius: 8,
                        fillColor: markerColor,
                        color: "#fff",
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    });

                    marker.bindPopup(`
                        <div style="font-size:12px;">
                            <strong>${item.nombreAgente || 'Agente'}</strong><br/>
                            ${item.punto || ''}<br/>
                            <small>${formatDate(item.createdAt)}</small>
                        </div>
                    `);

                    markerArray.push(marker);
                }
            }
        });

        // Add Heatmap
        if (typeof L.heatLayer === 'function' && heatPoints.length > 0) {
            const gradient = (type === 'facility')
                ? { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
                : { 0.4: 'cyan', 0.65: 'blue', 1: 'purple' };
            const newLayer = L.heatLayer(heatPoints, {
                radius: 25, blur: 15, maxZoom: 10, gradient: gradient
            }).addTo(targetMap);
            if (type === 'facility') heatLayer = newLayer; else heatLayerSec = newLayer;
        }

        // Add Markers (Always add markers so single points are visible)
        if (markerArray.length > 0) {
            const newMarkerLayer = L.layerGroup(markerArray).addTo(targetMap);
            if (type === 'facility') markersLayer = newMarkerLayer; else markersLayerSec = newMarkerLayer;
        }

        // Center Map
        if (validPoints.length === 1) {
            // If strictly 1 point, simplify the view
            targetMap.setView(validPoints[0], 15);
        } else if (validPoints.length > 1) {
            const bounds = L.latLngBounds(validPoints);
            targetMap.fitBounds(bounds, { padding: [50, 50] });
        } else {
            // No points, default view?
            // Keep default
        }

        setTimeout(() => targetMap.invalidateSize(), 200);
    };

    const getDateCounts = (data) => {
        const counts = {};
        data.forEach(d => {
            const date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
            if (isNaN(date)) return;
            const key = date.toLocaleDateString('es-PE');
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    };
    const getAgentCounts = (d) => { const c = {}; d.forEach(x => { const n = x.nombreAgente || 'N/A'; c[n] = (c[n] || 0) + 1; }); return c; };
    const getPointCounts = (d) => { const c = {}; d.forEach(x => { const p = x.punto || 'N/A'; c[p] = (c[p] || 0) + 1; }); return c; };

    // Quick format helper for popups
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const d = dateString.toDate ? dateString.toDate() : new Date(dateString);
            return d.toLocaleDateString();
        } catch (e) { return ''; }
    };

    return { init, reload: fetchData };
})();
