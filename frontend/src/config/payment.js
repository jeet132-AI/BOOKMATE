// Marketplace UPI receiving account shown on checkout QR codes.
// Replace with the real merchant VPA before accepting live payments.
export const UPI_VPA = "usedbookmarket@upi";
export const UPI_MERCHANT_NAME = "Used Book Market";

// Supported UPI apps shown on the checkout Payments step.
export const UPI_APPS = [
  { value: "Google Pay", icon: "G" },
  { value: "PhonePe", icon: "Pe" },
  { value: "Paytm", icon: "paytm" },
  { value: "BHIM UPI", icon: "BHIM" },
];

// A UPI transaction / UTR number is 12 digits.
export function isValidUtr(value) {
  return /^\d{12}$/.test(String(value || "").trim());
}

// Standard UPI intent string encoded into the QR code.
// Any UPI app (GPay, PhonePe, Paytm, BHIM) can scan and pay it.
export function buildUpiIntent({ amount, transactionNote }) {
  const params = new URLSearchParams({
    pa: UPI_VPA,
    pn: UPI_MERCHANT_NAME,
    am: Number(amount).toFixed(2),
    cu: "INR",
    tn: transactionNote || "Book purchase",
  });
  return `upi://pay?${params.toString()}`;
}
