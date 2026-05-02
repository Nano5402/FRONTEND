import { loginConBackend, registrarUsuario, solicitarRecuperacion, verificarOTP, resetPassword } from '../../api/usuariosApi.js';
import { showSuccessToast, showErrorToast, showInfoToast, showWarningToast } from '../components/notificaciones.js';
import { isValidInput, showError, clearError } from '../../utils/domHelpers.js';
import { storage } from '../../utils/storage.js';

// ─── Reglas de validación reutilizables ──────────────────────────────────────

const RULES = {
    // Solo letras (incluye tildes y ñ), mínimo 3 caracteres, sin números
    nombre: {
        test: v => /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]{3,}$/.test(v.trim()),
        msg:  'Mínimo 3 letras, sin números ni caracteres especiales'
    },
    // Solo dígitos, mínimo 7
    documento: {
        test: v => /^\d{7,}$/.test(v.trim()),
        msg:  'Solo números, mínimo 7 dígitos'
    },
    // Formato email básico
    email: {
        test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
        msg:  'Ingresa un correo electrónico válido'
    },
    // Mínimo 6 caracteres, al menos 1 mayúscula, 1 número, 1 especial
    password: {
        test: v => v.length >= 6
                && /[A-Z]/.test(v)
                && /[0-9]/.test(v)
                && /[*.\-_!@#$%^&()+={}[\]|\\:;"'<>,?/~`]/.test(v),
        msg:  'Mínimo 6 caracteres, 1 mayúscula, 1 número y 1 carácter especial (* . - _ ! @ # etc.)'
    }
};

// Valida un valor contra una regla y muestra/limpia el error en el span correspondiente
function validate(value, rule, errorEl) {
    if (!rule.test(value)) {
        showError(errorEl, rule.msg);
        return false;
    }
    clearError(errorEl);
    return true;
}

// Feedback visual en tiempo real — agrega clase de error/ok al input
function liveValidate(inputEl, rule) {
    const ok = rule.test(inputEl.value);
    inputEl.style.borderColor = ok ? 'var(--success)' : (inputEl.value ? 'var(--danger)' : '');
}

export class AuthView {
    constructor(containerId, onLoginSuccess) {
        this.container      = document.getElementById(containerId);
        this.onLoginSuccess = onLoginSuccess;
        this.tempEmail      = '';
        this.tempOTP        = '';
    }

    // ─── LOGIN ────────────────────────────────────────────────────────────────
    renderLogin() {
        this.container.innerHTML = `
            <div class="card" style="max-width:400px;margin:40px auto;animation:slideUpFade 0.4s var(--ease-smooth);">
                <div style="text-align:center;margin-bottom:25px;">
                    <h2 class="card__title" style="font-size:1.8rem;margin-bottom:5px;">Bienvenido</h2>
                    <p style="color:var(--text-muted);font-size:0.9rem;">Ingresa a tu cuenta para continuar</p>
                </div>
                <form id="loginForm" class="form" novalidate>
                    <div class="form__group">
                        <label for="docLogin" class="form__label">Documento</label>
                        <input type="text" id="docLogin" class="form__input" placeholder="Ej: 1098765432">
                    </div>
                    <div class="form__group">
                        <label for="passLogin" class="form__label">Contraseña</label>
                        <input type="password" id="passLogin" class="form__input" placeholder="••••••••">
                    </div>
                    <div style="min-height:20px;margin-top:5px;text-align:center;">
                        <span id="loginError" style="color:var(--danger);font-size:0.85rem;"></span>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full" style="width:100%;">Ingresar</button>
                </form>
                <div style="text-align:center;margin-top:25px;display:flex;flex-direction:column;gap:15px;border-top:1px solid var(--border-subtle);padding-top:20px;">
                    <div>
                        <span style="color:var(--text-muted);font-size:0.9rem;">¿No tienes cuenta?</span>
                        <button id="btnGoToRegister" style="background:none;border:none;color:var(--brand-primary);font-size:0.9rem;font-weight:600;cursor:pointer;">Regístrate</button>
                    </div>
                    <button id="btnGoForgot" style="background:none;border:none;color:var(--text-muted);font-size:0.85rem;cursor:pointer;text-decoration:underline;">¿Olvidaste tu contraseña?</button>
                </div>
            </div>`;
        this._attachLoginEvents();
    }

    _attachLoginEvents() {
        document.getElementById('btnGoForgot').onclick      = () => this.renderForgotPassword();
        document.getElementById('btnGoToRegister').onclick  = () => this.renderRegister();

        document.getElementById('loginForm').addEventListener('submit', async e => {
            e.preventDefault();
            const errEl = document.getElementById('loginError');
            clearError(errEl);
            const doc  = document.getElementById('docLogin').value.trim();
            const pass = document.getElementById('passLogin').value.trim();
            if (!isValidInput(doc) || !pass) return showError(errEl, 'Documento y contraseña obligatorios.');

            try {
                const usuario = await loginConBackend(doc, pass);
                if (usuario && usuario.requirePasswordChange) {
                    showWarningToast('Debes actualizar tu contraseña.');
                    this.renderResetPassword();
                } else if (usuario) {
                    storage.setUserName(usuario.name);
                    showSuccessToast('¡Bienvenido!');
                    setTimeout(() => this.onLoginSuccess(usuario), 100);
                } else {
                    showError(errEl, 'Credenciales inválidas.');
                }
            } catch (error) {
                showErrorToast('Error al conectar con el servidor.');
                console.error('Error login:', error);
            }
        });
    }

    // ─── REGISTER ─────────────────────────────────────────────────────────────
    renderRegister() {
        this.container.innerHTML = `
            <div class="card" style="max-width:520px;margin:40px auto;animation:slideUpFade 0.4s var(--ease-smooth);">
                <div style="text-align:center;margin-bottom:25px;">
                    <h2 class="card__title" style="font-size:1.8rem;margin-bottom:5px;">Crear Cuenta</h2>
                    <p style="color:var(--text-muted);font-size:0.9rem;">Completa todos los campos para registrarte</p>
                </div>
                <form id="registerForm" class="form" novalidate>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
                        <div class="form__group">
                            <label class="form__label">Nombres <span style="color:var(--danger)">*</span></label>
                            <input type="text" id="regNombres" class="form__input" placeholder="Juan Carlos">
                            <span class="field-err" id="errNombres" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
                        </div>
                        <div class="form__group">
                            <label class="form__label">Apellidos <span style="color:var(--danger)">*</span></label>
                            <input type="text" id="regApellidos" class="form__input" placeholder="Pérez Gómez">
                            <span class="field-err" id="errApellidos" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
                        </div>
                    </div>
                    <div class="form__group">
                        <label class="form__label">Documento <span style="color:var(--danger)">*</span></label>
                        <input type="text" id="regDoc" class="form__input" placeholder="Solo números, mínimo 7 dígitos">
                        <span class="field-err" id="errDoc" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
                    </div>
                    <div class="form__group">
                        <label class="form__label">Correo Electrónico <span style="color:var(--danger)">*</span></label>
                        <input type="email" id="regEmail" class="form__input" placeholder="correo@ejemplo.com">
                        <span class="field-err" id="errEmail" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
                        <div class="form__group">
                            <label class="form__label">Contraseña <span style="color:var(--danger)">*</span></label>
                            <input type="password" id="regPass" class="form__input" placeholder="Mínimo 6 caracteres">
                            <span class="field-err" id="errPass" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
                        </div>
                        <div class="form__group">
                            <label class="form__label">Confirmar Contraseña <span style="color:var(--danger)">*</span></label>
                            <input type="password" id="regPassConfirm" class="form__input" placeholder="Repítela">
                            <span class="field-err" id="errPassConfirm" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
                        </div>
                    </div>

                    <!-- Indicador de requisitos de contraseña -->
                    <div id="passReqs" style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:8px;padding:12px;margin-bottom:12px;display:none;">
                        <p style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin:0 0 8px;">Requisitos de contraseña</p>
                        <div style="display:flex;flex-direction:column;gap:4px;">
                            <span id="req-len"  style="font-size:0.8rem;">⬜ Mínimo 6 caracteres</span>
                            <span id="req-upper" style="font-size:0.8rem;">⬜ Al menos 1 mayúscula</span>
                            <span id="req-num"  style="font-size:0.8rem;">⬜ Al menos 1 número</span>
                            <span id="req-spec" style="font-size:0.8rem;">⬜ Al menos 1 carácter especial (* . - _ ! @ # etc.)</span>
                        </div>
                    </div>

                    <div style="min-height:20px;text-align:center;margin-bottom:8px;">
                        <span id="regError" style="color:var(--danger);font-size:0.85rem;"></span>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full" style="width:100%;">Registrarme</button>
                </form>
                <div style="text-align:center;margin-top:20px;font-size:0.9rem;border-top:1px solid var(--border-subtle);padding-top:20px;">
                    <span style="color:var(--text-muted);">¿Ya tienes cuenta?</span>
                    <button id="btnGoToLogin" style="background:none;border:none;color:var(--brand-primary);font-weight:600;cursor:pointer;">Inicia Sesión</button>
                </div>
            </div>`;
        this._attachRegisterEvents();
    }

    _attachRegisterEvents() {
        document.getElementById('btnGoToLogin').addEventListener('click', () => this.renderLogin());

        // ── Validación en tiempo real ─────────────────────────────────────────
        const nombresEl      = document.getElementById('regNombres');
        const apellidosEl    = document.getElementById('regApellidos');
        const docEl          = document.getElementById('regDoc');
        const emailEl        = document.getElementById('regEmail');
        const passEl         = document.getElementById('regPass');
        const passConfirmEl  = document.getElementById('regPassConfirm');

        nombresEl.addEventListener('input',   () => liveValidate(nombresEl,   RULES.nombre));
        apellidosEl.addEventListener('input', () => liveValidate(apellidosEl, RULES.nombre));
        docEl.addEventListener('input',       () => liveValidate(docEl,       RULES.documento));
        emailEl.addEventListener('input',     () => liveValidate(emailEl,     RULES.email));

        // Indicador visual de requisitos de contraseña
        passEl.addEventListener('focus', () => document.getElementById('passReqs').style.display = 'block');
        passEl.addEventListener('blur',  () => {
            if (!passEl.value) document.getElementById('passReqs').style.display = 'none';
        });
        passEl.addEventListener('input', () => {
            const v = passEl.value;
            const tick = ok => ok ? '✅' : '⬜';
            document.getElementById('req-len').textContent   = `${tick(v.length >= 6)} Mínimo 6 caracteres`;
            document.getElementById('req-upper').textContent = `${tick(/[A-Z]/.test(v))} Al menos 1 mayúscula`;
            document.getElementById('req-num').textContent   = `${tick(/[0-9]/.test(v))} Al menos 1 número`;
            document.getElementById('req-spec').textContent  = `${tick(/[*.\-_!@#$%^&()+={}[\]|\\:;"'<>,?/~\`]/.test(v))} Al menos 1 carácter especial`;
            liveValidate(passEl, RULES.password);
        });

        passConfirmEl.addEventListener('input', () => {
            const match = passConfirmEl.value === passEl.value;
            passConfirmEl.style.borderColor = passConfirmEl.value ? (match ? 'var(--success)' : 'var(--danger)') : '';
        });

        // ── Submit ────────────────────────────────────────────────────────────
        document.getElementById('registerForm').addEventListener('submit', async e => {
            e.preventDefault();
            const errEl = document.getElementById('regError');
            clearError(errEl);

            const nombres     = nombresEl.value.trim();
            const apellidos   = apellidosEl.value.trim();
            const doc         = docEl.value.trim();
            const email       = emailEl.value.trim();
            const pass        = passEl.value;
            const passConfirm = passConfirmEl.value;

            // Validamos todos los campos y mostramos errores individuales
            let ok = true;
            if (!validate(nombres,   RULES.nombre,    document.getElementById('errNombres')))   ok = false;
            if (!validate(apellidos, RULES.nombre,    document.getElementById('errApellidos'))) ok = false;
            if (!validate(doc,       RULES.documento, document.getElementById('errDoc')))       ok = false;
            if (!validate(email,     RULES.email,     document.getElementById('errEmail')))     ok = false;
            if (!validate(pass,      RULES.password,  document.getElementById('errPass')))      ok = false;

            if (pass !== passConfirm) {
                showError(document.getElementById('errPassConfirm'), 'Las contraseñas no coinciden');
                ok = false;
            } else {
                clearError(document.getElementById('errPassConfirm'));
            }

            if (!ok) return;

            try {
                const payload = {
                    name:     `${nombres} ${apellidos}`,
                    document: doc,
                    email,
                    password: pass,
                    role_id:  3  // Estudiante por defecto
                };
                await registrarUsuario(payload);
                showSuccessToast('Cuenta creada exitosamente. Ya puedes iniciar sesión.');
                this.renderLogin();
            } catch (error) {
                // Mostramos el mensaje del backend (ej: "El documento o correo ya están registrados")
                showError(errEl, error.message || 'Error al registrar. Intenta de nuevo.');
            }
        });
    }

    // ─── FORGOT PASSWORD ──────────────────────────────────────────────────────
    renderForgotPassword() {
        this.container.innerHTML = `
            <div class="card" style="max-width:400px;margin:40px auto;animation:slideUpFade 0.4s var(--ease-smooth);">
                <div style="text-align:center;margin-bottom:25px;">
                    <h2 class="card__title" style="font-size:1.6rem;margin-bottom:5px;">Recuperar Cuenta</h2>
                    <p style="color:var(--text-muted);font-size:0.9rem;">Enviaremos un código OTP a tu correo</p>
                </div>
                <form id="forgotForm" class="form">
                    <div class="form__group">
                        <label class="form__label">Correo Electrónico</label>
                        <input type="email" id="forgotEmail" class="form__input" placeholder="tu-correo@ejemplo.com">
                        <span id="forgotError" style="color:var(--danger);font-size:0.85rem;min-height:16px;display:block;margin-top:3px;"></span>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full" style="width:100%;margin-top:10px;">Enviar Código</button>
                </form>
                <div style="text-align:center;margin-top:20px;">
                    <button id="btnBackLogin" style="background:none;border:none;color:var(--text-muted);font-size:0.9rem;cursor:pointer;text-decoration:underline;">Volver al Login</button>
                </div>
            </div>`;

        document.getElementById('btnBackLogin').onclick = () => this.renderLogin();
        document.getElementById('forgotForm').onsubmit = async e => {
            e.preventDefault();
            const errEl = document.getElementById('forgotError');
            clearError(errEl);
            const email = document.getElementById('forgotEmail').value.trim();
            if (!validate(email, RULES.email, errEl)) return;

            try {
                showInfoToast('Enviando código...');
                await solicitarRecuperacion(email);
                this.tempEmail = email;
                showSuccessToast('Código enviado exitosamente');
                this.renderVerifyOTP();
            } catch (err) { showError(errEl, err.message); }
        };
    }

    // ─── VERIFY OTP ───────────────────────────────────────────────────────────
    renderVerifyOTP() {
        this.container.innerHTML = `
            <div class="card" style="max-width:400px;margin:40px auto;animation:slideUpFade 0.4s var(--ease-smooth);">
                <div style="text-align:center;margin-bottom:25px;">
                    <h2 class="card__title" style="font-size:1.6rem;margin-bottom:5px;">Verificar Código</h2>
                    <p style="color:var(--text-muted);font-size:0.9rem;">Ingresa el código enviado a <b>${this.tempEmail}</b></p>
                </div>
                <form id="otpForm" class="form">
                    <div class="form__group">
                        <label class="form__label">Código OTP (6 dígitos)</label>
                        <input type="text" id="otpInput" class="form__input" maxlength="6"
                            style="text-align:center;font-size:1.8rem;letter-spacing:8px;font-weight:bold;">
                        <span id="otpError" style="color:var(--danger);font-size:0.85rem;min-height:16px;display:block;margin-top:3px;text-align:center;"></span>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full" style="width:100%;margin-top:10px;">Verificar</button>
                </form>
                <div style="text-align:center;margin-top:20px;">
                    <button id="btnCancelOTP" style="background:none;border:none;color:var(--text-muted);font-size:0.9rem;cursor:pointer;text-decoration:underline;">Cancelar</button>
                </div>
            </div>`;

        document.getElementById('btnCancelOTP').onclick = () => this.renderLogin();
        document.getElementById('otpForm').onsubmit = async e => {
            e.preventDefault();
            const errEl = document.getElementById('otpError');
            clearError(errEl);
            const otp = document.getElementById('otpInput').value.trim();
            if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
                return showError(errEl, 'El código debe tener exactamente 6 dígitos numéricos');
            }
            try {
                await verificarOTP(this.tempEmail, otp);
                this.tempOTP = otp;
                showSuccessToast('Código validado correctamente');
                this.renderResetPassword();
            } catch (err) { showError(errEl, err.message); }
        };
    }

    // ─── RESET PASSWORD ───────────────────────────────────────────────────────
    renderResetPassword() {
        this.container.innerHTML = `
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

                    <!-- Indicador de requisitos -->
                    <div id="resetPassReqs" style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:8px;padding:12px;margin-bottom:12px;display:none;">
                        <p style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin:0 0 8px;">Requisitos</p>
                        <div style="display:flex;flex-direction:column;gap:4px;">
                            <span id="rreq-len"   style="font-size:0.8rem;">⬜ Mínimo 6 caracteres</span>
                            <span id="rreq-upper" style="font-size:0.8rem;">⬜ Al menos 1 mayúscula</span>
                            <span id="rreq-num"   style="font-size:0.8rem;">⬜ Al menos 1 número</span>
                            <span id="rreq-spec"  style="font-size:0.8rem;">⬜ Al menos 1 carácter especial</span>
                        </div>
                    </div>

                    <div class="form__group">
                        <label class="form__label">Confirmar Contraseña <span style="color:var(--danger)">*</span></label>
                        <input type="password" id="confirmNewPass" class="form__input" placeholder="••••••••">
                        <span id="errConfirmPass" style="color:var(--danger);font-size:0.78rem;min-height:16px;display:block;margin-top:3px;"></span>
                    </div>

                    <div style="min-height:20px;text-align:center;margin-bottom:8px;">
                        <span id="resetError" style="color:var(--danger);font-size:0.85rem;"></span>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full" style="width:100%;">Actualizar Contraseña</button>
                </form>
            </div>`;

        const newPassEl     = document.getElementById('newPass');
        const confirmPassEl = document.getElementById('confirmNewPass');

        // Indicador en tiempo real
        newPassEl.addEventListener('focus', () => document.getElementById('resetPassReqs').style.display = 'block');
        newPassEl.addEventListener('blur',  () => {
            if (!newPassEl.value) document.getElementById('resetPassReqs').style.display = 'none';
        });
        newPassEl.addEventListener('input', () => {
            const v = newPassEl.value;
            const tick = ok => ok ? '✅' : '⬜';
            document.getElementById('rreq-len').textContent   = `${tick(v.length >= 6)} Mínimo 6 caracteres`;
            document.getElementById('rreq-upper').textContent = `${tick(/[A-Z]/.test(v))} Al menos 1 mayúscula`;
            document.getElementById('rreq-num').textContent   = `${tick(/[0-9]/.test(v))} Al menos 1 número`;
            document.getElementById('rreq-spec').textContent  = `${tick(/[*.\-_!@#$%^&()+={}[\]|\\:;"'<>,?/~\`]/.test(v))} Al menos 1 carácter especial`;
            liveValidate(newPassEl, RULES.password);
        });

        confirmPassEl.addEventListener('input', () => {
            const match = confirmPassEl.value === newPassEl.value;
            confirmPassEl.style.borderColor = confirmPassEl.value ? (match ? 'var(--success)' : 'var(--danger)') : '';
        });

        document.getElementById('resetForm').onsubmit = async e => {
            e.preventDefault();
            const errEl      = document.getElementById('resetError');
            const errNewEl   = document.getElementById('errNewPass');
            const errConfEl  = document.getElementById('errConfirmPass');
            clearError(errEl); clearError(errNewEl); clearError(errConfEl);

            const pass    = newPassEl.value;
            const confirm = confirmPassEl.value;

            let ok = true;
            if (!validate(pass, RULES.password, errNewEl)) ok = false;

            if (pass !== confirm) {
                showError(errConfEl, 'Las contraseñas no coinciden');
                ok = false;
            } else {
                clearError(errConfEl);
            }

            if (!ok) return;

            try {
                await resetPassword(this.tempEmail, this.tempOTP, pass);
                showSuccessToast('¡Contraseña actualizada con éxito!');
                this.tempEmail = '';
                this.tempOTP   = '';
                this.renderLogin();
            } catch (err) {
                // El backend lanzará error si la contraseña es igual a la anterior
                showError(errEl, err.message || 'Error al restablecer la contraseña');
            }
        };
    }
}