// Dashboard Module - Heatmap & Dual Tabs (Premium Charts + Labels)
console.log('📊 Cargando Dashboard MEJORADO (COLORES + LABELS)...');

// Register plugin if available
if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);

    // Global Defaults
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = '#64748b';
    Chart.defaults.scale.grid.color = '#f1f5f9';
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;

    // Default DataLabels config (will be overridden per chart)
    Chart.defaults.plugins.datalabels.color = '#fff';
    Chart.defaults.plugins.datalabels.font = { weight: 'bold', size: 11 };
    Chart.defaults.plugins.datalabels.display = 'auto';
}

const dashboardModule = (() => {
    let allData = [];

    // Facility components
    let lineChartDate = null;
    let barChartAgent = null;
    let pieChartPoints = null;
    let map = null;
    let heatLayer = null;
    let markersLayer = null;

    // Security components
    let lineChartDateSec = null;
    let barChartAgentSec = null;
    let pieChartPointsSec = null;
    let mapSec = null;
    let heatLayerSec = null;
    let markersLayerSec = null;

    // Rich Palette for "More Colors"
    const richPalette = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#E7E9ED', '#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6',
        '#6366f1', '#ec4899', '#14b8a6', '#84cc16', '#a855f7', '#06b6d4'
    ];

    const init = () => {
        console.log('📊 Init Dashboard (Premium + Colors)');
        if (!window.db || !window.firebaseReady) {
            setTimeout(init, 500);
            return;
        }
        fetchData();
        setupTabListeners();
        setupDateFilters();
    };

    let currentFacilityData = [];
    let currentSecurityData = [];

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

        // Refrescar mapa al cambiar de pestaña para evitar errores de renderizado
        setTimeout(() => {
            if (tabName === 'facility') updateMap(currentFacilityData, 'map', 'facility');
            else updateMap(currentSecurityData, 'mapSec', 'security');
            triggerMapResize();
        }, 50);
    };

    const triggerMapResize = () => {
        if (map) map.invalidateSize();
        if (mapSec) mapSec.invalidateSize();
        setTimeout(() => { if (map) map.invalidateSize(); if (mapSec) mapSec.invalidateSize(); }, 200);
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

        console.log(`🔍 Filtrando Dashboard: ${f} a ${t}`);

        const fromDate = new Date(f);
        fromDate.setHours(0, 0, 0, 0); // Start of day

        const toDate = new Date(t);
        toDate.setHours(23, 59, 59, 999); // End of day

        const filtered = allData.filter(d => {
            let date;
            if (d.createdAt && typeof d.createdAt.toDate === 'function') {
                date = d.createdAt.toDate();
            } else if (d.createdAt) {
                date = new Date(d.createdAt);
            } else {
                return false;
            }

            if (isNaN(date.getTime())) return false;
            return date >= fromDate && date <= toDate;
        });

        console.log(`✅ Registros filtrados: ${filtered.length}`);
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
        currentFacilityData = data.filter(d => !d.tipoServicio || d.tipoServicio === 'Facility');
        currentSecurityData = data.filter(d => d.tipoServicio === 'Security');

        updateFacilityDashboard(currentFacilityData);
        updateSecurityDashboard(currentSecurityData);
    };

    // ================= FACILITY RENDER =================
    const updateFacilityDashboard = (data) => {
        const totalEl = document.getElementById('totalRecords');
        if (totalEl) totalEl.textContent = data.length;
        const dateCounts = getDateCounts(data);
        const agentCounts = getAgentCounts(data);
        const pointCounts = getPointCounts(data);

        // Line Chart: Red Gradient
        updateLineChart('lineChartDate', dateCounts, 'Incidencias', '#dc2626', (chart) => lineChartDate = chart);

        // Bar Chart: Varied Palette
        updateBarChart('barChartAgent', agentCounts, 'Registros', richPalette, (chart) => barChartAgent = chart);

        // Doughnut: Varied Palette
        updateDoughnutChart('pieChartPoints', pointCounts, 'Puntos', richPalette, (chart) => pieChartPoints = chart);

        updateMap(data, 'map', 'facility');
    };

    // ================= SECURITY RENDER =================
    const updateSecurityDashboard = (data) => {
        const totalEl = document.getElementById('totalRecordsSec');
        if (totalEl) totalEl.textContent = data.length;
        const dateCounts = getDateCounts(data);
        const agentCounts = getAgentCounts(data);
        const pointCounts = getPointCounts(data);

        // Line Chart: Blue Gradient
        updateLineChart('lineChartDateSec', dateCounts, 'Incidencias', '#4f46e5', (chart) => lineChartDateSec = chart);

        // Bar Chart: Varied Palette
        updateBarChart('barChartAgentSec', agentCounts, 'Registros', richPalette, (chart) => barChartAgentSec = chart);

        // Doughnut: Varied Palette
        updateDoughnutChart('pieChartPointsSec', pointCounts, 'Puntos', richPalette, (chart) => pieChartPointsSec = chart);

        updateMap(data, 'mapSec', 'security');
    };

    // ================= PREMIUM CHART FUNCTIONS =================

    // 1. Line Chart (Gradient Fill)
    const updateLineChart = (canvasId, dataMap, label, baseColor, setterRef) => {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        const exist = Chart.getChart(ctx);
        if (exist) exist.destroy();

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(dataMap),
                datasets: [{
                    label: label,
                    data: Object.values(dataMap),
                    borderColor: baseColor,
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: baseColor,
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: { display: false } // No labels on line points
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { borderDash: [5, 5] }, beginAtZero: true }
                }
            }
        });
        setterRef(chart);
    };

    // 2. Bar Chart (More Colors + Labels)
    const updateBarChart = (canvasId, dataMap, label, palette, setterRef) => {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        const exist = Chart.getChart(ctx);
        if (exist) exist.destroy();

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(dataMap),
                datasets: [{
                    label: label,
                    data: Object.values(dataMap),
                    backgroundColor: palette,
                    borderRadius: 6,
                    barPercentage: 0.6,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end', align: 'end', color: '#555',
                        formatter: (value) => value
                    }
                },
                scales: {
                    x: { grid: { borderDash: [5, 5] } },
                    y: { grid: { display: false } }
                }
            }
        });
        setterRef(chart);
    };

    // 3. Doughnut Chart (Percentages + Counts)
    const updateDoughnutChart = (canvasId, dataMap, label, palette, setterRef) => {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        const exist = Chart.getChart(ctx);
        if (exist) exist.destroy();

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(dataMap),
                datasets: [{
                    data: Object.values(dataMap),
                    backgroundColor: palette,
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: { usePointStyle: true, font: { size: 11 } }
                    },
                    datalabels: {
                        display: true,
                        color: '#fff',
                        font: { weight: 'bold', size: 12 },
                        formatter: (value, ctx) => {
                            let sum = 0;
                            let dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.map(data => sum += data);
                            let percentage = (value * 100 / sum).toFixed(1) + "%";
                            return `${value}\n(${percentage})`;
                        },
                        anchor: 'center',
                        align: 'center',
                        textAlign: 'center'
                    }
                }
            }
        });
        setterRef(chart);
    };

    // ================= MAP LOGIC (ROBUST) =================
    const updateMap = (data, elementId, type) => {
        if (!L) return;
        const mapElement = document.getElementById(elementId);
        if (!mapElement) return;

        // CRITICAL: If map is hidden, Leaflet.heat will crash on getImageData (width 0)
        const isHidden = mapElement.offsetWidth === 0 || mapElement.offsetHeight === 0;
        if (isHidden) {
            console.log(`📡 Mapa ${type} oculto, se actualizará al cambiar de pestaña.`);
            return;
        }

        let targetMap = (type === 'facility') ? map : mapSec;

        if (!targetMap) {
            targetMap = L.map(elementId).setView([-12.046374, -77.042793], 12); // Default Lima/Centric instead of US
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(targetMap);
            if (type === 'facility') map = targetMap; else mapSec = targetMap;

            // Auto resize
            const resizeObserver = new ResizeObserver(() => targetMap.invalidateSize());
            resizeObserver.observe(mapElement);
        }

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
                    heatPoints.push([lat, lng, 0.8]);
                    validPoints.push([lat, lng]);

                    const markerColor = (type === 'facility') ? '#dc2626' : '#4f46e5';
                    const marker = L.circleMarker([lat, lng], {
                        radius: 8, fillColor: markerColor, color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8
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

        if (typeof L.heatLayer === 'function' && heatPoints.length > 0) {
            const gradient = (type === 'facility') ? { 0.4: 'blue', 0.65: 'lime', 1: 'red' } : { 0.4: 'cyan', 0.65: 'blue', 1: 'purple' };
            const newLayer = L.heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 10, gradient: gradient }).addTo(targetMap);
            if (type === 'facility') heatLayer = newLayer; else heatLayerSec = newLayer;
        }

        if (markerArray.length > 0) {
            const newMarkerLayer = L.layerGroup(markerArray).addTo(targetMap);
            if (type === 'facility') markersLayer = newMarkerLayer; else markersLayerSec = newMarkerLayer;
        }

        if (validPoints.length === 1) {
            targetMap.setView(validPoints[0], 15);
        } else if (validPoints.length > 1) {
            const bounds = L.latLngBounds(validPoints);
            targetMap.fitBounds(bounds, { padding: [50, 50] });
        }

        targetMap.invalidateSize();
    };

    const getDateCounts = (d) => { const c = {}; d.forEach(x => { const dt = x.createdAt?.toDate ? x.createdAt.toDate() : new Date(x.createdAt); if (!isNaN(dt)) c[dt.toLocaleDateString('es-PE')] = (c[dt.toLocaleDateString('es-PE')] || 0) + 1; }); return c; };
    const getAgentCounts = (d) => { const c = {}; d.forEach(x => { const n = x.nombreAgente || 'N/A'; c[n] = (c[n] || 0) + 1; }); return c; };
    const getPointCounts = (d) => { const c = {}; d.forEach(x => { const p = x.punto || 'N/A'; c[p] = (c[p] || 0) + 1; }); return c; };
    const formatDate = (s) => { try { return (s.toDate ? s.toDate() : new Date(s)).toLocaleDateString(); } catch (e) { return ''; } };

    return { init, reload: fetchData };
})();
