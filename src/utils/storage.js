/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  utils/storage.js — MANEJO DE LOCALSTORAGE                           ║
 * ║                                                                      ║
 * ║  Centraliza todas las operaciones de localStorage en un solo lugar.  ║
 * ║  Si el día de mañana se cambia de localStorage a sessionStorage o    ║
 * ║  a cookies, solo se modifica este archivo.                           ║
 * ║                                                                      ║
 * ║  DATOS QUE PERSISTE:                                                 ║
 * ║    sena_access_token  → JWT de acceso (corta duración, 15 min)       ║
 * ║    sena_refresh_token → JWT de refresco (larga duración, 7 días)     ║
 * ║    sena_user_name     → Nombre del usuario para mostrar en sidebar   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

// Claves de localStorage — definidas aquí para evitar typos en el resto del código
const KEYS = {
    ACCESS:  'sena_access_token',
    REFRESH: 'sena_refresh_token',
    NAME:    'sena_user_name',
};

export const storage = {
    /**
     * setTokens(access, refresh)
     * Guarda los tokens después de un login o silent refresh exitoso.
     * Solo guarda si el valor no es null/undefined (para no sobreescribir con vacío).
     */
    setTokens: (access, refresh) => {
        if (access)  localStorage.setItem(KEYS.ACCESS,  access);
        if (refresh) localStorage.setItem(KEYS.REFRESH, refresh);
    },

    /** Lee el access token. Devuelve null si no existe. */
    getAccessToken:  () => localStorage.getItem(KEYS.ACCESS),

    /** Lee el refresh token. Devuelve null si no existe. */
    getRefreshToken: () => localStorage.getItem(KEYS.REFRESH),

    /** Guarda el nombre del usuario para mostrar en la UI sin necesidad de decodificar el JWT. */
    setUserName: name => localStorage.setItem(KEYS.NAME, name),

    /** Lee el nombre guardado. Devuelve null si no existe. */
    getUserName: () => localStorage.getItem(KEYS.NAME),

    /**
     * clearTokens()
     * Elimina TODOS los datos de sesión del localStorage.
     * Se llama al hacer logout o cuando el refresh token expira.
     */
    clearTokens: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),
};