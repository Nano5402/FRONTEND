/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  views/auth/ForgotPassword.view.js — FLUJO DE RECUPERACIÓN           ║
 * ║                                                                      ║
 * ║  Este archivo contiene los 3 PASOS del flujo de recuperación         ║
 * ║  de contraseña. Cada paso es una vista independiente.               ║
 * ║                                                                      ║
 * ║  FLUJO COMPLETO:                                                     ║
 * ║                                                                      ║
 * ║  PASO 1 — ForgotView (#/forgot)                                      ║
 * ║    El usuario ingresa su correo electrónico.                         ║
 * ║    El backend genera un código de 6 dígitos (OTP) y lo envía         ║
 * ║    al correo usando Mailtrap.                                         ║
 * ║    → Si el correo existe: guarda el email en memoria y va al paso 2  ║
 * ║    → Si el correo no existe: muestra error                           ║
 * ║                                                                      ║
 * ║  PASO 2 — VerifyOTPView (#/verify-otp)                               ║
 * ║    El usuario ingresa el código OTP de 6 dígitos del correo.         ║
 * ║    El backend verifica que el código sea correcto y no haya expirado ║
 * ║    (tiene validez de 30 minutos).                                    ║
 * ║    → Si es válido: guarda el código en memoria y va al paso 3        ║
 * ║    → Si es inválido o expiró: muestra error                          ║
 * ║                                                                      ║
 * ║  PASO 3 — ResetPasswordView (#/reset)                                ║
 * ║    El usuario ingresa su nueva contraseña (con confirmación).        ║
 * ║    El backend verifica el OTP nuevamente y cambia la contraseña.     ║
 * ║    También valida que la nueva contraseña sea diferente a la actual. ║
 * ║    → Si todo es correcto: redirige al login con mensaje de éxito     ║
 * ║                                                                      ║
 * ║  ESTADO EN MEMORIA (_otp):                                           ║
 * ║  Los 3 pasos comparten un objeto { email, code } en memoria.         ║
 * ║  No se guarda en localStorage porque es información temporal        ║
 * ║  y sensible que no debe persistir entre recargas.                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import {
    forgotService,
    verifyOTPService,
    resetPasswordService,
} from '../../services/auth.service.js';
import { router }   from '../../core/router.js';
import { toast }    from '../../components/Toast.js';
import {
    RULES,
    validate,
    attachPasswordStrength,
    passwordStrengthHTML,
} from '../../utils/validators.js';
import { showError, clearError } from '../../utils/dom.js';

/**
 * Estado temporal compartido entre los 3 pasos del flujo.
 * Se guarda en el módulo (no en localStorage) porque:
 * - Es información sensible (email + código OTP)
 * - Solo se necesita durante el flujo actual
 * - Si el usuario recarga la página, debe empezar desde el paso 1
 */
const _otp = {
    email: '', // correo del usuario que solicita recuperación
    code:  '', // código OTP verificado (se usa en el paso 3)
};

// =============================================================================
// PASO 1 — SOLICITAR CÓDIGO OTP
// URL: #/forgot
// =============================================================================

/**
 * ForgotView()
 * Formulario donde el usuario ingresa su correo para recibir el OTP.
 */
export function ForgotView() {
    return `
    <div class="card" style="max-width:400px;margin:40px auto;animation:slideUpFade 0.4s var(--ease-smooth);">
        <div style="text-align:center;margin-bottom:25px;">
            <h2 class="card__title" style="font-size:1.6rem;margin-bottom:5px;">Recuperar Cuenta</h2>
            <p style="color:var(--text-muted);font-size:0.9rem;">Enviaremos un código de 6 dígitos a tu correo</p>
        </div>

        <form id="forgotForm" class="form">
            <div class="form__group">
                <label class="form__label">Correo Electrónico</label>
                <input type="email" id="forgotEmail" class="form__input" placeholder="correo@ejemplo.com">
                <span id="forgotError" style="color:var(--danger);font-size:0.85rem;min-height:16px;display:block;margin-top:3px;"></span>
            </div>
            <button type="submit" class="btn btn--primary btn--full" style="width:100%;margin-top:10px;">
                Enviar Código
            </button>
        </form>

        <div style="text-align:center;margin-top:20px;">
            <!-- Opción de volver sin completar el flujo -->
            <button id="goBack" style="background:none;border:none;color:var(--text-muted);font-size:0.9rem;cursor:pointer;text-decoration:underline;">
                Volver al Login
            </button>
        </div>
    </div>`;
}

/**
 * bindForgot()
 * Conecta los eventos del formulario del paso 1.
 */
export function bindForgot() {
    document.getElementById('goBack').onclick = () => router.navigate('/login');

    document.getElementById('forgotForm').onsubmit = async e => {
        e.preventDefault();
        const errEl = document.getElementById('forgotError');
        clearError(errEl);

        const email = document.getElementById('forgotEmail').value.trim();

        // Validamos que sea un email con formato válido antes de llamar al backend
        if (!validate(email, RULES.email, errEl)) return;

        try {
            toast.info('Enviando código...'); // feedback inmediato mientras espera
            await forgotService(email);       // backend genera y envía el OTP

            _otp.email = email; // guardamos el email para los pasos siguientes
            toast.success('Código enviado al correo');
            router.navigate('/verify-otp'); // → PASO 2

        } catch (err) {
            // El backend devuelve "No existe un usuario con este correo"
            showError(errEl, err.message);
        }
    };
}

// =============================================================================
// PASO 2 — VERIFICAR CÓDIGO OTP
// URL: #/verify-otp
// =============================================================================

/**
 * VerifyOTPView()
 * Formulario donde el usuario ingresa el código de 6 dígitos del correo.
 * Muestra el email al que se envió para que el usuario lo confirme.
 */
export function VerifyOTPView() {
    return `
    <div class="card" style="max-width:400px;margin:40px auto;animation:slideUpFade 0.4s var(--ease-smooth);">
        <div style="text-align:center;margin-bottom:25px;">
            <h2 class="card__title" style="font-size:1.6rem;margin-bottom:5px;">Verificar Código</h2>
            <!-- Mostramos el email para que el usuario sepa dónde revisar -->
            <p style="color:var(--text-muted);font-size:0.9rem;">
                Código enviado a <b>${_otp.email || 'tu correo'}</b>
            </p>
        </div>

        <form id="otpForm" class="form">
            <div class="form__group">
                <label class="form__label">Código OTP (6 dígitos)</label>
                <!--
                    maxlength="6" limita a 6 caracteres
                    letter-spacing y font-size grande facilitan la lectura del código
                -->
                <input type="text" id="otpInput" class="form__input" maxlength="6"
                    style="text-align:center;font-size:1.8rem;letter-spacing:8px;font-weight:bold;">
                <span id="otpError" style="color:var(--danger);font-size:0.85rem;min-height:16px;display:block;margin-top:3px;text-align:center;"></span>
            </div>
            <button type="submit" class="btn btn--primary btn--full" style="width:100%;margin-top:10px;">
                Verificar
            </button>
        </form>

        <div style="text-align:center;margin-top:20px;">
            <button id="cancelOTP" style="background:none;border:none;color:var(--text-muted);font-size:0.9rem;cursor:pointer;text-decoration:underline;">
                Cancelar
            </button>
        </div>
    </div>`;
}

/**
 * bindVerifyOTP()
 * Conecta los eventos del formulario del paso 2.
 */
export function bindVerifyOTP() {
    // Cancelar borra el progreso y vuelve al login
    document.getElementById('cancelOTP').onclick = () => {
        _otp.email = ''; // limpiamos el estado
        router.navigate('/login');
    };

    document.getElementById('otpForm').onsubmit = async e => {
        e.preventDefault();
        const errEl = document.getElementById('otpError');
        clearError(errEl);

        const otp = document.getElementById('otpInput').value.trim();

        // El OTP debe ser exactamente 6 dígitos numéricos
        if (!/^\d{6}$/.test(otp)) {
            return showError(errEl, 'El código debe tener exactamente 6 dígitos numéricos');
        }

        try {
            // Verificamos contra el backend usando el email guardado del paso 1
            await verifyOTPService(_otp.email, otp);

            _otp.code = otp; // guardamos el código para usarlo en el paso 3
            toast.success('Código válido');
            router.navigate('/reset'); // → PASO 3

        } catch (err) {
            // El backend devuelve "Código incorrecto" o "Código expirado"
            showError(errEl, err.message);
        }
    };
}

// =============================================================================
// PASO 3 — NUEVA CONTRASEÑA
// URL: #/reset
// =============================================================================

/**
 * ResetPasswordView()
 * Formulario donde el usuario define su nueva contraseña.
 * Incluye el indicador de requisitos y campo de confirmación.
 */
export function ResetPasswordView() {
    return `
    <div class="card" style="max-width:400px;margin:40px auto;animation:slideUpFade 0.4s var(--ease-smooth);">
        <div style="text-align:center;margin-bottom:25px;">
            <h2 class="card__title" style="font-size:1.6rem;margin-bottom:5px;">Nueva Contraseña</h2>
            <p style="color:var(--text-muted);font-size:0.9rem;">Define tu nueva clave de acceso segura</p>
        </div>

        <form id="resetForm" class="form">
            <div class="form__group">
                <label class="form__label">Contraseña Nueva <span style="color:var(--danger)">*</span></label>
                <input type="password" id="newPass" class="form__input" placeholder="••••••••">
                <span id="errNewPass" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
            </div>

            <!-- Indicador de requisitos con prefijo 'reset' para evitar conflictos de IDs -->
            ${passwordStrengthHTML('reset')}

            <div class="form__group">
                <label class="form__label">Confirmar Contraseña <span style="color:var(--danger)">*</span></label>
                <input type="password" id="confirmPass" class="form__input" placeholder="••••••••">
                <span id="errConfirmPass" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
            </div>

            <!-- Error general (ej: "La nueva contraseña no puede ser igual a la anterior") -->
            <div style="min-height:20px;text-align:center;margin-bottom:8px;">
                <span id="resetError" style="color:var(--danger);font-size:0.85rem;"></span>
            </div>

            <button type="submit" class="btn btn--primary btn--full" style="width:100%;">
                Actualizar Contraseña
            </button>
        </form>
    </div>`;
}

/**
 * bindResetPassword()
 * Conecta los eventos del formulario del paso 3.
 */
export function bindResetPassword() {
    const passEl    = document.getElementById('newPass');
    const confirmEl = document.getElementById('confirmPass');

    // Conectamos el indicador de requisitos de contraseña al input
    attachPasswordStrength(passEl, 'reset');

    // Feedback en tiempo real de la confirmación
    confirmEl.addEventListener('input', () => {
        const match = confirmEl.value === passEl.value;
        confirmEl.style.borderColor = confirmEl.value
            ? (match ? 'var(--success)' : 'var(--danger)')
            : '';
    });

    document.getElementById('resetForm').onsubmit = async e => {
        e.preventDefault();

        const errEl    = document.getElementById('resetError');
        const errNewEl = document.getElementById('errNewPass');
        const errConEl = document.getElementById('errConfirmPass');
        clearError(errEl); clearError(errNewEl); clearError(errConEl);

        const pass    = passEl.value;
        const confirm = confirmEl.value;

        let ok = true;
        // Validamos que la contraseña cumpla todos los requisitos
        if (!validate(pass, RULES.password, errNewEl)) ok = false;
        // Validamos que las dos contraseñas sean idénticas
        if (pass !== confirm) {
            showError(errConEl, 'Las contraseñas no coinciden');
            ok = false;
        }

        if (!ok) return;

        try {
            // Enviamos email + código OTP + nueva contraseña al backend
            // El backend hace una segunda verificación del OTP por seguridad
            // y también verifica que la nueva contraseña sea diferente a la actual
            await resetPasswordService(_otp.email, _otp.code, pass);

            // Limpiamos el estado temporal
            _otp.email = '';
            _otp.code  = '';

            toast.success('¡Contraseña actualizada! Inicia sesión con tu nueva clave.');
            router.navigate('/login'); // flujo completado → de vuelta al login

        } catch (err) {
            // Errores posibles del backend:
            //   "La nueva contraseña no puede ser igual a la contraseña actual"
            //   "Solicitud inválida o código expirado"
            showError(errEl, err.message || 'Error al restablecer la contraseña.');
        }
    };
}