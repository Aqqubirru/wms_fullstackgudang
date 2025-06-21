/**
 * client/src/api/axiosInstance.js
 * Membuat instance axios dengan baseURL backend API
 * Menambahkan interceptor untuk menyisipkan token Authorization dari localStorage
 */

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // Enable sending cookies for authentication
});

/**
 * Removed Authorization header interceptor because token is stored in HTTP-only cookie.
 * Authentication will rely solely on cookies sent with requests.
 */

export default API;
