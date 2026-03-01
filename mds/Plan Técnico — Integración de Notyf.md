# Plan TÃ©cnico â€” IntegraciÃ³n de Notyf como librerÃ­a externa de notificaciones
**Autores:** Andres Santiago Calvete, Ana Isabella Rozo, Fernando Rodriguez
**VersiÃ³n destino:** v3.0.0  
**Rama:** feature/api-fer  
**Fecha:** 28/02/2026  

---

## 1. LibrerÃ­a elegida: Notyf

| Criterio         | Detalle                                              |
|------------------|------------------------------------------------------|
| Nombre           | Notyf v3                                             |
| InstalaciÃ³n      | `npm install notyf` (1 comando)                      |
| TamaÃ±o           | 3 KB minificado â€” impacto mÃ­nimo en el build         |
| API              | `new Notyf()` â†’ `.success()` / `.error()`            |
| Compatibilidad   | ES Modules + Vite 100%                               |
| DiseÃ±o           | Profesional, animaciones suaves, totalmente configurable |

### Â¿Por quÃ© Notyf sobre otras opciones?

| LibrerÃ­a      | TamaÃ±o  | API          | Vite | Veredicto          |
|---------------|---------|--------------|------|--------------------|
| **Notyf**     | 3 KB    | MÃ­nima       | âœ…    | âœ… Elegida         |
| SweetAlert2   | 45 KB   | Compleja     | âœ…    | Demasiado pesada   |
| iziToast      | 12 KB   | Media        | âœ…    | MÃ¡s configuraciÃ³n  |
| Toastify-js   | 2 KB    | MÃ­nima       | âœ…    | Menos personalizable|

---

## 2. DiagnÃ³stico del estado actual

El proyecto tiene un sistema de notificaciones propio en
`src/ui/components/toast.js`. Funciona correctamente pero
requiere mantenimiento manual de animaciones, estilos y
posicionamiento. Al migrar a Notyf, toda esa responsabilidad
pasa a la librerÃ­a â€” nuestro cÃ³digo solo llama a funciones.

---

## 3. Archivos que cambian

| Archivo                                   | AcciÃ³n         | Detalle                                    |
|-------------------------------------------|----------------|--------------------------------------------|
| `src/ui/components/notificaciones.js`     | NUEVO          | Wrapper de Notyf con la API del proyecto   |
| `src/script.js`                           | 2 lÃ­neas       | Cambio de import de toast.js a notificaciones.js |
| `src/ui/components/toast.js`              | DEPRECADO      | Se mantiene como referencia histÃ³rica      |
| `src/styles/toasts.css`                   | DEPRECADO      | Notyf trae su propio CSS                   |
| `package.json`                            | 1 dependencia  | Se agrega `notyf` en dependencies          |

**Total de cambios en lÃ³gica:** 2 lÃ­neas en script.js  
**Riesgo:** Muy bajo â€” solo cambia la capa de presentaciÃ³n

---

## 4. Impacto en la estructura del proyecto

```
Antes                               DespuÃ©s
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
src/ui/components/
â””â”€â”€ toast.js       â† lÃ³gica +       src/ui/components/
    animaciones +                   â”œâ”€â”€ toast.js        â† DEPRECATED
    estilos propios                 â””â”€â”€ notificaciones.js â† NUEVO
                                        (solo configura Notyf)

src/styles/
â””â”€â”€ toasts.css     â† estilos        node_modules/notyf/
    manuales                        â””â”€â”€ notyf.min.css   â† gestionado
                                        por npm
```

### Grafo de dependencias actualizado (RNF05 â€” sin ciclos)

```
notyf (npm)           â†’ no importa nada del proyecto
notificaciones.js     â†’ solo importa notyf
script.js             â†’ importa notificaciones.js
                         (y todo lo demÃ¡s igual)
```

---

## 5. InstalaciÃ³n

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
forma parte del cÃ³digo que corre en el navegador, no solo
en el entorno de desarrollo.

---

## 6. Cambio en script.js

Solo se modifican las lÃ­neas de import. Las llamadas a
`showSuccessToast()`, `showErrorToast()`, etc. no cambian.

```javascript
// â”€â”€ ANTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { showSuccessToast, showErrorToast, showInfoToast } from './ui/components/toast.js';

// â”€â”€ DESPUÃ‰S â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { showSuccessToast, showErrorToast, showInfoToast, showWarningToast } from './ui/components/notificaciones.js';
```

El resto de `script.js` permanece idÃ©ntico. Esto demuestra
el principio de separaciÃ³n de responsabilidades: el mÃ³dulo
de notificaciones es intercambiable sin afectar al coordinador.

---

## 7. ConfiguraciÃ³n de Notyf en notificaciones.js

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

## 9. VerificaciÃ³n de npm run build con Notyf

Al ejecutar `npm run build`, Vite incluye Notyf en el bundle:

```
dist/assets/index-[hash].js    ~16 KB  (antes ~13 KB, +3KB de Notyf)
dist/assets/index-[hash].css   ~10 KB  (incluye notyf.min.css)
```

El incremento es de aproximadamente 3 KB â€” completamente
aceptable para la mejora de experiencia que aporta.

---

## 10. Criterios de aceptaciÃ³n

- [ ] `npm install notyf` ejecutado sin errores
- [ ] `notyf` aparece en `package.json` â†’ `dependencies`
- [ ] `notificaciones.js` creado en `src/ui/components/`
- [ ] Import actualizado en `script.js`
- [ ] Al buscar un usuario â†’ aparece notificaciÃ³n Notyf verde
- [ ] Al crear una tarea â†’ aparece notificaciÃ³n Notyf verde
- [ ] Al eliminar una tarea â†’ aparece notificaciÃ³n Notyf verde
- [ ] Al haber un error â†’ aparece notificaciÃ³n Notyf roja
- [ ] Al cambiar estado â†’ aparece notificaciÃ³n Notyf azul
- [ ] `npm run dev` sin errores de consola
- [ ] `npm run build` genera dist/ sin warnings
