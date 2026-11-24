import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chordFromNotes } from './chord.js';
import { POSITION_NAMES } from '../types/kunkunshi';

const pos = (name: string) => POSITION_NAMES.indexOf(name);

test('1つの勘所：弦・半音・指（上は人差指、六は中指、九は小指）', () => {
  assert.deepEqual(chordFromNotes([pos('上')]).frets, [0, 2, 0]);
  assert.deepEqual(chordFromNotes([pos('上')]).fingers, [0, 1, 0]);
  assert.deepEqual(chordFromNotes([pos('六')]).fingers, [0, 0, 2]);
  assert.deepEqual(chordFromNotes([pos('九')]).frets, [0, 0, 9]);
  assert.deepEqual(chordFromNotes([pos('九')]).fingers, [0, 0, 4]);
});

test('尺は中弦の5半音上（工がドのとき シ♭）、♯で6', () => {
  assert.deepEqual(chordFromNotes([pos('尺')]).frets, [0, 5, 0]);
  assert.deepEqual(chordFromNotes([pos('尺')], 1).frets, [0, 6, 0]);
});

test('開放弦は押さえない（open に入る）', () => {
  const c = chordFromNotes([pos('合'), pos('工')]);
  assert.deepEqual(c.frets, [0, 0, 0]);
  assert.deepEqual(c.open, [0, 2]);
});

test('合わせで同じ指が重なる時は、別の指に替える（上＋五 → 人差指と中指）', () => {
  const c = chordFromNotes([pos('上'), pos('五')]);
  assert.deepEqual(c.frets, [0, 2, 2]);
  assert.notEqual(c.fingers[1], c.fingers[2]);
});
