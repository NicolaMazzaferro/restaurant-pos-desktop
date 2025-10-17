/* eslint-disable @typescript-eslint/no-explicit-any */
import { invoke } from "@tauri-apps/api/core";

export async function printFiscalReceipt(cartItems: any[]) {
  try {
    // Ricava la stampante Hydra dalle impostazioni salvate
    const printers = (await invoke("get_printer_configs")) as any[];
    const hydraPrinter = printers.find((p) => p.model === "hydra");

    if (!hydraPrinter) {
      alert("⚠️ Nessuna stampante Hydra configurata!");
      return;
    }

    // Prepara gli articoli per l'XML Hydra
    const items = cartItems.map((i) => ({
      desc: i.name,
      qty: i.quantity,
      price: i.price,
      vat_code: "A", // o "B" o "C" in base al tipo di prodotto
    }));

    // Un solo pagamento (totale contante)
    const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const payments = [{ method: "Cash", amount: total }];

    // Chiamata Tauri
    await invoke("print_fiscal_receipt", {
      printer: hydraPrinter,
      items,
      payments,
      header: "Vendita Banco",
    });

    alert("✅ Scontrino fiscale inviato alla Hydra.");
  } catch (err) {
    alert(`❌ Errore stampa fiscale: ${String(err)}`);
  }
}
