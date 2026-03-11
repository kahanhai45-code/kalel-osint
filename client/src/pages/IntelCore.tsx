import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network, Zap, Loader2, Search, AlertTriangle, CheckCircle,
  Shield, Globe, FileText, Download, ExternalLink, Copy, Check,
  Server, Lock, Eye, Clock, Activity
} from "lucide-react";

interface OsintIpResult {
  ip: string; timestamp: string;
  geolocation: any; infrastructure: any;
  threatScore: number; summary: string;
}

interface DomainResult {
  domain: string; timestamp: string;
  subdomains: string[]; certificates: any[];
  webArchive: any[]; stats: any;
}

interface CveResult {
  id: string; summary: string; cvss?: number;
  published?: string; modified?: string;
}

const SCAN_MODULES = [
  { id: "geoip", name: "GeoIP", desc: "Géolocalisation IP", icon: Globe, color: "#00a8ff", types: ["ip"] },
  { id: "ports", name: "Ports & Vulns", desc: "Shodan InternetDB", icon: Server, color: "#f59e0b", types: ["ip"] },
  { id: "certs", name: "Certificats SSL", desc: "crt.sh Transparency", icon: Lock, color: "#a855f7", types: ["domain"] },
  { id: "archive", name: "Web Archive", desc: "Wayback Machine", icon: Clock, color: "#22c55e", types: ["domain"] },
  { id: "ripe", name: "RIPE NCC", desc: "ASN & Préfixes", icon: Activity, color: "#06b6d4", types: ["ip"] },
  { id: "cve", name: "CVE Search", desc: "CIRCL Vulnérabilités", icon: Shield, color: "#ef4444", types: ["ip", "domain", "keyword"] },
  { id: "dorks", name: "Google Dorks", desc: "Exploit Discovery", icon: Eye, color: "#f97316", types: ["domain"] },
];

export default function IntelCore() {
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState<"ip" | "domain" | "keyword">("ip");
  const [loading, setLoading] = useState(false);
  const [activeModules, setActiveModules] = useState<Set<string>>(new Set(SCAN_MODULES.map(m => m.id)));
  const [copied, setCopied] = useState(false);

  // Results
  const [ipResult, setIpResult] = useState<OsintIpResult | null>(null);
  const [domainResult, setDomainResult] = useState<DomainResult | null>(null);
  const [cveResults, setCveResults] = useState<CveResult[]>([]);
  const [dorksResult, setDorksResult] = useState<any>(null);
  const [ripeResult, setRipeResult] = useState<any>(null);
  const [scanLog, setScanLog] = useState<{ time: string; msg: string; status: "ok" | "err" | "info" }[]>([]);

  const addLog = (msg: string, status: "ok" | "err" | "info" = "info") => {
    setScanLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, status }]);
  };

  const scan = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setIpResult(null); setDomainResult(null); setCveResults([]); setDorksResult(null); setRipeResult(null);
    setScanLog([]);
    addLog(`Starting OSINT scan on: ${query}`, "info");

    const q = query.trim();

    // IP Scan
    if (entityType === "ip" && activeModules.has("geoip")) {
      addLog("Querying ip-api.com + Shodan InternetDB...", "info");
      try {
        const res = await fetch(`/api/osint/ip/${q}`);
        if (res.ok) {
          const data = await res.json();
          setIpResult(data);
          addLog(`GeoIP: ${data.geolocation?.city}, ${data.geolocation?.country} | Threat: ${data.threatScore}/100`, "ok");
          if (data.infrastructure?.ports?.length) {
            addLog(`Ports: ${data.infrastructure.ports.join(", ")}`, "ok");
          }
          if (data.infrastructure?.vulns?.length) {
            addLog(`VULNS DETECTED: ${data.infrastructure.vulns.join(", ")}`, "err");
          }
        }
      } catch (e) { addLog("GeoIP/InternetDB scan failed", "err"); }
    }

    // RIPE NCC
    if (entityType === "ip" && activeModules.has("ripe")) {
      addLog("Querying RIPE NCC RIPEstat...", "info");
      try {
        const res = await fetch(`/api/ripe/whois/${q}`);
        if (res.ok) {
          const data = await res.json();
          setRipeResult(data);
          addLog("RIPE NCC data retrieved", "ok");
        }
      } catch { addLog("RIPE NCC query failed", "err"); }
    }

    // Domain Scan
    if (entityType === "domain" && (activeModules.has("certs") || activeModules.has("archive"))) {
      addLog("Querying crt.sh + Wayback Machine...", "info");
      try {
        const res = await fetch(`/api/osint/domain/${q}`);
        if (res.ok) {
          const data = await res.json();
          setDomainResult(data);
          addLog(`Found ${data.stats.totalSubdomains} subdomains, ${data.stats.totalCerts} certificates, ${data.stats.totalSnapshots} web snapshots`, "ok");
        }
      } catch { addLog("Domain recon failed", "err"); }
    }

    // Google Dorks
    if (entityType === "domain" && activeModules.has("dorks")) {
      addLog("Generating Google Dorks for target...", "info");
      try {
        const res = await fetch(`/api/dorks/${q}`);
        if (res.ok) {
          const data = await res.json();
          setDorksResult(data);
          addLog(`Generated ${data.dorks.length} exploit dorks`, "ok");
        }
      } catch { addLog("Dork generation failed", "err"); }
    }

    // CVE Search
    if (activeModules.has("cve")) {
      addLog("Searching CVE databases (CIRCL + NIST NVD)...", "info");
      try {
        const res = await fetch(`/api/exploits/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          const cves: CveResult[] = [];
          if (data.circlResults?.length) {
            data.circlResults.slice(0, 10).forEach((c: any) => {
              cves.push({ id: c.id || c.cve_id || "N/A", summary: c.summary || c.details || "No description", cvss: c.cvss, published: c.Published || c.published });
            });
          }
          if (data.nvdResults?.length) {
            data.nvdResults.slice(0, 10).forEach((v: any) => {
              const cve = v.cve;
              if (cve) {
                cves.push({
                  id: cve.id, summary: cve.descriptions?.[0]?.value || "No description",
                  cvss: cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || cve.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore,
                  published: cve.published
                });
              }
            });
          }
          setCveResults(cves);
          addLog(`Found ${cves.length} CVEs (${data.totalCircl} CIRCL + ${data.totalNvd} NVD)`, cves.length > 0 ? "ok" : "info");
        }
      } catch { addLog("CVE search failed", "err"); }
    }

    addLog("Scan complete.", "ok");
    setLoading(false);
  }, [query, entityType, activeModules]);

  const toggleModule = (id: string) => {
    const s = new Set(activeModules);
    s.has(id) ? s.delete(id) : s.add(id);
    setActiveModules(s);
  };

  const exportReport = () => {
    const lines = [
      `OSINT INTELLIGENCE REPORT`,
      `Target: ${query} (${entityType})`,
      `Date: ${new Date().toISOString()}`,
      `---`,
      ...scanLog.map(l => `[${l.time}] [${l.status.toUpperCase()}] ${l.msg}`),
    ];
    if (ipResult) {
      lines.push(`\n--- IP ANALYSIS ---`);
      lines.push(`Summary: ${ipResult.summary}`);
      lines.push(`Threat Score: ${ipResult.threatScore}/100`);
      if (ipResult.infrastructure?.ports) lines.push(`Open Ports: ${ipResult.infrastructure.ports.join(", ")}`);
      if (ipResult.infrastructure?.vulns?.length) lines.push(`Vulnerabilities: ${ipResult.infrastructure.vulns.join(", ")}`);
    }
    if (domainResult) {
      lines.push(`\n--- DOMAIN ANALYSIS ---`);
      lines.push(`Subdomains (${domainResult.stats.totalSubdomains}): ${domainResult.subdomains.slice(0, 20).join(", ")}`);
      lines.push(`Certificates: ${domainResult.stats.totalCerts}`);
    }
    if (cveResults.length) {
      lines.push(`\n--- CVE RESULTS ---`);
      cveResults.forEach(c => lines.push(`${c.id} (CVSS: ${c.cvss || "N/A"}) — ${c.summary.slice(0, 100)}`));
    }
    if (dorksResult) {
      lines.push(`\n--- GOOGLE DORKS ---`);
      dorksResult.dorks.forEach((d: any) => lines.push(`[${d.risk.toUpperCase()}] ${d.category}: ${d.query}`));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `osint-report-${query}-${Date.now()}.txt`; a.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const cvssColor = (score?: number) => {
    if (!score) return "text-white/30";
    if (score >= 9) return "text-red-400";
    if (score >= 7) return "text-orange-400";
    if (score >= 4) return "text-amber-400";
    return "text-emerald-400";
  };

  const riskBadge = (risk: string) => {
    const colors: Record<string, string> = { critical: "bg-red-500/15 text-red-400", high: "bg-orange-500/15 text-orange-400", medium: "bg-amber-500/15 text-amber-400", low: "bg-emerald-500/15 text-emerald-400" };
    return colors[risk] || colors.low;
  };

  const hasResults = ipResult || domainResult || cveResults.length > 0 || dorksResult;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <Network size={16} className="text-amber-400" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">Intel Core — OSINT Corrélation</h1>
        </div>
        <div className="flex items-center gap-2">
          {hasResults && (
            <button onClick={exportReport} className="px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-500/15 transition-all flex items-center gap-1.5">
              <Download size={10} /> Export
            </button>
          )}
          <span className="text-[9px] text-white/20 uppercase tracking-widest">{activeModules.size} modules</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-4 gap-4">
          {/* Left Panel */}
          <div className="col-span-1 space-y-3">
            {/* Search */}
            <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4 space-y-3">
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Cible</h3>
              <select value={entityType} onChange={e => setEntityType(e.target.value as any)} className="w-full bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-white/60 outline-none">
                <option value="ip">Adresse IP</option>
                <option value="domain">Domaine</option>
                <option value="keyword">Mot-clé / Produit</option>
              </select>
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && scan()}
                placeholder={entityType === "ip" ? "8.8.8.8" : entityType === "domain" ? "example.com" : "apache httpd"}
                className="w-full bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-[#00a8ff]/20" />
              <button onClick={scan} disabled={loading || !query.trim()} className="w-full py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500/15 transition-all disabled:opacity-50">
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                LANCER LE SCAN OSINT
              </button>
            </div>

            {/* Modules */}
            <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4 space-y-2">
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Modules OSINT</h3>
              {SCAN_MODULES.filter(m => m.types.includes(entityType)).map(m => (
                <button key={m.id} onClick={() => toggleModule(m.id)} className={`w-full text-left p-2.5 rounded-lg border text-[9px] transition-all ${activeModules.has(m.id) ? "border-white/[0.08] bg-white/[0.03]" : "bg-black/20 border-white/[0.04] text-white/30 opacity-50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <m.icon size={12} style={{ color: m.color }} />
                      <div>
                        <div className="font-bold text-white/60">{m.name}</div>
                        <div className="text-[8px] text-white/20">{m.desc}</div>
                      </div>
                    </div>
                    {activeModules.has(m.id) && <CheckCircle size={10} className="text-emerald-400" />}
                  </div>
                </button>
              ))}
            </div>

            {/* Scan Log */}
            {scanLog.length > 0 && (
              <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Journal</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {scanLog.map((l, i) => (
                    <div key={i} className="flex items-start gap-2 text-[9px]">
                      <span className="text-white/15 font-mono shrink-0">{l.time}</span>
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${l.status === "ok" ? "bg-emerald-400" : l.status === "err" ? "bg-red-400" : "bg-blue-400"}`} />
                      <span className="text-white/40">{l.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="col-span-3 space-y-3">
            {!hasResults && !loading && (
              <div className="flex flex-col items-center justify-center h-64 text-white/10 text-[11px] uppercase tracking-widest gap-3">
                <Search size={32} className="text-white/5" />
                <span>Entrez une cible et lancez le scan OSINT</span>
                <span className="text-[9px] text-white/5">APIs réelles : ip-api.com, Shodan InternetDB, crt.sh, CIRCL CVE, NIST NVD, RIPE NCC, Wayback Machine</span>
              </div>
            )}

            {/* IP Result */}
            <AnimatePresence>
              {ipResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {/* Threat Score Banner */}
                  <div className={`rounded-xl p-4 flex items-center justify-between border ${ipResult.threatScore > 50 ? "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/15" : ipResult.threatScore > 20 ? "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/15" : "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/15"}`}>
                    <div>
                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Threat Score</div>
                      <div className={`text-3xl font-[Rajdhani] font-bold ${ipResult.threatScore > 50 ? "text-red-400" : ipResult.threatScore > 20 ? "text-amber-400" : "text-emerald-400"}`}>
                        {ipResult.threatScore}<span className="text-lg text-white/30">/100</span>
                      </div>
                      <div className="text-[10px] text-white/30 mt-1">{ipResult.summary}</div>
                    </div>
                    <AlertTriangle size={36} className={`${ipResult.threatScore > 50 ? "text-red-400/20" : "text-emerald-400/20"}`} />
                  </div>

                  {/* GeoIP + Infrastructure */}
                  <div className="grid grid-cols-2 gap-3">
                    {ipResult.geolocation && (
                      <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4">
                        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Globe size={12} className="text-[#00a8ff]" /> Géolocalisation
                        </h3>
                        <div className="space-y-2 text-[10px]">
                          {[
                            ["IP", ipResult.geolocation.query],
                            ["Pays", `${ipResult.geolocation.country} (${ipResult.geolocation.countryCode})`],
                            ["Ville", `${ipResult.geolocation.city}, ${ipResult.geolocation.regionName}`],
                            ["ISP", ipResult.geolocation.isp],
                            ["Org", ipResult.geolocation.org],
                            ["AS", ipResult.geolocation.as],
                            ["Timezone", ipResult.geolocation.timezone],
                            ["Proxy", ipResult.geolocation.proxy ? "OUI" : "Non"],
                            ["Hosting", ipResult.geolocation.hosting ? "OUI" : "Non"],
                            ["Coords", `${ipResult.geolocation.lat}, ${ipResult.geolocation.lon}`],
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-white/30">{k}</span>
                              <span className="text-white/60 font-mono text-right max-w-[200px] truncate">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ipResult.infrastructure && (
                      <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4">
                        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Server size={12} className="text-amber-400" /> Infrastructure (Shodan)
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <div className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Ports ouverts ({ipResult.infrastructure.ports?.length || 0})</div>
                            <div className="flex flex-wrap gap-1">
                              {(ipResult.infrastructure.ports || []).map((p: number) => (
                                <span key={p} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-mono">{p}</span>
                              ))}
                              {!ipResult.infrastructure.ports?.length && <span className="text-[9px] text-white/20">Aucun port détecté</span>}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Hostnames</div>
                            <div className="flex flex-wrap gap-1">
                              {(ipResult.infrastructure.hostnames || []).map((h: string) => (
                                <span key={h} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[9px] font-mono">{h}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Vulnérabilités ({ipResult.infrastructure.vulns?.length || 0})</div>
                            <div className="flex flex-wrap gap-1">
                              {(ipResult.infrastructure.vulns || []).map((v: string) => (
                                <span key={v} className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 text-[9px] font-mono cursor-pointer hover:bg-red-500/25 transition-all" onClick={() => copyToClipboard(v)}>
                                  {v}
                                </span>
                              ))}
                              {!ipResult.infrastructure.vulns?.length && <span className="text-[9px] text-emerald-400/50">Aucune vulnérabilité connue</span>}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-white/25 uppercase tracking-widest mb-1">CPEs</div>
                            <div className="flex flex-wrap gap-1">
                              {(ipResult.infrastructure.cpes || []).map((c: string) => (
                                <span key={c} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[8px] font-mono">{c}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Domain Result */}
            <AnimatePresence>
              {domainResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Sous-domaines", value: domainResult.stats.totalSubdomains, color: "text-purple-400" },
                      { label: "Certificats SSL", value: domainResult.stats.totalCerts, color: "text-cyan-400" },
                      { label: "Snapshots Web", value: domainResult.stats.totalSnapshots, color: "text-emerald-400" },
                    ].map(s => (
                      <div key={s.label} className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-3 text-center">
                        <div className={`text-2xl font-[Rajdhani] font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-[9px] text-white/30 uppercase tracking-widest">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Subdomains */}
                  <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Globe size={12} className="text-purple-400" /> Sous-domaines découverts ({domainResult.subdomains.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {domainResult.subdomains.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[9px] font-mono cursor-pointer hover:bg-purple-500/20 transition-all" onClick={() => copyToClipboard(s)}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Certificates */}
                  {domainResult.certificates.length > 0 && (
                    <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4">
                      <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Lock size={12} className="text-cyan-400" /> Certificats SSL
                      </h3>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {domainResult.certificates.slice(0, 15).map((c, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-black/20 text-[9px]">
                            <span className="text-white/50 font-mono truncate max-w-[250px]">{c.commonName}</span>
                            <span className="text-white/20 shrink-0">{c.notBefore?.split("T")[0]} → {c.notAfter?.split("T")[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CVE Results */}
            <AnimatePresence>
              {cveResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4">
                  <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Shield size={12} className="text-red-400" /> Vulnérabilités CVE ({cveResults.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {cveResults.map((c, i) => (
                      <div key={i} className="p-3 rounded-lg bg-black/30 border border-white/[0.04] hover:border-white/[0.08] transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-mono font-bold text-red-400 cursor-pointer hover:underline" onClick={() => copyToClipboard(c.id)}>{c.id}</span>
                          <div className="flex items-center gap-2">
                            {c.cvss && <span className={`text-[10px] font-bold ${cvssColor(c.cvss)}`}>CVSS {c.cvss}</span>}
                            {c.published && <span className="text-[8px] text-white/20">{c.published.split("T")[0]}</span>}
                          </div>
                        </div>
                        <p className="text-[9px] text-white/40 leading-relaxed line-clamp-2">{c.summary}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Dorks */}
            <AnimatePresence>
              {dorksResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4">
                  <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Eye size={12} className="text-orange-400" /> Google Dorks — Exploit Discovery ({dorksResult.dorks.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {dorksResult.dorks.map((d: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-black/30 border border-white/[0.04] hover:border-white/[0.08] transition-all group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-white/50">{d.category}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${riskBadge(d.risk)}`}>{d.risk}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-[9px] text-orange-400/70 font-mono flex-1 truncate">{d.query}</code>
                          <button onClick={() => copyToClipboard(d.query)} className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/60">
                            {copied ? <Check size={10} /> : <Copy size={10} />}
                          </button>
                          <a href={d.query.startsWith("http") ? d.query : `https://www.google.com/search?q=${encodeURIComponent(d.query)}`} target="_blank" rel="noopener" className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/60">
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
