/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 五線譜のための計算（音の高さ ⇄ 勘所、音名のつづり、五線の上の位置、音の長さのまとめ方）。
 * 三線の音域（4本 本調子で 合=C3 〜 九=A4）は、ト音記号の下に「8」を付けた譜表（実際の音は1オクターブ下）で書く。
 */
import { KANDOKORO, Slot, Beat } from '../types/kunkunshi';

/** 書く高さ = 実際の音 + 12（ト音記号の下に8） */
export const WRITTEN_OFFSET = 12;

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
export const DOREMI_LETTER = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ'] as const;

/** 五線の上の音（全音階の段）。step = オクターブ×7 + 音名（C=0 … B=6） */
export interface Spelled {
  step: number;
  /** -1=♭ 0=なし 1=♯ */
  alter: number;
}

/** MIDI番号 → つづり。preferFlat なら黒鍵を♭で書く */
export function spell(midi: number, preferFlat = false): Spelled {
  const m = Math.round(midi);
  const oct = Math.floor(m / 12) - 1;
  const pc = ((m % 12) + 12) % 12;
  const exact = LETTER_PC.indexOf(pc);
  if (exact >= 0) return { step: oct * 7 + exact, alter: 0 };
  if (preferFlat) {
    const li = LETTER_PC.indexOf(pc + 1);
    return { step: oct * 7 + li, alter: -1 };
  }
  const li = LETTER_PC.indexOf(pc - 1);
  return { step: oct * 7 + li, alter: 1 };
}

/** 段 → 幹音（臨時記号なし）の MIDI 番号 */
export function stepToMidi(step: number, alter = 0): number {
  const oct = Math.floor(step / 7), li = ((step % 7) + 7) % 7;
  return (oct + 1) * 12 + LETTER_PC[li] + alter;
}

export const stepName = (step: number) => LETTERS[((step % 7) + 7) % 7];
export const stepDoremi = (step: number) => DOREMI_LETTER[((step % 7) + 7) % 7];

/** 五線のいちばん下の線（書く高さ E4）の段 */
export const BOTTOM_LINE_STEP = 4 * 7 + 2;

/**
 * 音の高さ（実際の音・MIDI）→ 勘所と ♯・♭。
 * ぴったりの勘所があればそれ（開放弦をいちばん優先）、なければ ♯・♭ を付けた勘所。三線で出せない高さは null
 */
export function midiToPosition(midi: number, pitches: number[]): { pos: number; oshi: number } | null {
  let best: { pos: number; oshi: number; cost: number } | null = null;
  pitches.forEach((p, pos) => {
    for (const [acc, oshi] of [[0, 0], [1, 1], [-1, 2]] as const) {
      if (p + acc !== Math.round(midi)) continue;
      const k = KANDOKORO[pos];
      if (oshi && k.off === 0) continue;                       // 開放弦には ♯・♭ を付けない
      const cost = (oshi ? 10 : 0) + (k.off === 0 ? -1 : 0) + k.off * 0.1;
      if (!best || cost < best.cost) best = { pos, oshi, cost };
    }
  });
  return best ? { pos: (best as any).pos, oshi: (best as any).oshi } : null;
}

/** 1つの音符・休符（五線譜に書く単位） */
export interface StaffEvent {
  /** マス（クリックしたとき選ぶマス） */
  m: number;
  b: number;
  s: number;
  /** 小節の頭からの位置（拍） */
  start: number;
  /** 長さ（拍） */
  dur: number;
  /** 書く音（実際の音の MIDI）。空なら休符 */
  midis: number[];
  /** ♭で書くか（♯を付けた音以外は、黒鍵を♭で書く。尺＝シ♭ など） */
  flat: boolean;
  /** 前の音からのタイ（延ばし）か */
  tieFromPrev: boolean;
  /** 3連符の中か */
  triplet: boolean;
  /** 元のマス */
  slot: Slot;
}

const STANDARD = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25];

/**
 * 1小節を、五線譜の音符・休符の並びにする。
 * ・音のあとの空きマス・延ばし（ー）は、その音を延ばす。区切りのよい長さ（2分音符・付点4分など）にまとめ、まとめられない所はタイでつなぐ
 * ・前の小節から続く延ばしは、タイでつなぐ
 * ・曲の頭など、延ばす音がない空きマスは休符
 */
export function measureEvents(
  beats: Beat[],
  m: number,
  pitches: number[],
  prevSounding: number[] | null,
  resolve: (m: number, b: number, s: number) => Slot | null
): { events: StaffEvent[]; lastSounding: number[] | null } {
  // まずマスごとに「始まり・長さ・音」を並べる
  type Cell = { b: number; s: number; start: number; len: number; slot: Slot; kind: 'note' | 'rest' | 'hold'; midis: number[]; flat: boolean; triplet: boolean };
  const cells: Cell[] = [];
  beats.forEach((bt, b) => {
    const n = bt.slots.length;
    const offs = bt.subDiv === '8_16_16' ? [0, 0.5, 0.75] : bt.subDiv === '16_16_8' ? [0, 0.25, 0.5] : bt.slots.map((_, i) => i / bt.div);
    bt.slots.forEach((own, s) => {
      const sl = resolve(m, b, s) || own;
      const start = b + offs[s];
      const len = (s + 1 < n ? offs[s + 1] : 1) - offs[s];
      const triplet = bt.div === 3 && bt.subDiv !== '8_16_16' && bt.subDiv !== '16_16_8';
      if (sl.rest) cells.push({ b, s, start, len, slot: own, kind: 'rest', midis: [], flat: false, triplet });
      else if (sl.notes.length) {
        const acc = sl.oshi === 1 ? 1 : sl.oshi === 2 ? -1 : 0;
        cells.push({ b, s, start, len, slot: own, kind: 'note', midis: sl.notes.map(p => pitches[p] + acc).sort((x, y) => x - y), flat: sl.oshi !== 1, triplet });
      } else cells.push({ b, s, start, len, slot: own, kind: 'hold', midis: [], flat: false, triplet });
    });
  });

  const events: StaffEvent[] = [];
  let sounding = prevSounding;
  let soundingFlat = true;
  let i = 0;
  while (i < cells.length) {
    const c = cells[i];
    let midis: number[] = [];
    let flat = false;
    let tie = false;
    if (c.kind === 'note') {
      midis = c.midis; flat = c.flat; sounding = midis; soundingFlat = flat;
    } else if (c.kind === 'rest') {
      sounding = null;
    } else if (sounding) {
      midis = sounding; flat = soundingFlat; tie = true;                          // 前の音の延ばし
    }
    // 後ろの延ばしマスを足して、区切りのよい長さにまとめる（3連符はまとめない）
    let len = c.len;
    let j = i + 1;
    if (!c.triplet && (midis.length || c.kind === 'rest' || !sounding)) {
      while (j < cells.length && cells[j].kind === 'hold' && !cells[j].triplet && (midis.length || c.kind !== 'note')) {
        // 休符のあとの空きマスは休符のまま（まとめてよい）。音のあとは延ばし
        if (!midis.length && c.kind !== 'rest' && sounding) break;
        const next = len + cells[j].len;
        const startsOnBeat = Math.abs(c.start - Math.round(c.start)) < 1e-6;
        const ok = STANDARD.some(v => Math.abs(v - next) < 1e-6) && (next < 1 || startsOnBeat) && (next !== 3 || c.start === 0 || c.start === 1);
        if (!ok) break;
        len = next; j++;
      }
    }
    events.push({ m, b: c.b, s: c.s, start: c.start, dur: len, midis, flat, tieFromPrev: tie, triplet: c.triplet, slot: c.slot });
    i = j;
  }
  return { events, lastSounding: sounding };
}
