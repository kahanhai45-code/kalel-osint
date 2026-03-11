import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Plus, Edit3, Trash2, Eye, Link2, MapPin,
  Phone, Mail, Globe, Shield, AlertTriangle, ChevronRight,
  Download, Filter, UserPlus, Network, X, Save, Star, Crosshair
} from "lucide-react";

// === TYPES ===
interface HumintProfile {
  id: string;
  codename: string;
  realName: string;
  photo: string;
  nationality: string;
  flag: string;
  organization: string;
  role: string;
  threatLevel: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  status: "ACTIVE" | "DETAINED" | "ELIMINATED" | "UNKNOWN" | "DEFECTED";
  location: { city: string; country: string; lat: number; lng: number };
  contacts: string[]; // IDs of connected profiles
  intel: string;
  lastSeen: string;
  tags: string[];
  phone?: string;
  email?: string;
  aliases: string[];
}

// === DONNÉES SIMULÉES ===
const PROFILES: HumintProfile[] = [
  {
    id: "hum-001", codename: "SHADOW WOLF", realName: "Hassan Nasrallah (Successeur)", photo: "🎭",
    nationality: "Libanais", flag: "🇱🇧", organization: "Hezbollah", role: "Secrétaire Général Adjoint",
    threatLevel: "CRITICAL", status: "ACTIVE",
    location: { city: "Dahieh, Beyrouth", country: "Liban", lat: 33.85, lng: 35.50 },
    contacts: ["hum-002", "hum-003", "hum-006"],
    intel: "Successeur présumé à la tête du Hezbollah. Maintient des contacts directs avec le CGRI. Responsable des opérations militaires au Sud-Liban. Déplacements fréquents via réseau de tunnels.",
    lastSeen: "2026-03-10", tags: ["Hezbollah", "CGRI", "Missiles", "Tunnels"],
    aliases: ["Abu Hassan", "Le Loup"], phone: "+961-XXX-XXXX", email: "N/A"
  },
  {
    id: "hum-002", codename: "IRON FIST", realName: "Esmail Qaani", photo: "🎖️",
    nationality: "Iranien", flag: "🇮🇷", organization: "CGRI - Force Quds", role: "Commandant Force Quds",
    threatLevel: "CRITICAL", status: "ACTIVE",
    location: { city: "Téhéran", country: "Iran", lat: 35.69, lng: 51.39 },
    contacts: ["hum-001", "hum-003", "hum-004", "hum-005"],
    intel: "Commandant de la Force Quds depuis 2020. Coordonne les opérations de l'Axe de Résistance. Voyages fréquents à Bagdad, Damas et Beyrouth. Cible prioritaire du Mossad.",
    lastSeen: "2026-03-09", tags: ["CGRI", "Force Quds", "Iran", "Proxy"],
    aliases: ["Le Fantôme", "Qaani"], phone: "N/A", email: "N/A"
  },
  {
    id: "hum-003", codename: "DESERT HAWK", realName: "Mohammed Al-Jolani", photo: "⚔️",
    nationality: "Syrien", flag: "🇸🇾", organization: "HTS (Hayat Tahrir al-Sham)", role: "Leader",
    threatLevel: "HIGH", status: "ACTIVE",
    location: { city: "Idlib", country: "Syrie", lat: 35.93, lng: 36.63 },
    contacts: ["hum-007"],
    intel: "Leader de HTS, contrôle la province d'Idlib. Tentative de repositionnement politique. Anciennement lié à Al-Qaïda (Jabhat al-Nusra). Relations complexes avec la Turquie.",
    lastSeen: "2026-03-08", tags: ["HTS", "Idlib", "Syrie", "Terrorisme"],
    aliases: ["Abu Mohammed", "Al-Jolani"], phone: "N/A", email: "N/A"
  },
  {
    id: "hum-004", codename: "RED SCORPION", realName: "Abdul Malik al-Houthi", photo: "🦂",
    nationality: "Yéménite", flag: "🇾🇪", organization: "Ansar Allah (Houthis)", role: "Leader suprême",
    threatLevel: "HIGH", status: "ACTIVE",
    location: { city: "Sanaa", country: "Yémen", lat: 15.35, lng: 44.21 },
    contacts: ["hum-002", "hum-005"],
    intel: "Leader des Houthis. Responsable des attaques en Mer Rouge contre le trafic maritime. Reçoit armes et formation du CGRI. Contrôle le nord du Yémen. Missiles balistiques et drones contre l'Arabie Saoudite.",
    lastSeen: "2026-03-10", tags: ["Houthis", "Mer Rouge", "Iran", "Missiles"],
    aliases: ["Sayyed Abdul Malik"], phone: "N/A", email: "N/A"
  },
  {
    id: "hum-005", codename: "PHANTOM", realName: "Abu Fadak al-Muhammadawi", photo: "👤",
    nationality: "Irakien", flag: "🇮🇶", organization: "PMF / Kata'ib Hezbollah", role: "Chef des opérations",
    threatLevel: "HIGH", status: "ACTIVE",
    location: { city: "Bagdad", country: "Irak", lat: 33.31, lng: 44.37 },
    contacts: ["hum-002", "hum-004"],
    intel: "Commande les milices pro-iraniennes en Irak. Responsable des attaques contre les bases US. Coordination directe avec la Force Quds. Réseau logistique Iran-Irak-Syrie.",
    lastSeen: "2026-03-09", tags: ["PMF", "Irak", "Iran", "Milices"],
    aliases: ["Abu Fadak"], phone: "N/A", email: "N/A"
  },
  {
    id: "hum-006", codename: "GHOST HAND", realName: "Yahya Sinwar (Successeur)", photo: "💀",
    nationality: "Palestinien", flag: "🇵🇸", organization: "Hamas — Brigades Qassam", role: "Chef militaire Gaza",
    threatLevel: "CRITICAL", status: "UNKNOWN",
    location: { city: "Gaza (souterrain)", country: "Palestine", lat: 31.50, lng: 34.47 },
    contacts: ["hum-001", "hum-002"],
    intel: "Nouveau chef militaire du Hamas à Gaza. Opère depuis le réseau de tunnels. Responsable de la stratégie de guérilla urbaine. Contact avec le Hezbollah et le CGRI pour approvisionnement en armes.",
    lastSeen: "2026-03-05", tags: ["Hamas", "Gaza", "Tunnels", "Qassam"],
    aliases: ["Le Fantôme de Gaza"], phone: "N/A", email: "N/A"
  },
  {
    id: "hum-007", codename: "GREY FOX", realName: "Ali Khamenei (Bureau)", photo: "🕌",
    nationality: "Iranien", flag: "🇮🇷", organization: "Guide Suprême — Bureau", role: "Conseiller militaire",
    threatLevel: "CRITICAL", status: "ACTIVE",
    location: { city: "Téhéran", country: "Iran", lat: 35.70, lng: 51.42 },
    contacts: ["hum-002", "hum-004", "hum-005"],
    intel: "Membre du cercle restreint du Guide Suprême. Supervise la doctrine stratégique de l'Axe de Résistance. Autorise les opérations majeures. Lien entre le pouvoir politique et le CGRI.",
    lastSeen: "2026-03-10", tags: ["Iran", "Guide Suprême", "Stratégie", "CGRI"],
    aliases: ["N/A"], phone: "N/A", email: "N/A"
  },
  {
    id: "hum-008", codename: "VIPER", realName: "Agent Inconnu", photo: "🐍",
    nationality: "Inconnu", flag: "🏴", organization: "Cellule dormante — Europe", role: "Coordinateur logistique",
    threatLevel: "MODERATE", status: "ACTIVE",
    location: { city: "Berlin", country: "Allemagne", lat: 52.52, lng: 13.41 },
    contacts: ["hum-002"],
    intel: "Cellule dormante identifiée en Europe. Coordination logistique pour le CGRI. Surveillance des dissidents iraniens en exil. Possible planification d'opérations clandestines.",
    lastSeen: "2026-03-07", tags: ["Europe", "CGRI", "Cellule dormante", "Espionnage"],
    aliases: ["Le Serpent"], phone: "+49-XXX-XXXX", email: "N/A"
  },
  {
    id: "hum-009", codename: "BLUE EAGLE", realName: "Informateur Allié", photo: "🦅",
    nationality: "Jordanien", flag: "🇯🇴", organization: "GID (Renseignement Jordanien)", role: "Agent de liaison",
    threatLevel: "LOW", status: "ACTIVE",
    location: { city: "Amman", country: "Jordanie", lat: 31.95, lng: 35.93 },
    contacts: ["hum-007"],
    intel: "Agent de liaison avec les services alliés. Fournit du renseignement sur les mouvements à la frontière syro-jordanienne. Source fiable, coopération active avec le Mossad et la CIA.",
    lastSeen: "2026-03-10", tags: ["Jordanie", "GID", "Liaison", "Allié"],
    aliases: ["Eagle"], phone: "+962-XXX-XXXX", email: "N/A"
  },
  {
    id: "hum-010", codename: "BLACK MAMBA", realName: "Opérateur Cyber CGRI", photo: "💻",
    nationality: "Iranien", flag: "🇮🇷", organization: "CGRI — Cyber Command", role: "Chef Cyber Offensif",
    threatLevel: "HIGH", status: "ACTIVE",
    location: { city: "Isfahan", country: "Iran", lat: 32.65, lng: 51.68 },
    contacts: ["hum-002", "hum-007"],
    intel: "Responsable des opérations cyber offensives du CGRI. Attaques contre infrastructures critiques israéliennes et saoudiennes. Utilise des APT (Charming Kitten, MuddyWater). Formation reçue en Russie.",
    lastSeen: "2026-03-09", tags: ["Cyber", "CGRI", "APT", "Iran"],
    aliases: ["Mamba", "CyberQods"], phone: "N/A", email: "N/A"
  },
];

const THREAT_COLORS: Record<string, string> = { CRITICAL: "#ef4444", HIGH: "#f97316", MODERATE: "#eab308", LOW: "#22c55e" };
const STATUS_COLORS: Record<string, string> = { ACTIVE: "#22c55e", DETAINED: "#f97316", ELIMINATED: "#ef4444", UNKNOWN: "#6b7280", DEFECTED: "#8b5cf6" };

export default function HumintDatabase() {
  const [selectedProfile, setSelectedProfile] = useState<HumintProfile>(PROFILES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterThreat, setFilterThreat] = useState<string>("ALL");
  const [showNetwork, setShowNetwork] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const filteredProfiles = useMemo(() => {
    return PROFILES.filter(p => {
      const matchSearch = !searchQuery || p.codename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.realName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchThreat = filterThreat === "ALL" || p.threatLevel === filterThreat;
      return matchSearch && matchThreat;
    });
  }, [searchQuery, filterThreat]);

  // Draw network graph
  useEffect(() => {
    if (!showNetwork || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width = canvas.parentElement?.clientWidth || 800;
    const h = canvas.height = canvas.parentElement?.clientHeight || 500;
    ctx.clearRect(0, 0, w, h);

    // Position nodes in a circle
    const cx = w / 2, cy = h / 2, radius = Math.min(w, h) * 0.35;
    const positions: Record<string, { x: number; y: number }> = {};
    PROFILES.forEach((p, i) => {
      const angle = (i / PROFILES.length) * Math.PI * 2 - Math.PI / 2;
      positions[p.id] = { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
    });

    // Draw connections
    PROFILES.forEach(p => {
      p.contacts.forEach(cid => {
        const from = positions[p.id];
        const to = positions[cid];
        if (from && to) {
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          const isSelected = p.id === selectedProfile.id || cid === selectedProfile.id;
          ctx.strokeStyle = isSelected ? "#00a8ff80" : "#ffffff10";
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.stroke();
        }
      });
    });

    // Draw nodes
    PROFILES.forEach(p => {
      const pos = positions[p.id];
      const isSelected = p.id === selectedProfile.id;
      const isConnected = selectedProfile.contacts.includes(p.id) || p.contacts.includes(selectedProfile.id);
      const nodeRadius = isSelected ? 24 : 18;

      // Glow
      if (isSelected || isConnected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeRadius + 6, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(pos.x, pos.y, nodeRadius, pos.x, pos.y, nodeRadius + 6);
        grad.addColorStop(0, isSelected ? "#00a8ff40" : "#ffffff10");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? "#0a1628" : "#070d1a";
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#00a8ff" : isConnected ? "#00a8ff50" : THREAT_COLORS[p.threatLevel] + "40";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Emoji
      ctx.font = `${isSelected ? 20 : 14}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.photo, pos.x, pos.y);

      // Label
      ctx.font = `bold ${isSelected ? 10 : 8}px Rajdhani, sans-serif`;
      ctx.fillStyle = isSelected ? "#00a8ff" : "#ffffff60";
      ctx.fillText(p.codename, pos.x, pos.y + nodeRadius + 12);

      // Status dot
      ctx.beginPath();
      ctx.arc(pos.x + nodeRadius - 4, pos.y - nodeRadius + 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = STATUS_COLORS[p.status];
      ctx.fill();
    });
  }, [showNetwork, selectedProfile]);

  const connectedProfiles = PROFILES.filter(p => selectedProfile.contacts.includes(p.id));

  const exportProfiles = () => {
    const csv = "Codename,Real Name,Organization,Role,Threat,Status,Location,Last Seen\n" +
      PROFILES.map(p => `${p.codename},${p.realName},${p.organization},${p.role},${p.threatLevel},${p.status},"${p.location.city}, ${p.location.country}",${p.lastSeen}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "humint-profiles.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <Users size={16} className="text-purple-400" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">HUMINT Database</h1>
          <span className="text-[9px] text-white/20 font-mono">{PROFILES.length} PROFILES</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNetwork(!showNetwork)}
            className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${showNetwork ? "bg-purple-500/15 text-purple-400 border border-purple-500/20" : "bg-white/[0.04] border border-white/[0.06] text-white/30 hover:text-white/50"}`}>
            <Network size={11} /> NETWORK
          </button>
          <button onClick={exportProfiles} className="px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[9px] text-white/30 hover:text-[#00a8ff] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5">
            <Download size={11} /> EXPORT
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Profile List */}
        <div className="w-72 shrink-0 border-r border-white/[0.06] flex flex-col bg-[#070d1a]/40">
          {/* Search */}
          <div className="p-3 border-b border-white/[0.06] space-y-2">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search profiles..."
                className="w-full bg-black/30 border border-white/[0.06] rounded-lg pl-8 pr-3 py-2 text-[11px] text-white placeholder-white/15 outline-none focus:border-[#00a8ff]/20 transition-all" />
            </div>
            <div className="flex gap-1">
              {["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"].map(t => (
                <button key={t} onClick={() => setFilterThreat(t)}
                  className={`px-2 py-1 rounded text-[7px] font-bold uppercase tracking-widest transition-all ${filterThreat === t ? "bg-white/[0.08] text-white/60" : "text-white/20 hover:text-white/40"}`}
                  style={filterThreat === t && t !== "ALL" ? { color: THREAT_COLORS[t] } : {}}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Profile List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredProfiles.map(p => (
              <button key={p.id} onClick={() => setSelectedProfile(p)}
                className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-all text-left ${selectedProfile.id === p.id ? "bg-white/[0.06] border border-white/[0.08]" : "border border-transparent hover:bg-white/[0.03]"}`}>
                <span className="text-xl">{p.photo}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-white/70 truncate">{p.codename}</div>
                  <div className="text-[8px] text-white/25 truncate">{p.organization}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: STATUS_COLORS[p.status] }} />
                    <span className="text-[7px] uppercase tracking-widest" style={{ color: STATUS_COLORS[p.status] }}>{p.status}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: THREAT_COLORS[p.threatLevel] }}>{p.threatLevel}</span>
                  <span className="text-[7px] text-white/15">{p.flag}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Profile Detail or Network */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {showNetwork ? (
              <motion.div key="network" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full cursor-crosshair"
                  onClick={(e) => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const x = e.clientX - rect.left, y = e.clientY - rect.top;
                    const w = rect.width, h = rect.height;
                    const cx = w / 2, cy = h / 2, radius = Math.min(w, h) * 0.35;
                    PROFILES.forEach((p, i) => {
                      const angle = (i / PROFILES.length) * Math.PI * 2 - Math.PI / 2;
                      const px = cx + Math.cos(angle) * radius, py = cy + Math.sin(angle) * radius;
                      if (Math.sqrt((x - px) ** 2 + (y - py) ** 2) < 24) setSelectedProfile(p);
                    });
                  }}
                />
                <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/[0.06]">
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">LEGEND</div>
                  <div className="space-y-1">
                    {Object.entries(STATUS_COLORS).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v }} />
                        <span className="text-[8px] text-white/40">{k}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Profile Header */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-center text-3xl">{selectedProfile.photo}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="font-[Rajdhani] font-bold text-xl text-white/90">{selectedProfile.codename}</h2>
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest" style={{ color: THREAT_COLORS[selectedProfile.threatLevel], backgroundColor: THREAT_COLORS[selectedProfile.threatLevel] + "15" }}>{selectedProfile.threatLevel}</span>
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest" style={{ color: STATUS_COLORS[selectedProfile.status], backgroundColor: STATUS_COLORS[selectedProfile.status] + "15" }}>{selectedProfile.status}</span>
                    </div>
                    <div className="text-[12px] text-white/50 mt-0.5">{selectedProfile.realName}</div>
                    <div className="text-[10px] text-white/30">{selectedProfile.flag} {selectedProfile.organization} — {selectedProfile.role}</div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-1"><MapPin size={11} className="text-[#00a8ff]" /><span className="text-[8px] text-white/25 uppercase tracking-widest">Location</span></div>
                    <div className="text-[11px] text-white/60">{selectedProfile.location.city}</div>
                    <div className="text-[9px] text-white/25 font-mono">{selectedProfile.location.lat.toFixed(3)}, {selectedProfile.location.lng.toFixed(3)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-1"><Eye size={11} className="text-amber-400" /><span className="text-[8px] text-white/25 uppercase tracking-widest">Last Seen</span></div>
                    <div className="text-[11px] text-white/60">{selectedProfile.lastSeen}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-1"><Link2 size={11} className="text-purple-400" /><span className="text-[8px] text-white/25 uppercase tracking-widest">Connections</span></div>
                    <div className="text-xl font-bold text-white/80 font-[Rajdhani]">{selectedProfile.contacts.length}</div>
                  </div>
                </div>

                {/* Aliases */}
                <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                  <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-2">ALIASES</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfile.aliases.map((a, i) => (
                      <span key={i} className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[9px] text-white/40">{a}</span>
                    ))}
                  </div>
                </div>

                {/* Intel Summary */}
                <div className="p-4 rounded-xl bg-[#00a8ff]/[0.03] border border-[#00a8ff]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={12} className="text-[#00a8ff]" />
                    <span className="text-[9px] font-bold text-[#00a8ff]/60 uppercase tracking-widest">Intelligence Summary</span>
                  </div>
                  <div className="text-[12px] text-white/60 leading-relaxed">{selectedProfile.intel}</div>
                </div>

                {/* Tags */}
                <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                  <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-2">TAGS</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfile.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/15 text-[9px] text-purple-400/70">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Connected Profiles */}
                {connectedProfiles.length > 0 && (
                  <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                    <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-2">CONNECTED PROFILES ({connectedProfiles.length})</div>
                    <div className="space-y-1.5">
                      {connectedProfiles.map(cp => (
                        <button key={cp.id} onClick={() => setSelectedProfile(cp)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:border-white/[0.08] transition-all text-left">
                          <span className="text-lg">{cp.photo}</span>
                          <div className="flex-1">
                            <div className="text-[10px] font-bold text-white/60">{cp.codename}</div>
                            <div className="text-[8px] text-white/25">{cp.organization}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: THREAT_COLORS[cp.threatLevel] }} />
                            <span className="text-[7px] font-bold uppercase" style={{ color: THREAT_COLORS[cp.threatLevel] }}>{cp.threatLevel}</span>
                          </div>
                          <ChevronRight size={12} className="text-white/15" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-1"><Phone size={11} className="text-white/25" /><span className="text-[8px] text-white/20 uppercase tracking-widest">Phone</span></div>
                    <div className="text-[11px] text-white/40 font-mono">{selectedProfile.phone || "N/A"}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-1"><Mail size={11} className="text-white/25" /><span className="text-[8px] text-white/20 uppercase tracking-widest">Email</span></div>
                    <div className="text-[11px] text-white/40 font-mono">{selectedProfile.email || "N/A"}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
