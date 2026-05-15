/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  services/users.service.js — SERVICIO DE USUARIOS                    ║
 * ║                                                                      ║
 * ║  CAMBIO REALIZADO EN ESTA VERSIÓN:                                   ║
 * ║  Se agregó la exportación de getAuditLogs para que el dashboard      ║
 * ║  del Auditor pueda obtener el historial de acciones sin importar     ║
 * ║  directamente desde la capa API (respetando la separación de capas). ║
 * ║                                                                      ║
 * ║  PRINCIPIO DE CAPAS:                                                 ║
 * ║  Las vistas solo importan desde services.                            ║
 * ║  Los services importan desde api.                                    ║
 * ║  Las apis importan desde client/config.                              ║
 * ║  → Nadie salta capas directamente.                                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import * as usersApi from '../api/users.api.js';
import * as tasksApi from '../api/tasks.api.js';

// Reexportaciones simples — las vistas solo importan desde el service
export const getUsers    = usersApi.getUsers;
export const getUserById = usersApi.getUserById;
export const createUser  = usersApi.createUser;
export const updateUser  = usersApi.updateUser;
export const patchStatus = usersApi.patchUserStatus;
export const deleteUser  = usersApi.deleteUser;

/**
 * getAuditLogs — EXPORTACIÓN NUEVA
 * Expone los logs de auditoría del sistema al dashboard del Auditor.
 * Reexporta directamente desde users.api.js (sin lógica adicional).
 *
 * Uso en Auditor.view.js:
 *   const logs = await usersService.getAuditLogs();
 */
export const getAuditLogs = usersApi.getAuditLogs;

/**
 * safeDeactivate(userId)
 * Desactiva un estudiante SOLO si no tiene tareas sin completar.
 *
 * REGLA DE NEGOCIO RF06:
 * Un estudiante con tareas pendientes o en progreso no puede ser desactivado.
 * El instructor debe completar o eliminar esas tareas primero.
 *
 * FLUJO:
 *   1. Trae todas las tareas del sistema
 *   2. Filtra las del estudiante que NO estén completadas
 *   3. Si hay alguna → lanza Error con el conteo
 *   4. Si no hay ninguna → desactiva el usuario
 *
 * @param {number|string} userId - ID del estudiante
 * @throws {Error} Si tiene tareas sin completar
 */
export async function safeDeactivate(userId) {
    const tasks   = await tasksApi.getTasks();
    const pending = tasks.filter(
        t => String(t.userId) === String(userId) && t.status !== 'completada'
    );

    if (pending.length > 0) {
        throw new Error(
            `El estudiante tiene ${pending.length} tarea(s) sin completar. ` +
            `Deben ser completadas o eliminadas antes de desactivarlo.`
        );
    }

    return usersApi.patchUserStatus(userId, 'inactivo');
}