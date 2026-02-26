/**
 * ============================================
 * TOAST.JS - Componente de notificaciones
 * ============================================
 */

export function getToastContainer() {
    let container = document.getElementById("toast-container");
    
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.classList.add("toast-container"); 
        document.body.appendChild(container);
    }
    
    return container;
}

export function showToast(mensaje, tipo = "toast--info", duracion = 3000) {
    const container = getToastContainer();

    const toast = document.createElement("div");
    toast.classList.add("toast", tipo);
    toast.style.pointerEvents = "auto";

    const mensajeEl = document.createElement("div");
    mensajeEl.classList.add("toast__message");
    mensajeEl.textContent = mensaje;

    toast.appendChild(mensajeEl);
    container.appendChild(toast);

    if (duracion > 0) {
        setTimeout(() => {
            toast.classList.add("fade-out-toast"); 
            setTimeout(() => {
                toast.remove();
            }, 200);
        }, duracion);
    }

    return toast;
}

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