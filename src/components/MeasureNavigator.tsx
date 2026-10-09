/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface MeasureNavigatorProps {
  totalColumns: number;
  currentColumnIndex: number;
  onSelectColumn: (colIdx: number) => void;
  onAddColumn: () => void;
}

export const MeasureNavigator: React.FC<MeasureNavigatorProps> = ({
  totalColumns,
  currentColumnIndex,
  onSelectColumn,
  onAddColumn,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(`nav-pill-col-${currentColumnIndex}`);
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentColumnIndex]);

  return (
    <div className="flex items-center justify-between gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1 shadow-2xs no-print text-xs transition-all h-9 select-none">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className="font-semibold text-slate-400 shrink-0 text-[11px]">
          行ジャンプ:
        </span>
        <div
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-thin flex-1"
        >
          {Array.from({ length: totalColumns }, (_, idx) => {
            const isCurrent = idx === currentColumnIndex;
            return (
              <button
                key={idx}
                id={`nav-pill-col-${idx}`}
                onClick={() => onSelectColumn(idx)}
                className={`flex h-6 min-w-6 px-1.5 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 shadow-xs scale-105 ring-1 ring-amber-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title={`第 ${idx + 1} 行へ移動`}
              >
                {idx + 1}
              </button>
            );
          })}
          <button
            onClick={onAddColumn}
            className="flex h-6 px-2 shrink-0 items-center gap-1 rounded-md border border-dashed border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700 hover:border-amber-500 text-[11px] font-bold cursor-pointer"
            title="行を追加"
          >
            <Plus className="h-3 w-3" />
            <span>追加</span>
          </button>
        </div>
      </div>
    </div>
  );
};
