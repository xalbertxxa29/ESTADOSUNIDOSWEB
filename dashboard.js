// Dashboard Module - Fully Refactored & Complete
console.log('📊 Cargando Dashboard COMPLETO...');

// Registrar el plugin DataLabels (OBLIGATORIO en Chart.js v3+)
Chart.register(ChartDataLabels);
console.log('✅ Plugin ChartDataLabels registrado correctamente...');

/***************************************************************************
 *  DASHBOARD MODULE
 *  - Código ordenado, completo y sin omisiones
 *  - Gráficos funcionales
 *  - Mapa corregido (coordenadas Firebase)
 *  - Optimizaciones de rendimiento
 ***************************************************************************/

const dashboardModule = (() => {
    let incidenciasData = [];
    let lineChartDate = null;
    let barChartAgent = null;
    let pieChartPoints = null;
    let map = null;
    let markers = [];
    let filteredData = [];
    let dateFilterStart = null;
    let dateFilterEnd = null;

    /***************************************************************************
     * EXTRAER COORDENADAS
     ***************************************************************************/
    const extractCoordinates = (item) => {
        if (!item.ubicacion || typeof item.ubicacion !== 'object') return null;

        const lat = parseFloat(item.ubicacion.lat);
        const lng = parseFloat(item.ubicacion.lng);

        if (lat === null || lng === null) return null;
        if (isNaN(lat) || isNaN(lng)) return null;
        if (lat < -90 || lat > 90) return null;
        if (lng < -180 || lng > 180) return null;

        return { lat, lng };
    };

    /***************************************************************************
     * INICIALIZACIÓN
     ***************************************************************************/
    const init = () => {
        if (!window.db || !window.firebaseReady) {
            setTimeout(init, 500);
            return;
        }

        fetchData();
        setupTabListeners();
        setupDateFilters();
    };

    /***************************************************************************
     * FILTROS DE FECHA
     ***************************************************************************/
    const setupDateFilters = () => {
        const filterContainer = document.getElementById('dashboardFilterContainer');
        if (!filterContainer) return;

        const filterHTML = `
            <div class="dashboard-filter-modern" style="display: flex; gap: 16px; padding: 18px 20px; background: linear-gradient(135deg, #fff 0%, #ffeaea 100%); border-radius: 14px; margin-bottom: 24px; align-items: center; box-shadow: 0 2px 8px rgba(220,38,38,0.08); border: 1.5px solid #dc2626;">
                <div style="display: flex; gap: 10px; align-items: center; flex: 1;">
                    <img src="logo.png" alt="Logo" style="height: 32px; width: 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(220,38,38,0.15); background: #fff;">
                    <label style="font-weight: 700; color: #dc2626; font-size: 15px; min-width: 60px;">Desde:</label>
                    <input type="date" id="dateFilterStart" style="padding: 10px 13px; border: 1.5px solid #dc2626; border-radius: 8px; font-size: 13px; background: #fff; cursor: pointer; color: #1a1a1a; font-weight: 500;">
                </div>
                <div style="width: 1px; height: 28px; background: #dc2626;"></div>
                <div style="display: flex; gap: 10px; align-items: center; flex: 1;">
                    <label style="font-weight: 700; color: #dc2626; font-size: 15px; min-width: 60px;">Hasta:</label>
                    <input type="date" id="dateFilterEnd" style="padding: 10px 13px; border: 1.5px solid #dc2626; border-radius: 8px; font-size: 13px; background: #fff; cursor: pointer; color: #1a1a1a; font-weight: 500;">
                </div>
                <button id="applyDateFilter" style="padding: 10px 22px; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; transition: all 0.3s; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.18);">Filtrar</button>
                <button id="clearDateFilter" style="padding: 10px 22px; background: #fff; color: #dc2626; border: 1.5px solid #dc2626; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; transition: all 0.3s;">Limpiar</button>
            </div>
        `;

        filterContainer.innerHTML = filterHTML;

        document.getElementById('applyDateFilter').addEventListener('click', applyDateFilter);
        document.getElementById('clearDateFilter').addEventListener('click', clearDateFilter);
        // Hover effect
        const applyBtn = document.getElementById('applyDateFilter');
        applyBtn.addEventListener('mouseover', () => applyBtn.style.boxShadow = '0 4px 16px rgba(220, 38, 38, 0.25)');
        applyBtn.addEventListener('mouseout', () => applyBtn.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.18)');
    };

    const applyDateFilter = () => {
        const startInput = document.getElementById('dateFilterStart').value;
        const endInput = document.getElementById('dateFilterEnd').value;

        if (!startInput || !endInput) {
            alert('Por favor selecciona ambas fechas');
            return;
        }

        dateFilterStart = new Date(startInput);
        dateFilterEnd = new Date(endInput);
        dateFilterEnd.setHours(23, 59, 59, 999);

        filteredData = incidenciasData.filter(item => {
            let itemDate = null;
            if (item.createdAt?.toDate) itemDate = item.createdAt.toDate();
            else if (typeof item.createdAt === 'string') itemDate = new Date(item.createdAt);

            if (!itemDate) return false;
            return itemDate >= dateFilterStart && itemDate <= dateFilterEnd;
        });

        updateDashboard(true);
    };

    const clearDateFilter = () => {
        dateFilterStart = null;
        dateFilterEnd = null;
        filteredData = [];
        document.getElementById('dateFilterStart').value = '';
        document.getElementById('dateFilterEnd').value = '';
        updateDashboard(false);
    };

    /***************************************************************************
     * LISTENERS DE TABS
     ***************************************************************************/
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
        document.getElementById(tabName + 'Content').classList.add('active');

        setTimeout(() => {
            if (lineChartDate) lineChartDate.resize();
            if (barChartAgent) barChartAgent.resize();
            if (pieChartPoints) pieChartPoints.resize();
            if (map) map.invalidateSize();
        }, 100);
    };

    /***************************************************************************
     * FIRESTORE: OBTENER DATOS
     ***************************************************************************/
    const fetchData = async () => {
        try {
            const snapshot = await window.db.collection('IncidenciasEU').get();
            incidenciasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateDashboard();
        } catch (err) {
            console.error(err);
        }
    };

    /***************************************************************************
     * ACTUALIZAR DASHBOARD
     ***************************************************************************/
    const updateDashboard = (isFiltered = false) => {
        const dataToUse = isFiltered && filteredData.length > 0 ? filteredData : incidenciasData;
        updateCounters(dataToUse);
        renderLineChart(dataToUse);
        renderBarChart(dataToUse);
        renderPieChart(dataToUse);
        setTimeout(() => initMap(dataToUse), 500);
    };

    /***************************************************************************
     * CONTADOR TOTAL
     ***************************************************************************/
    const updateCounters = (data) => {
        const element = document.getElementById('totalRecords');
        if (element) {
            element.textContent = data.length;
            // Hacer la tarjeta más pequeña
            element.style.fontSize = '24px';
            element.style.fontWeight = 'bold';
            element.style.color = '#6366f1';
        }
    };

    /***************************************************************************
     * GRÁFICO 1 — Registros por Fecha
     ***************************************************************************/
    const renderLineChart = (data) => {
        const dateMap = {};

        data.forEach(item => {
            let d = null;
            if (item.createdAt?.toDate) d = item.createdAt.toDate();
            else if (typeof item.createdAt === 'string') d = new Date(item.createdAt);

            if (!d || isNaN(d)) return;

            const key = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`;
            dateMap[key] = (dateMap[key] || 0) + 1;
        });

        const labels = Object.keys(dateMap);
        const values = Object.values(dateMap);

        const ctx = document.getElementById('lineChartDate').getContext('2d');
        if (lineChartDate) lineChartDate.destroy();

        lineChartDate = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Registros por Fecha',
                    data: values,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.15)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 6,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: {
                        display: true,
                        anchor: 'center',
                        align: 'center',
                        color: '#fff',
                        font: { weight: 'bold', size: 14 },
                        backgroundColor: 'rgba(99, 102, 241, 0.9)',
                        borderRadius: 4,
                        padding: 5,
                        formatter: function(value) {
                            return value;
                        }
                    },
                    legend: {
                        display: true,
                        labels: { color: '#64748b', font: { size: 11, weight: 600 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { color: '#64748b' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b' }
                    }
                }
            }
        });
    };

    /***************************************************************************
     * GRÁFICO 2 — Registros por Agente
     ***************************************************************************/
    const renderBarChart = (data) => {
        const agentMap = {};

        data.forEach(item => {
            const ag = item.nombreAgente || 'Sin asignar';
            agentMap[ag] = (agentMap[ag] || 0) + 1;
        });

        const labels = Object.keys(agentMap);
        const values = Object.values(agentMap);

        const ctx = document.getElementById('barChartAgent').getContext('2d');
        if (barChartAgent) barChartAgent.destroy();

        barChartAgent = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Registros por Agente',
                    data: values,
                    backgroundColor: ['#6366f1','#ec4899','#f59e0b','#10b981','#06b6d4','#8b5cf6'],
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: {
                        display: true,
                        anchor: 'center',
                        align: 'center',
                        color: '#fff',
                        font: { weight: 'bold', size: 13 },
                        offset: 0,
                        formatter: function(value) {
                            return value;
                        }
                    },
                    legend: {
                        display: true,
                        labels: { color: '#64748b', font: { size: 11, weight: 600 } }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { color: '#64748b' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#64748b' }
                    }
                }
            }
        });
    };

    /***************************************************************************
     * GRÁFICO 3 — Puntos de Marcación
     ***************************************************************************/
    const renderPieChart = (data) => {
        const pointMap = {};

        data.forEach(item => {
            const p = item.punto || 'Sin punto';
            pointMap[p] = (pointMap[p] || 0) + 1;
        });

        const labels = Object.keys(pointMap);
        const values = Object.values(pointMap);
        const colors = ['#6366f1','#ec4899','#f59e0b','#10b981','#06b6d4','#8b5cf6','#14b8a6','#f97316'];

        const ctx = document.getElementById('pieChartPoints').getContext('2d');
        if (pieChartPoints) pieChartPoints.destroy();

        pieChartPoints = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: {
                        display: true,
                        color: '#fff',
                        font: { weight: 'bold', size: 13 },
                        formatter: (value, ctx) => {
                            const dataset = ctx.dataset.data;
                            const total = dataset.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${value}\n${percentage}%`;
                        }
                    },
                    legend: {
                        position: 'right',
                        labels: { color: '#64748b', font: { size: 11, weight: 600 }, padding: 15 }
                    }
                }
            }
        });
    };

    /***************************************************************************
     * MAPA LEAFLET — COMPLETO
     ***************************************************************************/
    const initMap = (data) => {
        if (!L) return console.error('Leaflet no cargado');

        const mapEl = document.getElementById('map');
        if (!mapEl) return;

        if (!map) {
            map = L.map('map').setView([25.77, -80.25], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap', maxZoom: 19
            }).addTo(map);
        }

        markers.forEach(m => map.removeLayer(m));
        markers = [];

        const lats = [], lngs = [];

        data.forEach(item => {
            const coords = extractCoordinates(item);
            if (!coords) return;

            const { lat, lng } = coords;
            lats.push(lat);
            lngs.push(lng);

            // Formatear fecha con horas y minutos
            let fechaFormato = 'Sin fecha';
            if (item.createdAt) {
                let d = null;
                if (item.createdAt.toDate) d = item.createdAt.toDate();
                else if (typeof item.createdAt === 'string') d = new Date(item.createdAt);

                if (d && !isNaN(d)) {
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = String(d.getFullYear()).slice(-2);
                    const hour = String(d.getHours()).padStart(2, '0');
                    const minute = String(d.getMinutes()).padStart(2, '0');
                    fechaFormato = `${day}/${month}/${year} ${hour}:${minute}`;
                }
            }

            const marker = L.circleMarker([lat, lng], {
                radius: 10,
                fillColor: '#dc2626',
                color: '#fff',
                weight: 3,
                fillOpacity: 0.9
            }).addTo(map);

            marker.bindPopup(`
                <div style="font-family: Arial, sans-serif; font-size: 12px; width: 220px;">
                    <strong style="color: #dc2626;">📍 ${item.nombreAgente || 'Agente Desconocido'}</strong><br>
                    <small><strong>Punto:</strong> ${item.punto || 'N/A'}</small><br>
                    <small><strong>Fecha:</strong> ${fechaFormato}</small><br>
                    <small style="color: #999;"><strong>Coords:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
                </div>
            `);

            markers.push(marker);
        });

        if (lats.length) {
            const bounds = L.latLngBounds(
                [Math.min(...lats), Math.min(...lngs)],
                [Math.max(...lats), Math.max(...lngs)]
            );
            map.fitBounds(bounds, { padding: [40,40] });
        }

        setTimeout(() => map.invalidateSize(), 300);
    };

    /***************************************************************************
     * EXPONER MÉTODOS DEL MÓDULO
     ***************************************************************************/
    return {
        init,
        reload: fetchData
    };
})();

/***************************************************************************
 * EJECUCIÓN AUTOMÁTICA DEL DASHBOARD
 ***************************************************************************/
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboardPage')) {
        console.log('🚀 Iniciando Dashboard...');
        dashboardModule.init();
    }
});
