import React from "react";
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
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">{t("info.col.label")}</th>
                <th className="px-4 py-3 font-semibold">{t("info.col.code")}</th>
                <th className="px-4 py-3 font-semibold">{t("info.col.type")}</th>
                <th className="px-4 py-3 font-semibold">{t("info.col.required")}</th>
                <th className="px-4 py-3 font-semibold">{t("info.col.version")}</th>
                <th className="px-4 py-3 font-semibold">{t("info.col.extra")}</th>
              </tr>
            </thead>
            <tbody>
              {workerFields.map((f, i) => (
                <tr
                  key={f.code}
                  className={`border-b border-line last:border-0 ${i % 2 ? "bg-bg/50" : "bg-surface"} hover:bg-primary-light/40`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted">{i + 1}</td>
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
      </div>
    </div>
  );
}
