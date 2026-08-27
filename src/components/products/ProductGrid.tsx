"use client";

import React, { useEffect, useRef } from "react";
import { ProductCard, FormattedProduct } from "./ProductCard";
import { PackageX } from "lucide-react";

interface ProductGridProps {
  products: FormattedProduct[];
  loading?: boolean;
  onSelectProduct: (product: FormattedProduct) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  onSelectProduct,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMoreRef.current?.();
        }
      },
      { rootMargin: "400px" },
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore]);
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 my-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse space-y-3">
            <div className="bg-[#f5f5f5] aspect-square w-full rounded-none" />
            <div className="h-3 bg-[#f5f5f5] w-1/3 rounded-xs" />
            <div className="h-4 bg-[#f5f5f5] w-3/4 rounded-xs" />
            <div className="h-5 bg-[#f5f5f5] w-1/2 rounded-xs" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-16 px-4 text-center bg-[#f5f5f5] border border-[#e5e5e5] my-6">
        <PackageX className="w-12 h-12 text-[#707072] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[#111111] uppercase tracking-tight">
          No se encontraron productos
        </h3>
        <p className="text-sm text-[#707072] max-w-md mx-auto mt-1">
          Intenta ajustar los filtros de búsqueda o reiniciar la selección para
          ver más modelos disponibles.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 my-6">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onSelectProduct={onSelectProduct}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="py-6 text-center">
          {loadingMore && (
            <span className="text-xs text-[#707072]">
              Cargando más productos...
            </span>
          )}
        </div>
      )}
    </>
  );
};
