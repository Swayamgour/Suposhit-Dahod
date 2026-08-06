import React from "react";
import { Link } from "react-router-dom";
import { List, Info, Paperclip, Check, RotateCcw, X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function MukhyaDevikaEntry() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header section with Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold text-ink flex items-center gap-2">
          <List className="text-primary" size={28} />
          {t("mukhya.form.title")}
        </h1>
      </div>

      <div className="rounded-2xl border border-line bg-surface shadow-card">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-bg/50">
          <h2 className="text-lg font-bold text-ink">{t("mukhya.form.heading")}</h2>
          <button
            className="rounded-full p-2 text-primary hover:bg-primary/10 transition-colors"
            title="Form information"
          >
            <Info size={20} />
          </button>
        </div>

        {/* Card Body / Form */}
        <div className="p-5 space-y-6">
          <form className="space-y-8">
            
            {/* Section 1: General Information 1 */}
            <fieldset className="rounded-xl border border-line p-5">
              <legend className="px-3 text-sm font-bold text-muted uppercase tracking-wider">
                {t("mukhya.form.section1")}
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                
                {/* Component Name */}
                <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-semibold text-ink">
                    {t("mukhya.form.component")}
                    <Info size={14} className="ml-2 text-muted" />
                  </label>
                  <select className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">{t("mukhya.form.select")} {t("mukhya.form.component")}</option>
                  </select>
                </div>

                {/* Sector Name */}
                <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-semibold text-ink">
                    {t("mukhya.form.sector")}
                    <Info size={14} className="ml-2 text-muted" />
                  </label>
                  <select className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">{t("mukhya.form.select")} {t("mukhya.form.sector")}</option>
                  </select>
                </div>

                {/* Mukhya Sevika Name */}
                <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-semibold text-ink">
                    {t("mukhya.form.sevikaName")}
                    <Info size={14} className="ml-2 text-muted" />
                  </label>
                  <input 
                    type="text" 
                    placeholder={t("mukhya.form.sevikaName")}
                    className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Number of Registered Children */}
                <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-semibold text-ink">
                    {t("mukhya.form.regChildren")}
                    <Info size={14} className="ml-2 text-muted" />
                  </label>
                  <input 
                    type="number" 
                    placeholder={t("mukhya.form.regChildren")}
                    className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Anganwadi Center Name */}
                <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-semibold text-ink">
                    {t("mukhya.form.anganwadiName")}
                    <Info size={14} className="ml-2 text-muted" />
                  </label>
                  <select className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">{t("mukhya.form.select")} {t("mukhya.form.anganwadiName")}</option>
                  </select>
                </div>

                {/* Arrival Photo */}
                <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-semibold text-ink">
                    {t("mukhya.form.arrivalPhoto")}
                    <Info size={14} className="ml-2 text-muted" />
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      readOnly 
                      placeholder={t("mukhya.form.chooseFile")}
                      className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm cursor-pointer pr-12 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button type="button" className="absolute right-2 p-1.5 text-muted hover:text-primary transition-colors">
                      <Paperclip size={18} />
                    </button>
                  </div>
                  {/* Image Preview Placeholder */}
                  <div className="mt-2 h-24 w-32 rounded-lg border border-line overflow-hidden bg-bg/50">
                     <img src="https://suposhitdahod.dahodsmartcity.in/api/api/image/th/1757921296575?t=1785925288941" alt="Preview" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Registered children 3-6 */}
                <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-semibold text-ink">
                    {t("mukhya.form.regChildren3to6")}
                    <Info size={14} className="ml-2 text-muted" />
                  </label>
                  <input 
                    type="number" 
                    readOnly
                    placeholder={t("mukhya.form.regChildren3to6")}
                    className="w-full rounded-lg border border-line bg-bg/50 px-4 py-2.5 text-sm text-muted cursor-not-allowed"
                  />
                </div>

                {/* Present children at visit */}
                <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-semibold text-ink">
                    {t("mukhya.form.presentChildren")}
                    <Info size={14} className="ml-2 text-muted" />
                  </label>
                  <input 
                    type="number" 
                    placeholder={t("mukhya.form.presentChildren")}
                    className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </fieldset>

            {/* Section 2: Registers */}
            <fieldset className="rounded-xl border border-line p-5">
              <legend className="px-3 text-sm font-bold text-muted uppercase tracking-wider">
                {t("mukhya.form.section2")}
              </legend>
              <div className="grid grid-cols-1 gap-6 mt-2">
                
                {[
                  t("mukhya.form.reg1"), 
                  t("mukhya.form.reg2"), 
                  t("mukhya.form.reg3"), 
                  t("mukhya.form.reg4")
                ].map((regLabel, i) => (
                  <div key={i} className="space-y-1.5 md:w-1/2">
                    <label className="flex items-center text-sm font-semibold text-ink">
                      {regLabel}
                      <Info size={14} className="ml-2 text-muted" />
                    </label>
                    <select className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="">{t("mukhya.form.select")} {regLabel}</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                ))}
                
              </div>
            </fieldset>

            {/* Section 3: General Information 2 */}
            <fieldset className="rounded-xl border border-line p-5">
              <legend className="px-3 text-sm font-bold text-muted uppercase tracking-wider">
                {t("mukhya.form.section3")}
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                
                {/* Pre-primary Photo */}
                <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-semibold text-ink">
                    {t("mukhya.form.preprimaryPhoto")}
                    <Info size={14} className="ml-2 text-muted" />
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      readOnly 
                      placeholder={t("mukhya.form.chooseFile")}
                      className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm cursor-pointer pr-12 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button type="button" className="absolute right-2 p-1.5 text-muted hover:text-primary transition-colors">
                      <Paperclip size={18} />
                    </button>
                  </div>
                </div>

              </div>
            </fieldset>

            {/* Form Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-6">
               <button type="button" className="flex items-center gap-2 rounded-xl border border-line bg-bg px-5 py-2.5 text-sm font-bold text-ink hover:bg-surface hover:shadow-sm transition-all">
                  <RotateCcw size={16} />
                  {t("mukhya.form.reset")}
               </button>
               <Link to="/mukhya-sevika" className="flex items-center gap-2 rounded-xl border border-line bg-bg px-5 py-2.5 text-sm font-bold text-ink hover:bg-surface hover:shadow-sm transition-all">
                  <X size={16} />
                  {t("mukhya.form.close")}
               </Link>
               <button type="submit" className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-primary-dark transition-colors">
                  <Check size={16} />
                  {t("mukhya.form.submit")}
               </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
