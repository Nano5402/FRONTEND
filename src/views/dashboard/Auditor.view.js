/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  views/dashboard/Auditor.view.js — DASHBOARD DEL AUDITOR             ║
 * ║                                                                      ║
 * ║  QUIÉN LO VE: Usuarios con permiso SYSTEM_AUDIT                      ║
 * ║                                                                      ║
 * ║  CAMBIOS COMPLETOS EN ESTA VERSIÓN:                                  ║
 * ║                                                                      ║
 * ║  1. auditLogs — nuevo array en el estado interno.                    ║
 * ║     Carga los registros de eliminaciones de raíz desde el backend    ║
 * ║     (GET /users/audit/logs) en paralelo con usuarios y tareas.       ║
 * ║                                                                      ║
 * ║  2. mount(initialView) — acepta vista inicial igual que Admin e      ║
 * ║     Instructor. Tiene manejo de error con try/catch.                 ║
 * ║                                                                      ║
 * ║  3. Dos vistas en lugar de una:                                      ║
 * ║     "Mi Panel" (_viewDashboard) → resumen ejecutivo con tarjetas     ║
 * ║       y últimas 5 tareas creadas                                     ║
 * ║     "Gestión de Usuarios" (_viewAudit) → auditoría forense:          ║
 * ║       tabla de usuarios inactivos Y tabla de eliminaciones de raíz  ║
 * ║       con motivo, admin que lo hizo y fecha                          ║
 * ║                                                                      ║
 * ║  4. El botón "Exportar Reporte" ahora incluye la lista de            ║
 * ║     eliminaciones además de usuarios e inactivos.                    ║
 * ║                                                                      ║
 * ║  EL AUDITOR SIGUE SIENDO SOLO LECTURA — no puede modificar nada.    ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { renderSidebar } from '../../components/Sidebar.js';
import { storage }       from '../../utils/storage.js';
import { toast }         from '../../components/Toast.js';
import * as tasksService from '../../services/tasks.service.js';
import * as usersService from '../../services/users.service.js';

export class AuditorView {
    constructor(rootId) {
        this.rootId      = rootId;
        this.auditorName = storage.getUserName() || 'Auditor';
        this.users       = []; // todos los usuarios del sistema
        this.tasks       = []; // todas las tareas del sistema
        this.auditLogs   = []; // NUEVO: registros de eliminaciones de raíz
    }

    /**
     * mount(initialView?)
     * Punto de entrada — llamado por main.js.
     *
     * CAMBIO: tiene try/catch para que un error de red o de permisos
     * no rompa la app. Si falla, muestra un toast y carga vacío.
     *
     * @param {string} initialView - 'dashboard' | 'users'
     *   'users' abre la vista de auditoría forense (no gestión de usuarios)
     */
    async mount(initialView = 'dashboard') {
        try {
            await this._load();
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            toast.error('Error de red o permisos insuficientes');
        }

        // Marcamos el ítem correcto del sidebar como activo
        const activeRoute = initialView === 'dashboard' ? '/dashboard' : `/${initialView}`;
        const { html, bindEvents } = renderSidebar(activeRoute, vista => this.navigateTo(vista));

        document.getElementById(this.rootId).innerHTML = html;
        bindEvents(document);

        // Navegamos directamente a la sección solicitada
        this.navigateTo(initialView);
    }

    /**
     * navigateTo(vista)
     * 'dashboard' → Mi Panel (resumen ejecutivo)
     * 'users'     → Auditoría Forense (usuarios inactivos + eliminaciones)
     */
    navigateTo(vista) {
        if (vista === 'dashboard') this._viewDashboard();
        if (vista === 'users')     this._viewAudit();
    }

    _content() { return document.getElementById('main-content-area'); }

    // =========================================================================
    // VISTA 1: MI PANEL — resumen ejecutivo rápido
    // =========================================================================
    _viewDashboard() {
        const t = this.tasks;
        const u = this.users;
        const a = this.auditLogs;
        const s = (arr, fn) => arr.filter(fn).length;

        this._content().innerHTML = `
        <div style="animation:slideUpFade 0.4s var(--ease-smooth);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;">
                <div>
                    <h2 style="color:var(--text-main);margin:0 0 4px;">Resumen Global del Sistema</h2>
                    <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">
                        Hola, <b>${this.auditorName}</b>. Aquí tienes la vista de pájaro del sistema.
                    </p>
                </div>
            </div>

            <!-- Dos tarjetas de resumen: usuarios y productividad -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-bottom:30px;">

                <!-- Tarjeta: Estado de Usuarios -->
                <div class="card" style="border-left:4px solid var(--brand-primary);">
                    <h3 style="margin:0 0 15px;font-size:1rem;color:var(--text-main);">
                        <i class="ph ph-users"></i> Estado de Usuarios
                    </h3>
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span style="color:var(--text-muted);">Activos:</span>
                        <strong style="color:var(--success);">${s(u, x => x.status==='activo')}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span style="color:var(--text-muted);">Inactivos (Bloqueados):</span>
                        <strong style="color:var(--warning);">${s(u, x => x.status==='inactivo')}</strong>
                    </div>
                    <!--
                        a.length = número de registros en audit_logs
                        Cada registro representa un usuario eliminado de raíz
                    -->
                    <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border-subtle);">
                        <span style="color:var(--text-muted);">Eliminados de Raíz:</span>
                        <strong style="color:var(--danger);">${a.length}</strong>
                    </div>
                </div>

                <!-- Tarjeta: Productividad de Tareas -->
                <div class="card" style="border-left:4px solid var(--info);">
                    <h3 style="margin:0 0 15px;font-size:1rem;color:var(--text-main);">
                        <i class="ph ph-kanban"></i> Productividad (Tareas)
                    </h3>
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span style="color:var(--text-muted);">Pendientes / En Progreso:</span>
                        <strong style="color:var(--info);">
                            ${s(t, x => x.status==='pendiente' || x.status==='en progreso')}
                        </strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span style="color:var(--text-muted);">Completadas:</span>
                        <strong style="color:var(--success);">${s(t, x => x.status==='completada')}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border-subtle);">
                        <span style="color:var(--text-muted);">Rechazadas:</span>
                        <strong style="color:var(--warning);">${s(t, x => x.status==='incompleta')}</strong>
                    </div>
                </div>
            </div>

            <!-- Tabla: últimas 5 tareas creadas (vista rápida) -->
            <div class="card" style="padding:0;overflow:hidden;">
                <div style="padding:15px 20px;border-bottom:1px solid var(--border-subtle);">
                    <h3 style="margin:0;font-size:1rem;color:var(--text-main);">
                        <i class="ph ph-clock-counter-clockwise"></i> Últimas 5 Tareas Creadas
                    </h3>
                </div>
                <table class="data-table">
                    <thead><tr><th>ID</th><th>Título</th><th>Estado</th></tr></thead>
                    <tbody>
                        ${t.length === 0
                            ? `<tr><td colspan="3" style="text-align:center;padding:30px;color:var(--text-muted);">
                                Sin tareas registradas.
                               </td></tr>`
                            : t.slice(0, 5).map(task => `
                                <tr>
                                    <td style="color:var(--text-muted);font-weight:600;">#${task.id}</td>
                                    <td style="font-weight:600;color:var(--text-main);">${task.title}</td>
                                    <td>
                                        <span style="padding:3px 9px;border-radius:6px;font-size:0.72rem;
                                            font-weight:700;text-transform:uppercase;
                                            background:var(--brand-faded);color:var(--brand-primary);">
                                            ${task.status}
                                        </span>
                                    </td>
                                </tr>`).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>${this._styles()}`;
    }

    // =========================================================================
    // VISTA 2: AUDITORÍA FORENSE — usuarios inactivos + eliminaciones de raíz
    // =========================================================================
    _viewAudit() {
        const u         = this.users;
        const inactivos = u.filter(x => x.status === 'inactivo');
        const eliminados = this.auditLogs; // registros de hard delete

        this._content().innerHTML = `
        <div style="animation:slideUpFade 0.4s var(--ease-smooth);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;">
                <div>
                    <h2 style="color:var(--text-main);margin:0 0 4px;">Auditoría Forense de Usuarios</h2>
                    <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">
                        Rastreo de inactividad y eliminaciones de raíz.
                    </p>
                </div>
                <!-- Exportar: genera JSON con todo el reporte de auditoría -->
                <button id="btnExportReport" class="btn btn--outline"
                    style="border-color:var(--brand-primary);color:var(--brand-primary);">
                    <i class="ph ph-file-pdf"></i> Exportar Reporte JSON
                </button>
            </div>

            <!-- TABLA 1: Usuarios Inactivos (soft delete / bloqueados) -->
            <div class="card" style="padding:0;overflow:hidden;margin-bottom:25px;border-top:3px solid var(--warning);">
                <div style="padding:15px 20px;border-bottom:1px solid var(--border-subtle);background:var(--warning-bg);">
                    <h3 style="margin:0;font-size:1rem;color:var(--warning);">
                        <i class="ph ph-user-minus"></i>
                        Usuarios Inactivos (Bloqueados) — ${inactivos.length}
                    </h3>
                </div>
                <div style="overflow-x:auto;">
                    <table class="data-table">
                        <thead><tr>
                            <th>ID</th><th>Usuario</th><th>Documento</th><th>Rol</th>
                        </tr></thead>
                        <tbody>
                            ${inactivos.length === 0
                                ? `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-muted);">
                                    No hay usuarios inactivos en el sistema. ✅
                                   </td></tr>`
                                : inactivos.map(user => `
                                    <tr>
                                        <td style="color:var(--text-muted);font-weight:600;">#${user.id}</td>
                                        <td>
                                            <div style="font-weight:600;color:var(--text-main);">${user.name}</div>
                                            <div style="font-size:0.78rem;color:var(--text-muted);">${user.email}</div>
                                        </td>
                                        <td>${user.document}</td>
                                        <td style="text-transform:uppercase;font-size:0.8rem;font-weight:600;">
                                            ${user.role_name || user.role}
                                        </td>
                                    </tr>`).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- TABLA 2: Eliminaciones de Raíz (hard delete con justificación) -->
            <!--
                Estos registros vienen del endpoint GET /users/audit/logs
                El backend los guarda cada vez que el SuperAdmin hace un hard delete.
                Cada registro tiene: id, target_user_name, performed_by_name, reason, createdAt
            -->
            <div class="card" style="padding:0;overflow:hidden;border-top:3px solid var(--danger);">
                <div style="padding:15px 20px;border-bottom:1px solid var(--border-subtle);background:var(--danger-bg);">
                    <h3 style="margin:0;font-size:1rem;color:var(--danger);">
                        <i class="ph ph-skull"></i>
                        Usuarios Eliminados de Raíz — ${eliminados.length}
                    </h3>
                </div>
                <div style="overflow-x:auto;">
                    <table class="data-table">
                        <thead><tr>
                            <th>ID Log</th>
                            <th>Usuario Eliminado</th>
                            <th>Eliminado Por</th>
                            <th>Justificación</th>
                            <th>Fecha y Hora</th>
                        </tr></thead>
                        <tbody>
                            ${eliminados.length === 0
                                ? `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-muted);">
                                    El registro de auditoría está limpio. ✅
                                   </td></tr>`
                                : eliminados.map(log => `
                                    <tr>
                                        <td style="color:var(--text-muted);font-weight:600;">#${log.id}</td>
                                        <td style="font-weight:700;color:var(--text-main);">
                                            ${log.target_user_name}
                                        </td>
                                        <td>
                                            <!-- Badge para destacar quién hizo la acción -->
                                            <span style="padding:4px 8px;border-radius:6px;font-size:0.75rem;
                                                background:var(--info-bg);color:var(--info);font-weight:600;">
                                                ${log.performed_by_name || 'Desconocido'}
                                            </span>
                                        </td>
                                        <td style="max-width:300px;font-size:0.85rem;white-space:pre-wrap;">
                                            <i>"${log.reason}"</i>
                                        </td>
                                        <!-- toLocaleString() convierte el timestamp a fecha legible local -->
                                        <td style="font-size:0.85rem;color:var(--text-muted);">
                                            ${new Date(log.createdAt).toLocaleString()}
                                        </td>
                                    </tr>`).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>${this._styles()}`;

        // Conectamos el botón de exportar después de inyectar el HTML
        document.getElementById('btnExportReport')?.addEventListener('click', () => {
            const report = JSON.stringify({
                generadoEn:  new Date().toISOString(),
                generadoPor: this.auditorName,
                resumen: {
                    totalUsuarios:     u.length,
                    usuariosActivos:   u.filter(x => x.status === 'activo').length,
                    usuariosInactivos: inactivos.length,
                    eliminadosDeRaiz: eliminados.length,
                },
                // Incluimos los datos completos para análisis externo
                inactivos:    inactivos,
                eliminaciones: eliminados,
            }, null, 2);

            const blob = new Blob([report], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `reporte-auditoria-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // liberamos memoria
            toast.success('Reporte de auditoría exportado correctamente');
        });
    }

    _styles() {
        return `<style>
            .stat-card{background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:18px;}
            .stat-num{font-size:1.9rem;font-weight:800;color:var(--text-main);}
            .stat-lbl{font-size:0.75rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-top:4px;}
        </style>`;
    }

    /**
     * _load()
     * Carga en paralelo los tres conjuntos de datos que necesita el Auditor.
     *
     * Promise.all ejecuta las tres peticiones simultáneamente:
     *   - getUsers()     → todos los usuarios (para ver inactivos)
     *   - getTasks()     → todas las tareas (para métricas)
     *   - getAuditLogs() → registros de eliminaciones de raíz (NUEVO)
     */
    async _load() {
        const [u, t, a] = await Promise.all([
            usersService.getUsers(),
            tasksService.getTasks(),
            usersService.getAuditLogs(), // carga los logs de hard delete
        ]);
        this.users     = u;
        this.tasks     = t;
        this.auditLogs = a;
    }
}