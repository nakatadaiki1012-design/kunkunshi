/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  KunkunshiScore,
  KANDOKORO,
  STRING_NAMES,
  POSITION_KEYS,
  getPitches,
  getOpenStrings,
  noteName
} from '../types/kunkunshi';
import { sanshinSynth } from '../audio/sanshinSynth';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

// 3Dの手（three.js）は大きいので、開いた時だけ読み込む
const Hand3DPanel = lazy(() => import('./Hand3DPanel'));

interface VirtualSanshinProps {
  score: KunkunshiScore;
  /** 勘所を押したとき（勘所の番号） */
  onSelectString?: (pos: number) => void;
  /** いまのマスに入っている勘所の番号 */
  activeStrings?: number[];
  /** いまのマスの ♯・♭（0=なし 1=♯ 2=♭） */
  activeOshi?: number;
  /** 演奏中か */
  playing?: boolean;
  /** 3Dの手の位置（本手／尺位） */
  handPosition?: 'low' | 'shaku';
  /** マスに書いた指番号 */
  activeFinger?: number;
  /** 音が出るたびに変わる値 */
  noteEvent?: string;
  onClose?: () => void;
}

/** 開放弦から何半音上かを、棹の左端からの位置（%）にする（実際の勘所の間隔に近い） */
const xOf = (off: number) => (off === 0 ? 4 : 4 + (1 - Math.pow(2, -off / 12)) * 175);

/**
 * 仮想三線：棹（さお）を横に寝かせた図。上から 女弦・中弦・男弦。
 * 勘所を押すと音が鳴って譜面に入る。再生中は鳴っている弦が光る。
 */
export const VirtualSanshin: React.FC<VirtualSanshinProps> = ({ score, onSelectString, activeStrings = [], activeOshi = 0, playing = false, handPosition = 'low', activeFinger, noteEvent, onClose }) => {
  const pitches = getPitches(score);
  const open = getOpenStrings(score);
  const [vibrating, setVibrating] = useState<Record<number, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mode, setMode] = useState<'hand' | 'board'>(() => {
    try {
      return localStorage.getItem('kunkunshi.sanshinMode') === 'board' ? 'board' : 'hand';
    } catch {
      return 'hand';
    }
  });
  const changeMode = (m: 'hand' | 'board') => {
    setMode(m);
    try {
      localStorage.setItem('kunkunshi.sanshinMode', m);
    } catch {
      // 保存できなくても動く
    }
  };

  useEffect(() => {
    // 音源が弦を鳴らしたら、その弦を光らせる
    const unsubscribe = sanshinSynth.onStringTrigger(str => {
      setVibrating(prev => ({ ...prev, [str]: true }));
      setTimeout(() => setVibrating(prev => ({ ...prev, [str]: false })), 400);
    });
    return unsubscribe;
  }, []);

  const handlePress = (pos: number) => {
    if (onSelectString) {
      onSelectString(pos); // 入力側で音も鳴らす
    } else {
      sanshinSynth.pluck(KANDOKORO[pos].str, pitches[pos], 0, 0.85);
    }
  };

  return (
    <div className="w-full select-none rounded-xl border border-stone-700 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-2 sm:p-3 shadow-xl text-stone-100">
      <div className="flex items-center justify-between text-xs text-amber-200/90 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
          <span className="font-score font-bold text-sm text-amber-100">仮想三線</span>
          <div className="inline-flex rounded-md border border-stone-700 bg-stone-900 p-0.5">
            {([['hand', '3Dの手'], ['board', '棹の図']] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => changeMode(k)}
                className={`rounded px-2 py-0.5 text-[11px] font-bold cursor-pointer ${
                  mode === k ? 'bg-amber-400 text-stone-950' : 'text-amber-100 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <span className="hidden sm:inline text-[11px] text-stone-400">
            {STRING_NAMES.map((n, i) => `${n} ${noteName(open[i], false)}`).join('・')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 rounded border border-stone-700 bg-stone-900 px-2 py-0.5 text-[11px] text-amber-200 hover:text-white cursor-pointer"
          >
            {isCollapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {isCollapsed ? '開く' : 'たたむ'}
          </button>
          {onClose && (
            <button onClick={onClose} className="rounded p-1 text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer" aria-label="閉じる">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && mode === 'hand' && (
        <Suspense fallback={<div className="py-10 text-center text-sm text-amber-100">3Dの手を読み込んでいます…</div>}>
          <Hand3DPanel notes={activeStrings} oshi={activeOshi} playing={playing} position={handPosition} finger={activeFinger} noteEvent={noteEvent} />
        </Suspense>
      )}

      {!isCollapsed && mode === 'board' && (
        <div className="overflow-x-auto">
          {/* 棹：左が天（糸巻き側）、右が胴側 */}
          <div className="relative min-w-[520px] rounded-lg bg-gradient-to-b from-stone-800 via-black to-stone-800 border-y-2 border-amber-900/70 shadow-inner" style={{ height: 156 }}>
            {/* 胴（蛇皮張り）と駒（ウマ） */}
            <div className="jabi absolute right-0 top-0 bottom-0 w-[14%] rounded-r-lg border-l-4 border-stone-950" aria-hidden="true" />
            <div className="absolute right-[6%] top-3 bottom-3 w-1.5 rounded bg-amber-200/90 shadow" aria-hidden="true" />
            {/* 上駒 */}
            <div className="absolute left-[3%] top-2 bottom-2 w-1 rounded bg-amber-100/70" />
            {[2, 1, 0].map((str, row) => {
              const y = 28 + row * 50;
              const isVib = vibrating[str];
              return (
                <React.Fragment key={str}>
                  {/* 弦 */}
                  <div
                    className={`absolute left-[3%] right-0 transition-all ${
                      isVib ? 'bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.9)]' : 'bg-stone-300/80'
                    }`}
                    style={{ top: y, height: str === 0 ? 3 : str === 1 ? 2 : 1.5 }}
                  />
                  <span className="absolute left-1 font-score text-[10px] font-bold text-stone-400 -translate-y-1/2" style={{ top: y }}>
                    {STRING_NAMES[str].slice(0, 1)}
                  </span>
                  {/* 勘所 */}
                  {KANDOKORO.map((k, pos) =>
                    k.str !== str ? null : (
                      <button
                        key={pos}
                        onClick={() => handlePress(pos)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center rounded-full border cursor-pointer transition-all active:scale-90 ${
                          activeStrings.includes(pos)
                            ? 'bg-amber-400 text-stone-950 border-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                            : 'bg-stone-900/90 text-amber-50 border-amber-700/60 hover:bg-amber-900 hover:border-amber-400'
                        }`}
                        style={{ left: `${xOf(k.off)}%`, top: y, width: 40, height: 40 }}
                        title={`${k.name}（${k.yomi}）${STRING_NAMES[k.str]}・${k.finger}・${noteName(pitches[pos])}　キー: ${POSITION_KEYS[pos]}`}
                        aria-label={`${k.name} ${noteName(pitches[pos])}`}
                      >
                        <span className={`font-score font-bold leading-none ${k.name.length > 1 ? 'text-[11px]' : 'text-base'}`}>{k.name}</span>
                        <span className="text-[8px] font-mono leading-none opacity-70">{noteName(pitches[pos], false)}</span>
                      </button>
                    )
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <p className="mt-1 text-[10px] text-stone-400">
            左が糸巻き（カラクイ）側、右が胴側です。丸い印（勘所）を押すと音が鳴って、譜面のカーソルの位置に入ります。
          </p>
        </div>
      )}
    </div>
  );
};
