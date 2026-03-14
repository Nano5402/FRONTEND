// src/services/tareasService.js
import { fetchUsuarioPorDocumento, fetchTodosLosUsuarios } from '../api/usuariosApi.js';
import { fetchTareasPorUsuario, eliminarTarea, actualizarTarea as actualizarTareaApi, fetchTodasLasTareas } from '../api/tareasApi.js';

export async function procesarBusqueda(documento) {
    const usuario = await fetchUsuarioPorDocumento(documento);
    if (!usuario) throw new Error(`No se encontró el documento "${documento}".`);
    const tareas = await fetchTareasPorUsuario(usuario.id);
    return { usuario, tareas };
}

export async function procesarActualizacion(taskId, userId, datosNuevos) {
    await actualizarTareaApi(taskId, datosNuevos);
    return await fetchTareasPorUsuario(userId);
}

export async function procesarEliminacion(taskId, userId) {
    const exito = await eliminarTarea(taskId);
    if (!exito) throw new Error('Error al eliminar.');
    return await fetchTareasPorUsuario(userId);
}

// Sistema de ordenamiento avanzado
export function ordenarTareas(tareas, criterio) {
    const tareasCopia = [...tareas];
    switch (criterio) {
        case 'az': return tareasCopia.sort((a, b) => a.title.localeCompare(b.title));
        case 'za': return tareasCopia.sort((a, b) => b.title.localeCompare(a.title));
        case 'estado': return tareasCopia.sort((a, b) => a.status.localeCompare(b.status));
        case 'fecha_asc': return tareasCopia.sort((a, b) => a.id - b.id); // Más antiguas primero
        case 'fecha_desc':
        default: return tareasCopia.sort((a, b) => b.id - a.id); // Más recientes primero
    }
}

export function filtrarTareasPorEstado(tareas, estado) {
    if (estado === 'todos') return tareas;
    return tareas.filter(tarea => tarea.status === estado);
}

export async function procesarDashboardProfesor() {
    const todosLosUsuarios = await fetchTodosLosUsuarios();
    // Filtramos del ID 1 al 9 como estudiantes
    const estudiantes = todosLosUsuarios.filter(u => Number(u.id) >= 1 && Number(u.id) <= 9);
    const tareasGlobales = await fetchTodasLasTareas();
    return { estudiantes, tareasGlobales };
}