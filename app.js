// Main App Module
console.log('🚀 Cargando módulo principal App...');

const appModule = (() => {
    const init = () => {
        console.log('🎯 Inicializando App');
        setupPageNavigation();
        setupSidebar();
        setupLanguageSelector();
        console.log('✅ App inicializado');
    };

    const setupPageNavigation = () => {
        console.log('📱 Configurando navegación de páginas');
        const menuItems = document.querySelectorAll('.menu-item');

        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔄 Cambiando página');

                // Remove active class from all items
                menuItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Get page name
                const page = item.getAttribute('data-page');
                console.log('📄 Página seleccionada:', page);

                const pages = document.querySelectorAll('.page');

                // Hide all pages
                pages.forEach(p => p.classList.remove('active'));

                // Show selected page
                const selectedPage = document.getElementById(page + 'Page');
                if (selectedPage) {
                    selectedPage.classList.add('active');
                    updatePageTitle(page);

                    // Refresh dashboard if switching to it
                    if (page === 'dashboard') {
                        setTimeout(() => {
                            const lineChart = document.getElementById('lineChartDate');
                            const barChart = document.getElementById('barChartAgent');
                            const pieChart = document.getElementById('pieChartPoints');
                            if (lineChart) lineChart.style.display = 'block';
                            if (barChart) barChart.style.display = 'block';
                            if (pieChart) pieChart.style.display = 'block';
                        }, 100);
                    }
                }

                closeSidebar();
            });
        });
    };

    const updatePageTitle = (page) => {
        const titles = {
            'dashboard': 'dashboard_title',
            'table': 'table_title'
        };
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            const titleKey = titles[page] || 'Página';
            pageTitle.textContent = i18n.t(titleKey);
        }
    };

    const setupSidebar = () => {
        console.log('🎨 Configurando sidebar');
        const toggleBtn = document.getElementById('toggleSidebar');
        const toggleBtnHeader = document.getElementById('toggleSidebarHeader');
        const sidebar = document.querySelector('.sidebar');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                sidebar.classList.toggle('active');
            });
        }

        if (toggleBtnHeader) {
            toggleBtnHeader.addEventListener('click', (e) => {
                e.preventDefault();
                sidebar.classList.toggle('active');
            });
        }

        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sidebar') &&
                !e.target.closest('.btn-hamburger') &&
                !e.target.closest('.btn-hamburger-header') &&
                window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    };

    const closeSidebar = () => {
        if (window.innerWidth <= 768) {
            document.querySelector('.sidebar').classList.remove('active');
        }
    };

    const setupLanguageSelector = () => {
        console.log('🌐 Configurando selector de idioma');

        // Selector del login (si existe)
        const languageSelectorLogin = document.getElementById('languageSelectorLogin');

        // Selector del header (si existe)
        const languageSelector = document.getElementById('languageSelector');

        // Función para sincronizar ambos selectores
        const syncSelectors = (lang) => {
            if (languageSelectorLogin) {
                languageSelectorLogin.value = lang;
            }
            if (languageSelector) {
                languageSelector.value = lang;
            }
        };

        // Set current language on page load
        const currentLang = i18n.getCurrentLanguage();
        syncSelectors(currentLang);

        // Add change event listener al selector del login
        if (languageSelectorLogin) {
            languageSelectorLogin.addEventListener('change', (e) => {
                console.log('🔄 Cambiando idioma a:', e.target.value);
                i18n.setLanguage(e.target.value);
                syncSelectors(e.target.value);
                console.log('✅ Idioma cambiado');
            });
        }

        // Add change event listener al selector del header
        if (languageSelector) {
            languageSelector.addEventListener('change', (e) => {
                console.log('🔄 Cambiando idioma a:', e.target.value);
                i18n.setLanguage(e.target.value);
                syncSelectors(e.target.value);
                console.log('✅ Idioma cambiado');
            });
        }
    };

    return {
        init
    };
})();
