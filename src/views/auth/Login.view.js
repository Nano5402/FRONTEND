/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  views/auth/Login.view.js — VISTA DE INICIO DE SESIÓN                ║
 * ║                                                                      ║
 * ║  LUGAR EN EL FLUJO: PRIMER PASO                                      ║
 * ║  URL: /#/login                                                       ║
 * ║                                                                      ║
 * ║  El usuario llega aquí cuando:                                       ║
 * ║    - Abre la app por primera vez                                     ║
 * ║    - Su sesión expiró y el silent refresh también falló              ║
 * ║    - Hizo logout manualmente                                         ║
 * ║    - Intentó entrar a una ruta privada sin token                     ║
 * ║                                                                      ║
 * ║  DESDE AQUÍ PUEDE IR A:                                              ║
 * ║    → #/dashboard   (si las credenciales son correctas, según rol)    ║
 * ║    → #/register    (si no tiene cuenta)                              ║
 * ║    → #/forgot      (si olvidó su contraseña)                         ║
 * ║                                                                      ║
 * ║  PATRÓN DE ESTA VISTA (igual en todas las vistas):                   ║
 * ║  - LoginView()  → función que devuelve el HTML (sin lógica)          ║
 * ║  - bindLogin()  → función que conecta los eventos al DOM             ║
 * ║  Se separan porque el HTML debe estar en el DOM antes de             ║
 * ║  poder buscar elementos con getElementById.                          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { loginService }    from '../../services/auth.service.js';
import { router }          from '../../core/router.js';
import { toast }           from '../../components/Toast.js';
import { showError, clearError, isValidInput } from '../../utils/dom.js';

/**
 * LoginView()
 * Genera el HTML del formulario de login.
 * Esta función NO toca el DOM — solo devuelve un string de HTML.
 * El router inyecta ese string en #app-root.
 *
 * @returns {string} HTML del formulario de login
 */
export function LoginView() {
    return `
    <div class="card" style="width:100%; max-width:400px; animation:slideUpFade 0.4s var(--ease-smooth);">
        <div style="text-align:center;margin-bottom:25px;">
            <h2 class="card__title" style="font-size:1.8rem;margin-bottom:5px;">Bienvenido</h2>
            <p style="color:var(--text-muted);font-size:0.9rem;">Ingresa a tu cuenta para continuar</p>
        </div>

        <form id="loginForm" class="form" novalidate>
            <div class="form__group">
                <label class="form__label">Documento</label>
                <input type="text" id="docLogin" class="form__input" placeholder="Ej: 1098765432">
            </div>
            <div class="form__group">
                <label class="form__label">Contraseña</label>
                <div style="position:relative; display:flex; align-items:center;">
                    <input type="password" id="passLogin" class="form__input" placeholder="••••••••" style="padding-right: 40px;">
                    <button type="button" id="togglePassword" style="position:absolute; right:12px; background:none; border:none; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center;">
                        <i class="ph ph-eye" id="eyeIcon" style="font-size:1.2rem;"></i>
                    </button>
                </div>
            </div>

            <div style="min-height:20px;text-align:center;margin-top:5px;">
                <span id="loginError" style="color:var(--danger);font-size:0.85rem;"></span>
            </div>

            <button type="submit" class="btn btn--primary btn--full" style="width:100%;">Ingresar</button>
        </form>

        <div style="text-align:center;margin-top:25px;display:flex;flex-direction:column;gap:15px;border-top:1px solid var(--border-subtle);padding-top:20px;">
            <div>
                <span style="color:var(--text-muted);font-size:0.9rem;">¿No tienes cuenta?</span>
                <button id="goRegister" style="background:none;border:none;color:var(--brand-primary);font-size:0.9rem;font-weight:600;cursor:pointer;">
                    Regístrate
                </button>
            </div>
            <button id="goForgot" style="background:none;border:none;color:var(--text-muted);font-size:0.85rem;cursor:pointer;text-decoration:underline;">
                ¿Olvidaste tu contraseña?
            </button>
        </div>
    </div>`;
}

/**
 * bindLogin()
 * Conecta todos los eventos del formulario de login al DOM.
 * Se llama desde main.js con setTimeout(bindLogin, 0) para asegurar
 * que el HTML ya esté renderizado antes de buscar elementos.
 */
export function bindLogin() {
    // Botones de navegación a otras vistas
    document.getElementById('goRegister').onclick = () => router.navigate('/register');
    document.getElementById('goForgot').onclick   = () => router.navigate('/forgot');

    // LÓGICA DEL OJITO DE CONTRASEÑA
    const passInput = document.getElementById('passLogin');
    const toggleBtn = document.getElementById('togglePassword');
    const eyeIcon   = document.getElementById('eyeIcon');

    toggleBtn.addEventListener('click', () => {
        // Alternamos el tipo de input
        const isPassword = passInput.type === 'password';
        passInput.type = isPassword ? 'text' : 'password';
        
        // Alternamos el ícono (ojo abierto / ojo cerrado)
        eyeIcon.className = isPassword ? 'ph ph-eye-slash' : 'ph ph-eye';
        
        // Efecto sutil de color para indicar que está activo
        toggleBtn.style.color = isPassword ? 'var(--brand-primary)' : 'var(--text-muted)';
    });

    // Submit del formulario de login
    document.getElementById('loginForm').addEventListener('submit', async e => {
        e.preventDefault(); // evita que el navegador recargue la página

        const errEl = document.getElementById('loginError');
        clearError(errEl); // limpiamos errores previos antes de intentar

        const doc  = document.getElementById('docLogin').value.trim();
        const pass = document.getElementById('passLogin').value.trim();

        // Validación básica en el frontend antes de hacer la petición
        if (!isValidInput(doc) || !pass) {
            return showError(errEl, 'Documento y contraseña son obligatorios.');
        }

        try {
            // loginService llama al backend, guarda tokens y actualiza el store
            const user = await loginService(doc, pass);
            toast.success(`¡Bienvenido, ${user.name}!`);

            // El router detecta el permiso del usuario y muestra el dashboard correcto
            // (AdminView, InstructorView, StudentView o AuditorView)
            router.navigate('/dashboard');

        } catch (err) {
            // Si el backend dice "Credenciales inválidas" o hay error de red,
            // mostramos el mensaje en el span de error (no como popup)
            showError(errEl, err.message || 'Credenciales inválidas.');
        }
    });
}