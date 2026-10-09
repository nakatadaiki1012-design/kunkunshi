/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KotoScore, KANJI_STRINGS, createNewBeat, createEmptyScore } from '../types/koto';

export interface PresetSongInfo {
  id: string;
  title: string;
  subtitle: string;
  composer: string;
  description: string;
  tuningName: string;
  score: () => KotoScore;
}

export function createSakuraScore(): KotoScore {
  const s = createEmptyScore();
  s.id = 'sakura';
  s.title = 'さくらさくら';
  s.subtitle = '日本古謡';
  s.composer = '日本古謡';
  s.tempo = 72;
  s.beatsPerMeasure = 4;
  s.tuning = { preset: 'hira', root: 62, custom: null };

  const bars = [
    '五 五 六',
    '五 五 六',
    '五 六 七 六 五 六 五',
    '五 六 七 六 五',
    '七 八 九 八 七',
    '八 七 六 五 七',
    '六 五 六 五 四',
    '五 六 七 六 五 六 五',
    '五 六 七 六 五',
    '七 八 九 八 七',
    '八 七 六 五 七',
    '六 五 六 五 四',
    '三 五 四 三',
    '五 五 六'
  ];

  s.measures = bars.map((bar) => ({
    beats: bar.split(' ').map((tok) => {
      if (tok === '-') {
        return createNewBeat(2);
      }
      if (tok === '休') {
        const b = createNewBeat(2);
        b.slots[0].rest = true;
        return b;
      }
      const chars = [...tok];
      if (chars.length === 1) {
        const b = createNewBeat(2);
        const stringIdx = KANJI_STRINGS.indexOf(chars[0] as any);
        if (stringIdx >= 0) {
          b.slots[0].notes = [stringIdx];
        }
        return b;
      }
      const b = createNewBeat(chars.length as 1 | 2 | 3 | 4);
      chars.forEach((c, i) => {
        const stringIdx = KANJI_STRINGS.indexOf(c as any);
        if (stringIdx >= 0) {
          b.slots[i].notes = [stringIdx];
        }
      });
      return b;
    })
  }));

  if (s.measures[13]?.beats[0]?.slots[0]) {
    s.measures[13].beats[0].slots[0].yuri = true;
  }
  if (s.measures[3]?.beats[1]?.slots[0]) {
    s.measures[3].beats[1].slots[0].sukui = true;
  }

  return s;
}

export function createRokudanScore(): KotoScore {
  const s = createEmptyScore();
  s.id = 'rokudan';
  s.title = '六段の調';
  s.subtitle = '初段（八橋検校 作曲）';
  s.composer = '八橋検校';
  s.tempo = 56;
  s.beatsPerMeasure = 4;
  s.tuning = { preset: 'hira', root: 62, custom: null };

  const bars = [
    '五 - - -',
    '五 六 七 八',
    '九 七 八 九',
    '巾 斗 為 巾',
    '九 八 七 六',
    '五 六 七 五',
    '六 五 四 三',
    '二 一 二 三',
    '四 五 六 五',
    '四 三 二 一',
    '二 三 四 五',
    '六 七 八 九',
    '十 斗 為 巾',
    '九 八 七 六',
    '五 四 三 二',
    '一 - - -'
  ];

  s.measures = bars.map(bar => ({
    beats: bar.split(' ').map(tok => {
      if (tok === '-') {
        const b = createNewBeat(2);
        b.slots[0].tie = true;
        return b;
      }
      if (tok === '休') {
        const b = createNewBeat(2);
        b.slots[0].rest = true;
        return b;
      }
      const chars = [...tok];
      if (chars.length === 1) {
        const b = createNewBeat(2);
        const stringIdx = KANJI_STRINGS.indexOf(chars[0] as any);
        if (stringIdx >= 0) {
          b.slots[0].notes = [stringIdx];
        }
        return b;
      }
      const b = createNewBeat(chars.length as 1 | 2 | 3 | 4);
      chars.forEach((c, i) => {
        const stringIdx = KANJI_STRINGS.indexOf(c as any);
        if (stringIdx >= 0) {
          b.slots[i].notes = [stringIdx];
        }
      });
      return b;
    })
  }));

  if (s.measures[0]?.beats[0]?.slots[0]) {
    s.measures[0].beats[0].slots[0].hiki = true;
  }
  if (s.measures[6]?.beats[1]?.slots[0]) {
    s.measures[6].beats[1].slots[0].sukui = true;
  }
  if (s.measures[15]?.beats[0]?.slots[0]) {
    s.measures[15].beats[0].slots[0].yuri = true;
  }

  return s;
}

export function createKojoScore(): KotoScore {
  const s = createEmptyScore();
  s.id = 'kojo';
  s.title = '荒城の月';
  s.subtitle = '滝廉太郎 作曲 / 箏曲編';
  s.composer = '滝廉太郎';
  s.tempo = 72;
  s.beatsPerMeasure = 4;
  s.tuning = { preset: 'hira_yon_up', root: 62, custom: null };

  const bars = [
    '五 五 六 七',
    '六 五 四 三',
    '四 五 六 五',
    '四 三 二 一',
    '五 五 六 七',
    '六 五 四 三',
    '四 五 六 五',
    '四 三 二 一',
    '六 六 七 八',
    '七 六 五 四',
    '五 六 七 六',
    '五 四 三 二',
    '四 三 四 五',
    '四 四 三 二',
    '一 - - -',
    '休 休 休 休'
  ];

  const lyrics = [
    'は る こう ろう の',
    'は な の えん',
    'め ぐ る さ か づ',
    'き か げ さ し て',
    'ち よ の ま つ が',
    'え ほ ほ え み し',
    'む か し の ひ か',
    'り い ま い づ こ',
    'て ん じ ょ う む',
    'せ い の つ き か',
    'げ つ ね に か わ',
    'ら ぬ ひ か り な',
    'れ ど む か し の',
    'ひ か り い ま い',
    'づ こ',
    ''
  ];

  s.measures = bars.map((bar, mIdx) => ({
    beats: bar.split(' ').map((tok, bIdx) => {
      const b = createNewBeat(2);
      if (tok === '休') {
        b.slots[0].rest = true;
      } else {
        const stringIdx = KANJI_STRINGS.indexOf(tok as any);
        if (stringIdx >= 0) {
          b.slots[0].notes = [stringIdx];
        }
      }
      const lyricWord = lyrics[mIdx]?.split(' ')[bIdx];
      if (lyricWord && lyricWord !== '') {
        b.lyrics = lyricWord;
      }
      return b;
    })
  }));

  return s;
}

export const PRESET_SONGS: PresetSongInfo[] = [
  {
    id: 'sakura',
    title: 'さくらさくら',
    subtitle: '日本古謡',
    composer: '日本古謡',
    description: '春の訪れを告げる日本を代表する伝統古謡。平調子の入門に最適。',
    tuningName: '平調子',
    score: createSakuraScore
  },
  {
    id: 'kojo',
    title: '荒城の月',
    subtitle: '滝廉太郎 作曲',
    composer: '滝廉太郎',
    description: '四の糸を上らせた四上り平調子で奏でる抒情あふれる名曲。歌詞付き。',
    tuningName: '四上り平調子',
    score: createKojoScore
  },
  {
    id: 'rokudan',
    title: '六段の調',
    subtitle: '初段（八橋検校 作曲）',
    composer: '八橋検校',
    description: '近世箏曲の最高峰。格式高い古典の響きとリズム変化の模範。',
    tuningName: '平調子',
    score: createRokudanScore
  }
];
