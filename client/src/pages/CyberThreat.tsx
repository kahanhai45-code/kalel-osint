import { useState, useEffect, useCallback, useRef } from "react";
import { MapView } from "@/components/Map";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Shield, Zap, Globe, AlertTriangle, RefreshCw, Loader2,
  Server, Wifi, Lock, Unlock, Bug, Radio, Activity, Eye
} from "lucide-react";
import { useI18n } from "../lib/i18n";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

interface CyberEvent {
  id: string; type: string; source: { country: string; city: string; lat: number; lng: number; ip: string };
  target: { country: string; city: string; lat: number; lng: number; ip: string };
  severity: "critical" | "high" | "medium" | "low"; timestamp: Date; protocol: string; port: number;
}

const ATTACK_TYPES = ["DDoS", "Brute Force", "SQL Injection", "XSS", "Ransomware", "Phishing", "Zero-Day", "APT", "Port Scan", "Malware C2"];
const COUNTRIES = [
  { country: "Russia", city: "Moscow", lat: 55.75, lng: 37.62 },
  { country: "China", city: "Beijing", lat: 39.90, lng: 116.40 },
  { country: "Iran", city: "Tehran", lat: 35.69, lng: 51.39 },
  { country: "North Korea", city: "Pyongyang", lat: 39.03, lng: 125.75 },
  { country: "USA", city: "Washington", lat: 38.90, lng: -77.04 },
  { country: "Israel", city: "Tel Aviv", lat: 32.07, lng: 34.78 },
  { country: "UK", city: "London", lat: 51.51, lng: -0.13 },
  { country: "Germany", city: "Berlin", lat: 52.52, lng: 13.41 },
  { country: "Brazil", city: "Sao Paulo", lat: -23.55, lng: -46.63 },
  { country: "India", city: "Mumbai", lat: 19.08, lng: 72.88 },
  { country: "Turkey", city: "Istanbul", lat: 41.01, lng: 28.98 },
  { country: "Pakistan", city: "Islamabad", lat: 33.69, lng: 73.04 },
];

const SEVERITY_COLORS: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e" };
const SEVERITY_LIST: ("critical" | "high" | "medium" | "low")[] = ["critical", "high", "medium", "low"];

function generateEvent(): CyberEvent {
  const src = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  let tgt = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  while (tgt.country === src.country) tgt = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  return {
    id: Math.random().toString(36).slice(2, 10),
    type: ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)],
    source: { ...src, ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` },
    target: { ...tgt, ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` },
    severity: SEVERITY_LIST[Math.floor(Math.random() * 4)],
    timestamp: new Date(),
    protocol: ["TCP", "UDP", "HTTP", "HTTPS", "SSH", "RDP", "SMB"][Math.floor(Math.random() * 7)],
    port: [22, 80, 443, 3389, 445, 8080, 3306, 5432, 27017][Math.floor(Math.random() * 9)],
  };
}

export default function CyberThreat() {
  const mapRef = useRef<L.Map | null>(null);
  const linesLayer = useRef<L.LayerGroup>(L.layerGroup());
  const { t } = useI18n();
  const [events, setEvents] = useState<CyberEvent[]>([]);
  const [running, setRunning] = useState(true);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0, blocked: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [topAttackers, setTopAttackers] = useState<any[]>([]);

  // Generate events
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const ev = generateEvent();
      setEvents(prev => [ev, ...prev].slice(0, 100));
      setStats(prev => ({
        total: prev.total + 1,
        critical: prev.critical + (ev.severity === "critical" ? 1 : 0),
        high: prev.high + (ev.severity === "high" ? 1 : 0),
        blocked: prev.blocked + (Math.random() > 0.3 ? 1 : 0),
      }));

      // Draw attack line on map
      if (mapRef.current) {
        const color = SEVERITY_COLORS[ev.severity];
        const line = L.polyline(
          [[ev.source.lat, ev.source.lng], [ev.target.lat, ev.target.lng]],
          { color, weight: 1.5, opacity: 0.6, dashArray: "4 4" }
        ).addTo(linesLayer.current);
        setTimeout(() => linesLayer.current.removeLayer(line), 5000);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [running]);

  // Chart data
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        const next = [...prev, { time: new Date().toLocaleTimeString("en-GB", { minute: "2-digit", second: "2-digit" }), attacks: Math.floor(Math.random() * 20) + 5 }];
        return next.slice(-30);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Top attackers
  useEffect(() => {
    const interval = setInterval(() => {
      const counts: Record<string, number> = {};
      events.forEach(e => { counts[e.source.country] = (counts[e.source.country] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
      setTopAttackers(sorted);
    }, 3000);
    return () => clearInterval(interval);
  }, [events]);

  useEffect(() => {
    if (mapRef.current) {
      linesLayer.current.addTo(mapRef.current);
      mapRef.current.setView([25, 40], 3);
    }
  }, [mapRef.current]);

  const BAR_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <Shield size={16} className="text-red-400" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">CYBER THREAT MAP</h1>
          <div className="flex items-center gap-1.5 ml-2">
            <div className={`w-1.5 h-1.5 rounded-full ${running ? "bg-red-500 animate-pulse" : "bg-white/20"}`} />
            <span className="text-[9px] text-red-400/70 font-bold uppercase tracking-widest">{running ? "LIVE" : "PAUSED"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRunning(!running)} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all border ${running ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
            {running ? "Pause" : "Resume"}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapView className="absolute inset-0" onMapReady={m => { mapRef.current = m; }} />

          {/* Stats overlay */}
          <div className="absolute top-3 left-3 z-[1001] flex gap-2">
            <StatBadge icon={Zap} label="TOTAL" value={stats.total} color="#00a8ff" />
            <StatBadge icon={AlertTriangle} label="CRITICAL" value={stats.critical} color="#ef4444" />
            <StatBadge icon={Shield} label="BLOCKED" value={stats.blocked} color="#22c55e" />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-[#070d1a] border-l border-white/[0.06] flex flex-col overflow-hidden">
          {/* Live Chart */}
          <div className="p-3 border-b border-white/[0.06]">
            <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">ATTACK FREQUENCY</h3>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <Area type="monotone" dataKey="attacks" stroke="#ef4444" fill="#ef444420" strokeWidth={1.5} />
                  <XAxis dataKey="time" hide />
                  <YAxis hide />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Attackers */}
          <div className="p-3 border-b border-white/[0.06]">
            <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">TOP ATTACKERS</h3>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAttackers} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 8, fill: "#ffffff40" }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {topAttackers.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Event Feed */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-1 mb-1">LIVE FEED</h3>
            {events.slice(0, 30).map(ev => (
              <div key={ev.id} className="p-2 rounded-lg bg-black/30 border border-white/[0.04] hover:border-white/[0.08] transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[ev.severity] }} />
                  <span className="text-[9px] font-bold text-white/60">{ev.type}</span>
                  <span className="text-[7px] ml-auto font-bold uppercase tracking-widest px-1 py-0.5 rounded" style={{ color: SEVERITY_COLORS[ev.severity], backgroundColor: SEVERITY_COLORS[ev.severity] + "15" }}>{ev.severity}</span>
                </div>
                <div className="text-[8px] text-white/30 font-mono">
                  {ev.source.ip} ({ev.source.country}) → {ev.target.ip} ({ev.target.country})
                </div>
                <div className="text-[7px] text-white/15 mt-0.5">{ev.protocol}:{ev.port}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-[#070d1a]/90 backdrop-blur-xl border border-white/[0.06]">
      <div className="flex items-center gap-1.5">
        <Icon size={10} style={{ color }} />
        <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: color + "80" }}>{label}</span>
      </div>
      <div className="text-sm font-[Rajdhani] font-bold text-white/80 mt-0.5">{value.toLocaleString()}</div>
    </div>
  );
}
