import React, { useEffect, useState } from "react";
import { Menu, Search, ListChecks, Moon, Sun, LogOut, ChevronDown } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAuth, ROLE_LABELS } from "../context/AuthContext.jsx";

const THEME_KEY = "suposhit-dahod-theme";

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "U";
}

export default function Topbar({ onMenuClick, onLogout }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:px-8">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-ink hover:bg-primary/10 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder={t("topbar.search")}
          className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          className="hidden rounded-lg p-2.5 text-muted hover:bg-primary/10 hover:text-primary sm:inline-flex"
          title={t("topbar.approvals")}
        >
          <ListChecks size={18} />
        </button>
        <button
          onClick={() => setDark((d) => !d)}
          className="hidden rounded-lg p-2.5 text-muted transition-colors hover:bg-primary/10 hover:text-primary sm:inline-flex"
          title={t("topbar.theme")}
          aria-label={t("topbar.theme")}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <LanguageSwitcher />

        <div className="relative ml-1">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-xl border border-line py-1.5 pl-1.5 pr-2.5 hover:bg-bg"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-light font-display text-xs font-extrabold text-accent-dark">
              {initials(user?.name)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-semibold leading-tight text-ink">
                {user?.name || "-"}
              </span>
              <span className="block text-[11px] leading-tight text-muted">
                {ROLE_LABELS[user?.role] || t("topbar.role")}
              </span>
            </span>
            <ChevronDown size={14} className="hidden text-muted sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-card animate-scale-in">
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-coral hover:bg-coral-light"
              >
                <LogOut size={16} />
                {t("topbar.signout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
