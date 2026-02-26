import { API_URL } from '../config/constants.js';

export async function fetchTareasPorUsuario(userId) {
    const response = await fetch(`${API_URL}/tasks?userId=${userId}`);
    return await response.json();
}

export async function crearTarea(userId, title, body) {
    const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId,
            title,
            body,
            status: "pendiente"
        })
    });
    return await response.json();
}

export async function eliminarTarea(taskId) {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "DELETE"
    });
    return response.ok; 
}

export async function actualizarTareaApi(taskId, datosNuevos) {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosNuevos)
    });
    return await response.json();
}