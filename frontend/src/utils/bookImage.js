// Central helper for book photos uploaded during selling
// (front image, back image, book PDF).
// The backend stores relative paths like `/uploads/abc.jpg` and serves
// them from the API server, so the frontend must prefix the API base.
// Every place that shows a book photo must use these helpers.

export const API_BASE = (
  import.meta.env.VITE_API_BASE || "http://localhost:5000"
).replace(/\/$/, "");

// Convert a stored image path to a loadable URL.
// Passes through absolute / data / blob URLs untouched.
export function bookImageUrl(imageUrl) {
  if (!imageUrl) return null;

  const url = String(imageUrl).trim();
  if (!url) return null;

  if (/^(https?:|data:|blob:)/i.test(url)) return url;

  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

// Front photo of a book listing.
// Prefers `image_url` (first/front image from the API),
// falls back to the first entry of an `images` array.
export function frontImage(product) {
  if (!product) return null;

  if (product.image_url) {
    return bookImageUrl(product.image_url);
  }

  const first = product.images?.[0]?.image_url;
  return first ? bookImageUrl(first) : null;
}
