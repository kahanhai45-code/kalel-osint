import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Map, MessageSquare, Code2, Radar, Network,
  Shield, ChevronLeft, ChevronRight, Activity, Globe, Radio, Zap,
  Users, Satellite, Ship, FileText, Settings
} from "lucide-react";
import { useI18n } from "../lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface NavItem {
  labelKey: string;
  descKey: string;
  href: string;
  icon: typeof LayoutDashboard;
  highlight?: boolean;
  accent?: string;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: "nav.section.command",
    items: [
      { labelKey: "nav.dashboard", descKey: "nav.dashboard.desc", href: "/", icon: LayoutDashboard },
      { labelKey: "nav.map", descKey: "nav.map.desc", href: "/map", icon: Map },
    ],
  },
  {
    titleKey: "nav.section.intel",
    items: [
      { labelKey: "nav.middleeast", descKey: "nav.middleeast.desc", href: "/middle-east", icon: Globe, highlight: true },
      { labelKey: "nav.cyber", descKey: "nav.cyber.desc", href: "/cyber", icon: Shield, accent: "red" },
      { labelKey: "nav.sigint", descKey: "nav.sigint.desc", href: "/sigint", icon: Radio, accent: "emerald" },
      { labelKey: "nav.humint", descKey: "nav.humint.desc", href: "/humint", icon: Users, accent: "purple" },
    ],
  },
  {
    titleKey: "nav.section.tracking",
    items: [
      { labelKey: "nav.satellites", descKey: "nav.satellites.desc", href: "/satellites", icon: Satellite, accent: "cyan" },
      { labelKey: "nav.maritime", descKey: "nav.maritime.desc", href: "/maritime", icon: Ship, accent: "blue" },
    ],
  },
  {
    titleKey: "nav.section.tools",
    items: [
      { labelKey: "nav.chat", descKey: "nav.chat.desc", href: "/chat", icon: MessageSquare },
      { labelKey: "nav.intelcore", descKey: "nav.intelcore.desc", href: "/intel-core", icon: Network },
      { labelKey: "nav.eye", descKey: "nav.eye.desc", href: "/eye", icon: Radar },
      { labelKey: "nav.forge", descKey: "nav.forge.desc", href: "/forge", icon: Code2 },
      { labelKey: "nav.reports", descKey: "nav.reports.desc", href: "/reports", icon: FileText, accent: "amber" },
    ],
  },
  {
    titleKey: "nav.section.system",
    items: [
      { labelKey: "nav.settings", descKey: "nav.settings.desc", href: "/settings", icon: Settings },
    ],
  },
];

const ACCENT_MAP: Record<string, { active: string; inactive: string; icon: string; iconInactive: string; dot: string }> = {
  red: { active: "bg-red-500/10 text-red-400 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.15)]", inactive: "text-red-400/40 hover:text-red-400/70 hover:bg-red-500/[0.05]", icon: "text-red-400", iconInactive: "text-red-400/30 group-hover:text-red-400/50", dot: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" },
  emerald: { active: "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]", inactive: "text-emerald-400/40 hover:text-emerald-400/70 hover:bg-emerald-500/[0.05]", icon: "text-emerald-400", iconInactive: "text-emerald-400/30 group-hover:text-emerald-400/50", dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" },
  purple: { active: "bg-purple-500/10 text-purple-400 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.15)]", inactive: "text-purple-400/40 hover:text-purple-400/70 hover:bg-purple-500/[0.05]", icon: "text-purple-400", iconInactive: "text-purple-400/30 group-hover:text-purple-400/50", dot: "bg-purple-500 shadow-[0_0_6px_rgba(139,92,246,0.6)]" },
  cyan: { active: "bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(6,182,212,0.15)]", inactive: "text-cyan-400/40 hover:text-cyan-400/70 hover:bg-cyan-500/[0.05]", icon: "text-cyan-400", iconInactive: "text-cyan-400/30 group-hover:text-cyan-400/50", dot: "bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]" },
  blue: { active: "bg-blue-500/10 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.15)]", inactive: "text-blue-400/40 hover:text-blue-400/70 hover:bg-blue-500/[0.05]", icon: "text-blue-400", iconInactive: "text-blue-400/30 group-hover:text-blue-400/50", dot: "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" },
  amber: { active: "bg-amber-500/10 text-amber-400 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.15)]", inactive: "text-amber-400/40 hover:text-amber-400/70 hover:bg-amber-500/[0.05]", icon: "text-amber-400", iconInactive: "text-amber-400/30 group-hover:text-amber-400/50", dot: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" },
};

const DEFAULT_ACCENT = { active: "bg-[#00a8ff]/10 text-[#00a8ff] shadow-[inset_0_0_0_1px_rgba(0,168,255,0.15)]", inactive: "text-white/40 hover:text-white/70 hover:bg-white/[0.03]", icon: "text-[#00a8ff]", iconInactive: "text-white/30 group-hover:text-white/50", dot: "bg-[#00a8ff] shadow-[0_0_6px_rgba(0,168,255,0.6)]" };

const HIGHLIGHT_ACCENT = { active: "bg-red-500/10 text-red-400 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.15)]", inactive: "text-red-400/50 hover:text-red-400/80 hover:bg-red-500/[0.05]", icon: "text-red-400", iconInactive: "text-red-400/40 group-hover:text-red-400/60", dot: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" };

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { t, dir } = useI18n();
  const isRtl = dir() === "rtl";

  return (
    <aside
      className={`h-screen flex flex-col bg-[#070d1a] border-r border-white/[0.06] transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? "w-[68px]" : "w-[220px]"
      }`}
      dir={dir()}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/[0.06] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00a8ff] to-[#0060ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,100,255,0.3)] shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className={`${isRtl ? "mr-3" : "ml-3"} overflow-hidden`}>
            <div className="font-[Rajdhani] font-bold text-sm text-white tracking-wider leading-none">KAL-EL</div>
            <div className="font-[Rajdhani] text-[10px] text-[#00a8ff] tracking-[0.2em] leading-none mt-0.5">OSINT SYSTEM v3.0</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className="mb-2">
            {!collapsed && (
              <div className="px-3 py-1.5 text-[8px] font-bold text-white/15 uppercase tracking-[0.2em]">{t(section.titleKey)}</div>
            )}
            {collapsed && si > 0 && <div className="mx-3 my-1 border-t border-white/[0.04]" />}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location === item.href;
                const accentColor = item.accent ? (ACCENT_MAP[item.accent] || DEFAULT_ACCENT) : item.highlight ? HIGHLIGHT_ACCENT : DEFAULT_ACCENT;

                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${isActive ? accentColor.active : accentColor.inactive}`}>
                      <item.icon size={16} className={`shrink-0 transition-colors ${isActive ? accentColor.icon : accentColor.iconInactive}`} />
                      {!collapsed && (
                        <div className="overflow-hidden flex-1">
                          <div className={`text-[11px] font-semibold tracking-wide leading-none ${isActive ? accentColor.icon : ""}`}>{t(item.labelKey)}</div>
                          <div className="text-[8px] mt-0.5 leading-none truncate text-white/15">{t(item.descKey)}</div>
                        </div>
                      )}
                      {isActive && <div className={`${isRtl ? "mr-auto" : "ml-auto"} w-1.5 h-1.5 rounded-full shrink-0 ${accentColor.dot}`} />}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Language + Status + Collapse */}
      <div className="border-t border-white/[0.06] p-3 space-y-2 shrink-0">
        {!collapsed && (
          <>
            <div className="flex items-center justify-between">
              <LanguageSwitcher />
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-500/[0.07] border border-emerald-500/[0.12]">
              <Activity size={12} className="text-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">{t("sidebar.system_active")}</span>
            </div>
          </>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <LanguageSwitcher compact />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-1.5 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/[0.03] transition-all"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
