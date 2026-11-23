/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Slot, clamp, KANDOKORO, accidentalOf } from '../types/kunkunshi';
import type { BendConfig } from './sanshinSynth';

/**
 * 1マスぶんの音を、奏法記号に合わせて「どの弦を・いつ・どんな強さで」弾くかに展開する。
 * 画面での再生・試聴・WAV書き出しで共通に使う（音を出す先だけを差し替える）。
 *
 * str は「弦の番号（0=男弦, 1=中弦, 2=女弦）」。三線は同じ弦で2つの音を同時に出せないので、
 * 同じ弦で次の音を弾くと前の音は止まる。
 */
export interface VoiceSink {
  pluck(str: number, midi: number, t: number, vel: number, bright: number, bend: BendConfig | null, pan: number): void;
  damp(str: number, t: number): void;
  dampAll(t: number): void;
}

const PAN = [-0.35, 0, 0.35];

export function voiceSlot(
  sink: VoiceSink,
  slot: Slot,
  t: number,
  durSec: number,
  pitches: number[],
  spb: number
): void {
  if (slot.rest) {
    sink.dampAll(t);
    return;
  }
  const notes = (slot.notes || []).filter(n => n >= 0 && n < pitches.length).sort((a, b) => a - b);
  if (!notes.length) return;

  const acc = accidentalOf(slot);
  let bend: BendConfig | null = null;
  if (slot.ato) bend = { type: 'ato', amt: 1, dur: durSec };
  else if (slot.suri) bend = { type: 'suri', amt: 2, dur: durSec };
  else if (slot.yuri) bend = { type: 'yuri', amt: 1, dur: durSec };

  // 強さと音色（bright が小さいほど柔らかい音）
  let vel = 0.9 / Math.sqrt(notes.length);
  let bright = 0.9;
  if (slot.sukui) {
    bright = 0.6;
    vel *= 0.8;
  }
  if (slot.uchi || slot.kake) {
    // バチを使わず左手だけで鳴らすので、小さく柔らかい
    bright = 0.35;
    vel *= 0.55;
  }

  notes.forEach((pos, j) => {
    const str = KANDOKORO[pos].str;
    const midi = pitches[pos] + acc;
    // 合わせ（2本同時）は、バチで低い弦から高い弦へ少しずらして弾く
    const tt = t + j * 0.012;

    if (slot.trem) {
      const step = clamp(spb / 4, 0.055, 0.1);
      const end = t + Math.max(durSec - 0.03, step);
      for (let x = tt, k = 0; x < end; x += step, k++) {
        sink.pluck(str, midi, x, vel * (k % 2 ? 0.7 : 0.95), k % 2 ? 0.6 : bright, k === 0 ? bend : null, PAN[str]);
      }
    } else {
      sink.pluck(str, midi, tt, vel, bright, bend, PAN[str]);
    }

    if (slot.keshi) sink.damp(str, tt + 0.12);
  });
}
