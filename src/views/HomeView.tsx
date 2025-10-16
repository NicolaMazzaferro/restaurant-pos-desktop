import { useEffect, useState } from "react";
import { useProductStore } from "../store/productStore";
import { useCartStore } from "../store/cartStore";
import ProductCard from "../components/ProductCard";
import CartSummary from "../components/CartSummary";
import CategoryBar from "../components/CategoryBar";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function HomeView() {
  const { products, fetchProducts, loading, search, setSearch } = useProductStore();
  const { addToCart } = useCartStore();
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Carica tutti i prodotti solo all'avvio
  useEffect(() => {
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ricerca con debounce locale (non richiama il backend)
  const handleSearch = (value: string) => {
    setSearch(value);
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => {
      setSearch(value);
    }, 200);
    setTypingTimeout(timeout);
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <CategoryBar />

        {/* Barra di ricerca */}
        <div className="relative p-4">
          <MagnifyingGlassIcon
            className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Cerca prodotto..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border border-gray-400 focus-visible:border-gray-600 focus-visible:outline-none rounded-md p-2 pl-10 shadow-sm focus:ring-0"
          />
        </div>

        {/* Prodotti */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 p-4 overflow-auto flex-1 items-start content-start">
          {loading ? (
            <p className="col-span-full text-center text-gray-500">
              Caricamento prodotti...
            </p>
          ) : products.length > 0 ? (
            products.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={() => addToCart(p)} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-400">
              Nessun prodotto trovato
            </p>
          )}
        </div>
      </div>

      <div className="w-80 border-l border-gray-200 bg-white p-4">
        <CartSummary />
      </div>
    </div>
  );
}
