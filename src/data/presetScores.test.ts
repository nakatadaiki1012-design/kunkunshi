import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_SONGS, createTinsaguScore, createAsadoyaScore } from './presetScores';
import { KunkunshiScore } from '../types/kunkunshi';

const noteCount = (s: KunkunshiScore) =>
  s.measures.reduce((n, m) => n + m.beats.reduce((k, b) => k + b.slots.filter(sl => sl.notes.length).length, 0), 0);

test('てぃんさぐぬ花：4列×12マス＝12小節、音は元の工工四と同じ64個', () => {
  const s = createTinsaguScore();
  assert.equal(s.measures.length, 12);
  assert.ok(s.measures.every(m => m.beats.length === 4));
  assert.equal(noteCount(s), 17 + 16 + 15 + 16);
  const lyrics = s.measures.flatMap(m => m.beats.map(b => b.lyrics || '')).join('');
  assert.equal(lyrics, 'てぃんさぐぬはなやちみさちにすみてぃうやぬゆしぐとぅやちむにすみり');
});

test('安里屋ユンタ：凡五十四拍子＝2拍子で27小節、音は100個', () => {
  const s = createAsadoyaScore();
  assert.equal(s.beatsPerMeasure, 2);
  assert.equal(s.measures.length, 27);
  assert.equal(noteCount(s), 23 + 21 + 23 + 22 + 11);
  const lyrics = s.measures.flatMap(m => m.beats.map(b => b.lyrics || '')).join('');
  assert.match(lyrics, /あさどやぬくやま/);
  assert.match(lyrics, /またはりぬつんだらかぬしゃまよ/);
});

test('見本の曲はすべて、知らない勘所の字を含まない（空のマスに化けない）', () => {
  for (const song of PRESET_SONGS) {
    const s = song.score();
    assert.ok(noteCount(s) > 10, song.title);
  }
});

test('琉球音階の練習・さくらさくらのシは「尺♯」（シ♭にならない）', async () => {
  const { createRyukyuEtudeScore, createSakuraScore } = await import('./presetScores');
  const { getPitches, noteName, accidentalOf } = await import('../types/kunkunshi');
  for (const s of [createRyukyuEtudeScore(), createSakuraScore()]) {
    const p = getPitches(s);
    const shaku = s.measures.flatMap(m => m.beats.flatMap(b => b.slots)).filter(sl => sl.notes.includes(7));
    assert.ok(shaku.length > 0);
    assert.ok(shaku.every(sl => noteName(p[7] + accidentalOf(sl), false) === 'B'), s.title);
  }
});

test('唐船ドーイ・谷茶前節：仮のリズム（2拍子・1拍に2音）で、元の工工四の音がすべて入る', async () => {
  const { createToshinDoiScore, createTanchameScore } = await import('./presetScores');
  const toshin = createToshinDoiScore();
  assert.equal(toshin.beatsPerMeasure, 2);
  assert.equal(noteCount(toshin), 33 + 109);
  const tancha = createTanchameScore();
  assert.equal(noteCount(tancha), 33 + 59 + 32);
  for (const s of [toshin, tancha]) {
    assert.ok(s.measures.every(m => m.beats.length === 2));
    const lyr = s.measures.flatMap(m => m.beats.map(b => b.lyrics || '')).join('');
    assert.ok(lyr.length > 10, s.title);
  }
  assert.match(toshin.measures.flatMap(m => m.beats.map(b => b.lyrics || '')).join(''), /とーしんどーい/);
  assert.match(tancha.measures.flatMap(m => m.beats.map(b => b.lyrics || '')).join(''), /たんちゃめーぬはまに/);
});
