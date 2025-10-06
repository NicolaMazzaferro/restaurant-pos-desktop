// src/components/modals/ConfirmModal.tsx
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  children?: React.ReactNode;
}

export default function ConfirmModal({
  open,
  title = "Conferma azione",
  message = "Sei sicuro di voler procedere?",
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  onConfirm,
  onCancel,
  loading = false,
  children,
}: ConfirmModalProps) {
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
            transition={{ type: 'spring', duration: 0.25 }}
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
                  className="animate-spin h-7 w-7 text-red-600 mb-2"
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
                <p className="text-red-700 font-semibold">Eliminazione...</p>
              </div>
            )}

            {/* Contenuto modale */}
            <div className="text-center relative z-0">
              <h3 className="text-2xl font-bold tracking-tight mb-6">{title}</h3>

              {children ? (
                <div className="mx-auto max-w-[48ch] text-lg text-slate-600 leading-relaxed">
                  {children}
                </div>
              ) : (
                <p className="mx-auto max-w-[48ch] text-lg text-slate-600 leading-relaxed">
                  {message}
                </p>
              )}

              {/* Pulsanti */}
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-60"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {loading ? "Eliminazione..." : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
