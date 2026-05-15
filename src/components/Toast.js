/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  components/Toast.js — NOTIFICACIONES TIPO TOAST                     ║
 * ║                                                                      ║
 * ║  Un "toast" es la notificación pequeña que aparece en una esquina    ║
 * ║  de la pantalla y desaparece sola después de unos segundos.         ║
 * ║  (Como el pan que salta de la tostadora — de ahí el nombre)         ║
 * ║                                                                      ║
 * ║  Usa la librería Notyf (instalada con npm install notyf).           ║
 * ║                                                                      ║
 * ║  POR QUÉ TENERLO EN UN COMPONENTE SEPARADO:                          ║
 * ║  Si algún día se cambia Notyf por otra librería (SweetAlert, etc.)   ║
 * ║  solo se modifica ESTE archivo. El resto de la app llama             ║
 * ║  toast.success() sin saber qué librería hay por debajo.             ║
 * ║                                                                      ║
 * ║  TIPOS DISPONIBLES:                                                  ║
 * ║    toast.success('mensaje') → verde  ✅ (acciones exitosas)          ║
 * ║    toast.error('mensaje')   → rojo   ❌ (errores)                    ║
 * ║    toast.warning('mensaje') → naranja ⚠️ (advertencias)             ║
 * ║    toast.info('mensaje')    → azul   ℹ️ (información neutral)        ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { Notyf } from 'notyf';
import 'notyf/notyf.min.css'; // estilos de la librería (Vite los importa automáticamente)

// Instancia única de Notyf — patrón Singleton
// Una sola instancia para toda la app evita que las notificaciones
// se acumulen en posiciones diferentes
const notyf = new Notyf({
    duration:    3500,    // milisegundos antes de desaparecer automáticamente
    position:    { x: 'right', y: 'bottom' }, // esquina inferior derecha
    dismissible: true,    // el usuario puede cerrarla manualmente con ×
    ripple:      true,    // animación de onda al aparecer

    // Definimos tipos personalizados para warning e info
    // (Notyf solo trae success y error por defecto)
    types: [
        {
            type:       'warning',
            background: '#d99a4e', // naranja
            icon: { tagName: 'span', text: '⚠' },
        },
        {
            type:       'info',
            background: '#5c8eb3', // azul
            icon: { tagName: 'span', text: 'ℹ' },
        },
    ],
});

// Objeto exportado — API simplificada para usar en toda la app
export const toast = {
    /** Notificación de éxito — fondo verde */
    success: msg => notyf.success(msg),

    /** Notificación de error — fondo rojo */
    error:   msg => notyf.error(msg),

    /** Notificación de advertencia — fondo naranja (tipo personalizado) */
    warning: msg => notyf.open({ type: 'warning', message: msg }),

    /** Notificación informativa — fondo azul (tipo personalizado) */
    info:    msg => notyf.open({ type: 'info',    message: msg }),
};