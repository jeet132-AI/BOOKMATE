import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  UPI_APPS,
  UPI_MERCHANT_NAME,
  UPI_VPA,
  buildUpiIntent,
  isValidUtr,
} from "../config/payment";
import { frontImage } from "../utils/bookImage";
import { useCart } from "../context/CartContext";
import "./Checkout.css";

const PAYMENT_METHODS = [
  {
    value: "UPI",
    icon: "📱",
    title: "UPI",
    desc: "Scan a QR and pay with any UPI app",
  },
  {
    value: "Card",
    icon: "💳",
    title: "Card",
    desc: "Pay using debit or credit card",
  },
  {
    value: "Net Banking",
    icon: "🏦",
    title: "Net Banking",
    desc: "Pay through your bank account",
  },
  {
    value: "Wallet",
    icon: "👛",
    title: "Wallet",
    desc: "Pay using a mobile wallet",
  },
  {
    value: "Cash on Delivery",
    icon: "💵",
    title: "Cash on Delivery",
    desc: "Pay in cash when the book arrives",
  },
];

const NET_BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank",
  "Bank of Baroda",
];

const WALLET_APPS = [
  "Paytm Wallet",
  "PhonePe Wallet",
  "Amazon Pay",
  "Mobikwik",
];

function makeGatewayReference() {
  const raw =
    "GTW" +
    Date.now().toString(36) +
    Math.floor(Math.random() * 1296).toString(36);
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
}

const INITIAL_FORM = {
  fullName: "",
  phone: "",
  pincode: "",
  locality: "",
  address: "",
  city: "",
  state: "",
  landmark: "",
};

function Checkout() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { removeFromCart } = useCart();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] =
    useState("UPI");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [placedAddress, setPlacedAddress] = useState(null);
  const [placedPayment, setPlacedPayment] = useState(null);

  // Product being purchased (for price + QR amount)
  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState("");

  // UPI payment state
  const [upiApp, setUpiApp] = useState("Google Pay");
  const [upiIntent, setUpiIntent] = useState("");
  const [showUtrForm, setShowUtrForm] = useState(false);
  const [utr, setUtr] = useState("");
  const [utrError, setUtrError] = useState("");
  const [upiVerified, setUpiVerified] = useState(false);

  // Payment gateway state (Card / Net Banking / Wallet)
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [gatewayStage, setGatewayStage] = useState("form");
  const [gatewayRef, setGatewayRef] = useState("");
  const [gatewayPaid, setGatewayPaid] = useState(null);
  const [gatewayError, setGatewayError] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [netBank, setNetBank] = useState(NET_BANKS[0]);
  const [walletApp, setWalletApp] = useState(WALLET_APPS[0]);

  useEffect(() => {
    if (!productId) {
      setProductLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setProductLoading(true);
        setProductError("");

        const response = await fetch(
          `http://localhost:5000/api/products/${productId}`
        );
        const data = await response.json();

        if (!response.ok) {
          setProductError(
            data.message || "This book is no longer available."
          );
          return;
        }

        setProduct(data.product || null);
      } catch (error) {
        console.error("Checkout product error:", error);
        setProductError("Unable to load book details.");
      } finally {
        setProductLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const buyerAmount = product ? Number(product.buyer_price) : null;

  const bookPrice =
    product !== null &&
    product !== undefined &&
    product.seller_price !== undefined
      ? Number(product.seller_price) +
        Number(product.platform_fee || 0)
      : null;

  const deliveryCharge =
    product !== null &&
    product !== undefined &&
    product.delivery_charge !== undefined &&
    product.delivery_charge !== null
      ? Number(product.delivery_charge)
      : 0;

  const isGatewayMethod = (method) =>
    ["Card", "Net Banking", "Wallet"].includes(method);

  // COD needs no online verification — pay cash on delivery.
  const isCod =
    paymentMethod === "Cash on Delivery";

  const gatewayVerified =
    gatewayPaid !== null &&
    gatewayPaid.method === paymentMethod;

  const paymentReady =
    isCod || upiVerified || gatewayVerified;

  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value);
    setGatewayPaid(null);
    setGatewayError("");
    setMessage("");
  };

  const handleGatewayPay = () => {
    setGatewayError("");

    if (paymentMethod === "Card") {
      const digits = cardNumber.replace(/\D/g, "");
      if (digits.length !== 16) {
        setGatewayError("Enter a valid 16-digit card number.");
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.trim())) {
        setGatewayError("Enter card expiry as MM/YY.");
        return;
      }
      if (!/^\d{3}$/.test(cardCvv.trim())) {
        setGatewayError("Enter the 3-digit CVV.");
        return;
      }
    }

    setGatewayStage("processing");

    setTimeout(() => {
      setGatewayRef(makeGatewayReference());
      setGatewayStage("success");
    }, 2000);
  };

  const handleGatewayDone = () => {
    setGatewayPaid({
      method: paymentMethod,
      reference: gatewayRef,
    });
    setGatewayOpen(false);
    setGatewayStage("form");
    setMessage(
      `${paymentMethod} payment successful. You can now place your order.`
    );
  };

  const openGateway = () => {
    setGatewayError("");
    setGatewayStage("form");
    setGatewayOpen(true);
  };

  const handleGenerateQr = () => {
    if (buyerAmount === null || Number.isNaN(buyerAmount)) {
      setMessage("Book price is still loading. Please wait.");
      return;
    }

    setUpiIntent(
      buildUpiIntent({
        amount: buyerAmount,
        transactionNote: `Book order product ${productId}`,
      })
    );
    setShowUtrForm(false);
    setUpiVerified(false);
    setMessage("");
  };

  const handleConfirmUpiPayment = () => {
    if (!isValidUtr(utr)) {
      setUtrError("Enter the 12-digit UTR / UPI transaction ID from your payment app.");
      return;
    }

    setUtrError("");
    setUpiVerified(true);
    setShowUtrForm(false);
    setMessage("UPI payment verified. You can now place your order.");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.fullName.trim() || form.fullName.trim().length < 3) {
      nextErrors.fullName = "Full name is required (min 3 letters).";
    }

    const phoneDigits = form.phone.replace(/\D/g, "").slice(-10);
    if (!form.phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    } else if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      nextErrors.phone = "Enter a valid 10-digit mobile number.";
    }

    if (!form.pincode.trim()) {
      nextErrors.pincode = "Pincode is required.";
    } else if (!/^\d{6}$/.test(form.pincode.trim())) {
      nextErrors.pincode = "Enter a valid 6-digit pincode.";
    }

    if (!form.locality.trim()) {
      nextErrors.locality = "Locality is required.";
    }

    if (!form.address.trim() || form.address.trim().length < 10) {
      nextErrors.address = "Full address is required (min 10 characters).";
    }

    if (!form.city.trim()) {
      nextErrors.city = "City is required.";
    }

    if (!form.state.trim()) {
      nextErrors.state = "State is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildDeliveryAddress = () => {
    const parts = [
      form.fullName.trim(),
      form.address.trim(),
      form.locality.trim(),
      `${form.city.trim()}, ${form.state.trim()} - ${form.pincode.trim()}`,
      `Phone: ${form.phone.trim()}`,
    ];
    if (form.landmark.trim()) {
      parts.push(`Landmark: ${form.landmark.trim()}`);
    }
    return parts.join(", ");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!productId) {
      setMessage("No product selected for checkout.");
      return;
    }

    if (!validateForm()) {
      setMessage("Please fill all required delivery details correctly.");
      return;
    }

    if (productError || !product) {
      setMessage(productError || "Book details are still loading.");
      return;
    }

    // Every online method needs a verified payment before placing.
    // COD orders are created unpaid — cash is collected on delivery.
    if (paymentMethod === "UPI" && !upiVerified) {
      setMessage(
        "Please pay using the UPI QR code and confirm your payment first."
      );
      return;
    }

    if (
      isGatewayMethod(paymentMethod) &&
      !gatewayVerified
    ) {
      setMessage(
        `Please complete the ${paymentMethod} payment in the gateway first.`
      );
      return;
    }

    const paidReference = isCod
      ? null
      : paymentMethod === "UPI"
        ? utr.trim()
        : gatewayPaid.reference;

    // User confirms the order like Flipkart before placing
    const confirmed = window.confirm(
      isCod
        ? `Place order? Pay ₹${buyerAmount} in CASH when your book arrives.\n\nDeliver to: ${form.fullName}, ${form.city} - ${form.pincode}`
        : `Place order? ${paymentMethod} payment of ₹${buyerAmount} already verified (Ref ${paidReference}).\n\nDeliver to: ${form.fullName}, ${form.city} - ${form.pincode}`
    );
    if (!confirmed) return;

    try {
      setLoading(true);

      const deliveryAddress = buildDeliveryAddress();

      const response = await fetch(
        "http://localhost:5000/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: Number(productId),
            delivery_address: deliveryAddress,
            payment_method: paymentMethod,
            ...(!isCod &&
            paymentMethod === "UPI"
              ? { upi_transaction_id: utr.trim() }
              : {}),
            ...(!isCod &&
            isGatewayMethod(paymentMethod)
              ? {
                  payment_reference:
                    gatewayPaid.reference,
                }
              : {}),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Unable to place order."
        );
        return;
      }

      setOrder(data.order || null);
      setPlacedPayment(data.payment || null);
      removeFromCart(productId);
      setPlacedAddress({
        ...form,
        fullText: deliveryAddress,
        paymentMethod,
      });
      setMessage(
        isCod
          ? "Order placed successfully. Pay in cash when your book arrives."
          : `${paymentMethod} payment successful. Order placed successfully.`
      );
    } catch (error) {
      console.error("Checkout error:", error);

      setMessage(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==============================
     NO PRODUCT
  ============================== */

  if (!productId) {
    return (
      <main className="checkout-page">
        <div className="checkout-error-card">
          <div className="checkout-error-icon">
            📕
          </div>

          <h1>Checkout</h1>

          <p>
            No book was selected for checkout.
          </p>

          <Link to="/books">
            <button
              type="button"
              className="checkout-primary-button"
            >
              📚 Browse Books
            </button>
          </Link>
        </div>
      </main>
    );
  }

  /* ==============================
     ORDER SUCCESS - YOUR ORDER SECTION
  ============================== */

  if (order) {
    const paidMethod =
      placedAddress?.paymentMethod || paymentMethod;
    const isPlacedCod =
      paidMethod === "Cash on Delivery";
    const paidReference =
      placedPayment?.transaction_id ||
      (!isPlacedCod && paidMethod === "UPI"
        ? utr.trim()
        : !isPlacedCod
          ? gatewayPaid?.reference
          : "") ||
      "";
    return (
      <main className="checkout-page">

        <div className="checkout-success-card">

          <div className="success-animation">
            <div className="success-circle">
              ✓
            </div>
          </div>

          <p className="checkout-label">
            ORDER CREATED
          </p>

          <h1>
            Your Order <span>Confirmed!</span>
          </h1>

          <p className="success-text">
            {isPlacedCod
              ? "Your book order has been placed. Pay in cash when your book arrives — no online payment needed."
              : `${paidMethod} payment successful. Your book order has been placed and the book is reserved for you.`}
          </p>

          <div className="success-divider"></div>

          <div className="order-details-box">

            <div className="order-detail-row">
              <span>Order ID</span>
              <strong>
                #{order.id}
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Seller Price</span>
              <strong>
                ₹{order.seller_price}
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Platform Fee</span>
              <strong className="fee-text">
                ₹{order.platform_fee}
              </strong>
            </div>

            {order.delivery_charge !== undefined &&
              order.delivery_charge !== null && (
                <div className="order-detail-row">
                  <span>Delivery Charge</span>
                  <strong>
                    {Number(order.delivery_charge) > 0
                      ? `₹${order.delivery_charge}`
                      : "FREE"}
                  </strong>
                </div>
              )}

            <div className="order-detail-row total-row">
              <span>Total Amount</span>
              <strong>
                ₹{order.buyer_price}
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Order Status</span>
              <strong className="status-text">
                {order.status}
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Payment Method</span>
              <strong>
                {paidMethod}{" "}
                {isPlacedCod ? "💵" : "📱"}
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Payment Status</span>
              <strong className="status-text">
                {placedPayment?.payment_status ===
                "paid"
                  ? "✅ Paid"
                  : isPlacedCod
                    ? "⏳ Pending — pay cash on delivery"
                    : "Paid"}
              </strong>
            </div>

            {paidReference && (
              <div className="order-detail-row">
                <span>Transaction Ref</span>
                <strong>
                  {paidReference}
                </strong>
              </div>
            )}

            {placedAddress && (
              <>
                <div className="order-detail-row">
                  <span>Deliver To</span>
                  <strong>
                    {placedAddress.fullName}
                  </strong>
                </div>
                <div className="order-detail-row">
                  <span>Phone</span>
                  <strong>
                    {placedAddress.phone}
                  </strong>
                </div>
                <div className="order-detail-row address-row">
                  <span>Address</span>
                  <strong>
                    {placedAddress.fullText}
                  </strong>
                </div>
              </>
            )}

          </div>

          <div className="success-actions">

            <Link to="/orders">
              <button
                type="button"
                className="checkout-primary-button"
              >
                📦 View My Orders
              </button>
            </Link>

            <Link to="/books">
              <button
                type="button"
                className="checkout-secondary-button"
              >
                📚 Continue Shopping
              </button>
            </Link>

          </div>

        </div>

      </main>
    );
  }

  /* ==============================
     CHECKOUT PAGE - FLIPKART STYLE
  ============================== */

  return (
    <main className="checkout-page">

      <div className="checkout-bg-circle checkout-circle-one"></div>
      <div className="checkout-bg-circle checkout-circle-two"></div>

      <div className="checkout-floating-book checkout-book-one">
        📘
      </div>

      <div className="checkout-floating-book checkout-book-two">
        📚
      </div>

      <div className="checkout-floating-book checkout-book-three">
        📖
      </div>

      {/* HEADER */}

      <section className="checkout-header">

        <p className="checkout-label">
          STEP 3 OF 3 • 100% SECURE PAYMENTS
        </p>

        <h1>
          Secure <span>Checkout</span>
        </h1>

        <p>
          Add delivery address, review book
          price + delivery charge, pay with
          UPI, Card, Net Banking, Wallet or
          Cash on Delivery, then place your
          order.
        </p>

        <div className="checkout-header-line"></div>

      </section>

      {/* STEPS */}

      <div className="checkout-steps">

        <div className="checkout-step active">
          <span>1</span>
          <p>Address</p>
        </div>

        <div className="step-line"></div>

        <div className="checkout-step active">
          <span>2</span>
          <p>Payment</p>
        </div>

        <div className="step-line"></div>

        <div
          className={
            paymentReady
              ? "checkout-step active"
              : "checkout-step"
          }
        >
          <span>{paymentReady ? "✓" : "3"}</span>
          <p>Confirmation</p>
        </div>

      </div>

      {/* MAIN */}

      <section className="checkout-container">

        {/* LEFT */}

        <div className="checkout-form-card">

          <div className="card-heading">
            <div className="heading-icon">
              📦
            </div>

            <div>
              <h2>Delivery Details</h2>

              <p>
                All fields with * are required, like Flipkart.
              </p>
            </div>
          </div>

          {message && (
            <div className="checkout-message">
              ⚠️ {message}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            <div className="delivery-grid">
              <div className="field">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
                {errors.fullName && <small className="field-error">{errors.fullName}</small>}
              </div>

              <div className="field">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength="13"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
                {errors.phone && <small className="field-error">{errors.phone}</small>}
              </div>

              <div className="field">
                <label htmlFor="pincode">Pincode *</label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="e.g. 700001"
                  value={form.pincode}
                  onChange={handleChange}
                  required
                />
                {errors.pincode && <small className="field-error">{errors.pincode}</small>}
              </div>

              <div className="field">
                <label htmlFor="locality">Locality *</label>
                <input
                  id="locality"
                  name="locality"
                  type="text"
                  placeholder="Area, street, sector"
                  value={form.locality}
                  onChange={handleChange}
                  required
                />
                {errors.locality && <small className="field-error">{errors.locality}</small>}
              </div>
            </div>

            <label htmlFor="address">
              Full Address (House No, Building, Street) *
            </label>

            <textarea
              id="address"
              name="address"
              rows="4"
              placeholder="Flat / House no, building, street..."
              value={form.address}
              onChange={handleChange}
              required
            />
            {errors.address && <small className="field-error">{errors.address}</small>}

            <div className="delivery-grid">
              <div className="field">
                <label htmlFor="city">City *</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="e.g. Kolkata"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
                {errors.city && <small className="field-error">{errors.city}</small>}
              </div>

              <div className="field">
                <label htmlFor="state">State *</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="e.g. West Bengal"
                  value={form.state}
                  onChange={handleChange}
                  required
                />
                {errors.state && <small className="field-error">{errors.state}</small>}
              </div>
            </div>

            <label htmlFor="landmark">
              Landmark (Optional)
            </label>

            <input
              id="landmark"
              name="landmark"
              type="text"
              placeholder="Near school, temple, shop..."
              value={form.landmark}
              onChange={handleChange}
              className="landmark-input"
            />

            <div className="address-hint">
              📍 Please provide a complete address
              including city and PIN code.
            </div>

            <label>
              Payment Method *
            </label>

            <div className="payment-options">
              {PAYMENT_METHODS.map((option) => (
                <label
                  key={option.value}
                  className={
                    paymentMethod === option.value
                      ? "payment-option selected"
                      : "payment-option"
                  }
                >
                  <input
                    type="radio"
                    name="payment"
                    value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={(e) =>
                      handlePaymentMethodChange(e.target.value)
                    }
                  />

                  <span className="payment-icon">
                    {option.icon}
                  </span>

                  <span>
                    <strong>
                      {option.title}
                    </strong>

                    <small>
                      {option.desc}
                    </small>
                  </span>
                </label>
              ))}
            </div>

            {isGatewayMethod(paymentMethod) && (
              <div className="upi-section">
                <div className="upi-secure">
                  <span>🔒</span>
                  <strong>
                    100% Secure {paymentMethod} Payment
                  </strong>
                </div>

                {buyerAmount !== null && !Number.isNaN(buyerAmount) && (
                  <div className="upi-amount-row">
                    <span>Total Amount</span>
                    <strong>₹{buyerAmount}</strong>
                  </div>
                )}

                {!gatewayVerified ? (
                  <button
                    type="button"
                    className="upi-generate-button"
                    onClick={openGateway}
                    disabled={productLoading || !product}
                  >
                    {productLoading
                      ? "Loading price..."
                      : `Pay ₹${buyerAmount ?? ""} with ${paymentMethod}`}
                  </button>
                ) : (
                  <div className="upi-verified">
                    ✅ {gatewayPaid.method} payment
                    successful
                    <span>
                      Ref: {gatewayPaid.reference}
                    </span>
                  </div>
                )}

                {gatewayVerified && (
                  <button
                    type="button"
                    className="upi-regenerate"
                    onClick={openGateway}
                  >
                    ↻ Pay again
                  </button>
                )}
              </div>
            )}

            {isCod && (
              <div className="upi-section">
                <div className="upi-secure">
                  <span>💵</span>
                  <strong>
                    Cash on Delivery
                  </strong>
                </div>

                {buyerAmount !== null && !Number.isNaN(buyerAmount) && (
                  <div className="upi-amount-row">
                    <span>Pay on delivery</span>
                    <strong>₹{buyerAmount}</strong>
                  </div>
                )}

                <p className="cod-note">
                  No online payment needed. Your
                  order is created right away —
                  keep ₹{buyerAmount ?? ""} in
                  cash ready. Pay the courier
                  when your book arrives, then
                  the order is marked delivered
                  and the seller gets paid.
                </p>
              </div>
            )}

            {paymentMethod === "UPI" && (
              <div className="upi-section">
                <div className="upi-secure">
                  <span>🔒</span>
                  <strong>100% Secure UPI Payment</strong>
                </div>

                {buyerAmount !== null && !Number.isNaN(buyerAmount) && (
                  <div className="upi-amount-row">
                    <span>Total Amount</span>
                    <strong>₹{buyerAmount}</strong>
                  </div>
                )}

                <p className="upi-apps-title">Pay using any UPI app</p>

                <div className="upi-apps">
                  {UPI_APPS.map((app) => (
                    <label
                      key={app.value}
                      className={
                        upiApp === app.value
                          ? "upi-app selected"
                          : "upi-app"
                      }
                    >
                      <input
                        type="radio"
                        name="upiApp"
                        value={app.value}
                        checked={upiApp === app.value}
                        onChange={(e) => setUpiApp(e.target.value)}
                      />
                      <span className="upi-app-icon">{app.icon}</span>
                      <span>{app.value}</span>
                    </label>
                  ))}
                </div>

                {!upiIntent ? (
                  <button
                    type="button"
                    className="upi-generate-button"
                    onClick={handleGenerateQr}
                    disabled={productLoading || !product}
                  >
                    {productLoading
                      ? "Loading price..."
                      : `Generate QR • Pay ₹${buyerAmount ?? ""}`}
                  </button>
                ) : (
                  <div className="upi-qr-card">
                    <p className="upi-qr-title">
                      Scan with {upiApp} to pay ₹{buyerAmount}
                    </p>

                    <div className="upi-qr-box">
                      <QRCodeSVG
                        value={upiIntent}
                        size={200}
                        level="M"
                        includeMargin
                      />
                    </div>

                    <p className="upi-vpa">
                      Paying to: <strong>{UPI_MERCHANT_NAME}</strong>
                      <span>{UPI_VPA}</span>
                    </p>

                    <div className="upi-steps">
                      <span>1️⃣ Scan QR</span>
                      <span>2️⃣ Pay in your UPI app</span>
                      <span>3️⃣ Confirm below</span>
                    </div>

                    {!upiVerified && !showUtrForm && (
                      <button
                        type="button"
                        className="upi-paid-button"
                        onClick={() => setShowUtrForm(true)}
                      >
                        ✅ I Have Paid
                      </button>
                    )}

                    {!upiVerified && showUtrForm && (
                      <div className="upi-utr-form">
                        <label htmlFor="utr">
                          12-digit UTR / UPI Transaction ID *
                        </label>
                        <input
                          id="utr"
                          name="utr"
                          type="text"
                          inputMode="numeric"
                          maxLength="12"
                          placeholder="e.g. 423812984512"
                          value={utr}
                          onChange={(e) => {
                            setUtr(e.target.value.replace(/\D/g, ""));
                            setUtrError("");
                          }}
                        />
                        {utrError && (
                          <small className="field-error">{utrError}</small>
                        )}
                        <button
                          type="button"
                          className="upi-confirm-button"
                          onClick={handleConfirmUpiPayment}
                        >
                          Confirm Payment →
                        </button>
                      </div>
                    )}

                    {upiVerified && (
                      <div className="upi-verified">
                        ✅ Payment successful via {upiApp}
                        <span>UTR: {utr.trim()}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      className="upi-regenerate"
                      onClick={handleGenerateQr}
                    >
                      ↻ Regenerate QR
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="place-order-button"
              disabled={
                loading || !paymentReady
              }
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Placing Order...
                </>
              ) : !paymentReady ? (
                <>
                  🔒 Complete {paymentMethod} Payment
                  First
                </>
              ) : (
                <>
                  🛒 Place Order
                  <span>→</span>
                </>
              )}
            </button>

          </form>

          <Link
            to={`/books/${productId}`}
            className="back-product-link"
          >
            ← Back to Book
          </Link>

        </div>

        {/* RIGHT */}

        <aside className="checkout-summary-card">

          <div className="summary-top">
            <span>📚</span>

            <div>
              <small>ORDER SUMMARY</small>
              <h2>Your Book</h2>
            </div>
          </div>

          <div className="summary-book">

            <div className="summary-book-icon">
              {frontImage(product) ? (
                <img
                  src={frontImage(product)}
                  alt={product?.title || "Book"}
                />
              ) : (
                "📖"
              )}
            </div>

            <div>
              <strong>
                {productLoading
                  ? "Loading..."
                  : product
                    ? product.title
                    : "Selected Book"}
              </strong>

              <p>
                {product && buyerAmount !== null
                  ? `₹${buyerAmount} • Product ID #${productId}`
                  : `Product ID #${productId}`}
              </p>

              {productError && (
                <p className="field-error">{productError}</p>
              )}
            </div>

          </div>

          <div className="summary-divider"></div>

          <div className="summary-info">

            <div>
              <span>Product</span>
              <strong>
                {product ? product.title : `Book #${productId}`}
              </strong>
            </div>

            {bookPrice !== null && (
              <div>
                <span>Book Price</span>
                <strong>₹{bookPrice}</strong>
              </div>
            )}

            <div>
              <span>Delivery Charge</span>
              <strong>
                {deliveryCharge > 0
                  ? `₹${deliveryCharge}`
                  : "FREE"}
              </strong>
            </div>

            {buyerAmount !== null && (
              <div className="summary-total-row">
                <span>Total Amount</span>
                <strong>₹{buyerAmount}</strong>
              </div>
            )}

            <div>
              <span>Deliver To</span>
              <strong>
                {form.fullName || "-"}, {form.city || "-"} {form.pincode || ""}
              </strong>
            </div>

            <div>
              <span>Payment</span>
              <strong>
                {paymentMethod}
              </strong>
            </div>

          </div>

          <div className="secure-box">
            <span>🔒</span>

            <div>
              <strong>Secure Checkout</strong>

              <p>
                Your order goes to My Orders for you and to
                Admin Order Management for processing.
              </p>
            </div>
          </div>

        </aside>

      </section>

      {/* PAYMENT GATEWAY MODAL (Card / Net Banking / Wallet) */}
      {gatewayOpen && (
        <div
          className="gateway-overlay"
          onClick={() => setGatewayOpen(false)}
        >
          <div
            className="gateway-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {gatewayStage === "form" && (
              <>
                <div className="gateway-header">
                  <span>🔒</span>
                  <div>
                    <small>PAYMENT GATEWAY</small>
                    <h2>
                      Pay with {paymentMethod}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="gateway-close"
                    onClick={() =>
                      setGatewayOpen(false)
                    }
                    aria-label="Close gateway"
                  >
                    ✕
                  </button>
                </div>

                <div className="gateway-amount">
                  <span>Amount payable</span>
                  <strong>₹{buyerAmount}</strong>
                </div>

                {paymentMethod === "Card" && (
                  <>
                    <label>
                      Card Number
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="19"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) =>
                          setCardNumber(
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <div className="gateway-row">
                      <label>
                        Expiry (MM/YY)
                        <input
                          type="text"
                          maxLength="5"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) =>
                            setCardExpiry(
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        CVV
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength="3"
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(
                              e.target.value
                            )
                          }
                        />
                      </label>
                    </div>
                  </>
                )}

                {paymentMethod === "Net Banking" && (
                  <label>
                    Select your bank
                    <select
                      value={netBank}
                      onChange={(e) =>
                        setNetBank(
                          e.target.value
                        )
                      }
                    >
                      {NET_BANKS.map((bank) => (
                        <option
                          key={bank}
                          value={bank}
                        >
                          {bank}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {paymentMethod === "Wallet" && (
                  <div className="gateway-wallets">
                    {WALLET_APPS.map((app) => (
                      <label
                        key={app}
                        className={
                          walletApp === app
                            ? "gateway-wallet selected"
                            : "gateway-wallet"
                        }
                      >
                        <input
                          type="radio"
                          name="walletApp"
                          value={app}
                          checked={
                            walletApp === app
                          }
                          onChange={(e) =>
                            setWalletApp(
                              e.target.value
                            )
                          }
                        />
                        <span>{app}</span>
                      </label>
                    ))}
                  </div>
                )}

                {gatewayError && (
                  <p className="gateway-error">
                    ⚠️ {gatewayError}
                  </p>
                )}

                <button
                  type="button"
                  className="gateway-pay-button"
                  onClick={handleGatewayPay}
                >
                  Pay ₹{buyerAmount}
                </button>

                <p className="gateway-note">
                  🔒 256-bit encrypted demo
                  gateway. No real money moves.
                </p>
              </>
            )}

            {gatewayStage === "processing" && (
              <div className="gateway-processing">
                <div className="gateway-spinner"></div>
                <h2>Processing Payment...</h2>
                <p>
                  Do not press back or refresh.
                </p>
              </div>
            )}

            {gatewayStage === "success" && (
              <div className="gateway-success">
                <div className="gateway-success-circle">
                  ✓
                </div>
                <h2>Payment Successful</h2>
                <p>
                  {paymentMethod} payment of ₹
                  {buyerAmount} completed.
                </p>
                <p className="gateway-ref">
                  Ref: {gatewayRef}
                </p>
                <button
                  type="button"
                  className="gateway-pay-button"
                  onClick={handleGatewayDone}
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  );
}

export default Checkout;
