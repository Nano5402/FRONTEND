/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  utils/dom.js — HELPERS DE MANIPULACIÓN DEL DOM                      ║
 * ║                                                                      ║
 * ║  Funciones de utilidad pequeñas para trabajar con el DOM.            ║
 * ║  Evitan repetir querySelector, innerHTML, etc. en múltiples sitios.  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

/**
 * $(selector, ctx?)
 * Shorthand para querySelector. Busca el PRIMER elemento que coincida.
 *
 * @param {string}      selector - Selector CSS (ej: '#loginForm', '.btn')
 * @param {HTMLElement} ctx      - Contexto de búsqueda (default: document)
 * @returns {HTMLElement|null}
 *
 * Uso:
 *   const form = $('#loginForm')           // busca en todo el documento
 *   const btn  = $('.btn', modal)          // busca dentro de un modal
 */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);

/**
 * $$(selector, ctx?)
 * Shorthand para querySelectorAll. Devuelve TODOS los elementos como Array.
 * (querySelectorAll devuelve NodeList, que no tiene .forEach en todos los browsers)
 *
 * Uso:
 *   $$('.student-item').forEach(item => item.addEventListener(...))
 */
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * showError(el, msg)
 * Muestra un mensaje de error en un elemento del DOM.
 * Generalmente se usa con los <span> de error debajo de los inputs.
 *
 * Uso:
 *   showError(document.getElementById('errEmail'), 'Correo inválido')
 */
export function showError(el, msg) {
    if (el) el.textContent = msg;
}

/**
 * clearError(el)
 * Borra el mensaje de error de un elemento.
 * Se llama al inicio del submit para limpiar errores previos.
 *
 * Uso:
 *   clearError(document.getElementById('errEmail'))
 */
export function clearError(el) {
    if (el) el.textContent = '';
}

/**
 * isValidInput(value)
 * Verifica que un string no esté vacío después de eliminar espacios.
 * Se usa para validación básica antes de hacer peticiones al backend.
 *
 * @param {string} value
 * @returns {boolean}
 *
 * Uso:
 *   if (!isValidInput(doc)) return showError(errEl, 'Campo obligatorio')
 */
export function isValidInput(v) {
    return v?.trim().length > 0;
}

/**
 * el(tag, attrs?, children?)
 * Crea un elemento HTML programáticamente con atributos y contenido.
 * Alternativa a innerHTML cuando se necesita más control.
 *
 * @param {string} tag      - Nombre del tag HTML (ej: 'div', 'button')
 * @param {object} attrs    - Atributos a asignar (class, id, style, data-*)
 * @param {string|HTMLElement} children - Contenido HTML o elemento hijo
 *
 * Uso:
 *   const btn = el('button', { class: 'btn btn--primary', type: 'button' }, 'Guardar')
 *   const div = el('div', { style: { color: 'red' } }, otroElemento)
 */
export function el(tag, attrs = {}, children = '') {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'class') {
            node.className = v;
        } else if (k === 'style' && typeof v === 'object') {
            Object.assign(node.style, v); // asigna múltiples estilos de una vez
        } else {
            node.setAttribute(k, v); // data-id, type, placeholder, etc.
        }
    });
    if (typeof children === 'string')       node.innerHTML = children;
    else if (children instanceof HTMLElement) node.appendChild(children);
    return node;
}