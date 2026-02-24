// src/ui/exportUI.js
// RESPONSABILIDAD: funciones visuales del DOM para RF04

/**
 * RF04 - Descarga un string como archivo .json
 * @param {string} contenidoJSON - El string JSON ya preparado
 * @param {string} nombreArchivo - Nombre del archivo
 */
export function descargarJSON(contenidoJSON, nombreArchivo) {
    const blob        = new Blob([contenidoJSON], { type: 'application/json' });
    const urlTemporal = URL.createObjectURL(blob);
    const enlace      = document.createElement('a');

    enlace.href     = urlTemporal;
    enlace.download = nombreArchivo;

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(urlTemporal);
}

/**
 * RF04 - Crea y devuelve el botón exportar
 * @returns {HTMLButtonElement}
 */
export function crearBotonExportar() {
    const boton       = document.createElement('button');
    boton.classList.add('btn', 'btn--export');
    boton.id          = 'exportarTareasBtn';
    boton.textContent = '⬇ Exportar tareas JSON';
    return boton;
}