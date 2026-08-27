import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Save, X, List as ListIcon } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useCreateRecordMutation, useUpdateRecordMutation } from "../redux/api.jsx";
import PhotoGpsCapture, { PHOTO_SLOTS } from "../components/PhotoGpsCapture.jsx";

// Fields match icds-backend/models/Record.js exactly. districtCode/blockCode/
// sectorCode/awcCode/*Name fields are filled in server-side from the logged
// in AWC user, so the form only needs to send the record's own data.
const sections = [
  { id: "general", labelKey: "workerEntry.section.general" },
  { id: "morning", labelKey: "workerEntry.section.morning" },
  { id: "afternoon", labelKey: "workerEntry.section.afternoon" },
  { id: "extra", labelKey: "workerEntry.section.extra" },
  { id: "proof", labelKey: "workerEntry.section.proof" },
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

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
const selectClass = inputClass;

// Entry window: AWC workers can only submit today's record between 9:30 AM
// and 1:30 PM. Backend must enforce this too (client-side check is only a
// convenience - a server-side check is required, see notes below).
const ENTRY_WINDOW_START_MIN = 9 * 60 + 30; // 9:30 AM
const ENTRY_WINDOW_END_MIN = 13 * 60 + 30; // 1:30 PM

function isWithinEntryWindow(d = new Date()) {
  const mins = d.getHours() * 60 + d.getMinutes();
  return mins >= ENTRY_WINDOW_START_MIN && mins <= ENTRY_WINDOW_END_MIN;
}

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  registeredChildrenCount: "",
  centerOpen: true,

  // NEW: today's activity status - present (normal entry), meeting, or leave
  activityStatus: "present",

  // Morning
  morningMealChildrenCount: "",
  morningMenu: "", // NEW: today's morning dish name
  milkPouchGiven: false,
  milkPouchCount: "",

  // Afternoon
  afternoonMealGiven: false,
  afternoonMealChildrenCount: "",
  afternoonMenu: "", // NEW: today's afternoon dish name

  // Pre-education
  preEducationConducted: false,
  preEducationChildrenCount: "",

  // Poshan Sudha Yojana
  poshanDishGiven: false,
  poshanMenu: "", // NEW: today's poshan sudha dish name
  poshanBenefitGiven: false,
  poshanSudhaCount: "", // NEW: પોષણ સુધા યોજનાનો લાભ લેતા લાભાર્થીની સંખ્યા

  qualityOfMeal: "good",
  remarks: "",
};

// The 6 required photos (morningDishPhoto, childrenEatingBreakfastPhoto,
// afternoonDishPhoto, childrenEatingAfternoonPhoto, preEducationPhoto,
// photoBeneficiariesNutrition) are no longer plain true/false flags on the
// form - they live in the `photos` array below, captured live via the
// camera in PhotoGpsCapture and already uploaded to Cloudinary the moment
// they're taken. Submitting the form maps that array onto these same 6
// field names, matching models/Record.js exactly.

// Existing record -> form state, for edit mode (WorkerList's pencil icon
// navigates here with the full record in router state).
function toFormState(record) {
  if (!record) return emptyForm;
  return {
    ...emptyForm,
    date: record.date ? String(record.date).slice(0, 10) : emptyForm.date,
    registeredChildrenCount: record.registeredChildrenCount ?? "",
    centerOpen: record.centerOpen ?? true,
    activityStatus: record.activityStatus || "present",
    morningMealChildrenCount: record.morningMealChildrenCount ?? "",
    morningMenu: record.morningMenu || "",
    milkPouchGiven: !!record.milkPouchGiven,
    milkPouchCount: record.milkPouchCount ?? "",
    afternoonMealGiven: !!record.afternoonMealGiven,
    afternoonMealChildrenCount: record.afternoonMealChildrenCount ?? "",
    afternoonMenu: record.afternoonMenu || "",
    preEducationConducted: !!record.preEducationConducted,
    preEducationChildrenCount: record.preEducationChildrenCount ?? "",
    poshanDishGiven: !!record.poshanDishGiven,
    poshanMenu: record.poshanMenu || "",
    poshanBenefitGiven: !!record.poshanBenefitGiven,
    poshanSudhaCount: record.poshanSudhaCount ?? "",
    qualityOfMeal: record.qualityOfMeal || "good",
    remarks: record.remarks || "",
  };
}

// Existing record's 6 named photo fields -> the { key, url, latitude,
// longitude, capturedAt } array PhotoGpsCapture works with, so editing
// shows the already-captured photos instead of asking to retake everything.
function toPhotosState(record) {
  if (!record) return [];
  return PHOTO_SLOTS.map((slot) => {
    const photo = record[slot.key];
    if (!photo?.url) return null;
    return {
      key: slot.key,
      url: photo.url,
      latitude: photo.latitude,
      longitude: photo.longitude,
      capturedAt: photo.capturedAt,
    };
  }).filter(Boolean);
}

export default function WorkerEntry() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const routerLocation = useLocation();

  // Edit mode: WorkerList's pencil icon navigates to /workers/edit/:id
  // with the record passed via router state.
  const editRecord = routerLocation.state?.record || null;
  const isEditMode = !!id;

  const [active, setActive] = useState("general");
  const [form, setForm] = useState(() => toFormState(editRecord));
  const [location, setLocation] = useState(
    editRecord?.checkInLatitude != null && editRecord?.checkInLongitude != null
      ? { latitude: Number(editRecord.checkInLatitude), longitude: Number(editRecord.checkInLongitude) }
      : null
  );
  const [photos, setPhotos] = useState(() => toPhotosState(editRecord));
  const [error, setError] = useState("");
  const [createRecord, { isLoading: creating }] = useCreateRecordMutation();
  const [updateRecord, { isLoading: updating }] = useUpdateRecordMutation();
  const saving = creating || updating;

  // Re-check the entry-time window every 30s so the banner/lock updates live
  // if the worker leaves the tab open across 1:30 PM.
  const [withinWindow, setWithinWindow] = useState(() => isWithinEntryWindow());
  React.useEffect(() => {
    const intervalId = setInterval(() => setWithinWindow(isWithinEntryWindow()), 30000);
    return () => clearInterval(intervalId);
  }, []);

  const set = (key) => (e) => {
    const val = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setForm((f) => ({ ...f, [key]: val }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isWithinEntryWindow()) {
      setError(t("workerEntry.errWindow"));
      return;
    }

    // photos is an array of { key, url, latitude, longitude, accuracy,
    // capturedAt } built by PhotoGpsCapture - key matches one of the 6
    // Record photo field names exactly (see PHOTO_SLOTS), so map it onto
    // those named fields the backend expects.
    const photoFields = {};
    for (const photo of photos) {
      if (!photo?.key || !photo?.url) continue;
      photoFields[photo.key] = {
        url: photo.url,
        latitude: photo.latitude,
        longitude: photo.longitude,
        capturedAt: photo.capturedAt,
      };
    }

    // if (form.activityStatus === "present") {
    //   const missing = PHOTO_SLOTS.filter((slot) => !photoFields[slot.key]);
    //   if (missing.length > 0) {
    //     setError(
    //       `Please capture all required photos first. Missing: ${missing.map((s) => s.label).join(", ")}`
    //     );
    //     setActive("proof");
    //     return;
    //   }
    // }

    try {
      // Same payload shape whether creating or editing - only the endpoint
      // and HTTP method change (POST /records vs PUT /records/:id).
      const payload = {
        ...form,
        registeredChildrenCount: Number(form.registeredChildrenCount) || 0,
        morningMealChildrenCount: Number(form.morningMealChildrenCount) || 0,
        milkPouchCount: Number(form.milkPouchCount) || 0,
        afternoonMealChildrenCount: Number(form.afternoonMealChildrenCount) || 0,
        preEducationChildrenCount: Number(form.preEducationChildrenCount) || 0,
        poshanSudhaCount: Number(form.poshanSudhaCount) || 0,
        checkInLatitude: location?.latitude,
        checkInLongitude: location?.longitude,
        ...photoFields,
      };

      if (isEditMode) {
        // PUT /api/records/:id - awc role only (enforced server-side)
        await updateRecord({ id, ...payload }).unwrap();
      } else {
        // POST /api/records - awc role only (enforced server-side)
        await createRecord(payload).unwrap();
      }
      navigate("/workers");
    } catch (err) {
      setError(err?.data?.message || t("workerEntry.errSave"));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">
            {t("list.records")}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
            {isEditMode ? t("workerEntry.editTitle") || "Edit Record" : t("workerEntry.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("workerEntry.sub")}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate("/workers")}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
          >
            <ListIcon size={16} />
            {t("workerEntry.list")}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error}
        </div>
      )}

      {!withinWindow && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {t("workerEntry.windowBanner")}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto border-b border-line pb-px">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${active === s.id
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-ink"
              }`}
          >
            {t(s.labelKey)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-surface p-6 shadow-card space-y-8">
        {active === "general" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* <Field label="Date" required>
              <input type="date" required value={form.date} onChange={set("date")} className={inputClass} />
            </Field> */}
            <Field label={t("workerEntry.field.registeredChildren")} required>
              <input
                type="number"
                min="0"
                required
                value={form.registeredChildrenCount}
                onChange={set("registeredChildrenCount")}
                className={inputClass}
              />
            </Field>
            <Field label={t("workerEntry.field.centerOpenToday")}>
              <select
                value={form.centerOpen ? "yes" : "no"}
                onChange={(e) => set("centerOpen")(e.target.value === "yes")}
                className={selectClass}
              >
                <option value="yes">{t("common.yes")}</option>
                <option value="no">{t("common.no")}</option>
              </select>
            </Field>
            <Field label={t("workerEntry.field.todaysStatus")} hint={t("workerEntry.field.todaysStatusHint")}>
              <select value={form.activityStatus} onChange={set("activityStatus")} className={selectClass}>
                <option value="present">{t("workerEntry.status.present")}</option>
                <option value="meeting">{t("workerEntry.status.meeting")}</option>
                <option value="leave">{t("workerEntry.status.leave")}</option>
              </select>
            </Field>
          </div>
        )}

        {active === "morning" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label={t("workerEntry.field.morningMealChildren")}>
              <input
                type="number"
                min="0"
                value={form.morningMealChildrenCount}
                onChange={set("morningMealChildrenCount")}
                className={inputClass}
              />
            </Field>
            <Field label={t("workerEntry.field.morningMenu")} hint={t("workerEntry.field.morningMenuHint")}>
              <input
                type="text"
                value={form.morningMenu}
                onChange={set("morningMenu")}
                className={inputClass}
                placeholder={t("workerEntry.field.morningMenuHint")}
              />
            </Field>
            <Field label={t("workerEntry.field.milkPouchCount")}>
              <input
                type="number"
                min="0"
                value={form.milkPouchCount}
                onChange={set("milkPouchCount")}
                className={inputClass}
              />
            </Field>
            <Field label={t("workerEntry.field.milkPouchGiven")}>
              <select
                value={form.milkPouchGiven ? "yes" : "no"}
                onChange={(e) => set("milkPouchGiven")(e.target.value === "yes")}
                className={selectClass}
              >
                <option value="no">{t("common.no")}</option>
                <option value="yes">{t("common.yes")}</option>
              </select>
            </Field>
          </div>
        )}

        {active === "afternoon" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label={t("workerEntry.field.afternoonMealGiven")}>
              <select
                value={form.afternoonMealGiven ? "yes" : "no"}
                onChange={(e) => set("afternoonMealGiven")(e.target.value === "yes")}
                className={selectClass}
              >
                <option value="no">{t("common.no")}</option>
                <option value="yes">{t("common.yes")}</option>
              </select>
            </Field>
            <Field label={t("workerEntry.field.afternoonMealChildren")}>
              <input
                type="number"
                min="0"
                value={form.afternoonMealChildrenCount}
                onChange={set("afternoonMealChildrenCount")}
                className={inputClass}
              />
            </Field>
            <Field label={t("workerEntry.field.afternoonMenu")} hint={t("workerEntry.field.afternoonMenuHint")}>
              <input
                type="text"
                value={form.afternoonMenu}
                onChange={set("afternoonMenu")}
                className={inputClass}
                placeholder={t("workerEntry.field.afternoonMenuHint")}
              />
            </Field>
            <Field label={t("workerEntry.field.qualityOfMeal")}>
              <select value={form.qualityOfMeal} onChange={set("qualityOfMeal")} className={selectClass}>
                <option value="good">{t("workerEntry.quality.good")}</option>
                <option value="average">{t("workerEntry.quality.average")}</option>
                <option value="bad">{t("workerEntry.quality.bad")}</option>
              </select>
            </Field>
          </div>
        )}

        {active === "extra" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label={t("workerEntry.field.preEducationConducted")}>
              <select
                value={form.preEducationConducted ? "yes" : "no"}
                onChange={(e) => set("preEducationConducted")(e.target.value === "yes")}
                className={selectClass}
              >
                <option value="no">{t("common.no")}</option>
                <option value="yes">{t("common.yes")}</option>
              </select>
            </Field>
            <Field label={t("workerEntry.field.preEducationChildren")}>
              <input
                type="number"
                min="0"
                value={form.preEducationChildrenCount}
                onChange={set("preEducationChildrenCount")}
                className={inputClass}
              />
            </Field>
            <Field label={t("workerEntry.field.poshanMenu")}>
              <input
                type="text"
                value={form.poshanMenu}
                onChange={set("poshanMenu")}
                className={inputClass}
              />
            </Field>
            <Field label={t("workerEntry.field.poshanSudhaCount")}>
              <input
                type="number"
                min="0"
                value={form.poshanSudhaCount}
                onChange={set("poshanSudhaCount")}
                className={inputClass}
              />
            </Field>
            <Field label={t("workerEntry.field.poshanDishGiven")}>
              <select
                value={form.poshanDishGiven ? "yes" : "no"}
                onChange={(e) => set("poshanDishGiven")(e.target.value === "yes")}
                className={selectClass}
              >
                <option value="no">{t("common.no")}</option>
                <option value="yes">{t("common.yes")}</option>
              </select>
            </Field>
            <Field label={t("workerEntry.field.poshanBenefitGiven")}>
              <select
                value={form.poshanBenefitGiven ? "yes" : "no"}
                onChange={(e) => set("poshanBenefitGiven")(e.target.value === "yes")}
                className={selectClass}
              >
                <option value="no">{t("common.no")}</option>
                <option value="yes">{t("common.yes")}</option>
              </select>
            </Field>
            <Field label={t("workerEntry.field.remarks")}>
              <textarea
                rows={3}
                value={form.remarks}
                onChange={set("remarks")}
                className={inputClass}
              />
            </Field>
          </div>
        )}

        {active === "proof" &&
          form.activityStatus === "present" && (
            <div className="w-full">
              <PhotoGpsCapture
                photos={photos}
                onPhotosChange={setPhotos}
                onLocationChange={setLocation}
              />
            </div>
          )}

        <div className="flex justify-end gap-3 border-t border-line pt-5">
          <button
            type="button"
            onClick={() => navigate("/workers")}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-bg"
          >
            <X size={16} />
            {t("workerEntry.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving || !withinWindow}
            title={!withinWindow ? t("workerEntry.windowTitle") : undefined}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark disabled:opacity-70"
          >
            <Save size={16} />
            {saving
              ? t("workerEntry.saving")
              : !withinWindow
              ? t("workerEntry.closed")
              : isEditMode
              ? t("workerEntry.updateRecord") || "Update Record"
              : t("workerEntry.saveRecord")}
          </button>
        </div>
      </form>
    </div>
  );
}