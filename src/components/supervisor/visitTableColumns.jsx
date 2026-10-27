import React from "react";
import { SECTIONS, SECTION_ORDER, MONTHS, getIn } from "./supervisorVisitConfig.js";

// Builds one table column per question of the inspection form (General, A, B, C),
// straight from supervisorVisitConfig.js - so the table always matches the form
// and every label is available in en / hi / gu.

const isEmpty = (v) => v === undefined || v === null || v === "";
const Dash = () => <span className="text-muted">-</span>;
const pick = (l, lang) => (typeof l === "string" ? l : l?.[lang] || l?.en || "");

function fmtDate(v, lang) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString(lang === "en" ? "en-IN" : lang === "hi" ? "hi-IN" : "gu-IN");
}

function optionLabel(item, value, lang) {
  const o = (item.options || []).find((x) => x.value === value);
  return o ? pick(o.label, lang) : String(value);
}

// Turns a leaf item into a column spec. `render(section, ctx)` returns a node.
function leafColumn(item, sectionId, sectionField, labelOverride) {
  const label = labelOverride || item.label;
  const get = (visit) => getIn(visit?.[sectionField], item.path);
  const base = { key: `${sectionId}.${item.path}`, sectionId, label };

  switch (item.type) {
    case "yesno":
      return { ...base, render: (visit, { t }) => {
        const v = get(visit);
        if (typeof v !== "boolean") return <Dash />;
        return (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${v ? "bg-primary-light text-primary-dark" : "bg-coral-light text-coral"}`}>
            {t(v ? "common.yes" : "common.no")}
          </span>
        );
      } };
    case "date":
      return { ...base, render: (visit, { lang }) => (isEmpty(get(visit)) ? <Dash /> : fmtDate(get(visit), lang)) };
    case "monthYear":
      return { ...base, render: (visit) => {
        const v = get(visit);
        if (!v || (!v.month && !v.year)) return <Dash />;
        return `${v.month ? MONTHS[v.month - 1] : ""} ${v.year ?? ""}`.trim();
      } };
    case "select":
    case "radio":
      return { ...base, render: (visit, { lang }) => (isEmpty(get(visit)) ? <Dash /> : optionLabel(item, get(visit), lang)) };
    case "multicheck":
      return { ...base, render: (visit, { lang }) => {
        const v = get(visit);
        if (!Array.isArray(v) || !v.length) return <Dash />;
        return (
          <ul className="list-disc space-y-0.5 pl-4">
            {v.map((x) => <li key={x}>{optionLabel(item, x, lang)}</li>)}
          </ul>
        );
      } };
    case "textarea":
      return { ...base, wide: true, render: (visit) => (isEmpty(get(visit)) ? <Dash /> : <span className="whitespace-pre-wrap">{get(visit)}</span>) };
    default: // number | text | time
      return { ...base, render: (visit) => (isEmpty(get(visit)) ? <Dash /> : String(get(visit))) };
  }
}

function stockColumn(item, sectionId, sectionField) {
  const isArray = item.type === "stockArray";
  return {
    key: `${sectionId}.${item.path}`,
    sectionId,
    label: item.label,
    wide: true,
    render: (visit, { lang }) => {
      const section = visit?.[sectionField];
      const rows = item.blocks.map((b) => {
        const data = isArray
          ? (getIn(section, item.path) || []).find((r) => r.item === b.key) || {}
          : getIn(section, `${item.path}.${b.key}`) || {};
        return { b, data };
      });
      if (rows.every(({ data }) => item.fields.every((f) => isEmpty(data[f.key])))) return <Dash />;
      return (
        <div className="space-y-1.5">
          {rows.map(({ b, data }) => (
            <div key={b.key} className="rounded-lg border border-line bg-bg/60 px-2.5 py-1.5">
              <p className="text-xs font-bold text-ink">{pick(b.label, lang)}</p>
              <p className="text-[11px] leading-relaxed text-muted">
                {item.fields.map((f) => `${pick(f.label, lang)}: ${isEmpty(data[f.key]) ? "-" : data[f.key]}`).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      );
    },
  };
}

function walk(items, sectionId, sectionField, out) {
  items.forEach((item) => {
    switch (item.type) {
      case "heading":
      case "info":
      case "photo": // photos are shown together in the Photos column
        return;
      case "pair":
        item.fields.forEach((f) =>
          out.push(
            leafColumn(
              { type: "number", path: f.path, label: f.label },
              sectionId,
              sectionField,
              { en: `${pick(item.label, "en")} - ${pick(f.label, "en")}`, hi: `${pick(item.label, "hi")} - ${pick(f.label, "hi")}`, gu: `${pick(item.label, "gu")} - ${pick(f.label, "gu")}` }
            )
          )
        );
        return;
      case "group": {
        const groupLabel = item.label;
        // children get the group's label as context prefix (e.g. "Registered ... - Pregnant")
        item.children.forEach((c) => {
          if (c.type === "info" || c.type === "photo" || c.type === "heading") return;
          const lbl = {
            en: `${pick(groupLabel, "en")} - ${pick(c.label, "en")}`,
            hi: `${pick(groupLabel, "hi")} - ${pick(c.label, "hi")}`,
            gu: `${pick(groupLabel, "gu")} - ${pick(c.label, "gu")}`,
          };
          out.push(leafColumn(c, sectionId, sectionField, lbl));
        });
        return;
      }
      case "stock":
      case "stockArray":
        out.push(stockColumn(item, sectionId, sectionField));
        return;
      default:
        if (item.path) out.push(leafColumn(item, sectionId, sectionField));
    }
  });
}

export function buildQuestionColumns() {
  const out = [];
  SECTION_ORDER.forEach((id) => {
    const cfg = SECTIONS[id];
    walk(cfg.items, id, cfg.field, out);
  });
  return out;
}

export const SECTION_TITLE_KEY = {
  general: "sv.section.general",
  a: "sv.section.a",
  b: "sv.section.b",
  c: "sv.section.c",
};

// ---------------------------------------------------------------- photos
const TYPE_KEY = {
  heightWeight: "sv.photo.heightWeight",
  mealPlate: "sv.photo.mealPlate",
  leaving: "sv.photo.leaving",
};

// All photos of a visit: the flat `visit.photos` list plus any photo objects
// stored inside the sections. De-duplicated by url.
export function collectPhotos(visit, t, lang = "en") {
  const seen = new Set();
  const list = [];
  const push = (p, caption, extra) => {
    if (!p?.url || seen.has(p.url)) return;
    seen.add(p.url);
    list.push({ url: p.url, caption, latitude: p.latitude, longitude: p.longitude, capturedAt: p.capturedAt, extra });
  };

  (visit?.photos || []).forEach((p) => {
    const extra =
      p.type === "heightWeight"
        ? [p.childName && `${t("sv.child")}: ${p.childName}`, p.heightCm != null && `${t("sv.height")}: ${p.heightCm} cm`, p.weightKg != null && `${t("sv.weight")}: ${p.weightKg} kg`]
            .filter(Boolean)
            .join(" · ")
        : "";
    push(p, TYPE_KEY[p.type] ? t(TYPE_KEY[p.type]) : p.label || "", extra);
  });

  const scan = (items, section, lang) =>
    items.forEach((item) => {
      if (item.type === "photo") push(getIn(section, item.path), pick(item.label, lang));
      if (item.type === "group") scan(item.children, section, lang);
    });
  SECTION_ORDER.forEach((id) => scan(SECTIONS[id].items, visit?.[SECTIONS[id].field], lang));
  return list;
}
