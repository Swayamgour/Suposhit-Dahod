import React, { useState } from "react";
import { Check, X, Clock, Loader2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

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
  const { t } = useLanguage();
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  // No review rights, or already rejected (final state) -> just show the badge
  if (!canReview || status === "rejected") return <StatusBadge status={status} />;

  if (remarksOpen) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder={t("approval.remarksPlaceholder")}
          className="w-32 rounded-md border border-line px-2 py-1 text-xs"
        />
        <button
          onClick={() => onReview(pendingAction, remarks)}
          disabled={loading}
          className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : t("approval.confirm")}
        </button>
        <button onClick={() => setRemarksOpen(false)} className="text-xs text-muted">
          {t("approval.cancel")}
        </button>
      </div>
    );
  }

  // status === "approved": show the badge plus a Reject option, no Approve button
  if (status === "approved") {
    return (
      <div className="flex items-center gap-1.5">
        <StatusBadge status={status} />
        <button
          onClick={() => {
            setPendingAction("rejected");
            setRemarksOpen(true);
          }}
          className="inline-flex items-center gap-1 rounded-md bg-coral-light px-2 py-1 text-xs font-semibold text-coral hover:bg-coral/20"
        >
          <X size={12} /> {t("approval.reject")}
        </button>
      </div>
    );
  }

  // status === "pending": show both Approve and Reject
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => {
          setPendingAction("approved");
          setRemarksOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-md bg-primary-light px-2 py-1 text-xs font-semibold text-primary-dark hover:bg-primary/20"
      >
        <Check size={12} /> {t("approval.approve")}
      </button>
      <button
        onClick={() => {
          setPendingAction("rejected");
          setRemarksOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-md bg-coral-light px-2 py-1 text-xs font-semibold text-coral hover:bg-coral/20"
      >
        <X size={12} /> {t("approval.reject")}
      </button>
    </div>
  );
}