// src/api/tareasApi.js

import { API_URL } from '../config/constants.js';

/**
 * Obtiene todas las tareas de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Array} - Lista de tareas
 */
export async function fetchTareasPorUsuario(userId) {
    const response = await fetch(`${API_URL}/tasks?userId=${userId}`);
    const tareas = await response.json();
    return tareas;
}

/**
 * Crea una nueva tarea
 * @param {number} userId - ID del usuario dueño de la tarea
 * @param {string} title - Título de la tarea
 * @param {string} body - Descripción de la tarea
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
    const tareaCreada = await response.json();
    return tareaCreada;
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
    return response.ok; // true si el servidor respondió con éxito
}