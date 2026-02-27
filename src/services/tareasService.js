import { fetchUsuarioPorDocumento } from '../api/usuariosApi.js';
import { fetchTareasPorUsuario, crearTarea, eliminarTarea, actualizarTarea } from '../api/tareasApi.js';

export async function procesarBusqueda(documento) {
    const usuario = await fetchUsuarioPorDocumento(documento);
    if (!usuario) throw new Error(`No se encontró el documento "${documento}".`);
    const tareas = await fetchTareasPorUsuario(usuario.id);
    return { usuario, tareas };
}

export async function procesarNuevaTarea(userId, title, body) {
    await crearTarea(userId, title, body);
    return await fetchTareasPorUsuario(userId);
}

export async function procesarActualizacion(taskId, userId, datosNuevos) {
    await actualizarTarea(taskId, datosNuevos);
    return await fetchTareasPorUsuario(userId); 
}

export async function procesarEliminacion(taskId, userId) {
    const exito = await eliminarTarea(taskId);
    if (!exito) throw new Error("Error al eliminar.");
    return await fetchTareasPorUsuario(userId);
}

// RF02 - Ordenamiento
export function ordenarTareas(tareas, criterio) {
    const tareasCopia = [...tareas];
    switch (criterio) {
        case 'nombre': return tareasCopia.sort((a, b) => a.title.localeCompare(b.title));
        case 'estado': return tareasCopia.sort((a, b) => a.status.localeCompare(b.status));
        case 'fecha':
        default: return tareasCopia.sort((a, b) => b.id - a.id);
    }
}

// RF01 - Filtrado por Estado
export function filtrarTareasPorEstado(tareas, estado) {
    if (estado === "todos") return tareas;
    return tareas.filter(t => t.status === estado);
}