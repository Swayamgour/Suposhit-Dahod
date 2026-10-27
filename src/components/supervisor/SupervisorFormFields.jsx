import React, { useRef, useState } from "react";
import { Camera, Loader2, Trash2, MapPin } from "lucide-react";
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

// Camera / file photo -> POST /api/upload (Cloudinary) + GPS stamp.
// Value shape matches photoProofSchema: { url, publicId, latitude, longitude, capturedAt }
function PhotoField({ value, onChange, readOnly }) {
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [uploadPhotos] = useUploadPhotosMutation();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      let loc = null;
      try {
        loc = await captureLocation();
      } catch {
        loc = null; // GPS is best-effort - photo still goes through
      }
      const res = await uploadPhotos([file]).unwrap();
      const f = res?.files?.[0];
      if (!f?.url) throw new Error("Upload failed");
      onChange({
        url: f.url,
        publicId: f.publicId,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        capturedAt: new Date().toISOString(),
      });
    } catch (ex) {
      setErr(ex?.data?.message || ex?.message || t("sv.photoError"));
    } finally {
      setBusy(false);
    }
  }

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
          <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark disabled:opacity-70"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {busy ? t("sv.photoUploading") : value?.url ? t("sv.photoRetake") : t("sv.photoTake")}
          </button>
          {value?.url && !busy && (
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
      {err && <p className="text-xs font-semibold text-coral">{err}</p>}
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
