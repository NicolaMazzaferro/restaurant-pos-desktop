import { useState } from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import type { Product } from "../store/cartStore";

export default function ProductCard({
  product,
  onAdd,
  imageFit = "cover", // "cover" | "contain"
}: {
  product: Product & { image_url?: string | null };
  onAdd: () => void;
  imageFit?: "cover" | "contain";
}) {
  const [animating, setAnimating] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  const handleClick = () => {
    onAdd();
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
  };

  const isVarie =
  product.name.toLowerCase() === "varie" || product.id === "varie";

  return (
    <div
      onClick={handleClick}
      className={`bg-white shadow rounded-lg p-3 cursor-pointer select-none transition-transform transform w-40
        ${animating ? "animate-pulseOnce" : "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"}
        ${isVarie ? "ring-4 ring-blue-600" : ""}`}
    >
      {/* Box immagine */}
      <div className="relative w-full aspect-[4/3] mb-2 overflow-hidden rounded-md bg-gray-100">
        {product.image_url && imgOk ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            draggable={false}
            onError={() => setImgOk(false)}
            className={`absolute inset-0 h-full w-full object-center
              ${imageFit === "contain" ? "object-contain p-1" : "object-cover"}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="flex flex-col items-center">
              <PhotoIcon className="w-8 h-8 mb-1" />
              <span className="text-[11px]">Nessuna immagine</span>
            </div>
          </div>
        )}
      </div>

      {/* Testi */}
      <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
        {product.name}
      </h3>
      <p className="text-gray-600 text-sm mt-1">€ {product.price.toFixed(2).replace(".", ",")}</p>
    </div>
  );
}
