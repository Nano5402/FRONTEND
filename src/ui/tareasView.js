import { ordenarTareas, filtrarTareasPorEstado } from '../services/tareasService.js';

function getStatusBadge(status) {
    let badgeClass = 'badge--pendiente';
    let icon = '⏳';
    const s = status.toLowerCase();
    if (s === 'en progreso') { badgeClass = 'badge--progreso'; icon = '🚀'; }
    if (s === 'completada') { badgeClass = 'badge--completada'; icon = '✅'; }
    return `<span class="badge ${badgeClass}">${icon} ${status}</span>`;
}

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
                    btn.innerHTML = '🚀 Iniciar Tarea';
                    btn.onclick = () => onToggle(tarea.id, 'en progreso');
                    actions.appendChild(btn);
                } else if (tarea.status === 'en progreso') {
                    // Botón para finalizar si está en progreso (mejora para el estudiante)
                    const btn = document.createElement('button');
                    btn.className = `btn btn--secondary btn--full`;
                    btn.innerHTML = '✅ Marcar como Completada';
                    btn.onclick = () => onToggle(tarea.id, 'completada');
                    actions.appendChild(btn);
                } else {
                    actions.innerHTML = '<div class="status-notice success">Tarea finalizada 🎉</div>';
                }
            }
            lista.appendChild(tDiv);
        });
    }
    return card;
}

export function createProfessorDashboard(profesor, estudiantes, tareasGlobales, onAbrirModalCrear, onEditar, onToggle, onEliminar, onExportar) {
    const container = document.createElement('div');
    container.className = 'dashboard-container';
    container.innerHTML = `
        <div class="dashboard-header-actions">
            <div>
                <h2 class="dashboard-title">¡Bienvenido, Profesor ${profesor.name}!</h2>
                <p style="color:var(--text-muted)">Gestiona las tareas de tus estudiantes.</p>
            </div>
            <div class="header-buttons">
                <button id="btnGestionarTareasGlobales" class="btn btn--outline">📋 Tareas Globales</button>
                <button id="btnCrearNueva" class="btn btn--primary shadow-glow">➕ Asignar Tarea</button>
            </div>
        </div>
        <div class="dashboard-grid">
            <aside class="card sidebar-card">
                <h3 class="section-title">👥 Estudiantes</h3>
                <div class="students-list-wrapper">
                    ${estudiantes.map(est => `
                        <div class="student-item" data-id="${est.id}" data-nombre="${est.name}">
                            <div class="student-info">
                                <span class="student-avatar">${est.name.charAt(0)}</span>
                                <span class="student-name">${est.name}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </aside>
            <main class="card main-panel-card">
                <div class="main-panel-header">
                    <h3 id="tituloTareasEstudiante" class="section-title mb-0">Selecciona un estudiante</h3>
                    <div id="profesorControls" class="hidden" style="display: flex; gap: 10px; align-items: center;">
                        <select id="profFiltroEstado" class="form__input form__select"><option value="todos">Todos</option><option value="pendiente">Pendientes</option><option value="en progreso">En Progreso</option><option value="completada">Completadas</option></select>
                        <button id="btnBorradoMasivo" class="btn btn--danger btn--sm hidden">🗑️ Borrar Seleccionadas</button>
                    </div>
                </div>
                <div id="contenedorTareasEstudiante" class="tasks-list-container">
                    <div class="empty-state"><p>Haz clic en un estudiante para ver sus tareas.</p></div>
                </div>
            </main>
        </div>
    `;

    container.querySelector('#btnGestionarTareasGlobales').onclick = () => {
        if(window.abrirPanelGestorTareas) window.abrirPanelGestorTareas('dashboard');
    };
    
    container.querySelector('#btnCrearNueva').onclick = onAbrirModalCrear;

    const itemsEstudiantes = container.querySelectorAll('.student-item');
    const contenedorTareas = container.querySelector('#contenedorTareasEstudiante');
    const tituloTareas = container.querySelector('#tituloTareasEstudiante');
    const profControls = container.querySelector('#profesorControls');

    let currentEstId = null;

    function renderizarTareas() {
        if (!currentEstId) return;
        const filtro = container.querySelector('#profFiltroEstado').value;
        let tareas = tareasGlobales.filter(t => String(t.userId) === String(currentEstId));
        if (filtro !== 'todos') tareas = tareas.filter(t => t.status === filtro);

        contenedorTareas.innerHTML = '';
        if (tareas.length === 0) {
            contenedorTareas.innerHTML = '<p class="empty-state">No hay tareas.</p>';
            return;
        }

        tareas.forEach(tarea => {
            const item = document.createElement('div');
            item.className = 'task-item card';
            item.style.display = 'flex';
            
            // 🔥 AHORA INYECTAMOS EL SELECTOR DE ESTADO
            item.innerHTML = `
                <input type="checkbox" class="cb-eliminar-masivo" value="${tarea.id}" style="margin-right: 15px;">
                <div style="flex-grow: 1;">
                    <div class="task-item__header">
                        <h4 class="task-title">${tarea.title}</h4>
                        ${getStatusBadge(tarea.status)}
                    </div>
                    
                    <div class="secondary-actions" style="margin-top: 15px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <div style="display: flex; gap: 5px; align-items: center; background: #f1f5f9; padding: 4px 8px; border-radius: 6px;">
                            <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Estado:</span>
                            <select class="form__select select-estado-profesor" style="padding: 2px 5px; font-size: 0.85rem; height: auto; border: none; background: transparent; cursor: pointer;">
                                <option value="pendiente" ${tarea.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                                <option value="en progreso" ${tarea.status === 'en progreso' ? 'selected' : ''}>En Progreso</option>
                                <option value="completada" ${tarea.status === 'completada' ? 'selected' : ''}>Completada</option>
                            </select>
                        </div>
                        <button class="btn btn--warning btn--sm btn-edit">✏️ Editar</button>
                        <button class="btn btn--danger btn--sm btn-delete">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
            
            // Evento para cambiar estado directamente desde el Select
            item.querySelector('.select-estado-profesor').onchange = (e) => onToggle(tarea.id, e.target.value);
            
            item.querySelector('.btn-edit').onclick = () => onEditar(tarea);
            item.querySelector('.btn-delete').onclick = () => onEliminar(tarea.id);
            contenedorTareas.appendChild(item);
        });
    }

    container.querySelector('#profFiltroEstado').onchange = renderizarTareas;

    itemsEstudiantes.forEach(item => {
        item.onclick = (e) => {
            itemsEstudiantes.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentEstId = item.dataset.id;
            tituloTareas.textContent = `Tareas de ${item.dataset.nombre}`;
            profControls.classList.remove('hidden');
            renderizarTareas();
        };
    });

    return container;
}

export function createErrorCard(mensaje) {
    return `<div class="card error-card"><h3>⚠️ ${mensaje}</h3></div>`;
}