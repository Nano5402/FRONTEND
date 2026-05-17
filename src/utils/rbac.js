/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  utils/rbac.js — CONTROL DE ACCESO BASADO EN ROLES (RBAC)            ║
 * ║                                                                      ║
 * ║  RBAC = Role Based Access Control                                    ║
 * ║                                                                      ║
 * ║  El JWT (JSON Web Token) que devuelve el backend al hacer login      ║
 * ║  tiene tres partes separadas por puntos:                             ║
 * ║    header.payload.firma                                              ║
 * ║                                                                      ║
 * ║  El payload (parte del medio) está en Base64 y contiene:             ║
 * ║    { id, role, role_id, permissions: ['tasks.read.own', ...] }       ║
 * ║                                                                      ║
 * ║  getDecoded() decodifica el payload para leer esa información        ║
 * ║  sin necesidad de hacer una petición al backend.                     ║
 * ║                                                                      ║
 * ║  hasPermission() verifica si el usuario actual tiene un permiso      ║
 * ║  antes de mostrar botones, rutas o ejecutar acciones.                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { storage }     from './storage.js';
import { PERMISSIONS } from '../config/constants.js';

/**
 * getDecoded()
 * Decodifica el payload del JWT guardado en localStorage.
 *
 * PROCESO:
 *   1. Lee el token de localStorage
 *   2. Divide por '.' y toma la parte del medio (índice 1)
 *   3. Decodifica de Base64 a string JSON
 *   4. Parsea el JSON y devuelve el objeto
 *
 * Si el token no existe o está corrupto, devuelve null.
 *
 * Ejemplo de payload decodificado:
 *   {
 *     id: 5,
 *     role: 'Profesor',
 *     role_id: 2,
 *     permissions: ['tasks.create.multiple', 'tasks.read.all', 'users.read.all'],
 *     iat: 1234567890,  // issued at (timestamp de creación)
 *     exp: 1234568790   // expires at (timestamp de expiración)
 *   }
 */
export function getDecoded() {
    const token = storage.getAccessToken();
    if (!token) return null;
    try {
        // Reemplazamos escape/decodeURIComponent por atob directo
        // que es más robusto y no usa APIs deprecadas
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

/**
 * hasPermission(permission)
 * Verifica si el usuario actual tiene un permiso específico.
 *
 * REGLA ESPECIAL:
 *   Si el usuario tiene SYSTEM_MANAGE_ALL (SuperAdmin), se considera
 *   que tiene TODOS los permisos automáticamente, sin importar cuáles
 *   estén listados en su token.
 *
 * Uso:
 *   if (hasPermission(PERMISSIONS.TASKS_CREATE_MULTIPLE)) {
 *     // mostrar botón de asignar tarea
 *   }
 *
 * @param {string} permission - Nombre del permiso (ej: 'tasks.create.multiple')
 * @returns {boolean}
 */
export function hasPermission(permission) {
    const user = getDecoded();
    if (!user?.permissions) return false;

    // SuperAdmin tiene acceso a todo
    if (user.permissions.includes(PERMISSIONS.SYSTEM_MANAGE_ALL)) return true;

    // Para los demás, verificamos el permiso exacto
    return user.permissions.includes(permission);
}

/**
 * getUserRole()
 * Devuelve el nombre del rol del usuario actual ('Profesor', 'Estudiante', etc.)
 * o null si no hay sesión.
 */
export function getUserRole() {
    return getDecoded()?.role || null;
}