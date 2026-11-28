/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  KunkunshiScore,
  getStringNames,
  POSITION_KEYS,
  POSITIONS_BY_STRING,
  STRING_NAMES,
  ORN_LABELS,
  LeftHandOrn,
  RightHandOrn,
  getPitches,
  noteName,
  InputDivType
} from '../types/kunkunshi';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Copy,
  ClipboardPaste,
  Repeat,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Music,
  Sliders,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DockProps {
  score: KunkunshiScore;
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
  onToggleSanshinBoard?: () => void;
  currentFinger?: number;
  onSetFinger?: (finger: number | undefined) => void;
  /** 奏法を付ける相手（いま入れた音、または選んでいる音のあるマス）。無ければ null */
  ornTarget?: { key: string; label: string; orns: Record<string, boolean>; finger?: number } | null;
  onToggleOrnTarget?: (ornKey: string) => void;
  onSetFingerTarget?: (finger: number | undefined) => void;
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
  ornTarget,
  onToggleOrnTarget,
  onSetFingerTarget,
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
  onToggleSanshinBoard
}) => {
  // Mobile / compact panel state
  const [activeTab, setActiveTab] = useState<'strings' | 'measures'>('strings');
  const [showAllOrns, setShowAllOrns] = useState(false);

  // 次の音を入れて相手が変わったら「…ほか」を自動で閉じる（ずっと開いて勘所キーが下がったままにならないように）
  const targetKey = ornTarget?.key ?? null;
  useEffect(() => {
    setShowAllOrns(false);
  }, [targetKey]);

  // すぐ押せる奏法：この曲でよく使っている奏法3つ＋スクイ・打・掛など。
  // ♯・♭ は「…ほか」の中に入れる
  const quickOrnKeys = useMemo(() => {
    const counts: Record<string, number> = {};
    score.measures.forEach(m =>
      m.beats.forEach(b =>
        b.slots.forEach(sl => {
          Object.keys(ORN_LABELS).forEach(k => {
            if (k === 'oshi1' || k === 'oshi2') return;
            if ((sl as any)[k]) counts[k] = (counts[k] || 0) + 1;
          });
        })
      )
    );
    const used = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3);
    const list = [...used];
    for (const d of ['sukui', 'uchi', 'kake', 'ato', 'yuri']) {
      if (list.length >= 5) break;
      if (!list.includes(d)) list.push(d);
    }
    return list;
  }, [score.measures]);
  const [isExpanded, setIsExpanded] = useState(true);
  const pitches = getPitches(score);
  const stringNames = getStringNames();

  // Tap tempo helper
  const tapTimes = useRef<number[]>([]);
  const [tapBadge, setTapBadge] = useState<string | null>(null);

  const handleTapTempo = () => {
    const now = performance.now();
    const times = tapTimes.current;
    if (times.length && now - times[times.length - 1] > 2000) {
      tapTimes.current = [now];
      setTapBadge('タップ開始');
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
      setTapBadge('もう一度');
    }
  };

  // 奏法の一覧（左手・右手・指番号）。「…ほか」を押したときに出す
  const renderOrnPanel = (
    panelOrns: Record<string, boolean>,
    panelToggle: (key: string) => void,
    panelFinger: number | undefined,
    panelSetFinger: (finger: number | undefined) => void
  ) => (
            <div className="flex flex-col gap-1.5">
              {/* Left hand techniques */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-xs font-bold text-red-800 mr-1 shrink-0">左手:</span>
                {['oshi1', 'oshi2', 'uchi', 'kake', 'ato', 'suri', 'yuri'].map(key => {
                  const orn = ORN_LABELS[key];
                  const isOn = panelOrns[key];
                  return (
                    <button
                      key={key}
                      onClick={() => panelToggle(key)}
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

              {/* Right hand techniques */}
              <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-stone-200">
                <span className="text-xs font-bold text-stone-800 mr-1 shrink-0">右手（爪）:</span>
                {['sukui', 'trem', 'keshi'].map(key => {
                  const orn = ORN_LABELS[key];
                  const isOn = panelOrns[key];
                  return (
                    <button
                      key={key}
                      onClick={() => panelToggle(key)}
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

              {/* 押さえる指（左手）：人・中・小 */}
              {(
                <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-stone-200">
                  <span className="text-xs font-bold text-amber-900 mr-1 shrink-0">押さえる指（左手）:</span>
                  {[
                    { num: 1, short: '人', label: '人差指', desc: '人差し指で押さえる' },
                    { num: 2, short: '中', label: '中指', desc: '中指で押さえる' },
                    { num: 3, short: '小', label: '小指', desc: '小指で押さえる' }
                  ].map(f => {
                    const isSelected = panelFinger === f.num;
                    return (
                      <button
                        key={f.num}
                        onClick={() => panelSetFinger(isSelected ? undefined : f.num)}
                        className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950 shadow-2xs ring-1 ring-amber-600'
                            : 'border border-amber-300 bg-amber-50/80 text-amber-950 hover:bg-amber-100'
                        }`}
                        title={f.desc}
                      >
                        <span className="font-score font-extrabold">{f.short}</span>
                        <span>{f.label}</span>
                      </button>
                    );
                  })}
                  {panelFinger && (
                    <button
                      onClick={() => panelSetFinger(undefined)}
                      className="text-[10px] text-stone-400 hover:text-stone-700 underline px-1 cursor-pointer"
                    >
                      解除
                    </button>
                  )}
                </div>
              )}
            </div>
  );

  return (
    <div className="w-full overflow-hidden rounded-xl sm:rounded-2xl border border-indigo-900/20 bg-stone-50/95 shadow-lg backdrop-blur-md no-print transition-all">
      {/* 紅型の色の細い帯 */}
      <div className="bingata-stripe h-1" aria-hidden="true" />
      {/* Top Controller Bar (Playback, Lengths, Step Nav, Expand/Collapse) */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 px-2 py-1 sm:py-1.5 border-b border-stone-200 text-xs">
        {/* Left: Play / Stop / Step Navigation */}
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

          {/* Step Back / Forward arrows */}
          {onPrevSlot && onNextSlot && (
            <div className="flex items-center rounded-md border border-stone-300 bg-white">
              <button
                onClick={onPrevSlot}
                className="p-1 hover:bg-stone-100 text-stone-700 cursor-pointer"
                title="前へ移動 (←)"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                onClick={onNextSlot}
                className="p-1 hover:bg-stone-100 text-stone-700 border-l border-stone-200 cursor-pointer"
                title="次へ移動 (→)"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Cursor Position Badge */}
          <div className="flex items-center gap-0.5 rounded bg-stone-200/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-stone-800">
            <span>第{currentCursor.m + 1}小節</span>
            <span className="text-stone-400">/</span>
            <span>{currentCursor.b + 1}拍</span>
          </div>
        </div>

        {/* Center: Note Duration Pickers & Rest/Tie（スマホでは下の行に1列で） */}
        <div className="order-last sm:order-none w-full sm:w-auto flex items-center justify-between sm:justify-start gap-0.5 sm:gap-1">
          {[
            { div: 1, label: '♩', title: '4分音符 (1拍1音 / Qキー)' },
            { div: 2, label: '♪♪', title: '8分音符 (1拍を2音に等分 / Wキー)' },
            { div: '8_16_16', label: '♪♬', title: '裏拍のみ2分割 (表8分＋裏16分×2)' },
            { div: '16_16_8', label: '♬♪', title: '表拍のみ2分割 (表16分×2＋裏8分)' },
            { div: 3, label: '3連', title: '3連符 (1拍を3音に分割 / Eキー)' },
            { div: 4, label: '♬', title: '16分音符 (1拍を4音に分割 / Rキー)' }
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

          {/* Rest & Clear */}
          <button
            onClick={onInputRest}
            className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            title="休符 (P)"
          >
            ○
          </button>
          <button
            onClick={onInputTie}
            className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            title="延ばし (T)"
          >
            ー
          </button>
          {onInputRepeat2 && (
            <button
              onClick={onInputRepeat2}
              className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-xs font-bold text-stone-800 hover:bg-amber-50 hover:border-amber-400 cursor-pointer"
              title="2拍繰り返し記号 (く / 重ね)"
            >
              く
            </button>
          )}
          <button
            onClick={onInputClear}
            className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            title="消す (Delete)"
          >
            消
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
              勘所キー
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
              小節
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded border border-stone-300 bg-white p-1 text-stone-600 hover:bg-stone-100 cursor-pointer"
            title={isExpanded ? 'パレットを折りたたむ' : 'パレットを展開する'}
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Tab Body */}
      {isExpanded && (
        <div className="p-1 sm:p-2 short:p-0.5 max-h-[52dvh] overflow-y-auto">
          {/* TAB 1: 勘所キー（合〜九） */}
          {activeTab === 'strings' && (
            <div className="flex flex-col gap-1">
              {/* 奏法の行：音を入れた直後（または音のあるマスを選んだとき）だけ中身が出る。
                  高さはいつも確保しておき、勘所キーの位置がずれて押し間違えないようにする */}
              <div className="min-h-[30px] flex flex-wrap items-center gap-1 rounded-lg border border-dashed border-stone-200 bg-stone-50/70 px-1.5 py-0.5">
                {ornTarget ? (
                  <>
                    <span className="text-[11px] font-bold text-stone-500 shrink-0">
                      「<span className="font-score text-stone-900">{ornTarget.label}</span>」に：
                    </span>
                    {[
                      ...quickOrnKeys,
                      // いま付いている奏法は、外せるように必ず表示する
                      ...Object.keys(ornTarget.orns).filter(k => ornTarget.orns[k] && !quickOrnKeys.includes(k) && ORN_LABELS[k])
                    ].map(key => {
                      const orn = ORN_LABELS[key];
                      const isOn = ornTarget.orns[key];
                      return (
                        <button
                          key={key}
                          onClick={() => onToggleOrnTarget?.(key)}
                          className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold transition-all cursor-pointer ${
                            isOn
                              ? 'bg-red-700 text-white shadow-2xs'
                              : 'border border-stone-300 bg-white text-stone-700 hover:border-red-400'
                          }`}
                          title={`${orn.desc}${orn.key ? ` (キー: ${orn.key})` : ''}`}
                          aria-pressed={!!isOn}
                        >
                          <b className={isOn ? 'text-white' : 'text-red-700 font-bold'}>{orn.short}</b>
                          <span className="hidden sm:inline">{orn.label}</span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setShowAllOrns(v => !v)}
                      className={`rounded-md px-2 py-0.5 text-xs font-bold cursor-pointer border ${
                        showAllOrns ? 'border-stone-800 bg-stone-800 text-white' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
                      }`}
                      title="ほかの奏法と指番号"
                      aria-expanded={showAllOrns}
                    >
                      {showAllOrns ? '閉じる' : '…ほか'}
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] text-stone-400">音を入れると、ここにその音の奏法（スクイ・打・掛など）が出ます</span>
                )}
              </div>
              {ornTarget && showAllOrns && (
                <div className="rounded-lg border border-stone-200 bg-white p-1.5">
                  {renderOrnPanel(ornTarget.orns, k => onToggleOrnTarget?.(k), ornTarget.finger, f => onSetFingerTarget?.(f))}
                </div>
              )}

              {/* 勘所キー：弦ごとにまとめる（スマホは3段、広い画面は1列に横並び） */}
              <div className="flex flex-col sm:flex-row gap-1">
                {[0, 1, 2].map(str => (
                  <div
                    key={str}
                    className="flex items-stretch gap-0.5 rounded-lg bg-stone-100/80 p-0.5"
                    style={{ flex: POSITIONS_BY_STRING[str].length }}
                  >
                    <span className="flex w-5 shrink-0 items-center justify-center font-score text-[10px] font-bold leading-tight text-stone-500 [writing-mode:vertical-rl]">
                      {STRING_NAMES[str]}
                    </span>
                    {POSITIONS_BY_STRING[str].map(idx => (
                      <button
                        key={idx}
                        onClick={() => onStringClick(idx)}
                        className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-md border border-stone-200/90 bg-white py-1 shadow-2xs hover:border-amber-500 hover:bg-amber-50 active:scale-95 transition-all cursor-pointer group"
                        aria-label={`${stringNames[idx]}（${STRING_NAMES[str]}） ${noteName(pitches[idx])}`}
                      >
                        <span className="font-score font-bold text-base text-stone-900 group-hover:text-amber-900 leading-none whitespace-nowrap">
                          {stringNames[idx]}
                        </span>
                        <span className="font-mono text-[9px] text-stone-400 group-hover:text-amber-700 mt-0.5">
                          {noteName(pitches[idx], false)}
                        </span>
                        <span className="font-mono text-[8px] text-stone-300 hidden md:inline">{POSITION_KEYS[idx]}</span>
                      </button>
                    ))}
                    {str === 2 && (
                      <button
                        onClick={onToggleChordMode}
                        className={`sm:hidden flex flex-col items-center justify-center rounded-md border px-1 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                          isChordMode ? 'bg-amber-400 text-stone-900 border-amber-500' : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                        title="合わせ（2本同時）入力モード"
                      >
                        <span>合わせ</span>
                        <span className="text-[8px]">{isChordMode ? 'ON' : 'OFF'}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* 合わせ・仮想三線・元に戻す */}
              <div className="flex items-center justify-between text-xs text-stone-600 pt-0.5 border-t border-stone-200/60">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={onToggleChordMode}
                    className={`hidden sm:inline-flex rounded-md px-2 py-0.5 text-xs font-semibold cursor-pointer border ${
                      isChordMode
                        ? 'bg-amber-400 text-stone-900 border-amber-500 font-bold'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                    }`}
                    title="合わせモード: ONにすると同じマスに別の弦の音を重ねて入力できます（Shiftキーを押しながら入力も可）"
                  >
                    合わせ {isChordMode ? 'ON' : 'OFF'}
                  </button>
                  {onToggleSanshinBoard && (
                    <button
                      onClick={onToggleSanshinBoard}
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold cursor-pointer border transition-colors ${
                        score.view.showSanshinBoard
                          ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                      }`}
                      title="入力パネルの上に三線の棹（勘所）を表示・非表示"
                    >
                      仮想三線 {score.view.showSanshinBoard ? '表示中' : '非表示'}
                    </button>
                  )}
                  <span className="text-[10px] text-stone-400 hidden sm:inline">
                    ※ 勘所キーを押すと音が入ってカーソルが進みます
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="flex items-center gap-0.5 rounded-md border border-stone-300 bg-white px-2 py-0.5 font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-40 cursor-pointer text-xs"
                  >
                    <Undo2 className="h-3 w-3" /> 戻す
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

          {/* TAB 3: Measures, Loops, Settings */}
          {activeTab === 'measures' && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
              {/* Measure Operations */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={onAddMeasure}
                  className="flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2.5 py-1 font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> 末尾に小節追加
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
                  <Trash2 className="h-3 w-3" /> 削除
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
                  <ClipboardPaste className="h-3 w-3" /> 貼付
                </button>
              </div>

              {/* Loop, Speed, Count in, Volume */}
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loopActive}
                    onChange={e => onSetLoop(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>ループ</span>
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
                  <span className="text-stone-500">速度:</span>
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
                  <span>前カウント</span>
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
