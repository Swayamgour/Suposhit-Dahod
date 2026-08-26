import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import StatusPill from "../components/StatusPill.jsx";
import { ReviewActions } from "../components/ApprovalStatus.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useGetMukhyaSevikaEntriesQuery, useReviewMukhyaSevikaEntryMutation } from "../redux/api.jsx";
import { useAuth, ROLES, outranks } from "../context/AuthContext.jsx";

// Columns match GET /api/mukhya-sevika response
// (icds-backend/models/MukhyaSevikaEntry.js), auto-scoped server-side.
export default function MukhyaDevikaDetails() {
  const { t } = useLanguage();
  const { role } = useAuth();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data, isLoading, isFetching, error, refetch } = useGetMukhyaSevikaEntriesQuery({
    fromDate,
    toDate,
  });
  const [reviewEntry, { isLoading: reviewing }] = useReviewMukhyaSevikaEntryMutation();
  const entries = data?.entries || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">
            {t("mukhyaDetails.eyebrow")}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">{t("mukhyaDetails.title")}</h1>
          <p className="mt-1 text-sm text-muted">{entries.length} {t("mukhyaDetails.countSuffix")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            {t("mukhyaDetails.refresh")}
          </button>
          {role === ROLES.SECTOR && (
            <Link
              to="/mukhya-sevika/form"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark"
            >
              <Plus size={16} />
              {t("mukhyaDetails.newVisit")}
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error?.data?.message || t("mukhyaDetails.loadError")}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">{t("mukhyaDetails.fromDate")}</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">{t("mukhyaDetails.toDate")}</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="table-scroll overflow-x-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("mukhyaDetails.col.date")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("mukhyaDetails.col.block")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("mukhyaDetails.col.awc")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("mukhyaDetails.col.mukhyaSevika")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("mukhyaDetails.col.registeredChildren")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("mukhyaDetails.col.arrivalTime")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("mukhyaDetails.col.photos")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("mukhyaDetails.col.approval")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted">
                    {t("mukhyaDetails.loading")}
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted">
                    {t("mukhyaDetails.empty")}
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e._id} className="border-b border-line last:border-0 hover:bg-primary-light/40">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-ink">
                      {new Date(e.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{e.blockName || e.blockCode}</td>
                    <td className="whitespace-nowrap px-4 py-3">{e.awcName || e.awcCode}</td>
                    <td className="whitespace-nowrap px-4 py-3">{e.mukhyaSevikaName || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono">{e.registeredChildrenCount}</td>
                    <td className="whitespace-nowrap px-4 py-3">{e.arrivalTime || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {/* <StatusPill value={(e.photos || []).length > 0} /> */}
                      <img src={e?.photos?.[0]?.url || 'http://localhost:5173/logo.jpg'} width={60} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <ReviewActions
                        status={e.status}
                        canReview={[ROLES.DISTRICT, ROLES.BLOCK].includes(role)}
                        loading={reviewing}
                        onReview={(status, remarks) => reviewEntry({ id: e._id, status, remarks })}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
