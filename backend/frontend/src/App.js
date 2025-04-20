import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import EnvConfigPage from "./pages/EnvConfigPage";
import LogsPage from "./pages/LogsPage";

function App() {
  const isAuthenticated = localStorage.getItem("token") || false;
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/lambda/:functionName/env" element={isAuthenticated ? <EnvConfigPage /> : <Navigate to="/login" />} />
        <Route path="/lambda/:functionName/logs" element={isAuthenticated ? <LogsPage /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;