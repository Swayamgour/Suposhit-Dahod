import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, RefreshCw, X, MapPin, Calendar, User, Filter, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import StatusPill from "../components/StatusPill.jsx";
import { ReviewActions } from "../components/ApprovalStatus.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useGetRecordsQuery, useReviewRecordMutation } from "../redux/api.jsx";
import { useAuth, ROLES, outranks } from "../context/AuthContext.jsx";

// Columns match GET /api/records response (icds-backend/models/Record.js),
// auto-scoped server-side to the logged in user's branch of the hierarchy.
// createdBy / reviewedBy are populated server-side ({ name }) so worker &
// supervisor names can be shown without extra joins on the client.

const QUALITY_OPTIONS = ["good", "average", "bad"];
const STATUS_OPTIONS = ["pending", "approved", "rejected"];

// Full-screen viewer for a single record photo, with the record's context
// shown alongside it (who/where/when + the same meal/quality data as the row).
// Takes the exact photo object + its label (photo "type") directly, since
// photos now live on named fields (morningDishPhoto, etc.) rather than an array.
function PhotoDetailModal({ record, photo, photoLabel, onClose, t }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!record) return null;

  const src = photo?.url || "/logo.jpg";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image side */}
        <div className="flex flex-1 items-center justify-center bg-black/90 p-2 md:p-4">
          <img
            src={src}
            alt={photoLabel || "Record photo"}
            className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
            onError={(e) => {
              e.currentTarget.src = "/logo.jpg";
            }}
          />
        </div>

        {/* Detail side */}
        <div className="w-full flex-shrink-0 overflow-y-auto border-t border-line p-5 md:w-[320px] md:border-l md:border-t-0">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-sm font-bold uppercase tracking-wide text-primary">
              {t?.("workerList.photoDetail") || "Photo Detail"}
            </p>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-bg hover:text-ink"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* PHOTO TYPE */}
            <div className="inline-flex items-center rounded-full bg-primary-light/50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              {photoLabel || "Photo"}
            </div>

            <div className="flex items-center gap-2 text-ink">
              <Calendar size={15} className="text-muted" />
              <span>{new Date(record.date).toLocaleDateString("en-IN")}</span>
            </div>
            <div className="flex items-center gap-2 text-ink">
              <User size={15} className="text-muted" />
              <span>{record.createdBy?.name || "-"}</span>
            </div>
            <div className="flex items-start gap-2 text-ink">
              <MapPin size={15} className="mt-0.5 shrink-0 text-muted" />
              <span>
                {[record.blockName || record.blockCode, record.sectorName || record.sectorCode, record.awcName || record.awcCode]
                  .filter(Boolean)
                  .join(" / ")}
              </span>
            </div>

            {(photo?.timestamp || photo?.capturedAt) && (
              <div className="text-xs text-muted">
                {t?.("workerList.capturedAt") || "Captured"}:{" "}
                {new Date(photo.timestamp || photo.capturedAt).toLocaleString("en-IN")}
              </div>
            )}
            {(photo?.lat != null && photo?.lng != null) && (
              <div className="text-xs text-muted">
                {t?.("workerList.geoTag") || "Geo"}: {photo.lat.toFixed(5)}, {photo.lng.toFixed(5)}
              </div>
            )}

            <hr className="border-line" />

            <dl className="grid grid-cols-2 gap-y-2 text-xs">
              <dt className="text-muted">{t?.("workerList.col.centerOpen") || "Center Open"}</dt>
              <dd className="text-right font-semibold text-ink">
                <StatusPill value={record.centerOpen} />
              </dd>

              <dt className="text-muted">{t?.("workerList.col.registeredChildren") || "Registered"}</dt>
              <dd className="text-right font-mono text-ink">{record.registeredChildrenCount ?? 0}</dd>

              <dt className="text-muted">{t?.("workerList.col.morningMealCount") || "Morning Meal"}</dt>
              <dd className="text-right font-mono text-ink">{record.morningMealChildrenCount ?? 0}</dd>

              <dt className="text-muted">{t?.("workerList.col.morningMenu") || "Morning Menu"}</dt>
              <dd className="text-right text-ink">{record.morningMenu || "-"}</dd>

              <dt className="text-muted">{t?.("workerList.col.milkPouchCount") || "Milk Pouches"}</dt>
              <dd className="text-right font-mono text-ink">{record.milkPouchCount ?? 0}</dd>

              <dt className="text-muted">{t?.("workerList.col.afternoonMenu") || "Afternoon Menu"}</dt>
              <dd className="text-right text-ink">{record.afternoonMenu || "-"}</dd>

              <dt className="text-muted">{t?.("workerList.col.quality") || "Quality"}</dt>
              <dd className="text-right capitalize text-ink">{record.qualityOfMeal || "-"}</dd>

              <dt className="text-muted">{t?.("workerList.col.approval") || "Status"}</dt>
              <dd className="text-right capitalize text-ink">{record.status || "-"}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkerList() {
  const { t } = useLanguage();
  const { role } = useAuth();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Client-side filters (applied on top of the server-scoped/date-filtered records)
  const [showFilters, setShowFilters] = useState(false);
  const [blockFilter, setBlockFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [awcFilter, setAwcFilter] = useState("");
  const [workerFilter, setWorkerFilter] = useState("");
  const [qualityFilter, setQualityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [centerOpenFilter, setCenterOpenFilter] = useState("");

  const { data, isLoading, isFetching, error, refetch } = useGetRecordsQuery({ fromDate, toDate });
  const [reviewRecord, { isLoading: reviewing }] = useReviewRecordMutation();
  const allRecords = data?.records || [];

  // Full-screen photo viewer state: exact record + photo object + its label ("type")
  const [activePhoto, setActivePhoto] = useState(null); // { record, photo, photoKey, photoLabel }

  const records = useMemo(() => {
    const norm = (v) => (v ?? "").toString().trim().toLowerCase();
    return allRecords.filter((r) => {
      if (blockFilter && !norm(r.blockName || r.blockCode).includes(norm(blockFilter))) return false;
      if (sectorFilter && !norm(r.sectorName || r.sectorCode).includes(norm(sectorFilter))) return false;
      if (awcFilter && !norm(r.awcName || r.awcCode).includes(norm(awcFilter))) return false;
      if (workerFilter && !norm(r.createdBy?.name).includes(norm(workerFilter))) return false;
      if (qualityFilter && norm(r.qualityOfMeal) !== norm(qualityFilter)) return false;
      if (statusFilter && norm(r.status) !== norm(statusFilter)) return false;
      if (centerOpenFilter && norm(r.centerOpen) !== norm(centerOpenFilter)) return false;
      return true;
    });
  }, [allRecords, blockFilter, sectorFilter, awcFilter, workerFilter, qualityFilter, statusFilter, centerOpenFilter]);

  const activeFilterCount = [blockFilter, sectorFilter, awcFilter, workerFilter, qualityFilter, statusFilter, centerOpenFilter].filter(Boolean).length;

  const clearFilters = () => {
    setBlockFilter("");
    setSectorFilter("");
    setAwcFilter("");
    setWorkerFilter("");
    setQualityFilter("");
    setStatusFilter("");
    setCenterOpenFilter("");
  };

  // ---------------------------------------------------
  // PAGINATION (same pattern as Dashboard: 10 rows/page)
  // ---------------------------------------------------

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, blockFilter, sectorFilter, awcFilter, workerFilter, qualityFilter, statusFilter, centerOpenFilter]);

  const totalPages = Math.max(1, Math.ceil(records.length / rowsPerPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return records.slice(start, start + rowsPerPage);
  }, [records, page]);

  const PHOTO_COLUMNS = [
    {
      key: "morningDishPhoto",
      label: "Morning Breakfast",
    },
    {
      key: "childrenEatingBreakfastPhoto",
      label: "Children Eating Breakfast",
    },
    {
      key: "afternoonDishPhoto",
      label: "Afternoon Meal",
    },
    {
      key: "childrenEatingAfternoonPhoto",
      label: "Children Eating Afternoon",
    },
    {
      key: "preEducationPhoto",
      label: "Pre-Education",
    },
    {
      key: "photoBeneficiariesNutrition",
      label: "Nutrition Beneficiaries",
    },
  ];

  const COLUMN_COUNT = 13 + PHOTO_COLUMNS.length + (role === ROLES.AWC ? 1 : 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">
            {t("list.records") || "Records"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">{t("workerList.title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {records.length}
            {activeFilterCount > 0 ? ` / ${allRecords.length}` : ""} {t("workerList.countSuffix")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-soft ${showFilters || activeFilterCount > 0
              ? "border-primary bg-primary-light/40 text-primary"
              : "border-line bg-surface text-ink hover:bg-bg"
              }`}
          >
            <Filter size={16} />
            {t("workerList.filters") || "Filters"}
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            {t("workerList.refresh")}
          </button>
          {role === ROLES.AWC && (
            <Link
              to="/workers/new"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark"
            >
              <Plus size={16} />
              {t("workerList.newRecord")}
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error?.data?.message || t("workerList.loadError")}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">{t("workerList.fromDate")}</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">{t("workerList.toDate")}</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Extra filter row - toggled by the Filters button */}
      {showFilters && (
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-muted">{t("workerList.col.block")}</label>
              <input
                type="text"
                value={blockFilter}
                onChange={(e) => setBlockFilter(e.target.value)}
                placeholder={t("workerList.col.block")}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-muted">{t("workerList.col.sector")}</label>
              <input
                type="text"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                placeholder={t("workerList.col.sector")}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-muted">{t("workerList.col.awc")}</label>
              <input
                type="text"
                value={awcFilter}
                onChange={(e) => setAwcFilter(e.target.value)}
                placeholder={t("workerList.col.awc")}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-muted">{t("workerList.col.worker")}</label>
              <input
                type="text"
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
                placeholder={t("workerList.col.worker")}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-muted">{t("workerList.col.centerOpen")}</label>
              <select
                value={centerOpenFilter}
                onChange={(e) => setCenterOpenFilter(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t("workerList.all") || "All"}</option>
                <option value="true">{t("common.yes") || "Yes"}</option>
                <option value="false">{t("common.no") || "No"}</option>
              </select>
            </div>
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-muted">{t("workerList.col.quality")}</label>
              <select
                value={qualityFilter}
                onChange={(e) => setQualityFilter(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm capitalize text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t("workerList.all") || "All"}</option>
                {QUALITY_OPTIONS.map((q) => (
                  <option key={q} value={q} className="capitalize">
                    {q}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-muted">{t("workerList.col.approval")}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm capitalize text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t("workerList.all") || "All"}</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
              className="flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2 text-sm font-semibold text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={14} />
              {t("workerList.clearFilters") || "Clear"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="table-scroll overflow-x-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">

                {/* S.NO */}
                <th className="sticky left-0 z-20 whitespace-nowrap bg-bg px-4 py-3 text-center font-semibold">
                  S.No.
                </th>

                {/* EDIT - awc only, matches WorkerList in the mobile app's
                    pencil icon that opens the same record pre-filled */}
                {role === ROLES.AWC && (
                  <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">
                    Edit
                  </th>
                )}

                {/* DATE */}
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.date")}
                </th>

                {/* BLOCK */}
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.block")}
                </th>

                {/* SECTOR */}
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.sector")}
                </th>

                {/* AWC */}
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.awc")}
                </th>

                {/* WORKER */}
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.worker")}
                </th>

                {/* CENTER OPEN */}
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.centerOpen")}
                </th>

                {/* REGISTERED CHILDREN */}
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.registeredChildren")}
                </th>

                {/* MORNING MEAL COUNT */}
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.morningMealCount")}
                </th>

                {/* MORNING MENU */}
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.morningMenu")}
                </th>

                {/* MILK POUCH */}
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.milkPouchCount")}
                </th>

                {/* AFTERNOON MENU */}
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.afternoonMenu")}
                </th>

                {/* QUALITY */}
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.quality")}
                </th>

                {/* ========================== */}
                {/* PHOTO HEADERS */}
                {/* ========================== */}

                {PHOTO_COLUMNS.map((photoColumn) => (
                  <th
                    key={photoColumn.key}
                    className="w-[140px] min-w-[140px] max-w-[140px] px-2 py-3 text-center font-semibold"
                  >
                    {photoColumn.label}
                  </th>
                ))}

                {/* APPROVAL */}
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.approval")}
                </th>

              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={COLUMN_COUNT}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    {t("workerList.loading")}
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMN_COUNT}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    {activeFilterCount > 0
                      ? t("workerList.noFilterMatch") ||
                      "No records match the current filters"
                      : t("workerList.empty")}
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, rowIndex) => (
                  <tr
                    key={r._id}
                    className="border-b border-line last:border-0 hover:bg-primary-light/40"
                  >

                    {/* ========================== */}
                    {/* S.NO */}
                    {/* ========================== */}

                    <td className="sticky left-0 z-10 whitespace-nowrap bg-surface px-4 py-3 text-center font-semibold">
                      {(page - 1) * rowsPerPage + rowIndex + 1}
                    </td>

                    {/* ========================== */}
                    {/* EDIT */}
                    {/* ========================== */}

                    {role === ROLES.AWC && (
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <Link
                          to={`/workers/edit/${r._id}`}
                          state={{ record: r }}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-primary transition hover:bg-primary-light/40"
                          title="Edit entry"
                        >
                          <Pencil size={16} />
                        </Link>
                      </td>
                    )}

                    {/* ========================== */}
                    {/* DATE */}
                    {/* ========================== */}

                    <td className="whitespace-nowrap px-4 py-3 font-mono text-ink">
                      {new Date(r.date).toLocaleDateString("en-IN")}
                    </td>

                    {/* ========================== */}
                    {/* BLOCK */}
                    {/* ========================== */}

                    <td className="whitespace-nowrap px-4 py-3">
                      {r.blockName || r.blockCode || "-"}
                    </td>

                    {/* ========================== */}
                    {/* SECTOR */}
                    {/* ========================== */}

                    <td className="whitespace-nowrap px-4 py-3">
                      {r.sectorName || r.sectorCode || "-"}
                    </td>

                    {/* ========================== */}
                    {/* AWC */}
                    {/* ========================== */}

                    <td className="whitespace-nowrap px-4 py-3">
                      {r.awcName || r.awcCode || "-"}
                    </td>

                    {/* ========================== */}
                    {/* WORKER */}
                    {/* ========================== */}

                    <td className="whitespace-nowrap px-4 py-3">
                      {r.createdBy?.name || "-"}
                    </td>

                    {/* ========================== */}
                    {/* CENTER OPEN */}
                    {/* ========================== */}

                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusPill value={r.centerOpen} />
                    </td>

                    {/* ========================== */}
                    {/* REGISTERED CHILDREN */}
                    {/* ========================== */}

                    <td className="whitespace-nowrap px-4 py-3 text-center font-mono">
                      {r.registeredChildrenCount ?? 0}
                    </td>

                    {/* ========================== */}
                    {/* MORNING MEAL COUNT */}
                    {/* ========================== */}

                    <td className="whitespace-nowrap px-4 py-3 text-center font-mono">
                      {r.morningMealChildrenCount ?? 0}
                    </td>

                    {/* ========================== */}
                    {/* MORNING MENU */}
                    {/* ========================== */}

                    <td className="whitespace-nowrap px-4 py-3">
                      {r.morningMenu || "-"}
                    </td>

                    {/* ========================== */}
                    {/* MILK POUCH */}
                    {/* ========================== */}

                    <td className="whitespace-nowrap px-4 py-3 text-center font-mono">
                      {r.milkPouchCount ?? 0}
                    </td>

                    {/* ========================== */}
                    {/* AFTERNOON MENU */}
                    {/* ========================== */}

                    <td className="whitespace-nowrap px-4 py-3">
                      {r.afternoonMenu || "-"}
                    </td>

                    {/* ========================== */}
                    {/* QUALITY */}
                    {/* ========================== */}

                    <td className="whitespace-nowrap px-4 py-3 capitalize">
                      {r.qualityOfMeal || "-"}
                    </td>


                    {/* ================================================== */}
                    {/* PHOTOS - EACH PHOTO HAS ITS OWN TD, WITH ITS TYPE/LABEL */}
                    {/* ================================================== */}

                    {PHOTO_COLUMNS.map((photoColumn) => {
                      const photo = r?.[photoColumn.key];

                      return (
                        <td
                          key={`${r._id}-${photoColumn.key}`}
                          className="w-[140px] min-w-[140px] max-w-[140px] px-2 py-3 align-top"
                        >
                          <div className="flex flex-col items-center gap-1.5">

                            {/* IMAGE */}
                            <button
                              type="button"
                              onClick={() => {
                                if (photo?.url) {
                                  setActivePhoto({
                                    record: r,
                                    photo,
                                    photoKey: photoColumn.key,
                                    photoLabel: photoColumn.label,
                                  });
                                }
                              }}
                              disabled={!photo?.url}
                              className="rounded-lg outline-none transition hover:opacity-90 focus:ring-2 focus:ring-primary/40 disabled:cursor-default"
                              title={
                                photo?.url
                                  ? `View ${photoColumn.label} photo`
                                  : "No photo available"
                              }
                            >
                              <img
                                src={photo?.url || "/logo.jpg"}
                                alt={photoColumn.label}
                                className="h-16 w-16 rounded-lg border border-line object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/logo.jpg";
                                }}
                              />
                            </button>

                            {/* PHOTO TYPE / LABEL */}
                            {/* <span className="text-center text-[10px] font-semibold leading-tight text-muted">
                              {photoColumn.label}
                            </span> */}

                            {/* CAPTURE TIME */}
                            {/* {photo?.capturedAt ? (
                              <span className="text-center text-[10px] text-muted">
                                {new Date(
                                  photo.capturedAt
                                ).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            ) : !photo?.url ? (
                              <span className="text-[10px] text-muted">
                                No Photo
                              </span>
                            ) : null} */}

                          </div>
                        </td>
                      );
                    })}


                    {/* ========================== */}
                    {/* APPROVAL */}
                    {/* ========================== */}

                    <td className="whitespace-nowrap px-4 py-3">
                      <ReviewActions
                        status={r.status}
                        canReview={
                          role !== ROLES.AWC &&
                          outranks(role, ROLES.AWC)
                        }
                        loading={reviewing}
                        onReview={async (status, remarks) => {
                          try {
                            // 1️⃣ Record approve/reject
                            await reviewRecord({
                              id: r._id,
                              status,
                              remarks,
                            }).unwrap();

                            // 2️⃣ Latest records automatically fetch
                            await refetch();

                            return true;

                          } catch (error) {
                            console.error("Review failed:", error);
                            throw error;
                          }
                        }}
                      />
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================
            PAGINATION
        ========================================= */}

        {records.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
            <span className="text-xs font-medium text-muted">
              Showing {Math.min((page - 1) * rowsPerPage + 1, records.length)}-
              {Math.min(page * rowsPerPage, records.length)} of {records.length}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Prev
              </button>

              <span className="min-w-[90px] text-center text-xs font-semibold text-ink">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {activePhoto && (
        <PhotoDetailModal
          record={activePhoto.record}
          photo={activePhoto.photo}
          photoLabel={activePhoto.photoLabel}
          onClose={() => setActivePhoto(null)}
          t={t}
        />
      )}

    </div>
  );
}