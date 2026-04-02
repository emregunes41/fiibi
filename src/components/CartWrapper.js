"use client";

import { CartProvider } from "./CartContext";
import CartDrawer from "./CartDrawer";

export default function CartWrapper({ children }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
