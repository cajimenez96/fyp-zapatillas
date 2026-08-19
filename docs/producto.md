# Especificación de Producto: Catálogo E-Commerce de Calzado / Product Specification: Footwear E-Commerce Catalog

---

# 🇪🇸 VERSIÓN EN ESPAÑOL

## 1. VISIÓN DEL PRODUCTO

**Plataforma web e-commerce de venta de calzado** orientada a la conversión rápida y ágil. Funciona como un catálogo interactivo con checkout guiado y punto de venta integral donde:
- **Clientes (Compradores):** Navegan el catálogo, visualizan precios minoristas y mayoristas, filtran productos, arman su carrito con recálculo automático a precio mayorista al alcanzar 5 o más pares totales, y completan un checkout en 3 pasos que registra el pedido y redirige a **WhatsApp** con el resumen de la compra.
- **Administrador:** Gestiona el catálogo (marcas, tipos de calzado, productos con doble precio, stock por talle, promociones), atiende y **actualiza** solicitudes de venta pendientes (pudiendo agregar productos o ajustar precios finales), **autoriza o cancela** pedidos, **registra ventas directas** desde el panel con descuento inmediato de stock (stock único real) y consulta reportes.

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
  - `precioMinorista` (número decimal, precio unitario estándar para compras < 5 pares)
  - `precioMayorista` (número decimal, precio unitario con descuento por volumen para compras ≥ 5 pares totales)
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
- **Propósito:** Meramente visual/informativo.

### 2.8 Solicitud de Venta (Order / Pedido)
Registro de intención de compra generado desde la tienda o creado manualmente desde el panel de administración.
- **Atributos:**
  - `id` (ObjectId)
  - `orderNumber` (Código legible único, ej: `PED-2026-00101`)
  - `fechaCreacion` (Timestamp)
  - `origen` (`web` | `admin_directo`)
  - `cliente`:
    - `nombre` (Requerido)
    - `apellido` (Requerido)
    - `telefono` (Requerido)
  - `estado`: `pendiente` | `autorizado` | `cancelado`
  - `items`: Lista de productos solicitados. Cada ítem guarda: `productId`, `nombre`, `talle`, `cantidad`, `tipoPrecioAplicado` (`minorista` | `mayorista` | `personalizado`), `precioUnitario`, `subtotal`.
  - `subtotal` (Suma de subtotales de ítems)
  - `descuento` (Monto o 0 por defecto)
  - `total` (Subtotal - Descuento)
  - `medioPago` (`transferencia` | `efectivo` | `tarjeta` | `otro`)

### 2.9 Registro de Venta y Ajustes (Admin)
Mecanismo de autorización, edición o creación directa de ventas por el administrador:
- **Autorización de Pedido Pendiente:** Transiciona el estado de `pendiente` a `autorizado`, ejecutando el descuento automático del stock por cada producto+talle.
- **Cancelación de Pedido:** Marca el pedido como `cancelado`. Si estaba en estado `pendiente`, no afecta stock.
- **Actualización de Pedido Pendiente:** Permite agregar o remover ítems, modificar cantidades o ajustar los precios unitarios/finales negociados con el cliente antes de la autorización.
- **Venta Directa Admin:** Creación de una venta desde el panel admin registrando datos del cliente y selección de productos. Se guarda directamente en estado `autorizado` y descuenta el stock en tiempo real (mantenimiento de stock único real).

---

## 3. FLUJO DE USUARIO: CLIENTE (COMPRADOR)

### 3.1 Descubrir Productos (Landing Page)
1. El cliente entra a la web y visualiza:
   - Banners de promociones activas e información de beneficio mayorista (ej: *"¡Llevando 5 pares o más accedés a Precio Mayorista!"*).
   - Grilla de productos con imagen, nombre, marca, tipo y la exhibición de **Precio Minorista** y **Precio Mayorista**.
   - Filtros por Marca, Tipo de Calzado y Talle.

### 3.2 Ver Detalle de Producto
1. Click en la tarjeta abre la vista/modal de producto:
   - Muestra de forma clara ambos precios (`Precio Minorista` y `Precio Mayorista`), con una llamada a la acción indicando que el precio mayorista se activa a partir de los 5 pares en el carrito.
   - Selector de Talle con stock disponible y Selector de Cantidad.
   - Botón **"Agregar al carrito"**.

### 3.3 Carrito y Regla Dinámica de Precios (5+ Pares)
1. Al agregar ítems al carrito, la aplicación calcula la **cantidad total sumada de todos los pares** en el carrito (pudiendo combinar distintos modelos y talles):
   - **Menos de 5 pares totales:** Cada producto en el carrito se cotiza a su `precioMinorista`.
   - **5 pares o más totales:** Todo el carrito se recálcula automáticamente y cada producto adopta su `precioMayorista`.
2. El carrito muestra un indicador visual del progreso (ej: *"Agregá X pares más para desbloquear precio mayorista"* o *"¡Descuento mayorista aplicado!"*).

### 3.4 Checkout en 3 Pasos
- **Paso 1: Tus Datos** (Nombre, Apellido, Teléfono WhatsApp).
- **Paso 2: Tu Pedido** (Resumen de ítems con tipo de precio aplicado, subtotal y total). Al hacer click en "Confirmar pedido", la orden se guarda en estado `pendiente`.
- **Paso 3: Pago & Confirmación con WhatsApp** (Datos bancarios y botón para enviar el resumen detallado por WhatsApp).

---

## 4. FLUJO DE USUARIO: ADMINISTRADOR

1. **Autenticación:** Login seguro para administradores.
2. **Gestión de Catálogo:** CRUD de Marcas y Tipos de Calzado.
3. **Gestión de Productos con Doble Precio:**
   - Alta y edición de productos especificando `precioMinorista` y `precioMayorista`, descripción, marca, tipo, género, imágenes CDN y stock por talle.
4. **Importación Masiva (CSV):**
   - Soporte para importar o actualizar productos y stock incluyendo columnas para precio minorista y precio mayorista.
5. **Gestión y Actualización de Pedidos Pendientes:**
   - Listado de pedidos web pendientes.
   - **Edición/Actualización del Pedido:** El admin puede modificar el pedido agregando o quitando productos/talles o sobrescribiendo el precio final del pedido según acuerde con el cliente por WhatsApp.
   - **Autorizar Pedido:** Pasa el pedido a `autorizado` y aplica el descuento real de stock en la base de datos.
   - **Cancelar Pedido:** Cancela el pedido sin tocar el inventario.
6. **Registro de Venta Directa (Punto de Venta Admin):**
   - Pantalla en el panel admin para registrar una venta en mostrador o directa.
   - Se completan los datos del cliente (Nombre, Apellido, Teléfono), se seleccionan los productos+talles y medio de pago.
   - Al presionar **"Guardar Venta"**, se crea directamente en estado `autorizado` y **descuenta de inmediato el stock**, asegurando la web como inventario único y real.
7. **Reportes:** Visualización de métricas de ventas autorizadas y exportación.

---

## 5. REGLAS DE NEGOCIO Y RESTRICCIONES

1. **Regla de Umbral Mayorista Dinámico:**
   - El beneficio de `precioMayorista` aplica cuando la suma total de pares en el pedido (combinando cualquier modelo/talle) es $\ge 5$.
   - El recálculo es automático en la interfaz del cliente y se valida en el backend al crear la orden.
2. **Gestión Asincrónica de Stock y Autorización:**
   - El stock NO se reserva mientras el producto está en el carrito ni mientras la orden web está en estado `pendiente`.
   - El descuento efectivo del stock ocurre únicamente cuando el **Admin autoriza** el pedido pendiente.
3. **Ventas Directas Admin (Stock Único Real):**
   - Toda venta registrada directamente desde el panel admin pasa inmediatamente a estado `autorizado` y decrementa el stock en el acto para evitar ventas duplicadas sin stock disponible.
4. **Edición de Pedidos por el Administrador:**
   - El administrador posee la facultad de actualizar cualquier pedido en estado `pendiente` (modificar ítems, cantidades o acordar un precio total final personalizado). Los ajustes de stock se aplicarán al momento de la autorización definitiva.

---
---

# 🇬🇧 ENGLISH VERSION

## 1. PRODUCT VISION

**Footwear E-Commerce Web Platform** designed for fast conversion and comprehensive sales management. It functions as an interactive catalog with a 3-step checkout and an integrated point of sale where:
- **Customers (Buyers):** Browse the catalog, view retail and wholesale pricing, filter products, assemble their cart with automatic wholesale repricing upon reaching 5 or more total pairs, and complete a 3-step checkout that registers the order and redirects to **WhatsApp** with the order summary.
- **Administrator:** Manages the catalog (brands, footwear types, dual-price products, size stock, promotions), reviews and **updates** pending sales requests (adding items or tweaking final prices), **authorizes or cancels** orders, **registers direct sales** from the admin panel with immediate stock deduction (real unified inventory), and views reports.

### Out of Scope:
- Customer authentication or registration.
- Mandatory email field.
- Automated payment gateways (Stripe, PayPal, MercadoPago, etc.).
- Automated shipment tracking.

### UI Design System:
- All UI elements strictly follow guidelines in [DESIGN.md](file:///Users/carlosjimenez/Documents/Repositorios/e-commerce/docs/DESIGN.md) (Nike-inspired athletic-editorial style, high typographic contrast, neutral palette with `#111111` pill CTAs, `#f5f5f5` footwear backdrops, and an 8px grid system).

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

### 2.4 Size (Talle)
Physical size of footwear linked to a gender scale.

### 2.5 Product
Specific footwear model displayed in the catalog.
- **Attributes:**
  - `name` (e.g., "Nike Air Max 90")
  - `description` (detailed text)
  - `retailPrice` (decimal number, standard unit price for orders < 5 pairs)
  - `wholesalePrice` (decimal number, discounted unit price for orders ≥ 5 total pairs)
  - `active` (boolean)
  - `images` (array of external CDN URLs)
  - `sizesStock` (array of objects `{ size, stock }`)

### 2.6 Product Image
Reference to images hosted on external CDN (ImageKit / Cloudinary / S3).

### 2.7 Promotion
Banner advertisements displayed in the landing page carousel.

### 2.8 Sales Request (Order)
Order intent generated via the website or created manually from the admin panel.
- **Attributes:**
  - `id` (ObjectId)
  - `orderNumber` (Unique human-readable code, e.g., `PED-2026-00101`)
  - `createdAt` (Timestamp)
  - `origin` (`web` | `admin_direct`)
  - `customer`: `{ name, lastName, phone }`
  - `status`: `pendiente` (pending) | `autorizado` (authorized) | `cancelado` (cancelled)
  - `items`: List of requested products (`productId`, `name`, `size`, `qty`, `appliedPriceType`, `unitPrice`, `subtotal`).
  - `subtotal`, `discount`, `total`, `paymentMethod`.

### 2.9 Sales Confirmation, Updates & Direct POS (Admin)
- **Pending Order Authorization:** Transitions status from `pendiente` to `autorizado`, triggering automatic stock deduction for each product+size.
- **Order Cancellation:** Marks order as `cancelado`. If pending, inventory remains untouched.
- **Pending Order Update:** Admin can add/remove items, adjust quantities, or override final negotiated prices before authorizing.
- **Admin Direct Sale:** Manual order creation from the admin panel. Saved directly as `autorizado`, immediately deducting stock to maintain a real single inventory.

---

## 3. USER FLOW: CUSTOMER (BUYER)

### 3.1 Discover Products & Dual Pricing
- Catalog displays both **Retail Price** and **Wholesale Price** for each model.
- Banners highlight wholesale benefits (e.g., *"Buy 5+ pairs to unlock Wholesale Pricing!"*).

### 3.2 View Product Details
- Shows retail & wholesale price tags with a badge explaining the 5+ pair threshold.
- Size & Quantity selector + "Add to Cart".

### 3.3 Dynamic Cart Repricing (5+ Pairs Rule)
- Cart calculates total quantity across all items (combining any models and sizes).
- If **total pairs < 5**, items use `retailPrice`.
- If **total pairs ≥ 5**, all items automatically switch to `wholesalePrice`.
- Cart displays visual progress feedback towards the wholesale threshold.

### 3.4 3-Step Checkout
- Step 1: Customer Data.
- Step 2: Order Review & Confirmation (status set to `pendiente`).
- Step 3: Bank Details & WhatsApp Redirection.

---

## 4. USER FLOW: ADMINISTRATOR

1. **Catalog & Dual-Price Management:** Add and edit products setting both `retailPrice` and `wholesalePrice`.
2. **Pending Order Updates & Authorization:**
   - Modify pending web orders (add/remove products, adjust quantities or final price).
   - Authorize orders (triggers real stock reduction in MongoDB).
   - Cancel orders.
3. **Direct Admin POS (Direct Sales Registration):**
   - Register counter/direct sales by selecting customer details and products.
   - Saves directly in `autorizado` status and immediately decrements inventory.
4. **Reports & Metrics:** View authorized sales metrics.

---

## 5. BUSINESS RULES AND CONSTRAINTS

1. **Dynamic Wholesale Threshold:** Wholesale price applies automatically when total items in order $\ge 5$ pairs (mix and match allowed).
2. **Asynchronous Stock Management:** Inventory is NOT reserved until the order is **authorized** by the Admin.
3. **Direct Admin POS & Unified Inventory:** Direct sales created in the admin panel are saved as `autorizado` and reduce stock immediately.
4. **Admin Order Update Rights:** Admin can update pending orders (items, quantities, custom pricing) prior to authorization.
