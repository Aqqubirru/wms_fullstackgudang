/**
 * client/src/App.jsx
 * Komponen utama aplikasi React
 * Mengatur autentikasi user berdasarkan token JWT di localStorage
 * Menyediakan routing aplikasi melalui AppRoutes
 * Menyimpan data transaksi default di localStorage jika belum ada
 */

import { useState, useEffect, useContext } from 'react'
import AppRoutes from './routes/AppRoutes';
import { AuthContext } from './context/AuthContext';
import API from './api/axiosInstance';

// Menyimpan data transaksi default di localStorage jika belum ada
if (!localStorage.getItem("transactionsData")) {
  localStorage.setItem(
    "transactionsData",
    JSON.stringify([
      {
        id: 1,
        produk: "Barang A",
        jumlah: 10,
        tipe: "masuk",
        tanggal: "2024-05-20",
        status: "approved",
        user_input: "sar",
      },
      {
        id: 2,
        produk: "Barang B",
        jumlah: 5,
        tipe: "keluar",
        tanggal: "2024-05-21",
        status: "pending",
        user_input: "daffa",
      },
      {
        id: 3,
        produk: "Barang C",
        jumlah: 7,
        tipe: "masuk",
        tanggal: "2024-05-21",
        status: "approved",
        user_input: "sar",
      },
      {
        id: 4,
        produk: "Barang B",
        jumlah: 3,
        tipe: "keluar",
        tanggal: "2024-05-22",
        status: "approved",
        user_input: "daffa",
      }
    ])
  );
}

function App() {
  const { login, logout, loading, setLoading, token } = useContext(AuthContext);

  useEffect(() => {
    console.log("App component mounted. Starting session verification...");
    const verifySession = async () => {
      setLoading(true);
      try {
        const response = await API.get('/auth/verify');
        console.log("Session verification successful. Response:", response.data);
        if (response.data.success) {
          const user = response.data.user;
          // Since token is HTTP-only cookie, we cannot get token string, so pass placeholder token
          login("valid-token", user.role, user);
        } else {
          // Do not logout immediately, just keep user logged in
          console.warn("Session verification failed: success false");
        }
      } catch (error) {
        console.error("Session verification failed. Error:", error.response ? error.response.data : error.message);
        // Do not logout immediately on 401 to prevent redirect on refresh
        if (error.response && error.response.status !== 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return <AppRoutes isAuthenticated={!!token} />;
}

export default App;
