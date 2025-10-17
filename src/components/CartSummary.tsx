import { useCartStore } from "../store/cartStore";
import { MinusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { printReceipt } from "../utils/printReceipt";
import { printFiscalReceipt } from "../utils/printFiscalReceipt";

export default function CartSummary() {
  const { items, decrementQuantity, clearCart } = useCartStore();
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

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
            <TrashIcon className="w-4 h-4 cursor-pointer" />
            <span className="cursor-pointer">Svuota</span>
          </button>
        )}
      </div>

      {/* Lista prodotti */}
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <p className="text-gray-400 text-center mt-4">Carrello vuoto</p>
        ) : (
          <ul className="space-y-3">
            {items.map((i) => (
              <li
                key={i.id}
                className="flex justify-between items-center bg-white shadow-sm rounded-md p-3"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">{i.name}</span>
                  <span className="text-gray-500 text-sm">
                    € {i.price.toFixed(2).replace(".", ",")}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold w-6 text-center">
                      x{i.quantity}
                    </span>
                  </div>

                  <span className="font-semibold text-gray-800 w-16 text-right">
                    €{(i.price * i.quantity).toFixed(2).replace(".", ",")}
                  </span>
                  <button
                    onClick={() => decrementQuantity(i.id)}
                    className="bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center"
                    title="Rimuovi o decrementa"
                  >
                        <MinusIcon className="w-4 h-4 cursor-pointer" />
                    </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Totale */}
      <div className="mt-4">
        <hr className="mb-2" />
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
          className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-semibold cursor-pointer"
          onClick={() => printFiscalReceipt(items)}
        >
          Stampa Scontrino Fiscale
        </button>
      </div>
    </div>
  );
}
