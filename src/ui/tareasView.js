
/**
 * ============================================
 * TAREASVIEW.JS - Componentes de UI para Tareas
 * ============================================
 *
 * Responsabilidad: Crear elementos DOM con createElement
 * No usa fetch - solo renderiza datos que recibe
 */

/**
 * Crea una card de usuario completa con información y lista de tareas
 * @param {Object} usuario - Datos del usuario
 * @param {Array} tareas - Array de tareas del usuario
 * @param {Function} onCrearTarea - Callback para crear tarea
 * @param {Function} onEditar - Callback para editar tarea
 * @param {Function} onToggle - Callback para cambiar estado
 * @param {Function} onEliminar - Callback para eliminar tarea
 */
function createUserCard(usuario, tareas, onCrearTarea, onEditar, onToggle, onEliminar) {
    // Contenedor principal (card)
    const card = document.createElement("div");
    card.classList.add("user-card");

    // Header con información del usuario
    const header = document.createElement("div");
    header.style.marginBottom = "var(--spacing-lg)";

    const nombre = document.createElement("h3");
    nombre.textContent = usuario.name;

    const documento = document.createElement("p");
    documento.innerHTML = `<strong>Documento:</strong> ${usuario.document}`;

    const correo = document.createElement("p");
    correo.innerHTML = `<strong>Correo:</strong> ${usuario.email}`;

    header.appendChild(nombre);
    header.appendChild(documento);
    header.appendChild(correo);

    // Estadísticas de tareas
    const total = tareas.length;
    const pendientes = tareas.filter(t => t.status === "pendiente").length;
    const completadas = tareas.filter(t => t.status === "completada").length;

    const stats = document.createElement("div");
    stats.style.marginBottom = "var(--spacing-lg)";
    stats.style.padding = "var(--spacing-md)";
    stats.style.backgroundColor = "var(--color-gray-50)";
    stats.style.borderRadius = "var(--radius-md)";

    const totalTareas = document.createElement("p");
    totalTareas.innerHTML = `<strong>Total tareas:</strong> ${total}`;

    const tareasP = document.createElement("p");
    tareasP.innerHTML = `<strong>Pendientes:</strong> ${pendientes}`;

    const tareasC = document.createElement("p");
    tareasC.innerHTML = `<strong>Completadas:</strong> ${completadas}`;

    stats.appendChild(totalTareas);
    stats.appendChild(tareasP);
    stats.appendChild(tareasC);

    // Botón para crear tarea
    const btnCrearTarea = document.createElement("button");
    btnCrearTarea.classList.add("btn", "btn--secondary");
    btnCrearTarea.textContent = "Crear tarea";
    btnCrearTarea.addEventListener("click", () => onCrearTarea(usuario));

    card.appendChild(header);
    card.appendChild(stats);
    card.appendChild(btnCrearTarea);

    // Contenedor de tareas
    const tareasContainer = document.createElement("div");
    tareasContainer.classList.add("tasks-container");

    const titleTareas = document.createElement("h4");
    titleTareas.textContent = "Listado de tareas";
    tareasContainer.appendChild(titleTareas);

    if (tareas.length === 0) {
        const noTareas = document.createElement("p");
        noTareas.textContent = "No hay tareas registradas.";
        noTareas.style.color = "var(--color-text-tertiary)";
        noTareas.style.fontStyle = "italic";
        tareasContainer.appendChild(noTareas);
    } else {
        tareas.forEach(tarea => {
            const taskItem = createTaskItem(
                tarea,
                onEditar,
                (t) => onToggle(t.id, t.status, usuario.id),
                (t) => onEliminar(t.id, usuario.id)
            );
            tareasContainer.appendChild(taskItem);
        });
    }

    card.appendChild(tareasContainer);

    return card;
}

/**
 * Crea un item individual de tarea con sus acciones
 * @param {Object} tarea - Datos de la tarea
 * @param {Function} onEditar - Callback para editar
 * @param {Function} onToggle - Callback para cambiar estado
 * @param {Function} onEliminar - Callback para eliminar
 */
function createTaskItem(tarea, onEditar, onToggle, onEliminar) {
    const taskItem = document.createElement("div");
    taskItem.classList.add("task-item");

    if (tarea.status === "completada") {
        taskItem.classList.add("completed");
    }

    // Información de la tarea
    const taskInfo = document.createElement("div");
    taskInfo.classList.add("task-info");

    const titulo = document.createElement("h5");
    titulo.textContent = tarea.title;

    const descripcion = document.createElement("p");
    const estadoTexto = tarea.status.toUpperCase();
    const bodyTexto = tarea.body ? ` | ${tarea.body}` : "";
    descripcion.textContent = `${estadoTexto}${bodyTexto}`;

    taskInfo.appendChild(titulo);
    taskInfo.appendChild(descripcion);

    // Contenedor de acciones
    const actionsContainer = document.createElement("div");
    actionsContainer.classList.add("task-actions");

    // Botón Editar
    if (onEditar) {
        const btnEditar = document.createElement("button");
        btnEditar.classList.add("btn", "btn--sm", "btn--primary");
        btnEditar.textContent = "Editar";
        btnEditar.addEventListener("click", () => onEditar(tarea));
        actionsContainer.appendChild(btnEditar);
    }

    // Botón Completar/Desmarcar
    if (onToggle) {
        const btnToggle = document.createElement("button");
        const isCompleted = tarea.status === "completada";
        btnToggle.classList.add("btn", "btn--sm", isCompleted ? "btn--warning" : "btn--success");
        btnToggle.textContent = isCompleted ? "Desmarcar" : "Completar";
        btnToggle.addEventListener("click", () => onToggle(tarea));
        actionsContainer.appendChild(btnToggle);
    }

    // Botón Eliminar
    if (onEliminar) {
        const btnEliminar = document.createElement("button");
        btnEliminar.classList.add("btn", "btn--sm", "btn--danger");
        btnEliminar.textContent = "Borrar";
        btnEliminar.addEventListener("click", () => onEliminar(tarea));
        actionsContainer.appendChild(btnEliminar);
    }

    taskItem.appendChild(taskInfo);
    taskItem.appendChild(actionsContainer);

    return taskItem;
}

/**
 * Renderiza el formulario para crear/editar una tarea
 * @param {Object} usuario - Usuario propietario de la tarea
 * @param {Function} onSubmit - Callback cuando se envía el formulario
 * @param {Function} onCancel - Callback para cancelar
 * @returns {HTMLElement} - El formulario
 */
function renderTaskForm(usuario, onSubmit, onCancel) {
    const form = document.createElement("form");
    form.classList.add("form");
    form.style.marginTop = "var(--spacing-xl)";

    // Grupo título
    const grupoTitulo = document.createElement("div");
    grupoTitulo.classList.add("form__group");

    const labelTitulo = document.createElement("label");
    labelTitulo.htmlFor = "taskTitle";
    labelTitulo.classList.add("form__label");
    labelTitulo.textContent = "Título de la tarea";

    const inputTitulo = document.createElement("input");
    inputTitulo.type = "text";
    inputTitulo.id = "taskTitle";
    inputTitulo.classList.add("form__input");
    inputTitulo.placeholder = "Ingresa el título";
    inputTitulo.required = true;

    grupoTitulo.appendChild(labelTitulo);
    grupoTitulo.appendChild(inputTitulo);

    // Grupo descripción
    const grupoDescripcion = document.createElement("div");
    grupoDescripcion.classList.add("form__group");

    const labelDescripcion = document.createElement("label");
    labelDescripcion.htmlFor = "taskBody";
    labelDescripcion.classList.add("form__label");
    labelDescripcion.textContent = "Descripción";

    const textareaDescripcion = document.createElement("textarea");
    textareaDescripcion.id = "taskBody";
    textareaDescripcion.classList.add("form__input", "form__textarea");
    textareaDescripcion.placeholder = "Ingresa la descripción";

    grupoDescripcion.appendChild(labelDescripcion);
    grupoDescripcion.appendChild(textareaDescripcion);

    // Botones de acción
    const botones = document.createElement("div");
    botones.style.display = "flex";
    botones.style.gap = "var(--spacing-md)";
    botones.style.justifyContent = "flex-end";

    const btnGuardar = document.createElement("button");
    btnGuardar.type = "submit";
    btnGuardar.classList.add("btn", "btn--primary");
    btnGuardar.textContent = "Guardar";

    const btnCancelar = document.createElement("button");
    btnCancelar.type = "button";
    btnCancelar.classList.add("btn", "btn--secondary");
    btnCancelar.textContent = "Cancelar";

    botones.appendChild(btnGuardar);
    botones.appendChild(btnCancelar);

    form.appendChild(grupoTitulo);
    form.appendChild(grupoDescripcion);
    form.appendChild(botones);

    // Event listeners
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = inputTitulo.value.trim();
        const body = textareaDescripcion.value.trim();

        if (!title) {
            alert("El título es obligatorio");
            return;
        }

        onSubmit({
            title,
            body,
            usuario
        });
    });

    btnCancelar.addEventListener("click", () => {
        if (onCancel) {
            onCancel();
        } else {
            form.remove();
        }
    });

    return form;
}

/**
 * Crea una card de error
 * @param {string} mensaje - Mensaje de error
 */
function createErrorCard(mensaje) {
    const errorCard = document.createElement("div");
    errorCard.classList.add("error-card");

    const parrafo = document.createElement("p");
    parrafo.textContent = mensaje;

    errorCard.appendChild(parrafo);

    return errorCard;
}