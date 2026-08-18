'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { OrderDetailModal, AdminOrderItem } from '@/components/admin/OrderDetailModal';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Clock,
  Check,
  Ban,
} from 'lucide-react';
import { OrderStatus } from '@/models/Order';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderItem | null>(null);

  // Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStatus) params.append('status', selectedStatus);
      params.append('limit', '50');

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const json = await res.json();
      if (json.ok) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error('Error al cargar solicitudes de pedidos:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || 'Error al actualizar el estado de la orden');
      }

      setSuccessMsg(`Solicitud #${json.data.orderNumber} actualizada a status "${newStatus}"`);
      if (selectedOrder && selectedOrder._id === id) {
        setSelectedOrder(json.data);
      }
      fetchOrders();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111111] font-sans">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[#111111] flex items-center gap-2">
              <ShoppingBag className="w-7 h-7" /> Solicitudes de Pedido (Ventas)
            </h1>
            <p className="text-xs text-[#707072] mt-1">
              Gestioná las compras registradas, actualizá su estado y contactá clientes vía WhatsApp.
            </p>
          </div>
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

        {/* Search & Filter Controls */}
        <div className="bg-white border border-[#e5e5e5] p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por #orden, cliente o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f5f5f5] text-[#111111] text-xs font-medium py-2.5 pl-9 pr-4 rounded-none border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#111111]"
            />
            <Search className="w-4 h-4 text-[#707072] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Todas', value: '' },
              { label: 'Pendientes', value: 'pendiente' },
              { label: 'Completadas', value: 'completada' },
              { label: 'Canceladas', value: 'cancelada' },
            ].map((st) => (
              <button
                key={st.value}
                onClick={() => setSelectedStatus(st.value)}
                className={`py-2 px-3.5 text-xs font-bold uppercase tracking-wider rounded-full border transition-all ${
                  selectedStatus === st.value
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-[#f5f5f5] text-[#111111] border-[#e5e5e5] hover:border-[#111111]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-[#e5e5e5] shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#707072] animate-pulse">
              Cargando solicitudes de pedido...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#707072]">
              No se encontraron solicitudes registradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f5f5f5] text-[#111111] uppercase font-extrabold border-b border-[#e5e5e5]">
                  <tr>
                    <th className="py-3 px-4">N° Solicitud</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4 text-center">Ítems</th>
                    <th className="py-3 px-4 text-center">Medio Pago</th>
                    <th className="py-3 px-4 text-right">Total ($)</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-[#f5f5f5]/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-sm text-[#111111] block">
                          #{ord.orderNumber}
                        </span>
                        <span className="text-[10px] text-[#707072]">
                          {new Date(ord.createdAt).toLocaleDateString('es-AR')}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-[#111111] block">
                          {ord.guest.name} {ord.guest.lastName}
                        </span>
                        <span className="text-[11px] text-[#707072]">
                          📱 {ord.guest.phone}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-[#111111]">
                        {ord.items.reduce((acc, curr) => acc + curr.qty, 0)} pares
                      </td>

                      <td className="py-3 px-4 text-center uppercase font-bold text-[#707072]">
                        {ord.paymentMethod}
                      </td>

                      <td className="py-3 px-4 text-right font-extrabold text-sm text-[#111111]">
                        ${ord.total.toLocaleString('es-AR')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <select
                          value={ord.status}
                          onChange={(e) =>
                            handleStatusChange(ord._id, e.target.value as OrderStatus)
                          }
                          className={`text-xs font-extrabold py-1 px-2.5 rounded-full border cursor-pointer ${
                            ord.status === 'completada'
                              ? 'bg-[#007d48] text-white border-[#007d48]'
                              : ord.status === 'pendiente'
                              ? 'bg-[#f59e0b] text-white border-[#f59e0b]'
                              : 'bg-[#d30005] text-white border-[#d30005]'
                          }`}
                        >
                          <option value="pendiente" className="bg-white text-black">
                            PENDIENTE
                          </option>
                          <option value="completada" className="bg-white text-black">
                            COMPLETADA
                          </option>
                          <option value="cancelada" className="bg-white text-black">
                            CANCELADA
                          </option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="py-1.5 px-3 bg-[#f5f5f5] text-[#111111] hover:bg-[#111111] hover:text-white font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
