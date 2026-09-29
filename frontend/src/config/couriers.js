// Courier list shared by checkout tracking display.
// Keep in sync with the admin panel courier dropdown.
// Later, when a real payment gateway is added, only the
// payment step changes — shipping/tracking stays untouched.

export const COURIERS = [
  "Delhivery",
  "DTDC",
  "Ecom Express",
  "Blue Dart",
  "XpressBees",
  "India Post",
];

// Public tracking-page URL for a courier + tracking number.
// Returns null when the courier has no direct tracking link.
export function buildTrackingUrl(
  courier,
  trackingNumber
) {
  if (!trackingNumber) return null;

  const id = encodeURIComponent(
    String(trackingNumber).trim()
  );

  switch (String(courier || "").trim()) {
    case "Delhivery":
      return `https://www.delhivery.com/track/package/${id}`;
    case "Blue Dart":
      return `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${id}`;
    case "Ecom Express":
      return `https://ecomexpress.in/tracking/?awb_field=${id}`;
    case "XpressBees":
      return `https://www.xpressbees.com/shipment/tracking?awb=${id}`;
    case "DTDC":
      return `https://www.dtdc.in/trace.asp?strCnno=${id}`;
    case "India Post":
      return "https://www.indiapost.gov.in/vas/Pages/IndiaPostHome.aspx";
    default:
      return null;
  }
}
