import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import SunArc from "../components/SunArc.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useLoginUserMutation } from "../redux/api.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login({ onSuccess }) {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginUser, { isLoading: loading }] = useLoginUserMutation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      // POST /api/auth/login -> { success, token, user }
      const res = await loginUser({ email, password }).unwrap();
      login(res);
      onSuccess?.();
    } catch (err) {
      setError(err?.data?.message || "Login failed. Check your email and password.");
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left / brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden brand-gradient px-12 py-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-16 -top-16 opacity-[0.14] [&_p]:hidden">
          <SunArc percent={78} size={320} />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-white/30">
            <img src="/logo.jpg" alt="Dahod Smart City" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="font-display text-lg font-extrabold tracking-tight">Suposhit Dahod</p>
            {/* <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
              {t("login.badge")}
            </p> */}
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-accent-light ring-1 ring-white/20">
            <Sparkles size={13} />
            Dahod Smart City
          </span>
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
            {t("login.headline")}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/75">{t("login.sub")}</p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              // [t("login.stat1"), "1,300+"],
              [t("login.stat2"), "122"],
              [t("login.stat3"), "24/7"],
            ].map(([label, val]) => (
              <div key={label} className="rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15">
                <p className="font-display text-xl font-extrabold text-accent-light">{val}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] leading-relaxed text-white/50 cursor-pointer" onClick={() => {
          window.location.href = "https://riveyrainfotech.com/";
        }}
        >{t("login.footer")}</p>
      </div>

      {/* Right / form panel */}
      <div className="relative flex flex-col justify-center bg-bg px-6 py-10 sm:px-12 lg:px-16">
        <div className="absolute right-6 top-6">
          <LanguageSwitcher align="right" />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-line">
              <img src="/logo.jpg" alt="Dahod Smart City" className="h-full w-full object-cover" />
            </div>
            <p className="font-display text-lg font-extrabold tracking-tight text-primary-dark">
              Suposhit Dahod
            </p>
          </div>

          <p className="text-sm font-semibold text-primary">{t("login.welcome")}</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">
            {t("login.title")}
          </h2>
          <p className="mt-2 text-sm text-muted">{t("login.desc")}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                {t("login.label")}
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@suposhitdahod.in"
                  className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-3 text-sm text-ink shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("login.password")}
                </label>
                {/* <button type="button" className="text-xs font-semibold text-primary hover:underline">
                  {t("login.forgot")}
                </button> */}
              </div>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-10 text-sm text-ink shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-coral-light px-3 py-2 text-xs font-semibold text-coral">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-card transition-all hover:bg-primary-dark active:scale-[0.99] disabled:opacity-70"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  {t("login.submit")}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* <p className="mt-8 text-center text-sm text-muted">
            {t("login.noAccount")}{" "}
            <button className="font-semibold text-primary hover:underline">{t("login.signup")}</button>
          </p> */}
        </div>
      </div>
    </div>
  );
}
