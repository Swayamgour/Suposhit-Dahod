import React, { useState } from "react";
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

export default function App() {
  const [authed, setAuthed] = useState(false);

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  return (
    <Layout onLogout={() => setAuthed(false)}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workers" element={<WorkerList />} />
        <Route path="/workers/new" element={<WorkerEntry />} />
        <Route path="/workers/:id" element={<WorkerEntry />} />
        <Route path="/charts" element={<Charts />} />
        <Route path="/info" element={<Info />} />
        <Route path="/applications" element={<ApplicationDashboard />} />
        <Route path="/applications/users" element={<ApplicationUsers />} />
        <Route path="/mukhya-sevika" element={<MukhyaDevikaDetails />} />
        <Route path="/mukhya-sevika/form" element={<MukhyaDevikaEntry />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
