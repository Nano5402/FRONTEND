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
        
        // 🐛 DEBUG: Veamos qué nos está enviando el backend exactamente
        console.log("Respuesta cruda del backend:", data);

        // 🛡️ Búsqueda inteligente del token (Cubre múltiples estructuras)
        const tokenValido = data.token || (data.data && data.data.token) || data.data;

        // Si definitivamente no llegó el token, abortamos limpiamente
        if (!tokenValido || typeof tokenValido !== 'string') {
            console.error("Error: El backend no devolvió un JWT válido. Revisa la consola.");
            return null;
        }

        localStorage.setItem('sena_token', tokenValido);

        // Decodificamos el JWT con seguridad de que sí existe
        const payloadBase64 = tokenValido.split('.')[1];
        const decodedPayload = JSON.parse(decodeURIComponent(escape(atob(payloadBase64))));

        let userName = decodedPayload.name;

        // 🛡️ PLAN B: Si el Backend no metió el nombre en el JWT, lo buscamos en MySQL
        if (!userName) {
            const userRes = await fetch(`${API_URL}/users/${decodedPayload.id}`, { 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenValido}` 
                } 
            });
            
            if (userRes.ok) {
                const userData = await userRes.json();
                userName = userData.name || (userData.data && userData.data.name) || "Usuario (Sin Nombre)";
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
        console.error("Error catastrófico en el login:", error);
        return null;
    }
}

// 🔥 LA FUNCIÓN QUE FALTABA (Ahora con escudo protector)
export async function fetchUsuarioPorId(userId) {
    const response = await fetch(`${API_URL}/users/${userId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Error al obtener usuario");
    const json = await response.json();
    return json.data || json; 
}

export async function fetchTodosLosUsuarios() {
    const response = await fetch(`${API_URL}/users`, { 
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store" 
    });
    if (!response.ok) throw new Error("Error al obtener usuarios");
    const json = await response.json();
    const dataArray = json.data || json;
    return Array.isArray(dataArray) ? dataArray : [];
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
    const usuarios = await fetchTodosLosUsuarios();
    const usuarioCompleto = usuarios.find(u => u.id === userId);
    usuarioCompleto.status = nuevoEstado;

    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(usuarioCompleto) 
    });
    
    const json = await response.json();

    // 🛡️ INTERCEPTOR DE ERRORES DE NEGOCIO (Ej: Tareas pendientes)
    if (!response.ok) {
        throw new Error(json.message || "Error al cambiar el estado del usuario");
    }
    
    return json;
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