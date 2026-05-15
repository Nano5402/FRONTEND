/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  api/tasks.api.js — PETICIONES DE TAREAS                             ║
 * ║                                                                      ║
 * ║  CAMBIO REALIZADO EN ESTA VERSIÓN:                                   ║
 * ║                                                                      ║
 * ║  getTasksByUser() — nueva estrategia de petición:                    ║
 * ║                                                                      ║
 * ║  ANTES (versión anterior):                                           ║
 * ║    → Llamaba a GET /tasks (traía TODAS las tareas del sistema)       ║
 * ║    → Filtraba en el frontend: all.filter(t => t.userId === userId)   ║
 * ║    ❌ Problema: el estudiante recibía datos de otros estudiantes      ║
 * ║       (aunque los descartara, era un problema de seguridad)          ║
 * ║    ❌ Problema: requería permiso TASKS_READ_ALL que el estudiante     ║
 * ║       no tiene → daba 403 Forbidden                                  ║
 * ║                                                                      ║
 * ║  AHORA (versión actual):                                             ║
 * ║    → Llama a GET /users/:id/tasks (ruta específica del estudiante)   ║
 * ║    → El backend devuelve SOLO las tareas de ese usuario              ║
 * ║    ✅ Más seguro: el estudiante nunca ve datos de otros              ║
 * ║    ✅ Usa permiso TASKS_READ_OWN que el estudiante sí tiene          ║
 * ║    ✅ Menos datos transferidos por la red                             ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { API_URL }   from '../config/constants.js';
import { senaFetch } from './client.js';

/**
 * _adapt(tarea) — normalización interna
 * Asegura que userId siempre sea número y agrega userIds (array)
 * para compatibilidad con funciones que esperan array de IDs.
 *
 * Antes: { id: 1, title: 'Tarea', userId: '5' }
 * Después: { id: 1, title: 'Tarea', userId: 5, userIds: [5] }
 */
function _adapt(t) {
    const id = t.userId ? Number(t.userId) : null;
    return { ...t, userId: id, userIds: id ? [id] : [] };
}

/**
 * getTasks()
 * Trae TODAS las tareas del sistema.
 * Solo accesible para admin e instructores (requiere TASKS_READ_ALL).
 * El estudiante NO puede llamar esta función.
 */
export async function getTasks() {
    const res  = await senaFetch(`${API_URL}/tasks`, { method: 'GET', cache: 'no-store' });
    if (!res.ok) throw new Error('Error al obtener tareas');
    const json = await res.json();
    const data = Array.isArray(json) ? json : (json.data || []);
    return data.map(_adapt);
}

/**
 * getTasksByUser(userId)
 * Trae SOLO las tareas de un usuario específico.
 * Se usa en el StudentDashboard para mostrar las tareas del estudiante logueado.
 *
 * CAMBIO: Ahora usa la ruta GET /users/:id/tasks en lugar de filtrar en el frontend.
 *
 * RUTA DEL BACKEND: GET /users/:id/tasks
 * Esta ruta está en users.routes.js y solo requiere verifyToken (no TASKS_READ_ALL).
 * El controlador getUserTasks en users.controller.js hace:
 *   SELECT * FROM tasks WHERE userId = req.params.id
 *
 * @param {number} userId - ID del estudiante logueado
 */
export async function getTasksByUser(userId) {
    const res = await senaFetch(`${API_URL}/users/${userId}/tasks`, {
        method: 'GET',
        cache:  'no-store',
    });

    if (!res.ok) throw new Error('Error al obtener las tareas del estudiante');

    const json = await res.json();
    const data = Array.isArray(json) ? json : (json.data || []);

    // Normalizamos igual que en getTasks para consistencia
    return data.map(_adapt);
}

/**
 * createTask(title, description, userIds)
 * Crea una tarea y la asigna a uno o varios estudiantes.
 * El backend crea UNA tarea por cada userId del array.
 *
 * @param {string}   title       - Título (mínimo 5 caracteres)
 * @param {string}   description - Instrucciones (opcional)
 * @param {number[]} userIds     - IDs de estudiantes: [1, 3, 7]
 */
export async function createTask(title, description, userIds) {
    const res = await senaFetch(`${API_URL}/tasks`, {
        method: 'POST',
        body:   JSON.stringify({ title, description, userIds }),
    });
    return res.json();
}

/**
 * updateTask(id, fields)
 * Actualiza una tarea de forma inteligente:
 * - Solo { status } → PATCH /tasks/:id/status (más eficiente)
 * - Otros campos    → PUT /tasks/:id (actualización completa)
 */
export async function updateTask(id, fields) {
    if (fields.status && Object.keys(fields).length === 1) {
        const res = await senaFetch(`${API_URL}/tasks/${id}/status`, {
            method: 'PATCH',
            body:   JSON.stringify({ status: fields.status }),
        });
        return res.json();
    }
    const res = await senaFetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        body:   JSON.stringify(fields),
    });
    return res.json();
}

/**
 * deleteTask(id)
 * Elimina una tarea permanentemente.
 * @returns {boolean} true si se eliminó correctamente
 */
export async function deleteTask(id) {
    const res = await senaFetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
    return res.ok;
}

/**
 * prepareExport(tasks, user)
 * Formatea los datos de tareas para exportar como JSON.
 * No hace petición al backend — trabaja con datos en memoria.
 */
export function prepareExport(tasks, user) {
    return JSON.stringify({
        exportadoEn:  new Date().toISOString(),
        usuario:      user.name,
        rol:          user.role,
        totalTareas:  tasks.length,
        tareas:       tasks,
    }, null, 2);
}