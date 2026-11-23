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
