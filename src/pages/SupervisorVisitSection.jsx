import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Save } from "lucide-react";
import FormItem from "../components/supervisor/SupervisorFormFields.jsx";
import {
  SECTIONS,
  getIn,
  setIn,
  isMissing,
  missingPaths,
  clearHidden,
  isSectionUnlocked,
  normDate,
  sectionDefaults,
} from "../components/supervisor/supervisorVisitConfig.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import {
  useGetSupervisorVisitQuery,
  useGetSupervisorPrefillQuery,
  useSaveSupervisorVisitSectionMutation,
} from "../redux/api.jsx";
import { useAuth, ROLES } from "../context/AuthContext.jsx";

// One section of the inspection form (general | a | b | c).
export default function SupervisorVisitSection() {
  const { id, section } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { role, user } = useAuth();
  const cfg = SECTIONS[section];

  const { data, isLoading, error: loadError } = useGetSupervisorVisitQuery(id);
  const visit = data?.visit;

  // Registered-children counts etc. (supervisor only - the endpoint is supervisor-scoped)
  const { data: prefillData, isLoading: prefillLoading } = useGetSupervisorPrefillQuery(visit?.awcCode, {
    skip: !visit || role !== ROLES.SUPERVISOR,
  });

  const [values, setValues] = useState(null);
  const [missing, setMissing] = useState(new Set());
  const [error, setError] = useState("");
  const [saveSection, { isLoading: saving }] = useSaveSupervisorVisitSectionMutation();

  // Build the initial form state once the visit (and prefill) have loaded:
  // saved values win, empty ones fall back to prefill defaults.
  useEffect(() => {
    if (!visit || !cfg || prefillLoading || values !== null) return;
    let init = JSON.parse(JSON.stringify(visit[cfg.field] || {}));
    if (init.visitDate) init.visitDate = normDate(init.visitDate);
    const defaults = sectionDefaults(section, { prefill: prefillData?.prefill, visit });
    Object.entries(defaults).forEach(([p, v]) => {
      if (isMissing(getIn(init, p))) init = setIn(init, p, v);
    });
    setValues(init);
  }, [visit, cfg, prefillLoading, prefillData, section, values]);

  if (!cfg) return <Navigate to={`/supervisor-visits/${id}`} replace />;
  if (isLoading || (visit && values === null)) {
    return <p className="py-10 text-center text-sm text-muted">{t("sv.loading")}</p>;
  }
  if (loadError || !visit) {
    return (
      <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
        {loadError?.data?.message || t("sv.errVisit")}
      </div>
    );
  }

  const isOwner = String(visit.createdBy) === String(user?._id);
  const locked = visit.formStatus === "submitted" && visit.status !== "rejected";
  const readOnly = !isOwner || locked;

  // Sections open step by step (General -> A -> B -> C): block direct URL access too.
  if (isOwner && !isSectionUnlocked(section, visit)) {
    return <Navigate to={`/supervisor-visits/${id}`} replace />;
  }

  const onChange = (path, value) => {
    setValues((v) => clearHidden(section, setIn(v, path, value)));
    if (missing.size) {
      const next = new Set(missing);
      next.delete(path);
      setMissing(next);
    }
  };

  async function save(markComplete) {
    setError("");
    if (markComplete) {
      const miss = missingPaths(section, values);
      if (miss.length) {
        setMissing(new Set(miss));
        setError(t("sv.errRequired"));
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    try {
      await saveSection({ id, section, body: { ...values, markComplete } }).unwrap();
      navigate(`/supervisor-visits/${id}`);
    } catch (err) {
      if (err?.data?.missing) setMissing(new Set(err.data.missing));
      setError(err?.data?.message || t("sv.errSave"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-28 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/supervisor-visits/${id}`)} className="rounded-lg p-2 text-muted hover:bg-bg hover:text-ink">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-xl font-extrabold text-ink">{t(`sv.section.${section}`)}</h1>
          <p className="text-xs text-muted">{visit.awcName || visit.awcCode}</p>
        </div>
      </div>

      {readOnly && (
        <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-muted">
          {locked ? t("sv.readOnlyNote") : t("sv.viewOnlyNote")}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">{error}</div>
      )}

      <div className="space-y-4">
        {/* {console.log(cfg)} */}
        {cfg.items.map((item, i) => (
          <FormItem
            key={item.path || `${item.type}-${i}`}
            item={item}
            values={values}
            onChange={onChange}
            readOnly={readOnly}
            missing={missing}
          />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:left-72">
        <div className="mx-auto flex max-w-3xl gap-3">
          <button
            type="button"
            onClick={() => navigate(`/supervisor-visits/${id}`)}
            className="rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-bg"
          >
            {t("sv.back")}
          </button>
          {!readOnly && (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => save(false)}
                className="flex items-center gap-2 rounded-xl border border-primary px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary-light disabled:opacity-70"
              >
                <Save size={16} />
                {t("sv.saveProgress")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => save(true)}
                className="ml-auto flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-dark disabled:opacity-70"
              >
                <Check size={16} />
                {saving ? t("sv.saving") : t("sv.saveComplete")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}