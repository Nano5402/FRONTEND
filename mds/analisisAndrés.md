Andrés Santiago Calvete Lesmes

Parte 1 – Análisis del Proyecto Actual

¿Qué responsabilidades existen actualmente dentro del archivo principal?

-	El archivo actual que tenemos es un archivo normalmente conocido como código espagueti como el instructor nos ha dicho, es decir en este se encuentra absolutamente todo lo que da vida a nuestro código, captura nuestro HTML inicial, realiza las validaciones, realiza el consumo de la base de datos mediante métodos HTTP y aparte de todo esto al trabajar con el DOM sigue implementando nuevos bloques de HTML, teniendo esto en cuenta lo principal de que nos damos cuenta es el error que cometemos y se preguntarán ¿Cuál es? El desorden obviamente, no llevamos un buen orden para una mejor escalabilidad.

¿Qué funciones pertenecen a la interfaz?

-	Las principales funciones que pertenecen a la interfaz y tenemos implementadas con DOM son: 
-	showError() y clearError(): Los cuales son los que nos muestran los mensajes de error  o alerta justo debajo de los inputs.
-	validateForm(): Esta enlazada con el CSS mediante su clase al input nos quita o agrega la clase “error”.
-	createUserCard(): Utilizando createElement y innerHTML para crear de manera dinámica la tarjeta del usuario y mostrar la lista de tareas.
-	renderTaskForm(): Construye y nos muestra el nuevo formulario para poder agregar tareas.

¿Qué funciones realizan comunicación con la API?

-	Como tal en este archivo en principio no tenemos funciones dedicadas a cada cosa mediante el uso de API, utilizamos el fetch() dentro de algunas funciones como:
-	Dentro de handleForSubmit(): Hacemos un GET a /users y otro GET a /tasks
-	Dentro de renderTaskForm(): Ejecutamos un POST para poder guardar y agregar la tarea y luego utilizamos un GET para poderla listar utilizando el DOM para poder crear un espacio en el HTML donde podremos visualizar todo esto.
-	Dentro de deleteTaskForm(): Ejecutamos un DELETE y luego usamos 2 GET para poder traer la información actualizada del usuario.

¿Qué funciones coordinan el flujo general?

-	El orquestador como diríamos en el Pes sería el handleForSubmit() ya que este es la base de todo: Su flujo de coordinación es: primero frena el comportamiento por defecto del navegador (preventDefault), luego llama al bloque de validaciones, si todo sale bien dispara las promesas para ir al servidor, procesa el JSON de respuesta y, finalmente, le pasa la batuta a las funciones de pintado (UI). También los addEventListener del final actúan como pequeños coordinadores pasivos esperando la interacción del usuario.
