import React, { useEffect, useState } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";
import { tokens } from "../tokens";
import { objToArray } from "../lib";
import {
  LayoutDashboard, Warehouse, FlaskConical, CalendarClock, Scissors,
  FileBarChart, Settings, Bell, ChevronDown, LogOut, Users as UsersIcon
} from "lucide-react";
import { RMWHView, CuttingView, MQAView, PlanningView, ExecutiveView, ReportsView } from "./Views";
import UserManagement from "./UserManagement";

const ALL_NAV = [
  { key: "executive", label: "Executive", icon: LayoutDashboard, dept: "ALL" },
  { key: "rmwh", label: "RMWH", icon: Warehouse, dept: "RMWH" },
  { key: "mqa", label: "MQA", icon: FlaskConical, dept: "MQA" },
  { key: "planning", label: "Planning", icon: CalendarClock, dept: "PLANNING" },
  { key: "cutting", label: "Cutting", icon: Scissors, dept: "CUTTING" },
  { key: "reports", label: "Reports", icon: FileBarChart, dept: "ALL" },
];

function useDbList(path, enabled) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!enabled) return;
    const unsub = onValue(ref(db, path), (snap) => setData(objToArray(snap.val())), () => setData([]));
    return unsub;
  }, [path, enabled]);
  return data;
}

export default function Dashboard() {
  const { profile, logout } = useAuth();
  const isAdmin = profile?.role === "admin";
  const dept = profile?.dept;

  // Only fetch the paths this user is allowed to read, per database.rules.json
  const grnRecords = useDbList("depts/RMWH/grn", isAdmin || dept === "RMWH");
  const dockets = useDbList("depts/CUTTING/dockets", isAdmin || dept === "CUTTING");
  const mqaResults = useDbList("depts/MQA/results", isAdmin || dept === "MQA");
  const planningRows = useDbList("depts/PLANNING/rows", isAdmin || dept === "PLANNING");

  const visibleNav = isAdmin ? ALL_NAV : ALL_NAV.filter((n) => n.dept === dept);
  const [activeKey, setActiveKey] = useState(visibleNav[0]?.key || "rmwh");
  const [showUsers, setShowUsers] = useState(false);

  async function addRecord(path, data) {
    await set(push(ref(db, path)), data);
  }

  const titles = {
    executive: "Executive Dashboard",
    rmwh: "RMWH — Black Colour Batch Details",
    mqa: "Material Quality Assurance",
    planning: "Planning",
    cutting: "Cutting Dashboard",
    reports: "Reports",
  };

  return (
    <div className="w-full min-h-[900px] flex" style={{ backgroundColor: tokens.bg, color: tokens.text, fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div className="w-56 shrink-0 flex flex-col py-6 px-3" style={{ backgroundColor: "#0F1216", borderRight: `1px solid ${tokens.line}` }}>
        <div className="px-2 mb-8">
          <div className="text-[11px] tracking-[0.2em] uppercase" style={{ color: tokens.textMuted }}>Brandix · Unit 4</div>
          <div className="text-lg font-semibold mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Shade Control</div>
        </div>
        <nav className="flex flex-col gap-1">
          {visibleNav.map((item) => {
            const isActive = !showUsers && item.key === activeKey;
            const Icon = item.icon;
            return (
              <div key={item.key} onClick={() => { setShowUsers(false); setActiveKey(item.key); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors"
                style={{ backgroundColor: isActive ? tokens.indigoSoft : "transparent", color: isActive ? tokens.text : tokens.textMuted, borderLeft: isActive ? `2px solid ${tokens.indigo}` : "2px solid transparent" }}>
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </div>
            );
          })}
          {isAdmin && (
            <div onClick={() => setShowUsers(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors"
              style={{ backgroundColor: showUsers ? tokens.indigoSoft : "transparent", color: showUsers ? tokens.text : tokens.textMuted, borderLeft: showUsers ? `2px solid ${tokens.indigo}` : "2px solid transparent" }}>
              <UsersIcon size={16} strokeWidth={2} />
              Users
            </div>
          )}
        </nav>
        <div onClick={logout} className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer" style={{ color: tokens.textMuted }}>
          <LogOut size={16} />
          Sign Out
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: `1px solid ${tokens.line}` }}>
          <div>
            <h1 className="text-xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{showUsers ? "User Management" : titles[activeKey]}</h1>
            <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>SD BLACK 093 5A2/54A2 · style PN45159H60/F60/F61</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
              <Bell size={16} color={tokens.textMuted} />
            </div>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ backgroundColor: tokens.indigo }}>
                {(profile?.name || "?").slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm">{profile?.name || "Loading..."}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: tokens.panelAlt, color: tokens.textMuted }}>{profile?.role}</span>
              <ChevronDown size={14} color={tokens.textMuted} />
            </div>
          </div>
        </div>

        <div className="px-8 py-6 flex flex-col gap-6 overflow-auto">
          {showUsers && <UserManagement />}
          {!showUsers && activeKey === "executive" && <ExecutiveView grnRecords={grnRecords} dockets={dockets} results={mqaResults} />}
          {!showUsers && activeKey === "rmwh" && <RMWHView grnRecords={grnRecords} canWrite={isAdmin || dept === "RMWH"} onAdd={(data) => addRecord("depts/RMWH/grn", data)} />}
          {!showUsers && activeKey === "cutting" && <CuttingView dockets={dockets} canWrite={isAdmin || dept === "CUTTING"} onAdd={(data) => addRecord("depts/CUTTING/dockets", data)} />}
          {!showUsers && activeKey === "mqa" && <MQAView results={mqaResults} canWrite={isAdmin || dept === "MQA"} onAdd={(data) => addRecord("depts/MQA/results", data)} />}
          {!showUsers && activeKey === "planning" && <PlanningView rows={planningRows} canWrite={isAdmin || dept === "PLANNING"} onAdd={(data) => addRecord("depts/PLANNING/rows", data)} />}
          {!showUsers && activeKey === "reports" && <ReportsView grnRecords={grnRecords} dockets={dockets} />}
        </div>
      </div>
    </div>
  );
}
