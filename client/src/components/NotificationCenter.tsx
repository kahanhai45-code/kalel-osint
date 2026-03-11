import { useState, useEffect } from "react";
import { Bell, X, AlertTriangle, Shield, Globe, Radio, ChevronDown } from "lucide-react";
import { useI18n } from "../lib/i18n";

interface Notification {
  id: string;
  title: string;
  body: string;
  severity: "critical" | "high" | "medium" | "low";
  time: Date;
  read: boolean;
  source: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "Missile Fattah-2 Test Detected", body: "IRGC confirmed hypersonic missile test. Trajectory analysis in progress.", severity: "critical", time: new Date(Date.now() - 1200000), read: false, source: "SIGINT" },
  { id: "n2", title: "Dahieh Strikes — Beirut", body: "12 buildings hit in southern suburb. Hezbollah HQ targeted.", severity: "critical", time: new Date(Date.now() - 2400000), read: false, source: "IMINT" },
  { id: "n3", title: "Red Sea Maritime Attack", body: "Houthi drone struck oil tanker near Bab el-Mandeb strait.", severity: "high", time: new Date(Date.now() - 5400000), read: false, source: "OSINT" },
  { id: "n4", title: "Uranium Enrichment 63.5%", body: "IAEA confirms Iran enrichment above 60% threshold.", severity: "critical", time: new Date(Date.now() - 7200000), read: true, source: "HUMINT" },
  { id: "n5", title: "Cyber Attack Repelled", body: "Israeli power grid attack blocked by Shin Bet cyber unit.", severity: "medium", time: new Date(Date.now() - 10800000), read: true, source: "CYBINT" },
  { id: "n6", title: "Al-Asad Base Drone Attack", body: "Pro-Iran militia launched drone attack on US base in Iraq.", severity: "high", time: new Date(Date.now() - 14400000), read: true, source: "OSINT" },
];

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const { t } = useI18n();

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const timeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-white/40 hover:text-white/60"
      >
        <Bell size={14} />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">{unreadCount}</span>
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-50 w-96 bg-[#0a1020] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Radio size={12} className="text-red-500 animate-pulse" />
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Intel Alerts</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-[8px] font-bold text-red-400">{unreadCount}</span>
                )}
              </div>
              <button onClick={markAllRead} className="text-[9px] text-[#00a8ff]/60 hover:text-[#00a8ff] transition-colors font-bold uppercase tracking-widest">
                Mark all read
              </button>
            </div>

            {/* Notifications */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-all ${!n.read ? "bg-white/[0.02]" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: SEVERITY_COLORS[n.severity] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[11px] font-semibold ${!n.read ? "text-white/80" : "text-white/50"} truncate`}>{n.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[8px] text-white/20">{timeAgo(n.time)}</span>
                          <button onClick={() => dismiss(n.id)} className="text-white/15 hover:text-white/40 transition-colors">
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-white/30 mt-0.5 leading-relaxed">{n.body}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest font-bold" style={{ color: SEVERITY_COLORS[n.severity], backgroundColor: SEVERITY_COLORS[n.severity] + "15" }}>
                          {n.severity}
                        </span>
                        <span className="text-[8px] text-white/15 uppercase tracking-widest">{n.source}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
