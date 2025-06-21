/**
 * client/src/routes/ProtectedRoute.jsx
 * Komponen untuk membatasi akses route berdasarkan autentikasi user
 * Menggunakan AuthContext untuk memeriksa token autentikasi
 * Jika token tidak ada, redirect ke halaman login
 */

import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useContext(AuthContext);

    if (loading) {
        // While loading, render null or a spinner
        return null;
    }

    if (!loading && !isAuthenticated) {
        console.log("No token found, redirecting to login");
        return <Navigate to="/" replace />;
    }

    return children;
}
