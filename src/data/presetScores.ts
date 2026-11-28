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

/**
 * 音の順番だけが分かっている曲を、仮のリズム（2拍子・1拍に8分音符2つ）で小節にする。
 * ・1文字＝8分音符1つ。空白で区切ったまとまりは、1小節（8分音符4つ）の切れ目まで最後の音を延ばす
 * ・words（歌詞）は、その行の拍に均等に割り振る
 */
function eighthPhrasesToBars(phrases: { notes: string; words?: string }[]): { bars: string[]; lyrics: string[] } {
  const beats: string[] = [];
  const beatWords: string[] = [];
  for (const ph of phrases) {
    const start = beats.length;
    const eighths: string[] = [];
    for (const seg of ph.notes.trim().split(/\s+/)) {
      for (let i = 0; i < seg.length; i++) {
        if (seg.startsWith('下老', i)) {
          eighths.push('下老');
          i++;
        } else eighths.push(seg[i]);
      }
      while (eighths.length % 4) eighths.push('-');
    }
    for (let i = 0; i < eighths.length; i += 2) {
      const [a, b] = [eighths[i], eighths[i + 1]];
      beats.push(a === '-' && b === '-' ? '-' : `${a}.${b}`);
    }
    // 歌詞を拍に割り振る（小さい字・ーは前の字とまとめる）
    const morae = (ph.words || '').replace(/[\s（）()]/g, '').match(/.[ぁぃぅぇぉゃゅょゎァィゥェォャュョヮー]*/g) || [];
    const n = beats.length - start;
    for (let k = 0; k < n; k++) {
      const a = Math.floor((k * morae.length) / n), z = Math.floor(((k + 1) * morae.length) / n);
      beatWords.push(morae.slice(a, z).join('') || '_');
    }
  }
  const bars: string[] = [];
  const lyrics: string[] = [];
  for (let i = 0; i < beats.length; i += 2) {
    bars.push(beats.slice(i, i + 2).join(' '));
    lyrics.push(beatWords.slice(i, i + 2).join(' '));
  }
  return { bars, lyrics };
}

/**
 * 唐船ドーイ（沖縄民謡）本調子。
 * 音の順番は伊禮俊一さんのブログ「沖縄民謡No.54 唐船どーい」の工工四（本調子）を参考にした。
 * 元の工工四にはリズム（マス目）が無いので、リズムは仮（2拍子・1拍に2音）。前奏と1番。
 */
export function createToshinDoiScore(): KunkunshiScore {
  const { bars, lyrics } = eighthPhrasesToBars([
    { notes: '工五七四' },
    { notes: '工五七四' },
    { notes: '工五七四七四七四' },
    { notes: '工五七四' },
    { notes: '工五七四' },
    { notes: '工五七四七四七四七' },
    { notes: '四七四七四七四七', words: 'とーしんどーい' },
    { notes: '四七四七五七工五', words: 'さんてーまん' },
    { notes: '尺老尺老工老工老', words: 'いっさんはーえー' },
    { notes: '五老五老工老工五', words: 'ならんしや' },
    { notes: '工五尺工上老四工', words: 'ゆいやなー' },
    { notes: '老四上老尺老上老上', words: 'わかさ' },
    { notes: '老尺老工老七五七工老工五', words: 'まちむら' },
    { notes: '工尺上老', words: 'ぬー（さー）' },
    { notes: '尺老工老工', words: 'しなふぁぬ' },
    { notes: '老上尺四老四乙合上合', words: 'たんめー' },
    { notes: '老五老工老工五工', words: 'はいやせんする' },
    { notes: '老四乙合老', words: 'ゆいやなー' },
    { notes: '工五七四 工五七四 工五', words: 'いやさっさっさっさ' },
    { notes: '七四七四七四' }
  ]);
  const s = buildScore(
    { id: 'toshin-doi', title: '唐船ドーイ', subtitle: '沖縄民謡', composer: '', tempo: 132, beatsPerMeasure: 2 },
    bars,
    lyrics
  );
  s.view.perLine = 6;
  return s;
}

/**
 * 谷茶前節（沖縄民謡）本調子。
 * 音の順番は伊禮俊一さんのブログ「沖縄民謡No.32 谷茶前節」の工工四（本調子）を参考にした。
 * 元の工工四にはリズム（マス目）が無いので、リズムは仮（2拍子・1拍に2音）。前奏と1番。
 */
export function createTanchameScore(): KunkunshiScore {
  const { bars, lyrics } = eighthPhrasesToBars([
    { notes: '四中五中工上四五四 七五七工中四五' },
    { notes: '四中五中工上四五四 七五七工中四五四' },
    { notes: '中五中七中五中七中五中七中七四八', words: 'たんちゃめーぬはまに' },
    { notes: '中五中七四八中五中五中五中七八五七工五中七四五', words: 'スルルぐぁがゆてぃてぃんどーへイ' },
    { notes: '中工中工五中七四 中五中七八五七工五中七四', words: 'スルルぐぁがゆてぃてぃんどーへイ' },
    { notes: '五四中工上四五四 七五七工中四五' },
    { notes: '四中五中工上四五四 七五七工中四五四' }
  ]);
  const s = buildScore(
    { id: 'tanchame', title: '谷茶前節', subtitle: '沖縄民謡', composer: '', tempo: 132, beatsPerMeasure: 2 },
    bars,
    lyrics
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
    id: 'toshin-doi',
    title: '唐船ドーイ',
    subtitle: '沖縄民謡',
    composer: '',
    description: '船が着いた喜びを歌う、カチャーシーの定番。前奏と1番。音の順番は伊禮俊一さんのブログを参考にし、リズムは仮（2拍子・1拍に2音）です。',
    tuningName: '4本 本調子',
    score: createToshinDoiScore
  },
  {
    id: 'tanchame',
    title: '谷茶前節',
    subtitle: '沖縄民謡',
    composer: '',
    description: '谷茶の浜の漁のにぎわいを歌う、踊りの定番曲。前奏と1番。音の順番は伊禮俊一さんのブログを参考にし、リズムは仮（2拍子・1拍に2音）です。',
    tuningName: '4本 本調子',
    score: createTanchameScore
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
