import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, RefreshCw, ChevronLeft, ChevronRight, X, ClipboardCheck, MapPin } from "lucide-react";
import { ReviewActions, StatusBadge } from "../components/ApprovalStatus.jsx";
import { SECTIONS, SECTION_ORDER } from "../components/supervisor/supervisorVisitConfig.js";
import { buildQuestionColumns, collectPhotos, SECTION_TITLE_KEY } from "../components/supervisor/visitTableColumns.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import {
  useGetSupervisorVisitsQuery,
  useGetSupervisorVisitQuery,
  useReviewSupervisorVisitMutation,
  useStartSupervisorVisitMutation,
  useGetAwcsQuery,
} from "../redux/api.jsx";
import { useAuth, ROLES } from "../context/AuthContext.jsx";
import { captureLocation } from "../utils/apiClient.js";

const inputClass =
  "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export const completedCount = (visit) =>
  SECTION_ORDER.filter((k) => visit?.sectionStatus?.[SECTIONS[k].field]?.completed).length;

// Modal: supervisor picks any AWC in her own sector and starts the inspection
function StartVisitModal({ onClose }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data, isLoading } = useGetAwcsQuery(); // auto-scoped to the supervisor's sector
  const awcs = data?.awcs || [];
  const [awcCode, setAwcCode] = useState("");
  const [error, setError] = useState("");
  const [startVisit, { isLoading: starting }] = useStartSupervisorVisitMutation();

  async function handleStart() {
    setError("");
    if (!awcCode) {
      setError(t("sv.errSelectAwc"));
      return;
    }
    let loc = null;
    try {
      loc = await captureLocation(); // GPS check-in is best-effort
    } catch {
      loc = null;
    }
    try {
      const res = await startVisit({
        awcCode,
        checkInLatitude: loc?.latitude,
        checkInLongitude: loc?.longitude,
      }).unwrap();
      navigate(`/supervisor-visits/${res.visit._id}`);
    } catch (err) {
      setError(err?.data?.message || t("sv.errStart"));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold text-ink">{t("sv.newVisit")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-bg hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{t("sv.pickAwc")}</label>
        <select value={awcCode} onChange={(e) => setAwcCode(e.target.value)} className={inputClass}>
          <option value="">{isLoading ? t("sv.loading") : t("sv.selectAwc")}</option>
          {awcs.map((a) => (
            <option key={a.code} value={a.code}>
              {a.name}
            </option>
          ))}
        </select>
        {error && <p className="mt-3 rounded-lg bg-coral-light px-3 py-2 text-xs font-semibold text-coral">{error}</p>}
        <button
          onClick={handleStart}
          disabled={starting}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-card hover:bg-primary-dark disabled:opacity-70"
        >
          <ClipboardCheck size={16} />
          {starting ? t("sv.starting") : t("sv.startVisit")}
        </button>
      </div>
    </div>
  );
}

const QUESTION_COLUMNS = buildQuestionColumns();
const SECTION_SPANS = SECTION_ORDER.map((id) => ({ id, count: QUESTION_COLUMNS.filter((c) => c.sectionId === id).length }));
const SECTION_BAND = {
  general: "bg-sky-100 text-sky-900",
  a: "bg-primary-light text-primary-dark",
  b: "bg-amber-100 text-amber-800",
  c: "bg-accent-light text-ink",
};
const fmtTime = (v, lang) =>
  v ? new Date(v).toLocaleString(lang === "en" ? "en-IN" : lang === "hi" ? "hi-IN" : "gu-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

function PhotoLightbox({ photo, onClose }) {
  const { t } = useLanguage();
  if (!photo) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-full w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-surface shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <p className="text-sm font-bold text-ink">{photo.caption}</p>
            {photo.extra && <p className="text-xs text-muted">{photo.extra}</p>}
          </div>
          <button onClick={onClose} aria-label={t("sv.close")} className="rounded-lg p-1.5 text-muted hover:bg-bg hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <img src={photo.url} alt={photo.caption} className="max-h-[75vh] w-full bg-bg object-contain" />
        {photo.latitude != null && (
          <p className="flex items-center gap-1.5 px-4 py-2 text-xs text-muted">
            <MapPin size={12} />
            {Number(photo.latitude).toFixed(5)}, {Number(photo.longitude).toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}

// One table row. The list endpoint may not include the section answers, so the
// full visit is fetched (cached by RTK Query) for the rows on the current page.
function VisitRow({ v, role, reviewVisit, reviewing, onPhoto }) {
  const { t, lang } = useLanguage();
  const { data, isFetching } = useGetSupervisorVisitQuery(v._id);
  const visit = { ...v, ...(data?.visit || {}) };
  const ctx = { t, lang };
  const photos = collectPhotos(visit, t, lang);
  const td = "px-4 py-3 align-top";

  return (
    <tr className="border-b border-line last:border-0 hover:bg-primary-light/40">
      <td className={`${td} sticky left-0 z-[1] whitespace-nowrap bg-surface font-mono text-ink`}>{new Date(v.date).toLocaleDateString("en-IN")}</td>
      <td className={`${td} sticky left-[110px] z-[1] min-w-[150px] bg-surface font-semibold text-ink shadow-[2px_0_0_0_var(--line,#e5e7eb)]`}>
        {v.awcName || v.awcCode}
        <p className="text-[11px] font-normal text-muted">
          {[visit.blockName, visit.sectorName].filter(Boolean).join(" / ")}
        </p>
      </td>
      <td className={`${td} whitespace-nowrap`}>{v.supervisorName || "-"}</td>
      <td className={`${td} whitespace-nowrap font-mono`}>{completedCount(visit)}/4</td>
      <td className={`${td} whitespace-nowrap`}>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${v.formStatus === "submitted" ? "bg-primary-light text-primary-dark" : "bg-amber-100 text-amber-700"}`}>
          {t(v.formStatus === "submitted" ? "sv.submitted" : "sv.draft")}
        </span>
      </td>
      <td className={`${td} whitespace-nowrap`}>
        {v.formStatus === "submitted" ? (
          <ReviewActions
            status={v.status}
            canReview={[ROLES.DISTRICT, ROLES.BLOCK].includes(role)}
            loading={reviewing}
            onReview={(s, remarks) => reviewVisit({ id: v._id, status: s, remarks }).unwrap()}
          />
        ) : (
          <StatusBadge status="pending" />
        )}
      </td>
      <td className={`${td} min-w-[200px]`}>{visit.reviewRemarks || <span className="text-muted">-</span>}</td>
      <td className={`${td} whitespace-nowrap text-xs`}>{fmtTime(visit.checkInTime, lang)}</td>
      <td className={`${td} whitespace-nowrap text-xs`}>{fmtTime(visit.checkOutTime, lang)}</td>
      <td className={`${td} whitespace-nowrap font-mono text-xs`}>
        {visit.checkInLatitude != null ? `${Number(visit.checkInLatitude).toFixed(5)}, ${Number(visit.checkInLongitude).toFixed(5)}` : "-"}
      </td>
      <td className={`${td} min-w-[220px]`}>
        {photos.length === 0 ? (
          <span className="text-xs text-muted">{isFetching && !data ? t("sv.loadingDetail") : t("sv.noPhotos")}</span>
        ) : (
          <div className="flex gap-2">
            {photos.map((p) => (
              <button key={p.url} type="button" onClick={() => onPhoto(p)} className="group w-16 shrink-0 text-left" title={p.caption}>
                <img src={p.url} alt={p.caption} loading="lazy" className="h-16 w-16 rounded-lg border border-line object-cover group-hover:border-primary" />
                <span className="mt-1 line-clamp-2 block text-[10px] leading-tight text-muted">{p.caption}</span>
              </button>
            ))}
          </div>
        )}
      </td>
      {QUESTION_COLUMNS.map((c) => (
        <td key={c.key} className={`${td} ${c.wide ? "min-w-[300px]" : "min-w-[140px]"} text-ink`}>
          {c.render(visit, ctx)}
        </td>
      ))}
      <td className={`${td} whitespace-nowrap`}>
        <Link to={`/supervisor-visits/${v._id}`} className="rounded-lg bg-primary-light px-3 py-1.5 text-xs font-bold text-primary-dark hover:bg-primary/20">
          {t("sv.open")}
        </Link>
      </td>
    </tr>
  );
}

export default function SupervisorVisits() {
  const { t } = useLanguage();
  const { role } = useAuth();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("");
  const [showStart, setShowStart] = useState(false);
  const [photo, setPhoto] = useState(null);
  const { lang } = useLanguage();

  const { data, isLoading, isFetching, error, refetch } = useGetSupervisorVisitsQuery({ fromDate, toDate, status });
  const [reviewVisit, { isLoading: reviewing }] = useReviewSupervisorVisitMutation();
  const visits = data?.visits || [];

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  useEffect(() => setPage(1), [fromDate, toDate, status]);
  const totalPages = Math.max(1, Math.ceil(visits.length / rowsPerPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const rows = useMemo(() => visits.slice((page - 1) * rowsPerPage, page * rowsPerPage), [visits, page]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">{t("sv.eyebrow")}</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">{t("sv.title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {visits.length} {t("sv.countSuffix")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            {t("sv.refresh")}
          </button>
          {role === ROLES.SUPERVISOR && (
            <button
              onClick={() => setShowStart(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark"
            >
              <Plus size={16} />
              {t("sv.newVisit")}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error?.data?.message || t("sv.errLoad")}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">{t("sv.fromDate")}</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputClass} />
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">{t("sv.toDate")}</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputClass} />
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">{t("sv.col.approval")}</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="">{t("sv.allStatus")}</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
        </div>
      </div>

      <p className="text-xs font-medium text-muted">{t("sv.scrollHint")}</p>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="table-scroll max-h-[70vh] overflow-auto">
          <table className="data-table w-max min-w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wide">
                <th colSpan={11} className="sticky left-0 h-9 bg-bg px-4 text-muted" />
                {SECTION_SPANS.map((s) => (
                  <th key={s.id} colSpan={s.count} className={`h-9 whitespace-nowrap border-l border-line px-4 ${SECTION_BAND[s.id]}`}>
                    {t(SECTION_TITLE_KEY[s.id])}
                  </th>
                ))}
                <th className="h-9 bg-bg" />
              </tr>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                {[
                  ["date", "sticky left-0 z-[3] w-[110px] min-w-[110px]"],
                  ["awc", "sticky left-[110px] z-[3] min-w-[150px]"],
                  ["supervisor", ""],
                  ["sections", ""],
                  ["form", ""],
                  ["approval", ""],
                  ["reviewRemarks", ""],
                  ["checkIn", ""],
                  ["checkOut", ""],
                  ["location", ""],
                ].map(([c, cls]) => (
                  <th key={c} style={{ top: 36 }} className={`whitespace-nowrap bg-bg px-4 py-3 font-semibold ${cls}`}>
                    {t(`sv.col.${c}`)}
                  </th>
                ))}
                <th style={{ top: 36 }} className="whitespace-nowrap bg-bg px-4 py-3 font-semibold">{t("sv.col.photos")}</th>
                {QUESTION_COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    style={{ top: 36 }}
                    className={`bg-bg px-4 py-3 align-bottom font-semibold normal-case leading-snug ${c.wide ? "min-w-[300px]" : "min-w-[140px]"}`}
                  >
                    {(typeof c.label === "string" ? c.label : c.label?.[lang] || c.label?.en || "")}
                  </th>
                ))}
                <th style={{ top: 36 }} className="whitespace-nowrap bg-bg px-4 py-3 font-semibold">{t("sv.col.action")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={12 + QUESTION_COLUMNS.length} className="px-4 py-8 text-center text-sm text-muted">
                    {t("sv.loading")}
                  </td>
                </tr>
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={12 + QUESTION_COLUMNS.length} className="px-4 py-8 text-center text-sm text-muted">
                    {t("sv.empty")}
                  </td>
                </tr>
              ) : (
                rows.map((v) => (
                  <VisitRow key={v._id} v={v} role={role} reviewVisit={reviewVisit} reviewing={reviewing} onPhoto={setPhoto} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {visits.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
            <span className="text-xs font-medium text-muted">
              {Math.min((page - 1) * rowsPerPage + 1, visits.length)}-{Math.min(page * rowsPerPage, visits.length)} / {visits.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((c) => Math.max(1, c - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="min-w-[70px] text-center text-xs font-semibold text-ink">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showStart && <StartVisitModal onClose={() => setShowStart(false)} />}
      <PhotoLightbox photo={photo} onClose={() => setPhoto(null)} />
    </div>
  );
}
