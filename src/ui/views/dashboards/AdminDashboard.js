import Swal from 'sweetalert2';
import { fetchTodosLosUsuarios, fetchTodasLasTareas, actualizarUsuario, cambiarEstadoUsuario, crearUsuario, eliminarUsuario } from '../../../api/index.js';
import { getDecodedToken } from '../../../utils/rbac.js';
import { storage } from '../../../utils/storage.js';
import { showSuccessToast, showErrorToast } from '../../components/notificaciones.js';

export class AdminDashboard {
    constructor(containerId) {
        this.containerId = containerId;
        this.admin       = getDecodedToken();
        this.adminName   = storage.getUserName() || 'SuperAdmin';
        this.users = [];
        this.tasks = [];
    }

    async render() {
        await this._reload();
        this.navigateTo('dashboard');
    }

    navigateTo(vista) {
        if (vista === 'dashboard') this._viewPanel();
        if (vista === 'users')     this._viewUsuarios();
        if (vista === 'roles')     this._viewRoles();
    }

    _container() { return document.getElementById(this.containerId); }

    // ── Mi Panel ──────────────────────────────────────────────────────────────
    _viewPanel() {
        const total      = this.users.length;
        const admins     = this.users.filter(u => u.role === 'admin').length;
        const students   = this.users.filter(u => u.role === 'user').length;
        const auditores  = this.users.filter(u => u.role === 'auditor').length;
        const activos    = this.users.filter(u => u.status === 'activo').length;
        const inactivos  = this.users.filter(u => u.status === 'inactivo').length;
        const totalT     = this.tasks.length;
        const completadas= this.tasks.filter(t => t.status === 'completada').length;
        const pendientes = this.tasks.filter(t => t.status === 'pendiente').length;
        const enProgreso = this.tasks.filter(t => t.status === 'en progreso').length;

        this._container().innerHTML = `
        <div style="animation:slideUpFade 0.4s var(--ease-smooth);">
            <div style="margin-bottom:25px;">
                <h2 style="color:var(--text-main);margin:0 0 4px;">Panel de Control</h2>
                <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">Bienvenido, <b>${this.adminName}</b>. Vista global del sistema.</p>
            </div>
            <p style="color:var(--text-muted);font-size:0.75rem;font-weight:700;text-transform:uppercase;margin:0 0 10px;">Usuarios</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:24px;">
                ${this._stat(total,      'Total',        'var(--brand-primary)')}
                ${this._stat(activos,    'Activos',      'var(--success)')}
                ${this._stat(inactivos,  'Inactivos',    'var(--danger)')}
                ${this._stat(admins,     'Instructores', null)}
                ${this._stat(students,   'Estudiantes',  null)}
                ${this._stat(auditores,  'Auditores',    null)}
            </div>
            <p style="color:var(--text-muted);font-size:0.75rem;font-weight:700;text-transform:uppercase;margin:0 0 10px;">Tareas</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:24px;">
                ${this._stat(totalT,     'Total',       null)}
                ${this._stat(pendientes, 'Pendientes',  'var(--danger)')}
                ${this._stat(enProgreso, 'En Progreso', 'var(--info)')}
                ${this._stat(completadas,'Completadas', 'var(--success)')}
            </div>
            ${inactivos > 0
                ? `<div class="card" style="border-left:4px solid var(--warning);padding:15px 20px;background:var(--warning-bg);">
                    <p style="margin:0;color:var(--warning);font-weight:600;font-size:0.9rem;">⚠️ Hay <b>${inactivos}</b> usuario${inactivos!==1?'s':''} inactivo${inactivos!==1?'s':''}. Ve a <b>Gestión de Usuarios</b>.</p>
                   </div>`
                : `<div class="card" style="border-left:4px solid var(--success);padding:15px 20px;background:var(--success-bg);">
                    <p style="margin:0;color:var(--success);font-weight:600;font-size:0.9rem;">✅ Todos los usuarios están activos.</p>
                   </div>`
            }
        </div>${this._styles()}`;
    }

    _stat(val, lbl, color) {
        return `<div class="stat-card">
            <div class="stat-num" ${color?`style="color:${color};"`:''}>${val}</div>
            <div class="stat-lbl">${lbl}</div>
        </div>`;
    }

    // ── Gestión de Usuarios ───────────────────────────────────────────────────
    _viewUsuarios() {
        this._container().innerHTML = `
        <div style="animation:slideUpFade 0.4s var(--ease-smooth);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
                <div>
                    <h2 style="color:var(--text-main);margin:0 0 4px;">Gestión de Usuarios</h2>
                    <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">Administra roles, estados y accesos.</p>
                </div>
                <button id="btnNewUser" class="btn btn--primary">
                    <i class="ph ph-user-plus"></i> Registrar Usuario
                </button>
            </div>
            <div class="card" style="padding:0;overflow:hidden;">
                <div style="overflow-x:auto;">
                    <table class="data-table">
                        <thead><tr>
                            <th>ID</th><th>Usuario</th><th>Documento</th>
                            <th>Rol</th><th>Estado</th>
                            <th style="text-align:right;">Acciones</th>
                        </tr></thead>
                        <tbody id="adminUsersBody">${this._usersRows()}</tbody>
                    </table>
                </div>
            </div>
        </div>${this._styles()}`;

        this._bindUserEvents();
    }

    _usersRows() {
        if (!this.users.length) return `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">No hay usuarios registrados.</td></tr>`;
        const rc = r => r==='admin'?'var(--info)':r==='auditor'?'var(--warning)':'var(--brand-primary)';
        const rb = r => r==='admin'?'var(--info-bg)':r==='auditor'?'var(--warning-bg)':'var(--brand-faded)';

        return this.users.map(u => {
            const isMe = String(u.id) === String(this.admin.id);
            // Serializamos el objeto limpio sin caracteres problemáticos
            const safeUser = JSON.stringify({
                id: u.id, name: u.name, email: u.email,
                document: u.document, role: u.role, status: u.status
            });
            return `
            <tr>
                <td style="color:var(--text-muted);font-weight:600;">#${u.id}</td>
                <td>
                    <div style="font-weight:600;color:var(--text-main);">${u.name}${isMe?' <span style="color:var(--success);font-size:0.75rem;">(Tú)</span>':''}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted);">${u.email}</div>
                </td>
                <td>${u.document}</td>
                <td><span style="padding:3px 9px;border-radius:6px;font-size:0.72rem;font-weight:700;text-transform:uppercase;background:${rb(u.role)};color:${rc(u.role)};">${u.role_name||u.role}</span></td>
                <td><span style="padding:3px 9px;border-radius:6px;font-size:0.72rem;font-weight:700;text-transform:uppercase;${u.status==='activo'?'background:var(--success-bg);color:var(--success);':'background:var(--danger-bg);color:var(--danger);'}">${u.status}</span></td>
                <td style="text-align:right;">
                    <div style="display:flex;gap:6px;justify-content:flex-end;">
                        <button class="btn-action btn-action--primary btn-edit" data-id="${u.id}">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        ${!isMe ? `
                        <button class="btn-action ${u.status==='activo'?'btn-action--danger':'btn-action--success'} btn-toggle"
                            data-id="${u.id}" data-status="${u.status}" data-role="${u.role}">
                            <i class="ph ph-power"></i> ${u.status==='activo'?'Desactivar':'Activar'}
                        </button>
                        <button class="btn-action btn-action--danger btn-hard-delete"
                            data-id="${u.id}" data-name="${u.name}">
                            <i class="ph ph-trash"></i> Raíz
                        </button>` : `<span style="font-size:0.8rem;color:var(--text-muted);padding:6px;">Control Total</span>`}
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    _bindUserEvents() {
        // ── Nuevo usuario ─────────────────────────────────────────────────────
        document.getElementById('btnNewUser').addEventListener('click', async () => {
            const { value: fv } = await Swal.fire({
                title: 'Crear Usuario',
                html: `<div style="text-align:left;">
                    <input id="c-name"  class="form__input" placeholder="Nombre Completo"   style="margin-bottom:10px;width:100%;">
                    <input id="c-doc"   class="form__input" placeholder="Documento"          style="margin-bottom:10px;width:100%;">
                    <input id="c-email" class="form__input" placeholder="Correo electrónico" type="email" style="margin-bottom:10px;width:100%;">
                    <select id="c-role" class="form__input" style="margin-bottom:10px;width:100%;">
                        <option value="user">Estudiante</option>
                        <option value="admin">Instructor</option>
                        <option value="auditor">Auditor</option>
                    </select>
                    <input id="c-pass" class="form__input" placeholder="Contraseña temporal" type="password" style="width:100%;">
                </div>`,
                showCancelButton: true, confirmButtonText: 'Crear', confirmButtonColor: 'var(--brand-primary)',
                preConfirm: () => {
                    const name = document.getElementById('c-name').value.trim();
                    const doc  = document.getElementById('c-doc').value.trim();
                    const email= document.getElementById('c-email').value.trim();
                    const role = document.getElementById('c-role').value;
                    const pass = document.getElementById('c-pass').value.trim();
                    if (!name||!doc||!email||!pass) { Swal.showValidationMessage('Todos los campos son obligatorios'); return false; }
                    return { name, document: doc, email, role, password: pass };
                }
            });
            if (!fv) return;
            // ✅ FIX: un solo bloque try/catch, sin _reload() separado que cause doble toast
            try {
                Swal.showLoading();
                await crearUsuario(fv);
                await this._reload();           // recargamos datos en memoria
                this._viewUsuarios();           // re-renderizamos con datos frescos
                showSuccessToast('Usuario creado correctamente');
            } catch (err) {
                showErrorToast('Error al crear usuario');
            }
        });

        // ── Editar ────────────────────────────────────────────────────────────
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', async e => {
                // Buscamos el usuario en memoria por id — evitamos parsear JSON del DOM
                const userId = e.currentTarget.getAttribute('data-id');
                const u = this.users.find(u => String(u.id) === String(userId));
                if (!u) return;

                const { value: fv } = await Swal.fire({
                    title: 'Editar Usuario',
                    html: `<div style="text-align:left;">
                        <label style="color:var(--text-muted);font-size:0.8rem;">Nombre</label>
                        <input id="e-name" class="form__input" value="${u.name}" style="margin-bottom:10px;width:100%;">
                        <label style="color:var(--text-muted);font-size:0.8rem;">Documento</label>
                        <input id="e-doc"  class="form__input" value="${u.document}" style="margin-bottom:10px;width:100%;">
                        <label style="color:var(--text-muted);font-size:0.8rem;">Rol</label>
                        <select id="e-role" class="form__input" style="width:100%;">
                            <option value="user"    ${u.role==='user'   ?'selected':''}>Estudiante</option>
                            <option value="admin"   ${u.role==='admin'  ?'selected':''}>Instructor</option>
                            <option value="auditor" ${u.role==='auditor'?'selected':''}>Auditor</option>
                        </select>
                    </div>`,
                    showCancelButton: true, confirmButtonText: 'Guardar', confirmButtonColor: 'var(--brand-primary)',
                    preConfirm: () => ({
                        name:     document.getElementById('e-name').value.trim(),
                        document: document.getElementById('e-doc').value.trim(),
                        role:     document.getElementById('e-role').value,
                        email:    u.email,
                        status:   u.status
                    })
                });
                if (!fv) return;
                // ✅ FIX: reload → re-render → toast en ese orden, sin llamadas duplicadas
                try {
                    Swal.showLoading();
                    await actualizarUsuario(u.id, fv);
                    await this._reload();
                    this._viewUsuarios();
                    showSuccessToast('Usuario actualizado correctamente');
                } catch (err) {
                    showErrorToast('Error al actualizar usuario');
                }
            });
        });

        // ── Toggle activo/inactivo ────────────────────────────────────────────
        document.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', async e => {
                const userId  = e.currentTarget.getAttribute('data-id');
                const current = e.currentTarget.getAttribute('data-status');
                const role    = e.currentTarget.getAttribute('data-role');
                const next    = current === 'activo' ? 'inactivo' : 'activo';

                // Validación: no desactivar estudiante con tareas pendientes
                if (next === 'inactivo' && role === 'user') {
                    const pend = this.tasks.filter(t => String(t.userId) === String(userId) && t.status !== 'completada');
                    if (pend.length) {
                        Swal.fire('Bloqueado', `El estudiante tiene <b>${pend.length} tarea(s)</b> sin completar.`, 'warning');
                        return;
                    }
                }
                // ✅ FIX: reload → re-render → toast sin doble petición
                try {
                    await cambiarEstadoUsuario(userId, next);
                    await this._reload();
                    this._viewUsuarios();
                    showSuccessToast(`Usuario ${next === 'activo' ? 'activado' : 'desactivado'} correctamente`);
                } catch (err) {
                    showErrorToast('Error al cambiar el estado');
                }
            });
        });

        // ── Hard delete ───────────────────────────────────────────────────────
        document.querySelectorAll('.btn-hard-delete').forEach(btn => {
            btn.addEventListener('click', async e => {
                const userId   = e.currentTarget.getAttribute('data-id');
                const userName = e.currentTarget.getAttribute('data-name');

                const { value: reason } = await Swal.fire({
                    title: 'Eliminación de Raíz',
                    html: `Eliminarás permanentemente a <b>${userName}</b> de la base de datos.`,
                    input: 'textarea', inputLabel: 'Justificación (obligatoria para auditoría):',
                    inputPlaceholder: 'Ej: Retiro definitivo del programa de formación...',
                    icon: 'error', showCancelButton: true,
                    confirmButtonColor: '#ef4444', confirmButtonText: 'Eliminar definitivamente',
                    inputValidator: v => (!v || v.trim().length < 5) && 'La justificación es obligatoria'
                });
                if (!reason) return;
                // ✅ FIX: mismo patrón — reload → re-render → toast
                try {
                    Swal.showLoading();
                    await eliminarUsuario(userId);
                    console.log(`[AUDITORÍA] Usuario ${userId} eliminado. Motivo: ${reason}`);
                    await this._reload();
                    this._viewUsuarios();
                    showSuccessToast('Usuario eliminado del sistema permanentemente');
                } catch (err) {
                    showErrorToast('Error al eliminar el usuario');
                }
            });
        });
    }

    // ── Seguridad y Roles ─────────────────────────────────────────────────────
    _viewRoles() {
        const porRol = {
            admin:   this.users.filter(u => u.role === 'admin'),
            user:    this.users.filter(u => u.role === 'user'),
            auditor: this.users.filter(u => u.role === 'auditor'),
        };

        const card = (titulo, color, bg, icon, lista, permisos) => `
        <div class="card" style="border-top:3px solid ${color};">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                <i class="${icon}" style="font-size:1.4rem;color:${color};"></i>
                <div>
                    <h3 style="margin:0;color:var(--text-main);font-size:1rem;">${titulo}</h3>
                    <span style="font-size:0.78rem;color:var(--text-muted);">${lista.length} usuario${lista.length!==1?'s':''}</span>
                </div>
            </div>
            <p style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin:0 0 8px;">Permisos</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:${lista.length?'14px':'0'};">
                ${permisos.map(p=>`<span style="padding:2px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;background:${bg};color:${color};">${p}</span>`).join('')}
            </div>
            ${lista.length ? `
            <div style="border-top:1px solid var(--border-subtle);padding-top:12px;">
                <p style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin:0 0 8px;">Usuarios asignados</p>
                <div style="display:flex;flex-direction:column;gap:6px;">
                    ${lista.map(u=>`
                    <div style="display:flex;align-items:center;gap:9px;padding:7px 10px;background:var(--bg-app);border-radius:6px;">
                        <div style="width:28px;height:28px;border-radius:6px;background:${bg};color:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;">${u.name.charAt(0)}</div>
                        <div>
                            <div style="font-weight:600;font-size:0.88rem;color:var(--text-main);">${u.name}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted);">${u.status==='activo'?'🟢 Activo':'🔴 Inactivo'}</div>
                        </div>
                    </div>`).join('')}
                </div>
            </div>` : ''}
        </div>`;

        this._container().innerHTML = `
        <div style="animation:slideUpFade 0.4s var(--ease-smooth);">
            <div style="margin-bottom:20px;">
                <h2 style="color:var(--text-main);margin:0 0 4px;">Seguridad y Roles</h2>
                <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">Distribución de permisos por rol en el sistema.</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;">
                ${card('Instructor','var(--info)','var(--info-bg)','ph ph-chalkboard-teacher',porRol.admin,
                    ['Asignar tareas','Ver todos los usuarios','Editar tareas','Eliminar tareas','Aprobar / Rechazar'])}
                ${card('Estudiante','var(--brand-primary)','var(--brand-faded)','ph ph-student',porRol.user,
                    ['Ver sus propias tareas','Iniciar tareas','Exportar JSON'])}
                ${card('Auditor','var(--warning)','var(--warning-bg)','ph ph-eye',porRol.auditor,
                    ['Ver actividad del sistema','Exportar reporte global'])}
            </div>
        </div>${this._styles()}`;
    }

    _styles() {
        return `<style>
            .stat-card{background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:18px;}
            .stat-num{font-size:1.9rem;font-weight:800;color:var(--text-main);}
            .stat-lbl{font-size:0.75rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-top:4px;}
        </style>`;
    }

    // ✅ Un solo método de recarga — datos en memoria, sin efectos secundarios
    async _reload() {
        const [u, t] = await Promise.all([fetchTodosLosUsuarios(), fetchTodasLasTareas()]);
        this.users = u;
        this.tasks = t;
    }
}