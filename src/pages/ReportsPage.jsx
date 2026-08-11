import React, { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { downloadReport } from "../redux/api.jsx";

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [downloading, setDownloading] = useState("");

  const qs = () => {
    const p = new URLSearchParams();
    if (fromDate) p.set("fromDate", fromDate);
    if (toDate) p.set("toDate", toDate);
    return p.toString();
  };

  const handleDownload = async (type) => {
    setDownloading(type);
    try {
      if (type === "excel") await downloadReport(`/reports/records/excel?${qs()}`, "records-report.xlsx");
      else await downloadReport(`/reports/records/pdf?${qs()}`, "records-report.pdf");
    } catch (e) {
      alert("Download failed - check your connection and try again.");
    } finally {
      setDownloading("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Reports</h1>
        <p className="text-sm text-muted">Export worker records for the selected date range. Report is scoped to your role automatically.</p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-soft">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-muted">
            From date
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-muted">
            To date
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => handleDownload("excel")}
            disabled={!!downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {downloading === "excel" ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            Download Excel
          </button>
          <button
            onClick={() => handleDownload("pdf")}
            disabled={!!downloading}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
          >
            {downloading === "pdf" ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
