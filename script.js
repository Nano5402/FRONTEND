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

const searchForm = document.getElementById('searchForm');
const documentoInput = document.getElementById('documento');
const documentoError = document.getElementById('documentoError');
const resultadoUsuario = document.getElementById('resultadoUsuario');

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
    const documento = documentoInput.value;
    let isValid = true;

    if (!isValidInput(documento)) {
        showError(documentoError, "El documento es obligatorio");
        documentoInput.classList.add("error");
        isValid = false;
    } else {
        clearError(documentoError);
        documentoInput.classList.remove("error");
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

    // Datos del usuario
    const h3 = document.createElement("h3");
    h3.textContent = usuario.name;

    const docP = document.createElement("p");
    docP.innerHTML = `<strong>Documento:</strong> ${usuario.document}`;

    const emailP = document.createElement("p");
    emailP.innerHTML = `<strong>Correo:</strong> ${usuario.email}`;

    const totalP = document.createElement("p");
    totalP.innerHTML = `<strong>Total tareas:</strong> ${total}`;

    const pendientesP = document.createElement("p");
    pendientesP.innerHTML = `<strong>Pendientes:</strong> ${pendientes}`;

    const completadasP = document.createElement("p");
    completadasP.innerHTML = `<strong>Completadas:</strong> ${completadas}`;

    const crearTareaBtn = document.createElement("button");
    crearTareaBtn.classList.add("btn", "btn--secondary");
    crearTareaBtn.textContent = "Crear tarea";
    crearTareaBtn.addEventListener("click", () => renderTaskForm(usuario));

    // Contenedor de tareas
    const tareasContainer = document.createElement("div");
    tareasContainer.classList.add("tasks-container");

    const tareasTitle = document.createElement("h4");
    tareasTitle.textContent = "Listado de tareas";
    tareasContainer.appendChild(tareasTitle);

    if (tareas.length === 0) {
        const noTask = document.createElement("p");
        noTask.textContent = "No hay tareas registradas.";
        tareasContainer.appendChild(noTask);
    } else {
        tareas.forEach(t => {
            const taskItem = document.createElement("div");
            taskItem.classList.add("task-item");

            const taskText = document.createElement("p");
            taskText.innerHTML = `<strong>${t.title}</strong> - ${t.status}`;

            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("btn", "btn--danger");
            deleteBtn.textContent = "Eliminar";
            deleteBtn.addEventListener("click", () => deleteTask(t.id, usuario.id));

            taskItem.appendChild(taskText);
            taskItem.appendChild(deleteBtn);
            tareasContainer.appendChild(taskItem);
        });
    }

    // Ensamblar card
    card.appendChild(h3);
    card.appendChild(docP);
    card.appendChild(emailP);
    card.appendChild(totalP);
    card.appendChild(pendientesP);
    card.appendChild(completadasP);
    card.appendChild(crearTareaBtn);
    card.appendChild(tareasContainer);

    resultadoUsuario.innerHTML = "";
    resultadoUsuario.appendChild(card);
}

/**
 * Renderiza un formulario dinámico para crear una nueva tarea
 * @param {Object} usuario - Datos del usuario
 */
function renderTaskForm(usuario) {
    const form = document.createElement("form");
    form.classList.add("form");

    const groupTitle = document.createElement("div");
    groupTitle.classList.add("form__group");
    const labelTitle = document.createElement("label");
    labelTitle.setAttribute("for", "taskTitle");
    labelTitle.classList.add("form__label");
    labelTitle.textContent = "Título de la tarea";
    const inputTitle = document.createElement("input");
    inputTitle.type = "text";
    inputTitle.id = "taskTitle";
    inputTitle.classList.add("form__input");
    inputTitle.placeholder = "Ingresa el título";
    groupTitle.appendChild(labelTitle);
    groupTitle.appendChild(inputTitle);

    const groupBody = document.createElement("div");
    groupBody.classList.add("form__group");
    const labelBody = document.createElement("label");
    labelBody.setAttribute("for", "taskBody");
    labelBody.classList.add("form__label");
    labelBody.textContent = "Descripción";
    const textareaBody = document.createElement("textarea");
    textareaBody.id = "taskBody";
    textareaBody.classList.add("form__input", "form__textarea");
    textareaBody.placeholder = "Ingresa la descripción";
    groupBody.appendChild(labelBody);
    groupBody.appendChild(textareaBody);

    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.classList.add("btn", "btn--primary");
    saveBtn.textContent = "Guardar tarea";

    form.appendChild(groupTitle);
    form.appendChild(groupBody);
    form.appendChild(saveBtn);

    resultadoUsuario.appendChild(form);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = inputTitle.value.trim();
        const body = textareaBody.value.trim();

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

            const responseTasks = await fetch(`http://localhost:3000/tasks?userId=${usuario.id}`);
            const tareas = await responseTasks.json();
            createUserCard(usuario, tareas);

        } catch (error) {
            const errorCard = document.createElement("div");
            errorCard.classList.add("error-card");
            errorCard.textContent = "Error al crear la tarea.";
            resultadoUsuario.appendChild(errorCard);
        }
    });
}

/**
 * Elimina una tarea existente
 * @param {number} taskId - ID de la tarea
 * @param {number} userId - ID del usuario
 */
async function deleteTask(taskId, userId) {
    try {
        await fetch(`http://localhost:3000/tasks/${taskId}`, { method: "DELETE" });

        const responseTasks = await fetch(`http://localhost:3000/tasks?userId=${userId}`);
        const tareas = await responseTasks.json();

        const responseUser = await fetch(`http://localhost:3000/users/${userId}`);
        const usuario = await responseUser.json();

        createUserCard(usuario, tareas);
    } catch (error) {
        const errorCard = document.createElement("div");
        errorCard.classList.add("error-card");
        errorCard.textContent = "Error al eliminar la tarea.";
        resultadoUsuario.appendChild(errorCard);
    }
}

// ============================================
// 4. MANEJO DE EVENTOS
// ============================================

async function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const documento = documentoInput.value.trim();

    try {
        const response = await fetch(`http://localhost:3000/users?document=${documento}`);
        const usuarios = await response.json();

        if (usuarios.length === 0) {
            const errorCard = document.createElement("div");
            errorCard.classList.add("error-card");
            errorCard.textContent = `No se encontró ningún usuario con el documento "${documento}".`;
            resultadoUsuario.innerHTML = "";
            resultadoUsuario.appendChild(errorCard);
            return;
        }

        const usuario = usuarios[0];
        const responseTasks = await fetch(`http://localhost:3000/tasks?userId=${usuario.id}`);
        const tareas = await responseTasks.json();

        createUserCard(usuario, tareas);

    } catch (error) {
        const errorCard = document.createElement("div");
        errorCard.classList.add("error-card");
        errorCard.textContent = "Error al consultar el servidor.";
        resultadoUsuario.innerHTML = "";
        resultadoUsuario.appendChild(errorCard);
    }
}

// ============================================
// 5. REGISTRO DE EVENTOS
// ============================================

searchForm.addEventListener('submit', handleFormSubmit);
documentoInput.addEventListener('input', () => clearError(documentoError));

// ============================================
// 7. INICIALIZACIÓN (OPCIONAL)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM completamente cargado');
    console.log('📝 Aplicación de registro de mensajes iniciada');
});