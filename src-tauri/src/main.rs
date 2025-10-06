// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::OpenOptions;
use std::io::{BufWriter, Write};
use std::thread::sleep;
use std::time::Duration;
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{command, Manager};

#[derive(Serialize, Deserialize, Clone)]
struct PrinterConfig {
    header: String,
    address: String,
    city: String,
    phone: String,
    vat: String,
    printer_port: String,
}

/// Ritorna il percorso del file `printer_config.json`
fn get_config_path(app: &tauri::AppHandle) -> PathBuf {
    let mut path = app
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| std::env::current_dir().unwrap());
    path.push("printer_config.json");
    path
}

/// Legge la configurazione da file (crea quella predefinita se mancante)
fn read_or_create_config(app: &tauri::AppHandle) -> Result<PrinterConfig, String> {
    let path = get_config_path(app);

    if !path.exists() {
        let default = PrinterConfig {
            header: "PIZZERIA A VILLETTA".into(),
            address: "Via G. Garibaldi 19".into(),
            city: "Gioiosa Ionica (RC)".into(),
            phone: "Tel. 371 1823796".into(),
            vat: "P. IVA 03121280808".into(),
            printer_port: "\\\\.\\COM3".into(),
        };
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Errore creazione cartella: {}", e))?;
        }
        let json = serde_json::to_string_pretty(&default)
            .map_err(|e| format!("Errore serializzazione: {}", e))?;
        std::fs::write(&path, json)
            .map_err(|e| format!("Errore scrittura file: {}", e))?;
        return Ok(default);
    }

    let data = std::fs::read_to_string(&path)
        .map_err(|e| format!("Errore lettura configurazione: {}", e))?;
    serde_json::from_str(&data)
        .map_err(|e| format!("Errore parsing JSON: {}", e))
}

#[command]
fn get_printer_config(app: tauri::AppHandle) -> Result<PrinterConfig, String> {
    read_or_create_config(&app)
}

#[command]
fn save_printer_config(app: tauri::AppHandle, config: PrinterConfig) -> Result<(), String> {
    let path = get_config_path(&app);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Errore creazione cartella: {}", e))?;
    }
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Errore serializzazione: {}", e))?;
    std::fs::write(&path, json)
        .map_err(|e| format!("Errore salvataggio configurazione: {}", e))
}

// --- Costanti ESC/POS ---
const ESC: u8 = 0x1B;
const GS: u8 = 0x1D;
const CP858: u8 = 19; // Code page Euro
const EURO: u8 = 0xD5;

// --- Conversione testo in CP858 ---
fn to_cp858_bytes(s: &str) -> Vec<u8> {
    let mut out = Vec::with_capacity(s.len());
    for ch in s.chars() {
        match ch {
            '€' => out.push(EURO),
            'à' => out.push(0x85), 'è' => out.push(0x8A), 'é' => out.push(0x82),
            'ì' => out.push(0x8D), 'ò' => out.push(0x95), 'ù' => out.push(0x97),
            'À' => out.push(0xB7), 'È' => out.push(0xD8), 'É' => out.push(0x90),
            'Ì' => out.push(0xD6), 'Ò' => out.push(0xE0), 'Ù' => out.push(0xE3),
            _ if ch.is_ascii() => out.push(ch as u8),
            _ => out.push(b'?'),
        }
    }
    out
}

// --- Stampa una riga prodotto ---
fn push_item_line(buf: &mut Vec<u8>, name: &str, qty: i32, line_total: f64) {
    let mut name_b = to_cp858_bytes(name);
    if name_b.len() > 24 {
        name_b.truncate(24);
    }
    let pad = 24 - name_b.len();
    buf.extend_from_slice(&name_b);
    for _ in 0..pad {
        buf.push(b' ');
    }
    let q = format!("{:>3}", qty);
    buf.extend_from_slice(q.as_bytes());
    buf.extend_from_slice(b"   ");
    buf.push(EURO);
    buf.extend_from_slice(format!("{:>6.2}\n", line_total).as_bytes());
}

#[command]
fn print_receipt(app: tauri::AppHandle, items: Vec<(String, f64, i32)>, total: f64) -> Result<(), String> {
    let cfg = read_or_create_config(&app)?; // 🔹 Legge configurazione aggiornata
    let port_name = cfg.printer_port.clone();

    let port = OpenOptions::new()
        .write(true)
        .open(&port_name)
        .map_err(|e| format!("Errore apertura porta {}: {}", port_name, e))?;

    let mut w = BufWriter::new(port);
    let mut buf: Vec<u8> = Vec::with_capacity(4096);

    // Init stampante
    buf.extend_from_slice(&[ESC, b'@']);
    buf.extend_from_slice(&[ESC, b't', CP858]);
    buf.extend_from_slice(&[ESC, b'R', 0]);
    buf.extend_from_slice(&[ESC, b'!', 0x00]);

    // Header
    buf.extend_from_slice(&[ESC, b'a', 1]);
    buf.extend_from_slice(&[ESC, b'E', 1]);
    buf.extend_from_slice(&[ESC, b'!', 0x30]);
    buf.extend_from_slice(to_cp858_bytes(&(cfg.header + "\n")).as_slice());
    buf.extend_from_slice(&[ESC, b'E', 0]);
    buf.extend_from_slice(&[ESC, b'!', 0x00]);
    buf.extend_from_slice(to_cp858_bytes(&(cfg.address + "\n")).as_slice());
    buf.extend_from_slice(to_cp858_bytes(&(cfg.city + "\n")).as_slice());
    buf.extend_from_slice(to_cp858_bytes(&(cfg.phone + "\n")).as_slice());
    buf.extend_from_slice(to_cp858_bytes(&(cfg.vat + "\n\n")).as_slice());

    // Body
    buf.extend_from_slice(&[ESC, b'a', 0]);
    buf.extend_from_slice(b"------------------------------------------\n");
    buf.extend_from_slice(b"PRODOTTO                  QTA   ");
    buf.push(EURO);
    buf.extend_from_slice(b"IMPORTO\n");
    buf.extend_from_slice(b"------------------------------------------\n");

    for (name, price, qty) in &items {
        push_item_line(&mut buf, name, *qty, price * (*qty as f64));
    }

    buf.extend_from_slice(b"------------------------------------------\n");

    // Totale
    buf.extend_from_slice(&[ESC, b'!', 0x10]);
    let tot_label = to_cp858_bytes("TOTALE:");
    let mut line = Vec::new();
    line.extend_from_slice(&tot_label);
    if tot_label.len() < 31 {
        for _ in 0..(31 - tot_label.len()) {
            line.push(b' ');
        }
    }
    line.push(EURO);
    line.extend_from_slice(format!("{:>6.2}\n", total).as_bytes());
    buf.extend_from_slice(&line);
    buf.extend_from_slice(&[ESC, b'!', 0x00]);

    // Data e footer
    let dt = Local::now().format("%d/%m/%Y %H:%M").to_string();
    buf.extend_from_slice(to_cp858_bytes(&format!("\nData: {}\n", dt)).as_slice());
    buf.extend_from_slice(&[ESC, b'a', 1]);
    buf.extend_from_slice(to_cp858_bytes("\nRitirare documento fiscale alla cassa.\nGrazie!\n").as_slice());
    buf.extend_from_slice(&[ESC, b'd', 4]);

    w.write_all(&buf).map_err(|e| format!("Errore scrittura: {}", e))?;
    w.flush().map_err(|e| format!("Errore flush: {}", e))?;
    sleep(Duration::from_millis(200));
    w.write_all(&[GS, b'V', 0]).map_err(|e| format!("Errore taglio carta: {}", e))?;
    w.flush().map_err(|e| format!("Errore flush finale: {}", e))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            print_receipt,
            get_printer_config,
            save_printer_config
        ])
        .run(tauri::generate_context!())
        .expect("Errore avvio Tauri");
}
