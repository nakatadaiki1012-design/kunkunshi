/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DisplayTheme, KunkunshiScore, TuningType } from '../types/kunkunshi';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ZoomIn, ZoomOut, Sun, Moon, ScrollText, Key, Activity } from 'lucide-react';

interface PerformanceToolbarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onResetPlayback: () => void;
  bpm: number;
  onBpmChange: (newBpm: number) => void;
  isMetronomeOn: boolean;
  onToggleMetronome: () => void;
  isAudioOn: boolean;
  onToggleAudio: () => void;
  theme: DisplayTheme;
  onThemeChange: (theme: DisplayTheme) => void;
  zoomLevel: number; // 100 ~ 200
  onZoomChange: (newZoom: number) => void;
  currentScore: KunkunshiScore;
  onTuningChange: (tuning: TuningType) => void;
  onPitchKeyChange: (key: string) => void;
}

export const PerformanceToolbar: React.FC<PerformanceToolbarProps> = ({
  isPlaying,
  onTogglePlay,
  onResetPlayback,
  bpm,
  onBpmChange,
  isMetronomeOn,
  onToggleMetronome,
  isAudioOn,
  onToggleAudio,
  theme,
  onThemeChange,
  zoomLevel,
  onZoomChange,
  currentScore,
  onTuningChange,
  onPitchKeyChange
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 shadow-sm text-xs select-none">
      {/* Playback Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow transition-transform cursor-pointer active:scale-95 ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>一時停止</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>演奏スクロール開始</span>
            </>
          )}
        </button>

        <button
          onClick={onResetPlayback}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          title="最初の拍に戻る"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* BPM Controls */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-400 font-medium">速度 (BPM):</span>
          <button
            onClick={() => onBpmChange(Math.max(40, bpm - 2))}
            className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded font-bold text-slate-200 cursor-pointer"
          >
            -
          </button>
          <span className="font-mono font-bold text-amber-300 w-8 text-center text-sm">
            {bpm}
          </span>
          <button
            onClick={() => onBpmChange(Math.min(200, bpm + 2))}
            className="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded font-bold text-slate-200 cursor-pointer"
          >
            +
          </button>
        </div>

        {/* Audio Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleAudio}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              isAudioOn
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="三線音源プレビュー"
          >
            {isAudioOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="font-medium">三線音: {isAudioOn ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onToggleMetronome}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              isMetronomeOn
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="メトロノーム"
          >
            <span className="font-medium">クリック: {isMetronomeOn ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Visibility & Tuning */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <select
            value={currentScore.tuning}
            onChange={(e) => onTuningChange(e.target.value as TuningType)}
            className="bg-transparent text-slate-200 font-semibold text-xs focus:outline-none cursor-pointer"
          >
            <option value="Honchoushi" className="bg-slate-900">本調子 (C-F-C)</option>
            <option value="Niagari" className="bg-slate-900">二揚げ (C-G-C)</option>
            <option value="Sanagari" className="bg-slate-900">三揚げ (C-F-A#)</option>
            <option value="Custom" className="bg-slate-900">カスタム</option>
          </select>

          <span className="text-slate-600">|</span>

          <select
            value={currentScore.pitchKey}
            onChange={(e) => onPitchKeyChange(e.target.value)}
            className="bg-transparent text-slate-200 font-semibold text-xs focus:outline-none cursor-pointer"
          >
            <option value="1本本調子 (A-D-A)" className="bg-slate-900">1本本調子 (A)</option>
            <option value="2本本調子 (A#-D#-A#)" className="bg-slate-900">2本本調子 (A#)</option>
            <option value="3本本調子 (B-E-B)" className="bg-slate-900">3本本調子 (B)</option>
            <option value="4本本調子 (C-F-C)" className="bg-slate-900">4本本調子 (C・標準)</option>
            <option value="5本本調子 (C#-F#-C#)" className="bg-slate-900">5本本調子 (C#)</option>
            <option value="6本本調子 (D-G-D)" className="bg-slate-900">6本本調子 (D)</option>
          </select>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onZoomChange(Math.max(80, zoomLevel - 15))}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded cursor-pointer"
            title="縮小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono font-bold text-amber-300 px-1 text-xs">
            {zoomLevel}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(220, zoomLevel + 15))}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded cursor-pointer"
            title="拡大（大文字表示）"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Theme Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onThemeChange('washi')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              theme === 'washi'
                ? 'bg-amber-100 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="和紙伝統風"
          >
            <ScrollText className="w-3 h-3" />
            <span className="hidden sm:inline">和紙</span>
          </button>

          <button
            onClick={() => onThemeChange('dark')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="ステージ暗所高コントラスト"
          >
            <Moon className="w-3 h-3" />
            <span className="hidden sm:inline">暗所</span>
          </button>

          <button
            onClick={() => onThemeChange('daylight')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              theme === 'daylight'
                ? 'bg-white text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="昼間屋外ハイコントラスト"
          >
            <Sun className="w-3 h-3" />
            <span className="hidden sm:inline">白地</span>
          </button>
        </div>
      </div>
    </div>
  );
};
