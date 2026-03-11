import { useState, useEffect, useCallback } from "react";
import {
  Radio, Wifi, Signal, Zap, Activity, AlertTriangle,
  RefreshCw, Play, Pause, Download, Filter, Volume2
} from "lucide-react";
import { useI18n } from "../lib/i18n";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface SignalIntercept {
  id: string; frequency: string; band: string; type: string; source: string;
  strength: number; timestamp: Date; classification: "UNCLASSIFIED" | "CONFIDENTIAL" | "SECRET" | "TOP SECRET";
  content: string; bearing: number; distance: string;
}

const BANDS = ["HF", "VHF", "UHF", "SHF", "EHF", "L-Band", "S-Band", "C-Band", "X-Band", "Ku-Band"];
const SIGNAL_TYPES = ["Voice Comm", "Data Burst", "Radar Emission", "Telemetry", "Beacon", "Encrypted Comm", "Jammer", "GPS Spoof", "Drone C2", "Missile Guidance"];
const SOURCES = ["Unknown Military", "IRGC Naval", "Hezbollah Comm", "Russian MoD", "IDF Frequency", "USAF AWACS", "Turkish Navy", "Syrian SAM", "Houthi Drone", "PMF Militia"];
const CLASSIFICATIONS: SignalIntercept["classification"][] = ["UNCLASSIFIED", "CONFIDENTIAL", "SECRET", "TOP SECRET"];
const CLASS_COLORS: Record<string, string> = { "UNCLASSIFIED": "#22c55e", "CONFIDENTIAL": "#3b82f6", "SECRET": "#eab308", "TOP SECRET": "#ef4444" };

function generateSignal(): SignalIntercept {
  const band = BANDS[Math.floor(Math.random() * BANDS.length)];
  const freq = (Math.random() * 40000 + 100).toFixed(2);
  return {
    id: Math.random().toString(36).slice(2, 10),
    frequency: `${freq} MHz`,
    band,
    type: SIGNAL_TYPES[Math.floor(Math.random() * SIGNAL_TYPES.length)],
    source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
    strength: Math.floor(Math.random() * 100) - 80,
    timestamp: new Date(),
    classification: CLASSIFICATIONS[Math.floor(Math.random() * 4)],
    content: Math.random() > 0.5 ? "Encrypted — AES-256" : Math.random() > 0.5 ? "Voice — Arabic dialect detected" : "Digital burst — Protocol unknown",
    bearing: Math.floor(Math.random() * 360),
    distance: `${(Math.random() * 500 + 10).toFixed(0)} km`,
  };
}

export default function SigintMonitor() {
  const { t } = useI18n();
  const [signals, setSignals] = useState<SignalIntercept[]>([]);
  const [running, setRunning] = useState(true);
  const [filterBand, setFilterBand] = useState<string>("all");
  const [spectrumData, setSpectrumData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, encrypted: 0, military: 0, topSecret: 0 });

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const sig = generateSignal();
      setSignals(prev => [sig, ...prev].slice(0, 200));
      setStats(prev => ({
        total: prev.total + 1,
        encrypted: prev.encrypted + (sig.content.includes("Encrypted") ? 1 : 0),
        military: prev.military + (sig.source.includes("Military") || sig.source.includes("MoD") || sig.source.includes("Navy") || sig.source.includes("IDF") || sig.source.includes("USAF") ? 1 : 0),
        topSecret: prev.topSecret + (sig.classification === "TOP SECRET" ? 1 : 0),
      }));
    }, 1200);
    return () => clearInterval(interval);
  }, [running]);

  // Spectrum data
  useEffect(() => {
    const interval = setInterval(() => {
      setSpectrumData(Array.from({ length: 64 }).map((_, i) => ({
        freq: i,
        power: Math.random() * 60 - 80 + (Math.random() > 0.9 ? 40 : 0),
      })));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const filteredSignals = filterBand === "all" ? signals : signals.filter(s => s.band === filterBand);

  const exportSignals = () => {
    const csv = "ID,Frequency,Band,Type,Source,Strength,Classification,Bearing,Distance,Content,Timestamp\n" +
      signals.map(s => `${s.id},${s.frequency},${s.band},${s.type},${s.source},${s.strength}dBm,${s.classification},${s.bearing}°,${s.distance},"${s.content}",${s.timestamp.toISOString()}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `sigint-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <Radio size={16} className="text-emerald-400" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">SIGINT MONITOR</h1>
          <div className="flex items-center gap-1.5 ml-2">
            <div className={`w-1.5 h-1.5 rounded-full ${running ? "bg-emerald-500 animate-pulse" : "bg-white/20"}`} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: running ? "#22c55e" : "#ffffff30" }}>{running ? "SCANNING" : "PAUSED"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportSignals} className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-white/[0.04] text-white/30 border border-white/[0.06] hover:text-white/50 transition-all flex items-center gap-1">
            <Download size={10} /> Export
          </button>
          <button onClick={() => setRunning(!running)} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-1.5 ${running ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
            {running ? <><Pause size={10} /> Pause</> : <><Play size={10} /> Resume</>}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Spectrum + Stats */}
        <div className="w-72 bg-[#070d1a] border-r border-white/[0.06] flex flex-col overflow-hidden">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 p-3 border-b border-white/[0.06]">
            <MiniStat label="INTERCEPTED" value={stats.total} color="#00a8ff" />
            <MiniStat label="ENCRYPTED" value={stats.encrypted} color="#eab308" />
            <MiniStat label="MILITARY" value={stats.military} color="#ef4444" />
            <MiniStat label="TOP SECRET" value={stats.topSecret} color="#a855f7" />
          </div>

          {/* Spectrum Analyzer */}
          <div className="p-3 border-b border-white/[0.06]">
            <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">SPECTRUM ANALYZER</h3>
            <div className="h-[120px] bg-black/40 rounded-lg border border-white/[0.04] p-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spectrumData}>
                  <Area type="monotone" dataKey="power" stroke="#00ff88" fill="#00ff8815" strokeWidth={1} />
                  <XAxis hide />
                  <YAxis hide domain={[-80, 0]} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-1 text-[7px] text-white/15 font-mono">
              <span>100 MHz</span>
              <span>FREQUENCY</span>
              <span>40 GHz</span>
            </div>
          </div>

          {/* Band Filter */}
          <div className="p-3">
            <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">BAND FILTER</h3>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setFilterBand("all")} className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest transition-all ${filterBand === "all" ? "bg-[#00a8ff]/15 text-[#00a8ff] border border-[#00a8ff]/20" : "text-white/20 hover:text-white/40 border border-transparent"}`}>ALL</button>
              {BANDS.map(b => (
                <button key={b} onClick={() => setFilterBand(b)} className={`px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest transition-all ${filterBand === b ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "text-white/15 hover:text-white/30 border border-transparent"}`}>{b}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Signal Feed */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredSignals.length === 0 ? (
            <div className="text-center py-20 text-white/10 text-[10px] uppercase tracking-widest">Scanning frequencies...</div>
          ) : (
            filteredSignals.slice(0, 50).map(sig => (
              <div key={sig.id} className="p-3 rounded-lg bg-[#0a1428]/50 border border-white/[0.04] hover:border-white/[0.08] transition-all">
                <div className="flex items-center gap-2 mb-1.5">
                  <Signal size={12} className="text-emerald-400/60" />
                  <span className="text-[11px] font-bold text-white/70">{sig.type}</span>
                  <span className="text-[8px] font-mono text-emerald-400/50 ml-1">{sig.frequency}</span>
                  <span className="text-[7px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest ml-auto" style={{ color: CLASS_COLORS[sig.classification], backgroundColor: CLASS_COLORS[sig.classification] + "15" }}>{sig.classification}</span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-[9px]">
                  <div>
                    <span className="text-white/20 block">Source</span>
                    <span className="text-white/50 font-semibold">{sig.source}</span>
                  </div>
                  <div>
                    <span className="text-white/20 block">Band</span>
                    <span className="text-white/50 font-mono">{sig.band}</span>
                  </div>
                  <div>
                    <span className="text-white/20 block">Bearing / Distance</span>
                    <span className="text-white/50 font-mono">{sig.bearing}° / {sig.distance}</span>
                  </div>
                  <div>
                    <span className="text-white/20 block">Strength</span>
                    <span className="text-white/50 font-mono">{sig.strength} dBm</span>
                  </div>
                </div>
                <div className="mt-1.5 text-[8px] text-white/25 font-mono bg-black/20 px-2 py-1 rounded">{sig.content}</div>
                <div className="text-[7px] text-white/10 mt-1 font-mono">{sig.timestamp.toLocaleTimeString("en-GB")}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-2 rounded-lg bg-black/30 border border-white/[0.04]">
      <div className="text-[7px] font-bold uppercase tracking-widest" style={{ color: color + "60" }}>{label}</div>
      <div className="text-sm font-[Rajdhani] font-bold text-white/80 mt-0.5">{value}</div>
    </div>
  );
}
