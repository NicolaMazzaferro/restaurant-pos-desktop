import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, XCircleIcon, TrashIcon } from "@heroicons/react/24/solid";
import { createPortal } from "react-dom";

interface ToastProps {
  type: "success" | "error" | "delete";
  message: string | string[];
}

export default function Toast({ type, message }: ToastProps) {
  const bgColor =
    type === "success"
      ? "bg-green-600"
      : type === "delete"
      ? "bg-green-600"
      : "bg-red-600";

  const Icon =
    type === "success"
      ? CheckCircleIcon
      : type === "delete"
      ? TrashIcon
      : XCircleIcon;

  // Se è un array di messaggi, uniscili con a capo
  const formattedMessage = Array.isArray(message)
    ? message.join("\n")
    : message;

  const content = (
    <AnimatePresence>
      <motion.div
        key={formattedMessage} // per permettere ri-animazione su nuovo messaggio
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.3 }}
        className={`fixed bottom-6 right-6 z-[99999] pointer-events-auto
                    flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl ring-1 ring-black/10
                    text-white max-w-md whitespace-pre-line break-words ${bgColor}`}
        role="alert"
        aria-live="assertive"
      >
        <Icon className="w-6 h-6 mt-0.5 flex-shrink-0 text-white" />
        <span className="font-medium leading-snug text-sm">{formattedMessage}</span>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
