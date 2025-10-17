/* eslint-disable @typescript-eslint/no-explicit-any */
import { invoke } from "@tauri-apps/api/core";
import type { CartItem } from "../store/cartStore";

/**
 * Esegue la stampa del preconto (non fiscale).
 * Recupera automaticamente la prima stampante configurata
 * che non è di tipo "hydra".
 */
export async function printReceipt(items: CartItem[]) {
  if (!items.length) {
    alert("⚠️ Nessun articolo nel carrello.");
    return;
  }

  try {
    // 🔹 1. Legge la configurazione stampanti dal backend
    const printers = (await invoke("get_printer_configs")) as any[];

    if (!printers || printers.length === 0) {
      alert("❌ Nessuna stampante configurata.");
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
      printer, // ✅ obbligatorio
      items: formattedItems,
      total,
    });

    
  } catch (error) {
    console.error("Errore stampa:", error);
    alert(
      `❌ Errore durante la stampa del preconto.\n\n${
        (error as Error).message || error
      }`
    );
  }
}
