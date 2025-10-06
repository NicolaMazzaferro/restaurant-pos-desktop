import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  Cog8ToothIcon,
  PowerIcon,
} from "@heroicons/react/24/solid";
import { useProductStore } from "../../store/productStore";
import { useAuthStore } from "../../store/authStore";
import { getCurrentWindow } from "@tauri-apps/api/window";
// se vuoi l'uscita “hard”:
// import { exit } from "@tauri-apps/plugin-process";

export default function Navbar() {
  const navigate = useNavigate();
  const { fetchProducts } = useProductStore();
  const { role, name, hydrateFromStorage, logout } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { hydrateFromStorage(); }, [hydrateFromStorage]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setUserMenuOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleExit = async () => {
    try {
      setUserMenuOpen(false);
      const win = getCurrentWindow();
      await (await win).close();               // tenta la chiusura “gentile”
      // se hai listener che intercettano closeRequested, puoi forzare:
      // await (await win).destroy();
    } catch (err) {
      console.error("Chiudi finestra fallito:", err);
      // fallback “hard” se hai il plugin process:
      // await exit(0);
    }
  };

  const initials = (name?.trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join("") || "OP");

  return (
    <>
      <header className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="font-bold text-lg">A Villetta</div>

        <div className="flex items-center gap-3 text-sm">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="flex items-center gap-2 ps-1 pe-2 py-1 rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/15 cursor-pointer"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              title="Operatore"
            >
              <div className="w-7 h-7 rounded-full bg-white/20 grid place-items-center font-semibold">
                {initials}
              </div>
              <span className="hidden md:inline font-medium">{name ?? "Operatore"}</span>
            </button>

            {userMenuOpen && (
              <div role="menu" className="absolute right-0 mt-2 min-w-48 rounded-lg bg-white text-gray-800 shadow-lg ring-1 ring-black/10 overflow-hidden z-50">
                {role === "admin" && (
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate("/admin"); }}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    role="menuitem"
                  >
                    <Cog8ToothIcon className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">Gestisci</span>
                  </button>
                )}

                <div className="my-1 h-px bg-gray-100" />

                <button
                  onClick={() => { setUserMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  role="menuitem"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-600" />
                  <span className="text-red-700 font-medium">Logout</span>
                </button>

                <div className="my-1 h-px bg-gray-100" />

                <button
                  onClick={handleExit}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  role="menuitem"
                >
                  <PowerIcon className="w-5 h-5 text-red-600" />
                  <span className="text-red-700 font-medium">Esci</span>
                </button>
              </div>
            )}
          </div>

          {/* Refresh prodotti */}
          <button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-500 p-2 rounded-full transition cursor-pointer"
            title="Aggiorna prodotti"
          >
            <ArrowPathIcon className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          {/* Navigazione */}
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded cursor-pointer"
          >
            Prodotti
          </button>
        </div>
      </header>

      {/* Overlay aggiornamento prodotti */}
      {refreshing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-white">
          <ArrowPathIcon className="w-10 h-10 animate-spin mb-4 text-blue-300" />
          <p className="text-2xl font-semibold tracking-wide">Aggiornamento Prodotti…</p>
        </div>
      )}
    </>
  );
}
