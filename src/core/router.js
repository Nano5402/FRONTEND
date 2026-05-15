/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  core/router.js — MOTOR DE ENRUTAMIENTO HASH-BASED                   ║
 * ║                                                                      ║
 * ║  Un router hash-based usa el fragmento de la URL (la parte después   ║
 * ║  del #) para determinar qué vista mostrar, sin recargar la página.   ║
 * ║                                                                      ║
 * ║  Ejemplo de URLs:                                                    ║
 * ║    http://localhost:5173/#/login      → muestra Login                ║
 * ║    http://localhost:5173/#/dashboard  → muestra el Dashboard         ║
 * ║    http://localhost:5173/#/register   → muestra Registro             ║
 * ║                                                                      ║
 * ║  ¿Por qué hash y no History API (/dashboard)?                        ║
 * ║  Con hash no se necesita configurar el servidor para que todas       ║
 * ║  las rutas apunten a index.html. Funciona directo con Vite.          ║
 * ║                                                                      ║
 * ║  FLUJO INTERNO AL NAVEGAR:                                           ║
 * ║  1. El usuario cambia el hash (clic en un enlace o router.navigate)  ║
 * ║  2. El evento 'hashchange' se dispara automáticamente                ║
 * ║  3. _resolve() lee el nuevo hash y busca la ruta registrada          ║
 * ║  4. Ejecuta el guard (si existe) → si falla, redirige                ║
 * ║  5. Llama a viewFn() para obtener el HTML de la vista                ║
 * ║  6. Inyecta ese HTML en el contenedor raíz (#app-root)               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { store }      from './store.js';
import { storage }    from '../utils/storage.js';
import { getDecoded } from '../utils/rbac.js';
import { PERMISSIONS} from '../config/constants.js';

// Array donde se guardan todas las rutas registradas con .register()
// Cada entrada tiene: { path, viewFn, guard }
const _routes = [];

// Elemento del DOM donde se inyectan las vistas (#app-root)
let _root = null;

// Vista que se muestra cuando ninguna ruta coincide (404)
let _notFound = null;

// =============================================================================
// OBJETO PÚBLICO — router
// Métodos que usa el resto de la aplicación para navegar y registrar rutas
// =============================================================================
export const router = {

    /**
     * init(rootId)
     * Debe llamarse UNA SOLA VEZ desde main.js al cargar la app.
     * - Guarda referencia al contenedor raíz
     * - Escucha cambios de hash para re-renderizar
     * - Si no hay hash, redirige a #/login
     */
    init(rootId) {
        _root = document.getElementById(rootId);

        // Cada vez que el hash cambia, resolvemos la nueva ruta
        window.addEventListener('hashchange', () => _resolve());

        // Si el usuario entra a la URL raíz sin hash, lo mandamos al login
        if (!window.location.hash || window.location.hash === '#') {
            window.location.hash = '#/login';
        } else {
            // Si ya hay un hash (ej: el usuario recargó en /#/dashboard), lo resolvemos
            _resolve();
        }
    },

    /**
     * register(path, viewFn, guard?)
     * Registra una ruta en el sistema.
     *
     * @param {string}   path   - Ruta sin '#' (ej: '/login')
     * @param {Function} viewFn - Función que devuelve HTML string o null
     * @param {Function} guard  - Función async que devuelve null (ok) o string (redirigir)
     *
     * Es chainable: router.register(...).register(...)
     */
    register(path, viewFn, guard = null) {
        _routes.push({ path, viewFn, guard });
        return router;
    },

    /**
     * setNotFound(viewFn)
     * Define qué mostrar cuando ninguna ruta coincide (página 404).
     */
    setNotFound(viewFn) {
        _notFound = viewFn;
        return router;
    },

    /**
     * navigate(path)
     * Navega a una ruta cambiando el hash.
     * Agrega una entrada al historial del navegador (el botón "atrás" funciona).
     *
     * Uso: router.navigate('/dashboard')
     * Resultado: URL cambia a /#/dashboard y se renderiza esa vista
     */
    navigate(path) {
        window.location.hash = `#${path}`;
    },

    /**
     * replace(path)
     * Navega sin agregar entrada al historial.
     * Útil para redireccionamientos de guards (no queremos que el usuario
     * pueda volver atrás a una ruta que no debería ver).
     */
    replace(path) {
        history.replaceState(null, '', `#${path}`);
        _resolve(); // forzamos resolución porque replaceState no dispara hashchange
    },

    /**
     * back()
     * Equivale a presionar el botón "atrás" del navegador.
     */
    back() {
        history.back();
    },

    /**
     * currentPath()
     * Retorna la ruta actual sin el '#'.
     * Ej: si la URL es /#/dashboard → devuelve '/dashboard'
     */
    currentPath() {
        return window.location.hash.replace('#', '') || '/login';
    },
};

// =============================================================================
// FUNCIÓN INTERNA: _resolve()
// Se ejecuta cada vez que cambia el hash.
// Es el corazón del router: decide qué vista mostrar.
// =============================================================================
async function _resolve() {
    const path  = router.currentPath();

    // Buscamos la ruta registrada que coincida con el path actual
    const route = _routes.find(r => r.path === path);

    // Si no existe ninguna ruta con ese path → mostramos 404
    if (!route) {
        _notFound
            ? _render(_notFound())
            : (_root.innerHTML = '<p style="padding:2rem">404 — Ruta no encontrada</p>');
        return;
    }

    // Si la ruta tiene un guard, lo ejecutamos
    // El guard puede devolver:
    //   null   → el usuario tiene acceso, continuamos
    //   string → path al que debemos redirigir (ej: '/login')
    if (route.guard) {
        const redirect = await route.guard(path);
        if (redirect) {
            router.replace(redirect); // redirigimos sin agregar al historial
            return;
        }
    }

    // Actualizamos el estado global con la ruta actual
    store.setRoute(path);

    // Ejecutamos la función de vista y renderizamos el resultado
    _render(await route.viewFn());
}

// =============================================================================
// FUNCIÓN INTERNA: _render(html)
// Inyecta el contenido en #app-root.
// Acepta string HTML, elemento HTMLElement, o null (la vista se rindió sola).
// =============================================================================
function _render(html) {
    if (typeof html === 'string') {
        _root.innerHTML = html;
    } else if (html instanceof HTMLElement) {
        _root.innerHTML = '';
        _root.appendChild(html);
    }
    // Si html es null/undefined, la vista manejó su propio render (ej: dashboards)
}

// =============================================================================
// GUARDS REUTILIZABLES
//
// Un guard es una función que devuelve otra función async.
// La función interna recibe el path actual y devuelve:
//   null   → acceso permitido
//   string → ruta a la que redirigir
//
// Se usan al registrar rutas: router.register('/ruta', viewFn, guardAuth())
// =============================================================================

/**
 * guardAuth()
 * Protege rutas privadas.
 * Si no hay token válido en localStorage → redirige a /login.
 * Si el token está corrupto → limpia storage y redirige a /login.
 *
 * Uso: rutas de dashboard, usuarios, roles
 */
export function guardAuth() {
    return async () => {
        if (!storage.getAccessToken()) return '/login';
        const user = getDecoded();
        if (!user || !user.permissions) {
            storage.clearTokens();
            return '/login';
        }
        return null; // acceso permitido
    };
}

/**
 * guardPublic()
 * Protege rutas públicas de usuarios ya autenticados.
 * Si ya hay sesión → redirige a /dashboard.
 * Evita que un usuario logueado vea el formulario de login o registro.
 *
 * Uso: /login, /register, /forgot, /verify-otp, /reset
 */
export function guardPublic() {
    return async () => {
        if (storage.getAccessToken() && getDecoded()) return '/dashboard';
        return null; // acceso permitido (no hay sesión)
    };
}

/**
 * guardPermission(permission)
 * Protege rutas que requieren un permiso específico.
 * Si no tiene sesión → redirige a /login.
 * Si no tiene el permiso → redirige a /dashboard (sin acceso denegado agresivo).
 *
 * Uso: rutas de administración avanzada
 */
export function guardPermission(permission) {
    return async () => {
        if (!storage.getAccessToken()) return '/login';
        const user = getDecoded();
        if (!user?.permissions?.includes(permission) &&
            !user?.permissions?.includes(PERMISSIONS.SYSTEM_MANAGE_ALL)) {
            return '/dashboard';
        }
        return null;
    };
}