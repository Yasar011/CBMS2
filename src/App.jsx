import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { ThemeProvider, useTokens } from "./tokens";

function Gate() {
  const { authUser, profile, loading } = useAuth();
  const tokens = useTokens();

  if (loading) {
    return (
      <div className="w-full min-h-[900px] flex items-center justify-center" style={{ backgroundColor: tokens.bg, color: tokens.textMuted, fontFamily: "'Inter', sans-serif" }}>
        Loading…
      </div>
    );
  }

  if (!authUser) return <Login />;

  if (!profile) {
    return (
      <div className="w-full min-h-[900px] flex items-center justify-center text-center px-6" style={{ backgroundColor: tokens.bg, color: tokens.textMuted, fontFamily: "'Inter', sans-serif" }}>
        Signed in, but no profile record was found for this account.<br />Ask a super admin to add you from the Users tab.
      </div>
    );
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  );
}
