import React, { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../firebase";
import { createUserAsAdmin } from "../firebaseSecondary";
import { tokens } from "../tokens";
import { objToArray } from "../lib";
import { UserPlus, Users as UsersIcon } from "lucide-react";

const DEPTS = ["RMWH", "MQA", "PLANNING", "CUTTING"];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user", dept: "RMWH" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, "users"), (snap) => setUsers(objToArray(snap.val())));
    return unsub;
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setStatus("");
    setBusy(true);
    try {
      const uid = await createUserAsAdmin(form.email.trim(), form.password);
      await set(ref(db, `users/${uid}`), {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        dept: form.role === "admin" ? "ALL" : form.dept,
      });
      setStatus(`Created ${form.email}`);
      setForm({ name: "", email: "", password: "", role: "user", dept: "RMWH" });
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={16} color={tokens.indigo} />
          <h2 className="text-sm font-semibold">Add User</h2>
        </div>
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3 max-w-xl">
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 rounded-lg text-sm outline-none col-span-2" style={{ backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}`, color: tokens.text }} />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}`, color: tokens.text }} />
          <input required type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}`, color: tokens.text }} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}`, color: tokens.text }}>
            <option value="user">User (single dept)</option>
            <option value="admin">Admin (all depts)</option>
          </select>
          {form.role === "user" && (
            <select value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}
              className="px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}`, color: tokens.text }}>
              {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <button type="submit" disabled={busy} className="col-span-2 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: tokens.indigo, color: tokens.text, opacity: busy ? 0.6 : 1 }}>
            {busy ? "Creating..." : "Create User"}
          </button>
        </form>
        {status && <p className="text-xs mt-3" style={{ color: tokens.textMuted }}>{status}</p>}
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <div className="flex items-center gap-2 mb-4">
          <UsersIcon size={16} color={tokens.indigo} />
          <h2 className="text-sm font-semibold">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.line}` }}>
                {["Name", "Email", "Role", "Department"].map((h) => (
                  <th key={h} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4" style={{ color: tokens.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2 pr-4 text-xs">{u.name}</td>
                  <td className="py-2 pr-4 text-xs font-mono">{u.email}</td>
                  <td className="py-2 pr-4 text-xs capitalize">{u.role}</td>
                  <td className="py-2 pr-4 text-xs">{u.dept}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-xs" style={{ color: tokens.textMuted }}>No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
