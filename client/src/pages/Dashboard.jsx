/**
 * client/src/pages/Dashboard.jsx
 * Halaman dashboard utama aplikasi SupzG
 * Menampilkan ringkasan data, grafik, filter, dan daftar transaksi terbaru
 */

import { useEffect, useState } from "react";
import {
    PieChart,
    Pie,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Cell,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import SummaryCard from "../components/SummaryCard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { useTransactions } from "../hooks/useTransactions";
import { useLocations } from "../hooks/useLocations";
import { useUsers } from "../hooks/useUsers";
import { useItems } from "../hooks/useItems";

export default function Dashboard() {
    // Ambil data user dan role dari localStorage
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const role = localStorage.getItem("role");

    // Ambil data transaksi, lokasi, users, dan items menggunakan custom hooks
    const { data: transaksi = [], isLoading: loadingTransaksi } = useTransactions();
    const { data: lokasi = [], isLoading: loadingLokasi } = useLocations();
    const { data: users = [], isLoading: loadingUsers } = useUsers();
    const { data: items = [], isLoading: loadingItems } = useItems();

    // State untuk ringkasan data
    const [summary, setSummary] = useState({
        produk: 0,
        lokasi: 0,
        users: 0,
        pending: 0,
    });

    // State untuk data transaksi terbaru, data grafik, dan statistik lainnya
    const [latestTransaksi, setLatestTransaksi] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [totalMasuk, setTotalMasuk] = useState(0);
    const [totalKeluar, setTotalKeluar] = useState(0);
    const [jumlahPending, setJumlahPending] = useState(0);
    const [jumlahApproved, setJumlahApproved] = useState(0);
    const [topProduk, setTopProduk] = useState([]);

    // State untuk filter tanggal dan produk
    const [filterTanggal, setFilterTanggal] = useState(null);
    const [filterProduk, setFilterProduk] = useState("");

    // State untuk daftar nama produk unik
    const [produkList, setProdukList] = useState([]);

    // useEffect untuk memproses data ketika data transaksi, lokasi, users, items, atau filter berubah
    useEffect(() => {
        if (
            loadingTransaksi ||
            loadingLokasi ||
            loadingUsers ||
            loadingItems
        ) {
            return; // Jika data masih loading, hentikan proses
        }

        // Ambil daftar nama produk unik dari data items
        const produkNama = [...new Set(items.map((i) => i.nama))];
        setProdukList(produkNama);

        // Filter data transaksi berdasarkan filter tanggal dan produk
        let filtered = [...transaksi];
        if (filterTanggal) {
            const filterDateString = filterTanggal.toISOString().split("T")[0];
            filtered = filtered.filter((t) => {
                // Extract date part from t.tanggal, assuming t.tanggal may include time
                const transactionDate = t.tanggal ? t.tanggal.split("T")[0] : "";
                return transactionDate === filterDateString;
            });
        }
        if (filterProduk) {
            filtered = filtered.filter((t) => {
                if (typeof t.produk === 'object' && t.produk !== null) {
                    return t.produk.nama === filterProduk;
                }
                return t.produk === filterProduk;
            });
        }

        // Pisahkan transaksi yang statusnya pending dan approved
        const pending = filtered.filter((t) => t.status === "pending");
        const approved = filtered.filter((t) => t.status === "approved");

        // Filter items by selected product if filterProduk is set
        const filteredItems = filterProduk ? items.filter(item => item.nama === filterProduk) : items;

        // Set ringkasan data produk, lokasi, user aktif, dan transaksi pending
        setSummary({
            produk: filteredItems.length,
            lokasi: lokasi.length,
            users: users.filter((u) => u.status === "aktif").length,
            pending: pending.length,
        });

        // Ambil 5 produk dengan stok terbanyak dari filtered items
        setTopProduk([...filteredItems].sort((a, b) => b.stok - a.stok).slice(0, 5));
        // Ambil 5 transaksi terbaru setelah filter
        setLatestTransaksi(filtered.slice(-5).reverse());
        // Hitung total barang masuk dan keluar
        setTotalMasuk(filtered.filter((t) => t.tipe === "masuk").reduce((sum, t) => sum + t.jumlah, 0));
        setTotalKeluar(filtered.filter((t) => t.tipe === "keluar").reduce((sum, t) => sum + t.jumlah, 0));
        // Hitung jumlah transaksi pending dan approved
        setJumlahPending(pending.length);
        setJumlahApproved(approved.length);
        // Generate data untuk grafik
        setChartData(generateChartData(filtered));
    }, [transaksi, lokasi, users, items, filterTanggal, filterProduk]);

    // Fungsi untuk mengekspor data transaksi ke file Excel
    const handleExportExcel = () => {
        let data = [...transaksi];

        if (filterTanggal) {
            const tanggalString = filterTanggal.toISOString().split("T")[0];
            data = data.filter((t) => t.tanggal === tanggalString);
        }
        if (filterProduk) {
            data = data.filter((t) => t.produk === filterProduk);
        }

        // Gunakan nama produk dari field produk yang sudah dipopulasi jika tersedia
        const dataWithProductName = data.map(tx => {
            return {
                ...tx,
                produk: tx.produk && typeof tx.produk === 'object' ? tx.produk.nama : tx.produk
            };
        });

        // Buat worksheet Excel dari data JSON
        const worksheet = XLSX.utils.json_to_sheet(dataWithProductName);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");

        // Buat file Excel dan simpan menggunakan file-saver
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, `Transaksi_SupzG_${Date.now()}.xlsx`);
    };

    // Data untuk grafik pie barang masuk dan keluar
    const pieData = [
        { name: "Masuk", value: totalMasuk },
        { name: "Keluar", value: totalKeluar },
    ];

    // Data untuk grafik donut status transaksi
    const donutData = [
        { name: "Pending", value: jumlahPending },
        { name: "Approved", value: jumlahApproved },
    ];

    // Warna untuk grafik pie dan donut
    const COLORS = ["#16a34a", "#dc2626"];
    const STATUS_COLORS = ["#facc15", "#4ade80"];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-1">Halo, {currentUser?.username}! 👋</h1>
            <p className="text-sm text-zinc-600 capitalize mb-6">
                Selamat datang di dashboard {role === "manager" ? "Manager" : "Staf"} SupzG!
            </p>

            {/* Filter */}
            <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
                <div>
                    <label className="block text-sm mb-1 font-medium">Filter Tanggal</label>
                    <DatePicker
                        selected={filterTanggal}
                        onChange={(date) => setFilterTanggal(date)}
                        dateFormat="yyyy-MM-dd"
                        className="px-3 py-2 border rounded"
                        placeholderText="Pilih tanggal"
                    />
                </div>
                <div>
                    <label className="block text-sm mb-1 font-medium">Filter Produk</label>
                    <select
                        value={filterProduk}
                        onChange={(e) => setFilterProduk(e.target.value)}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="">Semua Produk</option>
                        {produkList.map((nama) => (
                            <option key={nama} value={nama}>
                                {nama}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="self-end">
                    <button
                        onClick={handleExportExcel}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded"
                    >
                        Export ke Excel
                    </button>
                </div>
            </div>

            {/* Ringkasan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <SummaryCard title="Produk" value={summary.produk} color="bg-blue-100" />
                <SummaryCard title="Gudang" value={summary.lokasi} color="bg-yellow-100" />
                <SummaryCard title="User Aktif" value={summary.users} color="bg-green-100" />
                <SummaryCard title="Pending" value={summary.pending} color="bg-red-100" />
            </div>

            {/* Peringatan Produk Menipis */}
            <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded text-yellow-800">
                <h3 className="font-semibold mb-2">Peringatan: Produk Menipis</h3>
                {items.filter(item => item.stok <= 5).length === 0 ? (
                    <p>Tidak ada produk yang menipis.</p>
                ) : (
                    <ul className="list-disc list-inside max-h-40 overflow-auto">
                        {items.filter(item => item.stok <= 5).map(item => (
                            <li key={item._id || item.id}>
                                {item.nama} - Stok tersisa: {item.stok}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Grafik */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Pie */}
                <div className="bg-white p-4 shadow rounded">
                    <h2 className="font-bold mb-2 text-sm">Barang Masuk vs Keluar</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                label
                            >
                                {pieData.map((entry, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Donut */}
                <div className="bg-white p-4 shadow rounded">
                    <h2 className="font-bold mb-2 text-sm">Status Transaksi</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={donutData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                label
                            >
                                {donutData.map((entry, i) => (
                                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Line */}
                <div className="bg-white p-4 shadow rounded col-span-1 md:col-span-1">
                    <h2 className="font-bold mb-2 text-sm">Riwayat Transaksi</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="masuk" stroke="#16a34a" />
                            <Line type="monotone" dataKey="keluar" stroke="#dc2626" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Transaksi & Produk */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Transaksi Terbaru */}
                <div className="bg-white shadow rounded p-4">
                    <h2 className="text-lg font-bold mb-2">Transaksi Terbaru</h2>
                    {latestTransaksi.length === 0 ? (
                        <p className="text-sm text-zinc-500">Belum ada transaksi</p>
                    ) : (
                        <ul className="divide-y">
                    {latestTransaksi.map((tx) => (
                    <li key={tx._id || tx.id} className="py-2 text-sm flex justify-between">
                        <span>
                        {tx.produk?.nama || 'Produk tidak tersedia'} ({tx.tipe}) - {tx.jumlah} pcs
                        </span>
                        <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            tx.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                        >
                        {tx.status}
                        </span>
                    </li>
                    ))}

                        </ul>
                    )}
                </div>

                {/* Top Produk */}
                <div className="bg-white shadow rounded p-4">
                    <h2 className="text-lg font-bold mb-2">Top 5 Produk Terlaris</h2>
                    {topProduk.length === 0 ? (
                        <p className="text-sm text-zinc-500">Belum ada produk</p>
                    ) : (
                        <ul className="divide-y">
{topProduk.map((item, i) => (
    <li key={item._id || item.id || i} className="py-2 text-sm flex justify-between">
<span>{i + 1}. {item && item.nama ? item.nama : "Unknown Product"}</span>
    <span className="font-semibold">{item && item.stok ? item.stok : 0} pcs</span>
    </li>
))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Fungsi untuk mengenerate data grafik dari transaksi
 * Mengelompokkan jumlah barang masuk dan keluar per tanggal
 * Mengembalikan data untuk 7 hari terakhir
 */
function generateChartData(transactions) {
    const result = {};

    transactions.forEach((tx) => {
        const date = tx.tanggal;
        if (!result[date]) {
            result[date] = { name: date, masuk: 0, keluar: 0 };
        }
        if (tx.tipe === "masuk") result[date].masuk += tx.jumlah;
        if (tx.tipe === "keluar") result[date].keluar += tx.jumlah;
    });

    return Object.values(result).slice(-7); // ambil 7 hari terakhir
}
