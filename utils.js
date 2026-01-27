// Utility Module for Shared Logic
console.log('🛠️ Cargando módulo Utils...');

const utilsModule = (() => {
    /**
     * Formatea una fecha a string legible (dd/mm/yy HH:MM)
     * Soporta Firestore Timestamp, Date object, string y number
     */
    const formatDate = (dateInput) => {
        if (!dateInput) return '-';
        
        try {
            let date;
            
            // Si es un objeto Timestamp de Firestore (tiene método toDate)
            if (dateInput.toDate && typeof dateInput.toDate === 'function') {
                date = dateInput.toDate();
            } 
            // Si es un string
            else if (typeof dateInput === 'string') {
                // ISO format o variaciones
                if (dateInput.includes('T')) {
                    date = new Date(dateInput);
                } else {
                    // Intento simple, aunque new Date() suele manejarlo bien
                    date = new Date(dateInput);
                }
            }
            // Si es un Date
            else if (dateInput instanceof Date) {
                date = dateInput;
            }
            // Si es número (timestamp)
            else if (typeof dateInput === 'number') {
                date = new Date(dateInput);
            }
            else {
                return '-';
            }
            
            if (isNaN(date.getTime())) return '-';
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');
            
            return `${day}/${month}/${year} ${hour}:${minute}`;

        } catch (error) {
            console.error('Error formateando fecha en utils:', error);
            return '-';
        }
    };

    /**
     * Extrae lat/lng de un objeto de incidencia
     * Retorna {lat, lng} o null
     */
    const extractCoordinates = (item) => {
        if (!item.ubicacion) return null;

        let lat, lng;

        // Caso 1: Item tiene ubicacion como objeto {lat, lng}
        if (typeof item.ubicacion === 'object') {
            lat = parseFloat(item.ubicacion.lat);
            lng = parseFloat(item.ubicacion.lng);
        } else {
            return null;
        }

        if (isNaN(lat) || isNaN(lng)) return null;
        if (lat < -90 || lat > 90) return null;
        if (lng < -180 || lng > 180) return null;

        return { lat, lng };
    };

    /**
     * Filtra un array de datos por rango de fechas usando el campo createdAt
     */
    const filterByDateRange = (data, startDate, endDate) => {
        if (!startDate || !endDate) return data;
        
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return data.filter(item => {
            let itemDate;
            if (item.createdAt?.toDate) {
                itemDate = item.createdAt.toDate();
            } else if (typeof item.createdAt === 'string') {
                itemDate = new Date(item.createdAt);
            } else if (item.createdAt instanceof Date) {
                itemDate = item.createdAt;
            } else {
                return false;
            }
            
            return itemDate >= start && itemDate <= end;
        });
    };

    return {
        formatDate,
        extractCoordinates,
        filterByDateRange
    };
})();

// Hacer global para fácil acceso
window.utils = utilsModule;
