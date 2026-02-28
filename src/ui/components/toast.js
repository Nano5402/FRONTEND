// src/ui/components/toast.js
// Componente para notificaciones breves en pantalla.

/**
 * Retorna el contenedor de toasts. Si no existe, lo crea.
 */
/**
 * @deprecated desde v3.0.0
 * Reemplazado por notificaciones.js que usa Notyf (npm).
 * Se conserva como referencia histórica del sprint anterior.
 */


export function getToastContainer() {
    let container = document.getElementById('toast-container');

    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.classList.add('toast-container');
        document.body.appendChild(container);
    }

    return container;
}

/**
 * Muestra una notificación y la elimina después del tiempo indicado.
 */
export function showToast(mensaje, tipo = 'toast--info', duracion = 3000) {
    const container = getToastContainer();

    const toast = document.createElement('div');
    toast.classList.add('toast', tipo);
    toast.style.pointerEvents = 'auto';

    const mensajeEl = document.createElement('div');
    mensajeEl.classList.add('toast__message');
    mensajeEl.textContent = mensaje;

    toast.appendChild(mensajeEl);
    container.appendChild(toast);

    if (duracion > 0) {
        setTimeout(() => {
            toast.classList.add('fade-out-toast');
            setTimeout(() => {
                toast.remove();
            }, 200);
        }, duracion);
    }

    return toast;
}

/**
 * Atajos para tipos de toast comunes.
 */
export function showSuccessToast(mensaje, duracion = 3000) {
    return showToast(mensaje, 'toast--success', duracion);
}

export function showErrorToast(mensaje, duracion = 3000) {
    return showToast(mensaje, 'toast--error', duracion);
}

export function showWarningToast(mensaje, duracion = 3000) {
    return showToast(mensaje, 'toast--warning', duracion);
}

export function showInfoToast(mensaje, duracion = 3000) {
    return showToast(mensaje, 'toast--info', duracion);
}
