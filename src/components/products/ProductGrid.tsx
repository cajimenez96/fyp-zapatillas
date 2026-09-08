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

const ProductCardSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-3">
    <div className="bg-[#e5e5e5] aspect-square w-full rounded-none" />
    <div className="space-y-2 pt-1">
      <div className="h-3 bg-[#e5e5e5] w-1/4 rounded-xs" />
      <div className="h-4 bg-[#e5e5e5] w-3/4 rounded-xs" />
      <div className="h-5 bg-[#e5e5e5] w-1/2 rounded-xs" />
    </div>
  </div>
);

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
    if (!hasMore || loading) return;

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
  }, [hasMore, loading, products.length]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 md:gap-x-6 gap-y-10 my-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={`init-skeleton-${i}`} />
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 md:gap-x-6 gap-y-10 my-6">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onSelectProduct={onSelectProduct}
          />
        ))}

        {loadingMore &&
          Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={`more-skeleton-${i}`} />
          ))}
      </div>

      {hasMore && (
        <div
          ref={sentinelRef}
          className="py-6 text-center flex flex-col items-center justify-center gap-2"
        >
          {!loadingMore && (
            <button
              onClick={() => onLoadMoreRef.current?.()}
              className="text-xs font-bold text-[#111111] hover:underline cursor-pointer bg-[#f5f5f5] hover:bg-[#e5e5e5] px-4 py-2 border border-[#e5e5e5] transition-colors"
            >
              Cargar más productos
            </button>
          )}
        </div>
      )}
    </>
  );
};
