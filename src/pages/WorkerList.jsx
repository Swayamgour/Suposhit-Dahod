import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import StatusPill from "../components/StatusPill.jsx";
import { ReviewActions } from "../components/ApprovalStatus.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useGetRecordsQuery, useReviewRecordMutation } from "../redux/api.jsx";
import { useAuth, ROLES, outranks } from "../context/AuthContext.jsx";

// Columns match GET /api/records response (icds-backend/models/Record.js),
// auto-scoped server-side to the logged in user's branch of the hierarchy.
// createdBy / reviewedBy are populated server-side ({ name }) so worker &
// supervisor names can be shown without extra joins on the client.
export default function WorkerList() {
  const { t } = useLanguage();
  const { role } = useAuth();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data, isLoading, isFetching, error, refetch } = useGetRecordsQuery({ fromDate, toDate });
  const [reviewRecord, { isLoading: reviewing }] = useReviewRecordMutation();
  const records = data?.records || [];

  const COLUMN_COUNT = 13;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">
            {t("list.records") || "Records"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">Center Daily Records</h1>
          <p className="mt-1 text-sm text-muted">{records.length} record(s) in your scope.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
          {role === ROLES.AWC && (
            <Link
              to="/workers/new"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark"
            >
              <Plus size={16} />
              New Record
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error?.data?.message || "Could not load records from the server."}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">From date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">To date</label>
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
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Date</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Block</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Sector</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">AWC</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Worker</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Center Open</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Registered Children</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Morning Meal Count</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Morning Menu</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Milk Pouch Count</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Afternoon Menu</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Quality</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">image</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Approval</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="px-4 py-8 text-center text-sm text-muted">
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="px-4 py-8 text-center text-sm text-muted">
                    No records found in your scope.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="border-b border-line last:border-0 hover:bg-primary-light/40">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-ink">
                      {new Date(r.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{r.blockName || r.blockCode}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.sectorName || r.sectorCode}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.awcName || r.awcCode}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.createdBy?.name || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusPill value={r.centerOpen} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono">{r.registeredChildrenCount}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono">{r.morningMealChildrenCount}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.morningMenu || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono">{r.milkPouchCount}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.afternoonMenu || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 capitalize">{r.qualityOfMeal || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 capitalize"><img src={r?.photos?.[0]?.url || 'http://localhost:5173/logo.jpg'} /></td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <ReviewActions
                        status={r.status}
                        canReview={role !== ROLES.AWC && outranks(role, ROLES.AWC)}
                        loading={reviewing}
                        onReview={(status, remarks) => reviewRecord({ id: r._id, status, remarks })}
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