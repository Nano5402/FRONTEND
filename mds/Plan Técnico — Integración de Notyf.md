# Plan Técnico — Integración de Notyf como librería externa de notificaciones
**Autor:** Fernando Andrés Rodríguez Salamanca  
**Versión destino:** v3.0.0  
**Rama:** feature/api-fer  
**Fecha:** 28/02/2026  

---

## 1. Librería elegida: Notyf

| Criterio         | Detalle                                              |
|------------------|------------------------------------------------------|
| Nombre           | Notyf v3                                             |
| Instalación      | `npm install notyf` (1 comando)                      |
| Tamaño           | 3 KB minificado — impacto mínimo en el build         |
| API              | `new Notyf()` → `.success()` / `.error()`            |
| Compatibilidad   | ES Modules + Vite 100%                               |
| Diseño           | Profesional, animaciones suaves, totalmente configurable |

### ¿Por qué Notyf sobre otras opciones?

| Librería      | Tamaño  | API          | Vite | Veredicto          |
|---------------|---------|--------------|------|--------------------|
| **Notyf**     | 3 KB    | Mínima       | ✅    | ✅ Elegida         |
| SweetAlert2   | 45 KB   | Compleja     | ✅    | Demasiado pesada   |
| iziToast      | 12 KB   | Media        | ✅    | Más configuración  |
| Toastify-js   | 2 KB    | Mínima       | ✅    | Menos personalizable|

---

## 2. Diagnóstico del estado actual

El proyecto tiene un sistema de notificaciones propio en
`src/ui/components/toast.js`. Funciona correctamente pero
requiere mantenimiento manual de animaciones, estilos y
posicionamiento. Al migrar a Notyf, toda esa responsabilidad
pasa a la librería — nuestro código solo llama a funciones.

---

## 3. Archivos que cambian

| Archivo                                   | Acción         | Detalle                                    |
|-------------------------------------------|----------------|--------------------------------------------|
| `src/ui/components/notificaciones.js`     | NUEVO          | Wrapper de Notyf con la API del proyecto   |
| `src/script.js`                           | 2 líneas       | Cambio de import de toast.js a notificaciones.js |
| `src/ui/components/toast.js`              | DEPRECADO      | Se mantiene como referencia histórica      |
| `src/styles/toasts.css`                   | DEPRECADO      | Notyf trae su propio CSS                   |
| `package.json`                            | 1 dependencia  | Se agrega `notyf` en dependencies          |

**Total de cambios en lógica:** 2 líneas en script.js  
**Riesgo:** Muy bajo — solo cambia la capa de presentación

---

## 4. Impacto en la estructura del proyecto

```
Antes                               Después
──────────────────────────────      ─────────────────────────────────
src/ui/components/
└── toast.js       ← lógica +       src/ui/components/
    animaciones +                   ├── toast.js        ← DEPRECATED
    estilos propios                 └── notificaciones.js ← NUEVO
                                        (solo configura Notyf)

src/styles/
└── toasts.css     ← estilos        node_modules/notyf/
    manuales                        └── notyf.min.css   ← gestionado
                                        por npm
```

### Grafo de dependencias actualizado (RNF05 — sin ciclos)

```
notyf (npm)           → no importa nada del proyecto
notificaciones.js     → solo importa notyf
script.js             → importa notificaciones.js
                         (y todo lo demás igual)
```

---

## 5. Instalación

```powershell
npm install notyf
```

Esto agrega en package.json:
```json
"dependencies": {
    "notyf": "^3.10.0"
}
```

Notyf pasa a `dependencies` (no `devDependencies`) porque
forma parte del código que corre en el navegador, no solo
en el entorno de desarrollo.

---

## 6. Cambio en script.js

Solo se modifican las líneas de import. Las llamadas a
`showSuccessToast()`, `showErrorToast()`, etc. no cambian.

```javascript
// ── ANTES ──────────────────────────────────────────────
import { showSuccessToast, showErrorToast, showInfoToast } from './ui/components/toast.js';

// ── DESPUÉS ────────────────────────────────────────────
import { showSuccessToast, showErrorToast, showInfoToast, showWarningToast } from './ui/components/notificaciones.js';
```

El resto de `script.js` permanece idéntico. Esto demuestra
el principio de separación de responsabilidades: el módulo
de notificaciones es intercambiable sin afectar al coordinador.

---

## 7. Configuración de Notyf en notificaciones.js

```javascript
const notyf = new Notyf({
    duration:    3500,
    position:   { x: 'right', y: 'bottom' },
    dismissible: true,
    ripple:      true,
    types: [
        { type: 'warning', background: '#d99a4e' },  // --color-warning
        { type: 'info',    background: '#5c8eb3' }   // --color-info
    ]
});
```

Los colores respetan las variables CSS del proyecto (`variables.css`).

---

## 8. Commits planificados (RNF04)

```
feat: instala notyf como dependencia npm para notificaciones
feat: crea notificaciones.js como wrapper de Notyf
refactor: reemplaza import toast.js por notificaciones.js en script.js
docs: marca toast.js como deprecated con comentario en cabecera
docs: agrega plan tecnico de integracion Notyf
```

---

## 9. Verificación de npm run build con Notyf

Al ejecutar `npm run build`, Vite incluye Notyf en el bundle:

```
dist/assets/index-[hash].js    ~16 KB  (antes ~13 KB, +3KB de Notyf)
dist/assets/index-[hash].css   ~10 KB  (incluye notyf.min.css)
```

El incremento es de aproximadamente 3 KB — completamente
aceptable para la mejora de experiencia que aporta.

---

## 10. Criterios de aceptación

- [ ] `npm install notyf` ejecutado sin errores
- [ ] `notyf` aparece en `package.json` → `dependencies`
- [ ] `notificaciones.js` creado en `src/ui/components/`
- [ ] Import actualizado en `script.js`
- [ ] Al buscar un usuario → aparece notificación Notyf verde
- [ ] Al crear una tarea → aparece notificación Notyf verde
- [ ] Al eliminar una tarea → aparece notificación Notyf verde
- [ ] Al haber un error → aparece notificación Notyf roja
- [ ] Al cambiar estado → aparece notificación Notyf azul
- [ ] `npm run dev` sin errores de consola
- [ ] `npm run build` genera dist/ sin warnings