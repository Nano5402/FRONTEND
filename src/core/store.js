/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  core/store.js — ESTADO GLOBAL REACTIVO                              ║
 * ║                                                                      ║
 * ║  El store es el "cerebro de memoria" de la aplicación.               ║
 * ║  Guarda el estado compartido entre todos los módulos:                ║
 * ║    - ¿Quién está logueado?                                           ║
 * ║    - ¿Está autenticado?                                              ║
 * ║    - ¿En qué ruta está?                                              ║
 * ║                                                                      ║
 * ║  Patrón: Observable simple (sin librerías externas como Redux).      ║
 * ║                                                                      ║
 * ║  FLUJO DE USO:                                                       ║
 * ║  1. auth.service.js llama store.setUser(user) al hacer login         ║
 * ║  2. Cualquier módulo puede llamar store.getUser() para leer          ║
 * ║  3. Los suscriptores reciben el nuevo estado automáticamente         ║
 * ║                                                                      ║
 * ║  DIFERENCIA con localStorage:                                        ║
 * ║  - localStorage persiste entre sesiones (tokens, nombre)             ║
 * ║  - store vive solo en memoria durante la sesión activa               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

// Estado interno — objeto privado, no exportado directamente
// Solo se puede leer/modificar a través de los métodos del store
const _state = {
    user:         null,   // { id, name, role, role_id, permissions[] }
    isAuth:       false,  // true si hay usuario logueado
    currentRoute: null,   // ruta activa (ej: '/dashboard')
};

// Lista de funciones suscritas al store
// Se ejecutan cada vez que el estado cambia
const _listeners = [];

export const store = {

    // ── LECTURA ───────────────────────────────────────────────────────────────

    /** Devuelve una copia del estado completo (no la referencia original) */
    getState() { return { ..._state }; },

    /** Devuelve el objeto del usuario logueado, o null si no hay sesión */
    getUser()  { return _state.user; },

    /** Devuelve true si hay un usuario autenticado */
    isAuth()   { return _state.isAuth; },

    // ── ESCRITURA ─────────────────────────────────────────────────────────────

    /**
     * setUser(user)
     * Llamado por auth.service.js después de un login exitoso.
     * Actualiza el usuario y marca la sesión como activa.
     *
     * Ejemplo:
     *   store.setUser({ id: 1, name: 'Juan', role: 'admin', permissions: [...] })
     */
    setUser(user) {
        _state.user   = user;
        _state.isAuth = !!user; // !! convierte a booleano: null→false, objeto→true
        _notify();              // notifica a todos los suscriptores
    },

    /**
     * clearUser()
     * Llamado por auth.service.js al hacer logout.
     * Borra el usuario y marca la sesión como inactiva.
     */
    clearUser() {
        _state.user   = null;
        _state.isAuth = false;
        _notify();
    },

    /**
     * setRoute(route)
     * Llamado por el router cada vez que cambia la vista activa.
     * Permite a los componentes saber en qué ruta están sin leer el DOM.
     */
    setRoute(route) {
        _state.currentRoute = route;
        _notify();
    },

    // ── SUSCRIPCIÓN ───────────────────────────────────────────────────────────

    /**
     * subscribe(fn)
     * Registra una función que se ejecuta cada vez que el estado cambia.
     * Devuelve una función para cancelar la suscripción (patrón unsubscribe).
     *
     * Uso:
     *   const unsub = store.subscribe(state => console.log(state));
     *   unsub(); // cancela la suscripción cuando ya no se necesita
     */
    subscribe(fn) {
        _listeners.push(fn);
        // Devolvemos una función para desuscribirse (evita memory leaks)
        return () => {
            const idx = _listeners.indexOf(fn);
            if (idx > -1) _listeners.splice(idx, 1);
        };
    },
};

/**
 * _notify() — función interna
 * Llama a todos los suscriptores con una copia del estado actual.
 * Se llama automáticamente después de cada cambio de estado.
 */
function _notify() {
    _listeners.forEach(fn => fn({ ..._state }));
}