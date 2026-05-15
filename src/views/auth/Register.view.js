/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  views/auth/Register.view.js — VISTA DE REGISTRO                     ║
 * ║                                                                      ║
 * ║  LUGAR EN EL FLUJO: ALTERNATIVA AL LOGIN                             ║
 * ║  URL: /#/register                                                    ║
 * ║                                                                      ║
 * ║  Se llega aquí desde: Login → botón "Regístrate"                    ║
 * ║                                                                      ║
 * ║  DESDE AQUÍ PUEDE IR A:                                              ║
 * ║    → #/login   (después de registrarse exitosamente, o con el       ║
 * ║                 botón "¿Ya tienes cuenta?")                          ║
 * ║                                                                      ║
 * ║  VALIDACIONES QUE APLICA (antes de enviar al backend):              ║
 * ║    - Nombres y apellidos: solo letras, mínimo 3                     ║
 * ║    - Documento: solo números, mínimo 7 dígitos                      ║
 * ║    - Email: formato válido                                           ║
 * ║    - Contraseña: mínimo 6 car., 1 mayúscula, 1 número, 1 especial   ║
 * ║    - Confirmación: debe ser idéntica a la contraseña                 ║
 * ║                                                                      ║
 * ║  VALIDACIÓN EN TIEMPO REAL:                                          ║
 * ║  Mientras el usuario escribe, el borde del input cambia de color:   ║
 * ║    🟢 Verde → valor válido                                           ║
 * ║    🔴 Rojo  → valor inválido                                         ║
 * ║  El indicador de requisitos de contraseña aparece al hacer focus    ║
 * ║  en ese campo y muestra ✅ o ⬜ por cada requisito.                  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { registerService } from '../../services/auth.service.js';
import { router }          from '../../core/router.js';
import { toast }           from '../../components/Toast.js';
import {
    RULES,
    validate,
    liveValidate,
    passwordStrengthHTML,
    attachPasswordStrength,
} from '../../utils/validators.js';
import { showError, clearError } from '../../utils/dom.js';

/**
 * RegisterView()
 * Genera el HTML del formulario de registro.
 * Cada campo tiene su propio <span> de error para feedback individual.
 *
 * @returns {string} HTML del formulario
 */
export function RegisterView() {
    return `
    <div class="card" style="max-width:520px;margin:40px auto;animation:slideUpFade 0.4s var(--ease-smooth);">
        <div style="text-align:center;margin-bottom:25px;">
            <h2 class="card__title" style="font-size:1.8rem;margin-bottom:5px;">Crear Cuenta</h2>
            <p style="color:var(--text-muted);font-size:0.9rem;">Completa todos los campos para registrarte</p>
        </div>

        <form id="registerForm" class="form" novalidate>

            <!-- Nombres y Apellidos en dos columnas -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
                <div class="form__group">
                    <label class="form__label">Nombres <span style="color:var(--danger)">*</span></label>
                    <input type="text" id="regNombres" class="form__input" placeholder="Juan Carlos">
                    <!-- Span individual de error para este campo -->
                    <span id="errNombres" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
                </div>
                <div class="form__group">
                    <label class="form__label">Apellidos <span style="color:var(--danger)">*</span></label>
                    <input type="text" id="regApellidos" class="form__input" placeholder="Pérez Gómez">
                    <span id="errApellidos" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
                </div>
            </div>

            <div class="form__group">
                <label class="form__label">Documento <span style="color:var(--danger)">*</span></label>
                <input type="text" id="regDoc" class="form__input" placeholder="Solo números, mínimo 7 dígitos">
                <span id="errDoc" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
            </div>

            <div class="form__group">
                <label class="form__label">Correo Electrónico <span style="color:var(--danger)">*</span></label>
                <input type="email" id="regEmail" class="form__input" placeholder="correo@ejemplo.com">
                <span id="errEmail" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
            </div>

            <!-- Contraseña y confirmación en dos columnas -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
                <div class="form__group">
                    <label class="form__label">Contraseña <span style="color:var(--danger)">*</span></label>
                    <input type="password" id="regPass" class="form__input" placeholder="Mínimo 6 caracteres">
                    <span id="errPass" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
                </div>
                <div class="form__group">
                    <label class="form__label">Confirmar <span style="color:var(--danger)">*</span></label>
                    <input type="password" id="regPassConfirm" class="form__input" placeholder="Repítela">
                    <span id="errPassConfirm" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
                </div>
            </div>

            <!--
                Indicador visual de requisitos de contraseña.
                passwordStrengthHTML('reg') genera el HTML con IDs prefijados con 'reg'
                para no chocar con otros formularios en la misma sesión.
            -->
            ${passwordStrengthHTML('reg')}

            <!-- Error general del formulario (ej: "Documento ya registrado") -->
            <div style="min-height:20px;text-align:center;margin-bottom:8px;">
                <span id="regError" style="color:var(--danger);font-size:0.85rem;"></span>
            </div>

            <button type="submit" class="btn btn--primary btn--full" style="width:100%;">Registrarme</button>
        </form>

        <div style="text-align:center;margin-top:20px;border-top:1px solid var(--border-subtle);padding-top:20px;">
            <span style="color:var(--text-muted);">¿Ya tienes cuenta?</span>
            <!-- Volver al login -->
            <button id="goLogin" style="background:none;border:none;color:var(--brand-primary);font-weight:600;cursor:pointer;">
                Inicia Sesión
            </button>
        </div>
    </div>`;
}

/**
 * bindRegister()
 * Conecta todos los eventos del formulario de registro.
 * Incluye validación en tiempo real (mientras escribe) y al hacer submit.
 */
export function bindRegister() {
    // Navegación de vuelta al login
    document.getElementById('goLogin').onclick = () => router.navigate('/login');

    // Referencias a los inputs para conectar eventos de validación en tiempo real
    const nombresEl   = document.getElementById('regNombres');
    const apellidosEl = document.getElementById('regApellidos');
    const docEl       = document.getElementById('regDoc');
    const emailEl     = document.getElementById('regEmail');
    const passEl      = document.getElementById('regPass');
    const confirmEl   = document.getElementById('regPassConfirm');

    // ── VALIDACIÓN EN TIEMPO REAL (evento 'input' = cada tecla presionada) ────
    // liveValidate cambia el color del borde según si el valor es válido o no
    nombresEl.addEventListener('input',   () => liveValidate(nombresEl,   RULES.nombre));
    apellidosEl.addEventListener('input', () => liveValidate(apellidosEl, RULES.nombre));
    docEl.addEventListener('input',       () => liveValidate(docEl,       RULES.documento));
    emailEl.addEventListener('input',     () => liveValidate(emailEl,     RULES.email));

    // El indicador de requisitos de contraseña se conecta con attachPasswordStrength
    // 'reg' es el prefijo de los IDs (debe coincidir con passwordStrengthHTML('reg'))
    attachPasswordStrength(passEl, 'reg');

    // Validación de confirmación de contraseña — verde si coinciden, rojo si no
    confirmEl.addEventListener('input', () => {
        const match = confirmEl.value === passEl.value;
        confirmEl.style.borderColor = confirmEl.value
            ? (match ? 'var(--success)' : 'var(--danger)')
            : ''; // si está vacío, sin color
    });

    // ── SUBMIT DEL FORMULARIO ─────────────────────────────────────────────────
    document.getElementById('registerForm').addEventListener('submit', async e => {
        e.preventDefault();
        const errEl = document.getElementById('regError');
        clearError(errEl);

        // Leemos todos los valores
        const nombres   = nombresEl.value.trim();
        const apellidos = apellidosEl.value.trim();
        const doc       = docEl.value.trim();
        const email     = emailEl.value.trim();
        const pass      = passEl.value;
        const confirm   = confirmEl.value;

        // Validamos TODOS los campos y acumulamos el resultado
        // (no paramos en el primer error — mostramos todos a la vez)
        let ok = true;
        if (!validate(nombres,   RULES.nombre,    document.getElementById('errNombres')))   ok = false;
        if (!validate(apellidos, RULES.nombre,    document.getElementById('errApellidos'))) ok = false;
        if (!validate(doc,       RULES.documento, document.getElementById('errDoc')))       ok = false;
        if (!validate(email,     RULES.email,     document.getElementById('errEmail')))     ok = false;
        if (!validate(pass,      RULES.password,  document.getElementById('errPass')))      ok = false;

        // Validación especial: confirmación de contraseña
        if (pass !== confirm) {
            showError(document.getElementById('errPassConfirm'), 'Las contraseñas no coinciden');
            ok = false;
        } else {
            clearError(document.getElementById('errPassConfirm'));
        }

        if (!ok) return; // si hay errores, no enviamos

        try {
            // Construimos el payload que espera el backend
            await registerService({
                name:     `${nombres} ${apellidos}`, // unimos nombres y apellidos
                document: doc,
                email,
                password: pass,
                role_id:  3, // 3 = Estudiante (todos los nuevos usuarios son estudiantes)
            });

            toast.success('Cuenta creada exitosamente. Ya puedes iniciar sesión.');
            router.navigate('/login'); // redirigimos al login para que ingrese

        } catch (err) {
            // El backend puede devolver: "El documento o correo ya están registrados"
            showError(errEl, err.message || 'Error al registrar. Intenta de nuevo.');
        }
    });
}