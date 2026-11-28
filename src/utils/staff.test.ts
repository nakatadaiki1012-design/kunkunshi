import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spell, stepToMidi, midiToPosition, measureEvents } from './staff';
import { createEmptyScore, getPitches, POSITION_NAMES, createNewBeat } from '../types/kunkunshi';

const pitches = getPitches(createEmptyScore());   // 4本 本調子
const name = (r: { pos: number; oshi: number } | null) => (r ? POSITION_NAMES[r.pos] + (r.oshi === 1 ? '♯' : r.oshi === 2 ? '♭' : '') : null);

test('つづり：C4・F#4・B♭3', () => {
  assert.deepEqual(spell(60), { step: 28, alter: 0 });
  assert.deepEqual(spell(66), { step: 31, alter: 1 });
  assert.deepEqual(spell(58, true), { step: 27, alter: -1 });
  assert.equal(stepToMidi(28), 60);
  assert.equal(stepToMidi(27, -1), 58);
});

test('音の高さ → 勘所（開放弦を優先、なければ♯・♭）', () => {
  assert.equal(name(midiToPosition(48, pitches)), '合');
  assert.equal(name(midiToPosition(53, pitches)), '四');     // F3 は 下老 より開放の 四
  assert.equal(name(midiToPosition(58, pitches)), '尺');     // B♭3
  assert.equal(name(midiToPosition(59, pitches)), '尺♯');    // B3
  assert.equal(name(midiToPosition(60, pitches)), '工');
  assert.equal(name(midiToPosition(69, pitches)), '九');
  assert.equal(midiToPosition(40, pitches), null);           // 低すぎて弾けない
});

test('小節の音符：4分＋空き3つ → 全音符1つ、8分2つ、休符', () => {
  const s = createEmptyScore();
  const ms = s.measures[0];
  ms.beats[0].slots[0].notes = [POSITION_NAMES.indexOf('工')];
  const r = measureEvents(ms.beats, 0, pitches, null, (m, b, i) => ms.beats[b].slots[i]);
  assert.equal(r.events.length, 1);
  assert.equal(r.events[0].dur, 4);

  ms.beats[1] = createNewBeat(2);
  ms.beats[1].slots[0].notes = [POSITION_NAMES.indexOf('五')];
  ms.beats[1].slots[1].notes = [POSITION_NAMES.indexOf('六')];
  ms.beats[2].slots[0].rest = true;
  const r2 = measureEvents(ms.beats, 0, pitches, null, (m, b, i) => ms.beats[b].slots[i]);
  assert.deepEqual(r2.events.map(e => [e.start, e.dur, e.midis.length]), [[0, 1, 1], [1, 0.5, 1], [1.5, 0.5, 1], [2, 2, 0]]);
});

test('前の小節から続く延ばしはタイ', () => {
  const s = createEmptyScore();
  const ms = s.measures[0];
  const r = measureEvents(ms.beats, 0, pitches, [60], (m, b, i) => ms.beats[b].slots[i]);
  assert.equal(r.events[0].tieFromPrev, true);
  assert.deepEqual(r.events[0].midis, [60]);
});
