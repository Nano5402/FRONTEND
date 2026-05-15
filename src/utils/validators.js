/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  utils/validators.js — REGLAS DE VALIDACIÓN CENTRALIZADAS            ║
 * ║                                                                      ║
 * ║  Todas las reglas de validación del frontend viven aquí.             ║
 * ║  Si se necesita cambiar una regla (ej: documento mínimo 8 dígitos),  ║
 * ║  solo se modifica este archivo.                                       ║
 * ║                                                                      ║
 * ║  SE USA EN:                                                           ║
 * ║    - Register.view.js   (formulario de registro)                     ║
 * ║    - ForgotPassword.view.js (reset de contraseña)                    ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

/**
 * RULES — Objeto con las reglas de validación del sistema.
 * Cada regla tiene:
 *   test(value) → función que evalúa si el valor es válido (true/false)
 *   msg         → mensaje de error que se muestra al usuario
 */
export const RULES = {
    /**
     * nombre — Para campos de nombres y apellidos.
     * Acepta: letras, tildes (À-ÿ), ñ, Ñ y espacios.
     * Rechaza: números, caracteres especiales como @#$%
     * Mínimo 3 caracteres.
     */
    nombre: {
        test: v => /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]{3,}$/.test(v.trim()),
        msg:  'Mínimo 3 letras, sin números ni caracteres especiales',
    },

    /**
     * documento — Solo dígitos, mínimo 7.
     * Acepta: 1234567, 1097789129
     * Rechaza: abc123, 123-456, 12 34 (con espacios o guiones)
     */
    documento: {
        test: v => /^\d{7,}$/.test(v.trim()),
        msg:  'Solo números, mínimo 7 dígitos',
    },

    /**
     * email — Formato básico de correo electrónico.
     * Acepta: usuario@dominio.com, correo@sena.edu.co
     * Rechaza: sinArroba, sin@punto, @sinusuario
     */
    email: {
        test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
        msg:  'Ingresa un correo electrónico válido',
    },

    /**
     * password — Contraseña segura.
     * Requiere TODOS los siguientes:
     *   ✅ Mínimo 6 caracteres
     *   ✅ Al menos 1 letra MAYÚSCULA (en cualquier posición)
     *   ✅ Al menos 1 número
     *   ✅ Al menos 1 carácter especial: * . - _ ! @ # $ % etc.
     *
     * Acepta: Segura1! , Pass@123 , Mi_Clave9
     * Rechaza: sinmayus1!, SinNumero!, sinEspecial1
     */
    password: {
        test: v => v.length >= 6
                && /[A-Z]/.test(v)      // al menos 1 mayúscula
                && /[0-9]/.test(v)      // al menos 1 número
                && /[*.\-_!@#$%^&()+={}[\]|\\:;"'<>,?/~`]/.test(v), // al menos 1 especial
        msg:  'Mínimo 6 caracteres, 1 mayúscula, 1 número y 1 carácter especial',
    },
};

/**
 * validate(value, rule, errorEl)
 * Valida un valor contra una regla y actualiza el span de error en el DOM.
 *
 * @param {string}      value   - Valor a validar (ej: el texto del input)
 * @param {object}      rule    - Una de las reglas de RULES
 * @param {HTMLElement} errorEl - Elemento <span> donde mostrar el error
 * @returns {boolean} true si es válido, false si no
 *
 * Uso:
 *   const ok = validate(nombre, RULES.nombre, document.getElementById('errNombres'))
 */
export function validate(value, rule, errorEl) {
    if (!rule.test(value)) {
        if (errorEl) errorEl.textContent = rule.msg; // muestra el error
        return false;
    }
    if (errorEl) errorEl.textContent = ''; // limpia el error si antes había uno
    return true;
}

/**
 * liveValidate(inputEl, rule)
 * Feedback visual en tiempo real mientras el usuario escribe.
 * Cambia el borde del input a verde (válido) o rojo (inválido).
 *
 * No muestra texto de error — solo el color del borde.
 * Se usa junto con addEventListener('input', ...) en los formularios.
 *
 * @param {HTMLInputElement} inputEl - El input a evaluar
 * @param {object}           rule    - Una de las reglas de RULES
 */
export function liveValidate(inputEl, rule) {
    const ok = rule.test(inputEl.value);
    // Solo coloreamos si hay contenido (si está vacío no mostramos nada)
    inputEl.style.borderColor = inputEl.value
        ? (ok ? 'var(--success)' : 'var(--danger)')
        : '';
}

/**
 * passwordStrengthHTML(idPrefix)
 * Genera el HTML del indicador de requisitos de contraseña.
 * Los IDs usan el prefijo para evitar conflictos si hay dos formularios.
 *
 * @param {string} idPrefix - Prefijo para los IDs (ej: 'reg', 'reset')
 * @returns {string} HTML string del indicador
 *
 * Uso:
 *   // En el template del formulario:
 *   ${passwordStrengthHTML('reg')}
 *
 *   // Luego en bind:
 *   attachPasswordStrength(passEl, 'reg')
 */
export function passwordStrengthHTML(idPrefix = '') {
    return `
    <div id="${idPrefix}passReqs" style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:8px;padding:12px;margin-bottom:12px;display:none;">
        <p style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin:0 0 8px;">Requisitos de la contraseña</p>
        <div style="display:flex;flex-direction:column;gap:4px;">
            <span id="${idPrefix}req-len"   style="font-size:0.8rem;">⬜ Mínimo 6 caracteres</span>
            <span id="${idPrefix}req-upper" style="font-size:0.8rem;">⬜ Al menos 1 mayúscula</span>
            <span id="${idPrefix}req-num"   style="font-size:0.8rem;">⬜ Al menos 1 número</span>
            <span id="${idPrefix}req-spec"  style="font-size:0.8rem;">⬜ Al menos 1 carácter especial (* . - _ ! @ # etc.)</span>
        </div>
    </div>`;
}

/**
 * attachPasswordStrength(inputEl, prefix)
 * Conecta un input de contraseña con el indicador de requisitos.
 * Actualiza los checkmarks en tiempo real mientras el usuario escribe.
 *
 * @param {HTMLInputElement} inputEl - El input type="password"
 * @param {string}           prefix  - El mismo prefijo usado en passwordStrengthHTML
 *
 * Comportamiento:
 *   - Al hacer FOCUS en el input → aparece el indicador
 *   - Al escribir → cada requisito se marca ✅ o ⬜ según se cumpla
 *   - Al hacer BLUR si está vacío → se oculta el indicador
 */
export function attachPasswordStrength(inputEl, prefix = '') {
    const reqs   = document.getElementById(`${prefix}passReqs`);
    const lenEl  = document.getElementById(`${prefix}req-len`);
    const upEl   = document.getElementById(`${prefix}req-upper`);
    const numEl  = document.getElementById(`${prefix}req-num`);
    const specEl = document.getElementById(`${prefix}req-spec`);

    const t = ok => ok ? '✅' : '⬜'; // tick o cuadro vacío
    const SPECIAL = /[*.\-_!@#$%^&()+={}[\]|\\:;"'<>,?/~`]/;

    // Mostrar al enfocar
    inputEl.addEventListener('focus', () => reqs && (reqs.style.display = 'block'));

    // Ocultar al perder foco si está vacío
    inputEl.addEventListener('blur', () => {
        if (!inputEl.value && reqs) reqs.style.display = 'none';
    });

    // Actualizar checkmarks mientras escribe
    inputEl.addEventListener('input', () => {
        const v = inputEl.value;
        if (lenEl)  lenEl.textContent  = `${t(v.length >= 6)} Mínimo 6 caracteres`;
        if (upEl)   upEl.textContent   = `${t(/[A-Z]/.test(v))} Al menos 1 mayúscula`;
        if (numEl)  numEl.textContent  = `${t(/[0-9]/.test(v))} Al menos 1 número`;
        if (specEl) specEl.textContent = `${t(SPECIAL.test(v))} Al menos 1 carácter especial`;
        liveValidate(inputEl, RULES.password); // también actualiza el borde del input
    });
}