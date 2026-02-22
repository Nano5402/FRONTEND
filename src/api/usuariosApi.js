// src/api/usuariosApi.js

import { API_URL } from '../config/constants.js';

/**
 * Busca un usuario por su número de documento
 * @param {string} documento - El documento a buscar
 * @returns {Object|null} - El usuario encontrado o null si no existe
 */
export async function fetchUsuarioPorDocumento(documento) {
    const response = await fetch(`${API_URL}/users?document=${documento}`);
    const usuarios = await response.json();

    // Devuelve el primer usuario encontrado, o null si no hay ninguno
    if (usuarios.length === 0) {
        return null;
    }
    return usuarios[0];
}

/**
 * Busca un usuario por su ID
 * @param {number} userId - El ID del usuario
 * @returns {Object} - Los datos del usuario
 */
export async function fetchUsuarioPorId(userId) {
    const response = await fetch(`${API_URL}/users/${userId}`);
    const usuario = await response.json();
    return usuario;
}