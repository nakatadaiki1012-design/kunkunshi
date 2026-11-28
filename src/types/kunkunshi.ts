/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 工工四（くんくんしー）＝ 沖縄三線の楽譜のデータ定義。
 *
 * 三線は3本の弦（男弦・中弦・女弦）。工工四では「どの弦の・どこを押さえるか（勘所）」を
 * 1文字の漢字（合・乙・老・四・上・工・五 …）で表す。
 * このアプリでは、マスに入る音を「勘所の番号（0〜13）」で持つ。
 */

/** 弦の番号：0=男弦（いちばん低い）、1=中弦、2=女弦（いちばん高い） */
export type StringNo = 0 | 1 | 2;

export const STRING_NAMES = ['男弦', '中弦', '女弦'] as const;
export const STRING_SHORT = ['男', '中', '女'] as const;

export interface Kandokoro {
  /** 工工四の文字 */
  name: string;
  /** 読み方 */
  yomi: string;
  /** どの弦か */
  str: StringNo;
  /** 開放弦から何半音上か（本調子・4本でのドレミの目安） */
  off: number;
  /** ふつう押さえる指（開放＝弦を押さえない） */
  finger: '開放' | '人差指' | '中指' | '小指';
}

/**
 * 勘所の一覧。並びは「男弦 → 中弦 → 女弦」、それぞれ低い順。
 * 音の高さは、本調子（合＝ド）で一般的な ドレミ表に合わせている：
 *   男弦 合ド 乙レ 老ミ 下老ファ ／ 中弦 四ファ 上ソ 中ラ 尺シ♭ ／ 女弦 工ド 五レ 六ミ 七ファ 八ソ 九ラ
 */
export const KANDOKORO: readonly Kandokoro[] = [
  { name: '合', yomi: 'あい', str: 0, off: 0, finger: '開放' },
  { name: '乙', yomi: 'おつ', str: 0, off: 2, finger: '人差指' },
  { name: '老', yomi: 'ろう', str: 0, off: 4, finger: '中指' },
  { name: '下老', yomi: 'げろう', str: 0, off: 5, finger: '小指' },
  { name: '四', yomi: 'し', str: 1, off: 0, finger: '開放' },
  { name: '上', yomi: 'じょう', str: 1, off: 2, finger: '人差指' },
  { name: '中', yomi: 'ちゅう', str: 1, off: 4, finger: '中指' },
  { name: '尺', yomi: 'しゃく', str: 1, off: 5, finger: '小指' },
  { name: '工', yomi: 'こう', str: 2, off: 0, finger: '開放' },
  { name: '五', yomi: 'ご', str: 2, off: 2, finger: '人差指' },
  { name: '六', yomi: 'ろく', str: 2, off: 4, finger: '中指' },
  { name: '七', yomi: 'しち', str: 2, off: 5, finger: '小指' },
  { name: '八', yomi: 'はち', str: 2, off: 7, finger: '中指' },
  { name: '九', yomi: 'く', str: 2, off: 9, finger: '小指' }
];

export const POSITION_COUNT = KANDOKORO.length;
export const POSITION_NAMES: readonly string[] = KANDOKORO.map(k => k.name);

/** 弦ごとの勘所の番号 */
export const POSITIONS_BY_STRING: readonly number[][] = [0, 1, 2].map(s =>
  KANDOKORO.map((k, i) => (k.str === s ? i : -1)).filter(i => i >= 0)
);

/** 勘所の名前一覧 */
export function getStringNames(): readonly string[] {
  return POSITION_NAMES;
}

/** 勘所の番号 → 弦の番号 */
export const stringOfPosition = (pos: number): StringNo => KANDOKORO[pos]?.str ?? 0;

/** パソコンのキー（数字の列）。合〜八は 1〜¥、九は @ */
export const POSITION_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '^', '¥', '@'] as const;

export const NOTE_CDE = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;
export const NOTE_DOREMI = ['ド', 'レ♭', 'レ', 'ミ♭', 'ミ', 'ファ', 'ファ♯', 'ソ', 'ラ♭', 'ラ', 'シ♭', 'シ'] as const;

/** 調弦の高さ（「〜本」）。三味線・三線では 1本＝A、4本＝C … と数える */
export const HON_NAMES = ['1本', '2本', '3本', '4本', '5本', '6本', '7本', '8本', '9本', '10本', '11本', '12本'] as const;
/** 1本（A2）の MIDI 番号 */
export const HON_BASE_MIDI = 45;
export const honOfRoot = (root: number) => HON_NAMES[(((Math.round(root) - HON_BASE_MIDI) % 12) + 12) % 12];

export const VERT_CHAR_MAP: Record<string, string> = {
  '（': '︵', '）': '︶', '(': '︵', ')': '︶',
  'ー': '｜', '－': '｜', '-': '｜',
  '「': '﹁', '」': '﹂', '、': '︑', '。': '︒',
  '…': '︙', '〜': '≀', '～': '≀'
};

export interface TuningPreset {
  name: string;
  desc?: string;
  /** 男弦・中弦・女弦の開放弦の高さ（本調子の男弦からの半音数） */
  off: [number, number, number];
}

export const TUNING_PRESETS: Record<string, TuningPreset> = {
  honchoshi: {
    name: '本調子',
    desc: 'いちばん基本の調弦。男弦と中弦が4度、女弦は男弦の1オクターブ上（4本なら C・F・C）',
    off: [0, 5, 12]
  },
  niagari: {
    name: '二揚げ',
    desc: '中弦を全音上げる。明るく華やかな曲に（4本なら C・G・C）',
    off: [0, 7, 12]
  },
  sansage: {
    name: '三下げ',
    desc: '女弦を全音下げる。しっとりした曲に（4本なら C・F・B♭）',
    off: [0, 5, 10]
  },
  ichiagari: {
    name: '一揚げ',
    desc: '男弦を全音上げる（4本なら D・F・C）',
    off: [2, 5, 12]
  },
  custom: {
    name: 'カスタム調弦',
    desc: '3本の弦の高さを自由に決める',
    off: [0, 5, 12]
  }
};

/** 左手の奏法 */
export type LeftHandOrn = 'uchi' | 'kake' | 'ato' | 'suri' | 'yuri';
/** 右手（バチ・爪）の奏法 */
export type RightHandOrn = 'sukui' | 'trem' | 'keshi';

export const LEFT_HAND_ORNS: LeftHandOrn[] = ['uchi', 'kake', 'ato', 'suri', 'yuri'];
export const RIGHT_HAND_ORNS: RightHandOrn[] = ['sukui', 'trem', 'keshi'];

export const ORN_MARKS: Record<LeftHandOrn | RightHandOrn, string> = {
  uchi: '打',
  kake: '掛',
  ato: '押',
  suri: '摺',
  yuri: 'ユ',
  sukui: 'ス',
  trem: '〰',
  keshi: '止'
};

export const ORN_LABELS: Record<string, { short: string; label: string; desc: string; key: string }> = {
  oshi1: { short: '♯', label: '半音上げ', desc: '勘所を少し上（棹の胴側）で押さえ、半音高くする（尺♯＝シ など）', key: 'Z' },
  oshi2: { short: '♭', label: '半音下げ', desc: '勘所を少し下で押さえ、半音低くする', key: 'X' },
  uchi: { short: '打', label: '打音（ウチ）', desc: 'バチで弾かず、左手の指で弦を打って鳴らす（ハンマリング）', key: 'U' },
  kake: { short: '掛', label: '掛音（カキ）', desc: 'バチで弾かず、押さえていた指で弦を引っ掛けて鳴らす（プリング）', key: 'K' },
  ato: { short: '押', label: '押し上げ', desc: '弾いたあと、弦を押して音を少し上げる', key: 'Y' },
  suri: { short: '摺', label: 'スリ', desc: '下から指を滑らせてこの勘所に入る', key: 'I' },
  yuri: { short: 'ユ', label: '揺り', desc: '余韻を指で揺らす（ビブラート）', key: 'M' },
  sukui: { short: 'ス', label: 'スクイ', desc: 'バチ（爪）を下から上へすくい上げて弾く', key: 'C' },
  trem: { short: '〰', label: 'トレモロ', desc: '同じ音を細かく何度も弾く', key: 'N' },
  keshi: { short: '止', label: '消音', desc: '弾いたすぐあとに響きを止める', key: 'V' }
};

/** 拡大・縮小の範囲（ボタン・ピンチ・「全体」で共通） */
export const ZOOM_MIN = 0.45;
export const ZOOM_MAX = 1.5;
export const TEMPO_MIN = 30;
export const TEMPO_MAX = 260;

export interface Slot {
  /** 勘所の番号（0〜13）。2つ以上なら同時に弾く（合わせ） */
  notes: number[];
  rest: boolean;
  tie: boolean;
  /** 0=なし、1=♯（半音上げ）、2=♭（半音下げ） */
  oshi: number;
  uchi?: boolean;
  kake?: boolean;
  ato?: boolean;
  suri?: boolean;
  yuri?: boolean;
  sukui?: boolean;
  trem?: boolean;
  keshi?: boolean;
  /** 押さえる指 1=人差指, 2=中指, 3=小指 */
  finger?: number;
  repeat1?: boolean; // 1拍繰り返し記号（〃）
  repeat2?: boolean; // 2拍繰り返し記号（く / 𝄥）
}

/** ♯・♭ による音の高さの変化（半音） */
export const accidentalOf = (slot: Pick<Slot, 'oshi'>): number => (slot.oshi === 1 ? 1 : slot.oshi === 2 ? -1 : 0);
export const ACC_MARK = (slot: Pick<Slot, 'oshi'>): string => (slot.oshi === 1 ? '♯' : slot.oshi === 2 ? '♭' : '');

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
  /** 本調子の男弦（合）の高さ（MIDI番号）。48 = C3 = 4本 */
  root: number;
  /** カスタム調弦のときの3本の開放弦（MIDI番号） */
  custom: number[] | null;
}

/** 楽譜の形：'vertical' = 作文用紙のような縦書きの工工四、'tab' = 3本線のタブ譜、'staff' = 五線譜 */
export type ScoreLayout = 'vertical' | 'tab' | 'staff';

export interface ViewSettings {
  ruby: 'off' | 'doremi' | 'cde';
  layout: ScoreLayout;
  paper: 'portrait' | 'landscape';
  chart: 'off' | 'on';
  /** 1行（縦書きなら1列）あたりの小節数 */
  perLine: number;
  showLyrics: boolean;
  lyricsPosition?: 'right' | 'bottom'; // 歌詞の位置: 'right' (マスの右側に薄い列) | 'bottom' (マスの下)
  showSanshinBoard: boolean;
  zoom: number;
  fontStyle?: 'shippori' | 'kaisei' | 'yuji' | 'klee' | 'noto';
  /** タブ譜で、線の上に工工四の文字の代わりに何を書くか */
  tabLabel?: 'kanji' | 'doremi';
}

export interface KunkunshiScore {
  id?: string;
  app: 'kunkunshi';
  version: number;
  title: string;
  subtitle: string;
  composer: string;
  tempo: number;
  beatsPerMeasure: 2 | 3 | 4;
  tuning: TuningConfig;
  view: ViewSettings;
  measures: Measure[];
  updatedAt?: number;
}

export interface CursorPosition {
  m: number; // measure index
  b: number; // beat index
  s: number; // slot index
  low?: boolean;
}

export function createNewSlot(): Slot {
  return {
    notes: [],
    rest: false,
    tie: false,
    oshi: 0,
    uchi: false,
    kake: false,
    ato: false,
    suri: false,
    yuri: false,
    sukui: false,
    trem: false,
    keshi: false,
    repeat1: false,
    repeat2: false
  };
}

export function createNewBeat(div: 1 | 2 | 3 | 4 = 1, subDiv?: BeatSubDiv): Beat {
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
    beats: Array.from({ length: beatsPerMeasure }, () => createNewBeat(1))
  };
}

export function getDefaultView(): ViewSettings {
  return {
    ruby: 'off',
    layout: 'vertical',
    paper: 'portrait',
    chart: 'on',
    perLine: 3,
    showLyrics: true,
    lyricsPosition: 'right',
    showSanshinBoard: false,
    zoom: 1,
    fontStyle: 'shippori',
    tabLabel: 'kanji'
  };
}

export function createEmptyScore(): KunkunshiScore {
  return {
    app: 'kunkunshi',
    version: 1,
    title: '無題',
    subtitle: '',
    composer: '',
    tempo: 90,
    beatsPerMeasure: 4,
    tuning: { preset: 'honchoshi', root: 48, custom: null },
    view: getDefaultView(),
    measures: Array.from({ length: 6 }, () => createNewMeasure(4)),
    updatedAt: Date.now()
  };
}

/** 拍子（1小節の拍数）を変える。多い分は削り、足りない分は空の拍で埋める。 */
export function setBeatsPerMeasure(draft: KunkunshiScore, beats: 2 | 3 | 4): void {
  draft.beatsPerMeasure = beats;
  draft.measures.forEach(m => {
    m.beats = m.beats.slice(0, beats);
    while (m.beats.length < beats) m.beats.push(createNewBeat(1));
  });
}

export const pc = (m: number) => ((Math.round(m) % 12) + 12) % 12;

export const noteName = (m: number, oct = true) =>
  NOTE_CDE[pc(m)] + (oct ? String(Math.floor(Math.round(m) / 12) - 1) : '');

export const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
export const hzToMidi = (f: number) => 69 + 12 * Math.log2(f / 440);
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** 3本の開放弦の高さ（MIDI番号）［男弦, 中弦, 女弦］ */
export function getOpenStrings(score: KunkunshiScore): [number, number, number] {
  const t = score.tuning;
  if (t.preset === 'custom' && t.custom && t.custom.length === 3) {
    return [t.custom[0], t.custom[1], t.custom[2]];
  }
  const preset = TUNING_PRESETS[t.preset] || TUNING_PRESETS.honchoshi;
  return [t.root + preset.off[0], t.root + preset.off[1], t.root + preset.off[2]];
}

/** 勘所ごとの音の高さ（MIDI番号）。番号は KANDOKORO と同じ並び */
export function getPitches(score: KunkunshiScore): number[] {
  const open = getOpenStrings(score);
  return KANDOKORO.map(k => open[k.str] + k.off);
}

export function getTuningLabel(score: KunkunshiScore): string {
  const t = score.tuning || { preset: 'honchoshi', root: 48, custom: null };
  if (t.preset === 'custom') {
    return `カスタム（${getOpenStrings(score).map(p => noteName(p, false)).join('・')}）`;
  }
  const presetName = TUNING_PRESETS[t.preset]?.name || '本調子';
  return `${honOfRoot(t.root)} ${presetName}（${getOpenStrings(score).map(p => noteName(p, false)).join('・')}）`;
}

export function normalizeScore(raw: any, fallback?: KunkunshiScore): KunkunshiScore {
  const base = fallback || createEmptyScore();
  if (!raw || typeof raw !== 'object') return base;

  const validPreset = raw.tuning?.preset && TUNING_PRESETS[raw.tuning.preset] ? raw.tuning.preset : 'honchoshi';
  const root =
    typeof raw.tuning?.root === 'number' && !isNaN(raw.tuning.root) ? clamp(Math.round(raw.tuning.root), 36, 64) : 48;
  const custom =
    Array.isArray(raw.tuning?.custom) && raw.tuning.custom.length === 3
      ? raw.tuning.custom.map((p: any) => clamp(Number(p) || 48, 24, 96))
      : null;

  const v = raw.view || {};
  const view: ViewSettings = {
    ruby: ['off', 'doremi', 'cde'].includes(v.ruby) ? v.ruby : 'off',
    layout: v.layout === 'tab' || v.layout === 'horizontal' ? 'tab' : v.layout === 'staff' ? 'staff' : 'vertical',
    paper: v.paper === 'landscape' ? 'landscape' : 'portrait',
    chart: v.chart === 'off' ? 'off' : 'on',
    perLine: typeof v.perLine === 'number' && v.perLine > 0 ? clamp(Math.round(v.perLine), 1, 8) : 3,
    showLyrics: v.showLyrics === undefined ? true : !!v.showLyrics,
    lyricsPosition: v.lyricsPosition === 'bottom' ? 'bottom' : 'right',
    showSanshinBoard: !!v.showSanshinBoard,
    zoom: typeof v.zoom === 'number' && !isNaN(v.zoom) && v.zoom >= 0.3 ? clamp(v.zoom, ZOOM_MIN, ZOOM_MAX) : 1.0,
    fontStyle: ['shippori', 'kaisei', 'yuji', 'klee', 'noto'].includes(v.fontStyle) ? v.fontStyle : 'shippori',
    tabLabel: v.tabLabel === 'doremi' ? 'doremi' : 'kanji'
  };

  const beatsPerMeasure = [2, 3, 4].includes(raw.beatsPerMeasure) ? raw.beatsPerMeasure : 4;
  const maxPos = POSITION_COUNT - 1;

  const measures =
    Array.isArray(raw.measures) && raw.measures.length > 0
      ? raw.measures.map((m: any) => {
          const rawBeats = Array.isArray(m?.beats) ? m.beats : [];
          const beats: Beat[] = [];
          for (let bIdx = 0; bIdx < beatsPerMeasure; bIdx++) {
            const b = rawBeats[bIdx];
            const div = [1, 2, 3, 4].includes(b?.div) ? b.div : 1;
            const subDiv = ['equal', '8_16_16', '16_16_8'].includes(b?.subDiv) ? b.subDiv : undefined;
            const rawSlots = Array.isArray(b?.slots) ? b.slots : [];
            const slotCount = subDiv === '8_16_16' || subDiv === '16_16_8' ? 3 : div;
            const slots: Slot[] = [];
            for (let sIdx = 0; sIdx < slotCount; sIdx++) {
              const sl = rawSlots[sIdx];
              if (sl && typeof sl === 'object') {
                const notes: number[] = Array.isArray(sl.notes)
                  ? sl.notes.filter((n: any) => typeof n === 'number' && n >= 0 && n <= maxPos)
                  : [];
                slots.push({
                  // 同じ弦の勘所は同時に弾けないので、1本の弦につき1つだけ残す
                  notes: notes.filter((n, i) => notes.findIndex(x => KANDOKORO[x].str === KANDOKORO[n].str) === i),
                  rest: !!sl.rest,
                  tie: !!sl.tie,
                  oshi: [0, 1, 2].includes(sl.oshi) ? sl.oshi : 0,
                  uchi: !!sl.uchi,
                  kake: !!sl.kake,
                  ato: !!sl.ato,
                  suri: !!sl.suri,
                  yuri: !!sl.yuri,
                  sukui: !!sl.sukui,
                  trem: !!sl.trem,
                  keshi: !!sl.keshi,
                  finger: typeof sl.finger === 'number' && [1, 2, 3].includes(sl.finger) ? sl.finger : undefined,
                  repeat1: !!sl.repeat1,
                  repeat2: !!sl.repeat2
                });
              } else {
                slots.push(createNewSlot());
              }
            }
            beats.push({ div, slots, lyrics: typeof b?.lyrics === 'string' ? b.lyrics : '', subDiv });
          }
          return { beats };
        })
      : base.measures;

  return {
    id: typeof raw.id === 'string' ? raw.id : base.id,
    app: 'kunkunshi',
    version: 1,
    title: typeof raw.title === 'string' ? raw.title : '無題',
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : '',
    composer: typeof raw.composer === 'string' ? raw.composer : '',
    tempo:
      typeof raw.tempo === 'number' && !isNaN(raw.tempo) ? clamp(Math.round(raw.tempo), TEMPO_MIN, TEMPO_MAX) : 90,
    beatsPerMeasure,
    tuning: { preset: validPreset, root, custom },
    view,
    measures,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now()
  };
}
