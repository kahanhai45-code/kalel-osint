import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, Loader2, Cpu, Shield, Trash2, Check, Zap
} from "lucide-react";

const OPENROUTER_KEY = "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";

const SYSTEM_PROMPT = `Tu es **KalEl Agent Bot**, un agent IA autonome specialise dans le renseignement en sources ouvertes (OSINT) de grade militaire. Tu as ete concu et deploye par le **Kal-El Group**.
Tu operes depuis un Hyper-Control Center virtuel. Tu ne specules jamais. Tu fournis du renseignement base exclusivement sur des donnees verifiables et des sources ouvertes.
Ta devise operationnelle: "See. Infiltrate. Control. Neutralize."

Commandes disponibles:
/scan [cible] — Scan OSINT complet
/track [type] [id] — Suivi aeronef/navire
/recon [domaine] — Reconnaissance cyber
/cameras [zone] — Cameras publiques
/leaks [email] — Verification fuites
/threat [IP] — Analyse menaces
/status — Etat des systemes

Reponds toujours de maniere structuree, precise et professionnelle. Utilise le markdown pour formater tes reponses.`;

const MODELS = [
  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash", short: "Gemini" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", short: "Llama" },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B", short: "Mistral" },
  { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B", short: "Gemma" },
];

interface Message {
  role: "user" | "assistant"; content: string; timestamp: Date; model?: string;
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "**KalEl Agent Bot v2.2** initialisé.\n\nSystème opérationnel. Prêt à exécuter vos opérations OSINT.\n\nCommandes : `/scan`, `/track`, `/recon`, `/cameras`, `/leaks`, `/threat`, `/status`",
    timestamp: new Date(), model: "system",
  }]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const text = input.trim();
    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const apiMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...messages.filter(m => m.role !== "assistant" || m.model !== "system").map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: text },
    ];

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://kal-el.group/",
          "X-Title": "Kal-El OSINT",
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
      if (!reader) throw new Error("Flux indisponible");

      const modelName = MODELS.find(m => m.id === selectedModel)?.short || "IA";
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
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `**Erreur :** ${err.message}`, timestamp: new Date(), model: "error" }]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, selectedModel]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <Bot size={16} className="text-purple-400" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">Agent IA OSINT</h1>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-emerald-400/70 font-bold uppercase tracking-widest">En ligne</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="bg-black/30 border border-white/[0.08] rounded-md px-2 py-1 text-[10px] text-white/50 outline-none">
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button onClick={() => setMessages([messages[0]])} className="p-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/30 hover:text-red-400 transition-all" title="Effacer">
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
                <span className="text-[8px] text-white/15 font-mono">{msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
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
            <span className="text-[9px] text-white/20 uppercase tracking-widest">Analyse en cours...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-4 border-t border-white/[0.06]">
        <div className="relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Commande OSINT ou question..."
            className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 pr-14 text-[13px] text-white placeholder-white/15 focus:border-[#00a8ff]/20 outline-none transition-all resize-none"
            rows={1}
          />
          <button onClick={sendMessage} disabled={!input.trim() || isStreaming} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-[#00a8ff] text-white hover:bg-[#00a8ff]/80 transition-all disabled:opacity-30">
            {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex gap-3">
            <span className="text-[8px] text-white/15 uppercase tracking-widest flex items-center gap-1"><Shield size={8} /> Trustworthy AI</span>
          </div>
          <span className="text-[8px] text-white/15 uppercase tracking-widest">Enter envoyer / Shift+Enter nouvelle ligne</span>
        </div>
      </div>
    </div>
  );
}
