import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw, XCircle, Send, Check, X as XIcon } from "lucide-react";
import ProofCapture from "../components/ProofCapture.jsx";
import {
  useGetTasksQuery,
  useCancelTaskMutation,
  useCreateTaskSubmissionMutation,
  useGetTaskSubmissionsQuery,
  useReviewTaskSubmissionMutation,
} from "../redux/api.jsx";
import { useAuth, ROLES } from "../context/AuthContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const STATUS_STYLES = {
  open: "bg-primary-light text-primary-dark",
  completed: "bg-primary-light text-primary-dark",
  overdue: "bg-coral-light text-coral",
  cancelled: "bg-bg text-muted",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-primary-light text-primary-dark",
  rejected: "bg-coral-light text-coral",
};

const STATUS_LABEL_KEYS = {
  open: "tasks.status.open",
  completed: "tasks.status.completed",
  overdue: "tasks.status.overdue",
  cancelled: "tasks.status.cancelled",
  pending: "tasks.status.pending",
  approved: "tasks.status.approved",
  rejected: "tasks.status.rejected",
};

function Badge({ status }) {
  const { t } = useLanguage();
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status] || "bg-bg text-muted"}`}>
      {STATUS_LABEL_KEYS[status] ? t(STATUS_LABEL_KEYS[status]) : status}
    </span>
  );
}

// Only field staff (sector, awc) ever submit task completion. district/block/
// sector (not awc) review those submissions - mirrors taskController.js /
// taskSubmissionController.js access rules exactly.
export default function Tasks() {
  const { t } = useLanguage();
  const { role, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  const [proof, setProof] = useState({ photos: [] });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading, isFetching, error: loadError, refetch } = useGetTasksQuery({ status: statusFilter });
  const tasks = data?.tasks || [];

  const [cancelTask] = useCancelTaskMutation();
  const [createSubmission, { isLoading: submitting }] = useCreateTaskSubmissionMutation();

  const canAssign = role !== ROLES.AWC;
  const canSubmit = [ROLES.SECTOR, ROLES.AWC].includes(role);
  const canReview = role !== ROLES.AWC;

  const myScopeCode = { block: user?.blockCode, sector: user?.sectorCode, awc: user?.awcCode }[role];

  function isMine(task) {
    return (
      task.assignedToUser?._id === user?._id ||
      task.assignedToUser === user?._id ||
      (task.assignedToRole === role && task.assignedToScopeCode === myScopeCode)
    );
  }

  async function handleCancel(id) {
    if (!window.confirm(t("tasks.confirmCancel"))) return;
    try {
      await cancelTask(id).unwrap();
    } catch (err) {
      alert(err?.data?.message || t("tasks.cancelError"));
    }
  }

  function openSubmit(taskId) {
    setSubmittingTaskId(taskId);
    setProof({ photos: [] });
    setNotes("");
    setError("");
  }

  async function handleSubmitCompletion(taskId) {
    setError("");
    try {
      await createSubmission({ taskId, notes, ...proof }).unwrap();
      setSubmittingTaskId(null);
    } catch (err) {
      setError(err?.data?.message || "Could not submit task completion.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">{t("tasks.eyebrow")}</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">{t("tasks.title")}</h1>
          <p className="mt-1 text-sm text-muted">{tasks.length} {t("tasks.countSuffix")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            {t("tasks.refresh")}
          </button>
          {canAssign && (
            <Link
              to="/tasks/new"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark"
            >
              <Plus size={16} />
              {t("tasks.newTask")}
            </Link>
          )}
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {loadError?.data?.message || t("tasks.loadError")}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <div className="min-w-[180px]">
          <label className="mb-1 block text-xs font-semibold text-muted">{t("tasks.status")}</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">{t("tasks.allStatuses")}</option>
            <option value="open">{t("tasks.status.open")}</option>
            <option value="completed">{t("tasks.status.completed")}</option>
            <option value="overdue">{t("tasks.status.overdue")}</option>
            <option value="cancelled">{t("tasks.status.cancelled")}</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="table-scroll overflow-x-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("tasks.col.title")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("tasks.col.dueDate")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("tasks.col.assignedTo")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("tasks.col.status")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("tasks.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">{t("tasks.loading")}</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">{t("tasks.empty")}</td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <React.Fragment key={task._id}>
                    <tr className="border-b border-line last:border-0 hover:bg-primary-light/40">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">{task.title}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono">
                        {new Date(task.dueDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {task.assignedToUser?.name || (task.assignedToRole ? `Every ${task.assignedToRole} in ${task.assignedToScopeCode}` : "-")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge status={task.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          {canSubmit && isMine(task) && ["open", "overdue"].includes(task.status) && (
                            <button
                              onClick={() => openSubmit(task._id)}
                              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-dark"
                            >
                              <Send size={13} />
                              {t("tasks.submit")}
                            </button>
                          )}
                          {task.assignedBy === user?._id && task.status === "open" && (
                            <button
                              onClick={() => handleCancel(task._id)}
                              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-coral hover:bg-coral-light"
                            >
                              <XCircle size={13} />
                              {t("tasks.cancel")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {submittingTaskId === task._id && (
                      <tr>
                        <td colSpan={5} className="bg-bg/50 px-4 py-5">
                          <div className="space-y-4">
                            {error && (
                              <div className="rounded-lg border border-coral/30 bg-coral-light px-3 py-2 text-xs font-semibold text-coral">
                                {error}
                              </div>
                            )}
                            <ProofCapture value={proof} onChange={setProof} />
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-ink">{t("tasks.notes")}</label>
                              <textarea
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setSubmittingTaskId(null)}
                                className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-bg"
                              >
                                {t("tasks.cancel")}
                              </button>
                              <button
                                onClick={() => handleSubmitCompletion(task._id)}
                                disabled={submitting}
                                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-70"
                              >
                                {submitting ? t("tasks.submitting") : t("tasks.submitCompletion")}
                              </button>
                            </div>
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

      {canReview && <SubmissionsToReview />}
    </div>
  );
}

// Submissions pending review, for district/block/sector - mirrors
// taskSubmissionController.reviewTaskSubmission (AWC cannot review).
function SubmissionsToReview() {
  const { t } = useLanguage();
  const { data, isLoading, refetch } = useGetTaskSubmissionsQuery({ status: "pending" });
  const submissions = data?.submissions || [];
  const [reviewSubmission] = useReviewTaskSubmissionMutation();

  async function handleReview(id, status) {
    try {
      await reviewSubmission({ id, status }).unwrap();
      refetch();
    } catch (err) {
      alert(err?.data?.message || t("tasks.reviewError"));
    }
  }

  if (isLoading || submissions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-extrabold text-ink">{t("tasks.pendingReviewTitle")}</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="table-scroll overflow-x-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("tasks.col.task")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("tasks.col.submittedBy")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("tasks.col.late")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("tasks.col.notes")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("tasks.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s._id} className="border-b border-line last:border-0 hover:bg-primary-light/40">
                  <td className="whitespace-nowrap px-4 py-3">{s.task?.title || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3">{s.submittedBy?.name} ({s.submittedBy?.role})</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge status={s.submittedLate ? "rejected" : "approved"} />
                  </td>
                  <td className="px-4 py-3 text-muted">{s.notes || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReview(s._id, "approved")}
                        title={t("tasks.approve")}
                        className="rounded-lg p-1.5 text-primary hover:bg-primary-light"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleReview(s._id, "rejected")}
                        title={t("tasks.reject")}
                        className="rounded-lg p-1.5 text-coral hover:bg-coral-light"
                      >
                        <XIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
