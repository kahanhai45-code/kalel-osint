import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertTriangle size={40} className="text-amber-500/30 mx-auto" />
        <h1 className="font-[Rajdhani] text-2xl font-bold text-white/60 uppercase tracking-widest">404 — Non Trouvé</h1>
        <p className="text-sm text-white/30">Cette section n'existe pas.</p>
        <Link href="/">
          <span className="inline-block px-4 py-2 rounded-lg bg-[#00a8ff]/10 border border-[#00a8ff]/20 text-[#00a8ff] text-xs font-bold uppercase tracking-widest hover:bg-[#00a8ff]/15 transition-all cursor-pointer">
            Retour au Dashboard
          </span>
        </Link>
      </div>
    </div>
  );
}
