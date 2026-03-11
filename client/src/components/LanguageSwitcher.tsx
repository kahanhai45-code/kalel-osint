import { useState } from "react";
import { useI18n, LANG_LABELS, LANG_FLAGS, type Lang } from "../lib/i18n";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const langs: Lang[] = ["en", "fr", "he"];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-white/50 hover:text-white/70"
      >
        <span className="text-sm">{LANG_FLAGS[lang]}</span>
        {!compact && <span className="text-[9px] font-bold uppercase tracking-widest">{lang.toUpperCase()}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 right-0 z-50 bg-[#0a1020] border border-white/[0.08] rounded-lg shadow-xl overflow-hidden min-w-[140px]">
            {langs.map(l => (
              <button
                key={l}
                onClick={() => { setLang(l); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all ${
                  lang === l ? "bg-[#00a8ff]/10 text-[#00a8ff]" : "text-white/50 hover:bg-white/[0.04] hover:text-white/70"
                }`}
              >
                <span className="text-sm">{LANG_FLAGS[l]}</span>
                <span className="text-[10px] font-semibold">{LANG_LABELS[l]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
