import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText, Download, Loader2, RefreshCw, Shield, Globe,
  AlertTriangle, Clock, Printer, Copy, CheckCircle, Zap
} from "lucide-react";

const OPENROUTER_KEY = "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";

const REPORT_TEMPLATES = [
  { id: "daily", name: "Daily Intelligence Brief", icon: "📋", desc: "Résumé quotidien des événements sécuritaires au Moyen-Orient", prompt: "Generate a comprehensive daily intelligence briefing for the Middle East region. Include: 1) Executive Summary 2) Key Events (last 24h) 3) Threat Assessment by country (Israel, Iran, Lebanon, Syria, Yemen, Iraq) 4) Military Movements 5) Cyber Threats 6) Maritime Security (Red Sea, Strait of Hormuz) 7) Diplomatic Developments 8) Forecast (next 48h). Use a professional military intelligence format. Be specific with dates, locations, and threat levels." },
  { id: "country", name: "Country Threat Assessment", icon: "🎯", desc: "Évaluation détaillée des menaces par pays", prompt: "Generate a detailed threat assessment report for Iran. Include: 1) Executive Summary 2) Current Threat Level and Justification 3) Military Capabilities (conventional, nuclear, cyber, proxy forces) 4) Recent Military Activities 5) Intelligence Indicators 6) Economic Pressure Points 7) Key Personnel and Decision Makers 8) Scenario Analysis (most likely, most dangerous, best case) 9) Recommendations. Use a professional intelligence format." },
  { id: "maritime", name: "Maritime Security Report", icon: "🚢", desc: "Rapport sur la sécurité maritime (Mer Rouge, Ormuz)", prompt: "Generate a maritime security intelligence report covering: 1) Executive Summary 2) Red Sea / Bab el-Mandeb threat assessment (Houthi attacks) 3) Strait of Hormuz situation (Iranian naval activity) 4) Eastern Mediterranean naval deployments 5) Recent incidents (attacks on shipping, interceptions) 6) Naval force disposition (US, UK, France, Iran, Russia) 7) Impact on global shipping and oil prices 8) Risk assessment for commercial vessels 9) Recommended routing. Professional maritime intelligence format." },
  { id: "cyber", name: "Cyber Threat Intelligence", icon: "💻", desc: "Rapport sur les cybermenaces au Moyen-Orient", prompt: "Generate a cyber threat intelligence report for the Middle East. Include: 1) Executive Summary 2) Active APT Groups (Charming Kitten, MuddyWater, OilRig, Lazarus) 3) Recent Cyber Attacks (targets, methods, attribution) 4) Critical Infrastructure Threats 5) Iranian Cyber Capabilities 6) Israeli Cyber Operations 7) Russian/Chinese cyber activity in the region 8) Indicators of Compromise (IOCs) 9) Defensive Recommendations. Professional CTI format." },
  { id: "nuclear", name: "Nuclear Proliferation Brief", icon: "☢️", desc: "Briefing sur la prolifération nucléaire iranienne", prompt: "Generate a nuclear proliferation intelligence brief on Iran. Include: 1) Executive Summary 2) Current Enrichment Status (levels, quantities, centrifuges) 3) IAEA Inspection Findings 4) Key Nuclear Facilities (Natanz, Fordow, Isfahan, Arak) 5) Breakout Timeline Assessment 6) Delivery Systems (ballistic missiles) 7) International Response (JCPOA status, sanctions) 8) Israeli Red Lines and Potential Military Options 9) Intelligence Gaps 10) Assessment and Forecast. Professional intelligence format." },
  { id: "humint", name: "HUMINT Network Analysis", icon: "🕵️", desc: "Analyse du réseau de renseignement humain", prompt: "Generate a HUMINT network analysis report on Iran's Axis of Resistance. Include: 1) Executive Summary 2) Key Leadership Profiles (IRGC Quds Force, Hezbollah, Hamas, Houthis, Iraqi PMF) 3) Command and Control Structure 4) Financial Networks and Funding 5) Arms Supply Routes 6) Communication Methods 7) Recruitment and Training 8) Recent Leadership Changes 9) Vulnerabilities and Opportunities 10) Assessment. Professional HUMINT intelligence format." },
];

const CLASSIFICATION_LEVELS = [
  { id: "ts", label: "TOP SECRET // SI // NOFORN", color: "#ef4444" },
  { id: "s", label: "SECRET // REL TO FVEY", color: "#f97316" },
  { id: "c", label: "CONFIDENTIAL", color: "#eab308" },
  { id: "u", label: "UNCLASSIFIED // FOUO", color: "#22c55e" },
];

export default function ThreatReport() {
  const [selectedTemplate, setSelectedTemplate] = useState(REPORT_TEMPLATES[0]);
  const [classification, setClassification] = useState(CLASSIFICATION_LEVELS[0]);
  const [report, setReport] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const generateReport = useCallback(async () => {
    setIsGenerating(true);
    setReport("");

    const prompt = customPrompt || selectedTemplate.prompt;
    const systemPrompt = `You are a senior intelligence analyst at a military intelligence agency. Generate professional intelligence reports in the style of CIA/DIA/Mossad briefings. Use classification markings, paragraph numbering, and structured sections. Current date: ${new Date().toISOString().split("T")[0]}. Classification: ${classification.label}. Be detailed, specific, and operational. Use English.`;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://kal-el.group/",
          "X-Title": "Kal-El Threat Report Generator",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-exp:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.3, max_tokens: 8192, stream: true,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream unavailable");

      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (line.startsWith("data: ")) {
            const d = line.slice(6).trim();
            if (d === "[DONE]") continue;
            try {
              const c = JSON.parse(d).choices?.[0]?.delta?.content || "";
              if (c) { full += c; setReport(full); }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      setReport(`**ERROR:** ${err.message}`);
    }
    setIsGenerating(false);
  }, [selectedTemplate, classification, customPrompt]);

  const exportReport = () => {
    const header = `${classification.label}\n${"=".repeat(60)}\nKAL-EL INTELLIGENCE GROUP\n${selectedTemplate.name.toUpperCase()}\nGenerated: ${new Date().toISOString()}\n${"=".repeat(60)}\n\n`;
    const blob = new Blob([header + report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `kalel-${selectedTemplate.id}-${new Date().toISOString().split("T")[0]}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const copyReport = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <FileText size={16} className="text-amber-400" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">THREAT REPORT GENERATOR</h1>
          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ color: classification.color, backgroundColor: classification.color + "15" }}>{classification.label.split("//")[0].trim()}</span>
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <>
              <button onClick={copyReport} className="px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[9px] text-white/30 hover:text-[#00a8ff] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5">
                {copied ? <CheckCircle size={11} className="text-emerald-400" /> : <Copy size={11} />} {copied ? "COPIED" : "COPY"}
              </button>
              <button onClick={exportReport} className="px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[9px] text-white/30 hover:text-amber-400 font-bold uppercase tracking-widest transition-all flex items-center gap-1.5">
                <Download size={11} /> EXPORT
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Templates */}
        <div className="w-72 shrink-0 border-r border-white/[0.06] flex flex-col bg-[#070d1a]/40">
          <div className="p-3 border-b border-white/[0.06]">
            <div className="text-[8px] font-bold text-white/15 uppercase tracking-widest mb-2">REPORT TEMPLATES</div>
            <div className="space-y-1">
              {REPORT_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => { setSelectedTemplate(t); setCustomPrompt(""); }}
                  className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-all text-left ${selectedTemplate.id === t.id ? "bg-white/[0.06] border border-white/[0.08]" : "border border-transparent hover:bg-white/[0.03]"}`}>
                  <span className="text-lg">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-white/70 truncate">{t.name}</div>
                    <div className="text-[8px] text-white/25 truncate">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Classification */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="text-[8px] font-bold text-white/15 uppercase tracking-widest mb-2">CLASSIFICATION</div>
            <div className="space-y-1">
              {CLASSIFICATION_LEVELS.map(c => (
                <button key={c.id} onClick={() => setClassification(c)}
                  className={`w-full p-2 rounded-lg text-left transition-all ${classification.id === c.id ? "bg-white/[0.06] border border-white/[0.08]" : "border border-transparent hover:bg-white/[0.03]"}`}>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: c.color }}>{c.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="p-3 flex-1">
            <div className="text-[8px] font-bold text-white/15 uppercase tracking-widest mb-2">CUSTOM INSTRUCTIONS</div>
            <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
              placeholder="Override template with custom instructions..."
              className="w-full h-24 bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2 text-[10px] text-white placeholder-white/15 outline-none focus:border-[#00a8ff]/20 transition-all resize-none" />
          </div>

          {/* Generate Button */}
          <div className="p-3 border-t border-white/[0.06]">
            <button onClick={generateReport} disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/20 text-amber-400 font-bold text-[11px] uppercase tracking-widest hover:from-amber-500/30 hover:to-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {isGenerating ? "GENERATING..." : "GENERATE REPORT"}
            </button>
          </div>
        </div>

        {/* Center: Report Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {report ? (
            <div className="flex-1 overflow-y-auto">
              {/* Classification Banner */}
              <div className="sticky top-0 z-10 py-1.5 text-center text-[9px] font-bold uppercase tracking-[0.3em]" style={{ backgroundColor: classification.color + "20", color: classification.color, borderBottom: `1px solid ${classification.color}30` }}>
                {classification.label}
              </div>

              {/* Report Header */}
              <div className="p-6 border-b border-white/[0.06]">
                <div className="text-center space-y-1">
                  <div className="text-[10px] text-white/20 uppercase tracking-[0.3em]">KAL-EL INTELLIGENCE GROUP</div>
                  <div className="font-[Rajdhani] font-bold text-xl text-white/90 uppercase tracking-wider">{selectedTemplate.name}</div>
                  <div className="text-[10px] text-white/25 font-mono">{new Date().toISOString().split("T")[0]} — {new Date().toLocaleTimeString("en-GB")} UTC</div>
                </div>
              </div>

              {/* Report Body */}
              <div className="p-6">
                <div className="text-[13px] text-white/70 leading-[1.8] whitespace-pre-wrap font-[system-ui]">{report}</div>
                {isGenerating && (
                  <div className="flex items-center gap-2 mt-4">
                    <Loader2 size={12} className="animate-spin text-amber-400/50" />
                    <span className="text-[9px] text-white/20 uppercase tracking-widest">Generating intelligence report...</span>
                  </div>
                )}
              </div>

              {/* Classification Footer */}
              <div className="py-1.5 text-center text-[9px] font-bold uppercase tracking-[0.3em]" style={{ backgroundColor: classification.color + "20", color: classification.color, borderTop: `1px solid ${classification.color}30` }}>
                {classification.label}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-amber-500/[0.05] border border-amber-500/10 flex items-center justify-center mx-auto">
                  <FileText size={32} className="text-amber-400/30" />
                </div>
                <div>
                  <div className="font-[Rajdhani] font-bold text-lg text-white/30">Select a Template</div>
                  <div className="text-[11px] text-white/15 mt-1">Choose a report template and click "Generate Report"</div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-md">
                  {REPORT_TEMPLATES.map(t => (
                    <span key={t.id} className="px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.04] text-[8px] text-white/20">{t.icon} {t.name}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
