// Main App Module
console.log('🚀 Cargando módulo principal App...');

const appModule = (() => {
    const init = () => {
        console.log('🎯 Inicializando App');
        setupPageNavigation();
        setupSidebar();
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
            'dashboard': 'Dashboard',
            'table': 'Tabla de Datos'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'Página';
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

    return {
        init
    };
})();

// Initialize app when page is loaded
console.log('⏳ Esperando a que el DOM esté listo...');

const initializeApp = () => {
    console.log('📄 DOM cargado, inicializando app...');
    appModule.init();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
