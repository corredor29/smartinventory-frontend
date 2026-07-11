import axios from "axios";

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_DOTNET_API_URL || "http://localhost:5299/api",
});

// Agrega el JWT a cada petición si existe
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("smart_inventory_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    if (response.config.responseType === "blob") {
      return response;
    }
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {

    return Promise.reject(error);
  }
);

export default httpClient;