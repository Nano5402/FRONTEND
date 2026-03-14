import { API_URL } from '../config/constants.js';

export async function fetchTareasPorUsuario(userId) {
    const response = await fetch(`${API_URL}/tasks`);
    const todasLasTareas = await response.json();
    // Filtramos localmente para buscar en el arreglo userIds
    return todasLasTareas.filter(t => t.userIds && t.userIds.includes(String(userId)));
}

export async function fetchTodasLasTareas() {
    const response = await fetch(`${API_URL}/tasks`);
    return await response.json();
}

export async function crearTareaMultiple(title, body, userIds) {
    const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title,
            body,
            userIds,
            status: "pendiente",
            fechaCreacion: new Date().toISOString().split('T')[0]
        })
    });
    return await response.json();
}

export async function eliminarTarea(taskId) {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, { method: "DELETE" });
    return response.ok;
}

export async function actualizarTarea(taskId, campos) {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campos)
    });
    return await response.json();
}

export function prepararExportacion(tareas, usuario) {
    return JSON.stringify({
        exportadoEn: new Date().toISOString(),
        usuario: { id: usuario.id, nombre: usuario.name, documento: usuario.document },
        resumen: { totalTareas: tareas.length },
        tareas
    }, null, 2);
}