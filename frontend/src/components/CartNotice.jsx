import { useCart } from "../context/CartContext";

function CartNotice() {
  const { notice, clearNotice } = useCart();

  if (!notice) return null;

  return (
    <div
      className="cart-notice"
      role="status"
    >
      <span>⚠️</span>
      <span>{notice}</span>

      <button
        type="button"
        onClick={clearNotice}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

export default CartNotice;
