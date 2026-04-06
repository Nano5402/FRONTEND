import { API_URL } from '../config/constants.js';

export function getAuthHeaders() {
    const token = localStorage.getItem('sena_token');
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

// ==========================================
// 🔥 LOGIN ADAPTADO A LA NUEVA ARQUITECTURA
// ==========================================
export async function loginConBackend(documento) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document: documento })
        });

        const json = await response.json();
        
        // Verificamos el nuevo estándar 'success'
        if (!json.success) return null;

        // El backend ahora devuelve { data: { user: {...}, token: "..." } }
        localStorage.setItem('sena_token', json.data.token);

        return json.data.user; 
    } catch (error) {
        console.error("Error en login:", error);
        return null;
    }
}

// ==========================================
// GESTIÓN DE USUARIOS (CRUD)
// ==========================================
export async function fetchTodosLosUsuarios() {
    const response = await fetch(`${API_URL}/users`, {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store" 
    });
    if (!response.ok) throw new Error("Error al obtener usuarios");
    
    const json = await response.json();
    return json.data || []; // Extraemos el arreglo de la propiedad 'data'
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
    const json = await response.json();
    return json; // Retornamos todo el objeto por si script.js quiere usar json.message
}

export async function cambiarEstadoUsuario(userId, nuevoEstado) {
    const response = await fetch(`${API_URL}/users/${userId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: nuevoEstado }) 
    });
    
    if (!response.ok) throw new Error("Error al cambiar el estado del usuario");
    return await response.json();
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