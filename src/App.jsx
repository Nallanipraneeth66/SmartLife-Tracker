// App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import TasksPage from "./pages/TasksPage";
import ExpensesPage from "./pages/ExpensesPage";
import HealthPage from "./pages/HealthPage";
import ProfilePage from "./pages/ProfilePage";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import { AuthProvider, useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  // Wait for AuthContext to finish loading user from localStorage
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0a0f24] to-[#000000]">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }
  
  // Only redirect if loading is complete and user is not authenticated
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("smartlife_theme");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const location = useLocation();
  const hideLayout = ["/login", "/signup"].includes(location.pathname);

  useEffect(() => {
    localStorage.setItem("smartlife_theme", JSON.stringify(dark));
  }, [dark]);

  return (
    <AuthProvider>
      <div
        className={`${dark ? "dark" : ""} min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f24] to-[#000000] text-white`}
      >
        {/* Navbar only if NOT login/signup */}
        {!hideLayout && <Navbar dark={dark} setDark={setDark} />}

        <main className={`flex-1 ${hideLayout ? "p-0" : "p-6 lg:p-10"}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TasksPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/health"
              element={
                <ProtectedRoute>
                  <HealthPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
