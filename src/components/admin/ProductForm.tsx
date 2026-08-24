"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";
import type { GenderType, IProductImage, ISizeStock } from "@/models/Product";
import { DEFAULT_GENDER_SIZES } from "@/constants/sizes";
import { ImageUploader } from "./ImageUploader";
import { toast } from "@/components/ui/sonner";

interface OptionItem {
  _id: string;
  name: string;
}

interface ProductFormProps {
  initialData?: {
    _id?: string;
    name: string;
    description: string;
    price?: number;
    retailPrice?: number;
    wholesalePrice?: number;
    brandId: string | { _id: string; name: string };
    typeId: string | { _id: string; name: string };
    gender: GenderType;
    active: boolean;
    images: IProductImage[];
    sizesStock: ISizeStock[];
    displayedSizes?: number[];
  };
  isEditing?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  isEditing = false,
}) => {
  const router = useRouter();

  const [brands, setBrands] = useState<OptionItem[]>([]);
  const [types, setTypes] = useState<OptionItem[]>([]);
  const [genderSizes, setGenderSizes] = useState<Record<GenderType, number[]>>(DEFAULT_GENDER_SIZES);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [retailPrice, setRetailPrice] = useState<number | "">(
    initialData?.retailPrice !== undefined
      ? initialData.retailPrice
      : initialData?.price !== undefined
        ? initialData.price
        : "",
  );
  const [wholesalePrice, setWholesalePrice] = useState<number | "">(
    initialData?.wholesalePrice !== undefined
      ? initialData.wholesalePrice
      : initialData?.price !== undefined
        ? initialData.price
        : "",
  );
  const [brandId, setBrandId] = useState<string>(
    typeof initialData?.brandId === "object"
      ? initialData.brandId._id
      : initialData?.brandId || "",
  );
  const [typeId, setTypeId] = useState<string>(
    typeof initialData?.typeId === "object"
      ? initialData.typeId._id
      : initialData?.typeId || "",
  );
  const [gender, setGender] = useState<GenderType>(
    initialData?.gender || "Hombre",
  );
  const [active, setActive] = useState<boolean>(
    initialData?.active !== undefined ? initialData.active : true,
  );

  // Images state: array of { url, fileId, isPrincipal, position }
  const [images, setImages] = useState<IProductImage[]>(
    initialData?.images && initialData.images.length > 0
      ? initialData.images
      : [],
  );

  // Sizes stock state: array of { size, stock }
  const [sizesStock, setSizesStock] = useState<ISizeStock[]>([]);

  // Displayed sizes state: array of sizes to show in storefront
  const [displayedSizes, setDisplayedSizes] = useState<number[]>([]);

  // Toggle to show/hide sizes without stock
  const [showHiddenSizes, setShowHiddenSizes] = useState(false);

  // 1. Fetch Brands, Types & Dynamic Gender Sizes
  useEffect(() => {
    async function fetchOptions() {
      try {
        const [brandsRes, typesRes, sizesRes] = await Promise.all([
          fetch("/api/brands"),
          fetch("/api/types"),
          fetch("/api/sizes"),
        ]);

        const brandsJson = await brandsRes.json();
        const typesJson = await typesRes.json();
        const sizesJson = await sizesRes.json();

        if (brandsJson.ok) setBrands(brandsJson.data);
        if (typesJson.ok) setTypes(typesJson.data);
        if (sizesJson.ok && sizesJson.data) setGenderSizes(sizesJson.data);
      } catch (err) {
        console.error("Error al cargar listas de marcas, tipos y talles:", err);
      } finally {
        setLoadingOptions(false);
      }
    }
    fetchOptions();
  }, []);

  // 2. Initialize size scale stock when Gender or genderSizes changes
  useEffect(() => {
    const scaleSizes = genderSizes[gender] || DEFAULT_GENDER_SIZES[gender] || [];

    if (!isEditing) {
      const initialized = scaleSizes.map((s) => ({
        size: s,
        stock: 0,
      }));
      setSizesStock(initialized);
      setDisplayedSizes([]);
    } else if (initialData?.sizesStock) {
      const stockMap = new Map(
        initialData.sizesStock.map((s) => [s.size, s.stock]),
      );

      // Merge current scale sizes and any extra existing size already saved on the product
      const allUniqueSizes = Array.from(
        new Set([...scaleSizes, ...initialData.sizesStock.map((s) => s.size)])
      ).sort((a, b) => a - b);

      const combined = allUniqueSizes.map((s) => ({
        size: s,
        stock: stockMap.get(s) || 0,
      }));

      setSizesStock(combined);
    }
  }, [gender, genderSizes, isEditing, initialData]);

  // 3. Initialize displayedSizes based on stock or saved displayedSizes
  useEffect(() => {
    if (!isEditing) {
      const sizesWithStock = sizesStock
        .filter((s) => s.stock > 0)
        .map((s) => s.size);
      setDisplayedSizes(sizesWithStock);
    } else if (initialData && "displayedSizes" in initialData) {
      const saved = (initialData as any).displayedSizes || [];
      setDisplayedSizes(saved);
    } else {
      const sizesWithStock = sizesStock
        .filter((s) => s.stock > 0)
        .map((s) => s.size);
      setDisplayedSizes(sizesWithStock);
    }
  }, [sizesStock, isEditing, initialData]);

  // Size Stock Helpers
  const handleStockChange = (size: number, newStock: number) => {
    const validStock = Math.max(0, newStock);
    setSizesStock((prev) =>
      prev.map((s) => (s.size === size ? { ...s, stock: validStock } : s)),
    );
  };

  const handleToggleSizeDisplay = (size: number) => {
    setDisplayedSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size].sort((a, b) => a - b)
    );
  };

  const visibleSizesForToggle = showHiddenSizes
    ? sizesStock
    : sizesStock.filter((s) => s.stock > 0);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!name.trim()) {
      toast.error("El nombre del producto es obligatorio", {
        description: "Completá el nombre para poder continuar.",
      });
      return;
    }
    if (!description.trim()) {
      toast.error("La descripción es obligatoria", {
        description: "Ingresá una breve descripción del producto.",
      });
      return;
    }
    if (retailPrice === "" || Number(retailPrice) < 0) {
      toast.error("Ingresá un precio minorista válido", {
        description: "El valor debe ser mayor o igual a 0.",
      });
      return;
    }
    if (wholesalePrice === "" || Number(wholesalePrice) < 0) {
      toast.error("Ingresá un precio mayorista válido", {
        description: "El valor debe ser mayor o igual a 0.",
      });
      return;
    }
    if (Number(wholesalePrice) > Number(retailPrice)) {
      toast.error("El precio mayorista no puede superar al minorista", {
        description: "Ajustá los valores antes de guardar.",
      });
      return;
    }
    if (!brandId || !typeId) {
      toast.error("Seleccioná la Marca y Tipo de Calzado", {
        description: "Ambos campos son requeridos para catalogar.",
      });
      return;
    }

    const validImages = images.filter((img) => img.url && img.url.trim());
    if (validImages.length === 0) {
      toast.error("Subí al menos una imagen válida", {
        description: "El producto requiere una foto de portada.",
      });
      return;
    }

    const totalStockCount = sizesStock.reduce(
      (acc, curr) => acc + curr.stock,
      0,
    );
    if (totalStockCount === 0) {
      toast.warning("El producto no tiene stock cargado en ningún talle", {
        description: "Se guardará sin stock disponible para la venta.",
      });
    }

    setSaving(true);

    try {
      const url = "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const payload = isEditing
        ? {
            _id: initialData?._id,
            name: name.trim(),
            description: description.trim(),
            retailPrice: Number(retailPrice),
            wholesalePrice: Number(wholesalePrice),
            brandId,
            typeId,
            gender,
            active,
            images: validImages,
            sizesStock,
            displayedSizes,
          }
        : {
            name: name.trim(),
            description: description.trim(),
            retailPrice: Number(retailPrice),
            wholesalePrice: Number(wholesalePrice),
            brandId,
            typeId,
            gender,
            active,
            images: validImages,
            sizesStock,
            displayedSizes,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || "Error al guardar el producto");
      }

      const msg = isEditing
        ? "Producto actualizado correctamente"
        : "Producto creado exitosamente";

      toast.success(msg, {
        description: "Los cambios ya están reflejados en el catálogo.",
      });

      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error procesando solicitud";
      toast.error(msg, {
        description: "Revisá los datos e intentá nuevamente.",
      });
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 font-sans">
      {/* Top Header Controls */}
      <div className="flex justify-between items-center pb-4 border-b border-[#e5e5e5]">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs font-bold text-[#111111] hover:text-[#707072] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Productos
        </button>

        <button
          type="submit"
          disabled={saving}
          className="py-3 px-6 bg-[#111111] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />{" "}
              {isEditing ? "Guardar Cambios" : "Crear Producto"}
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Information & Stock */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Attributes Card */}
          <div className="bg-white border border-[#e5e5e5] p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-extrabold uppercase tracking-tight text-[#111111]">
              Información del Producto
            </h2>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                Nombre del Producto *
              </label>
              <input
                type="text"
                placeholder="Ej: Nike Air Max 90"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-medium py-3 px-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                Descripción Detallada *
              </label>
              <textarea
                rows={4}
                placeholder="Características, tecnología de amortiguación, materiales..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#f5f5f5] text-[#111111] text-xs font-medium p-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                  Precio Minorista ($ ARS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 130000"
                  value={retailPrice}
                  onChange={(e) =>
                    setRetailPrice(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-extrabold py-3 px-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
                <p className="text-[10px] text-[#707072] mt-1">
                  Precio para compras de 1 a 4 pares
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                  Precio Mayorista ($ ARS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 110000"
                  value={wholesalePrice}
                  onChange={(e) =>
                    setWholesalePrice(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-extrabold py-3 px-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
                <p className="text-[10px] text-[#707072] mt-1">
                  Precio para compras de 5 pares o más
                </p>
              </div>
            </div>

            <div className="flex items-center pt-2">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-[#111111]">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 accent-[#111111] cursor-pointer"
                />
                <span>Producto Activo (Visible en tienda)</span>
              </label>
            </div>
          </div>

          {/* Stock Matrix per Size */}
          <div className="bg-white border border-[#e5e5e5] p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-[#111111]">
                Stock por Talle (Escala {gender})
              </h2>
              <span className="text-xs text-[#707072] font-semibold">
                Stock Total:{" "}
                <strong className="text-[#111111]">
                  {sizesStock.reduce((acc, curr) => acc + curr.stock, 0)} pares
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {sizesStock.map((item) => (
                <div
                  key={item.size}
                  className="p-3 bg-[#f5f5f5] border border-[#e5e5e5] space-y-1.5 text-center"
                >
                  <span className="block text-xs font-extrabold text-[#111111]">
                    Talle {item.size}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={item.stock}
                    onChange={(e) =>
                      handleStockChange(
                        item.size,
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                    className="w-full text-center bg-white text-[#111111] font-extrabold text-sm py-1.5 border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Visible Sizes Selector */}
          <div className="bg-white border border-[#e5e5e5] p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-extrabold uppercase tracking-tight text-[#111111]">
                  Talles Visibles en Tienda
                </h2>
                <p className="text-xs text-[#707072] mt-1">
                  Seleccioná qué talles se mostrarán en la página del producto
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHiddenSizes(!showHiddenSizes)}
                className="text-xs font-bold px-3 py-2 rounded-full border border-[#e5e5e5] bg-white hover:bg-[#f5f5f5] transition-colors flex items-center gap-1.5 cursor-pointer"
                title={showHiddenSizes ? "Ocultar talles sin stock" : "Mostrar talles sin stock"}
              >
                👁️ {showHiddenSizes ? "Ocultar sin stock" : "Mostrar sin stock"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {visibleSizesForToggle.map((item) => (
                <label
                  key={item.size}
                  className="flex items-center gap-2 p-3 bg-[#f5f5f5] border border-[#e5e5e5] hover:border-[#111111] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={displayedSizes.includes(item.size)}
                    onChange={() => handleToggleSizeDisplay(item.size)}
                    className="w-4 h-4 accent-[#111111] cursor-pointer"
                  />
                  <span className="text-xs font-extrabold text-[#111111]">
                    {item.size}
                    {item.stock === 0 && (
                      <span className="text-[#cacacb] ml-1">(sin stock)</span>
                    )}
                  </span>
                </label>
              ))}
            </div>

            {displayedSizes.length === 0 && (
              <div className="text-xs text-[#d30005] bg-[#fef2f2] border border-[#fecaca] p-3 rounded">
                ⚠️ Ningún talle seleccionado. El producto no será visible en tienda.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Classification & ImageUploader */}
        <div className="space-y-6">
          {/* Classification Attributes */}
          <div className="bg-white border border-[#e5e5e5] p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-[#111111]">
                Clasificación
              </h2>
              {isEditing && (
                <span className="text-[10px] bg-[#f5f5f5] text-[#707072] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#e5e5e5]">
                  <Lock className="w-3 h-3" /> Fija
                </span>
              )}
            </div>

            {/* Brand Dropdown */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                Marca *
              </label>
              {isEditing ? (
                <div className="w-full bg-[#f5f5f5] text-[#707072] text-xs font-bold py-3 px-3 border border-[#e5e5e5]">
                  {typeof initialData?.brandId === "object"
                    ? initialData.brandId.name
                    : "Marca Bloqueada"}
                </div>
              ) : (
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  disabled={loadingOptions}
                  className="w-full bg-[#f5f5f5] text-[#111111] text-xs font-bold py-3 px-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111] cursor-pointer"
                >
                  <option value="">-- Seleccionar Marca --</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Footwear Type Dropdown */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                Tipo de Calzado *
              </label>
              {isEditing ? (
                <div className="w-full bg-[#f5f5f5] text-[#707072] text-xs font-bold py-3 px-3 border border-[#e5e5e5]">
                  {typeof initialData?.typeId === "object"
                    ? initialData.typeId.name
                    : "Tipo Bloqueado"}
                </div>
              ) : (
                <select
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                  disabled={loadingOptions}
                  className="w-full bg-[#f5f5f5] text-[#111111] text-xs font-bold py-3 px-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111] cursor-pointer"
                >
                  <option value="">-- Seleccionar Tipo --</option>
                  {types.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Gender Select */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                Género *
              </label>
              {isEditing ? (
                <div className="w-full bg-[#f5f5f5] text-[#707072] text-xs font-bold py-3 px-3 border border-[#e5e5e5]">
                  {gender}
                </div>
              ) : (
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as GenderType)}
                  className="w-full bg-[#f5f5f5] text-[#111111] text-xs font-bold py-3 px-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111] cursor-pointer"
                >
                  <option value="Hombre">Hombre (Talles 36-45)</option>
                  <option value="Mujer">Mujer (Talles 33-42)</option>
                  <option value="Niño">Niño (Talles 25-35)</option>
                  <option value="Unisex">Unisex (Talles 36-45)</option>
                </select>
              )}
            </div>
          </div>

          {/* Dual Mode ImageUploader Card */}
          <div className="bg-white border border-[#e5e5e5] p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-extrabold uppercase tracking-tight text-[#111111]">
              Gestión de Imágenes
            </h2>
            <ImageUploader
              images={images}
              onChange={setImages}
              folder="/products"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
