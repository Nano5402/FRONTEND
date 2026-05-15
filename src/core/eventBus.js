/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  core/eventBus.js — BUS DE EVENTOS GLOBAL                            ║
 * ║                                                                      ║
 * ║  El eventBus permite que módulos se comuniquen entre sí sin          ║
 * ║  importarse directamente. Esto reduce el acoplamiento.               ║
 * ║                                                                      ║
 * ║  PROBLEMA que resuelve:                                              ║
 * ║  Si InstructorView necesita avisarle a Sidebar que se creó una       ║
 * ║  tarea, sin eventBus tendría que importar Sidebar directamente,      ║
 * ║  creando una dependencia circular. Con eventBus, simplemente         ║
 * ║  emite un evento y quien esté suscrito lo recibe.                    ║
 * ║                                                                      ║
 * ║  FLUJO:                                                              ║
 * ║  Emisor:      eventBus.emit('task:created', { taskId: 5 })          ║
 * ║  Suscriptor:  eventBus.on('task:created', ({ taskId }) => ...)       ║
 * ║                                                                      ║
 * ║  CONVENCIÓN de nombres de eventos:                                   ║
 * ║    'entidad:acción'  →  'task:created', 'user:deleted', 'auth:logout'║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

// Mapa interno: { 'nombre-evento': [handler1, handler2, ...] }
const _events = {};

export const eventBus = {

    /**
     * on(event, handler)
     * Se suscribe a un evento. El handler se ejecuta cada vez que se emita.
     *
     * Uso:
     *   eventBus.on('task:created', (data) => console.log('Nueva tarea:', data))
     */
    on(event, handler) {
        if (!_events[event]) _events[event] = [];
        _events[event].push(handler);
    },

    /**
     * off(event, handler)
     * Cancela la suscripción de un handler específico.
     * Es importante llamarlo cuando un componente se destruye para evitar
     * ejecutar código sobre elementos que ya no existen en el DOM.
     *
     * Uso:
     *   eventBus.off('task:created', miHandler)
     */
    off(event, handler) {
        if (!_events[event]) return;
        _events[event] = _events[event].filter(h => h !== handler);
    },

    /**
     * emit(event, payload)
     * Dispara el evento y pasa el payload a todos los suscriptores.
     *
     * Uso:
     *   eventBus.emit('task:created', { taskId: 5, title: 'Nueva tarea' })
     */
    emit(event, payload) {
        (_events[event] || []).forEach(h => h(payload));
    },

    /**
     * once(event, handler)
     * Se suscribe al evento pero solo responde UNA vez.
     * Después de la primera ejecución se desuscribe automáticamente.
     *
     * Útil para eventos de confirmación o acciones únicas.
     *
     * Uso:
     *   eventBus.once('auth:login', (user) => console.log('Bienvenido', user.name))
     */
    once(event, handler) {
        const wrapper = (payload) => {
            handler(payload);
            this.off(event, wrapper); // se desuscribe después de ejecutarse
        };
        this.on(event, wrapper);
    },
};