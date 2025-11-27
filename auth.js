// Authentication Module
console.log('📝 Cargando módulo Auth...');

const authModule = (() => {
    let loginForm, loginContainer, appContainer, logoutBtn, loginError, loginLoader;

    const init = () => {
        console.log('🔐 Inicializando Auth Module');
        setupElements();
    };

    const setupElements = () => {
        console.log('🔍 Buscando elementos del DOM...');
        loginForm = document.getElementById('loginForm');
        loginContainer = document.getElementById('loginContainer');
        appContainer = document.getElementById('appContainer');
        logoutBtn = document.getElementById('logoutBtn');
        loginError = document.getElementById('loginError');
        loginLoader = document.getElementById('loginLoader');

        console.log('✅ Elementos encontrados:', {
            loginForm: !!loginForm,
            loginContainer: !!loginContainer,
            appContainer: !!appContainer,
            logoutBtn: !!logoutBtn
        });

        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            console.log('✅ Listener de login agregado');
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
            console.log('✅ Listener de logout agregado');
        }
        checkAuthState();
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        console.log('🔑 Intentando login...');
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        console.log('📧 Email:', email);

        if (!window.auth) {
            console.error('❌ Firebase Auth no está disponible');
            loginError.textContent = 'Firebase no está inicializado';
            return;
        }

        loginLoader.classList.add('active');
        loginError.textContent = '';

        try {
            console.log('⏳ Autenticando con Firebase...');
            await window.auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Login exitoso');
            loginLoader.classList.remove('active');
        } catch (error) {
            console.error('❌ Error de login:', error.code, error.message);
            loginLoader.classList.remove('active');
            loginError.textContent = getErrorMessage(error.code);
        }
    };

    const handleLogout = async () => {
        console.log('🚪 Cerrando sesión...');
        try {
            if (window.auth) {
                await window.auth.signOut();
                console.log('✅ Sesión cerrada');
            }
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
        }
    };

    const checkAuthState = () => {
        console.log('🔍 Verificando estado de autenticación...');
        
        if (!window.auth) {
            console.warn('⏳ Auth no está listo, reintentando...');
            setTimeout(checkAuthState, 500);
            return;
        }

        window.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ Usuario autenticado:', user.email);
                showApp(user);
            } else {
                console.log('❌ Usuario no autenticado');
                showLogin();
            }
        });
    };

    const showLogin = () => {
        loginContainer.style.display = 'flex';
        appContainer.style.display = 'none';
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    };

    const showApp = (user) => {
        loginContainer.style.display = 'none';
        appContainer.style.display = 'grid';
        document.getElementById('userEmail').textContent = user.email;
        
        // Initialize dashboard after showing app
        setTimeout(() => {
            dashboardModule.init();
            tableModule.init();
        }, 100);
    };

    const getErrorMessage = (code) => {
        const messages = {
            'auth/user-not-found': 'El usuario no existe',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/invalid-email': 'Correo electrónico inválido',
            'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
            'auth/user-disabled': 'Usuario deshabilitado'
        };
        return messages[code] || 'Error al iniciar sesión';
    };

    return {
        init
    };
})();

// Initialize auth module when Firebase is ready
console.log('📋 Registrando authModuleInit...');

window.authModuleInit = () => {
    console.log('🚀 authModuleInit ejecutado');
    if (window.auth) {
        authModule.init();
    } else {
        console.warn('⏳ Auth aún no está listo, reintentando...');
        setTimeout(window.authModuleInit, 500);
    }
};

// Try to init when DOM is ready
const tryInitAuth = () => {
    console.log('⏳ Intentando inicializar Auth...');
    if (window.firebaseReady && window.auth) {
        console.log('✅ Firebase listo, iniciando Auth');
        window.authModuleInit();
    } else {
        console.log('⏳ Esperando Firebase...');
        setTimeout(tryInitAuth, 500);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInitAuth);
} else {
    tryInitAuth();
}
