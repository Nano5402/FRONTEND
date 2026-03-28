// src/ui/tareasView.js
import { ordenarTareas, filtrarTareasPorEstado } from '../services/tareasService.js';

function getStatusBadge(status) {
    let badgeClass = 'badge--pendiente';
    let icon = '⏳';
    if (status === 'en progreso') { badgeClass = 'badge--progreso'; icon = '🚀'; }
    if (status === 'completada') { badgeClass = 'badge--completada'; icon = '✅'; }
    return `<span class="badge ${badgeClass}">${icon} ${status}</span>`;
}

// ==========================================
// VISTA ESTUDIANTE (Rediseñada y con vida)
// ==========================================
export function createUserCard(usuario, tareas, tareasAMostrar, estadoFiltro, criterioOrden, onCrearTarea, onEditar, onToggle, onEliminar, onFiltrar, onOrdenar, onExportar) {
    const card = document.createElement('div');
    card.classList.add('student-dashboard-wrapper');
    
    card.innerHTML = `
        <div class="welcome-banner">
            <div class="banner-content">
                <h2 class="welcome-title">¡Hola, ${usuario.name}! 👋</h2>
                <p class="welcome-subtitle">Aquí está el resumen de tus actividades asignadas.</p>
            </div>
            ${onExportar ? `<button id="btnExport" class="btn btn--outline btn--banner">⬇ Descargar mis tareas</button>` : ''}
        </div>
        
        <div class="controls-bar card">
            <div class="control-group">
                <label>Filtrar por estado:</label>
                <select id="filtroEstado" class="form__input form__select">
                    <option value="todos" ${estadoFiltro === 'todos' ? 'selected' : ''}>Todas las tareas</option>
                    <option value="pendiente" ${estadoFiltro === 'pendiente' ? 'selected' : ''}>⏳ Pendientes</option>
                    <option value="en progreso" ${estadoFiltro === 'en progreso' ? 'selected' : ''}>🚀 En Progreso</option>
                    <option value="completada" ${estadoFiltro === 'completada' ? 'selected' : ''}>✅ Completadas</option>
                </select>
            </div>
            <div class="control-group">
                <label>Ordenar por:</label>
                <select id="ordenCriterio" class="form__input form__select">
                    <option value="fecha_desc" ${criterioOrden === 'fecha_desc' ? 'selected' : ''}>Nuevas primero</option>
                    <option value="fecha_asc" ${criterioOrden === 'fecha_asc' ? 'selected' : ''}>Antiguas primero</option>
                    <option value="az" ${criterioOrden === 'az' ? 'selected' : ''}>Alfabético (A-Z)</option>
                    <option value="za" ${criterioOrden === 'za' ? 'selected' : ''}>Alfabético (Z-A)</option>
                </select>
            </div>
        </div>
        
        <div id="listaTareasEstudiante" class="tasks-grid"></div>
    `;

    if (onExportar) card.querySelector('#btnExport').onclick = onExportar;
    if (onFiltrar) card.querySelector('#filtroEstado').onchange = (e) => onFiltrar(e.target.value);
    if (onOrdenar) card.querySelector('#ordenCriterio').onchange = (e) => onOrdenar(e.target.value);

    const lista = card.querySelector('#listaTareasEstudiante');
    
    if (tareasAMostrar.length === 0) {
        lista.innerHTML = '<div class="empty-state"><h3>Sin tareas</h3><p>No tienes tareas bajo estos filtros.</p></div>';
    } else {
        tareasAMostrar.forEach(tarea => {
            const tDiv = document.createElement('div');
            tDiv.className = `task-item card border-${tarea.status.replace(/\s+/g, '-')}`;
            tDiv.innerHTML = `
                <div class="task-item__header">
                    <h4 class="task-title">${tarea.title}</h4>
                    ${getStatusBadge(tarea.status)}
                </div>
               <p class="task-body">${tarea.description || 'Sin descripción detallada.'}</p>
                <div class="actions-container"></div>
            `;

            const actions = tDiv.querySelector('.actions-container');
            if (onToggle) {
                if (tarea.status === 'pendiente') {
                    const btn = document.createElement('button');
                    btn.className = `btn btn--primary btn--full`;
                    btn.innerHTML = '🚀 Iniciar Tarea (Pasar a En Progreso)';
                    btn.onclick = () => onToggle(tarea.id, 'en progreso');
                    actions.appendChild(btn);
                } else if (tarea.status === 'en progreso') {
                    actions.innerHTML = '<div class="status-notice info">Estás trabajando en esta tarea 🏃‍♂️</div>';
                } else if (tarea.status === 'completada') {
                    actions.innerHTML = '<div class="status-notice success">Tarea finalizada 🎉</div>';
                }
            }
            lista.appendChild(tDiv);
        });
    }
    return card;
}

// ==========================================
// VISTA PROFESOR (Con Filtros y Orden)
// ==========================================
export function createProfessorDashboard(profesor, estudiantes, tareasGlobales, onAbrirModalCrear, onEditar, onToggle, onEliminar, onExportar) {
    const container = document.createElement('div');
    container.className = 'dashboard-container';
    
    container.innerHTML = `
        <div class="dashboard-header-actions">
            <div>
                <h2 class="dashboard-title">¡Bienvenido, Profesor ${profesor.name}!</h2>
                <p style="color:var(--text-muted)">Selecciona un estudiante para gestionar sus tareas.</p>
            </div>
            <div class="header-buttons">
                <button id="btnCrearNueva" class="btn btn--primary btn--large shadow-glow">➕ Asignar Nueva Tarea</button>
                <button id="btnExportarTodo" class="btn btn--outline">⬇ Exportar Sistema</button>
            </div>
        </div>

        <div class="dashboard-grid">
            <aside class="card sidebar-card">
                <h3 class="section-title">👥 Tus Estudiantes</h3>
                <div class="students-list-wrapper">
                    ${estudiantes.map(est => `
                        <div class="student-item" data-id="${est.id}" data-nombre="${est.name}">
                            <div class="student-info">
                                <span class="student-avatar">${est.name.charAt(0)}</span>
                                <span class="student-name">${est.name}</span>
                            </div>
                            <span class="chevron">→</span>
                        </div>
                    `).join('')}
                </div>
            </aside>

            <main class="card main-panel-card">
                <div class="main-panel-header">
                    <h3 id="tituloTareasEstudiante" class="section-title mb-0">Selecciona un estudiante</h3>
                    <button id="btnExportarEstudiante" class="btn btn--outline btn--sm hidden">⬇ Exportar Alumno</button>
                </div>
                
                <div id="profesorControls" class="controls-bar hidden" style="margin-bottom: 20px;">
                    <select id="profFiltroEstado" class="form__input form__select"><option value="todos">Todos los estados</option><option value="pendiente">Pendientes</option><option value="en progreso">En Progreso</option><option value="completada">Completadas</option></select>
                    <select id="profOrdenCriterio" class="form__input form__select"><option value="fecha_desc">Nuevas primero</option><option value="fecha_asc">Antiguas primero</option><option value="az">A-Z</option><option value="za">Z-A</option></select>
                </div>

                <div id="contenedorTareasEstudiante" class="tasks-list-container">
                    <div class="empty-state illustration-state">
                        <span style="font-size: 3rem;">📂</span>
                        <p>Haz clic en un estudiante de la lista izquierda.</p>
                    </div>
                </div>
            </main>
        </div>
    `;

    container.querySelector('#btnCrearNueva').addEventListener('click', onAbrirModalCrear);
    container.querySelector('#btnExportarTodo').addEventListener('click', () => onExportar(tareasGlobales, 'sistema-completo.json'));

    const itemsEstudiantes = container.querySelectorAll('.student-item');
    const contenedorTareas = container.querySelector('#contenedorTareasEstudiante');
    const tituloTareas = container.querySelector('#tituloTareasEstudiante');
    const btnExportarEst = container.querySelector('#btnExportarEstudiante');
    const profControls = container.querySelector('#profesorControls');
    
    const selectFiltro = container.querySelector('#profFiltroEstado');
    const selectOrden = container.querySelector('#profOrdenCriterio');

    let currentEstId = null;
    let currentEstNombre = null;

    // Función interna para renderizar con filtros
    function renderizarTareas() {
        if (!currentEstId) return;
        
// 🔥 Filtramos usando exactamente la misma lógica que usa MySQL (userId)
let tareasEstudiante = tareasGlobales.filter(t => String(t.userId) === String(currentEstId));
        tareasEstudiante = filtrarTareasPorEstado(tareasEstudiante, selectFiltro.value);
        tareasEstudiante = ordenarTareas(tareasEstudiante, selectOrden.value);

        btnExportarEst.onclick = () => onExportar(tareasEstudiante, `tareas-${currentEstNombre.replace(/\s+/g, '-').toLowerCase()}.json`);

        if (tareasEstudiante.length === 0) {
            contenedorTareas.innerHTML = `<div class="empty-state"><p>No se encontraron tareas con estos filtros.</p></div>`;
            return;
        }

        contenedorTareas.innerHTML = '';
        tareasEstudiante.forEach(tarea => {
            const item = document.createElement('div');
            item.className = `task-item card border-${tarea.status.replace(/\s+/g, '-')}`;
            item.innerHTML = `
                <div class="task-item__header">
                    <h4 class="task-title">${tarea.title}</h4>
                    ${getStatusBadge(tarea.status)}
                </div>
                    <p class="task-body">${tarea.description || 'Sin descripción detallada.'}</p>
                <div class="actions-prof-footer">
                    <div class="main-actions">
                        <button class="btn btn--sm ${tarea.status === 'pendiente' ? 'btn--primary' : 'btn--secondary'} btn-toggle-status">
                            ${tarea.status === 'pendiente' ? '▶ Iniciar' : (tarea.status === 'en progreso' ? '✅ Completar' : '🔄 Reabrir')}
                        </button>
                    </div>
                    <div class="secondary-actions">
                        <button class="btn btn--warning btn--sm btn-edit">✏️ Editar</button>
                        <button class="btn btn--danger btn--sm btn-delete">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
            
            item.querySelector('.btn-toggle-status').onclick = () => onToggle(tarea.id, tarea.status === 'pendiente' ? 'en progreso' : (tarea.status === 'en progreso' ? 'completada' : 'pendiente'));
            item.querySelector('.btn-edit').onclick = () => onEditar(tarea);
            item.querySelector('.btn-delete').onclick = () => onEliminar(tarea.id);

            contenedorTareas.appendChild(item);
        });
    }

    // Disparadores de filtros del profesor
    selectFiltro.addEventListener('change', renderizarTareas);
    selectOrden.addEventListener('change', renderizarTareas);

    itemsEstudiantes.forEach(item => {
        item.addEventListener('click', (e) => {
            itemsEstudiantes.forEach(i => i.classList.remove('active'));
            const currentItem = e.currentTarget;
            currentItem.classList.add('active');

            currentEstId = currentItem.dataset.id;
            currentEstNombre = currentItem.dataset.nombre;
            
            tituloTareas.textContent = `Gestión: ${currentEstNombre}`;
            btnExportarEst.classList.remove('hidden');
            profControls.classList.remove('hidden');
            profControls.style.display = 'flex'; 
            
            renderizarTareas();
        });
    });

    return container;
}

export function createErrorCard(mensaje) {
    return `<div class="card error-card"><h3>⚠️ ${mensaje}</h3></div>`;
}