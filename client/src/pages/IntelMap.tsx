import { useState, useRef, useCallback, useEffect } from "react";
import { MapView } from "@/components/Map";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, Crosshair, Camera, RefreshCw, Loader2,
  MapPin, Search, X, Eye, Layers, Globe, Filter
} from "lucide-react";
import { useI18n } from "../lib/i18n";

interface Aircraft {
  icao24: string; callsign: string; country: string;
  lat: number; lng: number; altitude: number; velocity: number; heading: number; onGround: boolean;
}

interface IpResult {
  query: string; country: string; city: string; lat: number; lon: number; isp: string; org: string;
}

interface CameraFeed {
  id: string; name: string; lat: number; lng: number; url: string; embedUrl: string; type: "public" | "traffic" | "discovered"; region: string;
}

interface DiscoveredCamera {
  id: string; url?: string; ip: string; port: number; type: string; location?: string;
  lat: number; lng: number; lastSeen: string; source: string; status: "online" | "offline" | "checking";
}

const REAL_CAMERAS: CameraFeed[] = [
  // === MONDE ===
  { id: "cam1", name: "Times Square, NYC", lat: 40.758, lng: -73.9855, url: "https://www.youtube.com/watch?v=mRe-514tGMg", embedUrl: "https://www.youtube.com/embed/mRe-514tGMg?autoplay=1&mute=1&rel=0", type: "public", region: "Amériques" },
  { id: "cam2", name: "Venise, Italie", lat: 45.4343, lng: 12.3388, url: "https://www.youtube.com/watch?v=ph1vpnYIxJk", embedUrl: "https://www.youtube.com/embed/ph1vpnYIxJk?autoplay=1&mute=1&rel=0", type: "public", region: "Europe" },
  { id: "cam5", name: "Shibuya, Tokyo", lat: 35.6595, lng: 139.7004, url: "https://www.youtube.com/watch?v=HpdO5Kq3o8Y", embedUrl: "https://www.youtube.com/embed/HpdO5Kq3o8Y?autoplay=1&mute=1&rel=0", type: "public", region: "Asie" },
  { id: "cam6", name: "Paris, France", lat: 48.8584, lng: 2.2945, url: "https://www.youtube.com/watch?v=n_v-Y6U5Iu0", embedUrl: "https://www.youtube.com/embed/n_v-Y6U5Iu0?autoplay=1&mute=1&rel=0", type: "public", region: "Europe" },
  { id: "cam11", name: "Londres, UK", lat: 51.5074, lng: -0.1278, url: "https://www.youtube.com/watch?v=X8zLJlUspT8", embedUrl: "https://www.youtube.com/embed/X8zLJlUspT8?autoplay=1&mute=1&rel=0", type: "public", region: "Europe" },

  // === JÉRUSALEM (5 caméras par quartier) ===
  { id: "jer1", name: "Mur des Lamentations (Kotel)", lat: 31.7767, lng: 35.2345, url: "https://www.youtube.com/watch?v=77akujLn4k8", embedUrl: "https://www.youtube.com/embed/77akujLn4k8?autoplay=1&mute=1&rel=0", type: "public", region: "Jérusalem — Vieille Ville" },
  { id: "jer2", name: "Mont du Temple / Esplanade", lat: 31.7781, lng: 35.2360, url: "https://www.youtube.com/watch?v=Ji1K9ORRfkE", embedUrl: "https://www.youtube.com/embed/Ji1K9ORRfkE?autoplay=1&mute=1&rel=0", type: "public", region: "Jérusalem — Vieille Ville" },
  { id: "jer3", name: "Mont des Oliviers", lat: 31.7784, lng: 35.2442, url: "https://www.youtube.com/watch?v=X4ev27ijOW8", embedUrl: "https://www.youtube.com/embed/X4ev27ijOW8?autoplay=1&mute=1&rel=0", type: "public", region: "Jérusalem — Mont des Oliviers" },
  { id: "jer4", name: "Porte de Jaffa / Panorama", lat: 31.7740, lng: 35.2290, url: "https://www.youtube.com/watch?v=y4k2lXk1MBw", embedUrl: "https://www.youtube.com/embed/y4k2lXk1MBw?autoplay=1&mute=1&rel=0", type: "public", region: "Jérusalem — Porte de Jaffa" },
  { id: "jer5", name: "Centre-Ville / Ben Yehuda", lat: 31.7857, lng: 35.2107, url: "https://www.youtube.com/watch?v=gmtlJ_m2r5A", embedUrl: "https://www.youtube.com/embed/gmtlJ_m2r5A?autoplay=1&mute=1&rel=0", type: "public", region: "Jérusalem — Centre" },

  // === TÉHÉRAN (5 caméras par quartier) ===
  { id: "teh1", name: "Téhéran Centre — Skyline HD", lat: 35.6892, lng: 51.3890, url: "https://www.youtube.com/watch?v=-zGuR1qVKrU", embedUrl: "https://www.youtube.com/embed/-zGuR1qVKrU?autoplay=1&mute=1&rel=0", type: "public", region: "Téhéran — Centre" },
  { id: "teh2", name: "Téhéran Nord — Tajrish", lat: 35.7219, lng: 51.3347, url: "https://www.youtube.com/watch?v=3kxYJF9q608", embedUrl: "https://www.youtube.com/embed/3kxYJF9q608?autoplay=1&mute=1&rel=0", type: "public", region: "Téhéran — Tajrish" },
  { id: "teh3", name: "Place Azadi / Tour de la Liberté", lat: 35.6997, lng: 51.3380, url: "https://www.youtube.com/watch?v=QKEvNQYepb0", embedUrl: "https://www.youtube.com/embed/QKEvNQYepb0?autoplay=1&mute=1&rel=0", type: "public", region: "Téhéran — Azadi" },
  { id: "teh4", name: "Tour Milad / Nord-Ouest", lat: 35.7448, lng: 51.3753, url: "https://www.youtube.com/watch?v=4E-iFtUM2kk", embedUrl: "https://www.youtube.com/embed/4E-iFtUM2kk?autoplay=1&mute=1&rel=0", type: "public", region: "Téhéran — Milad" },
  { id: "teh5", name: "Grand Bazar / Sud", lat: 35.6726, lng: 51.4215, url: "https://www.youtube.com/watch?v=J6Yqm14BPSg", embedUrl: "https://www.youtube.com/embed/J6Yqm14BPSg?autoplay=1&mute=1&rel=0", type: "public", region: "Téhéran — Bazar" },

  // === BEYROUTH / LIBAN (5 caméras par quartier) ===
  { id: "bey1", name: "Beyrouth Skyline — Baabda", lat: 33.8938, lng: 35.5018, url: "https://www.youtube.com/watch?v=N3fiiEHqyp0", embedUrl: "https://www.youtube.com/embed/N3fiiEHqyp0?autoplay=1&mute=1&rel=0", type: "public", region: "Beyrouth — Baabda" },
  { id: "bey2", name: "Downtown Beyrouth", lat: 33.8969, lng: 35.5033, url: "https://www.youtube.com/watch?v=cO0Senzgzpc", embedUrl: "https://www.youtube.com/embed/cO0Senzgzpc?autoplay=1&mute=1&rel=0", type: "public", region: "Beyrouth — Centre" },
  { id: "bey3", name: "Banlieue Sud / Dahieh", lat: 33.8547, lng: 35.5107, url: "https://www.youtube.com/watch?v=ELmbr71d5V8", embedUrl: "https://www.youtube.com/embed/ELmbr71d5V8?autoplay=1&mute=1&rel=0", type: "public", region: "Beyrouth — Dahieh" },
  { id: "bey4", name: "Port de Beyrouth", lat: 33.9020, lng: 35.5180, url: "https://www.youtube.com/watch?v=e_wLnWHqhSs", embedUrl: "https://www.youtube.com/embed/e_wLnWHqhSs?autoplay=1&mute=1&rel=0", type: "public", region: "Beyrouth — Port" },
  { id: "bey5", name: "Hamra / Panoramique", lat: 33.8886, lng: 35.4955, url: "https://www.youtube.com/watch?v=ogpiatxBmas", embedUrl: "https://www.youtube.com/embed/ogpiatxBmas?autoplay=1&mute=1&rel=0", type: "public", region: "Beyrouth — Hamra" },

  // === IRAN — AUTRES VILLES (5 caméras) ===
  { id: "irn1", name: "Isfahan — Place Naqsh-e Jahan", lat: 32.6546, lng: 51.6680, url: "https://www.youtube.com/watch?v=-zGuR1qVKrU", embedUrl: "https://www.youtube.com/embed/-zGuR1qVKrU?autoplay=1&mute=1&rel=0&start=300", type: "public", region: "Iran — Isfahan" },
  { id: "irn2", name: "Shiraz — Centre-Ville", lat: 29.5918, lng: 52.5837, url: "https://www.youtube.com/watch?v=ecdMOs6aej0", embedUrl: "https://www.youtube.com/embed/ecdMOs6aej0?autoplay=1&mute=1&rel=0", type: "public", region: "Iran — Shiraz" },
  { id: "irn3", name: "Tabriz — Panorama", lat: 38.0800, lng: 46.2919, url: "https://www.youtube.com/watch?v=JboXN7CuKxc", embedUrl: "https://www.youtube.com/embed/JboXN7CuKxc?autoplay=1&mute=1&rel=0", type: "public", region: "Iran — Tabriz" },
  { id: "irn4", name: "Mashhad — Sanctuaire Imam Reza", lat: 36.2972, lng: 59.6067, url: "https://www.youtube.com/watch?v=63xiGIwUe4A", embedUrl: "https://www.youtube.com/embed/63xiGIwUe4A?autoplay=1&mute=1&rel=0", type: "public", region: "Iran — Mashhad" },
  { id: "irn5", name: "Bandar Abbas — Détroit d'Ormuz", lat: 27.1865, lng: 56.2808, url: "https://www.youtube.com/watch?v=nWg4mnENJsw", embedUrl: "https://www.youtube.com/embed/nWg4mnENJsw?autoplay=1&mute=1&rel=0", type: "public", region: "Iran — Bandar Abbas" },
];

export default function IntelMap() {
  const mapRef = useRef<L.Map | null>(null);
  const aircraftLayer = useRef<L.LayerGroup>(L.layerGroup());
  const cameraLayer = useRef<L.LayerGroup>(L.layerGroup());
  const discoveredCluster = useRef<L.MarkerClusterGroup | null>(null);
  const ipMarkerRef = useRef<L.Marker | null>(null);

  const [tab, setTab] = useState<"aircraft" | "ip" | "cameras">("aircraft");
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [ipInput, setIpInput] = useState("");
  const [ipResult, setIpResult] = useState<IpResult | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed | DiscoveredCamera | null>(null);
  const [discoveredCameras, setDiscoveredCameras] = useState<DiscoveredCamera[]>([]);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const { t } = useI18n();

  const regions = ["all", ...Array.from(new Set(REAL_CAMERAS.map(c => {
    const base = c.region.split(" \u2014 ")[0];
    return base;
  })))];

  const filteredCameras = regionFilter === "all" ? REAL_CAMERAS : REAL_CAMERAS.filter(c => c.region.startsWith(regionFilter));

  const zoomMiddleEast = () => {
    if (mapRef.current) mapRef.current.setView([31.5, 45.0], 5);
  };

  const loadDiscoveredCameras = useCallback(async () => {
    try {
      // Load from localStorage (set by Eye of Kal-El scanner)
      const stored = localStorage.getItem("dynamicCameras");
      if (stored) {
        const cameras: DiscoveredCamera[] = JSON.parse(stored);
        setDiscoveredCameras(cameras);
        if (mapRef.current) {
          if (discoveredCluster.current) mapRef.current.removeLayer(discoveredCluster.current);
          discoveredCluster.current = L.markerClusterGroup({ maxClusterRadius: 50 });
          cameras.forEach((cam) => {
            if (cam.lat && cam.lng) {
              const icon = L.divIcon({
                html: `<div style="color:#ef4444;filter:drop-shadow(0 0 4px currentColor)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.36-7.36l-1.42 1.42M7.05 16.95l-1.42 1.42m12.73 0l-1.42-1.42M7.05 7.05L5.63 5.63"/></svg></div>`,
                className: "discovered-cam", iconSize: [16, 16],
              });
              L.marker([cam.lat, cam.lng], { icon })
                .bindPopup(`<b>${cam.type}</b><br/>${cam.ip}:${cam.port}<br/>Status: ${cam.status}`)
                .on("click", () => setSelectedCamera(cam))
                .addTo(discoveredCluster.current!);
            }
          });
          mapRef.current.addLayer(discoveredCluster.current);
        }
      }
    } catch (e) { console.error(e); }
  }, []);

  const fetchAircraft = useCallback(async () => {
    if (!mapRef.current) return;
    setLoading(true);
    try {
      const b = mapRef.current.getBounds();
      const url = `https://opensky-network.org/api/states/all?lamin=${b.getSouth()}&lomin=${b.getWest()}&lamax=${b.getNorth()}&lomax=${b.getEast()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.states) {
        const parsed: Aircraft[] = data.states.slice(0, 80).map((s: any[]) => ({
          icao24: s[0], callsign: (s[1] || "").trim(), country: s[2],
          lat: s[6], lng: s[5], altitude: Math.round(s[7] || 0),
          velocity: Math.round((s[9] || 0) * 3.6), heading: s[10] || 0, onGround: s[8]
        })).filter((a: Aircraft) => a.lat && a.lng);
        setAircraft(parsed);
        aircraftLayer.current.clearLayers();
        parsed.forEach((a) => {
          const icon = L.divIcon({
            html: `<div style="transform:rotate(${a.heading}deg);color:${a.onGround ? "#f59e0b" : "#00ff88"};filter:drop-shadow(0 0 4px currentColor)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.5 3.2-2.3 2.3-2.2-.5c-.4-.1-.8.1-1 .4l-.2.3c-.2.3-.1.7.2.9l2.8 1.9 1.9 2.8c.2.3.6.4.9.2l.3-.2c.3-.2.5-.6.4-1l-.5-2.2 2.3-2.3 3.2 5.5c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg></div>`,
            className: "aircraft-icon", iconSize: [18, 18],
          });
          L.marker([a.lat, a.lng], { icon })
            .bindPopup(`<b>${a.callsign || a.icao24}</b><br/>${a.country}<br/>Alt: ${a.altitude}m | Spd: ${a.velocity}km/h`)
            .addTo(aircraftLayer.current);
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const lookupIp = useCallback(async () => {
    if (!ipInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://ipinfo.io/${ipInput.trim()}/json`);
      const data = await res.json();
      const [lat, lng] = (data.loc || "0,0").split(",").map(Number);
      const result = { query: data.ip, country: data.country, city: data.city, lat, lon: lng, isp: data.org, org: data.org };
      setIpResult(result);
      if (mapRef.current) {
        if (ipMarkerRef.current) mapRef.current.removeLayer(ipMarkerRef.current);
        const icon = L.divIcon({
          html: `<div style="color:#00a8ff;filter:drop-shadow(0 0 6px currentColor)"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg></div>`,
          className: "ip-marker", iconSize: [24, 24], iconAnchor: [12, 24],
        });
        ipMarkerRef.current = L.marker([lat, lng], { icon })
          .bindPopup(`<b>${data.ip}</b><br/>${data.city}, ${data.country}<br/>${data.org}`)
          .addTo(mapRef.current);
        mapRef.current.setView([lat, lng], 10);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [ipInput]);

  useEffect(() => {
    if (mapRef.current) {
      aircraftLayer.current.addTo(mapRef.current);
      cameraLayer.current.addTo(mapRef.current);
      cameraLayer.current.clearLayers();
      REAL_CAMERAS.forEach(cam => {
        const icon = L.divIcon({
          html: `<div style="color:#f59e0b;filter:drop-shadow(0 0 4px currentColor)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg></div>`,
          className: "camera-icon", iconSize: [16, 16],
        });
        L.marker([cam.lat, cam.lng], { icon }).on("click", () => setSelectedCamera(cam)).addTo(cameraLayer.current);
      });
      loadDiscoveredCameras();
    }
  }, [mapRef.current]);

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/80 backdrop-blur-md z-[1100]">
        <div className="flex items-center gap-3">
          <Globe size={16} className="text-[#00a8ff]" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">{t("map.title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={zoomMiddleEast} className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-all">
            M.E.
          </button>
          <div className="flex gap-1">
            {(["aircraft", "ip", "cameras"] as const).map(tb => (
              <button key={tb} onClick={() => setTab(tb)} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${tab === tb ? "bg-[#00a8ff]/15 text-[#00a8ff] border border-[#00a8ff]/20" : "text-white/30 hover:text-white/50 border border-transparent"}`}>
                {tb === "aircraft" ? t("map.aerial") : tb === "ip" ? t("map.ip_geoloc") : t("map.cameras")}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView className="absolute inset-0" onMapReady={m => { mapRef.current = m; }} />

        {/* Side Panel */}
        <div className="absolute left-3 top-3 bottom-3 w-72 bg-[#070d1a]/90 backdrop-blur-xl border border-white/[0.06] rounded-xl z-[1001] flex flex-col overflow-hidden shadow-2xl shadow-black/50">
          <div className="p-3 border-b border-white/[0.06]">
            {tab === "aircraft" && (
              <button onClick={fetchAircraft} disabled={loading} className="w-full py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500/15 transition-all">
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Plane size={13} />}
                {t("map.load_flights")}
              </button>
            )}
            {tab === "ip" && (
              <div className="flex gap-2">
                <input value={ipInput} onChange={e => setIpInput(e.target.value)} onKeyDown={e => e.key === "Enter" && lookupIp()} placeholder="Adresse IP..." className="flex-1 bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-[#00a8ff]/30 transition-all" />
                <button onClick={lookupIp} disabled={loading} className="px-3 rounded-lg bg-[#00a8ff]/15 text-[#00a8ff] border border-[#00a8ff]/20 hover:bg-[#00a8ff]/25 transition-all">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                </button>
              </div>
            )}
            {tab === "cameras" && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {REAL_CAMERAS.length + discoveredCameras.length} caméras
                </span>
                <button onClick={loadDiscoveredCameras} className="p-1.5 rounded-md bg-white/[0.04] text-white/30 hover:text-white/50 transition-all">
                  <RefreshCw size={12} />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {tab === "aircraft" && (
              <>
                {aircraft.length === 0 && !loading && (
                  <div className="text-center py-8 text-white/10 text-[10px] uppercase tracking-widest">Cliquez pour scanner</div>
                )}
                {aircraft.map((a, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] hover:border-emerald-500/20 transition-all cursor-pointer group" onClick={() => mapRef.current?.setView([a.lat, a.lng], 10)}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold text-emerald-400">{a.callsign || a.icao24}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 font-mono">{a.icao24}</span>
                    </div>
                    <div className="text-[9px] text-white/30">{a.country}</div>
                    <div className="flex gap-3 mt-1 text-[9px] text-white/20 font-mono">
                      <span>ALT {a.altitude}m</span>
                      <span>SPD {a.velocity}km/h</span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {tab === "ip" && ipResult && (
              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-2">
                <div className="text-sm font-bold text-[#00a8ff]">{ipResult.query}</div>
                <div className="flex items-center gap-2 text-[10px] text-white/50">
                  <MapPin size={11} className="text-[#00a8ff]" />
                  {ipResult.city}, {ipResult.country}
                </div>
                <div className="text-[10px] text-white/30">{ipResult.isp}</div>
                <div className="text-[9px] text-white/20 font-mono">
                  {ipResult.lat.toFixed(4)}, {ipResult.lon.toFixed(4)}
                </div>
              </div>
            )}

            {tab === "cameras" && (
              <>
                {/* Region Filter */}
                <div className="flex flex-wrap gap-1 px-1 pt-1 pb-2">
                  {regions.map(r => (
                    <button key={r} onClick={() => setRegionFilter(r)} className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest transition-all ${regionFilter === r ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "text-white/20 hover:text-white/40 border border-transparent"}`}>
                      {r === "all" ? t("map.all_regions") : r}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-1">{filteredCameras.length} {t("map.cameras")}</div>
                {filteredCameras.map(cam => (
                  <div key={cam.id} className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] hover:border-amber-500/20 transition-all cursor-pointer flex items-center gap-2.5 group" onClick={() => { setSelectedCamera(cam); mapRef.current?.setView([cam.lat, cam.lng], 12); }}>
                    <Camera size={14} className="text-amber-500/60 shrink-0" />
                    <div>
                      <div className="text-[10px] font-semibold text-white/60 group-hover:text-white/80 transition-colors">{cam.name}</div>
                      <div className="text-[8px] text-white/20 uppercase tracking-widest">{cam.region}</div>
                    </div>
                  </div>
                ))}
                {discoveredCameras.length > 0 && (
                  <>
                    <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-1 pt-3">Découvertes ({discoveredCameras.length})</div>
                    {discoveredCameras.slice(0, 50).map(cam => (
                      <div key={cam.id} className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] hover:border-red-500/20 transition-all cursor-pointer flex items-center gap-2.5" onClick={() => mapRef.current?.setView([cam.lat, cam.lng], 12)}>
                        <Eye size={14} className="text-red-500/60 shrink-0" />
                        <div>
                          <div className="text-[10px] font-mono text-white/50">{cam.ip}:{cam.port}</div>
                          <div className="text-[8px] text-white/20">{cam.type}</div>
                        </div>
                        <div className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 ${cam.status === "online" ? "bg-emerald-500" : "bg-red-500/50"}`} />
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Camera Preview */}
        <AnimatePresence>
          {selectedCamera && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute right-3 bottom-3 w-80 bg-[#070d1a]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-[1002]">
              <div className="p-2.5 flex justify-between items-center border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest truncate max-w-[200px]">
                    {"name" in selectedCamera ? selectedCamera.name : `${selectedCamera.ip}:${selectedCamera.port}`}
                  </span>
                </div>
                <button onClick={() => setSelectedCamera(null)} className="text-white/30 hover:text-white/60 transition-colors"><X size={14} /></button>
              </div>
              <div className="aspect-video bg-black">
                <iframe
                  src={"embedUrl" in selectedCamera ? selectedCamera.embedUrl : ""}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
              <div className="p-2 flex justify-between items-center text-[8px] font-mono text-white/20">
                <span>{selectedCamera.lat.toFixed(4)}, {selectedCamera.lng.toFixed(4)}</span>
                <span>LIVE</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
