// Initialization Coordinator
console.log('🎯 Coordinador de Inicialización Cargado');

// Wait for all modules to be ready
const waitForReady = () => {
    const firebase_ready = window.firebaseReady && window.auth && window.db;
    const modules_ready = typeof authModule !== 'undefined' && 
                          typeof dashboardModule !== 'undefined' && 
                          typeof tableModule !== 'undefined' && 
                          typeof appModule !== 'undefined';
    const dom_ready = document.readyState === 'complete' || document.readyState === 'interactive';
    
    if (firebase_ready && modules_ready && dom_ready) {
        console.log('✅✅✅ TODO LISTO - Iniciando aplicación');
        
        // Initialize app modules
        try {
            appModule.init();
            console.log('✅ App Module iniciado');
        } catch (e) {
            console.error('Error en appModule:', e);
        }
        
        try {
            if (window.auth) {
                authModule.init();
                console.log('✅ Auth Module iniciado');
            }
        } catch (e) {
            console.error('Error en authModule:', e);
        }
    } else {
        console.log('⏳ Esperando...', {
            firebase: firebase_ready,
            modules: modules_ready,
            dom: dom_ready
        });
        setTimeout(waitForReady, 500);
    }
};

// Start waiting
waitForReady();
