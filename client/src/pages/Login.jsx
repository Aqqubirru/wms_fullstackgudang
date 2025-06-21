/**
 * client/src/pages/Login.jsx
 * Halaman login aplikasi SupzG
 * Menyediakan form login dengan input email/username dan password
 * Menggunakan context AuthContext untuk proses login dan navigasi setelah login berhasil
 * Menampilkan tombol untuk menampilkan/menyembunyikan password
 * Menampilkan notifikasi toast untuk status login
 */

import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import API from "../api/axiosInstance";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // State form login
  const [form, setForm] = useState({ identifier: "", password: "" });
  // State untuk toggle tampilkan password
  const [showPassword, setShowPassword] = useState(false);
  // State loading saat proses login
  const [loading, setLoading] = useState(false);

  // Handler perubahan input form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handler submit form login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/auth/login", {
        identifier: form.identifier,
        password: form.password,
      });

      console.log("Login response:", res);

      const { token, user } = res.data;

      if (!token || !user) {
        toast.error("Login gagal: data user atau token tidak ditemukan.");
        setLoading(false);
        return;
      }

      // Proses login dengan menyimpan token dan data user di context
      login(token, user.role, user);

      toast.success("Login berhasil!");

      // Navigasi ke dashboard sesuai role user
      setTimeout(() => {
        navigate(user.role === "manager" ? "/dashboard" : "/staff-dashboard");
      }, 1000);
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        err.response?.data?.message || "Terjadi kesalahan saat login.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
      <form
        onSubmit={handleLogin}
        className="bg-zinc-800 p-6 rounded w-full max-w-sm shadow"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">Login SupzG</h1>

        <div className="mb-4">
          <label className="block mb-1 text-sm">Email / Username</label>
          <input
            type="text"
            name="identifier"
            value={form.identifier}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded text-black bg-white border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div className="mb-4 relative">
          <label className="block mb-1 text-sm">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded text-black bg-white border border-zinc-300 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-8 text-zinc-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 w-full py-1.5 rounded mt-3 disabled:opacity-60 text-sm"
        >
          {loading ? "Loading..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
