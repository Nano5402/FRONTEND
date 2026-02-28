// src/services/tareasService.js
// Capa de servicio: coordina llamadas a API y reglas simples de negocio.

import { fetchUsuarioPorDocumento } from '../api/usuariosApi.js';
import {
    fetchTareasPorUsuario,
    crearTarea,
    eliminarTarea,
    actualizarTarea as actualizarTareaApi
} from '../api/tareasApi.js';

/**
 * Busca un usuario por documento y luego carga sus tareas.
 * Lanza error si el documento no existe.
 */
export async function procesarBusqueda(documento) {
    const usuario = await fetchUsuarioPorDocumento(documento);
    if (!usuario) throw new Error(`No se encontro el documento "${documento}".`);
    const tareas = await fetchTareasPorUsuario(usuario.id);
    return { usuario, tareas };
}

/**
 * Crea una tarea y devuelve la lista de tareas actualizada del usuario.
 */
export async function procesarNuevaTarea(userId, title, body) {
    await crearTarea(userId, title, body);
    return await fetchTareasPorUsuario(userId);
}

/**
 * Actualiza una tarea y devuelve la lista actualizada del usuario.
 */
export async function procesarActualizacion(taskId, userId, datosNuevos) {
    await actualizarTareaApi(taskId, datosNuevos);
    return await fetchTareasPorUsuario(userId);
}

/**
 * Elimina una tarea y devuelve la lista actualizada del usuario.
 */
export async function procesarEliminacion(taskId, userId) {
    const exito = await eliminarTarea(taskId);
    if (!exito) throw new Error('Error al eliminar.');
    return await fetchTareasPorUsuario(userId);
}

/**
 * Ordena tareas segun el criterio seleccionado en pantalla.
 */
export function ordenarTareas(tareas, criterio) {
    const tareasCopia = [...tareas];
    switch (criterio) {
        case 'nombre':
            return tareasCopia.sort((a, b) => a.title.localeCompare(b.title));
        case 'estado':
            return tareasCopia.sort((a, b) => a.status.localeCompare(b.status));
        case 'fecha':
        default:
            return tareasCopia.sort((a, b) => b.id - a.id);
    }
}

/**
 * Filtra tareas por estado.
 * Si el estado es "todos", retorna la lista completa.
 */
export function filtrarTareasPorEstado(tareas, estado) {
    if (estado === 'todos') return tareas;
    return tareas.filter((t) => t.status === estado);
}