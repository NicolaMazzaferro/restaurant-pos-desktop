import { Squares2X2Icon, TagIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import SidebarMenu from "../../components/SidebarMenu";
import CategoriesAdmin from "./CategoryAdmin";
import ProductsAdmin from "./ProductsAdmin";
import { AnimatePresence, motion } from "framer-motion";
import { PrinterIcon } from "lucide-react";
import PrinterSettings from "./PrinterSettings";

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState<"products" | "categories" | "printer">("products");

  const menuItems = [
    {
      id: "products",
      label: "Gestisci Prodotti",
      icon: <Squares2X2Icon className="w-5 h-5" />,
      active: activeSection === "products",
      onClick: () => setActiveSection("products"),
    },
    {
      id: "categories",
      label: "Gestisci Categorie",
      icon: <TagIcon className="w-5 h-5" />,
      active: activeSection === "categories",
      onClick: () => setActiveSection("categories"),
    },
    {
      id: "printer",
      label: "Impostazioni Scontrino",
      icon: <PrinterIcon className="w-5 h-5" />,
      active: activeSection === "printer",
      onClick: () => setActiveSection("printer"),
    }
  ];

  return (
    <div className="flex h-full">
      <SidebarMenu title="Pannello Admin" items={menuItems} />

      <main className="flex-1 p-6 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Mantiene entrambi i componenti montati */}
            <div className={`${activeSection === "products" ? "block" : "hidden"}`}>
              <ProductsAdmin />
            </div>
            <div className={`${activeSection === "categories" ? "block" : "hidden"}`}>
              <CategoriesAdmin />
            </div>
            <div className={`${activeSection === "printer" ? "block" : "hidden"}`}>
              <PrinterSettings />
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
