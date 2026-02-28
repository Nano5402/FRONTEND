// src/ui/exportUI.js
// Funciones de interfaz para la exportación de tareas en JSON.

/**
 * Descarga un texto JSON como archivo en el navegador.
 * Entrada: contenido ya formateado y nombre del archivo.
 */
export function descargarJSON(contenidoJSON, nombreArchivo) {
    // 1) Crear un archivo temporal en memoria.
    const blob = new Blob([contenidoJSON], { type: 'application/json' });

    // 2) Crear una URL temporal para ese archivo.
    const urlTemporal = URL.createObjectURL(blob);

    // 3) Crear un enlace oculto y disparar la descarga.
    const enlace = document.createElement('a');
    enlace.href = urlTemporal;
    enlace.download = nombreArchivo;

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    // 4) Liberar la URL temporal para evitar uso extra de memoria.
    URL.revokeObjectURL(urlTemporal);
}

/**
 * Crea el botón "Exportar JSON" listo para insertarlo en el DOM.
 */
export function crearBotonExportar() {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.classList.add('btn', 'btn--export');
    boton.id = 'exportarTareasBtn';
    boton.textContent = '⬇ Exportar JSON';
    return boton;
}
