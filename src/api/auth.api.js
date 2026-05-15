/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  api/auth.api.js — PETICIONES DE AUTENTICACIÓN                       ║
 * ║                                                                      ║
 * ║  CAMBIOS REALIZADOS EN ESTA VERSIÓN:                                 ║
 * ║                                                                      ║
 * ║  login() ahora maneja la bandera requiresReset:                      ║
 * ║  Si el backend devuelve user.requiresReset = true, significa que     ║
 * ║  el usuario debe cambiar su contraseña antes de usar el sistema.     ║
 * ║  (Ej: estudiante nuevo cuya contraseña es temporal = últimos 4 doc)  ║
 * ║                                                                      ║
 * ║  Guardamos esa bandera en localStorage para que el router pueda      ║
 * ║  interceptarla y redirigir al formulario de cambio de contraseña     ║
 * ║  antes de mostrar el dashboard.                                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { API_URL } from '../config/constants.js';
import { storage } from '../utils/storage.js';

/**
 * _post(path, body) — helper interno privado
 * Hace una petición POST sin autenticación (rutas públicas).
 * Lanza Error si el backend responde con estado de error.
 */
async function _post(path, body) {
    const res  = await fetch(`${API_URL}${path}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.msn || json.message || 'Error en la solicitud');
    return json;
}

/**
 * login(document, password)
 * Autentica al usuario y guarda sus tokens en localStorage.
 *
 * CAMBIO: Ahora también lee la bandera user.requiresReset del backend.
 *
 * FLUJO CON requiresReset:
 *   1. Usuario creado por admin → contraseña temporal = últimos 4 dígitos del documento
 *   2. Al hacer login, backend devuelve { user: { ..., requiresReset: true } }
 *   3. login() guarda 'requiresReset' = 'true' en localStorage
 *   4. El router (o Login.view.js) detecta esa bandera y redirige a #/reset
 *      antes de mostrar el dashboard
 *   5. Una vez que el usuario cambia su contraseña, la bandera se borra
 *
 * @returns {object} Objeto del usuario: { id, name, role, permissions, requiresReset? }
 */
export async function login(document, password) {
    const json = await _post('/auth/login', { document, password });

    // Desestructuramos los tokens Y el objeto usuario de la respuesta
    const { accessToken, refreshToken, token, user } = json.data || json;

    // Guardamos los tokens en localStorage para futuras peticiones autenticadas
    if (accessToken && refreshToken) storage.setTokens(accessToken, refreshToken);
    else if (token)                  storage.setTokens(token, null);

    // ── BANDERA requiresReset ──────────────────────────────────────────────
    // Si el backend nos dice que el usuario debe cambiar su contraseña,
    // lo anotamos en localStorage para que persista aunque se recargue la página.
    // Si no hay requiresReset (login normal), lo marcamos como 'false' para limpiar
    // cualquier valor anterior que pudiera haber quedado de una sesión pasada.
    if (user && user.requiresReset) {
        localStorage.setItem('requiresReset', 'true');
    } else {
        localStorage.setItem('requiresReset', 'false');
    }

    return user; // { id, name, role, role_id, permissions[], requiresReset? }
}

/**
 * register(payload)
 * Registra un nuevo usuario (ruta pública).
 * @param {object} payload - { name, document, email, password, role_id }
 */
export async function register(payload) {
    return _post('/auth/register', payload);
}

/**
 * forgotPassword(email)
 * Solicita el envío de un código OTP al correo del usuario.
 * El backend genera el código y lo envía via Mailtrap.
 */
export async function forgotPassword(email) {
    return _post('/auth/forgot-password', { email });
}

/**
 * verifyOTP(email, otp)
 * Verifica que el código OTP de 6 dígitos sea correcto y no haya expirado.
 * Expira a los 30 minutos de ser generado.
 */
export async function verifyOTP(email, otp) {
    return _post('/auth/verify-otp', { email, otp });
}

/**
 * resetPassword(email, otp, password)
 * Cambia la contraseña del usuario usando el email + OTP verificado.
 * El backend valida que la nueva contraseña sea diferente a la actual.
 *
 * TAMBIÉN se usa cuando requiresReset=true:
 * El usuario cambia su contraseña temporal y el backend limpia esa bandera.
 */
export async function resetPassword(email, otp, password) {
    return _post('/auth/reset-password', { email, otp, password });
}