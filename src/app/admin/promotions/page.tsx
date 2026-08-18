'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AdminNav } from '@/components/admin/AdminNav';
import { ImageUploader } from '@/components/admin/ImageUploader';
import {
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from 'lucide-react';
import { IProductImage } from '@/models/Product';

interface PromotionItem {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  active: boolean;
  order: number;
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerImages, setBannerImages] = useState<IProductImage[]>([]);
  const [order, setOrder] = useState<number>(1);
  const [active, setActive] = useState<boolean>(true);

  // Alert State
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promotions');
      const json = await res.json();
      if (json.ok) {
        setPromotions(json.data);
      }
    } catch (err) {
      console.error('Error al cargar promociones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryImg = bannerImages[0]?.url || '';
    if (!title.trim() || !primaryImg.trim()) {
      setErrorMsg('Título e imagen son obligatorios');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const url = '/api/admin/promotions';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, title, description, imageUrl: primaryImg, active, order }
        : { title, description, imageUrl: primaryImg, active, order };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || 'Error al guardar el banner promocional');
      }

      setSuccessMsg(
        editingId
          ? 'Banner promocional actualizado correctamente'
          : 'Banner promocional creado exitosamente'
      );
      resetForm();
      fetchPromotions();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error procesando solicitud');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setBannerImages([]);
    setOrder(1);
    setActive(true);
    setErrorMsg('');
  };

  const handleEdit = (promo: PromotionItem) => {
    setEditingId(promo._id);
    setTitle(promo.title);
    setDescription(promo.description || '');
    setBannerImages([{ url: promo.imageUrl, isPrincipal: true, position: 1 }]);
    setOrder(promo.order || 1);
    setActive(promo.active);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleToggleActive = async (promo: PromotionItem) => {
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: promo._id, active: !promo.active }),
      });

      const json = await res.json();
      if (json.ok) {
        setSuccessMsg(
          !promo.active ? 'Banner activado en carrusel' : 'Banner desactivado del carrusel'
        );
        fetchPromotions();
      }
    } catch (err) {
      console.error('Error al cambiar estado del banner:', err);
    }
  };

  const handleDelete = async (promo: PromotionItem) => {
    if (!confirm(`¿Estás seguro de eliminar el banner "${promo.title}"?`)) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/promotions?id=${promo._id}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || 'No se pudo eliminar el banner');
      }

      setSuccessMsg('Banner promocional eliminado correctamente');
      fetchPromotions();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al eliminar');
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
              <ImageIcon className="w-7 h-7" /> Gestión de Promociones (Banners)
            </h1>
            <p className="text-xs text-[#707072] mt-1">
              Administrá los anuncios del carrusel hero de la portada subiendo imágenes a ImageKit o pegando URLs.
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 bg-[#007d48]/10 border border-[#007d48] text-[#007d48] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-[#d30005]/10 border border-[#d30005] text-[#d30005] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-white border border-[#e5e5e5] p-6 space-y-4 h-fit shadow-sm">
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#111111]">
              {editingId ? 'Editar Banner' : 'Nuevo Banner Promocional'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                  Título del Anuncio *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Lanzamiento 20% OFF en Efectivo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-medium py-3 px-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                  Imagen del Banner (Subir o Pegar URL) *
                </label>
                <ImageUploader
                  images={bannerImages}
                  onChange={setBannerImages}
                  folder="/promotions"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                  Descripción / Bajada
                </label>
                <textarea
                  rows={2}
                  placeholder="Texto descriptivo para el banner..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#f5f5f5] text-[#111111] text-xs font-medium p-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-bold py-2.5 px-3 rounded-none border border-[#e5e5e5]"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-[#111111]">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 accent-[#111111] cursor-pointer"
                    />
                    <span>Banner Activo</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !title.trim() || bannerImages.length === 0}
                  className="flex-1 py-3 bg-[#111111] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    'Guardar Cambios'
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Crear Banner
                    </>
                  )}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-3 bg-[#f5f5f5] text-[#111111] font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#e5e5e5] cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Promotions Table List */}
          <div className="lg:col-span-2 bg-white border border-[#e5e5e5] p-6 shadow-sm">
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#111111] mb-4">
              Banners Promocionales ({promotions.length})
            </h2>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#707072] animate-pulse">
                Cargando banners...
              </div>
            ) : promotions.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#707072]">
                No hay banners registrados aún.
              </div>
            ) : (
              <div className="space-y-4">
                {promotions.map((promo) => (
                  <div
                    key={promo._id}
                    className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-[#e5e5e5] bg-[#f5f5f5] hover:border-[#111111] transition-all"
                  >
                    {/* Image Preview */}
                    <div className="relative w-full sm:w-32 h-20 bg-white flex-shrink-0 border border-[#e5e5e5]">
                      <Image
                        src={promo.imageUrl}
                        alt={promo.title}
                        fill
                        sizes="128px"
                        className="object-cover object-center"
                      />
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="bg-[#111111] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          Orden #{promo.order}
                        </span>
                        {promo.active ? (
                          <span className="bg-[#007d48] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            ACTIVO
                          </span>
                        ) : (
                          <span className="bg-[#707072] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            INACTIVO
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm text-[#111111] truncate">
                        {promo.title}
                      </h4>
                      {promo.description && (
                        <p className="text-xs text-[#707072] line-clamp-1">
                          {promo.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(promo)}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          promo.active
                            ? 'bg-[#007d48] text-white'
                            : 'bg-white text-[#707072] border border-[#e5e5e5]'
                        }`}
                        title={promo.active ? 'Desactivar banner' : 'Activar banner'}
                      >
                        {promo.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(promo)}
                        className="p-2 bg-white text-[#111111] border border-[#e5e5e5] hover:border-[#111111] transition-colors rounded-full cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promo)}
                        className="p-2 bg-white text-[#d30005] border border-[#e5e5e5] hover:bg-[#d30005] hover:text-white transition-colors rounded-full cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
