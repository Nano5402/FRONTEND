import { storage } from './utils/storage.js';
import { AuthView } from './ui/views/AuthView.js';
// import { AdminView } from './ui/views/AdminView.js'; // Lo crearemos en las siguientes issues
// import { StudentView } from './ui/views/StudentView.js';

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-root'); // Asegúrate de tener un <div id="app-root"></div> en tu body
    
    // Controlador central de rutas y vistas
    const appRouter = () => {
        const token = storage.getAccessToken();

        if (!token) {
            // Usuario NO logueado -> Mostrar módulo de autenticación
            const authController = new AuthView('app-root', (usuarioAutenticado) => {
                // Cuando el login sea exitoso, recargamos el router para que evalúe a dónde enviarlo
                appRouter(); 
            });
            authController.renderLogin();
        } else {
            // Usuario SI logueado -> Decodificar JWT y enrutar según permisos
            try {
                const payload = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1]))));
                
                appContainer.innerHTML = `
                    <div style="padding: 40px; text-align: center;">
                        <h1 style="color: var(--brand-primary);">¡Conexión Exitosa V2 Premium!</h1>
                        <p>Rol detectado: ${payload.role_id}</p>
                        <p>Permisos: ${payload.permissions.join(', ')}</p>
                        <button id="tempLogout" class="btn btn--danger mt-4">Cerrar Sesión</button>
                    </div>
                `;
                
                document.getElementById('tempLogout').addEventListener('click', () => {
                    storage.clearTokens();
                    appRouter();
                });

                // Aquí en la próxima issue invocaremos AdminView o StudentView dependiendo de los permisos.
            } catch (error) {
                storage.clearTokens();
                appRouter();
            }
        }
    };

    // Iniciar la aplicación
    appRouter();
});