// src/components/tables/CategoryTable.tsx
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";

interface Category {
  id: number;
  name: string;
  products_count?: number;
}

interface Props {
  categories: Category[];
  loading: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onBulkDelete?: (ids: number[]) => void;
}

export default function CategoryTable({
  categories,
  loading,
  onEdit,
  onDelete,
  onBulkDelete,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (selectAll) setSelectedIds(categories.map((c) => c.id));
    else setSelectedIds([]);
  }, [selectAll, categories]);

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
      setSelectAll(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl shadow bg-white ring-1 ring-gray-200">
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={(e) => setSelectAll(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <span className="font-medium text-gray-700 text-sm">Seleziona tutto</span>
        </div>

        <button
          onClick={handleBulkDelete}
          disabled={selectedIds.length === 0 || loading}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            selectedIds.length > 0
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          <TrashIcon className="w-4 h-4" />
          Elimina selezionati
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="w-10 px-4 py-3"></th>
              <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-700">
                Categoria
              </th>
              <th scope="col" className="px-6 py-3 text-right font-semibold text-gray-700">
                Azioni
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-gray-500">
                  <div className="flex justify-center items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Caricamento categorie...
                  </div>
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-gray-400 italic">
                  Nessuna categoria trovata
                </td>
              </tr>
            ) : (
              categories.map((cat, idx) => (
                <tr
                  key={cat.id}
                  className={`transition-colors hover:bg-gray-50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  {/* Checkbox singola */}
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(cat.id)}
                      onChange={() => toggleSelection(cat.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </td>

                  {/* Nome + badge conteggio (inline, stessa colonna) */}
                    <td className="px-6 py-3">
                        <div className="flex items-center justify-between w-50">
                            <span className="text-gray-800 font-medium">{cat.name}</span>

                            {(() => {
                            const count = cat.products_count ?? 0;
                            return (
                                <span
                                className="text-xs font-mono text-gray-400 "
                                title={`${count} ${count === 1 ? "prodotto" : "prodotti"}`}
                                >
                                {count} {count === 1 ? "prodotto" : "prodotti"}
                                </span>
                            );
                            })()}
                        </div>
                    </td>


                  {/* Azioni */}
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => onEdit(cat)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-blue-700 active:scale-[0.98] transition"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Modifica
                      </button>
                      <button
                        onClick={() => onDelete(cat)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-red-700 active:scale-[0.98] transition"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
