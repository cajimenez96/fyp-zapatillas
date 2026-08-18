# Planificación del Proyecto (Kanban) / Project Planning (Kanban)

---

# 🇪🇸 VERSIÓN EN ESPAÑOL

## 1. VISIÓN DEL SCRUM MASTER Y METODOLOGÍA

Como Scrum Master y Senior Architect, este proyecto se estructurará bajo un **Tablero Kanban con Límites de Trabajo en Progreso (WIP Limits)** para garantizar un flujo continuo, entregas incrementales verificadas y cero deuda técnica.

### Definición de Hecho (Definition of Done - DoD):
- [ ] Código implementado sin advertencias ni errores de linter/TypeScript.
- [ ] Componentes de UI verificados contra los tokens y estética definida en [DESIGN.md](file:///Users/carlosjimenez/Documents/Repositorios/e-commerce/docs/DESIGN.md).
- [ ] Schemas y contratos de API validados con Zod.
- [ ] Pruebas unitarias/funcionales ejecutadas exitosamente.
- [ ] Documentación de código y APIs al día.

---

## 2. ESTRUCTURA DEL TABLERO KANBAN

```
[ BACKLOG ] ──> [ TO DO (Por Hacer) ] ──> [ IN PROGRESS ] ──> [ IN REVIEW ] ──> [ DONE (Completado) ]
                                            (WIP Limit: 3)       (WIP Limit: 2)
```

---

## 3. EPICS Y DESGLOSE DE TICKETS (TASKS)

### 📌 EPIC 1: Setup Inicial & Infraestructura Base
* **[T-01] Inicialización de Proyecto Next.js & Estilos**
  - **Prioridad:** Alta | **Estimación:** 2 pts
  - **Descripción:** Crear proyecto Next.js (App Router), configurar TypeScript, ESLint, Tailwind CSS y mapear tokens de [DESIGN.md](file:///Users/carlosjimenez/Documents/Repositorios/e-commerce/docs/DESIGN.md) (colores `#111111`, `#f5f5f5`, tipografías y `rounded-full`).
  - **Criterios de Aceptación:** Proyecto compila sin errores, estilos globales configurados y probados.

* **[T-02] Conexión y Configuración de MongoDB**
  - **Prioridad:** Alta | **Estimación:** 2 pts
  - **Descripción:** Configurar cliente de MongoDB/Mongoose con singleton para entornos serverless de Next.js (`lib/db.ts`).
  - **Criterios de Aceptación:** Conexión exitosa a Mongo Atlas / local con manejo de reconexiones en serverless.

* **[T-03] Cliente de CDN para Imágenes (ImageKit / Cloudinary)**
  - **Prioridad:** Media | **Estimación:** 1 pt
  - **Descripción:** Crear módulo helper para subida y generación de URLs optimizadas de imágenes en CDN externa.
  - **Criterios de Aceptación:** Helper capaz de recibir archivo/buffer y retornar la URL pública CDN.

---

### 📌 EPIC 2: Modelos de Datos & Sembrado (Seed)
* **[T-04] Implementación de Modelos Mongoose (Brands, Types, Products)**
  - **Prioridad:** Alta | **Estimación:** 3 pts
  - **Descripción:** Definir esquemas Mongoose para `Brand`, `FootwearType` y `Product` según [arquitectura.md](file:///Users/carlosjimenez/Documents/Repositorios/e-commerce/arquitectura.md).
  - **Criterios de Aceptación:** Schemas compilados con índices únicos y validaciones de tipos.

* **[T-05] Implementación de Modelos Mongoose (Orders, SalesRecords, Promotions)**
  - **Prioridad:** Alta | **Estimación:** 3 pts
  - **Descripción:** Definir esquemas Mongoose para `Order`, `SalesRecord` y `Promotion`.
  - **Criterios de Aceptación:** Soporte para ítems embebidos, estados de orden y números de pedido formateados.

* **[T-06] Script de Seeding para Catálogos Base**
  - **Prioridad:** Media | **Estimación:** 2 pts
  - **Descripción:** Crear script para poblar la base de datos con Marcas (Nike, Adidas, Puma), Tipos de Calzado (Running, Urbana) y Géneros iniciales.
  - **Criterios de Aceptación:** Ejecutar `npm run seed` inserta datos iniciales limpios sin duplicados.

---

### 📌 EPIC 3: Catálogo Cliente & Landing Page
* **[T-07] Layout General (Header, Footer & Navigation)**
  - **Prioridad:** Alta | **Estimación:** 2 pts
  - **Descripción:** Maquetar Header con logo, barra de búsqueda e ícono de carrito, y Footer informativo siguiendo [DESIGN.md](file:///Users/carlosjimenez/Documents/Repositorios/e-commerce/docs/DESIGN.md).
  - **Criterios de Aceptación:** Layout responsive, accesible y pixel-perfect según diseño Nike-editorial.

* **[T-08] Carrusel de Promociones (Banners)**
  - **Prioridad:** Media | **Estimación:** 3 pts
  - **Descripción:** Componente de carrusel hero para banners activos consumiendo la API de promociones.
  - **Criterios de Aceptación:** Navegación fluida, soporte swipe en mobile, fallbacks sin banners.

* **[T-09] Grilla de Productos y Tarjetas (Product Card)**
  - **Prioridad:** Alta | **Estimación:** 3 pts
  - **Descripción:** Componente `ProductCard` con imagen en fondo `#f5f5f5`, marca, nombre, precio, etiqueta "SIN STOCK" y swatches.
  - **Criterios de Aceptación:** Renderizado de productos según estado `active`, indicación correcta de falta de stock.

* **[T-10] Barra de Filtros (Marca, Tipo, Talle)**
  - **Prioridad:** Alta | **Estimación:** 3 pts
  - **Descripción:** Componente de filtros multiselect por Marca, Tipo de Calzado y Talle con actualización de query params y llamada a API.
  - **Criterios de Aceptación:** Filtrado instantáneo/reactivo en frontend y sincronizado con URL.

---

### 📌 EPIC 4: Detalle de Producto & Estado de Carrito
* **[T-11] Modal / Vista de Detalle de Producto (PDP)**
  - **Prioridad:** Alta | **Estimación:** 3 pts
  - **Descripción:** Galería de imágenes, selector de talles disponibles según género, selector de cantidad y botón "Agregar al carrito".
  - **Criterios de Aceptación:** Bloqueo de talles sin stock, selector de cantidad restringido al stock disponible.

* **[T-12] Estado Global del Carrito (Context / Store)**
  - **Prioridad:** Alta | **Estimación:** 2 pts
  - **Descripción:** Gestor de estado para agregar, modificar cantidades, eliminar ítems y persistir en `localStorage`.
  - **Criterios de Aceptación:** Carrito persiste recargas de página y calcula totales dinámicamente.

---

### 📌 EPIC 5: Checkout Epicodes en 3 Pasos & WhatsApp
* **[T-13] Checkout Paso 1: Formulario "Tus Datos"**
  - **Prioridad:** Alta | **Estimación:** 2 pts
  - **Descripción:** Vista del Paso 1 para capturar Nombre, Apellido y Teléfono (sin campo email obligatorio).
  - **Criterios de Aceptación:** Validaciones Zod de campos requeridos y formato de teléfono.

* **[T-14] Checkout Paso 2: Revisión de Pedido & Endpoint `/api/checkout/create-order`**
  - **Prioridad:** Alta | **Estimación:** 5 pts
  - **Descripción:** Vista de confirmación del pedido y desarrollo del endpoint serverless que calcula precios reales, inserta orden `pendiente` y retorna el `orderNumber`.
  - **Criterios de Aceptación:** Precios validados en servidor, generación única de `orderNumber` (ej: `PED-2026-06810`).

* **[T-15] Checkout Paso 3: Pantalla de Pago & Generador de Link WhatsApp**
  - **Prioridad:** Alta | **Estimación:** 3 pts
  - **Descripción:** Muestra datos bancarios (Alias, CBU, Titular) con botón copiar y botón destacado verde de envío de resumen a WhatsApp.
  - **Criterios de Aceptación:** Botón verde abre WhatsApp con mensaje preformateado conteniendo cliente, ítems, total y número de orden.

---

### 📌 EPIC 6: Panel Administrador - Autenticación & Catálogos
* **[T-16] Autenticación de Administrador (Login & Protected Routes)**
  - **Prioridad:** Alta | **Estimación:** 3 pts
  - **Descripción:** Formulario de login admin y middleware de protección para rutas `/admin/*` y `/api/admin/*` vía JWT.
  - **Criterios de Aceptación:** Accesos no autorizados redirigen a login.

* **[T-17] Gestión de Marcas (ABM Admin)**
  - **Prioridad:** Media | **Estimación:** 2 pts
  - **Descripción:** CRUD simple para crear, editar y listar marcas (solo nombre).
  - **Criterios de Aceptación:** Imposibilidad de eliminar marcas asociadas a productos existentes.

* **[T-18] Gestión de Tipos de Calzado (ABM Admin)**
  - **Prioridad:** Media | **Estimación:** 2 pts
  - **Descripción:** CRUD para administrar tipos de calzado.
  - **Criterios de Aceptación:** Validación de nombres únicos.

* **[T-19] Gestión de Promociones / Banners (ABM Admin)**
  - **Prioridad:** Media | **Estimación:** 3 pts
  - **Descripción:** Formulario de subida de banner, título, vigencia y orden para el carrusel principal.
  - **Criterios de Aceptación:** Reordenamiento drag-and-drop o por índice numérico.

---

### 📌 EPIC 7: Panel Administrador - Productos & Stock
* **[T-20] Formulario de Creación de Producto**
  - **Prioridad:** Alta | **Estimación:** 5 pts
  - **Descripción:** Formulario completo para alta de producto: Nombre, Descripción, Precio, Marca, Tipo, Género, subida de imágenes a CDN y matriz de stock por talle.
  - **Criterios de Aceptación:** Carga dinámica de talles según género elegido, subida correcta de imágenes.

* **[T-21] Edición & Desactivación de Productos**
  - **Prioridad:** Alta | **Estimación:** 3 pts
  - **Descripción:** Permite editar precio, imágenes, stock o cambiar estado `activo/inactivo`. Marca, Tipo y Género bloqueados.
  - **Criterios de Aceptación:** Atributos fijos ineditables, actualización inmediata en catálogo cliente al desactivar.

* **[T-22] Importador Masivo de Stock mediante CSV**
  - **Prioridad:** Media | **Estimación:** 5 pts
  - **Descripción:** Upload y parser de archivo CSV para carga masiva de productos e inventario inicial.
  - **Criterios de Aceptación:** Reporte detallado de filas procesadas con éxito y lista de errores de validación.

---

### 📌 EPIC 8: Panel Administrador - Ventas & Reducción de Stock
* **[T-23] Listado de Solicitudes Pendientes**
  - **Prioridad:** Alta | **Estimación:** 3 pts
  - **Descripción:** Tabla responsiva de solicitudes pendientes con buscador y acciones (Ver detalle, Confirmar, Cancelar).
  - **Criterios de Aceptación:** Filtros por fecha y nombre de cliente.

* **[T-24] Modal de Edición de Ítems en Solicitud Pendiente**
  - **Prioridad:** Media | **Estimación:** 3 pts
  - **Descripción:** Permite al admin agregar/quitar productos o ajustar cantidades antes de confirmar la venta.
  - **Criterios de Aceptación:** Recálculo automático de subtotales y total.

* **[T-25] Confirmación de Venta & Transacción Atómica de Stock (`POST /api/admin/orders/:id/confirm`)**
  - **Prioridad:** Alta | **Estimación:** 5 pts
  - **Descripción:** Modal de confirmación donde el admin selecciona Medio de Pago e ingresa Nota de Descuento. Dispara transacción MongoDB que descuenta stock.
  - **Criterios de Aceptación:** Error `409 Conflict` si no hay stock suficiente, decremento atómico de stock y creación de `SalesRecord`.

* **[T-26] Cancelación de Solicitudes**
  - **Prioridad:** Media | **Estimación:** 2 pts
  - **Descripción:** Opción para rechazar/cancelar solicitudes marcando el estado a `cancelada`.
  - **Criterios de Aceptación:** La orden cambia de estado sin afectar el inventario.

---

### 📌 EPIC 9: Reportes, Métricas & Configuración
* **[T-27] Dashboard de Ventas & Reportes**
  - **Prioridad:** Media | **Estimación:** 4 pts
  - **Descripción:** Vista con resumen de ingresos totales, cantidad de ventas, ventas por medio de pago y exportador a CSV/Excel.
  - **Criterios de Aceptación:** Filtro por rango de fechas, archivo descargable válido.

* **[T-28] Panel de Configuración de la Tienda**
  - **Prioridad:** Media | **Estimación:** 2 pts
  - **Descripción:** Formulario admin para editar número de WhatsApp de la tienda, datos bancarios (Alias/CBU) y nombre del negocio.
  - **Criterios de Aceptación:** Los cambios impactan inmediatamente en la vista de checkout del cliente.

---

### 📌 EPIC 10: QA, Auditoría UI & Despliegue
* **[T-29] Audit de Diseño & UI contra `DESIGN.md`**
  - **Prioridad:** Alta | **Estimación:** 2 pts
  - **Descripción:** Revisión de contraste tipográfico, paleta de colores, radios `rounded-full` y comportamientos en mobile.
  - **Criterios de Aceptación:** 100% alineado a las directrices visuales del sistema de diseño Nike.

* **[T-30] Pruebas Integrales E2E del Flujo de Venta**
  - **Prioridad:** Alta | **Estimación:** 3 pts
  - **Descripción:** Verificación del camino crítico: Selección producto $\rightarrow$ Checkout 3 Pasos $\rightarrow$ WhatsApp $\rightarrow$ Confirmación Admin $\rightarrow$ Reducción de Stock.
  - **Criterios de Aceptación:** Cero errores en consola, comportamiento atómico de stock.

* **[T-31] Despliegue en Producción (Vercel + MongoDB Atlas)**
  - **Prioridad:** Alta | **Estimación:** 2 pts
  - **Descripción:** Configuración de variables de entorno, compilación de build de producción y despliegue final.
  - **Criterios de Aceptación:** Aplicación desplegada y 100% operativa en producción.

---
---

# 🇬🇧 ENGLISH VERSION

## 1. SCRUM MASTER VISION & METHODOLOGY

As Scrum Master and Senior Architect, this project will follow a **Kanban Board with Work in Progress (WIP) Limits** to ensure continuous flow, verified incremental deliveries, and zero technical debt.

### Definition of Done (DoD):
- [ ] Code implemented with zero linter/TypeScript errors.
- [ ] UI components verified against design tokens and aesthetics in [DESIGN.md](file:///Users/carlosjimenez/Documents/Repositorios/e-commerce/docs/DESIGN.md).
- [ ] Schemas and API contracts validated using Zod.
- [ ] Unit/functional tests executed successfully.
- [ ] Up-to-date documentation.

---

## 2. KANBAN BOARD STRUCTURE

```
[ BACKLOG ] ──> [ TO DO ] ──> [ IN PROGRESS ] ──> [ IN REVIEW ] ──> [ DONE ]
                                (WIP Limit: 3)    (WIP Limit: 2)
```

---

## 3. EPICS AND TICKET BREAKDOWN

### 📌 EPIC 1: Initial Setup & Base Infrastructure
* **[T-01] Next.js Project Initialization & Styling Setup** (High | 2 pts)
* **[T-02] MongoDB Connection & Configuration** (High | 2 pts)
* **[T-03] Image CDN Helper Client (ImageKit / Cloudinary)** (Medium | 1 pt)

### 📌 EPIC 2: Data Models & Seeding
* **[T-04] Mongoose Models (Brands, Types, Products)** (High | 3 pts)
* **[T-05] Mongoose Models (Orders, SalesRecords, Promotions)** (High | 3 pts)
* **[T-06] Seeding Script for Initial Catalog Data** (Medium | 2 pts)

### 📌 EPIC 3: Customer Catalog & Landing Page
* **[T-07] General Layout (Header, Footer & Navigation)** (High | 2 pts)
* **[T-08] Promotions Banner Carousel** (Medium | 3 pts)
* **[T-09] Product Grid & Product Card Component** (High | 3 pts)
* **[T-10] Filter Bar (Brand, Type, Size)** (High | 3 pts)

### 📌 EPIC 4: Product Detail & Cart State
* **[T-11] Product Detail View / Modal (PDP)** (High | 3 pts)
* **[T-12] Global Cart State Management (Context / Store)** (High | 2 pts)

### 📌 EPIC 5: Epicodes 3-Step Checkout & WhatsApp Integration
* **[T-13] Checkout Step 1: "Your Data" Form** (High | 2 pts)
* **[T-14] Checkout Step 2: Order Review & `/api/checkout/create-order`** (High | 5 pts)
* **[T-15] Checkout Step 3: Payment Screen & WhatsApp Link Generator** (High | 3 pts)

### 📌 EPIC 6: Admin Panel - Auth & Catalogs
* **[T-16] Admin Authentication (Login & Protected Routes)** (High | 3 pts)
* **[T-17] Brand Management (Admin CRUD)** (Medium | 2 pts)
* **[T-18] Footwear Type Management (Admin CRUD)** (Medium | 2 pts)
* **[T-19] Promotion & Banner Management (Admin CRUD)** (Medium | 3 pts)

### 📌 EPIC 7: Admin Panel - Products & Stock
* **[T-20] Product Creation Form** (High | 5 pts)
* **[T-21] Product Editing & Deactivation** (High | 3 pts)
* **[T-22] CSV Bulk Stock Inventory Importer** (Medium | 5 pts)

### 📌 EPIC 8: Admin Panel - Sales & Stock Reduction
* **[T-23] Pending Sales Requests List** (High | 3 pts)
* **[T-24] Edit Items Modal in Pending Requests** (Medium | 3 pts)
* **[T-25] Sale Confirmation & Atomic Stock Transaction (`POST /api/admin/orders/:id/confirm`)** (High | 5 pts)
* **[T-26] Order Cancellation** (Medium | 2 pts)

### 📌 EPIC 9: Reports, Metrics & Store Settings
* **[T-27] Sales Dashboard & Reports** (Medium | 4 pts)
* **[T-28] Store Settings Panel** (Medium | 2 pts)

### 📌 EPIC 10: QA, UI Audit & Deployment
* **[T-29] UI Audit against `DESIGN.md`** (High | 2 pts)
* **[T-30] End-to-End Sales Flow Integration Testing** (High | 3 pts)
* **[T-31] Production Deployment (Vercel + MongoDB Atlas)** (High | 2 pts)
