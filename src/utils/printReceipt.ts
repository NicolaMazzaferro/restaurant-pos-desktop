import { invoke } from "@tauri-apps/api/core";
import type { CartItem } from "../store/cartStore";

/**
 * Invia al backend la richiesta di stampa del pre-conto.
 * La configurazione (intestazione, porta COM/IP ecc.) è letta dinamicamente
 * dal file `printer_config.json` nel backend Tauri.
 */
export async function printReceipt(items: CartItem[]) {
  if (!items.length) {
    console.warn("Nessun articolo da stampare.");
    return;
  }

  // Calcola totale e prepara i dati
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const formattedItems = items.map((i) => [i.name, i.price, i.quantity]);

  try {
    // Chiama il comando Tauri (legge la config dal backend)
    await invoke("print_receipt", { items: formattedItems, total });

    console.log("✅ Scontrino inviato alla stampante.");
  } catch (error) {
    console.error("❌ Errore stampa scontrino:", error);

    // Messaggio visivo (puoi sostituire con toast o modale)
    alert(
      `Errore durante la stampa dello scontrino.\n\n${
        (error as Error).message || error
      }`
    );
  }
}

/**
 * 🔹 (Opzionale) Test di connessione stampante
 * Verifica se la porta configurata in `printer_config.json` è accessibile.
 */
export async function testPrinterConnection(): Promise<boolean> {
  try {
    const result = await invoke<boolean>("test_printer_connection");
    console.log("Stampante raggiungibile:", result);
    return result;
  } catch (err) {
    console.error("Errore test connessione stampante:", err);
    return false;
  }
}
