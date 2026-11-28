/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  KunkunshiScore,
  CursorPosition,
  POSITION_NAMES,
  LEFT_HAND_ORNS,
  RIGHT_HAND_ORNS,
  ORN_MARKS,
  getPitches,
  getTuningLabel,
  noteName
} from '../types/kunkunshi';
import { resolveSlot, slotOffsetInBeat } from '../audio/timeline';
import { GLYPHS } from '../utils/glyphs';
import {
  spell,
  stepToMidi,
  midiToPosition,
  measureEvents,
  StaffEvent,
  WRITTEN_OFFSET,
  BOTTOM_LINE_STEP,
  stepDoremi
} from '../utils/staff';
import { Plus, Pencil, MousePointer2 } from 'lucide-react';

interface ScoreSheetStaffProps {
  score: KunkunshiScore;
  cursor: CursorPosition;
  currentPlayKey: string | null;
  selectedRange?: [number, number] | null;
  selectedSlotKeys?: Set<string>;
  onSlotClick: (mIdx: number, bIdx: number, sIdx: number, low?: boolean, shiftKey?: boolean, ctrlKey?: boolean) => void;
  onMeasureClick: (mIdx: number) => void;
  /** 五線の上をクリックして音を入れる（実際の音の MIDI 番号） */
  onStaffInput?: (mIdx: number, bIdx: number, sIdx: number, midi: number) => void;
  onAddMeasure?: () => void;
  /** 印刷・演奏モードでは、入力の道具を出さない */
  readOnly?: boolean;
}

/* ---------- 寸法（SVG の単位） ---------- */
const SP = 9;                       // 五線の線と線の間
const VIEW_W = 1000;
const STAFF_TOP = 46;               // 五線のいちばん上の線
const STAFF_BOTTOM = STAFF_TOP + 4 * SP;
const ROW_H = 150;
const yOfStep = (step: number) => STAFF_BOTTOM - (step - BOTTOM_LINE_STEP) * (SP / 2);
const stepOfY = (y: number) => BOTTOM_LINE_STEP + Math.round((STAFF_BOTTOM - y) / (SP / 2));
const MID_STEP = BOTTOM_LINE_STEP + 4;   // まん中の線（書く高さ B4）

const glyph = (name: string, x: number, y: number, fill = '#1c1917', scale = SP) => {
  const g = GLYPHS[name];
  if (!g) return null;
  return <path d={g.d} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale})`} fill={fill} />;
};
const gw = (name: string) => (GLYPHS[name]?.w ?? 1) * SP;

/**
 * 五線譜：工工四と同じ中身を、ト音記号（下に8）の五線譜で書く。
 * 書く道具（えんぴつ）を選ぶと、五線の上をクリックした高さの音が、その勘所でマスに入る。
 */
export const ScoreSheetStaff: React.FC<ScoreSheetStaffProps> = ({
  score,
  cursor,
  currentPlayKey,
  selectedSlotKeys,
  onSlotClick,
  onMeasureClick,
  onStaffInput,
  onAddMeasure,
  readOnly
}) => {
  const pitches = getPitches(score);
  const perLine = Math.max(1, score.view.perLine || 4);
  const bpm = score.beatsPerMeasure;
  const [writeMode, setWriteMode] = useState(true);
  const [accSel, setAccSel] = useState<0 | 1 | -1>(0);
  const [hover, setHover] = useState<{ key: string; step: number; x: number; row: number } | null>(null);

  // 小節ごとの音符・休符（前の小節から続く延ばしはタイ）
  const allEvents = useMemo(() => {
    const out: StaffEvent[][] = [];
    let prev: number[] | null = null;
    score.measures.forEach((ms, m) => {
      const r = measureEvents(ms.beats, m, pitches, prev, (mm, b, s) => resolveSlot(score, mm, b, s));
      out.push(r.events);
      prev = r.lastSounding;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score.measures, score.tuning]);

  const rows: number[][] = [];
  for (let i = 0; i < score.measures.length; i += perLine) {
    rows.push(Array.from({ length: Math.min(perLine, score.measures.length - i) }, (_, k) => i + k));
  }

  const rowStartX = (r: number) => (r === 0 ? 92 : 62);
  const measureW = (r: number) => (VIEW_W - 8 - rowStartX(r)) / perLine;
  const PAD_L = 16, PAD_R = 10;

  const slotRange = (m: number, b: number, s: number, r: number, col: number) => {
    const mx = rowStartX(r) + col * measureW(r), bw = (measureW(r) - PAD_L - PAD_R) / bpm;
    const beat = score.measures[m].beats[b];
    const a = slotOffsetInBeat(beat, s), z = s + 1 < beat.slots.length ? slotOffsetInBeat(beat, s + 1) : 1;
    return { x0: mx + PAD_L + (b + a) * bw, x1: mx + PAD_L + (b + z) * bw, bw };
  };

  // 前の行から続くタイ（行の頭で描く）
  const renderRow = (row: number[], r: number) => {
    const els: React.ReactNode[] = [];
    const startX = rowStartX(r);
    // 五線
    for (let i = 0; i < 5; i++) {
      els.push(<line key={`l${i}`} x1={10} x2={VIEW_W - 8} y1={STAFF_TOP + i * SP} y2={STAFF_TOP + i * SP} stroke="#57534e" strokeWidth="1" />);
    }
    // ト音記号（下に8）と拍子
    els.push(<g key="clef">{glyph('gClef', 16, yOfStep(BOTTOM_LINE_STEP + 2))}</g>);
    els.push(<text key="8vb" x={27} y={STAFF_BOTTOM + 26} fontSize="11" fontStyle="italic" fontWeight="700" textAnchor="middle" fill="#1c1917">8</text>);
    if (r === 0) {
      els.push(<g key="ts1">{glyph(`timeSig${bpm}`, 56, STAFF_TOP + SP)}</g>);
      els.push(<g key="ts2">{glyph('timeSig4', 56, STAFF_TOP + 3 * SP)}</g>);
    }
    els.push(<line key="bl0" x1={10} x2={10} y1={STAFF_TOP} y2={STAFF_BOTTOM} stroke="#1c1917" strokeWidth="1.2" />);

    row.forEach((m, col) => {
      const mx = startX + col * measureW(r), mw = measureW(r);
      const isLast = m === score.measures.length - 1;
      // 選んでいるマス・再生中のマスの色
      score.measures[m].beats.forEach((bt, b) =>
        bt.slots.forEach((_, s) => {
          const key = `${m}-${b}-${s}`;
          const { x0, x1 } = slotRange(m, b, s, r, col);
          const cur = cursor.m === m && cursor.b === b && cursor.s === s;
          const sel = selectedSlotKeys?.has(key);
          const play = currentPlayKey === key;
          if (cur || sel || play) {
            els.push(
              <rect key={`hl${key}`} x={x0 - 2} y={STAFF_TOP - 22} width={x1 - x0} height={4 * SP + 44} rx="3"
                fill={play ? 'rgba(251,184,23,0.35)' : sel ? 'rgba(251,184,23,0.22)' : 'rgba(15,142,168,0.14)'}
                stroke={cur && !play ? 'rgba(11,116,145,0.7)' : 'none'} strokeWidth="1.2" />
            );
          }
        })
      );
      // 小節番号と小節線
      els.push(
        <text key={`mn${m}`} x={mx + 3} y={STAFF_TOP - 8} fontSize="9" fill="#8f7f64" className="cursor-pointer" onClick={() => onMeasureClick(m)}>
          {m + 1}
        </text>
      );
      if (isLast) {
        els.push(<line key={`be${m}a`} x1={mx + mw - 5} x2={mx + mw - 5} y1={STAFF_TOP} y2={STAFF_BOTTOM} stroke="#1c1917" strokeWidth="1" />);
        els.push(<line key={`be${m}b`} x1={mx + mw - 1.5} x2={mx + mw - 1.5} y1={STAFF_TOP} y2={STAFF_BOTTOM} stroke="#1c1917" strokeWidth="3.5" />);
      } else {
        els.push(<line key={`b${m}`} x1={mx + mw} x2={mx + mw} y1={STAFF_TOP} y2={STAFF_BOTTOM} stroke="#1c1917" strokeWidth="1" />);
      }
      // 歌詞（拍ごと）
      score.measures[m].beats.forEach((bt, b) => {
        if (!bt.lyrics) return;
        const { x0 } = slotRange(m, b, 0, r, col);
        els.push(<text key={`ly${m}-${b}`} x={x0 + 4} y={STAFF_BOTTOM + 52} fontSize="11" className="font-score" fill="#3d3529">{bt.lyrics}</text>);
      });

      // 音符・休符
      const evs = allEvents[m] || [];
      const accState: Record<number, number> = {};
      // 連桁のまとまり（同じ拍の中の、8分・16分・3連の音符）
      const groups: StaffEvent[][] = [];
      let g: StaffEvent[] = [];
      evs.forEach(ev => {
        const beamable = ev.midis.length > 0 && ev.dur < 1 - 1e-6 && Math.abs(ev.dur - 0.75) > 1e-6 && ev.dur !== 0.75;
        const sameBeat = g.length && Math.floor(g[0].start + 1e-6) === Math.floor(ev.start + 1e-6);
        if (beamable && (sameBeat || !g.length)) g.push(ev);
        else {
          if (g.length) groups.push(g);
          g = beamable ? [ev] : [];
        }
      });
      if (g.length) groups.push(g);
      const inGroup = new Map<StaffEvent, StaffEvent[]>();
      groups.forEach(gr => { if (gr.length > 1) gr.forEach(e => inGroup.set(e, gr)); });
      const stemDirOf = (list: StaffEvent[]) => {
        const steps = list.flatMap(e => e.midis.map(mi => spell(mi + WRITTEN_OFFSET, e.flat).step));
        const avg = steps.reduce((a, v) => a + v, 0) / Math.max(1, steps.length);
        return avg < MID_STEP ? 1 : -1;      // 1 = 上向き
      };
      const headX = (ev: StaffEvent) => {
        const { x0, x1 } = slotRange(m, ev.b, ev.s, r, col);
        return x0 + Math.min(10, (x1 - x0) * 0.25);
      };
      const stemTip: Map<StaffEvent, { x: number; y: number; up: boolean }> = new Map();

      evs.forEach((ev, k) => {
        const x = headX(ev);
        if (!ev.midis.length) {
          // 休符
          const d = ev.dur;
          const name = d >= 4 ? 'restWhole' : d >= 2 ? 'restHalf' : d >= 1 ? 'restQuarter' : d >= 0.5 || ev.triplet ? 'rest8th' : 'rest16th';
          const y = d >= 4 ? STAFF_TOP + SP : STAFF_TOP + 2 * SP;
          els.push(<g key={`r${m}-${k}`}>{glyph(name, x, y)}</g>);
          if ([3, 1.5, 0.75].some(v => Math.abs(v - d) < 1e-6)) els.push(<circle key={`rd${m}-${k}`} cx={x + gw(name) + 4} cy={STAFF_TOP + 1.5 * SP} r="1.8" fill="#1c1917" />);
          return;
        }
        const spelled = ev.midis.map(mi => spell(mi + WRITTEN_OFFSET, ev.flat));
        const head = ev.dur >= 4 - 1e-6 ? 'noteheadWhole' : ev.dur >= 2 - 1e-6 ? 'noteheadHalf' : 'noteheadBlack';
        const hw = gw(head);
        spelled.forEach((sp, i) => {
          const y = yOfStep(sp.step);
          // 加線
          for (let st = BOTTOM_LINE_STEP - 2; st >= sp.step; st -= 2) els.push(<line key={`lg${m}-${k}-${i}-${st}`} x1={x - 3} x2={x + hw + 3} y1={yOfStep(st)} y2={yOfStep(st)} stroke="#1c1917" strokeWidth="1" />);
          for (let st = BOTTOM_LINE_STEP + 10; st <= sp.step; st += 2) els.push(<line key={`lu${m}-${k}-${i}-${st}`} x1={x - 3} x2={x + hw + 3} y1={yOfStep(st)} y2={yOfStep(st)} stroke="#1c1917" strokeWidth="1" />);
          // 臨時記号（同じ小節で前に付けたものは続く）
          const prevAlter = accState[sp.step] ?? 0;
          if (!ev.tieFromPrev && sp.alter !== prevAlter) {
            const an = sp.alter === 1 ? 'accidentalSharp' : sp.alter === -1 ? 'accidentalFlat' : 'accidentalNatural';
            els.push(<g key={`ac${m}-${k}-${i}`}>{glyph(an, x - gw(an) - 2.5, y)}</g>);
          }
          accState[sp.step] = sp.alter;
          els.push(<g key={`h${m}-${k}-${i}`}>{glyph(head, x, y)}</g>);
          if ([3, 1.5, 0.75].some(v => Math.abs(v - ev.dur) < 1e-6)) {
            const dy = sp.step % 2 === 0 ? -SP / 2 : 0;   // 線の上の玉は、点を線の間へ
            els.push(<circle key={`d${m}-${k}-${i}`} cx={x + hw + 4} cy={y + dy} r="1.8" fill="#1c1917" />);
          }
          // タイ（前の音から）
          if (ev.tieFromPrev) {
            const prevX = k > 0 ? headX(evs[k - 1]) + hw : (col > 0 ? mx - 6 : startX - 8);
            const up = sp.step >= MID_STEP;
            const yy = y + (up ? -SP * 0.7 : SP * 0.7);
            els.push(<path key={`t${m}-${k}-${i}`} d={`M ${prevX} ${yy} Q ${(prevX + x) / 2} ${yy + (up ? -7 : 7)} ${x - 1} ${yy}`} fill="none" stroke="#1c1917" strokeWidth="1.2" />);
          }
        });
        // 符幹（全音符以外）
        if (ev.dur < 4 - 1e-6) {
          const grp = inGroup.get(ev);
          const up = stemDirOf(grp || [ev]) === 1;
          const steps = spelled.map(s2 => s2.step);
          const lo = Math.min(...steps), hi = Math.max(...steps);
          const sx = up ? x + hw - 0.6 : x + 0.6;
          const yStart = up ? yOfStep(lo) : yOfStep(hi);
          let yEnd = up ? yOfStep(hi) - 3.5 * SP : yOfStep(lo) + 3.5 * SP;
          // 連桁の中では、まとまりの中でいちばん外側に揃える
          if (grp) {
            const all = grp.flatMap(e => e.midis.map(mi => spell(mi + WRITTEN_OFFSET, e.flat).step));
            yEnd = up ? yOfStep(Math.max(...all)) - 3.5 * SP : yOfStep(Math.min(...all)) + 3.5 * SP;
          }
          els.push(<line key={`st${m}-${k}`} x1={sx} x2={sx} y1={yStart} y2={yEnd} stroke="#1c1917" strokeWidth="1.1" />);
          stemTip.set(ev, { x: sx, y: yEnd, up });
          // 旗（連桁にならない8分・16分）
          if (!grp && ev.dur < 1 - 1e-6) {
            const sixteenth = ev.dur <= 0.25 + 1e-6;
            const fn = (sixteenth ? 'flag16th' : 'flag8th') + (up ? 'Up' : 'Down');
            els.push(<g key={`f${m}-${k}`}>{glyph(fn, up ? sx - 0.5 : sx - 0.5, yEnd)}</g>);
          }
        }
        // 工工四の字（五線の下）と奏法の記号（上）
        if (!ev.tieFromPrev) {
          const res = resolveSlot(score, m, ev.b, ev.s) || ev.slot;
          const acc = res.oshi === 1 ? '♯' : res.oshi === 2 ? '♭' : '';
          els.push(
            <text key={`kk${m}-${k}`} x={x + hw / 2} y={STAFF_BOTTOM + 34} fontSize="13" textAnchor="middle" className="font-score" fontWeight="700" fill="#ad3720">
              {acc + res.notes.map(p => POSITION_NAMES[p]).join('')}
            </text>
          );
          let marks = '';
          LEFT_HAND_ORNS.forEach(o => { if (res[o]) marks += ORN_MARKS[o]; });
          RIGHT_HAND_ORNS.forEach(o => { if (res[o]) marks += ORN_MARKS[o]; });
          if (marks) els.push(<text key={`om${m}-${k}`} x={x + hw / 2} y={STAFF_TOP - 12} fontSize="10" textAnchor="middle" fill="#ad3720" fontWeight="700">{marks}</text>);
        }
      });

      // 連桁と3連の数字
      groups.forEach((gr, gi) => {
        if (gr.length < 2) return;
        const tips = gr.map(e => stemTip.get(e)!).filter(Boolean);
        if (tips.length < 2) return;
        const up = tips[0].up, t = 3.6, dir = up ? 1 : -1;
        const y = tips[0].y;
        els.push(<rect key={`bm${m}-${gi}`} x={tips[0].x - 0.5} y={up ? y : y - t} width={tips[tips.length - 1].x - tips[0].x + 1} height={t} fill="#1c1917" />);
        // 16分の2本目の連桁
        for (let i = 0; i < gr.length; i++) {
          if (gr[i].dur > 0.25 + 1e-6) continue;
          const a = tips[i], nb = gr[i + 1] && gr[i + 1].dur <= 0.25 + 1e-6 ? tips[i + 1] : null;
          const x0 = a.x, x1 = nb ? nb.x : (i > 0 ? a.x - 7 : a.x + 7);
          const yy = up ? y + 6 : y - 6 - t;
          els.push(<rect key={`bm2${m}-${gi}-${i}`} x={Math.min(x0, x1) - 0.5} y={yy} width={Math.abs(x1 - x0) + 1} height={t} fill="#1c1917" />);
          if (nb) i++;
        }
        if (gr[0].triplet) {
          const cx = (tips[0].x + tips[tips.length - 1].x) / 2;
          els.push(<text key={`tp${m}-${gi}`} x={cx} y={up ? y - 5 : y + 13} fontSize="11" fontStyle="italic" fontWeight="700" textAnchor="middle" fill="#1c1917">3</text>);
        }
        void dir;
      });

      // クリック・書く場所（マスごと）
      if (!readOnly) {
        score.measures[m].beats.forEach((bt, b) =>
          bt.slots.forEach((_, s) => {
            const key = `${m}-${b}-${s}`;
            const { x0, x1 } = slotRange(m, b, s, r, col);
            els.push(
              <rect
                key={`hit${key}`}
                x={x0 - 2}
                y={STAFF_TOP - 24}
                width={Math.max(6, x1 - x0)}
                height={4 * SP + 48}
                fill="transparent"
                className="cursor-pointer"
                onMouseMove={e => {
                  if (!writeMode) return;
                  const svg = (e.currentTarget as SVGRectElement).ownerSVGElement!;
                  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
                  const loc = pt.matrixTransform(svg.getScreenCTM()!.inverse());
                  const step = Math.max(BOTTOM_LINE_STEP - 3, Math.min(BOTTOM_LINE_STEP + 12, stepOfY(loc.y)));
                  setHover(h => (h && h.key === key && h.step === step ? h : { key, step, x: x0 + Math.min(10, (x1 - x0) * 0.25), row: r }));
                }}
                onMouseLeave={() => setHover(null)}
                onClick={e => {
                  if (writeMode && onStaffInput && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                    const svg = (e.currentTarget as SVGRectElement).ownerSVGElement!;
                    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
                    const loc = pt.matrixTransform(svg.getScreenCTM()!.inverse());
                    const step = Math.max(BOTTOM_LINE_STEP - 3, Math.min(BOTTOM_LINE_STEP + 12, stepOfY(loc.y)));
                    onStaffInput(m, b, s, stepToMidi(step, accSel) - WRITTEN_OFFSET);
                  } else {
                    onSlotClick(m, b, s, false, e.shiftKey, e.ctrlKey || e.metaKey);
                  }
                }}
              />
            );
          })
        );
      }
    });

    // 書く道具：カーソルを合わせた高さに、うすい玉と「入る勘所」を出す
    if (hover && hover.row === r && writeMode) {
      const midi = stepToMidi(hover.step, accSel) - WRITTEN_OFFSET;
      const hit = midiToPosition(midi, pitches);
      const y = yOfStep(hover.step);
      els.push(
        <g key="ghost" pointerEvents="none">
          {glyph('noteheadBlack', hover.x, y, hit ? 'rgba(11,116,145,0.55)' : 'rgba(200,69,43,0.5)')}
          <rect x={hover.x - 6} y={y - 30} width={hit ? 62 : 74} height="16" rx="3" fill={hit ? 'rgba(11,116,145,0.92)' : 'rgba(200,69,43,0.92)'} />
          <text x={hover.x - 2} y={y - 18} fontSize="10" fill="#fff" fontWeight="700">
            {hit
              ? `${POSITION_NAMES[hit.pos]}${hit.oshi === 1 ? '♯' : hit.oshi === 2 ? '♭' : ''}  ${stepDoremi(hover.step)}${accSel === 1 ? '♯' : accSel === -1 ? '♭' : ''}`
              : '三線の音域の外'}
          </text>
        </g>
      );
    }
    return els;
  };

  return (
    <div data-layout="staff" className="relative w-full max-w-5xl 2xl:max-w-7xl mx-auto flex flex-col gap-3 select-none text-stone-900 pb-6" style={{ zoom: score.view.zoom }}>
      {/* 題名 */}
      <div className="flex flex-col items-center border-b border-stone-300 pb-3 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-widest font-score">{score.title || '無題'}</h1>
        {score.subtitle && <h2 className="text-sm font-semibold text-stone-600 mt-1 font-score">{score.subtitle}</h2>}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-stone-600">
          <span>♩={score.tempo}</span>
          <span>{getTuningLabel(score)}</span>
          <span>五線譜はト音記号の下に8（実際の音は1オクターブ下）。音符の下の赤い字が工工四</span>
        </div>
      </div>

      {/* 書く道具 */}
      {!readOnly && onStaffInput && (
        <div className="no-print flex flex-wrap items-center justify-center gap-2 text-xs">
          <div className="inline-flex rounded-lg border border-stone-300 bg-stone-100 p-0.5">
            <button
              onClick={() => setWriteMode(true)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-bold cursor-pointer ${writeMode ? 'bg-white shadow-2xs text-indigo-800' : 'text-stone-500'}`}
              title="五線の上をクリックすると、その高さの音が入ります"
            >
              <Pencil className="h-3.5 w-3.5" /> 書く
            </button>
            <button
              onClick={() => setWriteMode(false)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-bold cursor-pointer ${!writeMode ? 'bg-white shadow-2xs text-indigo-800' : 'text-stone-500'}`}
              title="クリックでマスを選ぶ（Shift・Ctrl で範囲選択）"
            >
              <MousePointer2 className="h-3.5 w-3.5" /> 選ぶ
            </button>
          </div>
          {writeMode && (
            <div className="inline-flex items-center gap-1">
              <span className="text-stone-500">臨時記号:</span>
              {([[0, 'なし'], [1, '♯'], [-1, '♭']] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setAccSel(v)}
                  className={`min-w-[34px] rounded-md border px-2 py-0.5 font-bold cursor-pointer ${accSel === v ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-stone-300 bg-white text-stone-600'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
          <span className="text-stone-500">
            {writeMode ? '五線の上をクリック → その音がカーソルのマスに入ります（長さは下の ♩ ♪♪ などで選ぶ）' : 'クリックでマスを選びます'}
          </span>
        </div>
      )}

      {rows.map((row, r) => (
        <svg key={r} viewBox={`0 0 ${VIEW_W} ${ROW_H}`} className="score-row block w-full" role="img" aria-label={`${row[0] + 1}小節から`}>
          {renderRow(row, r)}
        </svg>
      ))}

      {onAddMeasure && !readOnly && (
        <div className="flex justify-center pt-1 no-print">
          <button
            onClick={onAddMeasure}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-4 py-2 text-xs font-semibold text-stone-500 hover:border-amber-600 hover:bg-amber-50/50 hover:text-amber-800 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> 小節を追加する
          </button>
        </div>
      )}
      <p className="text-[10px] text-stone-400 text-center no-print">
        音域：{noteName(pitches[0])}〜{noteName(pitches[pitches.length - 1])}（♯・♭で半音ずらせます）。楽譜記号の形：Bravura（SIL Open Font License）
      </p>
    </div>
  );
};
