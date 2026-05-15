/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  services/auth.service.js — SERVICIO DE AUTENTICACIÓN                ║
 * ║                                                                      ║
 * ║  ¿PARA QUÉ SIRVE UN SERVICE SI YA EXISTE LA API?                     ║
 * ║                                                                      ║
 * ║  La API (auth.api.js) solo habla con el backend: envía peticiones    ║
 * ║  y devuelve datos crudos.                                            ║
 * ║                                                                      ║
 * ║  El Service agrega la LÓGICA DE NEGOCIO:                             ║
 * ║    - Después de login, guarda el nombre en storage Y actualiza       ║
 * ║      el store global — la API no sabe de esas cosas.                 ║
 * ║    - Después de logout, limpia storage Y limpia el store.            ║
 * ║                                                                      ║
 * ║  Así las vistas no necesitan conocer los detalles internos:          ║
 * ║  solo llaman loginService() y todo lo demás pasa automáticamente.    ║
 * ║                                                                      ║
 * ║  FLUJO DE LOGIN COMPLETO:                                            ║
 * ║  Vista (Login.view.js)                                               ║
 * ║    → loginService(doc, pass)          ← este archivo                 ║
 * ║      → authApi.login(doc, pass)       ← auth.api.js                  ║
 * ║        → POST /auth/login             ← backend                      ║
 * ║      ← recibe { user, accessToken, refreshToken }                    ║
 * ║    → storage.setUserName(user.name)   ← guarda el nombre             ║
 * ║    → store.setUser(user)              ← actualiza estado global      ║
 * ║  ← devuelve user a la vista                                          ║
 * ║  Vista llama router.navigate('/dashboard')                           ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import * as authApi from '../api/auth.api.js';
import { storage }  from '../utils/storage.js';
import { store }    from '../core/store.js';

/**
 * loginService(document, password)
 * Orquesta el proceso completo de inicio de sesión:
 * 1. Llama a la API para autenticar
 * 2. Guarda el nombre del usuario en localStorage (para el sidebar)
 * 3. Actualiza el estado global (store) con los datos del usuario
 * 4. Devuelve el usuario para que la vista pueda redirigir
 */
export async function loginService(document, password) {
    const user = await authApi.login(document, password);
    // authApi.login ya guardó los tokens en localStorage
    // Aquí guardamos el nombre por separado para mostrarlo en la UI
    storage.setUserName(user.name);
    store.setUser(user); // el resto de la app puede saber quién está logueado
    return user;
}

/**
 * logoutService()
 * Cierra la sesión completamente:
 * 1. Borra tokens y nombre de localStorage
 * 2. Limpia el estado global del store
 *
 * El router redirige a /login después de llamar esto.
 */
export async function logoutService() {
    storage.clearTokens();
    store.clearUser();
}

// Las siguientes funciones son simples reexportaciones de la API
// El service las expone para que las vistas no importen directamente de la API
// (principio de capas: las vistas solo conocen los services)

/** Registra un nuevo usuario en el sistema */
export const registerService      = authApi.register;

/** Solicita el envío de un código OTP al correo */
export const forgotService        = authApi.forgotPassword;

/** Verifica que el código OTP ingresado sea correcto */
export const verifyOTPService     = authApi.verifyOTP;

/** Cambia la contraseña usando el email + OTP verificado */
export const resetPasswordService = authApi.resetPassword;