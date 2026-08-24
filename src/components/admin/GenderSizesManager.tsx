'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, X, RotateCcw, Save, Loader2, Check, Sparkles } from 'lucide-react';
import type { GenderType } from '@/models/Product';
import { toast } from '@/components/ui/sonner';

const GENDERS: GenderType[] = ['Hombre', 'Mujer', 'Niño', 'Unisex'];

const GENDER_DESCRIPTIONS: Record<GenderType, string> = {
  Hombre: 'Escala estándar de calzado masculino (ej: 36 al 45)',
  Mujer: 'Escala estándar de calzado femenino (ej: 33 al 42)',
  Niño: 'Escala infantil / juvenil (ej: 25 al 35)',
  Unisex: 'Escala para modelos neutros / unisex (ej: 36 al 45)',
};

export const GenderSizesManager: React.FC = () => {
  const [sizesByGender, setSizesByGender] = useState<Record<GenderType, number[]>>({
    Hombre: [],
    Mujer: [],
    Niño: [],
    Unisex: [],
  });
  const [newSizeInputs, setNewSizeInputs] = useState<Record<GenderType, string>>({
    Hombre: '',
    Mujer: '',
    Niño: '',
    Unisex: '',
  });
  const [loading, setLoading] = useState(true);
  const [savingGender, setSavingGender] = useState<GenderType | null>(null);

  const fetchSizes = async () => {
    try {
      const res = await fetch('/api/admin/sizes');
      const json = await res.json();
      if (json.ok && json.data) {
        setSizesByGender(json.data);
      }
    } catch (err) {
      console.error('Error al cargar talles:', err);
      toast.error('Error al cargar escalas de talles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSizes();
  }, []);

  const handleAddSize = (gender: GenderType) => {
    const rawVal = newSizeInputs[gender].trim();
    if (!rawVal) return;

    const num = Number(rawVal);
    if (isNaN(num) || num <= 0 || num > 70) {
      toast.error('Ingresá un número de talle válido (ej: 38, 41.5)');
      return;
    }

    const current = sizesByGender[gender] || [];
    if (current.includes(num)) {
      toast.error(`El talle ${num} ya existe en ${gender}`);
      return;
    }

    const updated = [...current, num].sort((a, b) => a - b);
    setSizesByGender((prev) => ({ ...prev, [gender]: updated }));
    setNewSizeInputs((prev) => ({ ...prev, [gender]: '' }));
  };

  const handleRemoveSize = (gender: GenderType, sizeToRemove: number) => {
    const current = sizesByGender[gender] || [];
    if (current.length <= 1) {
      toast.warning('Cada género debe tener al menos un talle configurado');
      return;
    }
    const updated = current.filter((s) => s !== sizeToRemove);
    setSizesByGender((prev) => ({ ...prev, [gender]: updated }));
  };

  const handleSaveGender = async (gender: GenderType) => {
    setSavingGender(gender);
    try {
      const res = await fetch('/api/admin/sizes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          sizes: sizesByGender[gender],
        }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.message || 'Error al guardar talles');

      toast.success(`Talles de ${gender} actualizados con éxito`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingGender(null);
    }
  };

  const handleResetGender = async (gender: GenderType) => {
    if (!confirm(`¿Restablecer los talles de ${gender} a los valores predeterminados?`)) return;

    setSavingGender(gender);
    try {
      const res = await fetch('/api/admin/sizes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          reset: true,
        }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.message || 'Error al restablecer');

      if (json.data && json.data.sizes) {
        setSizesByGender((prev) => ({ ...prev, [gender]: json.data.sizes }));
      } else {
        await fetchSizes();
      }

      toast.success(`Talles de ${gender} restablecidos`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al restablecer');
    } finally {
      setSavingGender(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#e5e5e5] p-6 text-center text-xs text-[#707072] flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando escalas de talles...
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e5e5e5] p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="border-b border-[#e5e5e5] pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#007d48]" />
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wider text-[#111111]">
              Escala de Talles por Género (ABM)
            </h2>
            <p className="text-xs text-[#707072]">
              Configurá los números de calzado disponibles al crear o editar productos de cada categoría.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {GENDERS.map((gender) => {
          const sizes = sizesByGender[gender] || [];
          const isSaving = savingGender === gender;

          return (
            <div
              key={gender}
              className="border border-[#e5e5e5] bg-[#fafafa] p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase text-[#111111] flex items-center gap-1.5">
                      {gender}
                      <span className="text-[11px] font-semibold text-[#707072] lowercase">
                        ({sizes.length} talles)
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#707072]">{GENDER_DESCRIPTIONS[gender]}</p>
                  </div>
                </div>

                {/* Chips Container */}
                <div className="flex flex-wrap gap-1.5 min-h-[42px] p-2 bg-white border border-[#e5e5e5]">
                  {sizes.length === 0 ? (
                    <span className="text-xs text-[#9e9ea0] italic">Sin talles configurados</span>
                  ) : (
                    sizes.map((size) => (
                      <span
                        key={size}
                        className="inline-flex items-center gap-1 bg-[#111111] text-white text-xs font-extrabold px-2.5 py-1 rounded-none shadow-xs group"
                      >
                        {size}
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(gender, size)}
                          className="text-[#9e9ea0] hover:text-white transition-colors cursor-pointer"
                          title={`Eliminar talle ${size}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add new size input */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Nuevo talle (ej: 42.5)"
                    value={newSizeInputs[gender]}
                    onChange={(e) =>
                      setNewSizeInputs((prev) => ({ ...prev, [gender]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSize(gender);
                      }
                    }}
                    className="flex-1 bg-white text-[#111111] text-xs font-semibold py-2 px-3 border border-[#e5e5e5] focus:outline-none focus:ring-1 focus:ring-[#111111]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSize(gender)}
                    className="py-2 px-3 bg-[#f5f5f5] hover:bg-[#111111] text-[#111111] hover:text-white text-xs font-bold uppercase transition-colors flex items-center gap-1 border border-[#e5e5e5] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </button>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#e5e5e5] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleResetGender(gender)}
                  disabled={isSaving}
                  className="text-[11px] font-bold text-[#707072] hover:text-[#111111] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Restablecer a escala estándar inicial"
                >
                  <RotateCcw className="w-3 h-3" /> Restablecer
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveGender(gender)}
                  disabled={isSaving}
                  className="py-1.5 px-4 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-none flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Guardar Talles
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
