import React, { useState } from "react";
import { Users, Info, Search, Eraser, Mail, Upload, Trash2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { applicationUsers } from "../components/data/data.js";

export default function ApplicationUsers() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const users = applicationUsers.map((email, index) => {
    return {
      id: index + 1,
      email,
      role: t("appusers.val.worker"),
      status: t("appusers.val.accept")
    };
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="font-display text-xl font-extrabold text-ink flex items-center gap-2">
          <Users className="text-primary" size={24} />
          {t("appusers.title")}
        </h1>
      </div>

      <div className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-line bg-bg/50">
          <div className="flex flex-wrap items-center gap-4">

            <div className="flex-grow min-w-[200px] flex items-center gap-2">
              <input
                type="text"
                placeholder={t("appusers.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button className="text-muted hover:text-primary transition-colors">
                <Info size={18} />
              </button>
            </div>

            <div className="flex-grow min-w-[200px] flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t("appusers.role")}</option>
              </select>
              <button className="text-muted hover:text-primary transition-colors">
                <Info size={18} />
              </button>
            </div>

            <div className="flex-grow min-w-[200px] flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t("appusers.status")}</option>
              </select>
              <button className="text-muted hover:text-primary transition-colors">
                <Info size={18} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-xl border border-primary px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors">
                <Search size={16} />
                {t("appusers.btnSearch")}
              </button>

              <button className="flex items-center gap-1.5 rounded-xl border border-primary px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors">
                <Eraser size={16} />
                {t("appusers.btnReset")}
              </button>

              <button className="flex items-center gap-1.5 rounded-xl border border-primary px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors">
                <Mail size={16} />
                {t("appusers.btnInvite")}
              </button>

              <button className="flex items-center gap-1.5 rounded-xl border border-primary px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors">
                <Upload size={16} />
                {t("appusers.btnUpload")}
              </button>

              <button className="flex items-center gap-1.5 rounded-xl border border-primary px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors">
                <Users size={16} />
                {t("appusers.btnList")}
              </button>
            </div>

          </div>
        </div>

        {/* Data Table */}
        <div className="p-5">
          <div className="table-scroll overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold text-center w-16">{t("appusers.col.sno")}</th>
                  <th className="px-4 py-3 font-semibold">{t("appusers.col.name")}</th>
                  <th className="px-4 py-3 font-semibold">{t("appusers.col.role")}</th>
                  <th className="px-4 py-3 font-semibold w-40">{t("appusers.col.status")}</th>
                  <th className="px-4 py-3 font-semibold text-center w-24">{t("appusers.col.action")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-line last:border-0 hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-3 text-center font-mono text-muted">{user.id}</td>
                    <td className="px-4 py-3 text-ink">{user.email}</td>
                    <td className="px-4 py-3 font-bold text-ink">{user.role}</td>
                    <td className="px-4 py-3">
                      <select className="w-full rounded-lg border border-line bg-bg px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                        <option>{user.status}</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="rounded-lg border border-error/30 p-1.5 text-error hover:bg-error hover:text-white transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
