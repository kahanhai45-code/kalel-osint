import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Satellite, Globe, Radio, Eye, RefreshCw, Download, Filter,
  ChevronRight, MapPin, Clock, Zap, Shield, AlertTriangle, Crosshair
} from "lucide-react";

interface SatelliteObj {
  id: string;
  name: string;
  noradId: string;
  country: string;
  flag: string;
  type: "MILITARY" | "RECON" | "COMMS" | "SIGINT" | "NAVIGATION" | "EARLY_WARNING";
  orbit: string;
  altitude: number; // km
  inclination: number;
  period: number; // minutes
  status: "ACTIVE" | "MANEUVERING" | "DECAYING" | "UNKNOWN";
  classification: "TOP SECRET" | "SECRET" | "CONFIDENTIAL" | "UNCLASSIFIED";
  description: string;
  lat: number;
  lng: number;
  velocity: number; // km/s
}

const TYPE_COLORS: Record<string, string> = {
  MILITARY: "#ef4444", RECON: "#f97316", COMMS: "#3b82f6", SIGINT: "#8b5cf6", NAVIGATION: "#22c55e", EARLY_WARNING: "#eab308"
};

const STATUS_COLORS: Record<string, string> = { ACTIVE: "#22c55e", MANEUVERING: "#f97316", DECAYING: "#ef4444", UNKNOWN: "#6b7280" };

const SATELLITES: SatelliteObj[] = [
  { id: "sat-001", name: "OFEK-16", noradId: "45890", country: "Israel", flag: "🇮🇱", type: "RECON", orbit: "LEO Sun-Sync", altitude: 600, inclination: 97.8, period: 96, status: "ACTIVE", classification: "TOP SECRET", description: "Satellite de reconnaissance optique israélien. Résolution sub-métrique. Surveillance Iran, Syrie, Liban.", lat: 32.1, lng: 45.3, velocity: 7.6 },
  { id: "sat-002", name: "OFEK-13", noradId: "52345", country: "Israel", flag: "🇮🇱", type: "RECON", orbit: "LEO Sun-Sync", altitude: 580, inclination: 97.5, period: 95, status: "ACTIVE", classification: "TOP SECRET", description: "Satellite SAR (radar) israélien. Imagerie tout temps. Capacité de détection de mouvements souterrains.", lat: 28.5, lng: 51.2, velocity: 7.6 },
  { id: "sat-003", name: "USA-326 (KH-11)", noradId: "58234", country: "USA", flag: "🇺🇸", type: "RECON", orbit: "LEO Sun-Sync", altitude: 265, inclination: 97.9, period: 89, status: "ACTIVE", classification: "TOP SECRET", description: "Satellite espion NRO. Résolution ~10cm. Surveillance globale. Passage fréquent au-dessus du Moyen-Orient.", lat: 34.8, lng: 38.9, velocity: 7.8 },
  { id: "sat-004", name: "NOOR-3", noradId: "56789", country: "Iran", flag: "🇮🇷", type: "RECON", orbit: "LEO", altitude: 450, inclination: 59.8, period: 93, status: "ACTIVE", classification: "SECRET", description: "Satellite de reconnaissance iranien lancé par le CGRI. Capacités limitées mais en amélioration. Orbite non sun-synchrone.", lat: 35.7, lng: 52.1, velocity: 7.7 },
  { id: "sat-005", name: "COSMOS-2569", noradId: "57123", country: "Russia", flag: "🇷🇺", type: "SIGINT", orbit: "LEO", altitude: 500, inclination: 67.1, period: 94, status: "ACTIVE", classification: "SECRET", description: "Satellite SIGINT russe (Lotos-S). Interception de communications militaires. Couverture Moyen-Orient et Méditerranée.", lat: 40.2, lng: 42.8, velocity: 7.6 },
  { id: "sat-006", name: "SBIRS GEO-6", noradId: "54321", country: "USA", flag: "🇺🇸", type: "EARLY_WARNING", orbit: "GEO", altitude: 35786, inclination: 0.1, period: 1436, status: "ACTIVE", classification: "TOP SECRET", description: "Satellite d'alerte précoce US. Détection de lancements de missiles en temps réel. Couverture Iran et Moyen-Orient.", lat: 0, lng: 42.0, velocity: 3.1 },
  { id: "sat-007", name: "MILSTAR-6", noradId: "48765", country: "USA", flag: "🇺🇸", type: "COMMS", orbit: "GEO", altitude: 35786, inclination: 0.05, period: 1436, status: "ACTIVE", classification: "SECRET", description: "Satellite de communications militaires US. Résistant au brouillage. Liaison CENTCOM et forces déployées au Moyen-Orient.", lat: 0, lng: 50.0, velocity: 3.1 },
  { id: "sat-008", name: "GPS III-SV06", noradId: "53456", country: "USA", flag: "🇺🇸", type: "NAVIGATION", orbit: "MEO", altitude: 20200, inclination: 55.0, period: 718, status: "ACTIVE", classification: "UNCLASSIFIED", description: "Satellite GPS Block III. Signal M-Code militaire anti-brouillage. Précision <1m pour les forces armées.", lat: 25.3, lng: 48.7, velocity: 3.9 },
  { id: "sat-009", name: "YAOGAN-41", noradId: "59012", country: "China", flag: "🇨🇳", type: "RECON", orbit: "LEO Sun-Sync", altitude: 500, inclination: 97.4, period: 94, status: "ACTIVE", classification: "SECRET", description: "Satellite de reconnaissance chinois. Surveillance des bases US au Moyen-Orient. Capacité SAR et optique.", lat: 30.1, lng: 47.5, velocity: 7.6 },
  { id: "sat-010", name: "TÜRKSAT-6A", noradId: "60123", country: "Turkey", flag: "🇹🇷", type: "COMMS", orbit: "GEO", altitude: 35786, inclination: 0.1, period: 1436, status: "ACTIVE", classification: "CONFIDENTIAL", description: "Satellite de communications militaires turc. Couverture Moyen-Orient, Afrique du Nord. Liaison forces turques en Syrie et Libye.", lat: 0, lng: 42.0, velocity: 3.1 },
  { id: "sat-011", name: "EROS-C2", noradId: "55678", country: "Israel", flag: "🇮🇱", type: "RECON", orbit: "LEO Sun-Sync", altitude: 500, inclination: 97.4, period: 94, status: "ACTIVE", classification: "SECRET", description: "Satellite commercial israélien (IAI). Résolution 30cm. Utilisé par les forces armées et le renseignement.", lat: 36.2, lng: 40.1, velocity: 7.6 },
  { id: "sat-012", name: "TUNDRA-5 (EKS)", noradId: "58901", country: "Russia", flag: "🇷🇺", type: "EARLY_WARNING", orbit: "HEO (Molniya)", altitude: 38000, inclination: 63.4, period: 720, status: "ACTIVE", classification: "SECRET", description: "Satellite d'alerte précoce russe. Orbite Molniya pour couverture haute latitude. Détection de lancements ICBM.", lat: 55.0, lng: 37.6, velocity: 4.5 },
];

export default function SatelliteTracker() {
  const [selectedSat, setSelectedSat] = useState<SatelliteObj>(SATELLITES[0]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterCountry, setFilterCountry] = useState<string>("ALL");
  const [clock, setClock] = useState(new Date());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Animate satellite positions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    const draw = () => {
      const w = canvas.width = canvas.parentElement?.clientWidth || 600;
      const h = canvas.height = canvas.parentElement?.clientHeight || 400;
      ctx.clearRect(0, 0, w, h);

      // Background grid
      ctx.strokeStyle = "#ffffff06";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // Earth outline (simple)
      ctx.strokeStyle = "#00a8ff15";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, w * 0.15, h * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();

      const time = Date.now() / 1000;
      const filtered = SATELLITES.filter(s => {
        if (filterType !== "ALL" && s.type !== filterType) return false;
        if (filterCountry !== "ALL" && s.country !== filterCountry) return false;
        return true;
      });

      // Draw orbits and satellites
      filtered.forEach((sat, i) => {
        const orbitRadius = sat.orbit.includes("GEO") ? Math.min(w, h) * 0.42 :
          sat.orbit.includes("MEO") ? Math.min(w, h) * 0.32 :
          sat.orbit.includes("HEO") ? Math.min(w, h) * 0.38 :
          Math.min(w, h) * 0.22 + (i % 4) * 12;

        const speed = 1 / (sat.period / 60);
        const angle = (time * speed * 0.1 + i * (Math.PI * 2 / filtered.length)) % (Math.PI * 2);
        const tilt = (sat.inclination / 180) * Math.PI * 0.3;

        const sx = w / 2 + Math.cos(angle) * orbitRadius;
        const sy = h / 2 + Math.sin(angle) * orbitRadius * Math.cos(tilt);

        // Orbit path
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, orbitRadius, orbitRadius * Math.cos(tilt), 0, 0, Math.PI * 2);
        ctx.strokeStyle = sat.id === selectedSat.id ? "#00a8ff20" : "#ffffff06";
        ctx.lineWidth = sat.id === selectedSat.id ? 1.5 : 0.5;
        ctx.stroke();

        // Satellite dot
        const isSelected = sat.id === selectedSat.id;
        const dotSize = isSelected ? 6 : 4;
        ctx.beginPath();
        ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = TYPE_COLORS[sat.type];
        ctx.fill();

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(sx, sy, dotSize + 4, 0, Math.PI * 2);
          ctx.strokeStyle = "#00a8ff60";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Pulse
          const pulse = (Math.sin(time * 3) + 1) * 4 + 8;
          ctx.beginPath();
          ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
          ctx.strokeStyle = "#00a8ff20";
          ctx.stroke();
        }

        // Label
        ctx.font = `bold ${isSelected ? 9 : 7}px Rajdhani, sans-serif`;
        ctx.fillStyle = isSelected ? "#00a8ff" : "#ffffff30";
        ctx.textAlign = "center";
        ctx.fillText(sat.name, sx, sy - dotSize - 4);
      });

      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrame);
  }, [selectedSat, filterType, filterCountry]);

  const countries = [...new Set(SATELLITES.map(s => s.country))];
  const types = [...new Set(SATELLITES.map(s => s.type))];

  const filteredSats = SATELLITES.filter(s => {
    if (filterType !== "ALL" && s.type !== filterType) return false;
    if (filterCountry !== "ALL" && s.country !== filterCountry) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <Satellite size={16} className="text-cyan-400" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">SATELLITE TRACKER</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[9px] text-cyan-400/70 font-bold uppercase tracking-widest">TRACKING</span>
          </div>
          <span className="text-[9px] text-white/15 font-mono">{filteredSats.length}/{SATELLITES.length} SAT</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/25">{clock.toLocaleTimeString("en-GB")} UTC</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Satellite List */}
        <div className="w-72 shrink-0 border-r border-white/[0.06] flex flex-col bg-[#070d1a]/40">
          {/* Filters */}
          <div className="p-3 border-b border-white/[0.06] space-y-2">
            <div className="text-[8px] font-bold text-white/15 uppercase tracking-widest">FILTER BY TYPE</div>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setFilterType("ALL")} className={`px-2 py-1 rounded text-[7px] font-bold uppercase tracking-widest ${filterType === "ALL" ? "bg-white/[0.08] text-white/60" : "text-white/20 hover:text-white/40"}`}>ALL</button>
              {types.map(t => (
                <button key={t} onClick={() => setFilterType(t)} className={`px-2 py-1 rounded text-[7px] font-bold uppercase tracking-widest ${filterType === t ? "text-white/80" : "text-white/20 hover:text-white/40"}`}
                  style={filterType === t ? { color: TYPE_COLORS[t], backgroundColor: TYPE_COLORS[t] + "15" } : {}}>
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
            <div className="text-[8px] font-bold text-white/15 uppercase tracking-widest">COUNTRY</div>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setFilterCountry("ALL")} className={`px-2 py-1 rounded text-[7px] font-bold uppercase tracking-widest ${filterCountry === "ALL" ? "bg-white/[0.08] text-white/60" : "text-white/20 hover:text-white/40"}`}>ALL</button>
              {countries.map(c => (
                <button key={c} onClick={() => setFilterCountry(c)} className={`px-2 py-1 rounded text-[7px] font-bold uppercase tracking-widest ${filterCountry === c ? "bg-white/[0.08] text-white/60" : "text-white/20 hover:text-white/40"}`}>{c}</button>
              ))}
            </div>
          </div>

          {/* Satellite List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredSats.map(sat => (
              <button key={sat.id} onClick={() => setSelectedSat(sat)}
                className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-all text-left ${selectedSat.id === sat.id ? "bg-white/[0.06] border border-white/[0.08]" : "border border-transparent hover:bg-white/[0.03]"}`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: TYPE_COLORS[sat.type] + "15" }}>
                  {sat.flag}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-white/70 truncate">{sat.name}</div>
                  <div className="text-[8px] text-white/25">{sat.type.replace("_", " ")} — {sat.orbit}</div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[sat.status] }} />
                  <span className="text-[7px] text-white/15">{sat.altitude}km</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Orbital View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative bg-[#030810]">
            <canvas ref={canvasRef} className="w-full h-full" />
            {/* Legend */}
            <div className="absolute top-3 left-3 p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/[0.06]">
              <div className="text-[7px] font-bold text-white/20 uppercase tracking-widest mb-1">TYPE</div>
              <div className="space-y-0.5">
                {Object.entries(TYPE_COLORS).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v }} />
                    <span className="text-[7px] text-white/30">{k.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: Selected Satellite Details */}
          <div className="h-44 shrink-0 border-t border-white/[0.06] bg-[#070d1a]/50 p-4 overflow-y-auto">
            <div className="flex items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedSat.flag}</span>
                  <h3 className="font-[Rajdhani] font-bold text-lg text-white/90">{selectedSat.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest" style={{ color: TYPE_COLORS[selectedSat.type], backgroundColor: TYPE_COLORS[selectedSat.type] + "15" }}>{selectedSat.type.replace("_", " ")}</span>
                  <span className="px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest" style={{ color: STATUS_COLORS[selectedSat.status], backgroundColor: STATUS_COLORS[selectedSat.status] + "15" }}>{selectedSat.status}</span>
                  <span className="px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400">{selectedSat.classification}</span>
                </div>
                <div className="text-[10px] text-white/30 mt-0.5">NORAD ID: {selectedSat.noradId} — {selectedSat.country}</div>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-3 mt-3">
              <div><div className="text-[7px] text-white/20 uppercase tracking-widest">Altitude</div><div className="text-[13px] font-bold text-white/70 font-[Rajdhani]">{selectedSat.altitude} km</div></div>
              <div><div className="text-[7px] text-white/20 uppercase tracking-widest">Inclination</div><div className="text-[13px] font-bold text-white/70 font-[Rajdhani]">{selectedSat.inclination}°</div></div>
              <div><div className="text-[7px] text-white/20 uppercase tracking-widest">Period</div><div className="text-[13px] font-bold text-white/70 font-[Rajdhani]">{selectedSat.period} min</div></div>
              <div><div className="text-[7px] text-white/20 uppercase tracking-widest">Velocity</div><div className="text-[13px] font-bold text-white/70 font-[Rajdhani]">{selectedSat.velocity} km/s</div></div>
              <div><div className="text-[7px] text-white/20 uppercase tracking-widest">Orbit</div><div className="text-[13px] font-bold text-white/70 font-[Rajdhani]">{selectedSat.orbit}</div></div>
              <div><div className="text-[7px] text-white/20 uppercase tracking-widest">Position</div><div className="text-[11px] font-mono text-white/40">{selectedSat.lat}°, {selectedSat.lng}°</div></div>
            </div>
            <div className="mt-2 text-[11px] text-white/40 leading-relaxed">{selectedSat.description}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
