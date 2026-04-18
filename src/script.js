import Swal from 'sweetalert2';
import { showSuccessToast, showErrorToast } from './ui/components/notificaciones.js';
import { isValidInput, showError, clearError } from './utils/domHelpers.js';
import { ordenarTareas, filtrarTareasPorEstado, procesarActualizacion, procesarDashboardProfesor } from './services/tareasService.js';
import { createUserCard, createErrorCard, createProfessorDashboard } from './ui/tareasView.js';
import { prepararExportacion, crearTareaMultiple, eliminarTarea, actualizarTarea, loginConBackend, fetchTodosLosUsuarios, actualizarUsuario, cambiarEstadoUsuario, crearUsuario, fetchTodasLasTareas, fetchTareasPorUsuario, eliminarMultiplesTareas } from './api/index.js';
import { descargarJSON } from './ui/exportUI.js';
import { storage } from './utils/storage.js';

// ============================================================
// VARIABLES DE ESTADO GLOBAL
// ============================================================
let currentSelectedRole = ''; 
let currentUserRole = '';
let usuarioActual = null; 
let estadoFiltroGlobal = 'todos';
let criterioGlobal = 'fecha_desc';
let origenGestorTareas = 'dashboard'; // 🔥 Guarda de dónde venimos

// ============================================================
// ELEMENTOS DEL DOM
// ============================================================
const viewRoles = document.getElementById('view-roles');
const viewLogin = document.getElementById('view-login');
const viewDashboard = document.getElementById('view-dashboard');
const viewAdminUsers = document.getElementById('view-admin-users');
const viewAdminTareas = document.getElementById('view-admin-tareas'); 
const mainHeader = document.getElementById('mainHeader');

const btnRolEstudiante = document.getElementById('btnRolEstudiante');
const btnRolProfesor = document.getElementById('btnRolProfesor');
const btnVolverRoles = document.getElementById('btnVolverRoles');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');

const loginTitle = document.getElementById('loginTitle');
const loginForm = document.getElementById('loginForm');
const documentoInput = document.getElementById('documentoInput');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const resultadoUsuario = document.getElementById('resultadoUsuario');
const headerSubtitle = document.getElementById('headerSubtitle');

// ============================================================
// EVENTOS DE NAVEGACIÓN
// ============================================================
btnRolEstudiante?.addEventListener('click', () => {
    currentSelectedRole = 'user';
    if(loginTitle) loginTitle.textContent = 'Ingreso Estudiante';
    viewRoles?.classList.add('hidden');
    viewLogin?.classList.remove('hidden');
});

btnRolProfesor?.addEventListener('click', () => {
    currentSelectedRole = 'admin';
    if(loginTitle) loginTitle.textContent = 'Ingreso Profesor';
    viewRoles?.classList.add('hidden');
    viewLogin?.classList.remove('hidden');
});

btnVolverRoles?.addEventListener('click', () => {
    viewLogin?.classList.add('hidden');
    viewRoles?.classList.remove('hidden');
    if(documentoInput) documentoInput.value = '';
    clearError(loginError);
});

// ============================================================
// EVENTO PRINCIPAL: LOGIN
// ============================================================
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(loginError);

    const docValue = documentoInput.value.trim();
    const passValue = passwordInput?.value.trim(); // Capturamos la contraseña

    // Validación estricta en el frontend
    if (!isValidInput(docValue) || !passValue) {
        showError(loginError, 'El documento y la contraseña son obligatorios.');
        return;
    }

    try {
        // Le pasamos AMBOS datos a la API
        const usuario = await loginConBackend(docValue, passValue);
        
        if (usuario) {
            if (usuario.role !== currentSelectedRole) {
                showError(loginError, `Este documento no pertenece a un ${currentSelectedRole === 'admin' ? 'Profesor' : 'Estudiante'}.`);
                localStorage.removeItem('sena_token');
                return;
            }

            currentUserRole = usuario.role;
            usuarioActual = usuario; 
            showSuccessToast(`¡Bienvenido, ${usuario.name}!`);
            
            mainHeader?.classList.add('hidden');
            viewLogin?.classList.add('hidden');
            viewDashboard?.classList.remove('hidden');

            if (currentUserRole === 'admin') {
                renderizarVistaProfesor(usuario);
            } else {
                renderizarVistaEstudiante(usuario);
            }
        } else {
            showError(loginError, 'Credenciales inválidas o usuario inactivo en la BD.');
        }
    } catch (error) {
        showErrorToast('Error de conexión con el servidor MySQL.');
    }
});

btnCerrarSesion?.addEventListener('click', () => {
    storage.clearTokens();
    mainHeader?.classList.remove('hidden');
    viewDashboard?.classList.add('hidden');
    viewRoles?.classList.remove('hidden');
    if(resultadoUsuario) resultadoUsuario.innerHTML = '';
    if(documentoInput) documentoInput.value = '';
    if(passwordInput) passwordInput.value = '';
    if(headerSubtitle) headerSubtitle.textContent = 'Selecciona tu perfil de ingreso';
    usuarioActual = null;
    showSuccessToast('Sesión cerrada correctamente');
});

// ============================================================
// RENDERIZADO: ESTUDIANTE
// ============================================================
async function renderizarVistaEstudiante(usuario, tareas = null) {
    if(!resultadoUsuario) return;
    resultadoUsuario.innerHTML = '<div class="loading-spinner">Cargando tus tareas...</div>';
    try {
        if (!tareas) {
            tareas = await fetchTareasPorUsuario(usuario.id);
        }

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
    } catch (error) { 
        console.error("Error Crítico en Vista Estudiante:", error);
        resultadoUsuario.innerHTML = '<div class="error-state">Error cargando las tareas del estudiante. Revisa la consola (F12).</div>'; 
    }
}

// ============================================================
// RENDERIZADO: PROFESOR
// ============================================================
async function renderizarVistaProfesor(usuario) {
    if(!resultadoUsuario) return;
    resultadoUsuario.innerHTML = '<div class="loading-spinner">Cargando sistema...</div>';
    try {
        const { estudiantes, tareasGlobales } = await procesarDashboardProfesor();
        resultadoUsuario.innerHTML = '';
        
        const btnGestionUsuarios = document.createElement('button');
        btnGestionUsuarios.className = 'btn btn--primary shadow-glow'; 
        btnGestionUsuarios.style.marginBottom = '25px';
        btnGestionUsuarios.style.width = '100%';
        btnGestionUsuarios.style.padding = '15px'; 
        btnGestionUsuarios.innerHTML = '⚙️ Gestión de Usuarios (CRUD)';
        btnGestionUsuarios.onclick = abrirPanelUsuarios;

        resultadoUsuario.appendChild(btnGestionUsuarios);
        
        const card = createProfessorDashboard(
            usuario, estudiantes, tareasGlobales,
            
            // 1. MODAL PREMIUM DE ASIGNACIÓN
            async () => {
                const estudiantesHtml = estudiantes.map(est => `
                    <label class="modal-checkbox-item" style="display:flex; align-items:center; gap:12px; padding:12px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; cursor:pointer; transition:all 0.2s;">
                        <input type="checkbox" name="swal-est-select" value="${est.id}" class="swal2-checkbox" style="margin:0; width:18px; height:18px; accent-color:var(--sena-green-pastel);">
                        <span style="font-weight:600; color:var(--text-main); font-size:0.95rem;">${est.name}</span>
                    </label>
                `).join('');

                const { value: formValues } = await Swal.fire({
                    title: 'Asignar Nueva Tarea',
                    width: '650px',
                    html: `
                        <div class="swal-admin-form">
                            <label>Título de la Tarea</label>
                            <input id="swal-title" class="swal2-input" placeholder="Ej: Diagrama de Base de Datos" style="width:100%; margin-bottom:20px;">
                            
                            <label>Descripción Detallada</label>
                            <textarea id="swal-desc" class="swal2-textarea" placeholder="Escribe las instrucciones exactas..." rows="3" style="width:100%; margin-bottom:25px; resize:none;"></textarea>
                            
                            <div style="background: white; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 20px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom: 2px solid var(--border-subtle); padding-bottom:10px;">
                                    <h4 style="margin:0; font-size:1rem; color:var(--text-main); font-weight:700;">Seleccionar Estudiantes</h4>
                                    <button type="button" id="swal-btn-select-all" class="btn btn--outline btn--sm" style="padding:4px 10px; font-size:0.8rem;">Marcar Todos</button>
                                </div>
                                <div class="students-grid-list" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; max-height:200px; overflow-y:auto; padding-right:5px;">
                                    ${estudiantesHtml}
                                </div>
                            </div>
                        </div>
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    confirmButtonText: 'Asignar Tarea',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: 'var(--sena-green-pastel)',
                    customClass: { confirmButton: 'btn--primary' },
                    didOpen: () => {
                        const btnSelectAll = Swal.getPopup().querySelector('#swal-btn-select-all');
                        const checkboxes = Swal.getPopup().querySelectorAll('input[name="swal-est-select"]');
                        let allSelected = false;
                        
                        btnSelectAll.addEventListener('click', () => {
                            allSelected = !allSelected;
                            checkboxes.forEach(cb => {
                                cb.checked = allSelected;
                                cb.parentElement.style.background = allSelected ? 'var(--sena-green-pastel-bg)' : '#f9fafb';
                                cb.parentElement.style.borderColor = allSelected ? 'var(--sena-green-pastel)' : '#e5e7eb';
                            });
                            btnSelectAll.textContent = allSelected ? 'Desmarcar Todos' : 'Marcar Todos';
                        });

                        checkboxes.forEach(cb => {
                            cb.addEventListener('change', (e) => {
                                e.target.parentElement.style.background = e.target.checked ? 'var(--sena-green-pastel-bg)' : '#f9fafb';
                                e.target.parentElement.style.borderColor = e.target.checked ? 'var(--sena-green-pastel)' : '#e5e7eb';
                            });
                        });
                    },
                    preConfirm: () => {
                        const title = document.getElementById('swal-title').value.trim();
                        const description = document.getElementById('swal-desc').value.trim(); 
                        const userIds = Array.from(document.querySelectorAll('input[name="swal-est-select"]:checked')).map(cb => cb.value);
                        
                        if (!title) { Swal.showValidationMessage('El título es obligatorio'); return false; }
                        if (!description) { Swal.showValidationMessage('La descripción es obligatoria'); return false; }
                        if (userIds.length === 0) { Swal.showValidationMessage('Selecciona al menos un estudiante'); return false; }
                        
                        return { title, description, userIds }; 
                    }
                });

                if (formValues) {
                    try {
                        Swal.showLoading();
                        await crearTareaMultiple(formValues.title, formValues.description, formValues.userIds);
                        showSuccessToast('¡Tarea asignada exitosamente!');
                        renderizarVistaProfesor(usuario);
                    } catch (error) {
                        showErrorToast('Error 500: Revisa la consola del Backend');
                    }
                }
            },

            // 2. EDITAR TAREA
            async (tarea) => {
                const { value: formValues } = await Swal.fire({
                    title: 'Editar Tarea',
                    html: `
                        <div class="swal-admin-form">
                            <label>Título</label>
                            <input id="swal-edit-title" class="swal2-input" value="${tarea.title}">
                            <label>Descripción</label>
                            <textarea id="swal-edit-desc" class="swal2-textarea" rows="4">${tarea.description || ''}</textarea>
                        </div>
                    `,
                    focusConfirm: false, showCancelButton: true, confirmButtonColor: 'var(--sena-green-pastel)',
                    preConfirm: () => ({ 
                        title: document.getElementById('swal-edit-title').value, 
                        description: document.getElementById('swal-edit-desc').value 
                    })
                });
                if (formValues) {
                    try {
                        await actualizarTarea(tarea.id, formValues);
                        showSuccessToast('Tarea editada correctamente');
                        renderizarVistaProfesor(usuario);
                    } catch(e) { showErrorToast('Error al editar'); }
                }
            },

            // 3. CAMBIAR ESTADO
            async (tareaId, nuevoEstado) => { 
                try {
                    await actualizarTarea(tareaId, { status: nuevoEstado }); 
                    renderizarVistaProfesor(usuario); 
                } catch(e) { showErrorToast('Error al cambiar estado'); }
            },

            // 4. ELIMINAR TAREA
            async (tareaId) => {
                const result = await Swal.fire({ title: '¿Eliminar tarea?', text: "Esta acción es irreversible", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, eliminar' });
                if (result.isConfirmed) { 
                    try {
                        await eliminarTarea(tareaId); 
                        showSuccessToast('Eliminada'); 
                        renderizarVistaProfesor(usuario); 
                    } catch(e) { showErrorToast('Error al eliminar'); }
                }
            },

            // 5. EXPORTAR
            (tareasExportar, nombreArchivo) => { 
                const contenido = JSON.stringify(tareasExportar, null, 2); 
                descargarJSON(contenido, nombreArchivo); 
                showSuccessToast('Archivo descargado'); 
            }
        );
        resultadoUsuario.appendChild(card);
    } catch (error) { 
        console.error("Error Crítico en Vista Profesor:", error);
        resultadoUsuario.innerHTML = '<div class="error-state" style="padding: 20px; text-align: center; color: var(--danger);">Error cargando el dashboard. Asegúrate de que MySQL esté encendido.</div>'; 
    }
}

// ============================================================
// MÓDULO DE ADMINISTRACIÓN DE USUARIOS
// ============================================================
const btnVolverProfesor = document.getElementById('btnVolverProfesor');
const tbodyUsuariosAdmin = document.getElementById('tbodyUsuariosAdmin');

if (btnVolverProfesor) {
    btnVolverProfesor.addEventListener('click', () => {
        localStorage.setItem('sena_current_view', 'view-dashboard');
        viewAdminUsers?.classList.add('hidden');
        viewDashboard?.classList.remove('hidden');
    });
}

window.abrirPanelUsuarios = async function() {
    localStorage.setItem('sena_current_view', 'view-admin-users');
    viewDashboard?.classList.add('hidden');
    viewAdminUsers?.classList.remove('hidden');
    if(tbodyUsuariosAdmin) tbodyUsuariosAdmin.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Cargando usuarios...</td></tr>';

    try {
        const usuariosList = await fetchTodosLosUsuarios();
        if(tbodyUsuariosAdmin) tbodyUsuariosAdmin.innerHTML = '';

        usuariosList.forEach(userItem => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e2e8f0';
            
            const badgeRol = userItem.role === 'admin' ? '<span class="badge badge--progreso">Admin</span>' : '<span class="badge badge--completada">Estudiante</span>';
            const badgeEstado = userItem.status === 'activo' ? '<span class="badge badge--completada">Activo</span>' : '<span class="badge badge--pendiente" style="background-color:#fee2e2; color:#ef4444;">Inactivo</span>';
            const btnEstadoTexto = userItem.status === 'activo' ? 'Desactivar' : 'Activar';
            const btnEstadoClase = userItem.status === 'activo' ? 'btn--danger' : 'btn--primary';

            const userEncoded = encodeURIComponent(JSON.stringify(userItem));

            tr.innerHTML = `
                <td style="color: #64748b; font-weight: 600;">#${userItem.id}</td>
                <td style="font-weight: 500;">${userItem.name}</td>
                <td>${userItem.document}</td>
                <td>${badgeRol}</td>
                <td>${badgeEstado}</td>
                <td class="admin-table-actions">
                    <button class="btn btn--secondary btn--sm" onclick="editarUsuarioUI('${userEncoded}')">Editar</button>
                    <button class="btn ${btnEstadoClase} btn--sm" onclick="cambiarEstadoUI('${userEncoded}')">${btnEstadoTexto}</button>
                </td>
            `;
            if(tbodyUsuariosAdmin) tbodyUsuariosAdmin.appendChild(tr);
        });
    } catch (error) {
        if(tbodyUsuariosAdmin) tbodyUsuariosAdmin.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Error al cargar la base de datos.</td></tr>';
    }
};

window.editarUsuarioUI = async function(userDataEncoded) {
    const userObject = JSON.parse(decodeURIComponent(userDataEncoded));
    const { value: formValues } = await Swal.fire({
        title: 'Editar Información',
        html: `
            <div class="swal-admin-form">
                <label>Nombre Completo</label>
                <input id="swal-u-name" class="swal2-input" value="${userObject.name}">
                <label>Documento</label>
                <input id="swal-u-doc" class="swal2-input" value="${userObject.document}">
                <label>Rol en el Sistema</label>
                <select id="swal-u-role" class="swal2-select">
                    <option value="user" ${userObject.role === 'user' ? 'selected' : ''}>Estudiante</option>
                    <option value="admin" ${userObject.role === 'admin' ? 'selected' : ''}>Profesor (Admin)</option>
                </select>
            </div>
        `,
        focusConfirm: false, showCancelButton: true, confirmButtonColor: 'var(--sena-green-pastel)', confirmButtonText: 'Guardar Cambios',
        preConfirm: () => {
            return {
                name: document.getElementById('swal-u-name').value.trim(),
                document: document.getElementById('swal-u-doc').value.trim(),
                role: document.getElementById('swal-u-role').value,
                email: userObject.email, 
                status: userObject.status
            }
        }
    });

    if (formValues) {
        try {
            Swal.showLoading();
            await actualizarUsuario(userObject.id, formValues);
            showSuccessToast('Usuario actualizado en MySQL');
            abrirPanelUsuarios(); 
        } catch (error) { showErrorToast('Error al actualizar'); }
    }
};

window.cambiarEstadoUI = async function(userDataEncoded) {
    const userObject = JSON.parse(decodeURIComponent(userDataEncoded));
    const nextStatus = userObject.status === 'activo' ? 'inactivo' : 'activo';
    const actionText = nextStatus === 'inactivo' ? 'desactivar' : 'activar';

    if (nextStatus === 'inactivo') {
        Swal.showLoading();
        const tareas = await fetchTareasPorUsuario(userObject.id);
        const pendientes = tareas.filter(t => t.status.toLowerCase() !== 'completada');
        if (pendientes.length > 0) {
            Swal.close();
            return showErrorToast(`Bloqueado: El estudiante tiene ${pendientes.length} tareas pendientes.`);
        }
    }
    
    const result = await Swal.fire({
        title: 'Confirmar acción', text: `¿Deseas ${actionText} a este usuario?`,
        showCancelButton: true, confirmButtonColor: nextStatus === 'inactivo' ? '#ef4444' : 'var(--sena-green-pastel)', confirmButtonText: `Sí, ${actionText}`
    });

    if (result.isConfirmed) {
        try {
            const updatedUserPayload = {
                name: userObject.name, document: userObject.document,
                email: userObject.email, role: userObject.role, status: nextStatus
            };
            Swal.showLoading();
            await actualizarUsuario(userObject.id, updatedUserPayload);
            showSuccessToast(`Usuario ${nextStatus} correctamente`);
            abrirPanelUsuarios(); 
        } catch (error) { showErrorToast('Error al procesar la solicitud'); }
    }
};

window.crearUsuarioUI = async function() {
    const { value: formValues } = await Swal.fire({
        title: 'Crear Nuevo Usuario',
        html: `
            <div class="swal-admin-form">
                <label>Nombre Completo</label><input id="swal-c-name" class="swal2-input" placeholder="Ej: Juan Pérez">
                <label>Documento de Identidad</label><input id="swal-c-doc" class="swal2-input" type="number" placeholder="Ej: 1098765432">
                <label>Correo Electrónico</label><input id="swal-c-email" class="swal2-input" type="email" placeholder="Ej: juan@sena.edu.co">
                <label>Rol en el Sistema</label>
                <select id="swal-c-role" class="swal2-select"><option value="user">Estudiante</option><option value="admin">Profesor (Admin)</option></select>
            </div>
        `,
        focusConfirm: false, showCancelButton: true, confirmButtonColor: '#7c3aed', confirmButtonText: 'Crear Usuario',
        preConfirm: () => {
            const name = document.getElementById('swal-c-name').value.trim();
            const documentVal = document.getElementById('swal-c-doc').value.trim();
            const email = document.getElementById('swal-c-email').value.trim();
            const role = document.getElementById('swal-c-role').value;
            if (!name || !documentVal || !email) { Swal.showValidationMessage('Completa todos los campos'); return false; }
            return { name, document: documentVal, email, role };
        }
    });

    if (formValues) {
        try {
            Swal.showLoading();
            await crearUsuario(formValues);
            showSuccessToast('Usuario creado exitosamente');
            abrirPanelUsuarios(); 
        } catch (error) { showErrorToast('Error al crear usuario.'); }
    }
};

// ============================================================
// GESTOR GLOBAL DE TAREAS (AHORA CRUZA DATOS PARA MOSTRAR NOMBRES)
// ============================================================

// 🔥 Función global inteligente
window.abrirPanelGestorTareas = async function(origen = 'dashboard') {
    localStorage.setItem('sena_current_view', 'view-admin-tareas');
    localStorage.setItem('sena_origen_tareas', origen);
    origenGestorTareas = origen; 
    viewDashboard?.classList.add('hidden');
    viewAdminUsers?.classList.add('hidden');
    viewAdminTareas?.classList.remove('hidden');

    // Ajusta el texto del botón de volver según de dónde vengas
    const btnVolver = document.getElementById('btnVolverUsuariosDesdeTareas');
    if (btnVolver) {
        btnVolver.innerHTML = origen === 'usuarios' ? '<span>←</span> Volver a Usuarios' : '<span>←</span> Volver al Dashboard';
    }

    Swal.showLoading();
    try {
        // Traemos todo de la base de datos para cruzar IDs
        const tareas = await fetchTodasLasTareas();
        const usuarios = await fetchTodosLosUsuarios();
        Swal.close();

        const tbodyGlobal = document.getElementById('tbodyTareasGlobal');
        if(tbodyGlobal) {
            tbodyGlobal.innerHTML = tareas.map(t => {
                // Buscamos el nombre del estudiante al que le pertenece la tarea
                const estudianteEncontrado = usuarios.find(u => u.id === t.userId);
                const nombreReal = estudianteEncontrado ? estudianteEncontrado.name : `Usuario Eliminado (ID: ${t.userId})`;

                return `
                    <tr>
                        <td><input type="checkbox" class="cb-tarea-global" value="${t.id}"></td>
                        <td>#${t.id}</td>
                        <td><strong>${t.title}</strong></td>
                        <td style="color: var(--text-main); font-weight: 500;">${nombreReal}</td>
                        <td><span class="badge badge--${t.status.replace(/\s+/g, '-')}">${t.status}</span></td>
                        <td style="text-align: center;">
                            <button class="btn btn--danger btn--sm" onclick="borrarUnaTareaGlobal(${t.id})">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch(error) {
        Swal.close();
        showErrorToast('Error al cargar los datos cruzados');
    }
};

// Si haces clic desde la tabla de usuarios
const btnIrAGestionTareas = document.getElementById('btnIrAGestionTareas');
if (btnIrAGestionTareas) {
    btnIrAGestionTareas.addEventListener('click', () => {
        if(window.abrirPanelGestorTareas) window.abrirPanelGestorTareas('usuarios');
    });
}

// Botón de Volver (Inteligente)
document.getElementById('btnVolverUsuariosDesdeTareas')?.addEventListener('click', () => {
    localStorage.setItem('sena_current_view', 'view-dashboard');
    viewAdminTareas?.classList.add('hidden');
    if (origenGestorTareas === 'usuarios') {
        viewAdminUsers?.classList.remove('hidden');
    } else {
        viewDashboard?.classList.remove('hidden');
        // Si regresamos al dashboard, lo recargamos para asegurar que muestre la tabla de tareas actualizadas
        if (usuarioActual) renderizarVistaProfesor(usuarioActual);
    }
});

document.addEventListener('change', (e) => {
    if (e.target.classList.contains('cb-tarea-global') || e.target.id === 'cb-todos-global') {
        if (e.target.id === 'cb-todos-global') {
            document.querySelectorAll('.cb-tarea-global').forEach(cb => cb.checked = e.target.checked);
        }
        const seleccionados = document.querySelectorAll('.cb-tarea-global:checked');
        const btnBorrar = document.getElementById('btnBorrarSeleccionadasGlobal');
        if(btnBorrar) {
            document.getElementById('contadorBorradoGlobal').textContent = seleccionados.length;
            seleccionados.length > 0 ? btnBorrar.classList.remove('hidden') : btnBorrar.classList.add('hidden');
        }
    }
});

document.getElementById('btnBorrarSeleccionadasGlobal')?.addEventListener('click', async () => {
    const ids = Array.from(document.querySelectorAll('.cb-tarea-global:checked')).map(cb => Number(cb.value));
    const result = await Swal.fire({
        title: '¿Eliminar masivamente?', text: `Borrarás ${ids.length} tareas.`, icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#E65100', confirmButtonText: 'Sí, borrarlas'
    });
    if (result.isConfirmed) {
        Swal.showLoading();
        await eliminarMultiplesTareas(ids);
        showSuccessToast('Tareas eliminadas');
        window.abrirPanelGestorTareas(origenGestorTareas); // Recarga y mantiene tu contexto
    }
});

window.borrarUnaTareaGlobal = async function(id) {
    Swal.showLoading();
    await eliminarTarea(id);
    showSuccessToast('Tarea eliminada');
    window.abrirPanelGestorTareas(origenGestorTareas);
};

// ============================================================
// PERSISTENCIA F5 (Auto-Login Seguro y Memoria de Vista)
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const token = storage.getAccessToken(); // Usamos el gestor
    
    if (!token || token.split('.').length !== 3) {
        viewRoles?.classList.remove('hidden'); // Si no hay token, aseguramos que se vea el inicio
        return;
    }

    try {
        const payload = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1]))));
        
        usuarioActual = {
            id: payload.id,
            name: payload.name || "Usuario", 
            role: payload.role
        };

        // 1. Ocultamos las vistas de inicio
        viewRoles?.classList.add('hidden');
        viewLogin?.classList.add('hidden');
        mainHeader?.classList.add('hidden');
        
        // 2. Cargamos la data del usuario
        if (usuarioActual.role === 'admin') {
            await renderizarVistaProfesor(usuarioActual);
        } else {
            await renderizarVistaEstudiante(usuarioActual);
        }
        
        btnCerrarSesion?.classList.remove('hidden');

        // 🔥 3. MAGIA UX: Restaurar la última vista donde estaba el usuario
        const ultimaVista = localStorage.getItem('sena_current_view') || 'view-dashboard';
        
        // Ocultamos todas por seguridad
        viewDashboard?.classList.add('hidden');
        viewAdminUsers?.classList.add('hidden');
        viewAdminTareas?.classList.add('hidden');

        // Mostramos solo en la que estaba
        if (ultimaVista === 'view-admin-users' && usuarioActual.role === 'admin') {
            abrirPanelUsuarios(); // Esto ya muestra la vista y carga la tabla
        } else if (ultimaVista === 'view-admin-tareas' && usuarioActual.role === 'admin') {
            const origen = localStorage.getItem('sena_origen_tareas') || 'dashboard';
            abrirPanelGestorTareas(origen);
        } else {
            viewDashboard?.classList.remove('hidden');
        }

    } catch (e) { 
        console.warn("Sesión inválida, limpiando caché...");
        storage.clearTokens(); 
        viewRoles?.classList.remove('hidden');
    }
});