/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { KunkunshiScore, KunkunshiCell, DisplayTheme, ViewMode } from '../types/kunkunshi';

interface ScoreViewVerticalProps {
  score: KunkunshiScore;
  theme: DisplayTheme;
  viewMode: ViewMode;
  zoomLevel: number;
  selectedCellId: string | null;
  onSelectCell: (columnId: string, cellId: string, cell: KunkunshiCell) => void;
  activeBeatIndex: number | null;
  onNotePlayPreview?: (note: string) => void;
}

export const ScoreViewVertical: React.FC<ScoreViewVerticalProps> = ({
  score,
  theme,
  viewMode,
  zoomLevel,
  selectedCellId,
  onSelectCell,
  activeBeatIndex,
  onNotePlayPreview
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const allCellsWithLocation: { columnId: string; cellId: string; globalIndex: number }[] = [];
  let indexCounter = 0;
  score.columns.forEach((col) => {
    col.cells.forEach((cell) => {
      allCellsWithLocation.push({
        columnId: col.id,
        cellId: cell.id,
        globalIndex: indexCounter++,
      });
    });
  });

  useEffect(() => {
    if (activeBeatIndex !== null && containerRef.current) {
      const activeEl = containerRef.current.querySelector(`[data-beat-index="${activeBeatIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeBeatIndex]);

  const getThemeStyles = () => {
    switch (theme) {
      case 'dark':
        return {
          containerBg: 'bg-slate-950 text-slate-100',
          paperBg: 'bg-slate-900 border-amber-900/50 shadow-2xl',
          headerTitle: 'text-amber-400 font-serif',
          gridBorder: 'border-slate-700/80',
          colHeaderBg: 'bg-amber-950/40 text-amber-300 border-amber-800/60',
          noteText: 'text-amber-300 font-bold',
          techniqueText: 'text-red-400 font-bold',
          lyricText: 'text-slate-200 font-sans font-medium',
          cellHover: 'hover:bg-amber-500/20 hover:border-amber-400',
          selectedCell: 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400 shadow-lg scale-105 z-10',
          activePlayingCell: 'bg-emerald-500/40 border-emerald-400 ring-4 ring-emerald-400 shadow-xl z-20 animate-pulse',
        };
      case 'daylight':
        return {
          containerBg: 'bg-slate-100 text-slate-900',
          paperBg: 'bg-white border-slate-900 shadow-xl',
          headerTitle: 'text-slate-900 font-serif font-black',
          gridBorder: 'border-slate-900',
          colHeaderBg: 'bg-slate-900 text-white font-bold',
          noteText: 'text-slate-950 font-black',
          techniqueText: 'text-red-600 font-bold',
          lyricText: 'text-slate-900 font-bold',
          cellHover: 'hover:bg-slate-200',
          selectedCell: 'bg-amber-200 border-black ring-2 ring-black shadow-lg z-10',
          activePlayingCell: 'bg-emerald-300 border-black ring-4 ring-emerald-600 shadow-xl z-20',
        };
      case 'washi':
      default:
        return {
          containerBg: 'bg-[#f4efe4] text-[#1c1917]',
          paperBg: 'bg-[#faf6ed] border-[#3d3326] shadow-xl',
          headerTitle: 'text-[#2a2118] font-serif font-bold',
          gridBorder: 'border-[#4a3f31]',
          colHeaderBg: 'bg-[#4a3f31] text-[#faf6ed] font-bold',
          noteText: 'text-[#1c1917] font-black',
          techniqueText: 'text-[#c22d19] font-bold',
          lyricText: 'text-[#3d3326] font-medium',
          cellHover: 'hover:bg-[#ebdcc7]',
          selectedCell: 'bg-[#e0be8b] border-[#8a4f1d] ring-2 ring-[#8a4f1d] shadow-md z-10',
          activePlayingCell: 'bg-[#a3d9a5] border-[#2e6d32] ring-4 ring-[#2e6d32] shadow-xl z-20',
        };
    }
  };

  const style = getThemeStyles();
  const scaleFactor = zoomLevel / 100;

  const cellWidthPx = Math.round(54 * scaleFactor);
  const cellHeightPx = Math.round(58 * scaleFactor);
  const noteFontSizePx = Math.round(26 * scaleFactor);
  const lyricFontSizePx = Math.round(13 * scaleFactor);
  const techniqueFontSizePx = Math.round(11 * scaleFactor);

  let globalCounter = 0;

  return (
    <div
      ref={containerRef}
      className={`w-full min-h-[calc(100vh-130px)] p-6 overflow-x-auto flex flex-col items-center justify-start transition-colors duration-300 ${style.containerBg}`}
    >
      {/* Title Header */}
      <div
        className={`w-full max-w-5xl mb-6 p-4 rounded-xl border text-center relative overflow-hidden ${style.paperBg}`}
        style={{ zoom: Math.min(1.2, Math.max(0.9, scaleFactor)) }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3 mb-2 border-inherit">
          <div className="text-left">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">
              工工四（クンクンシー）琉球三線譜
            </span>
            <h1 className={`text-2xl md:text-3xl tracking-tight mt-0.5 ${style.headerTitle}`}>
              {score.title}
            </h1>
            {score.subtitle && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">{score.subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-serif font-semibold">
            <div className="px-3 py-1.5 rounded bg-slate-500/10 border border-slate-500/20">
              <span className="text-slate-500">調子:</span>{' '}
              <span className="text-amber-500 font-bold">{score.tuning}</span>
            </div>

            <div className="px-3 py-1.5 rounded bg-slate-500/10 border border-slate-500/20">
              <span className="text-slate-500">高さ:</span>{' '}
              <span className="font-bold">{score.pitchKey}</span>
            </div>

            <div className="px-3 py-1.5 rounded bg-slate-500/10 border border-slate-500/20">
              <span className="text-slate-500">速度:</span>{' '}
              <span className="font-mono font-bold">{score.tempoBpm} BPM</span>
            </div>
          </div>
        </div>

        {score.notes && (
          <p className="text-xs italic text-slate-500 text-left line-clamp-2 px-1">
            📌 {score.notes}
          </p>
        )}
      </div>

      {/* Main Kunkunshi Vertical Grid (Right to Left Column Direction) */}
      <div className={`p-6 md:p-8 rounded-2xl border ${style.paperBg} inline-block max-w-full shadow-2xl`}>
        <div className="flex flex-row-reverse items-start gap-3 overflow-x-auto pb-4 pt-1 px-2">
          {score.columns.map((col, colIdx) => (
            <div
              key={col.id}
              className="flex flex-col items-center shrink-0"
              style={{ width: `${cellWidthPx + 12}px` }}
            >
              {/* Column Title */}
              <div
                className={`w-full py-1 text-center text-xs rounded-t-md font-serif border ${style.colHeaderBg}`}
                style={{ fontSize: `${Math.max(10, Math.round(11 * scaleFactor))}px` }}
              >
                {col.sectionTitle || `第 ${colIdx + 1} 行`}
              </div>

              {col.columnLyric && (
                <div
                  className="w-full text-center font-serif text-slate-500 py-1 truncate text-[10px]"
                  title={col.columnLyric}
                >
                  {col.columnLyric}
                </div>
              )}

              {/* Vertical Cells Stack */}
              <div className={`w-full flex flex-col border-t border-l border-r ${style.gridBorder}`}>
                {col.cells.map((cell) => {
                  const currentGlobalIndex = globalCounter++;
                  const isSelected = selectedCellId === cell.id;
                  const isActivePlaying = activeBeatIndex === currentGlobalIndex;

                  return (
                    <div
                      key={cell.id}
                      data-beat-index={currentGlobalIndex}
                      onClick={() => {
                        onSelectCell(col.id, cell.id, cell);
                        if (cell.note && onNotePlayPreview) {
                          onNotePlayPreview(cell.note);
                        }
                      }}
                      style={{
                        width: `${cellWidthPx}px`,
                        height: `${cellHeightPx}px`,
                      }}
                      className={`relative flex items-center justify-center border-b border-r cursor-pointer transition-all ${style.gridBorder} ${style.cellHover} ${
                        isActivePlaying
                          ? style.activePlayingCell
                          : isSelected
                          ? style.selectedCell
                          : ''
                      }`}
                    >
                      {/* Main Kanji Pitch Note */}
                      <span
                        className={`font-serif tracking-tighter leading-none select-none transition-transform ${
                          cell.note === '◯' || cell.note === '休'
                            ? 'text-slate-400 font-normal opacity-70'
                            : style.noteText
                        }`}
                        style={{ fontSize: `${noteFontSizePx}px` }}
                      >
                        {cell.note || ''}
                      </span>

                      {/* Technique Mark */}
                      {cell.technique && (
                        <span
                          className={`absolute top-0.5 right-1 ${style.techniqueText}`}
                          style={{ fontSize: `${techniqueFontSizePx}px` }}
                        >
                          {cell.technique}
                        </span>
                      )}

                      {/* Sub Note */}
                      {cell.subNote && (
                        <span
                          className="absolute top-1 left-1 text-amber-500 font-bold"
                          style={{ fontSize: `${Math.round(techniqueFontSizePx * 0.9)}px` }}
                        >
                          {cell.subNote}
                        </span>
                      )}

                      {/* Lyric */}
                      {cell.lyric && (
                        <span
                          className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 ${style.lyricText}`}
                          style={{ fontSize: `${lyricFontSizePx}px` }}
                        >
                          {cell.lyric}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-500/20 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>← 譜面は【右から左】へ進行します</span>
          <span>全 {score.columns.length} 行 / {allCellsWithLocation.length} 拍</span>
        </div>
      </div>
    </div>
  );
};
