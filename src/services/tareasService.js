import { fetchUsuarioPorDocumento } from '../api/usuariosApi.js';
import { fetchTareasPorUsuario, crearTarea, eliminarTarea } from '../api/tareasApi.js';
import { actualizarTareaApi } from '../api/tareasApi.js'; 

export async function procesarActualizacion(taskId, userId, datosNuevos) {
    await actualizarTareaApi(taskId, datosNuevos);
    return await fetchTareasPorUsuario(userId);
}
export async function procesarBusqueda(documento) {
    const usuario = await fetchUsuarioPorDocumento(documento);
    if (!usuario) {
        throw new Error(`No se encontró ningún usuario con el documento "${documento}".`);
    }
    const tareas = await fetchTareasPorUsuario(usuario.id);
    return { usuario, tareas };
}

export async function procesarNuevaTarea(userId, title, body) {
    await crearTarea(userId, title, body);
    return await fetchTareasPorUsuario(userId); // Retorna la lista actualizada
}

export async function procesarEliminacion(taskId, userId) {
    const exito = await eliminarTarea(taskId);
    if (!exito) throw new Error("Error al eliminar la tarea en el servidor.");
    return await fetchTareasPorUsuario(userId);
}

export function ordenarTareas(tareas, criterio) {
    const tareasCopia = [...tareas]; // Hacemos una copia para no mutar el array original

    switch (criterio) {
        case 'nombre':
            // Orden alfabético por título
            return tareasCopia.sort((a, b) => a.title.localeCompare(b.title));
        case 'estado':
            // Completadas primero (la 'c' va antes que la 'p' de pendiente)
            return tareasCopia.sort((a, b) => a.status.localeCompare(b.status));
        case 'fecha':
        default:
            // Orden cronológico (las más recientes primero, usando el ID mayor)
            return tareasCopia.sort((a, b) => b.id - a.id);
    }
}

