// Table Module - Paginated & Optimized (Dual Tabs: Facility vs Security)
console.log('📋 Cargando módulo Table DUAL...');

const tableModule = (() => {
    let allIncidenciasData = [];

    // State for Facility Tab
    let facilityData = [];
    let facilityFiltered = [];
    let facilityPage = 1;

    // State for Security Tab
    let securityData = [];
    let securityFiltered = [];
    let securityPage = 1;

    const itemsPerPage = 10;

    // Track active tab to know which data to manipulate
    let activeCategory = 'facility'; // 'facility' or 'security'

    const init = () => {
        console.log('📋 Inicializando Tabla Dual');
        if (!window.db || !window.firebaseReady) {
            setTimeout(init, 1000);
            return;
        }
        fetchTableData();
        setupEventListeners();
    };

    const setupEventListeners = () => {
        // Tab listeners
        const tablePageTabs = document.querySelectorAll('#tablePage .facility-security-tabs .tab-btn');
        tablePageTabs.forEach(btn => {
            btn.addEventListener('click', handleTableTabChange);
        });

        // FACILITY Filters & Exports
        const filterBtn = document.getElementById('filterBtn');
        if (filterBtn) filterBtn.addEventListener('click', () => applyFilter('facility'));

        const resetBtn = document.getElementById('resetFilterBtn');
        if (resetBtn) resetBtn.addEventListener('click', () => resetFilter('facility'));

        const exportExcel = document.getElementById('exportExcelBtn');
        if (exportExcel) exportExcel.addEventListener('click', () => exportToExcel('facility'));

        const exportPdf = document.getElementById('exportPdfBtn');
        if (exportPdf) exportPdf.addEventListener('click', () => exportToPdf('facility'));

        // SECURITY Filters & Exports
        const filterBtnSec = document.getElementById('filterBtnSec');
        if (filterBtnSec) filterBtnSec.addEventListener('click', () => applyFilter('security'));

        const resetBtnSec = document.getElementById('resetFilterBtnSec');
        if (resetBtnSec) resetBtnSec.addEventListener('click', () => resetFilter('security'));

        const exportExcelSec = document.getElementById('exportExcelBtnSec');
        if (exportExcelSec) exportExcelSec.addEventListener('click', () => exportToExcel('security'));

        const exportPdfSec = document.getElementById('exportPdfBtnSec');
        if (exportPdfSec) exportPdfSec.addEventListener('click', () => exportToPdf('security'));

        setupImageModal();
    };

    const handleTableTabChange = (e) => {
        const page = document.getElementById('tablePage');
        if (!page) return;

        const tabs = page.querySelectorAll('.facility-security-tabs .tab-btn');
        const contents = page.querySelectorAll('.tab-content');

        tabs.forEach(tab => tab.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));

        e.currentTarget.classList.add('active');
        const tabName = e.currentTarget.getAttribute('data-tab');

        // Determine active category based on tab name
        if (tabName === 'facility-table') {
            document.getElementById('facilityTableContent').classList.add('active');
            activeCategory = 'facility';
        } else if (tabName === 'security-table') {
            document.getElementById('securityTableContent').classList.add('active');
            activeCategory = 'security';
        }

        // Re-render to ensure pagination is correct for the active view
        renderTable(activeCategory);
        renderPaginationControls(activeCategory);
    };

    const fetchTableData = async () => {
        try {
            const querySnapshot = await window.db.collection('IncidenciasEU').orderBy('createdAt', 'desc').get();
            allIncidenciasData = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                allIncidenciasData.push({ id: doc.id, ...data });
            });

            // Split Data
            facilityData = allIncidenciasData.filter(d => !d.tipoServicio || d.tipoServicio === 'Facility');
            securityData = allIncidenciasData.filter(d => d.tipoServicio === 'Security');

            // Init Filtered Data
            facilityFiltered = [...facilityData];
            securityFiltered = [...securityData];

            renderTable('facility');
            renderPaginationControls('facility');

            renderTable('security');
            renderPaginationControls('security');

        } catch (error) {
            console.error('❌ Error al obtener datos:', error);
        }
    };

    const renderTable = (category) => {
        // Choose selectors based on category
        const suffix = category === 'security' ? 'Sec' : '';
        const tbodyId = `tableBody${suffix}`;
        const infoId = `tableInfo${suffix}`;

        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;

        tbody.innerHTML = '';

        const currentData = category === 'security' ? securityFiltered : facilityFiltered;
        const currentPage = category === 'security' ? securityPage : facilityPage;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = currentData.slice(startIndex, endIndex);

        // Update Info
        const infoDiv = document.getElementById(infoId);
        if (infoDiv) {
            const actualEnd = Math.min(endIndex, currentData.length);
            infoDiv.textContent = currentData.length > 0
                ? `Mostrando ${startIndex + 1} - ${actualEnd} de ${currentData.length} registros`
                : 'No hay registros para mostrar';
        }

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No se encontraron registros</td></tr>';
            return;
        }

        pageData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(item.createdAt)}</td>
                <td>${item.nombreAgente || '-'}</td>
                <td>${item.punto || '-'}</td>
                <td>${item.observacion || '-'}</td>
                <td>
                    ${item.evidenciaDataUrl ? `
                        <div class="photo-thumbnail">
                            <img src="${item.evidenciaDataUrl}" alt="Foto" class="thumbnail-img" data-full="${item.evidenciaDataUrl}">
                        </div>
                    ` : '-'}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Re-attach modal listeners
        document.querySelectorAll(`#${tbodyId} .thumbnail-img`).forEach(img => {
            img.addEventListener('click', showImageModal);
        });
    };

    const renderPaginationControls = (category) => {
        const suffix = category === 'security' ? 'Sec' : '';
        const controlsId = `paginationControls${suffix}`;
        const paginationDiv = document.getElementById(controlsId);
        if (!paginationDiv) return;

        const currentData = category === 'security' ? securityFiltered : facilityFiltered;
        const currentPage = category === 'security' ? securityPage : facilityPage;
        const totalPages = Math.ceil(currentData.length / itemsPerPage);

        paginationDiv.innerHTML = '';
        if (totalPages <= 1) return;

        const createBtn = (text, disabled, onClick) => {
            const btn = document.createElement('button');
            btn.innerText = text;
            btn.disabled = disabled;
            btn.style.padding = '8px 16px';
            btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
            btn.style.opacity = disabled ? '0.5' : '1';
            btn.style.border = '1px solid #ddd';
            btn.style.borderRadius = '6px';
            btn.style.background = '#fff';
            btn.onclick = onClick;
            return btn;
        };

        const prevBtn = createBtn('◄ Anterior', currentPage === 1, () => {
            if (category === 'security') securityPage--; else facilityPage--;
            renderTable(category);
            renderPaginationControls(category);
        });

        const nextBtn = createBtn('Siguiente ►', currentPage === totalPages, () => {
            if (category === 'security') securityPage++; else facilityPage++;
            renderTable(category);
            renderPaginationControls(category);
        });

        const indicator = document.createElement('span');
        indicator.innerText = `Página ${currentPage} de ${totalPages}`;
        indicator.style.fontWeight = '600';

        paginationDiv.appendChild(prevBtn);
        paginationDiv.appendChild(indicator);
        paginationDiv.appendChild(nextBtn);
    };

    const applyFilter = (category) => {
        const suffix = category === 'security' ? 'Sec' : '';
        const fromId = `filterFromDate${suffix}`;
        const toId = `filterToDate${suffix}`;

        const fromVal = document.getElementById(fromId).value;
        const toVal = document.getElementById(toId).value;

        if (!fromVal || !toVal) return alert('Seleccione ambas fechas');

        const from = new Date(fromVal);
        const to = new Date(toVal);
        to.setHours(23, 59, 59, 999);

        const sourceData = category === 'security' ? securityData : facilityData;

        const filtered = sourceData.filter(item => {
            const d = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
            return d >= from && d <= to;
        });

        if (category === 'security') {
            securityFiltered = filtered;
            securityPage = 1;
        } else {
            facilityFiltered = filtered;
            facilityPage = 1;
        }

        renderTable(category);
        renderPaginationControls(category);
    };

    const resetFilter = (category) => {
        const suffix = category === 'security' ? 'Sec' : '';
        document.getElementById(`filterFromDate${suffix}`).value = '';
        document.getElementById(`filterToDate${suffix}`).value = '';

        if (category === 'security') {
            securityFiltered = [...securityData];
            securityPage = 1;
        } else {
            facilityFiltered = [...facilityData];
            facilityPage = 1;
        }

        renderTable(category);
        renderPaginationControls(category);
    };

    // Generic Helper
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
            if (isNaN(date)) return '-';
            return date.toLocaleDateString('es-ES', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return '-'; }
    };

    const setupImageModal = () => {
        // Existing modal logic reuse...
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        const closeBtn = document.querySelector('.modal-close');
        window.showImageModal = (e) => {
            modal.classList.add('active');
            modalImg.src = e.target.getAttribute('data-full');
        };
        if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
        modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
    };

    const exportToExcel = (category) => {
        const data = category === 'security' ? securityFiltered : facilityFiltered;
        if (!data.length) return alert('No hay datos');

        if (typeof XLSX === 'undefined') return alert('Librería Excel no lista');

        const wb = XLSX.utils.book_new();
        const rows = [['Fecha', 'Nombre', 'Punto', 'Observación']];
        data.forEach(item => {
            rows.push([formatDate(item.createdAt), item.nombreAgente, item.punto, item.observacion]);
        });
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
        XLSX.writeFile(wb, `Reporte_${category}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPdf = (category) => {
        const data = category === 'security' ? securityFiltered : facilityFiltered;
        if (!data.length) return alert('No hay datos');

        if (typeof html2pdf === 'undefined') return alert('Librería PDF no lista');

        const element = document.createElement('div');
        element.innerHTML = `<h1>Reporte ${category.toUpperCase()}</h1>`;
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        let html = '<thead style="background:#dc2626;color:white;"><tr><th>Fecha</th><th>Nombre</th><th>Punto</th></tr></thead><tbody>';
        data.forEach((item, i) => {
            html += `<tr style="background:${i % 2 ? '#fff' : '#f9f9f9'}">
                <td>${formatDate(item.createdAt)}</td>
                <td>${item.nombreAgente || '-'}</td>
                <td>${item.punto || '-'}</td>
            </tr>`;
        });
        html += '</tbody>';
        table.innerHTML = html;
        element.appendChild(table);

        html2pdf().from(element).save();
    };

    return { init, reload: fetchTableData };
})();
