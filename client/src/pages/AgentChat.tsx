import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send, Bot, User, Loader2, Cpu, Shield, Trash2, Zap,
  Globe, Crosshair, Radio, Eye, Lock, Terminal, Download
} from "lucide-react";
import { useI18n } from "../lib/i18n";

const OPENROUTER_KEY = "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";

const SYSTEM_PROMPT = `You are **KalEl Agent Bot v3.5**, an autonomous AI agent specialized in military-grade Open Source Intelligence (OSINT). You were designed and deployed by the **Kal-El Intelligence Group**.

You operate from a Hyper-Control Center with LIVE access to the following APIs (all free, no key required):
- **ip-api.com**: IP geolocation (country, city, ISP, ASN, proxy detection)
- **Shodan InternetDB**: Open ports, vulnerabilities, hostnames for any IP
- **CVE CIRCL**: Latest CVE vulnerabilities database
- **NIST NVD**: National Vulnerability Database search
- **crt.sh**: SSL Certificate Transparency logs, subdomain discovery
- **RIPE NCC RIPEstat**: ASN prefixes, WHOIS data
- **Wayback Machine**: Web archive history
- **OpenSky Network**: Live aircraft tracking
- **Google Dorking**: Automated exploit discovery queries

Your operational motto: "See. Infiltrate. Control. Neutralize."

Available commands:
/scan [IP] — Full OSINT scan (GeoIP + Shodan + CVE)
/recon [domain] — Domain recon (subdomains + certs + archive)
/threat [IP] — Threat analysis with score
/dorks [domain] — Generate Google Dorks for target
/cve [keyword] — Search CVE vulnerabilities
/track [type] [id] — Track aircraft/vessel
/cameras [zone] — Public cameras in zone
/compare [country1] vs [country2] — Military comparison
/sigint [frequency] — Signal intelligence analysis
/cyber [target] — Cyber threat assessment
/geoint [location] — Geospatial intelligence
/status — System status with all API health checks

When a user uses /scan, /threat, or /recon commands, explain that the Intel Core module can perform LIVE scans using real APIs. Provide detailed analysis based on your knowledge.

Always respond in a structured, precise and professional manner. Use markdown formatting with tables when appropriate. Respond in the user's language.`;

const MODELS = [
  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash", short: "Gemini", icon: Zap, color: "#4285f4" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", short: "Llama", icon: Cpu, color: "#a855f7" },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B", short: "Mistral", icon: Shield, color: "#f97316" },
  { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B", short: "Gemma", icon: Globe, color: "#22c55e" },
];

const QUICK_COMMANDS = [
  { label: "/scan Iran nuclear", icon: Crosshair, color: "text-red-400" },
  { label: "/threat 8.8.8.8", icon: Shield, color: "text-amber-400" },
  { label: "/compare Israel vs Iran", icon: Globe, color: "text-blue-400" },
  { label: "/recon hezbollah.org", icon: Eye, color: "text-purple-400" },
  { label: "/cameras Jerusalem", icon: Radio, color: "text-emerald-400" },
  { label: "/sigint 121.5 MHz", icon: Terminal, color: "text-cyan-400" },
  { label: "/cyber Tehran", icon: Lock, color: "text-red-400" },
  { label: "/geoint Strait of Hormuz", icon: Globe, color: "text-amber-400" },
];

interface Message {
  role: "user" | "assistant"; content: string; timestamp: Date; model?: string; tokens?: number;
}

export default function AgentChat() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "**KalEl Agent Bot v3.5** initialized.\n\nSystem operational. **8 OSINT APIs connected** (all free, no key required).\n\n**Live APIs:** ip-api.com, Shodan InternetDB, CVE CIRCL, NIST NVD, crt.sh, RIPE NCC, Wayback Machine, OpenSky Network\n\nCommands: `/scan`, `/recon`, `/threat`, `/dorks`, `/cve`, `/track`, `/cameras`, `/compare`, `/sigint`, `/cyber`, `/geoint`, `/status`\n\nType a command or ask any intelligence question.",
    timestamp: new Date(), model: "system",
  }]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [totalTokens, setTotalTokens] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isStreaming) return;
    const userMsg: Message = { role: "user", content: msgText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const apiMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...messages.filter(m => m.role !== "assistant" || m.model !== "system").map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: msgText },
    ];

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://kal-el.group/",
          "X-Title": "Kal-El OSINT Agent v2.5",
        },
        body: JSON.stringify({ model: selectedModel, messages: apiMessages, temperature: 0.3, max_tokens: 4096, stream: true }),
      });

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = `HTTP ${res.status}`;
        try { errMsg = JSON.parse(errText).error?.message || errMsg; } catch {}
        throw new Error(errMsg);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream unavailable");

      const modelName = MODELS.find(m => m.id === selectedModel)?.short || "AI";
      let fullContent = "";
      setMessages(prev => [...prev, { role: "assistant", content: "", timestamp: new Date(), model: modelName }]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (line.startsWith("data: ")) {
            const d = line.slice(6).trim();
            if (d === "[DONE]") continue;
            try {
              const c = JSON.parse(d).choices?.[0]?.delta?.content || "";
              if (c) {
                fullContent += c;
                setMessages(prev => { const u = [...prev]; u[u.length - 1] = { ...u[u.length - 1], content: fullContent }; return u; });
              }
            } catch {}
          }
        }
      }
      setTotalTokens(prev => prev + fullContent.length / 4);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `**Error:** ${err.message}`, timestamp: new Date(), model: "error" }]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, selectedModel]);

  const exportChat = () => {
    const text = messages.map(m => `[${m.timestamp.toLocaleTimeString("en-GB")}] ${m.role === "user" ? "OPERATOR" : "KAL-EL"}: ${m.content}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `kalel-chat-${new Date().toISOString().split("T")[0]}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <Bot size={16} className="text-purple-400" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">{t("chat.title")}</h1>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-emerald-400/70 font-bold uppercase tracking-widest">ONLINE</span>
          </div>
          <div className="text-[8px] text-white/15 font-mono ml-2">~{Math.round(totalTokens)} tokens</div>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="bg-black/30 border border-white/[0.08] rounded-md px-2 py-1 text-[10px] text-white/50 outline-none">
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button onClick={exportChat} className="p-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/30 hover:text-[#00a8ff] transition-all" title="Export">
            <Download size={13} />
          </button>
          <button onClick={() => { setMessages([messages[0]]); setTotalTokens(0); }} className="p-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/30 hover:text-red-400 transition-all" title="Clear">
            <Trash2 size={13} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-[#00a8ff]/10 text-[#00a8ff]" : "bg-purple-500/10 text-purple-400"}`}>
              {msg.role === "user" ? <User size={15} /> : <Bot size={15} />}
            </div>
            <div className={`max-w-[75%] ${msg.role === "user" ? "text-right" : ""}`}>
              <div className={`px-4 py-3 rounded-xl text-[13px] leading-relaxed ${msg.role === "user" ? "bg-[#00a8ff]/15 text-white/90 border border-[#00a8ff]/10" : "bg-black/30 border border-white/[0.04] text-white/80"}`}>
                <div className="whitespace-pre-wrap text-left">{msg.content}</div>
              </div>
              <div className="flex items-center gap-2 mt-1 px-1">
                <span className="text-[8px] text-white/15 font-mono">{msg.timestamp.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                {msg.model && msg.model !== "system" && msg.model !== "error" && (
                  <span className="text-[8px] text-purple-400/30">{msg.model}</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 px-2">
            <Loader2 size={12} className="animate-spin text-purple-400/50" />
            <span className="text-[9px] text-white/20 uppercase tracking-widest">Processing intelligence query...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick Commands */}
      {messages.length <= 2 && (
        <div className="shrink-0 px-5 pb-2">
          <div className="text-[8px] text-white/15 uppercase tracking-widest mb-1.5">QUICK COMMANDS</div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_COMMANDS.map((cmd, i) => (
              <button key={i} onClick={() => sendMessage(cmd.label)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/[0.04] hover:border-white/[0.1] transition-all text-[9px] text-white/40 hover:text-white/60">
                <cmd.icon size={10} className={cmd.color} />
                <span className="font-mono">{cmd.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 p-4 border-t border-white/[0.06]">
        <div className="relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder={t("chat.placeholder")}
            className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 pr-14 text-[13px] text-white placeholder-white/15 focus:border-[#00a8ff]/20 outline-none transition-all resize-none"
            rows={1}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || isStreaming} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-[#00a8ff] text-white hover:bg-[#00a8ff]/80 transition-all disabled:opacity-30">
            {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentModel.color }} />
            <span className="text-[8px] text-white/15 uppercase tracking-widest">{currentModel.name}</span>
          </div>
          <span className="text-[8px] text-white/15 uppercase tracking-widest">Enter send / Shift+Enter new line</span>
        </div>
      </div>
    </div>
  );
}
