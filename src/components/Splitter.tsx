/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';

interface SplitterProps {
  /** 大きさを変える場所 */
  target: React.RefObject<HTMLElement | null>;
  /** 'top' = 上の場所（下へ引くと広がる）、'bottom' = 下の場所（上へ引くと広がる） */
  side: 'top' | 'bottom';
  min: number;
  /** 上限（px）。指定しなければ中身の高さまで */
  max?: () => number;
  onChange: (h: number | null) => void;
  label: string;
}

/**
 * 上下に引っぱって、場所の高さを変えるつまみ。ダブルクリック（ダブルタップ）で元の高さに戻す。
 */
export const Splitter: React.FC<SplitterProps> = ({ target, side, min, max, onChange, label }) => {
  const drag = useRef<{ y: number; h: number; natural: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    const el = target.current;
    if (!el) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, h: el.getBoundingClientRect().height, natural: el.scrollHeight };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    const upper = Math.max(min, max ? Math.min(max(), d.natural) : d.natural);
    const h = Math.round(Math.min(upper, Math.max(min, d.h + (side === 'top' ? dy : -dy))));
    onChange(h);
  };
  const end = () => {
    drag.current = null;
  };

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={label}
      title={`${label}（上下に引っぱる・ダブルクリックで元に戻す）`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={() => onChange(null)}
      className="no-print group shrink-0 flex h-3 sm:h-2.5 -my-1 sm:-my-0.5 cursor-row-resize touch-none items-center justify-center"
    >
      <span className="h-1 w-14 rounded-full bg-stone-400/70 group-hover:bg-indigo-500 group-active:bg-indigo-600 transition-colors" />
    </div>
  );
};
