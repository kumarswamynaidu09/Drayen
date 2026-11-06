-- =========================================================================
-- DRAYEN ATELIER — SUPABASE RLS POLICIES & PERMISSIONS FIX
-- Run this in the Supabase Dashboard SQL Editor to allow public/admin reads & writes
-- =========================================================================

-- 1. STORE SETTINGS: Enable RLS and allow public read and authenticated/anon upserts
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read store_settings" ON store_settings;
CREATE POLICY "Public read store_settings" ON store_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all modifications on store_settings" ON store_settings;
CREATE POLICY "Allow all modifications on store_settings" ON store_settings
  FOR ALL USING (true) WITH CHECK (true);

-- 2. PRODUCTS: Allow public read and all modifications
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read products" ON products;
CREATE POLICY "Public read products" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all modifications on products" ON products;
CREATE POLICY "Allow all modifications on products" ON products
  FOR ALL USING (true) WITH CHECK (true);

-- 3. ORDERS: Allow insert and select
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert orders" ON orders;
CREATE POLICY "Public insert orders" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public select orders" ON orders;
CREATE POLICY "Public select orders" ON orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow updates on orders" ON orders;
CREATE POLICY "Allow updates on orders" ON orders
  FOR UPDATE USING (true) WITH CHECK (true);

-- 4. ORDER ITEMS: Allow insert and select
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert order_items" ON order_items;
CREATE POLICY "Public insert order_items" ON order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public select order_items" ON order_items;
CREATE POLICY "Public select order_items" ON order_items
  FOR SELECT USING (true);

-- 5. PAYMENT SUBMISSIONS: Allow insert and select
ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert payment_submissions" ON payment_submissions;
CREATE POLICY "Public insert payment_submissions" ON payment_submissions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public select payment_submissions" ON payment_submissions;
CREATE POLICY "Public select payment_submissions" ON payment_submissions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow updates on payment_submissions" ON payment_submissions;
CREATE POLICY "Allow updates on payment_submissions" ON payment_submissions
  FOR UPDATE USING (true) WITH CHECK (true);

-- 6. SHIPMENTS: Allow select and modifications
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select shipments" ON shipments;
CREATE POLICY "Public select shipments" ON shipments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all modifications on shipments" ON shipments;
CREATE POLICY "Allow all modifications on shipments" ON shipments
  FOR ALL USING (true) WITH CHECK (true);

-- 7. CUSTOMER PROFILES & ADDRESSES
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on customer_profiles" ON customer_profiles;
CREATE POLICY "Allow all on customer_profiles" ON customer_profiles
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on customer_addresses" ON customer_addresses;
CREATE POLICY "Allow all on customer_addresses" ON customer_addresses
  FOR ALL USING (true) WITH CHECK (true);

