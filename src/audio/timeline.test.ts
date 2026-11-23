import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyScore, createNewBeat, KunkunshiScore } from '../types/kunkunshi';
import { buildTimeline } from './timeline';
import { voiceSlot, VoiceSink } from './voicing';
import { createNewSlot } from '../types/kunkunshi';

/** 4拍×指定小節数の譜面。各拍は4分（div=1）にして、先頭のマスに音を入れる */
function scoreWith(notesPerBeat: (number[] | 'rest' | 'tie' | null)[]): KunkunshiScore {
  const s = createEmptyScore();
  s.measures = [{ beats: [] }];
  notesPerBeat.forEach((n, i) => {
    if (i > 0 && i % 4 === 0) s.measures.push({ beats: [] });
    const beat = createNewBeat(1);
    const slot = beat.slots[0];
    if (n === 'rest') slot.rest = true;
    else if (n === 'tie') slot.tie = true;
    else if (n) slot.notes = n;
    s.measures[s.measures.length - 1].beats.push(beat);
  });
  return s;
}

test('音の長さは、次に音が出るまでの拍数（延ばし・空きマスを含む）', () => {
  const { items, totalBeats } = buildTimeline(scoreWith([[0], 'tie', null, [1]]));
  assert.equal(totalBeats, 4);
  assert.equal(items.length, 4);
  assert.equal(items[0].durBeats, 3);
  assert.equal(items[0].sound, true);
  assert.equal(items[1].sound, false);
  assert.equal(items[3].durBeats, 1);
});

test('休符も「発音する側」に数える（前の音を止める）', () => {
  const { items } = buildTimeline(scoreWith([[0], 'rest', [1], null]));
  assert.equal(items[0].durBeats, 1);
  assert.equal(items[1].sound, true);
  assert.equal(items[1].slot.rest, true);
});

test('裏拍のみ2分割（8_16_16）の位置と長さ', () => {
  const s = scoreWith([null, null, null, null]);
  const beat = createNewBeat(3, '8_16_16');
  beat.slots.forEach((sl, i) => (sl.notes = [i]));
  s.measures[0].beats[0] = beat;
  s.measures[0].beats[1].slots[0].notes = [9]; // 次の拍に音があるので、最後の16分は0.25拍で終わる
  const { items } = buildTimeline(s);
  const first = items.filter(i => i.b === 0);
  assert.deepEqual(first.map(i => i.beat), [0, 0.5, 0.75]);
  assert.deepEqual(first.map(i => i.durBeats), [0.5, 0.25, 0.25]);
});

test('くり返し記号（く＝2拍前）は参照先の音になる', () => {
  const s = scoreWith([[3], [4], null, null]);
  s.measures[0].beats[2].slots[0].repeat2 = true;
  s.measures[0].beats[3].slots[0].repeat2 = true;
  const { items } = buildTimeline(s);
  assert.deepEqual(items[2].slot.notes, [3]);
  assert.deepEqual(items[3].slot.notes, [4]);
  assert.equal(items[2].sound, true);
});

test('先頭のくり返し記号は参照先が無いので鳴らさない', () => {
  const s = scoreWith([null, null, null, null]);
  s.measures[0].beats[0].slots[0].repeat2 = true;
  const { items } = buildTimeline(s);
  assert.equal(items[0].sound, false);
});

// ---- 奏法の展開 ----
function record() {
  const calls: { str: number; midi: number; t: number; bend: string | null }[] = [];
  const damps: { str: number | 'all'; t: number }[] = [];
  const sink: VoiceSink = {
    pluck: (str, midi, t, _v, _b, bend) => calls.push({ str, midi, t, bend: bend ? bend.type : null }),
    damp: (str, t) => damps.push({ str, t }),
    dampAll: t => damps.push({ str: 'all', t })
  };
  return { calls, damps, sink };
}
import { getPitches } from '../types/kunkunshi';
const pitches = getPitches(createEmptyScore()); // 4本 本調子：合=48(C3) … 九=69(A4)

test('ふつうの音は1回だけ鳴る。鳴らす弦は勘所の弦。♯で半音上がる', () => {
  const r = record();
  const sl = createNewSlot();
  sl.notes = [9]; // 五（女弦）
  sl.oshi = 1;
  voiceSlot(r.sink, sl, 0, 1, pitches, 0.5);
  assert.equal(r.calls.length, 1);
  assert.equal(r.calls[0].str, 2);
  assert.equal(r.calls[0].midi, 63);
});

test('♭は半音下がる', () => {
  const r = record();
  const sl = createNewSlot();
  sl.notes = [7]; // 尺 = B♭3(58)
  sl.oshi = 2;
  voiceSlot(r.sink, sl, 0, 1, pitches, 0.5);
  assert.equal(r.calls[0].midi, 57);
});

test('押し上げは弾いてから音程が動く。スリは下から入る', () => {
  const r = record();
  const sl = createNewSlot();
  sl.notes = [5];
  sl.ato = true;
  voiceSlot(r.sink, sl, 0, 1, pitches, 0.5);
  assert.equal(r.calls[0].midi, 55);
  assert.equal(r.calls[0].bend, 'ato');

  const r2 = record();
  const sl2 = createNewSlot();
  sl2.notes = [5];
  sl2.suri = true;
  voiceSlot(r2.sink, sl2, 0, 1, pitches, 0.5);
  assert.equal(r2.calls[0].bend, 'suri');
});

test('合わせ（合+工）は男弦と女弦を鳴らす', () => {
  const r = record();
  const sl = createNewSlot();
  sl.notes = [8, 0];
  voiceSlot(r.sink, sl, 0, 1, pitches, 0.5);
  assert.deepEqual(r.calls.map(c => c.str), [0, 2]);
  assert.deepEqual(r.calls.map(c => c.midi), [48, 60]);
});

test('トレモロは何度も鳴る。範囲外の勘所は無視する', () => {
  const r = record();
  const a = createNewSlot();
  a.notes = [5, 99];
  a.trem = true;
  voiceSlot(r.sink, a, 0, 2, pitches, 0.5);
  assert.ok(r.calls.length >= 6);
  assert.ok(r.calls.every(c => c.str === 1));
});

test('休符は全部の弦を止める', () => {
  const r = record();
  const sl = createNewSlot();
  sl.rest = true;
  voiceSlot(r.sink, sl, 1.5, 1, pitches, 0.5);
  assert.deepEqual(r.damps, [{ str: 'all', t: 1.5 }]);
  assert.equal(r.calls.length, 0);
});
