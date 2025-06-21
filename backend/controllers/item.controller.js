/**
 * controllers/item.controller.js
 * Berisi fungsi-fungsi controller untuk operasi CRUD pada model Item
 */

import Item from "../models/Item.js";

/**
 * Mendapatkan semua data item dari database
 * Menggunakan populate untuk mengambil data lokasi dan kategori terkait
 * Mengirimkan data dalam format JSON
 */
export const getAllItems = async (req, res) => {
    try {
        const data = await Item.find().populate("lokasi").populate("kategori");
        res.json(data);
    } catch (err) {
        console.error("Error in getAllItems:", err);
        console.error(err.stack);
        res.status(500).json({ message: "Gagal mengambil data produk.", error: err.message });
    }
};

/**
 * Membuat item baru berdasarkan data yang dikirimkan di body request
 * Menyimpan item baru ke database dan mengembalikan data item yang baru dibuat
 */
export const createItem = async (req, res) => {
    const { nama, deskripsi, stok, lokasi, kategori, harga } = req.body;
    try {
        const foto = req.file ? "/uploads/" + req.file.filename : req.body.foto;
        const newItem = new Item({ nama, deskripsi, stok, lokasi, kategori, foto, harga });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(500).json({ message: "Gagal menambahkan produk." });
    }
};

/**
 * Memperbarui data item berdasarkan id yang dikirimkan di parameter URL
 * Menggunakan data baru dari body request untuk update
 * Mengembalikan data item yang sudah diperbarui
 */
export const updateItem = async (req, res) => {
    const { id } = req.params;
    const { nama, deskripsi, stok, lokasi, kategori, harga } = req.body;
    try {
        const foto = req.file ? "/uploads/" + req.file.filename : req.body.foto;
        const updated = await Item.findByIdAndUpdate(
            id,
            { nama, deskripsi, stok, lokasi, kategori, foto, harga },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        console.error("Error in updateItem:", err);
        console.error(err.stack);
        res.status(500).json({ message: "Gagal memperbarui produk.", error: err.message });
    }
};

/**
 * Menghapus item berdasarkan id yang dikirimkan di parameter URL
 * Mengembalikan pesan sukses jika berhasil dihapus
 */
export const deleteItem = async (req, res) => {
    const { id } = req.params;
    try {
        await Item.findByIdAndDelete(id);
        res.json({ message: "Produk dihapus." });
    } catch (err) {
        res.status(500).json({ message: "Gagal menghapus produk." });
    }
};
