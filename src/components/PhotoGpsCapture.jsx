import React, { useState } from "react";
import { MapPin, Camera, Loader2, X, CheckCircle2 } from "lucide-react";
import { useUploadPhotosMutation } from "../redux/api.jsx";

// Captures the browser's GPS position once (used as the submission's
// check-in location) and lets the user attach one or more photos, each
// uploaded via POST /api/upload and geo-tagged with the same GPS reading.
// Parent receives: onLocationChange({ latitude, longitude }), onPhotosChange([{url, latitude, longitude}])
export default function PhotoGpsCapture({ onLocationChange, onPhotosChange, photos = [] }) {
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [uploadPhotos, { isLoading: uploading }] = useUploadPhotosMutation();

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocError("GPS is not available on this device/browser");
      return;
    }
    setLocLoading(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setLocation(loc);
        onLocationChange?.(loc);
        setLocLoading(false);
      },
      (err) => {
        setLocError(err.message || "Could not get GPS location");
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const res = await uploadPhotos(files);
    if (res.data?.files) {
      const newPhotos = res.data.files.map((f) => ({
        url: f.url,
        latitude: location?.latitude,
        longitude: location?.longitude,
      }));
      onPhotosChange?.([...photos, ...newPhotos]);
    }
    e.target.value = "";
  };

  const removePhoto = (idx) => {
    onPhotosChange?.(photos.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3 rounded-xl border border-line bg-surface/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">GPS Check-in</p>
        <button
          type="button"
          onClick={captureLocation}
          disabled={locLoading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-dark hover:bg-primary/20 disabled:opacity-60"
        >
          {locLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
          {location ? "Recapture location" : "Capture location"}
        </button>
      </div>

      {location && (
        <p className="flex items-center gap-1.5 text-xs text-primary-dark">
          <CheckCircle2 size={13} /> Lat {location.latitude.toFixed(5)}, Lng {location.longitude.toFixed(5)}
        </p>
      )}
      {locError && <p className="text-xs text-coral">{locError}</p>}

      <div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface">
          <Camera size={14} />
          {uploading ? "Uploading..." : "Add photo proof"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={handleFiles}
          />
        </label>
        {!location && <p className="mt-1 text-[11px] text-muted">Tip: capture location first so photos get geo-tagged</p>}
      </div>

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((p, idx) => (
            <div key={idx} className="relative h-16 w-16 overflow-hidden rounded-lg border border-line">
              <img src={p.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
