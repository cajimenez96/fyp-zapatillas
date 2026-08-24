'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Upload, Link as LinkIcon, Trash2, Check, Loader2, Image as ImageIcon, Star } from 'lucide-react';
import type { IProductImage } from '@/models/Product';
import { toast } from '@/components/ui/sonner';

interface ImageUploaderProps {
  images: IProductImage[];
  onChange: (images: IProductImage[]) => void;
  folder?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  folder = '/products',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);

  // Handle Local File Upload to ImageKit
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/admin/imagekit/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || 'Error al subir la imagen a ImageKit');
      }

      const newImage: IProductImage = {
        url: json.url,
        fileId: json.fileId,
        isPrincipal: images.length === 0,
        position: images.length + 1,
      };

      onChange([...images, newImage]);
      toast.success('Imagen subida con éxito a ImageKit');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar el archivo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Handle Direct External URL Add
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;

    const newImage: IProductImage = {
      url: urlInput.trim(),
      isPrincipal: images.length === 0,
      position: images.length + 1,
    };

    onChange([...images, newImage]);
    setUrlInput('');
    toast.success('Enlace de imagen agregado');
  };

  // Set Primary Image
  const handleSetPrincipal = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      isPrincipal: idx === index,
    }));
    onChange(updated);
    toast.info(`Imagen #${index + 1} establecida como portada`);
  };

  // Remove / Delete Image
  const handleRemoveImage = async (index: number) => {
    const target = images[index];

    // If target has a fileId, call ImageKit delete API
    if (target.fileId) {
      try {
        await fetch(`/api/admin/imagekit/delete?fileId=${target.fileId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Error al borrar imagen de ImageKit:', err);
      }
    }

    const filtered = images.filter((_, idx) => idx !== index);

    // Reassign primary if needed
    if (filtered.length > 0 && !filtered.some((img) => img.isPrincipal)) {
      filtered[0].isPrincipal = true;
    }

    onChange(filtered);
    toast.success('Imagen eliminada');
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Tab Switcher: Subir Archivo vs Pegar URL */}
      <div className="flex border-b border-[#e5e5e5]">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'upload'
              ? 'border-[#111111] text-[#111111]'
              : 'border-transparent text-[#707072] hover:text-[#111111]'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Subir Imagen (ImageKit CDN)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'url'
              ? 'border-[#111111] text-[#111111]'
              : 'border-transparent text-[#707072] hover:text-[#111111]'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" /> Pegar Link URL Externa
        </button>
      </div>

      {/* Tab 1: File Upload (ImageKit Dropzone) */}
      {activeTab === 'upload' && (
        <div className="bg-[#f5f5f5] border-2 border-dashed border-[#e5e5e5] p-6 text-center space-y-3 hover:border-[#111111] transition-colors rounded-none">
          {uploading ? (
            <div className="py-4 space-y-2 flex flex-col items-center justify-center animate-pulse">
              <Loader2 className="w-8 h-8 text-[#111111] animate-spin" />
              <p className="text-xs font-bold text-[#111111]">Optimizando y subiendo imagen a CDN...</p>
            </div>
          ) : (
            <>
              <div className="mx-auto w-10 h-10 bg-white border border-[#e5e5e5] flex items-center justify-center text-[#707072]">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#111111]">
                  Arrastrá tu foto acá o hacé clic para explorar
                </p>
                <p className="text-[11px] text-[#707072]">
                  Soporta PNG, JPG, WEBP optimizados automáticamente en ImageKit
                </p>
              </div>
              <div>
                <label className="cursor-pointer py-2 px-5 bg-[#111111] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-none inline-block transition-all shadow-sm active:scale-95">
                  Seleccionar Archivo
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Direct URL Input */}
      {activeTab === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Ej: https://ik.imagekit.io/... o Unsplash URL"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 bg-[#f5f5f5] text-[#111111] text-xs font-medium py-3 px-3 border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim()}
            className="py-3 px-5 bg-[#111111] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-none cursor-pointer disabled:opacity-50"
          >
            Agregar Link
          </button>
        </div>
      )}

      {/* Thumbnails Gallery Rail with Horizontal Scroll */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
              Imágenes Cargadas ({images.length})
            </h4>
            {images.length > 2 && (
              <span className="text-[10px] text-[#707072] font-semibold">
                Deslizá horizontalmente para ver todas →
              </span>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`w-44 min-w-[176px] bg-white border flex flex-col overflow-hidden transition-all shadow-xs group flex-shrink-0 ${
                  img.isPrincipal ? 'border-[#111111] ring-2 ring-[#111111]' : 'border-[#e5e5e5]'
                }`}
              >
                {/* Image Preview Container */}
                <div className="relative w-full aspect-square bg-[#f5f5f5] overflow-hidden">
                  <Image
                    src={img.url}
                    alt={`Foto ${idx + 1}`}
                    fill
                    sizes="176px"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Principal Badge */}
                  {img.isPrincipal && (
                    <span className="absolute top-2 left-2 z-10 bg-[#111111] text-white text-[10px] font-black uppercase px-2 py-0.5 tracking-wider shadow-md">
                      ★ Portada
                    </span>
                  )}

                  {/* Position Tag */}
                  <span className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-xs text-white text-[10px] font-extrabold px-1.5 py-0.5">
                    #{idx + 1}
                  </span>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-white/95 hover:bg-[#d30005] text-[#707072] hover:text-white rounded-full shadow-md transition-all cursor-pointer"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Footer Action */}
                {img.isPrincipal ? (
                  <div className="py-2 px-3 bg-[#111111] text-white text-[11px] font-extrabold uppercase tracking-wider text-center flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5 text-[#00ff88]" /> Portada Activa
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrincipal(idx)}
                    className="py-2 px-3 bg-[#f5f5f5] hover:bg-[#111111] text-[#111111] hover:text-white text-[11px] font-extrabold uppercase tracking-wider text-center transition-colors cursor-pointer border-t border-[#e5e5e5] flex items-center justify-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5" /> Usar de Portada
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
