const ACCESS_KEY = 'sena_access_token';
const REFRESH_KEY = 'sena_refresh_token';
const USER_NAME_KEY = 'sena_user_name'; // 🔥 Nueva llave

export const storage = {
    setTokens: (accessToken, refreshToken) => {
        if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
        if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    },
    
    setUserName: (name) => localStorage.setItem(USER_NAME_KEY, name),
    getUserName: () => localStorage.getItem(USER_NAME_KEY),
    
    getAccessToken: () => localStorage.getItem(ACCESS_KEY),
    getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
    
    clearTokens: () => {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_NAME_KEY);
        localStorage.removeItem('sena_token'); // Limpieza del token antiguo
    }
};