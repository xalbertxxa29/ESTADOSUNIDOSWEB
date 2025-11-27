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
        const tableData = [];
        tableData.push(['Fecha', 'Nombre', 'Punto de Marcación', 'Observación']);

        filteredData.forEach(item => {
            tableData.push([
                formatDate(item.createdAt),
                item.nombreAgente || '-',
                item.punto || '-',
                item.observacion || '-'
            ]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(tableData);
        ws['!cols'] = [
            { wch: 15 },
            { wch: 20 },
            { wch: 20 },
            { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Incidencias');
        XLSX.writeFile(wb, `Incidencias_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPdf = () => {
        const element = document.getElementById('dataTable');
        const opt = {
            margin: 10,
            filename: `Incidencias_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
        };

        // Create table copy for PDF
        const clonedTable = element.cloneNode(true);
        const photoHeaders = clonedTable.querySelectorAll('th:last-child');
        photoHeaders.forEach(header => header.remove());
        const photoCells = clonedTable.querySelectorAll('td:last-child');
        photoCells.forEach(cell => cell.remove());

        html2pdf().set(opt).from(clonedTable).save();
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
