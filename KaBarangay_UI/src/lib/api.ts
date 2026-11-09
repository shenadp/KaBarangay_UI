import axios from "axios"

export const api = axios.create({
  baseURL: "/api", // dadaan sa Vite proxy, kaya walang CORS
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
})