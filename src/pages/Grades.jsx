import React, { useState } from "react";
import { RefreshCw, Sparkles, Pencil, Check, X } from "lucide-react";
import { useGetGradesQuery, useGenerateGradesMutation, useUpdateGradeMutation } from "../redux/api.jsx";
import { useAuth, ROLES } from "../context/AuthContext.jsx";

const GRADE_STYLES = {
  A: "bg-primary-light text-primary-dark",
  B: "bg-primary-light text-primary-dark",
  C: "bg-amber-100 text-amber-700",
  D: "bg-coral-light text-coral",
};

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// GET /api/grades - auto-scoped, AWC sees only its own grade.
// POST /api/grades/generate + PATCH /api/grades/:id - district/block/sector
// only (AWC role cannot generate or edit grades) - mirrors gradeController.js.
export default function Grades() {
  const { role } = useAuth();
  const [period, setPeriod] = useState(currentPeriod());
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ supervisorRemarksScore: 100, supervisorRemarks: "" });
  const [error, setError] = useState("");

  const { data, isLoading, isFetching, error: loadError, refetch } = useGetGradesQuery({ period });
  const grades = data?.grades || [];

  const [generateGrades, { isLoading: generating }] = useGenerateGradesMutation();
  const [updateGrade, { isLoading: saving }] = useUpdateGradeMutation();

  const canManage = role !== ROLES.AWC;

  async function handleGenerate() {
    setError("");
    try {
      await generateGrades(period).unwrap();
      refetch();
    } catch (err) {
      setError(err?.data?.message || "Could not generate grades.");
    }
  }

  function startEdit(grade) {
    setEditingId(grade._id);
    setEditForm({
      supervisorRemarksScore: grade.supervisorRemarksScore ?? 100,
      supervisorRemarks: grade.supervisorRemarks || "",
    });
  }

  async function saveEdit(id) {
    try {
      await updateGrade({
        id,
        supervisorRemarksScore: Number(editForm.supervisorRemarksScore),
        supervisorRemarks: editForm.supervisorRemarks,
      }).unwrap();
      setEditingId(null);
    } catch (err) {
      alert(err?.data?.message || "Could not update grade.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">Performance</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">Grades</h1>
          <p className="mt-1 text-sm text-muted">{grades.length} grade(s) for {period}.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
          {canManage && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark disabled:opacity-70"
            >
              <Sparkles size={16} />
              {generating ? "Generating..." : "Generate Grades"}
            </button>
          )}
        </div>
      </div>

      {(error || loadError) && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error || loadError?.data?.message || "Could not load grades from the server."}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="table-scroll overflow-x-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Worker</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Punctuality</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Quality</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Beneficiary</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Task Completion</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Supervisor</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Total</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Grade</th>
                {canManage && <th className="whitespace-nowrap px-4 py-3 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted">Loading grades...</td>
                </tr>
              ) : grades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted">No grades found for this period.</td>
                </tr>
              ) : (
                grades.map((g) => (
                  <React.Fragment key={g._id}>
                    <tr className="border-b border-line last:border-0 hover:bg-primary-light/40">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                        {g.user?.name} <span className="font-normal text-muted">({g.user?.awcCode || g.role})</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono">{g.punctualityScore}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono">{g.submissionQualityScore}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono">{g.beneficiaryRatioScore}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono">{g.taskCompletionScore}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono">{g.supervisorRemarksScore}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-bold">{g.totalScore}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${GRADE_STYLES[g.grade] || "bg-bg text-muted"}`}>
                          {g.grade}
                        </span>
                      </td>
                      {canManage && (
                        <td className="whitespace-nowrap px-4 py-3">
                          <button onClick={() => startEdit(g)} title="Edit" className="rounded-lg p-1.5 text-primary hover:bg-primary-light">
                            <Pencil size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                    {editingId === g._id && (
                      <tr>
                        <td colSpan={9} className="bg-bg/50 px-4 py-4">
                          <div className="flex flex-wrap items-end gap-4">
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-muted">Supervisor score (0-100)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editForm.supervisorRemarksScore}
                                onChange={(e) => setEditForm((f) => ({ ...f, supervisorRemarksScore: e.target.value }))}
                                className="w-32 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                            <div className="min-w-[240px] flex-1">
                              <label className="mb-1 block text-xs font-semibold text-muted">Supervisor remarks</label>
                              <input
                                type="text"
                                value={editForm.supervisorRemarks}
                                onChange={(e) => setEditForm((f) => ({ ...f, supervisorRemarks: e.target.value }))}
                                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                            <button
                              onClick={() => saveEdit(g._id)}
                              disabled={saving}
                              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-70"
                            >
                              <Check size={14} />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-bg"
                            >
                              <X size={14} />
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
