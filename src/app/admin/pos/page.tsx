'use client';

import React, { useState } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import {
  ShoppingBag,
  Search,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Receipt,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

const WHOLESALE_THRESHOLD = 5;

interface SelectedProduct {
  productId: string;
  name: string;
  size: number;
  qty: number;
  retailPrice: number;
  wholesalePrice: number;
  unitPrice: number;
  appliedPriceType: 'retail' | 'wholesale' | 'custom';
  subtotal: number;
}

interface ProductSearchResult {
  _id: string;
  name: string;
  retailPrice: number;
  wholesalePrice: number;
  price?: number;
  sizesStock: { size: number; stock: number }[];
}

export default function AdminPOSPage() {
  // Customer form
  const [guestName, setGuestName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Product search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Cart items
  const [items, setItems] = useState<SelectedProduct[]>([]);

  // Order settings
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [discount, setDiscount] = useState<number>(0);
  const [discountNote, setDiscountNote] = useState('');

  // Sale state
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const totalPairs = items.reduce((sum, i) => sum + i.qty, 0);
  const isWholesale = totalPairs >= WHOLESALE_THRESHOLD;
  const wholesaleProgressPct = Math.min(100, (totalPairs / WHOLESALE_THRESHOLD) * 100);

  const computedItems = items.map((item) => {
    const effectivePrice = isWholesale ? item.wholesalePrice : item.retailPrice;
    return {
      ...item,
      unitPrice: item.appliedPriceType === 'custom' ? item.unitPrice : effectivePrice,
      appliedPriceType: item.appliedPriceType === 'custom'
        ? 'custom' as const
        : isWholesale ? 'wholesale' as const : 'retail' as const,
    };
  });

  const subtotal = computedItems.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const total = Math.max(0, subtotal - discount);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(searchQuery)}&active=true&limit=10`);
      const json = await res.json();
      if (json.ok) setSearchResults(json.data);
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  };

  const addItem = (product: ProductSearchResult, size: number) => {
    const sizeEntry = product.sizesStock.find((s) => s.size === size);
    if (!sizeEntry || sizeEntry.stock === 0) return;

    const retailPrice = product.retailPrice ?? product.price ?? 0;
    const wholesalePrice = product.wholesalePrice ?? retailPrice;

    const existingIdx = items.findIndex((i) => i.productId === product._id && i.size === size);
    if (existingIdx > -1) {
      setItems((prev) => prev.map((item, i) => {
        if (i !== existingIdx) return item;
        const newQty = Math.min(item.qty + 1, sizeEntry.stock);
        return { ...item, qty: newQty, subtotal: item.unitPrice * newQty };
      }));
      return;
    }

    const unitPrice = retailPrice;
    setItems((prev) => [
      ...prev,
      {
        productId: product._id,
        name: product.name,
        size,
        qty: 1,
        retailPrice,
        wholesalePrice,
        unitPrice,
        appliedPriceType: 'retail',
        subtotal: unitPrice,
      },
    ]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const updateQty = (idx: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((item, i) => {
          if (i !== idx) return item;
          const newQty = Math.max(0, item.qty + delta);
          return { ...item, qty: newQty };
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const setCustomPrice = (idx: number, newPrice: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        return {
          ...item,
          unitPrice: Math.max(0, newPrice),
          appliedPriceType: 'custom',
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!guestName.trim() || !guestLastName.trim() || !guestPhone.trim()) {
      setErrorMsg('Los datos del cliente son obligatorios.');
      return;
    }
    if (computedItems.length === 0) {
      setErrorMsg('Agregá al menos un producto a la venta.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/sales/create-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest: { name: guestName.trim(), lastName: guestLastName.trim(), phone: guestPhone.trim() },
          items: computedItems.map((i) => ({
            productId: i.productId,
            name: i.name,
            size: i.size,
            qty: i.qty,
            unitPrice: i.unitPrice,
          })),
          paymentMethod,
          discount,
          discountNote,
        }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.message ?? 'Error al registrar la venta');

      setSuccessMsg(`Venta ${json.orderNumber} registrada. Stock actualizado automáticamente.`);

      // Reset form
      setGuestName('');
      setGuestLastName('');
      setGuestPhone('');
      setItems([]);
      setDiscount(0);
      setDiscountNote('');
      setPaymentMethod('efectivo');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al registrar la venta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111111] font-sans">
      <AdminNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-[#707072] hover:text-[#111111] flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Volver a Pedidos
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[#111111] flex items-center gap-2">
              <Receipt className="w-7 h-7" /> Punto de Venta (POS)
            </h1>
            <p className="text-xs text-[#707072] mt-1">
              Registrá una venta directa. El stock se descuenta automáticamente al guardar.
            </p>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-[#007d48]/10 border border-[#007d48] text-[#007d48] text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-[#d30005]/10 border border-[#d30005] text-[#d30005] text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Customer + Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Data */}
            <div className="bg-white border border-[#e5e5e5] p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-[#111111]">
                Datos del Cliente
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Nombre *', value: guestName, setter: setGuestName, placeholder: 'Ej: Juan' },
                  { label: 'Apellido *', value: guestLastName, setter: setGuestLastName, placeholder: 'Ej: García' },
                  { label: 'Teléfono *', value: guestPhone, setter: setGuestPhone, placeholder: 'Ej: 1123456789' },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label}>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                      {label}
                    </label>
                    <input
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-medium py-2.5 px-3 border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Search */}
            <div className="bg-white border border-[#e5e5e5] p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-[#111111]">
                Buscar Producto
              </h2>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    placeholder="Buscar por nombre del producto..."
                    className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-medium py-3 pl-10 pr-4 border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                  <Search className="w-4 h-4 text-[#707072] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-5 py-3 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Buscar
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="border border-[#e5e5e5] divide-y divide-[#e5e5e5] max-h-60 overflow-y-auto">
                  {searchResults.map((prod) => (
                    <div key={prod._id} className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm text-[#111111]">{prod.name}</p>
                        <div className="text-right text-xs">
                          <p className="font-bold text-[#111111]">
                            Minorista: ${(prod.retailPrice ?? prod.price ?? 0).toLocaleString('es-AR')}
                          </p>
                          <p className="text-[#007d48] font-semibold">
                            Mayorista: ${(prod.wholesalePrice ?? prod.price ?? 0).toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {prod.sizesStock
                          .filter((s) => s.stock > 0)
                          .map((s) => (
                            <button
                              key={s.size}
                              type="button"
                              onClick={() => addItem(prod, s.size)}
                              className="px-3 py-1.5 bg-[#f5f5f5] text-[#111111] text-xs font-bold border border-[#e5e5e5] hover:bg-[#111111] hover:text-white transition-all cursor-pointer"
                            >
                              + Talle {s.size} ({s.stock})
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Wholesale Progress */}
              {items.length > 0 && (
                <div className={`p-3 rounded-lg border text-xs ${isWholesale ? 'bg-[#007d48]/10 border-[#007d48]/20' : 'bg-[#f5f5f5] border-[#e5e5e5]'}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`font-bold flex items-center gap-1 ${isWholesale ? 'text-[#007d48]' : 'text-[#707072]'}`}>
                      <Tag className="w-3.5 h-3.5" />
                      {isWholesale
                        ? '¡Precio mayorista activo en todos los ítems!'
                        : `Faltan ${WHOLESALE_THRESHOLD - totalPairs} pares para precio mayorista`
                      }
                    </span>
                    <span className="text-[#707072] font-semibold">{totalPairs}/{WHOLESALE_THRESHOLD} pares</span>
                  </div>
                  <div className="w-full bg-[#e5e5e5] rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${isWholesale ? 'bg-[#007d48]' : 'bg-[#111111]'}`}
                      style={{ width: `${wholesaleProgressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Items in cart */}
            {items.length > 0 && (
              <div className="bg-white border border-[#e5e5e5] shadow-sm">
                <div className="p-4 border-b border-[#e5e5e5]">
                  <h2 className="text-base font-extrabold uppercase tracking-tight text-[#111111] flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" /> Productos Seleccionados
                  </h2>
                </div>
                <div className="divide-y divide-[#e5e5e5]">
                  {computedItems.map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center gap-4 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#111111] truncate">{item.name}</p>
                        <p className="text-xs text-[#707072]">
                          Talle {item.size}
                          {item.appliedPriceType === 'wholesale' && (
                            <span className="ml-2 text-[#007d48] font-bold">[Mayorista]</span>
                          )}
                          {item.appliedPriceType === 'custom' && (
                            <span className="ml-2 text-[#f59e0b] font-bold">[Precio acordado]</span>
                          )}
                        </p>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center border border-[#e5e5e5]">
                        <button
                          type="button"
                          onClick={() => updateQty(idx, -1)}
                          className="px-2.5 py-1.5 text-xs font-bold text-[#111111] hover:bg-[#f5f5f5] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-bold text-[#111111]">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(idx, 1)}
                          className="px-2.5 py-1.5 text-xs font-bold text-[#111111] hover:bg-[#f5f5f5] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price input (custom override) */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#707072]">$</span>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => setCustomPrice(idx, Number(e.target.value))}
                          className="w-24 text-right bg-[#f5f5f5] text-[#111111] font-bold text-xs py-1.5 px-2 border border-[#e5e5e5] focus:outline-none"
                        />
                      </div>

                      <span className="w-24 text-right font-extrabold text-[#111111]">
                        ${(item.unitPrice * item.qty).toLocaleString('es-AR')}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-[#707072] hover:text-[#d30005] transition-colors cursor-pointer p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Summary & Submit */}
          <div className="space-y-6">
            <div className="bg-white border border-[#e5e5e5] p-6 space-y-4 shadow-sm sticky top-4">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-[#111111]">
                Resumen de Venta
              </h2>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                  Medio de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#f5f5f5] text-[#111111] text-xs font-bold py-2.5 px-3 border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111] cursor-pointer"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                  Descuento ($ ARS)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-extrabold py-2.5 px-3 border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  value={discountNote}
                  onChange={(e) => setDiscountNote(e.target.value)}
                  placeholder="Descripción del descuento, observaciones..."
                  className="w-full bg-[#f5f5f5] text-[#111111] text-xs font-medium py-2.5 px-3 border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              {/* Totals */}
              <div className="border-t border-[#e5e5e5] pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#707072]">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString('es-AR')}</span>
                </div>
                {isWholesale && (
                  <div className="flex justify-between text-[#007d48] font-semibold">
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" />Precio mayorista</span>
                    <span>Aplicado</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-[#007d48] font-semibold">
                    <span>Descuento</span>
                    <span>-${discount.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-xl text-[#111111] pt-2 border-t border-[#e5e5e5]">
                  <span>TOTAL</span>
                  <span>${total.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || items.length === 0}
                className="w-full py-4 bg-[#111111] hover:bg-black text-white font-bold text-sm uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Registrando...</>
                ) : (
                  <><Receipt className="w-5 h-5" /> Registrar Venta</>
                )}
              </button>

              <p className="text-[10px] text-center text-[#707072]">
                El stock se descuenta automáticamente al registrar la venta.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
