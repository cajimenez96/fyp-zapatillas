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
  retailPrice: number; // Precio minorista (< 5 pares)
  wholesalePrice: number; // Precio mayorista (>= 5 pares totales en la compra)
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

### 2.4 Colección `orders` (Solicitudes y Ventas)
```typescript
interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  size: number;
  qty: number;
  appliedPriceType: 'retail' | 'wholesale' | 'custom';
  unitPrice: number; // Snapshot del precio al momento de la venta u orden
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
  origin: 'web' | 'admin_direct'; // Identifica venta por checkout web o POS directo admin
  guest: ICustomerGuest;
  items: IOrderItem[];
  subtotal: number;
  discount: number; // Monto o 0 por defecto
  total: number; // subtotal - discount
  paymentMethod: 'transferencia' | 'efectivo' | 'tarjeta' | 'otro';
  status: 'pendiente' | 'autorizado' | 'cancelado';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
// Índices: { orderNumber: 1 }, { status: 1, createdAt: -1 }, { origin: 1 }
```

### 2.5 Colección `sales_records` (Histórico de Autorizaciones y Registro de Caja)
```typescript
interface ISalesRecord {
  _id: Types.ObjectId;
  orderId: Types.ObjectId; // Ref -> Order (Único)
  orderNumber: string;
  authorizationDate: Date;
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

## 3. ESPECIFICACIÓN DE ARQUITECTURA Y ENDPOINTS DE API

### 3.1 CAPA DE CLIENTE Y LÓGICA DE TIENDA (PÚBLICOS)

#### `GET /api/products`
Retorna productos activos indicando precios minorista y mayorista.
- **Query Parameters:** `brandId`, `typeId`, `size`, `search`, `random`, `page`, `limit`
- **Response `200 OK`:**
  ```json
  {
    "ok": true,
    "data": [
      {
        "_id": "66b1a2f3c4e5d6a7b8c9d0e1",
        "name": "Nike Air Max 90",
        "retailPrice": 120000,
        "wholesalePrice": 95000,
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

#### Lógica de Recálculo Mayorista en Frontend (`CartContext`)
- Se suma la cantidad total de pares en el carrito: `totalPairs = items.reduce((sum, item) => sum + item.qty, 0)`.
- Si `totalPairs >= 5`, se aplica `wholesalePrice` a cada producto del carrito y se marca `appliedPriceType = 'wholesale'`.
- Si `totalPairs < 5`, se utiliza `retailPrice` y se marca `appliedPriceType = 'retail'`.

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
        "qty": 5
      }
    ]
  }
  ```
- **Procesamiento Interno (Validación Server-side de Precios):**
  1. Verifica validez y disponibilidad de stock de cada producto+talle.
  2. Evalúa la suma total de pares solicitados (`sum(qty)`).
  3. Asigna server-side `wholesalePrice` si la suma es $\ge 5$, o `retailPrice` si es $< 5$ (previene spoofing del cliente).
  4. Crea la orden con `origin: "web"` y `status: "pendiente"`.
- **Response `201 Created`:**
  ```json
  {
    "ok": true,
    "orderId": "66b9e8f7a6b5c4d3e2f1a0b9",
    "orderNumber": "PED-2026-06810",
    "appliedPriceType": "wholesale",
    "subtotal": 475000,
    "discount": 0,
    "total": 475000
  }
  ```

---

### 3.2 ADMINISTRATIVOS Y PUNTO DE VENTA (`/api/admin/*` - Requieren Auth)

#### `PUT /api/admin/orders/:id`
Actualiza un pedido web en estado `pendiente` (edición de productos, cantidades o precio total negociado).
- **Payload DTO:**
  ```json
  {
    "guest": {
      "name": "Juan",
      "lastName": "Pérez",
      "phone": "3815218630"
    },
    "items": [
      {
        "productId": "66b1a2f3c4e5d6a7b8c9d0e1",
        "size": 42,
        "qty": 2,
        "unitPrice": 95000
      }
    ],
    "discount": 10000,
    "notes": "Acuerdo telefónico por par adicional"
  }
  ```
- **Procesamiento:** Modifica los ítems y totales de la orden en estado `pendiente`. **No descuenta stock aún.**

#### `POST /api/admin/orders/:id/authorize`
Autoriza un pedido pendiente, registra la venta y ejecuta el descuento efectivo de stock en transacción MongoDB.
- **Payload DTO:**
  ```json
  {
    "recordedPaymentMethod": "transferencia",
    "discountNote": "Descuento por volumen especial",
    "finalTotal": 180000
  }
  ```
- **Lógica de Transacción:**
  1. Verifica que el pedido esté en estado `pendiente`.
  2. Verifica disponibilidad de stock en `sizesStock` para cada producto+talle.
  3. Descuenta el stock: `sizesStock.$.stock = sizesStock.$.stock - qty`.
  4. Actualiza la orden a `status: "autorizado"`.
  5. Crea registro en `sales_records`.

#### `POST /api/admin/sales/create-direct` (Punto de Venta Admin / POS)
Registra una venta directa efectuada desde el panel de administración.
- **Payload DTO:**
  ```json
  {
    "guest": {
      "name": "Cliente",
      "lastName": "Mostrador",
      "phone": "3810000000"
    },
    "paymentMethod": "efectivo",
    "items": [
      {
        "productId": "66b1a2f3c4e5d6a7b8c9d0e1",
        "size": 40,
        "qty": 1,
        "unitPrice": 120000
      }
    ],
    "discount": 0
  }
  ```
- **Procesamiento:** Inserta la orden directamente con `origin: "admin_direct"` y `status: "autorizado"`, ejecutando en la misma transacción el **descuento automático e inmediato de stock** para garantizar stock único real en la tienda.

#### `POST /api/admin/products/import-csv`
Importación masiva de productos con soporte de doble precio.
- **Formato CSV Esperado:**
  `nombre,marca,tipo_calzado,genero,precio_minorista,precio_mayorista,descripcion,talle,stock`

---

## 4. IMPACTO EN COMPONENTES UI Y ESTADO DEL CLIENTE

### 4.1 UI Cliente (Tienda)
- **Tarjetas de Producto y Modal de Detalle (`ProductCard`, `ProductDetailModal`):**
  - Muestran badge dinámico indicando el beneficio de precio mayorista al llevar 5 o más pares.
- **Carrito de Compras (`CartDrawer` & `CartContext`):**
  - Barra de progreso interactiva para alcanzar los 5 pares.
  - Recálculo inmediato de precios y totales en tiempo real al pasar el umbral de 5 unidades.

### 4.2 UI Administrador (Panel)
- **Formulario de Productos (`ProductForm`):** Campos independientes de input numérico para `precioMinorista` y `precioMayorista`.
- **Modal/Pantalla de Gestión de Pedidos (`OrderEditModal`):** Editor de ítems y precios finales para pedidos pendientes con botones de "Autorizar Venta" y "Cancelar".
- **Pantalla Punto de Venta Directo (`AdminPosPage`):** Buscador ágil de productos por talle, carga rápida de datos de cliente y confirmación instantánea con descuento de inventario.

---

## 5. GENERADOR DE MENSAJE DE WHATSAPP (UTILITY LOGIC)

```typescript
export function buildWhatsAppShareUrl(order: IOrderSummary, storePhone: string): string {
  const itemsText = order.items
    .map(item => `• ${item.qty}x ${item.name} (Talle ${item.size}) - $${item.subtotal.toLocaleString('es-AR')}`)
    .join('\n');

  const priceBadge = order.appliedPriceType === 'wholesale' ? '\n🔥 *¡Precio Mayorista Aplicado!*' : '';

  const message = 
`¡Hola! Acabo de hacer mi pedido en la tienda 👟

👤 *CLIENTE*
• ${order.guest.name} ${order.guest.lastName}
📱 ${order.guest.phone}

📦 *PEDIDO #${order.orderNumber}*${priceBadge}
${itemsText}

💰 *TOTAL:* $${order.total.toLocaleString('es-AR')}

Ahí transfiero al alias: TIENDA.CALZADO
¡Adjunto el comprobante!`;

  return `https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`;
}
```

---

## 6. VARIABLES DE ENTORNO REQUERIDAS (`.env.local`)

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

* **Fullstack Framework:** Next.js (App Router, Serverless API Routes / Server Actions).
* **Database:** MongoDB (via Mongoose ODM or official `mongodb` driver).
* **CDN Image Storage:** ImageKit / Cloudinary / AWS S3.
* **Data Validation:** Zod.
* **Admin Authentication:** NextAuth.js / Jose.
* **UI Design System:** Governed by [DESIGN.md](file:///Users/carlosjimenez/Documents/Repositorios/e-commerce/docs/DESIGN.md).

---

## 2. DATA MODEL & SCHEMAS (MONGODB / MONGOOSE)

### 2.1 Collection `products`
```typescript
interface IProduct {
  _id: Types.ObjectId;
  name: string;
  description: string;
  retailPrice: number; // Standard price (< 5 total pairs)
  wholesalePrice: number; // Volume price (>= 5 total pairs in order)
  brandId: Types.ObjectId;
  typeId: Types.ObjectId;
  gender: 'Hombre' | 'Mujer' | 'Niño' | 'Unisex';
  active: boolean;
  images: IProductImage[];
  sizesStock: ISizeStock[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Collection `orders`
```typescript
interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  size: number;
  qty: number;
  appliedPriceType: 'retail' | 'wholesale' | 'custom';
  unitPrice: number;
  subtotal: number;
}

interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  origin: 'web' | 'admin_direct';
  guest: ICustomerGuest;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'transferencia' | 'efectivo' | 'tarjeta' | 'otro';
  status: 'pendiente' | 'autorizado' | 'cancelado';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. API ENDPOINTS SPECIFICATION

- `GET /api/products`: Exposes `retailPrice` and `wholesalePrice`.
- `POST /api/checkout/create-order`: Evaluates total pairs ($\ge 5$) server-side to apply wholesale unit prices safely.
- `PUT /api/admin/orders/:id`: Edits pending order items, quantities, and custom pricing without touching stock.
- `POST /api/admin/orders/:id/authorize`: Authorizes order and decrements stock in a MongoDB transaction.
- `POST /api/admin/sales/create-direct`: Registers direct POS sales as `autorizado` with instant stock deduction.
- `POST /api/admin/products/import-csv`: Supports CSV header with `precio_minorista` and `precio_mayorista`.
