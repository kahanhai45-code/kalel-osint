import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, Map, MessageSquare, BarChart3, Menu, X, 
  Code2, Radar, Sparkles, Network, Shield, ExternalLink 
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663403852575/Zap37TepGubKDjY5vsorkD/kalel-logo_292402f4.jpg";

const NAV_LINKS = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Carte Intel", href: "/map", icon: Map },
  { label: "KalEl Agent", href: "/chat", icon: MessageSquare },
  { label: "Intel Core", href: "/intel-core", icon: Network },
  { label: "Eye of Kal-El", href: "/eye", icon: Radar },
  { label: "Camera Forge", href: "/camera-forge", icon: Sparkles },
  { label: "Code Forge", href: "/forge", icon: Code2 },
];

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[2000] transition-all duration-500 ${scrolled || location !== "/" ? "bg-[#050a14]/95 backdrop-blur-xl border-b border-[#00a8ff]/20 shadow-lg shadow-[#00a8ff]/10" : "bg-transparent"}`}>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00a8ff] to-[#0055ff] flex items-center justify-center shadow-[0_0_15px_rgba(0,168,255,0.4)]">
            <Shield size={18} className="text-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-[Rajdhani] font-bold text-base text-white tracking-wider">KAL-EL</span>
            <span className="font-[Rajdhani] text-[#00a8ff] text-[10px] tracking-widest">OSINT</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all rounded-lg ${
                location === item.href
                  ? "text-[#00a8ff] bg-[#00a8ff]/10 border border-[#00a8ff]/20"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon size={14} className={location === item.href ? "text-[#00a8ff]" : "text-white/20"} />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">System Live</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-white/40 hover:text-white transition-colors">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#050a14]/98 backdrop-blur-xl border-b border-[#00a8ff]/10 px-4 pb-4 overflow-y-auto max-h-[80vh]">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 text-xs font-bold tracking-widest uppercase transition-all rounded-lg mb-1 ${
                location === item.href ? "text-[#00a8ff] bg-[#00a8ff]/10 border border-[#00a8ff]/20" : "text-white/40"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
