/* eslint-disable @typescript-eslint/no-explicit-any */
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import Toast from "../../components/Toast";
import { AnimatePresence } from "framer-motion";

type PrinterConfig = {
  id: string;
  name: string;
  model?: string;
  header: string;
  address: string;
  city: string;
  phone: string;
  vat: string;
  printer_port: string;
};

const LABELS: Record<keyof Omit<PrinterConfig, "id" | "name" | "model">, string> = {
  header: "Intestazione",
  address: "Indirizzo",
  city: "Città",
  phone: "Telefono",
  vat: "Partita IVA",
  printer_port: "Porta stampante (COM) o IP:PORT",
};

const PLACEHOLDERS: Partial<Record<keyof PrinterConfig, string>> = {
  header: "PIZZERIA A VILLETTA",
  address: "Via G. Garibaldi 19",
  city: "Gioiosa Ionica (RC)",
  phone: "Tel. 371 1823796",
  vat: "P. IVA 03121280808",
  printer_port: "\\\\.\\COM3 o 192.168.1.21:9101",
};

export default function PrinterSettings() {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "delete"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "delete", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 6200);
  };

  const activePrinter = printers.find((p) => p.id === activeId) || null;

  // Carica configurazioni
  useEffect(() => {
    setLoading(true);
    invoke("get_printer_configs")
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          setPrinters(data);
          setActiveId(data[0].id);
        }
      })
      .catch((e) => showToast("error", `Errore nel caricamento: ${String(e)}`))
      .finally(() => setLoading(false));
  }, []);

  const addPrinter = () => {
    const newPrinter: PrinterConfig = {
      id: crypto.randomUUID(),
      name: `Stampante ${printers.length + 1}`,
      model: "bixolon",
      header: "",
      address: "",
      city: "",
      phone: "",
      vat: "",
      printer_port: "",
    };
    setPrinters((prev) => [...prev, newPrinter]);
    setActiveId(newPrinter.id);
  };

  const removePrinter = (id: string) => {
    setPrinters((prev) => prev.filter((p) => p.id !== id));
    if (activeId === id) setActiveId(null);
    showToast("delete", "Stampante rimossa.");
  };

  const handleFieldChange = (field: keyof PrinterConfig, value: string) => {
    setPrinters((prev) =>
      prev.map((p) => (p.id === activeId ? { ...p, [field]: value } : p))
    );
  };

  const handleSaveAll = async () => {
    try {
      setLoading(true);
      await invoke("save_printer_configs", { printers });
      showToast("success", "Configurazioni salvate correttamente.");
    } catch (e) {
      showToast("error", `Errore salvataggio: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPrint = async () => {
    if (!activePrinter) return;
    try {
      setLoading(true);
      await invoke("print_receipt", {
        printer: activePrinter,
        items: [["Pizza Margherita", 5.0, 1]],
        total: 5.0,
      });
      showToast("success", `🖨️ Test di stampa inviato a ${activePrinter.name}.`);
    } catch (e) {
      showToast("error", `Errore stampa: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] w-full flex items-stretch justify-center bg-gray-50">
      <div className="flex w-full max-w-5xl bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 border-r border-gray-200 bg-gray-50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Stampanti</h3>
            <ul className="space-y-1">
              {printers.map((p) => (
                <li
                  key={p.id}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${
                    activeId === p.id
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveId(p.id)}
                >
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={addPrinter}
            disabled={loading}
            className="mt-3 w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            + Aggiungi
          </button>
        </aside>

        {/* Dettaglio stampante */}
        {activePrinter ? (
          <div className="flex-1 p-6">
            <div className="flex justify-between items-center mb-5">
              <input
                type="text"
                value={activePrinter.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className="text-lg font-semibold border-b border-gray-200 focus:border-blue-500 outline-none pb-1 w-1/2"
              />
              <button
                onClick={() => removePrinter(activePrinter.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Elimina
              </button>
            </div>

            {/* Selezione modello */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Modello Stampante</label>
              <select
                value={activePrinter.model || "bixolon"}
                onChange={(e) => handleFieldChange("model", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="bixolon">Bixolon (ESC/POS)</option>
                <option value="hydra">Hydra SF-20</option>
                <option value="epson">Epson TM</option>
                <option value="custom">Custom KUBE</option>
              </select>
            </div>

            <div className="grid gap-4">
              {(Object.keys(LABELS) as (keyof Omit<PrinterConfig, "id" | "name" | "model">)[]).map(
                (field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {LABELS[field]}
                    </label>
                    <input
                      type="text"
                      value={activePrinter[field] ?? ""}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      placeholder={PLACEHOLDERS[field] || ""}
                      disabled={loading}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 shadow-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                )
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={handleTestPrint}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300
                           px-4 py-2.5 text-gray-800 bg-white hover:bg-gray-50 disabled:opacity-60"
              >
                🖨️ Test Stampa
              </button>

              <button
                onClick={handleSaveAll}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5
                           bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                💾 Salva Tutte
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Seleziona o aggiungi una stampante
          </div>
        )}
      </div>

      <AnimatePresence>{toast && <Toast type={toast.type} message={toast.message} />}</AnimatePresence>
    </div>
  );
}
