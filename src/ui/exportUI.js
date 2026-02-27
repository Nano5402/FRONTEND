// src/ui/exportUI.js
// RESPONSABILIDAD: funciones de interfaz para RF04
// Estas funciones SÍ tocan el DOM — por eso viven aquí y no en api/

/**
 * RF04 - Descarga un string JSON como archivo .json en el navegador
 * Usa Blob y createElement — manipulación directa del DOM
 * 
 * @param {string} contenidoJSON - El string JSON ya preparado
 * @param {string} nombreArchivo  - Nombre que tendrá el archivo descargado
 */
export function descargarJSON(contenidoJSON, nombreArchivo) {
    // Paso 1: crear un "archivo" en la memoria del navegador
    const blob = new Blob([contenidoJSON], { type: 'application/json' });

    // Paso 2: crear URL temporal que apunta a ese archivo en memoria
    const urlTemporal = URL.createObjectURL(blob);

    // Paso 3: crear un enlace invisible con esa URL
    const enlace = document.createElement('a');
    enlace.href     = urlTemporal;
    enlace.download = nombreArchivo;

    // Paso 4: insertar, simular clic y eliminar
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    // Paso 5: liberar la memoria del navegador
    URL.revokeObjectURL(urlTemporal);
}

/**
 * RF04 - Crea y devuelve el botón exportar listo para insertar en el DOM
 * @returns {HTMLButtonElement} - El botón construido
 */
export function crearBotonExportar() {
    const boton       = document.createElement('button');
    boton.type        = 'button';
    boton.classList.add('btn', 'btn--export');
    boton.id          = 'exportarTareasBtn';
    boton.textContent = '⬇ Exportar JSON';
    return boton;
}