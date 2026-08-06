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
import { workerEntries as allWorkerEntries } from "../components/data/data.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const workerEntries = allWorkerEntries.slice(0, 10);

const toolbarActions = [
  { icon: FileSpreadsheet, label: "Excel" },
  { icon: FileText, label: "PDF" },
  { icon: Upload, label: "Upload" },
  { icon: Download, label: "Sample CSV" },
  { icon: History, label: "Upload logs" },
];

export default function WorkerList() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState([]);
  const [view, setView] = useState("list");

  const toggleAll = (checked) => setSelected(checked ? workerEntries.map((w) => w.sr_no) : []);
  const toggleOne = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">
            {t("list.records")}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
            {t("list.title")} <span className="text-muted">/ {t("list.listWord")}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {workerEntries.length} {t("list.entries")} · Bavaka-2, Bavaka sector
          </p>
        </div>
        <Link
          to="/workers/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-card transition-transform hover:-translate-y-0.5 hover:bg-primary-dark active:translate-y-0"
        >
          <Plus size={16} />
          {t("list.add")}
        </Link>
      </div>

      <div className="rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <button className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-bg">
            <SlidersHorizontal size={14} />
            {t("list.filter")}
          </button>
          <div className="mx-1 h-5 w-px bg-line" />
          {toolbarActions.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted hover:bg-bg hover:text-ink"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            {selected.length > 0 && (
              <button className="flex items-center gap-1.5 rounded-lg bg-coral-light px-3 py-2 text-xs font-semibold text-coral hover:bg-coral hover:text-white">
                <Trash2 size={14} />
                {t("list.selected")} ({selected.length})
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
            <table className="data-table w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-bg text-[11px] uppercase tracking-wide text-muted whitespace-nowrap">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.length === workerEntries.length}
                      onChange={(e) => toggleAll(e.target.checked)}
                      className="h-4 w-4 rounded border-line accent-primary"
                    />
                  </th>
                  <th className="px-2 py-3 font-semibold">Edit</th>
                  <th className="px-4 py-3 font-semibold">S.No</th>
                  <th className="px-4 py-3 font-semibold">તારીખ</th>
                  <th className="px-4 py-3 font-semibold">ઘટકનું નામ</th>
                  <th className="px-4 py-3 font-semibold">સેજાનું નામ</th>
                  <th className="px-4 py-3 font-semibold">આંગણવાડી કેન્દ્રનું નામ</th>
                  <th className="px-4 py-3 font-semibold">રજીસ્ટર બાળકોની સંખ્યા (3 થી ૬ વર્ષ)</th>
                  <th className="px-4 py-3 font-semibold">આંગણવાડી કેન્દ્ર ખુલ્લું છે?</th>
                  <th className="px-4 py-3 font-semibold">આંગણવાડી કાર્યકરનું નામ</th>
                  <th className="px-4 py-3 font-semibold">આંગણવાડી તેડાગરનું નામ</th>
                  <th className="px-4 py-3 font-semibold">આંગણવાડી કેન્દ્રનું સ્થાન</th>
                  <th className="px-4 py-3 font-semibold">સવારનો નાસ્તો આપેલ છે?</th>
                  <th className="px-4 py-3 font-semibold">સવારના નાસ્તાનું મેનુ</th>
                  <th className="px-4 py-3 font-semibold">સવારના નાસ્તાની થાળીનો ફોટો-૧ (સમય:૯ થી ૧૦:૩૦)</th>
                  <th className="px-4 py-3 font-semibold">સવારના નાસ્તા માટે હાજર બાળકોનો ફોટો</th>
                  <th className="px-4 py-3 font-semibold">સવારના નાસ્તામાં હાજર બાળકોની સંખ્યા</th>
                  <th className="px-4 py-3 font-semibold">દૂધનો લાભ લીધેલ બાળકોની સંખ્યા</th>
                  <th className="px-4 py-3 font-semibold">દૂધ સંજીવની અંતર્ગત દૂધ પીતા બાળકોનો ફોટો-૨ (સમય:૯:૦૦ થી ૧૦:૩૦)</th>
                  <th className="px-4 py-3 font-semibold">બપોરનો નાસ્તો આપેલ છે?</th>
                  <th className="px-4 py-3 font-semibold">બપોરના નાસ્તાનું મેનુ</th>
                  <th className="px-4 py-3 font-semibold">બપોરના ભોજનની થાળીનો ફોટો-૩ (સમય:૧૧:૩૦ થી ૧:૩૦)</th>
                  <th className="px-4 py-3 font-semibold">બપોરના નાસ્તા માટે હાજર બાળકોનો ફોટો</th>
                  <th className="px-4 py-3 font-semibold">બપોરના નાસ્તામાં હાજર બાળકોની સંખ્યા</th>
                  <th className="px-4 py-3 font-semibold">પોષણ સુધાનું ભોજન આપેલ છે?</th>
                  <th className="px-4 py-3 font-semibold">પોષણ સુધાનું મેનુ</th>
                  <th className="px-4 py-3 font-semibold">પોષણ સુધાની ભોજનની થાળીનો ફોટો-૪ (સમય:૧૧:૩૦ થી ૧:૩૦)</th>
                  <th className="px-4 py-3 font-semibold">પોષણ સુધાનાં માટે હાજર લાભાર્થીઓનો ફોટો</th>
                  <th className="px-4 py-3 font-semibold">પોષણ સુધાના હાજર લાભાર્થીની સંખ્યા</th>
                  <th className="px-4 py-3 font-semibold">પૂર્વ પ્રાથમિક શિક્ષણ આપેલ બાળકોની સંખ્યા</th>
                  <th className="px-4 py-3 font-semibold">પૂર્વ પ્રાથમિક શિક્ષણની પ્રવૃત્તિનો ફોટો</th>
                  <th className="px-4 py-3 font-semibold">ભોજનની ગુણવત્તા કેવી છે?</th>
                  <th className="px-4 py-3 font-semibold">Delete</th>
                </tr>
              </thead>
              <tbody>
                {workerEntries.map((row, i) => (
                  <tr
                    key={row.sr_no || i}
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
                      <Link
                        to={`/workers/${row.sr_no}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-primary hover:bg-primary-light"
                      >
                        <Pencil size={14} />
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{row.sr_no}</td>
                    <td className="px-4 py-3 font-mono text-ink whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3 text-ink">{row.project}</td>
                    <td className="px-4 py-3 text-ink">{row.village}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{row.sub_village}</td>
                    <td className="px-4 py-3 font-mono text-ink text-center">{row.total_children}</td>
                    <td className="px-4 py-3 text-center"><StatusPill value={row.meal_cooked} /></td>
                    <td className="px-4 py-3 text-ink whitespace-nowrap">{row.cook_name}</td>
                    <td className="px-4 py-3 text-ink whitespace-nowrap">{row.helper_name}</td>
                    <td className="px-4 py-3 text-ink whitespace-nowrap">
                      {row.location && <a href={`https://www.google.com/maps?q=${row.location}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{row.location}</a>}
                    </td>
                    <td className="px-4 py-3 text-center"><StatusPill value={row.vegetables_used} /></td>
                    <td className="px-4 py-3 text-ink min-w-[200px] whitespace-normal">{row.other_ingredients}</td>
                    <td className="px-4 py-3 text-center">
                      {row.meal_image && <a href={row.meal_image} target="_blank" rel="noreferrer"><img src={row.meal_image} alt="" className="w-12 h-10 object-cover rounded mx-auto" /></a>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.meal_image2 && <a href={row.meal_image2} target="_blank" rel="noreferrer"><img src={row.meal_image2} alt="" className="w-12 h-10 object-cover rounded mx-auto" /></a>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{row.children_ate || row.meal_name}</td>
                    <td className="px-4 py-3 text-center font-mono">{row.meal_name2}</td>
                    <td className="px-4 py-3 text-center">
                      {row.meal_image3 && <a href={row.meal_image3} target="_blank" rel="noreferrer"><img src={row.meal_image3} alt="" className="w-12 h-10 object-cover rounded mx-auto" /></a>}
                    </td>
                    <td className="px-4 py-3 text-center"><StatusPill value={row.oil_used} /></td>
                    <td className="px-4 py-3 text-ink min-w-[200px] whitespace-normal">{row.ghree_used}</td>
                    <td className="px-4 py-3 text-center">
                      {row.meal_image4 && <a href={row.meal_image4} target="_blank" rel="noreferrer"><img src={row.meal_image4} alt="" className="w-12 h-10 object-cover rounded mx-auto" /></a>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.meal_image5 && <a href={row.meal_image5} target="_blank" rel="noreferrer"><img src={row.meal_image5} alt="" className="w-12 h-10 object-cover rounded mx-auto" /></a>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{row.meal_name3}</td>
                    <td className="px-4 py-3 text-center"><StatusPill value={row.food_grains_used} /></td>
                    <td className="px-4 py-3 text-ink min-w-[200px] whitespace-normal">{row.pulses_used}</td>
                    <td className="px-4 py-3 text-center">
                      {row.meal_image6 && <a href={row.meal_image6} target="_blank" rel="noreferrer"><img src={row.meal_image6} alt="" className="w-12 h-10 object-cover rounded mx-auto" /></a>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.meal_image7 && <a href={row.meal_image7} target="_blank" rel="noreferrer"><img src={row.meal_image7} alt="" className="w-12 h-10 object-cover rounded mx-auto" /></a>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{row.meal_name4}</td>
                    <td className="px-4 py-3 text-center font-mono">{row.meal_name5}</td>
                    <td className="px-4 py-3 text-center">
                      {row.meal_image8 && <a href={row.meal_image8} target="_blank" rel="noreferrer"><img src={row.meal_image8} alt="" className="w-12 h-10 object-cover rounded mx-auto" /></a>}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap"><StatusPill value={row.food_quality} /></td>
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
            {workerEntries.map((row) => (
              <div key={row.sr_no} className="rounded-xl border border-line p-4 transition-all hover:-translate-y-0.5 hover:shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-ink">{row.sub_village}</p>
                    <p className="text-xs text-muted">{row.village} · {row.project}</p>
                  </div>
                  <StatusPill value={row.meal_cooked} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span className="font-mono">{row.date}</span>
                  <span>{row.total_children} બાળકો</span>
                </div>
                <div className="mt-3 border-t border-line pt-3 text-xs text-ink">
                  <p>{row.cook_name}</p>
                  <p className="text-muted">{row.helper_name}</p>
                </div>
                <Link
                  to={`/workers/${row.sr_no}`}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-primary-light py-2 text-xs font-semibold text-primary-dark hover:bg-primary hover:text-white"
                >
                  <Pencil size={13} />
                  Edit entry
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-muted">
          <span>Showing {workerEntries.length} of {workerEntries.length} entries</span>
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
