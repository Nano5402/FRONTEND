import { API_URL } from '../config/constants.js';
import { storage } from '../utils/storage.js';
import { senaFetch } from './apiClient.js';

// ✅ FIX 2: IDs corregidos según la tabla real de la BD:
//   1 = SuperAdmin, 2 = Profesor, 3 = Estudiante, 4 = Auditor
// Antes el mapa era 1=admin, 2=auditor, 3=user — completamente invertido.
const mapearRol = (rolTexto) => {
    if (rolTexto === 'admin')    return 2; // Profesor (instructor)
    if (rolTexto === 'auditor')  return 4; // Auditor
    return 3;                              // Estudiante (default)
    // Nota: rol 1 (SuperAdmin) solo se asigna directamente desde la BD,
    // no desde el formulario del frontend por seguridad.
};

export async function loginConBackend(documento, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document: documento, password: password })
        });

        const json = await response.json();

        if (!response.ok) {
            throw new Error(json.msn || "Error al iniciar sesión");
        }

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
    return Array.isArray(json) ? json : (json.data || []);
}

export async function fetchUsuarioPorId(userId) {
    const response = await senaFetch(`${API_URL}/users/${userId}`, {
        method: "GET",
        cache: "no-store"
    });
    if (!response.ok) throw new Error("Error al buscar el usuario");

    const json = await response.json();
    return json.data || json;
}

export async function actualizarUsuario(userId, datosNuevos) {
    const payload = {
        ...datosNuevos,
        role_id: mapearRol(datosNuevos.role)
    };
    delete payload.role;

    const response = await senaFetch(`${API_URL}/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
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
        throw new Error(json.message || json.msn || "Error al cambiar el estado");
    }
    return json;
}

export async function crearUsuario(datosNuevos) {
    const payload = {
        ...datosNuevos,
        role_id: mapearRol(datosNuevos.role)
    };
    delete payload.role;

    const response = await senaFetch(`${API_URL}/users`, {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Error al crear usuario");
    return await response.json();
}

export async function eliminarUsuario(userId) {
    const response = await senaFetch(`${API_URL}/users/${userId}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        const json = await response.json();
        throw new Error(json.message || "Error al eliminar de raíz");
    }
    return true;
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

export async function solicitarRecuperacion(email) {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.msn || json.message || "No se pudo enviar el correo");
    return json;
}

export async function verificarOTP(email, otp) {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.msn || json.message || "Código inválido o expirado");
    return json;
}

export async function resetPassword(email, otp, newPassword) {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password: newPassword })
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.msn || json.message || "Error al restablecer");
    return json;
}