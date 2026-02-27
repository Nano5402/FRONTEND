// src/api/index.js
// Puerta de entrada única del módulo API
// Quien necesite datos del servidor importa desde aquí

export {
    fetchUsuarioPorDocumento,
    fetchUsuarioPorId
} from './usuariosApi.js';

export {
    fetchTareasPorUsuario,
    crearTarea,
    eliminarTarea,
    actualizarTarea,
    prepararExportacion   // RF04
} from './tareasApi.js';

export { descargarJSON, crearBotonExportar } from './exportUI.js';