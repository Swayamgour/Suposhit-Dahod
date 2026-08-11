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

const STATUS_STYLES = {
  open: "bg-primary-light text-primary-dark",
  completed: "bg-primary-light text-primary-dark",
  overdue: "bg-coral-light text-coral",
  cancelled: "bg-bg text-muted",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-primary-light text-primary-dark",
  rejected: "bg-coral-light text-coral",
};

function Badge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status] || "bg-bg text-muted"}`}>
      {status}
    </span>
  );
}

// Only field staff (sector, awc) ever submit task completion. district/block/
// sector (not awc) review those submissions - mirrors taskController.js /
// taskSubmissionController.js access rules exactly.
export default function Tasks() {
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
    if (!window.confirm("Cancel this task?")) return;
    try {
      await cancelTask(id).unwrap();
    } catch (err) {
      alert(err?.data?.message || "Could not cancel task.");
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
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">Tasks</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">Assigned Tasks</h1>
          <p className="mt-1 text-sm text-muted">{tasks.length} task(s) in your scope.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
          {canAssign && (
            <Link
              to="/tasks/new"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark"
            >
              <Plus size={16} />
              New Task
            </Link>
          )}
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {loadError?.data?.message || "Could not load tasks from the server."}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <div className="min-w-[180px]">
          <label className="mb-1 block text-xs font-semibold text-muted">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="table-scroll overflow-x-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Title</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Due Date</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Assigned To</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">Loading tasks...</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">No tasks found in your scope.</td>
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
                              Submit
                            </button>
                          )}
                          {task.assignedBy === user?._id && task.status === "open" && (
                            <button
                              onClick={() => handleCancel(task._id)}
                              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-coral hover:bg-coral-light"
                            >
                              <XCircle size={13} />
                              Cancel
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
                              <label className="mb-1.5 block text-sm font-medium text-ink">Notes</label>
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
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSubmitCompletion(task._id)}
                                disabled={submitting}
                                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-70"
                              >
                                {submitting ? "Submitting..." : "Submit Completion"}
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
  const { data, isLoading, refetch } = useGetTaskSubmissionsQuery({ status: "pending" });
  const submissions = data?.submissions || [];
  const [reviewSubmission] = useReviewTaskSubmissionMutation();

  async function handleReview(id, status) {
    try {
      await reviewSubmission({ id, status }).unwrap();
      refetch();
    } catch (err) {
      alert(err?.data?.message || "Could not review submission.");
    }
  }

  if (isLoading || submissions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-extrabold text-ink">Task Submissions Pending Review</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="table-scroll overflow-x-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Task</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Submitted By</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Late?</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Notes</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Actions</th>
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
                        title="Approve"
                        className="rounded-lg p-1.5 text-primary hover:bg-primary-light"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleReview(s._id, "rejected")}
                        title="Reject"
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
