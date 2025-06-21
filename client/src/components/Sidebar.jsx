import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    MapPin,
    Boxes,
    LogOut,
    FileClock,
} from "lucide-react";
import SupzGLogo from "../assets/Logo/SupzG-Logo-White.png";

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const role = localStorage.getItem("role");

    const managerMenu = [
        { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
        { to: "/users", label: "Manajemen User", icon: <Users size={18} /> },
        { to: "/locations", label: "Lokasi Gudang", icon: <MapPin size={18} /> },
        { to: "/inventory", label: "Inventaris", icon: <Boxes size={18} /> },
        { to: "/transactions", label: "Transaksi", icon: <FileClock size={18} /> },
    ];

    const staffMenu = [
        { to: "/staff-dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
        { to: "/inventory", label: "Inventaris", icon: <Boxes size={18} /> },
        { to: "/transactions", label: "Transaksi", icon: <FileClock size={18} /> },
    ];

    const menu = role === "manager" ? managerMenu : staffMenu;

    return (
        <>
        {/* Overlay backdrop */}
        <div
            className={`fixed inset-0  bg-opacity-10 z-40 transition-opacity duration-300 ${
                isOpen ? "opacity-100 visible" : "opacity-0 invisible"
            } sm:hidden`}
            onClick={onClose}
        />
        <aside
            className={`fixed inset-y-0 left-0 bg-zinc-900 bg-opacity-80 text-white w-64 p-4 z-50 transform transition-transform duration-300 ease-in-out
            ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 sm:static sm:inset-auto sm:flex-shrink-0 sm:block sm:min-h-screen`}
        >
        <a href={role === "staff" ? "/staff-dashboard" : "/dashboard"}>
            <img
                className="mb-6 w-40 mx-auto"
                src={SupzGLogo}
                alt="SupzG Logo"
            />
        </a>

        <nav className="space-y-2">
            {menu.map((item) => (
            <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-sm ${
                location.pathname === item.to ? "bg-zinc-800" : ""
                }`}
            >
                {item.icon}
                <span>{item.label}</span>
            </Link>
            ))}
        </nav>

        <div className="mt-10 pt-4 border-t border-zinc-700">
            <button
            onClick={() => {
                localStorage.clear();
                window.location.href = "/";
            }}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-red-600 bg-red-500 text-white w-full text-sm"
            >
            <LogOut size={18} />
            Logout
            </button>
        </div>
        </aside>
        </>
    );
}
