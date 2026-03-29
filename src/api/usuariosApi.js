import { API_URL } from '../config/constants.js';

export function getAuthHeaders() {
    const token = localStorage.getItem('sena_token');
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

export async function loginConBackend(documento) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document: documento })
        });

        if (!response.ok) return null;

        const data = await response.json();
        localStorage.setItem('sena_token', data.token);

        // Decodificamos el JWT
        const payloadBase64 = data.token.split('.')[1];
        const decodedPayload = JSON.parse(decodeURIComponent(escape(atob(payloadBase64))));

        let userName = decodedPayload.name;

        // 🛡️ PLAN B: Si el Backend no metió el nombre en el JWT, lo buscamos en MySQL
        if (!userName) {
            const userRes = await fetch(`${API_URL}/users/${decodedPayload.id}`, { headers: getAuthHeaders() });
            if (userRes.ok) {
                const userData = await userRes.json();
                userName = userData.name;
            } else {
                userName = "Usuario (Sin Nombre)";
            }
        }

        return {
            id: decodedPayload.id,
            role: decodedPayload.role,
            name: userName,
            document: documento
        };
    } catch (error) {
        console.error("Error en el login:", error);
        return null;
    }
}

export async function fetchUsuarioPorId(userId) {
    const response = await fetch(`${API_URL}/users/${userId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Error al obtener usuario");
    return await response.json();
}

export async function fetchTodosLosUsuarios() {
    const response = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Error al obtener usuarios (Token inválido o expirado)");
    return await response.json();
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
    // 1. Buscamos la información completa del usuario actual
    const usuarios = await fetchTodosLosUsuarios();
    const usuarioCompleto = usuarios.find(u => u.id === userId);
    
    // 2. Le cambiamos únicamente el estado
    usuarioCompleto.status = nuevoEstado;

    // 3. Le enviamos a MySQL el objeto COMPLETO (Nombre, correo, documento, etc.)
    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(usuarioCompleto) 
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
    
    if (!response.ok) throw new Error("Error al crear el usuario en la base de datos");
    return await response.json();
}