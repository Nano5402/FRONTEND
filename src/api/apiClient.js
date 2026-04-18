import { storage } from '../utils/storage.js';

/**
 * Wrapper personalizado de fetch para centralizar la seguridad
 * @param {string} endpoint - La URL relativa (ej: /tasks)
 * @param {object} options - Opciones normales de fetch (method, body, etc)
 */
export async function senaFetch(url, options = {}) {
    // 1. Obtener el token del gestor de persistencia
    const token = storage.getAccessToken();

    // 2. Configurar los encabezados por defecto
    const defaultHeaders = {
        "Content-Type": "application/json",
    };

    // 3. Si hay token, lo inyectamos automáticamente
    if (token) {
        defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    // 4. Combinar con los headers que vengan en las opciones
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    // 5. Ejecutar la petición
    const response = await fetch(url, config);

    // Si recibimos un 401 aquí, es un aviso para la siguiente Issue (Refresh Token)
    // Por ahora, solo retornamos la respuesta
    return response;
}