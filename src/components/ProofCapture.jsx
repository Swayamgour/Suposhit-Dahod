import React, { useState } from "react";
import { MapPin, Camera, Loader2, CheckCircle2, X } from "lucide-react";
import { uploadPhotos, captureLocation } from "../utils/apiClient.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

// Reusable GPS check-in + photo proof capture, matching the shared
// `submissionFields` every field-staff model (Record, MukhyaSevikaEntry,
// TaskSubmission) embeds on the backend (icds-backend/models/shared/
// submissionFields.js): checkInLatitude/Longitude/Time + photos[] (each with
// its own lat/lng/capturedAt, geo-tagged at upload time).
//
// Usage: <ProofCapture value={proof} onChange={setProof} />
// `value` / `onChange` shape:
//   { checkInLatitude, checkInLongitude, checkInTime, photos: [{url, latitude, longitude, capturedAt}] }
export default function ProofCapture({ value, onChange }) {
  const { t } = useLanguage();
  const [locating, setLocating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const proof = value || { photos: [] };
  const hasLocation = proof.checkInLatitude != null && proof.checkInLongitude != null;

  async function handleCheckIn() {
    setError("");
    setLocating(true);
    try {
      const { latitude, longitude } = await captureLocation();
      onChange({
        ...proof,
        checkInLatitude: latitude,
        checkInLongitude: longitude,
        checkInTime: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  }

  async function handleFiles(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const uploaded = await uploadPhotos(files);
      const newPhotos = uploaded.map((f) => ({
        url: f.url,
        latitude: proof.checkInLatitude,
        longitude: proof.checkInLongitude,
        capturedAt: new Date().toISOString(),
      }));
      onChange({ ...proof, photos: [...(proof.photos || []), ...newPhotos] });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removePhoto(idx) {
    const next = [...(proof.photos || [])];
    next.splice(idx, 1);
    onChange({ ...proof, photos: next });
  }

  return (
    <div className="rounded-xl border border-line p-5 space-y-4">
      <p className="text-sm font-bold uppercase tracking-wider text-muted">{t("proofCapture.title")}</p>

      {error && (
        <div className="rounded-lg border border-coral/30 bg-coral-light px-3 py-2 text-xs font-semibold text-coral">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={locating}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-soft disabled:opacity-70 ${
            hasLocation ? "border border-primary/40 bg-primary-light text-primary-dark" : "border border-line bg-surface text-ink hover:bg-bg"
          }`}
        >
          {locating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : hasLocation ? (
            <CheckCircle2 size={16} />
          ) : (
            <MapPin size={16} />
          )}
          {locating ? t("proofCapture.gettingLocation") : hasLocation ? t("proofCapture.locationCaptured") : t("proofCapture.captureLocation")}
        </button>

        {hasLocation && (
          <span className="font-mono text-xs text-muted">
            {proof.checkInLatitude.toFixed(5)}, {proof.checkInLongitude.toFixed(5)}
          </span>
        )}

        <label
          className={`flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg ${
            uploading ? "opacity-70" : ""
          }`}
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          {uploading ? t("proofCapture.uploading") : t("proofCapture.addPhoto")}
          <input type="file" accept="image/*" multiple onChange={handleFiles} disabled={uploading} className="hidden" />
        </label>
      </div>

      {proof.photos?.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {proof.photos.map((p, idx) => (
            <div key={idx} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-line">
              <img src={p.url} alt={`Proof ${idx + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute right-1 top-1 rounded-full bg-ink/70 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                title={t("proofCapture.remove")}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
