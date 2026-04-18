import { storage } from '../utils/storage.js';
import { API_URL } from '../config/constants.js';

let isRefreshing = false; // Bandera para evitar bucles infinitos

export async function senaFetch(url, options = {}) {
    let token = storage.getAccessToken();

    const defaultHeaders = { "Content-Type": "application/json" };
    if (token) defaultHeaders["Authorization"] = `Bearer ${token}`;

    const config = {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    };

    // 1. Ejecutamos la petición original
    let response = await fetch(url, config);

    // 2. INTERCEPTOR DE SILENT REFRESH: Si el token expiró (401)
    if (response.status === 401 && !isRefreshing) {
        console.warn("🔄 Token expirado. Iniciando Silent Refresh...");
        isRefreshing = true;

        try {
            const refreshToken = storage.getRefreshToken();
            if (!refreshToken) throw new Error("No hay refresh token disponible");

            // Solicitamos nuevos tokens a La Bóveda
            const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (!refreshRes.ok) throw new Error("Refresh token inválido o expirado");

            const json = await refreshRes.json();
            
            // Extraemos los nuevos tokens (adaptado a la estructura de tu backend)
            const newAccess = json.data?.accessToken || json.token; 
            const newRefresh = json.data?.refreshToken || json.refreshToken;

            // Guardamos las nuevas llaves
            storage.setTokens(newAccess, newRefresh);
            console.log("✅ Silent Refresh Exitoso. Reintentando petición...");

            // 3. MAGIA: Reintentar la petición original con la nueva llave
            config.headers["Authorization"] = `Bearer ${newAccess}`;
            response = await fetch(url, config);

        } catch (error) {
            console.error("🚨 Fallo crítico. Expulsando usuario al Login...", error);
            storage.clearTokens();
            window.location.reload(); // Recargamos para que el sistema lo devuelva a la pantalla de ingreso
        } finally {
            isRefreshing = false;
        }
    }

    return response;
}