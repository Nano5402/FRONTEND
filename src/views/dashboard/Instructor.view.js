/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  views/dashboard/Instructor.view.js — DASHBOARD DEL INSTRUCTOR       ║
 * ║                                                                      ║
 * ║  QUIÉN LO VE: Usuarios con permiso TASKS_CREATE_MULTIPLE             ║
 * ║                                                                      ║
 * ║  CAMBIOS EN ESTA VERSIÓN:                                            ║
 * ║                                                                      ║
 * ║  1. mount(initialView) — igual que AdminView, ahora acepta la        ║
 * ║     vista inicial para que el router pueda abrir directamente        ║
 * ║     la sección correcta sin pasar por 'dashboard' primero.           ║
 * ║     También tiene manejo de error con try/catch para que un          ║
 * ║     fallo de red no rompa toda la app.                               ║
 * ║                                                                      ║
 * ║  2. MAPEO SIDEBAR → VISTA:                                           ║
 * ║     El botón "Gestión de Usuarios" del sidebar (ruta /users)         ║
 * ║     abre la vista de GESTIÓN DE TAREAS para el instructor.           ║
 * ║     El instructor no gestiona usuarios — gestiona tareas.            ║
 * ║     Por eso navigateTo('users') → _viewTasks().                      ║
 * ║                                                                      ║
 * ║  ESTRUCTURA INTERNA — 2 vistas:                                      ║
 * ║    "Mi Panel"           → resumen estadístico + tabla por estudiante ║
 * ║    "Gestión de Usuarios"→ gestión de tareas (asignar, calificar)     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import Swal from 'sweetalert2';
import { renderSidebar }  from '../../components/Sidebar.js';
import { toast }          from '../../components/Toast.js';
import { storage }        from '../../utils/storage.js';
import * as tasksService  from '../../services/tasks.service.js';

export class InstructorView {
    constructor(rootId) {
        this.rootId           = rootId;
        this.instructorName   = storage.getUserName() || 'Instructor';
        this.students         = []; // solo estudiantes activos
        this.tasks            = []; // todas las tareas del sistema
        this.currentStudentId = null; // estudiante seleccionado en el panel izquierdo
        this.currentFilter    = 'todos'; // filtro activo en la lista de tareas
    }

    /**
     * mount(initialView?)
     * Punto de entrada — llamado por main.js.
     *
     * CAMBIO: Ahora acepta la vista inicial y tiene manejo de error.
     * Si _load() falla (error de red, 403, etc.), muestra un toast
     * pero no interrumpe el flujo — la vista carga vacía.
     *
     * @param {string} initialView - 'dashboard' | 'users'
     *
     * NOTA: 'users' en el contexto del instructor abre Gestión de Tareas,
     * NO una pantalla de usuarios (eso solo lo ve el SuperAdmin).
     */
    async mount(initialView = 'dashboard') {
        try {
            await this._load();
        } catch (error) {
            console.error('Error cargando datos del instructor:', error);
            toast.error('Error al cargar la información docente');
        }

        // Calculamos la ruta activa para el sidebar
        const activeRoute = initialView === 'dashboard' ? '/dashboard' : `/${initialView}`;

        const { html, bindEvents } = renderSidebar(activeRoute, vista => this.navigateTo(vista));
        document.getElementById(this.rootId).innerHTML = html;
        bindEvents(document);

        // Cargamos directamente la sección solicitada
        this.navigateTo(initialView);
    }

    /**
     * navigateTo(vista)
     * 'dashboard' → Mi Panel (estadísticas)
     * 'users'     → Gestión de Tareas (el botón "Gestión de Usuarios" del sidebar)
     *
     * IMPORTANTE: 'roles' no existe para el instructor — no hace nada si llega.
     */
    navigateTo(vista) {
        if (vista === 'dashboard') this._viewPanel();
        if (vista === 'users')     this._viewTasks(); // ← botón "Gestión de Usuarios" → tareas
    }

    _content() { return document.getElementById('main-content-area'); }

    // =========================================================================
    // VISTA 1: MI PANEL — resumen estadístico del grupo
    // =========================================================================
    _viewPanel() {
        const t = this.tasks;
        const s = fn => t.filter(fn).length; // helper de conteo

        this._content().innerHTML = `
        <div style="animation:slideUpFade 0.4s var(--ease-smooth);">
            <div style="margin-bottom:22px;">
                <h2 style="color:var(--text-main);margin:0 0 4px;">Gestión Docente</h2>
                <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">
                    Bienvenido, <b>${this.instructorName}</b>.
                </p>
            </div>

            <div class="stats-grid">
                ${this._stat(this.students.length,                'Estudiantes',  'var(--brand-primary)')}
                ${this._stat(t.length,                            'Tareas Total', null)}
                ${this._stat(s(x => x.status==='pendiente'),      'Pendientes',   'var(--danger)')}
                ${this._stat(s(x => x.status==='en progreso'),    'En Progreso',  'var(--info)')}
                ${this._stat(s(x => x.status==='completada'),     'Completadas',  'var(--success)')}
                ${this._stat(s(x => x.status==='incompleta'),     'Rechazadas',   'var(--warning)')}
            </div>

            <div class="card" style="padding:0;overflow:hidden;">
                <div style="padding:15px 20px;border-bottom:1px solid var(--border-subtle);">
                    <h3 style="margin:0;font-size:1rem;color:var(--text-main);">Resumen por Estudiante</h3>
                </div>
                <div class="table-responsive">
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
                            ? `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px;">
                                No hay estudiantes activos.
                               </td></tr>`
                            : this.students.map(st => {
                                // Filtramos las tareas de ESTE estudiante del array global
                                const stTasks = t.filter(x => String(x.userId) === String(st.id));
                                return `<tr>
                                    <td style="font-weight:600;">${st.name}</td>
                                    <td style="text-align:center;">${stTasks.length}</td>
                                    <td style="text-align:center;color:var(--danger);">
                                        ${stTasks.filter(x => x.status==='pendiente').length}
                                    </td>
                                    <td style="text-align:center;color:var(--info);">
                                        ${stTasks.filter(x => x.status==='en progreso').length}
                                    </td>
                                    <td style="text-align:center;color:var(--success);">
                                        ${stTasks.filter(x => x.status==='completada').length}
                                    </td>
                                    <td style="text-align:center;color:var(--warning);">
                                        ${stTasks.filter(x => x.status==='incompleta').length}
                                    </td>
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
            <div class="stat-num" ${color ? `style="color:${color};"` : ''}>${val}</div>
            <div class="stat-lbl">${lbl}</div>
        </div>`;
    }

    // =========================================================================
    // VISTA 2: GESTIÓN DE TAREAS
    // Panel dividido: lista de estudiantes (izquierda) + tareas (derecha)
    // =========================================================================
    _viewTasks() {
        this._content().innerHTML = `
        <div style="animation:slideUpFade 0.4s var(--ease-smooth);">
            <div class="task-header">
                <div>
                    <h2 style="color:var(--text-main);margin:0 0 4px;">Gestión de Tareas</h2>
                    <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">
                        Asigna, edita y califica las tareas de tus estudiantes.
                    </p>
                </div>
                <button id="btnAssign" class="btn btn--primary">
                    <i class="ph ph-plus-circle"></i> Asignar Tarea
                </button>
            </div>

            <div class="tasks-layout">

                <aside class="card student-sidebar">
                    <h3 style="padding:13px 18px;margin:0;border-bottom:1px solid var(--border-subtle);
                        font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">
                        👥 Estudiantes (${this.students.length})
                    </h3>
                    <div id="studentsList" class="student-sidebar-list">
                        ${this._buildStudentList()}
                    </div>
                </aside>

                <main class="card" style="padding:0;overflow:hidden;">
                    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;
                        padding:15px 20px;border-bottom:1px solid var(--border-subtle);">
                        <h3 id="panelTitle" style="margin:0;font-size:1rem;color:var(--text-main);">
                            ${this._panelTitle()}
                        </h3>
                        <select id="taskFilter" class="form__input"
                            style="padding:6px 12px;font-size:0.85rem;width:auto;
                            ${this.currentStudentId ? '' : 'display:none;'}">
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
                            : ''
                        }
                    </div>
                </main>
            </div>
        </div>${this._styles()}`;

        // Si había un estudiante activo antes de cambiar de vista, restauramos su panel
        if (this.currentStudentId) this._renderTaskList();

        this._bindTaskViewEvents();
    }

    /**
     * _buildStudentList()
     * Genera el HTML de los ítems de la lista de estudiantes.
     * Se reutiliza en _reloadRefresh() para actualizar los conteos sin
     * re-renderizar toda la vista.
     */
    _buildStudentList() {
        if (!this.students.length) {
            return `<div style="padding:20px;text-align:center;color:var(--text-muted);">
                No hay estudiantes activos.
            </div>`;
        }
        return this.students.map(st => {
            const count  = this.tasks.filter(t => String(t.userId) === String(st.id)).length;
            const active = String(this.currentStudentId) === String(st.id);
            return `<div class="student-item" data-id="${st.id}" data-name="${st.name}"
                style="display:flex;align-items:center;gap:11px;padding:12px 18px;
                border-bottom:1px solid var(--border-subtle);cursor:pointer;transition:background 0.15s;
                ${active ? 'background:var(--brand-faded);border-left:3px solid var(--brand-primary);' : ''}">
                <div style="width:32px;height:32px;border-radius:7px;background:var(--bg-app);
                    border:1px solid var(--border-subtle);display:flex;align-items:center;
                    justify-content:center;font-weight:700;color:var(--brand-primary);flex-shrink:0;">
                    ${st.name.charAt(0)}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:0.87rem;color:var(--text-main);
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${st.name}
                    </div>
                    <div style="font-size:0.74rem;color:var(--text-muted);">
                        ${count} tarea${count !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    _panelTitle() {
        if (!this.currentStudentId) return 'Selecciona un estudiante';
        const s = this.students.find(x => String(x.id) === String(this.currentStudentId));
        return s ? `Tareas de ${s.name}` : 'Selecciona un estudiante';
    }

    _bindTaskViewEvents() {
        // Clic en un estudiante → mostrar sus tareas en el panel derecho
        document.querySelectorAll('.student-item').forEach(item => {
            item.addEventListener('click', e => {
                document.querySelectorAll('.student-item').forEach(el => {
                    el.style.background = ''; el.style.borderLeft = '';
                });
                const t = e.currentTarget;
                t.style.background = 'var(--brand-faded)';
                t.style.borderLeft = '3px solid var(--brand-primary)';
                this.currentStudentId = t.getAttribute('data-id');
                document.getElementById('panelTitle').textContent =
                    `Tareas de ${t.getAttribute('data-name')}`;
                document.getElementById('taskFilter').style.display = 'block';
                this._renderTaskList();
                
                // 🔥 MOBILE UX: Desplaza suavemente hacia abajo para ver las tareas al seleccionar un estudiante
                if (window.innerWidth < 992) {
                    document.getElementById('panelTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Cambio en el filtro → re-filtramos sin llamar al backend
        document.getElementById('taskFilter').addEventListener('change', e => {
            this.currentFilter = e.target.value;
            this._renderTaskList();
        });

        document.getElementById('btnAssign').addEventListener('click', () => this._modalAssign());
    }

    /**
     * _renderTaskList()
     * Renderiza las tarjetas de tareas del estudiante seleccionado.
     * Filtra por this.currentFilter y aplica los estilos de badge.
     */
    _renderTaskList() {
        const container = document.getElementById('tasksContainer');
        if (!this.currentStudentId || !container) return;

        let list = this.tasks.filter(t => String(t.userId) === String(this.currentStudentId));
        if (this.currentFilter !== 'todos') {
            list = list.filter(t => t.status === this.currentFilter);
        }

        if (!list.length) {
            container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:30px;">
                No hay tareas con este filtro.
            </div>`;
            return;
        }

        const badge = s => {
            if (s === 'pendiente')   return 'background:var(--danger-bg);color:var(--danger);';
            if (s === 'en progreso') return 'background:var(--info-bg);color:var(--info);';
            if (s === 'completada')  return 'background:var(--success-bg);color:var(--success);';
            return 'background:rgba(245,158,11,.1);color:var(--warning);'; // incompleta
        };

        container.innerHTML = list.map(task => {
            const done = task.status === 'completada';
            return `
            <div style="padding:16px;border:1px solid var(--border-subtle);
                border-radius:var(--radius-sm);margin-bottom:12px;background:var(--bg-app);">
                <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:7px;">
                    <h4 style="margin:0;font-size:0.97rem;color:var(--text-main);">${task.title}</h4>
                    <span style="padding:3px 9px;border-radius:6px;font-size:0.7rem;font-weight:700;
                        text-transform:uppercase;white-space:nowrap;${badge(task.status)}">
                        ${task.status}
                    </span>
                </div>
                <p style="color:var(--text-muted);font-size:0.87rem;margin:0 0 12px;white-space:pre-wrap;">
                    ${task.description || 'Sin descripción'}
                </p>
                <div style="display:flex;gap:7px;flex-wrap:wrap;
                    border-top:1px solid var(--border-subtle);padding-top:12px;">
                    <button class="btn-action ${done ? 'btn-action--primary btn-reopen' : 'btn-action--success btn-approve'}"
                        data-id="${task.id}" data-done="${done}">
                        ${done
                            ? '<i class="ph ph-arrow-counter-clockwise"></i> Reabrir'
                            : '<i class="ph ph-check-circle"></i> Aprobar'}
                    </button>
                    <button class="btn-action btn-action--danger btn-reject"
                        data-id="${task.id}"
                        data-desc="${(task.description || '').replace(/"/g, '&quot;')}"
                        ${task.status === 'incompleta' ? 'style="opacity:.4;pointer-events:none;"' : ''}>
                        <i class="ph ph-x-circle"></i> Rechazar
                    </button>
                    <div style="flex:1;min-width:0;"></div>
                    <button class="btn-action btn-action--primary btn-edit-task"
                        data-id="${task.id}"
                        data-title="${task.title.replace(/"/g, '&quot;')}"
                        data-desc="${(task.description || '').replace(/"/g, '&quot;')}">
                        <i class="ph ph-pencil-simple"></i> Editar
                    </button>
                    <button class="btn-action btn-action--danger btn-del-task" data-id="${task.id}">
                        <i class="ph ph-trash"></i> Eliminar
                    </button>
                </div>
            </div>`;
        }).join('');

        this._bindTaskItemEvents();
    }

    _bindTaskItemEvents() {
        // ── APROBAR / REABRIR (toggle según data-done) ────────────────────────
        document.querySelectorAll('.btn-approve, .btn-reopen').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id   = e.currentTarget.getAttribute('data-id');
                const done = e.currentTarget.getAttribute('data-done') === 'true';
                // done=true → estaba aprobada → reabrir a 'en progreso'
                // done=false → no aprobada → aprobar como 'completada'
                try {
                    await tasksService.updateTask(id, { status: done ? 'en progreso' : 'completada' });
                    toast.success(done ? 'Tarea reabierta' : 'Tarea aprobada');
                    await this._reloadRefresh();
                } catch { toast.error('Error al actualizar la tarea'); }
            });
        });

        // ── RECHAZAR ──────────────────────────────────────────────────────────
        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id      = e.currentTarget.getAttribute('data-id');
                const oldDesc = e.currentTarget.getAttribute('data-desc');
                const { value: reason } = await Swal.fire({
                    title: 'Rechazar Tarea',
                    input: 'textarea',
                    inputLabel: 'Justificación para el estudiante:',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Rechazar',
                    inputValidator: v => (!v || v.trim().length < 5) && 'Justificación obligatoria',
                });
                if (!reason) return;
                try {
                    // Agregamos la nota del instructor al final de la descripción
                    await tasksService.updateTask(id, {
                        status:      'incompleta',
                        description: `${oldDesc}\n\n⚠️ REVISIÓN DEL INSTRUCTOR:\n${reason}`,
                    });
                    toast.success('Tarea rechazada');
                    await this._reloadRefresh();
                } catch { toast.error('Error al rechazar'); }
            });
        });

        // ── EDITAR ────────────────────────────────────────────────────────────
        document.querySelectorAll('.btn-edit-task').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id = e.currentTarget.getAttribute('data-id');
                const tt = e.currentTarget.getAttribute('data-title');
                const td = e.currentTarget.getAttribute('data-desc');
                const { value: fv } = await Swal.fire({
                    title: 'Editar Tarea',
                    html: `<input id="et" class="form__input" value="${tt}"
                               style="margin-bottom:10px;width:100%;">
                           <textarea id="ed" class="form__input" rows="4"
                               style="width:100%;resize:none;">${td}</textarea>`,
                    showCancelButton: true,
                    confirmButtonColor: 'var(--brand-primary)',
                    preConfirm: () => ({
                        title:       document.getElementById('et').value.trim(),
                        description: document.getElementById('ed').value.trim(),
                    }),
                });
                if (!fv) return;
                try {
                    await tasksService.updateTask(id, fv);
                    toast.success('Tarea actualizada');
                    await this._reloadRefresh();
                } catch { toast.error('Error al editar'); }
            });
        });

        // ── ELIMINAR ──────────────────────────────────────────────────────────
        document.querySelectorAll('.btn-del-task').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id = e.currentTarget.getAttribute('data-id');
                const ok = await Swal.fire({
                    title: '¿Eliminar esta tarea?',
                    icon:  'warning',
                    showCancelButton:   true,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText:  'Sí, eliminar',
                });
                if (!ok.isConfirmed) return;
                try {
                    await tasksService.deleteTask(id);
                    toast.success('Tarea eliminada');
                    await this._reloadRefresh();
                } catch { toast.error('Error al eliminar'); }
            });
        });
    }

    /**
     * _modalAssign()
     * Modal de asignación masiva: permite crear una tarea
     * y asignarla a uno o varios estudiantes a la vez.
     */
    async _modalAssign() {
        if (!this.students.length) return toast.error('No hay estudiantes activos.');

        const cbs = this.students.map(s => `
            <label style="display:flex;align-items:center;gap:9px;padding:9px 12px;
                background:var(--bg-app);border:1px solid var(--border-subtle);
                border-radius:6px;cursor:pointer;">
                <input type="checkbox" name="swal-cb" value="${s.id}"
                    style="width:15px;height:15px;accent-color:var(--brand-primary);">
                <span style="color:var(--text-main);font-size:0.87rem;">${s.name}</span>
            </label>`).join('');

        const { value: fv } = await Swal.fire({
            title: 'Asignar Nueva Tarea',
            width: '560px',
            html: `<div style="text-align:left;">
                <input id="st" class="form__input" placeholder="Título de la tarea"
                    style="margin-bottom:10px;width:100%;">
                <textarea id="sd" class="form__input" placeholder="Instrucciones detalladas..."
                    rows="3" style="margin-bottom:15px;width:100%;resize:none;"></textarea>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="color:var(--text-main);font-weight:600;font-size:0.88rem;">Asignar a:</span>
                    <button type="button" id="btn-all"
                        style="background:none;border:none;color:var(--brand-primary);
                        cursor:pointer;font-size:0.83rem;font-weight:600;">
                        Marcar Todos
                    </button>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;
                    max-height:190px;overflow-y:auto;">${cbs}</div>
            </div>`,
            showCancelButton:   true,
            confirmButtonText:  'Asignar',
            confirmButtonColor: 'var(--brand-primary)',
            didOpen: () => {
                let all = false;
                Swal.getPopup().querySelector('#btn-all').addEventListener('click', () => {
                    all = !all;
                    Swal.getPopup().querySelectorAll('input[name="swal-cb"]')
                        .forEach(c => c.checked = all);
                    Swal.getPopup().querySelector('#btn-all').textContent =
                        all ? 'Desmarcar Todos' : 'Marcar Todos';
                });
            },
            preConfirm: () => {
                const title   = document.getElementById('st').value.trim();
                const desc    = document.getElementById('sd').value.trim();
                const userIds = Array.from(
                    document.querySelectorAll('input[name="swal-cb"]:checked')
                ).map(c => Number(c.value));
                if (!title)          { Swal.showValidationMessage('El título es obligatorio'); return false; }
                if (!userIds.length) { Swal.showValidationMessage('Selecciona al menos un estudiante'); return false; }
                return { title, desc, userIds };
            },
        });

        if (!fv) return;
        try {
            Swal.showLoading();
            await tasksService.createTask(fv.title, fv.desc, fv.userIds);
            // Re-renderizamos toda la vista para actualizar los conteos del sidebar
            await this._load();
            this._viewTasks();
            toast.success('¡Tarea asignada exitosamente!');
        } catch { toast.error('Error al asignar la tarea.'); }
    }

    /**
     * _reloadRefresh()
     * Recarga datos y actualiza el DOM de forma eficiente:
     * - Recarga this.students y this.tasks del backend
     * - Actualiza SOLO el sidebar de estudiantes (conteos)
     * - Actualiza SOLO el panel de tareas
     * → El sidebar principal (AppLayout) NO se re-renderiza
     */
    async _reloadRefresh() {
        await this._load();

        // Actualizamos el sidebar de estudiantes con los nuevos conteos
        const listEl = document.getElementById('studentsList');
        if (listEl) listEl.innerHTML = this._buildStudentList();

        // Restauramos el resaltado del estudiante activo
        if (this.currentStudentId) {
            const active = document.querySelector(
                `.student-item[data-id="${this.currentStudentId}"]`
            );
            if (active) {
                active.style.background = 'var(--brand-faded)';
                active.style.borderLeft = '3px solid var(--brand-primary)';
            }
        }

        // Actualizamos las tarjetas de tareas
        this._renderTaskList();
    }

    /**
     * _load()
     * Carga en paralelo estudiantes activos y todas las tareas.
     * getInstructorData() filtra automáticamente role='user' y status='activo'.
     */
    async _load() {
        const data = await tasksService.getInstructorData();
        this.students = data.students;
        this.tasks    = data.tasks;
    }

    _styles() {
        return `<style>
            .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:24px;}
            .stat-card{background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:18px;}
            .stat-num{font-size:1.9rem;font-weight:800;color:var(--text-main);}
            .stat-lbl{font-size:0.75rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-top:4px;}

            /* 🔥 FIX MOBILE: Estilos responsivos para Gestión de Tareas */
            .tasks-layout {
                display: grid;
                grid-template-columns: 1fr; /* Móvil: una sola columna apilada */
                gap: 20px;
                align-items: start;
            }
            .student-sidebar {
                padding: 0;
                overflow: hidden;
            }
            .student-sidebar-list {
                max-height: 220px; /* En móvil, la lista es más corta para ver las tareas abajo */
                overflow-y: auto;
            }
            .task-header {
                display: flex;
                flex-direction: column; /* Apila título y botón en móvil */
                gap: 12px;
                margin-bottom: 20px;
            }

            /* Tablet grande y PC */
            @media (min-width: 992px) {
                .tasks-layout {
                    grid-template-columns: 280px 1fr; /* Vuelve a las dos columnas de siempre */
                }
                .student-sidebar {
                    position: sticky;
                    top: 20px;
                }
                .student-sidebar-list {
                    max-height: calc(100vh - 310px);
                }
                .task-header {
                    flex-direction: row; /* Uno a cada lado en PC */
                    justify-content: space-between;
                    align-items: center;
                }
            }
        </style>`;
    }
}