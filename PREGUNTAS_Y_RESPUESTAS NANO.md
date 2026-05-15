# Preguntas y Respuestas — Defensa del Proyecto

> TaskApp SENA — Sistema de Gestión de Tareas  
> Preparación para sustentación técnica y conceptual

---

## Tabla de contenidos

1. [Arquitectura y estructura](#1-arquitectura-y-estructura)
2. [Base de datos y MySQL](#2-base-de-datos-y-mysql)
3. [Autenticación y JWT](#3-autenticación-y-jwt)
4. [Seguridad](#4-seguridad)
5. [Middlewares](#5-middlewares)
6. [Validaciones con Zod](#6-validaciones-con-zod)
7. [Manejo de errores](#7-manejo-de-errores)
8. [RBAC — Roles y permisos](#8-rbac--roles-y-permisos)
9. [Frontend y SPA](#9-frontend-y-spa)
10. [Comunicación frontend–backend](#10-comunicación-frontendbackend)
11. [Recuperación de contraseña y correos](#11-recuperación-de-contraseña-y-correos)
12. [Patrones de programación](#12-patrones-de-programación)
13. [Decisiones de diseño](#13-decisiones-de-diseño)
14. [Preguntas trampa o difíciles](#14-preguntas-trampa-o-difíciles)

---

## 1. Arquitectura y estructura

---

**¿Por qué separaron el proyecto en capas?**

Porque cada capa tiene una responsabilidad única y bien definida. En el backend: las rutas solo conectan URLs con funciones y declaran qué middlewares aplican; los middlewares actúan como filtros (validan token, permisos y datos con Zod); los controladores ejecutan la lógica de negocio y hablan con MySQL; los utils son herramientas de apoyo reutilizables como `catchAsync`, `successResponse` o `hashPassword`. En el frontend aplicamos el mismo principio: la capa `api/` solo hace fetch al backend; la capa `services/` agrega lógica de negocio encima; las `views/` solo consumen los services y manipulan el DOM. Esta separación hace el código más fácil de depurar: si hay un error de SQL está en el controlador; si hay un error de autorización está en el middleware.

---

**¿Por qué `app.js` importa `db.js` antes de registrar las rutas?**

Porque `db.js` importa `dotenv/config`, que carga las variables del archivo `.env` en `process.env`. Si cualquier otro módulo se importara antes e intentara leer `process.env.JWT_SECRET` o `process.env.DB_HOST`, obtendría `undefined`. Al importar `db.js` primero garantizamos que las variables de entorno estén disponibles para todo el sistema desde el primer instante, incluyendo la configuración del pool de MySQL y los secretos JWT que usa `security.js`.

---

**¿Por qué el `globalErrorHandler` se registra al final de `app.js` y no al principio?**

Porque Express procesa los middlewares en el orden en que están registrados. Si el middleware de errores estuviera al principio, nunca recibiría los errores de las rutas porque esas rutas aún no existirían en el orden de ejecución. Express solo activa un middleware de 4 parámetros `(err, req, res, next)` cuando alguna ruta llama a `next(error)`. Por eso el orden en `app.js` es deliberado: primero las rutas, luego el manejador 404, y al final el `globalErrorHandler`.

---

**¿Qué es un pool de conexiones y por qué lo usaron?**

Una conexión simple abre y cierra una conexión a MySQL cada vez que llega una petición. Si llegan 50 peticiones simultáneas, intenta abrir 50 conexiones, lo que puede saturar el servidor. Un pool mantiene un número fijo de conexiones abiertas —en nuestro caso 10— y las reutiliza. Cuando llega una petición, toma una conexión libre del pool, ejecuta la query y la devuelve. Configuramos `waitForConnections: true` para que, si el pool está lleno, las peticiones esperen en cola en lugar de fallar de inmediato.

---

**¿Por qué usaron `mysql2/promise` y no el `mysql2` normal?**

Porque la versión promise nos permite usar `async/await` en todas las queries. Sin ella tendríamos que usar callbacks, lo que genera código anidado difícil de leer. Con `async/await` escribimos `const [rows] = await pool.query(...)` de forma secuencial y clara, y `catchAsync` captura cualquier error que lance la query automáticamente sin necesidad de try/catch en cada controlador.

---

**¿Para qué sirve `main.js` en el frontend?**

`main.js` es el orquestador principal de la SPA. Su única responsabilidad es registrar todas las rutas en el router y arrancarlo. No contiene lógica de negocio ni manipulación del DOM. Registra las rutas públicas (`/login`, `/register`, `/forgot`, `/verify-otp`, `/reset`) con `guardPublic()`, las rutas privadas (`/dashboard`, `/users`, `/roles`) con `guardAuth()`, y decide qué vista de dashboard mostrar según los permisos del usuario con la función `_pickDashboard()`.

---

## 2. Base de datos y MySQL

---

**¿Cómo está modelada la relación entre tareas y usuarios?**

La tabla `tasks` tiene un campo `userId` que es una clave foránea que apunta al `id` de la tabla `users`. Es una relación de muchos a uno: cada tarea pertenece a un usuario y un usuario puede tener muchas tareas. El controlador `createTask` soporta asignación masiva recibiendo un array `userIds[]` y creando una tarea por cada ID del array en un bucle. Si el instructor asigna una tarea a 5 estudiantes, se insertan 5 filas en `tasks`, cada una con su propio `userId`.

---

**¿Qué es un soft delete y cómo lo implementaron para usuarios?**

Un soft delete es una eliminación lógica: en lugar de borrar el registro de la base de datos, se marca como inactivo. Lo implementamos con el campo `status` en la tabla `users`, que puede ser `'activo'` o `'inactivo'`. El endpoint `PATCH /api/users/:id/status` cambia ese campo. Un usuario inactivo sigue existiendo en la BD con todo su historial de tareas, pero el controlador de login lo detecta y niega el acceso con un error 403. Solo el SuperAdmin puede ejecutar esta acción gracias al permiso `SYSTEM_MANAGE_ALL`.

---

**¿Qué es la tabla `audit_logs` y para qué sirve?**

Registra toda eliminación definitiva (hard delete) de usuarios para dejar trazabilidad inmutable. El flujo en `deleteUser` es deliberado: primero se busca el nombre del usuario, luego se inserta el log con la acción `HARD_DELETE_USER`, la justificación del administrador, el nombre del usuario eliminado y el ID de quien ejecutó la acción, y solo después se borra el registro de `users`. El orden importa: si primero borráramos al usuario y el log fallara, perderíamos la trazabilidad para siempre. El Auditor consulta estos logs desde su dashboard a través de `GET /api/users/audit/logs`.

---

**¿Por qué usan `?` en las queries SQL en lugar de concatenar el valor directamente?**

Para prevenir inyección SQL. Si concatenáramos el valor directamente, alguien podría enviar como documento el texto `' OR '1'='1` y la query resultante sería `WHERE document = '' OR '1'='1'`, que retornaría todos los usuarios sin contraseña. Con el parámetro `?`, `mysql2` escapa automáticamente cualquier carácter especial, de manera que siempre se trata como dato literal y nunca como parte del SQL.

---

**¿Por qué la tabla `users` tiene campos `otp_code` y `otp_expires_at`?**

Porque el flujo de recuperación de contraseña guarda el OTP directamente en la fila del usuario. Cuando se solicita recuperación, el backend genera un código de 6 dígitos, calcula su expiración (30 minutos) y los guarda en esos dos campos. Esto evita crear una tabla extra solo para códigos temporales. Cuando se verifica el OTP o se restablece la contraseña, ambos campos se limpian con `NULL` para que el código no pueda reutilizarse.

---

## 3. Autenticación y JWT

---

**¿Qué es un JWT y qué información contiene el que ustedes generan?**

JWT significa JSON Web Token. Es un estándar para transmitir información de forma segura y compacta. Tiene tres partes separadas por puntos: header (algoritmo), payload (datos) y firma. El payload que incluimos es `{ id, role, role_id, permissions[] }`: el ID del usuario, el nombre de su rol, el ID del rol en la BD y el array completo de permisos atómicos. Incluir los permisos en el token evita consultar la base de datos en cada petición para verificar si el usuario puede hacer algo.

---

**¿Por qué tienen dos tokens: accessToken y refreshToken?**

Por seguridad y usabilidad. El accessToken tiene vida corta (15 minutos): si alguien lo intercepta, solo puede usarlo ese tiempo. El refreshToken tiene vida larga (7 días): le permite al usuario seguir usando la app sin re-iniciar sesión cada 15 minutos. Cuando el accessToken expira, el frontend lo renueva usando el refreshToken a través del endpoint `POST /api/auth/refresh` sin que el usuario se dé cuenta. Esto se llama Silent Refresh y está implementado en `src/api/client.js` con `senaFetch()`.

---

**¿Por qué usan `JWT_SECRET` y `JWT_REFRESH_SECRET` distintos?**

Si usáramos el mismo secreto para ambos, un refreshToken comprometido podría usarse para forjar un accessToken sin pasar por el endpoint de renovación. Al usar secretos distintos, aunque alguien obtuviera uno de ellos, no podría falsificar tokens del otro tipo. Es una capa de seguridad sin costo adicional de implementación.

---

**¿Qué significa `iat` y `exp` dentro del payload del JWT?**

`iat` (issued at) es la marca de tiempo en segundos del momento de creación del token. `exp` (expiration) es la marca de tiempo de cuando expira. `jwt.verify()` compara automáticamente `exp` con el tiempo actual del servidor y lanza `TokenExpiredError` si venció. No los leemos manualmente: `jsonwebtoken` los gestiona automáticamente. En el frontend, `getDecoded()` de `rbac.js` puede leerlos decodificando el payload en Base64 con `atob`.

---

**¿Cómo funciona el Silent Refresh del frontend?**

Está en `src/api/client.js` con `senaFetch()`. El flujo: hace la petición con el accessToken actual. Si el backend responde 401, intenta el silent refresh: pide nuevos tokens a `POST /api/auth/refresh` usando el refreshToken de localStorage. Si el backend responde con tokens nuevos, los guarda con `storage.setTokens()` y reintenta la petición original con el nuevo token. El usuario nunca se entera. Si el refreshToken también expiró, cierra la sesión y redirige al login. La bandera `_refreshing` evita que múltiples peticiones simultáneas intenten renovar el token al mismo tiempo.

---

**¿Qué es `requiresReset` y para qué sirve?**

Es una bandera que el backend incluye en la respuesta del login cuando el usuario fue creado por un administrador y tiene contraseña temporal (los últimos 4 dígitos de su documento). Si el backend devuelve `user.requiresReset = true`, `login()` en `auth.api.js` guarda `requiresReset = 'true'` en localStorage. El router o la vista de Login detectan esa bandera y redirigen al usuario a `#/reset` para que cambie su contraseña antes de poder usar el sistema.

---

## 4. Seguridad

---

**¿Por qué las contraseñas se hashean con bcrypt y no se encriptan?**

El hasheo es unidireccional: dado el hash es matemáticamente imposible obtener la contraseña original. La encriptación es bidireccional: se puede desencriptar si se tiene la clave. Si encriptáramos y alguien robara la clave, obtendría todas las contraseñas en texto plano. Con bcrypt, aunque alguien robe la base de datos, los hashes no son reversibles. Para verificar, hasheamos lo que ingresa el usuario con `comparePassword()` y comparamos contra el hash guardado; nunca "deshash" la contraseña original.

---

**¿Qué son las 10 rondas de salt en bcrypt?**

Determinan cuántas veces bcrypt itera su algoritmo. Con 10 rondas corre 2^10 = 1024 iteraciones internas. Esto hace que calcular un hash tome unos milisegundos, insignificante para un login normal, pero hace que un ataque de fuerza bruta sea extremadamente lento y costoso. 10 es el valor recomendado por OWASP como balance entre seguridad y rendimiento.

---

**¿Por qué validan que la nueva contraseña sea diferente a la actual en `resetPassword`?**

Para evitar que el flujo de recuperación sea usado para "confirmar" que el usuario recuerda su contraseña actual sin cambiar nada. Usamos `comparePassword(nuevaContraseña, hashActual)` de bcrypt. Si coinciden, respondemos con 400: "La nueva contraseña no puede ser igual a la contraseña actual". Esto también aplica cuando el estudiante cambia su contraseña temporal.

---

**¿Por qué el login usa el mismo mensaje de error para credenciales incorrectas y usuario no encontrado?**

Para evitar la enumeración de usuarios. Si el sistema respondiera "el documento no existe" cuando no hay coincidencia, un atacante podría probar documentos y saber cuáles están en el sistema. Al responder siempre "Credenciales inválidas" para ambos casos, el atacante no puede saber si el documento existe o no.

---

**¿Por qué el schema `updateUserSchema` usa `.strict()`?**

Para prevenir que alguien inyecte campos no autorizados como `password`, `otp_code` o `permissions` en el body de actualización. Con `.strict()`, Zod rechaza con 400 cualquier campo no declarado en el schema. El mensaje que configuramos es: "Alerta de Seguridad: No se permiten campos adicionales", dejando claro que es una medida intencional.

---

## 5. Middlewares

---

**¿Qué es un middleware en Express y cuál es su diferencia con un controlador?**

Un middleware es una función que se ejecuta en la cadena de procesamiento de una petición HTTP antes de que llegue al controlador final. Tiene acceso a `req`, `res` y `next`. La diferencia con un controlador es conceptual: un middleware hace algo con la petición (validar, autenticar, verificar permisos) y llama a `next()` para continuar la cadena o la corta respondiendo directamente. Un controlador es el destino final: recibe la petición ya procesada y genera la respuesta definitiva consultando la base de datos.

---

**¿Por qué `verifyToken` y `checkPermission` son dos funciones separadas?**

Por responsabilidad única y reutilización. `verifyToken` responde a "¿estás autenticado?" y se usa en todas las rutas protegidas. `checkPermission` responde a "¿tienes este permiso específico?" y solo en rutas restringidas. Si las fusionáramos, no podríamos aplicar autenticación sin requerir un permiso extra. Separadas, las combinamos libremente: solo `verifyToken` para rutas donde cualquier usuario logueado puede acceder (ej: `PATCH /:id/status`), o `verifyToken` + `checkPermission(PERMISSIONS.TASKS_DELETE_ALL)` para rutas restringidas.

---

**¿Por qué el middleware de errores necesita exactamente 4 parámetros?**

Es la forma en que Express identifica un manejador de errores. Si una función tiene 3 parámetros `(req, res, next)`, Express la trata como middleware normal. Solo con 4 parámetros `(err, req, res, next)` sabe que es un manejador de errores y lo invoca cuando alguna ruta llama a `next(error)`. El parámetro `next` al final es requerido por la firma aunque no se use, porque sin él Express no reconoce la función como manejador de errores.

---

**¿Por qué `checkPermission` retorna una función en lugar de ser directamente el middleware?**

Porque necesitamos pasarle el nombre del permiso, y un middleware de Express solo recibe `(req, res, next)`. Al usar el patrón de closure, `checkPermission('tasks.delete.all')` primero recibe el permiso como argumento y lo "recuerda" gracias al closure; luego retorna la función middleware `(req, res, next)` que ya tiene acceso al permiso guardado. Este patrón se llama Higher-Order Function y es estándar en Express.

---

**¿Qué hace `validateSchema` y cómo funciona?**

Es un middleware factory que recibe un schema de Zod y el target a validar (`'body'` o `'query'`) y devuelve un middleware. Ejecuta `schema.safeParse(req[target])`: si falla, responde con 400 y una lista de errores por campo `[{ field, message }]` sin que la petición llegue al controlador. Si pasa, reemplaza `req[target]` con los datos limpios de `result.data`, eliminando silenciosamente cualquier campo extra que el cliente haya enviado.

---

## 6. Validaciones con Zod

---

**¿Por qué usaron Zod para validaciones y no validaciones manuales con if?**

Las validaciones manuales con `if` se duplican en cada controlador, son inconsistentes y difíciles de mantener. Zod permite definir el "molde" de datos una sola vez y reutilizarlo. Genera mensajes de error descriptivos automáticamente con el nombre exacto del campo que falló. El middleware `validateSchema` aplica cualquier schema de forma genérica, por lo que agregar validación a una nueva ruta es cuestión de una línea.

---

**¿Qué hace `safeParse` de Zod y por qué no usaron `parse`?**

`parse` lanza una excepción si la validación falla, lo que requeriría un try/catch. `safeParse` nunca lanza excepción: siempre retorna `{ success: true, data }` o `{ success: false, error }`. Esto permite manejar el resultado con un `if (!result.success)` limpiamente y extraer la lista de errores de `result.error.issues` para construir la respuesta detallada al cliente con el campo exacto que falló.

---

**¿Por qué `updateTaskSchema` no usa `.strict()`?**

Porque con `.strict()`, Zod bloquea cualquier campo no declarado, incluyendo campos enviados como `undefined` explícito. Cuando el instructor rechaza una tarea enviando solo `{ status: "incompleta" }`, el resto de campos llegan como `undefined`. Con `.strict()` eso causaba un 400. Sin `.strict()`, el middleware acepta el body parcial correctamente y el controlador solo actualiza los campos que llegaron con una query dinámica.

---

**¿Por qué `createTaskSchema` usa `.refine()`?**

Porque tiene una regla de validación cruzada entre campos: el body debe traer `userIds` (array) o `userId` (singular), pero ambos son opcionales individualmente. `.refine()` permite agregar validaciones personalizadas que involucran múltiples campos. Verifica que `data.userIds?.length > 0 || data.userId` sea verdadero y, si no lo es, devuelve "Debes proporcionar userIds o userId para asignar la tarea".

---

## 7. Manejo de errores

---

**¿Qué problema resuelve `catchAsync` y cómo funciona?**

En JavaScript, los errores de funciones async solo se capturan con try/catch o `.catch()`. Sin `catchAsync`, cada controlador tendría que envolver su lógica en try/catch y terminar con `next(error)` en el catch: código repetitivo en cada función. `catchAsync(fn)` devuelve `(req, res, next) => fn(req, res, next).catch(next)`. Cualquier `throw new Error` o Promise rechazada llega automáticamente al `globalErrorHandler` sin que el controlador necesite try/catch.

---

**¿Qué diferencia hay entre un error 401 y uno 403?**

`401 Unauthorized` significa que el servidor no sabe quién eres: no enviaste token, el token expiró o tiene firma inválida. Es un problema de autenticación. `403 Forbidden` significa que el servidor sabe quién eres (token válido) pero no tienes permiso para lo que pediste. En nuestro proyecto: acceder con token vencido → 401 de `verifyToken`. Intentar eliminar un usuario siendo Estudiante → 403 de `checkPermission`.

---

**¿Qué es `error.isOperational` y para qué sirve?**

Es una propiedad que marcamos en `true` en los errores que lanzamos intencionalmente en los controladores (conflictos, no encontrados, validaciones de negocio). El `globalErrorHandler` la usa para decidir qué mensaje enviar: si `isOperational` es `true`, envía el mensaje exacto del error; si es `false` o no existe (error inesperado, bug), envía el genérico "Error interno del servidor" para no exponer detalles internos.

---

**¿Cómo maneja el frontend los errores de las peticiones?**

En `auth.api.js`, el helper `_post()` hace `if (!res.ok) throw new Error(json.msn || json.message)`. Las vistas envuelven sus llamadas a los services en try/catch y muestran el error con `toast.error()` usando la librería Notyf. Para peticiones autenticadas, `senaFetch()` maneja el caso 401 intentando el silent refresh antes de lanzar el error a la vista.

---

## 8. RBAC — Roles y permisos

---

**¿Qué es RBAC y por qué lo implementaron?**

RBAC (Role-Based Access Control) es un modelo donde los permisos se asignan a roles y los roles a usuarios. Lo implementamos porque el sistema tiene cuatro actores con capacidades muy distintas: el SuperAdmin gestiona todo; el Instructor crea y gestiona tareas; el Auditor solo lee y exporta reportes; el Estudiante solo ve y actualiza sus propias tareas. Sin RBAC, tendríamos que hardcodear la lógica de permisos en cada endpoint, lo que sería difícil de mantener.

---

**¿Cuáles son los roles del sistema y qué permisos tiene cada uno?**

Hay cuatro roles. El **SuperAdmin** (rol 1) tiene `system.manage.all` y todos los demás permisos: único que puede eliminar usuarios, cambiar roles y ver Seguridad. El **Instructor** (rol 2, guardado como "Profesor" en la BD) tiene `tasks.create.multiple`, `tasks.read.all`, `tasks.update.all` y `tasks.delete.all`: gestiona tareas y puede ver usuarios. El **Auditor** (rol 3) tiene `system.audit` y `users.read.all`: solo lectura global y acceso a logs de auditoría. El **Estudiante** (rol 4) tiene `tasks.read.own` y `tasks.update.status.own`: solo ve sus tareas y actualiza su progreso.

---

**¿Cómo funciona `checkPermission` en el backend?**

Es un middleware factory que recibe el permiso requerido y devuelve un middleware que lee `req.user.permissions` (el array que viene del JWT decodificado por `verifyToken`) y verifica si contiene el permiso con `.includes()`. Si lo tiene, llama a `next()`. Si no, responde con 403: "Se requiere el permiso: [nombre.del.permiso]". El array de permisos viene embebido en el JWT desde el login, donde el controlador lo consulta de la tabla `role_permissions` de MySQL.

---

**¿Cómo funciona `hasPermission` en el frontend?**

`hasPermission(permission)` en `src/utils/rbac.js` llama a `getDecoded()` que decodifica el payload del JWT de localStorage usando `atob` sobre la parte del medio del token. Luego verifica si `permissions[]` incluye el permiso solicitado. Tiene una regla especial: si el usuario tiene `SYSTEM_MANAGE_ALL`, se considera que tiene todos los permisos automáticamente. Se usa en el Sidebar para mostrar u ocultar ítems del menú y en `_pickDashboard()` para elegir qué clase de dashboard instanciar.

---

**¿Cómo decide el sistema qué dashboard mostrar al iniciar sesión?**

La función `_pickDashboard()` en `main.js` evalúa los permisos en orden de mayor a menor privilegio: si tiene `SYSTEM_MANAGE_ALL` → `AdminView`; si tiene `TASKS_CREATE_MULTIPLE` → `InstructorView`; si tiene `SYSTEM_AUDIT` → `AuditorView`; en cualquier otro caso → `StudentView`. El orden importa: el más privilegiado se evalúa primero para no asignar un dashboard de menor privilegio a un SuperAdmin.

---

**¿Por qué el endpoint `GET /tasks` acepta dos permisos diferentes?**

Porque tanto el Instructor (`TASKS_READ_ALL`) como el Estudiante (`TASKS_READ_OWN`) necesitan acceder a ese endpoint. Si solo aceptara `TASKS_READ_ALL`, el estudiante recibiría 403 aunque tuviera sesión válida. Para resolverlo, en `tasks.routes.js` implementamos la función local `checkPermissionAny(...permisos)` que aprueba si el usuario tiene al menos uno de los permisos listados (lógica OR). El Instructor ve todas las tareas; el Estudiante usa `GET /users/:id/tasks` que devuelve solo las suyas.

---

## 9. Frontend y SPA

---

**¿Qué es una SPA y cómo la implementaron?**

SPA (Single Page Application) es una aplicación web que carga una sola página HTML y actualiza su contenido dinámicamente con JavaScript sin recargar el navegador. La implementamos con un router basado en hash: la URL cambia su fragmento (`#/login`, `#/dashboard`) y el evento `hashchange` dispara automáticamente la resolución de la nueva ruta. El router en `src/core/router.js` busca la ruta registrada, ejecuta su guard y renderiza la vista en el elemento `#app-root` del `index.html`.

---

**¿Por qué usaron routing basado en hash (`#`) y no History API (`/dashboard`)?**

Con hash no se necesita configurar el servidor para que todas las rutas apunten a `index.html`. Si usáramos rutas reales (`/dashboard`), al recargar el navegador haría una petición GET a `/dashboard` y el servidor respondería con 404 porque ese archivo no existe físicamente. Con hash, la parte después del `#` nunca llega al servidor: el navegador la gestiona localmente. Funciona directo con Vite sin configuración adicional.

---

**¿Para qué sirven los guards del router?**

Son funciones que se ejecutan antes de renderizar una vista para verificar si el usuario tiene permiso de acceder. Tenemos tres: `guardAuth()` protege rutas privadas — si no hay token en localStorage redirige a `/login`; `guardPublic()` protege rutas públicas de usuarios ya autenticados — si hay sesión activa redirige a `/dashboard`; `guardPermission(permiso)` verifica un permiso específico antes de acceder a rutas avanzadas.

---

**¿Qué es el `store.js` y para qué sirve?**

El store es el estado global reactivo de la aplicación. Guarda en memoria quién está logueado (`user`), si hay sesión activa (`isAuth`) y la ruta actual (`currentRoute`). Implementa el patrón Observable: los módulos pueden suscribirse con `store.subscribe(fn)` y reciben actualizaciones automáticas cuando el estado cambia. Se diferencia de localStorage en que el store vive solo en memoria durante la sesión activa, mientras que localStorage persiste tokens y nombre entre sesiones.

---

**¿Para qué sirve el `eventBus.js`?**

Permite que módulos se comuniquen sin importarse directamente, reduciendo el acoplamiento. Si `InstructorView` necesita avisar que se creó una tarea, sin eventBus tendría que importar el otro módulo directamente, creando una dependencia. Con eventBus emite `eventBus.emit('task:created', { taskId: 5 })` y quien esté suscrito lo recibe. Tiene los métodos `on` (suscribirse), `off` (desuscribirse), `emit` (disparar) y `once` (suscripción de un solo uso).

---

**¿Qué es `localStorage` y por qué guardan los tokens ahí?**

`localStorage` es un almacenamiento de clave-valor en el navegador que persiste entre sesiones. Los tokens se guardan ahí para que el usuario no tenga que iniciar sesión cada vez que recarga la página. Todo el acceso está centralizado en `src/utils/storage.js` bajo claves con prefijo `sena_` (`sena_access_token`, `sena_refresh_token`, `sena_user_name`). Si en el futuro se cambia a sessionStorage o cookies, solo se modifica ese archivo.

---

**¿Cómo funciona el menú dinámico del Sidebar?**

`renderSidebar()` en `Sidebar.js` usa `hasPermission()` para decidir qué ítems mostrar. Todos los roles ven "Mi Panel". "Gestión de Usuarios" aparece solo si el usuario tiene `USERS_READ_ALL` (Instructor y SuperAdmin). "Seguridad y Roles" solo si tiene `SYSTEM_MANAGE_ALL` (solo SuperAdmin). El Estudiante y el Auditor solo ven "Mi Panel". `renderSidebar()` devuelve `{ html, bindEvents }`: el HTML se inyecta primero y `bindEvents()` se llama después, porque los elementos del DOM deben existir antes de agregarles eventos.

---

## 10. Comunicación frontend–backend

---

**¿Qué es CORS y por qué lo habilitaron en el backend?**

CORS (Cross-Origin Resource Sharing) es una política de seguridad del navegador que impide peticiones a un origen diferente. El frontend y el backend corren en distintas URLs/puertos y son orígenes distintos, por lo que el navegador bloquea las peticiones por defecto. `app.use(cors())` agrega los headers HTTP necesarios para indicarle al navegador que ese origen tiene permiso de hacer peticiones a nuestra API.

---

**¿Para qué sirve `senaFetch` y por qué no usan `fetch` directamente?**

`senaFetch()` en `src/api/client.js` es un wrapper de `fetch` que agrega automáticamente el header `Authorization: Bearer <accessToken>` leyendo el token de `storage.getAccessToken()`. Sin él, cada llamada API tendría que agregar el token manualmente, lo que sería repetitivo y propenso a errores. Además implementa el Silent Refresh: si una petición devuelve 401, intenta renovar el token antes de rendirse. Si la renovación falla, cierra la sesión. Todo transparentemente para el resto del código.

---

**¿Por qué el backend responde siempre con la misma estructura JSON?**

Para que el frontend procese todas las respuestas de la misma forma. La estructura exitosa es `{ success, message, data, errors }`. Con este contrato estandarizado, el frontend siempre sabe dónde buscar los datos (`response.data`), el mensaje informativo (`response.message`) y si hubo éxito (`response.success`). Las funciones `successResponse()` y `errorResponse()` en `response.handler.js` garantizan ese formato en todos los controladores.

---

**¿Para qué sirve la capa de services en el frontend si ya existe la capa api?**

La capa `api/` solo hace fetch y devuelve datos crudos. La capa `services/` agrega lógica de negocio. Por ejemplo, `loginService()` no solo llama a `authApi.login()`: también guarda el nombre en `storage.setUserName()` y actualiza el estado global con `store.setUser()`. Otro ejemplo: `safeDeactivate()` en `users.service.js` verifica primero que el estudiante no tenga tareas pendientes antes de desactivarlo, una regla de negocio que no tiene sentido en la capa API.

---

**¿Por qué `API_URL` usa una IP de red local en lugar de `localhost`?**

Cuando el frontend y el backend corren en máquinas diferentes de la misma red, `localhost` no funciona: cada máquina tiene su propio localhost. La IP de red local (`10.5.225.153`) permite que cualquier dispositivo en la misma WiFi pueda conectarse al backend. La URL base está centralizada en `src/config/constants.js` para que si cambia la IP solo haya que actualizarla en un lugar.

---

## 11. Recuperación de contraseña y correos

---

**¿Por qué el flujo de recuperación tiene 3 pasos?**

Un paso único sería inseguro. Si solo hubiera un enlace en el email, cualquiera con acceso al correo podría cambiar la contraseña. El flujo de 3 pasos introduce verificación gradual: primero el usuario solicita el código con `POST /forgot-password`; luego demuestra que tiene acceso al correo con `POST /verify-otp` ingresando el código; solo entonces `POST /reset-password` le permite establecer la nueva contraseña con doble validación del OTP.

---

**¿Dónde se guardan los OTPs y cómo expiran?**

Se guardan directamente en la tabla `users`, en los campos `otp_code` y `otp_expires_at`. Al generarse, calculamos `new Date(Date.now() + 30 * 60000)` (ahora más 30 minutos) en formato MySQL DATETIME. Al verificar, comparamos `new Date() > new Date(user.otp_expires_at)`: si el tiempo actual supera la expiración respondemos con "El código de seguridad ha expirado". Cuando el OTP se usa exitosamente, lo limpiamos con `otp_code = NULL, otp_expires_at = NULL` para que no pueda reutilizarse.

---

**¿Qué es Mailtrap y por qué lo eligieron?**

Mailtrap es un servicio de testing de correos. Actúa como servidor SMTP que intercepta todos los correos y los muestra en un inbox virtual en lugar de entregarlos a casillas reales. Es ideal para desarrollo porque permite probar el flujo completo sin riesgo de enviar emails accidentales. Lo configuramos usando la API REST directa de Mailtrap con `fetch` nativo en `email.js`. Las credenciales se leen de `.env` (`MAILTRAP_TOKEN` y `MAILTRAP_INBOX_ID`).

---

**¿Por qué el OTP se genera con `Math.floor(100000 + Math.random() * 900000)`?**

Esta fórmula garantiza exactamente 6 dígitos. `Math.random()` genera un decimal entre 0 y 1. Multiplicado por 900000 da un rango de 0 a 899999. Sumando 100000 el rango queda de 100000 a 999999 (todos los números de 6 dígitos). `Math.floor()` elimina los decimales. El resultado se convierte a string con `.toString()` para guardarlo en la BD y compararlo con el código que envía el usuario.

---

## 12. Patrones de programación

---

**¿Qué es una Higher-Order Function y dónde la usaron?**

Una HOF es una función que recibe una función como parámetro o retorna una función. En el proyecto: `catchAsync(fn)` recibe el controlador y retorna un nuevo middleware; `validateSchema(schema, target)` recibe un schema Zod y retorna un middleware; `checkPermission(permiso)` recibe un string y retorna un middleware; en el frontend, `renderSidebar(activeRoute, onNavigate)` retorna `{ html, bindEvents }`. Este patrón permite parametrizar comportamientos sin duplicar código.

---

**¿Qué es un Closure y cómo lo usaron?**

Un Closure ocurre cuando una función "recuerda" las variables del scope donde fue creada, aunque ese scope ya terminó. En `checkPermission('tasks.delete.all')`, la función retornada como middleware "recuerda" el valor `'tasks.delete.all'` gracias al closure aunque `checkPermission` ya terminó de ejecutarse. Lo mismo en el frontend: `renderSidebar()` retorna `bindEvents()` que "recuerda" el parámetro `onNavigate` del scope externo.

---

**¿Qué es el patrón Singleton y dónde lo usan?**

Singleton garantiza una única instancia compartida en todo el sistema. El pool de MySQL en `db.js` es un singleton: crea el pool una sola vez al importarse y lo exporta. Todos los controladores importan ese mismo pool, compartiendo el mismo grupo de conexiones. Si cada controlador creara su propio pool, habría múltiples grupos de conexiones simultáneas desperdiciando memoria y recursos de la base de datos.

---

**¿Qué es el Principio de Responsabilidad Única y cómo lo aplicaron?**

SRP dice que cada módulo debe tener una sola razón para cambiar. En el backend: `response.handler.js` solo formatea respuestas, `catchAsync.js` solo captura errores async, `email.js` solo envía correos, `security.js` solo hace operaciones criptográficas. En el frontend: `storage.js` solo maneja localStorage, `rbac.js` solo decodifica permisos, `validators.js` solo define reglas de validación. Si mañana quisiéramos cambiar Mailtrap por SendGrid, solo modificaríamos `email.js`.

---

**¿Qué es la desestructuración y dónde la usan?**

Es una sintaxis de JavaScript que extrae valores de objetos o arrays en variables independientes. La usamos constantemente: `const [rows] = await pool.query(...)` extrae el primer elemento del array de `mysql2`; `const { name, email, document, password, role_id } = req.body` extrae los campos del body; `const { accessToken, refreshToken } = generateTokens(user)` extrae los tokens; en el frontend, `const { html, bindEvents } = renderSidebar(...)` extrae el HTML y la función de eventos del sidebar.

---

**¿Qué es `Promise.all()` y dónde lo usan?**

`Promise.all()` ejecuta múltiples Promises en paralelo y espera a que todas terminen. Lo usamos en `getInstructorData()` del `tasks.service.js` del frontend: `const [users, tasks] = await Promise.all([usersApi.getUsers(), tasksApi.getTasks()])`. Con dos `await` separados las peticiones serían secuenciales y el tiempo sería la suma de ambas. Con `Promise.all`, van en paralelo y el tiempo es el de la más lenta.

---

## 13. Decisiones de diseño

---

**¿Por qué el login acepta documento y no correo electrónico?**

Porque el sistema es para el SENA, donde cada aprendiz tiene un número de documento como identificador oficial. El documento es el identificador único que el sistema institucional ya maneja y que el aprendiz conoce de memoria. El correo electrónico se usa para el flujo de recuperación de contraseña (OTP), no para el login diario. El schema `loginSchema` valida que el documento tenga al menos 5 caracteres.

---

**¿Por qué el primer usuario registrado se convierte automáticamente en SuperAdmin?**

Para garantizar que siempre haya un administrador al iniciar el sistema desde cero, sin necesidad de insertar datos manualmente en la BD. El controlador `register` cuenta los usuarios existentes con `SELECT COUNT(*) as total FROM users`. Si el total es 0, asigna `finalRoleId = 1` (SuperAdmin) sin importar el `role_id` del body. El mensaje de respuesta también cambia dinámicamente para informar al usuario de este comportamiento.

---

**¿Por qué la contraseña temporal de un usuario creado por admin son los últimos 4 dígitos del documento?**

Es una convención práctica para sistemas académicos: el administrador puede comunicarle al estudiante su contraseña inicial de forma simple. El campo `password` no se incluye en `createUserSchema` porque se genera automáticamente en el controlador con `document.slice(-4)`. Si el sistema detecta `requiresReset = true`, redirige al estudiante a cambiarla antes de poder usar el dashboard.

---

**¿Por qué `updateTask` construye la query SQL dinámicamente?**

Para que el instructor pueda enviar solo los campos que quiere actualizar sin pisar los demás. Si solo quiere rechazar una tarea con `{ status: "incompleta" }`, el controlador construye `UPDATE tasks SET status = ? WHERE id = ?` dinámicamente sin tocar el título ni la descripción. Lo hace iterando sobre los campos recibidos: `if (title !== undefined) { fields.push('title = ?'); values.push(title); }`. Si el body llegara vacío, responde con 400.

---

**¿Por qué `safeDeactivate` está en el service del frontend y no en la vista?**

Porque es una regla de negocio, no una operación de UI. `safeDeactivate()` en `users.service.js` verifica que el estudiante no tenga tareas pendientes o en progreso antes de desactivarlo, consultando todas las tareas y filtrando las del usuario. Esa lógica no tiene sentido en la capa API (que solo hace fetch) ni en la vista (que solo manipula el DOM). El service es el lugar correcto para decisiones que combinan datos de múltiples fuentes para aplicar una regla de negocio.

---

## 14. Preguntas trampa o difíciles

---

**¿El proyecto tiene alguna vulnerabilidad de seguridad que reconozcan?**

Sí, y es honesto reconocerlo. Los permisos están embebidos en el JWT, lo que significa que si un admin cambia el rol de un usuario, ese cambio no se refleja hasta que el usuario vuelva a iniciar sesión para obtener un token nuevo. Además los tokens no tienen mecanismo de revocación: si un accessToken es robado, sigue siendo válido hasta que expire (máximo 15 minutos). Para producción real implementaríamos una lista negra de tokens en Redis. Por último, el CORS está abierto con `cors()` sin lista blanca de orígenes, lo que en producción debería configurarse para aceptar solo el dominio del frontend.

---

**¿Qué pasaría si dos administradores intentan eliminar al mismo usuario al mismo tiempo?**

El primero en ejecutar el `DELETE` tendría éxito. El segundo encontraría que el usuario ya no existe: la query `SELECT name FROM users WHERE id = ?` devolvería 0 filas y el controlador respondería con 404 "Usuario no encontrado" antes de intentar cualquier delete o insertar un log duplicado. El log de auditoría solo se inserta una vez porque la verificación de existencia ocurre antes del delete.

---

**¿Qué hace el sistema si la base de datos se cae mientras el servidor está corriendo?**

El pool de `mysql2` maneja el error internamente y todas las queries fallan lanzando un error de conexión. `catchAsync` captura ese error y lo pasa a `next(error)`. El `globalErrorHandler` lo recibe, lo registra en consola y responde con 500 "Error interno del servidor" (porque no es operacional). El servidor de Express sigue corriendo — no se cae. Cuando la base de datos se recupera, el pool reintenta las conexiones automáticamente.

---

**¿Por qué usaron Express 5 y no Express 4?**

Express 5 está en versión estable y tiene mejor soporte nativo para funciones async. En Express 4, si un controlador async lanzaba un error no capturado, el servidor podía quedarse sin responder. Express 5 maneja automáticamente los errores de promesas rechazadas y los pasa al middleware de errores. Esto hace que `catchAsync` sea técnicamente redundante en Express 5, pero lo mantuvimos como buena práctica explícita para dejar clara la intención de manejar todos los errores.

---

**¿Por qué las rutas específicas (`/filter`, `/dashboard`, `/audit/logs`) van antes de las rutas con parámetros (`/:id`)?**

Porque Express evalúa las rutas en orden de registro. Si `/:id` estuviera primero, Express interpretaría "filter" o "audit" como el valor del parámetro `id` y llamaría al controlador equivocado. Al registrar las rutas exactas primero, Express las encuentra antes de llegar a `/:id`. Por eso en `tasks.routes.js`, `/filter` y `/dashboard` van al principio, y en `users.routes.js`, `/audit/logs` va antes de `/:id`.

---

**¿Podrían agregar notificaciones en tiempo real al sistema?**

Sí. La arquitectura en capas facilita agregar funcionalidades sin romper las existentes. Para notificaciones en tiempo real usaríamos WebSockets con `socket.io`. Se agregaría al `app.js` del backend y el frontend abriría una conexión WebSocket para recibir actualizaciones (ej: cuando el instructor aprueba una tarea, el estudiante recibe una notificación inmediata). Las capas existentes no necesitarían cambios: las notificaciones serían una capa paralela que reacciona a los mismos eventos de negocio.

---

**¿Por qué el Sidebar devuelve `{ html, bindEvents }` en lugar de renderizarse solo?**

Porque los eventos del DOM solo se pueden conectar después de que el HTML esté en el documento. Si `renderSidebar()` intentara hacer `document.getElementById('nav-logout').addEventListener(...)` dentro de la misma función, fallaría porque en ese momento el HTML aún no ha sido inyectado. El patrón `{ html, bindEvents }` garantiza el orden correcto: el dashboard inyecta `html` con `innerHTML` primero, y solo después llama `bindEvents()` para conectar los clics. Es un patrón común en Vanilla JS sin frameworks.
