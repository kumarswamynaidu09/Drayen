import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads', 'payment_proofs');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DB_PATH = path.resolve(DATA_DIR, 'drayen.db');
export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      short_description TEXT,
      full_description TEXT,
      category TEXT NOT NULL,
      selling_price_paise INTEGER NOT NULL,
      original_price_paise INTEGER,
      material TEXT NOT NULL,
      finish TEXT NOT NULL,
      chain_length TEXT,
      chain_thickness TEXT,
      pendant_height TEXT,
      pendant_width TEXT,
      pendant_thickness TEXT,
      pendant_weight TEXT,
      clasp_type TEXT,
      is_detachable INTEGER DEFAULT 1,
      care_instructions TEXT,
      images_json TEXT NOT NULL,
      variants_json TEXT NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT NOT NULL,
      address_line1 TEXT NOT NULL,
      address_line2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      shipping_tier TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      subtotal_paise INTEGER NOT NULL,
      shipping_paise INTEGER NOT NULL,
      discount_paise INTEGER NOT NULL DEFAULT 0,
      promo_code TEXT,
      total_payable_paise INTEGER NOT NULL,
      order_status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      access_token TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      selected_finish TEXT,
      selected_length TEXT,
      quantity INTEGER NOT NULL,
      unit_price_paise INTEGER NOT NULL,
      total_paise INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_submissions (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      utr_number TEXT NOT NULL,
      screenshot_path TEXT NOT NULL,
      screenshot_mime TEXT NOT NULL,
      screenshot_size INTEGER NOT NULL,
      submitted_amount_paise INTEGER NOT NULL,
      customer_declaration INTEGER NOT NULL DEFAULT 1,
      verification_status TEXT NOT NULL DEFAULT 'Pending Review',
      reviewer_id TEXT,
      rejection_reason TEXT,
      submitted_at TEXT NOT NULL,
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      previous_status TEXT,
      new_status TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_audit_events (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      payment_submission_id TEXT,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      carrier TEXT NOT NULL,
      tracking_number TEXT NOT NULL,
      dispatch_date TEXT NOT NULL,
      delivery_status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      full_name TEXT NOT NULL,
      password_hash TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customer_addresses (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      label TEXT DEFAULT 'Vault Address',
      recipient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      line1 TEXT NOT NULL,
      line2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visitor_logs (
      id TEXT PRIMARY KEY,
      visitor_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      path TEXT NOT NULL,
      referrer TEXT,
      customer_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_orders_access_token ON orders(access_token);
    CREATE INDEX IF NOT EXISTS idx_payment_submissions_utr ON payment_submissions(utr_number);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);
  `);

  // Seed default admin and required drayenin@gmail.com administrator
  const salt = bcrypt.genSaltSync(10);
  const drayenHash = bcrypt.hashSync('jashwanth@9090', salt);
  
  // Ensure drayenin@gmail.com exists with password jashwanth@9090
  const drayenAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('drayenin@gmail.com');
  if (!drayenAdmin) {
    db.prepare(`
      INSERT INTO admin_users (id, username, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin-drayen-id', 'drayenin@gmail.com', drayenHash, 'SUPER_ADMIN', new Date().toISOString());
  } else {
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE username = ?').run(drayenHash, 'drayenin@gmail.com');
  }

  // Also maintain admin/nocturne2025 as fallback
  const adminCheck = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!adminCheck) {
    const hash = bcrypt.hashSync('nocturne2025', salt);
    db.prepare(`
      INSERT INTO admin_users (id, username, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin-default-id', 'admin', hash, 'SUPER_ADMIN', new Date().toISOString());
  }

  // Seed default store settings if missing
  const defaultSettings: Record<string, string> = {
    merchant_upi_id: 'drayen.atelier@okaxis',
    merchant_name: 'DRAYEN ATELIER',
    merchant_qr_enabled: '1',
    free_shipping_threshold_paise: '49900',
    standard_shipping_fee_paise: '0',
    express_shipping_fee_paise: '9900',
    cod_surcharge_paise: '5000',
    contact_email: 'atelier@drayen.com',
    contact_phone: '+91 98400 12345',
  };

  const getSettingStmt = db.prepare('SELECT value FROM store_settings WHERE key = ?');
  const insertSettingStmt = db.prepare('INSERT INTO store_settings (key, value, updated_at) VALUES (?, ?, ?)');

  for (const [key, val] of Object.entries(defaultSettings)) {
    const exists = getSettingStmt.get(key);
    if (!exists) {
      insertSettingStmt.run(key, val, new Date().toISOString());
    }
  }
}

export { UPLOADS_DIR };
