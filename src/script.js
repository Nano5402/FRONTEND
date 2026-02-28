// src/script.js
// Archivo principal de la aplicacion.
// Coordina eventos de la interfaz, servicios y renderizado en pantalla.

// ============================================================
// 1) IMPORTACIONES
// ============================================================

import { showSuccessToast, showErrorToast, showInfoToast, showWarningToast } from './ui/components/notificaciones.js';
import { isValidInput, showError, clearError } from './utils/domHelpers.js';
import {
    procesarBusqueda,
    procesarNuevaTarea,
    procesarEliminacion,
    procesarActualizacion,
    ordenarTareas,
    filtrarTareasPorEstado
} from './services/tareasService.js';
import { createUserCard, renderTaskForm, createErrorCard } from './ui/tareasView.js';
import { showConfirmModal, showCustomModal } from './ui/components/modal.js';
import { prepararExportacion } from './api/index.js';
import { descargarJSON } from './ui/exportUI.js';

// ============================================================
// 2) ELEMENTOS DEL DOM Y ESTADO GLOBAL
// ============================================================
const searchForm = document.getElementById('searchForm');
const documentoInput = document.getElementById('documento');
const documentoError = document.getElementById('documentoError');
const resultadoUsuario = document.getElementById('resultadoUsuario');

// Estado actual de filtro y orden en la vista.
let criterioGlobal = 'fecha';
let estadoFiltroGlobal = 'todos';

// ============================================================
// 3) FUNCION PRINCIPAL DE RENDERIZADO
// ============================================================
/**
 * Actualiza toda la zona de resultados para un usuario.
 * Aplica filtro + orden y reconstruye la tarjeta en pantalla.
 */
function actualizarPantalla(usuario, todasLasTareas) {
    resultadoUsuario.innerHTML = '';

    // Primero se filtra y luego se ordena lo que se va a mostrar.
    const tareasFiltradas = filtrarTareasPorEstado(todasLasTareas, estadoFiltroGlobal);
    const tareasAMostrar = ordenarTareas(tareasFiltradas, criterioGlobal);

    const card = createUserCard(
        usuario,
        todasLasTareas,
        tareasAMostrar,
        estadoFiltroGlobal,
        criterioGlobal,

        // 1) Crear tarea
        (usuarioActual) => {
            resultadoUsuario.innerHTML = '';

            const form = renderTaskForm(
                usuarioActual,
                async (datos) => {
                    try {
                        const nuevasTareas = await procesarNuevaTarea(
                            usuarioActual.id,
                            datos.title,
                            datos.body
                        );
                        actualizarPantalla(usuarioActual, nuevasTareas);
                        showSuccessToast('Tarea creada correctamente');
                    } catch (error) {
                        showErrorToast('Error al crear la tarea');
                    }
                },
                () => {
                    actualizarPantalla(usuario, todasLasTareas);
                }
            );

            resultadoUsuario.appendChild(form);
        },

        // 2) Editar tarea
        async (tarea) => {
            const formEdit = document.createElement('div');
            formEdit.innerHTML = `
                <div class="form__group">
                    <label class="form__label">Titulo</label>
                    <input type="text" id="editTitle" class="form__input" value="${tarea.title}">
                </div>
                <div class="form__group" style="margin-top: 15px;">
                    <label class="form__label">Descripcion</label>
                    <textarea id="editBody" class="form__input form__textarea">${tarea.body || ''}</textarea>
                </div>
            `;

            const confirmado = await showCustomModal('Editar Tarea', formEdit, true);

            if (confirmado) {
                const nuevoTitulo = formEdit.querySelector('#editTitle').value.trim();
                const nuevoBody = formEdit.querySelector('#editBody').value.trim();

                if (!nuevoTitulo) return showErrorToast('El titulo no puede estar vacio');

                try {
                    const tareasActualizadas = await procesarActualizacion(tarea.id, usuario.id, {
                        title: nuevoTitulo,
                        body: nuevoBody
                    });
                    actualizarPantalla(usuario, tareasActualizadas);
                    showSuccessToast('Tarea actualizada correctamente');
                } catch (error) {
                    showErrorToast('Error al editar la tarea');
                }
            }
        },

        // 3) Cambiar estado de tarea
        async (tarea) => {
            let nuevoEstado;
            if (tarea.status === 'pendiente') nuevoEstado = 'en proceso';
            else if (tarea.status === 'en proceso') nuevoEstado = 'completada';
            else nuevoEstado = 'pendiente';

            try {
                const tareasActualizadas = await procesarActualizacion(tarea.id, usuario.id, {
                    status: nuevoEstado
                });
                actualizarPantalla(usuario, tareasActualizadas);
                showInfoToast(`Tarea en estado: ${nuevoEstado}`);
            } catch (error) {
                showErrorToast('Error al cambiar el estado');
            }
        },

        // 4) Eliminar tarea
        async (tarea) => {
            const confirmado = await showConfirmModal(
                'Eliminar Tarea',
                `¿Seguro que deseas borrar "${tarea.title}"?`
            );

            if (confirmado) {
                try {
                    const nuevasTareas = await procesarEliminacion(tarea.id, usuario.id);
                    actualizarPantalla(usuario, nuevasTareas);
                    showSuccessToast('Tarea eliminada correctamente');
                } catch (error) {
                    showErrorToast('Error al eliminar la tarea');
                }
            }
        },

        // 5) Filtrar por estado
        (nuevoFiltro) => {
            estadoFiltroGlobal = nuevoFiltro;
            actualizarPantalla(usuario, todasLasTareas);
        },

        // 6) Ordenar tareas
        (nuevoCriterio) => {
            criterioGlobal = nuevoCriterio;
            actualizarPantalla(usuario, todasLasTareas);
        },

        // 7) Exportar tareas visibles
        (tareasVisibles) => {
            const contenido = prepararExportacion(tareasVisibles, usuario);
            const nombreArchivo = `tareas-${usuario.document}-${Date.now()}.json`;
            descargarJSON(contenido, nombreArchivo);
        }
    );

    resultadoUsuario.appendChild(card);
}

// ============================================================
// 4) EVENTO DE BUSQUEDA DE USUARIO
// ============================================================
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const documento = documentoInput.value.trim();

    // Validacion basica del campo de documento.
    if (!isValidInput(documento)) {
        showError(documentoError, 'El documento es obligatorio');
        documentoInput.classList.add('error');
        return;
    }

    // Reinicia controles visuales cuando se busca otro usuario.
    estadoFiltroGlobal = 'todos';
    criterioGlobal = 'fecha';

    try {
        const { usuario, tareas } = await procesarBusqueda(documento);
        actualizarPantalla(usuario, tareas);
        showSuccessToast(`Hola, ${usuario.name}`);
    } catch (error) {
        resultadoUsuario.innerHTML = '';
        resultadoUsuario.appendChild(createErrorCard(error.message));
        showErrorToast('Error en la busqueda');
    }
});

// Limpia el mensaje de error mientras el usuario escribe.
documentoInput.addEventListener('input', () => {
    clearError(documentoError);
    documentoInput.classList.remove('error');
});