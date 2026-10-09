/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { Plus, Maximize2, ZoomIn, Search } from 'lucide-react';

interface MeasureNavigatorProps {
  totalMeasures: number;
  currentMeasure: number;
  perLine: number;
  layout: 'vertical' | 'horizontal';
  zoom: number;
  isFitAll: boolean;
  onSelectMeasure: (mIdx: number) => void;
  onAddMeasure: () => void;
  onSetPerLine: (perLine: number) => void;
  onToggleFitAll: () => void;
  onSetZoom100: () => void;
}

export const MeasureNavigator: React.FC<MeasureNavigatorProps> = ({
  totalMeasures,
  currentMeasure,
  perLine,
  zoom,
  isFitAll,
  onSelectMeasure,
  onAddMeasure,
  onSetPerLine,
  onToggleFitAll,
  onSetZoom100
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(`nav-pill-${currentMeasure}`);
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentMeasure]);

  return (
    <div className="flex items-center justify-between gap-1.5 rounded-lg border border-stone-200/90 bg-white/95 px-2 py-0.5 shadow-2xs backdrop-blur-xs no-print text-xs transition-all h-8">
      {/* Quick Measure Jump Scrubber */}
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <span className="font-semibold text-stone-400 shrink-0 text-[10px] hidden sm:inline">
          小節ジャンプ:
        </span>
        <div
          ref={scrollRef}
          className="flex items-center gap-0.5 overflow-x-auto py-0.5 scrollbar-thin flex-1"
        >
          {Array.from({ length: totalMeasures }, (_, idx) => {
            const isCurrent = idx === currentMeasure;
            return (
              <button
                key={idx}
                id={`nav-pill-${idx}`}
                onClick={() => onSelectMeasure(idx)}
                className={`flex h-5 min-w-5 px-1 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-700 text-white shadow-xs scale-105 ring-1 ring-indigo-400'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900'
                }`}
                title={`第 ${idx + 1} 小節へ移動`}
              >
                {idx + 1}
              </button>
            );
          })}
          <button
            onClick={onAddMeasure}
            className="flex h-5 px-1.5 shrink-0 items-center gap-0.5 rounded border border-dashed border-stone-300 bg-stone-50 text-stone-600 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-800 text-[10px] font-semibold cursor-pointer"
            title="小節を追加"
          >
            <Plus className="h-2.5 w-2.5" />
            <span className="text-[10px]">追加</span>
          </button>
        </div>
      </div>

      {/* Zoom & Fit-All Switcher */}
      <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-stone-200">
        <button
          onClick={onToggleFitAll}
          className={`flex h-5 items-center gap-1 rounded px-1.5 text-[10px] font-bold transition-all cursor-pointer ${
            isFitAll
              ? 'bg-amber-400 text-stone-950 ring-1 ring-amber-500'
              : 'border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
          }`}
          title="全体俯瞰ビュー / 100%切替"
        >
          {isFitAll ? (
            <>
              <Maximize2 className="h-2.5 w-2.5 text-stone-950" />
              <span>俯瞰モード</span>
            </>
          ) : (
            <>
              <Search className="h-2.5 w-2.5 text-stone-600" />
              <span>全体俯瞰</span>
            </>
          )}
        </button>
        {isFitAll && (
          <button
            onClick={onSetZoom100}
            className="flex h-5 items-center gap-0.5 rounded border border-indigo-300 bg-indigo-50 px-1 text-[10px] font-bold text-indigo-900 hover:bg-indigo-100 cursor-pointer"
            title="100%拡大に戻す"
          >
            <ZoomIn className="h-2.5 w-2.5" />
            <span>100%</span>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-0.5 border-l border-stone-200 pl-1">
          <button
            onClick={() => onSetPerLine(2)}
            className={`h-5 rounded px-1 text-[10px] font-semibold transition-colors cursor-pointer ${
              perLine === 2 ? 'bg-indigo-100 text-indigo-900 font-bold' : 'text-stone-500 hover:bg-stone-100'
            }`}
            title="2小節表示"
          >
            2列
          </button>
          <button
            onClick={() => onSetPerLine(4)}
            className={`h-5 rounded px-1 text-[10px] font-semibold transition-colors cursor-pointer ${
              perLine === 4 ? 'bg-indigo-100 text-indigo-900 font-bold' : 'text-stone-500 hover:bg-stone-100'
            }`}
            title="4小節表示"
          >
            4列
          </button>
        </div>
        <div className="text-[10px] font-mono text-stone-500 font-semibold cursor-help px-0.5">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
};
