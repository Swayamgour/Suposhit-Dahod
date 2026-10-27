import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, ChevronRight, Trash2, MapPin } from "lucide-react";
import { ReviewActions, StatusBadge } from "../components/ApprovalStatus.jsx";
import { SECTIONS, SECTION_ORDER } from "../components/supervisor/supervisorVisitConfig.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import {
  useGetSupervisorVisitQuery,
  useReviewSupervisorVisitMutation,
  useDeleteSupervisorVisitMutation,
} from "../redux/api.jsx";
import { useAuth, ROLES } from "../context/AuthContext.jsx";
import { completedCount } from "./SupervisorVisits.jsx";

// "Fill Form" screen - the 4 sections of one inspection with their
// Completed / Submitted-on status. Tapping a section opens it.
export default function SupervisorVisitForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { role, user } = useAuth();

  const { data, isLoading, error } = useGetSupervisorVisitQuery(id);
  const [reviewVisit, { isLoading: reviewing }] = useReviewSupervisorVisitMutation();
  const [deleteVisit] = useDeleteSupervisorVisitMutation();
  const visit = data?.visit;

  const isOwner = visit && String(visit.createdBy) === String(user?._id);
  const submitted = visit?.formStatus === "submitted";

  async function handleDelete() {
    if (!window.confirm(t("sv.confirmDelete"))) return;
    try {
      await deleteVisit(id).unwrap();
      navigate("/supervisor-visits");
    } catch {
      /* error shown by api layer state - keep page */
    }
  }

  if (isLoading) return <p className="py-10 text-center text-sm text-muted">{t("sv.loading")}</p>;
  if (error || !visit) {
    return (
      <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
        {error?.data?.message || t("sv.errVisit")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-12 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/supervisor-visits")} className="rounded-lg p-2 text-muted hover:bg-bg hover:text-ink">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display text-xl font-extrabold text-ink">{t("sv.fillForm")}</h1>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("sv.anganwadi")}</p>
        <p className="font-display text-lg font-extrabold text-ink">{visit.awcName || visit.awcCode}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted">{t("sv.visitDate")}</p>
            <p className="font-semibold text-ink">{new Date(visit.date).toLocaleDateString("en-IN")}</p>
          </div>
          <div>
            <p className="text-xs text-muted">{t("sv.col.supervisor")}</p>
            <p className="font-semibold text-ink">{visit.supervisorName || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted">{t("sv.progress")}</p>
            <p className="font-semibold text-ink">{completedCount(visit)}/4</p>
          </div>
          <div>
            <p className="text-xs text-muted">{t("sv.col.approval")}</p>
            {submitted ? (
              <ReviewActions
                status={visit.status}
                canReview={[ROLES.DISTRICT, ROLES.BLOCK].includes(role)}
                loading={reviewing}
                onReview={(s, remarks) => reviewVisit({ id, status: s, remarks }).unwrap()}
              />
            ) : (
              <StatusBadge status="pending" />
            )}
          </div>
        </div>
        {visit.checkInLatitude != null && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
            <MapPin size={12} />
            {t("sv.checkIn")}: {Number(visit.checkInLatitude).toFixed(5)}, {Number(visit.checkInLongitude).toFixed(5)}
          </p>
        )}
      </div>

      {visit.status === "rejected" && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm text-coral">
          <p className="font-semibold">{isOwner ? t("sv.rejectedNote") : t("sv.col.approval") + ": rejected"}</p>
          {visit.reviewRemarks && (
            <p className="mt-1">
              <span className="font-semibold">{t("sv.reviewRemarks")}:</span> {visit.reviewRemarks}
            </p>
          )}
        </div>
      )}
      {submitted && visit.status !== "rejected" && (
        <div className="rounded-2xl border border-primary/30 bg-primary-light px-4 py-3 text-sm font-semibold text-primary-dark">
          {t("sv.allDoneNote")}
        </div>
      )}

      <div className="space-y-3">
        {SECTION_ORDER.map((key) => {
          const cfg = SECTIONS[key];
          const st = visit.sectionStatus?.[cfg.field];
          const done = st?.completed;
          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(`/supervisor-visits/${id}/${key}`)}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left text-white shadow-card transition-transform active:scale-[0.99] ${
                done ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : "bg-gradient-to-r from-slate-500 to-slate-400"
              }`}
            >
              <div>
                <p className="font-display text-lg font-bold">{t(`sv.section.${key}`)}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm">
                  {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  {done ? t("sv.completed") : t("sv.notStarted")}
                </p>
                {done && st.submittedAt && (
                  <p className="mt-0.5 text-xs text-white/85">
                    {t("sv.submittedOn")}: {new Date(st.submittedAt).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              <ChevronRight size={22} />
            </button>
          );
        })}
      </div>

      {isOwner && visit.formStatus === "draft" && (
        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-coral hover:bg-coral-light"
        >
          <Trash2 size={14} />
          {t("sv.deleteDraft")}
        </button>
      )}
    </div>
  );
}
