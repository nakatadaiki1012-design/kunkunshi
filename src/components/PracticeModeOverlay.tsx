/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { KunkunshiScore, KunkunshiCell, DisplayTheme } from '../types/kunkunshi';
import { ScoreViewVertical } from './ScoreViewVertical';
import { Play, Pause, RotateCcw, X, Maximize2, Minimize2, ZoomIn, ZoomOut, Music } from 'lucide-react';

interface PracticeModeOverlayProps {
  score: KunkunshiScore;
  theme: DisplayTheme;
  zoomLevel: number;
  selectedCellId: string | null;
  onSelectCell: (columnId: string, cellId: string, cell: KunkunshiCell) => void;
  activeBeatIndex: number | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onResetPlayback: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  onClose: () => void;
}

export const PracticeModeOverlay: React.FC<PracticeModeOverlayProps> = ({
  score,
  theme,
  zoomLevel,
  selectedCellId,
  onSelectCell,
  activeBeatIndex,
  isPlaying,
  onTogglePlay,
  onResetPlayback,
  bpm,
  onBpmChange,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(zoomLevel);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 select-none animate-in fade-in-50 duration-200">
      {/* Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold font-serif text-sm text-amber-400">
            <Music className="w-4 h-4 text-amber-400" />
            <span>{score.title}</span>
          </div>
          <span className="text-slate-400">|</span>
          <span className="text-amber-300 font-mono">
            {score.tuning} ({score.pitchKey})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(80, z - 15))}
            className="p-1 text-slate-300 hover:text-white cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-amber-300">{zoom}%</span>
          <button
            onClick={() => setZoom(z => Math.min(220, z + 15))}
            className="p-1 text-slate-300 hover:text-white cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-300 hover:text-white rounded bg-slate-800 border border-slate-700 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-950 hover:bg-red-900 text-red-200 font-bold rounded border border-red-800 cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
        <ScoreViewVertical
          score={score}
          theme={theme}
          viewMode="performance"
          zoomLevel={zoom}
          selectedCellId={selectedCellId}
          onSelectCell={onSelectCell}
          activeBeatIndex={activeBeatIndex}
        />
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="sticky bottom-4 mx-auto w-full max-w-lg px-4 z-30">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-900/95 border border-slate-800 p-3 shadow-2xl backdrop-blur-md">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm shadow cursor-pointer ${
              isPlaying ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-emerald-600 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? '一時停止' : '演奏スクロール'}</span>
          </button>

          <button
            onClick={onResetPlayback}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span>BPM</span>
            <button
              onClick={() => onBpmChange(Math.max(40, bpm - 2))}
              className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <span className="text-amber-300 font-bold w-8 text-center">{bpm}</span>
            <button
              onClick={() => onBpmChange(Math.min(200, bpm + 2))}
              className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
