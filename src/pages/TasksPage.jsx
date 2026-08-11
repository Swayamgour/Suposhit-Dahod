import React, { useState } from "react";
import { Plus, X, Loader2, CalendarClock, User as UserIcon } from "lucide-react";
import { useAuth, ROLES, ROLE_ORDER, outranks } from "../context/AuthContext.jsx";
import PhotoGpsCapture from "../components/PhotoGpsCapture.jsx";
import { StatusBadge, ReviewActions } from "../components/ApprovalStatus.jsx";
import {
  useGetTasksQuery,
  useCreateTaskMutation,
  useCancelTaskMutation,
  useGetTaskSubmissionsQuery,
  useCreateTaskSubmissionMutation,
  useReviewTaskSubmissionMutation,
  useGetUsersQuery,
} from "../redux/api.jsx";

const STATUS_STYLES = {
  open: "bg-blue-100 text-blue-700",
  completed: "bg-primary-light text-primary-dark",
  overdue: "bg-coral-light text-coral",
  cancelled: "bg-gray-100 text-gray-500",
};

function CreateTaskModal({ onClose }) {
  const { role } = useAuth();
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", targetType: "group", assignedToUser: "", assignedToRole: "", assignedToScopeCode: "" });
  const [createTask, { isLoading, error }] = useCreateTaskMutation();
  const { data: usersData } = useGetUsersQuery({});

  // Can only assign to roles below your own level
  const assignableRoles = ROLE_ORDER.slice(ROLE_ORDER.indexOf(role) + 1);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const body = {
      title: form.title,
      description: form.description,
      dueDate: form.dueDate,
    };
    if (form.targetType === "individual") body.assignedToUser = form.assignedToUser;
    else {
      body.assignedToRole = form.assignedToRole;
      body.assignedToScopeCode = form.assignedToScopeCode;
    }
    const res = await createTask(body);
    if (!res.error) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">New Task</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input required placeholder="Title" value={form.title} onChange={set("title")} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
          <textarea placeholder="Description" value={form.description} onChange={set("description")} className="w-full rounded-lg border border-line px-3 py-2 text-sm" rows={2} />
          <input required type="date" value={form.dueDate} onChange={set("dueDate")} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />

          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={form.targetType === "group"} onChange={() => setForm((f) => ({ ...f, targetType: "group" }))} />
              Whole group
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={form.targetType === "individual"} onChange={() => setForm((f) => ({ ...f, targetType: "individual" }))} />
              One person
            </label>
          </div>

          {form.targetType === "group" ? (
            <div className="grid grid-cols-2 gap-2">
              <select required value={form.assignedToRole} onChange={set("assignedToRole")} className="rounded-lg border border-line px-3 py-2 text-sm">
                <option value="">Role...</option>
                {assignableRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input required placeholder="Scope code (block/sector/awc)" value={form.assignedToScopeCode} onChange={set("assignedToScopeCode")} className="rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
          ) : (
            <select required value={form.assignedToUser} onChange={set("assignedToUser")} className="w-full rounded-lg border border-line px-3 py-2 text-sm">
              <option value="">Select person...</option>
              {(usersData?.users || []).filter((u) => ROLE_ORDER.indexOf(u.role) > ROLE_ORDER.indexOf(role)).map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
              ))}
            </select>
          )}

          {error && <p className="text-xs text-coral">{error.data?.message || "Failed to create task"}</p>}

          <button disabled={isLoading} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {isLoading ? <Loader2 className="mx-auto animate-spin" size={16} /> : "Create Task"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SubmitTaskModal({ task, onClose }) {
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [createSubmission, { isLoading, error }] = useCreateTaskSubmissionMutation();

  const submit = async (e) => {
    e.preventDefault();
    const res = await createSubmission({
      taskId: task._id,
      notes,
      checkInLatitude: location?.latitude,
      checkInLongitude: location?.longitude,
      photos,
    });
    if (!res.error) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">Complete: {task.title}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 text-sm" rows={2} />
          <PhotoGpsCapture photos={photos} onPhotosChange={setPhotos} onLocationChange={setLocation} />
          {error && <p className="text-xs text-coral">{error.data?.message || "Submission failed"}</p>}
          <button disabled={isLoading} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {isLoading ? <Loader2 className="mx-auto animate-spin" size={16} /> : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { role, user } = useAuth();
  const canAssign = role !== ROLES.AWC;
  const canSubmit = [ROLES.SECTOR, ROLES.AWC].includes(role);
  const canReview = role !== ROLES.AWC;

  const { data, isLoading } = useGetTasksQuery({});
  const { data: subsData } = useGetTaskSubmissionsQuery({}, { skip: !canReview });
  const [cancelTask] = useCancelTaskMutation();
  const [reviewSubmission, { isLoading: reviewing }] = useReviewTaskSubmissionMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [submitTask, setSubmitTask] = useState(null);

  const tasks = data?.tasks || [];
  const submissions = subsData?.submissions || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Tasks</h1>
          <p className="text-sm text-muted">Assigned work with due dates, GPS check-in, and photo proof.</p>
        </div>
        {canAssign && (
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white">
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-white shadow-soft">
        {isLoading ? (
          <p className="p-6 text-sm text-muted">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="p-6 text-sm text-muted">No tasks yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {tasks.map((t) => (
              <li key={t._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-ink">{t.title}</p>
                  <p className="text-xs text-muted">{t.description}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <CalendarClock size={12} /> Due {new Date(t.dueDate).toLocaleDateString("en-IN")}
                    {t.assignedToUser && <><UserIcon size={12} className="ml-2" /> {t.assignedToUser.name}</>}
                    {t.assignedToRole && ` -> all ${t.assignedToRole} in ${t.assignedToScopeCode}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[t.status]}`}>{t.status}</span>
                  {canSubmit && t.status === "open" && (
                    <button onClick={() => setSubmitTask(t)} className="rounded-lg bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary-dark">
                      Submit
                    </button>
                  )}
                  {canAssign && String(t.assignedBy) === String(user?._id) && t.status === "open" && (
                    <button onClick={() => cancelTask(t._id)} className="rounded-lg bg-coral-light px-3 py-1.5 text-xs font-semibold text-coral">
                      Cancel
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canReview && (
        <div className="rounded-2xl border border-line bg-white shadow-soft">
          <h2 className="border-b border-line p-4 font-display text-lg font-bold text-ink">Submissions to Review</h2>
          {submissions.length === 0 ? (
            <p className="p-6 text-sm text-muted">No submissions yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {submissions.map((s) => (
                <li key={s._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-ink">{s.task?.title}</p>
                    <p className="text-xs text-muted">{s.submittedBy?.name} ({s.submittedBy?.role}) - {s.notes}</p>
                    {s.submittedLate && <span className="text-xs text-coral">Submitted late</span>}
                  </div>
                  <ReviewActions
                    status={s.status}
                    canReview={outranks(role, s.submittedBy?.role)}
                    loading={reviewing}
                    onReview={(status, remarks) => reviewSubmission({ id: s._id, status, remarks })}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
      {submitTask && <SubmitTaskModal task={submitTask} onClose={() => setSubmitTask(null)} />}
    </div>
  );
}
