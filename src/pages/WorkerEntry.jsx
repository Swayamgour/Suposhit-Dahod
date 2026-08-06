import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, X, Trash2, List as ListIcon, ImagePlus, MapPin } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const sections = [
  { id: "general", label: "સામાન્ય વિગત" },
  { id: "noon", label: "બપોરે નાસ્તાની વિગત" },
  { id: "nutrition", label: "પોષણ આહારની વિગત" },
  { id: "general2", label: "સામાન્ય વિગતો ૨" },
];

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-ink">
        {label}
        {required && <span className="text-coral">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const selectClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function WorkerEntry() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const [active, setActive] = useState("general");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">
            {t("list.records")}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
            {t("list.title")} <span className="text-muted">/ {id ? "Edit" : "Entry"}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs text-muted shadow-soft">
          <MapPin size={13} />
          Bavaka-2 · Bavaka · Dahod-1
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px,1fr]">
        {/* Section rail */}
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-colors lg:shrink ${
                active === s.id
                  ? "border-primary bg-primary-light text-primary-dark"
                  : "border-line bg-surface text-muted hover:bg-bg"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                  active === s.id ? "bg-primary text-white" : "bg-bg text-muted"
                }`}
              >
                {i + 1}
              </span>
              <span className="whitespace-nowrap lg:whitespace-normal">{s.label}</span>
            </button>
          ))}
        </nav>

        {/* Form panel */}
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
          {active === "general" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="તારીખ" required>
                  <input type="date" defaultValue="2026-08-03" className={selectClass} />
                </Field>
                <Field label="ઘટકનું નામ" required>
                  <select className={selectClass} defaultValue="">
                    <option value="" disabled>ઘટકનું નામ</option>
                    <option>Dahod-1</option>
                    <option>Dahod-2</option>
                    <option>Dahod-3</option>
                  </select>
                </Field>
                <Field label="સેજાનું નામ" required>
                  <select className={selectClass} defaultValue="">
                    <option value="" disabled>સેજાનું નામ</option>
                    <option>Bavaka</option>
                    <option>Afva</option>
                    <option>Agavada</option>
                  </select>
                </Field>
                <Field label="આંગણવાડી કેન્દ્રનું નામ" required>
                  <select className={selectClass} defaultValue="">
                    <option value="" disabled>આંગણવાડી કેન્દ્રનું નામ</option>
                    <option>Bavaka-1</option>
                    <option>Bavaka-2</option>
                    <option>Bavaka-3</option>
                  </select>
                </Field>
                <Field label="રજીસ્ટર બાળકોની સંખ્યા (૩ થી ૬ વર્ષ)">
                  <input type="number" placeholder="0" className={selectClass} />
                </Field>
                <Field label="આંગણવાડી કેન્દ્ર ખુલ્લું છે?">
                  <select className={selectClass} defaultValue="">
                    <option value="" disabled>--Select--</option>
                    <option>હા</option>
                    <option>ના</option>
                  </select>
                </Field>
                <Field label="આંગણવાડી કાર્યકરનું નામ">
                  <input type="text" placeholder="Worker name" className={selectClass} />
                </Field>
                <Field label="આંગણવાડી તેડાગરનું નામ">
                  <input type="text" placeholder="Helper name" className={selectClass} />
                </Field>
              </div>
              <Field label="આંગણવાડી કેન્દ્રનું સ્થાન" required>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary-light/40 py-3 text-sm font-semibold text-primary-dark hover:bg-primary-light"
                >
                  <MapPin size={15} />
                  Capture current location
                </button>
              </Field>
            </div>
          )}

          {active === "noon" && (
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                સવારે ૧૧:૩૦ થી બપોરે ૧:૩૦ વાગ્યા વચ્ચે
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="સવારનો નાસ્તો આપેલ છે?">
                  <select className={selectClass} defaultValue="">
                    <option value="" disabled>--Select--</option>
                    <option>હા</option>
                    <option>ના</option>
                  </select>
                </Field>
                <Field label="સવારના નાસ્તાનું મેનુ">
                  <select className={selectClass} defaultValue="">
                    <option value="" disabled>--Select--</option>
                    <option>પૌંઆ</option>
                    <option>ઉપમા</option>
                    <option>શીરો</option>
                    <option>મગ દાળ</option>
                  </select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <UploadBox label="સવારના નાસ્તાની થાળીનો ફોટો-૧" />
                <UploadBox label="સવારના નાસ્તા માટે હાજર બાળકોનો ફોટો" />
              </div>
            </div>
          )}

          {active === "nutrition" && (
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                સવારે ૧૧:૩૦ થી બપોરે ૧:૩૦ વાગ્યા વચ્ચે
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="પોષણ સુધા મેનુ સ્વીકારેલ છે?">
                  <select className={selectClass} defaultValue="">
                    <option value="" disabled>--Select--</option>
                    <option>હા</option>
                    <option>ના</option>
                  </select>
                </Field>
                <Field label="પોષણ સુધા મેનુ">
                  <select className={selectClass} defaultValue="">
                    <option value="" disabled>--Select--</option>
                    <option>ખીચડી</option>
                    <option>શાક, દાળ અને રોટલી</option>
                    <option>ફળ અને દૂધ</option>
                  </select>
                </Field>
              </div>
              <UploadBox label="પોષણ સુધા થાળીનો ફોટો" />
            </div>
          )}

          {active === "general2" && (
            <div className="space-y-4">
              <Field label="સામાન્ય નોંધ / અવલોકન" hint="કોઈ વધારાની માહિતી હોય તો અહીં લખો">
                <textarea rows={5} className={`${selectClass} resize-none`} placeholder="Notes…" />
              </Field>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-line pt-5">
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">
              <Save size={15} />
              Save
            </button>
            <button
              onClick={() => navigate("/workers")}
              className="flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bg"
            >
              <X size={15} />
              Cancel
            </button>
            {id && (
              <button className="flex items-center gap-2 rounded-lg border border-coral/30 bg-coral-light px-4 py-2.5 text-sm font-semibold text-coral hover:bg-coral hover:text-white">
                <Trash2 size={15} />
                Delete
              </button>
            )}
            <button
              onClick={() => navigate("/workers")}
              className="ml-auto flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-muted hover:bg-bg hover:text-ink"
            >
              <ListIcon size={15} />
              Back to list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadBox({ label }) {
  return (
    <Field label={label}>
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-bg py-6 text-center hover:border-primary/50">
        <ImagePlus size={20} className="text-muted" />
        <p className="text-xs text-muted">Tap to add photo</p>
      </div>
    </Field>
  );
}
