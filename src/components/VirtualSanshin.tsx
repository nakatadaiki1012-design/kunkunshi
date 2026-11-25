/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { chordFromNotes, FINGER_COLORS, FINGER_NAMES } from '../utils/fingering.js';
import { X, ChevronDown, ChevronUp, FlipHorizontal2 } from 'lucide-react';

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
  /** 手の位置（本手／尺位） */
  handPosition?: 'low' | 'shaku';
  /** マスに書いた指番号 */
  activeFinger?: number;
  /** 音が出るたびに変わる値（同じ音をもう一度入れた時も、光らせ直す） */
  noteEvent?: string;
  onClose?: () => void;
}

/* ---------- 棹の図の寸法 ----------
   勘所の間隔は本物と同じ比率（弦長 約610mm の三線で、開放弦から n 半音上の位置）。
   上駒から 九 の少し先（約11半音）までを描く */
const SCALE = 610;
const posMM = (n: number) => SCALE * (1 - Math.pow(2, -n / 12));
const W = 1000, H = 190;
const NUT_X = 92, END_X = 980;                    // 上駒と、図の右の端
const MM_END = posMM(11.2);
const xOf = (n: number) => NUT_X + (posMM(n) / MM_END) * (END_X - NUT_X);
// 弦の位置（上から 男弦・中弦・女弦）。棹は胴の方へ少し広がる
const neckHalf = (x: number) => 30 + ((x - NUT_X) / (END_X - NUT_X)) * 6;
const strY = (s: number, x: number) => H / 2 + (s - 1) * (17 + ((x - NUT_X) / (END_X - NUT_X)) * 4);
const MARKS: [number, string][] = [[2, '乙 上 五'], [4, '老 中 六'], [5, '下老 尺 七'], [7, '八'], [9, '九']];

/**
 * 仮想三線：棹を横から見た図。いまの音の勘所が、押さえる指の色で光る（開放弦は弦ごと光る）。
 * 勘所を押すと音が鳴って譜面に入る。再生中は鳴っている弦がふるえる。左右反転できる（先生と向かい合った向き）。
 */
export const VirtualSanshin: React.FC<VirtualSanshinProps> = ({
  score,
  onSelectString,
  activeStrings = [],
  activeOshi = 0,
  handPosition = 'low',
  activeFinger,
  noteEvent,
  onClose
}) => {
  const pitches = getPitches(score);
  const open = getOpenStrings(score);
  const [vibrating, setVibrating] = useState<Record<number, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mirror, setMirror] = useState(() => {
    try {
      return localStorage.getItem('kunkunshi.neckMirror') === '1';
    } catch {
      return false;
    }
  });
  const toggleMirror = () => {
    setMirror(m => {
      try {
        localStorage.setItem('kunkunshi.neckMirror', m ? '0' : '1');
      } catch {
        // 保存できなくても動く
      }
      return !m;
    });
  };

  useEffect(() => {
    // 音源が弦を鳴らしたら、その弦をふるわせる
    const unsubscribe = sanshinSynth.onStringTrigger(str => {
      setVibrating(prev => ({ ...prev, [str]: true }));
      setTimeout(() => setVibrating(prev => ({ ...prev, [str]: false })), 380);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handlePress = (pos: number) => {
    if (onSelectString) onSelectString(pos);
    else sanshinSynth.pluck(KANDOKORO[pos].str, pitches[pos], 0, 0.85);
  };

  // いまの音：押さえる場所と指（本手／尺位・マスの指番号を考える）
  const chord = chordFromNotes(activeStrings, activeOshi, { position: handPosition, finger: activeFinger });
  const pressed = [0, 1, 2]
    .filter(s => chord.frets[s] > 0)
    .map(s => ({ s, off: chord.frets[s] as number, finger: chord.fingers[s] as number }));
  const openOn: number[] = chord.open;
  const label = activeStrings.map(p => KANDOKORO[p]?.name).filter(Boolean).join('');
  const acc = activeOshi === 1 ? '♯' : activeOshi === 2 ? '♭' : '';
  const sub = [
    ...pressed.map(p => `${STRING_NAMES[p.s]}・${FINGER_NAMES[p.finger]}`),
    ...openOn.map(s => `${STRING_NAMES[s]}・開放`)
  ].join(' ／ ');

  // 文字は反転させない（図だけを反転）
  const T = (x: number) => (mirror ? W - x : x);

  return (
    <div className="w-full select-none rounded-xl border border-stone-700 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-2 sm:p-3 shadow-xl text-stone-100">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200/90 pb-1.5">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 self-center"></span>
          <span className="font-score font-bold text-sm text-amber-100 shrink-0">仮想三線</span>
          <span className="font-score text-xl font-bold text-amber-200 leading-none">{label ? acc + label : '—'}</span>
          <span className="text-[11px] text-stone-300 truncate">
            {label
              ? sub + (pressed.length ? (chord.position === 'shaku' ? '（尺位）' : '（本手）') : '')
              : '音の入ったマスを選ぶと、押さえる場所が光ります'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMirror}
            className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-bold cursor-pointer ${
              mirror ? 'border-amber-300 bg-amber-400 text-stone-950' : 'border-stone-700 bg-stone-900 text-amber-200 hover:text-white'
            }`}
            title="図を左右反転（向かい合った先生から見た向き）"
            aria-pressed={mirror}
          >
            <FlipHorizontal2 className="h-3 w-3" /> 左右反転
          </button>
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

      {!isCollapsed && (
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full min-w-[560px]" role="img" aria-label="三線の棹と勘所">
            <defs>
              <linearGradient id="vs-neck" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3a3632" />
                <stop offset="0.18" stopColor="#141210" />
                <stop offset="0.5" stopColor="#0b0a09" />
                <stop offset="0.82" stopColor="#141210" />
                <stop offset="1" stopColor="#2c2824" />
              </linearGradient>
              <linearGradient id="vs-sheen" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.07" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="vs-glow">
                <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.55" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
              <filter id="vs-blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            <g transform={mirror ? `translate(${W} 0) scale(-1 1)` : undefined}>
              {/* 天（ちら）：上駒の先で、少し反って先が細くなる */}
              <path
                d={`M ${NUT_X} ${H / 2 - 30} C ${NUT_X - 40} ${H / 2 - 30}, 30 ${H / 2 - 40}, 8 ${H / 2 - 52}
                    C 2 ${H / 2 - 40}, 6 ${H / 2 + 16}, 20 ${H / 2 + 24}
                    C 50 ${H / 2 + 30}, ${NUT_X - 30} ${H / 2 + 30}, ${NUT_X} ${H / 2 + 30} Z`}
                fill="url(#vs-neck)"
                stroke="#000"
                strokeWidth="1"
              />
              {/* カラクイ（糸巻き） */}
              {[[30, -1], [52, 1], [74, -1]].map(([x, side], i) => (
                <g key={i}>
                  <rect x={x - 3} y={side < 0 ? H / 2 - 78 : H / 2 + 22} width="6" height="56" rx="3" fill="#1d1511" />
                  <ellipse cx={x} cy={side < 0 ? H / 2 - 80 : H / 2 + 80} rx="7" ry="5" fill="#2a1d17" />
                </g>
              ))}
              {/* 棹 */}
              <path
                d={`M ${NUT_X} ${H / 2 - neckHalf(NUT_X)} L ${END_X} ${H / 2 - neckHalf(END_X)} L ${END_X} ${H / 2 + neckHalf(END_X)} L ${NUT_X} ${H / 2 + neckHalf(NUT_X)} Z`}
                fill="url(#vs-neck)"
                stroke="#000"
                strokeWidth="1"
              />
              <path
                d={`M ${NUT_X} ${H / 2 - neckHalf(NUT_X)} L ${END_X} ${H / 2 - neckHalf(END_X)} L ${END_X} ${H / 2 + neckHalf(END_X)} L ${NUT_X} ${H / 2 + neckHalf(NUT_X)} Z`}
                fill="url(#vs-sheen)"
              />
              {/* 上駒（うちじる） */}
              <rect x={NUT_X - 5} y={H / 2 - 30} width="6" height="60" rx="1.5" fill="#efe3c8" />

              {/* 勘所シール（練習用の目印）：本手で押さえる指の色の細い線 */}
              {[[2, 1], [4, 2], [5, 4], [7, 2], [9, 4]].map(([n, f]) => {
                const x = xOf(n);
                return (
                  <line key={n} x1={x} x2={x} y1={H / 2 - neckHalf(x) + 3} y2={H / 2 + neckHalf(x) - 3} stroke={FINGER_COLORS[f]} strokeOpacity="0.55" strokeWidth="3" />
                );
              })}

              {/* 弦：開放で鳴らす弦は、弦ごと水色に光る。鳴っている弦はふるえる */}
              {[0, 1, 2].map(s => {
                const isOpen = openOn.includes(s);
                const vib = vibrating[s];
                const y0 = strY(s, NUT_X), y1 = strY(s, END_X);
                return (
                  <g key={s} className={vib ? 'vs-vibrate' : undefined}>
                    {isOpen && <line x1={NUT_X} y1={y0} x2={END_X} y2={y1} stroke="#5fe0ff" strokeWidth="9" strokeOpacity="0.45" filter="url(#vs-blur)" />}
                    <line
                      x1={NUT_X - 2}
                      y1={y0}
                      x2={END_X}
                      y2={y1}
                      stroke={isOpen ? '#a8f0ff' : vib ? '#ffe08f' : '#efe6d0'}
                      strokeWidth={[2.6, 2.1, 1.7][s]}
                    />
                  </g>
                );
              })}

              {/* 押さえる場所：指の色で光る（♯・♭は半音ずれた所） */}
              {pressed.map(p => {
                const x = xOf(p.off), y = strY(p.s, x), color = FINGER_COLORS[p.finger];
                return (
                  <g key={`${p.s}-${noteEvent || ''}`} className="vs-press">
                    <circle cx={x} cy={y} r="26" fill={color} opacity="0.35" filter="url(#vs-blur)" />
                    <circle cx={x} cy={y} r="17" fill="url(#vs-glow)" opacity="0.9" />
                    <circle cx={x} cy={y} r="9.5" fill={color} stroke="#fff" strokeWidth="2" />
                  </g>
                );
              })}

              {/* 勘所のボタン（押すと鳴って入力される） */}
              {KANDOKORO.map((k, pos) => {
                if (k.off === 0) return null;
                const x = xOf(k.off), y = strY(k.str, x);
                return (
                  <circle
                    key={pos}
                    cx={x}
                    cy={y}
                    r="12"
                    fill="transparent"
                    className="cursor-pointer hover:fill-amber-300/30"
                    onClick={() => handlePress(pos)}
                  >
                    <title>{`${k.name}（${k.yomi}）${STRING_NAMES[k.str]}・${noteName(pitches[pos])}　キー: ${POSITION_KEYS[pos]}`}</title>
                  </circle>
                );
              })}
              {/* 開放弦のボタン（上駒の上） */}
              {KANDOKORO.map((k, pos) =>
                k.off === 0 ? (
                  <circle key={pos} cx={NUT_X - 2} cy={strY(k.str, NUT_X)} r="11" fill="transparent" className="cursor-pointer hover:fill-cyan-300/30" onClick={() => handlePress(pos)}>
                    <title>{`${k.name}（${STRING_NAMES[k.str]}・開放）${noteName(pitches[pos])}　キー: ${POSITION_KEYS[pos]}`}</title>
                  </circle>
                ) : null
              )}
            </g>

            {/* 文字（反転しない） */}
            {[0, 1, 2].map(s => (
              <text key={s} x={T(NUT_X - 26)} y={strY(s, NUT_X) + 4} textAnchor="middle" className="fill-amber-100 font-score" fontSize="12" fontWeight="700">
                {STRING_NAMES[s].slice(0, 1)}
              </text>
            ))}
            {MARKS.map(([n, t]) => (
              <text key={n} x={T(xOf(n))} y={H / 2 + neckHalf(xOf(n)) + 18} textAnchor="middle" className="fill-stone-300 font-score" fontSize="12">
                {t}
              </text>
            ))}
            <text x={T(NUT_X)} y={H / 2 + neckHalf(NUT_X) + 18} textAnchor="middle" className="fill-stone-400 font-score" fontSize="11">
              合 四 工
            </text>
            {pressed.map(p => {
              const x = xOf(p.off), y = strY(p.s, x);
              return (
                <text key={`t${p.s}`} x={T(x)} y={y + 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800">
                  {FINGER_NAMES[p.finger].slice(0, 1)}
                </text>
              );
            })}
            <text x={T(W - 14)} y={18} textAnchor={mirror ? 'start' : 'end'} className="fill-stone-400" fontSize="11">
              {mirror ? '← 胴の方' : '胴の方 →'}
            </text>
          </svg>
          <p className="mt-1 text-[10px] text-stone-400">
            上から 男弦・中弦・女弦。光っている所が、いまの音で押さえる場所です（色は指：
            <span style={{ color: FINGER_COLORS[1] }}>●人差指</span> <span style={{ color: FINGER_COLORS[2] }}>●中指</span>{' '}
            <span style={{ color: FINGER_COLORS[4] }}>●小指</span>、水色の弦は開放）。勘所の間隔は本物の三線と同じ比率です。押すと音が鳴って入力されます。
          </p>
        </div>
      )}
    </div>
  );
};
