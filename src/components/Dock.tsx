/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  KotoScore,
  KANJI_STRINGS,
  KEYBOARD_ROW1,
  ORN_LABELS,
  getPitches,
  noteName,
  InputDivType
} from '../types/koto';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Copy,
  ClipboardPaste,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DockProps {
  score: KotoScore;
  currentCursor: { m: number; b: number; s: number };
  isPlaying: boolean;
  inputDiv: InputDivType;
  isChordMode: boolean;
  selectedOrns: Record<string, boolean>;
  canUndo: boolean;
  canRedo: boolean;
  loopActive: boolean;
  loopRange: [number, number];
  speed: number;
  volume: number;
  countIn: boolean;
  metronome: boolean;
  onPlayToggle: () => void;
  onStop: () => void;
  onRewind: () => void;
  onSetInputDiv: (div: InputDivType) => void;
  onToggleChordMode: () => void;
  onInputRest: () => void;
  onInputTie: () => void;
  onInputRepeat2?: () => void;
  onInputClear: () => void;
  onToggleOrn: (ornKey: string) => void;
  onAddMeasure: () => void;
  onInsertMeasure: () => void;
  onDeleteMeasure: () => void;
  onCopyMeasure: () => void;
  onPasteMeasure: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onStringClick: (idx: number) => void;
  onPrevSlot?: () => void;
  onNextSlot?: () => void;
  onSetLoop: (active: boolean, start?: number, end?: number) => void;
  onSetSpeed: (speed: number) => void;
  onSetVolume: (vol: number) => void;
  onSetCountIn: (active: boolean) => void;
  onSetMetronome: (active: boolean) => void;
  onTempoChange: (tempo: number) => void;
  onToggleKotoBoard?: () => void;
  currentFinger?: number;
  onSetFinger?: (finger: number | undefined) => void;
}

export const Dock: React.FC<DockProps> = ({
  score,
  currentCursor,
  isPlaying,
  inputDiv,
  isChordMode,
  selectedOrns,
  canUndo,
  canRedo,
  loopActive,
  loopRange,
  speed,
  volume,
  countIn,
  metronome,
  currentFinger,
  onSetFinger,
  onPlayToggle,
  onStop,
  onRewind,
  onSetInputDiv,
  onToggleChordMode,
  onInputRest,
  onInputTie,
  onInputRepeat2,
  onInputClear,
  onToggleOrn,
  onAddMeasure,
  onInsertMeasure,
  onDeleteMeasure,
  onCopyMeasure,
  onPasteMeasure,
  onUndo,
  onRedo,
  onStringClick,
  onPrevSlot,
  onNextSlot,
  onSetLoop,
  onSetSpeed,
  onSetVolume,
  onSetCountIn,
  onSetMetronome,
  onTempoChange,
  onToggleKotoBoard
}) => {
  const [activeTab, setActiveTab] = useState<'strings' | 'ornaments' | 'measures'>('strings');
  const [isExpanded, setIsExpanded] = useState(true);

  const pitches = getPitches(score);
  const tapTimes = useRef<number[]>([]);
  const [tapBadge, setTapBadge] = useState<string | null>(null);

  const handleTapTempo = () => {
    const now = performance.now();
    const times = tapTimes.current;
    if (times.length && now - times[times.length - 1] > 2000) {

      tapTimes.current = [now];
      setTapBadge('タップ');
      return;
    }
    times.push(now);
    if (times.length > 5) times.shift();

    if (times.length >= 2) {
      const intervals = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avgMs);
      if (bpm >= 30 && bpm <= 240) {
        onTempoChange(bpm);
        setTapBadge(`BPM ${bpm}`);
        setTimeout(() => setTapBadge(null), 1500);
      }
    } else {
      setTapBadge('タップ...');
    }
  };

  return (
    <div className="w-full rounded-xl sm:rounded-2xl border border-stone-300/80 bg-stone-50/95 shadow-lg backdrop-blur-md no-print transition-all">
      {/* Top Controller Bar */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 px-2 py-1 sm:py-1.5 border-b border-stone-200 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={onPlayToggle}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold shadow-2xs transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-stone-950 hover:bg-amber-400 ring-2 ring-amber-400/50'
                : 'bg-indigo-700 text-white hover:bg-indigo-600'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3 w-3" /> <span className="hidden sm:inline">一時停止</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-current" /> <span className="hidden sm:inline">再生</span>
              </>
            )}
          </button>
          <button
            onClick={onStop}
            className="flex items-center justify-center rounded-md border border-stone-300 bg-white p-1 text-stone-700 hover:bg-stone-100 cursor-pointer"
            title="停止 (Esc)"
          >
            <Square className="h-3 w-3" />
          </button>

          {onPrevSlot && onNextSlot && (
            <div className="flex items-center rounded-md border border-stone-300 bg-white">
              <button
                onClick={onPrevSlot}
                className="p-1 hover:bg-stone-100 text-stone-700 cursor-pointer"
                title="前の音符へ"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                onClick={onNextSlot}
                className="p-1 hover:bg-stone-100 text-stone-700 border-l border-stone-200 cursor-pointer"
                title="次の音符へ"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-0.5 rounded bg-stone-200/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-stone-800">
            <span>{currentCursor.m + 1}小節</span>
            <span className="text-stone-400">/</span>
            <span>{currentCursor.b + 1}拍</span>
          </div>
        </div>

        {/* Center: Note Duration Pickers & Rest/Tie */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {[
            { div: 1, label: '♩ 4分', title: '4分音符 (Q)' },
            { div: 2, label: '♪ 8分', title: '8分音符 (W)' },
            { div: '8_16_16', label: '♪♬ 付点8分', title: '付点8分+16分' },
            { div: '16_16_8', label: '♬♪ 16分付点', title: '16分+8分' },
            { div: 3, label: '3連符', title: '3連音符 (E)' },
            { div: 4, label: '♬ 16分', title: '16分音符 (R)' }
          ].map(opt => (
            <button
              key={String(opt.div)}
              onClick={() => onSetInputDiv(opt.div as InputDivType)}
              title={opt.title}
              className={`rounded px-1.5 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                inputDiv === opt.div
                  ? 'bg-indigo-700 text-white shadow-2xs ring-1 ring-indigo-900'
                  : 'border border-stone-200 bg-white text-stone-700 hover:border-stone-400'
              }`}
            >
              {opt.label}
            </button>
          ))}

          <span className="w-px h-3 bg-stone-300 mx-0.5 hidden sm:inline"></span>

          <button
            onClick={onInputRest}
            className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            title="休符 (P)"
          >
            休符
          </button>
          <button
            onClick={onInputTie}
            className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            title="伸ばし (T)"
          >
            タイ
          </button>
          {onInputRepeat2 && (
            <button
              onClick={onInputRepeat2}
              className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-xs font-bold text-stone-800 hover:bg-amber-50 hover:border-amber-400 cursor-pointer"
              title="2拍前リピート記号"
            >
              𝄀𝄀
            </button>
          )}
          <button
            onClick={onInputClear}
            className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            title="消去 (Delete)"
          >
            消去
          </button>
        </div>

        {/* Right: Tabs & Collapse Toggle */}
        <div className="flex items-center gap-1">
          <div className="inline-flex rounded-lg border border-stone-300 bg-stone-100 p-0.5 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('strings');
                setIsExpanded(true);
              }}
              className={`rounded px-1.5 sm:px-2 py-0.5 transition-colors cursor-pointer text-xs ${
                activeTab === 'strings' && isExpanded
                  ? 'bg-white text-stone-950 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              絃キーボード
            </button>
            <button
              onClick={() => {
                setActiveTab('ornaments');
                setIsExpanded(true);
              }}
              className={`rounded px-1.5 sm:px-2 py-0.5 transition-colors cursor-pointer text-xs ${
                activeTab === 'ornaments' && isExpanded
                  ? 'bg-white text-stone-950 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              奏法記号
            </button>
            <button
              onClick={() => {
                setActiveTab('measures');
                setIsExpanded(true);
              }}
              className={`rounded px-1.5 sm:px-2 py-0.5 transition-colors cursor-pointer text-xs ${
                activeTab === 'measures' && isExpanded
                  ? 'bg-white text-stone-950 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              小節・練習
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded border border-stone-300 bg-white p-1 text-stone-600 hover:bg-stone-100 cursor-pointer"
            title={isExpanded ? '折りたたむ' : '展開する'}
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Tab Body */}
      {isExpanded && (
        <div className="p-1 sm:p-2">
          {/* TAB 1: 13-String Keypad */}
          {activeTab === 'strings' && (
            <div className="flex flex-col gap-1">
              <div className="flex flex-col gap-1 sm:hidden">
                <div className="grid grid-cols-7 gap-1">
                  {KANJI_STRINGS.slice(0, 7).map((kanji, idx) => (
                    <button
                      key={idx}
                      onClick={() => onStringClick(idx)}
                      className="flex flex-col items-center justify-center rounded-lg border border-stone-200/90 bg-white py-1 shadow-2xs hover:border-amber-500 hover:bg-amber-50 active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="font-score font-bold text-sm text-stone-900 leading-none">
                        {kanji}
                      </span>
                      <span className="font-mono text-[9px] text-stone-400 mt-0.5 font-semibold">
                        {noteName(pitches[idx], false)}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {KANJI_STRINGS.slice(7).map((kanji, relIdx) => {
                    const idx = 7 + relIdx;
                    return (
                      <button
                        key={idx}
                        onClick={() => onStringClick(idx)}
                        className="flex flex-col items-center justify-center rounded-lg border border-stone-200/90 bg-white py-1 shadow-2xs hover:border-amber-500 hover:bg-amber-50 active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="font-score font-bold text-sm text-stone-900 leading-none">
                          {kanji}
                        </span>
                        <span className="font-mono text-[9px] text-stone-400 mt-0.5 font-semibold">
                          {noteName(pitches[idx], false)}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    onClick={onToggleChordMode}
                    className={`flex flex-col items-center justify-center rounded-lg border py-1 text-[10px] font-bold transition-all cursor-pointer ${
                      isChordMode
                        ? 'bg-amber-400 text-stone-900 border-amber-500'
                        : 'bg-stone-100 text-stone-600 border-stone-200'
                    }`}
                    title="和音モード"
                  >
                    <span>和音</span>
                    <span className="text-[8px]">{isChordMode ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              <div className="hidden sm:grid sm:grid-cols-13 gap-1">
                {KANJI_STRINGS.map((kanji, idx) => (
                  <button
                    key={idx}
                    onClick={() => onStringClick(idx)}
                    className="flex flex-col items-center justify-center rounded-lg border border-stone-200/90 bg-white py-1 shadow-2xs hover:border-amber-500 hover:bg-amber-50 active:scale-95 transition-all cursor-pointer group"
                  >
                    <span className="font-score font-bold text-sm sm:text-base text-stone-900 group-hover:text-amber-900 leading-none">
                      {kanji}
                    </span>
                    <span className="font-mono text-[9px] text-stone-400 group-hover:text-amber-700 mt-0.5">
                      {noteName(pitches[idx], false)}
                    </span>
                    <span className="font-mono text-[8px] text-stone-300 hidden md:inline">
                      {KEYBOARD_ROW1[idx]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-stone-600 pt-0.5 border-t border-stone-200/60">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={onToggleChordMode}
                    className={`hidden sm:inline-flex rounded-md px-2 py-0.5 text-xs font-semibold cursor-pointer border ${
                      isChordMode
                        ? 'bg-amber-400 text-stone-900 border-amber-500 font-bold'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                    }`}
                    title="和音重ね入力モード: ONのとき複数の弦を重ねて重音入力できます"
                  >
                    和音入力: {isChordMode ? 'ON' : 'OFF'}
                  </button>
                  {onToggleKotoBoard && (
                    <button
                      onClick={onToggleKotoBoard}
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold cursor-pointer border transition-colors ${
                        score.view.showKotoBoard
                          ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                      }`}
                      title="仮想箏ボードの表示"
                    >
                      箏ボード: {score.view.showKotoBoard ? '表示中' : '非表示'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="flex items-center gap-0.5 rounded-md border border-stone-300 bg-white px-2 py-0.5 font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-40 cursor-pointer text-xs"
                  >
                    <Undo2 className="h-3 w-3" /> 元に戻す
                  </button>
                  <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="flex items-center gap-0.5 rounded-md border border-stone-300 bg-white px-2 py-0.5 font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-40 cursor-pointer text-xs"
                  >
                    <Redo2 className="h-3 w-3" /> やり直し
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Ornaments */}
          {activeTab === 'ornaments' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-xs font-bold text-red-800 mr-1 shrink-0">左手奏法:</span>
                {['oshi1', 'oshi2', 'ato', 'hanashi', 'hikiiro', 'tsuki', 'yuri'].map(key => {
                  const orn = ORN_LABELS[key];
                  const isOn = selectedOrns[key];
                  return (
                    <button
                      key={key}
                      onClick={() => onToggleOrn(key)}
                      className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold transition-all cursor-pointer ${
                        isOn
                          ? 'bg-red-700 text-white shadow-2xs'
                          : 'border border-stone-300 bg-white text-stone-700 hover:border-red-400'
                      }`}
                      title={`${orn.desc} (キー: ${orn.key})`}
                    >
                      <b className={isOn ? 'text-white' : 'text-red-700 font-bold'}>{orn.short}</b>
                      <span>{orn.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-stone-200">
                <span className="text-xs font-bold text-stone-800 mr-1 shrink-0">右手爪技法:</span>
                {['sukui', 'kaki', 'hiki', 'trem', 'nagashi'].map(key => {
                  const orn = ORN_LABELS[key];
                  const isOn = selectedOrns[key];
                  return (
                    <button
                      key={key}
                      onClick={() => onToggleOrn(key)}
                      className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold transition-all cursor-pointer ${
                        isOn
                          ? 'bg-stone-900 text-white shadow-2xs'
                          : 'border border-stone-300 bg-white text-stone-700 hover:border-stone-400'
                      }`}
                      title={`${orn.desc} (キー: ${orn.key})`}
                    >
                      <b className={isOn ? 'text-white' : 'text-stone-900 font-bold'}>{orn.short}</b>
                      <span>{orn.label}</span>
                    </button>
                  );
                })}
              </div>

              {onSetFinger && (
                <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-stone-200">
                  <span className="text-xs font-bold text-amber-900 mr-1 shrink-0">指番号指定:</span>
                  {[
                    { num: 3, label: '中指', desc: '中指(3)' },
                    { num: 2, label: '食指', desc: '人差し指(2)' },
                    { num: 1, label: '拇指', desc: '親指(1)' }
                  ].map(f => {
                    const isSelected = currentFinger === f.num;
                    return (
                      <button
                        key={f.num}
                        onClick={() => onSetFinger(isSelected ? undefined : f.num)}
                        className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950 shadow-2xs ring-1 ring-amber-600'
                            : 'border border-amber-300 bg-amber-50/80 text-amber-950 hover:bg-amber-100'
                        }`}
                        title={f.desc}
                      >
                        <span className="font-sans font-extrabold">{f.num}</span>
                        <span>{f.label}</span>
                      </button>
                    );
                  })}
                  {currentFinger && (
                    <button
                      onClick={() => onSetFinger(undefined)}
                      className="text-[10px] text-stone-400 hover:text-stone-700 underline px-1 cursor-pointer"
                    >
                      指解除
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Measures, Loops, Settings */}
          {activeTab === 'measures' && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={onAddMeasure}
                  className="flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2.5 py-1 font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> 小節追加
                </button>
                <button
                  onClick={onInsertMeasure}
                  className="rounded-md border border-stone-300 bg-white px-2 py-1 font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  小節挿入
                </button>
                <button
                  onClick={onDeleteMeasure}
                  className="flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2 py-1 font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> 小節削除
                </button>
                <button
                  onClick={onCopyMeasure}
                  className="flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2 py-1 font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  <Copy className="h-3 w-3" /> コピー
                </button>
                <button
                  onClick={onPasteMeasure}
                  className="flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2 py-1 font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  <ClipboardPaste className="h-3 w-3" /> 貼り付け
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loopActive}
                    onChange={e => onSetLoop(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>A-Bループ</span>
                </label>
                {loopActive && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max={score.measures.length}
                      value={loopRange[0]}
                      onChange={e => onSetLoop(true, Number(e.target.value), loopRange[1])}
                      className="w-10 rounded border border-stone-300 bg-white px-1 text-center font-bold text-xs"
                    />
                    <span>〜</span>
                    <input
                      type="number"
                      min="1"
                      max={score.measures.length}
                      value={loopRange[1]}
                      onChange={e => onSetLoop(true, loopRange[0], Number(e.target.value))}
                      className="w-10 rounded border border-stone-300 bg-white px-1 text-center font-bold text-xs"
                    />
                    <span>小節</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-stone-500">再生速度:</span>
                  <select
                    value={speed}
                    onChange={e => onSetSpeed(Number(e.target.value))}
                    className="rounded-md border border-stone-300 bg-white px-1.5 py-1 font-semibold text-stone-800"
                  >
                    <option value="0.5">50%</option>
                    <option value="0.75">75%</option>
                    <option value="1">100%</option>
                    <option value="1.25">125%</option>
                  </select>
                </div>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={countIn}
                    onChange={e => onSetCountIn(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>カウントイン</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metronome}
                    onChange={e => onSetMetronome(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>拍子木</span>
                </label>
                <button
                  onClick={handleTapTempo}
                  className="rounded-md border border-stone-300 bg-white px-2 py-1 font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 inline mr-1 text-amber-600" />
                  {tapBadge || 'タップテンポ'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
