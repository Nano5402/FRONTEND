// src/api/tareasApi.js
// RESPONSABILIDAD: comunicación con el servidor para tareas
// + preparación de datos para exportación (RF04)
// REGLA: ninguna línea toca el DOM — sin document, sin innerHTML

import { API_URL } from '../config/constants.js';

/**
 * Obtiene todas las tareas de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Array} - Lista de tareas
 */
export async function fetchTareasPorUsuario(userId) {
    const response = await fetch(`${API_URL}/tasks?userId=${userId}`);
    return await response.json();
}

/**
 * Crea una nueva tarea en el servidor
 * @param {number} userId - ID del usuario dueño
 * @param {string} title  - Título de la tarea
 * @param {string} body   - Descripción de la tarea
 * @returns {Object} - La tarea recién creada
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
 * Elimina una tarea por su ID
 * @param {number} taskId - ID de la tarea a eliminar
 * @returns {boolean} - true si se eliminó correctamente
 */
export async function eliminarTarea(taskId) {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "DELETE"
    });
    return response.ok;
}

/**
 * Actualiza campos de una tarea existente
 * @param {number} taskId - ID de la tarea
 * @param {Object} campos - Campos a actualizar ej: { status, title, body }
 * @returns {Object} - La tarea actualizada
 */
export async function actualizarTarea(taskId, campos) {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campos)
    });
    return await response.json();
}

// ============================================================
// RF04 — PREPARACIÓN DE DATOS PARA EXPORTACIÓN
// Vive aquí porque es transformación pura de datos
// No tiene document, innerHTML ni contacto con el DOM
// ============================================================

/**
 * RF04 - Prepara los datos de tareas para exportación en JSON
 * @param {Array}  tareas  - Array de tareas visibles en pantalla
 * @param {Object} usuario - Datos del usuario dueño de las tareas
 * @returns {string} - String JSON formateado listo para guardar
 */
export function prepararExportacion(tareas, usuario) {
    const exportData = {
        exportadoEn: new Date().toISOString(),
        usuario: {
            id:        usuario.id,
            nombre:    usuario.name,
            documento: usuario.document,
            correo:    usuario.email
        },
        resumen: {
            totalTareas: tareas.length,
            pendientes:  tareas.filter(t => t.status === "pendiente").length,
            enProceso:   tareas.filter(t => t.status === "en proceso").length,
            completadas: tareas.filter(t => t.status === "completada").length
        },
        tareas: tareas
    };

    // null, 2 → agrega sangría para que el archivo sea legible por humanos
    return JSON.stringify(exportData, null, 2);
}