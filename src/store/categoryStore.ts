import { create } from "zustand";
import { api } from "../api/client";

interface Category {
  id: number;
  name: string;
}

interface CategoryStore {
  categories: Category[];
  loading: boolean;
  fetchCategories: (force?: boolean) => Promise<void>;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  removeCategory: (id: number) => void;
  setCategories: (categories: Category[]) => void;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  loading: false,
  
  setCategories: (categories) => set({ categories }),

  fetchCategories: async (force = false) => {
    // evita ricarichi inutili
    if (get().categories.length > 0 && !force) return;

    set({ loading: true });
    try {
      const res = await api.get("/categories");
      const data = res.data.data || res.data;
      set({ categories: data });
    } finally {
      set({ loading: false });
    }
  },

  addCategory: (category) =>
    set((state) => ({
      categories: [...state.categories, category],
    })),

  updateCategory: (category) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === category.id ? category : c
      ),
    })),

  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
}));
