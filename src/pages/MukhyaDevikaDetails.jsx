import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
    SlidersHorizontal,
    FileSpreadsheet,
    FileText,
    Upload,
    Download,
    History,
    Plus,
    Trash2,
    Pencil,
    LayoutGrid,
    List as ListIcon,
} from "lucide-react";
import StatusPill from "../components/StatusPill.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const toolbarActions = [
    { icon: FileSpreadsheet, label: "Excel" },
    { icon: FileText, label: "PDF" },
    { icon: Upload, label: "Upload" },
    { icon: Download, label: "Sample CSV" },
    { icon: History, label: "Upload logs" },
    { icon: Plus, label: "Add" }
];

import { mukhyaSevikaEntries } from "../components/data/data.js";

export default function MukhyaDevikaDetails() {
    const { t } = useLanguage();
    const [selected, setSelected] = useState([]);
    const [view, setView] = useState("list");

    const toggleAll = (checked) => setSelected(checked ? mukhyaSevikaEntries.map((w) => w.sr_no) : []);
    const toggleOne = (id) =>
        setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">
                        {t("list.records")}
                    </p>
                    <h1 className="mt-1 font-display text-2xl font-extrabold text-ink flex items-center gap-2">
                        <ListIcon className="text-primary" /> {t("mukhya.title")} <span className="text-muted">/ {t("mukhya.listWord")}</span>
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        {mukhyaSevikaEntries.length} {t("mukhya.entries")}
                    </p>
                </div>
                <Link
                    to="/mukhya-sevika/form"
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card transition-transform hover:-translate-y-0.5 hover:bg-primary-dark active:translate-y-0"
                >
                    <Plus size={16} />
                    {t("mukhya.add")}
                </Link>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                    {/* Pagination controls mimicking HTML */}
                    <select className="rounded border border-primary px-2 py-1 bg-transparent">
                        <option value="undefined">-- &uarr;|&darr; --</option>
                        <option value="ASC">Asc &uarr;</option>
                        <option value="DESC">Desc &darr;</option>
                    </select>
                    <select className="rounded border border-primary px-2 py-1 bg-transparent">
                        <option value="undefined">-- Order by --</option>
                        <option value="id">Created On</option>
                        <option value="modifiedDatetime">Modified On</option>
                    </select>
                    <select className="rounded border border-primary px-2 py-1 bg-transparent">
                        <option value="5">5</option>
                        <option value="10">10</option>
                    </select>
                    <select className="rounded border border-primary px-2 py-1 bg-transparent">
                        <option value="0">Page 1</option>
                    </select>
                    <button className="rounded bg-primary text-white px-3 py-1">Go</button>
                </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface shadow-card">
                <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
                    <button className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-bg">
                        <SlidersHorizontal size={14} />
                        {t("mukhya.filter")}
                    </button>
                    <div className="mx-1 h-5 w-px bg-line" />
                    {toolbarActions.map(({ icon: Icon, label }) => (
                        <button
                            key={label}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted hover:bg-bg hover:text-ink"
                        >
                            <Icon size={14} />
                            {label === "Add" ? t("mukhya.add") : label}
                        </button>
                    ))}

                    <div className="ml-auto flex items-center gap-2">
                        {selected.length > 0 && (
                            <button className="flex items-center gap-1.5 rounded-lg bg-coral-light px-3 py-2 text-xs font-semibold text-coral hover:bg-coral hover:text-white">
                                <Trash2 size={14} />
                                Selected ({selected.length})
                            </button>
                        )}
                        <div className="flex items-center rounded-lg border border-line p-0.5">
                            <button
                                onClick={() => setView("list")}
                                className={`rounded-md p-1.5 ${view === "list" ? "bg-primary text-white" : "text-muted"}`}
                            >
                                <ListIcon size={14} />
                            </button>
                            <button
                                onClick={() => setView("grid")}
                                className={`rounded-md p-1.5 ${view === "grid" ? "bg-primary text-white" : "text-muted"}`}
                            >
                                <LayoutGrid size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {view === "list" ? (
                    <div className="table-scroll overflow-x-auto">
                        <table className="data-table w-full min-w-[1500px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted whitespace-nowrap">
                                    <th className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selected.length === mukhyaSevikaEntries.length}
                                            onChange={(e) => toggleAll(e.target.checked)}
                                            className="h-4 w-4 rounded border-line accent-primary"
                                        />
                                    </th>
                                    <th className="px-2 py-3 font-semibold">{t("mukhya.col.edit")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.sno")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.project")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.sector")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.mukhyaSevikaName")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.regChildren")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.awcName")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.arrivalPhoto")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.regChildren3to6")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.presentOnArrival")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.purnaReg")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.mangalReg")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.deadstockReg")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.poshanSudhaReg")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.preprimaryPhoto")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.crossVerifyPhoto")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.presentOnLeaving")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.leavingPhoto")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.homeVisitPhoto")}</th>
                                    <th className="px-4 py-3 font-semibold">{t("mukhya.col.delete")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mukhyaSevikaEntries.map((row, i) => (
                                    <tr
                                        key={row.sr_no}
                                        className={`border-b border-line last:border-0 ${i % 2 ? "bg-bg/50" : "bg-surface"} transition-colors hover:bg-primary-light/40 whitespace-nowrap`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(row.sr_no)}
                                                onChange={() => toggleOne(row.sr_no)}
                                                className="h-4 w-4 rounded border-line accent-primary"
                                            />
                                        </td>
                                        <td className="px-2 py-3">
                                            <button
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-primary hover:bg-primary-light"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-muted">{row.sr_no}</td>
                                        <td className="px-4 py-3 text-ink">{row.project}</td>
                                        <td className="px-4 py-3 text-ink">{row.village}</td>
                                        <td className="px-4 py-3 text-ink font-semibold">{row.mukhya_sevika_name}</td>
                                        <td className="px-4 py-3 font-mono text-ink text-center">{row.registered_children}</td>
                                        <td className="px-4 py-3 text-ink">{row.centre}</td>

                                        <td className="px-4 py-3 text-center">
                                            {row.arrival_photo && <a href={row.arrival_photo} target="_blank" rel="noreferrer"><img src={row.arrival_photo} alt="" className="w-12 h-10 object-cover rounded mx-auto" /></a>}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-ink text-center">{row.registered_children_3_to_6}</td>
                                        <td className="px-4 py-3 font-mono text-ink text-center">{row.present_on_arrival}</td>
                                        <td className="px-4 py-3 text-center"><StatusPill value={row.purna_register} /></td>
                                        <td className="px-4 py-3 text-center"><StatusPill value={row.mangal_divas_register} /></td>
                                        <td className="px-4 py-3 text-center"><StatusPill value={row.deadstock_register} /></td>
                                        <td className="px-4 py-3 text-center"><StatusPill value={row.poshan_sudha_register} /></td>

                                        <td className="px-4 py-3 text-center">
                                            {row.preprimary_photo && <a href={row.preprimary_photo} target="_blank" rel="noreferrer"><img src={row.preprimary_photo} alt="" className="w-12 h-10 object-cover rounded mx-auto" /></a>}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {row.cross_verify_photo && <a href={row.cross_verify_photo} target="_blank" rel="noreferrer"><img src={row.cross_verify_photo} alt="" className="w-12 h-10 object-cover rounded mx-auto" /></a>}
                                        </td>

                                        <td className="px-4 py-3 font-mono text-ink text-center">{row.present_on_leaving}</td>
                                        <td className="px-4 py-3 text-center">
                                            {row.leaving_photo && <a href={row.leaving_photo} target="_blank" rel="noreferrer"><img src={row.leaving_photo} alt="" className="w-12 h-10 object-cover rounded mx-auto" /></a>}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {row.home_visit_photo && <a href={row.home_visit_photo} target="_blank" rel="noreferrer"><img src={row.home_visit_photo} alt="" className="w-12 h-10 object-cover rounded mx-auto" /></a>}
                                        </td>

                                        <td className="px-2 py-3 text-center">
                                            <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-coral hover:bg-coral-light/20">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                        {mukhyaSevikaEntries.map((row) => (
                            <div key={row.sr_no} className="rounded-xl border border-line p-4 transition-all hover:-translate-y-0.5 hover:shadow-card">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-ink">{row.mukhya_sevika_name}</p>
                                        <p className="text-xs text-muted">AWC: {row.centre || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                                    <span>Registered: {row.registered_children_3_to_6}</span>
                                    <span>Present: {row.present_on_arrival}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-ink">
                                    <p className="text-muted">Purna Register</p>
                                    <StatusPill value={row.purna_register} />
                                </div>
                                <button
                                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-light py-2 text-xs font-semibold text-primary-dark hover:bg-primary hover:text-white"
                                >
                                    <Pencil size={13} />
                                    Edit entry
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-muted">
                    <span>Showing {mukhyaSevikaEntries.length} of {mukhyaSevikaEntries.length} entries</span>
                    <div className="flex items-center gap-1.5">
                        <button className="rounded-lg border border-line px-3 py-1.5 hover:bg-bg">Prev</button>
                        <span className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-white">1</span>
                        <button className="rounded-lg border border-line px-3 py-1.5 hover:bg-bg">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
