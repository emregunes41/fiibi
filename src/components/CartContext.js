"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  // item shape: { pkg, category, month, year, price, addons: [], details: { date, time, timeLabel, notes, customFieldAnswers: [] } }
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState(false); // false = cart view, true = checkout view
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("pinowed_cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem("pinowed_cart", JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const addItem = useCallback((pkg, category, month, year, priceOverride, addons = [], details = {}) => {
    setItems((prev) => {
      // Remove existing item with same package ID (replace with updated details)
      const filtered = prev.filter((i) => i.pkg.id !== pkg.id);
      return [...filtered, { pkg, category, month, year, price: priceOverride ?? null, addons, details }];
    });
  }, []);

  const removeItem = useCallback((pkgId) => {
    setItems((prev) => prev.filter((i) => i.pkg.id !== pkgId));
  }, []);

  const toggleAddon = useCallback((pkgId, addon) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.pkg.id !== pkgId) return item;
        const has = item.addons.find((a) => a.title === addon.title);
        return {
          ...item,
          addons: has
            ? item.addons.filter((a) => a.title !== addon.title)
            : [...item.addons, addon],
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
      const pkgPrice = item.price ?? (parseInt(item.pkg.price?.replace(/\D/g, "")) || 0);
      const addonPrice = item.addons.reduce((s, a) => s + (parseInt(a.price) || 0), 0);
      return sum + pkgPrice + addonPrice;
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
