'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { Plus, Edit2, Trash2, Loader2, Tag } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface BrandItem {
  _id: string;
  name: string;
  productCount: number;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('');

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/brands');
      const json = await res.json();
      if (json.ok) {
        setBrands(json.data);
      }
    } catch (err) {
      console.error('Error al cargar marcas:', err);
      toast.error('Error al cargar marcas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      toast.error('El nombre de la marca es obligatorio');
      return;
    }

    setSaving(true);

    try {
      const url = '/api/admin/brands';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, name: brandName } : { name: brandName };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || 'Error al guardar la marca');
      }

      toast.success(
        editingId ? 'Marca actualizada correctamente' : 'Marca creada exitosamente'
      );
      setBrandName('');
      setEditingId(null);
      fetchBrands();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error procesando solicitud');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (brand: BrandItem) => {
    setEditingId(brand._id);
    setBrandName(brand.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setBrandName('');
  };

  const handleDelete = async (brand: BrandItem) => {
    if (brand.productCount > 0) {
      toast.error(
        `No se puede eliminar "${brand.name}" porque tiene ${brand.productCount} productos asociados.`
      );
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar la marca "${brand.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/brands?id=${brand._id}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || 'No se pudo eliminar la marca');
      }

      toast.success('Marca eliminada correctamente');
      fetchBrands();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111111] font-sans">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[#111111] flex items-center gap-2">
              <Tag className="w-7 h-7" /> Gestión de Marcas
            </h1>
            <p className="text-xs text-[#707072] mt-1">
              Administrá los fabricantes de calzado expuestos en el catálogo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create / Edit Form */}
          <div className="bg-white border border-[#e5e5e5] p-6 space-y-4 h-fit shadow-sm">
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#111111]">
              {editingId ? 'Editar Marca' : 'Nueva Marca'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                  Nombre de la Marca *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Nike, Adidas, New Balance..."
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-medium py-3 px-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !brandName.trim()}
                  className="flex-1 py-3 bg-[#111111] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    'Guardar Cambios'
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Crear Marca
                    </>
                  )}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-3 bg-[#f5f5f5] text-[#111111] font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#e5e5e5]"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Brands Table List */}
          <div className="lg:col-span-2 bg-white border border-[#e5e5e5] p-6 shadow-sm">
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#111111] mb-4">
              Marcas Registradas ({brands.length})
            </h2>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#707072] animate-pulse">
                Cargando marcas...
              </div>
            ) : brands.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#707072]">
                No hay marcas registradas aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f5f5f5] text-[#111111] uppercase font-extrabold border-b border-[#e5e5e5]">
                    <tr>
                      <th className="py-3 px-4">Nombre</th>
                      <th className="py-3 px-4 text-center">Productos Asociados</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5e5]">
                    {brands.map((brand) => (
                      <tr key={brand._id} className="hover:bg-[#f5f5f5]/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#111111] text-sm">
                          {brand.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-[#f5f5f5] text-[#111111] font-extrabold px-2.5 py-1 rounded-full border border-[#e5e5e5]">
                            {brand.productCount} productos
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(brand)}
                              className="p-1.5 bg-[#f5f5f5] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(brand)}
                              className="p-1.5 bg-[#f5f5f5] text-[#d30005] hover:bg-[#d30005] hover:text-white transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
