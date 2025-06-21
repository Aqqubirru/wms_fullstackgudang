/**
 * controllers/category.controller.js
 * Berisi fungsi-fungsi controller untuk operasi CRUD pada model Category
 */

import Category from "../models/Category.js";

/**
 * Mendapatkan semua kategori dari database
 * Mengirimkan data kategori dalam format JSON
 */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil kategori." });
  }
};

/**
 * Membuat kategori baru berdasarkan nama yang dikirim di body request
 * Mengecek apakah kategori sudah ada, jika ada kembalikan error
 * Jika belum, simpan kategori baru dan kembalikan data kategori baru
 */
export const createCategory = async (req, res) => {
  const { nama } = req.body;
  try {
    const existing = await Category.findOne({ nama });
    if (existing) {
      return res.status(400).json({ message: "Kategori sudah ada." });
    }
    const newCategory = new Category({ nama });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ message: "Gagal menambahkan kategori." });
  }
};

/**
 * Memperbarui kategori berdasarkan id yang dikirim di parameter URL
 * Menggunakan nama baru dari body request
 * Mengembalikan data kategori yang sudah diperbarui
 */
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { nama } = req.body;
  try {
    const updated = await Category.findByIdAndUpdate(id, { nama }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Gagal memperbarui kategori." });
  }
};

/**
 * Menghapus kategori berdasarkan id yang dikirim di parameter URL
 * Mengembalikan pesan sukses jika berhasil dihapus
 */
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await Category.findByIdAndDelete(id);
    res.json({ message: "Kategori dihapus." });
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus kategori." });
  }
};


// wkwkwkkwkw