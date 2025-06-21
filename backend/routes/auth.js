import express from 'express';
import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // Cari user berdasarkan email atau username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (user.status === 'nonaktif') {
      return res.status(403).json({ message: 'Akun dinonaktifkan' });
    }

    // Cek password (sementara tanpa hash dulu)
    // Jika kamu mau hashing, aktifkan bagian bcrypt di bawah ini
    const isPasswordCorrect = user.password === password;

    // Kalau sudah hash: (butuh `bcrypt.compare`)
    // const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Password salah' });
    }

    // Buat token JWT (opsional, bisa digunakan nanti)
    const token = jwt.sign({ id: user._id }, 'secretkey', { expiresIn: '1d' });

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'lax',
    });

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'secretkey');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// New protected verify endpoint
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
