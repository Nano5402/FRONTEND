// src/api/index.js

export { fetchUsuarioPorDocumento, fetchUsuarioPorId } from './usuariosApi.js';

export { 
    fetchTareasPorUsuario, 
    crearTarea, 
    eliminarTarea,
    prepararExportacion    // ← esta línea es la que agregas
} from './tareasApi.js';
