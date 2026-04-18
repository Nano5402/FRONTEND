import { API_URL } from '../config/constants.js';
import { senaFetch } from './apiClient.js'; // 🔥 Importamos el interceptor

function adaptarTarea(tarea) {
    const idNumerico = tarea.userId ? Number(tarea.userId) : null;
    return {
        ...tarea,
        userId: idNumerico, 
        userIds: idNumerico ? [idNumerico] : [] 
    };
}

export async function fetchTareasPorUsuario(userId) {
    const response = await senaFetch(`${API_URL}/users/${userId}/tasks`, { 
        method: "GET",
        cache: "no-store" 
    });
    if (!response.ok) throw new Error("Error al obtener tareas del usuario");
    
    const json = await response.json();
    const data = json.data || json;
    return Array.isArray(data) ? data.map(adaptarTarea) : [];
}

export async function fetchTodasLasTareas() {
    const response = await senaFetch(`${API_URL}/tasks`, { 
        method: "GET",
        cache: "no-store" 
    });
    if (!response.ok) throw new Error("Error al obtener todas las tareas");
    
    const json = await response.json();
    const data = json.data || json;
    return Array.isArray(data) ? data.map(adaptarTarea) : [];
}

export async function crearTareaMultiple(title, body, userIds) {
    const response = await senaFetch(`${API_URL}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title, description: body, userIds }) 
    });
    return await response.json();
}

export async function eliminarTarea(taskId) {
    const response = await senaFetch(`${API_URL}/tasks/${taskId}`, { 
        method: "DELETE"
    });
    return response.ok;
}

export async function actualizarTarea(taskId, campos) {
    if (campos.status && Object.keys(campos).length === 1) {
        const response = await senaFetch(`${API_URL}/tasks/${taskId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: campos.status })
        });
        return await response.json();
    } else {
        const response = await senaFetch(`${API_URL}/tasks/${taskId}`, {
            method: "PUT",
            body: JSON.stringify(campos)
        });
        return await response.json();
    }
}

export function prepararExportacion(tareas, usuario) {
    return JSON.stringify({
        exportadoEn: new Date().toISOString(),
        usuario: usuario.name,
        rol: usuario.role,
        totalTareas: tareas.length,
        tareas: tareas
    }, null, 2);
}

export async function eliminarMultiplesTareas(taskIds) {
    try {
        const promesasEliminacion = taskIds.map(id => eliminarTarea(id));
        await Promise.all(promesasEliminacion);
        return true;
    } catch (error) {
        console.error("Error en borrado masivo:", error);
        throw new Error("Algunas tareas no pudieron ser eliminadas");
    }
}