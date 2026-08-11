import React from "react";
import {
    Mail,
    ShieldCheck,
    MapPin,
    CalendarDays,
    BadgeCheck,
    BadgeX,
    RefreshCw,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useGetMeQuery } from "../redux/api.jsx";
import { ROLE_LABELS } from "../context/AuthContext.jsx";

function initials(name = "") {
    return (
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join("") || "U"
    );
}

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// One row inside the "Details" card
function InfoRow({ icon: Icon, label, value, valueClass = "" }) {
    return (
        <div className="flex items-start gap-3 px-5 py-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
                <Icon size={16} />
            </span>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
                <p className={`mt-0.5 truncate text-sm font-semibold text-ink ${valueClass}`}>{value}</p>
            </div>
        </div>
    );
}

export default function Profile() {
    const { t } = useLanguage();
    const { data, isLoading, isFetching, error, refetch } = useGetMeQuery();
    const user = data?.user;

    const scope = user
        ? [user.districtCode, user.blockCode, user.sectorCode, user.awcCode].filter(Boolean).join(" / ")
        : "";

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    {/* <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">
                        {t("profile.eyebrow") || "Your account"}
                    </p> */}
                    <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
                        {t("profile.title") || "Profile"}
                    </h1>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-bg hover:shadow-card active:translate-y-0"
                >
                    <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
                    {t("profile.refresh") || "Refresh"}
                </button>
            </div>

            {error && (
                <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
                    {error?.data?.message || "Could not load your profile from the server."}
                </div>
            )}

            {isLoading ? (
                <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-muted shadow-card">
                    Loading profile...
                </div>
            ) : !user ? (
                !error && (
                    <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-muted shadow-card">
                        No profile data found.
                    </div>
                )
            ) : (
                <>
                    {/* Hero */}
                    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-8 shadow-card">
                        {/* Signature glow, echoes the sunrise motif used on the dashboard */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full opacity-70 blur-3xl"
                            style={{
                                background:
                                    "radial-gradient(closest-side, var(--color-accent, #f5c66b), transparent)",
                            }}
                        />
                        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
                            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-accent-light font-display text-2xl font-extrabold text-accent-dark shadow-soft">
                                {initials(user.name)}
                            </span>
                            <div className="min-w-0">
                                <h2 className="font-display text-xl font-extrabold text-ink">{user.name}</h2>
                                <p className="mt-0.5 text-sm text-muted">{user.email}</p>
                                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary-dark">
                                        <ShieldCheck size={12} />
                                        {ROLE_LABELS[user.role] || user.role}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive
                                            ? "bg-primary-light text-primary-dark"
                                            : "bg-coral-light text-coral"
                                            }`}
                                    >
                                        {user.isActive ? <BadgeCheck size={12} /> : <BadgeX size={12} />}
                                        {user.isActive ? "Active" : "Inactive"}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${user.status === "accepted"
                                            ? "bg-primary-light text-primary-dark"
                                            : "bg-coral-light text-coral"
                                            }`}
                                    >
                                        {user.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                        <div className="border-b border-line bg-primary-dark px-5 py-4">
                            <h3 className="font-display text-sm font-bold text-white">
                                {t("profile.details") || "Account details"}
                            </h3>
                        </div>
                        <div className="divide-y divide-line">
                            <InfoRow icon={Mail} label="Email" value={user.email} />
                            <InfoRow icon={ShieldCheck} label="Role" value={ROLE_LABELS[user.role] || user.role} />
                            {scope && (
                                <InfoRow icon={MapPin} label="Scope" value={scope} valueClass="font-mono" />
                            )}
                            <InfoRow icon={CalendarDays} label="Member since" value={formatDate(user.createdAt)} />
                            <InfoRow icon={CalendarDays} label="Last updated" value={formatDate(user.updatedAt)} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}