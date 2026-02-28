 AL INICIO DE CADA DÍA — Antes de tocar cualquier archivo

# 1. Verificar en qué rama estás
git branch

# 2. Si no estás en tu rama, moverte a ella
git checkout feature/api-fer

# 3. Descargar los cambios más recientes del repositorio principal
git fetch upstream

# 4. Traer los cambios de release a tu rama local
git merge upstream/release

# 5. Verificar que no hay conflictos y que todo está bien
git status


MIENTRAS TRABAJAS — Después de cada avance


# 1. Ver qué archivos modificaste
git status

# 2. Agregar los archivos que cambiaste (nunca hagas git add . sin revisar)
git add src/api/tareasApi.js
git add src/ui/exportUI.js
# (el archivo que hayas tocado)

# 3. Guardar el avance con mensaje descriptivo
git commit -m "feat: RF04 - descripcion de lo que hiciste"

# 4. Subir a TU rama
git push origin feature/api-fer



FLUJO COMPLETO — Cuando terminas algo importante



# 1. Bajar lo nuevo del equipo
git fetch upstream
git merge upstream/release

# 2. Resolver conflictos si los hay (VS Code te los muestra)

# 3. Agregar tus cambios
git add .               # solo si revisaste git status primero

# 4. Commit descriptivo
git commit -m "feat: RF04 - descripcion clara del cambio"

# 5. Subir tu trabajo
git push origin feature/api-fer


Comandos de emergencia — Para cuando algo sale mal

# Ver el historial de commits
git log --oneline

# Deshacer el último commit pero conservar los archivos
git reset --soft HEAD~1

# Ver diferencias antes de hacer commit
git diff

# Descartar cambios de un archivo específico (CUIDADO — no se recupera)
git checkout -- src/api/tareasApi.js
```

---

## 📋 Resumen visual para tener siempre presente
```
INICIO DEL DÍA
──────────────────────────────────────────
git branch                    ← confirmar que estás en feature/api-fer
git fetch upstream             ← bajar cambios del equipo
git merge upstream/release     ← aplicar esos cambios a tu rama


MIENTRAS TRABAJAS
──────────────────────────────────────────
git status                    ← ver qué cambié
git add [archivo]             ← agregar lo que cambié
git commit -m "feat: ..."     ← guardar con mensaje claro
git push origin feature/api-fer ← subir a mi rama


MENSAJES DE COMMIT CORRECTOS (RNF04)
──────────────────────────────────────────
feat:     algo nuevo que agregué
fix:      corrección de un error
style:    cambio de estilos CSS
refactor: reorganicé código sin cambiar funcionalidad
docs:     actualicé documentación
```

---

## ⚠️ Las 3 reglas de oro
```
1. NUNCA trabajar directo en release
   → siempre en feature/api-fer

2. SIEMPRE hacer fetch + merge al inicio
   → para no trabajar sobre código viejo

3. NUNCA git add . sin revisar git status primero
   → para no subir archivos que no son tuyos





