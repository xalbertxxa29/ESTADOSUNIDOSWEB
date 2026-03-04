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
    let listenersAttached = false; // Guard against duplicate event listeners

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
        if (listenersAttached) {
            console.log('⚠️ Listeners ya adjuntados, omitiendo duplicado.');
            return;
        }
        listenersAttached = true;

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

    const showLoading = (message = 'Procesando...') => {
        const overlay = document.getElementById('loadingOverlay');
        const msg = document.getElementById('loadingMessage');
        if (overlay && msg) {
            msg.innerText = message;
            overlay.style.display = 'flex';
        }
    };

    const hideLoading = () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
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

    // Format date as dd/mm/yyyy HH:mm for PDF
    const pdfFormatDate = (dateValue) => {
        if (!dateValue) return '-';
        try {
            const d = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
            if (isNaN(d.getTime())) return '-';
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hour = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hour}:${min}`;
        } catch (e) { return '-'; }
    };

    // Build a single PDF-page HTML block for a chunk of data
    const buildPdfPage = (chunk, accentColor, categoryLabel, dateRangeText, generationDate, totalRecords, pageNum, totalPages) => {
        // Light tint of accent for stripes
        const stripeBg = accentColor === '#4f46e5' ? '#eef2ff' : '#fff1f2';

        const dataRows = chunk.map((item, i) => {
            const bg = i % 2 === 0 ? '#ffffff' : stripeBg;
            const td = `padding:8px 10px;font-size:10px;border-bottom:1px solid #e9ecef;background:${bg};color:#1f2937;page-break-inside:avoid;`;
            return `
                <tr style="page-break-inside:avoid;">
                    <td style="${td} white-space:nowrap;">${pdfFormatDate(item.createdAt)}</td>
                    <td style="${td} font-weight:500;">${item.nombreAgente || '-'}</td>
                    <td style="${td}">${item.punto || '-'}</td>
                    <td style="${td} color:#374151;">${item.observacion || '-'}</td>
                </tr>`;
        }).join('');

        const isFirstPage = pageNum === 1;

        const headerHtml = isFirstPage ? `
            <!-- COVER HEADER -->
            <div style="background:${accentColor};border-radius:10px;padding:20px 24px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.7);margin-bottom:4px;">SISTEMA DE REPORTES · LIDERMAN</div>
                    <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:0.5px;">REPORTE DE INCIDENCIAS</div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.8);margin-top:3px;">Operaciones Estados Unidos</div>
                </div>
                <div style="background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.4);border-radius:8px;padding:10px 18px;text-align:center;">
                    <div style="font-size:18px;font-weight:800;color:#fff;">${categoryLabel}</div>
                    <div style="font-size:9px;color:rgba(255,255,255,0.7);margin-top:2px;">Categoría</div>
                </div>
            </div>
            <!-- META -->
            <div style="display:flex;gap:12px;margin-bottom:18px;">
                <div style="flex:1;border-left:3px solid ${accentColor};background:#f9fafb;border-radius:0 7px 7px 0;padding:10px 14px;">
                    <div style="font-size:8px;text-transform:uppercase;color:#9ca3af;font-weight:700;letter-spacing:1px;margin-bottom:4px;">📅 Rango de Fechas</div>
                    <div style="font-size:12px;font-weight:700;color:#111827;">${dateRangeText}</div>
                </div>
                <div style="flex:1;border-left:3px solid ${accentColor};background:#f9fafb;border-radius:0 7px 7px 0;padding:10px 14px;">
                    <div style="font-size:8px;text-transform:uppercase;color:#9ca3af;font-weight:700;letter-spacing:1px;margin-bottom:4px;">📊 Total Registros</div>
                    <div style="font-size:12px;font-weight:700;color:#111827;">${totalRecords}</div>
                </div>
                <div style="flex:1;border-left:3px solid ${accentColor};background:#f9fafb;border-radius:0 7px 7px 0;padding:10px 14px;">
                    <div style="font-size:8px;text-transform:uppercase;color:#9ca3af;font-weight:700;letter-spacing:1px;margin-bottom:4px;">🕐 Generado el</div>
                    <div style="font-size:12px;font-weight:700;color:#111827;">${generationDate}</div>
                </div>
            </div>` : `
            <!-- CONTINUATION HEADER -->
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:${accentColor};border-radius:7px;margin-bottom:14px;">
                <div style="font-size:12px;font-weight:700;color:#fff;">REPORTE DE INCIDENCIAS — ${categoryLabel}</div>
                <div style="font-size:10px;color:rgba(255,255,255,0.8);">Pág. ${pageNum} / ${totalPages} &nbsp;·&nbsp; ${dateRangeText}</div>
            </div>`;

        return `
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#374151;background:#fff;padding:24px;width:760px;">
                ${headerHtml}
                <!-- TABLE -->
                <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;">
                    <thead>
                        <tr>
                            <th style="padding:10px 10px;font-size:9px;text-transform:uppercase;color:#fff;text-align:left;font-weight:700;background:${accentColor};width:15%;letter-spacing:0.8px;">FECHA</th>
                            <th style="padding:10px 10px;font-size:9px;text-transform:uppercase;color:#fff;text-align:left;font-weight:700;background:${accentColor};width:18%;letter-spacing:0.8px;">NOMBRE</th>
                            <th style="padding:10px 10px;font-size:9px;text-transform:uppercase;color:#fff;text-align:left;font-weight:700;background:${accentColor};width:27%;letter-spacing:0.8px;">PUNTO DE MARCACIÓN</th>
                            <th style="padding:10px 10px;font-size:9px;text-transform:uppercase;color:#fff;text-align:left;font-weight:700;background:${accentColor};width:40%;letter-spacing:0.8px;">OBSERVACIÓN</th>
                        </tr>
                    </thead>
                    <tbody>${dataRows}</tbody>
                </table>
                <!-- FOOTER -->
                <div style="margin-top:14px;padding-top:10px;border-top:2px solid ${accentColor};display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:9px;color:#9ca3af;">© ${new Date().getFullYear()} Liderman · Sistema LiderControl · Todos los derechos reservados</span>
                    <span style="font-size:9px;font-weight:600;color:${accentColor};">Pág. ${pageNum} / ${totalPages}</span>
                </div>
            </div>`;
    };

    // Convert YYYY-MM-DD input value to dd/mm/yyyy display
    const formatInputDate = (isoStr) => {
        if (!isoStr) return '';
        const parts = isoStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return isoStr;
    };

    // Load image as base64 data URL for embedding in detached HTML
    const loadImageAsDataUrl = async (src) => {
        try {
            const res = await fetch(src);
            if (!res.ok) return null;
            const blob = await res.blob();
            return await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch { return null; }
    };

    const exportToPdf = async (category) => {
        const data = category === 'security' ? securityFiltered : facilityFiltered;
        if (!data.length) return alert('No hay datos para exportar');

        // Require jsPDF (added via CDN)
        const jsPDFLib = window.jspdf?.jsPDF;
        if (!jsPDFLib) return alert('Librería jsPDF no disponible. Recarga la página.');

        showLoading('Preparando PDF...');

        try {
            const suffix = category === 'security' ? 'Sec' : '';
            const fromRaw = document.getElementById(`filterFromDate${suffix}`).value;
            const toRaw = document.getElementById(`filterToDate${suffix}`).value;
            const fromFmt = formatInputDate(fromRaw);
            const toFmt = formatInputDate(toRaw);
            const dateRangeText = fromFmt && toFmt ? `${fromFmt} - ${toFmt}` : 'Todos los registros';
            const generationDate = new Date().toLocaleString('es-PE');
            const categoryLabel = category === 'security' ? 'SECURITY' : 'FACILITY';
            const filename = `Reporte_${categoryLabel}_${new Date().toISOString().split('T')[0]}.pdf`;

            // Colors — security: indigo, facility: red
            const ac = category === 'security'
                ? { r: 79, g: 70, b: 229, light: [238, 242, 255] }
                : { r: 220, g: 38, b: 38, light: [255, 241, 242] };

            document.getElementById('loadingMessage').innerText = 'Cargando logo...';
            const logoDataUrl = await loadImageAsDataUrl('logo.png');

            document.getElementById('loadingMessage').innerText = 'Generando PDF...';

            // ── Create jsPDF document ───────────────────────────────────────
            const doc = new jsPDFLib({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const PW = doc.internal.pageSize.getWidth();   // 210
            const PH = doc.internal.pageSize.getHeight();  // 297
            const ML = 10; // margin left
            const MR = 10; // margin right
            const CW = PW - ML - MR; // content width = 190

            // ── Helper: draw page header (used on first page) ───────────────
            const drawCoverHeader = () => {
                // Gradient-like solid header rect
                doc.setFillColor(ac.r, ac.g, ac.b);
                doc.roundedRect(ML, 10, CW, 28, 3, 3, 'F');

                // Logo
                let logoX = ML + 4;
                if (logoDataUrl) {
                    try {
                        doc.addImage(logoDataUrl, 'PNG', logoX, 13, 22, 22);
                        logoX += 26;
                    } catch (e) { /* skip if logo fails */ }
                }

                // Title text
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.text('SISTEMA DE REPORTES · LIDERMAN', logoX, 17);
                doc.setFontSize(14);
                doc.text('REPORTE DE INCIDENCIAS', logoX, 24);
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.text('Operaciones Estados Unidos', logoX, 30);

                // Category badge (right)
                const badgeW = 30;
                const badgeX = PW - MR - badgeW;
                doc.setFillColor(255, 255, 255, 0.2);
                doc.roundedRect(badgeX, 13, badgeW, 18, 2, 2, 'S');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text(categoryLabel, badgeX + badgeW / 2, 23, { align: 'center' });
                doc.setFontSize(6);
                doc.setFont('helvetica', 'normal');
                doc.text('Categoría', badgeX + badgeW / 2, 28, { align: 'center' });
            };

            // ── Helper: draw 3 meta boxes ───────────────────────────────────
            const drawMetaBoxes = (startY) => {
                const bw = (CW - 8) / 3;
                const bh = 14;
                const labels = ['RANGO DE FECHAS', 'TOTAL REGISTROS', 'GENERADO EL'];
                const values = [dateRangeText, `${data.length} registros`, generationDate];

                labels.forEach((lbl, i) => {
                    const bx = ML + i * (bw + 4);
                    doc.setFillColor(248, 250, 252);
                    doc.roundedRect(bx, startY, bw, bh, 2, 2, 'F');
                    // Left accent bar
                    doc.setFillColor(ac.r, ac.g, ac.b);
                    doc.rect(bx, startY, 1.5, bh, 'F');
                    // Label
                    doc.setTextColor(148, 163, 184);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(5.5);
                    doc.text(lbl, bx + 4, startY + 4.5);
                    // Value
                    doc.setTextColor(15, 23, 42);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7.5);
                    doc.text(String(values[i]), bx + 4, startY + 10, { maxWidth: bw - 6 });
                });

                return startY + bh + 6;
            };

            // ── Helper: draw continuation header ───────────────────────────
            const drawContinuationHeader = (doc, startRow, endRow) => {
                doc.setFillColor(ac.r, ac.g, ac.b);
                doc.roundedRect(ML, 8, CW, 10, 2, 2, 'F');

                let lx = ML + 3;
                if (logoDataUrl) {
                    try { doc.addImage(logoDataUrl, 'PNG', lx, 9.5, 7, 7); lx += 10; } catch (e) { }
                }
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.text(`REPORTE DE INCIDENCIAS — ${categoryLabel}`, lx, 14);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(6.5);
                doc.text(`${dateRangeText}   ·   Registros ${startRow}–${endRow} de ${data.length}`, PW - MR, 14, { align: 'right' });
            };

            // ── Helper: draw footer on current page ────────────────────────
            const drawFooter = (pageNum, totalPages) => {
                const y = PH - 7;
                doc.setFillColor(ac.r, ac.g, ac.b);
                doc.rect(ML, y - 1, CW, 0.5, 'F');
                doc.setTextColor(148, 163, 184);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(6);
                doc.text(`© ${new Date().getFullYear()} Liderman · Sistema LiderControl · Todos los derechos reservados`, ML, y + 3);
                doc.setTextColor(ac.r, ac.g, ac.b);
                doc.setFont('helvetica', 'bold');
                doc.text(`Pág. ${pageNum} / ${totalPages}`, PW - MR, y + 3, { align: 'right' });
            };

            // ── Prepare table rows ─────────────────────────────────────────
            const tableRows = data.map(item => [
                pdfFormatDate(item.createdAt),
                item.nombreAgente || '-',
                item.punto || '-',
                item.observacion || '-'
            ]);

            // ── Draw cover page header + meta boxes ───────────────────────
            drawCoverHeader();
            let tableStartY = drawMetaBoxes(42);

            // ── Draw autoTable ─────────────────────────────────────────────
            doc.autoTable({
                head: [['FECHA', 'NOMBRE', 'PUNTO DE MARCACIÓN', 'OBSERVACIÓN']],
                body: tableRows,
                startY: tableStartY,
                margin: { left: ML, right: MR, top: 22, bottom: 12 },
                styles: {
                    fontSize: 7.5,
                    cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
                    overflow: 'linebreak',
                    textColor: [30, 41, 59],
                    lineColor: [226, 232, 240],
                    lineWidth: 0.15
                },
                headStyles: {
                    fillColor: [ac.r, ac.g, ac.b],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 7,
                    cellPadding: { top: 4, right: 4, bottom: 4, left: 4 }
                },
                alternateRowStyles: {
                    fillColor: ac.light
                },
                columnStyles: {
                    0: { cellWidth: 32 },
                    1: { cellWidth: 32 },
                    2: { cellWidth: 50 },
                    3: { cellWidth: 'auto', minCellWidth: 40 }
                },
                // Called on each new page to draw the continuation header
                didDrawPage: (hookData) => {
                    const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
                    if (pageNum > 1) {
                        // Continuation header on pages 2+
                        const rowStart = (hookData.pageCount - 1) * 30 + 1; // approximate
                        drawContinuationHeader(doc, hookData.cursor?.y || 1, data.length);
                    }
                    drawFooter(pageNum, '?'); // total pages unknown until done
                },
                showHead: 'everyPage'
            });

            // ── Update footer with correct total pages ─────────────────────
            const totalPages = doc.internal.getNumberOfPages();
            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p);
                // Overwrite the footer area with correct page count
                doc.setFillColor(255, 255, 255);
                doc.rect(PW - MR - 25, PH - 10, 30, 6, 'F');
                doc.setTextColor(ac.r, ac.g, ac.b);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(6);
                doc.text(`Pág. ${p} / ${totalPages}`, PW - MR, PH - 7 + 3, { align: 'right' });
            }

            doc.save(filename);
            console.log('✅ PDF generado con jsPDF+autoTable');

        } catch (error) {
            console.error('❌ Error al exportar PDF:', error);
            alert('Error al generar el PDF. Revise la consola.');
        } finally {
            hideLoading();
        }
    };

    return { init, reload: fetchTableData };
})();
