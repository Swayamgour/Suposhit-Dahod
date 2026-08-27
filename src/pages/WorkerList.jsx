import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw, X, MapPin, Calendar, User, Filter, RotateCcw } from "lucide-react";
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
function PhotoDetailModal({ record, photoIndex, onClose, t }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!record) return null;

  const photo = record?.photos?.[photoIndex];
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
            alt={`Record photo ${photoIndex + 1}`}
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

            <div className="pt-1 text-xs text-muted">
              {t?.("workerList.photoOf") || "Photo"} {photoIndex + 1} / {record?.photos?.length || 0}
            </div>
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

  // Full-screen photo viewer state: which record + which photo index is open
  const [activePhoto, setActivePhoto] = useState(null); // { record, photoIndex }

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

  // const COLUMN_COUNT = 13;
  const MAX_PHOTOS = 6;
  const COLUMN_COUNT = 19;

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

                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  S.No.
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.date")}
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.block")}
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.sector")}
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.awc")}
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.worker")}
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.centerOpen")}
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.registeredChildren")}
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.morningMealCount")}
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.morningMenu")}
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.milkPouchCount")}
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.afternoonMenu")}
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  {t("workerList.col.quality")}
                </th>

                {/* PHOTO COLUMNS */}
                {Array.from({ length: MAX_PHOTOS }).map((_, index) => (
                  <th
                    key={`photo-header-${index}`}
                    className="w-[90px] min-w-[90px] max-w-[90px] whitespace-nowrap px-2 py-3 text-center font-semibold"
                  >
                    Photo {index + 1}
                  </th>
                ))}

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
                      ? t("workerList.noFilterMatch") || "No records match the current filters"
                      : t("workerList.empty")}
                  </td>
                </tr>
              ) : (
                records.map((r, rowIndex) => (
                  <tr
                    key={r._id}
                    className="border-b border-line last:border-0 hover:bg-primary-light/40"
                  >

                    {/* S.NO */}
                    <td className="whitespace-nowrap px-4 py-3 text-center font-semibold">
                      {rowIndex + 1}
                    </td>

                    {/* DATE */}
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-ink">
                      {new Date(r.date).toLocaleDateString("en-IN")}
                    </td>

                    {/* BLOCK */}
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.blockName || r.blockCode}
                    </td>

                    {/* SECTOR */}
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.sectorName || r.sectorCode}
                    </td>

                    {/* AWC */}
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.awcName || r.awcCode}
                    </td>

                    {/* WORKER */}
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.createdBy?.name || "-"}
                    </td>

                    {/* CENTER OPEN */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusPill value={r.centerOpen} />
                    </td>

                    {/* REGISTERED CHILDREN */}
                    <td className="whitespace-nowrap px-4 py-3 text-center font-mono">
                      {r.registeredChildrenCount ?? 0}
                    </td>

                    {/* MORNING MEAL COUNT */}
                    <td className="whitespace-nowrap px-4 py-3 text-center font-mono">
                      {r.morningMealChildrenCount ?? 0}
                    </td>

                    {/* MORNING MENU */}
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.morningMenu || "-"}
                    </td>

                    {/* MILK POUCH */}
                    <td className="whitespace-nowrap px-4 py-3 text-center font-mono">
                      {r.milkPouchCount ?? 0}
                    </td>

                    {/* AFTERNOON MENU */}
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.afternoonMenu || "-"}
                    </td>

                    {/* QUALITY */}
                    <td className="whitespace-nowrap px-4 py-3 capitalize">
                      {r.qualityOfMeal || "-"}
                    </td>

                    {/* ============================= */}
                    {/* 8 SEPARATE PHOTO TD COLUMNS - click to open full screen with detail */}
                    {/* ============================= */}

                    {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
                      const photo = r?.photos?.[index];

                      return (
                        <td
                          key={`photo-${r._id}-${index}`}
                          className="w-[90px] min-w-[90px] max-w-[90px] px-2 py-2 text-center align-middle"
                        >
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => setActivePhoto({ record: r, photoIndex: index })}
                              className="rounded-lg outline-none ring-primary/40 transition hover:opacity-90 focus:ring-2"
                              title={t("workerList.viewPhoto") || "View photo"}
                            >
                              <img
                                src={
                                  photo?.url ||
                                  "/logo.jpg"
                                }
                                alt={`Record photo ${index + 1}`}
                                className="h-14 w-14 cursor-pointer rounded-lg border border-line object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/logo.jpg";
                                }}
                              />
                            </button>
                          </div>
                        </td>
                      );
                    })}

                    {/* APPROVAL */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <ReviewActions
                        status={r.status}
                        canReview={
                          role !== ROLES.AWC &&
                          outranks(role, ROLES.AWC)
                        }
                        loading={reviewing}
                        onReview={(status, remarks) =>
                          reviewRecord({
                            id: r._id,
                            status,
                            remarks,
                          })
                        }
                      />
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activePhoto && (
        <PhotoDetailModal
          record={activePhoto.record}
          photoIndex={activePhoto.photoIndex}
          onClose={() => setActivePhoto(null)}
          t={t}
        />
      )}
    </div>
  );
}