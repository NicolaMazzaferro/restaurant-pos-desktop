/* eslint-disable @typescript-eslint/no-explicit-any */
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import Toast from "../../components/Toast";
import { AnimatePresence } from "framer-motion";

type Config = {
  header: string;
  address: string;
  city: string;
  phone: string;
  vat: string;
  printer_port: string;
};

const LABELS: Record<keyof Config, string> = {
  header: "Intestazione",
  address: "Indirizzo",
  city: "Città",
  phone: "Telefono",
  vat: "Partita IVA",
  printer_port: "Porta stampante (COM o IP:porta)",
};

const PLACEHOLDERS: Partial<Record<keyof Config, string>> = {
  header: "PIZZERIA A VILLETTA",
  address: "Via G. Garibaldi 19",
  city: "Gioiosa Ionica (RC)",
  phone: "Tel. 371 1823796",
  vat: "P. IVA 03121280808",
  printer_port: "\\\\.\\COM3 oppure 192.168.1.64:9100",
};

export default function PrinterSettings() {
  const [config, setConfig] = useState<Config>({
    header: "",
    address: "",
    city: "",
    phone: "",
    vat: "",
    printer_port: "",
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "delete"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "delete", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    setLoading(true);
    invoke("get_printer_config")
      .then((data: any) => setConfig(data))
      .catch((e) => showToast("error", `Errore nel caricamento: ${String(e)}`))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as { name: keyof Config; value: string };
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await invoke("save_printer_config", { config });
      showToast("success", "Impostazioni salvate correttamente.");
    } catch (e) {
      showToast("error", `Errore salvataggio: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPrint = async () => {
    try {
      setLoading(true);
      await invoke("print_receipt", {
        items: [["Pizza Margherita", 5.0, 1]],
        total: 5.0,
      });
      showToast("success", "🖨️ Test di stampa inviato.");
    } catch (e) {
      showToast("error", `Errore stampa: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl ring-1 ring-black/5">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 text-center">Impostazioni Scontrino</h2>
          <p className="text-sm text-gray-500 text-center mt-1">
            Modifica intestazione e destinazione della stampante.
          </p>
        </div>

        <div className="px-6 py-6">
          <div className="grid gap-4">
            {(Object.keys(config) as (keyof Config)[]).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {LABELS[field]}
                </label>
                <input
                  type="text"
                  name={field}
                  value={config[field] ?? ""}
                  onChange={handleChange}
                  placeholder={PLACEHOLDERS[field] || ""}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={handleTestPrint}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300
                         px-4 py-2.5 text-gray-800 bg-white hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  <span>Stampando…</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 9V4h12v5h1a3 3 0 013 3v4a2 2 0 01-2 2h-2v3H7v-3H5a2 2 0 01-2-2v-4a3 3 0 013-3h1zm2-3h8v3H8V6zm8 14v-3H8v3h8z" />
                  </svg>
                  <span>Test Stampa</span>
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5
                         bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  <span>Salvando…</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 3H7a2 2 0 00-2 2v5h14V5a2 2 0 00-2-2zM5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7H5zm6 6H8v-4h3v4z" />
                  </svg>
                  <span>Salva Impostazioni</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>{toast && <Toast type={toast.type} message={toast.message} />}</AnimatePresence>
    </div>
  );
}
