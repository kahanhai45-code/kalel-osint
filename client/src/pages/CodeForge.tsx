import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, Loader2, Copy, Check, Trash2, Sparkles, Terminal
} from "lucide-react";

const OPENROUTER_KEY = "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";

const MODELS = [
  { id: "qwen/qwen-coder-32b-instruct:free", name: "Qwen Coder 32B" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B" },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B" },
];

const MODES = [
  { id: "optimize", name: "Optimiser", desc: "Performance" },
  { id: "secure", name: "Sécuriser", desc: "Sécurité" },
  { id: "refactor", name: "Refactoriser", desc: "Structure" },
  { id: "document", name: "Documenter", desc: "Documentation" },
  { id: "modernize", name: "Moderniser", desc: "Patterns modernes" },
  { id: "translate", name: "Traduire", desc: "Autre langage" },
];

export default function CodeForge() {
  const [inputCode, setInputCode] = useState("// Entrez votre code ici\nfunction example() {\n  return 'Hello World';\n}");
  const [outputCode, setOutputCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [model, setModel] = useState(MODELS[0].id);
  const [mode, setMode] = useState("optimize");
  const [targetLang, setTargetLang] = useState("python");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<{ mode: string; time: string; snippet: string }[]>([]);

  const processCode = useCallback(async () => {
    if (!inputCode.trim()) return;
    setProcessing(true);
    setOutputCode("");

    const modeDesc: Record<string, string> = {
      optimize: "Optimise ce code pour les performances maximales.",
      secure: "Ajoute des vérifications de sécurité robustes.",
      refactor: "Refactorise pour améliorer la structure et la lisibilité.",
      document: "Ajoute une documentation complète (commentaires, docstrings).",
      modernize: "Modernise avec les syntaxes et patterns récents.",
      translate: `Traduis ce code en ${targetLang}. Conserve la logique exacte.`,
    };

    const prompt = `Tu es un expert en développement. ${modeDesc[mode]}

Code:
\`\`\`
${inputCode}
\`\`\`

Réponds UNIQUEMENT avec le code résultant, sans explication. Pas de balises markdown.`;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://kal-el.group/",
          "X-Title": "Kal-El Code Forge",
        },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.2, max_tokens: 8192, stream: true }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Flux indisponible");

      let full = "";
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
              if (c) { full += c; setOutputCode(full); }
            } catch {}
          }
        }
      }

      // Clean markdown code blocks if present
      const cleaned = full.replace(/^```\w*\n?/, "").replace(/\n?```$/, "").trim();
      setOutputCode(cleaned);
      setHistory(prev => [{ mode, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), snippet: inputCode.slice(0, 40) }, ...prev].slice(0, 20));
    } catch (err: any) {
      setOutputCode(`// Erreur: ${err.message}`);
    }
    setProcessing(false);
  }, [inputCode, model, mode, targetLang]);

  const copy = () => { navigator.clipboard.writeText(outputCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/50">
        <div className="flex items-center gap-3">
          <Code2 size={16} className="text-cyan-400" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">Code Forge</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={model} onChange={e => setModel(e.target.value)} className="bg-black/30 border border-white/[0.06] rounded-md px-2 py-1 text-[10px] text-white/50 outline-none">
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border ${mode === m.id ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-black/20 border-white/[0.04] text-white/30 hover:text-white/50"}`}>
              {m.name}
            </button>
          ))}
          {mode === "translate" && (
            <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="bg-black/30 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[10px] text-white/50 outline-none">
              {["python", "javascript", "java", "rust", "go", "cpp", "csharp", "php"].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          )}
          <div className="flex-1" />
          <button onClick={processCode} disabled={processing || !inputCode.trim()} className="px-4 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-cyan-500/20 transition-all disabled:opacity-40">
            {processing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Traiter
          </button>
        </div>

        {/* Code Panels */}
        <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden">
          {/* Input */}
          <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] flex flex-col overflow-hidden">
            <div className="h-9 flex items-center justify-between px-3 border-b border-white/[0.04] shrink-0">
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Original</span>
              <button onClick={() => setInputCode("")} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
            </div>
            <textarea value={inputCode} onChange={e => setInputCode(e.target.value)} className="flex-1 bg-transparent p-3 text-[12px] font-[Fira_Code] text-white/80 resize-none outline-none leading-relaxed" spellCheck="false" />
          </div>

          {/* Output */}
          <div className="bg-[#0a1428]/50 rounded-xl border border-white/[0.06] flex flex-col overflow-hidden">
            <div className="h-9 flex items-center justify-between px-3 border-b border-white/[0.04] shrink-0">
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Résultat</span>
              <button onClick={copy} className="text-white/20 hover:text-cyan-400 transition-colors">
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
            <textarea value={outputCode} readOnly className="flex-1 bg-transparent p-3 text-[12px] font-[Fira_Code] text-cyan-400/80 resize-none outline-none leading-relaxed" spellCheck="false" />
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[8px] text-white/15 uppercase tracking-widest shrink-0">Historique :</span>
            {history.slice(0, 8).map((h, i) => (
              <span key={i} className="px-2 py-1 rounded-md bg-black/20 border border-white/[0.04] text-[8px] text-white/25 shrink-0">
                {h.mode} | {h.time}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
