import { create } from "zustand";
import { api } from "../api/client";

interface Product {
  id: number;
  name: string;
  price: number;
  category?: { id: number; name: string } | null;
}

interface ProductStore {
  allProducts: Product[]; // tutti i prodotti caricati una volta
  products: Product[]; // prodotti filtrati localmente
  loading: boolean;
  selectedCategory: number | null;
  search: string;
  fetchProducts: () => Promise<void>;
  setCategory: (categoryId: number | null) => void;
  setSearch: (term: string) => void;
  applyFilters: () => void; // nuova funzione di filtro locale
}

export const useProductStore = create<ProductStore>((set, get) => ({
  allProducts: [],
  products: [],
  loading: false,
  selectedCategory: null,
  search: "",

  // Carica tutti i prodotti (una volta)
  fetchProducts: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/products?per_page=all");
      const data = res.data.data || res.data;
      set({ allProducts: data, products: data });
    } catch (err) {
      console.error("Errore caricamento prodotti:", err);
    } finally {
      set({ loading: false });
    }
  },

  // Filtro locale per categoria
  setCategory: (categoryId) => {
    set({ selectedCategory: categoryId });
    get().applyFilters();
  },

  // Filtro locale per testo
  setSearch: (term) => {
    set({ search: term });
    get().applyFilters();
  },

  // Applica filtro combinato (categoria + ricerca)
  applyFilters: () => {
    const { allProducts, selectedCategory, search } = get();

    const filtered = allProducts.filter((p) => {
      const matchCategory =
        !selectedCategory || p.category?.id === selectedCategory;
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchCategory && matchSearch;
    });

    set({ products: filtered });
  },
}));
