import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { tokens } from "../tokens";
import { Lock } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found"
          ? "Incorrect email or password."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-[900px] flex items-center justify-center" style={{ backgroundColor: tokens.bg, fontFamily: "'Inter', sans-serif" }}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl p-8" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="rounded-lg p-2" style={{ backgroundColor: tokens.indigoSoft }}>
            <Lock size={16} color={tokens.indigo} />
          </div>
          <div className="text-[11px] tracking-[0.2em] uppercase" style={{ color: tokens.textMuted }}>Brandix · Unit 4</div>
        </div>
        <h1 className="text-lg font-semibold mb-6" style={{ color: tokens.text, fontFamily: "'Space Grotesk', sans-serif" }}>Shade Control Sign In</h1>

        <label className="text-xs" style={{ color: tokens.textMuted }}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 mb-4 px-3 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}`, color: tokens.text }}
          placeholder="you@brandix.com"
        />

        <label className="text-xs" style={{ color: tokens.textMuted }}>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mt-1 mb-4 px-3 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}`, color: tokens.text }}
          placeholder="••••••••"
        />

        {error && <div className="text-xs mb-4" style={{ color: tokens.crimson }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: tokens.indigo, color: tokens.text, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-[11px] mt-4" style={{ color: tokens.textMuted }}>
          No account yet? Ask a super admin to create one for you from the Users tab.
        </p>
      </form>
    </div>
  );
}
