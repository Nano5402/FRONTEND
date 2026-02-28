# Hipótesis de Implementación — Migración a Vite

**Autor:** Fernando Andrés Rodríguez Salamanca
**Fecha:** 28/02/2026
**Rama:** feature/api-fer

---

## 1. Análisis de la estructura actual

El proyecto actualmente usa ES Modules nativos del navegador
cargados directamente desde index.html con:
`<script type="module" src="src/script.js">`

Esto funciona pero tiene limitaciones:

- Cada archivo JS genera una petición HTTP separada
- No hay recarga automática al guardar cambios
- No hay optimización del código para producción
- Requiere un servidor local manual (Live Server)

---

## 2. ¿Qué archivos deberán reorganizarse?

| Archivo/Carpeta   | Acción          | Razón                                |
| ----------------- | ---------------- | ------------------------------------- |
| index.html        | Permanece        | Vite lo toma desde la raíz           |
| src/script.js     | Permanece        | Ya es el punto de entrada JS          |
| assets/styles.css | Permanece        | Vite procesa assets automáticamente  |
| package.json      | NUEVO            | Gestiona dependencias y scripts       |
| vite.config.js    | NUEVO            | Configuración de Vite                |
| node_modules/     | NUEVO            | Dependencias instaladas por npm       |
| dist/             | NUEVO (al build) | Archivos optimizados para producción |

---

## 3. ¿Qué nuevos archivos aparecerán?

- `package.json` — cerebro del proyecto Node.js
- `package-lock.json` — versiones exactas de dependencias
- `vite.config.js` — configuración del empaquetador
- `node_modules/` — carpeta con Vite y sus dependencias
- `dist/` — carpeta generada al ejecutar npm run build

---

## 4. ¿Cómo cambiará la forma de ejecutar el proyecto?

| Antes                        | Después                |
| ---------------------------- | ----------------------- |
| Abrir con Live Server        | npm run dev             |
| Puerto 5501 manual           | Puerto 5173 automático |
| Sin recarga automática real | Hot Module Replacement  |
| Sin optimización            | Bundle optimizado       |

---

## 5. ¿Qué ventajas técnicas obtendrá la aplicación?

1. **HMR (Hot Module Replacement):** los cambios se ven en el
   navegador sin recargar la página completa
2. **Bundle optimizado:** en producción, todos los JS se unen
   y minimizan en archivos más pequeños
3. **Gestión de dependencias:** con npm se pueden instalar
   librerías externas fácilmente
4. **Separación dev/prod:** entorno de desarrollo rápido y
   entorno de producción optimizado
5. **Resolución de rutas:** Vite maneja automáticamente las
   rutas relativas entre módulos

```

---

# PUNTO 2 — Migración a Vite

## El flujo natural de la migración
```

1. npm init        → crea package.json
2. npm install     → instala Vite en node_modules
3. Crear vite.config.js → le decimos a Vite cómo trabajar
4. Ajustar index.html   → pequeño cambio en el script tag
5. npm run dev     → servidor de desarrollo listo
