import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "wouter";
import {
  Activity, Zap, Shield, Globe, Cpu, BarChart3, Clock,
  RefreshCw, Network, Search, Plane, Map, MessageSquare,
  Radar, AlertTriangle, ArrowUpRight, Radio, Crosshair,
  Eye, Satellite, Wifi, TrendingUp, TrendingDown, Minus
} from "lucide-react";
import { useI18n } from "../lib/i18n";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

const OPENROUTER_KEY = "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";

interface ApiStatus {
  name: string; url: string; status: "online" | "offline" | "testing" | "unknown";
  latency: number | null; lastCheck: Date | null; icon: any; color: string; category: string;
}

const INITIAL_APIS: ApiStatus[] = [
  { name: "ip-api.com", url: "/api/geoip/8.8.8.8", status: "unknown", latency: null, lastCheck: null, icon: Globe, color: "#00a8ff", category: "GEOLOC" },
  { name: "Shodan InternetDB", url: "/api/internetdb/8.8.8.8", status: "unknown", latency: null, lastCheck: null, icon: Search, color: "#f59e0b", category: "IoT" },
  { name: "OpenSky Network", url: "/api/aircraft?lamin=45&lomin=5&lamax=47&lomax=7", status: "unknown", latency: null, lastCheck: null, icon: Plane, color: "#00ff88", category: "AERIAL" },
  { name: "CVE CIRCL", url: "/api/cve/latest", status: "unknown", latency: null, lastCheck: null, icon: Shield, color: "#ef4444", category: "CVE" },
  { name: "NIST NVD", url: "/api/nvd/search?keyword=apache", status: "unknown", latency: null, lastCheck: null, icon: AlertTriangle, color: "#ec4899", category: "VULN" },
  { name: "crt.sh SSL", url: "/api/certs/google.com", status: "unknown", latency: null, lastCheck: null, icon: Eye, color: "#a855f7", category: "CERTS" },
  { name: "RIPE NCC", url: "/api/ripe/prefixes/AS15169", status: "unknown", latency: null, lastCheck: null, icon: Network, color: "#06b6d4", category: "ASN" },
  { name: "OpenRouter AI", url: "https://openrouter.ai/api/v1/models", status: "unknown", latency: null, lastCheck: null, icon: Cpu, color: "#22c55e", category: "AI" },
];

// World clocks
const WORLD_CLOCKS = [
  { city: "Jerusalem", tz: "Asia/Jerusalem", flag: "\u{1F1EE}\u{1F1F1}" },
  { city: "Tehran", tz: "Asia/Tehran", flag: "\u{1F1EE}\u{1F1F7}" },
  { city: "Washington", tz: "America/New_York", flag: "\u{1F1FA}\u{1F1F8}" },
  { city: "Moscow", tz: "Europe/Moscow", flag: "\u{1F1F7}\u{1F1FA}" },
  { city: "London", tz: "Europe/London", flag: "\u{1F1EC}\u{1F1E7}" },
  { city: "Beijing", tz: "Asia/Shanghai", flag: "\u{1F1E8}\u{1F1F3}" },
];

// Threat zones
const THREAT_ZONES = [
  { region: "Gaza Strip", level: "CRITICAL", trend: "up", incidents: 847 },
  { region: "South Lebanon", level: "HIGH", trend: "up", incidents: 234 },
  { region: "Red Sea / Bab el-Mandeb", level: "HIGH", trend: "stable", incidents: 156 },
  { region: "Iran Nuclear Sites", level: "ELEVATED", trend: "up", incidents: 12 },
  { region: "Syria / Golan", level: "MODERATE", trend: "down", incidents: 67 },
  { region: "Iraq / PMF Zones", level: "ELEVATED", trend: "stable", incidents: 89 },
  { region: "West Bank", level: "HIGH", trend: "up", incidents: 312 },
  { region: "Yemen / Houthi", level: "HIGH", trend: "up", incidents: 178 },
];

const DEFCON_LEVELS = [
  { level: 1, label: "MAXIMUM READINESS", color: "#ffffff", bg: "#ef4444" },
  { level: 2, label: "ARMED FORCES READY", color: "#ffffff", bg: "#f97316" },
  { level: 3, label: "INCREASE READINESS", color: "#000000", bg: "#eab308" },
  { level: 4, label: "ABOVE NORMAL", color: "#ffffff", bg: "#22c55e" },
  { level: 5, label: "LOWEST READINESS", color: "#ffffff", bg: "#3b82f6" },
];

const QUICK_ACCESS = [
  { labelKey: "nav.map", href: "/map", icon: Map, color: "from-blue-600/20 to-cyan-600/20", border: "border-blue-500/20", text: "text-blue-400" },
  { labelKey: "nav.middleeast", href: "/middle-east", icon: Globe, color: "from-red-600/20 to-orange-600/20", border: "border-red-500/20", text: "text-red-400" },
  { labelKey: "nav.chat", href: "/chat", icon: MessageSquare, color: "from-purple-600/20 to-pink-600/20", border: "border-purple-500/20", text: "text-purple-400" },
  { labelKey: "nav.intelcore", href: "/intel-core", icon: Network, color: "from-amber-600/20 to-orange-600/20", border: "border-amber-500/20", text: "text-amber-400" },
  { labelKey: "nav.eye", href: "/eye", icon: Radar, color: "from-emerald-600/20 to-teal-600/20", border: "border-emerald-500/20", text: "text-emerald-400" },
  { labelKey: "nav.forge", href: "/forge", icon: Crosshair, color: "from-cyan-600/20 to-blue-600/20", border: "border-cyan-500/20", text: "text-cyan-400" },
];

const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];

export default function Dashboard() {
  const { t } = useI18n();
  const [apis, setApis] = useState<ApiStatus[]>(INITIAL_APIS);
  const [testing, setTesting] = useState(false);
  const [uptime, setUptime] = useState("00:00:00");
  const [activityLog, setActivityLog] = useState<{ time: string; msg: string; type: "info" | "success" | "error" | "warning" }[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [worldTime, setWorldTime] = useState<Record<string, string>>({});
  const [defconLevel, setDefconLevel] = useState(3);
  const [threatData, setThreatData] = useState<any[]>([]);

  const addLog = useCallback((msg: string, type: "info" | "success" | "error" | "warning" = "info") => {
    setActivityLog(prev => [{ time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), msg, type }, ...prev].slice(0, 50));
  }, []);

  // Uptime + world clocks
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000).toString().padStart(2, "0");
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
      setUptime(`${h}:${m}:${s}`);
      const times: Record<string, string> = {};
      WORLD_CLOCKS.forEach(c => {
        times[c.city] = new Date().toLocaleTimeString("en-GB", { timeZone: c.tz, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      });
      setWorldTime(times);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Chart data
  useEffect(() => {
    const genData = () => Array.from({ length: 24 }).map((_, i) => ({
      time: `${i.toString().padStart(2, "0")}h`,
      requests: Math.floor(Math.random() * 400) + 100,
      threats: Math.floor(Math.random() * 30),
      intel: Math.floor(Math.random() * 80) + 20,
    }));
    setChartData(genData());
    const interval = setInterval(() => setChartData(genData()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Threat distribution data
  useEffect(() => {
    const data = [
      { name: "Missile/Rocket", value: 35 },
      { name: "Cyber Attack", value: 22 },
      { name: "Drone/UAV", value: 18 },
      { name: "Naval", value: 10 },
      { name: "Ground Op", value: 9 },
      { name: "CBRN", value: 6 },
    ];
    setThreatData(data);
  }, []);

  const testApi = useCallback(async (index: number) => {
    const api = apis[index];
    setApis(prev => { const u = [...prev]; u[index] = { ...u[index], status: "testing" }; return u; });
    const start = Date.now();
    try {
      const isExternal = api.url.startsWith("http");
      const res = await fetch(api.url, isExternal ? { mode: "no-cors", signal: AbortSignal.timeout(8000) } : { signal: AbortSignal.timeout(10000) });
      const latency = Date.now() - start;
      const isOk = isExternal ? true : res.ok;
      setApis(prev => { const u = [...prev]; u[index] = { ...u[index], status: isOk ? "online" : "offline", latency, lastCheck: new Date() }; return u; });
      addLog(`${api.name}: ${isOk ? "ONLINE" : "ERROR"} (${latency}ms)`, isOk ? "success" : "error");
    } catch {
      const latency = Date.now() - start;
      setApis(prev => { const u = [...prev]; u[index] = { ...u[index], status: "offline", latency, lastCheck: new Date() }; return u; });
      addLog(`${api.name}: TIMEOUT (${latency}ms)`, "error");
    }
  }, [apis, addLog]);

  const testAllApis = useCallback(async () => {
    setTesting(true);
    addLog("Running full system diagnostic...", "info");
    for (let i = 0; i < apis.length; i++) {
      await testApi(i);
      await new Promise(r => setTimeout(r, 200));
    }
    setTesting(false);
    addLog("Diagnostic complete. All systems checked.", "success");
  }, [apis.length, testApi, addLog]);

  useEffect(() => { testAllApis(); }, []);

  const stats = useMemo(() => {
    const online = apis.filter(a => a.status === "online").length;
    const avgLat = Math.round(apis.filter(a => a.latency !== null).reduce((s, a) => s + (a.latency || 0), 0) / Math.max(apis.filter(a => a.latency !== null).length, 1));
    return { online, avgLat };
  }, [apis]);

  const currentDefcon = DEFCON_LEVELS[defconLevel - 1];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <BarChart3 size={16} className="text-[#00a8ff]" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">{t("dash.title")}</h1>
          <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-md" style={{ backgroundColor: currentDefcon.bg + "20", border: `1px solid ${currentDefcon.bg}40` }}>
            <Radio size={10} style={{ color: currentDefcon.bg }} className="animate-pulse" />
            <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: currentDefcon.bg }}>DEFCON {defconLevel}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
            <Clock size={12} />
            <span>UPTIME {uptime}</span>
          </div>
          <button onClick={testAllApis} disabled={testing} className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold text-white/40 hover:text-white/70 transition-all uppercase tracking-widest">
            <RefreshCw size={11} className={testing ? "animate-spin" : ""} />
            {t("dash.refresh")}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Row 1: KPIs + DEFCON + World Clocks */}
        <div className="grid grid-cols-12 gap-3">
          {/* KPIs */}
          <div className="col-span-6 grid grid-cols-3 gap-2">
            <KpiCard icon={Activity} label={t("dash.connectors")} value={`${stats.online}/${apis.length}`} sub="OPERATIONAL" accent="text-[#00a8ff]" />
            <KpiCard icon={Zap} label={t("dash.latency")} value={`${stats.avgLat}ms`} sub="AVG RESPONSE" accent="text-amber-400" />
            <KpiCard icon={Cpu} label={t("dash.models")} value="8" sub="AI ENGINES" accent="text-purple-400" />
            <KpiCard icon={Satellite} label="SATELLITES" value="24" sub="IN RANGE" accent="text-cyan-400" />
            <KpiCard icon={Eye} label="CAMERAS" value="47" sub="MONITORING" accent="text-amber-400" />
            <KpiCard icon={Wifi} label="SIGINT" value="ACTIVE" sub="12 CHANNELS" accent="text-emerald-400" />
          </div>

          {/* DEFCON Widget */}
          <div className="col-span-2 bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-3 flex flex-col">
            <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">THREAT LEVEL</h3>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-[Rajdhani] font-black" style={{ backgroundColor: currentDefcon.bg + "25", border: `2px solid ${currentDefcon.bg}`, color: currentDefcon.bg }}>
                {defconLevel}
              </div>
              <div className="text-[8px] font-bold mt-2 uppercase tracking-widest text-center" style={{ color: currentDefcon.bg }}>{currentDefcon.label}</div>
            </div>
            <div className="flex gap-1 mt-2">
              {DEFCON_LEVELS.map(d => (
                <button key={d.level} onClick={() => setDefconLevel(d.level)} className={`flex-1 rounded-md transition-all flex items-center justify-center ${defconLevel === d.level ? "h-5 opacity-100 ring-1 ring-white/30" : "h-3 opacity-40 hover:opacity-60"}`} style={{ backgroundColor: d.bg }}>
                  <span className={`text-[7px] font-black ${defconLevel === d.level ? "block" : "hidden"}`} style={{ color: d.color }}>{d.level}</span>
                </button>
              ))}
            </div>
          </div>

          {/* World Clocks */}
          <div className="col-span-4 bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-3">
            <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">WORLD CLOCKS</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {WORLD_CLOCKS.map(c => (
                <div key={c.city} className="p-1.5 rounded-lg bg-black/30 border border-white/[0.04]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">{c.flag}</span>
                    <span className="text-[8px] text-white/30 uppercase tracking-widest font-bold">{c.city}</span>
                  </div>
                  <div className="text-[13px] font-mono font-bold text-white/70 mt-0.5">{worldTime[c.city] || "--:--:--"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Quick Access */}
        <div className="grid grid-cols-6 gap-2">
          {QUICK_ACCESS.map(q => (
            <Link key={q.href} href={q.href}>
              <div className={`group p-2.5 rounded-xl bg-gradient-to-br ${q.color} border ${q.border} hover:scale-[1.02] transition-all cursor-pointer`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <q.icon size={15} className={q.text} />
                    <span className={`text-[10px] font-bold ${q.text}`}>{t(q.labelKey)}</span>
                  </div>
                  <ArrowUpRight size={12} className="text-white/20 group-hover:text-white/40 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Row 3: Charts + Threat Zones + API Status */}
        <div className="grid grid-cols-12 gap-3">
          {/* Main Chart */}
          <div className="col-span-5 bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-3">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{t("dash.data_flow")}</h3>
              <div className="flex gap-3">
                <Legend color="#00a8ff" label={t("dash.requests")} />
                <Legend color="#ef4444" label={t("dash.anomalies")} />
                <Legend color="#a855f7" label="INTEL" />
              </div>
            </div>
            <div className="h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00a8ff" stopOpacity={0.15} /><stop offset="95%" stopColor="#00a8ff" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gThreat" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gIntel" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} /><stop offset="95%" stopColor="#a855f7" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                  <XAxis dataKey="time" stroke="#ffffff15" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff15" fontSize={8} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0a1428", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "9px" }} />
                  <Area type="monotone" dataKey="requests" stroke="#00a8ff" fill="url(#gReq)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="threats" stroke="#ef4444" fill="url(#gThreat)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="intel" stroke="#a855f7" fill="url(#gIntel)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Threat Zones */}
          <div className="col-span-4 bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-3 flex flex-col">
            <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">ACTIVE THREAT ZONES</h3>
            <div className="flex-1 space-y-1 overflow-y-auto pr-1">
              {THREAT_ZONES.map((zone, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/[0.04] hover:border-white/[0.08] transition-all">
                  <div className={`w-1.5 h-6 rounded-full shrink-0 ${zone.level === "CRITICAL" ? "bg-red-500" : zone.level === "HIGH" ? "bg-orange-500" : zone.level === "ELEVATED" ? "bg-yellow-500" : "bg-green-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-white/60 truncate">{zone.region}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[7px] font-bold uppercase tracking-widest px-1 py-0.5 rounded ${zone.level === "CRITICAL" ? "text-red-400 bg-red-400/10" : zone.level === "HIGH" ? "text-orange-400 bg-orange-400/10" : zone.level === "ELEVATED" ? "text-yellow-400 bg-yellow-400/10" : "text-green-400 bg-green-400/10"}`}>{zone.level}</span>
                      <span className="text-[8px] text-white/20 font-mono">{zone.incidents} incidents</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {zone.trend === "up" ? <TrendingUp size={12} className="text-red-400/50" /> : zone.trend === "down" ? <TrendingDown size={12} className="text-green-400/50" /> : <Minus size={12} className="text-white/20" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Threat Distribution Pie + API Status */}
          <div className="col-span-3 space-y-3">
            {/* Pie Chart */}
            <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-3">
              <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">THREAT DISTRIBUTION</h3>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={threatData} cx="50%" cy="50%" innerRadius={25} outerRadius={42} paddingAngle={2} dataKey="value">
                      {threatData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0a1428", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "9px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {threatData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-[7px] text-white/25 truncate">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* API Status compact */}
            <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-3">
              <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">{t("dash.api_status")}</h3>
              <div className="space-y-1">
                {apis.map((api, i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded-md bg-black/20">
                    <StatusDot status={api.status} />
                    <span className="text-[9px] text-white/50 truncate flex-1">{api.name}</span>
                    <span className="text-[8px] font-mono text-white/20">{api.latency ? `${api.latency}ms` : "---"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Activity Log */}
        <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-3">
          <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">{t("dash.operations")}</h3>
          <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
            {activityLog.length === 0 ? (
              <div className="text-center py-4 text-white/10 text-[9px] uppercase tracking-widest">Awaiting events...</div>
            ) : (
              activityLog.map((log, i) => (
                <div key={i} className="flex items-center gap-3 py-1 px-2 rounded-md hover:bg-white/[0.02] transition-colors">
                  <span className="text-[8px] font-mono text-white/15 shrink-0 w-16">{log.time}</span>
                  <LogBadge type={log.type} />
                  <span className="text-[9px] text-white/50 truncate">{log.msg}</span>
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
    <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-3 hover:border-white/[0.1] transition-all">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className={accent} />
        <span className="text-[8px] font-bold text-white/25 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-lg font-[Rajdhani] font-bold text-white/90 tracking-wider leading-none">{value}</div>
      <div className="text-[8px] text-white/15 mt-0.5">{sub}</div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const cls = status === "online" ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"
    : status === "testing" ? "bg-amber-500 animate-pulse"
    : status === "offline" ? "bg-red-500" : "bg-white/20";
  return <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cls}`} />;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[7px] text-white/25 uppercase tracking-widest font-bold">{label}</span>
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
