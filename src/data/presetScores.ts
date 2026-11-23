/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KunkunshiScore, Beat, POSITION_NAMES, createNewBeat, createEmptyScore } from '../types/kunkunshi';

export interface PresetSongInfo {
  id: string;
  title: string;
  subtitle: string;
  composer: string;
  description: string;
  tuningName: string;
  score: () => KunkunshiScore;
}

/**
 * 1拍ぶんの書き方：
 *   「工」 … 1拍に1音
 *   「七.六」 … 1拍を2つに分ける（8分音符2つ）
 *   「合+工」 … 同時に弾く（合わせ）
 *   「-」 … 前の音を延ばす（空きマス）  「○」 … 休符
 *   音の後ろに「:ス」「:打」「:掛」などを付けると奏法
 */
const ORN_BY_MARK: Record<string, string> = { ス: 'sukui', 打: 'uchi', 掛: 'kake', 押: 'ato', 摺: 'suri', ユ: 'yuri', 止: 'keshi' };

function parseBeat(tok: string): Beat {
  if (tok === '-') return createNewBeat(1);
  const parts = tok.split('.');
  const b = createNewBeat(parts.length as 1 | 2 | 3 | 4);
  parts.forEach((part, i) => {
    const slot = b.slots[i];
    if (part === '○') {
      slot.rest = true;
      return;
    }
    if (part === '-' || part === '') return;
    const [notesText, ...marks] = part.split(':');
    slot.notes = notesText
      .split('+')
      .map(n => POSITION_NAMES.indexOf(n))
      .filter(n => n >= 0);
    marks.forEach(mk => {
      const key = ORN_BY_MARK[mk];
      if (key) (slot as any)[key] = true;
    });
  });
  return b;
}

function buildScore(base: Partial<KunkunshiScore>, bars: string[], lyrics: string[] = []): KunkunshiScore {
  const s = createEmptyScore();
  Object.assign(s, base);
  s.measures = bars.map((bar, mIdx) => {
    const lyr = (lyrics[mIdx] || '').split(' ');
    return {
      beats: bar.split(' ').map((tok, bIdx) => {
        const beat = parseBeat(tok);
        const w = lyr[bIdx];
        if (w && w !== '_') beat.lyrics = w;
        return beat;
      })
    };
  });
  return s;
}

/** さくらさくら（日本古謡）を三線に移したもの。ラ＝E（六）にすると、すべて ふつうの勘所で弾ける */
export function createSakuraScore(): KunkunshiScore {
  return buildScore(
    { id: 'sakura', title: 'さくらさくら', subtitle: '日本古謡', composer: '', tempo: 72 },
    [
      '六 六 七 -',
      '六 六 七 -',
      '六 七 八 七',
      '六 七.六 工 -',
      '尺 上 尺 工',
      '尺 尺.上 四 -',
      '六 七 八 七',
      '六 七.六 工 -',
      '尺 上 尺 工',
      '尺 尺.上 四 -',
      '六 六 七 -',
      '六 六 七 -',
      '尺 工 七.六 工',
      '尺:ユ - - ○'
    ],
    [
      'さ く ら _',
      'さ く ら _',
      'や よ い の',
      'そ ら は _',
      'み わ た す',
      'か ぎ り _',
      'か す み か',
      'く も か _',
      'に お い ぞ',
      'い ず る _',
      'い ざ や _',
      'い ざ や _',
      'み に ゆ か',
      'ん _ _ _'
    ]
  );
}

/** きらきら星（フランス民謡）。男弦と中弦だけで弾ける、はじめての練習に */
export function createKirakiraScore(): KunkunshiScore {
  const a = ['合 合 上 上', '中 中 上 -', '四 四 老 老', '乙 乙 合 -'];
  const b = ['上 上 四 四', '老 老 乙 -'];
  return buildScore(
    { id: 'kirakira', title: 'きらきら星', subtitle: 'フランス民謡', composer: '', tempo: 90 },
    [...a, ...b, ...b, ...a],
    [
      'き ら き ら',
      'ひ か る _',
      'お そ ら の',
      'ほ し よ _',
      'ま ば た き',
      'し て は _',
      'み ん な を',
      'み て る _',
      'き ら き ら',
      'ひ か る _',
      'お そ ら の',
      'ほ し よ _'
    ]
  );
}

/** 琉球音階（ド・ミ・ファ・ソ・シ）の練習曲（このアプリのオリジナル）。合わせ・スクイ・打・掛 の例つき */
export function createRyukyuEtudeScore(): KunkunshiScore {
  return buildScore(
    { id: 'ryukyu-etude', title: '琉球音階の練習', subtitle: '練習曲', composer: 'オリジナル', tempo: 84 },
    [
      '合 老 四 上',
      '尺 工 - ○',
      '工 尺 上 四',
      '老 合 - ○',
      '工 六 七 八',
      '七.六 工 尺 -',
      '上 尺 工.ス 六',
      '工 - 合+工 ○',
      '四 上:打 尺 工',
      '六 七.六:掛 工 -',
      '八 七 六 工',
      '尺 上 四 -',
      '合 老 四 上',
      '尺 工 合+工 -'
    ]
  );
}

export const PRESET_SONGS: PresetSongInfo[] = [
  {
    id: 'kirakira',
    title: 'きらきら星',
    subtitle: 'フランス民謡',
    composer: '',
    description: 'はじめての1曲に。男弦（合・乙・老）と中弦（四・上・中）だけで弾けます。',
    tuningName: '4本 本調子',
    score: createKirakiraScore
  },
  {
    id: 'sakura',
    title: 'さくらさくら',
    subtitle: '日本古謡',
    composer: '',
    description: '中弦と女弦を行き来する練習に。七.六 のように1マスを2つに分けた音も出てきます。',
    tuningName: '4本 本調子',
    score: createSakuraScore
  },
  {
    id: 'ryukyu-etude',
    title: '琉球音階の練習',
    subtitle: '練習曲（オリジナル）',
    composer: '',
    description: '沖縄らしい音階（合・老・四・上・尺・工 ＝ ド・ミ・ファ・ソ・シ・ド）と、合わせ・スクイ・打・掛 の例。',
    tuningName: '4本 本調子',
    score: createRyukyuEtudeScore
  }
];
