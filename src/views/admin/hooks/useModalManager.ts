import { useState } from "react";

/**
 * Hook generico per gestire l'apertura/chiusura delle modali
 * e mantenere un eventuale "target" (es. record da modificare o eliminare)
 */
export function useModalManager<T = undefined>() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<T | undefined>(undefined);

  const openModal = (data?: T) => {
    setTarget(data);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setTarget(undefined);
  };

  return { open, target, openModal, closeModal };
}
