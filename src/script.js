// src/script.js
import Swal from 'sweetalert2';
import { showSuccessToast, showErrorToast } from './ui/components/notificaciones.js';
import { isValidInput, showError, clearError } from './utils/domHelpers.js';
import { procesarBusqueda, ordenarTareas, filtrarTareasPorEstado, procesarActualizacion, procesarDashboardProfesor } from './services/tareasService.js';
import { createUserCard, createErrorCard, createProfessorDashboard } from './ui/tareasView.js';
import { prepararExportacion, crearTareaMultiple, eliminarTarea, actualizarTarea } from './api/index.js';
import { descargarJSON } from './ui/exportUI.js';

// ============================================================
// ELEMENTOS DEL DOM
// ============================================================
const viewRoles = document.getElementById('view-roles');
const viewLogin = document.getElementById('view-login');
const viewDashboard = document.getElementById('view-dashboard');

const btnRolEstudiante = document.getElementById('btnRolEstudiante');
const btnRolProfesor = document.getElementById('btnRolProfesor');
const btnVolverRoles = document.getElementById('btnVolverRoles');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');

const loginTitle = document.getElementById('loginTitle');
const loginForm = document.getElementById('loginForm');
const documentoInput = document.getElementById('documentoInput');
const loginError = document.getElementById('loginError');
const resultadoUsuario = document.getElementById('resultadoUsuario');
const dashboardTitle = document.getElementById('dashboardTitle');

// ESTADOS GLOBALES
let rolSeleccionado = ''; 
let estadoFiltroGlobal = 'todos';
let criterioGlobal = 'fecha_desc';

// ============================================================
// NAVEGACIÓN Y LOGIN
// ============================================================
function mostrarVista(vistaId) {
    viewRoles.classList.add('hidden');
    viewLogin.classList.add('hidden');
    viewDashboard.classList.add('hidden');
    document.getElementById(vistaId).classList.remove('hidden');
}

btnRolEstudiante.addEventListener('click', () => { rolSeleccionado = 'estudiante'; loginTitle.textContent = 'Ingreso de Estudiantes'; mostrarVista('view-login'); });
btnRolProfesor.addEventListener('click', () => { rolSeleccionado = 'profesor'; loginTitle.textContent = 'Ingreso de Profesores'; mostrarVista('view-login'); });
btnVolverRoles.addEventListener('click', () => { mostrarVista('view-roles'); documentoInput.value = ''; clearError(loginError); });
btnCerrarSesion.addEventListener('click', () => { mostrarVista('view-roles'); documentoInput.value = ''; resultadoUsuario.innerHTML = ''; });

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const documento = documentoInput.value.trim();

    if (!isValidInput(documento)) return showError(loginError, 'El documento es obligatorio');

    try {
        const { usuario, tareas } = await procesarBusqueda(documento);
        const idUsuario = Number(usuario.id);

        if (rolSeleccionado === 'estudiante' && (idUsuario < 1 || idUsuario > 9)) throw new Error("Documento no válido para Estudiante.");
        if (rolSeleccionado === 'profesor' && (idUsuario !== 10 && idUsuario !== 11)) throw new Error("No tienes permisos de Profesor.");

        dashboardTitle.textContent = rolSeleccionado === 'profesor' ? 'Panel Administrativo' : 'Mis Tareas';
        mostrarVista('view-dashboard');
        
        if (rolSeleccionado === 'estudiante') renderizarVistaEstudiante(usuario, tareas);
        else renderizarVistaProfesor(usuario);

        showSuccessToast(`Bienvenido, ${usuario.name}`);
    } catch (error) { Swal.fire('Acceso Denegado', error.message, 'error'); }
});

documentoInput.addEventListener('input', () => clearError(loginError));

// ============================================================
// RENDERIZADO: ESTUDIANTE
// ============================================================
function renderizarVistaEstudiante(usuario, tareas) {
    resultadoUsuario.innerHTML = '';
    let tareasAMostrar = filtrarTareasPorEstado(tareas, estadoFiltroGlobal);
    tareasAMostrar = ordenarTareas(tareasAMostrar, criterioGlobal);

    const card = createUserCard(
        usuario, tareas, tareasAMostrar, estadoFiltroGlobal, criterioGlobal,
        null, null, 
        async (tareaId, nuevoEstado) => {
            try {
                const tareasActualizadas = await procesarActualizacion(tareaId, usuario.id, { status: nuevoEstado });
                renderizarVistaEstudiante(usuario, tareasActualizadas);
                showSuccessToast('Estado actualizado correctamente');
            } catch (error) { showErrorToast('Error al actualizar'); }
        },
        null, 
        (nuevoEstado) => { estadoFiltroGlobal = nuevoEstado; renderizarVistaEstudiante(usuario, tareas); },
        (nuevoCriterio) => { criterioGlobal = nuevoCriterio; renderizarVistaEstudiante(usuario, tareas); },
        () => {
            const contenido = prepararExportacion(tareasAMostrar, usuario);
            descargarJSON(contenido, `mis-tareas-${usuario.document}.json`);
        }
    );
    resultadoUsuario.appendChild(card);
}

// ============================================================
// RENDERIZADO: PROFESOR
// ============================================================
async function renderizarVistaProfesor(usuario) {
    resultadoUsuario.innerHTML = '<div class="loading-spinner">Cargando sistema...</div>';
    try {
        const { estudiantes, tareasGlobales } = await procesarDashboardProfesor();
        resultadoUsuario.innerHTML = '';
        
        const card = createProfessorDashboard(
            usuario, estudiantes, tareasGlobales,
            
            // 1. MODAL DE ASIGNACIÓN (CON SELECCIONAR TODOS)
            async () => {
                const estudiantesHtml = estudiantes.map(est => `
                    <label class="modal-checkbox-item">
                        <input type="checkbox" name="swal-est-select" value="${est.id}" class="swal2-checkbox">
                        <span class="label-text">${est.name}</span>
                    </label>
                `).join('');

                const { value: formValues } = await Swal.fire({
                    title: '📝 Asignar Nueva Tarea',
                    width: '600px',
                    html: `
                        <div class="swal-form-container">
                            <input id="swal-title" class="swal2-input" placeholder="Título de la tarea" style="margin-bottom:15px; width:90%;">
                            <textarea id="swal-body" class="swal2-textarea" placeholder="Descripción detallada" rows="3" style="margin-bottom:20px; width:90%;"></textarea>
                            
                            <div class="swal-students-selection">
                                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding-bottom:10px; margin-bottom:15px;">
                                    <h4 style="margin:0; font-size:1.1rem; color:var(--primary);">¿A quién se la asignamos?</h4>
                                    <button type="button" id="swal-btn-select-all" class="btn btn--secondary btn--sm">✅ Seleccionar a Todos</button>
                                </div>
                                <div class="students-grid-list">
                                    ${estudiantesHtml}
                                </div>
                            </div>
                        </div>
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    confirmButtonText: 'Crear y Asignar',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#7c3aed',
                    didOpen: () => {
                        const btnSelectAll = Swal.getPopup().querySelector('#swal-btn-select-all');
                        const checkboxes = Swal.getPopup().querySelectorAll('input[name="swal-est-select"]');
                        let allSelected = false;
                        
                        btnSelectAll.addEventListener('click', () => {
                            allSelected = !allSelected;
                            checkboxes.forEach(cb => cb.checked = allSelected);
                            btnSelectAll.textContent = allSelected ? '❌ Desmarcar Todos' : '✅ Seleccionar a Todos';
                            btnSelectAll.classList.toggle('btn--danger', allSelected);
                            btnSelectAll.classList.toggle('btn--secondary', !allSelected);
                        });
                    },
                    preConfirm: () => {
                        const title = document.getElementById('swal-title').value.trim();
                        const body = document.getElementById('swal-body').value.trim();
                        const userIds = Array.from(document.querySelectorAll('input[name="swal-est-select"]:checked')).map(cb => cb.value);
                        
                        if (!title) Swal.showValidationMessage('El título es obligatorio');
                        else if (userIds.length === 0) Swal.showValidationMessage('Selecciona al menos un estudiante');
                        
                        return { title, body, userIds };
                    }
                });

                if (formValues) {
                    Swal.showLoading();
                    await crearTareaMultiple(formValues.title, formValues.body, formValues.userIds);
                    Swal.fire('¡Asignada!', 'La tarea ha sido distribuida exitosamente.', 'success');
                    renderizarVistaProfesor(usuario);
                }
            },

            // 2. EDITAR TAREA
            async (tarea) => {
                const { value: formValues } = await Swal.fire({
                    title: 'Editar Tarea',
                    html: `<input id="swal-edit-title" class="swal2-input" value="${tarea.title}" style="width:90%;">
                           <textarea id="swal-edit-body" class="swal2-textarea" style="width:90%;">${tarea.body || ''}</textarea>`,
                    focusConfirm: false, showCancelButton: true, confirmButtonColor: '#7c3aed',
                    preConfirm: () => ({ title: document.getElementById('swal-edit-title').value, body: document.getElementById('swal-edit-body').value })
                });
                if (formValues) {
                    await actualizarTarea(tarea.id, formValues);
                    showSuccessToast('Tarea editada correctamente');
                    renderizarVistaProfesor(usuario);
                }
            },

            // 3. CAMBIAR ESTADO
            async (tareaId, nuevoEstado) => { 
                await actualizarTarea(tareaId, { status: nuevoEstado }); 
                renderizarVistaProfesor(usuario); 
            },

            // 4. ELIMINAR TAREA
            async (tareaId) => {
                const result = await Swal.fire({ title: '¿Estás seguro?', text: "Esta acción es irreversible", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, eliminar' });
                if (result.isConfirmed) { 
                    await eliminarTarea(tareaId); 
                    Swal.fire('Eliminada', '', 'success'); 
                    renderizarVistaProfesor(usuario); 
                }
            },

            // 5. EXPORTAR
            (tareasExportar, nombreArchivo) => { 
                const contenido = JSON.stringify(tareasExportar, null, 2); 
                descargarJSON(contenido, nombreArchivo); 
                Swal.fire('Exportado', 'Archivo descargado exitosamente.', 'success'); 
            }
        );
        resultadoUsuario.appendChild(card);
    } catch (error) { 
        resultadoUsuario.innerHTML = '<div class="error-state">Error cargando el dashboard.</div>'; 
    }
}