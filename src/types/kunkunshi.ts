/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TuningType = 'Honchoushi' | 'Niagari' | 'Sanagari' | 'Custom';

export type NotePitch =
  | '合' | '乙' | '下老' | '老'
  | '四' | '上' | '工' | '五' | '六'
  | '七' | '八' | '九' | '屮' | '上六' | '巾'
  | '◯' | '休' | '🈁' | '';

export const MALE_STRING_NOTES = ['合', '乙', '下老', '老'] as const;
export const MIDDLE_STRING_NOTES = ['四', '上', '工', '五', '六'] as const;
export const FEMALE_STRING_NOTES = ['七', '八', '九', '屮', '上六', '巾'] as const;
export const REST_RHYTHM_NOTES = ['◯', '休', '🈁'] as const;

export interface KunkunshiCell {
  id: string;
  note: string; // "工", "五", "七", "◯", etc.
  technique?: string; // "打", "踏", "弾", "🈁"
  subNote?: string; // "上", "半", "♭"
  lyric?: string; // Lyrics syllable, e.g. "あ", "さ"
  finger?: number; // 1, 2, 3 finger position
  isAccent?: boolean;
}

export interface KunkunshiColumn {
  id: string;
  sectionTitle?: string; // "【歌持ち】", "【一番】", "【二番】", "【返し】"
  columnLyric?: string; // Summary lyric line for the column
  cells: KunkunshiCell[];
}

export interface KunkunshiScore {
  id: string;
  app: 'kunkunshi-editor';
  version: number;
  title: string;
  subtitle?: string;
  composer?: string;
  tuning: TuningType;
  pitchKey: string; // e.g. "4本本調子 (C-F-C)"
  tempoBpm: number;
  cellsPerColumn: number; // default 12, or 8 / 16
  columns: KunkunshiColumn[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export type ViewMode = 'performance' | 'edit' | 'print';

export type DisplayTheme = 'washi' | 'dark' | 'daylight';

export type LayoutDirection = 'vertical' | 'horizontal';

export function createNewCell(id: string, note: string = ''): KunkunshiCell {
  return {
    id,
    note,
    technique: '',
    lyric: '',
  };
}

export function createNewColumn(columnId: string, cellCount: number = 12, title: string = ''): KunkunshiColumn {
  return {
    id: columnId,
    sectionTitle: title,
    cells: Array.from({ length: cellCount }, (_, i) => createNewCell(`${columnId}-c${i + 1}`)),
  };
}

export function createEmptyKunkunshiScore(): KunkunshiScore {
  const scoreId = `score-${Date.now()}`;
  return {
    id: scoreId,
    app: 'kunkunshi-editor',
    version: 1,
    title: '無題の工工四',
    subtitle: '沖縄民謡',
    composer: '琉球民謡',
    tuning: 'Honchoushi',
    pitchKey: '4本本調子 (C-F-C)',
    tempoBpm: 80,
    cellsPerColumn: 12,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    columns: Array.from({ length: 4 }, (_, i) =>
      createNewColumn(`col-${i + 1}`, 12, i === 0 ? '【歌持ち】' : `【第${i + 1}行】`)
    ),
  };
}
