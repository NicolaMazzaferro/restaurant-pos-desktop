import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useCategoryActions } from "./hooks/useCategoryActions";
import { useModalManager } from "./hooks/useModalManager";
import CrudHeader from "../../components/layouts/CrudHeader";
import CategoryTable from "../../components/tables/CategoryTable";
import EditCategoryModal from "../../components/modals/EditCategoryModal";
import ConfirmModal from "../../components/modals/ConfirmModal";
import Toast from "../../components/Toast";

interface Category {
  id: number;
  name: string;
}

export default function CategoriesAdmin() {
  const {
    categories,
    fetchCategories,
    toast,
    saving,
    deleting,
    saveCategory,
    deleteCategory,
    bulkDeleteCategories,
  } = useCategoryActions();

  // 🔹 Gestione modali con hook riutilizzabile
  const editModal = useModalManager<Category>();
  const deleteModal = useModalManager<Category>();
  const bulkModal = useModalManager<number[]>();

  // Carica le categorie al mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const modalTitle = editModal.target ? "Modifica Categoria" : "Aggiungi Categoria";

  return (
    <div>
      {/* Header */}
      <CrudHeader
        title="Categorie"
        addLabel="+ Nuova Categoria"
        onAdd={() => editModal.openModal()}
      />

      {/* Tabella */}
      <CategoryTable
        categories={categories}
        loading={saving || deleting}
        onEdit={(cat) => editModal.openModal(cat)}
        onDelete={(cat) => deleteModal.openModal(cat)}
        onBulkDelete={(ids) => bulkModal.openModal(ids)}
      />

      {/* Modale Aggiungi / Modifica */}
      <EditCategoryModal
        open={editModal.open}
        loading={saving}
        title={modalTitle}
        defaultValues={editModal.target ? { name: editModal.target.name } : undefined}
        onCancel={() => {
          if (!saving) editModal.closeModal();
        }}
        onSave={(data) =>
          saveCategory(data, editModal.target, () => {
            editModal.closeModal();
          })
        }
      />

      {/* Modale Conferma Eliminazione Singola */}
      <ConfirmModal
        open={deleteModal.open}
        title="Elimina categoria"
        loading={deleting}
        onCancel={() => {
          if (!deleting) deleteModal.closeModal();
        }}
        onConfirm={() => {
          const target = deleteModal.target;
          if (target) {
            deleteCategory(target.id, target.name, () => {
              deleteModal.closeModal();
            });
          }
        }}
      >
        {deleteModal.target && (
          <p>
            Vuoi davvero eliminare{" "}
            <span className="font-semibold text-slate-800">“{deleteModal.target.name}”</span>?
          </p>
        )}
      </ConfirmModal>

      {/* Modale Eliminazione Multipla */}
      <ConfirmModal
        open={bulkModal.open}
        title="Elimina categorie selezionate"
        loading={deleting}
        onCancel={() => {
          if (!deleting) bulkModal.closeModal();
        }}
        onConfirm={() => {
          const ids = bulkModal.target;
          if (ids) {
            bulkDeleteCategories(ids).then(() => bulkModal.closeModal());
          }
        }}
      >
        {bulkModal.target && (
          <p>
            Vuoi davvero eliminare{" "}
            <span className="font-semibold text-slate-800">{bulkModal.target.length}</span>{" "}
            categorie selezionate?
          </p>
        )}
      </ConfirmModal>

      {/* Toast globale */}
      <AnimatePresence>
        {toast && <Toast type={toast.type} message={toast.message} />}
      </AnimatePresence>
    </div>
  );
}
