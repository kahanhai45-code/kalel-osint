import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ship, Anchor, Navigation, AlertTriangle, Eye, Download, Filter,
  ChevronRight, MapPin, Clock, Shield, Radio, Crosshair, Waves
} from "lucide-react";

interface Vessel {
  id: string;
  name: string;
  mmsi: string;
  imo: string;
  flag: string;
  country: string;
  type: "WARSHIP" | "CARRIER" | "SUBMARINE" | "DESTROYER" | "FRIGATE" | "CARGO" | "TANKER" | "PATROL";
  class: string;
  status: "UNDERWAY" | "ANCHORED" | "DARK" | "RESTRICTED";
  speed: number; // knots
  heading: number; // degrees
  lat: number;
  lng: number;
  destination: string;
  description: string;
  threat: "HIGH" | "MODERATE" | "LOW" | "FRIENDLY";
  lastUpdate: string;
  weapons?: string;
}

const TYPE_ICONS: Record<string, string> = {
  WARSHIP: "🚢", CARRIER: "🛳️", SUBMARINE: "🔱", DESTROYER: "⚓", FRIGATE: "🚤", CARGO: "📦", TANKER: "🛢️", PATROL: "🔍"
};

const TYPE_COLORS: Record<string, string> = {
  WARSHIP: "#ef4444", CARRIER: "#dc2626", SUBMARINE: "#8b5cf6", DESTROYER: "#f97316", FRIGATE: "#3b82f6", CARGO: "#6b7280", TANKER: "#eab308", PATROL: "#22c55e"
};

const THREAT_COLORS: Record<string, string> = { HIGH: "#ef4444", MODERATE: "#f97316", LOW: "#22c55e", FRIENDLY: "#3b82f6" };
const STATUS_COLORS: Record<string, string> = { UNDERWAY: "#22c55e", ANCHORED: "#3b82f6", DARK: "#ef4444", RESTRICTED: "#f97316" };

const VESSELS: Vessel[] = [
  { id: "v-001", name: "USS Dwight D. Eisenhower (CVN-69)", mmsi: "369970001", imo: "N/A", flag: "🇺🇸", country: "USA", type: "CARRIER", class: "Nimitz-class", status: "UNDERWAY", speed: 18, heading: 135, lat: 15.8, lng: 42.3, destination: "Red Sea Patrol", description: "Porte-avions nucléaire US déployé en Mer Rouge. Groupe aéronaval complet. Opérations contre les Houthis. 5000+ personnel.", threat: "FRIENDLY", lastUpdate: "2026-03-11 21:30", weapons: "F/A-18E/F, EA-18G, E-2D, MH-60R/S" },
  { id: "v-002", name: "USS Gravely (DDG-107)", mmsi: "369970045", imo: "N/A", flag: "🇺🇸", country: "USA", type: "DESTROYER", class: "Arleigh Burke-class", status: "UNDERWAY", speed: 22, heading: 180, lat: 14.2, lng: 43.1, destination: "Bab el-Mandeb", description: "Destroyer lance-missiles escortant le CVN-69. Intercepte missiles et drones Houthis. Aegis BMD capable.", threat: "FRIENDLY", lastUpdate: "2026-03-11 21:25", weapons: "SM-2, SM-6, Tomahawk, ESSM, Phalanx" },
  { id: "v-003", name: "IRIS Sahand (F-74)", mmsi: "422100003", imo: "N/A", flag: "🇮🇷", country: "Iran", type: "FRIGATE", class: "Moudge-class", status: "UNDERWAY", speed: 14, heading: 270, lat: 25.8, lng: 57.2, destination: "Strait of Hormuz Patrol", description: "Frégate iranienne patrouillant le détroit d'Ormuz. Armement anti-navire. Surveillance du trafic maritime.", threat: "HIGH", lastUpdate: "2026-03-11 21:20", weapons: "Noor AShM, Mehrab SAM, torpilles" },
  { id: "v-004", name: "INS Eilat (Sa'ar 5)", mmsi: "428100001", imo: "N/A", flag: "🇮🇱", country: "Israel", type: "WARSHIP", class: "Sa'ar 5-class", status: "UNDERWAY", speed: 16, heading: 340, lat: 33.5, lng: 34.2, destination: "Eastern Med Patrol", description: "Corvette lance-missiles israélienne. Patrouille Méditerranée orientale. Défense anti-missile et anti-sous-marine.", threat: "FRIENDLY", lastUpdate: "2026-03-11 21:15", weapons: "Harpoon, Barak-8, torpilles Mk46" },
  { id: "v-005", name: "Vessel Unknown (AIS Dark)", mmsi: "DARK", imo: "N/A", flag: "🏴", country: "Unknown", type: "SUBMARINE", class: "Unknown", status: "DARK", speed: 0, heading: 0, lat: 26.5, lng: 56.8, destination: "Unknown", description: "Contact sous-marin détecté par sonar passif dans le détroit d'Ormuz. AIS désactivé. Probable sous-marin iranien classe Fateh ou Ghadir.", threat: "HIGH", lastUpdate: "2026-03-11 20:45", weapons: "Torpilles, mines" },
  { id: "v-006", name: "RFS Admiral Gorshkov", mmsi: "273100001", imo: "N/A", flag: "🇷🇺", country: "Russia", type: "FRIGATE", class: "Admiral Gorshkov-class", status: "UNDERWAY", speed: 12, heading: 200, lat: 34.8, lng: 33.5, destination: "Tartus, Syria", description: "Frégate russe en route vers la base de Tartus. Armée de missiles hypersoniques Zircon. Escorte possible de sous-marin.", threat: "MODERATE", lastUpdate: "2026-03-11 21:00", weapons: "Zircon, Kalibr, Poliment-Redut, Paket-NK" },
  { id: "v-007", name: "MT Sounion (Tanker)", mmsi: "241234567", imo: "9876543", flag: "🇬🇷", country: "Greece", type: "TANKER", class: "Suezmax", status: "ANCHORED", speed: 0, heading: 0, lat: 13.5, lng: 42.8, destination: "Suez Canal", description: "Pétrolier touché par missile Houthi en Mer Rouge. Ancré, en attente de remorquage. Risque de marée noire. 150 000 tonnes de brut.", threat: "LOW", lastUpdate: "2026-03-11 18:00" },
  { id: "v-008", name: "CGRI Shahid Mahdavi", mmsi: "422100099", imo: "N/A", flag: "🇮🇷", country: "Iran", type: "PATROL", class: "Missile Boat", status: "UNDERWAY", speed: 28, heading: 90, lat: 26.2, lng: 55.9, destination: "Persian Gulf Patrol", description: "Vedette rapide lance-missiles du CGRI. Tactique d'essaim. Armée de missiles Noor. Menace pour le trafic pétrolier.", threat: "HIGH", lastUpdate: "2026-03-11 21:10", weapons: "Noor AShM, DShK, RPG" },
  { id: "v-009", name: "HMS Diamond (D-34)", mmsi: "232100034", imo: "N/A", flag: "🇬🇧", country: "UK", type: "DESTROYER", class: "Type 45 Daring-class", status: "UNDERWAY", speed: 20, heading: 160, lat: 14.8, lng: 42.5, destination: "Red Sea — Op Prosperity Guardian", description: "Destroyer britannique déployé en Mer Rouge. Opération Prosperity Guardian. Interception de drones et missiles Houthis.", threat: "FRIENDLY", lastUpdate: "2026-03-11 21:05", weapons: "Sea Viper (Aster-15/30), Phalanx, 4.5in gun" },
  { id: "v-010", name: "FS Alsace (D-656)", mmsi: "226100656", imo: "N/A", flag: "🇫🇷", country: "France", type: "FRIGATE", class: "FREMM-DA", status: "UNDERWAY", speed: 15, heading: 90, lat: 11.5, lng: 43.2, destination: "Djibouti", description: "Frégate française de défense aérienne. Base de Djibouti. Surveillance Mer Rouge et Golfe d'Aden. Capacité Aster-30.", threat: "FRIENDLY", lastUpdate: "2026-03-11 20:50", weapons: "Aster-15/30, Exocet MM40, 76mm OTO Melara" },
];

const ZONES = [
  { name: "Strait of Hormuz", lat: 26.5, lng: 56.5, threat: "CRITICAL", vessels: 3 },
  { name: "Red Sea / Bab el-Mandeb", lat: 13.5, lng: 42.5, threat: "CRITICAL", vessels: 4 },
  { name: "Eastern Mediterranean", lat: 34.0, lng: 34.0, threat: "HIGH", vessels: 2 },
  { name: "Persian Gulf", lat: 27.0, lng: 51.0, threat: "HIGH", vessels: 2 },
  { name: "Gulf of Aden", lat: 12.0, lng: 45.0, threat: "ELEVATED", vessels: 1 },
];

export default function MaritimeTracker() {
  const [selectedVessel, setSelectedVessel] = useState<Vessel>(VESSELS[0]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterThreat, setFilterThreat] = useState<string>("ALL");
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const filteredVessels = VESSELS.filter(v => {
    if (filterType !== "ALL" && v.type !== filterType) return false;
    if (filterThreat !== "ALL" && v.threat !== filterThreat) return false;
    return true;
  });

  const exportVessels = () => {
    const csv = "Name,MMSI,Flag,Type,Status,Speed,Heading,Lat,Lng,Destination,Threat\n" +
      VESSELS.map(v => `"${v.name}",${v.mmsi},${v.country},${v.type},${v.status},${v.speed},${v.heading},${v.lat},${v.lng},"${v.destination}",${v.threat}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "maritime-tracker.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <Ship size={16} className="text-blue-400" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">MARITIME TRACKER</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] text-blue-400/70 font-bold uppercase tracking-widest">AIS MONITORING</span>
          </div>
          <span className="text-[9px] text-white/15 font-mono">{filteredVessels.length} VESSELS</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportVessels} className="px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[9px] text-white/30 hover:text-blue-400 font-bold uppercase tracking-widest transition-all flex items-center gap-1.5">
            <Download size={11} /> EXPORT
          </button>
          <span className="text-[10px] font-mono text-white/25">{clock.toLocaleTimeString("en-GB")} UTC</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Vessel List */}
        <div className="w-72 shrink-0 border-r border-white/[0.06] flex flex-col bg-[#070d1a]/40">
          {/* Filters */}
          <div className="p-3 border-b border-white/[0.06] space-y-2">
            <div className="text-[8px] font-bold text-white/15 uppercase tracking-widest">VESSEL TYPE</div>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setFilterType("ALL")} className={`px-2 py-1 rounded text-[7px] font-bold uppercase tracking-widest ${filterType === "ALL" ? "bg-white/[0.08] text-white/60" : "text-white/20 hover:text-white/40"}`}>ALL</button>
              {["CARRIER", "DESTROYER", "FRIGATE", "WARSHIP", "SUBMARINE", "PATROL", "TANKER"].map(t => (
                <button key={t} onClick={() => setFilterType(t)} className={`px-2 py-1 rounded text-[7px] font-bold uppercase tracking-widest ${filterType === t ? "text-white/80" : "text-white/20 hover:text-white/40"}`}
                  style={filterType === t ? { color: TYPE_COLORS[t], backgroundColor: TYPE_COLORS[t] + "15" } : {}}>
                  {t}
                </button>
              ))}
            </div>
            <div className="text-[8px] font-bold text-white/15 uppercase tracking-widest">THREAT</div>
            <div className="flex gap-1">
              {["ALL", "HIGH", "MODERATE", "LOW", "FRIENDLY"].map(t => (
                <button key={t} onClick={() => setFilterThreat(t)} className={`px-2 py-1 rounded text-[7px] font-bold uppercase tracking-widest ${filterThreat === t ? "bg-white/[0.08] text-white/60" : "text-white/20 hover:text-white/40"}`}
                  style={filterThreat === t && t !== "ALL" ? { color: THREAT_COLORS[t] } : {}}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Vessel List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredVessels.map(v => (
              <button key={v.id} onClick={() => setSelectedVessel(v)}
                className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-all text-left ${selectedVessel.id === v.id ? "bg-white/[0.06] border border-white/[0.08]" : "border border-transparent hover:bg-white/[0.03]"}`}>
                <span className="text-lg">{TYPE_ICONS[v.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold text-white/70 truncate">{v.name}</div>
                  <div className="text-[8px] text-white/25">{v.flag} {v.class}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: STATUS_COLORS[v.status] }} />
                    <span className="text-[7px] uppercase tracking-widest" style={{ color: STATUS_COLORS[v.status] }}>{v.status}</span>
                    {v.speed > 0 && <span className="text-[7px] text-white/15">{v.speed}kn</span>}
                  </div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: THREAT_COLORS[v.threat] }} />
              </button>
            ))}
          </div>
        </div>

        {/* Center: Details + Zones */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Vessel Detail */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: TYPE_COLORS[selectedVessel.type] + "15", border: `1px solid ${TYPE_COLORS[selectedVessel.type]}20` }}>
                {TYPE_ICONS[selectedVessel.type]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-[Rajdhani] font-bold text-lg text-white/90">{selectedVessel.name}</h2>
                  <span className="px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest" style={{ color: TYPE_COLORS[selectedVessel.type], backgroundColor: TYPE_COLORS[selectedVessel.type] + "15" }}>{selectedVessel.type}</span>
                  <span className="px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest" style={{ color: STATUS_COLORS[selectedVessel.status], backgroundColor: STATUS_COLORS[selectedVessel.status] + "15" }}>{selectedVessel.status}</span>
                  <span className="px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest" style={{ color: THREAT_COLORS[selectedVessel.threat], backgroundColor: THREAT_COLORS[selectedVessel.threat] + "15" }}>{selectedVessel.threat}</span>
                </div>
                <div className="text-[10px] text-white/30 mt-0.5">{selectedVessel.flag} {selectedVessel.country} — {selectedVessel.class}</div>
              </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="flex items-center gap-1.5 mb-1"><Navigation size={11} className="text-blue-400" /><span className="text-[8px] text-white/25 uppercase tracking-widest">Speed</span></div>
                <div className="text-xl font-bold text-white/80 font-[Rajdhani]">{selectedVessel.speed} <span className="text-[10px] text-white/30">kn</span></div>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="flex items-center gap-1.5 mb-1"><Crosshair size={11} className="text-amber-400" /><span className="text-[8px] text-white/25 uppercase tracking-widest">Heading</span></div>
                <div className="text-xl font-bold text-white/80 font-[Rajdhani]">{selectedVessel.heading}°</div>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="flex items-center gap-1.5 mb-1"><MapPin size={11} className="text-emerald-400" /><span className="text-[8px] text-white/25 uppercase tracking-widest">Position</span></div>
                <div className="text-[12px] font-mono text-white/50">{selectedVessel.lat}°N {selectedVessel.lng}°E</div>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="flex items-center gap-1.5 mb-1"><Clock size={11} className="text-white/25" /><span className="text-[8px] text-white/25 uppercase tracking-widest">Last Update</span></div>
                <div className="text-[11px] text-white/50">{selectedVessel.lastUpdate}</div>
              </div>
            </div>

            {/* IDs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="text-[8px] text-white/20 uppercase tracking-widest mb-1">MMSI</div>
                <div className="text-[12px] font-mono text-white/50">{selectedVessel.mmsi}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="text-[8px] text-white/20 uppercase tracking-widest mb-1">IMO</div>
                <div className="text-[12px] font-mono text-white/50">{selectedVessel.imo}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="text-[8px] text-white/20 uppercase tracking-widest mb-1">Destination</div>
                <div className="text-[11px] text-white/50">{selectedVessel.destination}</div>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-[#00a8ff]/[0.03] border border-[#00a8ff]/10">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={12} className="text-[#00a8ff]" />
                <span className="text-[9px] font-bold text-[#00a8ff]/60 uppercase tracking-widest">Intelligence Assessment</span>
              </div>
              <div className="text-[12px] text-white/60 leading-relaxed">{selectedVessel.description}</div>
            </div>

            {/* Weapons */}
            {selectedVessel.weapons && (
              <div className="p-3 rounded-xl bg-red-500/[0.03] border border-red-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={12} className="text-red-400" />
                  <span className="text-[9px] font-bold text-red-400/60 uppercase tracking-widest">Armament</span>
                </div>
                <div className="text-[11px] text-white/50">{selectedVessel.weapons}</div>
              </div>
            )}

            {/* Maritime Zones */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-3">
                <Waves size={12} className="text-blue-400" />
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">CRITICAL MARITIME ZONES</span>
              </div>
              <div className="space-y-2">
                {ZONES.map((z, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: z.threat === "CRITICAL" ? "#ef4444" : z.threat === "HIGH" ? "#f97316" : "#eab308" }} />
                      <span className="text-[10px] text-white/60">{z.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] text-white/25">{z.vessels} vessels</span>
                      <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: z.threat === "CRITICAL" ? "#ef4444" : z.threat === "HIGH" ? "#f97316" : "#eab308" }}>{z.threat}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
