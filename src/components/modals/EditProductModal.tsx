import { XMarkIcon, PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export interface EditProductPayload {
  name: string;
  price: number;
  image?: File | null;
  remove_image?: boolean;
}

interface EditProductModalProps {
  open: boolean;
  title?: string;
  defaultValues?: { name?: string; price?: number; image_url?: string | null };
  loading?: boolean;
  onSave: (data: EditProductPayload) => void;
  onCancel: () => void;
}

export default function EditProductModal({
  open,
  title = "Modifica prodotto",
  defaultValues,
  loading = false,
  onSave,
  onCancel,
}: EditProductModalProps) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [price, setPrice] = useState(defaultValues?.price?.toString() ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(defaultValues?.image_url ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  useEffect(() => {
    if (open) {
      setName(defaultValues?.name ?? "");
      setPrice(defaultValues?.price?.toString() ?? "");
      setPreview(defaultValues?.image_url ?? null);
      setImage(null);
      setRemoveImage(false);
      setErrors({});
    }
  }, [open, defaultValues]);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Il nome è obbligatorio.";
    if (!price || isNaN(Number(price)) || Number(price) <= 0) e.price = "Prezzo non valido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ name: name.trim(), price: Number(price), image, remove_image: removeImage });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    setRemoveImage(true);
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
          {/* Contenitore principale */}
          <motion.div
            className="relative w-[680px] max-w-[92vw] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 px-8 py-7 overflow-hidden"
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ type: "spring", duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pulsante chiudi */}
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
                {/* Nome prodotto */}
                <div className="w-4/5 text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome prodotto
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
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>

                {/* Prezzo */}
                <div className="w-4/5 text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prezzo (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={loading}
                    className={`w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 ${
                      errors.price ? "border-red-400" : ""
                    }`}
                  />
                  {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price}</p>}
                </div>

                {/* Immagine prodotto */}
                <div className="w-4/5 text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Immagine prodotto
                  </label>

                  {preview ? (
                    <div className="relative inline-block">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={loading}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 disabled:opacity-60"
                        title="Rimuovi immagine"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 cursor-pointer hover:bg-gray-50 ${
                        loading ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      <PhotoIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-gray-500 text-sm">Clicca per caricare</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
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
