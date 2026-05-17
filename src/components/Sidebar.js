/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  components/Sidebar.js — BARRA LATERAL + TOPBAR                      ║
 * ║                                                                      ║
 * ║  Genera el "shell" de la aplicación: la estructura visual que        ║
 * ║  contiene la barra lateral izquierda y la barra superior.           ║
 * ║                                                                      ║
 * ║  MENÚ DINÁMICO POR PERMISOS:                                         ║
 * ║  No todos los roles ven los mismos botones:                          ║
 * ║    Estudiante   → solo "Mi Panel"                                    ║
 * ║    Instructor   → "Mi Panel" + "Gestión de Usuarios" (=tareas)       ║
 * ║    Auditor      → solo "Mi Panel"                                    ║
 * ║    SuperAdmin   → "Mi Panel" + "Gestión de Usuarios" + "Seguridad"   ║
 * ║                                                                      ║
 * ║  CÓMO FUNCIONA:                                                      ║
 * ║  1. renderSidebar() genera el HTML y devuelve { html, bindEvents }   ║
 * ║  2. El dashboard inyecta el html en el DOM                           ║
 * ║  3. El dashboard llama bindEvents() para conectar los clics          ║
 * ║  4. Cuando el usuario hace clic en un ítem del menú:                 ║
 * ║     - Si hay onNavigate: llama a dashboard.navigateTo('vista')       ║
 * ║       (el dashboard cambia su contenido interno sin recargar)        ║
 * ║     - Si no hay onNavigate: el router navega a otra ruta completa    ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { hasPermission }  from '../utils/rbac.js';
import { storage }        from '../utils/storage.js';
import { getDecoded }     from '../utils/rbac.js';
import { PERMISSIONS }    from '../config/constants.js';
import { logoutService }  from '../services/auth.service.js';
import { router }         from '../core/router.js';

/**
 * renderSidebar(activeRoute, onNavigate?)
 * Genera el HTML completo del shell de la app (sidebar + topbar + contenedor).
 *
 * @param {string}   activeRoute - Ruta activa para marcar el ítem con clase 'active'
 * Ej: '/dashboard', '/users', '/roles'
 * @param {Function} onNavigate  - Callback opcional para navegación interna del dashboard
 * Si se pasa, los clics llaman onNavigate('dashboard'|'users'|'roles')
 * Si no se pasa, los clics usan router.navigate()
 *
 * @returns {{ html: string, bindEvents: Function }}
 * html:       El HTML del shell listo para inyectar en el DOM
 * bindEvents: Función que conecta los eventos — DEBE llamarse después de inyectar el HTML
 */
export function renderSidebar(activeRoute = '/dashboard', onNavigate = null) {
    // Leemos los datos del usuario del JWT decodificado y del localStorage
    const user      = getDecoded();
    const userName  = storage.getUserName() || 'Usuario';
    const userRole  = user?.role || 'Estudiante';
    const initial   = userName.charAt(0).toUpperCase(); // primera letra para el avatar

    // Función helper: devuelve 'active' si la ruta coincide, '' si no
    const isActive = route => activeRoute === route ? 'active' : '';

    // ── CONSTRUCCIÓN DEL MENÚ DINÁMICO ────────────────────────────────────────
    // Todos los roles ven "Mi Panel"
    let menuHTML = `
        <li class="nav-item ${isActive('/dashboard')}" data-route="/dashboard">
            <i class="ph ph-squares-four"></i> Mi Panel
        </li>`;

    // "Gestión de Usuarios" — solo si tiene permiso para ver todos los usuarios
    // Roles: SuperAdmin e Instructor
    if (hasPermission(PERMISSIONS.USERS_READ_ALL)) {
        menuHTML += `
        <li class="nav-item ${isActive('/users')}" data-route="/users">
            <i class="ph ph-users"></i> Gestión de Usuarios
        </li>`;
    }

    // "Seguridad y Roles" — solo el SuperAdmin
    if (hasPermission(PERMISSIONS.SYSTEM_MANAGE_ALL)) {
        menuHTML += `
        <li class="nav-item ${isActive('/roles')}" data-route="/roles">
            <i class="ph ph-shield-check"></i> Seguridad y Roles
        </li>`;
    }

    // ── HTML COMPLETO DEL SHELL ───────────────────────────────────────────────
    const html = `
        <div class="app-layout">
            <div class="sidebar-overlay" id="sidebarOverlay"></div>

            <aside class="app-sidebar" id="appSidebar">
                <div class="sidebar-top">
                    <div class="sidebar-brand">
                        <i class="ph-fill ph-rocket-launch"></i>
                        <span>TaskApp</span>
                    </div>
                    <ul class="nav-menu" id="sidebarMenu">${menuHTML}</ul>
                </div>
                <div class="sidebar-bottom">
                    <li class="nav-item nav-logout" id="nav-logout">
                        <i class="ph ph-sign-out"></i> Cerrar Sesión
                    </li>
                </div>
            </aside>

            <main class="app-main">
                <header class="app-topbar">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <button class="btn-menu-toggle" id="menuToggle">
                            <i class="ph ph-list"></i>
                        </button>
                        <h3 style="color:var(--text-main);font-size:1.1rem;font-weight:700;">Área de Trabajo</h3>
                    </div>
                    <div class="topbar-user">
                        <div class="user-info hidden-mobile">
                            <span class="user-name">${userName}</span>
                            <span class="user-role">${userRole}</span>
                        </div>
                        <div class="user-avatar">${initial}</div>
                    </div>
                </header>

                <div class="app-content" id="main-content-area"></div>
            </main>
        </div>`;

    // Devolvemos el HTML y la función para conectar eventos por separado
    // Esto es necesario porque los eventos deben conectarse DESPUÉS de que
    // el HTML esté en el DOM (si intentamos antes, los elementos no existen)
    return { html, bindEvents };

    /**
     * bindEvents(root?)
     * Conecta todos los eventos del sidebar al DOM.
     * DEBE llamarse después de inyectar html en el DOM.
     *
     * @param {Document|HTMLElement} root - Contexto de búsqueda (default: document)
     */
    function bindEvents(root = document) {
        // ── LÓGICA DEL MENÚ HAMBURGUESA (Móviles) ─────────────────────────────
        const menuToggle = root.getElementById('menuToggle');
        const sidebar = root.getElementById('appSidebar');
        const overlay = root.getElementById('sidebarOverlay');

        function toggleMenu() {
            if (sidebar && overlay) {
                sidebar.classList.toggle('is-open');
                overlay.classList.toggle('is-open');
            }
        }

        // Abrir/cerrar con el botón
        if (menuToggle) {
            menuToggle.addEventListener('click', toggleMenu);
        }
        
        // Cerrar al hacer clic en el fondo oscuro
        if (overlay) {
            overlay.addEventListener('click', toggleMenu);
        }

        // ── LOGOUT ────────────────────────────────────────────────────────────
        root.getElementById('nav-logout').addEventListener('click', async () => {
            await logoutService(); // limpia localStorage y store
            router.navigate('/login'); // redirige al login
        });

        // ── ÍTEMS DEL MENÚ ────────────────────────────────────────────────────
        root.querySelectorAll('#sidebarMenu .nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const route = item.getAttribute('data-route'); // ej: '/users'

                // 🔥 UX: Cerramos el menú en el celular automáticamente al hacer clic en un enlace
                if (sidebar && sidebar.classList.contains('is-open')) {
                    toggleMenu();
                }

                // Actualizamos visualmente el ítem activo
                root.querySelectorAll('#sidebarMenu .nav-item')
                    .forEach(el => el.classList.remove('active'));
                item.classList.add('active');

        if (onNavigate) {
         // MODO INTERNO: el dashboard tiene navegación propia.
         // Actualizamos el hash de la URL Y llamamos al dashboard.
         // Así la URL refleja en qué sección está el usuario y
         // compartir el link o recargar lleva a la sección correcta.
            const map = {
        '/dashboard': 'dashboard',
        '/users':     'users',
        '/roles':     'roles',
    };

            // Actualizamos el hash SIN disparar hashchange (replaceState)
            // para que el router no re-monte el dashboard desde cero
         history.replaceState(null, '', `#${route}`);

         // Luego le decimos al dashboard qué contenido mostrar
         onNavigate(map[route] || 'dashboard');
}       else {
            // MODO EXTERNO: navegamos con el router (cambia el hash)
         // Usado por StudentView y AuditorView que no tienen sub-vistas
         router.navigate(route);
}
            });
        });
    }
}