const ACCESS_KEY = 'sena_access_token';
const REFRESH_KEY = 'sena_refresh_token';

export const storage = {
    setTokens: (accessToken, refreshToken) => {
        if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
        if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    },
    
    getAccessToken: () => {
        return localStorage.getItem(ACCESS_KEY);
    },
    
    getRefreshToken: () => {
        return localStorage.getItem(REFRESH_KEY);
    },
    
    clearTokens: () => {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        // Limpiamos el token antiguo por compatibilidad
        localStorage.removeItem('sena_token');
    }
};