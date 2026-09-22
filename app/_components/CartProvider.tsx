"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { addToCart, readCart, setLineQuantity } from "../_lib/cart-actions";
import type { Cart } from "../_lib/cart";

type CartContextValue = {
  cart: Cart | null;
  /** False when the store has no credentials — the header hides its trigger. */
  shopEnabled: boolean;
  isPending: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Resolves to an error message, or null when the line was added. */
  add: (variantId: string, quantity?: number) => Promise<string | null>;
  setQuantity: (lineId: string, quantity: number) => Promise<string | null>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}

type CartProviderProps = {
  shopEnabled: boolean;
  children: React.ReactNode;
};

function CartProvider({ shopEnabled, children }: CartProviderProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  /* A returning visitor still holds the cookie, so the badge has to reflect
     their existing cart. The page itself is statically cached, which is why
     this runs on the client rather than as part of the server render. */
  useEffect(() => {
    if (!shopEnabled) {
      return;
    }

    let active = true;

    readCart()
      .then((existing) => {
        if (active && existing) {
          setCart(existing);
        }
      })
      .catch(() => {
        // A failed restore is not worth surfacing — the visitor can re-add.
      });

    return () => {
      active = false;
    };
  }, [shopEnabled]);

  const run = useCallback(
    (action: () => Promise<{ cart: Cart } | { error: string }>) =>
      new Promise<string | null>((resolve) => {
        startTransition(async () => {
          const result = await action();

          if ("cart" in result) {
            setCart(result.cart);
            resolve(null);
            return;
          }

          resolve(result.error);
        });
      }),
    [],
  );

  const add = useCallback(
    (variantId: string, quantity = 1) =>
      run(() => addToCart(variantId, quantity)),
    [run],
  );

  const setQuantity = useCallback(
    (lineId: string, quantity: number) =>
      run(() => setLineQuantity(lineId, quantity)),
    [run],
  );

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      cart,
      shopEnabled,
      isPending,
      isOpen,
      openCart,
      closeCart,
      add,
      setQuantity,
    }),
    [
      cart,
      shopEnabled,
      isPending,
      isOpen,
      openCart,
      closeCart,
      add,
      setQuantity,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartProvider;
