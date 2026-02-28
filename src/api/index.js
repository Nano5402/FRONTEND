// src/api/index.js
// Punto unico de exportacion para funciones de API.
// Permite importar desde un solo archivo.

export {
    fetchUsuarioPorDocumento,
    fetchUsuarioPorId
} from './usuariosApi.js';

export {
    fetchTareasPorUsuario,
    crearTarea,
    eliminarTarea,
    actualizarTarea,
    prepararExportacion
} from './tareasApi.js';