"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PromoCarousel } from "@/components/home/PromoCarousel";
import {
  ProductGrid,
  FilterBar,
  ProductDetailModal,
  FormattedProduct,
  CartItemAddPayload,
} from "@/components/products";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CheckoutModal } from "@/components/checkout";
import { useCart } from "@/context/CartContext";
import { IPromotion } from "@/models/Promotion";

function HomeContent() {
  const searchParams = useSearchParams();
  const searchQueryParam = searchParams.get("search") || "";
  const genderQueryParam = searchParams.get("gender") || null;

  const [promotions, setPromotions] = useState<IPromotion[]>([]);
  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [brands, setBrands] = useState<{ _id: string; name: string }[]>([]);
  const [types, setTypes] = useState<{ _id: string; name: string }[]>([]);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] =
    useState<FormattedProduct | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Filter States
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(
    genderQueryParam,
  );

  const { addToCart } = useCart();

  useEffect(() => {
    setSelectedGender(genderQueryParam);
  }, [genderQueryParam]);

  // 1. Fetch Promotions
  useEffect(() => {
    async function fetchPromotions() {
      try {
        const res = await fetch("/api/promotions");
        const json = await res.json();
        if (json.ok) {
          setPromotions(json.data);
        }
      } catch (err) {
        console.error("Error al cargar promociones:", err);
      }
    }
    fetchPromotions();
  }, []);

  // 2. Fetch Brands & Types for FilterBar
  useEffect(() => {
    async function fetchFilterData() {
      try {
        const [brandsRes, typesRes] = await Promise.all([
          fetch("/api/brands"),
          fetch("/api/types"),
        ]);

        const brandsJson = await brandsRes.json();
        const typesJson = await typesRes.json();

        if (brandsJson.ok) setBrands(brandsJson.data);
        if (typesJson.ok) setTypes(typesJson.data);
      } catch (err) {
        console.error("Error al cargar opciones de filtro:", err);
      }
    }
    fetchFilterData();
  }, []);

  // 3. Fetch Products with Filters
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();

      if (searchQueryParam.trim()) {
        params.append("search", searchQueryParam.trim());
      }
      if (selectedBrandIds.length > 0) {
        params.append("brandId", selectedBrandIds.join(","));
      }
      if (selectedTypeIds.length > 0) {
        params.append("typeId", selectedTypeIds.join(","));
      }
      if (selectedSize !== null) {
        params.append("size", selectedSize.toString());
      }
      if (selectedGender !== null) {
        params.append("gender", selectedGender);
      }

      // If no filters or search active, fetch random sample for landing
      const isFiltered =
        searchQueryParam.trim().length > 0 ||
        selectedBrandIds.length > 0 ||
        selectedTypeIds.length > 0 ||
        selectedSize !== null ||
        selectedGender !== null;

      if (!isFiltered) {
        params.append("random", "true");
        params.append("limit", "12");
      } else {
        params.append("limit", "50");
      }

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();

      if (json.ok) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error("Error al cargar catálogo:", err);
    } finally {
      setLoadingProducts(false);
    }
  }, [
    searchQueryParam,
    selectedBrandIds,
    selectedTypeIds,
    selectedSize,
    selectedGender,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handlers
  const handleToggleBrand = (brandId: string) => {
    setSelectedBrandIds((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId],
    );
  };

  const handleToggleType = (typeId: string) => {
    setSelectedTypeIds((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId],
    );
  };

  const handleClearFilters = () => {
    setSelectedBrandIds([]);
    setSelectedTypeIds([]);
    setSelectedSize(null);
    setSelectedGender(null);
  };

  const handleAddToCart = (payload: CartItemAddPayload) => {
    addToCart(payload.product, payload.size, payload.qty);
  };

  const handleStartCheckout = () => {
    setIsCheckoutOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
      {/* 1. Hero Promo Carousel */}
      <PromoCarousel promotions={promotions} />

      {/* 2. Catalog Section */}
      <section id="catalogo" className="mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] uppercase tracking-tight">
              Catálogo de Calzado
            </h2>
            <p className="text-xs text-[#707072] mt-0.5">
              {searchQueryParam
                ? `Resultados para "${searchQueryParam}"`
                : "Descubrí nuestro stock disponible. Elegí tu talle y hacé tu pedido directo por WhatsApp."}
            </p>
          </div>
          <span className="text-xs font-bold text-[#111111] bg-[#f5f5f5] px-3 py-1 rounded-full border border-[#e5e5e5]">
            {products.length} modelos mostrados
          </span>
        </div>

        {/* Filter Bar */}
        <FilterBar
          brands={brands}
          types={types}
          selectedBrandIds={selectedBrandIds}
          selectedTypeIds={selectedTypeIds}
          selectedSize={selectedSize}
          selectedGender={selectedGender}
          onToggleBrand={handleToggleBrand}
          onToggleType={handleToggleType}
          onSelectSize={setSelectedSize}
          onSelectGender={setSelectedGender}
          onClearFilters={handleClearFilters}
        />

        {/* Product Grid */}
        <ProductGrid
          products={products}
          loading={loadingProducts}
          onSelectProduct={(product) => setSelectedProduct(product)}
        />
      </section>

      {/* 3. Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 4. Cart Slide-Over Drawer */}
      <CartDrawer onStartCheckout={handleStartCheckout} />

      {/* 5. Epicodes 3-Step Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs text-[#707072]">
          Cargando catálogo...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
