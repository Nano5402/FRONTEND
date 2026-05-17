/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  config/constants.js — CONSTANTES GLOBALES DE CONFIGURACIÓN          ║
 * ║                                                                      ║
 * ║  CAMBIO REALIZADO:                                                   ║
 * ║  API_URL ahora apunta a la IP local de la red del SENA.              ║
 * ║  Antes: 'http://localhost:3000/api'                                  ║
 * ║  Ahora: 'http://192.168.1.12:3000/api'                              ║
 * ║                                                                      ║
 * ║  ¿POR QUÉ LA IP Y NO localhost?                                      ║
 * ║  Cuando el frontend y el backend corren en máquinas DIFERENTES       ║
 * ║  en la misma red, localhost no funciona porque cada máquina          ║
 * ║  tiene su propio localhost. La IP permite que cualquier dispositivo  ║
 * ║  en la misma red WiFi pueda conectarse al backend.                   ║
 * ║                                                                      ║
 * ║  IMPORTANTE: Si cambias de red (diferente router), esta IP          ║
 * ║  cambiará. En ese caso actualiza este valor.                         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

/**
 * URL base del backend.
 * ⚠️ Si el backend y el frontend corren en la misma máquina → usa localhost
 * ⚠️ Si están en máquinas diferentes de la misma red → usa la IP local
 */
export const API_URL = 'http://localhost:3000/api';

/**
 * PERMISSIONS — Permisos atómicos del sistema RBAC.
 * Deben coincidir EXACTAMENTE con los nombres de la tabla `permissions` en MySQL.
 *
 * JERARQUÍA:
 *   SYSTEM_MANAGE_ALL → SuperAdmin (acceso total)
 *   SYSTEM_AUDIT      → Auditor (solo lectura global)
 *   TASKS_CREATE_MULTIPLE → Instructor (gestión de tareas)
 *   TASKS_READ_OWN    → Estudiante (solo sus propias tareas)
 */
export const PERMISSIONS = {
    // Sistema
    SYSTEM_MANAGE_ALL:       'system.manage.all',   // SuperAdmin: acceso completo
    SYSTEM_AUDIT:            'system.audit',         // Auditor: lectura global

    // Usuarios
    USERS_CREATE:            'users.create',
    USERS_READ_ALL:          'users.read.all',       // Ver todos los usuarios
    USERS_UPDATE_STATUS:     'users.update.status',  // Activar/desactivar
    USERS_DELETE_ALL:        'users.delete.all',     // Hard delete

    // Tareas globales (instructor/admin)
    TASKS_CREATE_MULTIPLE:   'tasks.create.multiple',
    TASKS_READ_ALL:          'tasks.read.all',
    TASKS_UPDATE_ALL:        'tasks.update.all',
    TASKS_DELETE_ALL:        'tasks.delete.all',

    // Tareas propias (estudiante)
    TASKS_READ_OWN:          'tasks.read.own',
    TASKS_UPDATE_STATUS_OWN: 'tasks.update.status.own',
};

/**
 * ROLE_MAP — Traduce nombres de rol de la BD al formato del frontend.
 * BD guarda: 'SuperAdmin', 'Profesor', 'Estudiante', 'Auditor'
 * Frontend usa: 'admin', 'user', 'auditor'
 */
export const ROLE_MAP = {
    superadmin: 'admin',
    profesor:   'admin',
    estudiante: 'user',
    auditor:    'auditor',
};

/**
 * ROLE_IDS — IDs reales de la tabla `roles` en MySQL.
 *   id=1 → SuperAdmin (solo se asigna desde la BD, nunca desde el frontend)
 *   id=2 → Profesor/Instructor
 *   id=3 → Estudiante
 *   id=4 → Auditor
 */
export const ROLE_IDS = {
    admin:   2,
    auditor: 4,
    user:    3,
};