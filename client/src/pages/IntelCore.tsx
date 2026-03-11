import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Network, Zap, Loader2, Search, AlertTriangle, CheckCircle,
  Shield, Globe, FileText, Download
} from "lucide-react";

interface IntelEntity {
  id: string; type: "ip" | "domain" | "email"; value: string;
  risk: "critical" | "high" | "medium" | "low"; sources: string[];
  metadata: Record<string, any>; lastSeen: string;
}

interface CorrelationResult {
  entities: IntelEntity[]; threatScore: number;
  findings: string[]; recommendations: string[];
}

const INTEL_SOURCES = [
  { name: "VirusTotal", category: "Threat Intel" },
  { name: "DeHashed", category: "Data Leaks" },
  { name: "SecurityTrails", category: "DNS/IP" },
  { name: "Hunter.io", category: "Email" },
  { name: "Shodan", category: "IoT" },
  { name: "AlienVault OTX", category: "Threat Feeds" },
  { name: "AbuseIPDB", category: "Abuse Reports" },
  { name: "URLScan.io", category: "Web Analysis" },
];

export default function IntelCore() {
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState<"ip" | "domain" | "email">("ip");
  const [result, setResult] = useState<CorrelationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSources, setActiveSources] = useState<Set<string>>(new Set(INTEL_SOURCES.map(s => s.name)));

  const correlate = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    // Simulation de corrélation multi-sources
    await new Promise(r => setTimeout(r, 1500));
    setResult({
      entities: [
        { id: "e1", type: entityType, value: query, risk: "high", sources: Array.from(activeSources), metadata: { firstSeen: new Date(Date.now() - 30 * 86400000).toISOString(), reputation: 85, relatedThreats: ["Botnet C2", "Malware Distribution"] }, lastSeen: new Date().toISOString() },
        { id: "e2", type: "domain", value: "malicious-domain.com", risk: "critical", sources: ["VirusTotal", "SecurityTrails", "AlienVault OTX"], metadata: { malwareDetections: 12, phishingReports: 5 }, lastSeen: new Date().toISOString() },
        { id: "e3", type: "email", value: "attacker@malicious-domain.com", risk: "high", sources: ["DeHashed", "Hunter.io"], metadata: { breachCount: 3, databases: ["LinkedIn 2023", "Equifax 2021"] }, lastSeen: new Date().toISOString() },
      ],
      threatScore: 87,
      findings: [
        "Infrastructure liée à une campagne de malware connue",
        "Domaine utilisé pour l'hébergement de phishing",
        "Email compromis dans 3 violations de données majeures",
        "Connexion détectée avec un réseau de botnets actif"
      ],
      recommendations: [
        "Bloquer l'IP au niveau du pare-feu",
        "Ajouter le domaine à la liste noire DNS",
        "Monitorer les comptes associés",
        "Signaler aux autorités compétentes (CERT)"
      ]
    });
    setLoading(false);
  }, [query, entityType, activeSources]);

  const toggleSource = (name: string) => {
    const s = new Set(activeSources);
    s.has(name) ? s.delete(name) : s.add(name);
    setActiveSources(s);
  };

  const riskColor = (r: string) => r === "critical" ? "text-red-400 bg-red-400/10" : r === "high" ? "text-orange-400 bg-orange-400/10" : r === "medium" ? "text-amber-400 bg-amber-400/10" : "text-emerald-400 bg-emerald-400/10";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <Network size={16} className="text-amber-400" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">Intel Core — Corrélation</h1>
        </div>
        <span className="text-[9px] text-white/20 uppercase tracking-widest">{activeSources.size} sources actives</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-4 gap-4">
          {/* Left Panel */}
          <div className="col-span-1 space-y-3">
            {/* Search */}
            <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4 space-y-3">
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Recherche</h3>
              <select value={entityType} onChange={e => setEntityType(e.target.value as any)} className="w-full bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-white/60 outline-none">
                <option value="ip">Adresse IP</option>
                <option value="domain">Domaine</option>
                <option value="email">Email</option>
              </select>
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && correlate()} placeholder={entityType === "ip" ? "192.168.1.1" : entityType === "domain" ? "example.com" : "user@example.com"} className="w-full bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-[#00a8ff]/20" />
              <button onClick={correlate} disabled={loading || !query.trim()} className="w-full py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500/15 transition-all disabled:opacity-50">
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                Corréler
              </button>
            </div>

            {/* Sources */}
            <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4 space-y-2">
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Sources</h3>
              {INTEL_SOURCES.map(s => (
                <button key={s.name} onClick={() => toggleSource(s.name)} className={`w-full text-left p-2 rounded-lg border text-[9px] transition-all ${activeSources.has(s.name) ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-black/20 border-white/[0.04] text-white/30"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{s.name}</div>
                      <div className="text-[8px] text-white/20">{s.category}</div>
                    </div>
                    {activeSources.has(s.name) && <CheckCircle size={10} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="col-span-3 space-y-3">
            {!result && !loading && (
              <div className="flex items-center justify-center h-64 text-white/10 text-[11px] uppercase tracking-widest">
                Entrez une cible et lancez la corrélation
              </div>
            )}

            {result && (
              <>
                {/* Threat Score */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/15 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Score de Menace</div>
                    <div className="text-3xl font-[Rajdhani] font-bold text-red-400">{result.threatScore}<span className="text-lg text-white/30">/100</span></div>
                  </div>
                  <AlertTriangle size={36} className="text-red-400/20" />
                </motion.div>

                {/* Entities */}
                <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4">
                  <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Entités ({result.entities.length})</h3>
                  <div className="space-y-2">
                    {result.entities.map(e => (
                      <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/[0.04] hover:border-white/[0.08] transition-all">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${riskColor(e.risk)}`}>{e.risk}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-mono text-white/70">{e.value}</div>
                          <div className="text-[8px] text-white/25">{e.type.toUpperCase()} | {e.sources.length} sources</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Findings & Recommendations */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FileText size={12} /> Constatations
                    </h3>
                    <div className="space-y-2">
                      {result.findings.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px] text-white/50">
                          <div className="w-1 h-1 rounded-full bg-red-400/50 mt-1.5 shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Shield size={12} /> Recommandations
                    </h3>
                    <div className="space-y-2">
                      {result.recommendations.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px] text-white/50">
                          <div className="w-1 h-1 rounded-full bg-emerald-400/50 mt-1.5 shrink-0" />
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
