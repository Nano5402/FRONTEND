# Reporte Técnico — Scripts de Vite

**Fecha:** 28/02/2026

---

## npm run dev

- **Acción:** inicia servidor de desarrollo en localhost:5173
- **Archivos generados:** ninguno permanente, todo en memoria
- **Diferencia vs tradicional:** HMR reemplaza recarga completa,
  Vite sirve módulos ES nativos sin bundling en desarrollo
- **Terminal muestra:** VITE ready + URL local

## npm run build

- **Acción:** empaqueta y optimiza para producción
- **Archivos generados:** dist/index.html, dist/assets/*.js, dist/assets/*.css
- **Diferencia vs tradicional:** múltiples archivos JS → 1 archivo minificado,
  tree-shaking elimina código no utilizado
- **Terminal muestra:** lista de módulos transformados + tamaños finales

## npm run preview

- **Acción:** sirve dist/ en localhost:4173 para revisión
- **Archivos generados:** ninguno, lee los de dist/
- **Diferencia vs tradicional:** simula servidor de producción real
- **Terminal muestra:** URL en puerto 4173

---

## Puntos de reflexión

1. **¿Qué elemento del DOM estás seleccionando?**
   searchForm, documentoInput, documentoError, resultadoUsuario
   mediante getElementById en src/script.js
2. **¿Qué evento provoca el cambio en la página?**
   El evento submit del formulario de búsqueda dispara
   la consulta al servidor y el renderizado de la card
3. **¿Qué nuevo elemento se crea?**
   Una div.user-card con información del usuario, estadísticas,
   lista de tareas y el botón ⬇ Exportar JSON (RF04)
4. **¿Dónde se inserta ese elemento dentro del DOM?**
   Dentro de div#resultadoUsuario mediante appendChild
   luego de limpiar con innerHTML = ""
5. **¿Qué ocurre cada vez que repites la acción?**
   resultadoUsuario se limpia y se renderiza una nueva card
   con los datos actualizados del usuario buscado
