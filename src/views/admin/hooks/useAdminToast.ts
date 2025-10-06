// src/pages/admin/hooks/useAdminToast.ts
import { useState } from "react";

export function useAdminToast(duration = 4000) {
  const [toast, setToast] = useState<{ type: "success" | "error" | "delete"; message: string } | null>(
    null
  );

  const showToast = (type: "success" | "error" | "delete", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), duration);
  };

  return { toast, showToast };
}
