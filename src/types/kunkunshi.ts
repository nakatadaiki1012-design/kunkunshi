export type TuningType = 'Honchoushi' | 'Niagari' | 'Sanagari' | 'Custom';

export type NotePitch = 
  | '合' | '乙' | '老' | '下老' 
  | '四' | '上' | '工' | '五' | '六' 
  | '七' | '八' | '九' | '屮' | '巾' 
  | '◯' | '休' | '🈁' | '';

export interface KunkunshiCell {
  id: string;
  note: string; // Pitch character like "工", "五", etc.
  technique?: string; // Technique symbol like "打", "踏", "弾", "🈁"
  subNote?: string; // Octave or ornament mark like "上", "半", "♭"
  lyric?: string; // Lyrics syllable (e.g. "あ", "さ")
  isAccent?: boolean;
}

export interface KunkunshiColumn {
  id: string;
  sectionTitle?: string; // e.g. "歌持ち", "一番", "二番"
  cells: KunkunshiCell[];
  columnLyric?: string;
}

export interface KunkunshiScore {
  id: string;
  title: string;
  subtitle?: string;
  composer?: string;
  tuning: TuningType;
  pitchKey: string; // e.g. "4本 (C-F-C)"
  tempoBpm: number;
  cellsPerColumn: number; // usually 12, or 8 / 16
  columns: KunkunshiColumn[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export type ViewMode = 'performance' | 'edit' | 'print';

export type DisplayTheme = 'washi' | 'dark' | 'daylight';

export type LayoutDirection = 'vertical' | 'horizontal';
