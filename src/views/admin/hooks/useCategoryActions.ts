/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/hooks/useCategoryActions.ts
import { useCategoryStore } from "../../../store/categoryStore";
import { api } from "../../../api/client";
import { useState, useCallback } from "react";

export function useCategoryActions() {
  const { categories, setCategories, addCategory, updateCategory, removeCategory } =
    useCategoryStore();

  const [toast, setToast] = useState<{
    type: "success" | "error" | "delete";
    message: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  const showToast = (type: "success" | "error" | "delete", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  /** 🔹 Recupera categorie (con cache opzionale) */
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/categories");
      setCategories(res.data.data || res.data);
    } catch {
      showToast("error", "Errore durante il caricamento delle categorie.");
    } finally {
      setLoading(false);
    }
  }, [setCategories]);

  /** 🔹 Crea o aggiorna categoria */
  const saveCategory = async (
    data: { name: string },
    editingCategory?: { id: number; name: string },
    onSuccess?: () => void
  ) => {
    setSaving(true);
    try {
      if (editingCategory) {
        const res = await api.put(`/categories/${editingCategory.id}`, data);
        updateCategory(res.data.data || res.data);
        showToast("success", `Categoria "${data.name}" aggiornata.`);
      } else {
        const res = await api.post("/categories", data);
        addCategory(res.data.data || res.data);
        showToast("success", `Categoria "${data.name}" creata.`);
      }

      onSuccess?.();
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.errors?.name?.[0] ||
        error?.response?.data?.message ||
        "Errore durante il salvataggio.";
      showToast("error", backendMessage);
    } finally {
      setSaving(false);
    }
  };

  /** 🔹 Elimina singola categoria */
  const deleteCategory = async (id: number, name: string, onSuccess?: () => void) => {
    setDeleting(true);
    try {
      await api.delete(`/categories/${id}`);
      removeCategory(id);
      showToast("delete", `Categoria "${name}" eliminata.`);
      onSuccess?.();
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.errors?.category?.[0] ||
        error?.response?.data?.message ||
        "Errore durante l'eliminazione.";
      showToast("error", backendMessage);
    } finally {
      setDeleting(false);
    }
  };

    /** 🔹 Eliminazione multipla (bulk) con controllo backend */
    const bulkDeleteCategories = async (ids: number[]) => {
    if (!ids.length) return;

    setDeleting(true);
    try {
        // ✅ POST per inviare body JSON
        const res = await api.post("/categories/bulk-delete", {
        ids: ids.map((id) => Number(id)),
        });

        const { deleted = 0, failed = [] } = res.data;

        // ✅ Calcola solo gli ID effettivamente eliminati
        const failedIds = failed.map((f: any) => f.id);
        const deletedIds = ids.filter((id) => !failedIds.includes(id));

        // ✅ Rimuovi solo le categorie davvero eliminate
        deletedIds.forEach((id) => removeCategory(id));

        // ✅ Messaggio chiaro
        let msg = "";
        if (deleted > 0) msg += `Eliminate ${deleted} categorie. `;
        if (failed.length > 0)
        msg += `${failed.length} non eliminate (prodotti associati).`;

        showToast(deleted > 0 ? "delete" : "error", msg.trim());
    } catch (error: any) {
        const backendMessage =
        error?.response?.data?.message ||
        "Errore durante l'eliminazione multipla.";
        showToast("error", backendMessage);
    } finally {
        setDeleting(false);
    }
    };

  return {
    categories,
    fetchCategories,
    toast,
    saving,
    deleting,
    loading,
    saveCategory,
    deleteCategory,
    bulkDeleteCategories,
  };
}
