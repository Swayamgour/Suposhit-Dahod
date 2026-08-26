import React from "react";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth, ROLES } from "../context/AuthContext.jsx";
import { useGetNoticesQuery, useAcknowledgeNoticeMutation } from "../redux/api.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function NoticesPage() {
  const { t } = useLanguage();
  const { role, user } = useAuth();
  const { data, isLoading } = useGetNoticesQuery({});
  const [acknowledge, { isLoading: acking }] = useAcknowledgeNoticeMutation();

  const notices = data?.notices || [];
  const isRecipient = [ROLES.AWC, ROLES.SECTOR].includes(role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t("noticesPage.title")}</h1>
        <p className="text-sm text-muted">{t("noticesPage.sub")}</p>
      </div>

      <div className="rounded-2xl border border-line bg-white shadow-soft">
        {isLoading ? (
          <p className="p-6 text-sm text-muted">{t("noticesPage.loading")}</p>
        ) : notices.length === 0 ? (
          <p className="p-6 text-sm text-muted">{t("noticesPage.empty")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {notices.map((n) => (
              <li key={n._id} className="flex items-start gap-3 p-4">
                <div className={`mt-0.5 rounded-full p-2 ${n.acknowledged ? "bg-primary-light" : "bg-amber-100"}`}>
                  <Bell size={14} className={n.acknowledged ? "text-primary-dark" : "text-amber-700"} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {n.period} {!isRecipient && n.user?.name ? `- ${n.user.name}` : ""}
                  </p>
                  <p className="text-sm text-muted">{n.message}</p>
                  <p className="mt-1 text-xs text-muted">{new Date(n.createdAt).toLocaleString("en-IN")}</p>
                </div>
                {isRecipient && String(n.user?._id || n.user) === String(user?._id) && !n.acknowledged ? (
                  <button
                    onClick={() => acknowledge(n._id)}
                    disabled={acking}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-dark disabled:opacity-60"
                  >
                    {acking ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} {t("noticesPage.acknowledge")}
                  </button>
                ) : n.acknowledged ? (
                  <span className="text-xs font-medium text-primary-dark">{t("noticesPage.acknowledged")}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
