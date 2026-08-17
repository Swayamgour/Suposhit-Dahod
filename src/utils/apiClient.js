// Small helpers for the two kinds of requests RTK Query's fetchBaseQuery
// (src/redux/api.jsx) can't cleanly do:
//   1. multipart/form-data photo upload (POST /api/upload) - fetchBaseQuery's
//      prepareHeaders always forces Content-Type: application/json, which
//      breaks the multipart boundary the browser needs to set itself.
//   2. binary file downloads (GET /api/reports/records/excel|pdf) - these
//      return a file stream, not JSON, so we fetch as a Blob and trigger a
//      normal browser download instead of routing it through the store.

import { handleSessionExpired } from "../redux/api.jsx";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

// Uploads one or more File objects to POST /api/upload (field name "photos",
// matches icds-backend/middleware/upload.js + controllers/uploadController.js).
// Resolves to the array of { url, originalName, size } the API returns.
export async function uploadPhotos(files) {
  const form = new FormData();
  Array.from(files).forEach((file) => form.append("photos", file));

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: { authorization: `Bearer ${getToken()}` },
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    handleSessionExpired();
    return [];
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Photo upload failed.");
  }
  return data.files;
}

// Reads the browser's current GPS position once. Wrapped in a promise so
// callers can `await captureLocation()` from a click handler.
export function captureLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location services are not available on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(err.message || "Could not get your location.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}

// Downloads a report file (Excel/PDF) from a GET /api/reports/... endpoint
// that streams binary content, and saves it via the browser's normal
// download flow. `query` is an already-built query string (no leading "?").
export async function downloadReport(path, filename, query = "") {
  const url = `${BASE_URL}${path}${query ? `?${query}` : ""}`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${getToken()}` },
  });

  if (res.status === 401) {
    handleSessionExpired();
    return;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Could not generate the report.");
  }

  const blob = await res.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(objectUrl);
}