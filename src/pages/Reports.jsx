import React, { useState } from "react";
import { FileSpreadsheet, FileText, RefreshCw, MapPin } from "lucide-react";
import { downloadReport } from "../utils/apiClient.js";
import { useGetHeatmapDataQuery } from "../redux/api.jsx";

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const GRADE_STYLES = {
  A: "bg-primary-light text-primary-dark",
  B: "bg-primary-light text-primary-dark",
  C: "bg-amber-100 text-amber-700",
  D: "bg-coral-light text-coral",
};

// GET /api/reports/records/excel|pdf and /api/reports/heatmap - all
// auto-scoped, every role can use these (icds-backend routes/reportRoutes.js
// has no authorize() gate, only the standard protect + scopeFilter).
export default function Reports() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [period, setPeriod] = useState(currentPeriod());
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading, isFetching, error: loadError, refetch } = useGetHeatmapDataQuery({ period });
  const points = data?.points || [];

  const query = new URLSearchParams();
  if (fromDate) query.set("fromDate", fromDate);
  if (toDate) query.set("toDate", toDate);
  const qs = query.toString();

  async function handleDownload(kind) {
    setError("");
    setDownloading(kind);
    try {
      if (kind === "excel") {
        await downloadReport("/reports/records/excel", "records-report.xlsx", qs);
      } else {
        await downloadReport("/reports/records/pdf", "records-report.pdf", qs);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading("");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">Insights</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">Reports</h1>
        <p className="mt-1 text-sm text-muted">Export worker records and view AWC performance heatmap for your scope.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card space-y-4">
        <h2 className="font-display text-lg font-extrabold text-ink">Export Worker Records</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-semibold text-muted">From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-semibold text-muted">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => handleDownload("excel")}
            disabled={downloading === "excel"}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark disabled:opacity-70"
          >
            <FileSpreadsheet size={16} />
            {downloading === "excel" ? "Preparing..." : "Download Excel"}
          </button>
          <button
            onClick={() => handleDownload("pdf")}
            disabled={downloading === "pdf"}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink shadow-soft hover:bg-bg disabled:opacity-70"
          >
            <FileText size={16} />
            {downloading === "pdf" ? "Preparing..." : "Download PDF"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold text-ink flex items-center gap-2">
            <MapPin className="text-primary" size={20} />
            AWC Performance Heatmap
          </h2>
          <div className="flex gap-2">
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
            >
              <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loadError && (
          <div className="rounded-lg border border-coral/30 bg-coral-light px-3 py-2 text-xs font-semibold text-coral">
            {loadError?.data?.message || "Could not load heatmap data."}
          </div>
        )}

        <div className="table-scroll overflow-x-auto rounded-xl border border-line">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                <th className="whitespace-nowrap px-4 py-3 font-semibold">AWC</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Score</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Grade</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Location</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">Loading...</td>
                </tr>
              ) : points.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">No graded AWCs for this period yet.</td>
                </tr>
              ) : (
                points.map((p) => (
                  <tr key={p.awcCode} className="border-b border-line last:border-0 hover:bg-primary-light/40">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">{p.awcName || p.awcCode}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono">{p.totalScore}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${GRADE_STYLES[p.grade] || "bg-bg text-muted"}`}>
                        {p.grade}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                      {p.latitude != null ? `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}` : "-"}
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
