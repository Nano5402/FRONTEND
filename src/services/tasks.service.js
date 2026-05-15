/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  services/tasks.service.js — SERVICIO DE TAREAS                      ║
 * ║                                                                      ║
 * ║  Agrega lógica de presentación sobre las tareas:                     ║
 * ║    - Ordenar tareas por diferentes criterios                         ║
 * ║    - Filtrar por estado                                              ║
 * ║    - Cargar datos combinados para el dashboard del instructor        ║
 * ║                                                                      ║
 * ║  Estas funciones no hacen peticiones al backend — trabajan con       ║
 * ║  los datos que ya están en memoria (en el array de tareas).          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import * as tasksApi from '../api/tasks.api.js';
import * as usersApi from '../api/users.api.js';

// Reexportaciones simples de la API
export const getTasks       = tasksApi.getTasks;
export const getTasksByUser = tasksApi.getTasksByUser;
export const createTask     = tasksApi.createTask;
export const updateTask     = tasksApi.updateTask;
export const deleteTask     = tasksApi.deleteTask;
export const prepareExport  = tasksApi.prepareExport;

/**
 * sortTasks(tasks, criteria)
 * Ordena un array de tareas según el criterio elegido por el usuario.
 * NO modifica el array original — crea una copia y la ordena.
 *
 * @param {object[]} tasks    - Array de tareas a ordenar
 * @param {string}   criteria - Criterio de ordenamiento:
 *   'az'         → alfabético A → Z por título
 *   'za'         → alfabético Z → A por título
 *   'estado'     → por estado (alfabético)
 *   'fecha_asc'  → más antiguas primero (ID menor = más antigua)
 *   'fecha_desc' → más recientes primero (ID mayor = más reciente) [default]
 *
 * @returns {object[]} Nueva array ordenada
 */
export function sortTasks(tasks, criteria) {
    const copy = [...tasks]; // copia del array para no mutar el original

    switch (criteria) {
        case 'az':
            // localeCompare maneja correctamente caracteres especiales (tildes, ñ)
            return copy.sort((a, b) => a.title.localeCompare(b.title));
        case 'za':
            return copy.sort((a, b) => b.title.localeCompare(a.title));
        case 'estado':
            return copy.sort((a, b) => a.status.localeCompare(b.status));
        case 'fecha_asc':
            return copy.sort((a, b) => a.id - b.id); // ID más pequeño = tarea más antigua
        case 'fecha_desc':
        default:
            return copy.sort((a, b) => b.id - a.id); // ID más grande = tarea más reciente
    }
}

/**
 * filterByStatus(tasks, status)
 * Filtra las tareas por su estado actual.
 *
 * @param {object[]} tasks  - Array de tareas a filtrar
 * @param {string}   status - Estado a filtrar:
 *   'todos'       → devuelve todas sin filtrar
 *   'pendiente'   → solo las pendientes
 *   'en progreso' → solo las que están en curso
 *   'completada'  → solo las terminadas
 *   'incompleta'  → solo las rechazadas por el instructor
 *
 * @returns {object[]} Array filtrada (o la original si status es 'todos')
 */
export function filterByStatus(tasks, status) {
    if (status === 'todos') return tasks;
    return tasks.filter(t => t.status === status);
}

/**
 * getInstructorData()
 * Carga en PARALELO los datos que necesita el dashboard del instructor:
 *   - Lista de usuarios → filtrada para quedarse solo con estudiantes activos
 *   - Todas las tareas → para mostrar progreso por estudiante
 *
 * Usar Promise.all() en lugar de dos await separados es más eficiente:
 *   Con await separado:  petición1 → esperar → petición2 → esperar = 2x tiempo
 *   Con Promise.all:     petición1 y petición2 en paralelo = 1x tiempo
 *
 * @returns {{ students: object[], tasks: object[] }}
 */
export async function getInstructorData() {
    // Lanzamos ambas peticiones al mismo tiempo
    const [users, tasks] = await Promise.all([
        usersApi.getUsers(),
        tasksApi.getTasks(),
    ]);

    return {
        // Solo los estudiantes activos (role='user' es el alias del frontend para Estudiante)
        students: users.filter(u => u.role === 'user' && u.status === 'activo'),
        tasks, // todas las tareas sin filtrar (el dashboard filtra por estudiante seleccionado)
    };
}