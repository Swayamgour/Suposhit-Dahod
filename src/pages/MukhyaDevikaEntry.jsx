import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { List, Check, X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useCreateMukhyaSevikaEntryMutation, useGetAwcsQuery } from "../redux/api.jsx";
import PhotoGpsCapture from "../components/PhotoGpsCapture.jsx";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

// Fields match icds-backend/models/MukhyaSevikaEntry.js exactly. district/
// block/sector codes + names are filled server-side from the logged in
// sector (MS/Supervisor) user, so the form only asks for the AWC visited
// plus the visit's own data.
export default function MukhyaDevikaEntry() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  // GET /api/hierarchy/awc - auto-scoped to this sector user's own AWCs
  const { data: awcData, isLoading: loadingAwcs } = useGetAwcsQuery();
  const awcs = awcData?.awcs || [];

  const [form, setForm] = useState({
    awcCode: "",
    date: new Date().toISOString().slice(0, 10),
    registeredChildrenCount: "",
    arrivalTime: "",
    remarks: "",
  });
  const [location, setLocation] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [createEntry, { isLoading: saving }] = useCreateMukhyaSevikaEntryMutation();

  const set = (key) => (e) => {
    const val = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setForm((f) => ({ ...f, [key]: val }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.awcCode) {
      setError("Please select the AWC you visited.");
      return;
    }
    try {
      // POST /api/mukhya-sevika - sector role only (enforced server-side)
      await createEntry({
        ...form,
        registeredChildrenCount: Number(form.registeredChildrenCount) || 0,
        checkInLatitude: location?.latitude,
        checkInLongitude: location?.longitude,
        photos,
      }).unwrap();
      navigate("/mukhya-sevika");
    } catch (err) {
      setError(err?.data?.message || "Could not save the visit entry.");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold text-ink flex items-center gap-2">
          <List className="text-primary" size={28} />
          {t("mukhya.form.title")}
        </h1>
        <button
          type="button"
          onClick={() => navigate("/mukhya-sevika")}
          className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
        >
          <List size={16} />
          List
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-bg/50">
          <h2 className="text-lg font-bold text-ink">{t("mukhya.form.heading")}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <fieldset className="rounded-xl border border-line p-5">
            <legend className="px-3 text-sm font-bold text-muted uppercase tracking-wider">
              {t("mukhya.form.section1")}
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  AWC Center <span className="text-coral">*</span>
                </label>
                <select
                  required
                  value={form.awcCode}
                  onChange={set("awcCode")}
                  className={inputClass}
                >
                  <option value="">{loadingAwcs ? "Loading..." : "Select AWC"}</option>
                  {awcs.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Visit Date <span className="text-coral">*</span>
                </label>
                <input type="date" required value={form.date} onChange={set("date")} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Registered children count</label>
                <input
                  type="number"
                  min="0"
                  value={form.registeredChildrenCount}
                  onChange={set("registeredChildrenCount")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Arrival time</label>
                <input
                  type="text"
                  placeholder="e.g. 10:30 AM"
                  value={form.arrivalTime}
                  onChange={set("arrivalTime")}
                  className={inputClass}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-line p-5">
            <legend className="px-3 text-sm font-bold text-muted uppercase tracking-wider">Visit Details</legend>
            <div className="mt-2 space-y-4">
              <PhotoGpsCapture photos={photos} onPhotosChange={setPhotos} onLocationChange={setLocation} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Remarks</label>
                <textarea rows={3} value={form.remarks} onChange={set("remarks")} className={inputClass} />
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 border-t border-line pt-5">
            <button
              type="button"
              onClick={() => navigate("/mukhya-sevika")}
              className="flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-bg"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark disabled:opacity-70"
            >
              <Check size={16} />
              {saving ? "Saving..." : "Save Visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
