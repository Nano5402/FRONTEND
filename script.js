/**
 * ============================================
 * EJERCICIO DE MANIPULACIÓN DEL DOM
 * ============================================
 *
 * Objetivo: Aplicar conceptos del DOM para seleccionar elementos,
 * responder a eventos y crear nuevos elementos dinámicamente.
 *
 * Autor: Andrés Santiago Calvete Lesmes, Ana Isabella Garcia Rozo
 * Modificaciones: Lógica CRUD robusta y adaptación al Sistema de Diseño CSS.
/**
 * Función auxiliar para recargar la vista evadiendo los filtros del json-server.
 */
async function recargarDatosUsuario(idUsuario) {
    try {
        const [resUsers, resTasks] = await Promise.all([
            fetch('http://localhost:3000/users'),
            fetch('http://localhost:3000/tasks')
        ]);

        const todosLosUsuarios = await resUsers.json();
        const todasLasTareas = await resTasks.json();

        const usuario = todosLosUsuarios.find(u => String(u.id) === String(idUsuario));
        const tareas = todasLasTareas.filter(t => String(t.userId) === String(idUsuario));

        if (usuario) {
            createUserCard(usuario, tareas);
        }
    } catch (error) {
        console.error("Error al recargar los datos de la vista:", error);
    }
}

// ============================================
// 3. CREACIÓN DE ELEMENTOS Y LÓGICA CRUD
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

    // Contenedor principal de tareas
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
            // Contenedor de la tarea individual
            const taskItem = document.createElement("div");
            taskItem.classList.add("task-item");
            
            // Si está completada, añadimos la clase de tu CSS
            if (t.status === "completada") {
                taskItem.classList.add("completed");
            }

            // Información de la tarea (Textos)
            const taskInfo = document.createElement("div");
            taskInfo.classList.add("task-info");
            taskInfo.innerHTML = `
                <h5>${t.title}</h5>
                <p>${t.status.toUpperCase()} ${t.body ? `| ${t.body}` : ''}</p>
            `;

            // Contenedor de acciones (Botones)
            const actionsContainer = document.createElement("div");
            actionsContainer.classList.add("task-actions");

            // Botón Actualizar
            const updateBtn = document.createElement("button");
            updateBtn.className = "btn btn--sm btn--primary";
            updateBtn.innerHTML = "Editar";
            updateBtn.addEventListener("click", () => updateTask(t.id, t.title, t.body, usuario.id));

            // Botón Estado (Cambia de color según el estado)
            const toggleBtn = document.createElement("button");
            const isCompleted = t.status === "completada";
            toggleBtn.className = `btn btn--sm ${isCompleted ? 'btn--warning' : 'btn--success'}`;
            toggleBtn.innerHTML = isCompleted ? "Desmarcar" : "Completar";
            toggleBtn.addEventListener("click", () => toggleTaskStatus(t.id, t.status, usuario.id));

            // Botón Eliminar
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "btn btn--sm btn--danger";
            deleteBtn.innerHTML = "Borrar";
            deleteBtn.addEventListener("click", () => deleteTask(t.id, usuario.id));

            // Ensamblamos todo
            actionsContainer.appendChild(updateBtn);
            actionsContainer.appendChild(toggleBtn);
            actionsContainer.appendChild(deleteBtn);

            taskItem.appendChild(taskInfo);
            taskItem.appendChild(actionsContainer);
            tareasContainer.appendChild(taskItem);
        });
    }

    card.appendChild(tareasContainer);

    resultadoUsuario.innerHTML = "";
    resultadoUsuario.appendChild(card);

    const crearTareaBtn = document.getElementById("crearTareaBtn");
    crearTareaBtn.addEventListener("click", () => {
        renderTaskForm(usuario);
    });
}

function renderTaskForm(usuario) {
    const form = document.createElement("form");
    form.classList.add("form");
    form.style.marginTop = "20px"; // Pequeño margen para separarlo de la tarjeta

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

        if (!title) {
            alert("El título de la tarea es obligatorio");
            return;
        }

        try {
            await fetch("http://localhost:3000/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: String(usuario.id),
                    title,
                    body,
                    status: "pendiente"
                })
            });

            await recargarDatosUsuario(usuario.id);

        } catch (error) {
            console.error("Error al crear tarea:", error);
            resultadoUsuario.innerHTML += `<div class="error-card"><p>Error de conexión.</p></div>`;
        }
    });
}

async function updateTask(taskId, currentTitle, currentBody, userId) {
    const opcion = prompt(
        "¿Qué deseas modificar?\n\n1. Solo el Título\n2. Solo la Descripción\n3. Ambos (Título y Descripción)\n\nEscribe 1, 2 o 3:",
        "1"
    );

    if (opcion === null || opcion.trim() === "") return;

    let newTitle = currentTitle;
    let newBody = currentBody ? currentBody : "";
    let requiereActualizar = false;

    if (opcion === "1" || opcion === "3") {
        const tempTitle = prompt("Actualizar Título:", currentTitle);
        if (tempTitle !== null) {
            if (tempTitle.trim() === "") {
                alert("El título no puede quedar vacío.");
                return;
            }
            newTitle = tempTitle.trim();
            requiereActualizar = true;
        }
    }

    if (opcion === "2" || opcion === "3") {
        const tempBody = prompt("Actualizar Descripción:", newBody);
        if (tempBody !== null) {
            newBody = tempBody.trim();
            requiereActualizar = true;
        }
    }

    if (requiereActualizar) {
        try {
            await fetch(`http://localhost:3000/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle, body: newBody })
            });

            await recargarDatosUsuario(userId);
        } catch (error) {
            console.error("Error al actualizar:", error);
            alert("Fallo al actualizar la información.");
        }
    }
}

async function deleteTask(taskId, userId) {
    if (!confirm("¿Está seguro de que desea eliminar esta tarea?")) return;

    try {
        await fetch(`http://localhost:3000/tasks/${taskId}`, { method: "DELETE" });
        await recargarDatosUsuario(userId);
    } catch (error) {
        console.error("Error al eliminar la tarea:", error);
    }
}

async function toggleTaskStatus(taskId, currentStatus, userId) {
    const newStatus = currentStatus === "pendiente" ? "completada" : "pendiente";

    try {
        await fetch(`http://localhost:3000/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        await recargarDatosUsuario(userId);
    } catch (error) {
        console.error("Error al actualizar estado:", error);
    }
}

// ============================================
// 4. MANEJO DE EVENTOS (BÚSQUEDA)
// ============================================

async function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const documentoBuscado = documentoInput.value.trim();

    try {
        const [responseUsers, responseTasks] = await Promise.all([
            fetch('http://localhost:3000/users'),
            fetch('http://localhost:3000/tasks')
        ]);

        const todosLosUsuarios = await responseUsers.json();
        const todasLasTareas = await responseTasks.json();

        const usuarioEncontrado = todosLosUsuarios.find(u => String(u.document) === String(documentoBuscado));

        if (!usuarioEncontrado) {
            resultadoUsuario.innerHTML = `
                <div class="error-card">
                    <p>No se encontró ningún usuario con el documento "${documentoBuscado}".</p>
                </div>
            `;
            return;
        }

        const tareasDelUsuario = todasLasTareas.filter(t => String(t.userId) === String(usuarioEncontrado.id));

        createUserCard(usuarioEncontrado, tareasDelUsuario);

    } catch (error) {
        console.error("Error en la petición principal:", error);
        resultadoUsuario.innerHTML = `
            <div class="error-card">
                <p>Error al conectar con el servidor local. Verifique json-server.</p>
            </div>
        `;
    }
}

// ============================================
// 5. REGISTRO DE EVENTOS E INICIALIZACIÓN
// ============================================

searchForm.addEventListener('submit', handleFormSubmit);
documentoInput.addEventListener('input', () => clearError(documentoError));

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado con éxito');
});