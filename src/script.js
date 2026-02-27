/**
 * ============================================
 * EJERCICIO DE MANIPULACIÓN DEL DOM
 * ============================================
 * * Objetivo: Aplicar conceptos del DOM para seleccionar elementos,
 * responder a eventos y crear nuevos elementos dinámicamente.
 * * Autor: Paulo Pacheco, Ana Isabella Garcia Rozo, Fernando Andrés Rodríguez Salamanca
 * Fecha: 11/02/26
 * ============================================
 */

// ============================================
// 1. IMPORTACIONES GLOBALES
// ============================================
import { isValidInput, showError, clearError } from './utils/domHelpers.js';
import { procesarBusqueda, procesarNuevaTarea, procesarEliminacion, procesarActualizacion, ordenarTareas, filtrarTareasPorEstado } from './services/tareasService.js';
import { createUserCard, renderTaskForm, createErrorCard } from './ui/tareasView.js';
import { showSuccessToast, showErrorToast, showInfoToast } from './ui/components/toast.js';
import { showConfirmModal, showCustomModal } from './ui/components/modal.js';

// ============================================
// 2. SELECCIÓN DE ELEMENTOS DEL DOM Y ESTADOS
// ============================================
const searchForm = document.getElementById('searchForm');
const documentoInput = document.getElementById('documento');
const documentoError = document.getElementById('documentoError');
const resultadoUsuario = document.getElementById('resultadoUsuario');

// Estados globales de la interfaz (Filtro y Orden)
let criterioGlobal = "fecha"; 
let estadoFiltroGlobal = "todos";

// ============================================
// 3. FUNCIONES DE RENDERIZADO Y LÓGICA
// ============================================
function actualizarPantalla(usuario, todasLasTareas) {
    resultadoUsuario.innerHTML = "";

    // 1. Aplicar filtro avanzado por estado
    const tareasFiltradas = filtrarTareasPorEstado(todasLasTareas, estadoFiltroGlobal);
    // 2. Aplicar ordenamiento dinámico
    const tareasAMostrar = ordenarTareas(tareasFiltradas, criterioGlobal);

    const card = createUserCard(
        usuario,
        todasLasTareas,   
        tareasAMostrar,   
        estadoFiltroGlobal,
        criterioGlobal, 
        
        // Callback 1: Crear Tarea
        (usuarioActual) => {
            resultadoUsuario.innerHTML = ""; 
            const form = renderTaskForm(
                usuarioActual,
                async (datos) => {
                    try {
                        const nuevasTareas = await procesarNuevaTarea(usuarioActual.id, datos.title, datos.body);
                        actualizarPantalla(usuarioActual, nuevasTareas);
                        showSuccessToast("Tarea creada correctamente"); 
                    } catch (error) {
                        showErrorToast("Error al crear la tarea");
                    }
                },
                () => {
                    actualizarPantalla(usuario, todasLasTareas);
                }
            );
            resultadoUsuario.appendChild(form);
        },
        
        // Callback 2: Editar Tarea
        async (tarea) => {
            const formEdit = document.createElement('div');
            formEdit.innerHTML = `
                <div class="form__group">
                    <label class="form__label">Título</label>
                    <input type="text" id="editTitle" class="form__input" value="${tarea.title}">
                </div>
                <div class="form__group" style="margin-top: 15px;">
                    <label class="form__label">Descripción</label>
                    <textarea id="editBody" class="form__input form__textarea">${tarea.body || ''}</textarea>
                </div>
            `;
            
            const confirmado = await showCustomModal("Editar Tarea", formEdit, true);
            
            if (confirmado) {
                const nuevoTitulo = formEdit.querySelector('#editTitle').value.trim();
                const nuevoBody = formEdit.querySelector('#editBody').value.trim();
                
                if (!nuevoTitulo) return showErrorToast("El título no puede estar vacío");
                
                try {
                    const tareasActualizadas = await procesarActualizacion(tarea.id, usuario.id, { 
                        title: nuevoTitulo, 
                        body: nuevoBody 
                    });
                    actualizarPantalla(usuario, tareasActualizadas);
                    showSuccessToast("Tarea actualizada correctamente");
                } catch (error) {
                    showErrorToast("Error al editar la tarea");
                }
            }
        },
        
        // Callback 3: Cambiar Estado
        async (tarea) => {
            let nuevoEstado;
            if (tarea.status === "pendiente") nuevoEstado = "en proceso";
            else if (tarea.status === "en proceso") nuevoEstado = "completada";
            else nuevoEstado = "pendiente";

            try {
                const tareasActualizadas = await procesarActualizacion(tarea.id, usuario.id, { 
                    status: nuevoEstado 
                });
                actualizarPantalla(usuario, tareasActualizadas);
                showInfoToast(`Tarea en estado: ${nuevoEstado}`);
            } catch (error) {
                showErrorToast("Error al cambiar el estado");
            }
        },
        
        // Callback 4: Eliminar Tarea
        async (tarea) => {
            const confirmado = await showConfirmModal("Eliminar Tarea", `¿Seguro que deseas borrar "${tarea.title}"?`);
            if (confirmado) {
                try {
                    const nuevasTareas = await procesarEliminacion(tarea.id, usuario.id);
                    actualizarPantalla(usuario, nuevasTareas);
                    showSuccessToast("Tarea eliminada correctamente");
                } catch (error) {
                    showErrorToast("Error al eliminar la tarea");
                }
            }
        },

        // Callback 5: Filtrar por Estado
        (nuevoFiltro) => {
            estadoFiltroGlobal = nuevoFiltro;
            actualizarPantalla(usuario, todasLasTareas);
        },

        // Callback 6: Ordenar
        (nuevoCriterio) => {
            criterioGlobal = nuevoCriterio;
            actualizarPantalla(usuario, todasLasTareas);
        }
    );

    resultadoUsuario.appendChild(card);
}

// ============================================
// 4. MANEJO DE EVENTOS (BÚSQUEDA)
// ============================================
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const documento = documentoInput.value.trim();

    if (!isValidInput(documento)) {
        showError(documentoError, "El documento es obligatorio");
        documentoInput.classList.add("error");
        return;
    }

    // Al buscar un nuevo usuario, se reinician los controles a su estado por defecto
    estadoFiltroGlobal = "todos";
    criterioGlobal = "fecha";

    try {
        const { usuario, tareas } = await procesarBusqueda(documento);
        actualizarPantalla(usuario, tareas);
        showSuccessToast(`Hola, ${usuario.name}`);
    } catch (error) {
        resultadoUsuario.innerHTML = "";
        resultadoUsuario.appendChild(createErrorCard(error.message));
        showErrorToast("Error en la búsqueda");
    }
});

documentoInput.addEventListener('input', () => {
    clearError(documentoError);
    documentoInput.classList.remove("error");
});