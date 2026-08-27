import React, { useState, useEffect, useMemo } from "react";
import { Loader2, RefreshCw, Award, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth, ROLES } from "../context/AuthContext.jsx";
import { useGetGradesQuery, useGenerateGradesMutation, useUpdateGradeMutation } from "../redux/api.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const GRADE_STYLES = {
  A: "bg-primary-light text-primary-dark",
  B: "bg-blue-100 text-blue-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-coral-light text-coral",
};

const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const SCORE_FIELD_KEYS = {
  punctualityScore: "gradesPage.field.punctuality",
  submissionQualityScore: "gradesPage.field.submissionQuality",
  beneficiaryRatioScore: "gradesPage.field.beneficiaryRatio",
  taskCompletionScore: "gradesPage.field.taskCompletion",
  supervisorRemarksScore: "gradesPage.field.supervisorRemarksScore",
};

function EditGradeModal({ grade, onClose }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    punctualityScore: grade.punctualityScore,
    submissionQualityScore: grade.submissionQualityScore,
    beneficiaryRatioScore: grade.beneficiaryRatioScore,
    taskCompletionScore: grade.taskCompletionScore,
    supervisorRemarksScore: grade.supervisorRemarksScore,
    supervisorRemarks: grade.supervisorRemarks || "",
  });
  const [updateGrade, { isLoading }] = useUpdateGradeMutation();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const res = await updateGrade({ id: grade._id, ...form });
    if (!res.error) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">{t("gradesPage.adjustGrade")}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {["punctualityScore", "submissionQualityScore", "beneficiaryRatioScore", "taskCompletionScore", "supervisorRemarksScore"].map((f) => (
            <label key={f} className="block text-xs font-medium text-muted">
              {t(SCORE_FIELD_KEYS[f])}
              <input type="number" min={0} max={100} value={form[f]} onChange={set(f)} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </label>
          ))}
          <label className="block text-xs font-medium text-muted">
            {t("gradesPage.supervisorRemarks")}
            <textarea value={form.supervisorRemarks} onChange={set("supervisorRemarks")} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" rows={2} />
          </label>
          <button disabled={isLoading} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {isLoading ? <Loader2 className="mx-auto animate-spin" size={16} /> : t("gradesPage.save")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GradesPage() {
  const { t } = useLanguage();
  const { role } = useAuth();
  const [period, setPeriod] = useState(currentPeriod());
  const [editGrade, setEditGrade] = useState(null);
  const { data, isLoading } = useGetGradesQuery({ period });
  const [generateGrades, { isLoading: generating }] = useGenerateGradesMutation();

  const canManage = role !== ROLES.AWC;
  const grades = data?.grades || [];

  // ---------------------------------------------------
  // PAGINATION (same pattern as Dashboard: 10 rows/page)
  // ---------------------------------------------------

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    setPage(1);
  }, [period]);

  const totalPages = Math.max(1, Math.ceil(grades.length / rowsPerPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedGrades = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return grades.slice(start, start + rowsPerPage);
  }, [grades, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t("gradesPage.title")}</h1>
          <p className="text-sm text-muted">{t("gradesPage.sub")}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border border-line px-3 py-2 text-sm" />
          {canManage && (
            <button
              onClick={() => generateGrades(period)}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {t("gradesPage.generate")}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white shadow-soft">
        {isLoading ? (
          <p className="p-6 text-sm text-muted">{t("gradesPage.loading")}</p>
        ) : grades.length === 0 ? (
          <p className="p-6 text-sm text-muted">{t("gradesPage.noneFor")} {period} {t("gradesPage.yet")} {canManage && t("gradesPage.clickGenerate")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase text-muted">
                <tr>
                  <th className="sticky left-0 z-20 bg-surface p-3">{t("gradesPage.col.worker")}</th>
                  <th className="p-3">{t("gradesPage.col.punctuality")}</th>
                  <th className="p-3">{t("gradesPage.col.quality")}</th>
                  <th className="p-3">{t("gradesPage.col.beneficiary")}</th>
                  <th className="p-3">{t("gradesPage.col.tasks")}</th>
                  <th className="p-3">{t("gradesPage.col.total")}</th>
                  <th className="p-3">{t("gradesPage.col.grade")}</th>
                  {canManage && <th className="p-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paginatedGrades.map((g) => (
                  <tr key={g._id}>
                    <td className="sticky left-0 z-10 bg-white p-3 font-medium text-ink">{g.user?.name || "-"}</td>
                    <td className="p-3">{g.punctualityScore}</td>
                    <td className="p-3">{g.submissionQualityScore}</td>
                    <td className="p-3">{g.beneficiaryRatioScore}</td>
                    <td className="p-3">{g.taskCompletionScore}</td>
                    <td className="p-3 font-semibold">{g.totalScore}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${GRADE_STYLES[g.grade]}`}>
                        <Award size={12} /> {g.grade}
                      </span>
                    </td>
                    {canManage && (
                      <td className="p-3">
                        <button onClick={() => setEditGrade(g)} className="text-xs font-semibold text-primary-dark hover:underline">
                          {t("gradesPage.adjust")}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* =========================================
            PAGINATION
        ========================================= */}

        {grades.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
            <span className="text-xs font-medium text-muted">
              Showing {Math.min((page - 1) * rowsPerPage + 1, grades.length)}-
              {Math.min(page * rowsPerPage, grades.length)} of {grades.length}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
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
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {editGrade && <EditGradeModal grade={editGrade} onClose={() => setEditGrade(null)} />}
    </div>
  );
}