#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    fs::{self, OpenOptions},
    io::{BufWriter, Write},
    net::TcpStream,
    path::PathBuf,
    thread::sleep,
    time::Duration,
};
use chrono::Local;
use serde::{Deserialize, Serialize};
use tauri::{command, Manager};

// ==============================
// 📦 STRUTTURE
// ==============================
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PrinterConfig {
    pub id: String,
    pub name: String,
    pub model: Option<String>,        // "hydra" | "bixolon" | "epson" | "rp850use" | "custom"
    pub header: String,
    pub address: String,
    pub city: String,
    pub phone: String,
    pub vat: String,
    pub printer_port: String,         // "\\\\.\\COM3" | "192.168.1.21:9100|9101|9102"
    pub hydra_path: Option<String>,   // default: "/hydra-fiscal"
    pub hydra_op: Option<String>,     // opzionale: codice operatore
    pub hydra_dep: Option<String>,    // opzionale: reparto/aliquota (es. "A","B","C")
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SaleItem {
    pub desc: String,
    pub qty: f64,
    pub price: f64,
    pub vat_code: Option<String>, // "A","B","C" (Hydra usa codici aliquota)
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Payment {
    pub method: String, // "Cash" | "Card" | "Electronic" | "Other"
    pub amount: f64,
}

// ==============================
// 📁 CONFIG FILE
// ==============================
fn config_path(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_config_dir()
        .unwrap_or_else(|_| std::env::current_dir().unwrap())
        .join("printers.json")
}

fn read_or_create_configs(app: &tauri::AppHandle) -> Result<Vec<PrinterConfig>, String> {
    let path = config_path(app);
    if !path.exists() {
        fs::create_dir_all(path.parent().unwrap()).map_err(|e| e.to_string())?;
        fs::write(&path, "[]").map_err(|e| e.to_string())?;
        return Ok(vec![]);
    }
    let data = fs::read_to_string(&path).map_err(|e| format!("Errore lettura file: {}", e))?;
    let printers: Vec<PrinterConfig> = serde_json::from_str(&data).unwrap_or_default();
    Ok(printers)
}

#[command]
fn get_printer_configs(app: tauri::AppHandle) -> Result<Vec<PrinterConfig>, String> {
    read_or_create_configs(&app)
}

#[command]
fn save_printer_configs(app: tauri::AppHandle, printers: Vec<PrinterConfig>) -> Result<(), String> {
    let path = config_path(&app);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Errore creazione cartella: {}", e))?;
    }
    let json = serde_json::to_string_pretty(&printers).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| format!("Errore salvataggio: {}", e))
}

// ==============================
// 🧾 ESC/POS costanti & helpers
// ==============================
const ESC: u8 = 0x1B;
const GS: u8 = 0x1D;

/// Restituisce il byte corretto per il simbolo €
fn euro_byte_for(model: &str) -> u8 {
    match model {
        "rp850use" | "epson" => 0x80, // CP1252 euro
        _ => 0xD5,                    // CP858 euro
    }
}

fn to_bytes_with_encoding(s: &str, model: &str) -> Vec<u8> {
    let euro_byte = euro_byte_for(model);
    let mut out = Vec::with_capacity(s.len());
    for ch in s.chars() {
        match ch {
            '€' => out.push(euro_byte),
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

fn push_item_line(buf: &mut Vec<u8>, name: &str, qty: i32, line_total: f64, model: &str) {
    let mut name_b = to_bytes_with_encoding(name, model);
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
    buf.push(euro_byte_for(model));
    buf.extend_from_slice(format!("{:>6.2}\n", line_total).as_bytes());
}

// ==============================
// 🔌 Output COM o TCP
// ==============================
fn open_output(printer_port: &str) -> Result<Box<dyn Write + Send>, String> {
    if printer_port.starts_with("\\\\.\\") {
        let port = OpenOptions::new()
            .write(true)
            .open(printer_port)
            .map_err(|e| format!("Errore apertura COM {}: {}", printer_port, e))?;
        Ok(Box::new(BufWriter::new(port)))
    } else if printer_port.contains(':') {
        let stream = TcpStream::connect(printer_port)
            .map_err(|e| format!("Connessione TCP fallita a {}: {}", printer_port, e))?;
        stream.set_write_timeout(Some(Duration::from_secs(3))).ok();
        Ok(Box::new(BufWriter::new(stream)))
    } else {
        Err("Formato porta non riconosciuto (usa \\\\.\\COM3 oppure 192.168.x.x:port)".into())
    }
}

// ==============================
// 🖨️ Test/Preconto ESC/POS (COM o TCP/9100)
// ==============================
#[command]
fn print_receipt(printer: PrinterConfig, items: Vec<(String, f64, i32)>, total: f64) -> Result<(), String> {
    let model = printer.model.clone().unwrap_or_else(|| "generic".into());
    let port_name = printer.printer_port.clone();
    let mut w = open_output(&port_name)?;

    let mut buf: Vec<u8> = Vec::with_capacity(4096);
    buf.extend_from_slice(&[ESC, b'@']);

    // Imposta la codifica corretta
    match model.as_str() {
        "bixolon" => buf.extend_from_slice(&[ESC, b't', 19]), // CP858
        "epson" | "rp850use" => buf.extend_from_slice(&[ESC, b't', 16]), // CP1252
        "hydra" => buf.extend_from_slice(&[ESC, b't', 0]),
        _ => buf.extend_from_slice(&[ESC, b't', 19]),
    }

    buf.extend_from_slice(&[ESC, b'a', 1]);
    buf.extend_from_slice(&[ESC, b'E', 1]);
    buf.extend_from_slice(&[ESC, b'!', 0x30]);
    buf.extend_from_slice(to_bytes_with_encoding(&(printer.header + "\n"), &model).as_slice());
    buf.extend_from_slice(&[ESC, b'E', 0]);
    buf.extend_from_slice(&[ESC, b'!', 0x00]);
    buf.extend_from_slice(to_bytes_with_encoding(&(printer.address + "\n"), &model).as_slice());
    buf.extend_from_slice(to_bytes_with_encoding(&(printer.city + "\n"), &model).as_slice());
    buf.extend_from_slice(to_bytes_with_encoding(&(printer.phone + "\n"), &model).as_slice());
    buf.extend_from_slice(to_bytes_with_encoding(&(printer.vat + "\n\n"), &model).as_slice());

    buf.extend_from_slice(&[ESC, b'a', 0]);
    buf.extend_from_slice(b"------------------------------------------\n");
    buf.extend_from_slice(b"PRODOTTO                  QTA   ");
    buf.push(euro_byte_for(&model));
    buf.extend_from_slice(b"IMPORTO\n");
    buf.extend_from_slice(b"------------------------------------------\n");

    for (name, price, qty) in &items {
        push_item_line(&mut buf, name, *qty, price * (*qty as f64), &model);
    }

    buf.extend_from_slice(b"------------------------------------------\n");
    buf.extend_from_slice(&[ESC, b'!', 0x10]);
    let tot_label = to_bytes_with_encoding("TOTALE:", &model);
    let mut line = Vec::new();
    line.extend_from_slice(&tot_label);
    if tot_label.len() < 31 {
        for _ in 0..(31 - tot_label.len()) {
            line.push(b' ');
        }
    }
    line.push(euro_byte_for(&model));
    line.extend_from_slice(format!("{:>6.2}\n", total).as_bytes());
    buf.extend_from_slice(&line);
    buf.extend_from_slice(&[ESC, b'!', 0x00]);

    let dt = Local::now().format("%d/%m/%Y %H:%M").to_string();
    buf.extend_from_slice(to_bytes_with_encoding(&format!("\nData: {}\n", dt), &model).as_slice());
    buf.extend_from_slice(&[ESC, b'a', 1]);
    buf.extend_from_slice(to_bytes_with_encoding("\nDocumento NON FISCALE\nGrazie!\n", &model).as_slice());
    buf.extend_from_slice(&[ESC, b'd', 4]);

    match model.as_str() {
        "hydra" => buf.extend_from_slice(&[ESC, b'i']),
        "custom" => buf.extend_from_slice(&[ESC, b'm']),
        "epson" | "rp850use" => buf.extend_from_slice(&[GS, b'V', 66, 0]),
        _ => buf.extend_from_slice(&[GS, b'V', 0]),
    }

    w.write_all(&buf).map_err(|e| format!("Errore scrittura: {}", e))?;
    w.flush().map_err(|e| format!("Errore flush: {}", e))?;
    sleep(Duration::from_millis(150));
    Ok(())
}

// ==============================
// 🧾🧾 Stampa FISCALE Hydra (HTTP XML su 9102)
// ==============================

fn xml_escape(s: &str) -> String {
    s.replace('&', "&amp;")
     .replace('<', "&lt;")
     .replace('>', "&gt;")
     .replace('"', "&quot;")
     .replace('\'', "&apos;")
}

fn build_hydra_xml(header: &str, items: &[SaleItem], payments: &[Payment], op: Option<&str>) -> String {
    // Nota: struttura generica. I modelli Hydra accettano varianti/estensioni.
    let mut xml = String::new();
    xml.push_str(r#"<?xml version="1.0" encoding="UTF-8"?>"#);
    xml.push_str("\n<FiscalReceipt>\n");

    xml.push_str(&format!("  <Header>{}</Header>\n", xml_escape(header)));
    if let Some(o) = op {
        if !o.is_empty() {
            xml.push_str(&format!("  <Operator>{}</Operator>\n", xml_escape(o)));
        }
    }

    for it in items {
        let vat = it.vat_code.as_deref().unwrap_or("A"); // default Aliquota A
        xml.push_str(&format!(
            r#"  <Item desc="{}" qty="{:.3}" price="{:.2}" vat="{}" />"#,
            xml_escape(&it.desc), it.qty, it.price, vat
        ));
        xml.push('\n');
    }

    xml.push_str("  <Total/>\n");

    for p in payments {
        // Mappa rapida metodo
        let m = match p.method.to_ascii_lowercase().as_str() {
            "cash" | "contanti" => "Cash",
            "card" | "carta"    => "Card",
            "electronic"        => "Electronic",
            _                   => "Other",
        };
        xml.push_str(&format!(
            r#"  <Payment type="{}" amount="{:.2}" />"#,
            m, p.amount
        ));
        xml.push('\n');
    }

    xml.push_str("  <CloseFiscalReceipt/>\n");
    xml.push_str("</FiscalReceipt>\n");
    xml
}

fn parse_host_port_9102(printer_port: &str) -> Result<String, String> {
    // accetta "IP:PORT". Richiede PORT=9102 per fiscale.
    let mut parts = printer_port.split(':');
    let host = parts.next().ok_or("Formato porta non valido")?;
    let port = parts.next().ok_or("Specificare porta :9102 per Hydra fiscale")?;
    if port != "9102" {
        return Err("Per stampa fiscale Hydra usa la porta 9102".into());
    }
    Ok(format!("{}:{}", host, port))
}

#[command]
fn print_fiscal_receipt(
    printer: PrinterConfig,
    items: Vec<SaleItem>,
    payments: Vec<Payment>,
    header: Option<String>,
) -> Result<(), String> {
    // Validazioni base
    if printer.model.as_deref() != Some("hydra") {
        return Err("La stampante selezionata non è di tipo 'hydra'".into());
    }
    let hostport = parse_host_port_9102(&printer.printer_port)?;
    let path = printer.hydra_path.as_deref().unwrap_or("/hydra-fiscal");
    let url = format!("http://{}{}", hostport, path);

    // Costruzione XML
    let hdr = header.unwrap_or_else(|| "Vendita".into());
    let xml = build_hydra_xml(&hdr, &items, &payments, printer.hydra_op.as_deref());

    // Invio HTTP (blocking)
    let resp = ureq::post(&url)
        .set("Content-Type", "application/xml; charset=utf-8")
        .timeout(Duration::from_secs(5))
        .send_string(&xml);

    match resp {
        Ok(r) => {
            if r.status() >= 200 && r.status() < 300 {
                Ok(())
            } else {
                let status = r.status();
                let body = r.into_string().unwrap_or_default();
                Err(format!("Hydra HTTP {}: {}", status, body))
            }
        }
        Err(e) => Err(format!("Errore invio a Hydra: {}", e)),
    }

}

// ==============================
// 🚀 Avvio App
// ==============================
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_printer_configs,
            save_printer_configs,
            print_receipt,        // preconto ESC/POS
            print_fiscal_receipt  // scontrino fiscale Hydra XML
        ])
        .run(tauri::generate_context!())
        .expect("Errore avvio Tauri");
}
