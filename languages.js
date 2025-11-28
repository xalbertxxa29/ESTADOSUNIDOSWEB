// Languages Configuration
const languages = {
    es: {
        // Login
        sistema_de_reportes: 'Sistema de Reportes',
        login_subtitle: 'Reportes e Incidencias',
        email_label: 'Correo Electrónico',
        email_placeholder: 'tu@email.com',
        password_label: 'Contraseña',
        password_placeholder: '••••••••',
        login_button: 'Iniciar Sesión',
        
        // Login Errors
        error_user_not_found: 'El usuario no existe',
        error_wrong_password: 'Contraseña incorrecta',
        error_invalid_email: 'Correo electrónico inválido',
        error_too_many_requests: 'Demasiados intentos fallidos. Intenta más tarde',
        error_user_disabled: 'Usuario deshabilitado',
        error_login_failed: 'Error al iniciar sesión',
        firebase_not_initialized: 'Firebase no está inicializado',
        
        // Sidebar
        sidebar_title: 'Sistema de Reportes Liderman',
        dashboard_menu: 'Dashboard',
        table_menu: 'Tabla',
        logout_button: 'Cerrar Sesión',
        
        // Dashboard
        dashboard_title: 'Dashboard',
        facility_tab: 'FACILITY',
        security_tab: 'SECURITY',
        total_records: 'Total de Registros',
        incident_records: 'Incidencias Registradas',
        records_by_date: 'Registros por Fecha',
        records_by_agent: 'Registros por Agente',
        marking_points: 'Puntos de Marcación',
        marking_location: 'Ubicación de Marcaciones',
        from_date: 'Desde:',
        to_date: 'Hasta:',
        filter_button: 'Filtrar',
        clear_button: 'Limpiar',
        
        // Table
        table_title: 'Tabla de Datos',
        filters_title: 'Filtros',
        export_excel: 'Exportar Excel',
        export_pdf: 'Exportar PDF',
        date_column: 'Fecha',
        name_column: 'Nombre',
        marking_point_column: 'Punto de Marcación',
        observation_column: 'Observación',
        photo_column: 'Foto',
        select_dates: 'Por favor selecciona ambas fechas',
        
        // General
        security_soon: 'Próximamente...',
        select_language: 'Seleccionar idioma',
    },
    en: {
        // Login
        sistema_de_reportes: 'Reporting System',
        login_subtitle: 'Reports and Incidents',
        email_label: 'Email',
        email_placeholder: 'your@email.com',
        password_label: 'Password',
        password_placeholder: '••••••••',
        login_button: 'Sign In',
        
        // Login Errors
        error_user_not_found: 'User not found',
        error_wrong_password: 'Wrong password',
        error_invalid_email: 'Invalid email',
        error_too_many_requests: 'Too many failed attempts. Try again later',
        error_user_disabled: 'User disabled',
        error_login_failed: 'Login failed',
        firebase_not_initialized: 'Firebase is not initialized',
        
        // Sidebar
        sidebar_title: 'Liderman Reporting System',
        dashboard_menu: 'Dashboard',
        table_menu: 'Table',
        logout_button: 'Logout',
        
        // Dashboard
        dashboard_title: 'Dashboard',
        facility_tab: 'FACILITY',
        security_tab: 'SECURITY',
        total_records: 'Total Records',
        incident_records: 'Registered Incidents',
        records_by_date: 'Records by Date',
        records_by_agent: 'Records by Agent',
        marking_points: 'Marking Points',
        marking_location: 'Marking Location',
        from_date: 'From:',
        to_date: 'To:',
        filter_button: 'Filter',
        clear_button: 'Clear',
        
        // Table
        table_title: 'Data Table',
        filters_title: 'Filters',
        export_excel: 'Export Excel',
        export_pdf: 'Export PDF',
        date_column: 'Date',
        name_column: 'Name',
        marking_point_column: 'Marking Point',
        observation_column: 'Observation',
        photo_column: 'Photo',
        select_dates: 'Please select both dates',
        
        // General
        security_soon: 'Coming soon...',
        select_language: 'Select language',
    }
};

// Get current language
const getCurrentLanguage = () => {
    return localStorage.getItem('selectedLanguage') || 'es';
};

// Set current language
const setLanguage = (lang) => {
    if (languages[lang]) {
        localStorage.setItem('selectedLanguage', lang);
        applyLanguage(lang);
    }
};

// Apply language to page
const applyLanguage = (lang) => {
    const currentLang = languages[lang];
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (currentLang[key]) {
            if (element.tagName === 'INPUT' && element.type === 'placeholder') {
                element.placeholder = currentLang[key];
            } else if (element.tagName === 'INPUT') {
                element.value = currentLang[key];
            } else {
                element.textContent = currentLang[key];
            }
        }
    });
    
    // Update input placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (currentLang[key]) {
            element.placeholder = currentLang[key];
        }
    });
    
    // Update page title
    document.title = currentLang.login_title;
};

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    const lang = getCurrentLanguage();
    applyLanguage(lang);
    
    // Update language selector if it exists
    const langSelector = document.getElementById('languageSelector');
    if (langSelector) {
        langSelector.value = lang;
    }
});

// Export for use in other modules
const i18n = {
    t: (key) => {
        const lang = getCurrentLanguage();
        return languages[lang][key] || key;
    },
    setLanguage,
    getCurrentLanguage
};
