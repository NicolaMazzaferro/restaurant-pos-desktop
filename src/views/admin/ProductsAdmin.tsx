/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

import ProductTable from "../../components/tables/ProductTable";
import Toast from "../../components/Toast";
import { useCategoryStore } from "../../store/categoryStore";
import { api } from "../../api/client";

import ConfirmModal from "../../components/modals/ConfirmModal";
import EditProductModal from "../../components/modals/EditProductModal";

export default function ProductsAdmin() {
  const { categories, fetchCategories } = useCategoryStore();

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<{ id: number; name: string } | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkIds, setBulkIds] = useState<number[]>([]);

  // 🔹 Toast helper
  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // 🔹 Carica categorie e prodotti all’avvio
  useEffect(() => {
    if (categories.length === 0) fetchCategories();
    fetchAllProducts();
  }, []);

  // 🔹 Caricamento globale prodotti
  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products?per_page=all");
      const products = Array.isArray(res.data?.data) ? res.data.data : [];
      setAllProducts(products);
      console.log("✅ Prodotti caricati:", products.length);
    } catch (error) {
      console.error("Errore fetch prodotti:", error);
      showToast("error", "Errore durante il caricamento dei prodotti.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Filtra i prodotti per categoria selezionata
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return allProducts.filter(
      (p) => Number(p.category?.id) === Number(selectedCategory.id)
    );
  }, [selectedCategory, allProducts]);

  // 🔹 CRUD Salvataggio
  const saveProduct = async (data: any) => {
    if (!selectedCategory) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("name", data.name);
      form.append("price", data.price.toString());
      form.append("category_id", selectedCategory.id.toString());
      if (data.image) form.append("image", data.image);
      if (data.remove_image) form.append("remove_image", "true");

      if (editingProduct) {
        await api.post(`/products/${editingProduct.id}?_method=PUT`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("success", `Prodotto “${data.name}” aggiornato.`);
      } else {
        await api.post("/products", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("success", `Prodotto “${data.name}” aggiunto.`);
      }

      await fetchAllProducts();
      await new Promise((r) => setTimeout(r, 300));
      setModalOpen(false);
      setEditingProduct(null);
    } catch (error: any) {
      const res = error?.response?.data;
      if (res?.errors) {
        const messages = Object.values(res.errors)
          .flat()
          .filter((m): m is string => typeof m === "string")
          .join("\n");
        showToast("error", messages);
      } else {
        showToast("error", res?.message || "Errore durante il salvataggio del prodotto.");
      }
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Eliminazione singola
  const deleteProduct = async (id: number, name: string, onSuccess?: () => void) => {
    setDeleting(true);
    try {
      await api.delete(`/products/${id}`);
      setAllProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("delete", `Prodotto “${name}” eliminato.`);
      if (onSuccess) onSuccess();
    } catch {
      showToast("error", "Errore durante l'eliminazione.");
    } finally {
      setDeleting(false);
    }
  };

  // 🔹 Eliminazione multipla
  const bulkDeleteProducts = async (ids: number[]) => {
    setDeleting(true);
    try {
      await Promise.all(ids.map((id) => api.delete(`/products/${id}`)));
      setAllProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
      showToast("delete", `Eliminati ${ids.length} prodotti.`);
    } catch {
      showToast("error", "Errore durante l'eliminazione multipla.");
    } finally {
      setDeleting(false);
    }
  };

  // ============================
  // 💠 RENDER
  // ============================

  return (
    <div>
      {!selectedCategory ? (
        <>
          <h2 className="text-2xl font-bold mb-4">Prodotti</h2>
          <p className="text-gray-500 mb-4">Seleziona una categoria per visualizzare i prodotti</p>

          {loading ? (
            <p className="text-gray-400">Caricamento prodotti...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className="cursor-pointer bg-white shadow border rounded-xl p-6 text-center hover:shadow-lg transition"
                >
                  <h3 className="font-semibold text-gray-800">{cat.name}</h3>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-1 text-blue-700 hover:text-blue-900 font-medium"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Indietro
              </button>
              <h2 className="text-2xl font-bold ml-3">{selectedCategory.name}</h2>
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setModalOpen(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              + Nuovo prodotto
            </button>
          </div>

          <ProductTable
            products={filteredProducts}
            loading={loading || deleting}
            onEdit={(p) => {
              setEditingProduct(p);
              setModalOpen(true);
            }}
            onDelete={(p) => {
              setDeleteTarget(p);
              setConfirmOpen(true);
            }}
            onBulkDelete={(ids) => {
              setBulkIds(ids);
              setBulkConfirmOpen(true);
            }}
          />

          {/* Modale Aggiungi/Modifica */}
          <EditProductModal
            open={modalOpen}
            title={editingProduct ? "Modifica prodotto" : "Nuovo prodotto"}
            loading={saving}
            defaultValues={
              editingProduct
                ? { name: editingProduct.name, price: editingProduct.price, image_url: editingProduct.image_url ?? null }
                : undefined
            }
            onCancel={() => {
              if (!saving) {
                setModalOpen(false);
                setEditingProduct(null);
              }
            }}
            onSave={saveProduct}
          />

          {/* Conferma Eliminazione Singola */}
          <ConfirmModal
            open={confirmOpen}
            title="Elimina prodotto"
            loading={deleting}
            onCancel={() => {
              if (!deleting) {
                setConfirmOpen(false);
                setDeleteTarget(null);
              }
            }}
            onConfirm={() => {
              if (deleteTarget) {
                deleteProduct(deleteTarget.id, deleteTarget.name, () => {
                  setConfirmOpen(false);
                  setDeleteTarget(null);
                });
              }
            }}
          >
            {deleteTarget && (
              <p>
                Vuoi davvero eliminare{" "}
                <span className="font-semibold text-slate-800">“{deleteTarget.name}”</span>?
              </p>
            )}
          </ConfirmModal>

          {/* Conferma Eliminazione Bulk */}
          <ConfirmModal
            open={bulkConfirmOpen}
            title="Elimina prodotti selezionati"
            loading={deleting}
            onCancel={() => {
              if (!deleting) setBulkConfirmOpen(false);
            }}
            onConfirm={() => {
              bulkDeleteProducts(bulkIds).then(() => setBulkConfirmOpen(false));
            }}
          >
            <p>
              Vuoi davvero eliminare{" "}
              <span className="font-semibold text-slate-800">{bulkIds.length}</span>{" "}
              prodotti selezionati?
            </p>
          </ConfirmModal>
        </>
      )}

      <AnimatePresence>{toast && <Toast type={toast.type} message={toast.message} />}</AnimatePresence>
    </div>
  );
}
