/**
 * ============================================
 * NOTIFICACIONES.JS — Módulo de notificaciones
 * Librería externa: Notyf v3 (instalada con npm)
 * ============================================
 *
 * ¿POR QUÉ NOTYF?
 * • Instalación: npm install notyf (1 comando)
 * • API mínima: new Notyf() → .success() / .error()
 * • Diseño profesional sin configuración extra
 * • 3 KB minificado — impacto casi nulo en el build
 * • Compatible 100% con Vite y ES Modules
 *
 * SEPARACIÓN DE RESPONSABILIDADES (RNF01):
 * Este archivo es el único punto del proyecto que
 * importa y configura Notyf. El resto del código
 * llama a showSuccessToast(), showErrorToast(), etc.
 * Si algún día se cambia la librería, solo se edita
 * este archivo — script.js no se toca.
 *
  * Sprint: v3.0.0
 * ============================================
 */

// ── Importaciones de Notyf ──────────────────────────────────
// Vite resuelve estas rutas desde node_modules automáticamente
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';   // estilos base de la librería

// ── Instancia única (patrón Singleton) ─────────────────────
// Una sola instancia para todo el proyecto.
// Si se crean múltiples instancias, las notificaciones
// se acumulan y pierden el control de posición.
const notyf = new Notyf({
    duration:  3500,           // ms antes de desaparecer
    position: {
        x: 'right',
        y: 'bottom'            // misma posición que los toasts anteriores
    },
    dismissible: true,         // el usuario puede cerrarla con ×
    ripple: true,              // animación de onda al aparecer

    // Tipos personalizados que respetan la paleta del proyecto
    types: [
        {
            type:            'warning',
            background:      '#d99a4e',
            icon: {
                className:   'notyf-icon--warning',
                tagName:     'span',
                text:        '⚠'
            }
        },
        {
            type:            'info',
            background:      '#5c8eb3',
            icon: {
                className:   'notyf-icon--info',
                tagName:     'span',
                text:        'ℹ'
            }
        }
    ]
});

// ── API pública ─────────────────────────────────────────────
// Mismos nombres que el toast.js anterior → script.js
// no necesita cambiar sus llamadas.

/**
 * Notificación de éxito (fondo verde)
 * @param {string} mensaje
 */
export function showSuccessToast(mensaje) {
    notyf.success(mensaje);
}

/**
 * Notificación de error (fondo rojo)
 * @param {string} mensaje
 */
export function showErrorToast(mensaje) {
    notyf.error(mensaje);
}

/**
 * Notificación de advertencia (fondo naranja — tipo personalizado)
 * @param {string} mensaje
 */
export function showWarningToast(mensaje) {
    notyf.open({ type: 'warning', message: mensaje });
}

/**
 * Notificación informativa (fondo azul — tipo personalizado)
 * @param {string} mensaje
 */
export function showInfoToast(mensaje) {
    notyf.open({ type: 'info', message: mensaje });
}