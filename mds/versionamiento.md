# Registro de Versiones â€” GestiÃ³n de Tareas

**Proyecto:** DOM + API | SENA
**Autores:** Andres Santiago Calvete, Ana Isabella Rozo, Fernando Rodriguez
**Rama:** feature/api-fer

---

## v2.0 â€” MigraciÃ³n a Vite + RF04 ExportaciÃ³n JSON

**Fecha:** 28/02/2026
**Tipo de cambio:** Mayor (cambio de entorno de ejecuciÃ³n)

### Â¿QuÃ© representa esta versiÃ³n?

Esta versiÃ³n marca el cierre del segundo sprint del proyecto.
Se realizaron dos grandes cambios respecto a v1.0:

**1. IntegraciÃ³n de Vite como empaquetador**
El proyecto pasÃ³ de ejecutarse directamente con Live Server
a gestionarse con un entorno profesional de desarrollo y build.
Esto permite separar claramente el entorno de desarrollo
(npm run dev) del entorno de producciÃ³n (npm run build),
gestionar dependencias con npm y obtener cÃ³digo optimizado
para despliegue.

**2. ImplementaciÃ³n de RF04 â€” ExportaciÃ³n de tareas en JSON**
Se aÃ±adiÃ³ la funcionalidad para que el usuario pueda descargar
las tareas visibles en pantalla como un archivo .json.
La implementaciÃ³n respeta la separaciÃ³n de responsabilidades:
la lÃ³gica de datos en tareasApi.js y la manipulaciÃ³n del DOM
en exportUI.js, coordinadas desde script.js.

### Archivos clave de esta versiÃ³n

- package.json â€” gestiÃ³n de dependencias y scripts
- vite.config.js â€” configuraciÃ³n del empaquetador
- src/api/tareasApi.js â€” prepararExportacion() RF04
- src/ui/exportUI.js â€” descargarJSON() y crearBotonExportar()
- src/script.js â€” integraciÃ³n del callback de exportaciÃ³n
- .gitignore â€” exclusiÃ³n de node_modules y dist

### Scripts disponibles desde esta versiÃ³n

| Script          | DescripciÃ³n                          |
| --------------- | ------------------------------------- |
| npm run dev     | Servidor de desarrollo en puerto 5173 |
| npm run build   | Build optimizado en carpeta dist/     |
| npm run preview | Vista previa del build en puerto 4173 |

### Tabla de evoluciÃ³n del proyecto

| VersiÃ³n | DescripciÃ³n                  | Estado    |
| -------- | ----------------------------- | --------- |
| v1.0     | Proyecto base con ES Modules  | Archivada |
| v2.0     | Vite + RF04 ExportaciÃ³n JSON | âœ… Actual |

---

## Ciclo de vida de un Tag

```
Desarrollo  â†’  Commit  â†’  Push  â†’  Tag  â†’  PR  â†’  Merge
    â†‘                              â†‘
 (diario)              (hito formal del sprint)
```

Un tag NO reemplaza los commits diarios. Los commits
registran el proceso; el tag registra el logro.

