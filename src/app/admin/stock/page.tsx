'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AdminNav } from '@/components/admin/AdminNav';
import { Boxes, Search, AlertTriangle, CheckCircle2, AlertCircle, Plus, Minus, RefreshCw } from 'lucide-react';

interface StockProductItem {
  _id: string;
  name: string;
  brandName: string;
  typeName: string;
  gender: string;
  price: number;
  retailPrice: number;
  wholesalePrice: number;
  active: boolean;
  image: string;
  totalStock: number;
  sizesStock: Array<{ size: number; stock: number }>;
  hasLowStock: boolean;
}

export default function AdminStockPage() {
  const [items, setItems] = useState<StockProductItem[]>([]);
  const [totalPairs, setTotalPairs] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [minStockAlert, setMinStockAlert] = useState(3);

  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (lowStockOnly) params.append('lowStock', 'true');

      const res = await fetch(`/api/admin/stock?${params.toString()}`);
      const json = await res.json();
      if (json.ok && json.data) {
        setItems(json.data.items);
        setTotalPairs(json.data.totalPairsInStock);
        setTotalProducts(json.data.totalProductsCount);
        setOutOfStockCount(json.data.outOfStockProductsCount);
        setLowStockCount(json.data.lowStockProductsCount || 0);
        if (json.data.minStockAlert !== undefined) {
          setMinStockAlert(json.data.minStockAlert);
        }
      }
    } catch (err) {
      console.error('Error al cargar reporte de stock:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, lowStockOnly]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleUpdateSingleStock = async (
    productId: string,
    size: number,
    currentStock: number,
    delta: number
  ) => {
    const newStock = Math.max(0, currentStock + delta);
    setUpdatingId(`${productId}-${size}`);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/stock', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, size, newStock }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || 'Error al actualizar el talle');
      }

      // Optimistic update
      setItems((prev) =>
        prev.map((prod) => {
          if (prod._id === productId) {
            const updatedSizes = prod.sizesStock.map((s) =>
              s.size === size ? { ...s, stock: newStock } : s
            );
            const newTotal = updatedSizes.reduce((acc, curr) => acc + curr.stock, 0);
            return {
              ...prod,
              sizesStock: updatedSizes,
              totalStock: newTotal,
              hasLowStock: newTotal <= minStockAlert,
            };
          }
          return prod;
        })
      );
      setSuccessMsg(`Talle ${size} actualizado a ${newStock} unidades`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al actualizar stock');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111111] font-sans">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[#111111] flex items-center gap-2">
              <Boxes className="w-7 h-7" /> Control de Stock e Inventario
            </h1>
            <p className="text-xs text-[#707072] mt-1">
              Monitoreá el stock total por modelo, alertas de reposición (total ≤ {minStockAlert} pares) y modificá cantidades en tiempo real.
            </p>
          </div>

          <button
            onClick={() => fetchStock()}
            className="py-2.5 px-4 bg-white border border-[#e5e5e5] hover:border-[#111111] text-[#111111] font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Actualizar Datos
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-[#007d48]/10 border border-[#007d48] text-[#007d48] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-[#d30005]/10 border border-[#d30005] text-[#d30005] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* KPI Metrics Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 border border-[#e5e5e5] space-y-1 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#707072] block">
              TOTAL DE PARES EN INVENTARIO
            </span>
            <span className="text-2xl font-extrabold text-[#111111]">{totalPairs} pares</span>
            <span className="text-xs text-[#707072] block font-semibold">
              Distribuídos en {totalProducts} modelos
            </span>
          </div>

          <div className="bg-white p-5 border border-[#e5e5e5] space-y-1 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#707072] block">
              MODELOS CON STOCK BAJO / CRÍTICO
            </span>
            <span className="text-2xl font-extrabold text-[#f59e0b]">
              {lowStockCount + outOfStockCount} modelos
            </span>
            <span className="text-xs text-[#707072] block font-semibold">
              Total de pares ≤ {minStockAlert} ({outOfStockCount} agotados)
            </span>
          </div>

          <div className="bg-white p-5 border border-[#e5e5e5] space-y-1 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#707072] block">
              ESTADO GENERAL
            </span>
            <span className="text-2xl font-extrabold text-[#007d48]">Operativo</span>
            <span className="text-xs text-[#707072] block font-semibold">
              Sincronización directa con catálogo
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-[#e5e5e5] p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por modelo de calzado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f5f5f5] text-[#111111] text-xs font-medium py-2.5 pl-9 pr-4 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
            />
            <Search className="w-4 h-4 text-[#707072] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-bold text-[#111111] cursor-pointer bg-[#f5f5f5] px-3.5 py-2 border border-[#e5e5e5]">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="w-4 h-4 accent-[#111111] cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b]" /> Ver sólo modelos con stock crítico (Total ≤ {minStockAlert} pares)
              </span>
            </label>
          </div>
        </div>

        {/* Stock Breakdown List */}
        <div className="bg-white border border-[#e5e5e5] shadow-sm">
          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-[#e5e5e5] w-1/4 rounded"></div>
              <div className="space-y-3">
                <div className="h-16 bg-[#e5e5e5] rounded w-full"></div>
                <div className="h-16 bg-[#e5e5e5] rounded w-full"></div>
                <div className="h-16 bg-[#e5e5e5] rounded w-full"></div>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#707072]">
              No se encontraron productos coincidentes en el inventario.
            </div>
          ) : (
            <div className="divide-y divide-[#e5e5e5]">
              {items.map((prod) => (
                <div key={prod._id} className="p-5 space-y-4 hover:bg-[#f5f5f5]/50 transition-colors">
                  {/* Row Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 bg-[#f5f5f5] flex-shrink-0 border border-[#e5e5e5]">
                        {prod.image && (
                          <Image
                            src={prod.image}
                            alt={prod.name}
                            fill
                            sizes="48px"
                            className="object-cover object-center"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#111111] uppercase">
                          {prod.name}
                        </h3>
                        <p className="text-[11px] text-[#707072] font-semibold">
                          {prod.brandName} • {prod.typeName} • {prod.gender}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-extrabold text-xs px-3 py-1 rounded-full border ${
                          prod.totalStock === 0
                            ? 'bg-[#d30005]/10 text-[#d30005] border-[#d30005]'
                            : prod.totalStock <= minStockAlert
                            ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]'
                            : 'bg-[#f5f5f5] text-[#111111] border-[#e5e5e5]'
                        }`}
                      >
                        {prod.totalStock === 0
                          ? 'AGOTADO (0 pares)'
                          : prod.totalStock <= minStockAlert
                          ? `STOCK BAJO (Total: ${prod.totalStock} pares)`
                          : `Total: ${prod.totalStock} pares`}
                      </span>
                    </div>
                  </div>

                  {/* Stock Grid per Size for this Product */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-8 gap-2 bg-[#f5f5f5] p-3 border border-[#e5e5e5]">
                    {prod.sizesStock.map((sizeItem) => {
                      const isSavingThis = updatingId === `${prod._id}-${sizeItem.size}`;
                      const isZero = sizeItem.stock === 0;

                      return (
                        <div
                          key={sizeItem.size}
                          className={`p-2 bg-white border space-y-1 text-center transition-all ${
                            isZero
                              ? 'border-[#d30005]/40 bg-[#d30005]/5'
                              : 'border-[#e5e5e5]'
                          }`}
                        >
                          <span className="block text-[11px] font-extrabold text-[#111111]">
                            Talle {sizeItem.size}
                          </span>

                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSingleStock(prod._id, sizeItem.size, sizeItem.stock, -1)
                              }
                              disabled={isSavingThis || sizeItem.stock === 0}
                              className="w-5 h-5 bg-[#f5f5f5] text-[#111111] hover:bg-[#111111] hover:text-white rounded-full flex items-center justify-center cursor-pointer disabled:opacity-30"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span className="font-extrabold text-xs text-[#111111] min-w-[20px]">
                              {sizeItem.stock}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSingleStock(prod._id, sizeItem.size, sizeItem.stock, 1)
                              }
                              disabled={isSavingThis}
                              className="w-5 h-5 bg-[#f5f5f5] text-[#111111] hover:bg-[#111111] hover:text-white rounded-full flex items-center justify-center cursor-pointer disabled:opacity-30"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
