/**
 * ============================================
 * TOAST.JS - Componente de notificaciones
 * ============================================
<<<<<<< dev
 */

export function getToastContainer() {
=======
 *
 * Notificaciones no intrusivas que aparecen
 * en la esquina inferior derecha
 */

/**
 * Crear un contenedor para los toasts si no existe
 */
function getToastContainer() {
>>>>>>> release
    let container = document.getElementById("toast-container");
    
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
<<<<<<< dev
        container.classList.add("toast-container"); // Añadido para que tome tu CSS
=======
        container.style.position = "fixed";
        container.style.bottom = "var(--spacing-lg)";
        container.style.right = "var(--spacing-lg)";
        container.style.zIndex = "var(--z-index-modal)";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "var(--spacing-md)";
        container.style.pointerEvents = "none";
>>>>>>> release
        document.body.appendChild(container);
    }
    
    return container;
}

<<<<<<< dev
export function showToast(mensaje, tipo = "toast--info", duracion = 3000) {
=======
/**
 * Muestra una notificación toast
 * @param {string} mensaje - Texto de la notificación
 * @param {string} tipo - success, error, warning, info
 * @param {number} duracion - Milisegundos (default: 3000)
 */
function showToast(mensaje, tipo = "info", duracion = 3000) {
>>>>>>> release
    const container = getToastContainer();

    const toast = document.createElement("div");
    toast.classList.add("toast", tipo);
    toast.style.pointerEvents = "auto";

    const mensajeEl = document.createElement("div");
    mensajeEl.classList.add("toast__message");
    mensajeEl.textContent = mensaje;

    toast.appendChild(mensajeEl);
    container.appendChild(toast);

<<<<<<< dev
    if (duracion > 0) {
        setTimeout(() => {
            toast.classList.add("fade-out-toast"); // Ajustado a tu clase CSS
=======
    // Auto-remover después del tiempo especificado
    if (duracion > 0) {
        setTimeout(() => {
            toast.classList.add("fade-out");
>>>>>>> release
            setTimeout(() => {
                toast.remove();
            }, 200);
        }, duracion);
    }

    return toast;
}

<<<<<<< dev
export function showSuccessToast(mensaje, duracion = 3000) {
    return showToast(mensaje, "toast--success", duracion);
}

export function showErrorToast(mensaje, duracion = 3000) {
    return showToast(mensaje, "toast--error", duracion);
}

export function showWarningToast(mensaje, duracion = 3000) {
    return showToast(mensaje, "toast--warning", duracion);
}

export function showInfoToast(mensaje, duracion = 3000) {
    return showToast(mensaje, "toast--info", duracion);
}
=======
/**
 * Muestra un toast de éxito
 */
function showSuccessToast(mensaje, duracion = 3000) {
    return showToast(mensaje, "success", duracion);
}

/**
 * Muestra un toast de error
 */
function showErrorToast(mensaje, duracion = 3000) {
    return showToast(mensaje, "error", duracion);
}

/**
 * Muestra un toast de advertencia
 */
function showWarningToast(mensaje, duracion = 3000) {
    return showToast(mensaje, "warning", duracion);
}

/**
 * Muestra un toast de información
 */
function showInfoToast(mensaje, duracion = 3000) {
    return showToast(mensaje, "info", duracion);
}
>>>>>>> release
