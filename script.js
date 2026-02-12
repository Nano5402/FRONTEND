/**
 * ============================================
 * EJERCICIO DE MANIPULACIÓN DEL DOM
 * ============================================
 * 
 * Objetivo: Aplicar conceptos del DOM para seleccionar elementos,
 * responder a eventos y crear nuevos elementos dinámicamente.
 * 
 * Autor: Andrés Santiago Calvete Lesmes, Ana Isabella Garcia Rozo
 * Fecha: 11/02/26
 * ============================================
 */

// ============================================
// 1. SELECCIÓN DE ELEMENTOS DEL DOM
// ============================================

const messageForm = document.getElementById('messageForm');
const userNameInput = document.getElementById('userName');
const userMessageInput = document.getElementById('userMessage');
const submitBtn = document.getElementById('submitBtn');
const userNameError = document.getElementById('userNameError');
const userMessageError = document.getElementById('userMessageError');
const messagesContainer = document.getElementById('messagesContainer');
const emptyState = document.getElementById('emptyState');
const messageCount = document.getElementById('messageCount');
let totalMessages = 0;

// ============================================
// 2. FUNCIONES AUXILIARES
// ============================================

function isValidInput(value) {
    return value.trim().length > 0;
}

function showError(errorElement, message) {
    errorElement.textContent = message;
}

function clearError(errorElement) {
    errorElement.textContent = "";
}

function validateForm() {
    const userName = userNameInput.value;
    const userMessage = userMessageInput.value;
    let isValid = true;

    if (!isValidInput(userName)) {
        showError(userNameError, "El nombre es obligatorio");
        userNameInput.classList.add("error");
        isValid = false;
    } else {
        clearError(userNameError);
        userNameInput.classList.remove("error");
    }

    if (!isValidInput(userMessage)) {
        showError(userMessageError, "El mensaje es obligatorio");
        userMessageInput.classList.add("error");
        isValid = false;
    } else {
        clearError(userMessageError);
        userMessageInput.classList.remove("error");
    }

    return isValid;
}

// ============================================
// 3. CREACIÓN DE ELEMENTOS
// ============================================

function createUserCard(usuario, tareas) {
    const total = tareas.length;
    const pendientes = tareas.filter(t => t.status === "pendiente").length;
    const completadas = tareas.filter(t => t.status === "completada").length;

    const card = document.createElement("div");
    card.classList.add("user-card");

    card.innerHTML = `
        <h3>${usuario.name}</h3>
        <p><strong>Documento:</strong> ${usuario.document}</p>
        <p><strong>Correo:</strong> ${usuario.email}</p>
        <p><strong>Total tareas:</strong> ${total}</p>
        <p><strong>Pendientes:</strong> ${pendientes}</p>
        <p><strong>Completadas:</strong> ${completadas}</p>
        <button class="btn btn--secondary" id="crearTareaBtn">Crear tarea</button>
    `;

    resultadoUsuario.innerHTML = "";
    resultadoUsuario.appendChild(card);

    const crearTareaBtn = document.getElementById("crearTareaBtn");
    crearTareaBtn.addEventListener("click", () => {
        renderTaskForm(usuario);
    });
}

/**
 * Renderiza un formulario dinámico para crear una nueva tarea
 * @param {Object} usuario - Datos del usuario
 */
function renderTaskForm(usuario) {
    const form = document.createElement("form");
    form.classList.add("form");

    form.innerHTML = `
        <div class="form__group">
            <label for="taskTitle" class="form__label">Título de la tarea</label>
            <input type="text" id="taskTitle" class="form__input" placeholder="Ingresa el título">
        </div>
        <div class="form__group">
            <label for="taskBody" class="form__label">Descripción</label>
            <textarea id="taskBody" class="form__input form__textarea" placeholder="Ingresa la descripción"></textarea>
        </div>
        <button type="submit" class="btn btn--primary">Guardar tarea</button>
    `;

    resultadoUsuario.appendChild(form);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("taskTitle").value.trim();
        const body = document.getElementById("taskBody").value.trim();

        if (!title || !body) {
            alert("Todos los campos son obligatorios");
            return;
        }

        try {
            await fetch("http://localhost:3000/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: usuario.id,
                    title,
                    body,
                    status: "pendiente"
                })
            });

            // Volver a consultar tareas y actualizar la card
            const responseTasks = await fetch(`http://localhost:3000/tasks?userId=${usuario.id}`);
            const tareas = await responseTasks.json();
            createUserCard(usuario, tareas);

        } catch (error) {
            resultadoUsuario.innerHTML += `
                <div class="error-card">
                    <p>Error al crear la tarea.</p>
                </div>
            `;
        }
    });
}

// ============================================
// 4. MANEJO DE EVENTOS
// ============================================

async function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const userName = userNameInput.value.trim();
    const userMessage = userMessageInput.value.trim();

    try {
        const response = await fetch(`http://localhost:3000/users?name=${userName}`);
        const usuarios = await response.json();

        if (usuarios.length === 0) {
            resultadoUsuario.innerHTML = `
                <div class="error-card">
                    <p>No se encontró ningún usuario con el nombre "${userName}".</p>
                </div>
            `;
            return;
        }

        const usuario = usuarios[0];
        const responseTasks = await fetch(`http://localhost:3000/tasks?userId=${usuario.id}`);
        const tareas = await responseTasks.json();

        createUserCard(usuario, tareas);

    } catch (error) {
        resultadoUsuario.innerHTML = `
            <div class="error-card">
                <p>Error al consultar el servidor.</p>
            </div>
        `;
    }
}

// ============================================
// 5. REGISTRO DE EVENTOS
// ============================================

messageForm.addEventListener('submit', handleFormSubmit);
userNameInput.addEventListener('input', () => clearError(userNameError));
userMessageInput.addEventListener('input', () => clearError(userMessageError));

// ============================================
// 7. INICIALIZACIÓN (OPCIONAL)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM completamente cargado');
    console.log('📝 Aplicación de registro de mensajes iniciada');
});
