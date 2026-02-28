// vite.config.js
// Configuración de Vite para el proyecto Gestión de Tareas


import { defineConfig } from 'vite';

export default defineConfig({
    // Carpeta raíz donde está el index.html
    root: '.',

    // Configuración del servidor de desarrollo
    server: {
        port: 5173,       // puerto donde corre npm run dev
        open: true,       // abre el navegador automáticamente
        cors: true        // permite peticiones al json-server
    },

    // Configuración del build de producción
    build: {
        outDir: 'dist',   // carpeta donde se generan los archivos
        emptyOutDir: true // limpia dist antes de cada build
    }
});