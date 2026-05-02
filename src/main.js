import { storage } from './utils/storage.js';
import { AuthView } from './ui/views/AuthView.js';
import { AppLayout } from './ui/layouts/AppLayout.js';
import { getDecodedToken, hasPermission, PERMISSIONS } from './utils/rbac.js';

import { StudentDashboard }    from './ui/views/dashboards/StudentDashboard.js';
import { InstructorDashboard } from './ui/views/dashboards/InstructorDashboard.js';
import { AdminDashboard }      from './ui/views/dashboards/AdminDashboard.js';
import { AuditorDashboard }    from './ui/views/dashboards/AuditorDashboard.js';

document.addEventListener('DOMContentLoaded', () => {
    const appRouter = () => {
        const token = storage.getAccessToken();

        // ── Sin sesión → Login ───────────────────────────────────────────────
        if (!token) {
            const auth = new AuthView('app-root', () => appRouter());
            auth.renderLogin();
            return;
        }

        const user = getDecodedToken();
        if (!user || !user.permissions) {
            storage.clearTokens();
            return appRouter();
        }

        // ── Montamos el shell (sidebar + topbar + contenedor vacío) ──────────
        const layout = new AppLayout('app-root', () => {
            storage.clearTokens();
            appRouter();
        });
        layout.render();

        // ── Elegimos el dashboard según el rol ───────────────────────────────
        // El contenedor 'main-content-area' ya existe en el DOM tras layout.render()
        let dashboard;

        if (hasPermission(PERMISSIONS.SYSTEM_MANAGE_ALL)) {
            // ROL: SuperAdmin (documento 1097789129 en tu caso)
            dashboard = new AdminDashboard('main-content-area');

        } else if (hasPermission(PERMISSIONS.TASKS_CREATE_MULTIPLE)) {
            // ROL: Instructor / Profesor
            dashboard = new InstructorDashboard('main-content-area');

        } else if (hasPermission(PERMISSIONS.SYSTEM_AUDIT)) {
            // ROL: Auditor
            dashboard = new AuditorDashboard('main-content-area');

        } else {
            // ROL: Estudiante (menor privilegio por defecto)
            dashboard = new StudentDashboard('main-content-area');
        }

        // ✅ Le decimos al layout qué dashboard está activo
        // Así los clics del sidebar llaman a dashboard.navigateTo()
        layout.activeDashboard = dashboard;

        // Renderizamos la vista inicial (Mi Panel)
        dashboard.render();
    };

    appRouter();
});