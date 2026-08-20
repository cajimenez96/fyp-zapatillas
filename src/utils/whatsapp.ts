import { formatPrice } from '@/utils/formatCurrency';

export interface WhatsAppMessagePayload {
  orderNumber: string;
  guest: {
    name: string;
    lastName: string;
    phone: string;
  };
  items: Array<{
    name: string;
    size: number;
    qty: number;
    price: number;
    subtotal: number;
  }>;
  total: number;
  storePhone?: string;
  bankAlias?: string;
}

export function buildWhatsAppShareUrl(payload: WhatsAppMessagePayload): string {
  const phone =
    payload.storePhone || process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "-";

  const alias =
    payload.bankAlias || process.env.NEXT_PUBLIC_BANK_ALIAS || "FP.ZAPATILLAS";

  const itemsList = payload.items
    .map(
      (item) =>
        `• ${item.qty}x ${item.name}\n   - Talle: ${item.size}\n   - Subtotal: ${formatPrice(item.subtotal)}`,
    )
    .join("\n\n");

  const text = `¡Hola! Acabo de hacer mi pedido en FP Zapatillas 👟

👤 *CLIENTE*
• ${payload.guest.name} ${payload.guest.lastName}
📱 ${payload.guest.phone}

📦 *SOLICITUD DE PEDIDO #${payload.orderNumber}*
${itemsList}

💰 *TOTAL A PAGAR:* ${formatPrice(payload.total)}

Ahí transfiero al alias: *${alias}*
¡Adjunto el comprobante de pago!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
