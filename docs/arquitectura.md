# Arquitectura Técnica: Catálogo E-Commerce de Calzado / Technical Architecture: Footwear E-Commerce Catalog

---

# 🇪🇸 VERSIÓN EN ESPAÑOL

## 1. RESUMEN DE ARQUITECTURA TÉCNICA

* **Framework Fullstack:** Next.js (App Router, Node.js Serverless API Routes / Server Actions).
* **Base de Datos:** MongoDB (vía Mongoose ODM o Driver oficial `mongodb`).
* **Almacenamiento CDN de Imágenes:** ImageKit / Cloudinary / AWS S3 (Persistencia exclusiva de URLs públicas en la base de datos).
* **Validación de Datos:** Zod (Schemas compartidos entre cliente y servidor).
* **Autenticación Admin:** NextAuth.js / Jose (JWT en HttpOnly Cookies) para rutas `/api/admin/*`.
* **Sistema de Diseño UI:** UI basada de manera estricta en la especificación [DESIGN.md](file:///Users/carlosjimenez/Documents/Repositorios/e-commerce/docs/DESIGN.md) (sistema de diseño estilo Nike, botones pill, paleta neutra e tipografía de alto contraste).

```mermaid
flowchart TD
    Client[Cliente / Navegador] -->|Next.js App Router| Frontend[Frontend Web / React]
    Frontend -->|POST /api/checkout/create-order| ServerlessAPI[Next.js Serverless API]
    ServerlessAPI -->|Query / Update| Mongo[MongoDB Database]
    Frontend -->|Redirección wa.me| WhatsApp[App WhatsApp Cliente]
    Admin[Admin Panel] -->|POST /api/admin/*| ServerlessAPI
    Admin -->|Upload Imagen| CDN[ImageKit / CDN External]
    CDN -->|Retorna URL| Admin
```

---

## 2. MODELO DE DATOS Y ESQUEMAS (MONGODB / MONGOOSE)

### 2.1 Colección `brands`
```typescript
interface IBrand {
  _id: Types.ObjectId;
  name: string; // Único, indexado
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Colección `footwear_types`
```typescript
interface IFootwearType {
  _id: Types.ObjectId;
  name: string; // Único
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.3 Colección `products`
```typescript
interface IProductImage {
  url: string;
  isPrincipal: boolean;
  position: number;
}

interface ISizeStock {
  size: number; // ej: 42
  stock: number; // ej: 15
}

interface IProduct {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number; // Guardado en unidades mínimas o flotante positivo
  brandId: Types.ObjectId; // Ref -> Brand (Inmutable post-creación)
  typeId: Types.ObjectId; // Ref -> FootwearType (Inmutable post-creación)
  gender: 'Hombre' | 'Mujer' | 'Niño' | 'Unisex'; // (Inmutable post-creación)
  active: boolean;
  images: IProductImage[];
  sizesStock: ISizeStock[];
  createdAt: Date;
  updatedAt: Date;
}
// Índices: { active: 1, brandId: 1, typeId: 1, gender: 1 }, { "sizesStock.size": 1 }
```

### 2.4 Colección `orders` (Solicitudes de Venta)
```typescript
interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  size: number;
  qty: number;
  unitPrice: number; // Snapshot del precio al momento del checkout
  subtotal: number; // qty * unitPrice
}

interface ICustomerGuest {
  name: string;
  lastName: string;
  phone: string;
}

interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string; // Único, formato "PED-YYYY-XXXXX", indexado
  guest: ICustomerGuest;
  items: IOrderItem[];
  subtotal: number;
  discount: number; // Por defecto 0
  total: number; // subtotal - discount
  paymentMethod: 'transferencia' | 'efectivo';
  status: 'pendiente' | 'confirmada' | 'cancelada';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
// Índices: { orderNumber: 1 }, { status: 1, createdAt: -1 }
```

### 2.5 Colección `sales_records` (Ventas Confirmadas)
```typescript
interface ISalesRecord {
  _id: Types.ObjectId;
  orderId: Types.ObjectId; // Ref -> Order (Único)
  orderNumber: string;
  confirmationDate: Date;
  recordedPaymentMethod: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';
  appliedDiscountNote?: string;
  finalTotal: number;
  createdAt: Date;
}
```

### 2.6 Colección `promotions` (Carrusel)
```typescript
interface IPromotion {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  imageUrl: string;
  active: boolean;
  order: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. ESPECIFICACIÓN DE ENDPOINTS DE API

### 3.1 PÚBLICOS (CLIENTE)

#### `GET /api/products`
Retorna productos activos para el catálogo de la landing.
- **Query Parameters:**
  - `brandId` (opcional, string CSV): ID de marca
  - `typeId` (opcional, string CSV): ID de tipo de calzado
  - `size` (opcional, number CSV): Talle
  - `search` (opcional, string): Búsqueda por nombre
  - `random` (opcional, boolean): Si es true, retorna muestra aleatoria
  - `page` (default: 1), `limit` (default: 20)
- **Response `200 OK`:**
  ```json
  {
    "ok": true,
    "data": [
      {
        "_id": "66b1a2f3c4e5d6a7b8c9d0e1",
        "name": "Nike Air Max 90",
        "price": 120000,
        "brand": { "_id": "...", "name": "Nike" },
        "type": { "_id": "...", "name": "Running" },
        "gender": "Hombre",
        "mainImage": "https://ik.imagekit.io/store/nike-air-max.jpg",
        "sizesStock": [{ "size": 42, "stock": 5 }],
        "isOutOfStock": false
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
  }
  ```

#### `POST /api/checkout/create-order`
Crea una Solicitud de Venta en estado `pendiente`.
- **Payload DTO (Zod Schema):**
  ```json
  {
    "guest": {
      "name": "Juan",
      "lastName": "Pérez",
      "phone": "3815218630"
    },
    "paymentMethod": "transferencia",
    "items": [
      {
        "productId": "66b1a2f3c4e5d6a7b8c9d0e1",
        "size": 42,
        "qty": 1
      }
    ]
  }
  ```
- **Procesamiento Interno:**
  1. Valida existencia y estado `activo` de los productos.
  2. Obtiene el precio unitario real desde MongoDB (evita spoofing del cliente).
  3. Genera secuencialmente el `orderNumber` (`PED-2026-XXXX`).
  4. Inserta en la colección `orders` con `status: "pendiente"`.
- **Response `201 Created`:**
  ```json
  {
    "ok": true,
    "orderId": "66b9e8f7a6b5c4d3e2f1a0b9",
    "orderNumber": "PED-2026-06810",
    "subtotal": 120000,
    "discount": 0,
    "total": 120000
  }
  ```
- **Error Response `400 Bad Request`:**
  ```json
  {
    "ok": false,
    "error": "BAD_REQUEST",
    "message": "Uno o más productos seleccionados ya no están activos o no existen."
  }
  ```

---

### 3.2 ADMINISTRATIVOS (`/api/admin/*` - Requieren Auth)

#### `POST /api/admin/orders/:id/confirm`
Confirma una solicitud de venta, registra medio de pago y descuenta stock en transacción MongoDB.
- **Payload DTO:**
  ```json
  {
    "recordedPaymentMethod": "transferencia",
    "discountNote": "10% Descuento Cliente Frecuente",
    "finalTotal": 108000
  }
  ```
- **Lógica de Transacción:**
  1. Verifica que la orden esté en estado `pendiente`.
  2. Verifica que haya stock suficiente para cada `productId` + `size`.
  3. Decrementa stock: `UPDATE products SET sizesStock.$.stock = sizesStock.$.stock - qty WHERE _id = productId AND sizesStock.size = size`.
  4. Actualiza orden a `status: "confirmada"`.
  5. Crea documento en `sales_records`.
- **Response `200 OK`:**
  ```json
  {
    "ok": true,
    "message": "Venta confirmada exitosamente y stock actualizado.",
    "salesRecordId": "66c0a1b2c3d4e5f6a7b8c9d0"
  }
  ```
- **Error Response `409 Conflict` (Sin Stock):**
  ```json
  {
    "ok": false,
    "error": "INSUFFICIENT_STOCK",
    "message": "Stock insuficiente para Nike Air Max 90 (Talle 42). Disponible: 0, Requerido: 1"
  }
  ```

#### `POST /api/admin/products/import-csv`
Importa masivamente productos y stock desde un archivo CSV.
- **Payload:** `multipart/form-data` con campo `file` (archivo .csv).
- **Formato CSV Esperado:**
  `nombre,marca,tipo_calzado,genero,precio,descripcion,talle,stock`
- **Response `200 OK`:**
  ```json
  {
    "ok": true,
    "summary": {
      "productsCreated": 12,
      "productsUpdated": 4,
      "stockEntriesLoaded": 48,
      "errors": []
    }
  }
  ```

---

## 4. GENERADOR DE MENSAJE DE WHATSAPP (UTILITY LOGIC)

Lógica encargada de construir la URL de apertura nativa a WhatsApp en el Paso 3 del Checkout:

```typescript
export function buildWhatsAppShareUrl(order: IOrderSummary, storePhone: string): string {
  const itemsText = order.items
    .map(item => `• ${item.qty}x ${item.name} (Talle ${item.size}) - $${item.subtotal.toLocaleString('es-AR')}`)
    .join('\n');

  const message = 
`¡Hola! Acabo de hacer mi pedido en la tienda 👟

👤 *CLIENTE*
• ${order.guest.name} ${order.guest.lastName}
📱 ${order.guest.phone}

📦 *PEDIDO #${order.orderNumber}*
${itemsText}

💰 *TOTAL:* $${order.total.toLocaleString('es-AR')}

Ahí transfiero al alias: TIENDA.CALZADO
¡Adjunto el comprobante!`;

  return `https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`;
}
```

---

## 5. VARIABLES DE ENTORNO REQUERIDAS (`.env.local`)

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/e-commerce?retryWrites=true&w=majority

# NextAuth / Auth JWT Secret
NEXTAUTH_SECRET=tu_secreto_super_seguro_jwt_32_caracteres
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$hashedpassword...

# Store Configuration
NEXT_PUBLIC_STORE_NAME="Catálogo Calzado"
NEXT_PUBLIC_WHATSAPP_PHONE="5493815218630"
NEXT_PUBLIC_BANK_ALIAS="TIENDA.CALZADO"
NEXT_PUBLIC_BANK_HOLDER="Juan Pérez"
NEXT_PUBLIC_BANK_NAME="Banco Galicia"

# External Image CDN (ImageKit / Cloudinary)
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/tu_cuenta"
IMAGEKIT_PRIVATE_KEY="private_..."
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="public_..."
```

---
---

# 🇬🇧 ENGLISH VERSION

## 1. TECHNICAL ARCHITECTURE SUMMARY

* **Fullstack Framework:** Next.js (App Router, Node.js Serverless API Routes / Server Actions).
* **Database:** MongoDB (via Mongoose ODM or official `mongodb` driver).
* **CDN Image Storage:** ImageKit / Cloudinary / AWS S3 (Exclusive persistence of public URLs in the database).
* **Data Validation:** Zod (Shared schemas between client and server).
* **Admin Authentication:** NextAuth.js / Jose (JWT in HttpOnly Cookies) for `/api/admin/*` routes.
* **UI Design System:** UI strictly driven by tokens from [DESIGN.md](file:///Users/carlosjimenez/Documents/Repositorios/e-commerce/docs/DESIGN.md) (Nike-inspired athletic-editorial style, pill CTAs, neutral palette, and high-contrast typography).

---

## 2. DATA MODEL & SCHEMAS (MONGODB / MONGOOSE)

### 2.1 Collection `brands`
```typescript
interface IBrand {
  _id: Types.ObjectId;
  name: string; // Unique, indexed
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Collection `footwear_types`
```typescript
interface IFootwearType {
  _id: Types.ObjectId;
  name: string; // Unique
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.3 Collection `products`
```typescript
interface IProductImage {
  url: string;
  isPrincipal: boolean;
  position: number;
}

interface ISizeStock {
  size: number; // e.g., 42
  stock: number; // e.g., 15
}

interface IProduct {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  brandId: Types.ObjectId; // Ref -> Brand (Immutable after creation)
  typeId: Types.ObjectId; // Ref -> FootwearType (Immutable after creation)
  gender: 'Hombre' | 'Mujer' | 'Niño' | 'Unisex'; // (Immutable after creation)
  active: boolean;
  images: IProductImage[];
  sizesStock: ISizeStock[];
  createdAt: Date;
  updatedAt: Date;
}
// Indexes: { active: 1, brandId: 1, typeId: 1, gender: 1 }, { "sizesStock.size": 1 }
```

### 2.4 Collection `orders` (Sales Requests)
```typescript
interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  size: number;
  qty: number;
  unitPrice: number; // Price snapshot at checkout
  subtotal: number; // qty * unitPrice
}

interface ICustomerGuest {
  name: string;
  lastName: string;
  phone: string;
}

interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string; // Unique, format "PED-YYYY-XXXXX", indexed
  guest: ICustomerGuest;
  items: IOrderItem[];
  subtotal: number;
  discount: number; // Default 0
  total: number; // subtotal - discount
  paymentMethod: 'transferencia' | 'efectivo';
  status: 'pendiente' | 'confirmada' | 'cancelada';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
// Indexes: { orderNumber: 1 }, { status: 1, createdAt: -1 }
```

### 2.5 Collection `sales_records` (Confirmed Sales)
```typescript
interface ISalesRecord {
  _id: Types.ObjectId;
  orderId: Types.ObjectId; // Ref -> Order (Unique)
  orderNumber: string;
  confirmationDate: Date;
  recordedPaymentMethod: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';
  appliedDiscountNote?: string;
  finalTotal: number;
  createdAt: Date;
}
```

---

## 3. API ENDPOINTS SPECIFICATION

### 3.1 PUBLIC (CUSTOMER)

#### `GET /api/products`
Returns active products for the landing page catalog.
- **Query Parameters:** `brandId`, `typeId`, `size`, `search`, `random`, `page`, `limit`.

#### `POST /api/checkout/create-order`
Creates a Sales Request in `pendiente` status.
- **Payload DTO (Zod Schema):**
  ```json
  {
    "guest": {
      "name": "Juan",
      "lastName": "Pérez",
      "phone": "3815218630"
    },
    "paymentMethod": "transferencia",
    "items": [
      {
        "productId": "66b1a2f3c4e5d6a7b8c9d0e1",
        "size": 42,
        "qty": 1
      }
    ]
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "ok": true,
    "orderId": "66b9e8f7a6b5c4d3e2f1a0b9",
    "orderNumber": "PED-2026-06810",
    "subtotal": 120000,
    "discount": 0,
    "total": 120000
  }
  ```

---

### 3.2 ADMIN (`/api/admin/*` - Protected)

#### `POST /api/admin/orders/:id/confirm`
Confirms a sales request, records payment method, and decrements size stock inside a MongoDB transaction.
- **Payload DTO:**
  ```json
  {
    "recordedPaymentMethod": "transferencia",
    "discountNote": "10% Frequent Customer Discount",
    "finalTotal": 108000
  }
  ```

#### `POST /api/admin/products/import-csv`
Bulk imports products and stock inventory from a CSV file.
