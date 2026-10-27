import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Loader2, Trash2, MapPin, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { useUploadPhotosMutation } from "../../redux/api.jsx";
import { captureLocation } from "../../utils/apiClient.js";
import { MONTHS, getIn } from "./supervisorVisitConfig.js";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-bg disabled:opacity-80";

const numVal = (raw) => {
  if (raw === "" || raw == null) return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
};

// ---------------------------------------------------------------- small inputs

function YesNo({ value, onChange, readOnly }) {
  const { t } = useLanguage();
  const btn = (v, label, on) => (
    <button
      type="button"
      disabled={readOnly}
      onClick={() => onChange(v)}
      className={`rounded-full border px-5 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
        value === v ? on : "border-line bg-surface text-ink hover:bg-bg"
      } ${readOnly && value !== v ? "opacity-50" : ""}`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex gap-3">
      {btn(true, t("common.yes"), "border-primary bg-primary text-white")}
      {btn(false, t("common.no"), "border-coral bg-coral text-white")}
    </div>
  );
}

function MonthYear({ value, onChange, readOnly }) {
  const { t } = useLanguage();
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => thisYear - 5 + i);
  const cur = value || {};
  return (
    <div className="grid grid-cols-2 gap-3">
      <select
        disabled={readOnly}
        value={cur.month ?? ""}
        onChange={(e) => onChange({ ...cur, month: numVal(e.target.value) })}
        className={inputClass}
      >
        <option value="">{t("sv.month")}</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select
        disabled={readOnly}
        value={cur.year ?? ""}
        onChange={(e) => onChange({ ...cur, year: numVal(e.target.value) })}
        className={inputClass}
      >
        <option value="">{t("sv.year")}</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberInput({ value, onChange, readOnly, invalid }) {
  return (
    <input
      type="number"
      min="0"
      step="any"
      disabled={readOnly}
      value={value ?? ""}
      onChange={(e) => onChange(numVal(e.target.value))}
      className={`${inputClass} ${invalid ? "border-coral ring-2 ring-coral/20" : ""}`}
    />
  );
}

// Live camera capture (same flow as /workers/new): the browser camera opens in a
// modal, the supervisor presses Capture, the frame is uploaded (POST /api/upload)
// and stamped with GPS. Value shape matches photoProofSchema:
// { url, publicId, latitude, longitude, capturedAt }
function CameraModal({ onClose, onCaptured }) {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [loc, setLoc] = useState(null);
  const [uploadPhotos] = useUploadPhotosMutation();

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    captureLocation().then((l) => !cancelled && setLoc(l)).catch(() => {}); // GPS is best-effort
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error(t("photoGps.errCameraUnsupported"));
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play();
        }
        setReady(true);
      } catch (ex) {
        const map = {
          NotAllowedError: "photoGps.errPermissionDenied",
          NotFoundError: "photoGps.errNoCameraFound",
          NotReadableError: "photoGps.errCameraInUse",
          SecurityError: "photoGps.errCameraBlocked",
        };
        setErr(map[ex?.name] ? t(map[ex.name]) : ex?.message || t("photoGps.errUnableOpenCamera"));
      }
    })();
    return () => {
      cancelled = true;
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function capture() {
    const video = videoRef.current;
    if (!video || busy) return;
    if (!video.videoWidth || !video.videoHeight) {
      setErr(t("photoGps.errCameraNotReady"));
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const scale = Math.min(1, 1280 / video.videoWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.82));
      if (!blob) throw new Error(t("photoGps.errCreateImage"));
      const file = new File([blob], `visit-${Date.now()}.jpg`, { type: "image/jpeg" });
      const res = await uploadPhotos([file]).unwrap();
      const f = res?.files?.[0];
      if (!f?.url) throw new Error(t("sv.photoError"));
      stopStream();
      onCaptured({
        url: f.url,
        publicId: f.publicId,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        capturedAt: new Date().toISOString(),
      });
    } catch (ex) {
      setErr(ex?.data?.message || ex?.message || t("sv.photoError"));
      setBusy(false);
    }
  }

  // Rendered in a portal on <body>: a transformed/animated ancestor (page
  // transitions, scroll containers) would otherwise make `fixed` follow the
  // form and push the camera up/down instead of keeping it centred.
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black/80 p-3 sm:p-5">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-primary" />
            <p className="text-sm font-bold text-ink">{t("photoGps.cameraActiveDesc")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            title={t("photoGps.closeCamera")}
            className="rounded-lg p-2 text-muted hover:bg-bg disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black p-2 sm:p-4">
          <video ref={videoRef} autoPlay muted playsInline className="max-h-[65vh] w-full rounded-xl object-contain" />
          {loc && (
            <div className="absolute bottom-5 left-5 flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-2 text-[11px] font-semibold text-white">
              <MapPin size={13} />
              {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
            </div>
          )}
          {!ready && !err && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="rounded-xl bg-black/75 px-5 py-4 text-center text-white">
                <Loader2 size={28} className="mx-auto animate-spin" />
                <p className="mt-2 text-sm font-semibold">{t("photoGps.openingCamera")}</p>
              </div>
            </div>
          )}
        </div>

        {err && <p className="border-t border-line bg-coral-light px-4 py-3 text-xs font-semibold text-coral">{err}</p>}

        <div className="flex justify-end gap-3 border-t border-line p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bg disabled:opacity-50"
          >
            {t("photoGps.cancel")}
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={!ready || busy}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {busy ? t("photoGps.uploading") : t("photoGps.capture")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PhotoField({ value, onChange, readOnly }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      {value?.url && (
        <div className="overflow-hidden rounded-xl border border-line bg-bg">
          <a href={value.url} target="_blank" rel="noreferrer">
            <img src={value.url} alt="" className="max-h-72 w-full object-cover" />
          </a>
          <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-muted">
            <MapPin size={12} />
            {value.latitude != null
              ? `${Number(value.latitude).toFixed(5)}, ${Number(value.longitude).toFixed(5)}`
              : t("sv.noGps")}
          </div>
        </div>
      )}
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark"
          >
            <Camera size={16} />
            {value?.url ? t("sv.photoRetake") : t("sv.photoTake")}
          </button>
          {value?.url && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-coral hover:bg-coral-light"
            >
              <Trash2 size={14} />
              {t("sv.photoRemove")}
            </button>
          )}
        </div>
      )}
      {readOnly && !value?.url && <p className="text-sm text-muted">-</p>}
      {open && (
        <CameraModal
          onClose={() => setOpen(false)}
          onCaptured={(photo) => {
            onChange(photo);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------- stock helpers
const getRow = (arr, key) => (arr || []).find((r) => r.item === key) || {};
const setRow = (arr, key, field, val) => {
  const list = [...(arr || [])];
  const i = list.findIndex((r) => r.item === key);
  const row = { ...(i >= 0 ? list[i] : { item: key }), [field]: val };
  if (i >= 0) list[i] = row;
  else list.push(row);
  return list;
};

// ------------------------------------------------------------------ renderer
// values   = the section object (e.g. visit.sectionA being edited)
// onChange = (path, value) => void
// missing  = Set of required paths still empty (after a failed "complete")
export default function FormItem({ item, values, onChange, readOnly, missing }) {
  const { t, lang } = useLanguage();
  const pick = (l) => (typeof l === "string" ? l : l?.[lang] || l?.en || "");
  const bad = (p) => missing?.has(p);

  if (item.showIf && !item.showIf(values)) return null;

  const star = item.required ? <span className="text-coral"> *</span> : null;
  const card = (invalid) =>
    `rounded-xl border bg-bg/60 p-4 ${invalid ? "border-coral ring-2 ring-coral/20" : "border-line"}`;
  const Label = ({ children }) => <p className="mb-2.5 text-sm font-semibold leading-snug text-ink">{children}</p>;

  switch (item.type) {
    case "heading":
      return (
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-soft">
          <span className="h-6 w-1.5 rounded-full bg-accent" />
          <h3 className="font-display text-base font-extrabold text-ink">{pick(item.label)}</h3>
        </div>
      );

    case "info":
      return (
        <p className="rounded-lg border border-dashed border-accent/50 bg-accent-light/40 px-3 py-2 text-sm font-semibold text-ink">
          {pick(item.label)}
        </p>
      );

    case "yesno":
      return (
        <div className={card(bad(item.path))}>
          <Label>
            {pick(item.label)}
            {star}
          </Label>
          <YesNo value={getIn(values, item.path)} onChange={(v) => onChange(item.path, v)} readOnly={readOnly} />
        </div>
      );

    case "number":
    case "text":
    case "date":
    case "time":
    case "textarea": {
      const v = getIn(values, item.path);
      return (
        <div className={card(bad(item.path))}>
          <Label>
            {pick(item.label)}
            {star}
          </Label>
          {item.type === "number" ? (
            <NumberInput value={v} onChange={(x) => onChange(item.path, x)} readOnly={readOnly} />
          ) : item.type === "textarea" ? (
            <textarea
              rows={3}
              disabled={readOnly}
              value={v ?? ""}
              onChange={(e) => onChange(item.path, e.target.value)}
              placeholder={t("sv.remarksPlaceholder")}
              className={inputClass}
            />
          ) : (
            <input
              type={item.type}
              disabled={readOnly}
              value={v ?? ""}
              onChange={(e) => onChange(item.path, e.target.value)}
              className={inputClass}
            />
          )}
        </div>
      );
    }

    case "monthYear":
      return (
        <div className={card(bad(`${item.path}.month`) || bad(`${item.path}.year`))}>
          <Label>
            {pick(item.label)}
            {star}
          </Label>
          <MonthYear value={getIn(values, item.path)} onChange={(v) => onChange(item.path, v)} readOnly={readOnly} />
        </div>
      );

    case "select": {
      const v = getIn(values, item.path);
      return (
        <div className={card(bad(item.path))}>
          <Label>
            {pick(item.label)}
            {star}
          </Label>
          <select
            disabled={readOnly}
            value={v ?? ""}
            onChange={(e) => onChange(item.path, e.target.value || undefined)}
            className={inputClass}
          >
            <option value="">{t("sv.select")}</option>
            {item.options.map((o) => (
              <option key={o.value} value={o.value}>
                {pick(o.label)}
              </option>
            ))}
          </select>
        </div>
      );
    }

    case "radio": {
      const v = getIn(values, item.path);
      return (
        <div className={card(bad(item.path))}>
          <Label>
            {pick(item.label)}
            {star}
          </Label>
          <div className="space-y-2">
            {item.options.map((o) => (
              <label
                key={o.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                  v === o.value ? "border-primary bg-primary-light font-semibold text-primary-dark" : "border-line bg-surface text-ink"
                } ${readOnly ? "cursor-not-allowed opacity-80" : ""}`}
              >
                <input
                  type="radio"
                  disabled={readOnly}
                  checked={v === o.value}
                  onChange={() => onChange(item.path, o.value)}
                  className="accent-primary"
                />
                {pick(o.label)}
              </label>
            ))}
          </div>
        </div>
      );
    }

    case "multicheck": {
      const v = getIn(values, item.path) || [];
      const toggle = (val) =>
        onChange(item.path, v.includes(val) ? v.filter((x) => x !== val) : [...v, val]);
      return (
        <div className={card(bad(item.path))}>
          <Label>
            {pick(item.label)}
            {star}
          </Label>
          <div className="space-y-2">
            {item.options.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-center gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={v.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  className="h-4 w-4 accent-primary"
                />
                {pick(o.label)}
              </label>
            ))}
          </div>
        </div>
      );
    }

    case "photo":
      return (
        <div className={card(false)}>
          <Label>{pick(item.label)}</Label>
          <PhotoField value={getIn(values, item.path)} onChange={(v) => onChange(item.path, v)} readOnly={readOnly} />
        </div>
      );

    case "pair":
      return (
        <div className={card(item.fields.some((f) => bad(f.path)))}>
          <Label>{pick(item.label)}</Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {item.fields.map((f) => (
              <div key={f.path}>
                <label className="mb-1.5 block text-xs font-semibold text-muted">
                  {pick(f.label)}
                  {f.required && <span className="text-coral"> *</span>}
                </label>
                <NumberInput
                  value={getIn(values, f.path)}
                  onChange={(x) => onChange(f.path, x)}
                  readOnly={readOnly}
                  invalid={bad(f.path)}
                />
              </div>
            ))}
          </div>
        </div>
      );

    case "group":
      return (
        <div className="space-y-3 rounded-xl border border-dashed border-accent/60 bg-accent-light/20 p-4">
          <p className="text-sm font-semibold leading-snug text-ink">{pick(item.label)}</p>
          {item.children.map((c, i) => (
            <FormItem key={c.path || i} item={c} values={values} onChange={onChange} readOnly={readOnly} missing={missing} />
          ))}
        </div>
      );

    case "stock":
    case "stockArray": {
      const isArray = item.type === "stockArray";
      return (
        <div className="space-y-3">
          <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-semibold leading-snug text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
            {pick(item.label)}
          </p>
          {item.blocks.map((b) => (
            <div key={b.key} className="rounded-xl border border-line bg-bg/60 p-4">
              <p className="mb-3 text-sm font-bold text-ink">{pick(b.label)}</p>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {item.fields.map((f) => {
                  const cur = isArray ? getRow(getIn(values, item.path), b.key)[f.key] : getIn(values, `${item.path}.${b.key}.${f.key}`);
                  const change = (x) =>
                    isArray
                      ? onChange(item.path, setRow(getIn(values, item.path), b.key, f.key, x))
                      : onChange(`${item.path}.${b.key}.${f.key}`, x);
                  return (
                    <div key={f.key}>
                      <label className="mb-1.5 block text-xs font-semibold text-muted">
                        {pick(f.label)} {isArray && f.key === "found" ? pick(item.foundSuffix) : ""}
                      </label>
                      <NumberInput value={cur} onChange={change} readOnly={readOnly} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
