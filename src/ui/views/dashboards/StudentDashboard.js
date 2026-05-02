import { fetchTareasPorUsuario, actualizarTarea } from '../../../api/index.js';
import { getDecodedToken } from '../../../utils/rbac.js';
// ✅ FIX: faltaba showInfoToast en los imports
import { showSuccessToast, showErrorToast, showInfoToast } from '../../components/notificaciones.js';
import { descargarJSON } from '../../exportUI.js';

export class StudentDashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tasks = [];
        this.currentFilter = 'todos';
        this.currentSort = 'fecha_desc';
        this.user = getDecodedToken();
    }

    async render() {
        this.container.innerHTML = `
            <div style="animation: slideUpFade 0.4s var(--ease-smooth);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div>
                        <h2 style="color: var(--text-main);">Mis Tareas</h2>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Bienvenido, ${this.user.name}</p>
                    </div>
                    <button id="btnDownloadJSON" class="btn btn--outline" style="border-color: var(--brand-primary); color: var(--brand-primary);">
                        <i class="ph ph-download-simple"></i> ⬇ Exportar JSON
                    </button>
                </div>

                <div class="card" style="margin-bottom: 20px; display: flex; gap: 15px; flex-wrap: wrap; background: var(--bg-surface);">
                    <div style="flex: 1; min-width: 200px;">
                        <label style="color: var(--text-muted); font-size: 0.85rem; display: block; margin-bottom: 5px; font-weight: 600; text-transform: uppercase;">Filtrar por Estado</label>
                        <select id="filterStatus" class="form__input" style="padding: 10px; cursor: pointer;">
                            <option value="todos">Todas las tareas</option>
                            <option value="pendiente">⏳ Pendientes</option>
                            <option value="en progreso">🚀 En Progreso</option>
                            <option value="completada">✅ Completadas</option>
                        </select>
                    </div>
                    <div style="flex: 1; min-width: 200px;">
                        <label style="color: var(--text-muted); font-size: 0.85rem; display: block; margin-bottom: 5px; font-weight: 600; text-transform: uppercase;">Ordenar por</label>
                        <select id="sortTasks" class="form__input" style="padding: 10px; cursor: pointer;">
                            <option value="fecha_desc">Más recientes primero</option>
                            <option value="fecha_asc">Más antiguas primero</option>
                            <option value="az">Alfabético (A-Z)</option>
                            <option value="za">Alfabético (Z-A)</option>
                        </select>
                    </div>
                </div>

                <div style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody id="tasksTableBody">
                            <tr><td colspan="4" style="text-align: center; padding: 30px; color: var(--brand-primary);">Cargando tus tareas...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.attachEvents();
        await this.loadTasksFromDB();
    }

    async loadTasksFromDB() {
        if (!this.user || !this.user.id) return;
        try {
            this.tasks = await fetchTareasPorUsuario(this.user.id);
            this.renderTable();
        } catch (error) {
            console.error(error);
            document.getElementById('tasksTableBody').innerHTML = `
                <tr><td colspan="4" style="text-align: center; padding: 30px; color: var(--danger);">Error cargando tareas.</td></tr>
            `;
            showErrorToast('No se pudieron cargar tus tareas.');
        }
    }

    renderTable() {
        const tbody = document.getElementById('tasksTableBody');

        let filteredTasks = this.tasks.filter(t =>
            this.currentFilter === 'todos' ? true : t.status.toLowerCase() === this.currentFilter
        );

        filteredTasks.sort((a, b) => {
            if (this.currentSort === 'az') return a.title.localeCompare(b.title);
            if (this.currentSort === 'za') return b.title.localeCompare(a.title);
            if (this.currentSort === 'fecha_asc') return a.id - b.id;
            return b.id - a.id;
        });

        if (filteredTasks.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">No tienes tareas asignadas.</td></tr>`;
            return;
        }

        tbody.innerHTML = filteredTasks.map(task => `
            <tr>
                <td style="font-weight: 600;">${task.title}</td>
                <td style="color: var(--text-muted); font-size: 0.9rem;">${task.description || 'Sin descripción'}</td>
                <td>
                    <span style="padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
                        ${task.status === 'pendiente' ? 'background: var(--danger-bg); color: var(--danger);' :
                          task.status === 'en progreso' ? 'background: var(--info-bg); color: var(--info);' :
                          'background: var(--success-bg); color: var(--success);'}">
                        ${task.status}
                    </span>
                </td>
                <td>
                    ${task.status === 'pendiente' ?
                        `<button class="btn-action btn-action--primary btn-start-task" data-id="${task.id}">
                            🚀 Iniciar Tarea
                        </button>`
                        : '<span style="color: var(--text-muted); font-size: 0.85rem;">En curso / Terminada</span>'
                    }
                </td>
            </tr>
        `).join('');

        this.attachRowEvents();
    }

    attachEvents() {
        document.getElementById('filterStatus').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.renderTable();
        });

        document.getElementById('sortTasks').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderTable();
        });

        document.getElementById('btnDownloadJSON').addEventListener('click', () => {
            // ✅ FIX: showInfoToast ahora está importado correctamente
            if (this.tasks.length === 0) return showInfoToast("No hay tareas para exportar.");

            const exportData = JSON.stringify({
                exportadoEn: new Date().toISOString(),
                usuario: this.user.name,
                rol: this.user.role,
                totalTareas: this.tasks.length,
                tareas: this.tasks
            }, null, 2);

            descargarJSON(exportData, `mis-tareas-${this.user.document || 'sena'}.json`);
            showSuccessToast('¡JSON exportado con éxito!');
        });
    }

    attachRowEvents() {
        document.querySelectorAll('.btn-start-task').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const taskId = e.currentTarget.getAttribute('data-id');
                try {
                    await actualizarTarea(taskId, { status: 'en progreso' });
                    showSuccessToast('Tarea iniciada. ¡Mucho éxito!');
                    await this.loadTasksFromDB();
                } catch (error) {
                    showErrorToast('Error al iniciar la tarea');
                }
            });
        });
    }
}