// src/api/tareasApi.js
// Capa de acceso a datos de tareas.
// Aquí se hacen peticiones al servidor y transformaciones de datos para exportar.

import { API_URL } from '../config/constants.js';

/**
 * Trae todas las tareas de un usuario.
 */
export async function fetchTareasPorUsuario(userId) {
    const response = await fetch(`${API_URL}/tasks?userId=${userId}`);
    return await response.json();
}

/**
 * Crea una tarea nueva para un usuario.
 */
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

/**
 * Elimina una tarea por su ID.
 * Retorna true cuando el servidor confirma la eliminación.
 */
export async function eliminarTarea(taskId) {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "DELETE"
    });
    return response.ok;
}

/**
 * Actualiza uno o varios campos de una tarea.
 */
export async function actualizarTarea(taskId, campos) {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campos)
    });
    return await response.json();
}

/**
 * Prepara un JSON legible con tareas y resumen general.
 * Entrada: tareas visibles y datos del usuario.
 * Salida: texto JSON listo para descargar.
 */
export function prepararExportacion(tareas, usuario) {
    const exportData = {
        exportadoEn: new Date().toISOString(),
        usuario: {
            id: usuario.id,
            nombre: usuario.name,
            documento: usuario.document,
            correo: usuario.email
        },
        resumen: {
            totalTareas: tareas.length,
            pendientes: tareas.filter((t) => t.status === "pendiente").length,
            enProceso: tareas.filter((t) => t.status === "en proceso").length,
            completadas: tareas.filter((t) => t.status === "completada").length
        },
        tareas: tareas
    };

    // null, 2 agrega sangría para que el archivo sea fácil de leer.
    return JSON.stringify(exportData, null, 2);
}
