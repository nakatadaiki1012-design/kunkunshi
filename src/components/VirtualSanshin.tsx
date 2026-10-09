/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KunkunshiScore, MALE_STRING_NOTES, MIDDLE_STRING_NOTES, FEMALE_STRING_NOTES } from '../types/kunkunshi';
import { sanshinSynth } from '../utils/audioSynth';
import { X, Volume2, ChevronDown, ChevronUp } from 'lucide-react';

interface VirtualSanshinProps {
  currentScore: KunkunshiScore;
  onNoteSelected?: (note: string) => void;
  onClose?: () => void;
}

export const VirtualSanshin: React.FC<VirtualSanshinProps> = ({
  currentScore,
  onNoteSelected,
  onClose
}) => {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNotePluck = (note: string) => {
    setActiveNote(note);
    sanshinSynth.playNote(note);
    if (onNoteSelected) {
      onNoteSelected(note);
    }
    setTimeout(() => setActiveNote(null), 300);
  };

  return (
    <div className="w-full bg-slate-950 border-2 border-amber-900/60 rounded-2xl p-3 shadow-2xl text-slate-100 select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-amber-900/40 text-xs text-amber-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-bold font-serif text-sm text-amber-100">
            バーチャル沖縄三線（勘所・音階ボード）
          </span>
          <span className="text-slate-400 text-xs font-mono">
            調子: {currentScore.tuning} ({currentScore.pitchKey})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 text-xs text-amber-300 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 cursor-pointer"
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isCollapsed ? '三線表示' : '折りたたむ'}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-3 flex flex-col items-center gap-3">
          {/* Main Sanshin Instrument Graphic Container */}
          <div className="w-full bg-slate-900/90 rounded-xl p-4 border border-amber-900/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">

            {/* 1. Sao (棹 - Black Lacquer Neck) with 3 Strings & Kandokoro Markers */}
            <div className="flex-1 w-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-lg p-3 border-y-2 border-amber-800/80 shadow-inner relative min-h-[140px] flex flex-col justify-around">
              {/* String 1: 男弦 (Low String) */}
              <div className="relative flex items-center justify-between py-2 border-b border-amber-950/60">
                <span className="text-xs font-bold text-amber-400 w-16 font-serif shrink-0">【男弦】</span>
                <div className="flex-1 flex items-center justify-around gap-1 relative">
                  {/* String Line */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-amber-200/90 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  {MALE_STRING_NOTES.map((note) => {
                    const isActive = activeNote === note;
                    return (
                      <button
                        key={note}
                        onClick={() => handleNotePluck(note)}
                        className={`relative z-10 px-3 py-1.5 rounded-lg font-serif font-black text-sm transition-all border shadow cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300 scale-110'
                            : 'bg-slate-950/90 text-amber-300 border-amber-700/60 hover:bg-amber-500/20 hover:border-amber-400'
                        }`}
                      >
                        {note}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* String 2: 中弦 (Middle String) */}
              <div className="relative flex items-center justify-between py-2 border-b border-amber-950/60">
                <span className="text-xs font-bold text-amber-400 w-16 font-serif shrink-0">【中弦】</span>
                <div className="flex-1 flex items-center justify-around gap-1 relative">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2.5px] bg-amber-200/90 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  {MIDDLE_STRING_NOTES.map((note) => {
                    const isActive = activeNote === note;
                    return (
                      <button
                        key={note}
                        onClick={() => handleNotePluck(note)}
                        className={`relative z-10 px-3 py-1.5 rounded-lg font-serif font-black text-sm transition-all border shadow cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300 scale-110'
                            : 'bg-slate-950/90 text-amber-300 border-amber-700/60 hover:bg-amber-500/20 hover:border-amber-400'
                        }`}
                      >
                        {note}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* String 3: 女弦 (High String) */}
              <div className="relative flex items-center justify-between py-2">
                <span className="text-xs font-bold text-amber-400 w-16 font-serif shrink-0">【女弦】</span>
                <div className="flex-1 flex items-center justify-around gap-1 relative">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-amber-200/90 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  {FEMALE_STRING_NOTES.map((note) => {
                    const isActive = activeNote === note;
                    return (
                      <button
                        key={note}
                        onClick={() => handleNotePluck(note)}
                        className={`relative z-10 px-3 py-1.5 rounded-lg font-serif font-black text-sm transition-all border shadow cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300 scale-110'
                            : 'bg-slate-950/90 text-amber-300 border-amber-700/60 hover:bg-amber-500/20 hover:border-amber-400'
                        }`}
                      >
                        {note}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Dou (胴 - Snakeskin Resonator Body with Uma Bridge) */}
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 border-4 border-amber-700 shadow-2xl flex flex-col items-center justify-center relative shrink-0">
              {/* Snakeskin Texture Overlay */}
              <div className="absolute inset-2 rounded-full border-2 border-amber-800/80 bg-[radial-gradient(#d97706_1.5px,transparent_1.5px)] [background-size:8px_8px] opacity-40" />

              {/* Uma Bridge (駒) */}
              <div className="relative z-10 w-20 h-4 bg-amber-200 border border-amber-900 rounded shadow-md flex items-center justify-around px-2">
                <div className="w-1 h-1 bg-amber-900 rounded-full" />
                <div className="w-1 h-1 bg-amber-900 rounded-full" />
                <div className="w-1 h-1 bg-amber-900 rounded-full" />
              </div>
              <span className="relative z-10 text-[10px] font-serif font-bold text-amber-300 mt-2">
                沖縄三線 胴（Uma）
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
