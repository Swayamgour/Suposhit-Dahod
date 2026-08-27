import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { workerFields } from "../components/data/mockData.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const typeStyles = {
  date: "bg-primary-light text-primary-dark",
  long: "bg-coral-light text-coral",
  number: "bg-accent-light text-accent-dark",
  list: "bg-line/60 text-ink",
  text: "bg-line/60 text-ink",
  location: "bg-primary-light text-primary-dark",
  "attributeslabel.file": "bg-accent-light text-accent-dark",
};

export default function Info() {
  const { t } = useLanguage();

  // ---------------------------------------------------
  // PAGINATION (same pattern as Dashboard: 10 rows/page)
  // ---------------------------------------------------

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const totalPages = Math.max(1, Math.ceil(workerFields.length / rowsPerPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedFields = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return workerFields.slice(start, start + rowsPerPage);
  }, [page]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">
            {t("info.eyebrow")}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
            {t("info.titleMain")} <span className="text-muted">/ {t("info.titleSub")}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">{t("info.sub")}</p>
        </div>
        <span className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold text-white">
          {workerFields.length} {t("info.fields")}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                <th className="sticky left-0 z-20 bg-bg px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">{t("info.col.label")}</th>
                <th className="px-4 py-3 font-semibold">{t("info.col.code")}</th>
                <th className="px-4 py-3 font-semibold">{t("info.col.type")}</th>
                <th className="px-4 py-3 font-semibold">{t("info.col.required")}</th>
                <th className="px-4 py-3 font-semibold">{t("info.col.version")}</th>
                <th className="px-4 py-3 font-semibold">{t("info.col.extra")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFields.map((f, i) => (
                <tr
                  key={f.code}
                  className={`border-b border-line last:border-0 ${i % 2 ? "bg-bg/50" : "bg-surface"} hover:bg-primary-light/40`}
                >
                  <td className={`sticky left-0 z-10 px-4 py-3 font-mono text-xs text-muted ${i % 2 ? "bg-bg/50" : "bg-surface"}`}>
                    {(page - 1) * rowsPerPage + i + 1}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-ink">{f.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-primary-dark">{f.code}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-1 font-mono text-[11px] font-semibold ${typeStyles[f.type] || "bg-line/60 text-ink"}`}>
                      {f.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {f.required ? (
                      <span className="font-semibold text-coral">{t("common.yes")}</span>
                    ) : (
                      <span className="text-muted">{t("common.no")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{f.version}</td>
                  <td className="max-w-[280px] px-4 py-3 text-xs text-muted">{f.extra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* =========================================
            PAGINATION
        ========================================= */}

        {workerFields.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
            <span className="text-xs font-medium text-muted">
              Showing {Math.min((page - 1) * rowsPerPage + 1, workerFields.length)}-
              {Math.min(page * rowsPerPage, workerFields.length)} of {workerFields.length}
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
    </div>
  );
}