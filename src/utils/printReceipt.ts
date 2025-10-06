import { invoke } from "@tauri-apps/api/core";
import type { CartItem } from "../store/cartStore";

export async function printReceipt(items: CartItem[]) {
  if (!items.length) return;

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const formatted = items.map((i) => [i.name, i.price, i.quantity]);

  try {
    await invoke("print_receipt", { items: formatted, total });
  } catch (err) {
    console.error("Errore stampa scontrino:", err);
  }
}
