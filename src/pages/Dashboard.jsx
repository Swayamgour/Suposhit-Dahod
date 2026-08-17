import React, { useEffect, useMemo, useState } from "react";
import {
  Filter,
  Building2,
  UtensilsCrossed,
  LayoutDashboard,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";

import SunArc from "../components/SunArc.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import {
  useGetDashboardQuery,
  useGetMeQuery,
  downloadReport,
} from "../redux/api.jsx";
import { ROLES } from "../context/AuthContext.jsx";

// =====================================================
// STAT CARDS
// =====================================================

const STAT_CARDS = [
  {
    key: "totalCentres",
    icon: Building2,
    tone: "primary",
    labelKey: "dash.card1",
    fallback: "Total Anganwadi Centres",
  },
  {
    key: "totalOpen",
    icon: LayoutDashboard,
    tone: "accent",
    labelKey: "dash.card2",
    fallback: "Centres Open",
  },
  {
    key: "totalFed",
    icon: UtensilsCrossed,
    tone: "coral",
    labelKey: "dash.card3",
    fallback: "Children Fed",
  },
];

// =====================================================
// LEVEL OPTIONS
// =====================================================

const LEVEL_OPTIONS = [
  {
    value: "sector",
    label: "સેક્ટર (Sector)",
  },
  {
    value: "block",
    label: "બ્લોક (Block)",
  },
  {
    value: "district",
    label: "જિલ્લો (District)",
  },
];

// =====================================================
// TABLE AGGREGATE COLUMNS
// =====================================================

const AGGREGATE_HEADERS = [
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

// =====================================================
// TABLE HEADERS
// =====================================================

function getHeaders(level) {
  const nameColumn = "dash.table.seja";

  if (level === "district") {
    return [
      nameColumn,
      "dash.table.totalBlock",
      "dash.table.totalSector",
      "dash.table.totalCentres",
      ...AGGREGATE_HEADERS,
    ];
  }

  if (level === "block") {
    return [
      nameColumn,
      "dash.table.totalSector",
      "dash.table.totalCentres",
      ...AGGREGATE_HEADERS,
    ];
  }

  return [
    nameColumn,
    "dash.table.totalCentres",
    ...AGGREGATE_HEADERS,
  ];
}

// =====================================================
// NUMBER HELPER
// =====================================================

function numberValue(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

// =====================================================
// FLATTEN API ROW
// =====================================================

function flattenRow(row, level) {
  const base = [
    row?.name || "-",
  ];

  if (level === "district") {
    base.push(
      numberValue(row?.totalBlock),
      numberValue(row?.totalSector)
    );
  }

  if (level === "block") {
    base.push(
      numberValue(row?.totalSector)
    );
  }

  base.push(
    numberValue(row?.totalAwc)
  );

  return [
    ...base,

    // AWC
    numberValue(row?.awcOpenYes),
    numberValue(row?.awcOpenNo),

    // Morning
    numberValue(
      row?.morningMealChildrenCount
    ),

    numberValue(
      row?.morningDishPhotoYes
    ),

    numberValue(
      row?.morningDishPhotoNo
    ),

    numberValue(
      row?.childrenEatingPhotoYes
    ),

    numberValue(
      row?.childrenEatingPhotoNo
    ),

    // Milk
    numberValue(
      row?.milkPouchCount
    ),

    numberValue(
      row?.milkPouchPhotoYes
    ),

    numberValue(
      row?.milkPouchPhotoNo
    ),

    // Afternoon
    numberValue(
      row?.afternoonMealChildrenCount
    ),

    numberValue(
      row?.afternoonDishPhotoYes
    ),

    numberValue(
      row?.afternoonDishPhotoNo
    ),

    numberValue(
      row?.childrenEatingAfternoonPhotoYes
    ),

    numberValue(
      row?.childrenEatingAfternoonPhotoNo
    ),

    // Poshan
    numberValue(
      row?.poshanSudhaCount
    ),

    numberValue(
      row?.poshanBenefitPhotoYes
    ),

    numberValue(
      row?.poshanBenefitPhotoNo
    ),

    // Pre-primary
    numberValue(
      row?.preEducationChildrenCount
    ),

    numberValue(
      row?.preEducationPhotoYes
    ),

    numberValue(
      row?.preEducationPhotoNo
    ),

    // Meal quality
    numberValue(
      row?.mealQualityGood
    ),

    numberValue(
      row?.mealQualityAverage
    ),

    numberValue(
      row?.mealQualityBad
    ),
  ];
}

// =====================================================
// TOTALS
// =====================================================

function computeColumnTotals(rows, level) {
  const headers = getHeaders(level);

  const totals = new Array(
    headers.length
  ).fill(0);

  rows.forEach((row) => {
    const cells = flattenRow(
      row,
      level
    );

    cells.forEach((value, index) => {
      // First column is name
      if (index === 0) return;

      totals[index] += numberValue(value);
    });
  });

  return totals;
}

// =====================================================
// COMPONENT
// =====================================================

export default function Dashboard() {
  const { t } = useLanguage();

  // ---------------------------------------------------
  // USER FILTER INPUT
  // ---------------------------------------------------

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [level, setLevel] =
    useState("sector");

  // ---------------------------------------------------
  // APPLIED FILTER
  // ---------------------------------------------------

  const [appliedFilter, setAppliedFilter] =
    useState({
      fromDate: "",
      toDate: "",
      level: "sector",
    });

  // ---------------------------------------------------
  // SEARCH
  // ---------------------------------------------------

  const [search, setSearch] =
    useState("");

  // ---------------------------------------------------
  // PAGINATION
  // ---------------------------------------------------

  const [page, setPage] =
    useState(1);

  const rowsPerPage = 10;

  // ---------------------------------------------------
  // DOWNLOAD
  // ---------------------------------------------------

  const [downloading, setDownloading] =
    useState(false);

  const [downloadError, setDownloadError] =
    useState("");

  // ---------------------------------------------------
  // PROFILE
  // ---------------------------------------------------

  const { data: profile } =
    useGetMeQuery();

  const myRole =
    profile?.user?.role;

  // AWC users should not switch
  // district/block/sector display level.
  const canSwitchLevel =
    myRole !== ROLES.AWC;

  // ---------------------------------------------------
  // DASHBOARD API
  // ---------------------------------------------------

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetDashboardQuery(
    appliedFilter
  );

  const rows =
    Array.isArray(data?.rows)
      ? data.rows
      : [];

  const activeLevel =
    data?.level ||
    appliedFilter.level ||
    "sector";

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(() => {
    return rows.reduce(
      (result, row) => {
        result.totalCentres +=
          numberValue(
            row?.totalAwc
          );

        result.totalOpen +=
          numberValue(
            row?.awcOpenYes
          );

        result.totalFed +=
          numberValue(
            row?.morningMealChildrenCount
          );

        return result;
      },
      {
        totalCentres: 0,
        totalOpen: 0,
        totalFed: 0,
      }
    );
  }, [rows]);

  // ===================================================
  // SEARCH FILTER
  // ===================================================

  const filteredRows = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      String(row?.name || "")
        .toLowerCase()
        .includes(query)
    );
  }, [rows, search]);

  // ===================================================
  // RESET PAGE
  // ===================================================

  useEffect(() => {
    setPage(1);
  }, [
    search,
    appliedFilter,
  ]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRows.length /
      rowsPerPage
    )
  );

  // Prevent invalid page
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [
    page,
    totalPages,
  ]);

  const paginatedRows =
    useMemo(() => {
      const start =
        (page - 1) *
        rowsPerPage;

      return filteredRows.slice(
        start,
        start + rowsPerPage
      );
    }, [
      filteredRows,
      page,
    ]);

  // ===================================================
  // TABLE HEADERS
  // ===================================================

  const headers = useMemo(
    () =>
      getHeaders(
        activeLevel
      ),
    [activeLevel]
  );

  // ===================================================
  // TOTAL ROW
  // ===================================================

  const columnTotals =
    useMemo(
      () =>
        computeColumnTotals(
          filteredRows,
          activeLevel
        ),
      [
        filteredRows,
        activeLevel,
      ]
    );

  // ===================================================
  // APPLY FILTER
  // ===================================================

  function applyFilter() {
    setPage(1);

    setAppliedFilter({
      fromDate:
        fromDate || "",

      toDate:
        toDate || "",

      level:
        canSwitchLevel
          ? level
          : "sector",
    });
  }

  // ===================================================
  // CLEAR FILTER
  // ===================================================

  function clearFilters() {
    setFromDate("");
    setToDate("");

    const defaultLevel =
      canSwitchLevel
        ? "sector"
        : "sector";

    setLevel(defaultLevel);

    setSearch("");

    setPage(1);

    setAppliedFilter({
      fromDate: "",
      toDate: "",
      level: defaultLevel,
    });
  }

  // ===================================================
  // DOWNLOAD EXCEL
  // ===================================================

  async function handleDownloadExcel() {
    try {
      setDownloadError("");
      setDownloading(true);

      const params =
        new URLSearchParams();

      if (
        appliedFilter.fromDate
      ) {
        params.set(
          "fromDate",
          appliedFilter.fromDate
        );
      }

      if (
        appliedFilter.toDate
      ) {
        params.set(
          "toDate",
          appliedFilter.toDate
        );
      }

      params.set(
        "level",
        appliedFilter.level
      );

      await downloadReport(
        `/reports/records/excel?${params.toString()}`,
        "dashboard-report.xlsx"
      );
    } catch (err) {
      console.error(
        "Excel download error:",
        err
      );

      setDownloadError(
        "Excel download failed. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  }

  // ===================================================
  // FORMAT NUMBER
  // ===================================================

  function formatNumber(value) {
    return numberValue(
      value
    ).toLocaleString("en-IN");
  }

  // ===================================================
  // LEVEL LABEL
  // ===================================================

  const levelLabel =
    LEVEL_OPTIONS.find(
      (item) =>
        item.value === activeLevel
    )?.label ||
    "સેક્ટર (Sector)";

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6">

      {/* =============================================
          HEADER
      ============================================= */}

      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard
              size={22}
              className="text-primary"
            />

            <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
              {t("dash.title") ||
                "Dashboard"}
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted">
            {t("dash.sub") ||
              "Anganwadi Centres detailed information"}
          </p>
        </div>

        {/* REFRESH */}
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft transition-all hover:-translate-y-0.5 hover:bg-bg hover:shadow-card disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={
              isFetching
                ? "animate-spin"
                : ""
            }
          />

          {isFetching
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* =============================================
          ERROR
      ============================================= */}

      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error?.data?.message ||
            error?.error ||
            "Could not load dashboard data from the server."}
        </div>
      )}

      {/* =============================================
          KPI / HERO
      ============================================= */}

      <div className="grid gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-glow lg:grid-cols-[auto,1fr] lg:items-center">

        {/* SUN ARC */}

        <SunArc
          percent={
            stats.totalCentres
              ? Math.round(
                (stats.totalOpen /
                  stats.totalCentres) *
                100
              )
              : 0
          }
          label={
            t("dash.sunLabel") ||
            "Centres Open"
          }
          sublabel={`${formatNumber(
            stats.totalOpen
          )} / ${formatNumber(
            stats.totalCentres
          )}`}
        />

        {/* STAT CARDS */}

        <div className="grid gap-4 sm:grid-cols-3">

          {STAT_CARDS.map(
            ({
              key,
              labelKey,
              fallback,
              icon: Icon,
              tone,
            }) => (
              <div
                key={key}
                className="rounded-xl border border-line bg-bg p-4 transition-transform hover:-translate-y-0.5"
              >
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneMap[tone]}`}
                >
                  <Icon size={17} />
                </span>

                <p className="mt-3 font-mono text-2xl font-semibold text-ink">
                  {formatNumber(
                    stats[key]
                  )}
                </p>

                <p className="mt-0.5 text-[13px] font-semibold text-ink">
                  {t(labelKey) ||
                    fallback}
                </p>
              </div>
            )
          )}

        </div>
      </div>

      {/* =============================================
          FILTERS
      ============================================= */}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">

        {/* FROM DATE */}

        <div className="min-w-[160px] flex-1">

          <label className="mb-1 block text-xs font-semibold text-muted">
            {t("dash.fromDate") ||
              "From Date"}
          </label>

          <input
            type="date"
            value={fromDate}
            max={
              toDate ||
              undefined
            }
            onChange={(event) =>
              setFromDate(
                event.target.value
              )
            }
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* TO DATE */}

        <div className="min-w-[160px] flex-1">

          <label className="mb-1 block text-xs font-semibold text-muted">
            {t("dash.toDate") ||
              "To Date"}
          </label>

          <input
            type="date"
            value={toDate}
            min={
              fromDate ||
              undefined
            }
            onChange={(event) =>
              setToDate(
                event.target.value
              )
            }
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* LEVEL */}

        {canSwitchLevel && (
          <div className="min-w-[200px] flex-1">

            <label className="mb-1 block text-xs font-semibold text-muted">
              વિસ્તાર પસંદ કરો
            </label>

            <select
              value={level}
              onChange={(event) =>
                setLevel(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {LEVEL_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>
        )}

        {/* SEARCH */}

        <div className="min-w-[200px] flex-1">

          <label className="mb-1 block text-xs font-semibold text-muted">
            Search
          </label>

          <div className="relative">

            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={`Search ${levelLabel}...`}
              className="w-full rounded-lg border border-line bg-bg py-2 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* FILTER */}

        <button
          type="button"
          onClick={
            applyFilter
          }
          disabled={
            isLoading ||
            isFetching
          }
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Filter
            size={15}
          />

          {isFetching
            ? "Loading..."
            : t("dash.filter") ||
            "Filter"}
        </button>

        {/* CLEAR */}

        <button
          type="button"
          onClick={
            clearFilters
          }
          className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-bg"
        >
          Clear
        </button>

        {/* EXCEL */}

        <button
          type="button"
          onClick={
            handleDownloadExcel
          }
          disabled={
            downloading
          }
          className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary-light px-4 py-2.5 text-sm font-semibold text-primary-dark transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {downloading ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : (
            <FileSpreadsheet
              size={15}
            />
          )}

          {downloading
            ? "Preparing..."
            : "Download Excel"}
        </button>
      </div>

      {/* =============================================
          DOWNLOAD ERROR
      ============================================= */}

      {downloadError && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {downloadError}
        </div>
      )}

      {/* =============================================
          REPORT TABLE
      ============================================= */}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">

        {/* TABLE HEADER */}

        <div className="flex items-center justify-between border-b border-line bg-primary-dark px-5 py-4">

          <div>
            <h2 className="font-display text-sm font-bold text-white">
              {t("dash.tableTitle") ||
                "આંગણવાડી કેન્દ્રોની વિગતવાર માહિતી"}
            </h2>

            <p className="mt-1 text-[11px] text-white/60">
              {levelLabel}
            </p>
          </div>

          <span className="text-xs font-medium text-white/70">
            {isLoading
              ? "Loading..."
              : `${filteredRows.length} / ${rows.length}`}
          </span>
        </div>

        {/* TABLE SCROLL */}

        <div className="table-scroll overflow-x-auto">

          <table className="data-table w-full min-w-max text-left text-sm">

            {/* HEADER */}

            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">

                {headers.map(
                  (header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`whitespace-nowrap px-4 py-3 text-center font-semibold ${index === 0
                          ? "sticky left-0 z-20 bg-bg text-left"
                          : ""
                        }`}
                    >
                      {t(header) ||
                        header}
                    </th>
                  )
                )}

              </tr>
            </thead>

            {/* BODY */}

            <tbody>

              {/* LOADING */}

              {isLoading ? (
                <tr>
                  <td
                    colSpan={
                      headers.length
                    }
                    className="px-4 py-10 text-center text-sm text-muted"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Loading dashboard...
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={
                      headers.length
                    }
                    className="px-4 py-10 text-center text-sm text-muted"
                  >
                    No records found in your scope.
                  </td>
                </tr>
              ) : (
                paginatedRows.map(
                  (row, index) => {
                    const cells =
                      flattenRow(
                        row,
                        activeLevel
                      );

                    return (
                      <tr
                        key={
                          row?.code ||
                          `row-${index}`
                        }
                        className={`border-b border-line last:border-0 transition-colors hover:bg-primary-light/40 ${index % 2
                            ? "bg-bg/50"
                            : "bg-surface"
                          }`}
                      >
                        {cells.map(
                          (
                            value,
                            cellIndex
                          ) => (
                            <td
                              key={
                                cellIndex
                              }
                              className={`whitespace-nowrap px-4 py-3 text-center font-mono text-ink ${cellIndex ===
                                  0
                                  ? `sticky left-0 z-10 text-left font-sans font-semibold ${index % 2
                                    ? "bg-bg/50"
                                    : "bg-surface"
                                  }`
                                  : ""
                                }`}
                            >
                              {cellIndex ===
                                0
                                ? value
                                : formatNumber(
                                  value
                                )}
                            </td>
                          )
                        )}
                      </tr>
                    );
                  }
                )
              )}

            </tbody>

            {/* =======================================
                TOTAL
            ======================================= */}

            {filteredRows.length >
              0 &&
              !isLoading && (
                <tfoot>

                  <tr className="border-t-2 border-primary bg-primary-light/60 font-semibold">

                    {columnTotals.map(
                      (
                        total,
                        index
                      ) => (
                        <td
                          key={
                            index
                          }
                          className={`whitespace-nowrap px-4 py-3 text-center font-mono text-primary-dark ${index ===
                              0
                              ? "sticky left-0 z-10 bg-primary-light/60 text-left font-sans font-bold"
                              : ""
                            }`}
                        >
                          {index ===
                            0
                            ? t(
                              "dash.total"
                            ) ||
                            "Total"
                            : formatNumber(
                              total
                            )}
                        </td>
                      )
                    )}

                  </tr>

                </tfoot>
              )}

          </table>
        </div>

        {/* =========================================
            PAGINATION
        ========================================= */}

        {filteredRows.length >
          0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">

              <span className="text-xs font-medium text-muted">
                Showing{" "}
                {Math.min(
                  (page - 1) *
                  rowsPerPage +
                  1,
                  filteredRows.length
                )}
                -
                {Math.min(
                  page *
                  rowsPerPage,
                  filteredRows.length
                )}{" "}
                of{" "}
                {
                  filteredRows.length
                }
              </span>

              <div className="flex items-center gap-2">

                {/* PREVIOUS */}

                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                  disabled={
                    page === 1
                  }
                  className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={14}
                  />

                  Prev
                </button>

                {/* PAGE */}

                <span className="min-w-[90px] text-center text-xs font-semibold text-ink">
                  Page{" "}
                  {page}{" "}
                  of{" "}
                  {totalPages}
                </span>

                {/* NEXT */}

                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.min(
                          totalPages,
                          current + 1
                        )
                    )
                  }
                  disabled={
                    page ===
                    totalPages
                  }
                  className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next

                  <ChevronRight
                    size={14}
                  />
                </button>

              </div>
            </div>
          )}

      </div>

    </div>
  );
}

// =====================================================
// TONE MAP
// =====================================================

const toneMap = {
  primary:
    "bg-primary-light text-primary-dark",

  accent:
    "bg-accent-light text-accent-dark",

  coral:
    "bg-coral-light text-coral",
};