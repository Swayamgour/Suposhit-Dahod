import React, { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search, Trophy, X, ChevronLeft, ChevronRight, Save } from "lucide-react";
import {
  useGetGradeRankingQuery,
  useGetAwcGradeHistoryQuery,
  useRecalculateGradesMutation,
  useGetBlocksQuery,
  useGetSectorsQuery,
} from "../redux/api.jsx";
import { useAuth, ROLES } from "../context/AuthContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

// Same order/bands as the backend (config/gradeConfig.js). The backend decides every grade and rank;
// this list is only used for the filter dropdown and badge colours.
const GRADES = ["A+", "A", "B+", "B", "C", "D"];
const GRADE_STYLES = {
  "A+": "bg-primary text-white",
  A: "bg-primary-light text-primary-dark",
  "B+": "bg-blue-100 text-blue-700",
  B: "bg-sky-100 text-sky-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-coral-light text-coral",
};
const PAGE_SIZE = 50;

const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const pct = (v) => (v === null || v === undefined ? "—" : `${v}%`);

function GradeBadge({ grade }) {
  return (
    <span className={`inline-block min-w-[2.25rem] rounded-full px-2.5 py-1 text-center text-xs font-bold ${GRADE_STYLES[grade] || "bg-bg text-muted"}`}>
      {grade}
    </span>
  );
}

function RankCell({ row }) {
  const medal = { 1: "bg-amber-400 text-white", 2: "bg-slate-300 text-ink", 3: "bg-orange-300 text-white" }[row.rank];
  return (
    <div className="flex items-center gap-2">
      <span className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-1.5 text-xs font-extrabold ${medal || "bg-bg text-ink"}`}>
        {row.rank}
      </span>
    </div>
  );
}

// Month-by-month history of one AWC (GET /api/grades/awc/:awcCode)
function HistoryModal({ awc, period, onClose }) {
  const { t } = useLanguage();
  const { data, isLoading, isError } = useGetAwcGradeHistoryQuery({ awcCode: awc.awcCode, months: 6, to: period });
  const history = data?.data?.history || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-surface p-6 shadow-soft" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[12px] font-bold uppercase tracking-[0.2em] text-primary">{t("ranking.history")}</p>
            <h3 className="mt-1 text-lg font-bold text-ink">{awc.awcName}</h3>
            <p className="text-xs text-muted">{awc.awcCode} · {awc.sectorName} · {awc.blockName}</p>
          </div>
          <button onClick={onClose} aria-label={t("ranking.close")} className="rounded-lg p-1.5 text-muted hover:bg-bg">
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-coral">{t("ranking.loadError")}</p>
        ) : (
          <div className="table-scroll overflow-x-auto">
            <table className="data-table w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-semibold">{t("ranking.period")}</th>
                  <th className="px-3 py-2 font-semibold">{t("ranking.col.score")}</th>
                  <th className="px-3 py-2 font-semibold">{t("ranking.col.grade")}</th>
                  <th className="px-3 py-2 font-semibold">{t("ranking.districtRank")}</th>
                  <th className="px-3 py-2 font-semibold">{t("ranking.col.completion")}</th>
                  <th className="px-3 py-2 font-semibold">{t("ranking.col.approval")}</th>
                  <th className="px-3 py-2 font-semibold">{t("ranking.col.beneficiary")}</th>
                  <th className="px-3 py-2 font-semibold">{t("ranking.col.tasks")}</th>
                  <th className="px-3 py-2 font-semibold">{t("ranking.col.inspection")}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) =>
                  h.hasData ? (
                    <tr key={h.period} className="border-b border-line last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 font-mono">{h.period}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono font-bold">{h.score}</td>
                      <td className="px-3 py-2"><GradeBadge grade={h.grade} /></td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono">#{h.rank} <span className="text-muted">/ {h.totalRanked}</span></td>
                      <td className="px-3 py-2 font-mono">{pct(h.metrics.completionRate)}</td>
                      <td className="px-3 py-2 font-mono">{pct(h.metrics.approvalRate)}</td>
                      <td className="px-3 py-2 font-mono">{pct(h.metrics.beneficiaryRate)}</td>
                      <td className="px-3 py-2 font-mono">{pct(h.metrics.taskCompletionRate)}</td>
                      <td className="px-3 py-2 font-mono">{pct(h.metrics.inspectionScore)}</td>
                    </tr>
                  ) : (
                    <tr key={h.period} className="border-b border-line last:border-0 text-muted">
                      <td className="px-3 py-2 font-mono">{h.period}</td>
                      <td colSpan={8} className="px-3 py-2 text-xs">{t("ranking.historyNoData")}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AwcRanking() {
  const { t } = useLanguage();
  const { role } = useAuth();

  const [period, setPeriod] = useState(currentPeriod());
  const [blockCode, setBlockCode] = useState("");
  const [sectorCode, setSectorCode] = useState("");
  const [grade, setGrade] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState(null); // { ok, text }

  // Debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Any filter change goes back to page 1
  useEffect(() => setPage(1), [period, blockCode, sectorCode, grade, search]);

  const { data: blockData } = useGetBlocksQuery();
  const { data: sectorData } = useGetSectorsQuery();
  const blocks = blockData?.blocks || [];
  const sectors = useMemo(
    () => (sectorData?.sectors || []).filter((s) => !blockCode || s.blockCode === blockCode),
    [sectorData, blockCode]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useGetGradeRankingQuery({
    period,
    blockCode,
    sectorCode,
    grade,
    search,
    page,
    limit: PAGE_SIZE,
  });
  const result = data?.data;
  const rows = result?.ranking || [];
  const summary = result?.summary;
  const pagination = result?.pagination;
  const distribution = result?.gradeDistribution || {};

  const [recalculate, { isLoading: saving }] = useRecalculateGradesMutation();
  const onRecalculate = async () => {
    setNotice(null);
    try {
      await recalculate({ period }).unwrap();
      setNotice({ ok: true, text: t("ranking.recalcDone") });
    } catch (err) {
      setNotice({ ok: false, text: err?.data?.message || t("ranking.recalcError") });
    }
  };

  // Which dropdowns make sense for this role (backend scope already limits the data either way)
  const showBlockFilter = role === ROLES.DISTRICT;
  const showSectorFilter = role === ROLES.DISTRICT || role === ROLES.BLOCK;
  const geoFiltered = Boolean(blockCode || sectorCode);

  const selectCls =
    "rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">{t("ranking.eyebrow")}</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold text-ink">
            <Trophy size={22} className="text-primary" />
            {t("ranking.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("ranking.sub")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>
          <button
            onClick={onRecalculate}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark disabled:opacity-70"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? t("ranking.recalculating") : t("ranking.recalc")}
          </button>
        </div>
      </div>

      {notice && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${notice.ok ? "border-primary/30 bg-primary-light text-primary-dark" : "border-coral/30 bg-coral-light text-coral"}`}>
          {notice.text}
        </div>
      )}

      {/* Filters: month is required, everything else optional. No sector selected = all sectors ranked together. */}
      <div className="flex flex-wrap gap-2">
        <input type="month" value={period} onChange={(e) => e.target.value && setPeriod(e.target.value)} className={selectCls} aria-label={t("ranking.period")} />
        {showBlockFilter && (
          <select value={blockCode} onChange={(e) => { setBlockCode(e.target.value); setSectorCode(""); }} className={selectCls}>
            <option value="">{t("ranking.allBlocks")}</option>
            {blocks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
        )}
        {showSectorFilter && (
          <select value={sectorCode} onChange={(e) => setSectorCode(e.target.value)} className={selectCls}>
            <option value="">{t("ranking.allSectors")}</option>
            {sectors.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        )}
        <select value={grade} onChange={(e) => setGrade(e.target.value)} className={selectCls}>
          <option value="">{t("ranking.allGrades")}</option>
          {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("ranking.searchPh")}
            className={`${selectCls} w-full pl-9`}
          />
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-9">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-card xl:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("ranking.totalAwcs")}</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">{summary.totalAWCs}</p>
            <p className="text-[11px] text-muted">
              {summary.awcsWithoutSubmissions} {t("ranking.noSubs")} · {summary.totalRegisteredAWCs} total
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-card xl:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("ranking.avgScore")}</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">{summary.averageScore}</p>
          </div>
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(grade === g ? "" : g)}
              className={`rounded-2xl border p-4 text-left shadow-card transition-colors ${grade === g ? "border-primary bg-primary-light" : "border-line bg-surface hover:bg-bg"}`}
            >
              <GradeBadge grade={g} />
              <p className="mt-2 font-display text-xl font-extrabold text-ink">{distribution[g] ?? 0}</p>
            </button>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error?.data?.message || t("ranking.loadError")}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="table-scroll overflow-x-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("ranking.col.rank")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("ranking.col.awc")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("ranking.col.block")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("ranking.col.sector")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("ranking.col.completion")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("ranking.col.approval")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("ranking.col.beneficiary")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("ranking.col.tasks")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("ranking.col.inspection")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("ranking.col.score")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("ranking.col.grade")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-sm text-muted">{t("ranking.loading")}</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-sm text-muted">{t("ranking.empty")}</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.awcCode}
                    onClick={() => setSelected(r)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-primary-light/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <RankCell row={r} />
                      {geoFiltered && r.overallRank !== r.rank && (
                        <span className="mt-0.5 block text-[10px] text-muted">#{r.overallRank} {t("ranking.overall")}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                      {r.awcName} <span className="font-normal text-muted">({r.awcCode})</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{r.blockName}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.sectorName}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono">{pct(r.metrics.completionRate)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono">{pct(r.metrics.approvalRate)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono">{pct(r.metrics.beneficiaryRate)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono">{pct(r.metrics.taskCompletionRate)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono">{pct(r.metrics.inspectionScore)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-bold">{r.score}</td>
                    <td className="whitespace-nowrap px-4 py-3"><GradeBadge grade={r.grade} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-xs text-muted">{pagination.total} {t("ranking.showing")}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                {t("ranking.prev")}
              </button>
              <span className="min-w-[90px] text-center text-xs font-semibold text-ink">
                {t("ranking.page")} {pagination.page} {t("ranking.of")} {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("ranking.next")}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted">{t("ranking.naHint")}</p>

      {selected && <HistoryModal awc={selected} period={period} onClose={() => setSelected(null)} />}
    </div>
  );
}
