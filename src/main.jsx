import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import "./index.css";
import { Provider } from "react-redux";
import { store } from './redux/store.jsx'

// Apply saved theme before first paint to avoid a flash of the wrong theme.
const savedTheme = localStorage.getItem("suposhit-dahod-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  document.documentElement.classList.add("dark");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </LanguageProvider>
  </React.StrictMode>
);
