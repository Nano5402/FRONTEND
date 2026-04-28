import { loginConBackend, registrarUsuario, solicitarRecuperacion, verificarOTP, resetPassword } from '../../api/usuariosApi.js';
import { showSuccessToast, showErrorToast, showInfoToast } from '../components/notificaciones.js';
import { isValidInput, showError, clearError } from '../../utils/domHelpers.js';

export class AuthView {
    constructor(containerId, onLoginSuccess) {
        this.container = document.getElementById(containerId);
        this.onLoginSuccess = onLoginSuccess;
        this.tempEmail = ''; // Almacena el correo durante el flujo
        this.tempOTP = '';   // Almacena el código validado
    }

    renderLogin() {
        this.container.innerHTML = `
            <div class="card" style="max-width: 400px; margin: 40px auto; animation: slideUpFade 0.4s var(--ease-smooth);">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 class="card__title" style="font-size: 1.8rem; margin-bottom: 5px;">Bienvenido</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Ingresa a tu cuenta para continuar</p>
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
                    <div style="min-height: 20px; margin-top: 5px; text-align: center;">
                        <span class="form__error" id="loginError" style="color: var(--danger); font-size: 0.85rem;"></span>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full" style="width: 100%;">Ingresar</button>
                </form>
                <div style="text-align: center; margin-top: 20px; font-size: 0.9rem;">
                    <span style="color: var(--text-muted);">¿No tienes cuenta?</span>
                    <button id="btnGoToRegister" class="btn btn--outline btn--sm" style="border: none; color: var(--brand-primary); padding: 0;">Regístrate</button>
                </div>
            </div>
        `;
        this.attachLoginEvents();
    }

    renderRegister() {
        this.container.innerHTML = `
            <div class="card" style="max-width: 500px; margin: 40px auto; animation: slideUpFade 0.4s var(--ease-smooth);">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 class="card__title" style="font-size: 1.8rem; margin-bottom: 5px;">Crear Cuenta</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Separamos tus datos para mayor seguridad</p>
                </div>
                <form id="registerForm" class="form" novalidate>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form__group">
                            <label for="regNombres" class="form__label">Nombres</label>
                            <input type="text" id="regNombres" class="form__input" placeholder="Juan Carlos">
                        </div>
                        <div class="form__group">
                            <label for="regApellidos" class="form__label">Apellidos</label>
                            <input type="text" id="regApellidos" class="form__input" placeholder="Pérez Gómez">
                        </div>
                    </div>
                    <div class="form__group">
                        <label for="regDoc" class="form__label">Documento</label>
                        <input type="text" id="regDoc" class="form__input" placeholder="Solo números">
                    </div>
                    <div class="form__group">
                        <label for="regEmail" class="form__label">Correo Electrónico</label>
                        <input type="email" id="regEmail" class="form__input" placeholder="correo@sena.edu.co">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form__group">
                            <label for="regPass" class="form__label">Contraseña</label>
                            <input type="password" id="regPass" class="form__input" placeholder="Mínimo 6 carácteres">
                        </div>
                        <div class="form__group">
                            <label for="regPassConfirm" class="form__label">Confirmar Contraseña</label>
                            <input type="password" id="regPassConfirm" class="form__input" placeholder="Repite la contraseña">
                        </div>
                    </div>
                    <div style="min-height: 20px; margin-top: 5px; text-align: center;">
                        <span class="form__error" id="regError" style="color: var(--danger); font-size: 0.85rem;"></span>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full" style="width: 100%;">Registrarme</button>
                </form>
                <div style="text-align: center; margin-top: 20px; font-size: 0.9rem;">
                    <span style="color: var(--text-muted);">¿Ya tienes cuenta?</span>
                    <button id="btnGoToLogin" class="btn btn--outline btn--sm" style="border: none; color: var(--brand-primary); padding: 0;">Inicia Sesión</button>
                </div>
            </div>
        `;
        this.attachRegisterEvents();
    }

    attachLoginEvents() {
        document.getElementById('btnGoToRegister').addEventListener('click', () => this.renderRegister());
        
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errEl = document.getElementById('loginError');
            clearError(errEl);

            const doc = document.getElementById('docLogin').value.trim();
            const pass = document.getElementById('passLogin').value.trim();

            if (!isValidInput(doc) || !pass) {
                return showError(errEl, 'El documento y la contraseña son obligatorios.');
            }

            try {
                const usuario = await loginConBackend(doc, pass);
                if (usuario) {
                    showSuccessToast(`¡Bienvenido, ${usuario.name}!`);
                    this.onLoginSuccess(usuario);
                } else {
                    showError(errEl, 'Credenciales inválidas.');
                }
            } catch (error) {
                showErrorToast('Error de conexión con el servidor.');
            }
        });
    }

    attachRegisterEvents() {
        document.getElementById('btnGoToLogin').addEventListener('click', () => this.renderLogin());

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errEl = document.getElementById('regError');
            clearError(errEl);

            const nombres = document.getElementById('regNombres').value.trim();
            const apellidos = document.getElementById('regApellidos').value.trim();
            const doc = document.getElementById('regDoc').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const pass = document.getElementById('regPass').value.trim();
            const passConfirm = document.getElementById('regPassConfirm').value.trim();

            // Validaciones Estrictas (Criterio de Aceptación)
            if (!nombres || !apellidos || !doc || !email || !pass || !passConfirm) {
                return showError(errEl, 'Todos los campos son obligatorios.');
            }
            if (!/^\d+$/.test(doc)) {
                return showError(errEl, 'El documento solo debe contener números.');
            }
            if (pass !== passConfirm) {
                return showError(errEl, 'Las contraseñas no coinciden.');
            }
            if (pass.length < 4) {
                return showError(errEl, 'La contraseña debe tener al menos 4 caracteres.');
            }

            try {
                // Concatenamos nombres y apellidos antes de enviar
                const payload = {
                    name: `${nombres} ${apellidos}`,
                    document: doc,
                    email: email,
                    password: pass,
                    role_id: 3 // Estudiante por defecto
                };

                await registrarUsuario(payload);
                showSuccessToast('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
                this.renderLogin(); // Lo devolvemos al login para que entre
            } catch (error) {
                showError(errEl, error.message || 'Error al registrar el usuario.');
            }
        });
  }
  
  renderForgotPassword() {
        this.container.innerHTML = `
            <div class="card" style="max-width: 400px; margin: 40px auto; animation: slideUpFade 0.4s var(--ease-smooth);">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 class="card__title" style="font-size: 1.6rem; margin-bottom: 5px;">Recuperar Cuenta</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Enviaremos un código OTP a tu correo</p>
                </div>
                <form id="forgotForm" class="form">
                    <div class="form__group">
                        <label class="form__label">Correo Electrónico</label>
                        <input type="email" id="forgotEmail" class="form__input" placeholder="tu-correo@sena.edu.co">
                    </div>
                    <div style="min-height: 20px; text-align: center;">
                        <span id="forgotError" style="color: var(--danger); font-size: 0.85rem;"></span>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full">Enviar Código</button>
                </form>
                <button id="btnBackLogin" class="btn btn--outline btn--full" style="margin-top: 15px; border:none;">Volver al Login</button>
            </div>
        `;
        document.getElementById('btnBackLogin').onclick = () => this.renderLogin();
        document.getElementById('forgotForm').onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value.trim();
            if(!email) return showError(document.getElementById('forgotError'), "Ingresa tu correo");
            
            try {
                showInfoToast("Enviando código...");
                await solicitarRecuperacion(email);
                this.tempEmail = email;
                showSuccessToast("Código enviado a Mailtrap");
                this.renderVerifyOTP();
            } catch (err) { showError(document.getElementById('forgotError'), err.message); }
        };
    }

    renderVerifyOTP() {
        this.container.innerHTML = `
            <div class="card" style="max-width: 400px; margin: 40px auto; animation: slideUpFade 0.4s var(--ease-smooth);">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 class="card__title" style="font-size: 1.6rem; margin-bottom: 5px;">Verificar Código</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Ingresa el código enviado a <b>${this.tempEmail}</b></p>
                </div>
                <form id="otpForm" class="form">
                    <div class="form__group">
                        <label class="form__label">Código OTP (6 dígitos)</label>
                        <input type="text" id="otpInput" class="form__input" maxlength="6" style="text-align: center; font-size: 1.5rem; letter-spacing: 5px;">
                    </div>
                    <div style="min-height: 20px; text-align: center;">
                        <span id="otpError" style="color: var(--danger); font-size: 0.85rem;"></span>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full">Verificar</button>
                </form>
            </div>
        `;
        document.getElementById('otpForm').onsubmit = async (e) => {
            e.preventDefault();
            const otp = document.getElementById('otpInput').value.trim();
            try {
                await verificarOTP(this.tempEmail, otp);
                this.tempOTP = otp;
                showSuccessToast("Código válido");
                this.renderResetPassword();
            } catch (err) { showError(document.getElementById('otpError'), err.message); }
        };
    }

    renderResetPassword() {
        this.container.innerHTML = `
            <div class="card" style="max-width: 400px; margin: 40px auto; animation: slideUpFade 0.4s var(--ease-smooth);">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 class="card__title" style="font-size: 1.6rem; margin-bottom: 5px;">Nueva Contraseña</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Define tu nueva clave de acceso</p>
                </div>
                <form id="resetForm" class="form">
                    <div class="form__group">
                        <label class="form__label">Contraseña Nueva</label>
                        <input type="password" id="newPass" class="form__input" placeholder="••••••••">
                    </div>
                    <div class="form__group">
                        <label class="form__label">Confirmar Contraseña</label>
                        <input type="password" id="confirmNewPass" class="form__input" placeholder="••••••••">
                    </div>
                    <div style="min-height: 20px; text-align: center;">
                        <span id="resetError" style="color: var(--danger); font-size: 0.85rem;"></span>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full">Restablecer Contraseña</button>
                </form>
            </div>
        `;
        document.getElementById('resetForm').onsubmit = async (e) => {
            e.preventDefault();
            const pass = document.getElementById('newPass').value.trim();
            const confirm = document.getElementById('confirmNewPass').value.trim();
            if(pass !== confirm) return showError(document.getElementById('resetError'), "Las contraseñas no coinciden");
            
            try {
                await resetPassword(this.tempEmail, this.tempOTP, pass);
                showSuccessToast("Contraseña actualizada con éxito");
                this.renderLogin();
            } catch (err) { showError(document.getElementById('resetError'), err.message); }
        };
    }

    attachLoginEvents() {
        // Agregamos el link de "Olvidé mi contraseña" en el login
        const forgotLink = document.createElement('div');
        forgotLink.style = "text-align: right; margin-top: -10px; margin-bottom: 15px;";
        forgotLink.innerHTML = `<button id="btnGoForgot" style="background:none; border:none; color:var(--brand-primary); font-size:0.8rem; cursor:pointer;">¿Olvidaste tu contraseña?</button>`;
        
        const form = document.getElementById('loginForm');
        form.insertBefore(forgotLink, form.querySelector('button[type="submit"]'));

        document.getElementById('btnGoForgot').onclick = () => this.renderForgotPassword();
        document.getElementById('btnGoToRegister').onclick = () => this.renderRegister();
        
        // ... (resto del evento submit de login se mantiene igual) ...
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errEl = document.getElementById('loginError');
            clearError(errEl);
            const doc = document.getElementById('docLogin').value.trim();
            const pass = document.getElementById('passLogin').value.trim();
            if (!isValidInput(doc) || !pass) return showError(errEl, 'Documento y contraseña obligatorios.');
            try {
                const usuario = await loginConBackend(doc, pass);
                if (usuario) {
                    showSuccessToast(`¡Bienvenido!`);
                    this.onLoginSuccess(usuario);
                } else { showError(errEl, 'Credenciales inválidas.'); }
            } catch (error) { showErrorToast('Error de conexión.'); }
        });
    }
}
