import { API_URL } from '../config/constants.js';

/**
 * Busca un usuario por su número de documento
 */
export async function fetchUsuarioPorDocumento(documento) {
    const urlExacta = `${API_URL}/users?document=${documento}`;
    
    // 1. Espía de la URL
    console.log("🔥 BUSCANDO EN ESTA URL EXACTA:", urlExacta);
    
    const response = await fetch(urlExacta);
    const usuarios = await response.json();
    
    // 2. Espía de la Respuesta
    console.log("📦 RESPUESTA DEL SERVIDOR:", usuarios);
    
    if (usuarios.length === 0) return null;
    return usuarios[0];
}