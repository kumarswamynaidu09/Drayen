-- =========================================================================
-- DRAYEN ATELIER — SUPABASE POSTGRESQL SCHEMA
-- Authoritative schema for Luxury Jewelry E-commerce Storefront & Admin Desk
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STORE SETTINGS
CREATE TABLE IF NOT EXISTS store_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT,
  full_description TEXT,
  category TEXT NOT NULL,
  selling_price_paise BIGINT NOT NULL,
  original_price_paise BIGINT,
  material TEXT NOT NULL,
  finish TEXT NOT NULL,
  chain_length TEXT,
  chain_thickness TEXT,
  pendant_height TEXT,
  pendant_width TEXT,
  pendant_thickness TEXT,
  pendant_weight TEXT,
  clasp_type TEXT,
  is_detachable BOOLEAN DEFAULT TRUE,
  care_instructions TEXT,
  images JSONB NOT NULL DEFAULT '[]'::JSONB,
  variants JSONB NOT NULL DEFAULT '[]'::JSONB,
  stock_quantity INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. CUSTOMER PROFILES & ADDRESSES
CREATE TABLE IF NOT EXISTS customer_profiles (
  id TEXT PRIMARY KEY, -- Maps to Supabase auth.users id or phone hash
  email TEXT,
  phone TEXT,
  full_name TEXT,
  loyalty_tier TEXT DEFAULT 'NOIR_MEMBER',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  customer_id TEXT NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Vault Address',
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  order_number TEXT UNIQUE NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  shipping_tier TEXT NOT NULL DEFAULT 'STANDARD_INSURED',
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  subtotal_paise BIGINT NOT NULL,
  shipping_paise BIGINT NOT NULL DEFAULT 0,
  discount_paise BIGINT NOT NULL DEFAULT 0,
  promo_code TEXT,
  total_payable_paise BIGINT NOT NULL,
  order_status TEXT NOT NULL DEFAULT 'AWAITING_PAYMENT',
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  unit_price_paise BIGINT NOT NULL,
  quantity INT NOT NULL,
  variant_selection JSONB,
  total_price_paise BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. PAYMENT SUBMISSIONS (UPI proof & UTR tracking)
CREATE TABLE IF NOT EXISTS payment_submissions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  utr_number TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  remitter_name TEXT,
  screenshot_path TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  review_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  reviewed_at TIMESTAMPTZ
);

-- 7. SHIPMENTS (Logistics & tracking)
CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  carrier_name TEXT NOT NULL,
  shipping_status TEXT NOT NULL DEFAULT 'ORDER_MANIFESTED',
  dispatch_date TIMESTAMPTZ,
  estimated_delivery_date TIMESTAMPTZ,
  delivered_date TIMESTAMPTZ,
  tracking_events JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 8. INITIAL STORE SETTINGS SEED
INSERT INTO store_settings (key, value) VALUES
  ('merchant_upi_id', 'drayen.atelier@okaxis'),
  ('merchant_name', 'DRAYEN ATELIER'),
  ('merchant_qr_enabled', '1'),
  ('free_shipping_threshold_paise', '49900'),
  ('contact_email', 'concierge@drayen.in'),
  ('contact_phone', '+91 98400 12345')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 9. INITIAL CATALOGUE PIECES SEED
INSERT INTO products (
  id, sku, name, slug, short_description, full_description, category,
  selling_price_paise, original_price_paise, material, finish,
  chain_length, chain_thickness, pendant_height, pendant_width, pendant_thickness, pendant_weight,
  clasp_type, is_detachable, care_instructions, images, variants, stock_quantity, is_published
) VALUES
(
  'prod-noctis-cross',
  'DRY-PT-0925',
  'Noctis Cross',
  'noctis-cross',
  'Antique Silver / 316L Stainless Steel',
  'A sculpted gothic cross forged from solid 316L surgical stainless steel with antique oxidised silver plating. Featuring a center onyx-toned stone and carved dagger tips engineered to evoke nocturnal sanctuary and unyielding poise.',
  'Pendants',
  69900,
  99900,
  '316L Surgical Grade Steel',
  'Antique Silver (.925 Look)',
  '20 INCH (50CM)',
  '3mm Rounded Box Chain',
  '42mm',
  '26mm',
  '3.5mm Solid Core',
  '18 Grams',
  'Heavy-duty Lobster Clasp',
  TRUE,
  'Rinse with lukewarm water and mild soap, then wipe dry with microfiber cloth. Avoid harsh chemical dips.',
  '["https://lh3.googleusercontent.com/aida-public/AB6AXuC6w9gOeyG27cQOZhDmzgc4ODnlRYUYP9iDfZXcr30vxRrfhuoEhqalXoAVQHXb1zAEGJCHrqH-DGcsTvsNLieUQ7vS6mjkDd2zMZFTZcmViakL6coICC6DwuX9erR2-4QmZ70Yx78DscyKzAq0BAtFbIBSTvYkipTUeRqFxpx8ApXqUVQ_yA0PCcqKBxxiMbQGxDad-tAI3LveI1HCCvCAG1dFi_bVQO7kqxhWIUFC9qxGuz5I8ZUm"]'::JSONB,
  '[{"type": "finish", "options": ["Antique Silver", "Obsidian Black"]}, {"type": "length", "options": ["18 INCH (45CM)", "20 INCH (50CM)", "22 INCH (55CM)", "24 INCH (60CM)"]}]'::JSONB,
  24,
  TRUE
),
(
  'prod-deaths-grasp',
  'DRY-PT-0418',
  'Death''s Grasp',
  'deaths-grasp',
  'Oxidized Pewter / Steel Sculptural Talisman',
  'Intricate skeletal hand gripping a black onyx sphere pendant in aged oxidized silver on heavy rolo chain. Stark studio noir aesthetic designed for alternative expression.',
  'Pendants',
  59900,
  79900,
  'Oxidized Pewter & 316L Steel',
  'Dual Finish Oxidized',
  '22 INCH (55CM)',
  '3.5mm Heavy Rolo',
  '38mm',
  '22mm',
  '12mm Orb Depth',
  '21 Grams',
  'Reinforced Lobster Clasp',
  TRUE,
  'Clean with dry microfiber cloth. Avoid saltwater immersion.',
  '["https://lh3.googleusercontent.com/aida-public/AB6AXuCa2c9_wt2xbZE0zCFiYvcGvhzp_er3eNVW2DLcAJnJWGpvBs_R-bp8KcIxT8X6_HrJrIMDWXLJlBT4dgCgFaM4Kp9H56-1Flg9Yog41fB0jHEtWOnyBjVmDqEx6wYQcbBhkTGvuXA2Aw9lxzWV3M1EX_We8ImlFLI-FjgRzQLrWYACKm3A5VcCyN87BNnE9S0_mB0q6_mESQeHKbjgu88k_qzspfjBlquwzXhh3G_bHiigv9AqPIvr"]'::JSONB,
  '[{"type": "finish", "options": ["Aged Silver / Black Orb"]}, {"type": "length", "options": ["20 INCH (50CM)", "22 INCH (55CM)", "24 INCH (60CM)"]}]'::JSONB,
  15,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

