/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  api/users.api.js — PETICIONES DE USUARIOS                           ║
 * ║                                                                      ║
 * ║  CAMBIOS REALIZADOS EN ESTA VERSIÓN:                                 ║
 * ║                                                                      ║
 * ║  1. deleteUser(id, reason) — ahora acepta justificación              ║
 * ║     ANTES: DELETE /users/:id  (sin justificación)                    ║
 * ║     AHORA: DELETE /users/:id?reason=... (con justificación en URL)   ║
 * ║                                                                      ║
 * ║     ¿POR QUÉ EN LA URL Y NO EN EL BODY?                              ║
 * ║     El método HTTP DELETE técnicamente no tiene body garantizado     ║
 * ║     en todos los servidores/proxies. Enviarlo como query string      ║
 * ║     es más compatible y explícito.                                   ║
 * ║                                                                      ║
 * ║  2. getAuditLogs() — FUNCIÓN NUEVA                                   ║
 * ║     Consulta el historial de acciones del sistema para el Auditor.  ║
 * ║     Ruta del backend: GET /users/audit/logs                          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { API_URL, ROLE_IDS } from '../config/constants.js';
import { senaFetch }          from './client.js';

/**
 * _normalizeRole — traduce nombres de rol de la BD al formato del frontend
 * BD:       'SuperAdmin', 'Profesor', 'Estudiante', 'Auditor'
 * Frontend: 'admin',      'admin',    'user',        'auditor'
 */
function _normalizeRole(roleNameBD = '') {
    const map = {
        superadmin: 'admin',
        profesor:   'admin',
        estudiante: 'user',
        auditor:    'auditor',
    };
    return map[roleNameBD.toLowerCase()] || 'user';
}

/** Agrega el campo 'role' normalizado a cada usuario */
function _normalize(u) {
    return { ...u, role: _normalizeRole(u.role_name || '') };
}

/** Traduce rol de texto a ID numérico para enviar al backend */
function _mapRoleId(role) {
    return ROLE_IDS[role] ?? ROLE_IDS.user;
}

// =============================================================================
// FUNCIONES EXPORTADAS
// =============================================================================

/**
 * getUsers()
 * Todos los usuarios del sistema.
 * Solo admin/instructor (USERS_READ_ALL).
 */
export async function getUsers() {
    const res  = await senaFetch(`${API_URL}/users`, { method: 'GET', cache: 'no-store' });
    if (!res.ok) throw new Error('Error al obtener usuarios');
    const json = await res.json();
    const data = Array.isArray(json) ? json : (json.data || []);
    return data.map(_normalize);
}

/**
 * getUserById(id)
 * Un usuario específico por su ID.
 */
export async function getUserById(id) {
    const res  = await senaFetch(`${API_URL}/users/${id}`, { method: 'GET', cache: 'no-store' });
    if (!res.ok) throw new Error('Error al buscar usuario');
    const json = await res.json();
    return _normalize(json.data || json);
}

/**
 * createUser(data)
 * Crea un usuario desde el panel de admin.
 * Transforma role (texto) → role_id (número) antes de enviar.
 * Elimina el campo 'role' para que Zod no lo rechace.
 */
export async function createUser(data) {
    const payload = { ...data, role_id: _mapRoleId(data.role) };
    delete payload.role;

    const res = await senaFetch(`${API_URL}/users`, {
        method: 'POST',
        body:   JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error al crear usuario');
    return res.json();
}

/**
 * updateUser(id, data)
 * Edita datos de un usuario existente.
 * Misma transformación role → role_id que createUser.
 */
export async function updateUser(id, data) {
    const payload = { ...data, role_id: _mapRoleId(data.role) };
    delete payload.role;

    const res = await senaFetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        body:   JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error al actualizar usuario');
    return res.json();
}

/**
 * patchUserStatus(id, status)
 * Cambia solo el estado activo/inactivo (SOFT DELETE).
 * @param {string} status - 'activo' o 'inactivo'
 */
export async function patchUserStatus(id, status) {
    const res  = await senaFetch(`${API_URL}/users/${id}/status`, {
        method: 'PATCH',
        body:   JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || json.msn || 'Error al cambiar estado');
    return json;
}

/**
 * deleteUser(id, reason)
 * Elimina permanentemente un usuario de la BD (HARD DELETE).
 *
 * CAMBIO: Ahora recibe la justificación y la envía como query string en la URL.
 *
 * ¿POR QUÉ QUERY STRING Y NO BODY?
 * El estándar HTTP permite body en DELETE pero muchos servidores lo ignoran.
 * Query string es más confiable y el backend lo lee con req.query.reason.
 *
 * Ejemplo de URL resultante:
 *   DELETE /users/5?reason=Retiro%20definitivo%20del%20programa
 *
 * @param {number} id     - ID del usuario a eliminar
 * @param {string} reason - Justificación para el registro de auditoría
 */
export async function deleteUser(id, reason) {
    // encodeURIComponent convierte espacios y caracteres especiales a formato URL válido
    // Ej: "Retiro del programa" → "Retiro%20del%20programa"
    const res = await senaFetch(
        `${API_URL}/users/${id}?reason=${encodeURIComponent(reason)}`,
        { method: 'DELETE' }
    );

    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || json.msn || 'Error al eliminar usuario');
    }
    return true;
}

/**
 * getAuditLogs()
 * FUNCIÓN NUEVA — obtiene el historial de acciones del sistema.
 * Solo accesible para el Auditor (SYSTEM_AUDIT).
 *
 * Ruta del backend: GET /users/audit/logs
 * El backend devuelve un array de registros con:
 *   { accion, usuarioId, realizadoPor, fecha, detalle }
 *
 * NOTA: Esta ruta debe estar definida ANTES de /:id en users.routes.js
 * para que Express no la confunda con getUserById('/audit/logs').
 */
export async function getAuditLogs() {
    const res = await senaFetch(`${API_URL}/users/audit/logs`, {
        method: 'GET',
        cache:  'no-store',
    });
    if (!res.ok) throw new Error('Error al obtener registros de auditoría');
    const json = await res.json();
    return json.data || [];
}