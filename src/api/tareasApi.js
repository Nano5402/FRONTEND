import { API_URL } from '../config/constants.js';
import { getAuthHeaders } from './usuariosApi.js';

// 🛡️ ADAPTADOR: Disfraza la tarea de MySQL para la UI
function adaptarTarea(tarea) {
    const idNumerico = tarea.userId ? Number(tarea.userId) : null;
    return {
        ...tarea,
        userId: idNumerico, 
        userIds: idNumerico ? [idNumerico] : [] 
    };
}

export async function fetchTareasPorUsuario(userId) {
    const response = await fetch(`${API_URL}/users/${userId}/tasks`, { 
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store" 
    });
    if (!response.ok) throw new Error("Error al obtener tareas del usuario");
    
    const json = await response.json();
    // Verificamos que success sea true y extraemos json.data
    return json.success && Array.isArray(json.data) ? json.data.map(adaptarTarea) : [];
}

export async function fetchTodasLasTareas() {
    const response = await fetch(`${API_URL}/tasks`, { 
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store" 
    });
    if (!response.ok) throw new Error("Error al obtener todas las tareas");
    
    const json = await response.json();
    return json.success && Array.isArray(json.data) ? json.data.map(adaptarTarea) : [];
}

export async function crearTareaMultiple(title, body, userIds) {
    const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, description: body, userIds }) 
    });
    return await response.json();
}

export async function eliminarTarea(taskId) {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, { 
        method: "DELETE", 
        headers: getAuthHeaders() 
    });
    // Si la respuesta es 200, retornamos true.
    return response.ok;
}

export async function actualizarTarea(taskId, campos) {
    if (campos.status && Object.keys(campos).length === 1) {
        const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: campos.status })
        });
        return await response.json();
    } else {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
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