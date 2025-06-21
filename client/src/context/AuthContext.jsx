/**
 * client/src/context/AuthContext.jsx
 * Context untuk autentikasi user
 * Menyimpan token, role, dan data user
 * Menyediakan fungsi login dan logout
 */

import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

/**
 * Provider untuk AuthContext
 * Menginisialisasi state dari localStorage
 * Menyediakan fungsi login dan logout untuk update state dan localStorage
 */
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // New loading state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mengambil data autentikasi dari localStorage saat mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    const storedUser = localStorage.getItem("currentUser");

    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    if (storedRole) {
      setRole(storedRole);
    }
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false); // Set loading false after initialization
  }, []);

  // Fungsi login untuk menyimpan token, role, dan user ke state dan localStorage
  const login = (token, role, user) => {
    setToken(token);
    setRole(role);
    setUser(user);
    setIsAuthenticated(true);
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("currentUser", JSON.stringify(user));
  };

  // Fungsi logout untuk menghapus data autentikasi dari state dan localStorage
  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ token, role, user, login, logout, loading, setLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
