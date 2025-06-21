/**
 * client/src/pages/Inventory.jsx
 * ---
 * Komponen ini berfungsi sebagai halaman utama untuk manajemen inventaris.
 * Telah disempurnakan untuk:
 * - Responsivitas yang lebih baik di semua ukuran layar.
 * - Mengatasi masalah scroll saat modal aktif.
 * - Logika unggah file yang lebih robust.
 */

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import API from "../api/axiosInstance";
import { getCategories, addCategory } from "../api/categories";

// Base URL untuk gambar agar mudah diubah. Sebaiknya ini disimpan di file .env.
const IMAGE_BASE_URL = "http://localhost:5000";

export default function Inventory() {
  // --- STATE MANAGEMENT ---
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [newProduct, setNewProduct] = useState({
    nama: "",
    deskripsi: "",
    stok: 0,
    lokasi: "",
    kategori: "",
    harga: "",
    imageFile: null,
  });

  const [editProduct, setEditProduct] = useState(null);

  // --- VARIABLES & DERIVED STATE ---
  const role = localStorage.getItem("role");
  const filteredItems = selectedCategoryFilter
    ? items.filter(item => {
        const itemCategoryId = typeof item.kategori === "object" && item.kategori !== null ? item.kategori._id : item.kategori;
        return itemCategoryId === selectedCategoryFilter;
      })
    : items;

  // --- EFFECTS ---

  // Effect untuk mengunci scroll body saat modal terbuka.
  useEffect(() => {
    const isModalOpen = showCategoryModal || showProductModal || showEditModal;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCategoryModal, showProductModal, showEditModal]);

  // Effect untuk mengambil semua data awal saat komponen mount.
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [itemsRes, locationsRes, categoriesRes] = await Promise.all([
          API.get("/items"),
          API.get("/locations"),
          getCategories()
        ]);
        setItems(itemsRes.data);
        setLocations(locationsRes.data);
        setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
      } catch (err) {
        toast.error("Gagal memuat data awal dari server.");
      }
    };
    fetchAllData();
  }, []);

  // --- EVENT HANDLERS ---

  const handleCategoryNameChange = (e) => setNewCategoryName(e.target.value);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return toast.error("Nama kategori tidak boleh kosong.");
    try {
      const response = await addCategory({ nama: newCategoryName.trim() });
      toast.success("Kategori berhasil ditambahkan!");
      setShowCategoryModal(false);
      setNewCategoryName("");
      // Refetch categories from backend to ensure fresh data
      const freshCategories = await getCategories();
      setCategories(Array.isArray(freshCategories) ? freshCategories : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menambahkan kategori.");
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Anda yakin ingin menghapus kategori "${categoryName}"?`)) {
      try {
        await API.delete(`/categories/${categoryId}`);
        toast.success("Kategori berhasil dihapus!");
        setCategories(prev => prev.filter(cat => cat._id !== categoryId));
      } catch (err) {
        toast.error("Gagal menghapus kategori.");
      }
    }
  };
  
  const handleNewProductChange = (e) => setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  
  const handleNewProductFileChange = (e) => setNewProduct(prev => ({ ...prev, imageFile: e.target.files[0] || null }));

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.lokasi || !newProduct.kategori) return toast.error("Lokasi dan Kategori harus dipilih.");
    try {
      const formData = new FormData();
      formData.append('nama', newProduct.nama);
      formData.append('deskripsi', newProduct.deskripsi);
      formData.append('stok', Number(newProduct.stok));
      formData.append('harga', Number(newProduct.harga) || 0);
      formData.append('lokasi', newProduct.lokasi);
      formData.append('kategori', newProduct.kategori);
      if (newProduct.imageFile) formData.append('foto', newProduct.imageFile);

      const response = await API.post("/items", formData);
      toast.success("Produk berhasil ditambahkan!");
      setShowProductModal(false);
      setNewProduct({ nama: "", deskripsi: "", stok: 0, lokasi: "", kategori: "", harga: "", imageFile: null });
      setItems(prevItems => [...prevItems, response.data]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menambahkan produk.");
    }
  };
  
  const openEditModal = (item) => {
    setEditProduct({
      ...item,
      deskripsi: item.deskripsi || "",
      kategori: typeof item.kategori === "object" && item.kategori !== null ? item.kategori._id : item.kategori,
      lokasi: item.lokasi?._id || item.lokasi || "",
      imageFile: null,
      foto: item.foto ? `${IMAGE_BASE_URL}${item.foto.startsWith('/') ? item.foto : '/' + item.foto}` : null
    });
    setShowEditModal(true);
  };
  
  const handleEditProductChange = (e) => setEditProduct({ ...editProduct, [e.target.name]: e.target.value });

  const handleEditProductFileChange = (e) => {
    const file = e.target.files[0] || null;
    setEditProduct(prev => ({
      ...prev,
      imageFile: file,
      foto: file ? URL.createObjectURL(file) : (prev.foto || null)
    }));
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editProduct.lokasi || !editProduct.kategori) return toast.error("Lokasi dan Kategori harus dipilih.");
    try {
      const formData = new FormData();
      formData.append('nama', editProduct.nama);
      formData.append('deskripsi', editProduct.deskripsi || "");
      formData.append('stok', Number(editProduct.stok));
      formData.append('harga', Number(editProduct.harga) || 0);
      formData.append('lokasi', editProduct.lokasi);
      formData.append('kategori', editProduct.kategori);
      if (editProduct.imageFile) formData.append('foto', editProduct.imageFile);
      
      const response = await API.put(`/items/${editProduct._id}`, formData);
      toast.success("Produk berhasil diperbarui!");
      setShowEditModal(false);
      setEditProduct(null);
      setItems(prevItems => prevItems.map(item => item._id === response.data._id ? response.data : item));
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memperbarui produk.");
    }
  };

  const handleDeleteProduct = async (item) => {
    if (window.confirm(`Anda yakin ingin menghapus produk "${item.nama}"?`)) {
      try {
        await API.delete(`/items/${item._id}`);
        toast.success("Produk berhasil dihapus!");
        setItems(prevItems => prevItems.filter(i => i._id !== item._id));
      } catch (err) {
        toast.error("Gagal menghapus produk.");
      }
    }
  };

  // --- RENDER COMPONENT ---
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 shrink-0">Inventaris Barang</h1>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-auto">
            <label htmlFor="categoryFilter" className="sr-only">Filter Kategori:</label>
            <select
              id="categoryFilter"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="border rounded-md px-3 py-2 w-full text-sm"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (<option key={cat._id} value={cat._id}>{cat.nama}</option>))}
            </select>
          </div>
          {role === "manager" && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Tombol dengan warna asli */}
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto text-sm"
                onClick={() => setShowCategoryModal(true)}
              >
                Kategori
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 w-full sm:w-auto text-sm"
                onClick={() => setShowProductModal(true)}
              >
                + Produk
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => {
          const category = categories.find(cat => (typeof item.kategori === 'object' ? cat._id === item.kategori?._id : cat._id === item.kategori));
          const location = locations.find(loc => (typeof item.lokasi === 'object' ? loc._id === item.lokasi?._id : loc._id === item.lokasi));
          const imageUrl = item.foto ? `${IMAGE_BASE_URL}${item.foto.startsWith('/') ? item.foto : '/' + item.foto}` : null;
          return (
            <div key={item._id} className="border rounded-lg shadow-md p-4 flex flex-col bg-white transition-shadow hover:shadow-xl">
              <div className="relative">
                <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center mb-4">
                  {imageUrl ? (<img src={imageUrl} alt={item.nama} className="max-h-full max-w-full object-contain"/>) : (<span className="text-gray-400">No Image</span>)}
                </div>
                <p className="absolute top-2 right-2 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded">Stok: {item.stok}</p>
              </div>
              <h2 className="text-lg font-semibold mb-2 text-gray-800 truncate">{item.nama}</h2>
              <p className="text-sm text-gray-600 mb-4 flex-grow">{item.deskripsi || "Deskripsi tidak tersedia."}</p>
              <p className="text-sm font-medium text-gray-700">Kategori: <span className="font-normal">{category ? category.nama : "N/A"}</span></p>
              <p className="text-sm font-medium text-gray-700">Lokasi: <span className="font-normal">{location ? location.nama_lokasi : "N/A"}</span></p>
              {/* Harga dengan warna asli */}
              <p className="text-lg font-bold text-green-700 mt-2 mb-4">{item.harga ? `Rp ${item.harga.toLocaleString('id-ID')}` : "Harga N/A"}</p>
              <div className="flex gap-2 mt-auto border-t pt-3">
                {/* Tombol edit/hapus dengan warna asli */}
                <button onClick={() => openEditModal(item)} className="bg-yellow-500 text-white px-3 py-1.5 rounded text-sm w-full">Edit</button>
                {role === "manager" && (<button onClick={() => handleDeleteProduct(item)} className="bg-red-600 text-white px-3 py-1.5 rounded text-sm w-full">Hapus</button>)}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODALS --- */}
      {[showCategoryModal, showProductModal, showEditModal].some(Boolean) && (
        <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto flex justify-center items-start py-10 px-4">
          
          {showCategoryModal && (
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fade-in-down">
              <h2 className="text-xl font-bold mb-4">Kelola Kategori</h2>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <input type="text" name="nama" placeholder="Ketik nama kategori baru..." value={newCategoryName} onChange={handleCategoryNameChange} required className="w-full px-3 py-2 border rounded"/>
                <div className="max-h-48 overflow-auto mt-2 border rounded p-2 bg-gray-50">
                  {categories.map((cat) => (<div key={cat._id} className="flex justify-between items-center p-1 hover:bg-gray-100 rounded"><span>{cat.nama}</span><button type="button" onClick={() => handleDeleteCategory(cat._id, cat.nama)} className="text-red-600 hover:text-red-800 font-semibold text-xs">Hapus</button></div>))}
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 bg-zinc-300 rounded hover:bg-zinc-400">Tutup</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Simpan Baru</button>
                </div>
              </form>
            </div>
          )}

          {showProductModal && (
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fade-in-down">
              <h2 className="text-xl font-bold mb-4">Tambah Produk Baru</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label htmlFor="nama" className="block mb-1 font-medium">Nama Produk</label>
                  <input
                    type="text"
                    id="nama"
                    name="nama"
                    value={newProduct.nama}
                    onChange={handleNewProductChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="deskripsi" className="block mb-1 font-medium">Deskripsi</label>
                  <textarea
                    id="deskripsi"
                    name="deskripsi"
                    value={newProduct.deskripsi}
                    onChange={handleNewProductChange}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label htmlFor="stok" className="block mb-1 font-medium">Stok</label>
                  <input
                    type="number"
                    id="stok"
                    name="stok"
                    value={newProduct.stok}
                    onChange={handleNewProductChange}
                    min={0}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="lokasi" className="block mb-1 font-medium">Lokasi</label>
                  <select
                    id="lokasi"
                    name="lokasi"
                    value={newProduct.lokasi}
                    onChange={handleNewProductChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Pilih lokasi</option>
                    {locations.map(loc => (
                      <option key={loc._id} value={loc._id}>{loc.nama_lokasi}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="kategori" className="block mb-1 font-medium">Kategori</label>
                  <select
                    id="kategori"
                    name="kategori"
                    value={newProduct.kategori}
                    onChange={handleNewProductChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="harga" className="block mb-1 font-medium">Harga</label>
                  <input
                    type="number"
                    id="harga"
                    name="harga"
                    value={newProduct.harga}
                    onChange={handleNewProductChange}
                    min={0}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="imageFile" className="block mb-1 font-medium">Foto Produk</label>
                  <input
                    type="file"
                    id="imageFile"
                    name="imageFile"
                    accept="image/*"
                    onChange={handleNewProductFileChange}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-zinc-300 rounded hover:bg-zinc-400">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Simpan</button>
                </div>
              </form>
            </div>
          )}

          {showEditModal && editProduct && (
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fade-in-down">
              <h2 className="text-xl font-bold mb-4">Edit Produk</h2>
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div>
                  <label htmlFor="nama" className="block mb-1 font-medium">Nama Produk</label>
                  <input
                    type="text"
                    id="nama"
                    name="nama"
                    value={editProduct.nama}
                    onChange={handleEditProductChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="deskripsi" className="block mb-1 font-medium">Deskripsi</label>
                  <textarea
                    id="deskripsi"
                    name="deskripsi"
                    value={editProduct.deskripsi}
                    onChange={handleEditProductChange}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label htmlFor="stok" className="block mb-1 font-medium">Stok</label>
                  <input
                    type="number"
                    id="stok"
                    name="stok"
                    value={editProduct.stok}
                    onChange={handleEditProductChange}
                    min={0}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="lokasi" className="block mb-1 font-medium">Lokasi</label>
                  <select
                    id="lokasi"
                    name="lokasi"
                    value={editProduct.lokasi}
                    onChange={handleEditProductChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Pilih lokasi</option>
                    {locations.map(loc => (
                      <option key={loc._id} value={loc._id}>{loc.nama_lokasi}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="kategori" className="block mb-1 font-medium">Kategori</label>
                  <select
                    id="kategori"
                    name="kategori"
                    value={editProduct.kategori}
                    onChange={handleEditProductChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="harga" className="block mb-1 font-medium">Harga</label>
                  <input
                    type="number"
                    id="harga"
                    name="harga"
                    value={editProduct.harga}
                    onChange={handleEditProductChange}
                    min={0}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="imageFile" className="block mb-1 font-medium">Foto Produk</label>
                  <input
                    type="file"
                    id="imageFile"
                    name="imageFile"
                    accept="image/*"
                    onChange={handleEditProductFileChange}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-zinc-300 rounded hover:bg-zinc-400">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Simpan Perubahan</button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
