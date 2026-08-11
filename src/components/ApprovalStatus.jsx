import React, { useState } from "react";
import { Check, X, Clock, Loader2 } from "lucide-react";

const STYLES = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-primary-light text-primary-dark",
  rejected: "bg-coral-light text-coral",
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status] || STYLES.pending}`}>
      {status === "pending" && <Clock size={12} />}
      {status === "approved" && <Check size={12} strokeWidth={3} />}
      {status === "rejected" && <X size={12} strokeWidth={3} />}
      {status}
    </span>
  );
}

// canReview: whether the logged-in role is allowed to approve/reject this row
// onReview(status, remarks): called with "approved" | "rejected"
export function ReviewActions({ status, canReview, onReview, loading }) {
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  if (!canReview || status !== "pending") return <StatusBadge status={status} />;

  if (remarksOpen) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Remarks (optional)"
          className="w-32 rounded-md border border-line px-2 py-1 text-xs"
        />
        <button
          onClick={() => onReview(pendingAction, remarks)}
          disabled={loading}
          className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : "Confirm"}
        </button>
        <button onClick={() => setRemarksOpen(false)} className="text-xs text-muted">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => {
          setPendingAction("approved");
          setRemarksOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-md bg-primary-light px-2 py-1 text-xs font-semibold text-primary-dark hover:bg-primary/20"
      >
        <Check size={12} /> Approve
      </button>
      <button
        onClick={() => {
          setPendingAction("rejected");
          setRemarksOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-md bg-coral-light px-2 py-1 text-xs font-semibold text-coral hover:bg-coral/20"
      >
        <X size={12} /> Reject
      </button>
    </div>
  );
}
