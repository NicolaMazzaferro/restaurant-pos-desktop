// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// Previene la console extra su Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::OpenOptions;
use std::io::{BufWriter, Write};
use std::thread::sleep;
use std::time::Duration;
use chrono::Local;
use tauri::command;

// --- Costanti ESC/POS utili ---
const ESC: u8 = 0x1B;
const GS:  u8 = 0x1D;

// CP858 (Euro) -> ESC t 19  (vedi manuale Bixolon - Code Page 858)
const CP858: u8 = 19;
// Simbolo € in CP858 è 0xD5
const EURO:  u8 = 0xD5;

// Converte alcune lettere comuni IT in byte CP858 (fallback '?' per altro)
fn to_cp858_bytes(s: &str) -> Vec<u8> {
  let mut out = Vec::with_capacity(s.len());
  for ch in s.chars() {
    match ch {
      // euro (se mai arrivasse da UI)
      '€' => out.push(EURO),

      // minuscole accentate più comuni (mappa CP850/858)
      'à' => out.push(0x85),
      'è' => out.push(0x8A),
      'é' => out.push(0x82),
      'ì' => out.push(0x8D),
      'ò' => out.push(0x95),
      'ù' => out.push(0x97),

      // maiuscole (approssimazioni comuni)
      'À' => out.push(0xB7),
      'È' => out.push(0xD8),
      'É' => out.push(0x90),
      'Ì' => out.push(0xD6),
      'Ò' => out.push(0xE0),
      'Ù' => out.push(0xE3),

      // ASCII diretto
      _ if ch.is_ascii() => out.push(ch as u8),

      // fallback
      _ => out.push(b'?'),
    }
  }
  out
}

// Stampa una riga "NOME     QTA   €IMPORTO"
fn push_item_line(buf: &mut Vec<u8>, name: &str, qty: i32, line_total: f64) {
  // Nome in CP858 e taglio a 24 colonne (adatta se hai carta 80mm/58mm)
  let mut name_b = to_cp858_bytes(name);
  if name_b.len() > 24 { name_b.truncate(24); }

  // padding a destra fino a 24
  let pad = 24 - name_b.len();
  buf.extend_from_slice(&name_b);
  for _ in 0..pad { buf.push(b' '); }

  // quantità (3 colonne)
  let q = format!("{:>3}", qty);
  buf.extend_from_slice(q.as_bytes());
  buf.extend_from_slice(b"     "); // spazi

  // simbolo euro + totale riga allineato a 7 (xx.yy)
  buf.push(EURO);
  let amt = format!("{:>4.2}", line_total);
  buf.extend_from_slice(amt.as_bytes());
  buf.push(b'\n');
}

#[command]
fn print_receipt(items: Vec<(String, f64, i32)>, total: f64) -> Result<(), String> {
  // Porta COM virtuale BIXOLON
  let port_name = "\\\\.\\COM3";

  let port = OpenOptions::new()
    .write(true)
    .open(port_name)
    .map_err(|e| format!("Errore apertura porta {}: {}", port_name, e))?;

  let mut w = BufWriter::new(port);
  let mut buf: Vec<u8> = Vec::with_capacity(4096);

  // Init
  buf.extend_from_slice(&[ESC, b'@']);          // ESC @ (initialize)
  buf.extend_from_slice(&[ESC, b't', CP858]);   // ESC t 19 (code page 858 - Euro)
  buf.extend_from_slice(&[ESC, b'R', 0]);       // ESC R 0 (International: USA) – neutro

  // Stile base
  buf.extend_from_slice(&[ESC, b'!', 0x00]);    // carattere normale

   // --- Header centrato ---
  buf.extend_from_slice(&[ESC, b'a', 1]);       // align center

  // (Allinea esattamente al centro pagina per testo grande)
  buf.extend_from_slice(&[ESC, b'd', 0]);       // feed nullo (reset posizione)
  
  // --- Titolo principale in grassetto e doppia altezza/larghezza ---
  buf.extend_from_slice(&[ESC, b'E', 1]);       // Bold ON
  buf.extend_from_slice(&[ESC, b'!', 0x30]);    // Doppia altezza + larghezza
  buf.extend_from_slice(to_cp858_bytes("A' VILLETTA\n").as_slice());

  // Ripristina font normale
  buf.extend_from_slice(&[ESC, b'E', 0]);       // Bold OFF
  buf.extend_from_slice(&[ESC, b'!', 0x00]);

  // (Riposiziona di nuovo per centraggio normale)
  buf.extend_from_slice(&[ESC, b'a', 1]);       // align center
  buf.extend_from_slice(&[ESC, b'd', 0]);       // feed nullo per allineamento visivo

  // --- Dettagli attività ---
  buf.extend_from_slice(to_cp858_bytes("Via G. Garibaldi 19\n").as_slice());
  buf.extend_from_slice(to_cp858_bytes("Gioiosa Ionica (RC)\n").as_slice());
  buf.extend_from_slice(to_cp858_bytes("Tel. 371 1823796\n").as_slice());
  buf.extend_from_slice(to_cp858_bytes("P. IVA 03121280808\n\n").as_slice());


  // --- Body a sinistra ---
  buf.extend_from_slice(&[ESC, b'a', 0]);       // align left
  buf.extend_from_slice(b"------------------------------------------\n");
  buf.extend_from_slice(b"PRODOTTO                  QTA   ");
  buf.push(EURO);
  buf.extend_from_slice(b"IMPORTO\n");
  buf.extend_from_slice(b"------------------------------------------\n");

  for (name, price, qty) in &items {
    let line_total = price * (*qty as f64);
    push_item_line(&mut buf, name, *qty, line_total);
  }

  buf.extend_from_slice(b"------------------------------------------\n");

  // --- Totale (in evidenza) ---
  buf.extend_from_slice(&[ESC, b'!', 0x10]); // doppia altezza
  let tot_label = to_cp858_bytes("TOTALE:");
  //  totale riga: largo 24 per label, poi spazi, poi € e importo a 6
  let mut line = Vec::new();
  line.extend_from_slice(&tot_label);
  // padding fino a 31 caratteri prima del simbolo €
  if tot_label.len() < 31 {
    for _ in 0..(31 - tot_label.len()) { line.push(b' '); }
  }
  line.push(EURO);
  line.extend_from_slice(format!("{:>6.2}\n", total).as_bytes());
  buf.extend_from_slice(&line);

  // ripristina font normale
  buf.extend_from_slice(&[ESC, b'!', 0x00]);

  // Data/ora
  let dt = Local::now().format("%d/%m/%Y %H:%M").to_string();
  buf.extend_from_slice(to_cp858_bytes(&format!("\nData: {}\n", dt)).as_slice());

  // Footer
  buf.extend_from_slice(&[ESC, b'a', 1]); // center
  buf.extend_from_slice(to_cp858_bytes("\nRitirare documento fiscale alla cassa.\nGrazie\n").as_slice());

  // Qualche feed per sicurezza
  buf.extend_from_slice(&[ESC, b'd', 4]); // ESC d 4 -> 4 line feed

  // Scrive tutto
  w.write_all(&buf).map_err(|e| format!("Errore scrittura: {}", e))?;
  w.flush().map_err(|e| format!("Errore flush: {}", e))?;

  // Attendi un attimo prima del taglio
  sleep(Duration::from_millis(200));

  // Taglio carta (full cut): GS V 0
  w.write_all(&[GS, b'V', 0]).map_err(|e| format!("Errore taglio carta: {}", e))?;
  w.flush().map_err(|e| format!("Errore flush finale: {}", e))?;

  Ok(())
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![print_receipt])
    .run(tauri::generate_context!())
    .expect("Errore avvio Tauri");
}
