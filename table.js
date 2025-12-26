// Table Module
console.log('📋 Cargando módulo Table...');

const tableModule = (() => {
    let allIncidenciasData = [];
    let filteredData = [];

    const init = () => {
        console.log('📋 Inicializando Tabla');
        if (!window.db || !window.firebaseReady) {
            console.warn('⏳ Firestore no está listo, reintentando...');
            setTimeout(init, 1000);
            return;
        }
        console.log('✅ Firestore disponible');
        fetchTableData();
        setupEventListeners();
    };

    const setupEventListeners = () => {
        // Tab listeners
        const tablePageTabs = document.querySelectorAll('#tablePage .facility-security-tabs .tab-btn');
        tablePageTabs.forEach(btn => {
            btn.addEventListener('click', handleTableTabChange);
        });

        // Filter listeners
        document.getElementById('filterBtn').addEventListener('click', applyFilter);
        document.getElementById('resetFilterBtn').addEventListener('click', resetFilter);

        // Export listeners
        document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
        document.getElementById('exportPdfBtn').addEventListener('click', exportToPdf);

        // Image modal
        setupImageModal();
    };

    const handleTableTabChange = (e) => {
        const page = document.getElementById('tablePage');
        if (!page) {
            console.warn('⚠️ Tabla no cargada');
            return;
        }

        const tabs = page.querySelectorAll('.facility-security-tabs .tab-btn');
        const contents = page.querySelectorAll('.tab-content');

        tabs.forEach(tab => tab.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));

        e.currentTarget.classList.add('active');
        const tabName = e.currentTarget.getAttribute('data-tab');
        
        // Mapeo correcto: facility-table -> facilityTableContent, security-table -> securityTableContent
        let correctedId = '';
        if (tabName === 'facility-table') {
            correctedId = 'facilityTableContent';
        } else if (tabName === 'security-table') {
            correctedId = 'securityTableContent';
        }
        
        const contentElement = document.getElementById(correctedId);
        if (contentElement) {
            contentElement.classList.add('active');
            console.log('✅ Tab activado:', correctedId);
        } else {
            console.warn('⚠️ Elemento de contenido no encontrado:', correctedId, 'buscado desde:', tabName);
        }
    };

    const fetchTableData = async () => {
        try {
            console.log('📥 Obteniendo datos de tabla...');
            const querySnapshot = await window.db.collection('IncidenciasEU').get();
            allIncidenciasData = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                allIncidenciasData.push({
                    id: doc.id,
                    ...data
                });
            });

            console.log('✅ Datos de tabla obtenidos:', allIncidenciasData.length, 'registros');
            
            // Debug: mostrar el primer registro
            if (allIncidenciasData.length > 0) {
                console.log('📋 Primer registro:', allIncidenciasData[0]);
                console.log('   - createdAt type:', typeof allIncidenciasData[0].createdAt);
                console.log('   - createdAt value:', allIncidenciasData[0].createdAt);
            }
            
            filteredData = [...allIncidenciasData];
            populateTable(filteredData);
        } catch (error) {
            console.error('❌ Error al obtener datos:', error);
        }
    };

    const populateTable = (data) => {
        const tbody = document.getElementById('tableBody');
        if (!tbody) {
            console.warn('⚠️ tableBody no encontrado');
            return;
        }
        
        tbody.innerHTML = '';

        data.forEach(item => {
            const row = document.createElement('tr');
            const fechaFormato = formatDate(item.createdAt);
            
            row.innerHTML = `
                <td>${fechaFormato}</td>
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

        // Add click listeners to thumbnails
        document.querySelectorAll('.thumbnail-img').forEach(img => {
            img.addEventListener('click', showImageModal);
        });
    };

    const formatDate = (dateString) => {
        if (!dateString && dateString !== 0) return '-';
        
        try {
            let date;
            
            // Si es un objeto Timestamp de Firestore
            if (dateString && typeof dateString === 'object' && dateString.toDate && typeof dateString.toDate === 'function') {
                console.log('📅 Detectado Timestamp de Firestore');
                date = dateString.toDate();
            } 
            // Si es un string
            else if (typeof dateString === 'string') {
                console.log('📅 Detectado string de fecha:', dateString);
                // Intentar múltiples formatos
                if (dateString.includes('T')) {
                    // ISO format o "2025-11-26T15:08:03 UTC-5"
                    const dateOnly = dateString.split(' ')[0].split('T')[0];
                    date = new Date(dateOnly);
                } else if (dateString.includes('-')) {
                    // Simple format "2025-11-26"
                    date = new Date(dateString);
                } else {
                    return '-';
                }
            }
            // Si es un Date
            else if (dateString instanceof Date) {
                console.log('📅 Detectado Date object');
                date = dateString;
            }
            // Si es un número (timestamp en milisegundos)
            else if (typeof dateString === 'number') {
                console.log('📅 Detectado número (timestamp):', dateString);
                date = new Date(dateString);
            }
            else {
                console.warn('⚠️ Tipo de fecha desconocido:', typeof dateString);
                return '-';
            }
            
            if (isNaN(date.getTime())) {
                console.warn('⚠️ Fecha inválida:', dateString);
                return '-';
            }
            
            return date.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            });
        } catch (error) {
            console.error('❌ Error formateando fecha:', error, dateString);
            return '-';
        }
    };

    const applyFilter = () => {
        const filterFromDate = document.getElementById('filterFromDate');
        const filterToDate = document.getElementById('filterToDate');
        
        if (!filterFromDate || !filterToDate) {
            console.warn('⚠️ Elementos de filtro no encontrados');
            return;
        }
        
        const fromDate = filterFromDate.value;
        const toDate = filterToDate.value;

        if (!fromDate || !toDate) {
            alert('Por favor selecciona ambas fechas');
            return;
        }

        const from = new Date(fromDate);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);

        filteredData = allIncidenciasData.filter(item => {
            if (!item.createdAt) return false;
            
            try {
                let itemDate;
                
                // Si es un objeto Timestamp de Firestore
                if (item.createdAt.toDate && typeof item.createdAt.toDate === 'function') {
                    itemDate = item.createdAt.toDate();
                }
                // Si es un string
                else if (typeof item.createdAt === 'string') {
                    const dateOnly = item.createdAt.split(' ')[0];
                    itemDate = new Date(dateOnly);
                }
                // Si es un Date
                else if (item.createdAt instanceof Date) {
                    itemDate = item.createdAt;
                }
                // Si es un número
                else if (typeof item.createdAt === 'number') {
                    itemDate = new Date(item.createdAt);
                }
                else {
                    return false;
                }
                
                return itemDate >= from && itemDate <= to;
            } catch (error) {
                console.error('Error al filtrar fecha:', error);
                return false;
            }
        });

        console.log('Filtrados:', filteredData.length, 'registros');
        populateTable(filteredData);
    };

    const resetFilter = () => {
        const filterFromDate = document.getElementById('filterFromDate');
        const filterToDate = document.getElementById('filterToDate');
        
        if (filterFromDate) filterFromDate.value = '';
        if (filterToDate) filterToDate.value = '';
        
        filteredData = [...allIncidenciasData];
        populateTable(filteredData);
    };

    const exportToExcel = () => {
        try {
            console.log('📊 Iniciando exportación a Excel...');
            
            // Verificar que XLSX está disponible
            if (typeof XLSX === 'undefined' || !window.XLSX) {
                console.error('❌ XLSX no está disponible');
                console.log('Esperando 2 segundos e intentando de nuevo...');
                
                // Reintentar después de 2 segundos
                setTimeout(() => {
                    if (typeof XLSX === 'undefined' || !window.XLSX) {
                        alert('Error: Librería XLSX no se pudo cargar. Por favor recarga la página.');
                        return;
                    }
                    exportToExcel(); // Reintentar
                }, 2000);
                return;
            }
            
            // Verificar que hay datos
            if (!filteredData || filteredData.length === 0) {
                alert('No hay datos para exportar');
                return;
            }
            
            console.log('✅ Preparando datos para Excel...');
            
            // Crear workbook
            const wb = XLSX.utils.book_new();
            
            // ===== HOJA 1: PORTADA CON INFO =====
            const coverData = [
                ['SISTEMA DE REPORTES LIDERMAN'],
                [''],
                ['REPORTE DE INCIDENCIAS'],
                [''],
                ['Fecha de Generación:', new Date().toLocaleDateString('es-PE')],
                ['Hora:', new Date().toLocaleTimeString('es-PE')],
                ['Total de Registros:', filteredData.length],
                [''],
                ['Documento confidencial - Uso interno']
            ];
            
            const wsCover = XLSX.utils.aoa_to_sheet(coverData);
            wsCover['!cols'] = [{ wch: 40 }, { wch: 30 }];
            
            // Estilos a la portada (XLSX básico no soporta estilos complejos, pero podemos hacer algunas cosas)
            for (let i = 0; i < coverData.length; i++) {
                const cellRef = `A${i + 1}`;
                if (wsCover[cellRef]) {
                    wsCover[cellRef].s = {
                        font: { bold: i === 0 || i === 2, sz: i === 0 ? 16 : 11 },
                        fill: { fgColor: { rgb: i === 0 ? 'FF8B2323' : 'FFFFFFFF' } },
                        alignment: { horizontal: 'center', vertical: 'center' }
                    };
                }
            }
            
            XLSX.utils.book_append_sheet(wb, wsCover, 'Portada');
            
            // ===== HOJA 2: DATOS DETALLADOS =====
            const headers = ['Fecha', 'Nombre del Agente', 'Punto de Marcación', 'Observación', 'Estado'];
            
            const tableData = [headers];
            let totalPuntos = new Set();
            
            filteredData.forEach(item => {
                totalPuntos.add(item.punto);
                tableData.push([
                    formatDate(item.createdAt),
                    item.nombreAgente || '-',
                    item.punto || '-',
                    item.observacion || '-',
                    item.critico ? 'Crítico' : 'Normal'
                ]);
            });
            
            const wsData = XLSX.utils.aoa_to_sheet(tableData);
            
            // Configurar ancho de columnas
            wsData['!cols'] = [
                { wch: 15 },  // Fecha
                { wch: 20 },  // Nombre
                { wch: 20 },  // Punto
                { wch: 35 },  // Observación
                { wch: 12 }   // Estado
            ];
            
            // Aplicar estilos a headers
            const headerStyle = {
                font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 11 },
                fill: { fgColor: { rgb: 'FF8B2323' } },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
            };
            
            headers.forEach((header, idx) => {
                const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
                if (!wsData[cellRef]) wsData[cellRef] = {};
                wsData[cellRef].s = headerStyle;
            });
            
            // Aplicar estilos a datos
            for (let row = 1; row < tableData.length; row++) {
                for (let col = 0; col < headers.length; col++) {
                    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                    if (wsData[cellRef]) {
                        wsData[cellRef].s = {
                            alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
                            fill: { fgColor: { rgb: row % 2 === 0 ? 'FFF8F8F8' : 'FFFFFFFF' } },
                            border: {
                                top: { style: 'thin', color: { rgb: 'FFD3D3D3' } },
                                bottom: { style: 'thin', color: { rgb: 'FFD3D3D3' } },
                                left: { style: 'thin', color: { rgb: 'FFD3D3D3' } },
                                right: { style: 'thin', color: { rgb: 'FFD3D3D3' } }
                            }
                        };
                    }
                }
            }
            
            // Freeze primera fila
            wsData['!freeze'] = { xSplit: 0, ySplit: 1 };
            
            XLSX.utils.book_append_sheet(wb, wsData, 'Datos');
            
            // ===== HOJA 3: ESTADÍSTICAS =====
            const puntosArray = Array.from(totalPuntos).sort();
            const puntosStats = {};
            
            filteredData.forEach(item => {
                const punto = item.punto || 'Sin especificar';
                puntosStats[punto] = (puntosStats[punto] || 0) + 1;
            });
            
            const statsData = [
                ['ESTADÍSTICAS Y RESUMEN'],
                [''],
                ['Métrica', 'Valor'],
                ['Total de Registros', filteredData.length],
                ['Puntos de Marcación Únicos', puntosArray.length],
                [''],
                ['DISTRIBUCIÓN POR PUNTO'],
                ['Punto de Marcación', 'Cantidad', 'Porcentaje']
            ];
            
            puntosArray.forEach(punto => {
                const count = puntosStats[punto];
                const percentage = ((count / filteredData.length) * 100).toFixed(2) + '%';
                statsData.push([punto, count, percentage]);
            });
            
            const wsStats = XLSX.utils.aoa_to_sheet(statsData);
            wsStats['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];
            
            // Estilos a estadísticas
            for (let i = 0; i < statsData.length; i++) {
                for (let j = 0; j < 3; j++) {
                    const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
                    if (wsStats[cellRef]) {
                        if (i === 0 || i === 6) {
                            // Títulos principales
                            wsStats[cellRef].s = {
                                font: { bold: true, sz: 12, color: { rgb: 'FFFFFFFF' } },
                                fill: { fgColor: { rgb: 'FF8B2323' } },
                                alignment: { horizontal: 'center' }
                            };
                        } else if (i === 2 || i === 7) {
                            // Headers de tabla
                            wsStats[cellRef].s = {
                                font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 10 },
                                fill: { fgColor: { rgb: 'FFC0504B' } },
                                alignment: { horizontal: 'center' }
                            };
                        } else if (i > 8) {
                            // Datos de puntos
                            wsStats[cellRef].s = {
                                fill: { fgColor: { rgb: i % 2 === 0 ? 'FFF8F8F8' : 'FFFFFFFF' } },
                                border: {
                                    top: { style: 'thin' },
                                    bottom: { style: 'thin' },
                                    left: { style: 'thin' },
                                    right: { style: 'thin' }
                                },
                                alignment: { horizontal: 'center' }
                            };
                        }
                    }
                }
            }
            
            XLSX.utils.book_append_sheet(wb, wsStats, 'Estadísticas');
            
            // Generar nombre de archivo
            const fileName = `Incidencias_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            console.log('✅ Guardando archivo...');
            
            // Descargar archivo
            XLSX.writeFile(wb, fileName);
            console.log('✅ Exportación a Excel completada:', fileName);
            alert('✅ Excel exportado exitosamente como: ' + fileName + '\n\n📊 Contiene 3 hojas:\n1. Portada\n2. Datos completos\n3. Estadísticas');
            
        } catch (error) {
            console.error('❌ Error en exportación a Excel:', error);
            console.error('Stack:', error.stack);
            alert('Error al exportar a Excel: ' + error.message);
        }
    };

    const exportToPdf = async () => {
        try {
            console.log('📄 Starting PDF export...');
            
            // Verify html2pdf is available
            if (typeof html2pdf === 'undefined') {
                console.error('❌ html2pdf not loaded');
                alert('Error: html2pdf library is not loaded. Please reload the page.');
                return;
            }
            
            // Verify data exists
            if (!filteredData || filteredData.length === 0) {
                alert('No data to export');
                return;
            }
            
            console.log('✅ Preparing PDF content...');
            
            // Crear contenedor principal
            const pdfContainer = document.createElement('div');
            pdfContainer.id = 'facilityTableContent';
            pdfContainer.style.width = '100%';
            pdfContainer.style.backgroundColor = '#ffffff';
            pdfContainer.style.padding = '20px';
            pdfContainer.style.fontFamily = 'Arial, sans-serif';
            // 🔧 PASO A: Hacer visible ANTES de capturar
            pdfContainer.style.display = 'block';
            
            // ===== HEADER WITH LOGO AND TITLE =====
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.style.borderBottom = '4px solid #8B2323';
            header.style.paddingBottom = '15px';
            header.style.marginBottom = '20px';
            
            // Logo and title
            const logoSection = document.createElement('div');
            logoSection.style.display = 'flex';
            logoSection.style.alignItems = 'center';
            logoSection.style.gap = '15px';
            
            const logo = document.createElement('img');
            logo.src = 'logo.png';
            logo.style.width = '70px';
            logo.style.height = '70px';
            logo.style.objectFit = 'contain';
            
            const titleSection = document.createElement('div');
            titleSection.innerHTML = `
                <h1 style="margin: 0; color: #8B2323; font-size: 28px; font-weight: bold;">
                    Liderman Reports System
                </h1>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">
                    Incidents and Checkpoints Report
                </p>
            `;
            
            logoSection.appendChild(logo);
            logoSection.appendChild(titleSection);
            
            // Date and time information
            const dateSection = document.createElement('div');
            dateSection.style.textAlign = 'right';
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const timeStr = now.toLocaleTimeString('en-US');
            
            dateSection.innerHTML = `
                <p style="margin: 0; color: #333; font-weight: bold; font-size: 12px;">
                    Generated: ${dateStr}
                </p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 11px;">
                    ${timeStr}
                </p>
            `;
            
            header.appendChild(logoSection);
            header.appendChild(dateSection);
            pdfContainer.appendChild(header);
            
            // ===== DATA TABLE ===== 
            const tableSection = document.createElement('div');
            tableSection.style.marginBottom = '20px';
            tableSection.style.pageBreakInside = 'avoid';
            
            const tableTitle = document.createElement('h2');
            tableTitle.textContent = 'Incidents Detail';
            tableTitle.style.color = '#8B2323';
            tableTitle.style.fontSize = '14px';
            tableTitle.style.marginBottom = '8px';
            tableTitle.style.marginTop = '0';
            tableSection.appendChild(tableTitle);
            
            // Clone original table and apply styles
            const originalTable = document.getElementById('dataTable');
            if (originalTable) {
                const clonedTable = originalTable.cloneNode(true);
                
                // Table styles
                clonedTable.style.width = '100%';
                clonedTable.style.borderCollapse = 'collapse';
                clonedTable.style.fontSize = '9px';
                clonedTable.style.pageBreakInside = 'avoid';
                
                // Header styles
                const headers = clonedTable.querySelectorAll('thead th');
                headers.forEach(header => {
                    header.style.backgroundColor = '#8B2323';
                    header.style.color = '#ffffff';
                    header.style.padding = '8px';
                    header.style.textAlign = 'left';
                    header.style.fontWeight = 'bold';
                    header.style.border = '1px solid #8B2323';
                    header.style.fontSize = '9px';
                });
                
                // Remove last cells (photo) from headers
                const lastHeader = headers[headers.length - 1];
                if (lastHeader && lastHeader.textContent.includes('Foto')) {
                    lastHeader.remove();
                }
                
                // Cell styles
                const cells = clonedTable.querySelectorAll('tbody td');
                let rowCount = 0;
                cells.forEach((cell, index) => {
                    cell.style.padding = '6px 8px';
                    cell.style.border = '1px solid #ddd';
                    cell.style.fontSize = '8px';
                    
                    // Remove images
                    const images = cell.querySelectorAll('img');
                    images.forEach(img => img.remove());
                    
                    // Remove last cell in each row (photo)
                    if ((index + 1) % 5 === 0) {
                        cell.remove();
                        rowCount++;
                    }
                });
                
                // Alternate row colors
                const rows = clonedTable.querySelectorAll('tbody tr');
                rows.forEach((row, idx) => {
                    if (idx % 2 === 0) {
                        row.style.backgroundColor = '#f8f8f8';
                    } else {
                        row.style.backgroundColor = '#ffffff';
                    }
                    row.style.borderLeft = '3px solid transparent';
                });
                
                tableSection.appendChild(clonedTable);
            }
            
            pdfContainer.appendChild(tableSection);
            
            // ===== PIE CHART (Checkpoints Distribution) =====
            const chartSection = document.createElement('div');
            chartSection.style.marginTop = '25px';
            chartSection.style.paddingTop = '15px';
            chartSection.style.borderTop = '2px solid #ddd';
            chartSection.style.pageBreakInside = 'avoid';
            
            const chartTitle = document.createElement('h2');
            chartTitle.textContent = 'Checkpoints Distribution';
            chartTitle.style.color = '#8B2323';
            chartTitle.style.fontSize = '14px';
            chartTitle.style.marginBottom = '12px';
            chartTitle.style.marginTop = '0';
            chartSection.appendChild(chartTitle);
            
            // Calculate checkpoint distribution
            const puntosMap = {};
            filteredData.forEach(item => {
                const punto = item.punto || 'Not specified';
                puntosMap[punto] = (puntosMap[punto] || 0) + 1;
            });
            
            const puntosLabels = Object.keys(puntosMap);
            const puntosData = Object.values(puntosMap);
            
            // Create canvas for chart
            const chartCanvas = document.createElement('canvas');
            chartCanvas.id = 'pdfChart';
            chartCanvas.width = 350;
            chartCanvas.height = 250;
            chartCanvas.style.maxWidth = '100%';
            chartCanvas.style.margin = '0 auto';
            chartCanvas.style.display = 'block';
            
            chartSection.appendChild(chartCanvas);
            pdfContainer.appendChild(chartSection);
            
            // ===== STATISTICS SUMMARY =====
            const statsSection = document.createElement('div');
            statsSection.style.marginTop = '25px';
            statsSection.style.display = 'grid';
            statsSection.style.gridTemplateColumns = '1fr 1fr 1fr';
            statsSection.style.gap = '12px';
            statsSection.style.pageBreakInside = 'avoid';
            
            const stats = [
                { label: 'Total Records', value: filteredData.length, icon: '📊' },
                { label: 'Checkpoints', value: puntosLabels.length, icon: '📍' },
                { label: 'Generation Date', value: new Date().toLocaleDateString('en-US'), icon: '📅' }
            ];
            
            stats.forEach(stat => {
                const statBox = document.createElement('div');
                statBox.style.backgroundColor = '#f0f0f0';
                statBox.style.padding = '15px';
                statBox.style.borderRadius = '8px';
                statBox.style.textAlign = 'center';
                statBox.style.borderLeft = '4px solid #8B2323';
                
                statBox.innerHTML = `
                    <p style="margin: 0; font-size: 12px; color: #666;">${stat.icon} ${stat.label}</p>
                    <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: #8B2323;">${stat.value}</p>
                `;
                
                statsSection.appendChild(statBox);
            });
            
            pdfContainer.appendChild(statsSection);
            
            // ===== FOOTER =====
            const footer = document.createElement('div');
            footer.style.marginTop = '25px';
            footer.style.paddingTop = '12px';
            footer.style.borderTop = '2px solid #ddd';
            footer.style.fontSize = '9px';
            footer.style.color = '#999';
            footer.style.textAlign = 'center';
            footer.style.pageBreakInside = 'avoid';
            
            footer.innerHTML = `
                <p style="margin: 0;">
                    📋 Document automatically generated by Liderman Reports System
                </p>
                <p style="margin: 4px 0 0 0;">
                    🔒 Confidential Information - Internal Use Only
                </p>
            `;
            
            pdfContainer.appendChild(footer);
            
            // Add to DOM temporarily - NOW VISIBLE FROM START
            const tempContainer = document.createElement('div');
            // 🔧 STEP A: Make container visible FROM START
            tempContainer.style.display = 'block';
            tempContainer.style.position = 'fixed';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            tempContainer.style.width = '1200px';
            tempContainer.style.height = 'auto';
            tempContainer.appendChild(pdfContainer);
            document.body.appendChild(tempContainer);
            
            // Create chart
            const ctx = chartCanvas.getContext('2d');
            const chartColors = ['#8B2323', '#D4504B', '#E89189', '#C8544B', '#A63F38', '#6B1812'];
            
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: puntosLabels,
                    datasets: [{
                        data: puntosData,
                        backgroundColor: chartColors.slice(0, puntosLabels.length),
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { size: 9 },
                                padding: 10
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.parsed + ' records';
                                }
                            }
                        }
                    }
                }
            });
            
            // 🔧 STEP B: WAIT FOR ALL IMAGES TO LOAD
            console.log('✅ Waiting for images to load...');
            
            await Promise.all(
                Array.from(pdfContainer.querySelectorAll('img')).map(img => {
                    if (!img.complete) {
                        return new Promise((resolve) => {
                            img.onload = resolve;
                            img.onerror = resolve;  // Also resolve on error
                        });
                    }
                    return Promise.resolve();
                })
            );
            
            console.log('✅ All images loaded. Waiting 500ms before generating PDF...');
            
            // 🔧 STEP C: WAIT 500MS BEFORE GENERATING PDF
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('✅ Generating PDF with html2pdf...');
            
            const opt = {
                margin: [8, 8, 8, 8],
                filename: `Report_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true, 
                    allowTaint: true,
                    logging: false,
                    windowHeight: 2000
                },
                jsPDF: { 
                    orientation: 'landscape', 
                    unit: 'mm', 
                    format: 'a4'
                },
                pagebreak: { mode: 'avoid-all', before: '.page-break-before' }
            };
            
            // Generate PDF
            await html2pdf().set(opt).from(pdfContainer).save();
            
            console.log('✅ PDF generated successfully');
            document.body.removeChild(tempContainer);
            alert('✅ PDF exported successfully');
            
        } catch (error) {
            console.error('❌ Error in PDF export:', error);
            console.error('Stack:', error.stack);
            alert('Error exporting PDF: ' + error.message);
            
            // Clean up on error
            const tempContainer = document.querySelector('[style*="left: -9999px"]');
            if (tempContainer && tempContainer.parentNode) {
                document.body.removeChild(tempContainer);
            }
        }
    };

    const setupImageModal = () => {
        const modal = document.getElementById('imageModal');
        const closeBtn = document.querySelector('.modal-close');
        const modalImage = document.getElementById('modalImage');

        if (!modal || !closeBtn || !modalImage) {
            console.warn('⚠️ Modal de imagen no encontrado');
            return;
        }

        // Cerrar con el botón X
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.classList.remove('active');
            modalImage.classList.remove('zoomed');
        });

        // Cerrar modal al hacer click fuera de la imagen
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                modalImage.classList.remove('zoomed');
            }
        });

        // Agregar zoom al hacer click en la imagen
        modalImage.addEventListener('click', (e) => {
            e.stopPropagation();
            modalImage.classList.toggle('zoomed');
            if (modalImage.classList.contains('zoomed')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        });

        // Cerrar con tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
                modalImage.classList.remove('zoomed');
                document.body.style.overflow = 'auto';
            }
        });
    };

    const showImageModal = (e) => {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        
        if (!modal || !modalImage) {
            console.warn('⚠️ Elementos del modal no encontrados');
            return;
        }
        
        modalImage.src = e.target.getAttribute('data-full');
        modalImage.classList.remove('zoomed');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('📷 Imagen abierta:', modalImage.src);
    };

    return {
        init
    };
})();
