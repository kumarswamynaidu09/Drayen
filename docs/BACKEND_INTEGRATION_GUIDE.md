# DRAYEN Atelier — Backend Integration Guide & API Contract Specification

This document provides the complete, authoritative API contract specification for the backend engineer to implement and connect the real backend services to the DRAYEN frontend.

---

## 1. Architecture Overview

The DRAYEN frontend is built as a pure TypeScript Single Page Application (SPA) with gothic luxury aesthetics, zero simulated mock data, and clean service adapters located in `src/services/`.

```
┌────────────────────────────────────────────────────────┐
│                   DRAYEN Frontend                      │
│                                                        │
│  [Views: Shop, Product, Checkout, Payment, Tracking]   │
│                          │                             │
│  [Service Layer: src/services/ (*.ts)]                 │
│   • catalogueService     • cartService                 │
│   • checkoutService      • paymentsService             │
│   • ordersService        • authService                 │
│   • adminService         • shipmentsService            │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON / Multipart
                           ▼
┌────────────────────────────────────────────────────────┐
│                   DRAYEN Backend                       │
│                                                        │
│   • Authoritative Catalogue & Inventory Engine         │
│   • Order Creation & Pricing Verification Engine       │
│   • UPI Settlement & Evidence Verification Desk        │
│   • BlueDart / Delhivery Logistics Webhook Dispatcher  │
│   • Customer Authentication & Address Vault            │
└────────────────────────────────────────────────────────┘
```

All interactions between the UI and server are mediated through strongly typed contracts. When the backend is offline or unconfigured, the UI presents typed integration placeholders (`IntegrationState`) without throwing unhandled exceptions or fabricating fake orders.

---

## 2. Environment Configuration

The frontend consumes environment variables configured in `.env` (derived from `.env.example`):

| Variable Key | Type | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | String | `""` (relative) | Root base URL of the backend API server. |
| `VITE_MERCHANT_UPI_ID` | String | `drayen.atelier@okaxis` | Authoritative merchant UPI Virtual Payment Address (VPA). |
| `VITE_MERCHANT_NAME` | String | `DRAYEN ATELIER` | Merchant legal entity name displayed on UPI apps. |
| `VITE_MERCHANT_QR_URL` | String | `""` | Optional static CDN URL for high-resolution branded merchant QR code. |
| `VITE_FREE_SHIPPING_THRESHOLD_PAISE` | Number | `49900` | Free standard shipping qualification threshold in Paise (₹499.00). |
| `VITE_STANDARD_SHIPPING_FEE_PAISE` | Number | `5000` | Standard insured courier fee in Paise (₹50.00). |

---

## 3. Standard Request & Response Protocols

### Headers
Every JSON API request from the frontend sends:
```http
Accept: application/json
Content-Type: application/json
```
Authenticated user requests send:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```
Guest order tracking and settlement requests send the order token via query parameter or header:
```http
X-Order-Token: <ACCESS_TOKEN>
```

### Standard Error Response Format
When any API endpoint fails, it MUST return standard JSON with HTTP status >= 400:
```json
{
  "error": "Human-readable explanation of why the action was rejected",
  "code": "INVALID_UTR_FORMAT",
  "issues": [
    "UTR must contain exactly 12 alphanumeric digits."
  ]
}
```

---

## 4. Endpoints Specification

### 4.1 Catalogue & Inventory

#### `GET /api/products`
Retrieves products according to filters.
- **Query Parameters**:
  - `category` (optional, string): e.g. `Pendants`, `Gothic Necklaces`, `Chains`
  - `search` (optional, string): Search term matching name, SKU, material, or finish
  - `minPrice` (optional, number): In Paise (e.g. `40000`)
  - `maxPrice` (optional, number): In Paise (e.g. `90000`)
  - `sort` (optional, string): `newest`, `price-asc`, `price-desc`, `name-asc`
  - `page` (optional, number): Default `1`
  - `limit` (optional, number): Default `20`
- **Response `200 OK`**:
```json
[
  {
    "id": "prod-noctis-cross",
    "sku": "DRY-PT-0925",
    "name": "Noctis Cross",
    "slug": "noctis-cross",
    "short_description": "Antique Silver / 316L Stainless Steel",
    "full_description": "A sculpted gothic cross forged from solid 316L surgical stainless steel...",
    "category": "Pendants",
    "selling_price_paise": 69900,
    "original_price_paise": 99900,
    "material": "316L Surgical Grade Steel",
    "finish": "Antique Silver (.925 Look)",
    "chain_length": "20 INCH (50CM)",
    "chain_thickness": "3mm Rounded Box Chain",
    "pendant_height": "42mm",
    "pendant_width": "26mm",
    "pendant_thickness": "3.5mm Solid Core",
    "pendant_weight": "18 Grams",
    "clasp_type": "Heavy-duty Lobster Clasp",
    "is_detachable": true,
    "care_instructions": "Rinse with lukewarm water and mild soap...",
    "images": [
      "https://images.example.com/drayen/noctis-1.jpg"
    ],
    "variants": [
      { "type": "finish", "options": ["Antique Silver", "Obsidian Black"] },
      { "type": "length", "options": ["18 INCH (45CM)", "20 INCH (50CM)", "22 INCH (55CM)"] }
    ],
    "stock_quantity": 24,
    "is_published": 1
  }
]
```

#### `GET /api/products/:slug`
Retrieves a single artifact by slug.
- **Response `200 OK`**: Single product JSON object.
- **Response `404 Not Found`**: `{ "error": "Artifact not located in vault" }`

---

### 4.2 Order Creation & Settlement Flow

#### `POST /api/orders`
Creates a new customer order. Re-validates inventory and authoritative prices server-side.
- **Request Body**:
```json
{
  "customerName": "Aarav Sharma",
  "customerEmail": "aarav@example.com",
  "customerPhone": "9876543210",
  "addressLine1": "Plot 44, Obsidian Heights, 4th Cross",
  "addressLine2": "Floor 7, Suite B",
  "city": "Bengaluru",
  "state": "Karnataka",
  "postalCode": "560001",
  "shippingTier": "standard",
  "paymentMethod": "upi",
  "promoCode": "FIRSTDROP",
  "items": [
    {
      "productId": "prod-noctis-cross",
      "quantity": 1,
      "selectedFinish": "Antique Silver",
      "selectedLength": "20 INCH (50CM)"
    }
  ]
}
```
- **Response `201 Created`**:
```json
{
  "orderNumber": "DRY-2026-849102",
  "accessToken": "tok_9f81a7b3c2d4e5f6",
  "totalPayablePaise": 59900,
  "currency": "INR",
  "paymentStatus": "PENDING",
  "orderStatus": "PROCESSING",
  "createdAt": "2026-03-31T09:30:00.000Z"
}
```

#### `GET /api/orders/:orderNumber/payment-qr?token=<accessToken>`
Generates authoritative payment coordinates and dynamic QR payload for UPI settlement.
- **Response `200 OK`**:
```json
{
  "orderNumber": "DRY-2026-849102",
  "totalPaise": 59900,
  "formattedAmount": "₹599.00",
  "upiId": "drayen.atelier@okaxis",
  "merchantName": "DRAYEN ATELIER",
  "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgo...",
  "upiPayload": "upi://pay?pa=drayen.atelier@okaxis&pn=DRAYEN%20ATELIER&am=599.00&cu=INR&tn=Order%20DRY-2026-849102",
  "paymentStatus": "PENDING",
  "orderStatus": "PROCESSING"
}
```

#### `POST /api/orders/:orderNumber/submit-payment`
Uploads banking proof screenshot and UTR for atelier audit inspection.
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `orderAccessToken` (string, required): Authoritative access token issued at order creation.
  - `utrNumber` (string, required): 12-digit UPI reference number.
  - `paymentProof` (file, required): Image file (JPEG, PNG, WebP up to 10MB).
  - `payerName` (string, optional): Bank account name.
  - `payerVpa` (string, optional): Payer's VPA.
  - `customerNotes` (string, optional): Additional transfer notes.
- **Response `200 OK`**:
```json
{
  "success": true,
  "orderNumber": "DRY-2026-849102",
  "paymentStatus": "SUBMITTED",
  "message": "Payment evidence vaulted. Awaiting curator inspection."
}
```

---

### 4.3 Order Tracking & Logistics

#### `GET /api/orders/:orderNumber?token=<accessToken>`
Retrieves full details and live courier status for an order.
- **Response `200 OK`**:
```json
{
  "orderNumber": "DRY-2026-849102",
  "createdAt": "2026-03-31T09:30:00.000Z",
  "orderStatus": "SHIPPED",
  "paymentStatus": "VERIFIED",
  "totalPaise": 59900,
  "customerName": "Aarav Sharma",
  "customerPhone": "9876543210",
  "shippingTier": "Priority Air Cargo",
  "awbNumber": "BLUEDART-88219348",
  "courierPartner": "BlueDart Apex Air",
  "trackingUrl": "https://www.bluedart.com/tracking?awb=88219348",
  "estimatedDeliveryDate": "2026-04-02",
  "items": [
    {
      "productId": "prod-noctis-cross",
      "name": "Noctis Cross",
      "quantity": 1,
      "pricePaise": 59900,
      "image": "https://images.example.com/drayen/noctis-1.jpg",
      "finish": "Antique Silver",
      "length": "20 INCH (50CM)"
    }
  ]
}
```

---

### 4.4 Customer Accounts, Profiles & Address Vault

All `/api/account/*` endpoints require patron authorization:
```http
Authorization: Bearer <CUSTOMER_JWT_TOKEN>
```

#### `POST /api/auth/login`
Authenticates patron with email/mobile and password.
- **Request Body**:
```json
{
  "email": "patron@drayen.in",
  "phone": "9840012345",
  "password": "StrongPassword123!",
  "rememberMe": true
}
```
- **Response `200 OK`**:
```json
{
  "user": {
    "id": "usr_9921",
    "email": "patron@drayen.in",
    "phone": "9840012345",
    "firstName": "Arjun",
    "lastName": "Verma",
    "createdAt": "2026-03-01T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `POST /api/auth/register`
Creates a new patron account with validated password requirements and patronage consent.
- **Request Body**:
```json
{
  "fullName": "Arjun Verma",
  "email": "patron@drayen.in",
  "phone": "9840012345",
  "password": "StrongPassword123!",
  "consentAgreed": true
}
```
- **Response `201 Created`**: Returns authenticated user object and JWT token.

#### `POST /api/auth/otp` & `POST /api/auth/verify-otp`
SMS-based passwordless OTP authentication.
- **Dispatch**: `{ "phone": "9840012345" }` → Returns `{ "success": true, "message": "OTP dispatched." }`
- **Verification**: `{ "phone": "9840012345", "code": "849201" }` → Returns `{ "user": {...}, "token": "..." }`

#### `POST /api/auth/forgot-password`
Initiates secure passphrase recovery.
- **Request Body**: `{ "identifier": "patron@drayen.in" }`
- **Response `200 OK`**: `{ "success": true, "message": "Recovery instructions dispatched." }`

#### `GET /api/account/profile` & `PUT /api/account/profile`
Retrieves and updates patron profile attributes.
- **Response `200 OK` for GET**:
```json
{
  "id": "usr_9921",
  "fullName": "Arjun Verma",
  "displayName": "Lord of Obsidian",
  "email": "patron@drayen.in",
  "phone": "9840012345",
  "dateOfBirth": "1994-11-20",
  "isEmailVerified": true,
  "isMobileVerified": true,
  "createdAt": "2026-03-01T12:00:00Z"
}
```
- **PUT Body**: `{ "fullName": "...", "displayName": "...", "dateOfBirth": "..." }`

#### `GET /api/account/addresses` & `POST /api/account/addresses`
Manages saved shipping and billing destinations.
- **Address Schema**:
```json
{
  "id": "addr_881",
  "fullName": "Arjun Verma",
  "phone": "9840012345",
  "pincode": "110001",
  "addressLine1": "Apartment 4B, Gothic Chambers",
  "addressLine2": "Connaught Place",
  "landmark": "Near Cathedral Square",
  "city": "New Delhi",
  "state": "Delhi",
  "addressType": "home",
  "isDefault": true
}
```
- **Update**: `PUT /api/account/addresses/:id`
- **Delete**: `DELETE /api/account/addresses/:id`

#### `GET /api/account/wishlist` & `POST /api/account/wishlist`
Synchronises client-side wishlist items to the patron's authoritative cloud account.
- **POST Body**: `{ "productIds": ["prod-noctis-cross", "prod-valravn-pendant"] }`

#### `PUT /api/auth/password` & `DELETE /api/account`
Security and GDPR/DPDP-compliant deletion.
- **PUT Password**: `{ "currentPassword": "...", "newPassword": "..." }`
- **DELETE Account**: Completely expunges patron profile and revokes all active session tokens.

---

## 5. Security & Verification Rules

1. **Authoritative Total Verification**: The client calculates estimated totals for UX feedback, but the backend MUST compute authoritative totals from the database and reject mismatched values.
2. **Payment State Transition**: Orders MUST remain in `PENDING` or `SUBMITTED` state until the staff audit desk verifies the UTR and screenshot proof in the bank statement. Never transition directly to `VERIFIED` without human or banking webhook validation.
3. **Screenshot Storage**: Store screenshots in private, signed-URL storage (e.g. Google Cloud Storage or S3 bucket) and never expose unauthenticated public URLs.

---

## 6. Admin Dashboard & Command Center Endpoints

The DRAYEN Admin Dashboard at `/admin` expects the following authenticated administrative endpoints (`Authorization: Bearer <ADMIN_JWT_TOKEN>`):

### 6.1 Telemetry Overview
#### `GET /api/admin/metrics`
- **Response `200 OK`**:
```json
{
  "totalOrdersCount": 42,
  "awaitingVerificationCount": 3,
  "confirmedOrdersCount": 18,
  "pendingFulfillmentCount": 5,
  "shippedOrdersCount": 16,
  "totalRevenuePaise": 2845000,
  "totalRevenueINR": "₹28,450.00",
  "totalCatalogProductsCount": 8,
  "activePublishedCount": 8,
  "outOfStockCount": 0
}
```

### 6.2 Product Management
#### `GET /api/admin/products`
- **Query Parameters**: `search`, `category`
- **Response `200 OK`**: Array of complete product records including stock and publication status.

#### `POST /api/admin/products`
- **Request Body**: Complete product creation schema (name, SKU, category, sellingPricePaise, originalPricePaise, material, finish, chainLength, chainThickness, pendantDimensions, stockQuantity, images, isPublished).
- **Response `201 Created`**: The persisted Product object.

#### `PUT /api/admin/products/:id`
- **Request Body**: Partial product update fields.
- **Response `200 OK`**: Updated Product object.

### 6.3 Order Management
#### `GET /api/admin/orders`
- **Query Parameters**: `status` (`all`, `PROCESSING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`), `search`
- **Response `200 OK`**: Array of real orders from database.

### 6.4 Payment Verification
#### `GET /api/admin/verifications`
- **Response `200 OK`**: Array of pending payment submissions requiring curatorial audit:
```json
[
  {
    "id": "sub_109238",
    "orderId": "ord_88291",
    "orderNumber": "DRY-2026-849102",
    "amountPaise": 59900,
    "utrNumber": "512398471029",
    "screenshotUrl": "/api/admin/payments/sub_109238/screenshot",
    "submittedAt": "2026-03-31T09:35:00.000Z",
    "paymentStatus": "SUBMITTED",
    "customerName": "Aarav Sharma",
    "customerPhone": "9876543210",
    "payerName": "Aarav Sharma",
    "payerVpa": "aarav@okhdfcbank"
  }
]
```

#### `POST /api/admin/orders/:orderId/verify-payment`
- **Request Body**:
```json
{
  "decision": "approve" | "reject" | "request_correction",
  "notes": "Verified against HDFC merchant bank credit line reference #9921"
}
```
- **Response `200 OK`**: `{ "success": true, "message": "Settlement verified. Order advanced to CONFIRMED." }`

### 6.5 Logistics & Shipment Dispatch
#### `GET /api/admin/shipments`
- **Query Parameters**: `status`, `search`
- **Response `200 OK`**: Array of confirmed consignments eligible for dispatch.

#### `POST /api/admin/orders/:orderId/update-fulfillment`
- **Request Body**:
```json
{
  "nextStatus": "SHIPPED",
  "carrier": "BlueDart Apex Air",
  "trackingNumber": "88219348",
  "dispatchDate": "2026-04-01T10:00:00.000Z"
}
```
- **Response `200 OK`**: `{ "success": true, "message": "AWB assigned and customer notification dispatched." }`

### 6.6 Store Settings
#### `GET /api/admin/settings`
- **Response `200 OK`**: Authoritative store configuration (merchant VPA, shipping thresholds).

#### `POST /api/admin/settings`
- **Request Body**: Updated configuration fields.
- **Response `200 OK`**: Updated store settings.

---

## 7. Security Architecture for the Backend Engineer

The backend developer MUST implement:
1. **Admin Authentication**: JWT or secure session-based authentication with high-entropy secrets stored in server environment variables.
2. **Role-Based Access Control (RBAC)**: Enforce `role === 'admin'` or `role === 'auditor'` on all `/api/admin/*` routes.
3. **Audit History Log**: Every payment approval and rejection MUST be recorded in an immutable audit ledger (`verified_by`, `decision`, `timestamp`, `rejection_reason`).
4. **Private Screenshot Streaming**: Store payment screenshots in an access-controlled bucket. Only stream screenshots through authenticated proxy routes (`GET /api/admin/payments/:id/screenshot`) with administrative authorization checks.
5. **Authoritative Stock Validation**: When a payment is approved, deduct stock atomically from the inventory table. Reject approval if stock is exhausted.
