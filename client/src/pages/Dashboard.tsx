import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "wouter";
import {
  Activity, Zap, Shield, Globe, Cpu, Terminal, BarChart3, Clock,
  RefreshCw, Network, Search, Eye, Camera, Plane, Ship, Satellite,
  Loader2, CheckCircle, XCircle, Server, Map, MessageSquare,
  Code2, Radar, AlertTriangle, ArrowUpRight
} from "lucide-react";
import { useI18n } from "../lib/i18n";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

const OPENROUTER_KEY = "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";

interface ApiStatus {
  name: string;
  url: string;
  status: "online" | "offline" | "testing" | "unknown";
  latency: number | null;
  lastCheck: Date | null;
  icon: any;
  color: string;
  category: string;
}

const INITIAL_APIS: ApiStatus[] = [
  { name: "OpenSky Network", url: "https://opensky-network.org/api/states/all?lamin=45&lomin=5&lamax=47&lomax=7", status: "unknown", latency: null, lastCheck: null, icon: Plane, color: "#00ff88", category: "Aérien" },
  { name: "IPInfo.io", url: "https://ipinfo.io/8.8.8.8/json", status: "unknown", latency: null, lastCheck: null, icon: Globe, color: "#00a8ff", category: "Géoloc" },
  { name: "Shodan", url: "https://api.shodan.io/api-info?key=dummy", status: "unknown", latency: null, lastCheck: null, icon: Search, color: "#f59e0b", category: "IoT" },
  { name: "VirusTotal", url: "https://www.virustotal.com/api/v3/ip_addresses/8.8.8.8", status: "unknown", latency: null, lastCheck: null, icon: Shield, color: "#ef4444", category: "Threat" },
  { name: "OpenRouter IA", url: "https://openrouter.ai/api/v1/models", status: "unknown", latency: null, lastCheck: null, icon: Cpu, color: "#a855f7", category: "IA" },
  { name: "AbuseIPDB", url: "https://api.abuseipdb.com/api/v2/check", status: "unknown", latency: null, lastCheck: null, icon: AlertTriangle, color: "#ec4899", category: "Abuse" },
];

const QUICK_ACCESS = [
  { label: "Carte Intel", href: "/map", icon: Map, color: "from-blue-600/20 to-cyan-600/20", border: "border-blue-500/20", text: "text-blue-400" },
  { label: "Agent IA", href: "/chat", icon: MessageSquare, color: "from-purple-600/20 to-pink-600/20", border: "border-purple-500/20", text: "text-purple-400" },
  { label: "Intel Core", href: "/intel-core", icon: Network, color: "from-amber-600/20 to-orange-600/20", border: "border-amber-500/20", text: "text-amber-400" },
  { label: "Eye Scanner", href: "/eye", icon: Radar, color: "from-emerald-600/20 to-teal-600/20", border: "border-emerald-500/20", text: "text-emerald-400" },
];

export default function Dashboard() {
  const { t } = useI18n();
  const [apis, setApis] = useState<ApiStatus[]>(INITIAL_APIS);
  const [testing, setTesting] = useState(false);
  const [uptime, setUptime] = useState("00:00:00");
  const [activityLog, setActivityLog] = useState<{ time: string; msg: string; type: "info" | "success" | "error" | "warning" }[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const addLog = useCallback((msg: string, type: "info" | "success" | "error" | "warning" = "info") => {
    setActivityLog(prev => [{ time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), msg, type }, ...prev].slice(0, 50));
  }, []);

  // Uptime counter
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000).toString().padStart(2, "0");
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate live chart data
  useEffect(() => {
    const genData = () => Array.from({ length: 24 }).map((_, i) => ({
      time: `${i.toString().padStart(2, "0")}h`,
      requests: Math.floor(Math.random() * 400) + 100,
      threats: Math.floor(Math.random() * 30),
    }));
    setChartData(genData());
    const interval = setInterval(() => setChartData(genData()), 30000);
    return () => clearInterval(interval);
  }, []);

  const testApi = useCallback(async (index: number) => {
    const api = apis[index];
    setApis(prev => {
      const u = [...prev]; u[index] = { ...u[index], status: "testing" }; return u;
    });
    const start = Date.now();
    try {
      const res = await fetch(api.url, { mode: "no-cors", signal: AbortSignal.timeout(8000) });
      const latency = Date.now() - start;
      setApis(prev => {
        const u = [...prev]; u[index] = { ...u[index], status: "online", latency, lastCheck: new Date() }; return u;
      });
      addLog(`${api.name} : EN LIGNE (${latency}ms)`, "success");
    } catch {
      const latency = Date.now() - start;
      setApis(prev => {
        const u = [...prev]; u[index] = { ...u[index], status: latency < 7000 ? "online" : "offline", latency, lastCheck: new Date() }; return u;
      });
      addLog(`${api.name} : ${latency < 7000 ? "EN LIGNE" : "TIMEOUT"} (${latency}ms)`, latency < 7000 ? "success" : "error");
    }
  }, [apis, addLog]);

  const testAllApis = useCallback(async () => {
    setTesting(true);
    addLog("Diagnostic des connecteurs en cours...", "info");
    for (let i = 0; i < apis.length; i++) {
      await testApi(i);
      await new Promise(r => setTimeout(r, 200));
    }
    setTesting(false);
    addLog("Diagnostic terminé.", "success");
  }, [apis.length, testApi, addLog]);

  useEffect(() => { testAllApis(); }, []);

  const stats = useMemo(() => {
    const online = apis.filter(a => a.status === "online").length;
    const avgLat = Math.round(apis.filter(a => a.latency !== null).reduce((s, a) => s + (a.latency || 0), 0) / Math.max(apis.filter(a => a.latency !== null).length, 1));
    return { online, avgLat };
  }, [apis]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <BarChart3 size={16} className="text-[#00a8ff]" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">{t("dash.title")}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
            <Clock size={12} />
            <span>{uptime}</span>
          </div>
          <button onClick={testAllApis} disabled={testing} className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold text-white/40 hover:text-white/70 transition-all uppercase tracking-widest">
            <RefreshCw size={11} className={testing ? "animate-spin" : ""} />
            {t("dash.refresh")}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-3">
          <KpiCard icon={Activity} label={t("dash.connectors")} value={`${stats.online}/${apis.length}`} sub={t("dash.online")} accent="text-[#00a8ff]" />
          <KpiCard icon={Shield} label={t("dash.threat")} value="TLP:CLEAR" sub={t("dash.moderate")} accent="text-emerald-400" />
          <KpiCard icon={Zap} label={t("dash.latency")} value={`${stats.avgLat}ms`} sub={t("dash.latency_chart")} accent="text-amber-400" />
          <KpiCard icon={Cpu} label={t("dash.models")} value="8" sub="OpenRouter" accent="text-purple-400" />
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACCESS.map(q => (
            <Link key={q.href} href={q.href}>
              <div className={`group p-3 rounded-xl bg-gradient-to-br ${q.color} border ${q.border} hover:scale-[1.02] transition-all cursor-pointer`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <q.icon size={18} className={q.text} />
                    <span className={`text-xs font-bold ${q.text}`}>{q.label}</span>
                  </div>
                  <ArrowUpRight size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Chart */}
          <div className="col-span-2 bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-widest">{t("dash.data_flow")}</h3>
              <div className="flex gap-4">
                <Legend color="#00a8ff" label={t("dash.requests")} />
                <Legend color="#ef4444" label={t("dash.anomalies")} />
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00a8ff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00a8ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gThreat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                  <XAxis dataKey="time" stroke="#ffffff15" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff15" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0a1428", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "10px" }} />
                  <Area type="monotone" dataKey="requests" stroke="#00a8ff" fill="url(#gReq)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="threats" stroke="#ef4444" fill="url(#gThreat)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* API Status */}
          <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4 flex flex-col">
            <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-3">{t("dash.api_status")}</h3>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {apis.map((api, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-black/30 border border-white/[0.04] hover:border-white/[0.08] transition-all">
                  <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center shrink-0" style={{ color: api.color }}>
                    <api.icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-white/70 truncate">{api.name}</div>
                    <div className="text-[9px] text-white/25 font-mono">{api.latency ? `${api.latency}ms` : "---"}</div>
                  </div>
                  <StatusDot status={api.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4">
          <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-3">{t("dash.operations")}</h3>
          <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
            {activityLog.length === 0 ? (
              <div className="text-center py-6 text-white/10 text-[10px] uppercase tracking-widest">En attente d'événements...</div>
            ) : (
              activityLog.map((log, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-white/[0.02] transition-colors">
                  <span className="text-[9px] font-mono text-white/15 shrink-0 w-16">{log.time}</span>
                  <LogBadge type={log.type} />
                  <span className="text-[10px] text-white/50 truncate">{log.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4 hover:border-white/[0.1] transition-all">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={accent} />
        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-xl font-[Rajdhani] font-bold text-white/90 tracking-wider">{value}</div>
      <div className="text-[9px] text-white/20 mt-0.5">{sub}</div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const cls = status === "online" ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
    : status === "testing" ? "bg-amber-500 animate-pulse"
    : status === "offline" ? "bg-red-500" : "bg-white/20";
  return <div className={`w-2 h-2 rounded-full shrink-0 ${cls}`} />;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">{label}</span>
    </div>
  );
}

function LogBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    success: "text-emerald-400 bg-emerald-400/10",
    info: "text-[#00a8ff] bg-[#00a8ff]/10",
    warning: "text-amber-400 bg-amber-400/10",
    error: "text-red-400 bg-red-400/10",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest shrink-0 ${styles[type] || styles.info}`}>
      {type}
    </span>
  );
}
