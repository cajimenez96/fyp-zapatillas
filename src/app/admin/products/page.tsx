'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminNav } from '@/components/admin/AdminNav';
import {
  Plus,
  Edit2,
  Package,
  Search,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react';

import { formatPrice } from '@/utils/formatCurrency';
import { toast } from '@/components/ui/sonner';

interface AdminProductItem {
  _id: string;
  name: string;
  price?: number;
  retailPrice?: number;
  wholesalePrice?: number;
  gender: string;
  active: boolean;
  brandId: { _id: string; name: string } | string;
  typeId: { _id: string; name: string } | string;
  images: Array<{ url: string; isPrincipal: boolean }>;
  totalStock: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedGender) params.append('gender', selectedGender);
      if (selectedStatus) params.append('active', selectedStatus);
      params.append('limit', '50');

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const json = await res.json();
      if (json.ok) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
      toast.error('Error al cargar productos del catálogo');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedGender, selectedStatus]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleStatus = async (product: AdminProductItem) => {
    try {
      const res = await fetch(`/api/admin/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: product._id,
          active: !product.active,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        const msg = !product.active
          ? `Producto "${product.name}" activado`
          : `Producto "${product.name}" desactivado`;
        toast.success(msg, {
          description: !product.active ? 'Visible en catálogo.' : 'Oculto del catálogo.',
        });
        fetchProducts();
      } else {
        throw new Error(json.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111111] font-sans">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Header & Main Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[#111111] flex items-center gap-2">
              <Package className="w-7 h-7" /> Catálogo de Productos
            </h1>
            <p className="text-xs text-[#707072] mt-1">
              Administrá los modelos, precios, imágenes y stock por talle.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/products/import-csv"
              className="py-2.5 px-4 bg-white border border-[#e5e5e5] hover:border-[#111111] text-[#111111] font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 transition-all shadow-xs"
            >
              <Upload className="w-4 h-4" /> Importar CSV
            </Link>

            <Link
              href="/admin/products/new"
              className="py-2.5 px-5 bg-[#111111] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nuevo Producto
            </Link>
          </div>
        </div>

        {/* Filters & Search Controls Bar */}
        <div className="bg-white border border-[#e5e5e5] p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f5f5f5] text-[#111111] text-xs font-medium py-2.5 pl-9 pr-4 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
            />
            <Search className="w-4 h-4 text-[#707072] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="bg-[#f5f5f5] text-[#111111] text-xs font-bold py-2.5 px-3 rounded-none border border-[#e5e5e5]"
            >
              <option value="">-- Todos los Géneros --</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="Niño">Niño</option>
              <option value="Unisex">Unisex</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#f5f5f5] text-[#111111] text-xs font-bold py-2.5 px-3 rounded-none border border-[#e5e5e5]"
            >
              <option value="">-- Estado --</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Products List Table */}
        <div className="bg-white border border-[#e5e5e5] shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#707072] animate-pulse">
              Cargando catálogo de productos...
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#707072]">
              No se encontraron productos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f5f5f5] text-[#111111] uppercase font-extrabold border-b border-[#e5e5e5]">
                  <tr>
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Marca / Tipo</th>
                    <th className="py-3 px-4 text-center">Género</th>
                    <th className="py-3 px-4 text-right">Precio</th>
                    <th className="py-3 px-4 text-center">Stock Total</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {products.map((prod) => {
                    const brandName =
                      typeof prod.brandId === 'object' && prod.brandId !== null
                        ? prod.brandId.name
                        : '-';
                    const typeName =
                      typeof prod.typeId === 'object' && prod.typeId !== null
                        ? prod.typeId.name
                        : '-';
                    const mainImage =
                      prod.images.find((img) => img.isPrincipal)?.url ||
                      prod.images[0]?.url ||
                      '';

                    return (
                      <tr key={prod._id} className="hover:bg-[#f5f5f5]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 bg-[#f5f5f5] flex-shrink-0 border border-[#e5e5e5]">
                              {mainImage && (
                                <Image
                                  src={mainImage}
                                  alt={prod.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover object-center"
                                />
                              )}
                            </div>
                            <span className="font-extrabold text-sm text-[#111111] line-clamp-1">
                              {prod.name}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-[#707072] font-semibold">
                          <div>{brandName}</div>
                          <div className="text-[10px] text-[#707072]">{typeName}</div>
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-[#111111]">
                          {prod.gender}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="font-extrabold text-sm text-[#111111]">
                            {formatPrice(prod.retailPrice ?? prod.price)}
                          </div>
                          {(prod.wholesalePrice !== undefined && prod.wholesalePrice !== null) && (
                            <div className="text-[10px] font-bold text-[#007d48]">
                              May: {formatPrice(prod.wholesalePrice)}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-extrabold px-2.5 py-1 rounded-full text-[11px] border ${
                              prod.totalStock > 0
                                ? 'bg-[#f5f5f5] text-[#111111] border-[#e5e5e5]'
                                : 'bg-[#d30005]/10 text-[#d30005] border-[#d30005]'
                            }`}
                          >
                            {prod.totalStock} pares
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {prod.active ? (
                            <span className="bg-[#007d48] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                              ACTIVO
                            </span>
                          ) : (
                            <span className="bg-[#707072] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                              INACTIVO
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => toggleStatus(prod)}
                              className={`p-1.5 rounded-full transition-colors ${
                                prod.active
                                  ? 'bg-[#007d48] text-white'
                                  : 'bg-[#f5f5f5] text-[#707072] border border-[#e5e5e5]'
                              }`}
                              title={prod.active ? 'Desactivar producto' : 'Activar producto'}
                            >
                              {prod.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>

                            <Link
                              href={`/admin/products/${prod._id}/edit`}
                              className="p-1.5 bg-[#f5f5f5] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                              title="Editar producto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
