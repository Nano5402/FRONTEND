import { API_URL } from '../config/constants.js';
import { getAuthHeaders } from './usuariosApi.js';

// 🛡️ ADAPTADOR: Disfraza la tarea de MySQL para la UI y fuerza los tipos de datos
function adaptarTarea(tarea) {
    // Forzamos matemáticamente a que los IDs sean números (Number) para que el filtro no falle
    const idNumerico = tarea.userId ? Number(tarea.userId) : null;
    
    return {
        ...tarea,
        userId: idNumerico, // Aseguramos el ID principal
        userIds: idNumerico ? [idNumerico] : [] // Aseguramos el array para tu lógica de UI
    };
}

export async function fetchTareasPorUsuario(userId) {
    const response = await fetch(`${API_URL}/users/${userId}/tasks`, { 
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store" 
    });
    if (!response.ok) throw new Error("Error al obtener tareas");
    const json = await response.json();
    const dataArray = json.data || json; // Escudo protector
    return Array.isArray(dataArray) ? dataArray.map(adaptarTarea) : [];
}

export async function fetchTodasLasTareas() {
    const response = await fetch(`${API_URL}/tasks`, { 
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store" 
    });
    if (!response.ok) throw new Error("Error al obtener todas las tareas");
    const json = await response.json();
    const dataArray = json.data || json;
    return Array.isArray(dataArray) ? dataArray.map(adaptarTarea) : [];
}

export async function crearTareaMultiple(title, body, userIds) {
    const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, description: body, userIds }) // "body" pasa a "description" para MySQL
    });
    return await response.json();
}

export async function eliminarTarea(taskId) {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, { 
        method: "DELETE", 
        headers: getAuthHeaders() 
    });
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

export async function eliminarMultiplesTareas(taskIds) {
    try {
        // Ejecuta todas las peticiones DELETE al mismo tiempo
        const promesasEliminacion = taskIds.map(id => eliminarTarea(id));
        await Promise.all(promesasEliminacion);
        return true;
    } catch (error) {
        console.error("Error en borrado masivo:", error);
        throw new Error("Algunas tareas no pudieron ser eliminadas");
    }
}