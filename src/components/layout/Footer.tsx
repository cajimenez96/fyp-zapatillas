import React from 'react';
import Link from 'next/link';
import { Phone, ShieldCheck, Truck, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#cacacb] text-[#111111] mt-16">
      {/* 1. Value Propositions Banner */}
      <div className="bg-[#f5f5f5] py-8 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="p-3 bg-white rounded-full shadow-sm text-[#111111]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-tight">Envíos a todo el País</h4>
              <p className="text-xs text-[#707072]">Despachamos tu pedido en 24hs</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="p-3 bg-white rounded-full shadow-sm text-[#007d48]">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-tight">Atención Directa</h4>
              <p className="text-xs text-[#707072]">Confirmación rápida por WhatsApp</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="p-3 bg-white rounded-full shadow-sm text-[#111111]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-tight">Calidad Garantizada</h4>
              <p className="text-xs text-[#707072]">Productos 100% verificados</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-extrabold text-xl tracking-tighter uppercase mb-3">
            FP <span className="font-light text-[#707072]">Zapatillas</span>
          </h3>
          <p className="text-xs text-[#707072] leading-relaxed mb-4">
            Catálogo e-commerce de calzado. Seleccioná tus modelos favoritos y completá tu compra fácil y rápido vía WhatsApp.
          </p>
          <div className="flex items-center gap-2 text-xs text-[#707072]">
            <Clock className="w-4 h-4 text-[#111111]" />
            <span>Horarios: 12:00 a 22:00 hs</span>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Categorías</h4>
          <ul className="space-y-2 text-xs text-[#707072]">
            <li><Link href="/?gender=Hombre#catalogo" className="hover:text-[#111111] transition-colors">Calzado Hombre</Link></li>
            <li><Link href="/?gender=Mujer#catalogo" className="hover:text-[#111111] transition-colors">Calzado Mujer</Link></li>
            <li><Link href="/?gender=Niño#catalogo" className="hover:text-[#111111] transition-colors">Calzado Niño</Link></li>
            <li><Link href="/?gender=Unisex#catalogo" className="hover:text-[#111111] transition-colors">Calzado Unisex</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Medios de Pago</h4>
          <ul className="space-y-2 text-xs text-[#707072]">
            <li>• Transferencia Bancaria (CBU / Alias)</li>
            <li>• Pago en Efectivo (Contra entrega)</li>
            <li>• Descuentos especiales por WhatsApp</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Contacto Directo</h4>
          <p className="text-xs text-[#707072] mb-3">¿Tenés alguna duda sobre tu talle o modelo?</p>
          <a
            href="https://wa.me/5493815218630?text=Hola!%20Tengo%20una%20consulta%20sobre%20un%20calzado"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#111111] text-white text-xs font-semibold px-4 py-2.5 rounded-full hover:bg-black/90 transition-transform active:scale-95 shadow-sm"
          >
            <Phone className="w-4 h-4 text-[#007d48]" />
            <span>Hablar por WhatsApp</span>
          </a>
        </div>
      </div>

      {/* 3. Bottom Legal Row */}
      <div className="border-t border-[#e5e5e5] py-6 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-[#707072] uppercase font-medium">
          <p>© 2026 FP Zapatillas. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <span>Términos y Condiciones</span>
            <span>Políticas de Privacidad</span>
            <span>Catálogo E-Commerce</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
