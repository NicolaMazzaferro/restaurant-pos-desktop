import { useState } from "react";

export default function ExtraModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, price: number) => void;
}) {
  const [name, setName] = useState("Extra");
  const [price, setPrice] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    const parsed = parseFloat(price.replace(",", "."));
    if (isNaN(parsed)) {
      alert("Inserisci un prezzo valido");
      return;
    }
    onConfirm(name.trim() || "Extra", parsed);
    setName("Extra");
    setPrice("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 shadow-lg w-80">
        <h3 className="font-bold text-lg mb-4">Aggiungi Extra</h3>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded p-2"
            placeholder="Nome extra"
          />
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border rounded p-2"
            placeholder="Prezzo (€)"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Aggiungi
          </button>
        </div>
      </div>
    </div>
  );
}
