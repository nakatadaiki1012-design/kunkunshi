import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyScore,
  normalizeScore,
  setBeatsPerMeasure,
  getPitches,
  getOpenStrings,
  noteName,
  getTuningLabel,
  KANDOKORO,
  POSITION_NAMES
} from './kunkunshi';

test('4本 本調子は C・F・C、勘所はドレミ表どおり（工がドのとき尺はシ♭）', () => {
  const s = createEmptyScore();
  assert.deepEqual(getOpenStrings(s).map(p => noteName(p, false)), ['C', 'F', 'C']);
  const byName = Object.fromEntries(getPitches(s).map((p, i) => [POSITION_NAMES[i], noteName(p, false)]));
  assert.deepEqual(byName, {
    合: 'C', 乙: 'D', 老: 'E', 下老: 'F',
    四: 'F', 上: 'G', 中: 'A', 尺: 'B♭',
    工: 'C', 五: 'D', 六: 'E', 七: 'F', 八: 'G', 九: 'A'
  });
  // 工は合の1オクターブ上
  assert.equal(getPitches(s)[8] - getPitches(s)[0], 12);
  assert.match(getTuningLabel(s), /4本 本調子/);
});

test('二揚げは中弦が上がり、三下げは女弦が下がる', () => {
  const s = createEmptyScore();
  s.tuning.preset = 'niagari';
  assert.deepEqual(getOpenStrings(s).map(p => noteName(p, false)), ['C', 'G', 'C']);
  s.tuning.preset = 'sansage';
  assert.deepEqual(getOpenStrings(s).map(p => noteName(p, false)), ['C', 'F', 'B♭']);
});

test('勘所は14個で、弦ごとに 男4・中4・女6', () => {
  assert.equal(KANDOKORO.length, 14);
  assert.deepEqual([0, 1, 2].map(str => KANDOKORO.filter(k => k.str === str).length), [4, 4, 6]);
});

test('壊れたデータは既定値に戻る（例外を出さない）', () => {
  assert.doesNotThrow(() => normalizeScore(null));
  assert.doesNotThrow(() => normalizeScore({ measures: 'x', tempo: 'fast', tuning: 5 }));
  const s = normalizeScore({ tempo: 9999 });
  assert.equal(s.tempo, 260);
});

test('同じ弦の勘所が2つ入っていたら1つにする（三線は1本で1音）', () => {
  const s = createEmptyScore();
  s.measures[0].beats[0].slots[0].notes = [0, 1, 8]; // 合・乙（どちらも男弦）・工
  const back = normalizeScore(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(back.measures[0].beats[0].slots[0].notes, [0, 8]);
});

test('拍子を3/4に変えると、すべての小節が3拍になる', () => {
  const s = createEmptyScore();
  setBeatsPerMeasure(s, 3);
  assert.equal(s.beatsPerMeasure, 3);
  assert.ok(s.measures.every(m => m.beats.length === 3));
  setBeatsPerMeasure(s, 4);
  assert.ok(s.measures.every(m => m.beats.length === 4));
});

test('保存して読み込んでも内容が変わらない（横書きの古い設定はタブ譜になる）', () => {
  const s = createEmptyScore();
  s.measures[0].beats[0].slots[0].notes = [3, 8];
  s.measures[0].beats[0].slots[0].oshi = 1;
  s.measures[0].beats[0].slots[0].sukui = true;
  const raw = JSON.parse(JSON.stringify(s));
  raw.view.layout = 'horizontal';
  const back = normalizeScore(raw);
  assert.deepEqual(back.measures[0].beats[0].slots[0].notes, [3, 8]);
  assert.equal(back.measures[0].beats[0].slots[0].oshi, 1);
  assert.equal(back.measures[0].beats[0].slots[0].sukui, true);
  assert.equal(back.view.layout, 'tab');
});
