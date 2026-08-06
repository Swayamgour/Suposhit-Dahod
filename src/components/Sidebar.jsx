import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ClipboardList, BarChart3, Info, X, AppWindow } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Sidebar({ open, onClose }) {
  const { t } = useLanguage();

  const links = [
    { to: "/", label: t("sidebar.dashboard"), icon: LayoutDashboard, end: true },
    { to: "/workers", label: t("sidebar.workers"), icon: ClipboardList },
    { to: "/charts", label: t("sidebar.charts"), icon: BarChart3 },
    { to: "/info", label: t("sidebar.info"), icon: Info },
    { to: "/applications", label: t("applications Dashboard"), icon: AppWindow },
    { to: "/mukhya-sevika", label: "Mukhya Sevika", icon: ClipboardList },
  ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-72 shrink-0 transform brand-gradient text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:flex lg:flex-col ${open ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between gap-2 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-white/30 shadow-soft">
              <img src="/logo.jpg" alt="Dahod Smart City" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-display text-[15px] font-extrabold leading-tight tracking-tight">
                {t("sidebar.brand")}
              </p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">
                {t("sidebar.tagline")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-2">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${isActive
                  ? "bg-white text-primary-dark shadow-soft"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={18} strokeWidth={2.25} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mx-4 mb-6 flex items-center gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/90 ring-1 ring-white/40">
            <img src="/logo.jpg" alt="" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/60">{t("sidebar.managedBy")}</p>
            <p className="font-display text-sm font-bold leading-tight">{t("sidebar.govt")}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
