/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  KotoScore,
  getStringNames,
  KEYBOARD_ROW1,
  getPitches,
  noteName,
  NOTE_DOREMI,
  Slot
} from '../types/koto';
import { kotoSynth } from '../audio/kotoSynth';
import { X, ChevronDown, ChevronUp, Hand } from 'lucide-react';

interface VirtualKotoProps {
  score: KotoScore;
  onSelectString?: (strIndex: number) => void;
  activeStrings?: number[];
  activeSlot?: Slot | null;
  onClose?: () => void;
}

export const VirtualKoto: React.FC<VirtualKotoProps> = ({
  score,
  onSelectString,
  activeStrings = [],
  activeSlot,
  onClose
}) => {
  const stringCount = score.stringCount || 13;
  const stringNames = getStringNames(stringCount);
  const pitches = getPitches(score);

  const [vibrating, setVibrating] = useState<Record<number, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewPerspective, setViewPerspective] = useState<'horizontal' | 'player'>('horizontal');
  const [labelStyle, setLabelStyle] = useState<'kanji' | 'doremi' | 'cde'>('kanji');
  const [showOshiGuide, setShowOshiGuide] = useState(true);
  const [showKeyHints, setShowKeyHints] = useState(true);

  useEffect(() => {
    const unsubscribe = kotoSynth.onStringTrigger((strIdx) => {
      triggerVibration(strIdx);
    });
    return unsubscribe;
  }, []);

  const triggerVibration = (strIdx: number) => {
    setVibrating(prev => ({ ...prev, [strIdx]: true }));
    setTimeout(() => {
      setVibrating(prev => ({ ...prev, [strIdx]: false }));
    }, 480);
  };

  const handlePluck = (strIdx: number) => {
    const midi = pitches[strIdx];
    kotoSynth.pluck(strIdx, midi, 0, 0.85);
    triggerVibration(strIdx);
    if (onSelectString) {
      onSelectString(strIdx);
    }
  };

  const minMidi = 36;
  const maxMidi = 88;

  let oshiText = '';
  let oshiType: 'none' | 'half' | 'full' | 'ato' | 'hikiiro' | 'tsuki' = 'none';
  if (activeSlot) {
    if (activeSlot.oshi === 1) {
      oshiText = '半音強押し';
      oshiType = 'half';
    } else if (activeSlot.oshi === 2) {
      oshiText = '全音巾押し';
      oshiType = 'full';
    } else if (activeSlot.ato) {
      oshiText = '後押し';
      oshiType = 'ato';
    } else if (activeSlot.hikiiro) {
      oshiText = '引き色';
      oshiType = 'hikiiro';
    } else if (activeSlot.tsuki) {
      oshiText = '突き色';
      oshiType = 'tsuki';
    }
  }

  let fingerGuideText = '';
  if (activeSlot?.finger === 1) fingerGuideText = '拇指 (1)';
  else if (activeSlot?.finger === 2) fingerGuideText = '食指 (2)';
  else if (activeSlot?.finger === 3) fingerGuideText = '中指 (3)';

  return (
    <div className="w-full select-none rounded-2xl border-2 border-[#3d1f08] bg-stone-950 p-2 sm:p-3.5 shadow-2xl text-stone-100 transition-all font-sans">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/40 pb-2 text-xs text-amber-200/90">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span className="font-bold text-sm text-amber-100 tracking-wide font-score">
            {stringCount === 17 ? '十七絃箏ボード' : '十三絃箏ボード'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center rounded-lg bg-amber-950/80 border border-amber-800/60 p-0.5 text-[10.5px]">
            <button
              onClick={() => setViewPerspective('horizontal')}
              className={`px-2 py-0.5 rounded font-semibold cursor-pointer transition-colors ${
                viewPerspective === 'horizontal' ? 'bg-amber-400 text-stone-950 font-bold shadow-2xs' : 'text-amber-200 hover:text-white'
              }`}
              title="水平表示"
            >
              横表示
            </button>
            <button
              onClick={() => setViewPerspective('player')}
              className={`px-2 py-0.5 rounded font-semibold cursor-pointer transition-colors ${
                viewPerspective === 'player' ? 'bg-amber-400 text-stone-950 font-bold shadow-2xs' : 'text-amber-200 hover:text-white'
              }`}
              title="演奏者視点"
            >
              演奏視点
            </button>
          </div>

          <div className="flex items-center rounded-lg bg-amber-950/80 border border-amber-800/60 p-0.5 text-[10.5px]">
            <button
              onClick={() => setLabelStyle('kanji')}
              className={`px-1.5 py-0.5 rounded font-medium cursor-pointer ${
                labelStyle === 'kanji' ? 'bg-amber-300 text-stone-950 font-bold' : 'text-amber-200/80 hover:text-white'
              }`}
            >
              漢数字
            </button>
            <button
              onClick={() => setLabelStyle('doremi')}
              className={`px-1.5 py-0.5 rounded font-medium cursor-pointer ${
                labelStyle === 'doremi' ? 'bg-amber-300 text-stone-950 font-bold' : 'text-amber-200/80 hover:text-white'
              }`}
            >
              ドレミ
            </button>
            <button
              onClick={() => setLabelStyle('cde')}
              className={`px-1.5 py-0.5 rounded font-medium cursor-pointer ${
                labelStyle === 'cde' ? 'bg-amber-300 text-stone-950 font-bold' : 'text-amber-200/80 hover:text-white'
              }`}
            >
              CDE
            </button>
          </div>

          <button
            onClick={() => setShowOshiGuide(!showOshiGuide)}
            className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold border cursor-pointer ${
              showOshiGuide ? 'border-amber-400 bg-amber-900/60 text-amber-200' : 'border-stone-800 bg-stone-900 text-stone-500'
            }`}
            title="押し手ガイド表示"
          >
            押し手ガイド
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-amber-300/80 hover:bg-amber-900/60 hover:text-amber-100 cursor-pointer border border-amber-900/40"
          >
            {isCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{isCollapsed ? '展開' : '畳む'}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-red-950/60 text-red-200 hover:bg-red-800 hover:text-white cursor-pointer transition-colors border border-red-800/60"
              title="閉じる"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && activeStrings.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-950 via-amber-900/90 to-amber-950 p-2 px-3 text-xs shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 font-black text-stone-950 text-xs shadow">
              {stringNames[activeStrings[0]] || '一'}
            </span>
            <span className="font-bold text-amber-100 text-sm font-score">
              {noteName(pitches[activeStrings[0]])} ({NOTE_DOREMI[pitches[activeStrings[0]] % 12]})
            </span>
            {fingerGuideText && (
              <span className="rounded-full bg-amber-300/20 px-2 py-0.5 font-bold text-amber-200 border border-amber-400/40 text-[11px]">
                指: {fingerGuideText}
              </span>
            )}
          </div>
          {oshiText && showOshiGuide && (
            <div className="flex items-center gap-1.5 rounded-lg bg-red-950/80 px-2.5 py-1 text-red-200 font-bold border border-red-500/60 text-[11.5px] animate-pulse">
              <Hand className="h-4 w-4 text-red-400 shrink-0" />
              <span>左手: {oshiText}</span>
            </div>
          )}
        </div>
      )}

      {!isCollapsed && (
        <div className="relative mt-2.5 flex flex-col rounded-2xl border-2 border-[#2c1303] bg-[#2a1405] p-3 shadow-2xl overflow-x-auto">
          <div className="relative flex flex-col gap-1.5 rounded-xl border border-[#52290b] bg-gradient-to-b from-[#6b3d18] via-[#a36838] to-[#542d0e] p-3 shadow-inner koto-wood-grain min-w-[620px] overflow-hidden">
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-10 bg-gradient-to-l from-amber-950 via-[#3a1b07] to-transparent border-l border-amber-600/40 flex flex-col justify-between p-1 z-20">
              <div className="w-full h-full border-r-2 border-amber-500/60 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:6px_6px] opacity-40"></div>
            </div>
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-r from-amber-950 via-[#2d1405] to-transparent border-r border-amber-600/40 flex flex-col justify-between p-1 z-20">
              <div className="w-full h-full border-l-2 border-amber-500/60 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:6px_6px] opacity-40"></div>
            </div>

            {stringNames.map((kanji, idx) => {
              const midi = pitches[idx];
              const isVib = vibrating[idx] || activeStrings.includes(idx);
              const isFirstActive = activeStrings[0] === idx;
              const ratio = Math.max(0.12, Math.min(0.88, (midi - minMidi) / (maxMidi - minMidi)));
              const bridgePercent = viewPerspective === 'horizontal' ? 22 + ratio * 58 : 18 + (idx / stringCount) * 62;
              const stringThickness = Math.max(1.8, 3.5 - (idx / stringCount) * 1.5);

              let displayNoteLabel = kanji;
              if (labelStyle === 'doremi') {
                displayNoteLabel = NOTE_DOREMI[midi % 12];
              } else if (labelStyle === 'cde') {
                displayNoteLabel = noteName(midi, false);
              }

              const keyboardKey = KEYBOARD_ROW1[idx] || '';

              return (
                <div
                  key={idx}
                  onClick={() => handlePluck(idx)}
                  className={`group relative flex w-full cursor-pointer items-center transition-all duration-150 rounded-lg px-1 ${
                    viewPerspective === 'player' ? 'h-7 sm:h-8 my-0.5' : 'h-6 sm:h-7'
                  } ${isVib ? 'bg-amber-400/20' : 'hover:bg-amber-400/10'}`}
                >
                  <div className="z-10 flex w-24 sm:w-28 shrink-0 items-center gap-1.5 pl-2">
                    <span
                      className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md font-score font-black text-xs shadow-md transition-transform ${
                        isVib
                          ? 'bg-amber-300 text-stone-950 scale-110 ring-2 ring-amber-400 shadow-amber-300/80'
                          : 'bg-[#2b1304] text-amber-100 border border-amber-700/60 group-hover:border-amber-400'
                      }`}
                    >
                      {displayNoteLabel}
                    </span>
                    {showKeyHints && keyboardKey && (
                      <span className="hidden sm:inline-block rounded bg-amber-950/90 px-1 py-0.5 font-mono text-[9px] font-bold text-amber-300 border border-amber-800/60">
                        {keyboardKey}
                      </span>
                    )}
                    {isFirstActive && oshiType !== 'none' && showOshiGuide && (
                      <span className="flex items-center gap-0.5 rounded bg-red-600 px-1.5 py-0.5 font-sans text-[9px] font-extrabold text-white shadow animate-bounce shrink-0">
                        <Hand className="h-2.5 w-2.5" />
                        {oshiType === 'half' ? '強押' : oshiType === 'full' ? '巾押' : '押'}
                      </span>
                    )}
                  </div>

                  <div className="relative flex-1 h-full flex items-center px-4">
                    <div className="absolute inset-x-4 h-[2px] bg-black/40 blur-[1px] translate-y-1 pointer-events-none"></div>
                    <div
                      style={{ height: `${stringThickness}px` }}
                      className={`w-full transition-all duration-100 rounded-full ${
                        isVib
                          ? 'bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 shadow-[0_0_12px_#fde047] animate-koto-vibrate'
                          : 'bg-gradient-to-r from-[#fff9eb] via-[#f7e3ad] to-[#e6c770] shadow-[0_1px_2px_rgba(0,0,0,0.7)] group-hover:bg-yellow-200'
                      }`}
                    />

                    {isFirstActive && (
                      <div
                        style={{ right: '8%' }}
                        className="pointer-events-none absolute translate-x-1/2 flex items-center justify-center z-20"
                      >
                        <div className="h-6 w-6 rounded-full bg-amber-300/30 animate-ping"></div>
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-400 font-extrabold text-[9px] text-stone-950 border border-amber-500 shadow-md animate-bounce">
                          {activeSlot?.finger === 2 ? '食' : activeSlot?.finger === 3 ? '中' : '拇'}
                        </div>
                      </div>
                    )}

                    {isFirstActive && oshiType !== 'none' && showOshiGuide && (
                      <div
                        style={{ left: `${Math.max(5, bridgePercent - 12)}%` }}
                        className="pointer-events-none absolute -translate-x-1/2 flex flex-col items-center justify-center z-20"
                      >
                        <div className="h-5 w-5 rounded-full bg-red-500/80 animate-ping"></div>
                        <div className="h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white shadow-lg"></div>
                      </div>
                    )}

                    <div
                      style={{ left: `${bridgePercent}%` }}
                      className="pointer-events-none absolute -translate-x-1/2 flex flex-col items-center transition-all duration-300 z-10"
                      title="箏柱 (Ji)"
                    >
                      <div className="relative flex flex-col items-center">
                        <div className="w-1.5 h-1 bg-amber-950 rounded-t-[1px]"></div>
                        <div
                          className={`w-3.5 h-4 sm:w-4 sm:h-5 bg-gradient-to-b from-amber-50 via-amber-100 to-stone-300 clip-triangle shadow-xl rounded-[1px] border border-amber-900/50 transition-transform ${
                            isVib ? 'scale-125 ring-2 ring-amber-400' : ''
                          }`}
                        ></div>
                        <div className="w-4 h-1 bg-black/60 blur-[1px] rounded-full mt-0.5"></div>
                      </div>
                    </div>
                  </div>

                  <div className="z-10 flex w-20 sm:w-24 shrink-0 justify-end items-center pr-2 font-mono text-[10.5px]">
                    <span
                      className={`px-1.5 py-0.5 rounded-md font-bold transition-colors ${
                        isVib
                          ? 'bg-amber-400 text-stone-950 shadow-md scale-105'
                          : 'bg-[#2b1304] text-amber-200/90 border border-amber-800/60'
                      }`}
                    >
                      {noteName(midi, true)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between px-1 text-[11px] text-amber-300/80">
            <div className="flex items-center gap-3">
              <span>💡 **操作ヒント**: 弦をクリックすると演奏音を聞くことができます</span>
            </div>
            <div className="text-amber-400/90 font-mono text-[10.5px]">
              現在の調子: {score.tuning.preset} ({noteName(score.tuning.root, false)})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
