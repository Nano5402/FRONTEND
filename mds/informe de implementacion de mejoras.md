**Informe de Implementación de Mejora**

En esta fase del proyecto se implementó una mejora en el sistema de notificaciones. Antes, los mensajes al usuario se mostraban con un componente hecho dentro del proyecto. Aunque funcionaba, tenía limitaciones en presentación, mantenimiento y escalabilidad. Para resolverlo, se integró la librería externa  **Notyf** , con el objetivo de mostrar notificaciones más claras, visualmente ordenadas y fáciles de administrar desde un solo lugar.

En cuanto a la gestión de dependencias, se trabajó con **npm** como gestor de paquetes. La dependencia principal utilizada fue **notyf**, instalada desde **package.json**. Se verificó que el proyecto mantuviera compatibilidad con Vite y que las instalaciones se reflejaran correctamente en **node_modules** y en el archivo de configuración del proyecto. Esto permitió asegurar que cualquier integrante del equipo pueda instalar y ejecutar el proyecto sin diferencias en el entorno.

A nivel estructural, se creó y organizó un módulo específico para notificaciones dentro de **src/ui/components/notificaciones.js**. Desde este archivo se centralizó la configuración de Notyf y se exportaron funciones reutilizables para éxito, error, advertencia e información. Luego, en el archivo principal **src/script.js**, se actualizaron las importaciones para consumir este nuevo módulo. Con este ajuste se logró una estructura más ordenada, ya que la lógica de notificaciones quedó separada de la lógica principal de interacción.

Respecto a la ejecución en desarrollo y producción, se observaron diferencias importantes. En desarrollo (**npm run dev**) el sistema permite ver cambios de manera inmediata y facilita corregir errores rápidamente. En producción (**npm run build** + **npm run preview**) el proyecto se genera en una versión optimizada, más liviana y preparada para entrega. En resumen, desarrollo está orientado a construir y probar; producción está orientada a rendimiento y despliegue final.

Durante el proceso surgieron dificultades puntuales. La principal fue la ocupación de puertos al ejecutar servidores de prueba, lo que impedía iniciar correctamente algunos comandos. Esta situación se solucionó cerrando procesos previos y volviendo a ejecutar los comandos en puertos disponibles. También se revisaron importaciones para evitar conflictos entre el sistema de notificaciones anterior y el nuevo módulo implementado.

Como resultado final, el proyecto quedó funcionando correctamente tanto en entorno de desarrollo como en entorno de producción, cumpliendo los objetivos de la mejora implementada.
