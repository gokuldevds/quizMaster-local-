import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:5000",
    withCredentials: true,
});

// Request interceptor to add JWT token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest?._retry) {
            originalRequest._retry = true;
            // Try refresh
            return axiosInstance.post('/user/refresh')
                .then((res) => {
                    const newToken = res.data?.token;
                    if (newToken) {
                        localStorage.setItem('token', newToken);
                        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        return axiosInstance(originalRequest);
                    }
                    // fallback
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    return Promise.reject(error);
                })
                .catch((refreshErr) => {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    return Promise.reject(refreshErr);
                });
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
