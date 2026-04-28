import { API_URL } from '../config/constants.js';
import { storage } from '../utils/storage.js';
import { senaFetch } from './apiClient.js'; // 🔥 Importamos el interceptor

export async function loginConBackend(documento, password) {
    try {
        // Usamos fetch nativo aquí porque el login es una ruta pública (no lleva token)
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document: documento, password: password }) 
        });

        const json = await response.json();
        
        if (!response.ok) {
            throw new Error(json.msn || "Error al iniciar sesión");
        }

        // Guardamos AMBOS tokens usando nuestra utilidad
        const { accessToken, refreshToken, token } = json.data || json;
        
        if (accessToken && refreshToken) {
            storage.setTokens(accessToken, refreshToken);
        } else if (token) {
            storage.setTokens(token, null);
        }

        return json.data.user; 
    } catch (error) {
        console.error("Error en login:", error);
        return null;
    }
}

export async function fetchTodosLosUsuarios() {
    const response = await senaFetch(`${API_URL}/users`, {
        method: "GET",
        cache: "no-store" 
    });
    if (!response.ok) throw new Error("Error al obtener usuarios");
    
    const json = await response.json();
    return json.data || []; 
}

export async function fetchUsuarioPorId(userId) {
    const response = await senaFetch(`${API_URL}/users/${userId}`, {
        method: "GET",
        cache: "no-store"
    });
    if (!response.ok) throw new Error("Error al buscar el usuario");
    
    const json = await response.json();
    return json.data;
}

export async function actualizarUsuario(userId, datosNuevos) {
    const response = await senaFetch(`${API_URL}/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(datosNuevos)
    });
    
    if (!response.ok) throw new Error("Error al actualizar el usuario");
    return await response.json();
}

export async function cambiarEstadoUsuario(userId, nuevoEstado) {
    const response = await senaFetch(`${API_URL}/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nuevoEstado }) 
    });
    
    const json = await response.json();

    if (!response.ok) {
        throw new Error(json.message || json.msn || "Error al cambiar el estado del usuario");
    }
    
    return json;
}

export async function crearUsuario(datosNuevos) {
    const response = await senaFetch(`${API_URL}/users`, {
        method: "POST",
        body: JSON.stringify(datosNuevos)
    });
    
    if (!response.ok) throw new Error("Error al crear usuario");
    return await response.json();
}

export async function registrarUsuario(datosPersonales) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosPersonales)
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || json.msn || "Error al registrarse");
        
        return json;
    } catch (error) {
        console.error("Error en registro:", error);
        throw error;
    }
}