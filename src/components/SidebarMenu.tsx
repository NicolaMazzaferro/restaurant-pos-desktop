import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/solid";
import { useAuthStore } from "../store/authStore";
import type { ReactNode } from "react";

interface SidebarMenuProps {
  title?: string;
  items: {
    id: string;
    label: string;
    icon?: ReactNode;
    active: boolean;
    onClick: () => void;
  }[];
}

export default function SidebarMenu({ title, items }: SidebarMenuProps) {
  const { logout } = useAuthStore();

  return (
    <aside className="w-64 bg-gray-100 border-r p-4 overflow-y-auto flex flex-col h-full">
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={item.onClick}
              className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-md transition cursor-pointer ${
                item.active
                  ? "bg-blue-600 text-white"
                  : "bg-white hover:bg-gray-200 text-gray-800"
              }`}
            >
              {item.icon && <span className="w-5 h-5">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      <div className="pt-4 border-t">
        <div
          onClick={logout}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition cursor-pointer p-2 rounded-md"
        >
          <ArrowLeftStartOnRectangleIcon className="w-6 h-6" />
          <span className="font-medium">Logout</span>
        </div>
      </div>
    </aside>
  );
}
