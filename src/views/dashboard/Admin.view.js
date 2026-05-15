/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  views/dashboard/Admin.view.js — DASHBOARD DEL SUPERADMIN            ║
 * ║                                                                      ║
 * ║  QUIÉN LO VE: Solo el SuperAdmin (permiso SYSTEM_MANAGE_ALL)         ║
 * ║                                                                      ║
 * ║  CAMBIOS EN ESTA VERSIÓN:                                            ║
 * ║                                                                      ║
 * ║  1. mount(initialView) — ahora acepta la vista inicial como          ║
 * ║     parámetro para que las rutas /users y /roles del router          ║
 * ║     puedan abrir directamente la sección correcta sin doble          ║
 * ║     navegación. También marca visualmente el ítem correcto del       ║
 * ║     sidebar desde el principio.                                      ║
 * ║                                                                      ║
 * ║  2. Hard Delete con palabras clave obligatorias — al eliminar        ║
 * ║     un usuario, la justificación debe contener una de estas          ║
 * ║     palabras: retiro, deserción, expulsión (u otras similares).     ║
 * ║     Si no las contiene, SweetAlert2 bloquea el envío.               ║
 * ║     Esto garantiza que las eliminaciones sean trazables y            ║
 * ║     no arbitrarias para el sistema de auditoría.                    ║
 * ║                                                                      ║
 * ║  3. deleteUser(id, reason) — ahora se le pasa la justificación       ║
 * ║     al service, que la envía al backend como query string.           ║
 * ║                                                                      ║
 * ║  ESTRUCTURA INTERNA — 3 vistas navegables desde el sidebar:          ║
 * ║    "Mi Panel"           → métricas globales                          ║
 * ║    "Gestión de Usuarios"→ CRUD completo                              ║
 * ║    "Seguridad y Roles"  → distribución de permisos por rol           ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import Swal from 'sweetalert2';
import { renderSidebar }  from '../../components/Sidebar.js';
import { toast }          from '../../components/Toast.js';
import * as usersService  from '../../services/users.service.js';
import * as tasksService  from '../../services/tasks.service.js';

export class AdminView {
    constructor(rootId) {
        this.rootId = rootId;
        this.users  = []; // se llena en _load()
        this.tasks  = []; // se llena en _load()
        // NOTA: adminName se eliminó del constructor porque storage.getUserName()
        // se lee directamente desde el Sidebar — no se necesita aquí
    }

    /**
     * mount(initialView?)
     * Punto de entrada — llamado por main.js.
     *
     * CAMBIO: Ahora acepta initialView para saber qué vista abrir.
     * Esto permite que las rutas /users y /roles del router carguen
     * directamente la sección correcta sin doble navegación.
     *
     * @param {string} initialView - 'dashboard' | 'users' | 'roles'
     *
     * SECUENCIA:
     * 1. Carga datos con manejo de error (no rompe si falla)
     * 2. Calcula la ruta activa para el sidebar según la vista
     * 3. Renderiza el sidebar marcando el ítem correcto
     * 4. Navega directamente a la sección pedida
     */
    async mount(initialView = 'dashboard') {
        try {
            await this._load();
        } catch (error) {
            console.error('Error cargando datos del administrador:', error);
            toast.error('Error al sincronizar datos globales');
            // No retornamos — dejamos que la vista cargue aunque sea vacía
        }

        // Traducimos la vista interna al path del sidebar para marcarlo activo
        // Ej: 'users' → '/users', 'dashboard' → '/dashboard'
        const activeRoute = initialView === 'dashboard' ? '/dashboard' : `/${initialView}`;

        const { html, bindEvents } = renderSidebar(activeRoute, vista => this.navigateTo(vista));
        document.getElementById(this.rootId).innerHTML = html;
        bindEvents(document);

        // Cargamos directamente la sección solicitada (sin pasar por 'dashboard' primero)
        this.navigateTo(initialView);
    }

    /**
     * navigateTo(vista)
     * El sidebar llama este método cuando el usuario hace clic en un ítem.
     * @param {string} vista - 'dashboard' | 'users' | 'roles'
     */
    navigateTo(vista) {
        if (vista === 'dashboard') this._viewPanel();
        if (vista === 'users')     this._viewUsers();
        if (vista === 'roles')     this._viewRoles();
    }

    /** Referencia fresca al contenedor de contenido */
    _content() { return document.getElementById('main-content-area'); }

    // =========================================================================
    // VISTA 1: MI PANEL — métricas globales
    // =========================================================================
    _viewPanel() {
        const u = this.users, t = this.tasks;
        const s = (arr, fn) => arr.filter(fn).length; // helper de conteo

        this._content().innerHTML = `
        <div style="animation:slideUpFade 0.4s var(--ease-smooth);">
            <div style="margin-bottom:24px;">
                <h2 style="color:var(--text-main);margin:0 0 4px;">Panel de Control</h2>
                <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">Vista global del sistema en tiempo real.</p>
            </div>

            <p class="section-label">Usuarios</p>
            <div class="stats-grid">
                ${this._stat(u.length,                          'Total',        'var(--brand-primary)')}
                ${this._stat(s(u, x => x.status==='activo'),   'Activos',      'var(--success)')}
                ${this._stat(s(u, x => x.status==='inactivo'), 'Inactivos',    'var(--danger)')}
                ${this._stat(s(u, x => x.role==='admin'),      'Instructores', null)}
                ${this._stat(s(u, x => x.role==='user'),       'Estudiantes',  null)}
                ${this._stat(s(u, x => x.role==='auditor'),    'Auditores',    null)}
            </div>

            <p class="section-label" style="margin-top:20px;">Tareas</p>
            <div class="stats-grid">
                ${this._stat(t.length,                                'Total',       null)}
                ${this._stat(s(t, x => x.status==='pendiente'),       'Pendientes',  'var(--danger)')}
                ${this._stat(s(t, x => x.status==='en progreso'),     'En Progreso', 'var(--info)')}
                ${this._stat(s(t, x => x.status==='completada'),      'Completadas', 'var(--success)')}
                ${this._stat(s(t, x => x.status==='incompleta'),      'Rechazadas',  'var(--warning)')}
            </div>

            <!-- Alerta dinámica según estado de usuarios -->
            ${s(u, x => x.status==='inactivo') > 0
                ? `<div class="alert-card alert-card--warning">
                    ⚠️ Hay <b>${s(u, x => x.status==='inactivo')}</b> usuario(s) inactivo(s).
                    Ve a <b>Gestión de Usuarios</b>.
                   </div>`
                : `<div class="alert-card alert-card--success">
                    ✅ Todos los usuarios están activos.
                   </div>`}
        </div>
        ${this._styles()}`;
    }

    /** Genera el HTML de una tarjeta de estadística */
    _stat(val, lbl, color) {
        return `<div class="stat-card">
            <div class="stat-num" ${color ? `style="color:${color};"` : ''}>${val}</div>
            <div class="stat-lbl">${lbl}</div>
        </div>`;
    }

    // =========================================================================
    // VISTA 2: GESTIÓN DE USUARIOS — CRUD completo
    // =========================================================================
    _viewUsers() {
        this._content().innerHTML = `
        <div style="animation:slideUpFade 0.4s var(--ease-smooth);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
                <div>
                    <h2 style="color:var(--text-main);margin:0 0 4px;">Gestión de Usuarios</h2>
                    <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">Administra roles, estados y accesos.</p>
                </div>
            </div>
            <div class="card" style="padding:0;overflow:hidden;">
                <div style="overflow-x:auto;">
                    <table class="data-table">
                        <thead><tr>
                            <th>ID</th><th>Usuario</th><th>Documento</th>
                            <th>Rol</th><th>Estado</th>
                            <th style="text-align:right;">Acciones</th>
                        </tr></thead>
                        <tbody>${this._usersRows()}</tbody>
                    </table>
                </div>
            </div>
        </div>${this._styles()}`;

        this._bindUsersEvents();
    }

    /** Genera las filas de la tabla de usuarios */
    _usersRows() {
        if (!this.users.length) {
            return `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">
                No hay usuarios registrados.
            </td></tr>`;
        }

        const rc = r => r==='admin' ? 'var(--info)' : r==='auditor' ? 'var(--warning)' : 'var(--brand-primary)';
        const rb = r => r==='admin' ? 'var(--info-bg)' : r==='auditor' ? 'var(--warning-bg)' : 'var(--brand-faded)';

        return this.users.map(u => `
        <tr>
            <td style="color:var(--text-muted);font-weight:600;">#${u.id}</td>
            <td>
                <div style="font-weight:600;color:var(--text-main);">${u.name}</div>
                <div style="font-size:0.78rem;color:var(--text-muted);">${u.email}</div>
            </td>
            <td>${u.document}</td>
            <td><span style="padding:3px 9px;border-radius:6px;font-size:0.72rem;font-weight:700;
                text-transform:uppercase;background:${rb(u.role)};color:${rc(u.role)};">
                ${u.role_name || u.role}
            </span></td>
            <td><span style="padding:3px 9px;border-radius:6px;font-size:0.72rem;font-weight:700;
                text-transform:uppercase;
                ${u.status==='activo'
                    ? 'background:var(--success-bg);color:var(--success);'
                    : 'background:var(--danger-bg);color:var(--danger);'}">
                ${u.status}
            </span></td>
            <td style="text-align:right;">
                <div style="display:flex;gap:6px;justify-content:flex-end;">
                    <button class="btn-action btn-action--primary btn-edit" data-id="${u.id}">
                        <i class="ph ph-pencil-simple"></i>
                    </button>
                    <button class="btn-action ${u.status==='activo' ? 'btn-action--danger' : 'btn-action--success'} btn-toggle"
                        data-id="${u.id}" data-status="${u.status}" data-role="${u.role}">
                        <i class="ph ph-power"></i> ${u.status==='activo' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="btn-action btn-action--danger btn-delete"
                        data-id="${u.id}" data-name="${u.name}">
                        <i class="ph ph-trash"></i> Raíz
                    </button>
                </div>
            </td>
        </tr>`).join('');
    }

    _bindUsersEvents() {
        // ── CREAR USUARIO ─────────────────────────────────────────────────────
        // document.getElementById('btnNewUser').addEventListener('click', async () => {
        //     const { value: fv } = await Swal.fire({
        //         title: 'Crear Usuario',
        //         html: `<div style="text-align:left;">
        //             <input id="c-name"  class="form__input" placeholder="Nombre Completo"
        //                 style="margin-bottom:10px;width:100%;">
        //             <input id="c-doc"   class="form__input" placeholder="Documento"
        //                 style="margin-bottom:10px;width:100%;">
        //             <input id="c-email" class="form__input" placeholder="Correo electrónico"
        //                 type="email" style="margin-bottom:10px;width:100%;">
        //             <select id="c-role" class="form__input" style="margin-bottom:10px;width:100%;">
        //                 <option value="user">Estudiante</option>
        //                 <option value="admin">Instructor</option>
        //                 <option value="auditor">Auditor</option>
        //             </select>
        //             <input id="c-pass" class="form__input" placeholder="Contraseña temporal"
        //                 type="password" style="width:100%;">
        //         </div>`,
        //         showCancelButton: true, confirmButtonText: 'Crear',
        //         confirmButtonColor: 'var(--brand-primary)',
        //         preConfirm: () => {
        //             const name  = document.getElementById('c-name').value.trim();
        //             const doc   = document.getElementById('c-doc').value.trim();
        //             const email = document.getElementById('c-email').value.trim();
        //             const role  = document.getElementById('c-role').value;
        //             const pass  = document.getElementById('c-pass').value.trim();
        //             if (!name||!doc||!email||!pass) {
        //                 Swal.showValidationMessage('Todos los campos son obligatorios');
        //                 return false;
        //             }
        //             return { name, document: doc, email, role, password: pass };
        //         },
        //     });
        //     if (!fv) return;
        //     try {
        //         await usersService.createUser(fv);
        //         await this._load();
        //         this._viewUsers();
        //         toast.success('Usuario creado correctamente');
        //     } catch (err) { toast.error(err.message || 'Error al crear'); }
        // });

        // ── EDITAR USUARIO ────────────────────────────────────────────────────
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', async e => {
                // Buscamos en memoria por ID — más seguro que parsear JSON del DOM
                const u = this.users.find(x => String(x.id) === e.currentTarget.getAttribute('data-id'));
                if (!u) return;

                const { value: fv } = await Swal.fire({
                    title: 'Editar Usuario',
                    html: `<div style="text-align:left;">
                        <label style="color:var(--text-muted);font-size:0.8rem;">Nombre</label>
                        <input id="e-name" class="form__input" value="${u.name}"
                            style="margin-bottom:10px;width:100%;">
                        <label style="color:var(--text-muted);font-size:0.8rem;">Documento</label>
                        <input id="e-doc" class="form__input" value="${u.document}"
                            style="margin-bottom:10px;width:100%;">
                        <label style="color:var(--text-muted);font-size:0.8rem;">Rol</label>
                        <select id="e-role" class="form__input" style="width:100%;">
                            <option value="user"    ${u.role==='user'   ?'selected':''}>Estudiante</option>
                            <option value="admin"   ${u.role==='admin'  ?'selected':''}>Instructor</option>
                            <option value="auditor" ${u.role==='auditor'?'selected':''}>Auditor</option>
                        </select>
                    </div>`,
                    showCancelButton: true, confirmButtonText: 'Guardar',
                    confirmButtonColor: 'var(--brand-primary)',
                    preConfirm: () => ({
                        name:     document.getElementById('e-name').value.trim(),
                        document: document.getElementById('e-doc').value.trim(),
                        role:     document.getElementById('e-role').value,
                        email:    u.email,
                        status:   u.status,
                    }),
                });
                if (!fv) return;
                try {
                    await usersService.updateUser(u.id, fv);
                    await this._load();
                    this._viewUsers();
                    toast.success('Usuario actualizado correctamente');
                } catch (err) { toast.error(err.message || 'Error al editar'); }
            });
        });

        // ── SOFT DELETE: ACTIVAR / DESACTIVAR ────────────────────────────────
        document.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id     = e.currentTarget.getAttribute('data-id');
                const status = e.currentTarget.getAttribute('data-status');
                const role   = e.currentTarget.getAttribute('data-role');
                const next   = status === 'activo' ? 'inactivo' : 'activo';
                try {
                    if (next === 'inactivo' && role === 'user') {
                        // safeDeactivate verifica que no haya tareas pendientes antes de desactivar
                        await usersService.safeDeactivate(id);
                    } else {
                        await usersService.patchStatus(id, next);
                    }
                    await this._load();
                    this._viewUsers();
                    toast.success(`Usuario ${next === 'activo' ? 'activado' : 'desactivado'}`);
                } catch (err) { toast.error(err.message || 'Error al cambiar estado'); }
            });
        });

        // ── HARD DELETE CON PALABRAS CLAVE ────────────────────────────────────
        // CAMBIO: La justificación ahora debe contener palabras clave específicas.
        // Esto garantiza que las eliminaciones tengan un motivo válido y trazable.
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id   = e.currentTarget.getAttribute('data-id');
                const name = e.currentTarget.getAttribute('data-name');

                // Lista de palabras clave aceptadas para la justificación de auditoría
                const palabrasClave = [
                    'retiro', 'voluntario', 'deserción', 'desercion',
                    'expulsión', 'expulsion'
                ];

                const { value: reason } = await Swal.fire({
                    title: 'Eliminación de Raíz',
                    html: `Eliminarás permanentemente a <b>${name}</b> de la base de datos.
                           <br><br>
                           <span style="font-size:0.85rem;color:var(--text-muted);">
                               <b>Regla de Auditoría:</b> La justificación debe contener alguna
                               de estas palabras clave:
                               <i>${palabrasClave.join(', ')}</i>.
                           </span>`,
                    input:        'textarea',
                    inputLabel:   'Justificación (auditoría):',
                    icon:         'error',
                    showCancelButton:  true,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText:  'Eliminar de Raíz',
                    inputValidator: v => {
                        // Validación 1: mínimo 5 caracteres
                        if (!v || v.trim().length < 5) {
                            return 'La justificación es obligatoria (mínimo 5 caracteres).';
                        }
                        // Validación 2: debe contener al menos una palabra clave
                        // .toLowerCase() para que "Retiro" y "retiro" sean equivalentes
                        const texto = v.toLowerCase();
                        const contiene = palabrasClave.some(p => texto.includes(p));
                        if (!contiene) {
                            return 'Debe incluir una palabra clave válida (Ej: Retiro, Deserción, Expulsión...)';
                        }
                    },
                });

                if (!reason) return;
                try {
                    // CAMBIO: le pasamos la justificación al service
                    // El service la envía al backend como query string: DELETE /users/:id?reason=...
                    await usersService.deleteUser(id, reason);

                    // Registramos en consola para trazabilidad local
                    console.log(`[AUDITORÍA] Usuario ${id} (${name}) eliminado. Motivo: ${reason}`);

                    await this._load();
                    this._viewUsers();
                    toast.success('Usuario eliminado permanentemente del sistema');
                } catch (err) { toast.error(err.message || 'Error al eliminar'); }
            });
        });
    }

    // =========================================================================
    // VISTA 3: SEGURIDAD Y ROLES — solo lectura
    // =========================================================================
    _viewRoles() {
        const byRole = {
            admin:   this.users.filter(u => u.role === 'admin'),
            user:    this.users.filter(u => u.role === 'user'),
            auditor: this.users.filter(u => u.role === 'auditor'),
        };

        // Helper local para generar cada tarjeta de rol
        const card = (titulo, color, bg, icon, lista, permisos) => `
        <div class="card" style="border-top:3px solid ${color};">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                <i class="${icon}" style="font-size:1.4rem;color:${color};"></i>
                <div>
                    <h3 style="margin:0;color:var(--text-main);font-size:1rem;">${titulo}</h3>
                    <span style="font-size:0.78rem;color:var(--text-muted);">
                        ${lista.length} usuario${lista.length!==1?'s':''}
                    </span>
                </div>
            </div>
            <p style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin:0 0 8px;">Permisos</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:${lista.length?'14px':'0'};">
                ${permisos.map(p =>
                    `<span style="padding:2px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;background:${bg};color:${color};">${p}</span>`
                ).join('')}
            </div>
            ${lista.length ? `
            <div style="border-top:1px solid var(--border-subtle);padding-top:12px;">
                ${lista.map(u => `
                <div style="display:flex;align-items:center;gap:9px;padding:7px 10px;background:var(--bg-app);border-radius:6px;margin-bottom:6px;">
                    <div style="width:28px;height:28px;border-radius:6px;background:${bg};color:${color};
                        display:flex;align-items:center;justify-content:center;font-weight:700;">
                        ${u.name.charAt(0)}
                    </div>
                    <div>
                        <div style="font-weight:600;font-size:0.88rem;color:var(--text-main);">${u.name}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted);">
                            ${u.status==='activo' ? '🟢 Activo' : '🔴 Inactivo'}
                        </div>
                    </div>
                </div>`).join('')}
            </div>` : ''}
        </div>`;

        this._content().innerHTML = `
        <div style="animation:slideUpFade 0.4s var(--ease-smooth);">
            <div style="margin-bottom:20px;">
                <h2 style="color:var(--text-main);margin:0 0 4px;">Seguridad y Roles</h2>
                <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">Distribución de permisos por rol.</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;">
                ${card('Instructor','var(--info)','var(--info-bg)','ph ph-chalkboard-teacher',
                    byRole.admin, ['Asignar tareas','Ver todos los usuarios','Editar tareas','Aprobar / Rechazar'])}
                ${card('Estudiante','var(--brand-primary)','var(--brand-faded)','ph ph-student',
                    byRole.user, ['Ver sus tareas','Iniciar tareas','Exportar JSON'])}
                ${card('Auditor','var(--warning)','var(--warning-bg)','ph ph-eye',
                    byRole.auditor, ['Ver actividad','Exportar reporte'])}
            </div>
        </div>${this._styles()}`;
    }

    _styles() {
        return `<style>
            .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:16px;}
            .stat-card{background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:18px;}
            .stat-num{font-size:1.9rem;font-weight:800;color:var(--text-main);}
            .stat-lbl{font-size:0.75rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-top:4px;}
            .section-label{color:var(--text-muted);font-size:0.75rem;font-weight:700;text-transform:uppercase;margin:0 0 10px;}
            .alert-card{padding:15px 20px;border-radius:var(--radius-sm);font-weight:600;font-size:0.9rem;}
            .alert-card--warning{border-left:4px solid var(--warning);background:var(--warning-bg);color:var(--warning);}
            .alert-card--success{border-left:4px solid var(--success);background:var(--success-bg);color:var(--success);}
        </style>`;
    }

    /** Carga usuarios y tareas en paralelo */
    async _load() {
        const [u, t] = await Promise.all([usersService.getUsers(), tasksService.getTasks()]);
        this.users = u;
        this.tasks = t;
    }
}