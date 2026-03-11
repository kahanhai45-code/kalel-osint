import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon, Key, Shield, Globe, Eye, EyeOff,
  Save, CheckCircle, AlertTriangle, RefreshCw, Trash2, Plus,
  Server, Cpu, Database, Wifi, Lock, Unlock, Palette, Bell
} from "lucide-react";

interface ApiKeyConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  keyPrefix: string;
  value: string;
  status: "active" | "invalid" | "unconfigured";
  testUrl?: string;
}

const DEFAULT_KEYS: ApiKeyConfig[] = [
  { id: "openrouter", name: "OpenRouter AI", icon: "🤖", description: "Modèles IA (Gemini, Llama, Mistral) pour Agent Chat et rapports", keyPrefix: "sk-or-", value: "", status: "unconfigured", testUrl: "https://openrouter.ai/api/v1/models" },
  { id: "shodan", name: "Shodan", icon: "🔍", description: "Recherche d'appareils IoT, caméras, serveurs exposés", keyPrefix: "", value: "", status: "unconfigured", testUrl: "https://api.shodan.io/api-info" },
  { id: "virustotal", name: "VirusTotal", icon: "🛡️", description: "Analyse de fichiers, URLs, IPs malveillants", keyPrefix: "", value: "", status: "unconfigured", testUrl: "https://www.virustotal.com/api/v3/ip_addresses/8.8.8.8" },
  { id: "ipinfo", name: "IPInfo", icon: "🌐", description: "Géolocalisation IP, ASN, informations réseau", keyPrefix: "", value: "", status: "unconfigured", testUrl: "https://ipinfo.io/8.8.8.8" },
  { id: "abuseipdb", name: "AbuseIPDB", icon: "⚠️", description: "Base de données d'IPs malveillantes et signalements", keyPrefix: "", value: "", status: "unconfigured", testUrl: "https://api.abuseipdb.com/api/v2/check" },
  { id: "censys", name: "Censys", icon: "📡", description: "Scan Internet, certificats SSL, services exposés", keyPrefix: "", value: "", status: "unconfigured" },
  { id: "greynoise", name: "GreyNoise", icon: "📊", description: "Intelligence sur le bruit Internet et scanners", keyPrefix: "", value: "", status: "unconfigured" },
  { id: "n2yo", name: "N2YO Satellite", icon: "🛰️", description: "Suivi de satellites en temps réel (TLE, positions)", keyPrefix: "", value: "", status: "unconfigured" },
];

export default function Settings() {
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>(() => {
    const saved = localStorage.getItem("kalel-api-keys");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return DEFAULT_KEYS.map(dk => {
          const saved = parsed.find((p: any) => p.id === dk.id);
          return saved ? { ...dk, value: saved.value, status: saved.value ? "active" : "unconfigured" } : dk;
        });
      } catch { return DEFAULT_KEYS; }
    }
    return DEFAULT_KEYS;
  });

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"api" | "system" | "display">("api");

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    refreshInterval: 30,
    maxConnections: 10,
    proxyEnabled: false,
    proxyUrl: "",
    logLevel: "info",
    dataRetention: 30,
    autoExport: false,
  });

  // Display settings
  const [displaySettings, setDisplaySettings] = useState({
    theme: "dark",
    accentColor: "#00a8ff",
    fontSize: "normal",
    animations: true,
    notifications: true,
    soundAlerts: false,
    compactMode: false,
  });

  const updateKey = (id: string, value: string) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, value, status: value ? "active" : "unconfigured" } : k));
  };

  const saveAll = () => {
    localStorage.setItem("kalel-api-keys", JSON.stringify(apiKeys.map(k => ({ id: k.id, value: k.value }))));
    localStorage.setItem("kalel-system-settings", JSON.stringify(systemSettings));
    localStorage.setItem("kalel-display-settings", JSON.stringify(displaySettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testKey = async (key: ApiKeyConfig) => {
    setTesting(key.id);
    try {
      // Simulate test
      await new Promise(r => setTimeout(r, 1500));
      setApiKeys(prev => prev.map(k => k.id === key.id ? { ...k, status: k.value ? "active" : "unconfigured" } : k));
    } catch {
      setApiKeys(prev => prev.map(k => k.id === key.id ? { ...k, status: "invalid" } : k));
    }
    setTesting(null);
  };

  const configuredCount = apiKeys.filter(k => k.value).length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <SettingsIcon size={16} className="text-white/40" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">SYSTEM SETTINGS</h1>
          <span className="text-[9px] text-white/20 font-mono">{configuredCount}/{apiKeys.length} APIs</span>
        </div>
        <button onClick={saveAll}
          className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${saved ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-[#00a8ff]/10 text-[#00a8ff] border border-[#00a8ff]/20 hover:bg-[#00a8ff]/20"}`}>
          {saved ? <CheckCircle size={11} /> : <Save size={11} />} {saved ? "SAVED" : "SAVE ALL"}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Tabs */}
        <div className="w-56 shrink-0 border-r border-white/[0.06] bg-[#070d1a]/40 p-3 space-y-1">
          {[
            { id: "api" as const, icon: Key, label: "API Keys", desc: "Manage API credentials" },
            { id: "system" as const, icon: Server, label: "System", desc: "Server & data settings" },
            { id: "display" as const, icon: Palette, label: "Display", desc: "UI preferences" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all text-left ${activeTab === tab.id ? "bg-white/[0.06] border border-white/[0.08]" : "border border-transparent hover:bg-white/[0.03]"}`}>
              <tab.icon size={16} className={activeTab === tab.id ? "text-[#00a8ff]" : "text-white/20"} />
              <div>
                <div className="text-[10px] font-bold text-white/70">{tab.label}</div>
                <div className="text-[8px] text-white/25">{tab.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "api" && (
            <>
              <div className="p-4 rounded-xl bg-[#00a8ff]/[0.03] border border-[#00a8ff]/10">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={14} className="text-[#00a8ff]" />
                  <span className="text-[11px] font-bold text-[#00a8ff]/80">API Key Security</span>
                </div>
                <div className="text-[10px] text-white/40">Keys are stored locally in your browser (localStorage). They are never sent to our servers. For production, use environment variables.</div>
              </div>

              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div key={key.id} className="p-4 rounded-xl bg-black/30 border border-white/[0.04] hover:border-white/[0.08] transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{key.icon}</span>
                        <div>
                          <div className="text-[12px] font-bold text-white/70">{key.name}</div>
                          <div className="text-[9px] text-white/30">{key.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${key.status === "active" ? "bg-emerald-500" : key.status === "invalid" ? "bg-red-500" : "bg-white/10"}`} />
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${key.status === "active" ? "text-emerald-400" : key.status === "invalid" ? "text-red-400" : "text-white/20"}`}>{key.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={showKeys[key.id] ? "text" : "password"}
                          value={key.value}
                          onChange={e => updateKey(key.id, e.target.value)}
                          placeholder={`Enter ${key.name} API key...`}
                          className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-3 py-2.5 text-[11px] text-white placeholder-white/15 outline-none focus:border-[#00a8ff]/20 transition-all font-mono pr-10"
                        />
                        <button onClick={() => setShowKeys(p => ({ ...p, [key.id]: !p[key.id] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-all">
                          {showKeys[key.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                      <button onClick={() => testKey(key)} disabled={!key.value || testing === key.id}
                        className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[9px] text-white/30 hover:text-[#00a8ff] font-bold uppercase tracking-widest transition-all disabled:opacity-30 flex items-center gap-1.5">
                        {testing === key.id ? <RefreshCw size={11} className="animate-spin" /> : <Wifi size={11} />} TEST
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "system" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-3">DATA REFRESH</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/50">Refresh Interval (seconds)</span>
                    <input type="number" value={systemSettings.refreshInterval} onChange={e => setSystemSettings(p => ({ ...p, refreshInterval: +e.target.value }))}
                      className="w-24 bg-black/40 border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white text-right outline-none focus:border-[#00a8ff]/20 font-mono" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/50">Max Concurrent Connections</span>
                    <input type="number" value={systemSettings.maxConnections} onChange={e => setSystemSettings(p => ({ ...p, maxConnections: +e.target.value }))}
                      className="w-24 bg-black/40 border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white text-right outline-none focus:border-[#00a8ff]/20 font-mono" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/50">Data Retention (days)</span>
                    <input type="number" value={systemSettings.dataRetention} onChange={e => setSystemSettings(p => ({ ...p, dataRetention: +e.target.value }))}
                      className="w-24 bg-black/40 border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white text-right outline-none focus:border-[#00a8ff]/20 font-mono" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-3">PROXY</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/50">Enable Proxy</span>
                    <button onClick={() => setSystemSettings(p => ({ ...p, proxyEnabled: !p.proxyEnabled }))}
                      className={`w-10 h-5 rounded-full transition-all ${systemSettings.proxyEnabled ? "bg-[#00a8ff]" : "bg-white/10"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-all ${systemSettings.proxyEnabled ? "ml-5.5 translate-x-1" : "ml-0.5"}`}
                        style={{ marginLeft: systemSettings.proxyEnabled ? "22px" : "2px" }} />
                    </button>
                  </div>
                  {systemSettings.proxyEnabled && (
                    <input value={systemSettings.proxyUrl} onChange={e => setSystemSettings(p => ({ ...p, proxyUrl: e.target.value }))}
                      placeholder="socks5://127.0.0.1:9050"
                      className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-white placeholder-white/15 outline-none focus:border-[#00a8ff]/20 font-mono" />
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-3">LOG LEVEL</div>
                <div className="flex gap-2">
                  {["debug", "info", "warn", "error"].map(l => (
                    <button key={l} onClick={() => setSystemSettings(p => ({ ...p, logLevel: l }))}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${systemSettings.logLevel === l ? "bg-[#00a8ff]/15 text-[#00a8ff] border border-[#00a8ff]/20" : "bg-white/[0.04] border border-white/[0.06] text-white/30 hover:text-white/50"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "display" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-3">ACCENT COLOR</div>
                <div className="flex gap-2">
                  {["#00a8ff", "#22c55e", "#ef4444", "#f97316", "#8b5cf6", "#ec4899", "#eab308", "#06b6d4"].map(c => (
                    <button key={c} onClick={() => setDisplaySettings(p => ({ ...p, accentColor: c }))}
                      className={`w-8 h-8 rounded-lg transition-all ${displaySettings.accentColor === c ? "ring-2 ring-white/40 scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-3">PREFERENCES</div>
                <div className="space-y-3">
                  {[
                    { key: "animations", label: "Enable Animations", desc: "Smooth transitions and effects" },
                    { key: "notifications", label: "Notifications", desc: "Show alert notifications" },
                    { key: "soundAlerts", label: "Sound Alerts", desc: "Audio alerts for critical events" },
                    { key: "compactMode", label: "Compact Mode", desc: "Reduce spacing and padding" },
                  ].map(pref => (
                    <div key={pref.key} className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-white/50">{pref.label}</div>
                        <div className="text-[8px] text-white/20">{pref.desc}</div>
                      </div>
                      <button onClick={() => setDisplaySettings(p => ({ ...p, [pref.key]: !(p as any)[pref.key] }))}
                        className={`w-10 h-5 rounded-full transition-all ${(displaySettings as any)[pref.key] ? "bg-[#00a8ff]" : "bg-white/10"}`}>
                        <div className="w-4 h-4 rounded-full bg-white transition-all"
                          style={{ marginLeft: (displaySettings as any)[pref.key] ? "22px" : "2px" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-3">FONT SIZE</div>
                <div className="flex gap-2">
                  {["small", "normal", "large"].map(s => (
                    <button key={s} onClick={() => setDisplaySettings(p => ({ ...p, fontSize: s }))}
                      className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${displaySettings.fontSize === s ? "bg-[#00a8ff]/15 text-[#00a8ff] border border-[#00a8ff]/20" : "bg-white/[0.04] border border-white/[0.06] text-white/30"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
