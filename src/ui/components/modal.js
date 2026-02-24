/**
 * ============================================
 * MODAL.JS - Componentes modales
 * ============================================
 *
 * Diálogos y modales centrados en pantalla
 */

/**
 * Crea e inserta un backdrop (overlay oscuro)
 */
function createModalOverlay() {
    const overlay = document.createElement("div");
    overlay.classList.add("modal-overlay");
    return overlay;
}

/**
 * Muestra un modal de confirmación
 * @param {string} titulo - Título del modal
 * @param {string} mensaje - Mensaje de confirmación
 * @param {string} textoBtnConfirmar - Texto del botón de confirmar
 * @param {string} textoBtnCancelar - Texto del botón de cancelar
 * @returns {Promise} - Resuelve true si confirma, false si cancela
 */
function showConfirmModal(titulo, mensaje, textoBtnConfirmar = "Confirmar", textoBtnCancelar = "Cancelar") {
    return new Promise((resolve) => {
        const overlay = createModalOverlay();

        const modal = document.createElement("div");
        modal.classList.add("modal");

        const header = document.createElement("div");
        header.classList.add("modal__header");

        const titleEl = document.createElement("h2");
        titleEl.classList.add("modal__title");
        titleEl.textContent = titulo;

        header.appendChild(titleEl);

        const body = document.createElement("div");
        body.classList.add("modal__body");

        const mensajeEl = document.createElement("p");
        mensajeEl.textContent = mensaje;

        body.appendChild(mensajeEl);

        const footer = document.createElement("div");
        footer.classList.add("modal__footer");

        const btnCancelar = document.createElement("button");
        btnCancelar.classList.add("btn", "btn--secondary");
        btnCancelar.textContent = textoBtnCancelar;

        const btnConfirmar = document.createElement("button");
        btnConfirmar.classList.add("btn", "btn--primary");
        btnConfirmar.textContent = textoBtnConfirmar;

        footer.appendChild(btnCancelar);
        footer.appendChild(btnConfirmar);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        btnConfirmar.addEventListener("click", () => {
            overlay.remove();
            resolve(true);
        });

        btnCancelar.addEventListener("click", () => {
            overlay.remove();
            resolve(false);
        });

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });
    });
}

/**
 * Muestra un modal de alerta (solo lectura)
 * @param {string} titulo - Título del modal
 * @param {string} mensaje - Mensaje de alerta
 * @param {string} textoBtnOk - Texto del botón OK
 * @returns {Promise} - Resuelve cuando se cierra
 */
function showAlertModal(titulo, mensaje, textoBtnOk = "OK") {
    return new Promise((resolve) => {
        const overlay = createModalOverlay();

        const modal = document.createElement("div");
        modal.classList.add("modal");

        const header = document.createElement("div");
        header.classList.add("modal__header");

        const titleEl = document.createElement("h2");
        titleEl.classList.add("modal__title");
        titleEl.textContent = titulo;

        header.appendChild(titleEl);

        const body = document.createElement("div");
        body.classList.add("modal__body");

        const mensajeEl = document.createElement("p");
        mensajeEl.textContent = mensaje;

        body.appendChild(mensajeEl);

        const footer = document.createElement("div");
        footer.classList.add("modal__footer");
        footer.style.justifyContent = "center";

        const btnOk = document.createElement("button");
        btnOk.classList.add("btn", "btn--primary");
        btnOk.textContent = textoBtnOk;

        footer.appendChild(btnOk);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const cerrar = () => {
            overlay.remove();
            resolve();
        };

        btnOk.addEventListener("click", cerrar);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                cerrar();
            }
        });
    });
}

/**
 * Muestra un modal con contenido personalizado
 * @param {string} titulo - Título del modal
 * @param {HTMLElement} contenido - Elemento HTML con el contenido
 * @param {boolean} mostrarBotones - Si muestra botones de ok/cancelar
 * @returns {Promise} - Resuelve true si confirma, false si cancela
 */
function showCustomModal(titulo, contenido, mostrarBotones = true) {
    return new Promise((resolve) => {
        const overlay = createModalOverlay();

        const modal = document.createElement("div");
        modal.classList.add("modal");

        const header = document.createElement("div");
        header.classList.add("modal__header");

        const titleEl = document.createElement("h2");
        titleEl.classList.add("modal__title");
        titleEl.textContent = titulo;

        header.appendChild(titleEl);

        const body = document.createElement("div");
        body.classList.add("modal__body");

        if (typeof contenido === "string") {
            body.innerHTML = contenido;
        } else {
            body.appendChild(contenido);
        }

        modal.appendChild(header);
        modal.appendChild(body);

        if (mostrarBotones) {
            const footer = document.createElement("div");
            footer.classList.add("modal__footer");

            const btnCancelar = document.createElement("button");
            btnCancelar.classList.add("btn", "btn--secondary");
            btnCancelar.textContent = "Cancelar";

            const btnOk = document.createElement("button");
            btnOk.classList.add("btn", "btn--primary");
            btnOk.textContent = "OK";

            footer.appendChild(btnCancelar);
            footer.appendChild(btnOk);

            modal.appendChild(footer);

            btnCancelar.addEventListener("click", () => {
                overlay.remove();
                resolve(false);
            });

            btnOk.addEventListener("click", () => {
                overlay.remove();
                resolve(true);
            });
        }

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay && mostrarBotones) {
                overlay.remove();
                resolve(false);
            }
        });
    });
}

