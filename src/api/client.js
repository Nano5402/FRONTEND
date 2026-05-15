/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  api/client.js — CLIENTE HTTP CON SILENT REFRESH                     ║
 * ║                                                                      ║
 * ║  Este archivo es el intermediario entre la app y el backend.         ║
 * ║  TODAS las peticiones autenticadas pasan por senaFetch().            ║
 * ║                                                                      ║
 * ║  QUÉ HACE DIFERENTE A fetch() normal:                                ║
 * ║  1. Agrega automáticamente el Authorization: Bearer <token>          ║
 * ║  2. Si el backend responde 401 (token expirado), intenta renovarlo   ║
 * ║     usando el refresh token sin interrumpir al usuario               ║
 * ║  3. Si la renovación también falla, cierra la sesión automáticamente ║
 * ║                                                                      ║
 * ║  FLUJO DEL SILENT REFRESH:                                           ║
 * ║  1. senaFetch hace la petición con el access token actual            ║
 * ║  2. Backend responde 401 (access token expirado)                     ║
 * ║  3. senaFetch llama a POST /auth/refresh con el refresh token        ║
 * ║  4. Backend devuelve nuevos tokens                                   ║
 * ║  5. senaFetch guarda los nuevos tokens en localStorage               ║
 * ║  6. senaFetch repite la petición original con el nuevo token         ║
 * ║  7. El usuario nunca se enteró de que el token se renovó             ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { storage } from '../utils/storage.js';
import { API_URL } from '../config/constants.js';

// Bandera para evitar que múltiples peticiones simultáneas intenten
// renovar el token al mismo tiempo (lo que causaría bucles infinitos)
let _refreshing = false;

/**
 * senaFetch(url, options?)
 * Wrapper de fetch() con autenticación automática y silent refresh.
 *
 * @param {string} url     - URL completa (ej: `${API_URL}/tasks`)
 * @param {object} options - Mismo objeto de opciones que fetch() normal
 * @returns {Promise<Response>} La respuesta del servidor
 *
 * Uso:
 *   const res = await senaFetch(`${API_URL}/users`, { method: 'GET' })
 *   const data = await res.json()
 */
export async function senaFetch(url, options = {}) {
    // Leemos el token actual del localStorage
    const token = storage.getAccessToken();

    // Construimos los headers base — siempre JSON, más el token si existe
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers, // permite sobreescribir headers si es necesario
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // PRIMERA PETICIÓN — con el token actual
    let response = await fetch(url, { ...options, headers });

    // ── SILENT REFRESH ────────────────────────────────────────────────────────
    // Si el backend dice "401 Unauthorized" y no estamos ya renovando el token
    if (response.status === 401 && !_refreshing) {
        _refreshing = true; // marcamos que estamos renovando para bloquear otras peticiones

        try {
            const refreshToken = storage.getRefreshToken();
            if (!refreshToken) throw new Error('Sin refresh token — debe iniciar sesión');

            // Pedimos nuevos tokens al backend
            const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ refreshToken }),
            });

            if (!refreshRes.ok) throw new Error('Refresh token inválido o expirado');

            const json = await refreshRes.json();

            // Extraemos los nuevos tokens (compatibilidad con ambos formatos de respuesta)
            const newAccess  = json.data?.accessToken  || json.token;
            const newRefresh = json.data?.refreshToken || json.refreshToken;

            // Guardamos los nuevos tokens en localStorage
            storage.setTokens(newAccess, newRefresh);

            // Actualizamos el header con el nuevo access token
            headers['Authorization'] = `Bearer ${newAccess}`;

            // SEGUNDA PETICIÓN — repetimos la original con el token renovado
            response = await fetch(url, { ...options, headers });

        } catch (err) {
            // Si el refresh también falla → sesión expirada completamente
            console.error('Silent refresh fallido:', err.message);
            storage.clearTokens(); // borramos tokens inválidos
            window.location.hash = '#/login'; // redirigimos al login
        } finally {
            _refreshing = false; // liberamos la bandera para futuras peticiones
        }
    }

    return response;
}