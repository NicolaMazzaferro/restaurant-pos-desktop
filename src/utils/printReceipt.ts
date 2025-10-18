/* eslint-disable @typescript-eslint/no-explicit-any */
import { invoke } from "@tauri-apps/api/core";
import { api } from "../api/client";
import type { CartItem } from "../store/cartStore";

/**
 * Esegue la stampa del preconto (non fiscale).
 * Recupera automaticamente la prima stampante configurata dal backend
 * che non è di tipo "hydra".
 */
export async function printReceipt(items: CartItem[]) {
  if (!items.length) {
    alert("⚠️ Nessun articolo nel carrello.");
    return;
  }

  try {
    // 🔹 1. Legge la configurazione stampanti dal backend
    const response = await api.get<{ data: any[] }>("/printers");
    const printers = response.data.data;

    if (!Array.isArray(printers) || printers.length === 0) {
      alert("❌ Nessuna stampante configurata sul server.");
      return;
    }

    // 🔹 2. Seleziona la stampante predefinita (non Hydra)
    const printer = printers.find((p) => p.model !== "hydra") || printers[0];

    if (!printer) {
      alert("⚠️ Nessuna stampante disponibile per il preconto.");
      return;
    }

    // 🔹 3. Prepara i dati da inviare a Tauri
    const formattedItems = items.map((i) => [i.name, i.price, i.quantity]);
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // 🔹 4. Invoca il comando Tauri corretto
    await invoke("print_receipt", {
      printer,
      items: formattedItems,
      total,
    });

    console.log("🖨️ Stampa inviata con successo a", printer.name);
  } catch (error: any) {
    console.error("Errore stampa:", error);
    alert(
      `❌ Errore durante la stampa del preconto.\n\n${
        error?.response?.data?.message || error.message || String(error)
      }`
    );
  }
}
