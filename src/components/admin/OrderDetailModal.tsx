'use client';

import React, { useState } from 'react';
import { X, MessageSquare, Check, Ban, Clock, Loader2 } from 'lucide-react';
import { OrderStatus } from '@/models/Order';

export interface AdminOrderItem {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: 'transferencia' | 'efectivo';
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  guest: {
    name: string;
    lastName: string;
    phone: string;
  };
  items: Array<{
    productId: string;
    name: string;
    size: number;
    qty: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

interface OrderDetailModalProps {
  order: AdminOrderItem | null;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: OrderStatus) => Promise<void>;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onStatusChange,
}) => {
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const whatsappPhone = order.guest.phone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${whatsappPhone.startsWith('54') ? whatsappPhone : `54${whatsappPhone}`}?text=${encodeURIComponent(
    `¡Hola ${order.guest.name}! Te escribimos de FP Zapatillas respecto a tu solicitud #${order.orderNumber}.`
  )}`;

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    setUpdating(true);
    try {
      await onStatusChange(order._id, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-none shadow-2xl border border-[#e5e5e5] p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#111111] bg-[#f5f5f5] hover:bg-[#111111] hover:text-white rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 border-b border-[#e5e5e5] pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-extrabold uppercase tracking-tight text-[#111111]">
              Solicitud #{order.orderNumber}
            </h2>

            {order.status === 'pendiente' && (
              <span className="bg-[#f59e0b] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> PENDIENTE
              </span>
            )}
            {order.status === 'completada' && (
              <span className="bg-[#007d48] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> COMPLETADA
              </span>
            )}
            {order.status === 'cancelada' && (
              <span className="bg-[#d30005] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Ban className="w-3 h-3" /> CANCELADA
              </span>
            )}
          </div>
          <p className="text-xs text-[#707072]">
            Fecha de emisión: {new Date(order.createdAt).toLocaleString('es-AR')}
          </p>
        </div>

        {/* Customer Box + WhatsApp Action */}
        <div className="bg-[#f5f5f5] p-4 border border-[#e5e5e5] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-bold text-[#707072] uppercase tracking-wider block">
              CLIENTE / COMPRADOR
            </span>
            <h4 className="font-extrabold text-sm text-[#111111]">
              {order.guest.name} {order.guest.lastName}
            </h4>
            <p className="text-xs text-[#707072]">📱 {order.guest.phone}</p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-4 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Contactar WhatsApp</span>
          </a>
        </div>

        {/* Order Items Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
            Desglose de Calzado Solicitado ({order.items.length})
          </h3>
          <div className="border border-[#e5e5e5] bg-[#f5f5f5] divide-y divide-[#e5e5e5]">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-3 flex justify-between items-center text-xs">
                <div>
                  <h5 className="font-bold text-[#111111]">{item.name}</h5>
                  <p className="text-[#707072]">
                    Talle: <strong className="text-[#111111]">{item.size}</strong> • Cantidad: <strong className="text-[#111111]">{item.qty}</strong>
                  </p>
                </div>
                <div className="text-right font-extrabold text-[#111111]">
                  ${item.subtotal.toLocaleString('es-AR')}
                </div>
              </div>
            ))}

            <div className="p-4 bg-white flex justify-between items-center text-sm font-extrabold text-[#111111]">
              <span>TOTAL DE LA VENTA:</span>
              <span className="text-xl">${order.total.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>

        {/* Payment & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[10px] font-bold text-[#707072] uppercase tracking-wider block">
              MEDIO DE PAGO
            </span>
            <span className="font-extrabold text-[#111111] uppercase">
              {order.paymentMethod}
            </span>
          </div>

          <div className="p-3 bg-[#f5f5f5] border border-[#e5e5e5]">
            <span className="text-[10px] font-bold text-[#707072] uppercase tracking-wider block">
              NOTAS ADICIONALES
            </span>
            <span className="font-medium text-[#111111]">
              {order.notes || <span className="italic text-gray-400">Sin observaciones</span>}
            </span>
          </div>
        </div>

        {/* Status Actions */}
        <div className="pt-4 border-t border-[#e5e5e5] flex flex-wrap gap-2 justify-end">
          {order.status !== 'completada' && (
            <button
              onClick={() => handleUpdateStatus('completada')}
              disabled={updating}
              className="py-3 px-5 bg-[#007d48] hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Marcar como Completada</span>
            </button>
          )}

          {order.status !== 'cancelada' && (
            <button
              onClick={() => handleUpdateStatus('cancelada')}
              disabled={updating}
              className="py-3 px-5 bg-[#d30005] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              <span>Cancelar Solicitud</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
