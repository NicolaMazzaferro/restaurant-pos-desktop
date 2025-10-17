import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (price: number) => void;
};

export default function ManualPriceModal({ isOpen, onClose, onConfirm }: Props) {
  const [price, setPrice] = useState<string>("");

  const handleConfirm = () => {
    const parsed = Number(price.replace(",", "."));
    if (!isNaN(parsed) && parsed > 0) {
      onConfirm(parsed);
      setPrice("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80 relative">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Inserisci prezzo manuale
        </h2>

        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0,00"
          inputMode="decimal"
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-400 text-center text-lg"
        />

        <button
          onClick={handleConfirm}
          disabled={!price}
          className={`w-full mt-4 py-2 rounded-md font-semibold ${
            price
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Conferma
        </button>
      </div>
    </div>
  );
}
