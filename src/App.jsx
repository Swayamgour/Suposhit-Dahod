import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import WorkerList from "./pages/WorkerList.jsx";
import WorkerEntry from "./pages/WorkerEntry.jsx";
import Charts from "./pages/Charts.jsx";
import Info from "./pages/Info.jsx";
import MukhyaDevikaDetails from "./pages/MukhyaDevikaDetails.jsx";
import MukhyaDevikaEntry from "./pages/MukhyaDevikaEntry.jsx";
import ApplicationDashboard from "./pages/ApplicationDashboard.jsx";
import ApplicationUsers from "./pages/ApplicationUsers.jsx";
import AddUser from "./pages/AddUser.jsx";
import TasksPage from "./pages/TasksPage.jsx";
import GradesPage from "./pages/GradesPage.jsx";
import NoticesPage from "./pages/NoticesPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import { useAuth, ROLES } from "./context/AuthContext.jsx";
import ApplicationUsersAwc from "./pages/ApplicationUsersAwc.jsx";
import Profile from "./pages/Profile.jsx";

// Wraps a route element and only renders it if the logged-in user's role is
// in `allow`. Mirrors the backend's own role checks (authorize / role ===
// checks inside each controller), so a role that the API would reject never
// even gets to submit the request from the UI.
function RoleGate({ allow, children }) {
  const { role } = useAuth();
  if (!allow || allow.includes(role)) return children;
  return <Navigate to="/" replace />;
}

export default function App() {
  const { isAuthed, logout } = useAuth();

  if (!isAuthed) {
    return <Login onSuccess={() => {}} />;
  }

  return (
    <Layout onLogout={logout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />

        {/* Worker (AWC) daily center records - POST /api/records is awc-only */}
        <Route path="/workers" element={<WorkerList />} />
        <Route
          path="/workers/new"
          element={
            <RoleGate allow={[ROLES.AWC]}>
              <WorkerEntry />
            </RoleGate>
          }
        />

        <Route path="/charts" element={<Charts />} />
        <Route path="/info" element={<Info />} />

        {/* GET /api/users has no server-side role restriction, but AWC only
            ever gets its own single record back - not useful as a nav
            destination, so it's hidden from Sidebar for awc and gated here too */}
        <Route
          path="/applications"
          element={
            <RoleGate allow={[ROLES.DISTRICT, ROLES.BLOCK, ROLES.SECTOR]}>
              <ApplicationDashboard />
            </RoleGate>
          }
        />
        <Route
          path="/applications/users"
          element={
            <RoleGate allow={[ROLES.DISTRICT, ROLES.BLOCK, ROLES.SECTOR]}>
              <ApplicationUsers />
            </RoleGate>
          }
        />
        <Route
          path="/AwcUser"
          element={
            <RoleGate allow={[ROLES.DISTRICT, ROLES.BLOCK, ROLES.SECTOR]}>
              <ApplicationUsersAwc />
            </RoleGate>
          }
        />
        <Route
          path="/Profile"
          element={
            <RoleGate allow={[ROLES.DISTRICT, ROLES.BLOCK, ROLES.SECTOR]}>
              <Profile />
            </RoleGate>
          }
        />
        <Route
          path="/applications/users/new"
          element={
            <RoleGate allow={[ROLES.DISTRICT, ROLES.BLOCK, ROLES.SECTOR]}>
              <AddUser />
            </RoleGate>
          }
        />

        {/* Mukhya Sevika (sector) visit entries - GET /api/mukhya-sevika
            403s for awc server-side, so gate the listing route too */}
        <Route
          path="/mukhya-sevika"
          element={
            <RoleGate allow={[ROLES.DISTRICT, ROLES.BLOCK, ROLES.SECTOR]}>
              <MukhyaDevikaDetails />
            </RoleGate>
          }
        />
        <Route
          path="/mukhya-sevika/form"
          element={
            <RoleGate allow={[ROLES.SECTOR]}>
              <MukhyaDevikaEntry />
            </RoleGate>
          }
        />

        {/* Tasks - assignment (district/block/sector), submission (sector/awc), all can view */}
        <Route path="/tasks" element={<TasksPage />} />

        {/* Performance grading - all roles can view (awc sees only its own via scopeFilter) */}
        <Route path="/grades" element={<GradesPage />} />

        {/* Auto-generated notices - all roles */}
        <Route path="/notices" element={<NoticesPage />} />

        {/* Excel/PDF export - matches Sidebar's role restriction */}
        <Route
          path="/reports"
          element={
            <RoleGate allow={[ROLES.DISTRICT, ROLES.BLOCK, ROLES.SECTOR]}>
              <ReportsPage />
            </RoleGate>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
