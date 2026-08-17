import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// Roles mirror icds-backend/config/roles.js exactly
export const ROLES = {
  DISTRICT: "district", // PO / DDO - sees everything
  BLOCK: "block", // CDPO
  SECTOR: "sector", // MS / Supervisor
  AWC: "awc", // Worker
};

export const ROLE_LABELS = {
  [ROLES.DISTRICT]: "District (Manager)",
  [ROLES.BLOCK]: "Block (CDPO)",
  [ROLES.SECTOR]: "Sector (Mukhya Sevika)",
  [ROLES.AWC]: "AWC (Worker)",
};

// Order matters - index 0 is topmost. Mirrors icds-backend/config/roles.js ROLE_ORDER.
export const ROLE_ORDER = [ROLES.DISTRICT, ROLES.BLOCK, ROLES.SECTOR, ROLES.AWC];

// True if `reviewerRole` outranks `submitterRole` (can approve/reject their submissions)
export function outranks(reviewerRole, submitterRole) {
  return ROLE_ORDER.indexOf(reviewerRole) < ROLE_ORDER.indexOf(submitterRole);
}

const AuthContext = createContext(null);

function readStored() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
  let user = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }
  return { token, user };
}

export function AuthProvider({ children }) {
  const [{ token, user }, setState] = useState(readStored);

  // Called with the { success, token, user } payload returned by
  // POST /api/auth/login or /api/auth/register
  const login = useCallback((payload, remember = true) => {
    const store = remember ? localStorage : sessionStorage;
    store.setItem("token", payload.token);
    store.setItem("user", JSON.stringify(payload.user));
    setState({ token: payload.token, user: payload.user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setState({ token: null, user: null });
  }, []);

  const value = {
    token,
    user,
    role: user?.role || null,
    isAuthed: Boolean(token && user),
    login,
    logout,
  };

  // redux/api.jsx (RTK Query baseQuery) and utils/apiClient.js (plain fetch
  // for uploads/report downloads) both dispatch this event whenever a
  // request comes back 401 ("Not authorized, token invalid/expired/no
  // token"). Listening here means the login screen shows up wherever the
  // user is in the app, with no full page reload.
  useEffect(() => {
    window.addEventListener("auth:session-expired", logout);
    return () => window.removeEventListener("auth:session-expired", logout);
  }, [logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}