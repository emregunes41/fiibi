"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { PLATFORM } from "@/lib/constants";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  // item shape: { pkg, category, month, year, price, addons: [], details: { date, time, timeLabel, notes, customFieldAnswers: [] } }
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState(false); // false = cart view, true = checkout view
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PLATFORM.cartStorageKey);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(PLATFORM.cartStorageKey, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const addItem = useCallback((pkgOrProduct, category, month, year, priceOverride, addons = [], details = {}) => {
    setItems((prev) => {
      // Remove existing item with same ID (replace with updated details)
      const filtered = prev.filter((i) => i.pkg.id !== pkgOrProduct.id);
      return [...filtered, { pkg: pkgOrProduct, category, month, year, price: priceOverride ?? null, addons: addons || [], details: details || {} }];
    });
  }, []);

  const removeItem = useCallback((pkgId) => {
    setItems((prev) => prev.filter((i) => i.pkg.id !== pkgId));
  }, []);

  const toggleAddon = useCallback((pkgId, addon) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.pkg.id !== pkgId) return item;
        const currentAddons = item.addons || [];
        const has = currentAddons.find((a) => a.title === addon.title);
        return {
          ...item,
          addons: has
            ? currentAddons.filter((a) => a.title !== addon.title)
            : [...currentAddons, addon],
        };
      })
    );
  }, []);

  const hasItem = useCallback(
    (pkgId) => items.some((i) => i.pkg.id === pkgId),
    [items]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setCheckoutMode(false);
  }, []);

  const cartTotal = useCallback(() => {
    return items.reduce((sum, item) => {
      let rawPrice = item.price !== null ? item.price : item.pkg?.price;
      let numericPrice = 0;
      if (typeof rawPrice === 'number') {
        numericPrice = rawPrice;
      } else if (typeof rawPrice === 'string') {
        numericPrice = parseInt(rawPrice.replace(/\D/g, "")) || 0;
      }
      
      const addonPrice = (item.addons || []).reduce((s, a) => {
        const p = typeof a.price === 'number' ? a.price : parseInt((a.price || "").toString().replace(/\D/g, "")) || 0;
        return s + p;
      }, 0);
      
      return sum + numericPrice + addonPrice;
    }, 0);
  }, [items]);

  const itemCount = items.length;

  const allAddons = useCallback(() => {
    return items.flatMap((i) => i.addons);
  }, [items]);

  const openCheckout = useCallback(() => {
    setCheckoutMode(true);
    setIsOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setCheckoutMode(false);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        setIsOpen,
        checkoutMode,
        setCheckoutMode,
        openCheckout,
        closeCheckout,
        addItem,
        removeItem,
        toggleAddon,
        hasItem,
        clearCart,
        cartTotal,
        allAddons,
        itemCount,
        hydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
