import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export interface EditCategoryPayload {
  name: string;
}

interface EditCategoryModalProps {
  open: boolean;
  title?: string;
  defaultValues?: EditCategoryPayload;
  loading?: boolean;
  onSave: (data: EditCategoryPayload) => void;
  onCancel: () => void;
}

export default function EditCategoryModal({
  open,
  title = "Modifica categoria",
  defaultValues,
  loading = false,
  onSave,
  onCancel,
}: EditCategoryModalProps) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (open) {
      setName(defaultValues?.name ?? "");
      setErrors({});
    }
  }, [open, defaultValues]);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Il nome è obbligatorio.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ name: name.trim() });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={loading ? undefined : onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Modale principale */}
          <motion.div
            className="relative w-[500px] max-w-[92vw] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 px-8 py-7 overflow-hidden"
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ type: "spring", duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pulsante chiusura */}
            <button
              onClick={onCancel}
              aria-label="Chiudi"
              disabled={loading}
              className="absolute right-3.5 top-3.5 grid h-9 w-9 place-items-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {/* Overlay di caricamento */}
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <svg
                  className="animate-spin h-7 w-7 text-blue-600 mb-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <p className="text-blue-700 font-semibold">Salvataggio...</p>
              </div>
            )}

            {/* Contenuto modale */}
            <div className="text-center relative z-0">
              <h3 className="text-2xl font-bold tracking-tight mb-6">{title}</h3>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
                {/* Nome categoria */}
                <div className="w-4/5 text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome categoria
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className={`w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? "border-red-400" : ""
                    }`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Pulsanti */}
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-60"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loading ? "Salvataggio..." : "Salva"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
