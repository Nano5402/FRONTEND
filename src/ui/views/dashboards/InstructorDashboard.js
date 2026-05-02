import Swal from 'sweetalert2';
import { fetchTodosLosUsuarios, fetchTodasLasTareas, crearTareaMultiple, actualizarTarea, eliminarTarea } from '../../../api/index.js';
import { getDecodedToken } from '../../../utils/rbac.js';
import { storage } from '../../../utils/storage.js';
import { showSuccessToast, showErrorToast } from '../../components/notificaciones.js';

export class InstructorDashboard {
    constructor(containerId) {
        this.containerId      = containerId;
        this.instructor       = getDecodedToken();
        this.instructorName   = storage.getUserName() || 'Instructor';
        this.students         = [];
        this.tasks            = [];
        this.currentStudentId = null;
        this.currentFilter    = 'todos';
    }

    async render() {
        await this._reload();
        this.navigateTo('dashboard');
    }

    navigateTo(vista) {
        if (vista === 'dashboard') this._viewPanel();
        if (vista === 'users')     this._viewGestionTareas();
    }

    _container() { return document.getElementById(this.containerId); }

    // ── Mi Panel ──────────────────────────────────────────────────────────────
    _viewPanel() {
        const totalT      = this.tasks.length;
        const pendientes  = this.tasks.filter(t => t.status === 'pendiente').length;
        const enProgreso  = this.tasks.filter(t => t.status === 'en progreso').length;
        const completadas = this.tasks.filter(t => t.status === 'completada').length;
        const rechazadas  = this.tasks.filter(t => t.status === 'incompleta').length;

        this._container().innerHTML = `
        <div style="animation:slideUpFade 0.4s var(--ease-smooth);">
            <div style="margin-bottom:22px;">
                <h2 style="color:var(--text-main);margin:0 0 4px;">Gestión Docente</h2>
                <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">Bienvenido, <b>${this.instructorName}</b>.</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:26px;">
                ${this._stat(this.students.length, 'Estudiantes',  'var(--brand-primary)')}
                ${this._stat(totalT,               'Tareas Total', null)}
                ${this._stat(pendientes,           'Pendientes',   'var(--danger)')}
                ${this._stat(enProgreso,           'En Progreso',  'var(--info)')}
                ${this._stat(completadas,          'Completadas',  'var(--success)')}
                ${this._stat(rechazadas,           'Rechazadas',   'var(--warning)')}
            </div>
            <div class="card" style="padding:0;overflow:hidden;">
                <div style="padding:15px 20px;border-bottom:1px solid var(--border-subtle);">
                    <h3 style="margin:0;font-size:1rem;color:var(--text-main);">Resumen por Estudiante</h3>
                </div>
                <div style="overflow-x:auto;">
                    <table class="data-table">
                        <thead><tr>
                            <th>Estudiante</th>
                            <th style="text-align:center;">Total</th>
                            <th style="text-align:center;">Pendientes</th>
                            <th style="text-align:center;">En Progreso</th>
                            <th style="text-align:center;">Completadas</th>
                            <th style="text-align:center;">Rechazadas</th>
                        </tr></thead>
                        <tbody>
                        ${this.students.length === 0
                            ? `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px;">No hay estudiantes activos.</td></tr>`
                            : this.students.map(s => {
                                const st = this.tasks.filter(t => String(t.userId) === String(s.id));
                                return `<tr>
                                    <td style="font-weight:600;">${s.name}</td>
                                    <td style="text-align:center;">${st.length}</td>
                                    <td style="text-align:center;color:var(--danger);">${st.filter(t=>t.status==='pendiente').length}</td>
                                    <td style="text-align:center;color:var(--info);">${st.filter(t=>t.status==='en progreso').length}</td>
                                    <td style="text-align:center;color:var(--success);">${st.filter(t=>t.status==='completada').length}</td>
                                    <td style="text-align:center;color:var(--warning);">${st.filter(t=>t.status==='incompleta').length}</td>
                                </tr>`;
                            }).join('')
                        }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>${this._styles()}`;
    }

    _stat(val, lbl, color) {
        return `<div class="stat-card">
            <div class="stat-num" ${color?`style="color:${color};"`:''}>${val}</div>
            <div class="stat-lbl">${lbl}</div>
        </div>`;
    }

    // ── Gestión de Tareas ─────────────────────────────────────────────────────
    _viewGestionTareas() {
        this._container().innerHTML = `
        <div style="animation:slideUpFade 0.4s var(--ease-smooth);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <div>
                    <h2 style="color:var(--text-main);margin:0 0 4px;">Gestión de Tareas</h2>
                    <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">Asigna, edita y califica las tareas de tus estudiantes.</p>
                </div>
                <button id="btnAssignTask" class="btn btn--primary">
                    <i class="ph ph-plus-circle"></i> Asignar Tarea
                </button>
            </div>
            <div style="display:grid;grid-template-columns:250px 1fr;gap:20px;align-items:start;">
                <!-- Sidebar estudiantes -->
                <aside class="card" style="padding:0;overflow:hidden;position:sticky;top:20px;">
                    <h3 style="padding:13px 18px;margin:0;border-bottom:1px solid var(--border-subtle);font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">
                        👥 Estudiantes (${this.students.length})
                    </h3>
                    <div id="studentsList" style="max-height:calc(100vh - 310px);overflow-y:auto;">
                        ${this._buildStudentsList()}
                    </div>
                </aside>
                <!-- Panel de tareas -->
                <main class="card" style="padding:0;overflow:hidden;">
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 20px;border-bottom:1px solid var(--border-subtle);">
                        <h3 id="panelTitle" style="margin:0;font-size:1rem;color:var(--text-main);">
                            ${this._currentStudentName()}
                        </h3>
                        <select id="filterInstructor" class="form__input"
                            style="padding:6px 12px;font-size:0.85rem;width:auto;cursor:pointer;${this.currentStudentId?'':'display:none;'}">
                            <option value="todos">Todas</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="en progreso">En Progreso</option>
                            <option value="completada">Completadas</option>
                            <option value="incompleta">Rechazadas</option>
                        </select>
                    </div>
                    <div id="tasksContainer" style="padding:20px;">
                        ${!this.currentStudentId
                            ? `<div style="text-align:center;color:var(--text-muted);padding:40px 0;">
                                <i class="ph ph-hand-pointing" style="font-size:2rem;display:block;margin-bottom:10px;"></i>
                                Haz clic en un estudiante para ver sus tareas.
                               </div>`
                            : ''}
                    </div>
                </main>
            </div>
        </div>${this._styles()}`;

        if (this.currentStudentId) this._renderTasks();
        this._bindGestionEvents();
    }

    // Construye el HTML del sidebar de estudiantes — reutilizable sin re-renderizar toda la vista
    _buildStudentsList() {
        if (this.students.length === 0) {
            return `<div style="padding:20px;text-align:center;color:var(--text-muted);">No hay estudiantes activos.</div>`;
        }
        return this.students.map(s => {
            const count  = this.tasks.filter(t => String(t.userId) === String(s.id)).length;
            const active = String(this.currentStudentId) === String(s.id);
            return `<div class="student-item" data-id="${s.id}" data-name="${s.name}"
                style="display:flex;align-items:center;gap:11px;padding:12px 18px;border-bottom:1px solid var(--border-subtle);cursor:pointer;transition:background 0.15s;
                ${active?'background:var(--brand-faded);border-left:3px solid var(--brand-primary);':''}">
                <div style="width:32px;height:32px;border-radius:7px;background:var(--bg-app);border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--brand-primary);flex-shrink:0;">${s.name.charAt(0)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:0.87rem;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name}</div>
                    <div style="font-size:0.74rem;color:var(--text-muted);">${count} tarea${count!==1?'s':''}</div>
                </div>
            </div>`;
        }).join('');
    }

    _currentStudentName() {
        if (!this.currentStudentId) return 'Selecciona un estudiante';
        const s = this.students.find(s => String(s.id) === String(this.currentStudentId));
        return s ? `Tareas de ${s.name}` : 'Selecciona un estudiante';
    }

    _bindGestionEvents() {
        document.querySelectorAll('.student-item').forEach(item => {
            item.addEventListener('click', e => {
                document.querySelectorAll('.student-item').forEach(el => {
                    el.style.background = ''; el.style.borderLeft = '';
                });
                const t = e.currentTarget;
                t.style.background = 'var(--brand-faded)';
                t.style.borderLeft = '3px solid var(--brand-primary)';
                this.currentStudentId = t.getAttribute('data-id');
                document.getElementById('panelTitle').textContent = `Tareas de ${t.getAttribute('data-name')}`;
                document.getElementById('filterInstructor').style.display = 'block';
                this._renderTasks();
            });
        });

        document.getElementById('filterInstructor').addEventListener('change', e => {
            this.currentFilter = e.target.value;
            this._renderTasks();
        });

        document.getElementById('btnAssignTask').addEventListener('click', () => this._modalAsignar());
    }

    _renderTasks() {
        const container = document.getElementById('tasksContainer');
        if (!this.currentStudentId || !container) return;

        let st = this.tasks.filter(t => String(t.userId) === String(this.currentStudentId));
        if (this.currentFilter !== 'todos') {
            st = st.filter(t => t.status.toLowerCase() === this.currentFilter);
        }

        if (st.length === 0) {
            container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:30px;">No hay tareas con este filtro.</div>`;
            return;
        }

        const badge = s => {
            if (s==='pendiente')   return 'background:var(--danger-bg);color:var(--danger);';
            if (s==='en progreso') return 'background:var(--info-bg);color:var(--info);';
            if (s==='completada')  return 'background:var(--success-bg);color:var(--success);';
            return 'background:rgba(245,158,11,.1);color:var(--warning);'; // incompleta
        };

        container.innerHTML = st.map(task => {
            const isCompleted = task.status === 'completada';
            // ✅ FIX toggle: si está completada el botón dice "Reabrir", si no dice "Aprobar"
            const approveLabel = isCompleted
                ? '<i class="ph ph-arrow-counter-clockwise"></i> Reabrir'
                : '<i class="ph ph-check-circle"></i> Aprobar';
            const approveClass = isCompleted ? 'btn-action--primary btn-reopen' : 'btn-action--success btn-complete';

            // ✅ FIX rechazo: el status que se envía es 'pendiente' con nota en descripción
            // 'incompleta' requiere la ALTER TABLE del SQL adjunto
            // Si ya ejecutaste el SQL, puedes cambiar data-reject-status a 'incompleta'
            return `
            <div style="padding:16px;border:1px solid var(--border-subtle);border-radius:var(--radius-sm);margin-bottom:12px;background:var(--bg-app);">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:7px;">
                    <h4 style="margin:0;font-size:0.97rem;color:var(--text-main);">${task.title}</h4>
                    <span style="padding:3px 9px;border-radius:6px;font-size:0.7rem;font-weight:700;text-transform:uppercase;white-space:nowrap;margin-left:10px;${badge(task.status)}">${task.status}</span>
                </div>
                <p style="color:var(--text-muted);font-size:0.87rem;margin:0 0 12px;white-space:pre-wrap;">${task.description||'Sin descripción'}</p>
                <div style="display:flex;gap:7px;flex-wrap:wrap;border-top:1px solid var(--border-subtle);padding-top:12px;">
                    <button class="btn-action ${approveClass}"
                        data-id="${task.id}"
                        data-completed="${isCompleted}">
                        ${approveLabel}
                    </button>
                    <button class="btn-action btn-action--danger btn-reject"
                        data-id="${task.id}"
                        data-desc="${(task.description||'').replace(/"/g,'&quot;')}"
                        ${task.status==='incompleta'?'style="opacity:.4;pointer-events:none;"':''}>
                        <i class="ph ph-x-circle"></i> Rechazar
                    </button>
                    <div style="flex:1;"></div>
                    <button class="btn-action btn-action--primary btn-edit"
                        data-id="${task.id}"
                        data-title="${task.title.replace(/"/g,'&quot;')}"
                        data-desc="${(task.description||'').replace(/"/g,'&quot;')}">
                        <i class="ph ph-pencil-simple"></i> Editar
                    </button>
                    <button class="btn-action btn-action--danger btn-delete" data-id="${task.id}">
                        <i class="ph ph-trash"></i> Eliminar
                    </button>
                </div>
            </div>`;
        }).join('');

        this._bindTaskEvents();
    }

    _bindTaskEvents() {
        // ✅ FIX toggle Aprobar / Reabrir — un solo listener maneja ambos casos
        document.querySelectorAll('.btn-complete, .btn-reopen').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id          = e.currentTarget.getAttribute('data-id');
                const isCompleted = e.currentTarget.getAttribute('data-completed') === 'true';
                // Si ya estaba completada → reabrir a 'en progreso', si no → aprobar
                const newStatus   = isCompleted ? 'en progreso' : 'completada';
                const msg         = isCompleted ? 'Tarea reabierta' : 'Tarea aprobada';
                try {
                    await actualizarTarea(id, { status: newStatus });
                    showSuccessToast(msg);
                    await this._reloadAndRefresh();
                } catch { showErrorToast('Error al actualizar la tarea'); }
            });
        });

        // ✅ FIX rechazo: usa status 'pendiente' con nota en descripción
        // Una vez ejecutes el SQL adjunto (fix_enum_status.sql) cambia 'pendiente' → 'incompleta'
        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id      = e.currentTarget.getAttribute('data-id');
                const oldDesc = e.currentTarget.getAttribute('data-desc');

                const { value: reason } = await Swal.fire({
                    title: 'Rechazar Tarea',
                    input: 'textarea',
                    inputLabel: 'Justificación para el estudiante:',
                    inputPlaceholder: 'Ej: Faltó aplicar la 3FN en la tabla de usuarios...',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Rechazar',
                    inputValidator: v => (!v || v.trim().length < 5) && 'Escribe una justificación válida'
                });
                if (!reason) return;

                try {
                    const nuevaDesc = `${oldDesc}\n\n⚠️ REVISIÓN DEL INSTRUCTOR:\n${reason}`;
                    await actualizarTarea(id, {
                        status: 'incompleta',   // ← cambia a 'incompleta' tras ejecutar el SQL
                        description: nuevaDesc
                    });
                    showSuccessToast('Tarea rechazada correctamente');
                    await this._reloadAndRefresh();
                } catch { showErrorToast('Error al rechazar la tarea'); }
            });
        });

        // Editar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id = e.currentTarget.getAttribute('data-id');
                const tt = e.currentTarget.getAttribute('data-title');
                const td = e.currentTarget.getAttribute('data-desc');
                const { value: fv } = await Swal.fire({
                    title: 'Editar Tarea',
                    html: `<input id="et" class="form__input" value="${tt}" style="margin-bottom:10px;width:100%;">
                           <textarea id="ed" class="form__input" rows="4" style="width:100%;resize:none;">${td}</textarea>`,
                    showCancelButton: true, confirmButtonColor: 'var(--brand-primary)',
                    preConfirm: () => ({
                        title:       document.getElementById('et').value.trim(),
                        description: document.getElementById('ed').value.trim()
                    })
                });
                if (!fv) return;
                try {
                    await actualizarTarea(id, fv);
                    showSuccessToast('Tarea actualizada');
                    await this._reloadAndRefresh();
                } catch { showErrorToast('Error al editar'); }
            });
        });

        // Eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id = e.currentTarget.getAttribute('data-id');
                const ok = await Swal.fire({
                    title: '¿Eliminar tarea?', icon: 'warning',
                    showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, eliminar'
                });
                if (!ok.isConfirmed) return;
                try {
                    await eliminarTarea(id);
                    showSuccessToast('Tarea eliminada');
                    await this._reloadAndRefresh();
                } catch { showErrorToast('Error al eliminar'); }
            });
        });
    }

    async _modalAsignar() {
        if (!this.students.length) return showErrorToast('No hay estudiantes activos.');

        const cbs = this.students.map(s => `
            <label style="display:flex;align-items:center;gap:9px;padding:9px 12px;background:var(--bg-app);border:1px solid var(--border-subtle);border-radius:6px;cursor:pointer;">
                <input type="checkbox" name="swal-cb" value="${s.id}" style="width:15px;height:15px;accent-color:var(--brand-primary);">
                <span style="color:var(--text-main);font-size:0.87rem;">${s.name}</span>
            </label>`).join('');

        const { value: fv } = await Swal.fire({
            title: 'Asignar Nueva Tarea', width: '560px',
            html: `<div style="text-align:left;">
                <input id="st" class="form__input" placeholder="Título de la tarea" style="margin-bottom:10px;width:100%;">
                <textarea id="sd" class="form__input" placeholder="Instrucciones detalladas..." rows="3" style="margin-bottom:15px;width:100%;resize:none;"></textarea>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="color:var(--text-main);font-weight:600;font-size:0.88rem;">Asignar a:</span>
                    <button type="button" id="btn-all" style="background:none;border:none;color:var(--brand-primary);cursor:pointer;font-size:0.83rem;font-weight:600;">Marcar Todos</button>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;max-height:190px;overflow-y:auto;">${cbs}</div>
            </div>`,
            showCancelButton: true, confirmButtonText: 'Asignar', cancelButtonText: 'Cancelar',
            confirmButtonColor: 'var(--brand-primary)',
            didOpen: () => {
                let all = false;
                Swal.getPopup().querySelector('#btn-all').addEventListener('click', () => {
                    all = !all;
                    Swal.getPopup().querySelectorAll('input[name="swal-cb"]').forEach(c => c.checked = all);
                    Swal.getPopup().querySelector('#btn-all').textContent = all ? 'Desmarcar Todos' : 'Marcar Todos';
                });
            },
            preConfirm: () => {
                const title       = document.getElementById('st').value.trim();
                const description = document.getElementById('sd').value.trim();
                const userIds     = Array.from(document.querySelectorAll('input[name="swal-cb"]:checked')).map(c => Number(c.value));
                if (!title)          { Swal.showValidationMessage('El título es obligatorio'); return false; }
                if (!userIds.length) { Swal.showValidationMessage('Selecciona al menos un estudiante'); return false; }
                return { title, description, userIds };
            }
        });

        if (!fv) return;
        try {
            Swal.showLoading();
            await crearTareaMultiple(fv.title, fv.description, fv.userIds);
            // ✅ FIX DOM: recargamos datos y re-renderizamos TODA la vista de gestión
            // para que el sidebar de estudiantes actualice los conteos de tareas
            await this._reload();
            this._viewGestionTareas(); // re-render completo con datos frescos
            showSuccessToast('¡Tarea asignada exitosamente!');
        } catch { showErrorToast('Error al asignar la tarea.'); }
    }

    // ✅ Recarga datos Y actualiza el sidebar de conteos sin recargar la página
    async _reloadAndRefresh() {
        await this._reload();
        // Actualizamos el sidebar de estudiantes en el DOM (conteos de tareas)
        const listEl = document.getElementById('studentsList');
        if (listEl) listEl.innerHTML = this._buildStudentsList();
        // Re-aplicamos el estilo activo al estudiante seleccionado
        if (this.currentStudentId) {
            const activeItem = document.querySelector(`.student-item[data-id="${this.currentStudentId}"]`);
            if (activeItem) {
                activeItem.style.background = 'var(--brand-faded)';
                activeItem.style.borderLeft = '3px solid var(--brand-primary)';
            }
        }
        // Refrescamos el panel de tareas
        this._renderTasks();
    }

    async _reload() {
        const [u, t] = await Promise.all([fetchTodosLosUsuarios(), fetchTodasLasTareas()]);
        this.students = u.filter(u => u.role === 'user' && u.status === 'activo');
        this.tasks    = t;
    }

    _styles() {
        return `<style>
            .stat-card{background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:18px;}
            .stat-num{font-size:1.9rem;font-weight:800;color:var(--text-main);}
            .stat-lbl{font-size:0.75rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-top:4px;}
        </style>`;
    }
}