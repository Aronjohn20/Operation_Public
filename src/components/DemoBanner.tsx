"use client";

import { useState } from "react";
import { Sparkles, RotateCcw, ShieldCheck, Check, X } from "lucide-react";
import { resetDemoData } from "@/lib/eventsStorage";

export default function DemoBanner() {
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDone, setIsResetDone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleReset = () => {
    setIsResetting(true);
    resetDemoData();
    setIsResetDone(true);
    setTimeout(() => {
      setIsResetting(false);
      setIsResetDone(false);
      window.location.reload();
    }, 800);
  };

  if (isDismissed) {
    return (
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsDismissed(false)}
          className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 transition flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Demo Sandbox Controls</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-950 border border-purple-500/30 text-white shadow-lg backdrop-blur-md transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0 text-amber-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* <span className="text-sm font-extrabold tracking-wide text-white">
                Interactive Public Sandbox Mode
              </span> */}
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {/* <span>100% Client-Side Air-Gapped</span> */}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              All events, forms, attendance rosters, and certificates run locally on your device in browser storage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={handleReset}
            disabled={isResetting || isResetDone}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600/40 hover:bg-purple-600/70 border border-purple-500/50 text-purple-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Reset sandbox to original sample events and coordinators"
          >
            {isResetDone ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reset Complete!</span>
              </>
            ) : (
              <>
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                <span>Reset Demo Data</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
            title="Collapse banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

