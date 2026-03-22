import axios from 'axios';
const API_BASE_URL = 'http://localhost:3000';
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
export const tokenStorage = {
    getAccessToken() {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },
    getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },
    setTokens(accessToken, refreshToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    },
    clear(){
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
};

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    }
});

apiClient.interceptors.request.use((config) => {
        const accessToken = tokenStorage.getAccessToken();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
    refreshSubscribers.push(callback);
}
function onRefreshed(newAccessToken){
    refreshSubscribers.forEach((callback) => callback(newAccessToken));
    refreshSubscribers = []
}
async function refreshTokensRequest(){
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken){
        throw new Error("Refresh token отсутствует");
    }
    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {},
        {
            headers: {
                "x-refresh-token": refreshToken,
            }
        }
    );
    return response.data;
}

apiClient.interceptors.response.use((response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (!error.response) {
            return Promise.reject(error);
        }
        if (error.response.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }
        const accessToken = tokenStorage.getAccessToken();
        const refreshToken = tokenStorage.getRefreshToken();
        if (!accessToken || !refreshToken) {
            tokenStorage.clear();
            return Promise.reject(error);
        }
        originalRequest._retry = true;
        if (isRefreshing) {
            return new Promise((resolve) => {
                subscribeTokenRefresh((newAccessToken) => {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    resolve(apiClient(originalRequest));
                });
            });
        }
        isRefreshing = true;
        try {
            const data = await refreshTokensRequest();
            tokenStorage.setTokens(data.accessToken, data.refreshToken);
            onRefreshed(data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return apiClient(originalRequest);
        } catch (refreshError){
            tokenStorage.clear();
            if (window.location.pathname !== '/login'){
                window.location.href = "/login";
            }
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    });

export const authApi = {
    async register(payload){
        const response = await apiClient.post("api/auth/register", payload);
        return response.data;
    },
    async login(payload){
        const response = await apiClient.post("api/auth/login", payload);
        return response.data;
    },
    async me(){
        const response = await apiClient.get('api/auth/me');
        return response.data;
    },
    async refresh(){
        const data = await refreshTokensRequest();
        return data;
    }
};
export const productsApi = {
    async getAll(){
        const response = await apiClient.get('api/products');
        return response.data;
    },
    async getProductById(id){
        const response = await apiClient.get(`api/products/${id}`);
        return response.data;
    },
    async create(payload){
        const response = await apiClient.post('api/products', payload);
        return response.data;
    },
    async update(id, payload){
        const response = await apiClient.put(`api/products/${id}`, payload);
        return response.data;
    },
    async remove(id){
        await apiClient.delete(`api/products/${id}`);
    }
};
export const usersApi = {
    async getAll(){
        const response = await apiClient.get('api/users');
        return response.data;
    },
    async getUserById(id){
        const response = await apiClient.get(`api/users/${id}`);
        return response.data;
    },
    async update(id, payload){
        const response = await apiClient.put(`api/users/${id}`, payload);
        return response.data;
    },
    async remove(id){
        await apiClient.delete(`api/users/${id}`);
    }
}
export default apiClient;