import { API_URL } from '../config/constants.js';

export async function fetchUsuarioPorDocumento(documento) {
    console.log(" Trayendo todos los usuarios para buscar manualmente...");
    
    // 1. Traemos TODOS los usuarios (sabemos que esto sí funciona)
    const response = await fetch(`${API_URL}/users`);
    const todosLosUsuarios = await response.json();
    
    // 2. Buscamos el documento usando JavaScript (Infalible)
    const usuarioEncontrado = todosLosUsuarios.find(u => String(u.document) === String(documento));
    
    console.log(" Resultado de la búsqueda JS:", usuarioEncontrado);
    
    return usuarioEncontrado || null;
}

export async function fetchUsuarioPorId(userId) {
    const response = await fetch(`${API_URL}/users/${userId}`);
    return await response.json();
}

export async function fetchTodosLosUsuarios() {
    const response = await fetch(`${API_URL}/users`);
    return await response.json();
}