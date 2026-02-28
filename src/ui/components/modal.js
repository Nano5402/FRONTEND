// src/ui/components/modal.js
// Componente de modales para confirmar acciones o mostrar mensajes.

/**
 * Crea la capa oscura de fondo para cualquier modal.
 */
export function createModalOverlay() {
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');
    return overlay;
}

/**
 * Muestra un modal de confirmación (aceptar/cancelar).
 * Retorna true si el usuario confirma y false si cancela.
 */
export function showConfirmModal(
    titulo,
    mensaje,
    textoBtnConfirmar = 'Confirmar',
    textoBtnCancelar = 'Cancelar'
) {
    return new Promise((resolve) => {
        const overlay = createModalOverlay();

        const modal = document.createElement('div');
        modal.classList.add('modal-content');

        const header = document.createElement('div');
        header.classList.add('modal-header');

        const titleEl = document.createElement('h2');
        titleEl.textContent = titulo;
        header.appendChild(titleEl);

        const body = document.createElement('div');
        const mensajeEl = document.createElement('p');
        mensajeEl.textContent = mensaje;
        body.appendChild(mensajeEl);

        const footer = document.createElement('div');
        footer.classList.add('modal-actions');

        const btnCancelar = document.createElement('button');
        btnCancelar.classList.add('btn', 'btn--secondary');
        btnCancelar.textContent = textoBtnCancelar;

        const btnConfirmar = document.createElement('button');
        btnConfirmar.classList.add('btn', 'btn--primary');
        btnConfirmar.textContent = textoBtnConfirmar;

        footer.appendChild(btnCancelar);
        footer.appendChild(btnConfirmar);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        btnConfirmar.addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });

        btnCancelar.addEventListener('click', () => {
            overlay.remove();
            resolve(false);
        });

        // Cerrar si se hace clic fuera del contenido.
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });
    });
}

/**
 * Muestra un modal informativo con un solo botón.
 */
export function showAlertModal(titulo, mensaje, textoBtnOk = 'OK') {
    return new Promise((resolve) => {
        const overlay = createModalOverlay();

        const modal = document.createElement('div');
        modal.classList.add('modal-content');

        const header = document.createElement('div');
        header.classList.add('modal-header');

        const titleEl = document.createElement('h2');
        titleEl.textContent = titulo;
        header.appendChild(titleEl);

        const body = document.createElement('div');
        const mensajeEl = document.createElement('p');
        mensajeEl.textContent = mensaje;
        body.appendChild(mensajeEl);

        const footer = document.createElement('div');
        footer.classList.add('modal-actions');
        footer.style.justifyContent = 'center';

        const btnOk = document.createElement('button');
        btnOk.classList.add('btn', 'btn--primary');
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

        btnOk.addEventListener('click', cerrar);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cerrar();
            }
        });
    });
}

/**
 * Muestra un modal personalizado.
 * Puede recibir un string HTML o un nodo ya construido.
 */
export function showCustomModal(titulo, contenido, mostrarBotones = true) {
    return new Promise((resolve) => {
        const overlay = createModalOverlay();

        const modal = document.createElement('div');
        modal.classList.add('modal-content');

        const header = document.createElement('div');
        header.classList.add('modal-header');

        const titleEl = document.createElement('h2');
        titleEl.textContent = titulo;
        header.appendChild(titleEl);

        const body = document.createElement('div');

        if (typeof contenido === 'string') {
            body.innerHTML = contenido;
        } else {
            body.appendChild(contenido);
        }

        modal.appendChild(header);
        modal.appendChild(body);

        if (mostrarBotones) {
            const footer = document.createElement('div');
            footer.classList.add('modal-actions');

            const btnCancelar = document.createElement('button');
            btnCancelar.classList.add('btn', 'btn--secondary');
            btnCancelar.textContent = 'Cancelar';

            const btnOk = document.createElement('button');
            btnOk.classList.add('btn', 'btn--primary');
            btnOk.textContent = 'OK';

            footer.appendChild(btnCancelar);
            footer.appendChild(btnOk);
            modal.appendChild(footer);

            btnCancelar.addEventListener('click', () => {
                overlay.remove();
                resolve(false);
            });

            btnOk.addEventListener('click', () => {
                overlay.remove();
                resolve(true);
            });
        }

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && mostrarBotones) {
                overlay.remove();
                resolve(false);
            }
        });
    });
}
