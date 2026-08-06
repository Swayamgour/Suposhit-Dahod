import React, { useMemo, useState } from "react";
import { Download, Filter, Building2, UtensilsCrossed, Camera, LayoutDashboard, Search } from "lucide-react";
import SunArc from "../components/SunArc.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { headers, table } from "../components/data/data.js";

const statCards = [
  { key: "totalCentres", icon: Building2, tone: "primary", labelKey: "dash.card1" },
  { key: "totalOpen", icon: LayoutDashboard, tone: "accent", labelKey: "dash.card2" },
  { key: "totalFed", icon: UtensilsCrossed, tone: "coral", labelKey: "dash.card3" },
];

const toneMap = {
  primary: "bg-primary-light text-primary-dark",
  accent: "bg-accent-light text-accent-dark",
  coral: "bg-coral-light text-coral",
};

// row object -> flat array in exact `headers` order
function flattenRow(row) {
  return [
    row.no,
    row.seja,
    row.totalCenters,
    row.isOpen?.yes,
    row.isOpen?.no,
    row.morningSnack?.childrenCount,
    row.morningSnack?.dishPhoto?.yes,
    row.morningSnack?.dishPhoto?.no,
    row.morningSnack?.childrenPhoto?.yes,
    row.morningSnack?.childrenPhoto?.no,
    row.milkSanjivani?.beneficiaries,
    row.milkSanjivani?.photo?.yes,
    row.milkSanjivani?.photo?.no,
    row.afternoonSnack?.childrenCount,
    row.afternoonSnack?.dishPhoto?.yes,
    row.afternoonSnack?.dishPhoto?.no,
    row.afternoonSnack?.childrenPhoto?.yes,
    row.afternoonSnack?.childrenPhoto?.no,
    row.poshanSudha?.beneficiaries,
    row.poshanSudha?.photo?.yes,
    row.poshanSudha?.photo?.no,
    row.prePrimaryEducation?.children,
    row.prePrimaryEducation?.photo?.yes,
    row.prePrimaryEducation?.photo?.no,
    row.foodQuality?.good,
    row.foodQuality?.medium,
    row.foodQuality?.bad,
  ];
}

// safe sum, ignores null
const sum = (arr, pick) => arr.reduce((acc, r) => acc + (pick(r) ?? 0), 0);

// column-wise totals across given rows (index 0,1 = No/Seja -> skip)


export default function Dashboard() {
  const { t } = useLanguage();
  const [fromDate, setFromDate] = useState("2026-08-03");
  const [toDate, setToDate] = useState("");
  const [area, setArea] = useState("");
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    return {
      totalCentres: sum(table, (r) => r.totalCenters),
      totalOpen: sum(table, (r) => r.isOpen?.yes),
      totalClosed: sum(table, (r) => r.isOpen?.no),
      totalFed:
        sum(table, (r) => r.morningSnack?.childrenCount) +
        sum(table, (r) => r.afternoonSnack?.childrenCount),
    };
  }, []);

  const filteredRows = useMemo(() => {
    return table.filter((row) => {
      const matchesArea = area ? row.seja === area : true;
      const matchesSearch = search
        ? row.seja.toLowerCase().includes(search.toLowerCase())
        : true;
      return matchesArea && matchesSearch;
    });
  }, [area, search]);

  function computeColumnTotals(rows) {
    const totals = new Array(headers.length).fill(0);
    rows.forEach((row) => {
      const cells = flattenRow(row);
      cells.forEach((val, idx) => {
        if (idx < 2) return; // skip No. and સેજા columns
        totals[idx] += val ?? 0;
      });
    });
    return totals;
  }
  const columnTotals = useMemo(() => computeColumnTotals(filteredRows), [filteredRows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">
            {t("dash.overview")}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">{t("dash.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("dash.sub")}</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-bg hover:shadow-card active:translate-y-0">
          <Download size={16} />
          {t("dash.download")}
        </button>
      </div>

      {/* Hero: sunrise-arc + KPI cards */}
      <div className="grid gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-glow lg:grid-cols-[auto,1fr] lg:items-center">
        <SunArc
          percent={Math.round((stats.totalOpen / stats.totalCentres) * 100)}
          label={t("dash.sunLabel")}
          sublabel={`${stats.totalOpen} / ${stats.totalCentres}`}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {statCards.map(({ key, labelKey, icon: Icon, tone }) => (
            <div
              key={key}
              className="rounded-xl border border-line bg-bg p-4 transition-transform hover:-translate-y-0.5"
            >
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneMap[tone]}`}>
                <Icon size={17} />
              </span>
              <p className="mt-3 font-mono text-2xl font-semibold text-ink">
                {stats[key].toLocaleString("en-IN")}
              </p>
              <p className="mt-0.5 text-[13px] font-semibold text-ink">{t(labelKey)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">{t("dash.fromDate")}</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">{t("dash.toDate")}</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="min-w-[220px] flex-[1.4]">
          <label className="mb-1 block text-xs font-semibold text-muted">{t("dash.area")}</label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">{t("dash.areaPlaceholder")}</option>
            {table.map((r) => (
              <option key={r.no} value={r.seja}>
                {r.seja}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-muted">Search સેજા</label>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sector..."
              className="w-full rounded-lg border border-line bg-bg py-2 pl-9 pr-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-primary-dark active:translate-y-0">
          <Filter size={15} />
          {t("dash.filter")}
        </button>
      </div>

      {/* Full data table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="border-b border-line bg-primary-dark px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-white">{t("dash.tableTitle")}</h2>
          <span className="text-xs font-medium text-white/70">
            {filteredRows.length} / {table.length} sectors
          </span>
        </div>
        <div className="table-scroll overflow-x-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                {headers.map((h, idx) => (
                  <th
                    key={idx}
                    className={`whitespace-nowrap px-4 py-3 font-semibold ${idx === 0
                      ? "sticky left-0 z-10 bg-bg"
                      : idx === 1
                        ? "sticky left-[60px] z-10 bg-bg"
                        : ""
                      }`}
                  >
                    {t(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, i) => {
                const cells = flattenRow(row);
                return (
                  <tr
                    key={row.no}
                    className={`border-b border-line last:border-0 ${i % 2 ? "bg-bg/50" : "bg-surface"
                      } transition-colors hover:bg-primary-light/40`}
                  >
                    {cells.map((val, idx) => (
                      <td
                        key={idx}
                        className={`whitespace-nowrap px-4 py-3 font-mono text-ink ${idx === 0
                          ? `sticky left-0 z-10 ${i % 2 ? "bg-bg/50" : "bg-surface"} text-xs text-muted`
                          : idx === 1
                            ? `sticky left-[60px] z-10 ${i % 2 ? "bg-bg/50" : "bg-surface"} font-sans font-semibold text-ink`
                            : ""
                          }`}
                      >
                        {val === null || val === undefined ? "-" : val}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary bg-primary-light/60 font-semibold">
                {columnTotals.map((total, idx) => (
                  <td
                    key={idx}
                    className={`whitespace-nowrap px-4 py-3 font-mono text-primary-dark ${idx === 0
                      ? "sticky left-0 z-10 bg-primary-light/60 text-xs uppercase text-primary-dark"
                      : idx === 1
                        ? "sticky left-[60px] z-10 bg-primary-light/60 font-sans font-bold"
                        : ""
                      }`}
                  >
                    {idx === 0 ? "" : idx === 1 ? t("dash.total") || "Total" : total.toLocaleString("en-IN")}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}