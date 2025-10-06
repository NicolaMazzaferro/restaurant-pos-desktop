// src/store/authStore.ts
import { create } from "zustand";

interface AuthState {
  token: string | null;
  name: string | null;
  role: "admin" | "cashier" | null;
  setAuth: (data: { token: string; name: string; role: "admin" | "cashier" }) => void;
  logout: () => void;
  hydrateFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  name: localStorage.getItem("name"),
  role: (localStorage.getItem("role") as AuthState["role"]) ?? null,

  setAuth: ({ token, name, role }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("name", name);
    localStorage.setItem("role", role);
    set({ token, name, role });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    window.location.href = "/login";
  },

  hydrateFromStorage: () => {
    set({
      token: localStorage.getItem("token"),
      name: localStorage.getItem("name"),
      role: (localStorage.getItem("role") as AuthState["role"]) ?? null,
    });
  },
}));
