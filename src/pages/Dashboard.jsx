import React, { useMemo, useState } from "react";
import { Filter, Building2, UtensilsCrossed, LayoutDashboard, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import SunArc from "../components/SunArc.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useGetDashboardQuery, useGetMeQuery } from "../redux/api.jsx";

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

// Column set matches exactly what GET /api/dashboard returns per sector row
// (see icds-backend/controllers/dashboardController.js -> `sectors` mapping).
const headers = [
  "dash.table.seja",
  "dash.table.totalCentres",
  "dash.table.isOpenYes",
  "dash.table.isOpenNo",
  "dash.table.morningSnackCount",
  "dash.table.morningSnackDishYes",
  "dash.table.morningSnackDishNo",
  "dash.table.morningSnackKidsYes",
  "dash.table.morningSnackKidsNo",
  "dash.table.milkSanjivaniCount",
  "dash.table.milkSanjivaniYes",
  "dash.table.milkSanjivaniNo",
  "dash.table.afternoonSnackCount",
  "dash.table.afternoonSnackDishYes",
  "dash.table.afternoonSnackDishNo",
  "dash.table.afternoonSnackKidsYes",
  "dash.table.afternoonSnackKidsNo",
  "dash.table.poshanSudhaCount",
  "dash.table.poshanSudhaYes",
  "dash.table.poshanSudhaNo",
  "dash.table.preprimaryCount",
  "dash.table.preprimaryYes",
  "dash.table.preprimaryNo",
  "dash.table.foodQualityGood",
  "dash.table.foodQualityMedium",
  "dash.table.foodQualityBad",
];

function flattenRow(row) {
  return [
    row.sectorName,
    row.totalAwc,
    row.awcOpenYes,
    row.awcOpenNo,
    row.morningMealChildrenCount,
    row.morningDishPhotoYes,
    row.morningDishPhotoNo,
    row.childrenEatingPhotoYes,
    row.childrenEatingPhotoNo,
    row.milkPouchCount,
    row.milkPouchPhotoYes,
    row.milkPouchPhotoNo,
    row.afternoonMealChildrenCount,
    row.afternoonDishPhotoYes,
    row.afternoonDishPhotoNo,
    row.childrenEatingAfternoonPhotoYes,
    row.childrenEatingAfternoonPhotoNo,
    row.poshanSudhaCount,
    row.poshanBenefitPhotoYes,
    row.poshanBenefitPhotoNo,
    row.preEducationChildrenCount,
    row.preEducationPhotoYes,
    row.preEducationPhotoNo,
    row.mealQualityGood,
    row.mealQualityAverage,
    row.mealQualityBad,
  ];
}

function computeColumnTotals(rows) {
  const totals = new Array(headers.length).fill(0);
  rows.forEach((row) => {
    const cells = flattenRow(row);
    cells.forEach((val, idx) => {
      if (idx === 0) return; // skip sector name column
      totals[idx] += val ?? 0;
    });
  });
  return totals;
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedRange, setAppliedRange] = useState({ fromDate: "", toDate: "" });
  const [area, setArea] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // GET /api/dashboard?fromDate=&toDate= - auto-scoped server-side by role
  const { data, isLoading, isFetching, error, refetch } = useGetDashboardQuery(appliedRange);
  const sectors = data?.sectors || [];


  const { data: profile } = useGetMeQuery()
  console.log(data)

  const stats = useMemo(() => {
    const totalCentres = sectors.reduce((s, r) => s + (r.totalAwc || 0), 0);
    const totalOpen = sectors.reduce((s, r) => s + (r.awcOpenYes || 0), 0);
    const totalFed = sectors.reduce((s, r) => s + (r.morningMealChildrenCount || 0), 0);
    return { totalCentres, totalOpen, totalFed };
  }, [sectors]);

  const filteredRows = useMemo(() => {
    return sectors.filter((row) => {
      const matchesArea = area ? row.sectorName === area : true;
      const matchesSearch = search
        ? row.sectorName?.toLowerCase().includes(search.toLowerCase())
        : true;
      return matchesArea && matchesSearch;
    });
  }, [sectors, area, search]);

  // Reset page whenever filters/date-range change the result set
  React.useEffect(() => {
    setPage(1);
  }, [area, search, appliedRange]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page]);

  // Totals are computed over ALL filtered rows, not just the visible page
  const columnTotals = useMemo(() => computeColumnTotals(filteredRows), [filteredRows]);

  function applyFilter() {
    setAppliedRange({ fromDate, toDate });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">{t("dash.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("dash.sub")}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-bg hover:shadow-card active:translate-y-0"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          {t("dash.download") /* refresh action, kept existing label key */}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error?.data?.message || "Could not load dashboard data from the server."}
        </div>
      )}

      {/* Hero: sunrise-arc + KPI cards */}
      <div className="grid gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-glow lg:grid-cols-[auto,1fr] lg:items-center">
        <SunArc
          percent={stats.totalCentres ? Math.round((stats.totalOpen / stats.totalCentres) * 100) : 0}
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
                {(stats[key] || 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-0.5 text-[13px] font-semibold text-ink">{t(labelKey)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters - fromDate/toDate map straight onto GET /api/dashboard query params */}
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
            {sectors.map((r) => (
              <option key={r.sectorCode} value={r.sectorName}>
                {r.sectorName}
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
        <button
          onClick={applyFilter}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-primary-dark active:translate-y-0"
        >
          <Filter size={15} />
          {t("dash.filter")}
        </button>
      </div>

      {/* Full data table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="border-b border-line bg-primary-dark px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-white">{t("dash.tableTitle")}</h2>
          <span className="text-xs font-medium text-white/70">
            {isLoading ? "..." : `${filteredRows.length} / ${sectors.length} sectors`}
          </span>
        </div>
        <div className="table-scroll overflow-x-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                {headers.map((h, idx) => (
                  <th
                    key={idx}
                    className={`whitespace-nowrap px-4 py-3 font-semibold ${idx === 0 ? "sticky left-0 z-10 bg-bg" : ""
                      }`}
                  >
                    {t(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={headers.length} className="px-4 py-8 text-center text-sm text-muted">
                    Loading dashboard...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="px-4 py-8 text-center text-sm text-muted">
                    No sectors found in your scope.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, i) => {
                  const cells = flattenRow(row);
                  return (
                    <tr
                      key={row.sectorCode}
                      className={`border-b border-line last:border-0 ${i % 2 ? "bg-bg/50" : "bg-surface"
                        } transition-colors hover:bg-primary-light/40`}
                    >
                      {cells.map((val, idx) => (
                        <td
                          key={idx}
                          className={`whitespace-nowrap px-4 py-3 font-mono text-ink ${idx === 0
                            ? `sticky left-0 z-10 ${i % 2 ? "bg-bg/50" : "bg-surface"} font-sans font-semibold text-ink`
                            : ""
                            }`}
                        >
                          {val === null || val === undefined ? "-" : val}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-primary bg-primary-light/60 font-semibold">
                  {columnTotals.map((total, idx) => (
                    <td
                      key={idx}
                      className={`whitespace-nowrap px-4 py-3 font-mono text-primary-dark ${idx === 0
                        ? "sticky left-0 z-10 bg-primary-light/60 font-sans font-bold"
                        : ""
                        }`}
                    >
                      {idx === 0 ? t("dash.total") || "Total" : total.toLocaleString("en-IN")}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination controls */}
        {filteredRows.length > 0 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <span className="text-xs font-medium text-muted">
              Showing {(page - 1) * rowsPerPage + 1}-
              {Math.min(page * rowsPerPage, filteredRows.length)} of {filteredRows.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <span className="text-xs font-semibold text-ink">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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