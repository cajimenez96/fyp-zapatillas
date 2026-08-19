"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, Search, Menu, X, Phone } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import navbarLogo from "@/assets/navbar.png";

interface HeaderProps {
  onSearchChange?: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchChange }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const { totalItems, openCart } = useCart();
  const { settings, formatPhoneNumber } = useSettings();

  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (onSearchChange) {
      onSearchChange(value);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      router.replace(`/?${params.toString()}#catalogo`);
    }
  };

  const cleanPhone = settings.storePhone.replace(/[^0-9]/g, '');
  const topBarWhatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(settings.whatsappInquiryMessage)}`;

  const navLinks = [
    { label: "Todos", href: "/#catalogo" },
    { label: "Hombre", href: "/?gender=Hombre#catalogo" },
    { label: "Mujer", href: "/?gender=Mujer#catalogo" },
    { label: "Niño", href: "/?gender=Niño#catalogo" },
    { label: "Unisex", href: "/?gender=Unisex#catalogo" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e5e5e5]">
      {/* 1. Utility Top Bar with dynamic Settings */}
      <div className="bg-[#f5f5f5] text-[#111111] text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center font-medium border-b border-[#e5e5e5]">
        <a
          href={topBarWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5 text-[#007d48]" />
          <span>
            Atención WhatsApp: <strong>{formatPhoneNumber(settings.storePhone)}</strong>
          </span>
        </a>
        <div className="hidden md:flex gap-4 text-[#707072]">
          <span>{settings.shippingInfo || 'Envíos a todo el país en 24hs'}</span>
          <span>•</span>
          <span>Catálogo Directo</span>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Trigger + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          <Link href="/" className="flex items-center group cursor-pointer">
            <Image
              src={navbarLogo}
              alt={settings.storeName || "FP Zapatillas"}
              className="h-12 w-xs mt-4 object-cover group-hover:opacity-80 transition-opacity"
              priority
            />
          </Link>
        </div>

        {/* Center: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#111111]">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-[#707072] transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#111111] hover:after:w-full after:transition-all cursor-pointer"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Search Pill & Cart Icon */}
        <div className="flex items-center gap-3">
          {/* Search Pill */}
          <div className="relative hidden sm:block w-48 md:w-60">
            <input
              type="text"
              placeholder="Buscar modelo..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full bg-[#f5f5f5] text-[#111111] text-xs font-medium placeholder-[#707072] rounded-full py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-[#111111] transition-all cursor-text"
            />
            <Search className="w-4 h-4 text-[#707072] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Cart Button */}
          <button
            onClick={openCart}
            className="relative p-2.5 rounded-full bg-[#111111] text-white hover:bg-black/90 transition-transform active:scale-95 flex items-center justify-center shadow-sm cursor-pointer"
            aria-label="Ver Carrito"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#d30005] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#e5e5e5] px-6 py-4 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Buscar calzado..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full bg-[#f5f5f5] text-[#111111] text-sm font-medium rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#111111]"
            />
            <Search className="w-4 h-4 text-[#707072] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <nav className="flex flex-col space-y-3 font-semibold text-base">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-[#111111] hover:text-[#707072] border-b border-[#f5f5f5] cursor-pointer"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
