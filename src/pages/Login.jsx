import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  KeyRound,
} from "lucide-react";

import SunArc from "../components/SunArc.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useLoginUserMutation } from "../redux/api.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login({ onSuccess }) {
  const { t } = useLanguage();
  const { login } = useAuth();

  const [showPw, setShowPw] = useState(false);

  // Email OR Code
  const [loginValue, setLoginValue] = useState("");

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [loginUser, { isLoading: loading }] = useLoginUserMutation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      // Backend expects:
      // {
      //   login: email / districtCode / blockCode / sectorCode / awcCode,
      //   password
      // }

      const res = await loginUser({
        login: loginValue.trim(),
        password,
      }).unwrap();

      login(res);
      onSuccess?.();
    } catch (err) {
      setError(
        err?.data?.message ||
        "Login failed. Please check your email/code and password."
      );
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">

      {/* ================= LEFT / BRAND PANEL ================= */}
      <div className="relative hidden flex-col justify-between overflow-hidden brand-gradient px-12 py-10 text-white lg:flex">

        <div className="pointer-events-none absolute -right-16 -top-16 opacity-[0.14] [&_p]:hidden">
          <SunArc percent={78} size={320} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-white/30">
            <img
              src="/logo.jpg"
              alt="Dahod Smart City"
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <p className="font-display text-lg font-extrabold tracking-tight">
              Suposhit Dahod
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-md">

          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-accent-light ring-1 ring-white/20">
            <Sparkles size={13} />
            Dahod Smart City
          </span>

          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
            {t("login.headline")}
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-white/75">
            {t("login.sub")}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              [t("login.stat2"), "122"],
              [t("login.stat3"), "24/7"],
            ].map(([label, val]) => (
              <div
                key={label}
                className="rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15"
              >
                <p className="font-display text-xl font-extrabold text-accent-light">
                  {val}
                </p>

                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-white/60">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p
          className="relative z-10 cursor-pointer text-[11px] leading-relaxed text-white/50"
          onClick={() => {
            window.location.href = "https://riveyrainfotech.com/";
          }}
        >
          {t("login.footer")}
        </p>
      </div>

      {/* ================= RIGHT / LOGIN PANEL ================= */}
      <div className="relative flex flex-col justify-center bg-bg px-6 py-10 sm:px-12 lg:px-16">

        {/* Language */}
        <div className="absolute right-6 top-6">
          <LanguageSwitcher align="right" />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">

          {/* Mobile Logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-line">
              <img
                src="/logo.jpg"
                alt="Dahod Smart City"
                className="h-full w-full object-cover"
              />
            </div>

            <p className="font-display text-lg font-extrabold tracking-tight text-primary-dark">
              Suposhit Dahod
            </p>
          </div>

          {/* Heading */}
          <p className="text-sm font-semibold text-primary">
            {t("login.welcome")}
          </p>

          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">
            {t("login.title")}
          </h2>

          <p className="mt-2 text-sm text-muted">
            Login using your registered email or official code.
          </p>

          {/* ================= FORM ================= */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">

            {/* Login ID */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                Email / Login Code
              </label>

              <div className="relative">

                <KeyRound
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />

                <input
                  type="text"
                  required
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                  placeholder="Email / AWC / Sector / Block / District Code"
                  autoComplete="username"
                  className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-3 text-sm text-ink shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

              </div>

              <p className="mt-1.5 text-[11px] text-muted">
                Example: email@domain.com or 24445010101
              </p>
            </div>

            {/* Password */}
            <div>

              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("login.password")}
                </label>
              </div>

              <div className="relative">

                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />

                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-10 text-sm text-ink shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  {showPw ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg bg-coral-light px-3 py-2 text-xs font-semibold text-coral">
                {error}
              </p>
            )}

            {/* Login Button */}
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

                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          {/* Login Help */}
          <div className="mt-6 rounded-xl border border-line bg-surface/60 p-3">
            <p className="text-center text-[11px] leading-relaxed text-muted">
              You can login using your{" "}
              <span className="font-semibold text-ink">
                Email, AWC Code, Sector Code, Block Code
              </span>{" "}
              or{" "}
              <span className="font-semibold text-ink">
                District Code
              </span>
              .
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}