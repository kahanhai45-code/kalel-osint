import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Map, MessageSquare, Code2, Radar, Network,
  Shield, ChevronLeft, ChevronRight, Activity, Globe
} from "lucide-react";
import { useI18n } from "../lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface NavItem {
  labelKey: string;
  descKey: string;
  href: string;
  icon: typeof LayoutDashboard;
  highlight?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard", descKey: "nav.dashboard.desc", href: "/", icon: LayoutDashboard },
  { labelKey: "nav.map", descKey: "nav.map.desc", href: "/map", icon: Map },
  { labelKey: "nav.middleeast", descKey: "nav.middleeast.desc", href: "/middle-east", icon: Globe, highlight: true },
  { labelKey: "nav.chat", descKey: "nav.chat.desc", href: "/chat", icon: MessageSquare },
  { labelKey: "nav.intelcore", descKey: "nav.intelcore.desc", href: "/intel-core", icon: Network },
  { labelKey: "nav.eye", descKey: "nav.eye.desc", href: "/eye", icon: Radar },
  { labelKey: "nav.forge", descKey: "nav.forge.desc", href: "/forge", icon: Code2 },
];

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
            <div className="font-[Rajdhani] text-[10px] text-[#00a8ff] tracking-[0.2em] leading-none mt-0.5">OSINT SYSTEM</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          const isHighlight = item.highlight;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive
                    ? isHighlight
                      ? "bg-red-500/10 text-red-400 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.15)]"
                      : "bg-[#00a8ff]/10 text-[#00a8ff] shadow-[inset_0_0_0_1px_rgba(0,168,255,0.15)]"
                    : isHighlight
                      ? "text-red-400/50 hover:text-red-400/80 hover:bg-red-500/[0.05]"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
              >
                <item.icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? isHighlight ? "text-red-400" : "text-[#00a8ff]"
                      : isHighlight ? "text-red-400/40 group-hover:text-red-400/60" : "text-white/30 group-hover:text-white/50"
                  }`}
                />
                {!collapsed && (
                  <div className="overflow-hidden">
                    <div className={`text-xs font-semibold tracking-wide leading-none ${
                      isActive ? (isHighlight ? "text-red-400" : "text-[#00a8ff]") : ""
                    }`}>
                      {t(item.labelKey)}
                    </div>
                    <div className={`text-[9px] mt-1 leading-none truncate ${isHighlight ? "text-red-400/20" : "text-white/20"}`}>{t(item.descKey)}</div>
                  </div>
                )}
                {isActive && (
                  <div className={`${isRtl ? "mr-auto" : "ml-auto"} w-1.5 h-1.5 rounded-full shrink-0 ${
                    isHighlight ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" : "bg-[#00a8ff] shadow-[0_0_6px_rgba(0,168,255,0.6)]"
                  }`} />
                )}
              </div>
            </Link>
          );
        })}
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
