/**
 * ============================================
 * TAREASVIEW.JS - Componentes de UI para Tareas
 * ============================================
 */

export function createUserCard(usuario, tareas, criterioActual, onCrearTarea, onEditar, onToggle, onEliminar, onOrdenar) {
    const card = document.createElement("div");
    card.classList.add("user-card");

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

    const total = tareas.length;
    const pendientes = tareas.filter(t => t.status === "pendiente").length;
    const completadas = tareas.filter(t => t.status === "completada").length;

    const stats = document.createElement("div");
    stats.classList.add("stats-bar"); 

    stats.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Total</span>
            <span class="stat-value">${total}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Pendientes</span>
            <span class="stat-value" style="color: var(--color-warning)">${pendientes}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Completadas</span>
            <span class="stat-value" style="color: var(--color-success)">${completadas}</span>
        </div>
    `;

    const btnCrearTarea = document.createElement("button");
    btnCrearTarea.classList.add("btn", "btn--secondary");
    btnCrearTarea.textContent = "Crear tarea";
    btnCrearTarea.addEventListener("click", () => onCrearTarea(usuario));

    card.appendChild(header);
    card.appendChild(stats);
    card.appendChild(btnCrearTarea);

    // --- NUEVO CONTENEDOR DE TAREAS CON SELECTOR DE ORDEN ---
    const tareasContainer = document.createElement("div");
    tareasContainer.classList.add("tasks-container");

    const listHeader = document.createElement("div");
    listHeader.style.display = "flex";
    listHeader.style.justifyContent = "space-between";
    listHeader.style.alignItems = "center";
    listHeader.style.marginBottom = "var(--spacing-lg)";

    const titleTareas = document.createElement("h4");
    titleTareas.textContent = "Listado de tareas";
    titleTareas.style.margin = "0";

    const selectOrden = document.createElement("select");
    selectOrden.classList.add("form__input");
    selectOrden.style.width = "auto";
    selectOrden.style.padding = "var(--spacing-xs) var(--spacing-sm)";
    selectOrden.innerHTML = `
        <option value="fecha">Más recientes primero</option>
        <option value="nombre">Orden alfabético (A-Z)</option>
        <option value="estado">Por estado</option>
    `;
    
    // Dejar seleccionada la opción actual para que no se reinicie
    selectOrden.value = criterioActual || "fecha";

    if (onOrdenar) {
        selectOrden.addEventListener("change", (e) => onOrdenar(e.target.value));
    }

    listHeader.appendChild(titleTareas);
    listHeader.appendChild(selectOrden);
    tareasContainer.appendChild(listHeader);

    // --- RENDERIZADO DE TAREAS ---
    if (tareas.length === 0) {
        const noTareas = document.createElement("p");
        noTareas.textContent = "No hay tareas registradas.";
        noTareas.style.color = "var(--color-text-tertiary)";
        noTareas.style.fontStyle = "italic";
        tareasContainer.appendChild(noTareas);
    } else {
        tareas.forEach(tarea => {
            const taskItem = createTaskItem(tarea, onEditar, onToggle, onEliminar);
            tareasContainer.appendChild(taskItem);
        });
    }

    card.appendChild(tareasContainer);
    return card;
}

export function createTaskItem(tarea, onEditar, onToggle, onEliminar) {
    const taskItem = document.createElement("div");
    taskItem.classList.add("task-item");

    const isCompleted = tarea.status === "completada";

    if (isCompleted) {
        taskItem.classList.add("completed");
    }

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

    const actionsContainer = document.createElement("div");
    actionsContainer.classList.add("task-actions");

    // 1. Botón Editar
    if (onEditar) {
        const btnEditar = document.createElement("button");
        btnEditar.classList.add("btn", "btn--sm", "btn--primary");
        btnEditar.textContent = "Editar";
        btnEditar.addEventListener("click", () => onEditar(tarea));
        actionsContainer.appendChild(btnEditar);
    }

    // 2. Botón Cambiar Estado (Completar / En progreso)
    if (onToggle) {
        const btnToggle = document.createElement("button");
        btnToggle.classList.add("btn", "btn--sm", isCompleted ? "btn--warning" : "btn--success");
        btnToggle.textContent = isCompleted ? "En progreso" : "Completar";
        btnToggle.addEventListener("click", () => onToggle(tarea));
        actionsContainer.appendChild(btnToggle);
    }

    // 3. Botón Eliminar
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

export function renderTaskForm(usuario, onSubmit, onCancel) {
    const form = document.createElement("form");
    form.classList.add("form", "form-tarea"); 
    form.style.marginTop = "var(--spacing-xl)";

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

    const botones = document.createElement("div");
    botones.classList.add("form__actions"); 

    const btnCancelar = document.createElement("button");
    btnCancelar.type = "button";
    btnCancelar.classList.add("btn", "btn--secondary");
    btnCancelar.textContent = "Cancelar";

    const btnGuardar = document.createElement("button");
    btnGuardar.type = "submit";
    btnGuardar.classList.add("btn", "btn--primary");
    btnGuardar.textContent = "Guardar";

    botones.appendChild(btnCancelar);
    botones.appendChild(btnGuardar);

    form.appendChild(grupoTitulo);
    form.appendChild(grupoDescripcion);
    form.appendChild(botones);

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = inputTitulo.value.trim();
        const body = textareaDescripcion.value.trim();

        if (!title) {
            alert("El título es obligatorio");
            return;
        }

        onSubmit({ title, body, usuario });
    });

    btnCancelar.addEventListener("click", () => {
        if (onCancel) onCancel();
        else form.remove();
    });

    return form;
}

export function createErrorCard(mensaje) {
    const errorCard = document.createElement("div");
    errorCard.classList.add("error-card");
    const parrafo = document.createElement("p");
    parrafo.textContent = mensaje;
    errorCard.appendChild(parrafo);
    return errorCard;
}