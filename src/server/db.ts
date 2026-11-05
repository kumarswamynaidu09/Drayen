import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import bcrypt from 'bcryptjs';

// Vercel serverless environments are read-only except /tmp
const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
const DATA_DIR = isVercel
  ? path.resolve(os.tmpdir(), 'drayen_data')
  : path.resolve(process.cwd(), 'data');

const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads', 'payment_proofs');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[DB Init] Directory creation notice:', e);
}

const DB_PATH = path.resolve(DATA_DIR, 'drayen.db');

let DatabaseSyncModule: any = null;
try {
  // Try native node:sqlite
  const sqlite = await import('node:sqlite');
  DatabaseSyncModule = sqlite.DatabaseSync;
} catch (e) {
  console.warn('[DB Init] node:sqlite native module not found in runtime, falling back:', e);
}

export let db: any;

if (DatabaseSyncModule) {
  try {
    db = new DatabaseSyncModule(DB_PATH);
    db.exec('PRAGMA foreign_keys = ON;');
  } catch (err) {
    console.warn('[DB Init] Failed to open SQLite file, trying in-memory:', err);
    try {
      db = new DatabaseSyncModule(':memory:');
      db.exec('PRAGMA foreign_keys = ON;');
    } catch {
      db = null;
    }
  }
}

// Fallback in-memory database mock store if SQLite native binary is unavailable on serverless
class MemoryStore {
  private tables: Record<string, any[]> = {
    products: [],
    orders: [],
    order_items: [],
    payment_submissions: [],
    order_status_history: [],
    shipments: [],
    admin_users: [],
    store_settings: [],
    customers: [],
    customer_addresses: [],
    visitor_logs: [],
  };

  exec(_sql: string) {}

  prepare(sql: string) {
    const s = sql.trim().toUpperCase();
    const self = this;

    return {
      all(..._params: any[]) {
        if (s.includes('FROM PRODUCTS')) return self.tables.products;
        if (s.includes('FROM ORDERS')) return self.tables.orders;
        if (s.includes('FROM ORDER_ITEMS')) return self.tables.order_items;
        if (s.includes('FROM STORE_SETTINGS')) return self.tables.store_settings;
        if (s.includes('FROM CUSTOMER_ADDRESSES')) return self.tables.customer_addresses;
        if (s.includes('FROM PAYMENT_SUBMISSIONS')) return self.tables.payment_submissions;
        return [];
      },
      get(...params: any[]) {
        if (s.includes('FROM ADMIN_USERS WHERE LOWER(USERNAME)')) {
          const user = params[0];
          return self.tables.admin_users.find(
            (u) => (u.username || '').toLowerCase() === String(user).toLowerCase()
          );
        }
        if (s.includes('FROM ADMIN_USERS WHERE USERNAME = ?')) {
          return self.tables.admin_users.find((u) => u.username === params[0]);
        }
        if (s.includes('FROM CUSTOMERS WHERE LOWER(EMAIL)')) {
          const iden = String(params[0]).toLowerCase();
          return self.tables.customers.find((c) => c.email === iden || c.phone === iden);
        }
        if (s.includes('FROM CUSTOMERS WHERE ID = ?')) {
          return self.tables.customers.find((c) => c.id === params[0]);
        }
        if (s.includes('FROM PRODUCTS WHERE (SLUG = ?')) {
          return self.tables.products.find((p) => p.slug === params[0] || p.id === params[0]);
        }
        if (s.includes('FROM ORDERS WHERE ORDER_NUMBER = ?')) {
          return self.tables.orders.find((o) => o.order_number === params[0]);
        }
        if (s.includes('COUNT(*) AS COUNT') || s.includes('COUNT(*) AS C')) {
          return { count: 0, c: 0 };
        }
        if (s.includes('SUM(TOTAL_PAYABLE_PAISE)')) {
          return { sumSales: 0 };
        }
        return null;
      },
      run(...params: any[]) {
        if (s.includes('INSERT INTO ADMIN_USERS')) {
          self.tables.admin_users.push({
            id: params[0],
            username: params[1],
            password_hash: params[2],
            role: params[3],
            created_at: params[4],
          });
        } else if (s.includes('INSERT INTO CUSTOMERS')) {
          self.tables.customers.push({
            id: params[0],
            email: params[1],
            phone: params[2],
            full_name: params[3],
            password_hash: params[4],
            created_at: params[5],
            updated_at: params[6],
          });
        }
        return { changes: 1 };
      },
    };
  }
}

if (!db) {
  console.log('[DB Init] Utilizing Serverless MemoryStore for API runtime.');
  db = new MemoryStore();
}

export function initDatabase() {
  try {
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
        product_id TEXT NOT NULL,
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
        remitter_name TEXT,
        remitter_vpa TEXT,
        screenshot_path TEXT,
        submitted_amount_paise INTEGER,
        verification_status TEXT NOT NULL,
        rejection_reason TEXT,
        submitted_at TEXT NOT NULL,
        verified_at TEXT
      );

      CREATE TABLE IF NOT EXISTS order_status_history (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        previous_status TEXT NOT NULL,
        new_status TEXT NOT NULL,
        changed_by TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admin_audit_log (
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
    `);
  } catch (err) {
    console.warn('[DB Init] Schema creation notice:', err);
  }

  // Seed default super admin
  try {
    const salt = bcrypt.genSaltSync(10);
    const drayenHash = bcrypt.hashSync('jashwanth@9090', salt);
    const drayenAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('drayenin@gmail.com');
    if (!drayenAdmin) {
      db.prepare(`
        INSERT INTO admin_users (id, username, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('admin-drayen-id', 'drayenin@gmail.com', drayenHash, 'SUPER_ADMIN', new Date().toISOString());
    }
  } catch (err) {
    console.warn('[DB Init] Admin user check notice:', err);
  }
}

// Auto-run initDatabase
initDatabase();

export { UPLOADS_DIR };
