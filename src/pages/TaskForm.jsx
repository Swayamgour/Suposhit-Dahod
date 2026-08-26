import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { List, Check, X } from "lucide-react";
import {
  useCreateTaskMutation,
  useGetUsersQuery,
  useGetBlocksQuery,
  useGetSectorsQuery,
  useGetAwcsQuery,
} from "../redux/api.jsx";
import { useAuth, ROLE_ORDER, ROLE_LABELS } from "../context/AuthContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

// POST /api/tasks - district/block/sector only (AWC cannot assign tasks).
// A creator can only assign to roles below their own level, and either to
// one specific user OR to an entire role+scope group - mirrors
// icds-backend/controllers/taskController.js createTask exactly.
export default function TaskForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { role: myRole } = useAuth();
  const [error, setError] = useState("");
  const [createTask, { isLoading: saving }] = useCreateTaskMutation();

  const rolesBelow = ROLE_ORDER.slice(ROLE_ORDER.indexOf(myRole) + 1);

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    mode: "user", // "user" | "group"
    assignedToUser: "",
    assignedToRole: rolesBelow[0] || "",
    assignedToScopeCode: "",
  });

  const set = (key) => (e) => {
    const val = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const { data: usersData } = useGetUsersQuery({ role: form.mode === "user" ? undefined : undefined });
  const users = (usersData?.users || []).filter((u) => rolesBelow.includes(u.role));

  const { data: blockData } = useGetBlocksQuery();
  const { data: sectorData } = useGetSectorsQuery();
  const { data: awcData } = useGetAwcsQuery();

  const scopeOptions = useMemo(() => {
    if (form.assignedToRole === "block") return (blockData?.blocks || []).map((b) => ({ code: b.code, name: b.name }));
    if (form.assignedToRole === "sector") return (sectorData?.sectors || []).map((s) => ({ code: s.code, name: s.name }));
    if (form.assignedToRole === "awc") return (awcData?.awcs || []).map((a) => ({ code: a.code, name: a.name }));
    return [];
  }, [form.assignedToRole, blockData, sectorData, awcData]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.title || !form.dueDate) {
      setError(t("taskForm.errTitleDate"));
      return;
    }
    if (form.mode === "user" && !form.assignedToUser) {
      setError(t("taskForm.errSelectUser"));
      return;
    }
    if (form.mode === "group" && !form.assignedToScopeCode) {
      setError(t("taskForm.errSelectScope"));
      return;
    }

    try {
      await createTask({
        title: form.title,
        description: form.description,
        dueDate: form.dueDate,
        ...(form.mode === "user"
          ? { assignedToUser: form.assignedToUser }
          : { assignedToRole: form.assignedToRole, assignedToScopeCode: form.assignedToScopeCode }),
      }).unwrap();
      navigate("/tasks");
    } catch (err) {
      setError(err?.data?.message || t("taskForm.errCreate"));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold text-ink">{t("taskForm.newTask")}</h1>
        <button
          type="button"
          onClick={() => navigate("/tasks")}
          className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
        >
          <List size={16} />
          {t("taskForm.list")}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-surface p-6 shadow-card space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              {t("taskForm.title")} <span className="text-coral">*</span>
            </label>
            <input type="text" required value={form.title} onChange={set("title")} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink">{t("taskForm.description")}</label>
            <textarea rows={3} value={form.description} onChange={set("description")} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              {t("taskForm.dueDate")} <span className="text-coral">*</span>
            </label>
            <input type="date" required value={form.dueDate} onChange={set("dueDate")} className={inputClass} />
          </div>
        </div>

        <fieldset className="rounded-xl border border-line p-5">
          <legend className="px-3 text-sm font-bold text-muted uppercase tracking-wider">{t("taskForm.assignTo")}</legend>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, mode: "user" }))}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${form.mode === "user" ? "bg-primary text-white" : "border border-line text-ink"}`}
            >
              {t("taskForm.oneUser")}
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, mode: "group" }))}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${form.mode === "group" ? "bg-primary text-white" : "border border-line text-ink"}`}
            >
              {t("taskForm.everyUserOfRole")}
            </button>
          </div>

          {form.mode === "user" ? (
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-ink">{t("taskForm.user")}</label>
              <select value={form.assignedToUser} onChange={set("assignedToUser")} className={inputClass}>
                <option value="">{t("taskForm.selectUser")}</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} - {ROLE_LABELS[u.role]}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">{t("taskForm.role")}</label>
                <select
                  value={form.assignedToRole}
                  onChange={(e) => setForm((f) => ({ ...f, assignedToRole: e.target.value, assignedToScopeCode: "" }))}
                  className={inputClass}
                >
                  {rolesBelow.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">{t("taskForm.scope")}</label>
                <select value={form.assignedToScopeCode} onChange={set("assignedToScopeCode")} className={inputClass}>
                  <option value="">{t("taskForm.selectScope")}</option>
                  {scopeOptions.map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.name} ({o.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </fieldset>

        <div className="flex justify-end gap-3 border-t border-line pt-5">
          <button
            type="button"
            onClick={() => navigate("/tasks")}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-bg"
          >
            <X size={16} />
            {t("taskForm.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark disabled:opacity-70"
          >
            <Check size={16} />
            {saving ? t("taskForm.creating") : t("taskForm.createTask")}
          </button>
        </div>
      </form>
    </div>
  );
}
