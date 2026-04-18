import { API_URL } from '../config/constants.js';

export function getAuthHeaders() {
    const token = localStorage.getItem('sena_token');
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

export async function loginConBackend(documento, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Enviamos el objeto exacto que Zod está esperando
            body: JSON.stringify({ document: documento, password: password }) 
        });

        const json = await response.json();
        
        if (!response.ok) {
            // 🔥 Mejora: Mostrar el mensaje de error real del backend (ej: "Credenciales inválidas")
            throw new Error(json.msn || "Error al iniciar sesión");
        }

        const token = json.data?.accessToken || json.data?.token || json.token;
        if (token) {
            localStorage.setItem('sena_token', token);
        }

        return json.data.user; 
    } catch (error) {
        console.error("Error en login:", error);
        // Si quieres que script.js muestre el mensaje exacto del backend, en lugar de null, lánzalo.
        // Pero para mantener tu lógica actual:
        return null;
    }
}

export async function fetchTodosLosUsuarios() {
    const response = await fetch(`${API_URL}/users`, {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store" 
    });
    if (!response.ok) throw new Error("Error al obtener usuarios");
    
    const json = await response.json();
    return json.data || []; 
}

export async function fetchUsuarioPorId(userId) {
    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store"
    });
    if (!response.ok) throw new Error("Error al buscar el usuario");
    
    const json = await response.json();
    return json.data;
}

export async function actualizarUsuario(userId, datosNuevos) {
    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(datosNuevos)
    });
    
    if (!response.ok) throw new Error("Error al actualizar el usuario");
    return await response.json();
}

export async function cambiarEstadoUsuario(userId, nuevoEstado) {
    // Usamos PATCH, que es la ruta correcta del backend actual
    const response = await fetch(`${API_URL}/users/${userId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: nuevoEstado }) 
    });
    
    const json = await response.json();

    if (!response.ok) {
        throw new Error(json.message || json.msn || "Error al cambiar el estado del usuario");
    }
    
    return json;
}

export async function crearUsuario(datosNuevos) {
    const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(datosNuevos)
    });
    
    if (!response.ok) throw new Error("Error al crear usuario");
    return await response.json();
}