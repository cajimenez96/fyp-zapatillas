'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { FormattedProduct } from '@/components/products';

const WHOLESALE_THRESHOLD = 5;

export interface CartItem {
  productId: string;
  name: string;
  retailPrice: number;
  wholesalePrice: number;
  size: number;
  qty: number;
  image: string;
  maxStock: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalPairs: number;
  isWholesale: boolean;
  subtotal: number;
  addToCart: (product: FormattedProduct, size: number, qty: number) => void;
  removeFromCart: (productId: string, size: number) => void;
  updateQuantity: (productId: string, size: number, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getEffectivePrice: (item: CartItem) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'fp_zapatillas_cart_v2';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error al cargar carrito desde localStorage:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Error al guardar carrito en localStorage:', err);
    }
  }, [items, isLoaded]);

  // Wholesale threshold computation
  const totalPairs = useMemo(
    () => items.reduce((acc, curr) => acc + curr.qty, 0),
    [items]
  );
  const isWholesale = totalPairs >= WHOLESALE_THRESHOLD;

  /** Returns the effective price for an item based on the current wholesale threshold */
  const getEffectivePrice = (item: CartItem): number => {
    return isWholesale ? item.wholesalePrice : item.retailPrice;
  };

  const totalItems = totalPairs;
  const subtotal = useMemo(
    () => items.reduce((acc, curr) => acc + getEffectivePrice(curr) * curr.qty, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, isWholesale]
  );

  const addToCart = (product: FormattedProduct, size: number, qty: number) => {
    const sizeStockObj = product.sizesStock.find((s) => s.size === size);
    const maxStock = sizeStockObj ? sizeStockObj.stock : 0;
    const imageUrl =
      product.images.find((img) => img.isPrincipal)?.url ||
      product.images[0]?.url ||
      '';

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.productId === product._id && item.size === size
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = Math.min(updated[existingIndex].qty + qty, maxStock);
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: newQty,
          maxStock,
        };
        return updated;
      }

      return [
        ...prevItems,
        {
          productId: product._id,
          name: product.name,
          retailPrice: product.retailPrice,
          wholesalePrice: product.wholesalePrice,
          size,
          qty: Math.min(qty, maxStock),
          image: imageUrl,
          maxStock,
        },
      ];
    });

    setIsOpen(true);
  };

  const removeFromCart = (productId: string, size: number) => {
    setItems((prev) =>
      prev.filter((item) => !(item.productId === productId && item.size === size))
    );
  };

  const updateQuantity = (productId: string, size: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, size);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId && item.size === size) {
          const boundedQty = Math.min(qty, item.maxStock);
          return { ...item, qty: boundedQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        totalItems,
        totalPairs,
        isWholesale,
        subtotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
        getEffectivePrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
};
