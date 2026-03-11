import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Eye, Radar, Play, Pause, RefreshCw, Loader2, CheckCircle,
  XCircle, Download, Zap, Settings, Map as MapIcon, Trash2
} from "lucide-react";

interface DiscoveredCamera {
  id: string; ip: string; port: number; type: string;
  lat: number; lng: number; location: string; lastSeen: string;
  status: "online" | "offline" | "checking"; source: string;
}

export default function EyeOfKalEl() {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<DiscoveredCamera[]>([]);
  const [logs, setLogs] = useState<{ time: string; msg: string; type: "info" | "success" | "warning" | "error" }[]>([]);
  const [autoMode, setAutoMode] = useState(false);
  const [scanIntensity, setScanIntensity] = useState(50);

  const addLog = useCallback((msg: string, type: "info" | "success" | "warning" | "error" = "info") => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), msg, type }, ...prev].slice(0, 100));
  }, []);

  const loadCameras = useCallback(async () => {
    try {
      const stored = localStorage.getItem("discoveredCameras");
      if (stored) {
        const data = JSON.parse(stored);
        setCameras(data);
        addLog(`Base charg\u00e9e : ${data.length} cibles`, "success");
      } else {
        addLog("Syst\u00e8me initialis\u00e9 \u2014 pr\u00eat pour le scan", "info");
      }
    } catch { addLog("Syst\u00e8me initialis\u00e9 \u2014 pr\u00eat pour le scan", "info"); }
  }, [addLog]);

  const runScan = useCallback(async () => {
    setIsScanning(true);
    addLog("Activation du scan autonome...", "info");
    const count = Math.floor(scanIntensity * 3);
    const newCams: DiscoveredCamera[] = Array.from({ length: count }, (_, i) => ({
      id: `scout-${Date.now()}-${i}`,
      ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      port: [80, 554, 8080, 8000, 8888][Math.floor(Math.random() * 5)],
      type: ["Hikvision", "Axis", "Dahua", "MJPG", "RTSP"][Math.floor(Math.random() * 5)],
      lat: Math.random() * 180 - 90, lng: Math.random() * 360 - 180,
      location: `Zone ${Math.floor(Math.random() * 1000)}`,
      lastSeen: new Date().toISOString(),
      status: Math.random() > 0.3 ? "online" as const : "offline" as const,
      source: "scout-autonomous"
    }));
    setCameras(prev => {
      const updated = [...prev, ...newCams];
      localStorage.setItem("discoveredCameras", JSON.stringify(updated));
      return updated;
    });
    addLog(`${count} nouvelles cibles inject\u00e9es`, "success");
    setIsScanning(false);
  }, [scanIntensity, addLog]);

  const sendToMap = useCallback(() => {
    if (cameras.length === 0) { addLog("Aucune caméra à envoyer", "warning"); return; }
    localStorage.setItem("dynamicCameras", JSON.stringify(cameras));
    addLog(`${cameras.length} caméras envoyées à la carte`, "success");
  }, [cameras, addLog]);

  const exportCSV = useCallback(() => {
    const csv = "IP,Port,Type,Location,Lat,Lng,Status,LastSeen\n" + cameras.map(c =>
      `${c.ip},${c.port},${c.type},"${c.location}",${c.lat.toFixed(4)},${c.lng.toFixed(4)},${c.status},${c.lastSeen}`
    ).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `kalel-scan-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    addLog("Export CSV téléchargé", "success");
  }, [cameras, addLog]);

  useEffect(() => { loadCameras(); }, []);
  useEffect(() => {
    if (autoMode && !isScanning) { const t = setTimeout(runScan, 5000); return () => clearTimeout(t); }
  }, [autoMode, isScanning, runScan]);

  const online = cameras.filter(c => c.status === "online").length;
  const offline = cameras.filter(c => c.status === "offline").length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <Radar size={16} className="text-purple-400" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">Eye of Kal-El</h1>
        </div>
        <div className="flex items-center gap-2">
          {autoMode && <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest animate-pulse">Mode Auto Actif</span>}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Stat icon={Eye} label="Total" value={cameras.length.toString()} accent="text-[#00a8ff]" />
          <Stat icon={CheckCircle} label="En Ligne" value={online.toString()} accent="text-emerald-400" />
          <Stat icon={XCircle} label="Hors Ligne" value={offline.toString()} accent="text-red-400" />
          <Stat icon={Radar} label="Scout" value={autoMode ? "ACTIF" : "INACTIF"} accent={autoMode ? "text-purple-400" : "text-white/30"} />
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Controls */}
          <div className="col-span-1 space-y-3">
            <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4 space-y-3">
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Contrôles</h3>
              <div>
                <label className="text-[9px] text-white/30 block mb-2">Intensité : {scanIntensity}%</label>
                <input type="range" min="10" max="100" value={scanIntensity} onChange={e => setScanIntensity(Number(e.target.value))} className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-purple-500" />
              </div>
              <button onClick={runScan} disabled={isScanning} className="w-full py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-500/15 transition-all disabled:opacity-50">
                {isScanning ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                Scan Unique
              </button>
              <button onClick={() => setAutoMode(!autoMode)} className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${autoMode ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                {autoMode ? <Pause size={12} /> : <Play size={12} />}
                {autoMode ? "Arrêter" : "Mode Auto"}
              </button>
              <div className="border-t border-white/[0.04] pt-3 space-y-2">
                <button onClick={sendToMap} className="w-full py-2 rounded-lg bg-[#00a8ff]/10 border border-[#00a8ff]/15 text-[#00a8ff] text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#00a8ff]/15 transition-all">
                  <MapIcon size={12} /> Carte Intel
                </button>
                <button onClick={exportCSV} className="w-full py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/[0.05] transition-all">
                  <Download size={12} /> Export CSV
                </button>
                <button onClick={() => { setCameras([]); addLog("Base effacée", "warning"); }} className="w-full py-2 rounded-lg bg-red-500/5 border border-red-500/10 text-red-400/50 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all">
                  <Trash2 size={12} /> Effacer
                </button>
              </div>
            </div>
          </div>

          {/* Camera List */}
          <div className="col-span-2 bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4 flex flex-col max-h-[500px]">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Cibles ({cameras.length})</h3>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {cameras.length === 0 ? (
                <div className="text-center py-12 text-white/10 text-[10px] uppercase tracking-widest">Lancez un scan</div>
              ) : cameras.slice(0, 150).map((cam, i) => (
                <motion.div key={cam.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.01, 0.5) }} className="flex items-center gap-3 p-2.5 rounded-lg bg-black/30 border border-white/[0.04] hover:border-white/[0.08] transition-all group">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cam.status === "online" ? "bg-emerald-500" : "bg-red-500/50"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-[#00a8ff]/70">{cam.ip}:{cam.port}</div>
                    <div className="text-[8px] text-white/20">{cam.type} | {cam.location}</div>
                  </div>
                  <div className="text-[8px] text-white/15 font-mono shrink-0">{cam.lat.toFixed(1)},{cam.lng.toFixed(1)}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Logs */}
          <div className="col-span-1 bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-4 flex flex-col max-h-[500px]">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Journal</h3>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {logs.map((log, i) => (
                <div key={i} className="py-1.5 px-2 rounded-md hover:bg-white/[0.02] transition-colors">
                  <div className="text-[8px] font-mono text-white/15">{log.time}</div>
                  <div className={`text-[9px] ${log.type === "success" ? "text-emerald-400/70" : log.type === "error" ? "text-red-400/70" : log.type === "warning" ? "text-amber-400/70" : "text-white/40"}`}>
                    {log.msg}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  return (
    <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} className={accent} />
        <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-lg font-[Rajdhani] font-bold text-white/90">{value}</div>
    </div>
  );
}
