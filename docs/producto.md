# Especificación de Producto: Catálogo E-Commerce de Calzado / Product Specification: Footwear E-Commerce Catalog

---

# 🇪🇸 VERSIÓN EN ESPAÑOL

## 1. VISIÓN DEL PRODUCTO

**Plataforma web e-commerce de venta de calzado** orientada a la conversión rápida y ágil. Funciona como un catálogo interactivo con checkout guiado donde:
- **Clientes (Compradores):** Navegan el catálogo, filtran productos, arman su carrito y completan un proceso de checkout en 3 pasos que culmina registrando el pedido en la base de datos y redirigiendo al cliente a **WhatsApp** con un mensaje predefinido con el número de orden generado y el resumen de la compra para enviar el comprobante de pago.
- **Administrador:** Gestiona el catálogo (marcas, tipos de calzado, productos, stock por talle, promociones), atiende solicitudes de venta pendientes, confirma ventas (registrando medio de pago y aplicando descuentos manuales, lo que descuenta stock automáticamente) y consulta reportes/métricas.

### Fuera de Alcance (Out of Scope):
- Autenticación o registro de clientes.
- Campo obligatorio de correo electrónico (email).
- Pasarelas de pago automatizadas (MercadoPago, Stripe, etc.).
- Rastreo automático de envíos.
### Sistema de Diseño UI:
- Toda la interfaz de usuario se rige de manera estricta por las guías y tokens definidos en el archivo [DESIGN.md](file:///Users/carlosjimenez/Documents/Repositorios/e-commerce/docs/DESIGN.md) (estilo deportivo-editorial inspirado en Nike, tipografía contrastada, paleta neutra con botones píldora `#111111`, fondos `#f5f5f5` para calzado y sistema de grillas de 8px).

---

## 2. ENTIDADES PRINCIPALES DEL NEGOCIO

### 2.1 Marca
Fabricante del calzado (ej: Nike, Adidas, New Balance, Puma).
- **Atributos:** `nombre` (único, requerido).
- **Relaciones:** 1 a N con Productos.

### 2.2 Tipo de Calzado
Categoría funcional o de estilo del calzado (ej: Zapatilla Running, Zapato Elegante, Ojota, Pantufla).
- **Atributos:** `nombre` (único, requerido), `descripcion` (opcional).
- **Relaciones:** 1 a N con Productos.

### 2.3 Género
Público objetivo del producto.
- **Valores permitidos:** `Hombre`, `Mujer`, `Niño`, `Unisex`.
- **Atributos:** `nombre`.
- **Relaciones:** Define las escalas de talles disponibles.

### 2.4 Talle
Medida física del calzado según género.
- **Estructura típica por Género:**
  - Hombre / Unisex: 36 al 45
  - Mujer: 33 al 42
  - Niño: 25 al 35
- **Atributos:** `valor` (número/string), `genero`.
- **Relaciones:** Pertenece a 1 Género; N a N con Productos (pivote con stock).

### 2.5 Producto
Modelo específico de calzado expuesto en la tienda.
- **Atributos:**
  - `nombre` (ej: "Nike Air Max 90")
  - `descripcion` (texto detallado)
  - `precio` (número decimal, fijo)
  - `activo` (booleano, para ocultar/mostrar en tienda)
  - `imagenes` (array de URLs externas)
  - `stockPorTalle` (array de objetos `{ talle, stock }`)
- **Relaciones:**
  - Pertenece a 1 Marca (inmutable tras creación).
  - Pertenece a 1 Tipo de Calzado (inmutable tras creación).
  - Pertenece a 1 Género (inmutable tras creación).

### 2.6 Imagen de Producto
Referencia a imágenes alojadas en CDN externa (ImageKit / Cloudinary / S3).
- **Atributos:** `url` (String), `isPrincipal` (booleano), `posicion` (número entero para galería).

### 2.7 Promoción
Banners publicitarios e informativos mostrados en el carrusel de la página principal.
- **Atributos:** `titulo`, `descripcion` (opcional), `imageUrl` (URL del banner), `activa` (booleano), `fechaInicio` (opcional), `fechaFin` (opcional), `orden` (número).
- **Propósito:** Meramente visual/informativo. **No modifica automáticamente precios ni aplica descuentos en el checkout**.

### 2.8 Solicitud de Venta (Order / Pedido)
Registro de intención de compra generado cuando el cliente presiona "Confirmar pedido" en la web.
- **Atributos:**
  - `id` (ObjectId)
  - `orderNumber` (Código legible único, ej: `PED-2026-00101`)
  - `fechaCreacion` (Timestamp)
  - `cliente`:
    - `nombre` (Requerido)
    - `apellido` (Requerido)
    - `telefono` (Requerido)
  - `estado`: `pendiente` | `confirmada` | `cancelada`
  - `items`: Lista de productos solicitados. Cada ítem guarda: `productId`, `nombre`, `talle`, `cantidad`, `precioUnitario` (snapshot al momento de comprar), `subtotal`.
  - `subtotal` (Suma de subtotales de ítems)
  - `descuento` (Monto o 0 por defecto)
  - `total` (Subtotal - Descuento)
  - `medioPago` (`transferencia` | `efectivo`)

### 2.9 Registro de Venta (Confirmación Admin)
Confirmación definitiva del pedido efectuada por el administrador.
- **Atributos:**
  - `solicitudId` (Referencia a Solicitud de Venta)
  - `fechaConfirmacion` (Timestamp)
  - `medioPagoRegistrado` (`efectivo` | `transferencia` | `tarjeta` | `otro`)
  - `descuentoAplicado` (Monto/porcentaje o nota explícita, ej: "$5.000 / 10% Cliente Frecuente")
  - `totalFinal` (Monto final cobrado)
- **Efecto Secundario:** Al confirmar, se decrementa de forma automática el stock de cada producto+talle involucrado.

---

## 3. FLUJO DE USUARIO: CLIENTE (COMPRADOR)

### 3.1 Descubrir Productos (Landing Page)
1. El cliente entra a la web y visualiza:
   - Carrusel de promociones activas.
   - Grilla de productos aleatorios o destacados.
   - Tarjetas de productos con: Imagen principal, Nombre, Marca, Tipo de calzado, Precio y etiqueta "SIN STOCK" si aplica.
2. Filtros disponibles: Por Marca (multiselect), Tipo de Calzado (multiselect) y Talle (multiselect).

### 3.2 Ver Detalle de Producto
1. Click en la tarjeta abre el modal/pantalla de producto con:
   - Galería de imágenes (CDN).
   - Información completa (Nombre, Marca, Tipo, Género, Precio, Descripción).
   - Selector de Talle (filtrado por talles habilitados para el género del producto con stock actual).
   - Selector de Cantidad (1 a stock disponible).
   - Botón **"Agregar al carrito"** (deshabilitado si stock general es 0).

### 3.3 Checkout en 3 Pasos (Estilo Epicodes)

```
[ PASO 1: TUS DATOS ] ──> [ PASO 2: TU PEDIDO ] ──> [ PASO 3: PAGO & WHATSAPP ]
```

* **Paso 1: Tus Datos**
  - Formulario con campos: Nombre, Apellido, Teléfono (WhatsApp). *(Sin campo email)*.
  - Botón: "Continuar al pago".

* **Paso 2: Tu Pedido**
  - Resumen de ítems agregados (Producto, Talle, Cantidad, Subtotal).
  - Campo opcional de cupón / notas.
  - Sección de resumen de datos de contacto ingresados en Paso 1.
  - Botón: **"Confirmar pedido"** $\rightarrow$ Al hacer click:
    - Dispara request HTTP `POST /api/checkout/create-order`.
    - El backend registra la orden en la base de datos en estado `pendiente` y genera el `orderNumber` (ej: `PED-2026-06810`).
    - Avanza automáticamente al Paso 3.

* **Paso 3: Pago & Confirmación con WhatsApp**
  - Muestra cartel: *"¡Pedido registrado! Orden #PED-2026-06810"*.
  - Muestra caja con Datos de Transferencia (Alias, Titular, Banco, Monto exacto a transferir) con botones para copiar rápidamente.
  - Botón destacado verde: **"Enviar resumen del pedido"** (Link `wa.me/NUMERO_TIENDA?text=...`).
  - Al hacer click en el botón verde, se abre WhatsApp con un mensaje estructurado:
    ```text
    ¡Hola! Acabo de hacer mi pedido en la tienda 👟

    👤 *CLIENTE*
    • Juan Pérez
    📱 3815218630

    📦 *PEDIDO #PED-2026-06810*
    • 1x Nike Air Max 90 (Talle 42) - $120.000

    💰 *TOTAL:* $120.000

    Ahí transfiero al alias: TIENDA.CALZADO (Juan Pérez)
    ¡Adjunto el comprobante!
    ```

---

## 4. FLUJO DE USUARIO: ADMINISTRADOR

1. **Autenticación:** Login simple con usuario y contraseña (credenciales de admin en variables de entorno o colección de usuarios admin).
2. **Gestión de Catalogos:** CRUD de Marcas (solo nombre) y Tipos de Calzado.
3. **Gestión de Productos:**
   - Crear producto asignando Nombre, Descripción, Precio, Marca, Tipo, Género, URLs de imágenes y Stock inicial por talle.
   - Editar producto (desactivar/activar, actualizar precio, imágenes o stock).
4. **Importación Masiva de Stock (CSV):**
   - Subida de plantilla CSV con columnas: `nombre,marca,tipo_calzado,genero,precio,descripcion,talle,stock`.
5. **Gestión de Solicitudes de Venta (Ventas Pendientes):**
   - Listado de solicitudes pendientes.
   - Modal de detalle: permite al admin modificar ítems o cantidades si negoció un cambio con el cliente por WhatsApp.
   - **Confirmar Venta:** Admin selecciona el Medio de Pago (Efectivo / Transferencia), ingresa nota/monto de Descuento (opcional) y presiona "Confirmar".
     - *Efecto:* Se crea el Registro de Venta y se desquitan automáticamente los pares del inventario en MongoDB.
   - **Cancelar Solicitud:** Marca el pedido como cancelado sin tocar stock.
6. **Reportes:** Vista de ventas cerradas, métricas por período y exportación a archivo CSV/Excel.
7. **Promociones:** ABM de banners para el carrusel de la tienda.

---

## 5. REGLAS DE NEGOCIO Y RESTRICCIONES

1. **Gestión de Stock Asincrónico:**
   - El stock no se reserva mientras los productos están en el carrito del cliente ni al generar la solicitud pendiente.
   - El descuento real de stock ocurre únicamente cuando el **Admin confirma la venta**.
2. **Inmutabilidad de Clasificación:**
   - Una vez creado un producto, sus atributos de Marca, Tipo de Calzado y Género no se pueden modificar para garantizar la coherencia histórica de las ventas.
3. **Imágenes por CDN:**
   - Las imágenes del producto se gestionan externamente (ImageKit / Cloudinary / AWS S3). La aplicación solo guarda y sirve URLs públicas.
4. **Precios y Descuentos:**
   - Los precios de los productos son fijos por modelo.
   - Los descuentos no se automatizan en el frontend; se aplican manualmente por el Administrador durante el cierre de la venta.

---
---

# 🇬🇧 ENGLISH VERSION

## 1. PRODUCT VISION

**Footwear E-Commerce Web Platform** designed for fast, frictionless conversion. It acts as an interactive product catalog with a guided 3-step checkout where:
- **Customers (Buyers):** Browse the catalog, filter products, assemble their cart, and complete a 3-step checkout process that records the order in the database and redirects the user to **WhatsApp** with a preformatted message containing the generated order number and purchase summary to send payment proof.
- **Administrator:** Manages the catalog (brands, footwear types, products, stock per size, promotions), reviews pending sales requests, confirms sales (recording payment method and applying manual discounts, which automatically reduces stock), and reviews sales reports/metrics.

### Out of Scope:
- Customer authentication or registration.
- Mandatory email address field.
- Automated payment gateways (Stripe, PayPal, MercadoPago, etc.).
- Automated shipment tracking.
- External messaging API integrations (WhatsApp redirection is native via `wa.me` links).

### UI Design System:
- All user interface elements strictly follow the design system and tokens specified in [DESIGN.md](file:///Users/carlosjimenez/Documents/Repositorios/e-commerce/docs/DESIGN.md) (Nike-inspired athletic-editorial style, high typographic contrast, neutral palette with `#111111` pill CTAs, `#f5f5f5` footwear backdrops, and an 8px grid system).

---

## 2. MAIN BUSINESS ENTITIES

### 2.1 Brand
Footwear manufacturer (e.g., Nike, Adidas, New Balance, Puma).
- **Attributes:** `name` (unique, required).
- **Relationships:** 1 to N with Products.

### 2.2 Footwear Type
Functional category or style (e.g., Running Shoes, Formal Shoes, Flip-Flops, Slippers).
- **Attributes:** `name` (unique, required), `description` (optional).
- **Relationships:** 1 to N with Products.

### 2.3 Gender
Target audience for the product.
- **Allowed values:** `Hombre` (Men), `Mujer` (Women), `Niño` (Kids), `Unisex`.
- **Attributes:** `name`.
- **Relationships:** Defines the available size scales.

### 2.4 Size (Talle)
Physical size of footwear linked to a gender scale.
- **Typical range by Gender:**
  - Men / Unisex: 36 to 45
  - Women: 33 to 42
  - Kids: 25 to 35
- **Attributes:** `value` (number/string), `gender`.
- **Relationships:** Belongs to 1 Gender; N to N with Products (pivot table/array storing stock).

### 2.5 Product
Specific footwear model displayed in the catalog.
- **Attributes:**
  - `name` (e.g., "Nike Air Max 90")
  - `description` (detailed text)
  - `price` (fixed decimal number)
  - `active` (boolean, show/hide in store)
  - `images` (array of external CDN image URLs)
  - `sizesStock` (array of objects `{ size, stock }`)
- **Relationships:**
  - Belongs to 1 Brand (immutable after creation).
  - Belongs to 1 Footwear Type (immutable after creation).
  - Belongs to 1 Gender (immutable after creation).

### 2.6 Product Image
Reference to images hosted on an external CDN (ImageKit / Cloudinary / S3).
- **Attributes:** `url` (String), `isPrincipal` (boolean), `position` (integer for gallery ordering).

### 2.7 Promotion
Banner advertisements displayed in the landing page carousel.
- **Attributes:** `title`, `description` (optional), `imageUrl` (banner URL), `active` (boolean), `startDate` (optional), `endDate` (optional), `order` (number).
- **Purpose:** Purely informational/visual. **Does not automatically modify prices or apply checkout discounts**.

### 2.8 Sales Request (Order)
Order intent registered when the customer clicks "Confirm Order" on the website.
- **Attributes:**
  - `id` (ObjectId)
  - `orderNumber` (Unique human-readable code, e.g., `PED-2026-00101`)
  - `createdAt` (Timestamp)
  - `customer`:
    - `name` (Required)
    - `lastName` (Required)
    - `phone` (Required)
  - `status`: `pendiente` (pending) | `confirmada` (confirmed) | `cancelada` (cancelled)
  - `items`: List of requested products. Each item stores: `productId`, `name`, `size`, `qty`, `unitPrice` (price snapshot at purchase time), `subtotal`.
  - `subtotal` (Sum of item subtotals)
  - `discount` (Amount or 0 default)
  - `total` (Subtotal - Discount)
  - `paymentMethod` (`transferencia` | `efectivo`)

### 2.9 Sales Record (Admin Confirmation)
Definitive order confirmation completed by the store administrator.
- **Attributes:**
  - `orderId` (Reference to Sales Request)
  - `confirmationDate` (Timestamp)
  - `recordedPaymentMethod` (`efectivo` | `transferencia` | `tarjeta` | `otro`)
  - `appliedDiscount` (Amount/percentage or explicit note, e.g., "$5.000 / 10% VIP Customer")
  - `finalTotal` (Final charged total)
- **Side Effect:** Upon confirmation, the stock for each product+size is automatically decremented.

---

## 3. USER FLOW: CUSTOMER (BUYER)

### 3.1 Discover Products (Landing Page)
1. Customer accesses the store and views:
   - Carousel of active promotions.
   - Grid of random/featured products.
   - Product cards featuring: Main image, Name, Brand, Type, Price, and "OUT OF STOCK" badge if applicable.
2. Filters available: Brand (multiselect), Footwear Type (multiselect), and Size (multiselect).

### 3.2 View Product Details
1. Clicking a card opens the product detail modal/page featuring:
   - Image gallery (CDN).
   - Full product metadata (Name, Brand, Type, Gender, Price, Description).
   - Size Selector (filtered by available sizes for the product's gender with current stock > 0).
   - Quantity Selector (1 to available stock).
   - **"Add to Cart"** button (disabled if overall stock is 0).

### 3.3 3-Step Checkout Flow (Epicodes Style)

```
[ STEP 1: YOUR DATA ] ──> [ STEP 2: YOUR ORDER ] ──> [ STEP 3: PAYMENT & WHATSAPP ]
```

* **Step 1: Your Data**
  - Form with fields: Name, Last Name, Phone (WhatsApp). *(No email field)*.
  - Button: "Continue to Payment".

* **Step 2: Your Order**
  - Summary of added items (Product, Size, Quantity, Subtotal).
  - Optional coupon / notes input.
  - Contact summary review from Step 1.
  - Button: **"Confirm Order"** $\rightarrow$ On click:
    - Triggers HTTP `POST /api/checkout/create-order` request.
    - Backend creates order in MongoDB with `pendiente` status and generates `orderNumber` (e.g., `PED-2026-06810`).
    - Automatically advances to Step 3.

* **Step 3: Payment & WhatsApp Redirection**
  - Banner: *"Order registered! Order #PED-2026-06810"*.
  - Bank Transfer Details box (Alias, Account Holder, Bank Name, Exact Amount) with quick copy buttons.
  - Prominent green button: **"Send Order Summary"** (`wa.me/STORE_PHONE?text=...` link).
  - Clicking the green button opens WhatsApp with a prefilled structured message:
    ```text
    Hello! I just placed an order on the store 👟

    👤 *CUSTOMER*
    • Juan Pérez
    📱 3815218630

    📦 *ORDER #PED-2026-06810*
    • 1x Nike Air Max 90 (Size 42) - $120.000

    💰 *TOTAL:* $120.000

    I will transfer now to the alias: TIENDA.CALZADO (Juan Pérez)
    Attaching payment receipt!
    ```

---

## 4. USER FLOW: ADMINISTRATOR

1. **Authentication:** Simple login with username and password (admin credentials stored in environment variables or admin user collection).
2. **Catalog Management:** CRUD operations for Brands (name only) and Footwear Types.
3. **Product Management:**
   - Create products with Name, Description, Price, Brand, Type, Gender, Image URLs, and Initial stock per size.
   - Edit products (activate/deactivate, update price, images, or stock).
4. **Bulk Stock Import (CSV):**
   - Upload CSV template with columns: `nombre,marca,tipo_calzado,genero,precio,descripcion,talle,stock`.
5. **Sales Request Management (Pending Orders):**
   - List pending requests.
   - Detail modal: Allows admin to adjust items or quantities if a change was agreed upon with the customer via WhatsApp.
   - **Confirm Sale:** Admin selects Payment Method (Cash / Transfer), enters optional Discount note/amount, and clicks "Confirm".
     - *Effect:* Sales Record is created, and size stock is automatically decremented in MongoDB.
   - **Cancel Order:** Marks order as cancelled without modifying inventory.
6. **Reports:** View completed sales, metrics by date range, and export to CSV/Excel files.
7. **Promotions:** CRUD management for homepage carousel banners.

---

## 5. BUSINESS RULES AND CONSTRAINTS

1. **Asynchronous Inventory Management:**
   - Stock is NOT reserved while items sit in customer carts or when creating pending sales requests.
   - Real stock decrement occurs ONLY when the **Admin confirms the sale**.
2. **Immutability of Product Classification:**
   - Once a product is created, its Brand, Footwear Type, and Gender cannot be altered to maintain historical sales consistency.
3. **CDN Image Management:**
   - Product images are managed externally (ImageKit / Cloudinary / AWS S3). The app stores and serves public URLs only.
4. **Pricing and Discounts:**
   - Product prices are fixed per model.
   - Discounts are not automated on the frontend; they are applied manually by the Administrator during sales confirmation.
