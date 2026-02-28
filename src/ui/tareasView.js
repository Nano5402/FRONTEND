// src/ui/tareasView.js
// Componentes visuales para mostrar usuario, tareas y formularios.

/**
 * Construye la tarjeta principal del usuario con sus tareas y controles.
 * Recibe callbacks para crear, editar, cambiar estado, eliminar, filtrar, ordenar y exportar.
 */
export function createUserCard(
    usuario,
    todasLasTareas,
    tareasAMostrar,
    estadoFiltro,
    criterioOrden,
    onCrearTarea,
    onEditar,
    onToggle,
    onEliminar,
    onFiltrar,
    onOrdenar,
    onExportar
) {
    const card = document.createElement('div');
    card.classList.add('user-card');

    // Encabezado con datos básicos del usuario.
    const header = document.createElement('div');
    header.style.marginBottom = 'var(--spacing-lg)';

    const nombre = document.createElement('h3');
    nombre.textContent = usuario.name;

    const documento = document.createElement('p');
    documento.innerHTML = `<strong>Documento:</strong> ${usuario.document}`;

    const correo = document.createElement('p');
    correo.innerHTML = `<strong>Correo:</strong> ${usuario.email}`;

    header.appendChild(nombre);
    header.appendChild(documento);
    header.appendChild(correo);

    // Estadísticas calculadas con todas las tareas, no solo las visibles.
    const total = todasLasTareas.length;
    const pendientes = todasLasTareas.filter((t) => t.status === 'pendiente').length;
    const enProceso = todasLasTareas.filter((t) => t.status === 'en proceso').length;
    const completadas = todasLasTareas.filter((t) => t.status === 'completada').length;

    const stats = document.createElement('div');
    stats.classList.add('stats-bar');
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
            <span class="stat-label">En Proceso</span>
            <span class="stat-value" style="color: var(--color-primary)">${enProceso}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Completadas</span>
            <span class="stat-value" style="color: var(--color-success)">${completadas}</span>
        </div>
    `;

    // Botón para abrir el formulario de creación de tarea.
    const btnCrearTarea = document.createElement('button');
    btnCrearTarea.classList.add('btn', 'btn--secondary');
    btnCrearTarea.textContent = 'Crear tarea';
    btnCrearTarea.addEventListener('click', () => onCrearTarea(usuario));

    // Botón para exportar solo las tareas visibles en pantalla.
    const btnExportar = document.createElement('button');
    btnExportar.type = 'button';
    btnExportar.classList.add('btn', 'btn--export');
    btnExportar.textContent = '⬇ Exportar JSON';
    btnExportar.addEventListener('click', () => {
        if (onExportar) onExportar(tareasAMostrar);
    });

    card.appendChild(header);
    card.appendChild(stats);
    card.appendChild(btnCrearTarea);
    card.appendChild(btnExportar);

    // Contenedor de la lista y controles de tareas.
    const tareasContainer = document.createElement('div');
    tareasContainer.classList.add('tasks-container');

    const listHeader = document.createElement('div');
    listHeader.style.display = 'flex';
    listHeader.style.flexDirection = 'column';
    listHeader.style.gap = '10px';
    listHeader.style.marginBottom = 'var(--spacing-lg)';

    const titleTareas = document.createElement('h4');
    titleTareas.textContent = 'Listado de tareas';
    titleTareas.style.margin = '0';

    // Controles de filtro y orden.
    const controlesDiv = document.createElement('div');
    controlesDiv.style.display = 'flex';
    controlesDiv.style.gap = '10px';
    controlesDiv.style.flexWrap = 'wrap';

    const selectFiltro = document.createElement('select');
    selectFiltro.classList.add('form__input');
    selectFiltro.style.width = 'auto';
    selectFiltro.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
    selectFiltro.innerHTML = `
        <option value="todos">Todos los estados</option>
        <option value="pendiente">Pendientes</option>
        <option value="en proceso">En proceso</option>
        <option value="completada">Completadas</option>
    `;
    selectFiltro.value = estadoFiltro || 'todos';
    selectFiltro.addEventListener('change', (e) => onFiltrar(e.target.value));

    const selectOrden = document.createElement('select');
    selectOrden.classList.add('form__input');
    selectOrden.style.width = 'auto';
    selectOrden.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
    selectOrden.innerHTML = `
        <option value="fecha">Por Fecha de creación</option>
        <option value="nombre">Por Nombre (A-Z)</option>
        <option value="estado">Por Estado</option>
    `;
    selectOrden.value = criterioOrden || 'fecha';
    selectOrden.addEventListener('change', (e) => onOrdenar(e.target.value));

    controlesDiv.appendChild(selectFiltro);
    controlesDiv.appendChild(selectOrden);

    listHeader.appendChild(titleTareas);
    listHeader.appendChild(controlesDiv);
    tareasContainer.appendChild(listHeader);

    // Si no hay tareas para mostrar, se informa con un mensaje simple.
    if (tareasAMostrar.length === 0) {
        const noTareas = document.createElement('p');
        noTareas.textContent = 'No hay tareas que coincidan con los filtros.';
        noTareas.style.color = 'var(--color-text-tertiary)';
        noTareas.style.fontStyle = 'italic';
        tareasContainer.appendChild(noTareas);
    } else {
        tareasAMostrar.forEach((tarea) => {
            const taskItem = createTaskItem(tarea, onEditar, onToggle, onEliminar);
            tareasContainer.appendChild(taskItem);
        });
    }

    card.appendChild(tareasContainer);
    return card;
}

/**
 * Crea un elemento visual para una tarea con sus acciones.
 */
export function createTaskItem(tarea, onEditar, onToggle, onEliminar) {
    const taskItem = document.createElement('div');
    taskItem.classList.add('task-item');

    if (tarea.status === 'completada') {
        taskItem.classList.add('completed');
    }

    const taskInfo = document.createElement('div');
    taskInfo.classList.add('task-info');

    const titulo = document.createElement('h5');
    titulo.textContent = tarea.title;

    const descripcion = document.createElement('p');
    const estadoTexto = tarea.status.toUpperCase();
    const bodyTexto = tarea.body ? ` | ${tarea.body}` : '';
    descripcion.textContent = `${estadoTexto}${bodyTexto}`;

    taskInfo.appendChild(titulo);
    taskInfo.appendChild(descripcion);

    const actionsContainer = document.createElement('div');
    actionsContainer.classList.add('task-actions');

    if (onEditar) {
        const btnEditar = document.createElement('button');
        btnEditar.classList.add('btn', 'btn--sm', 'btn--primary');
        btnEditar.textContent = 'Editar';
        btnEditar.addEventListener('click', () => onEditar(tarea));
        actionsContainer.appendChild(btnEditar);
    }

    if (onToggle) {
        const btnToggle = document.createElement('button');
        let textoBoton = 'Avanzar';
        let claseBoton = 'btn--info';

        if (tarea.status === 'pendiente') {
            textoBoton = 'En proceso';
            claseBoton = 'btn--warning';
        } else if (tarea.status === 'en proceso') {
            textoBoton = 'Completar';
            claseBoton = 'btn--success';
        } else {
            textoBoton = 'Reabrir';
            claseBoton = 'btn--secondary';
        }

        btnToggle.classList.add('btn', 'btn--sm', claseBoton);
        btnToggle.textContent = textoBoton;
        btnToggle.addEventListener('click', () => onToggle(tarea));
        actionsContainer.appendChild(btnToggle);
    }

    if (onEliminar) {
        const btnEliminar = document.createElement('button');
        btnEliminar.classList.add('btn', 'btn--sm', 'btn--danger');
        btnEliminar.textContent = 'Borrar';
        btnEliminar.addEventListener('click', () => onEliminar(tarea));
        actionsContainer.appendChild(btnEliminar);
    }

    taskItem.appendChild(taskInfo);
    taskItem.appendChild(actionsContainer);

    return taskItem;
}

/**
 * Renderiza el formulario para crear una nueva tarea.
 */
export function renderTaskForm(usuario, onSubmit, onCancel) {
    const form = document.createElement('form');
    form.classList.add('form', 'form-tarea');
    form.style.marginTop = 'var(--spacing-xl)';

    const grupoTitulo = document.createElement('div');
    grupoTitulo.classList.add('form__group');

    const labelTitulo = document.createElement('label');
    labelTitulo.htmlFor = 'taskTitle';
    labelTitulo.classList.add('form__label');
    labelTitulo.textContent = 'Título de la tarea';

    const inputTitulo = document.createElement('input');
    inputTitulo.type = 'text';
    inputTitulo.id = 'taskTitle';
    inputTitulo.classList.add('form__input');
    inputTitulo.placeholder = 'Ingresa el título';
    inputTitulo.required = true;

    grupoTitulo.appendChild(labelTitulo);
    grupoTitulo.appendChild(inputTitulo);

    const grupoDescripcion = document.createElement('div');
    grupoDescripcion.classList.add('form__group');

    const labelDescripcion = document.createElement('label');
    labelDescripcion.htmlFor = 'taskBody';
    labelDescripcion.classList.add('form__label');
    labelDescripcion.textContent = 'Descripción';

    const textareaDescripcion = document.createElement('textarea');
    textareaDescripcion.id = 'taskBody';
    textareaDescripcion.classList.add('form__input', 'form__textarea');
    textareaDescripcion.placeholder = 'Ingresa la descripción';

    grupoDescripcion.appendChild(labelDescripcion);
    grupoDescripcion.appendChild(textareaDescripcion);

    const botones = document.createElement('div');
    botones.classList.add('form__actions');

    const btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.classList.add('btn', 'btn--secondary');
    btnCancelar.textContent = 'Cancelar';

    const btnGuardar = document.createElement('button');
    btnGuardar.type = 'submit';
    btnGuardar.classList.add('btn', 'btn--primary');
    btnGuardar.textContent = 'Guardar';

    botones.appendChild(btnCancelar);
    botones.appendChild(btnGuardar);

    form.appendChild(grupoTitulo);
    form.appendChild(grupoDescripcion);
    form.appendChild(botones);

    // Validación básica: el título es obligatorio.
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = inputTitulo.value.trim();
        const body = textareaDescripcion.value.trim();

        if (!title) {
            alert('El título es obligatorio');
            return;
        }

        onSubmit({ title, body, usuario });
    });

    btnCancelar.addEventListener('click', () => {
        if (onCancel) onCancel();
        else form.remove();
    });

    return form;
}

/**
 * Crea una tarjeta simple para mostrar errores en pantalla.
 */
export function createErrorCard(mensaje) {
    const errorCard = document.createElement('div');
    errorCard.classList.add('error-card');

    const parrafo = document.createElement('p');
    parrafo.textContent = mensaje;

    errorCard.appendChild(parrafo);
    return errorCard;
}
