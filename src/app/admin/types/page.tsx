'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle2, Loader2, Layers } from 'lucide-react';

interface TypeItem {
  _id: string;
  name: string;
  description?: string;
  productCount: number;
}

export default function AdminTypesPage() {
  const [types, setTypes] = useState<TypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeDescription, setTypeDescription] = useState('');

  // Alerts State
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/types');
      const json = await res.json();
      if (json.ok) {
        setTypes(json.data);
      }
    } catch (err) {
      console.error('Error al cargar tipos de calzado:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const url = '/api/admin/types';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, name: typeName, description: typeDescription }
        : { name: typeName, description: typeDescription };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || 'Error al guardar el tipo de calzado');
      }

      setSuccessMsg(
        editingId
          ? 'Tipo de calzado actualizado correctamente'
          : 'Tipo de calzado creado exitosamente'
      );
      setTypeName('');
      setTypeDescription('');
      setEditingId(null);
      fetchTypes();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error procesando solicitud');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (type: TypeItem) => {
    setEditingId(type._id);
    setTypeName(type.name);
    setTypeDescription(type.description || '');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTypeName('');
    setTypeDescription('');
    setErrorMsg('');
  };

  const handleDelete = async (type: TypeItem) => {
    if (type.productCount > 0) {
      setErrorMsg(
        `No se puede eliminar el tipo "${type.name}" porque tiene ${type.productCount} productos asociados.`
      );
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el tipo de calzado "${type.name}"?`)) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/types?id=${type._id}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || 'No se pudo eliminar el tipo de calzado');
      }

      setSuccessMsg('Tipo de calzado eliminado correctamente');
      fetchTypes();
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
              <Layers className="w-7 h-7" /> Tipos de Calzado
            </h1>
            <p className="text-xs text-[#707072] mt-1">
              Gestioná las categorías de estilo (Running, Urbana, Deportiva, Ojota, etc.).
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
          {/* Create / Edit Form */}
          <div className="bg-white border border-[#e5e5e5] p-6 space-y-4 h-fit shadow-sm">
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#111111]">
              {editingId ? 'Editar Tipo' : 'Nuevo Tipo de Calzado'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Zapatilla Running, Zapato Elegante..."
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-medium py-3 px-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre el estilo o uso recomendado..."
                  value={typeDescription}
                  onChange={(e) => setTypeDescription(e.target.value)}
                  className="w-full bg-[#f5f5f5] text-[#111111] text-xs font-medium p-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !typeName.trim()}
                  className="flex-1 py-3 bg-[#111111] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    'Guardar Cambios'
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Crear Tipo
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

          {/* Types Table List */}
          <div className="lg:col-span-2 bg-white border border-[#e5e5e5] p-6 shadow-sm">
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#111111] mb-4">
              Tipos Registrados ({types.length})
            </h2>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#707072] animate-pulse">
                Cargando tipos de calzado...
              </div>
            ) : types.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#707072]">
                No hay tipos de calzado registrados aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f5f5f5] text-[#111111] uppercase font-extrabold border-b border-[#e5e5e5]">
                    <tr>
                      <th className="py-3 px-4">Nombre</th>
                      <th className="py-3 px-4">Descripción</th>
                      <th className="py-3 px-4 text-center">Productos</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5e5]">
                    {types.map((type) => (
                      <tr key={type._id} className="hover:bg-[#f5f5f5]/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#111111] text-sm">
                          {type.name}
                        </td>
                        <td className="py-3 px-4 text-[#707072]">
                          {type.description || <span className="italic text-gray-400">Sin descripción</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-[#f5f5f5] text-[#111111] font-extrabold px-2.5 py-1 rounded-full border border-[#e5e5e5]">
                            {type.productCount} productos
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(type)}
                              className="p-1.5 bg-[#f5f5f5] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(type)}
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
