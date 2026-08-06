import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AppWindow, Link as LinkIcon, Users } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function ApplicationDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("main");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("ASC");
  const [sortBy, setSortBy] = useState("id");

  const apps = [
    {
      id: 1,
      name: "SUPOSHIT DAHOD WORKER",
      url: "https://suposhitdahodworker..ncsindore.com",
      image: "https://suposhitdahod.dahodsmartcity.in/api/api/image/th/1757921296575?t=1785923931289",
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header section with Breadcrumb & Pagination (Top) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold text-ink flex items-center gap-2">
          <AppWindow className="text-primary" size={28} />
          {t("appdash.title")}
        </h1>

        {/* Toolbar Placeholder */}
        <div className="flex flex-wrap items-center gap-2 bg-surface p-2 rounded-xl border border-line shadow-sm">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="rounded-lg border border-line bg-bg px-3 py-1.5 text-sm text-primary focus:border-primary focus:outline-none"
          >
            <option value="undefined">-- ↑ | ↓ --</option>
            <option value="ASC">Asc ↑</option>
            <option value="DESC">Desc ↓</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-line bg-bg px-3 py-1.5 text-sm text-primary focus:border-primary focus:outline-none"
          >
            <option disabled value="undefined">-- Order by --</option>
            <option value="id">Created On</option>
            <option value="modifiedDatetime">Modified On</option>
          </select>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="rounded-lg border border-line bg-bg px-3 py-1.5 text-sm text-primary focus:border-primary focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <select
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="rounded-lg border border-line bg-bg px-3 py-1.5 text-sm text-primary focus:border-primary focus:outline-none"
          >
            <option value={1}>Page 1</option>
          </select>
          <button className="rounded-lg border border-primary text-primary px-3 py-1.5 text-sm font-semibold hover:bg-primary hover:text-white transition-colors">
            Go
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden min-h-[480px]">
        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-line px-5 py-3 bg-bg/50">
          <button
            onClick={() => setActiveTab("main")}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "main"
                ? "text-primary border-b-2 border-primary"
                : "text-muted hover:text-ink"
            }`}
          >
            {t("appdash.mainTab")}
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "archived"
                ? "text-primary border-b-2 border-primary"
                : "text-muted hover:text-ink"
            }`}
          >
            {t("appdash.archivedTab")}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          <div className="table-scroll overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold text-center w-16">{t("appdash.col.sno")}</th>
                  <th className="px-4 py-3 font-semibold">{t("appdash.col.name")}</th>
                  <th className="px-4 py-3 font-semibold w-32">{t("appdash.col.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === "main" ? (
                  apps.map((app, index) => (
                    <tr key={app.id} className="border-b border-line last:border-0 hover:bg-bg/50 transition-colors">
                      <td className="px-4 py-3 text-center font-mono text-muted">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line bg-bg p-0.5">
                            <img src={app.image} alt={app.name} className="h-full w-full object-cover rounded-md" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-ink font-bold">
                              <AppWindow size={14} className="text-primary" />
                              {app.name}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
                              <LinkIcon size={12} />
                              <a href={app.url} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                                {app.url}
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link to="/applications/users" className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-light transition-colors">
                          <Users size={14} />
                          {t("appdash.users")}
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted text-sm">
                      No archived applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
