// src/utils/domHelpers.js
// Utilidades simples para validación y mensajes en formularios.

/**
 * Verifica si un texto tiene contenido real.
 * Entrada: valor escrito por el usuario.
 * Salida: true si hay texto, false si está vacío.
 */
export function isValidInput(value) {
    return value.trim().length > 0;
}

/**
 * Muestra un mensaje de error en un elemento del DOM.
 */
export function showError(errorElement, message) {
    if (errorElement) errorElement.textContent = message;
}

/**
 * Limpia el mensaje de error de un elemento del DOM.
 */
export function clearError(errorElement) {
    if (errorElement) errorElement.textContent = "";
}
