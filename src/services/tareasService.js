import { fetchTodosLosUsuarios } from '../api/usuariosApi.js';
import { fetchTareasPorUsuario, eliminarTarea, actualizarTarea as actualizarTareaApi, fetchTodasLasTareas } from '../api/tareasApi.js';

export async function procesarActualizacion(taskId, userId, datosNuevos) {
    await actualizarTareaApi(taskId, datosNuevos);
    return await fetchTareasPorUsuario(userId);
}

export async function procesarEliminacion(taskId, userId) {
    const exito = await eliminarTarea(taskId);
    if (!exito) throw new Error('Error al eliminar.');
    return await fetchTareasPorUsuario(userId);
}

export function ordenarTareas(tareas, criterio) {
    const tareasCopia = [...tareas];
    switch (criterio) {
        case 'az':         return tareasCopia.sort((a, b) => a.title.localeCompare(b.title));
        case 'za':         return tareasCopia.sort((a, b) => b.title.localeCompare(a.title));
        case 'estado':     return tareasCopia.sort((a, b) => a.status.localeCompare(b.status));
        case 'fecha_asc':  return tareasCopia.sort((a, b) => a.id - b.id);
        case 'fecha_desc':
        default:           return tareasCopia.sort((a, b) => b.id - a.id);
    }
}

export function filtrarTareasPorEstado(tareas, estado) {
    if (estado === 'todos') return tareas;
    return tareas.filter(tarea => tarea.status === estado);
}

export async function procesarDashboardProfesor() {
    const todosLosUsuarios = await fetchTodosLosUsuarios();
    const todasLasTareas   = await fetchTodasLasTareas();

    if (!Array.isArray(todosLosUsuarios)) throw new Error("Los usuarios no cargaron correctamente");
    if (!Array.isArray(todasLasTareas))   throw new Error("Las tareas no cargaron correctamente");

    // ✅ FIX: el backend ahora devuelve role='user' (normalizado) para los estudiantes.
    // Antes filtraba por role_name === 'Estudiante' (mayúscula) y no encontraba nada.
    const estudiantesActivos = todosLosUsuarios.filter(u =>
        u.role === 'user' && u.status === 'activo'
    );

    return {
        estudiantes: estudiantesActivos,
        tareasGlobales: todasLasTareas
    };
}