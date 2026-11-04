import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { db, UPLOADS_DIR } from './db';
import { calculateOrderPricing, formatINR } from '../lib/money';
import { validateOrderStatusTransition, validatePaymentStatusTransition, OrderStatus, PaymentStatus } from '../lib/state-machine';
import { validateIndianPinCode, validateIndianMobile, sanitizeAndValidateUTR } from '../lib/validation';
import { seedAtelierCatalogue } from './seed-data';

const JWT_SECRET = process.env.JWT_SECRET || 'drayen_atelier_super_secure_vault_secret_2025';

export const apiRouter = express.Router();
apiRouter.use(express.json());

// Setup Multer for secure private file storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext) ? ext : '.png';
    const uniqueName = `proof_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${safeExt}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are permitted.'));
    }
  },
});

// Admin Authentication Middleware
interface AdminAuthRequest extends Request {
  adminUser?: { id: string; username: string; role: string };
}

function requireAdmin(req: AdminAuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
    req.adminUser = decoded;
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}

// =========================================================================
// 1. PUBLIC STORE CATALOGUE & SETTINGS API
// =========================================================================

// Public Store Settings
apiRouter.get(['/store/settings', '/settings'], (_req: Request, res: Response) => {
  try {
    const settings = db.prepare('SELECT key, value FROM store_settings').all() as { key: string; value: string }[];
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    res.json({
      merchantUpiId: settingsMap.merchant_upi_id || '',
      merchantName: settingsMap.merchant_name || 'DRAYEN ATELIER',
      merchantQrEnabled: settingsMap.merchant_qr_enabled === '1',
      freeShippingThresholdPaise: parseInt(settingsMap.free_shipping_threshold_paise || '49900', 10),
      contactEmail: settingsMap.contact_email || 'atelier@drayen.com',
      contactPhone: settingsMap.contact_phone || '+91 98400 12345',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve store settings: ' + err.message });
  }
});

// Public Catalogue: Published products
apiRouter.get('/products', (req: Request, res: Response) => {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;

    let query = 'SELECT * FROM products WHERE is_published = 1';
    const params: any[] = [];

    if (category && category !== 'All' && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ' AND (name LIKE ? OR short_description LIKE ? OR material LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (minPrice) {
      query += ' AND selling_price_paise >= ?';
      params.push(parseInt(minPrice as string, 10));
    }
    if (maxPrice) {
      query += ' AND selling_price_paise <= ?';
      params.push(parseInt(maxPrice as string, 10));
    }

    if (sort === 'price-asc') {
      query += ' ORDER BY selling_price_paise ASC';
    } else if (sort === 'price-desc') {
      query += ' ORDER BY selling_price_paise DESC';
    } else if (sort === 'newest') {
      query += ' ORDER BY created_at DESC';
    } else {
      query += ' ORDER BY created_at ASC';
    }

    const rows = db.prepare(query).all(...params) as any[];

    const products = rows.map((r) => ({
      ...r,
      is_detachable: Boolean(r.is_detachable),
      is_published: Boolean(r.is_published),
      images: JSON.parse(r.images_json || '[]'),
      variants: JSON.parse(r.variants_json || '[]'),
    }));

    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: 'Database query failed: ' + err.message });
  }
});

// Single Product by Slug or ID
apiRouter.get('/products/:slugOrId', (req: Request, res: Response) => {
  try {
    const param = req.params.slugOrId;
    const row = db
      .prepare('SELECT * FROM products WHERE (slug = ? OR id = ?) AND is_published = 1')
      .get(param, param) as any;

    if (!row) {
      return res.status(404).json({ error: 'Product not found in active collection.' });
    }

    const product = {
      ...row,
      is_detachable: Boolean(row.is_detachable),
      is_published: Boolean(row.is_published),
      images: JSON.parse(row.images_json || '[]'),
      variants: JSON.parse(row.variants_json || '[]'),
    };

    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// =========================================================================
// 2. CUSTOMER CHECKOUT & ORDER CREATION API
// =========================================================================

apiRouter.post('/orders', (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      shippingTier = 'standard',
      paymentMethod = 'upi',
      promoCode,
      items,
    } = req.body;

    // Strict validation of customer data
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return res.status(400).json({ error: 'Full customer name is required.' });
    }
    if (!validateIndianMobile(customerPhone)) {
      return res.status(400).json({ error: 'A valid 10-digit Indian phone number is required.' });
    }
    if (!addressLine1 || addressLine1.trim().length < 5) {
      return res.status(400).json({ error: 'Complete street address is required.' });
    }
    if (!city || city.trim().length < 2) {
      return res.status(400).json({ error: 'City is required.' });
    }
    if (!state || state.trim().length < 2) {
      return res.status(400).json({ error: 'State is required.' });
    }
    if (!validateIndianPinCode(postalCode)) {
      return res.status(400).json({ error: 'A valid 6-digit Indian PIN code is required.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cannot checkout with an empty cart.' });
    }

    // Server-authoritative price & inventory check
    const verifiedItems: {
      product: any;
      quantity: number;
      selectedFinish?: string;
      selectedLength?: string;
    }[] = [];

    const getProductStmt = db.prepare('SELECT * FROM products WHERE id = ? AND is_published = 1');

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ error: 'Invalid product or quantity specified in order.' });
      }

      const product = getProductStmt.get(item.productId) as any;
      if (!product) {
        return res.status(400).json({ error: `Product (${item.productId}) is not available.` });
      }

      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for '${product.name}'. Available: ${product.stock_quantity}, Requested: ${item.quantity}.`,
        });
      }

      verifiedItems.push({
        product,
        quantity: item.quantity,
        selectedFinish: item.selectedFinish || product.finish,
        selectedLength: item.selectedLength || product.chain_length,
      });
    }

    // Calculate server-side total in paise
    const pricingItems = verifiedItems.map((vi) => ({
      productId: vi.product.id,
      unitPricePaise: vi.product.selling_price_paise,
      quantity: vi.quantity,
    }));

    const pricing = calculateOrderPricing({
      items: pricingItems,
      shippingTier: shippingTier === 'express' ? 'express' : 'standard',
      paymentMethod: paymentMethod === 'cod' ? 'cod' : paymentMethod === 'card' ? 'card' : 'upi',
      promoCode,
    });

    // Generate unique identifiers
    const orderId = `ord_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const orderNumber = `DRY-${Math.floor(10000 + Math.random() * 90000)}`;
    const accessToken = crypto.randomBytes(24).toString('hex');
    const now = new Date().toISOString();

    const initialOrderStatus: OrderStatus = 'Awaiting Payment';
    const initialPaymentStatus: PaymentStatus = 'Not Submitted';

    // Insert Order & Order Items atomically
    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (
        id, order_number, customer_name, customer_email, customer_phone,
        address_line1, address_line2, city, state, postal_code,
        shipping_tier, payment_method, subtotal_paise, shipping_paise,
        discount_paise, promo_code, total_payable_paise, order_status,
        payment_status, access_token, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    const insertItemStmt = db.prepare(`
      INSERT INTO order_items (
        id, order_id, product_id, product_name, sku,
        selected_finish, selected_length, quantity, unit_price_paise, total_paise
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    const insertHistoryStmt = db.prepare(`
      INSERT INTO order_status_history (
        id, order_id, previous_status, new_status, changed_by, notes, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?
      )
    `);

    insertOrderStmt.run(
      orderId,
      orderNumber,
      customerName.trim(),
      customerEmail ? customerEmail.trim() : null,
      customerPhone.trim(),
      addressLine1.trim(),
      addressLine2 ? addressLine2.trim() : null,
      city.trim(),
      state.trim(),
      postalCode.trim(),
      shippingTier,
      paymentMethod,
      pricing.subtotalPaise,
      pricing.shippingPaise,
      pricing.discountPaise,
      promoCode ? promoCode.trim().toUpperCase() : null,
      pricing.totalPayablePaise,
      initialOrderStatus,
      initialPaymentStatus,
      accessToken,
      now,
      now
    );

    for (const vi of verifiedItems) {
      const itemId = `item_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const lineTotalPaise = vi.product.selling_price_paise * vi.quantity;

      insertItemStmt.run(
        itemId,
        orderId,
        vi.product.id,
        vi.product.name,
        vi.product.sku,
        vi.selectedFinish || null,
        vi.selectedLength || null,
        vi.quantity,
        vi.product.selling_price_paise,
        lineTotalPaise
      );
    }

    insertHistoryStmt.run(
      `hist_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      orderId,
      null,
      initialOrderStatus,
      'CUSTOMER',
      'Order created and awaiting payment authorization.',
      now
    );

    res.status(201).json({
      success: true,
      orderId,
      orderNumber,
      accessToken,
      totalPayablePaise: pricing.totalPayablePaise,
      totalPayableINR: formatINR(pricing.totalPayablePaise),
      message: 'Order created successfully. Please complete your payment.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Order creation failed: ' + err.message });
  }
});

// View Order by Order Number & Access Token
apiRouter.get('/orders/:orderNumber', (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const { token } = req.query;

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Security check: verify token if requested by customer
    if (!token || token !== order.access_token) {
      // Check if admin is requesting
      const authHeader = req.headers.authorization;
      let isAdmin = false;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
          isAdmin = true;
        } catch (_e) {}
      }

      if (!isAdmin) {
        return res.status(403).json({ error: 'Unauthorized order access token.' });
      }
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const submissions = db.prepare('SELECT * FROM payment_submissions WHERE order_id = ? ORDER BY submitted_at DESC').all(order.id) as any[];
    const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC').all(order.id);
    const shipment = db.prepare('SELECT * FROM shipments WHERE order_id = ?').get(order.id);

    res.json({
      ...order,
      subtotalINR: formatINR(order.subtotal_paise),
      shippingINR: formatINR(order.shipping_paise),
      discountINR: formatINR(order.discount_paise),
      totalPayableINR: formatINR(order.total_payable_paise),
      items: items.map((it: any) => ({
        ...it,
        unitPriceINR: formatINR(it.unit_price_paise),
        totalINR: formatINR(it.total_paise),
      })),
      submissions: submissions.map((sub) => ({
        id: sub.id,
        utrNumber: sub.utr_number,
        verificationStatus: sub.verification_status,
        submittedAt: sub.submitted_at,
        rejectionReason: sub.rejection_reason,
      })),
      history,
      shipment,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve order: ' + err.message });
  }
});

// Track Order by Order Number + (Phone or Token)
apiRouter.get('/orders/:orderNumber/track', (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const { token, phone } = req.query as { token?: string; phone?: string };

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found in atelier ledger.' });
    }

    // Verify either token OR customer phone
    let isAuthorized = false;
    if (token && token.trim() === order.access_token) {
      isAuthorized = true;
    } else if (phone && phone.trim()) {
      const cleanInputPhone = phone.replace(/[^0-9]/g, '');
      const cleanOrderPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
      if (
        cleanInputPhone === cleanOrderPhone ||
        cleanOrderPhone.endsWith(cleanInputPhone) ||
        cleanInputPhone.endsWith(cleanOrderPhone)
      ) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Invalid authentication. Please check your phone number or access token.' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const submissions = db.prepare('SELECT * FROM payment_submissions WHERE order_id = ? ORDER BY submitted_at DESC').all(order.id) as any[];
    const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC').all(order.id);
    const shipment = db.prepare('SELECT * FROM shipments WHERE order_id = ?').get(order.id);

    // Map orderStatus & paymentStatus to camelCase/lowercase as expected by OrderTrackingView
    let trackingOrderStatus = 'awaiting_payment';
    const statusLower = (order.order_status || '').toLowerCase();
    if (statusLower.includes('delivered')) trackingOrderStatus = 'delivered';
    else if (statusLower.includes('shipped') || statusLower.includes('transit')) trackingOrderStatus = 'shipped';
    else if (statusLower.includes('packed') || statusLower.includes('dispatch') || statusLower.includes('ready')) trackingOrderStatus = 'ready_for_dispatch';
    else if (statusLower.includes('confirmed') || statusLower.includes('casting') || statusLower.includes('processing')) trackingOrderStatus = 'confirmed_processing';
    else if (statusLower.includes('verification')) trackingOrderStatus = 'awaiting_payment_verification';
    else if (statusLower.includes('reject')) trackingOrderStatus = 'payment_rejected';
    else if (statusLower.includes('cancel')) trackingOrderStatus = 'cancelled';
    else trackingOrderStatus = 'awaiting_payment';

    let trackingPaymentStatus = 'unpaid';
    const pStatusLower = (order.payment_status || '').toLowerCase();
    if (pStatusLower.includes('verified') || pStatusLower.includes('confirmed') || pStatusLower.includes('paid')) trackingPaymentStatus = 'verified';
    else if (pStatusLower.includes('pending') || pStatusLower.includes('review') || pStatusLower.includes('submit')) trackingPaymentStatus = 'submitted';
    else if (pStatusLower.includes('reject')) trackingPaymentStatus = 'rejected';

    res.json({
      ...order,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      orderStatus: trackingOrderStatus,
      rawOrderStatus: order.order_status,
      paymentStatus: trackingPaymentStatus,
      rawPaymentStatus: order.payment_status,
      customerAccessToken: order.access_token,
      createdAt: order.created_at,
      totalPayablePaise: order.total_payable_paise,
      totalPaise: order.total_payable_paise,
      subtotalPaise: order.subtotal_paise,
      shippingPaise: order.shipping_paise,
      discountPaise: order.discount_paise,
      promoCode: order.promo_code,
      deliveryAddress: [order.address_line1, order.address_line2].filter(Boolean).join(', '),
      pincode: order.postal_code,
      subtotalINR: formatINR(order.subtotal_paise),
      shippingINR: formatINR(order.shipping_paise),
      discountINR: formatINR(order.discount_paise),
      totalPayableINR: formatINR(order.total_payable_paise),
      items: items.map((it: any) => ({
        id: it.id,
        name: it.product_name,
        productName: it.product_name,
        sku: it.sku,
        quantity: it.quantity,
        finish: it.selected_finish,
        length: it.selected_length,
        unitPricePaise: it.unit_price_paise,
        totalPaise: it.total_paise,
        subtotalPaise: it.total_paise,
        unitPriceINR: formatINR(it.unit_price_paise),
        totalINR: formatINR(it.total_paise),
      })),
      submissions: submissions.map((sub) => ({
        id: sub.id,
        utrNumber: sub.utr_number,
        verificationStatus: sub.verification_status,
        submittedAt: sub.submitted_at,
        rejectionReason: sub.rejection_reason,
      })),
      history,
      shipment: shipment ? {
        carrier: (shipment as any).carrier,
        trackingNumber: (shipment as any).tracking_number,
        trackingUrl: (shipment as any).tracking_url,
        estimatedDeliveryDate: (shipment as any).estimated_delivery_date,
        shippedAt: (shipment as any).shipped_at,
        deliveredAt: (shipment as any).delivered_at,
      } : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve order tracking: ' + err.message });
  }
});

// Dynamic Payment QR Code Generation
apiRouter.get('/orders/:orderNumber/payment-qr', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const { token } = req.query;

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (!token || token !== order.access_token) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const setting = db.prepare("SELECT value FROM store_settings WHERE key = 'merchant_upi_id'").get() as any;
    const merchantUpiId = setting?.value?.trim();

    if (!merchantUpiId) {
      return res.status(400).json({
        error: 'Merchant UPI configuration is missing. Payment workflow is currently paused.',
      });
    }

    const amountInRupees = (order.total_payable_paise / 100).toFixed(2);
    const upiUri = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(
      'DRAYEN Atelier'
    )}&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent('Order ' + orderNumber)}`;

    const qrDataUrl = await QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 2,
      color: {
        dark: '#ffffff',
        light: '#131313',
      },
    });

    res.json({
      orderNumber: order.order_number,
      totalPaise: order.total_payable_paise,
      formattedAmount: formatINR(order.total_payable_paise),
      merchantUpiId,
      upiId: merchantUpiId,
      merchantName: 'DRAYEN Atelier',
      amountRupees: amountInRupees,
      upiUri,
      upiPayload: upiUri,
      qrDataUrl,
      qrCodeDataUrl: qrDataUrl,
      paymentStatus: order.payment_status,
      orderStatus: order.order_status,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate payment QR: ' + err.message });
  }
});

// Customer Submit Payment Details (UTR + Screenshot)
apiRouter.post('/orders/:orderNumber/submit-payment', upload.any(), (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const token = req.body.token || req.body.orderAccessToken;
    const utrNumber = req.body.utrNumber;
    const customerDeclaration = req.body.customerDeclaration ?? req.body.declaredAuthentic ?? true;
    const file = req.file || (req.files && (req.files as Express.Multer.File[])[0]);

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (!token || token !== order.access_token) {
      return res.status(403).json({ error: 'Invalid access token for order.' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Payment screenshot image file is required.' });
    }

    if (customerDeclaration !== 'true' && customerDeclaration !== true) {
      return res.status(400).json({ error: 'You must confirm the payment declaration.' });
    }

    const utrResult = sanitizeAndValidateUTR(utrNumber);
    if (!utrResult.valid) {
      return res.status(400).json({ error: utrResult.error });
    }

    // Check duplicate UTR submissions across the database
    const duplicateCheck = db
      .prepare('SELECT id, order_id FROM payment_submissions WHERE utr_number = ? AND verification_status != "Rejected"')
      .get(utrResult.utr) as any;

    if (duplicateCheck && duplicateCheck.order_id !== order.id) {
      return res.status(400).json({
        error: 'This UPI Transaction ID / UTR has already been submitted for another order. Please check and enter your genuine reference number.',
      });
    }

    // Check payment transition validity
    const transitionCheck = validatePaymentStatusTransition(order.payment_status, 'Pending Review', true);
    if (!transitionCheck.valid) {
      return res.status(400).json({ error: transitionCheck.reason });
    }

    const submissionId = `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const insertSubmissionStmt = db.prepare(`
      INSERT INTO payment_submissions (
        id, order_id, utr_number, screenshot_path, screenshot_mime, screenshot_size,
        submitted_amount_paise, customer_declaration, verification_status, submitted_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    insertSubmissionStmt.run(
      submissionId,
      order.id,
      utrResult.utr,
      file.filename,
      file.mimetype,
      file.size,
      order.total_payable_paise,
      1,
      'Pending Review',
      now
    );

    // Update order status
    db.prepare(`
      UPDATE orders
      SET order_status = 'Awaiting Payment Verification', payment_status = 'Pending Review', updated_at = ?
      WHERE id = ?
    `).run(now, order.id);

    // Record audit event
    db.prepare(`
      INSERT INTO payment_audit_events (id, order_id, payment_submission_id, action, actor, details, created_at)
      VALUES (?, ?, ?, 'SUBMITTED', 'CUSTOMER', ?, ?)
    `).run(
      `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      order.id,
      submissionId,
      `Customer submitted UTR: ${utrResult.utr}`,
      now
    );

    db.prepare(`
      INSERT INTO order_status_history (id, order_id, previous_status, new_status, changed_by, notes, created_at)
      VALUES (?, ?, ?, 'Awaiting Payment Verification', 'CUSTOMER', 'Payment proof submitted for manual atelier verification.', ?)
    `).run(
      `hist_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      order.id,
      order.order_status,
      now
    );

    res.json({
      success: true,
      message: 'Payment details submitted successfully. Your order is awaiting verification. We will update you once the payment has been reviewed.',
      orderStatus: 'Awaiting Payment Verification',
      paymentStatus: 'Pending Review',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Payment submission failed: ' + err.message });
  }
});

// =========================================================================
// 3. SECURE ADMIN PORTAL API
// =========================================================================

// Admin Login
apiRouter.post('/admin/login', (req: Request, res: Response) => {
  try {
    const identifier = (req.body.email || req.body.username || '').trim();
    const password = (req.body.password || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email and password required.' });
    }

    // Direct check for specified admin credentials
    if (identifier.toLowerCase() === 'drayenin@gmail.com' && password === 'jashwanth@9090') {
      const token = jwt.sign(
        { id: 'admin-drayen-id', username: 'drayenin@gmail.com', role: 'SUPER_ADMIN' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        token,
        user: {
          id: 'admin-drayen-id',
          username: 'drayenin@gmail.com',
          email: 'drayenin@gmail.com',
          role: 'SUPER_ADMIN',
        },
      });
    }

    // Database lookup
    const admin = db.prepare('SELECT * FROM admin_users WHERE LOWER(username) = LOWER(?)').get(identifier) as any;
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const match = bcrypt.compareSync(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.username,
        role: admin.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Admin Me
apiRouter.get('/admin/me', requireAdmin, (req: AdminAuthRequest, res: Response) => {
  res.json({ user: req.adminUser });
});

// Admin Dashboard Real Database Derived Metrics
apiRouter.get('/admin/metrics', requireAdmin, (_req: AdminAuthRequest, res: Response) => {
  try {
    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count;
    const awaitingReview = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE payment_status = 'Pending Review'").get() as any).count;
    const confirmedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Confirmed — Processing'").get() as any).count;
    const awaitingDispatch = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Packed'").get() as any).count;
    const shippedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Shipped'").get() as any).count;
    const deliveredOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Delivered'").get() as any).count;

    // Actual recorded sales from verified payments only
    const salesRow = db.prepare("SELECT SUM(total_payable_paise) as sumSales FROM orders WHERE payment_status = 'Verified'").get() as any;
    const totalSalesPaise = salesRow.sumSales || 0;

    res.json({
      totalOrders,
      awaitingReview,
      confirmedOrders,
      awaitingDispatch,
      shippedOrders,
      deliveredOrders,
      totalSalesPaise,
      totalSalesINR: formatINR(totalSalesPaise),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Metrics calculation failed: ' + err.message });
  }
});

// Admin List Orders
apiRouter.get('/admin/orders', requireAdmin, (req: AdminAuthRequest, res: Response) => {
  try {
    const { status, paymentStatus, search } = req.query;

    let query = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND order_status = ?';
      params.push(status);
    }
    if (paymentStatus && paymentStatus !== 'all') {
      query += ' AND payment_status = ?';
      params.push(paymentStatus);
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY created_at DESC';

    const orders = db.prepare(query).all(...params) as any[];

    res.json(
      orders.map((o) => ({
        ...o,
        totalPayableINR: formatINR(o.total_payable_paise),
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch orders: ' + err.message });
  }
});

// Admin Pending Payment Verifications
apiRouter.get('/admin/verifications', requireAdmin, (_req: AdminAuthRequest, res: Response) => {
  try {
    const submissions = db.prepare(`
      SELECT 
        ps.id,
        ps.order_id as orderId,
        o.order_number as orderNumber,
        ps.submitted_amount_paise as amountPaise,
        ps.utr_number as utrNumber,
        ps.screenshot_path as screenshotPath,
        ps.submitted_at as submittedAt,
        ps.verification_status as paymentStatus,
        o.customer_name as customerName,
        o.customer_phone as customerPhone
      FROM payment_submissions ps
      JOIN orders o ON ps.order_id = o.id
      ORDER BY ps.submitted_at DESC
    `).all() as any[];

    res.json(
      submissions.map((s) => ({
        ...s,
        screenshotUrl: s.screenshotPath ? `/api/admin/payments/${s.id}/screenshot` : undefined,
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch payment verifications: ' + err.message });
  }
});

// Admin Shipments
apiRouter.get('/admin/shipments', requireAdmin, (_req: AdminAuthRequest, res: Response) => {
  try {
    const orders = db.prepare(`
      SELECT 
        o.id as orderId,
        o.order_number as orderNumber,
        o.customer_name as customerName,
        o.customer_phone as customerPhone,
        o.city,
        o.state,
        o.shipping_tier as shippingTier,
        o.total_payable_paise as totalPaise,
        o.order_status as orderStatus,
        o.payment_status as paymentStatus,
        s.carrier as courier,
        s.tracking_number as trackingNumber,
        s.dispatch_date as dispatchDate
      FROM orders o
      LEFT JOIN shipments s ON o.id = s.order_id
      WHERE o.order_status IN ('Packed', 'Shipped', 'Delivered', 'Confirmed — Processing')
      ORDER BY o.created_at DESC
    `).all() as any[];

    res.json(
      orders.map((o) => ({
        ...o,
        isEligibleForFulfillment: o.paymentStatus === 'Verified' && o.orderStatus !== 'Delivered',
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch shipments: ' + err.message });
  }
});

// Admin View Screenshot Securely
apiRouter.get('/admin/payments/:submissionId/screenshot', requireAdmin, (req: AdminAuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const sub = db.prepare('SELECT * FROM payment_submissions WHERE id = ?').get(submissionId) as any;

    if (!sub) {
      return res.status(404).json({ error: 'Payment submission not found.' });
    }

    const filePath = path.resolve(UPLOADS_DIR, sub.screenshot_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Payment proof file not found on disk.' });
    }

    res.setHeader('Content-Type', sub.screenshot_mime);
    res.setHeader('Content-Disposition', 'inline');
    fs.createReadStream(filePath).pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to stream screenshot: ' + err.message });
  }
});

// Admin Review Payment: Approve / Reject / Request Correction
apiRouter.post('/admin/orders/:id/verify-payment', requireAdmin, (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const action = req.body.action || req.body.decision;
    const reason = req.body.reason || req.body.notes;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const latestSubmission = db
      .prepare('SELECT * FROM payment_submissions WHERE order_id = ? ORDER BY submitted_at DESC LIMIT 1')
      .get(order.id) as any;

    const now = new Date().toISOString();
    const adminUser = req.adminUser?.username || 'admin';

    if (action === 'approve') {
      const pCheck = validatePaymentStatusTransition(order.payment_status, 'Verified', false);
      if (!pCheck.valid) return res.status(400).json({ error: pCheck.reason });

      const oCheck = validateOrderStatusTransition(order.order_status, 'Confirmed — Processing', 'Verified');
      if (!oCheck.valid) return res.status(400).json({ error: oCheck.reason });

      // Transactional stock deduction
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) as any[];

      // Verify stock still available
      for (const item of items) {
        const prod = db.prepare('SELECT stock_quantity, name FROM products WHERE id = ?').get(item.product_id) as any;
        if (!prod || prod.stock_quantity < item.quantity) {
          return res.status(400).json({
            error: `Cannot approve order. Insufficient stock for '${prod?.name || 'product'}'.`,
          });
        }
      }

      // Deduct stock
      const deductStmt = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?');
      for (const item of items) {
        deductStmt.run(item.quantity, now, item.product_id);
      }

      // Update Order
      db.prepare(`
        UPDATE orders
        SET order_status = 'Confirmed — Processing', payment_status = 'Verified', updated_at = ?
        WHERE id = ?
      `).run(now, order.id);

      // Update Submission
      if (latestSubmission) {
        db.prepare(`
          UPDATE payment_submissions
          SET verification_status = 'Verified', reviewer_id = ?, reviewed_at = ?
          WHERE id = ?
        `).run(adminUser, now, latestSubmission.id);
      }

      // Audit Events
      db.prepare(`
        INSERT INTO payment_audit_events (id, order_id, payment_submission_id, action, actor, details, created_at)
        VALUES (?, ?, ?, 'VERIFIED', ?, 'Payment verified against merchant account and order confirmed.', ?)
      `).run(
        `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        order.id,
        latestSubmission?.id || null,
        adminUser,
        now
      );

      db.prepare(`
        INSERT INTO order_status_history (id, order_id, previous_status, new_status, changed_by, notes, created_at)
        VALUES (?, ?, ?, 'Confirmed — Processing', ?, 'Payment approved by atelier administrator. Ready for fulfillment.', ?)
      `).run(
        `hist_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        order.id,
        order.order_status,
        adminUser,
        now
      );

      return res.json({
        success: true,
        message: 'Payment verified and order confirmed successfully.',
        orderStatus: 'Confirmed — Processing',
        paymentStatus: 'Verified',
      });
    }

    if (action === 'reject') {
      if (!reason || reason.trim().length < 3) {
        return res.status(400).json({ error: 'Rejection reason is required.' });
      }

      db.prepare(`
        UPDATE orders
        SET payment_status = 'Rejected', updated_at = ?
        WHERE id = ?
      `).run(now, order.id);

      if (latestSubmission) {
        db.prepare(`
          UPDATE payment_submissions
          SET verification_status = 'Rejected', reviewer_id = ?, rejection_reason = ?, reviewed_at = ?
          WHERE id = ?
        `).run(adminUser, reason.trim(), now, latestSubmission.id);
      }

      db.prepare(`
        INSERT INTO payment_audit_events (id, order_id, payment_submission_id, action, actor, details, created_at)
        VALUES (?, ?, ?, 'REJECTED', ?, ?, ?)
      `).run(
        `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        order.id,
        latestSubmission?.id || null,
        adminUser,
        `Rejected reason: ${reason.trim()}`,
        now
      );

      return res.json({
        success: true,
        message: 'Payment marked as Rejected.',
        paymentStatus: 'Rejected',
      });
    }

    if (action === 'request_correction') {
      if (!reason || reason.trim().length < 3) {
        return res.status(400).json({ error: 'Explanation of correction required is required.' });
      }

      db.prepare(`
        UPDATE orders
        SET payment_status = 'Needs Correction', updated_at = ?
        WHERE id = ?
      `).run(now, order.id);

      if (latestSubmission) {
        db.prepare(`
          UPDATE payment_submissions
          SET verification_status = 'Needs Correction', reviewer_id = ?, rejection_reason = ?, reviewed_at = ?
          WHERE id = ?
        `).run(adminUser, reason.trim(), now, latestSubmission.id);
      }

      db.prepare(`
        INSERT INTO payment_audit_events (id, order_id, payment_submission_id, action, actor, details, created_at)
        VALUES (?, ?, ?, 'CORRECTION_REQUESTED', ?, ?, ?)
      `).run(
        `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        order.id,
        latestSubmission?.id || null,
        adminUser,
        `Correction requested: ${reason.trim()}`,
        now
      );

      return res.json({
        success: true,
        message: 'Payment marked as Needs Correction.',
        paymentStatus: 'Needs Correction',
      });
    }

    return res.status(400).json({ error: 'Invalid payment action specified.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Payment verification failed: ' + err.message });
  }
});

// Admin Update Order Fulfillment
apiRouter.post('/admin/orders/:id/update-fulfillment', requireAdmin, (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nextStatus, carrier, trackingNumber } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Check transition validity
    const transitionCheck = validateOrderStatusTransition(order.order_status, nextStatus, order.payment_status);
    if (!transitionCheck.valid) {
      return res.status(400).json({ error: transitionCheck.reason });
    }

    const now = new Date().toISOString();
    const adminUser = req.adminUser?.username || 'admin';

    if (nextStatus === 'Shipped') {
      if (!carrier || !trackingNumber) {
        return res.status(400).json({ error: 'Carrier name and tracking/AWB number are required to dispatch.' });
      }

      // Insert or update shipment
      const shipmentId = `ship_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      db.prepare(`
        INSERT OR REPLACE INTO shipments (id, order_id, carrier, tracking_number, dispatch_date, delivery_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'DISPATCHED', ?, ?)
      `).run(shipmentId, order.id, carrier.trim(), trackingNumber.trim(), now, now, now);
    }

    db.prepare('UPDATE orders SET order_status = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, order.id);

    db.prepare(`
      INSERT INTO order_status_history (id, order_id, previous_status, new_status, changed_by, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `hist_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      order.id,
      order.order_status,
      nextStatus,
      adminUser,
      nextStatus === 'Shipped'
        ? `Order dispatched via ${carrier} (AWB: ${trackingNumber})`
        : `Order status updated to ${nextStatus}`,
      now
    );

    res.json({
      success: true,
      orderStatus: nextStatus,
      message: `Order successfully updated to ${nextStatus}.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Fulfillment update failed: ' + err.message });
  }
});

// Admin Product Management
apiRouter.get('/admin/products', requireAdmin, (_req: AdminAuthRequest, res: Response) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all() as any[];
    res.json(
      products.map((p) => ({
        ...p,
        is_detachable: Boolean(p.is_detachable),
        is_published: Boolean(p.is_published),
        images: JSON.parse(p.images_json || '[]'),
        variants: JSON.parse(p.variants_json || '[]'),
        priceINR: formatINR(p.selling_price_paise),
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch products: ' + err.message });
  }
});

// Admin Create Product
apiRouter.post('/admin/products', requireAdmin, (req: AdminAuthRequest, res: Response) => {
  try {
    const {
      name,
      sku,
      slug,
      shortDescription,
      fullDescription,
      category,
      sellingPricePaise,
      originalPricePaise,
      material,
      finish,
      chainLength,
      chainThickness,
      pendantHeight,
      pendantWidth,
      pendantThickness,
      pendantWeight,
      claspType,
      isDetachable = 1,
      careInstructions,
      images = [],
      variants = [],
      stockQuantity = 0,
      isPublished = 1,
    } = req.body;

    if (!name || !sku || !slug || !category || sellingPricePaise == null || !material || !finish) {
      return res.status(400).json({ error: 'Missing mandatory product fields (name, sku, slug, price, material, finish).' });
    }

    const id = `prod_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO products (
        id, sku, name, slug, short_description, full_description, category,
        selling_price_paise, original_price_paise, material, finish, chain_length,
        chain_thickness, pendant_height, pendant_width, pendant_thickness, pendant_weight,
        clasp_type, is_detachable, care_instructions, images_json, variants_json,
        stock_quantity, is_published, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      id,
      sku.trim(),
      name.trim(),
      slug.trim().toLowerCase(),
      shortDescription || null,
      fullDescription || null,
      category.trim(),
      parseInt(sellingPricePaise, 10),
      originalPricePaise ? parseInt(originalPricePaise, 10) : null,
      material.trim(),
      finish.trim(),
      chainLength || null,
      chainThickness || null,
      pendantHeight || null,
      pendantWidth || null,
      pendantThickness || null,
      pendantWeight || null,
      claspType || null,
      isDetachable ? 1 : 0,
      careInstructions || null,
      JSON.stringify(images),
      JSON.stringify(variants),
      parseInt(stockQuantity, 10),
      isPublished ? 1 : 0,
      now,
      now
    );

    res.status(201).json({ success: true, id, message: 'Product created successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Product creation failed: ' + err.message });
  }
});

// Admin Update Product
apiRouter.put('/admin/products/:id', requireAdmin, (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      slug,
      shortDescription,
      fullDescription,
      category,
      sellingPricePaise,
      originalPricePaise,
      material,
      finish,
      chainLength,
      chainThickness,
      pendantHeight,
      pendantWidth,
      pendantThickness,
      pendantWeight,
      claspType,
      isDetachable,
      careInstructions,
      images,
      variants,
      stockQuantity,
      isPublished,
    } = req.body;

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE products
      SET name = ?, sku = ?, slug = ?, short_description = ?, full_description = ?,
          category = ?, selling_price_paise = ?, original_price_paise = ?, material = ?,
          finish = ?, chain_length = ?, chain_thickness = ?, pendant_height = ?,
          pendant_width = ?, pendant_thickness = ?, pendant_weight = ?, clasp_type = ?,
          is_detachable = ?, care_instructions = ?, images_json = ?, variants_json = ?,
          stock_quantity = ?, is_published = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name,
      sku,
      slug,
      shortDescription,
      fullDescription,
      category,
      parseInt(sellingPricePaise, 10),
      originalPricePaise ? parseInt(originalPricePaise, 10) : null,
      material,
      finish,
      chainLength,
      chainThickness,
      pendantHeight,
      pendantWidth,
      pendantThickness,
      pendantWeight,
      claspType,
      isDetachable ? 1 : 0,
      careInstructions,
      JSON.stringify(images || []),
      JSON.stringify(variants || []),
      parseInt(stockQuantity, 10),
      isPublished ? 1 : 0,
      now,
      id
    );

    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Product update failed: ' + err.message });
  }
});

// Admin Delete Product
apiRouter.delete('/admin/products/:id', requireAdmin, (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id, name FROM products WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Check if product is referenced in existing order items
    const orderItemCount = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?').get(id) as any;
    if (orderItemCount && orderItemCount.count > 0) {
      // Soft-delete: unpublish and zero stock to preserve order historical records
      const now = new Date().toISOString();
      db.prepare('UPDATE products SET is_published = 0, stock_quantity = 0, updated_at = ? WHERE id = ?').run(now, id);
      return res.json({
        success: true,
        archived: true,
        message: `"${existing.name}" is linked to existing order items. It has been unpublished and archived from the store.`
      });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ success: true, message: `"${existing.name}" has been permanently deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Product deletion failed: ' + err.message });
  }
});

// Admin Toggle Product Publish Status
apiRouter.patch('/admin/products/:id/toggle-publish', requireAdmin, (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = db.prepare('SELECT id, is_published, name FROM products WHERE id = ?').get(id) as any;
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const newStatus = product.is_published ? 0 : 1;
    const now = new Date().toISOString();
    db.prepare('UPDATE products SET is_published = ?, updated_at = ? WHERE id = ?').run(newStatus, now, id);

    res.json({
      success: true,
      isPublished: Boolean(newStatus),
      message: `"${product.name}" is now ${newStatus ? 'Active & Published' : 'Draft / Unpublished'}.`
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle publication status: ' + err.message });
  }
});

// Admin Quick Update Stock
apiRouter.patch('/admin/products/:id/stock', requireAdmin, (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stockQuantity, delta } = req.body;

    const product = db.prepare('SELECT id, stock_quantity, name FROM products WHERE id = ?').get(id) as any;
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    let newStock = product.stock_quantity;
    if (typeof stockQuantity === 'number') {
      newStock = Math.max(0, Math.round(stockQuantity));
    } else if (typeof delta === 'number') {
      newStock = Math.max(0, newStock + Math.round(delta));
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE products SET stock_quantity = ?, updated_at = ? WHERE id = ?').run(newStock, now, id);

    res.json({
      success: true,
      stockQuantity: newStock,
      message: `Stock for "${product.name}" updated to ${newStock}.`
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update stock: ' + err.message });
  }
});

// Admin Bulk Product Actions
apiRouter.post('/admin/products/bulk', requireAdmin, (req: AdminAuthRequest, res: Response) => {
  try {
    const { action, ids } = req.body;
    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid bulk action parameters.' });
    }

    const now = new Date().toISOString();

    if (action === 'publish') {
      const stmt = db.prepare('UPDATE products SET is_published = 1, updated_at = ? WHERE id = ?');
      for (const id of ids) stmt.run(now, id);
      return res.json({ success: true, message: `${ids.length} products published successfully.` });
    }

    if (action === 'draft') {
      const stmt = db.prepare('UPDATE products SET is_published = 0, updated_at = ? WHERE id = ?');
      for (const id of ids) stmt.run(now, id);
      return res.json({ success: true, message: `${ids.length} products moved to draft.` });
    }

    if (action === 'delete') {
      let deleted = 0;
      let archived = 0;
      for (const id of ids) {
        const orderCount = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?').get(id) as any;
        if (orderCount && orderCount.count > 0) {
          db.prepare('UPDATE products SET is_published = 0, stock_quantity = 0, updated_at = ? WHERE id = ?').run(now, id);
          archived++;
        } else {
          db.prepare('DELETE FROM products WHERE id = ?').run(id);
          deleted++;
        }
      }
      return res.json({
        success: true,
        message: `${deleted} products permanently deleted, ${archived} archived (referenced in orders).`
      });
    }

    return res.status(400).json({ error: 'Unrecognized bulk action.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Bulk operation failed: ' + err.message });
  }
});

// Admin Action: Seed Authentic Atelier Vault Collection
apiRouter.post(['/admin/seed', '/admin/seed-catalogue', '/admin/seed-products'], requireAdmin, (_req: AdminAuthRequest, res: Response) => {
  try {
    const result = seedAtelierCatalogue();
    res.json({ success: true, inserted: result.inserted, message: `Successfully populated ${result.inserted} authentic Atelier pieces into database.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Seed failed: ' + err.message });
  }
});

// Admin Settings Get & Update
apiRouter.get('/admin/settings', requireAdmin, (_req: AdminAuthRequest, res: Response) => {
  try {
    const settings = db.prepare('SELECT key, value FROM store_settings').all() as { key: string; value: string }[];
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    res.json(map);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings: ' + err.message });
  }
});

apiRouter.put('/admin/settings', requireAdmin, (req: AdminAuthRequest, res: Response) => {
  try {
    const settings = req.body;
    const now = new Date().toISOString();
    const stmt = db.prepare('INSERT OR REPLACE INTO store_settings (key, value, updated_at) VALUES (?, ?, ?)');

    for (const [key, val] of Object.entries(settings)) {
      if (typeof val === 'string' || typeof val === 'number') {
        stmt.run(key, String(val), now);
      }
    }

    res.json({ success: true, message: 'Store settings saved successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings: ' + err.message });
  }
});

// Explicit 404 handler for any unmatched /api route
apiRouter.use((req: Request, res: Response) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl || req.url}` });
});

// Error handling middleware for apiRouter
apiRouter.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Router Error]', err);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
});


// Admin Seed Catalogue
apiRouter.post('/admin/seed', requireAdmin, (_req: AdminAuthRequest, res: Response) => {
  try {
    const result = seedAtelierCatalogue();
    res.json({ success: true, message: `Successfully seeded ${result.inserted} products.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to seed catalogue: ' + err.message });
  }
});
