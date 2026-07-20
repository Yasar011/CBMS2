import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { ThemeProvider, useTokens } from "./tokens";

// Catches any render-time exception and shows a readable error card
// instead of a completely blank screen.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err) {
    return { error: err };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "#12151A", color: "#E9EAE4", fontFamily: "'Inter', sans-serif", padding: 32,
        }}>
          <div style={{
            backgroundColor: "#1B2027", border: "1px solid #B23A3A", borderRadius: 12,
            padding: "2rem", maxWidth: 480, width: "100%",
          }}>
            <div style={{ color: "#B23A3A", fontWeight: 600, marginBottom: 8 }}>Something went wrong</div>
            <pre style={{ fontSize: 11, color: "#8B93A0", whiteSpace: "pre-wrap", marginBottom: 16 }}>
              {this.state.error.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ backgroundColor: "#3B5BA5", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13 }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
