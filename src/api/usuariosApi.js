// src/api/usuariosApi.js
// RESPONSABILIDAD: comunicación con el servidor para usuarios
// REGLA: ninguna línea toca el DOM — sin document, sin innerHTML

import { API_URL } from '../config/constants.js';

/**
 * Busca un usuario por su número de documento
 * @param {string} documento - Documento a buscar
 * @returns {Object|null} - Usuario encontrado o null
 */
export async function fetchUsuarioPorDocumento(documento) {
    const response = await fetch(`${API_URL}/users?document=${documento}`);
    const usuarios = await response.json();
    return usuarios.length > 0 ? usuarios[0] : null;
}

/**
 * Busca un usuario por su ID
 * @param {number} userId - ID del usuario
 * @returns {Object} - Datos del usuario
 */
export async function fetchUsuarioPorId(userId) {
    const response = await fetch(`${API_URL}/users/${userId}`);
    return await response.json();
}