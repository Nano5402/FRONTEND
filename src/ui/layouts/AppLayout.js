import { getDecodedToken, hasPermission, PERMISSIONS } from '../../utils/rbac.js';
import { storage } from '../../utils/storage.js';

export class AppLayout {
    constructor(containerId, onLogout) {
        this.container = document.getElementById(containerId);
        this.onLogout  = onLogout;
        // dashboard activo — se asigna desde main.js después de render()
        this.activeDashboard = null;
    }

    render() {
        const user = getDecodedToken();
        if (!user) return;

        const userName    = storage.getUserName() || 'Usuario';
        const userInitial = userName.charAt(0).toUpperCase();
        const userRole    = storage.getUserName() ? user.role || 'Usuario' : 'Usuario';

        // ── Menú dinámico según permisos ────────────────────────────────────
        let menuItems = `
            <li class="nav-item active" id="nav-dashboard">
                <i class="ph ph-squares-four"></i> Mi Panel
            </li>`;

        if (hasPermission(PERMISSIONS.USERS_READ_ALL)) {
            menuItems += `
            <li class="nav-item" id="nav-users">
                <i class="ph ph-users"></i> Gestión de Usuarios
            </li>`;
        }

        if (hasPermission(PERMISSIONS.SYSTEM_MANAGE_ALL)) {
            menuItems += `
            <li class="nav-item" id="nav-roles">
                <i class="ph ph-shield-check"></i> Seguridad y Roles
            </li>`;
        }

        this.container.innerHTML = `
            <div class="app-layout">
                <aside class="app-sidebar">
                    <div class="sidebar-top">
                        <div class="sidebar-brand">
                            <i class="ph-fill ph-rocket-launch"></i>
                            <span>TaskApp V2</span>
                        </div>
                        <ul class="nav-menu">${menuItems}</ul>
                    </div>
                    <div class="sidebar-bottom">
                        <li class="nav-item nav-logout" id="nav-logout">
                            <i class="ph ph-sign-out"></i> Cerrar Sesión
                        </li>
                    </div>
                </aside>

                <main class="app-main">
                    <header class="app-topbar">
                        <div>
                            <h3 style="color:var(--text-main);font-size:1.1rem;font-weight:700;">Área de Trabajo</h3>
                        </div>
                        <div class="topbar-user">
                            <div class="user-info">
                                <span class="user-name">${userName}</span>
                                <span class="user-role">${userRole}</span>
                            </div>
                            <div class="user-avatar">${userInitial}</div>
                        </div>
                    </header>
                    <!-- ✅ id="main-content-area" — único en todo el proyecto -->
                    <div class="app-content" id="main-content-area"></div>
                </main>
            </div>`;

        this._attachEvents();
    }

    // Marca visualmente el ítem activo
    _setActive(id) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById(id)?.classList.add('active');
    }

    _attachEvents() {
        document.getElementById('nav-logout').addEventListener('click', () => {
            this.onLogout();
        });

        document.getElementById('nav-dashboard')?.addEventListener('click', () => {
            this._setActive('nav-dashboard');
            // ✅ Llama al método del dashboard activo inyectado desde main.js
            this.activeDashboard?.navigateTo('dashboard');
        });

        document.getElementById('nav-users')?.addEventListener('click', () => {
            this._setActive('nav-users');
            this.activeDashboard?.navigateTo('users');
        });

        document.getElementById('nav-roles')?.addEventListener('click', () => {
            this._setActive('nav-roles');
            this.activeDashboard?.navigateTo('roles');
        });
    }
}