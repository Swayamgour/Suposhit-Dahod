import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Search, UserPlus, Check, X, Trash2, RefreshCw } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import {
  useGetUsersQuery,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
} from "../redux/api.jsx";
import { useAuth, ROLES, ROLE_LABELS, ROLE_ORDER, outranks } from "../context/AuthContext.jsx";

// Matches GET /api/users?role=&status=&search= exactly
// (icds-backend/controllers/userController.js).
export default function ApplicationUsers() {
  const { t } = useLanguage();
  const { role: myRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isFetching, error, refetch } = useGetUsersQuery({
    search: searchTerm,
    role: roleFilter,
    status: statusFilter,
  });
  const users = data?.users || [];

  const [updateStatus] = useUpdateUserStatusMutation();
  const [deleteUser] = useDeleteUserMutation();

  async function handleStatus(id, status) {
    try {
      await updateStatus({ id, status }).unwrap();
    } catch (err) {
      alert(err?.data?.message || "Could not update status.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteUser(id).unwrap();
    } catch (err) {
      alert(err?.data?.message || "Could not delete user.");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="font-display text-xl font-extrabold text-ink flex items-center gap-2">
          <Users className="text-primary" size={24} />
          {t("appusers.title")}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
          {myRole !== ROLES.AWC && (
            <Link
              to="/applications/users/new"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark"
            >
              <UserPlus size={16} />
              Add User
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error?.data?.message || "Could not load users from the server."}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
        <div className="p-5 border-b border-line bg-bg/50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-grow min-w-[200px] flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder={t("appusers.search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All roles</option>
              {Object.values(ROLES).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All statuses</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="table-scroll overflow-x-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Name</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Email</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Role</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Scope</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
                {myRole !== ROLES.AWC && <th className="whitespace-nowrap px-4 py-3 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                    No users found in your scope.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-b border-line last:border-0 hover:bg-primary-light/40">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">{u.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">{u.email}</td>
                    <td className="whitespace-nowrap px-4 py-3">{ROLE_LABELS[u.role] || u.role}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                      {[u.blockCode, u.sectorCode, u.awcCode].filter(Boolean).join(" / ") || u.districtCode}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 capitalize">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.status === "accepted"
                          ? "bg-primary-light text-primary-dark"
                          : "bg-coral-light text-coral"
                          }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    {myRole !== ROLES.AWC && (
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          {u.status !== "accepted" && (
                            <button
                              onClick={() => handleStatus(u._id, "accepted")}
                              title="Accept"
                              className="rounded-lg p-1.5 text-primary hover:bg-primary-light"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          {u.status !== "rejected" && (
                            <button
                              onClick={() => handleStatus(u._id, "rejected")}
                              title="Reject"
                              className="rounded-lg p-1.5 text-coral hover:bg-coral-light"
                            >
                              <X size={16} />
                            </button>
                          )}
                          {outranks(myRole, u.role) && (
                            <button
                              onClick={() => handleDelete(u._id)}
                              title="Delete"
                              className="rounded-lg p-1.5 text-coral hover:bg-coral-light"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
