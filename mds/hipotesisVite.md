# HipÃ³tesis de ImplementaciÃ³n â€” MigraciÃ³n a Vite

**Autores:** Andres Santiago Calvete, Ana Isabella Rozo, Fernando Rodriguez
**Fecha:** 28/02/2026
**Rama:** feature/api-fer

---

## 1. AnÃ¡lisis de la estructura actual

El proyecto actualmente usa ES Modules nativos del navegador
cargados directamente desde index.html con:
`<script type="module" src="src/script.js">`

Esto funciona pero tiene limitaciones:

- Cada archivo JS genera una peticiÃ³n HTTP separada
- No hay recarga automÃ¡tica al guardar cambios
- No hay optimizaciÃ³n del cÃ³digo para producciÃ³n
- Requiere un servidor local manual (Live Server)

---

## 2. Â¿QuÃ© archivos deberÃ¡n reorganizarse?

| Archivo/Carpeta   | AcciÃ³n          | RazÃ³n                                |
| ----------------- | ---------------- | ------------------------------------- |
| index.html        | Permanece        | Vite lo toma desde la raÃ­z           |
| src/script.js     | Permanece        | Ya es el punto de entrada JS          |
| assets/styles.css | Permanece        | Vite procesa assets automÃ¡ticamente  |
| package.json      | NUEVO            | Gestiona dependencias y scripts       |
| vite.config.js    | NUEVO            | ConfiguraciÃ³n de Vite                |
| node_modules/     | NUEVO            | Dependencias instaladas por npm       |
| dist/             | NUEVO (al build) | Archivos optimizados para producciÃ³n |

---

## 3. Â¿QuÃ© nuevos archivos aparecerÃ¡n?

- `package.json` â€” cerebro del proyecto Node.js
- `package-lock.json` â€” versiones exactas de dependencias
- `vite.config.js` â€” configuraciÃ³n del empaquetador
- `node_modules/` â€” carpeta con Vite y sus dependencias
- `dist/` â€” carpeta generada al ejecutar npm run build

---

## 4. Â¿CÃ³mo cambiarÃ¡ la forma de ejecutar el proyecto?

| Antes                        | DespuÃ©s                |
| ---------------------------- | ----------------------- |
| Abrir con Live Server        | npm run dev             |
| Puerto 5501 manual           | Puerto 5173 automÃ¡tico |
| Sin recarga automÃ¡tica real | Hot Module Replacement  |
| Sin optimizaciÃ³n            | Bundle optimizado       |

---

## 5. Â¿QuÃ© ventajas tÃ©cnicas obtendrÃ¡ la aplicaciÃ³n?

1. **HMR (Hot Module Replacement):** los cambios se ven en el
   navegador sin recargar la pÃ¡gina completa
2. **Bundle optimizado:** en producciÃ³n, todos los JS se unen
   y minimizan en archivos mÃ¡s pequeÃ±os
3. **GestiÃ³n de dependencias:** con npm se pueden instalar
   librerÃ­as externas fÃ¡cilmente
4. **SeparaciÃ³n dev/prod:** entorno de desarrollo rÃ¡pido y
   entorno de producciÃ³n optimizado
5. **ResoluciÃ³n de rutas:** Vite maneja automÃ¡ticamente las
   rutas relativas entre mÃ³dulos

```

---

# PUNTO 2 â€” MigraciÃ³n a Vite

## El flujo natural de la migraciÃ³n
```

1. npm init        â†’ crea package.json
2. npm install     â†’ instala Vite en node_modules
3. Crear vite.config.js â†’ le decimos a Vite cÃ³mo trabajar
4. Ajustar index.html   â†’ pequeÃ±o cambio en el script tag
5. npm run dev     â†’ servidor de desarrollo listo

