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
export function ReviewActions({
  status,
  canReview,
  onReview,
  loading,
}) {
  const { t } = useLanguage();

  const [remarksOpen, setRemarksOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  // ==========================================
  // HANDLE APPROVE / REJECT
  // ==========================================
  const handleReview = async () => {
    if (!pendingAction || loading) return;

    // ```
    try {
      // Parent component ka API function call
      await onReview(pendingAction, remarks);

      // Success ke baad modal close
      setRemarksOpen(false);

      // Reset remarks
      setRemarks("");

      // Reset pending action
      setPendingAction(null);
    } catch (error) {
      console.error("Review failed:", error);

      // Error hone par modal open rahega
      // taaki user dobara try kar sake
    }
    // ```

  };

  // ==========================================
  // NO REVIEW PERMISSION / REJECTED
  // ==========================================
  if (!canReview || status === "rejected") {
    return <StatusBadge status={status} />;
  }

  // ==========================================
  // REMARKS INPUT
  // ==========================================
  if (remarksOpen) {
    return (<div className="flex items-center gap-1.5">
      <input
        autoFocus
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder={t("approval.remarksPlaceholder")}
        className="w-32 rounded-md border border-line px-2 py-1 text-xs"
      />

      {/* ``` */}
      {/* CONFIRM BUTTON */}
      <button
        type="button"
        onClick={handleReview}
        disabled={loading}
        className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          t("approval.confirm")
        )}
      </button>

      {/* CANCEL BUTTON */}
      <button
        type="button"
        onClick={() => {
          if (loading) return;

          setRemarksOpen(false);
          setRemarks("");
          setPendingAction(null);
        }}
        disabled={loading}
        className="text-xs text-muted disabled:opacity-60"
      >
        {t("approval.cancel")}
      </button>
    </div>
    );
    // ```

  }

  // ==========================================
  // APPROVED
  // ==========================================
  if (status === "approved") {
    return (<div className="flex items-center gap-1.5"> <StatusBadge status={status} />

      {/* ``` */}
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setPendingAction("rejected");
          setRemarks("");
          setRemarksOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-md bg-coral-light px-2 py-1 text-xs font-semibold text-coral hover:bg-coral/20 disabled:opacity-60"
      >
        <X size={12} />
        {t("approval.reject")}
      </button>
    </div>
    );
    // ```

  }

  // ==========================================
  // PENDING
  // ==========================================
  return (<div className="flex items-center gap-1.5">
    {/* APPROVE */}
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setPendingAction("approved");
        setRemarks("");
        setRemarksOpen(true);
      }}
      className="inline-flex items-center gap-1 rounded-md bg-primary-light px-2 py-1 text-xs font-semibold text-primary-dark hover:bg-primary/20 disabled:opacity-60"
    > <Check size={12} />
      {t("approval.approve")} </button>

    {/* ``` */}
    {/* REJECT */}
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setPendingAction("rejected");
        setRemarks("");
        setRemarksOpen(true);
      }}
      className="inline-flex items-center gap-1 rounded-md bg-coral-light px-2 py-1 text-xs font-semibold text-coral hover:bg-coral/20 disabled:opacity-60"
    >
      <X size={12} />
      {t("approval.reject")}
    </button>
  </div>
    // ```

  );
}
