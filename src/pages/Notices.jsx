import React, { useState } from "react";
import { Bell, RefreshCw, CheckCircle2 } from "lucide-react";
import { useGetNoticesQuery, useAcknowledgeNoticeMutation } from "../redux/api.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// GET /api/notices - auto-scoped (AWC/sector see only their own notices,
// district/block see everyone's in scope). PATCH /:id/acknowledge only
// works for the notice's own user server-side (noticeController.js), so we
// only show the button on a notice that belongs to the logged-in user.
export default function Notices() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("");
  const { data, isLoading, isFetching, error, refetch } = useGetNoticesQuery({ acknowledged: filter });
  const notices = data?.notices || [];

  const [acknowledge, { isLoading: acking }] = useAcknowledgeNoticeMutation();

  async function handleAck(id) {
    try {
      await acknowledge(id).unwrap();
    } catch (err) {
      alert(err?.data?.message || "Could not acknowledge notice.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">Performance</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink flex items-center gap-2">
            <Bell className="text-primary" size={24} />
            Notices
          </h1>
          <p className="mt-1 text-sm text-muted">{notices.length} notice(s) in your scope.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All</option>
            <option value="false">Unacknowledged</option>
            <option value="true">Acknowledged</option>
          </select>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:bg-bg"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error?.data?.message || "Could not load notices from the server."}
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted">Loading notices...</p>
        ) : notices.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted shadow-soft">
            No notices found in your scope.
          </p>
        ) : (
          notices.map((n) => (
            <div
              key={n._id}
              className={`flex flex-wrap items-start justify-between gap-3 rounded-2xl border p-4 shadow-soft ${
                n.acknowledged ? "border-line bg-surface" : "border-coral/30 bg-coral-light"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink">{n.user?.name}</p>
                  <span className="text-xs text-muted">· {n.period}</span>
                </div>
                <p className="mt-1 text-sm text-ink">{n.message}</p>
              </div>
              {!n.acknowledged && n.user?._id === user?._id && (
                <button
                  onClick={() => handleAck(n._id)}
                  disabled={acking}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-dark disabled:opacity-70"
                >
                  <CheckCircle2 size={14} />
                  Acknowledge
                </button>
              )}
              {n.acknowledged && (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary-dark">
                  <CheckCircle2 size={14} />
                  Acknowledged
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
