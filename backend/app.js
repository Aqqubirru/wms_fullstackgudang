/**
 * File utama backend server menggunakan Express.js
 * Mengatur middleware, koneksi database, dan routing API
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./database.js";
import cookieParser from "cookie-parser";

// Import route handler untuk berbagai resource
import userRoutes from "./routes/user.routes.js";
import itemRoutes from "./routes/item.routes.js";
import locationRoutes from "./routes/location.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import authRoutes from "./routes/auth.routes.js"; // Route autentikasi
import registerRoutes from "./routes/register.routes.js"; // Route registrasi baru
import categoryRoutes from "./routes/category.routes.js";

dotenv.config();
const app = express();

// Setup CORS untuk mengizinkan request dari frontend lokal
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  exposedHeaders: ['Set-Cookie'], // agar cookie bisa diakses oleh client
}));

// Middleware untuk parsing JSON dan cookie
app.use(express.json());
app.use(cookieParser());

// Serve static files from public/uploads for image access
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Koneksi ke database MongoDB
connectDB();

// Daftarkan route API untuk berbagai resource
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes); // Route autentikasi
app.use("/api/register", registerRoutes); // Route registrasi
app.use("/api/categories", categoryRoutes);

// Jalankan server pada port yang ditentukan di environment variable atau default 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
