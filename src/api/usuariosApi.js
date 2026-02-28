// src/api/usuariosApi.js
// Capa de acceso a datos de usuarios.
// Este archivo consulta el servidor y no manipula elementos del DOM.

import { API_URL } from '../config/constants.js';

/**
 * Busca un usuario usando su documento de identidad.
 * Retorna el primer usuario encontrado o null si no existe.
 */
export async function fetchUsuarioPorDocumento(documento) {
    const response = await fetch(`${API_URL}/users?document=${documento}`);
    const usuarios = await response.json();
    return usuarios.length > 0 ? usuarios[0] : null;
}

/**
 * Obtiene un usuario por su identificador interno.
 */
export async function fetchUsuarioPorId(userId) {
    const response = await fetch(`${API_URL}/users/${userId}`);
    return await response.json();
}
