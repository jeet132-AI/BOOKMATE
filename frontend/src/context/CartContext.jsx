import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const CART_STORAGE_KEY = "cart";
const CART_EVENT = "cart-change";

// True when the logged-in user is the seller of the book.
// Guests (or unreadable sessions) never own a book.
export function isOwnBook(sellerId) {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );
    return (
      user?.id != null &&
      sellerId != null &&
      Number(user.id) === Number(sellerId)
    );
  } catch {
    return false;
  }
}

function readStoredCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.map(Number).filter((id) => Number.isInteger(id))
      : [];
  } catch {
    return [];
  }
}

function writeStoredCart(ids) {
  try {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(ids)
    );
  } catch {
    // storage unavailable — cart still works for this session
  }
  window.dispatchEvent(new Event(CART_EVENT));
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(null);

  useEffect(() => {
    const sync = () => setItems(readStoredCart());
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const showNotice = useCallback((text) => {
    setNotice(text);

    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
    }

    noticeTimer.current = setTimeout(() => {
      setNotice("");
      noticeTimer.current = null;
    }, 3500);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
    },
    []
  );

  const addToCart = useCallback(
    (productId, sellerId) => {
      const id = Number(productId);
      if (!Number.isInteger(id)) return false;

      // Sellers cannot add their own book to the cart
      if (isOwnBook(sellerId)) {
        showNotice(
          "This is your own book — you cannot add it to your cart."
        );
        return "own";
      }

      const current = readStoredCart();
      if (current.includes(id)) return "exists";

      writeStoredCart([...current, id]);
      setItems([...current, id]);
      return "added";
    },
    [showNotice]
  );

  const removeFromCart = useCallback((productId) => {
    const id = Number(productId);
    const next = readStoredCart().filter(
      (item) => item !== id
    );
    writeStoredCart(next);
    setItems(next);
  }, []);

  const clearCart = useCallback(() => {
    writeStoredCart([]);
    setItems([]);
  }, []);

  const isInCart = useCallback(
    (productId) =>
      items.includes(Number(productId)),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      addToCart,
      removeFromCart,
      clearCart,
      isInCart,
      notice,
      showNotice,
      clearNotice: () => setNotice(""),
    }),
    [
      items,
      addToCart,
      removeFromCart,
      clearCart,
      isInCart,
      notice,
      showNotice,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartContext);

  if (!cart) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return cart;
}
