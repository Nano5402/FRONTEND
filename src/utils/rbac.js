import { storage } from './storage.js';

// Replicamos las constantes del backend para no equivocar un string
export const PERMISSIONS = {
    SYSTEM_MANAGE_ALL: 'system.manage.all',
    SYSTEM_AUDIT: 'system.audit',           // ✅ FIX: faltaba este permiso
    USERS_CREATE: 'users.create',
    USERS_READ_ALL: 'users.read.all',
    TASKS_CREATE_MULTIPLE: 'tasks.create.multiple',
    TASKS_READ_ALL: 'tasks.read.all',
    TASKS_UPDATE_ALL: 'tasks.update.all',
    TASKS_DELETE_ALL: 'tasks.delete.all'
};

/**
 * Obtiene y decodifica el payload del JWT actual.
 */
export const getDecodedToken = () => {
    const token = storage.getAccessToken();
    if (!token) return null;
    try {
        return JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1]))));
    } catch (e) {
        return null;
    }
};

/**
 * Valida si el usuario actual posee un permiso específico.
 * El SuperAdmin (system.manage.all) siempre retorna true.
 */
export const hasPermission = (permissionName) => {
    const user = getDecodedToken();
    if (!user || !Array.isArray(user.permissions)) return false;
    return user.permissions.includes(PERMISSIONS.SYSTEM_MANAGE_ALL) || user.permissions.includes(permissionName);
};