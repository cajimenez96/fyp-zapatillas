'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Upload, Link as LinkIcon, Trash2, Check, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { IProductImage } from '@/models/Product';

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
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Local File Upload to ImageKit
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setErrorMsg('');

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
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar el archivo');
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
  };

  // Set Primary Image
  const handleSetPrincipal = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      isPrincipal: idx === index,
    }));
    onChange(updated);
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

      {/* Alert Error */}
      {errorMsg && (
        <div className="p-3 bg-[#d30005]/10 border border-[#d30005] text-[#d30005] text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab 1: File Upload (ImageKit Dropzone) */}
      {activeTab === 'upload' && (
        <div className="bg-[#f5f5f5] border-2 border-dashed border-[#e5e5e5] p-6 text-center space-y-3 hover:border-[#111111] transition-colors rounded-none">
          {uploading ? (
            <div className="py-4 space-y-2 flex flex-col items-center justify-center animate-pulse">
              <Loader2 className="w-8 h-8 text-[#111111] animate-spin" />
              <span className="text-xs font-bold text-[#111111]">
                Subiendo imagen a ImageKit CDN...
              </span>
            </div>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-[#707072] mx-auto" />
              <div>
                <label className="cursor-pointer py-2.5 px-5 bg-[#111111] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-full inline-flex items-center gap-2 shadow-md">
                  <Upload className="w-4 h-4" /> Seleccionar Imagen Local
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[11px] text-[#707072]">
                Formatos permitidos: PNG, JPG, WEBP. Optimización automática en CDN.
              </p>
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

      {/* Thumbnails Gallery Rail */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
            Imágenes Cargadas ({images.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`p-3 bg-white border flex items-center gap-3 transition-all ${
                  img.isPrincipal ? 'border-[#111111] ring-1 ring-[#111111]' : 'border-[#e5e5e5]'
                }`}
              >
                <div className="relative w-14 h-14 bg-[#f5f5f5] flex-shrink-0 border border-[#e5e5e5]">
                  <Image
                    src={img.url}
                    alt={`Preview ${idx + 1}`}
                    fill
                    sizes="56px"
                    className="object-cover object-center"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-[11px] text-[#707072] truncate">{img.url}</p>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#111111] cursor-pointer">
                    <input
                      type="radio"
                      name="principalImage"
                      checked={img.isPrincipal}
                      onChange={() => handleSetPrincipal(idx)}
                      className="accent-[#111111] cursor-pointer"
                    />
                    <span>{img.isPrincipal ? '★ Portada Principal' : 'Establecer Portada'}</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="p-1.5 text-[#707072] hover:text-[#d30005] hover:bg-[#d30005]/10 rounded-full transition-colors cursor-pointer"
                  title="Eliminar imagen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
