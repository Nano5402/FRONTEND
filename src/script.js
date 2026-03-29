import Swal from 'sweetalert2';
import { showSuccessToast, showErrorToast } from './ui/components/notificaciones.js';
import { isValidInput, showError, clearError } from './utils/domHelpers.js';
import { ordenarTareas, filtrarTareasPorEstado, procesarActualizacion, procesarDashboardProfesor } from './services/tareasService.js';
import { createUserCard, createErrorCard, createProfessorDashboard } from './ui/tareasView.js';
import { prepararExportacion, crearTareaMultiple, eliminarTarea, actualizarTarea, loginConBackend, fetchTodosLosUsuarios, actualizarUsuario, cambiarEstadoUsuario, crearUsuario } from './api/index.js';
import { descargarJSON } from './ui/exportUI.js';

// ============================================================
// ELEMENTOS DEL DOM
// ============================================================
// ... (sigue tu código normal)
// ============================================================
// ELEMENTOS DEL DOM
// ============================================================
const viewRoles = document.getElementById('view-roles');
const viewLogin = document.getElementById('view-login');
const viewDashboard = document.getElementById('view-dashboard');
const mainHeader = document.getElementById('mainHeader');

const btnRolEstudiante = document.getElementById('btnRolEstudiante');
const btnRolProfesor = document.getElementById('btnRolProfesor');
const btnVolverRoles = document.getElementById('btnVolverRoles');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');

const loginTitle = document.getElementById('loginTitle');
const loginForm = document.getElementById('loginForm');
const documentoInput = document.getElementById('documentoInput');
const loginError = document.getElementById('loginError');
const resultadoUsuario = document.getElementById('resultadoUsuario');
const headerSubtitle = document.getElementById('headerSubtitle');

let currentSelectedRole = ''; 
let currentUserRole = '';

// ============================================================
// EVENTOS DE NAVEGACIÓN
// ============================================================
btnRolEstudiante.addEventListener('click', () => {
    currentSelectedRole = 'user';
    loginTitle.textContent = 'Ingreso Estudiante';
    viewRoles.classList.add('hidden');
    viewLogin.classList.remove('hidden');
});

btnRolProfesor.addEventListener('click', () => {
    currentSelectedRole = 'admin';
    loginTitle.textContent = 'Ingreso Profesor';
    viewRoles.classList.add('hidden');
    viewLogin.classList.remove('hidden');
});

btnVolverRoles.addEventListener('click', () => {
    viewLogin.classList.add('hidden');
    viewRoles.classList.remove('hidden');
    documentoInput.value = '';
    clearError(loginError);
});

// ============================================================
// EVENTO PRINCIPAL: LOGIN
// ============================================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(loginError);

    const docValue = documentoInput.value.trim();
    if (!isValidInput(docValue)) {
        showError(loginError, 'El documento es obligatorio.');
        return;
    }

    try {
        const usuario = await loginConBackend(docValue);

        if (usuario) {
            if (usuario.role !== currentSelectedRole) {
                showError(loginError, `Este documento no pertenece a un ${currentSelectedRole === 'admin' ? 'Profesor' : 'Estudiante'}.`);
                localStorage.removeItem('sena_token');
                return;
            }

            currentUserRole = usuario.role;
            showSuccessToast(`¡Bienvenido, ${usuario.name}!`);
            
            mainHeader.classList.add('hidden');
            viewLogin.classList.add('hidden');
            viewDashboard.classList.remove('hidden');

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

btnCerrarSesion.addEventListener('click', () => {
    localStorage.removeItem('sena_token');
    mainHeader.classList.remove('hidden'); // ¡Obligatorio para destruir sesión!
    viewDashboard.classList.add('hidden');
    viewRoles.classList.remove('hidden');
    resultadoUsuario.innerHTML = '';
    documentoInput.value = '';
    headerSubtitle.textContent = 'Selecciona tu perfil de ingreso';
    showSuccessToast('Sesión cerrada correctamente');
});

// ============================================================
// VARIABLES DE ESTADO GLOBAL PARA LOS FILTROS
// ============================================================
let estadoFiltroGlobal = 'todos';
let criterioGlobal = 'fecha_desc';

// ============================================================
// RENDERIZADO: ESTUDIANTE
// ============================================================
async function renderizarVistaEstudiante(usuario, tareas = null) {
    resultadoUsuario.innerHTML = '<div class="loading-spinner">Cargando tus tareas...</div>';
    try {
        // 🛡️ PARCHE: Si venimos del Login, las tareas llegan nulas. Las buscamos aquí.
        if (!tareas) {
            const { fetchTareasPorUsuario } = await import('./api/index.js');
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
// RENDERIZADO: PROFESOR (Con Modal Premium Corregido)
// ============================================================
async function renderizarVistaProfesor(usuario) {
    resultadoUsuario.innerHTML = '<div class="loading-spinner">Cargando sistema...</div>';
    try {
        const { estudiantes, tareasGlobales } = await procesarDashboardProfesor();
        resultadoUsuario.innerHTML = '';
        
        // Botón gigante para entrar a la gestión de usuarios
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
            
            // 1. MODAL PREMIUM DE ASIGNACIÓN (SENA PASTEL)
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

                        // Efecto hover y clic individual en checkboxes
                        checkboxes.forEach(cb => {
                            cb.addEventListener('change', (e) => {
                                e.target.parentElement.style.background = e.target.checked ? 'var(--sena-green-pastel-bg)' : '#f9fafb';
                                e.target.parentElement.style.borderColor = e.target.checked ? 'var(--sena-green-pastel)' : '#e5e7eb';
                            });
                        });
                    },
                    preConfirm: () => {
                        const title = document.getElementById('swal-title').value.trim();
                        const description = document.getElementById('swal-desc').value.trim(); // 🔥 CORREGIDO: description en vez de body
                        const userIds = Array.from(document.querySelectorAll('input[name="swal-est-select"]:checked')).map(cb => cb.value);
                        
                        if (!title) { Swal.showValidationMessage('El título es obligatorio'); return false; }
                        if (!description) { Swal.showValidationMessage('La descripción es obligatoria'); return false; }
                        if (userIds.length === 0) { Swal.showValidationMessage('Selecciona al menos un estudiante'); return false; }
                        
                        return { title, description, userIds }; // 🔥 CORREGIDO
                    }
                });

                if (formValues) {
                    try {
                        Swal.showLoading();
                        // Enviamos TITLE y DESCRIPTION (No body)
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
                const result = await Swal.fire({ title: '¿Eliminar tarea?', text: "Esta acción es irreversible", icon: 'warning', showCancelButton: true, confirmButtonColor: 'var(--danger)', confirmButtonText: 'Sí, eliminar' });
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
// MÓDULO DE ADMINISTRACIÓN DE USUARIOS (VISTA DEDICADA)
// ============================================================
const viewAdminUsers = document.getElementById('view-admin-users');
const btnVolverProfesor = document.getElementById('btnVolverProfesor');
const tbodyUsuariosAdmin = document.getElementById('tbodyUsuariosAdmin');

// Navegación: Volver al dashboard de tareas
if (btnVolverProfesor) {
    btnVolverProfesor.addEventListener('click', () => {
        viewAdminUsers.classList.add('hidden');
        viewDashboard.classList.remove('hidden');
    });
}

// Función Principal: Cargar y pintar la tabla
window.abrirPanelUsuarios = async function() {
    viewDashboard.classList.add('hidden');
    viewAdminUsers.classList.remove('hidden');
    tbodyUsuariosAdmin.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Cargando usuarios...</td></tr>';

    try {
        const usuariosList = await fetchTodosLosUsuarios();
        tbodyUsuariosAdmin.innerHTML = '';

        usuariosList.forEach(userItem => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e2e8f0';
            
            const badgeRol = userItem.role === 'admin' ? '<span class="badge badge--progreso">Admin</span>' : '<span class="badge badge--completada">Estudiante</span>';
            const badgeEstado = userItem.status === 'activo' ? '<span class="badge badge--completada">Activo</span>' : '<span class="badge badge--pendiente" style="background-color:#fee2e2; color:#ef4444;">Inactivo</span>';
            const btnEstadoTexto = userItem.status === 'activo' ? 'Desactivar' : 'Activar';
            const btnEstadoClase = userItem.status === 'activo' ? 'btn--danger' : 'btn--primary';

            // Codificamos el objeto completo para pasarlo por HTML
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
            tbodyUsuariosAdmin.appendChild(tr);
        });
    } catch (error) {
        tbodyUsuariosAdmin.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Error al cargar la base de datos.</td></tr>';
    }
};

// Lógica de Edición
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
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: 'var(--sena-green-pastel)',
        confirmButtonText: 'Guardar Cambios',
        preConfirm: () => {
            return {
                name: document.getElementById('swal-u-name').value.trim(),
                document: document.getElementById('swal-u-doc').value.trim(),
                role: document.getElementById('swal-u-role').value,
                // Mantenemos los datos obligatorios para evitar el Error 500
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
        } catch (error) {
            showErrorToast('Error al actualizar');
        }
    }
};

// Lógica de Cambio de Estado
window.cambiarEstadoUI = async function(userDataEncoded) {
    const userObject = JSON.parse(decodeURIComponent(userDataEncoded));
    const nextStatus = userObject.status === 'activo' ? 'inactivo' : 'activo';
    const actionText = nextStatus === 'inactivo' ? 'desactivar' : 'activar';
    
    const result = await Swal.fire({
        title: 'Confirmar acción',
        text: `¿Deseas ${actionText} a este usuario?`,
        showCancelButton: true,
        confirmButtonColor: nextStatus === 'inactivo' ? 'var(--danger)' : 'var(--sena-green-pastel)',
        confirmButtonText: `Sí, ${actionText}`
    });

    if (result.isConfirmed) {
        try {
            // Reconstruimos el usuario completo con el nuevo estado
            const updatedUserPayload = {
                name: userObject.name,
                document: userObject.document,
                email: userObject.email,
                role: userObject.role,
                status: nextStatus
            };
            
            await actualizarUsuario(userObject.id, updatedUserPayload);
            showSuccessToast(`Usuario ${nextStatus} correctamente`);
            abrirPanelUsuarios(); 
        } catch (error) {
            showErrorToast('Error al procesar la solicitud');
        }
    }
};
// Lógica de Creación (Nuevo Usuario)
window.crearUsuarioUI = async function() {
    const { value: formValues } = await Swal.fire({
        title: 'Crear Nuevo Usuario',
        html: `
            <div class="swal-admin-form">
                <label>Nombre Completo</label>
                <input id="swal-c-name" class="swal2-input" placeholder="Ej: Juan Pérez">
                
                <label>Documento de Identidad</label>
                <input id="swal-c-doc" class="swal2-input" type="number" placeholder="Ej: 1098765432">
                
                <label>Correo Electrónico</label>
                <input id="swal-c-email" class="swal2-input" type="email" placeholder="Ej: juan@sena.edu.co">
                
                <label>Rol en el Sistema</label>
                <select id="swal-c-role" class="swal2-select">
                    <option value="user">Estudiante</option>
                    <option value="admin">Profesor (Admin)</option>
                </select>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#7c3aed',
        confirmButtonText: 'Crear Usuario',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const name = document.getElementById('swal-c-name').value.trim();
            const documentVal = document.getElementById('swal-c-doc').value.trim();
            const email = document.getElementById('swal-c-email').value.trim();
            const role = document.getElementById('swal-c-role').value;

            if (!name || !documentVal || !email) {
                Swal.showValidationMessage('Por favor completa todos los campos');
                return false;
            }
            return { name, document: documentVal, email, role };
        }
    });

    if (formValues) {
        try {
            Swal.showLoading();
            await crearUsuario(formValues);
            showSuccessToast('Usuario creado exitosamente');
            abrirPanelUsuarios(); // Recargamos la tabla para ver al nuevo usuario
        } catch (error) {
            showErrorToast('Error al crear: Verifica que el documento o correo no existan ya.');
        }
    }
};