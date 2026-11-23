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
 *   音の後ろに「:ス」「:打」「:掛」などを付けると奏法、「:♯」「:♭」で半音上げ下げ
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
      if (mk === '♯') slot.oshi = 1;
      if (mk === '♭') slot.oshi = 2;
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

/** さくらさくら（日本古謡）を三線に移したもの。ラ＝E（六）。シ（B）は「尺♯」で弾く */
export function createSakuraScore(): KunkunshiScore {
  return buildScore(
    { id: 'sakura', title: 'さくらさくら', subtitle: '日本古謡', composer: '', tempo: 72 },
    [
      '六 六 七 -',
      '六 六 七 -',
      '六 七 八 七',
      '六 七.六 工 -',
      '尺:♯ 上 尺:♯ 工',
      '尺:♯ 尺:♯.上 四 -',
      '六 七 八 七',
      '六 七.六 工 -',
      '尺:♯ 上 尺:♯ 工',
      '尺:♯ 尺:♯.上 四 -',
      '六 六 七 -',
      '六 六 七 -',
      '尺:♯ 工 七.六 工',
      '尺:♯:ユ - - ○'
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

/** 琉球音階（ド・ミ・ファ・ソ・シ）の練習曲（このアプリのオリジナル）。シは「尺♯」。合わせ・スクイ・打・掛 の例つき */
export function createRyukyuEtudeScore(): KunkunshiScore {
  return buildScore(
    { id: 'ryukyu-etude', title: '琉球音階の練習', subtitle: '練習曲', composer: 'オリジナル', tempo: 84 },
    [
      '合 老 四 上',
      '尺:♯ 工 - ○',
      '工 尺:♯ 上 四',
      '老 合 - ○',
      '工 六 七 八',
      '七.六 工 尺:♯ -',
      '上 尺:♯ 工:ス 六',
      '工 - 合+工 ○',
      '四 上:打 尺:♯ 工',
      '六 七.六:掛 工 -',
      '八 七 六 工',
      '尺:♯ 上 四 -',
      '合 老 四 上',
      '尺:♯ 工 合+工 -'
    ]
  );
}

/** 1列（12マス）ずつ書いた工工四を、小節に分ける */
function columnsToBars(cols: string[][], beatsPerMeasure: number): string[] {
  const beats = cols.flat();
  const bars: string[] = [];
  for (let i = 0; i < beats.length; i += beatsPerMeasure) bars.push(beats.slice(i, i + beatsPerMeasure).join(' '));
  return bars;
}

/**
 * てぃんさぐぬ花（沖縄民謡）本調子。
 * 工工四は伊禮俊一さんのブログ「沖縄民謡No.11 てぃんさぐぬ花」の工工四（本調子）を参考に、
 * マス目どおりに写した（1マス＝1拍。線の上に書かれた音は半拍あと）。歌詞は1番。
 */
export function createTinsaguScore(): KunkunshiScore {
  const notes = [
    ['中', '中.工', '尺.中', '上', '四', '合.老', '四', '工', '中', '中.工', '尺.中', '上'],
    ['四', '合.老', '四', '工', '中', '中.工', '尺.中', '上', '四', '合.老', '四', '工'],
    ['中', '中.工', '六', '八', '七', '合', '六', '七', '中', '中.工', '尺.中', '上'],
    ['四', '合.老', '四', '工', '中', '中.工', '尺.中', '上', '四', '合.老', '四', '工']
  ];
  const words = [
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', 'てぃ', 'んさ', 'ぐ', 'ぬ', 'は', '', 'な', 'や'],
    ['ち', 'みさ', 'ち', 'に', 'す', '', 'み', 'てぃ', 'う', 'やぬ', 'ゆ', 'し'],
    ['ぐ', '', 'とぅ', 'や', 'ち', 'むに', 'す', 'み', 'り', '', '', '']
  ];
  const s = buildScore(
    { id: 'tinsagu', title: 'てぃんさぐぬ花', subtitle: '沖縄民謡', composer: '', tempo: 76 },
    columnsToBars(notes, 4),
    columnsToBars(words.map(c => c.map(w => w || '_')), 4)
  );
  s.view.perLine = 3;
  return s;
}

/**
 * 安里屋ユンタ（八重山民謡／宮良長包 編曲）本調子・2拍子。
 * 工工四は伊禮俊一さんのブログ「沖縄民謡No.5 安里屋ユンタ」の工工四（本調子・凡五十四拍子）を参考に、
 * マス目どおりに写した（1マスに2つある音は、上が拍の頭、線の上が半拍あと）。歌詞は1番。
 */
export function createAsadoyaScore(): KunkunshiScore {
  const notes = [
    ['四.中', '上.合', '中.上', '合.上', '合.上', '四.中', '上.老', '四', '四.中', '上.合', '中.上', '合.上'],
    ['合.上', '四.中', '上.老', '四', '四', '上.合', '中.工', '中', '上.老', '四.工', '上.老', '工.合'],
    ['工.五', '工.合', '工.合', '五', '五.合', '工.合', '五.七', '五.合', '工.中', '上.合', '中.合', '工.中'],
    ['上.老', '四', '四.中', '上.合', '中.上', '合.上', '合.上', '四.中', '上.老', '四', '四.中', '上.合'],
    ['中.上', '合.上', '合.上', '四.中', '上.老', '四']
  ];
  const words = [
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', 'や', 'あ', 'さど', 'や', 'ぬ', 'く', 'や', 'ま'],
    ['に', 'よ', 'さ', 'ゆい', 'ゆい', 'あ', 'ん', 'ちゅら', 'さ', 'ま', 'り', 'ば'],
    ['し', 'よ', 'また', 'は', 'りぬ', 'つん', 'だら', 'かぬ', 'しゃま', 'よ', '', ''],
    ['', '', '', '', '', '']
  ];
  const s = buildScore(
    { id: 'asadoya', title: '安里屋ユンタ', subtitle: '八重山民謡', composer: '', tempo: 100, beatsPerMeasure: 2 },
    columnsToBars(notes, 2),
    columnsToBars(words.map(c => c.map(w => w || '_')), 2)
  );
  s.view.perLine = 6;
  return s;
}

export const PRESET_SONGS: PresetSongInfo[] = [
  {
    id: 'tinsagu',
    title: 'てぃんさぐぬ花',
    subtitle: '沖縄民謡',
    composer: '',
    description: '「親の教えは心に染めなさい」と歌う、いちばん有名な沖縄民謡のひとつ。歌持ち（前奏）と1番。工工四は伊禮俊一さんのブログを参考にしました。',
    tuningName: '4本 本調子',
    score: createTinsaguScore
  },
  {
    id: 'asadoya',
    title: '安里屋ユンタ',
    subtitle: '八重山民謡',
    composer: '',
    description: '「マタハーリヌ ツィンダラ カヌシャマヨ」の囃子でおなじみ。2拍子で、1マスに2つの音が入る練習に。工工四は伊禮俊一さんのブログを参考にしました。',
    tuningName: '4本 本調子',
    score: createAsadoyaScore
  },
  {
    id: 'ryukyu-etude',
    title: '琉球音階の練習',
    subtitle: '練習曲（オリジナル）',
    composer: '',
    description: '沖縄らしい音階（合・老・四・上・尺♯・工 ＝ ド・ミ・ファ・ソ・シ・ド）と、合わせ・スクイ・打・掛 の例。',
    tuningName: '4本 本調子',
    score: createRyukyuEtudeScore
  },
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
  }
];
