/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  main.js — ORQUESTADOR PRINCIPAL DE LA SPA                           ║
 * ║                                                                      ║
 * ║  Este archivo es el director de orquesta. Su única responsabilidad   ║
 * ║  es registrar las rutas y arrancar el router. No contiene lógica     ║
 * ║  de negocio ni manipulación del DOM.                                 ║
 * ║                                                                      ║
 * ║  FLUJO COMPLETO DE LA APLICACIÓN:                                    ║
 * ║                                                                      ║
 * ║  1. El usuario abre la app → index.html carga este archivo           ║
 * ║  2. main.js registra todas las rutas disponibles en el router        ║
 * ║  3. El router lee el hash de la URL (ej: #/login)                    ║
 * ║  4. Si no hay hash, redirige automáticamente a #/login               ║
 * ║  5. El router ejecuta el guard de la ruta (¿tiene sesión? ¿permiso?) ║
 * ║  6. Si el guard aprueba, el router renderiza la vista correspondiente║
 * ║                                                                      ║
 * ║  ÁRBOL DE NAVEGACIÓN:                                                ║
 * ║                                                                      ║
 * ║  #/login ──────────────────────── Login (pública)                    ║
 * ║    ├── Iniciar sesión ──────────── #/dashboard (según rol)           ║
 * ║    ├── ¿No tienes cuenta? ──────── #/register                        ║
 * ║    └── ¿Olvidaste contraseña? ──── #/forgot                          ║
 * ║                                                                      ║
 * ║  #/register ───────────────────── Registro (pública)                 ║
 * ║    └── ¿Ya tienes cuenta? ──────── #/login                           ║
 * ║                                                                      ║
 * ║  #/forgot ─────────────────────── Solicitar OTP (pública)            ║
 * ║    └── Enviar código ───────────── #/verify-otp                      ║
 * ║                                                                      ║
 * ║  #/verify-otp ─────────────────── Verificar código OTP (pública)     ║
 * ║    └── Código válido ───────────── #/reset                           ║
 * ║                                                                      ║
 * ║  #/reset ──────────────────────── Nueva contraseña (pública)         ║
 * ║    └── Contraseña actualizada ──── #/login                           ║
 * ║                                                                      ║
 * ║  #/dashboard ──────────────────── Dashboard (privada, según rol):    ║
 * ║    ├── SuperAdmin ──────────────── AdminView                         ║
 * ║    │     ├── Mi Panel            (métricas globales)                 ║
 * ║    │     ├── Gestión Usuarios    (CRUD completo)                     ║
 * ║    │     └── Seguridad y Roles   (lectura, distribución de permisos) ║
 * ║    ├── Instructor ──────────────── InstructorView                    ║
 * ║    │     ├── Mi Panel            (resumen de estudiantes y tareas)   ║
 * ║    │     └── Gestión de Tareas   (asignar, aprobar, rechazar)        ║
 * ║    ├── Auditor ─────────────────── AuditorView                       ║
 * ║    │     └── Auditoría           (solo lectura + exportar reporte)   ║
 * ║    └── Estudiante ──────────────── StudentView                       ║
 * ║          └── Mis Tareas          (ver, iniciar, exportar JSON)       ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

// ── Core: router y guardas de acceso ─────────────────────────────────────────
import { router, guardAuth, guardPublic } from './core/router.js';

// ── Constantes de permisos y helper RBAC ─────────────────────────────────────
import { PERMISSIONS }   from './config/constants.js';
import { hasPermission } from './utils/rbac.js';

// ── Vistas de autenticación (rutas públicas) ──────────────────────────────────
import { LoginView,        bindLogin          } from './views/auth/Login.view.js';
import { RegisterView,     bindRegister       } from './views/auth/Register.view.js';
import {
    ForgotView,        bindForgot,
    VerifyOTPView,     bindVerifyOTP,
    ResetPasswordView, bindResetPassword,
} from './views/auth/ForgotPassword.view.js';

// ── Vistas de dashboard (rutas privadas, cada una para un rol) ────────────────
import { AdminView }      from './views/dashboard/Admin.view.js';
import { InstructorView } from './views/dashboard/Instructor.view.js';
import { StudentView }    from './views/dashboard/Student.view.js';
import { AuditorView }    from './views/dashboard/Auditor.view.js';

// ID del contenedor raíz en index.html
const ROOT = 'app-root';

// =============================================================================
// REGISTRO DE RUTAS
// Cada ruta tiene:
//   - path:   el hash sin '#' (ej: '/login')
//   - viewFn: función que devuelve el HTML de la vista
//   - guard:  función que decide si el usuario puede acceder
// =============================================================================

// ── RUTAS PÚBLICAS ────────────────────────────────────────────────────────────
// guardPublic() redirige a #/dashboard si ya hay sesión activa.
// Evita que un usuario logueado vuelva a ver el login.

router
    // PASO 1: Login — primera pantalla que ve el usuario
    .register('/login', () => {
        const html = LoginView(); // genera el HTML del formulario
        setTimeout(bindLogin, 0); // bindLogin conecta los eventos (submit, botones)
        // setTimeout(0) asegura que el HTML ya esté en el DOM antes de buscar elementos
        return html;
    }, guardPublic())

    // PASO 2A: Registro — si el usuario no tiene cuenta
    .register('/register', () => {
        const html = RegisterView();
        setTimeout(bindRegister, 0);
        return html;
    }, guardPublic())

    // PASO 2B: Olvidé mi contraseña — flujo de recuperación (3 pasos)
    // Paso 2B.1 — Ingresar correo para recibir OTP
    .register('/forgot', () => {
        const html = ForgotView();
        setTimeout(bindForgot, 0);
        return html;
    }, guardPublic())

    // Paso 2B.2 — Ingresar el código OTP recibido por correo
    .register('/verify-otp', () => {
        const html = VerifyOTPView();
        setTimeout(bindVerifyOTP, 0);
        return html;
    }, guardPublic())

    // Paso 2B.3 — Ingresar la nueva contraseña
    .register('/reset', () => {
        const html = ResetPasswordView();
        setTimeout(bindResetPassword, 0);
        return html;
    }, guardPublic());

// ── RUTAS PRIVADAS ────────────────────────────────────────────────────────────
// guardAuth() redirige a #/login si no hay sesión activa.

// PASO 3: Dashboard principal — el router detecta el rol y monta la vista correcta
router.register('/dashboard', async () => {
    const view = _pickDashboard(); // elige AdminView, InstructorView, etc.
    document.getElementById(ROOT).innerHTML = ''; // limpiamos antes de montar
    await view.mount(); // mount() genera sidebar + contenido + eventos
    return null; // null porque la vista maneja su propio innerHTML
}, guardAuth());

// DESPUÉS — le pasa initialView directamente al mount()
// El AdminView ya sabe desde el principio qué sección mostrar
// y el sidebar arranca con el ítem correcto marcado activo
router.register('/users', async () => {
    document.getElementById(ROOT).innerHTML = '';
    const view = _pickDashboard();
    await view.mount('users'); // ← initialView directo
    return null;
}, guardAuth());

router.register('/roles', async () => {
    document.getElementById(ROOT).innerHTML = '';
    const view = _pickDashboard();
    await view.mount('roles'); // ← initialView directo
    return null;
}, guardAuth());
// ── PÁGINA 404 ────────────────────────────────────────────────────────────────
// Se muestra cuando el usuario escribe una ruta que no existe
router.setNotFound(() => `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:2rem;">
        <i class="ph ph-warning" style="font-size:4rem;color:var(--text-muted);margin-bottom:1rem;"></i>
        <h2 style="color:var(--text-main);margin-bottom:8px;">Página no encontrada</h2>
        <p style="color:var(--text-muted);margin-bottom:20px;">La ruta que buscas no existe.</p>
        <a href="#/dashboard" class="btn btn--primary">Volver al inicio</a>
    </div>`);

// ── ARRANQUE ──────────────────────────────────────────────────────────────────
// Esperamos a que el DOM esté listo antes de inicializar el router.
// router.init() lee el hash actual y renderiza la vista correspondiente.
document.addEventListener('DOMContentLoaded', () => {
    router.init(ROOT);
});

// =============================================================================
// HELPER PRIVADO: _pickDashboard()
//
// Decide qué clase de dashboard instanciar según los permisos del usuario.
// El orden importa: el más privilegiado se evalúa primero.
//
// JERARQUÍA DE ROLES:
//   1. SuperAdmin  → tiene SYSTEM_MANAGE_ALL → AdminView
//   2. Instructor  → tiene TASKS_CREATE_MULTIPLE → InstructorView
//   3. Auditor     → tiene SYSTEM_AUDIT → AuditorView
//   4. Estudiante  → ninguno de los anteriores → StudentView (menor privilegio)
// =============================================================================
function _pickDashboard() {
    if (hasPermission(PERMISSIONS.SYSTEM_MANAGE_ALL))     return new AdminView(ROOT);
    if (hasPermission(PERMISSIONS.TASKS_CREATE_MULTIPLE)) return new InstructorView(ROOT);
    if (hasPermission(PERMISSIONS.SYSTEM_AUDIT))          return new AuditorView(ROOT);
    return new StudentView(ROOT); // default: menor privilegio
}