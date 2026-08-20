'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin/orders';

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Por favor ingresá usuario y contraseña');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || 'Credenciales de acceso incorrectas');
      }

      toast.success('¡Sesión iniciada correctamente!', {
        description: 'Redirigiendo al panel...',
      });
      window.location.href = redirectPath;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-[#e5e5e5] p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-[#f5f5f5] rounded-full text-[#111111] mb-1">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#111111]">
            Panel Administrador
          </h1>
          <p className="text-xs text-[#707072]">
            Ingresá tus credenciales para gestionar el inventario y las ventas.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
              Usuario *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Usuario admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-medium py-3 pl-10 pr-4 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
              <User className="w-4 h-4 text-[#707072] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1.5">
              Contraseña *
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-medium py-3 pl-10 pr-4 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
              <Lock className="w-4 h-4 text-[#707072] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#111111] hover:bg-black text-white font-bold text-sm uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Iniciando sesión...
              </>
            ) : (
              'Ingresar al Panel'
            )}
          </button>
        </form>

        <div className="border-t border-[#f5f5f5] pt-4 text-center">
          <span className="text-[11px] text-[#707072] flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#007d48]" /> Acceso restringido únicamente para administradores
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111111] flex items-center justify-center text-white text-xs">
          Cargando panel de administración...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
