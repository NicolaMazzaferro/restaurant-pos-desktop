/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCartStore } from "../store/cartStore";
import { MinusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { printReceipt } from "../utils/printReceipt";
import { printFiscalReceipt } from "../utils/printFiscalReceipt";
import { useState } from "react";
import ExtraModal from "./ExtraModal";

export default function CartSummary() {
  const { items, decrementQuantity, clearCart, addExtraToItem } = useCartStore();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [extraModalOpen, setExtraModalOpen] = useState(false);

  const total = items.reduce((sum, i) => {
    const base = i.price;
    const extrasTotal = i.extras.reduce((s, e) => s + e.price, 0);
    return sum + (base + extrasTotal) * i.quantity;
  }, 0);

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-gray-700">Carrello</h3>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 transition"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Svuota</span>
          </button>
        )}
      </div>

      {/* Lista prodotti */}
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <p className="text-gray-400 text-center mt-4">Carrello vuoto</p>
        ) : (
          <ul className="space-y-3">
            {items.map((i) => {
              const extrasTotal = i.extras.reduce((s, e) => s + e.price, 0);
              const lineTotal = (i.price + extrasTotal) * i.quantity;

              return (
                <li
                  key={i.cartKey}
                  onClick={() => {
                    setSelectedItem(i);
                    setExtraModalOpen(true);
                  }}
                  className="flex justify-between items-start bg-white shadow-sm rounded-md p-3 cursor-pointer hover:bg-gray-50 transition"
                >
                  {/* Sezione sinistra: nome + extra */}
                  <div className="flex-1 min-w-0">
                    <span className="block font-medium text-gray-800 truncate">
                      {i.name}
                    </span>
                    <span className="text-gray-500 text-sm block">
                      € {i.price.toFixed(2).replace(".", ",")}
                    </span>

                    {/* Lista extra (nome + prezzo visibile) */}
                    {i.extras.length > 0 && (
                      <ul className="mt-1 text-sm text-gray-600 space-y-0.5">
                        {i.extras.map((e) => (
                          <li
                            key={e.id}
                            className="flex justify-between gap-2 flex-wrap"
                          >
                            <span className="truncate max-w-[75%]">
                              + {e.name}
                            </span>
                            <span className="text-nowrap">
                              € {e.price.toFixed(2).replace(".", ",")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Sezione destra: quantità + totale + bottone */}
                  <div className="flex flex-col items-end gap-1 min-w-[70px] text-right">
                    <span className="font-bold text-gray-800">x{i.quantity}</span>
                    <span className="font-semibold text-gray-800">
                      €{lineTotal.toFixed(2).replace(".", ",")}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        decrementQuantity(i.cartKey);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center mt-1"
                      title="Rimuovi o decrementa"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Totale */}
      <div className="mt-4 border-t border-gray-200 pt-3">
        <div className="flex justify-between items-center">
          <p className="font-bold text-gray-700 text-lg">Totale:</p>
          <p className="font-extrabold text-xl text-gray-900">
            €{total.toFixed(2).replace(".", ",")}
          </p>
        </div>

        <button
          className="w-full mt-4 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 font-semibold cursor-pointer"
          onClick={() => printReceipt(items)}
        >
          Stampa Preconto
        </button>
        <button
          className="w-full mt-3 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-semibold cursor-pointer"
          onClick={() => printFiscalReceipt(items)}
        >
          Stampa Scontrino Fiscale
        </button>
      </div>

      {/* Modale Extra */}
      <ExtraModal
        isOpen={extraModalOpen}
        onClose={() => setExtraModalOpen(false)}
        onConfirm={(name, price) => {
          if (selectedItem) {
            addExtraToItem(selectedItem.cartKey, {
              id: `extra-${Date.now()}`,
              name,
              price,
            });
          }
          setExtraModalOpen(false);
        }}
      />
    </div>
  );
}
