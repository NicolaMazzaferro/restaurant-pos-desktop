import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (price: number) => void;
};

export default function NumericPadModal({ isOpen, onClose, onConfirm }: Props) {
  const [input, setInput] = useState("0");

  const handleClick = (val: string) => {
    setInput((prev) => {
      if (prev === "0" && val !== ".") return val;
      if (val === "." && prev.includes(".")) return prev;
      return prev + val;
    });
  };

  const handleClear = () => setInput("0");
  const handleDelete = () => setInput((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
  const handleConfirm = () => {
    const parsed = parseFloat(input.replace(",", "."));
    if (!isNaN(parsed) && parsed > 0) {
      onConfirm(parsed);
      setInput("0");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-80 relative flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-lg font-semibold text-gray-800 mb-4">Inserisci prezzo</h2>

        <div className="text-4xl font-bold mb-4 text-gray-900 tabular-nums">
          € {input}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 w-full">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((val) => (
            <button
              key={val}
              onClick={() => (val === "⌫" ? handleDelete() : handleClick(val))}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-md text-lg"
            >
              {val}
            </button>
          ))}
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={handleClear}
            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300"
          >
            Cancella
          </button>
          <button
            onClick={handleConfirm}
            disabled={parseFloat(input) <= 0}
            className={`flex-1 py-2 rounded-md font-semibold text-white ${
              parseFloat(input) > 0
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
}
