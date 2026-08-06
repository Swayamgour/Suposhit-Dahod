# Suposhit Dahod — Worker Portal

A modernized, multi-language dashboard & worker-entry portal for Dahod's
Anganwadi (nutrition centre) reporting system — built with React + Vite +
Tailwind CSS.

## What's new in this version

- **Modern, polished UI** — refreshed cards, shadows, hover/press states,
  a signature "sunrise arc" gauge, and subtle motion throughout.
- **Dark mode** — a working light/dark theme toggle in the top bar (saved
  to `localStorage`, respects system preference on first visit).
- **Multi-language support** — English, Hindi (हिन्दी) and Gujarati (ગુજરાતી)
  via the language switcher in the top bar and on the login screen.
  Add more languages by extending `src/i18n/translations.js`.
- **Branded login screen** — now uses the real Dahod Smart City logo
  (`public/logo.jpg`), with a language switcher and the same sunrise motif.

## Getting started

```bash
npm install
npm run dev       # start the dev server at http://localhost:5173
npm run build     # production build to /dist
npm run preview   # preview the production build
```

## Project structure

```
public/
  logo.jpg              Dahod Smart City logo (used in Sidebar & Login)
src/
  i18n/
    translations.js     English / Hindi / Gujarati dictionaries
    LanguageContext.jsx Language provider + useLanguage() hook
  components/
    Layout.jsx           App shell (sidebar + topbar + content)
    Sidebar.jsx           Left navigation, branded with the logo
    Topbar.jsx             Search, theme toggle, language switcher, user menu
    LanguageSwitcher.jsx   Language dropdown used in Topbar & Login
    SunArc.jsx              Sunrise-arc progress gauge
    StatusPill.jsx           Yes/No status chip
  pages/
    Login.jsx      Branded sign-in screen
    Dashboard.jsx    Sector-wise centre overview + KPI cards + table
    WorkerList.jsx     Worker/centre daily-entry records (list + grid view)
    WorkerEntry.jsx      Add/edit a daily entry
    Charts.jsx             Quick charts
    Info.jsx                  Field reference info
  data/mockData.js  Sample data used to power the screens
```

## Adding another language

Open `src/i18n/translations.js`, add a new language to the `languages`
array (e.g. `{ code: "mr", label: "Marathi", native: "मराठी" }`), then add a
matching `mr: { ... }` object with the same keys as the `en` dictionary.
It will automatically appear in the language switcher.

## Notes

- This is a front-end shell with sample data (`src/data/mockData.js`) —
  wire it up to your API by replacing the imports in `Dashboard.jsx` and
  `WorkerList.jsx`.
- Login is a UI-only stub (no real authentication) — connect
  `Login.jsx`'s `onSuccess` handler to your auth flow.
