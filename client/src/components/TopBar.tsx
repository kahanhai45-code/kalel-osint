import { useState, useEffect } from "react";
import { Clock, Wifi, WifiOff, Download, FileText } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { useI18n } from "../lib/i18n";

export function TopBar() {
  const [time, setTime] = useState(new Date());
  const [online, setOnline] = useState(navigator.onLine);
  const { t } = useI18n();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const exportReport = () => {
    const report = {
      system: "Kal-El OSINT System",
      timestamp: new Date().toISOString(),
      status: "OPERATIONAL",
      threatLevel: "MODERATE",
      activeModules: ["Dashboard", "Intel Map", "Middle East Analysis", "Cyber Threats", "SIGINT", "HUMINT", "Satellites", "Maritime", "Agent Chat", "Intel Core", "Eye of Kal-El", "Code Forge", "Reports"],
      connectors: ["ip-api.com", "Shodan InternetDB", "OpenSky Network", "CVE CIRCL", "NIST NVD", "crt.sh", "RIPE NCC", "OpenRouter AI"],
      version: "3.5.0",
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kalel-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-8 shrink-0 flex items-center justify-end gap-3 px-4 bg-[#050a14]/80 border-b border-white/[0.03]">
      {/* Status */}
      <div className="flex items-center gap-1.5">
        {online ? (
          <Wifi size={10} className="text-emerald-500" />
        ) : (
          <WifiOff size={10} className="text-red-500" />
        )}
        <span className="text-[8px] font-mono text-white/20">{online ? "CONNECTED" : "OFFLINE"}</span>
      </div>

      <div className="w-px h-3 bg-white/[0.06]" />

      {/* Export */}
      <button
        onClick={exportReport}
        className="flex items-center gap-1 text-white/20 hover:text-white/40 transition-colors"
        title="Export System Report"
      >
        <Download size={10} />
        <span className="text-[8px] font-bold uppercase tracking-widest">Report</span>
      </button>

      <div className="w-px h-3 bg-white/[0.06]" />

      {/* Notifications */}
      <NotificationCenter />

      <div className="w-px h-3 bg-white/[0.06]" />

      {/* Clock */}
      <div className="flex items-center gap-1.5">
        <Clock size={10} className="text-white/15" />
        <span className="text-[9px] font-mono text-white/25">
          {time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} UTC
        </span>
      </div>

      <div className="w-px h-3 bg-white/[0.06]" />

      {/* Version */}
      <span className="text-[8px] font-mono text-white/10">v3.0.0</span>
    </div>
  );
}
