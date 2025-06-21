/**
 * middleware/authMiddleware.js
 * Middleware untuk memverifikasi token JWT pada request
 * Memastikan user sudah login dan token valid sebelum mengakses route tertentu
 */

import jwt from 'jsonwebtoken';

/**
 * Middleware untuk memverifikasi token JWT
 * Mendapatkan token dari header Authorization atau cookie
 * Jika token valid, menyimpan data user di req.user dan melanjutkan ke middleware berikutnya
 * Jika token tidak ada atau tidak valid, mengembalikan response 401 Unauthorized
 */
export const verifyToken = (req, res, next) => {
    console.log("Auth Middleware: Headers:", req.headers);
    console.log("Auth Middleware: Cookies:", req.cookies);

    const authHeader = req.headers.authorization || req.cookies.token;

    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        console.log("Auth Middleware: No token provided.");
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supzg-secret');
        req.user = decoded;
        console.log("Auth Middleware: Token verified successfully.");
        next();
    } catch (err) {
        console.log("Auth Middleware: Invalid token.", err.message);
        return res.status(401).json({ message: 'Invalid token.' });
    }
};
