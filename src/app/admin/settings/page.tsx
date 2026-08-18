'use client';

import React, { useState, useEffect } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { CreditCard, Save, CheckCircle2, AlertCircle, Loader2, Phone, Building } from 'lucide-react';

export default function AdminSettingsPage() {
  const [bankAlias, setBankAlias] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [storePhone, setStorePhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const json = await res.json();
        if (json.ok && json.data) {
          setBankAlias(json.data.bankAlias || '');
          setBankHolder(json.data.bankHolder || '');
          setBankName(json.data.bankName || '');
          setStorePhone(json.data.storePhone || '');
        }
      } catch (err) {
        console.error('Error al cargar ajustes:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAlias,
          bankHolder,
          bankName,
          storePhone,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || 'Error al actualizar los datos de transferencia');
      }

      setSuccessMsg('¡Datos bancarios y de contacto actualizados correctamente!');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111111] font-sans">
      <AdminNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[#111111] flex items-center gap-2">
            <CreditCard className="w-7 h-7" /> Datos de Transferencia & Contacto
          </h1>
          <p className="text-xs text-[#707072] mt-1">
            Configurá los datos bancarios expuestos en el checkout y el teléfono oficial de WhatsApp.
          </p>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-[#007d48]/10 border border-[#007d48] text-[#007d48] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-[#d30005]/10 border border-[#d30005] text-[#d30005] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          /* Tailwind Skeleton Loading State */
          <div className="bg-white border border-[#e5e5e5] p-6 space-y-6 animate-pulse">
            <div className="h-4 bg-[#e5e5e5] w-1/3 rounded"></div>
            <div className="space-y-4">
              <div className="h-10 bg-[#e5e5e5] rounded w-full"></div>
              <div className="h-10 bg-[#e5e5e5] rounded w-full"></div>
              <div className="h-10 bg-[#e5e5e5] rounded w-full"></div>
              <div className="h-10 bg-[#e5e5e5] rounded w-full"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#e5e5e5] p-6 sm:p-8 space-y-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="border-b border-[#e5e5e5] pb-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#111111] flex items-center gap-2">
                  <Building className="w-4 h-4" /> Datos Cuenta Bancaria
                </h3>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                  Alias Bancario *
                </label>
                <input
                  type="text"
                  placeholder="Ej: FP.ZAPATILLAS"
                  value={bankAlias}
                  onChange={(e) => setBankAlias(e.target.value)}
                  className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-extrabold py-3 px-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                    Titular de la Cuenta *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: FP Calzados"
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value)}
                    className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-bold py-3 px-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                    Banco / Entidad *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Banco Galicia"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-bold py-3 px-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>
              </div>

              <div className="border-b border-[#e5e5e5] pt-4 pb-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#111111] flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Teléfono de WhatsApp
                </h3>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
                  Número con código de país (sin 0 ni 15 ni símbolos) *
                </label>
                <input
                  type="text"
                  placeholder="Ej: 5493815218630"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-bold py-3 px-3 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-[#111111] hover:bg-black text-white font-bold text-sm uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 mt-4"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Guardando Cambios...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Guardar Ajustes
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
