/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  views/dashboard/Student.view.js — DASHBOARD DEL ESTUDIANTE          ║
 * ║                                                                      ║
 * ║  QUIÉN LO VE: Usuarios con permiso TASKS_READ_OWN (Estudiantes)      ║
 * ║                                                                      ║
 * ║  CAMBIOS EN ESTA VERSIÓN:                                            ║
 * ║                                                                      ║
 * ║  _load() ahora usa getTasksByUser(userId) que llama directamente     ║
 * ║  a GET /users/:id/tasks en lugar de GET /tasks + filtrar.            ║
 * ║  Esto es más seguro porque el estudiante solo recibe SUS tareas      ║
 * ║  y no necesita el permiso TASKS_READ_ALL.                            ║
 * ║                                                                      ║
 * ║  El resto de la vista no cambió respecto a la versión anterior.      ║
 * ║                                                                      ║
 * ║  EL ESTUDIANTE SOLO PUEDE:                                           ║
 * ║    ✅ Ver sus propias tareas                                          ║
 * ║    ✅ Filtrar y ordenar                                               ║
 * ║    ✅ Iniciar una tarea (pendiente → en progreso)                    ║
 * ║    ✅ Exportar sus tareas en JSON                                     ║
 * ║                                                                      ║
 * ║  EL ESTUDIANTE NO PUEDE:                                             ║
 * ║    ❌ Ver tareas de otros estudiantes                                 ║
 * ║    ❌ Editar, eliminar, aprobar ni rechazar                           ║
 * ║    ❌ Ver la lista de usuarios                                        ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { renderSidebar } from '../../components/Sidebar.js';
import { toast }         from '../../components/Toast.js';
import { storage }       from '../../utils/storage.js';
import { getDecoded }    from '../../utils/rbac.js';
import * as tasksService from '../../services/tasks.service.js';

export class StudentView {
    constructor(rootId) {
        this.rootId        = rootId;
        this.user          = getDecoded();          // payload del JWT: { id, role, permissions }
        this.userName      = storage.getUserName() || 'Estudiante';
        this.tasks         = [];          // SOLO las tareas del estudiante logueado
        this.currentFilter = 'todos';    // filtro activo por estado
        this.currentSort   = 'fecha_desc'; // criterio de ordenamiento activo
    }

    /**
     * mount()
     * Punto de entrada — llamado por main.js.
     *
     * El estudiante no tiene sub-vistas ni parámetro initialView
     * porque solo tiene una pantalla disponible.
     *
     * SECUENCIA:
     * 1. Carga las tareas del estudiante desde el backend
     * 2. Renderiza el sidebar (sin onNavigate, solo "Mi Panel")
     * 3. Muestra la única vista
     */
    async mount() {
        await this._load();

        // Sin onNavigate → el sidebar no tiene navegación interna
        const { html, bindEvents } = renderSidebar('/dashboard');
        document.getElementById(this.rootId).innerHTML = html;
        bindEvents(document);

        this._viewTasks();
    }

    /**
     * navigateTo()
     * Implementamos el método para cumplir la interfaz que espera AppLayout.
     * El estudiante solo tiene una vista, así que siempre recarga la misma.
     */
    navigateTo() { this._viewTasks(); }

    _content() { return document.getElementById('main-content-area'); }

    /**
     * _viewTasks()
     * Vista única del estudiante:
     * - Encabezado con saludo y botón exportar
     * - Controles de filtro y ordenamiento
     * - Tabla de tareas
     */
    _viewTasks() {
        this._content().innerHTML = `
        <div style="animation:slideUpFade 0.4s var(--ease-smooth);">

            <!-- Encabezado con saludo y exportar -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;">
                <div>
                    <h2 style="color:var(--text-main);margin:0 0 4px;">Mis Tareas</h2>
                    <p style="color:var(--text-muted);font-size:0.9rem;margin:0;">
                        Bienvenido, <b>${this.userName}</b>
                    </p>
                </div>
                <!-- Descarga un JSON con todas las tareas del estudiante -->
                <button id="btnExport" class="btn btn--outline"
                    style="border-color:var(--brand-primary);color:var(--brand-primary);">
                    <i class="ph ph-download-simple"></i> Exportar JSON
                </button>
            </div>

            <!-- Controles de filtro y ordenamiento -->
            <div class="card" style="margin-bottom:20px;display:flex;gap:15px;flex-wrap:wrap;background:var(--bg-surface);">
                <!-- FILTRO POR ESTADO -->
                <div style="flex:1;min-width:200px;">
                    <label style="color:var(--text-muted);font-size:0.85rem;display:block;
                        margin-bottom:5px;font-weight:600;text-transform:uppercase;">
                        Filtrar por Estado
                    </label>
                    <select id="filterStatus" class="form__input" style="padding:10px;cursor:pointer;">
                        <option value="todos">Todas las tareas</option>
                        <option value="pendiente">⏳ Pendientes</option>
                        <option value="en progreso">🚀 En Progreso</option>
                        <option value="completada">✅ Completadas</option>
                        <option value="incompleta">⚠️ Rechazadas</option>
                    </select>
                </div>
                <!-- ORDENAMIENTO -->
                <div style="flex:1;min-width:200px;">
                    <label style="color:var(--text-muted);font-size:0.85rem;display:block;
                        margin-bottom:5px;font-weight:600;text-transform:uppercase;">
                        Ordenar por
                    </label>
                    <select id="sortTasks" class="form__input" style="padding:10px;cursor:pointer;">
                        <option value="fecha_desc">Más recientes primero</option>
                        <option value="fecha_asc">Más antiguas primero</option>
                        <option value="az">Alfabético (A-Z)</option>
                        <option value="za">Alfabético (Z-A)</option>
                    </select>
                </div>
            </div>

            <!-- Tabla de tareas -->
            <div style="overflow-x:auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Descripción</th>
                            <th>Estado</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody id="tasksBody">
                        <tr>
                            <td colspan="4" style="text-align:center;padding:30px;color:var(--brand-primary);">
                                Cargando tareas...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>`;

        // Renderizamos las filas y conectamos los eventos
        this._renderTable();
        this._bindEvents();
    }

    /**
     * _renderTable()
     * Genera las filas de la tabla aplicando filtro y ordenamiento actuales.
     * NO hace petición al backend — trabaja con this.tasks en memoria.
     * Se llama cada vez que el usuario cambia el filtro o el orden.
     */
    _renderTable() {
        const tbody = document.getElementById('tasksBody');
        if (!tbody) return;

        // PASO 1: Filtrar por estado usando el service (lógica centralizada)
        let list = tasksService.filterByStatus(this.tasks, this.currentFilter);

        // PASO 2: Ordenar según el criterio activo
        list = tasksService.sortTasks(list, this.currentSort);

        if (!list.length) {
            tbody.innerHTML = `<tr>
                <td colspan="4" style="text-align:center;color:var(--text-muted);padding:30px;">
                    ${this.currentFilter === 'todos'
                        ? 'No tienes tareas asignadas aún.'
                        : `No tienes tareas con estado "${this.currentFilter}".`}
                </td>
            </tr>`;
            return;
        }

        // Estilos de badge según el estado de la tarea
        const badge = s => {
            if (s === 'pendiente')   return 'background:var(--danger-bg);color:var(--danger);';
            if (s === 'en progreso') return 'background:var(--info-bg);color:var(--info);';
            if (s === 'completada')  return 'background:var(--success-bg);color:var(--success);';
            return 'background:rgba(245,158,11,.1);color:var(--warning);'; // incompleta/rechazada
        };

        tbody.innerHTML = list.map(task => `
        <tr>
            <td style="font-weight:600;">${task.title}</td>
            <td style="color:var(--text-muted);font-size:0.9rem;white-space:pre-wrap;">
                ${task.description || 'Sin descripción'}
            </td>
            <td>
                <span style="padding:4px 10px;border-radius:6px;font-size:0.75rem;
                    font-weight:700;text-transform:uppercase;${badge(task.status)}">
                    ${task.status}
                </span>
            </td>
            <td>
                ${task.status === 'pendiente'
                    ? `<!-- Solo tareas PENDIENTES tienen el botón de iniciar -->
                       <button class="btn-action btn-action--primary btn-start" data-id="${task.id}">
                           🚀 Iniciar Tarea
                       </button>`
                    : `<!-- Para otros estados, ícono informativo según el estado -->
                       <span style="color:var(--text-muted);font-size:0.85rem;">
                           ${task.status === 'completada'  ? '✅ Completada'          : ''}
                           ${task.status === 'en progreso' ? '🔄 En curso'             : ''}
                           ${task.status === 'incompleta'  ? '⚠️ Revisar descripción' : ''}
                       </span>`
                }
            </td>
        </tr>`).join('');

        // Conectamos el botón "Iniciar Tarea" de cada fila
        document.querySelectorAll('.btn-start').forEach(btn => {
            btn.addEventListener('click', async e => {
                const id = e.currentTarget.getAttribute('data-id');
                try {
                    // Cambia el estado de 'pendiente' a 'en progreso'
                    await tasksService.updateTask(id, { status: 'en progreso' });
                    toast.success('¡Tarea iniciada! Mucho éxito.');
                    // Recargamos del backend y actualizamos la tabla
                    await this._load();
                    this._renderTable();
                } catch {
                    toast.error('Error al iniciar la tarea. Intenta de nuevo.');
                }
            });
        });
    }

    /**
     * _bindEvents()
     * Conecta los eventos de filtro, ordenamiento y exportar.
     * Se llama una sola vez después de renderizar _viewTasks().
     */
    _bindEvents() {
        // Cambio de filtro → re-filtra en memoria, sin llamar al backend
        document.getElementById('filterStatus').addEventListener('change', e => {
            this.currentFilter = e.target.value;
            this._renderTable();
        });

        // Cambio de ordenamiento → re-ordena en memoria
        document.getElementById('sortTasks').addEventListener('change', e => {
            this.currentSort = e.target.value;
            this._renderTable();
        });

        // Exportar JSON → genera y descarga el archivo con las tareas del estudiante
        document.getElementById('btnExport').addEventListener('click', () => {
            if (!this.tasks.length) return toast.info('No hay tareas para exportar.');

            // prepareExport añade metadatos: fecha, usuario, total, array de tareas
            const data = tasksService.prepareExport(this.tasks, {
                name: this.userName,
                role: this.user?.role || 'user',
            });

            // Creamos el archivo en memoria y simulamos el clic para descargar
            const blob = new Blob([data], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `mis-tareas-${this.user?.id || 'sena'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // liberamos la URL temporal de memoria
            toast.success('¡JSON exportado con éxito!');
        });
    }

    /**
     * _load()
     * Carga SOLO las tareas del estudiante logueado.
     *
     * CAMBIO: ahora usa GET /users/:id/tasks directamente.
     * Antes traía todas las tareas y filtraba en el frontend,
     * lo que requería TASKS_READ_ALL (permiso que el estudiante no tiene).
     *
     * getTasksByUser() en tasks.api.js hace:
     *   senaFetch(`${API_URL}/users/${userId}/tasks`)
     * El backend responde solo con las tareas de ese usuario.
     */
    async _load() {
        if (!this.user?.id) return; // si no hay ID de usuario, no hacemos la petición
        this.tasks = await tasksService.getTasksByUser(this.user.id);
    }
}