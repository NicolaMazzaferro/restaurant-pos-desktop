import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useProductStore } from "../store/productStore";

interface Category {
  id: number;
  name: string;
}

export default function CategoryBar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedCategory, setCategory } = useProductStore();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
          ? res.data.data
          : [];
        setCategories(list);
      } catch (err) {
        console.error("Errore caricamento categorie:", err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-4 text-gray-500 text-sm">
        Caricamento categorie...
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 p-2 bg-gray-100 border-b border-gray-300">
      <button
        onClick={() => setCategory(null)}
        className={`px-4 py-2 rounded-md font-semibold transition cursor-pointer ${
          selectedCategory === null
            ? "bg-blue-700 text-white"
            : "bg-white text-blue-700 border border-blue-400 hover:bg-blue-100"
        }`}
      >
        Tutti
      </button>

      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => setCategory(c.id)}
          className={`px-4 py-2 rounded-md font-semibold transition ${
            selectedCategory === c.id
              ? "bg-blue-700 text-white"
              : "bg-white text-blue-700 border border-blue-400 hover:bg-blue-100 cursor-pointer"
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
