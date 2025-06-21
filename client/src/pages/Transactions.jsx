/**
 * client/src/pages/Transactions.jsx
 * Halaman transaksi barang yang menampilkan daftar transaksi dan memungkinkan tambah, hapus, dan approve transaksi
 * Menggunakan hook useTransactions untuk mengambil data transaksi dan API untuk operasi transaksi
 * Menampilkan tombol untuk tambah transaksi, hapus transaksi, dan approve transaksi (untuk manager)
 */

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useTransactions } from "../hooks/useTransactions";
import API from "../api/axiosInstance";

export default function Transactions() {
    // Ambil role dan data user saat ini dari localStorage
    const role = localStorage.getItem("role");
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    // Ambil data transaksi dan status loading/error dari hook useTransactions
    const { data: transactions = [], isLoading, isError, refetch } = useTransactions();

    // State untuk mengatur tampilan modal tambah transaksi
    const [showModal, setShowModal] = useState(false);
    // State untuk menyimpan daftar produk
    const [items, setItems] = useState([]);
    // State untuk input transaksi baru
    const [newTx, setNewTx] = useState({
        produk: "",
        jumlah: "",
        tipe: "masuk",
    });

    // State untuk mode hapus dan daftar transaksi yang dipilih untuk dihapus
    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState([]);

    // useEffect untuk mengambil data produk saat komponen mount
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await API.get("/items");
                setItems(res.data);
            } catch (err) {
                toast.error("Gagal mengambil daftar produk");
            }
        };
        fetchItems();
    }, []);

    // Handler perubahan input form transaksi baru
    const handleChange = (e) => {
        setNewTx({ ...newTx, [e.target.name]: e.target.value });
    };

    // Handler submit form tambah transaksi baru
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Debug log currentUser dan user_input
            console.log("currentUser:", currentUser);
            const userInputName = currentUser.nama || currentUser.username || "unknown";
            console.log("user_input to send:", userInputName);

            // Buat objek transaksi baru dengan tanggal, status, dan user_input
            const tx = {
                ...newTx,
                tanggal: new Date().toISOString().split("T")[0],
                status: role === "manager" ? "approved" : "pending",
                user_input: userInputName,
            };
            await API.post("/transactions", tx);
            toast.success("Transaksi berhasil ditambahkan!");
            setShowModal(false);
            setNewTx({ produk: "", jumlah: "", tipe: "masuk" });
            refetch();
        } catch (err) {
            toast.error("Gagal menambahkan transaksi");
        }
    };

    // Handler approve transaksi (hanya untuk manager)
    const handleApprove = async (id) => {
        try {
            await API.put(`/transactions/${id}`, { status: "approved" });
            toast.success("Transaksi disetujui!");
            refetch();
        } catch (err) {
            toast.error("Gagal menyetujui transaksi");
        }
    };

    // Toggle pilih transaksi untuk dihapus
    const toggleSelectToDelete = (id) => {
        if (selectedToDelete.includes(id)) {
            setSelectedToDelete(selectedToDelete.filter((item) => item !== id));
        } else {
            setSelectedToDelete([...selectedToDelete, id]);
        }
    };

    // Handler hapus transaksi yang dipilih
    const handleDeleteSelected = async () => {
        if (selectedToDelete.length === 0) {
            toast.error("Pilih minimal satu transaksi untuk dihapus.");
            return;
        }
        if (!window.confirm("Yakin ingin menghapus transaksi yang dipilih?")) return;

        try {
            for (const id of selectedToDelete) {
                await API.delete(`/transactions/${id}`);
            }
            toast.success("Transaksi berhasil dihapus!");
            setDeleteMode(false);
            setSelectedToDelete([]);
            refetch();
        } catch {
            toast.error("Gagal menghapus transaksi.");
        }
    };

    return (
        <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h1 className="text-2xl font-bold">Transaksi Barang</h1>
                    <div className="space-x-2 flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded whitespace-nowrap text-sm"
                        >
                            + Tambah Transaksi
                        </button>
                        {role === "manager" && !deleteMode && (
                            <button
                                onClick={() => setDeleteMode(true)}
                                className="bg-red-600 text-white px-3 py-1.5 rounded whitespace-nowrap text-sm"
                            >
                                Hapus Transaksi
                            </button>
                        )}
                        {deleteMode && (
                            <>
                                <button
                                    onClick={handleDeleteSelected}
                                    className="bg-red-600 text-white px-3 py-1.5 rounded whitespace-nowrap text-sm"
                                >
                                    Hapus Terpilih
                                </button>
                                <button
                                    onClick={() => {
                                        setDeleteMode(false);
                                        setSelectedToDelete([]);
                                    }}
                                    className="bg-gray-400 text-white px-3 py-1.5 rounded whitespace-nowrap text-sm"
                                >
                                    Batal
                                </button>
                            </>
                        )}
                    </div>
                </div>

            {isLoading && <p>Loading transaksi...</p>}
            {isError && <p>Gagal mengambil data transaksi.</p>}

            {!isLoading && !isError && (
                <div className="overflow-auto bg-white rounded shadow">
                    <table className="min-w-full text-sm">
                        <thead className="bg-zinc-200">
                            <tr>
                                <th className="px-4 py-2">#</th>
                                <th className="px-4 py-2">Produk</th>
                                <th className="px-4 py-2">Jumlah</th>
                                <th className="px-4 py-2">Tipe</th>
                                <th className="px-4 py-2">Tanggal</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">User</th>
                                {deleteMode && <th className="px-4 py-2">Pilih</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx, i) => (
                                <tr key={tx._id} className="border-b hover:bg-zinc-50">
                                    <td className="px-4 py-2">{i + 1}</td>
                                    <td className="px-4 py-2">{tx.produk?.nama || tx.produk}</td>
                                    <td className="px-4 py-2">{tx.jumlah}</td>
                                    <td className="px-4 py-2 capitalize">{tx.tipe}</td>
                                    <td className="px-4 py-2">{tx.tanggal}</td>
                                    <td className="px-4 py-2">
                                        {role === "manager" && tx.status === "pending" ? (
                                            <button
                                                onClick={() => handleApprove(tx._id)}
                                                className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700"
                                                title="Approve transaksi"
                                            >
                                                {tx.status}
                                            </button>
                                        ) : (
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${
                                                    tx.status === "approved"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                                title={`Status: ${tx.status}`}
                                            >
                                                {tx.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2" title={`User: ${tx.user_input}`}>
                                        {tx.user_input}
                                    </td>
                                    {deleteMode && (
                                        <td className="px-4 py-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedToDelete.includes(tx._id)}
                                                onChange={() => toggleSelectToDelete(tx._id)}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Tambah Transaksi */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Tambah Transaksi</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <select
                                name="produk"
                                value={newTx.produk}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border rounded"
                            >
                                <option value="" disabled>
                                    Pilih Produk
                                </option>
                                {items.map((item) => (
                                    <option key={item._id} value={item._id}>
                                        {item.nama}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                name="jumlah"
                                placeholder="Jumlah"
                                value={newTx.jumlah}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border rounded"
                            />
                            <select
                                name="tipe"
                                value={newTx.tipe}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            >
                                <option value="masuk">Barang Masuk</option>
                                <option value="keluar">Barang Keluar</option>
                            </select>

                            <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-3 py-1.5 bg-zinc-300 rounded text-sm"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1.5 bg-green-600 text-white rounded text-sm"
                            >
                                Simpan
                            </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
