'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterOption {
  _id: string;
  name: string;
}

interface FilterBarProps {
  brands: FilterOption[];
  types: FilterOption[];
  selectedBrandIds: string[];
  selectedTypeIds: string[];
  selectedSize: number | null;
  selectedGender: string | null;
  onToggleBrand: (brandId: string) => void;
  onToggleType: (typeId: string) => void;
  onSelectSize: (size: number | null) => void;
  onSelectGender: (gender: string | null) => void;
  onClearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  brands,
  types,
  selectedBrandIds,
  selectedTypeIds,
  selectedSize,
  selectedGender,
  onToggleBrand,
  onToggleType,
  onSelectSize,
  onSelectGender,
  onClearFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const availableSizes = Array.from({ length: 21 }, (_, i) => 25 + i); // 25 to 45
  const genders = ['Hombre', 'Mujer', 'Niño', 'Unisex'];

  const hasActiveFilters =
    selectedBrandIds.length > 0 ||
    selectedTypeIds.length > 0 ||
    selectedSize !== null ||
    selectedGender !== null;

  return (
    <div className="bg-[#f5f5f5] p-4 sm:p-6 border border-[#e5e5e5] mb-6 font-sans">
      {/* Header Row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#111111]" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#111111]">
            Filtros del Catálogo
          </h3>
          {hasActiveFilters && (
            <span className="bg-[#111111] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Activos
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-[#d30005] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Limpiar Filtros
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-[#111111] font-bold flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-[#e5e5e5] hover:border-[#111111] transition-all cursor-pointer shadow-xs"
          >
            <span>{isExpanded ? 'Minimizar Filtros' : 'Ampliar Filtros'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Filter Options (Collapsible on both web and mobile) */}
      {isExpanded && (
        <div className="space-y-5 mt-4 pt-4 border-t border-[#e5e5e5] animate-in fade-in duration-200">
          {/* 1. Marcas Filter Chips */}
          {brands.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#707072] uppercase tracking-wider mb-2">
                Marca
              </h4>
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => {
                  const isActive = selectedBrandIds.includes(brand._id);
                  return (
                    <button
                      key={brand._id}
                      onClick={() => onToggleBrand(brand._id)}
                      className={`transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#111111] text-white font-bold rounded-full px-3.5 py-1.5 text-xs shadow-xs'
                          : 'bg-white text-[#111111] font-semibold border border-[#e5e5e5] hover:border-[#111111] rounded-full px-3.5 py-1.5 text-xs'
                      }`}
                    >
                      {brand.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Tipos de Calzado Filter Chips */}
          {types.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#707072] uppercase tracking-wider mb-2">
                Tipo de Calzado
              </h4>
              <div className="flex flex-wrap gap-2">
                {types.map((type) => {
                  const isActive = selectedTypeIds.includes(type._id);
                  return (
                    <button
                      key={type._id}
                      onClick={() => onToggleType(type._id)}
                      className={`transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#111111] text-white font-bold rounded-full px-3.5 py-1.5 text-xs shadow-xs'
                          : 'bg-white text-[#111111] font-semibold border border-[#e5e5e5] hover:border-[#111111] rounded-full px-3.5 py-1.5 text-xs'
                      }`}
                    >
                      {type.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Género Filter */}
          <div>
            <h4 className="text-xs font-bold text-[#707072] uppercase tracking-wider mb-2">
              Género
            </h4>
            <div className="flex flex-wrap gap-2">
              {genders.map((gender) => {
                const isActive = selectedGender === gender;
                return (
                  <button
                    key={gender}
                    onClick={() => onSelectGender(isActive ? null : gender)}
                    className={`transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#111111] text-white font-bold rounded-full px-3.5 py-1.5 text-xs shadow-xs'
                        : 'bg-white text-[#111111] font-semibold border border-[#e5e5e5] hover:border-[#111111] rounded-full px-3.5 py-1.5 text-xs'
                    }`}
                  >
                    {gender}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Talles Grid Selector */}
          <div>
            <h4 className="text-xs font-bold text-[#707072] uppercase tracking-wider mb-2">
              Talle Disponibles
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {availableSizes.map((size) => {
                const isActive = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => onSelectSize(isActive ? null : size)}
                    className={`w-9 h-9 text-xs font-bold rounded-full transition-all flex items-center justify-center cursor-pointer ${
                      isActive
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'bg-white text-[#111111] border border-[#e5e5e5] hover:border-[#111111]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
