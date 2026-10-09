/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const KANJI_STRINGS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '斗', '為', '巾'] as const;
export const KANJI_STRINGS_17 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17'] as const;

export function getStringNames(count: number = 13): readonly string[] {
  return count === 17 ? KANJI_STRINGS_17 : KANJI_STRINGS;
}

export const KEYBOARD_ROW1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '^', '\\'] as const;
export const KEYBOARD_HOME = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', ':', ']', '@'] as const;

export const NOTE_CDE = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;
export const NOTE_DOREMI = ['ド', 'ド♯', 'レ', 'レ♯', 'ミ', 'ファ', 'ファ♯', 'ソ', 'ソ♯', 'ラ', 'シ♭', 'シ'] as const;
export const RITSU_NAMES = ['壱越', '断金', '平調', '勝絶', '下徴', '双調', '姫調', '凩調', '黄鐘', '鸞鏡', '盤渉', '神仙'] as const;

export const VERT_CHAR_MAP: Record<string, string> = {
  'ー': '丨',
  '-': '丨',
  '(': '︵',
  ')': '︶',
  '（': '︵',
  '）': '︶',
  '[': '﹇',
  ']': '﹈',
  '「': '﹁',
  '」': '﹂',
  '『': '﹃',
  '』': '﹄',
  '…': '⋮',
  '・': '•'
};

export interface TuningPreset {
  name: string;
  desc?: string;
  off: number[];
}

export const TUNING_PRESETS: Record<string, TuningPreset> = {
  hira: {
    name: '平調子',
    desc: '標準平調子: D G A B♭ D E♭ G A B♭ D E♭ G A',
    off: [0, -7, -5, -4, 0, 1, 5, 7, 8, 12, 13, 17, 19]
  },
  kumoi: {
    name: '雲井調子',
    desc: '哀愁のある音色',
    off: [0, -7, -6, -2, 0, 1, 5, 6, 10, 12, 13, 17, 19]
  },
  nakazora: {
    name: '中空調子',
    desc: '明るい抒情的な調子',
    off: [0, -7, -5, -4, 0, 2, 3, 7, 8, 12, 14, 15, 19]
  },
  nogi: {
    name: '乃木調子',
    desc: '明治期以降の調子',
    off: [0, -7, -5, -3, 0, 2, 5, 7, 9, 12, 14, 17, 19]
  },
  kokin: {
    name: '古今調子',
    desc: '古今和歌にちなむ古典調子',
    off: [0, 5, -5, -2, 0, 1, 5, 7, 10, 12, 13, 17, 19]
  },
  gaku: {
    name: '楽調子',
    desc: '雅楽・唐楽風',
    off: [0, -7, -5, -2, 0, 2, 5, 7, 10, 12, 14, 17, 19]
  },
  iwato: {
    name: '岩戸調子',
    desc: '厳かな調子',
    off: [0, -7, -6, -2, -1, 3, 5, 6, 10, 11, 15, 17, 18]
  },
  honkumoi: {
    name: '本雲井',
    desc: '本雲井調子',
    off: [0, -7, -6, -3, 0, 1, 5, 6, 9, 12, 13, 17, 18]
  },
  hira_yon_up: {
    name: '四上り平調子',
    desc: '四の糸を上り(D: D G A C D E♭ G A B♭ D E♭ G A)',
    off: [0, -7, -5, -2, 0, 1, 5, 7, 8, 12, 13, 17, 19]
  },
  juushichi_std: {
    name: '十七絃標準',
    desc: '十七絃標準低音調子',
    off: [-24, -22, -20, -17, -15, -12, -10, -8, -5, -3, 0, 2, 4, 7, 9, 12, 14]
  },
  custom: {
    name: 'カスタム',
    desc: '自由設定',
    off: [0, -7, -5, -4, 0, 1, 5, 7, 8, 12, 13, 17, 19]
  }
};

export type LeftHandOrn = 'ato' | 'hanashi' | 'hikiiro' | 'tsuki' | 'yuri' | 'pizz' | 'keshi' | 'harm';
export type RightHandOrn =
  | 'sukui'
  | 'kaki'
  | 'hiki'
  | 'trem'
  | 'nagashi'
  | 'wari'
  | 'suri'
  | 'ren'
  | 'chirashi'
  | 'awase'
  | 'haya'
  | 'muko';

export const LEFT_HAND_ORNS: LeftHandOrn[] = ['ato', 'hanashi', 'hikiiro', 'tsuki', 'yuri', 'pizz', 'keshi', 'harm'];
export const RIGHT_HAND_ORNS: RightHandOrn[] = [
  'sukui',
  'kaki',
  'hiki',
  'trem',
  'nagashi',
  'wari',
  'suri',
  'ren',
  'chirashi',
  'awase',
  'haya',
  'muko'
];

export const ORN_MARKS: Record<LeftHandOrn | RightHandOrn, string> = {
  ato: '後',
  hanashi: '放',
  hikiiro: '引',
  tsuki: '突',
  yuri: '揺',
  pizz: 'ピ',
  keshi: '消',
  harm: 'ハ',
  sukui: 'ス',
  kaki: 'カ',
  hiki: 'ヒ',
  trem: 'ト',
  nagashi: '流',
  wari: '割',
  suri: '擦',
  ren: '輪',
  chirashi: '散',
  awase: '合',
  haya: '早',
  muko: '向'
};

export const ORN_LABELS: Record<string, { short: string; label: string; desc: string; key: string }> = {
  oshi1: { short: '強', label: '半音押', desc: '半音強押し', key: 'Z' },
  oshi2: { short: '巾', label: '全音押', desc: '全音巾押し', key: 'X' },
  ato: { short: '後', label: '後押し', desc: '打弦後に押し上げる', key: 'Y' },
  hanashi: { short: '放', label: '離し', desc: '押し手を放す', key: 'U' },
  hikiiro: { short: '引', label: '引き色', desc: '糸を引き緩める', key: 'I' },
  tsuki: { short: '突', label: '突き色', desc: '強く突いて戻す', key: 'O' },
  yuri: { short: '揺', label: '揺り', desc: '左手で糸を揺らす', key: 'M' },
  pizz: { short: 'ピ', label: 'ピッツ', desc: '左手弾き', key: 'P' },
  keshi: { short: '消', label: '消し音', desc: '余韻を消す', key: 'Q' },
  harm: { short: 'ハ', label: 'ハーモニクス', desc: '倍音', key: 'W' },
  sukui: { short: 'ス', label: '掬い爪', desc: '裏爪で掬う', key: 'C' },
  kaki: { short: 'カ', label: 'カキ爪', desc: '連続掻き', key: 'V' },
  hiki: { short: 'ヒ', label: '引き爪', desc: '手前に引く', key: 'B' },
  trem: { short: 'ト', label: 'トレモロ', desc: '速い連打', key: 'N' },
  nagashi: { short: '流', label: '流し爪', desc: '順に流す', key: '/' },
  wari: { short: '割', label: '割り爪', desc: '割る', key: 'G' },
  suri: { short: '擦', label: '擦り爪', desc: '擦る', key: 'H' },
  ren: { short: '輪', label: '輪爪', desc: '輪のように弾く', key: 'J' },
  chirashi: { short: '散', label: '散らし爪', desc: '散らす', key: 'K' },
  awase: { short: '合', label: '合わせ爪', desc: '2弦同時に弾く', key: 'E' },
  haya: { short: '早', label: '早爪', desc: '素早く弾く', key: 'R' },
  muko: { short: '向', label: '向こう爪', desc: '押し出す', key: 'T' }
};

export interface Slot {
  notes: number[]; // 0~12 or 0~16 index of string
  rest: boolean;
  tie: boolean;
  oshi: number; // 0=none, 1=half, 2=whole
  ato?: boolean;
  hanashi?: boolean;
  hikiiro?: boolean;
  tsuki?: boolean;
  yuri?: boolean;
  pizz?: boolean;
  keshi?: boolean;
  harm?: boolean;
  sukui?: boolean;
  kaki?: boolean;
  hiki?: boolean;
  trem?: boolean;
  nagashi?: boolean;
  wari?: boolean;
  suri?: boolean;
  ren?: boolean;
  chirashi?: boolean;
  awase?: boolean;
  haya?: boolean;
  muko?: boolean;
  finger?: number; // 1=thumb, 2=index, 3=middle
  repeat1?: boolean;
  repeat2?: boolean;
}

export type BeatSubDiv = 'equal' | '8_16_16' | '16_16_8';
export type InputDivType = 1 | 2 | 3 | 4 | '8_16_16' | '16_16_8';

export interface Beat {
  div: 1 | 2 | 3 | 4;
  slots: Slot[];
  lyrics?: string;
  subDiv?: BeatSubDiv;
}

export interface Measure {
  beats: Beat[];
}

export interface TuningConfig {
  preset: string;
  root: number; // MIDI number
  custom: number[] | null;
}

export interface ViewSettings {
  numerals: 'kanji' | 'arabic';
  ruby: 'off' | 'doremi' | 'cde';
  layout: 'vertical' | 'horizontal';
  paper: 'portrait' | 'landscape';
  chart: 'off' | 'on';
  perLine: number;
  showLyrics: boolean;
  lyricsPosition?: 'right' | 'bottom';
  lyricsFontSize?: 'sm' | 'md' | 'lg' | 'xl';
  lyricsFontFamily?: 'sans' | 'score' | 'klee';
  scoreFontSize?: 'sm' | 'md' | 'lg' | 'xl';
  showKotoBoard: boolean;
  zoom: number;
  sixteenthLayout?: 'vertical' | 'grid';
  fontStyle?: 'shippori' | 'kaisei' | 'yuji' | 'klee' | 'noto';
  schoolStyle?: 'standard' | 'seinha' | 'yamada' | 'ancient' | 'modern';
}

export interface KotoScore {
  id?: string;
  app: 'koto-bunkafu';
  version: number;
  title: string;
  subtitle: string;
  composer: string;
  tempo: number;
  beatsPerMeasure: 2 | 3 | 4;
  stringCount?: 13 | 17;
  tuning: TuningConfig;
  view: ViewSettings;
  measures: Measure[];
  updatedAt?: number;
}

export interface CursorPosition {
  m: number;
  b: number;
  s: number;
  low?: boolean;
}

export function createNewSlot(): Slot {
  return {
    notes: [],
    rest: false,
    tie: false,
    oshi: 0,
    ato: false,
    hanashi: false,
    hikiiro: false,
    tsuki: false,
    yuri: false,
    pizz: false,
    keshi: false,
    harm: false,
    sukui: false,
    kaki: false,
    hiki: false,
    trem: false,
    nagashi: false,
    wari: false,
    suri: false,
    ren: false,
    chirashi: false,
    awase: false,
    haya: false,
    muko: false,
    repeat1: false,
    repeat2: false
  };
}

export function createNewBeat(div: 1 | 2 | 3 | 4 = 2, subDiv?: BeatSubDiv): Beat {
  const count = subDiv === '8_16_16' || subDiv === '16_16_8' ? 3 : div;
  return {
    div,
    slots: Array.from({ length: count }, () => createNewSlot()),
    lyrics: '',
    subDiv
  };
}

export function createNewMeasure(beatsPerMeasure: number = 4): Measure {
  return {
    beats: Array.from({ length: beatsPerMeasure }, () => createNewBeat(2))
  };
}

export function getDefaultView(): ViewSettings {
  return {
    numerals: 'kanji',
    ruby: 'off',
    layout: 'vertical',
    paper: 'portrait',
    chart: 'on',
    perLine: 4,
    showLyrics: false,
    lyricsPosition: 'right',
    lyricsFontSize: 'md',
    lyricsFontFamily: 'sans',
    scoreFontSize: 'md',
    showKotoBoard: false,
    zoom: 1,
    schoolStyle: 'standard'
  };
}

export function createEmptyScore(stringCount: 13 | 17 = 13): KotoScore {
  return {
    app: 'koto-bunkafu',
    version: 2,
    title: '無題の箏譜',
    subtitle: '',
    composer: '',
    tempo: 80,
    beatsPerMeasure: 4,
    stringCount,
    tuning: {
      preset: stringCount === 17 ? 'juushichi_std' : 'hira',
      root: stringCount === 17 ? 36 : 62,
      custom: null
    },
    view: getDefaultView(),
    measures: Array.from({ length: 8 }, () => createNewMeasure(4)),
    updatedAt: Date.now()
  };
}

export const pc = (m: number) => ((Math.round(m) % 12) + 12) % 12;
export const noteName = (m: number, oct = true) =>
  NOTE_CDE[pc(m)] + (oct ? String(Math.floor(Math.round(m) / 12) - 1) : '');
export const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
export const hzToMidi = (f: number) => 69 + 12 * Math.log2(f / 440);
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function getPitches(score: KotoScore): number[] {
  const t = score.tuning;
  const count = score.stringCount === 17 ? 17 : 13;
  if (t.preset === 'custom' && t.custom && t.custom.length === count) {
    return t.custom.slice();
  }
  const preset = TUNING_PRESETS[t.preset] || (count === 17 ? TUNING_PRESETS.juushichi_std : TUNING_PRESETS.hira);
  const pitches = preset.off.map(o => t.root + o);
  if (pitches.length < count) {
    while (pitches.length < count) {
      const last = pitches[pitches.length - 1];
      pitches.push(last + 2);
    }
  }
  return pitches.slice(0, count);
}

export function getTuningLabel(score: KotoScore): string {
  const t = score.tuning || { preset: 'hira', root: 62, custom: null };
  if (t.preset === 'custom') return 'カスタム調子';
  const presetName = TUNING_PRESETS[t.preset]?.name || '平調子';
  return `${presetName} (${RITSU_NAMES[pc(t.root)]} / ${noteName(t.root, false)})`;
}

export function normalizeScore(raw: any, fallback?: KotoScore): KotoScore {
  const base = fallback || createEmptyScore();
  if (!raw || typeof raw !== 'object') return base;
  const stringCount: 13 | 17 = raw.stringCount === 17 ? 17 : 13;
  const validPreset = raw.tuning?.preset && TUNING_PRESETS[raw.tuning.preset] ? raw.tuning.preset : (stringCount === 17 ? 'juushichi_std' : 'hira');
  const root = typeof raw.tuning?.root === 'number' && !isNaN(raw.tuning.root) ? clamp(raw.tuning.root, 24, 96) : (stringCount === 17 ? 36 : 62);
  const custom = Array.isArray(raw.tuning?.custom) && raw.tuning.custom.length === stringCount ? raw.tuning.custom.map((p: any) => Number(p) || 60) : null;
  const v = raw.view || {};
  const view: ViewSettings = {
    numerals: v.numerals === 'arabic' ? 'arabic' : 'kanji',
    ruby: ['off', 'doremi', 'cde'].includes(v.ruby) ? v.ruby : 'off',
    layout: v.layout === 'horizontal' ? 'horizontal' : 'vertical',
    paper: v.paper === 'landscape' ? 'landscape' : 'portrait',
    chart: v.chart === 'off' ? 'off' : 'on',
    perLine: typeof v.perLine === 'number' && v.perLine > 0 ? clamp(Math.round(v.perLine), 1, 8) : 4,
    showLyrics: !!v.showLyrics,
    lyricsPosition: v.lyricsPosition === 'bottom' ? 'bottom' : 'right',
    showKotoBoard: !!v.showKotoBoard,
    zoom: typeof v.zoom === 'number' && !isNaN(v.zoom) && v.zoom >= 0.3 ? clamp(v.zoom, 0.4, 2.0) : 1.0,
    fontStyle: ['shippori', 'kaisei', 'yuji', 'klee', 'noto'].includes(v.fontStyle) ? v.fontStyle : 'shippori',
    schoolStyle: ['standard', 'seinha', 'yamada', 'ancient', 'modern'].includes(v.schoolStyle) ? v.schoolStyle : 'standard'
  };
  const beatsPerMeasure = [2, 3, 4].includes(raw.beatsPerMeasure) ? raw.beatsPerMeasure : 4;
  const maxStringIndex = stringCount - 1;
  const measures = Array.isArray(raw.measures) && raw.measures.length > 0 ? raw.measures.map((m: any) => {
    const rawBeats = Array.isArray(m?.beats) ? m.beats : [];
    const beats: Beat[] = [];
    for (let bIdx = 0; bIdx < beatsPerMeasure; bIdx++) {
      const b = rawBeats[bIdx];
      let div = [1, 2, 3, 4].includes(b?.div) ? b.div : 2;
      const subDiv = ['equal', '8_16_16', '16_16_8'].includes(b?.subDiv) ? b.subDiv : undefined;
      const rawSlots = Array.isArray(b?.slots) ? b.slots : [];
      if (div === 1 && rawSlots.length <= 1 && !subDiv) {
        const s0 = rawSlots[0];
        const isEmpty = !s0 || (!s0.notes?.length && !s0.rest && !s0.tie && !s0.repeat1 && !s0.repeat2);
        if (isEmpty) {
          div = 2;
        }
      }
      const slotCount = subDiv === '8_16_16' || subDiv === '16_16_8' ? 3 : div;
      const slots: Slot[] = [];
      for (let sIdx = 0; sIdx < slotCount; sIdx++) {
        const sl = rawSlots[sIdx];
        if (sl && typeof sl === 'object') {
          slots.push({
            notes: Array.isArray(sl.notes) ? sl.notes.filter((n: any) => typeof n === 'number' && n >= 0 && n <= maxStringIndex) : [],
            rest: !!sl.rest,
            tie: !!sl.tie,
            oshi: [0, 1, 2].includes(sl.oshi) ? sl.oshi : 0,
            ato: !!sl.ato,
            hanashi: !!sl.hanashi,
            hikiiro: !!sl.hikiiro,
            tsuki: !!sl.tsuki,
            yuri: !!sl.yuri,
            pizz: !!sl.pizz,
            keshi: !!sl.keshi,
            harm: !!sl.harm,
            sukui: !!sl.sukui,
            kaki: !!sl.kaki,
            hiki: !!sl.hiki,
            trem: !!sl.trem,
            nagashi: !!sl.nagashi,
            wari: !!sl.wari,
            suri: !!sl.suri,
            ren: !!sl.ren,
            chirashi: !!sl.chirashi,
            awase: !!sl.awase,
            haya: !!sl.haya,
            muko: !!sl.muko,
            finger: typeof sl.finger === 'number' && [1, 2, 3].includes(sl.finger) ? sl.finger : undefined,
            repeat1: !!sl.repeat1,
            repeat2: !!sl.repeat2
          });
        } else {
          slots.push(createNewSlot());
        }
      }
      beats.push({
        div,
        slots,
        lyrics: typeof b?.lyrics === 'string' ? b.lyrics : '',
        subDiv
      });
    }
    return { beats };
  }) : base.measures;

  return {
    id: typeof raw.id === 'string' ? raw.id : base.id,
    app: 'koto-bunkafu',
    version: 2,
    title: typeof raw.title === 'string' ? raw.title : 'さくらさくら',
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : '',
    composer: typeof raw.composer === 'string' ? raw.composer : '',
    tempo: typeof raw.tempo === 'number' && !isNaN(raw.tempo) && raw.tempo >= 20 ? clamp(raw.tempo, 20, 260) : 80,
    beatsPerMeasure,
    stringCount,
    tuning: {
      preset: validPreset,
      root,
      custom
    },
    view,
    measures,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now()
  };
}
