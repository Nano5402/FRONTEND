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
// RF04 — EXPORTACIÓN DE TAREAS
// ============================================

/**
 * Recibe un string JSON y lo descarga como archivo .json
 * Esta función SÍ toca el DOM (crea un <a> invisible)
 * @param {string} contenidoJSON - El string ya preparado para guardar
 * @param {string} nombreArchivo - El nombre que tendrá el archivo descargado
 */
function descargarJSON(contenidoJSON, nombreArchivo) {
    // Paso 1: Crear un "Blob" — es como un archivo en memoria del navegador
    // Le decimos que el tipo de contenido es JSON
    const blob = new Blob([contenidoJSON], { type: 'application/json' });

    // Paso 2: Crear una URL temporal que apunta a ese archivo en memoria
    const urlTemporal = URL.createObjectURL(blob);

    // Paso 3: Crear un enlace <a> invisible
    const enlace = document.createElement('a');
    enlace.href = urlTemporal;
    enlace.download = nombreArchivo; // el atributo download define el nombre del archivo

    // Paso 4: Insertar el enlace en el DOM y simular el clic
    document.body.appendChild(enlace);
    enlace.click();

    // Paso 5: Limpiar — eliminar el enlace y liberar la URL temporal de memoria
    document.body.removeChild(enlace);
    URL.revokeObjectURL(urlTemporal);
}

/**
 * Prepara los datos de tareas para exportaciÃ³n
 * Esta funciÃ³n NO toca el DOM. Solo transforma datos.
 * @param {Array} tareas - El array de tareas del usuario
 * @param {Object} usuario - Los datos del usuario dueÃ±o de las tareas
 * @returns {string} - Un string JSON formateado y listo para guardar
 */
function prepararExportacion(tareas, usuario) {
    const exportData = {
        exportadoEn: new Date().toISOString(),
        usuario: {
            id: usuario.id,
            nombre: usuario.name,
            documento: usuario.document
        },
        totalTareas: tareas.length,
        pendientes: tareas.filter(t => t.status === "pendiente").length,
        completadas: tareas.filter(t => t.status === "completada").length,
        tareas: tareas
    };

    return JSON.stringify(exportData, null, 2);
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

    //—botón de exportar tareas— se agrega aquí porque necesita el contexto de usuario y tareas para preparar la exportación
card.innerHTML = `
    <h3>${usuario.name}</h3>
    <p><strong>Documento:</strong> ${usuario.document}</p>
    <p><strong>Correo:</strong> ${usuario.email}</p>
    <p><strong>Total tareas:</strong> ${total}</p>
    <p><strong>Pendientes:</strong> ${pendientes}</p>
    <p><strong>Completadas:</strong> ${completadas}</p>
    <button class="btn btn--secondary" id="crearTareaBtn">Crear tarea</button>
    <button class="btn btn--export" id="exportarTareasBtn">⬇ Exportar tareas JSON</button>
`;

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

            // Enganchar evento correctamente
            deleteBtn.addEventListener("click", () => deleteTask(t.id, usuario.id));

            taskItem.appendChild(taskText);
            taskItem.appendChild(deleteBtn);
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

    const exportarTareasBtn = document.getElementById("exportarTareasBtn");
    exportarTareasBtn.addEventListener("click", () => {
        const contenidoJSON = prepararExportacion(tareas, usuario);
        const nombreArchivo = `tareas-${usuario.document}-${Date.now()}.json`;
        descargarJSON(contenidoJSON, nombreArchivo);
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
        resultadoUsuario.innerHTML += `
            <div class="error-card">
                <p>Error al eliminar la tarea.</p>
            </div>
        `;
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
            resultadoUsuario.innerHTML = `
                <div class="error-card">
                    <p>No se encontró ningún usuario con el documento "${documento}".</p>
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

searchForm.addEventListener('submit', handleFormSubmit);
documentoInput.addEventListener('input', () => clearError(documentoError));

// ============================================
// 7. INICIALIZACIÓN (OPCIONAL)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM completamente cargado');
    console.log('📝 Aplicación de registro de mensajes iniciada');
});
