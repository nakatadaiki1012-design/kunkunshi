/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  KotoScore,
  CursorPosition,
  KANJI_STRINGS,
  LEFT_HAND_ORNS,
  RIGHT_HAND_ORNS,
  ORN_MARKS,
  getPitches,
  pc,
  NOTE_CDE,
  NOTE_DOREMI,
  getTuningLabel,
  noteName
} from '../types/koto';
import { Plus, Play, Repeat, Trash2, Copy, Edit2, Check, X, MoreVertical } from 'lucide-react';

interface ScoreSheetHorizontalProps {
  score: KotoScore;
  cursor: CursorPosition;
  currentPlayKey: string | null;
  selectedRange: [number, number] | null;
  selectedSlotKeys?: Set<string>;
  onSlotClick: (mIdx: number, bIdx: number, sIdx: number, low?: boolean, shiftKey?: boolean, ctrlKey?: boolean) => void;
  onSlotMouseDown?: (mIdx: number, bIdx: number, sIdx: number, e: React.MouseEvent) => void;
  onSlotMouseEnter?: (mIdx: number, bIdx: number, sIdx: number) => void;
  onSlotMouseUp?: () => void;
  onMeasureClick: (mIdx: number) => void;
  onLyricsChange?: (mIdx: number, bIdx: number, text: string) => void;
  onUpdateScoreMeta?: (meta: Partial<KotoScore>) => void;
  onInsertMeasure?: (mIdx: number) => void;
  onDuplicateMeasure?: (mIdx: number) => void;
  onDeleteMeasure?: (mIdx: number) => void;
  onAddMeasure?: () => void;
  onSetLoop?: (active: boolean, a?: number, b?: number) => void;
  autoScroll?: boolean;
}

function handleLyricKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  mIdx: number,
  bIdx: number,
  measures: any[]
) {
  const key = e.key;
  if (key === 'Enter' || key === 'ArrowDown' || key === 'ArrowRight' || (key === 'Tab' && !e.shiftKey)) {
    e.preventDefault();
    let nextM = mIdx;
    let nextB = bIdx + 1;
    if (nextB >= measures[mIdx].beats.length) {
      nextM = mIdx + 1;
      nextB = 0;
    }
    if (nextM < measures.length) {
      const el = document.querySelector<HTMLInputElement>(`[data-lyric-input="${nextM}-${nextB}"]`);
      if (el) {
        el.focus();
        el.select();
      }
    }
  } else if (key === 'ArrowUp' || key === 'ArrowLeft' || (key === 'Tab' && e.shiftKey)) {
    e.preventDefault();
    let prevM = mIdx;
    let prevB = bIdx - 1;
    if (prevB < 0) {
      prevM = mIdx - 1;
      if (prevM >= 0) {
        prevB = measures[prevM].beats.length - 1;
      }
    }
    if (prevM >= 0) {
      const el = document.querySelector<HTMLInputElement>(`[data-lyric-input="${prevM}-${prevB}"]`);
      if (el) {
        el.focus();
        el.select();
      }
    }
  }
}

export const ScoreSheetHorizontal: React.FC<ScoreSheetHorizontalProps> = ({
  score,
  cursor,
  currentPlayKey,
  selectedRange,
  selectedSlotKeys,
  onSlotClick,
  onSlotMouseDown,
  onSlotMouseEnter,
  onSlotMouseUp,
  onMeasureClick,
  onLyricsChange,
  onUpdateScoreMeta,
  onInsertMeasure,
  onDuplicateMeasure,
  onDeleteMeasure,
  onAddMeasure,
  onSetLoop,
  autoScroll = true
}) => {
  const pitches = getPitches(score);
  const perLine = score.view.perLine || 4;
  const isArabic = score.view.numerals === 'arabic';
  const isRubyOn = score.view.ruby !== 'off';

  const [editingField, setEditingField] = useState<'title' | 'subtitle' | 'composer' | 'tempo' | null>(null);
  const [editVal, setEditVal] = useState('');
  const [activeMenuMeasure, setActiveMenuMeasure] = useState<number | null>(null);

  const startEdit = (field: 'title' | 'subtitle' | 'composer' | 'tempo', current: string | number) => {
    if (!onUpdateScoreMeta) return;
    setEditingField(field);
    setEditVal(String(current));
  };

  const saveEdit = () => {
    if (!onUpdateScoreMeta || !editingField) return;
    if (editingField === 'tempo') {
      const num = parseInt(editVal, 10);
      if (!isNaN(num) && num >= 30 && num <= 240) {
        onUpdateScoreMeta({ tempo: num });
      }
    } else {
      onUpdateScoreMeta({ [editingField]: editVal });
    }
    setEditingField(null);
  };

  const rows: { measures: number[] }[] = [];
  for (let i = 0; i < score.measures.length; i += perLine) {
    const measureIndices = [];
    for (let j = 0; j < perLine && i + j < score.measures.length; j++) {
      measureIndices.push(i + j);
    }
    rows.push({ measures: measureIndices });
  }

  useEffect(() => {
    if (!autoScroll) return;
    const targetId = currentPlayKey ? `slot-h-${currentPlayKey}` : `measure-h-${cursor.m}`;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [cursor.m, currentPlayKey, autoScroll]);

  const renderRuby = (slNotes: number[], oshi: number = 0, ato?: boolean) => {
    if (score.view.ruby === 'off' || !slNotes.length) return null;
    const names = score.view.ruby === 'cde' ? NOTE_CDE : NOTE_DOREMI;
    const text = slNotes
      .map(n => {
        const base = pitches[n];
        const sounding = base + (ato ? 0 : oshi || 0);
        return names[pc(sounding)];
      })
      .join(' ');
    return <span className="text-[9px] text-stone-500 font-sans tracking-tighter leading-none mt-0.5">{text}</span>;
  };

  const fontClass =
    score.view.fontStyle === 'kaisei'
      ? 'font-kaisei'
      : score.view.fontStyle === 'yuji'
      ? 'font-yuji'
      : score.view.fontStyle === 'klee'
      ? 'font-klee'
      : score.view.fontStyle === 'noto'
      ? 'font-noto'
      : 'font-shippori';

  return (
    <div
      onMouseUp={onSlotMouseUp}
      data-font={score.view.fontStyle || 'shippori'}
      style={{ zoom: score.view.zoom }}
      className={`relative flex flex-col gap-6 select-none ${fontClass} text-stone-900 transition-all w-full max-w-5xl mx-auto pb-6`}
    >
      <div className="flex flex-col items-center border-b border-stone-300 pb-4 text-center">
        {editingField === 'title' ? (
          <div className="flex items-center gap-1.5 z-30 bg-white p-2 rounded-lg shadow-lg border border-stone-300">
            <input
              type="text"
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={e => e.key === 'Enter' && saveEdit()}
              className="text-xl sm:text-2xl font-extrabold text-center border rounded p-1 font-score w-64"
              autoFocus
              placeholder="曲名"
            />
            <button onClick={saveEdit} className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded font-bold cursor-pointer">
              保存
            </button>
          </div>
        ) : (
          <h1
            onClick={() => startEdit('title', score.title)}
            className="group relative text-2xl sm:text-3xl font-extrabold tracking-widest text-stone-950 font-score cursor-pointer hover:text-indigo-900 transition-colors flex items-center gap-2 justify-center"
            title="曲名を編集"
          >
            <span>{score.title || '無題'}</span>
            <Edit2 className="h-3.5 w-3.5 text-stone-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h1>
        )}

        {editingField === 'subtitle' ? (
          <div className="flex items-center gap-1.5 z-30 bg-white p-1.5 rounded-lg shadow border border-stone-300 mt-1">
            <input
              type="text"
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={e => e.key === 'Enter' && saveEdit()}
              className="text-sm font-semibold text-center border rounded p-1 w-48 font-score"
              autoFocus
              placeholder="副題"
            />
            <button onClick={saveEdit} className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded font-bold cursor-pointer">
              保存
            </button>
          </div>
        ) : (
          <h2
            onClick={() => startEdit('subtitle', score.subtitle || '')}
            className="group text-sm font-semibold text-stone-600 mt-1 font-score tracking-wider cursor-pointer hover:text-indigo-900"
            title="副題を編集"
          >
            {score.subtitle || <span className="opacity-0 group-hover:opacity-60 text-xs">+ 副題追加</span>}
          </h2>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between w-full text-xs font-sans text-stone-600 px-2">
          {editingField === 'composer' ? (
            <div className="flex items-center gap-1 z-30 bg-white p-1 rounded shadow border border-stone-300">
              <input
                type="text"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                className="text-xs border rounded p-0.5 w-36"
                autoFocus
                placeholder="作曲者"
              />
              <button onClick={saveEdit} className="px-1.5 py-0.5 text-xs bg-indigo-600 text-white rounded cursor-pointer">
                保存
              </button>
            </div>
          ) : (
            <span
              onClick={() => startEdit('composer', score.composer || '')}
              className="group cursor-pointer hover:text-indigo-900"
              title="作曲者を編集"
            >
              {score.composer ? `作曲: ${score.composer}` : <span className="opacity-0 group-hover:opacity-60">+ 作曲者追加</span>}
            </span>
          )}

          <div className="flex items-center gap-4">
            <span className="font-semibold text-stone-800">{score.beatsPerMeasure}/4拍子</span>
            {editingField === 'tempo' ? (
              <div className="flex items-center gap-1 z-30 bg-white p-0.5 rounded shadow border border-stone-300">
                <span className="text-[10px]">♩=</span>
                <input
                  type="number"
                  min="30"
                  max="240"
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  className="w-12 text-center text-xs border rounded px-1"
                  autoFocus
                />
                <button onClick={saveEdit} className="p-0.5 text-green-700 cursor-pointer">
                  <Check className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <span
                onClick={() => startEdit('tempo', score.tempo)}
                className="cursor-pointer hover:text-indigo-600 hover:underline"
                title="速度変更"
              >
                ♩={score.tempo}
              </span>
            )}
            <span>{getTuningLabel(score)}</span>
          </div>
        </div>

        {score.view.chart === 'on' && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-sans border border-stone-300 rounded bg-stone-50/80 px-3 py-1.5 shadow-xs">
            <span className="font-bold text-stone-700">調子音階:</span>
            {KANJI_STRINGS.map((k, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <span className="font-score font-semibold text-stone-900">{k}</span>
                <span className="text-stone-500">{noteName(pitches[i], false)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-stretch">
            <div className="w-8 shrink-0 flex items-center font-sans text-xs text-stone-400 font-semibold tabular-nums">
              {row.measures[0] + 1}
            </div>
            <div className="flex flex-1 border border-stone-900 bg-[#fbfaf6] shadow-xs">
              {row.measures.map(mIdx => {
                const measure = score.measures[mIdx];
                const isSelectedMeasure =
                  selectedRange && mIdx >= selectedRange[0] && mIdx <= selectedRange[1];
                const isCurrentCursorMeasure = cursor.m === mIdx;
                return (
                  <div
                    key={mIdx}
                    id={`measure-h-${mIdx}`}
                    style={{ width: `${100 / perLine}%`, flexBasis: `${100 / perLine}%` }}
                    className={`relative flex flex-1 min-w-0 border-l-[2px] first:border-l-0 border-stone-900 transition-colors ${
                      mIdx === score.measures.length - 1 ? 'border-r-4 border-double border-stone-950' : ''
                    } ${
                      isSelectedMeasure
                        ? 'bg-amber-100/60 ring-2 ring-indigo-500/50'
                        : isCurrentCursorMeasure
                        ? 'bg-indigo-50/40'
                        : ''
                    }`}
                  >
                    <div className="absolute left-1 -top-4 z-20 flex items-center gap-0.5">
                      <button
                        onClick={() => onMeasureClick(mIdx)}
                        title={`第 ${mIdx + 1} 小節再生`}
                        className="font-sans text-[10px] font-bold text-stone-500 hover:text-red-700 hover:underline px-0.5 cursor-pointer"
                      >
                        {mIdx + 1}
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setActiveMenuMeasure(activeMenuMeasure === mIdx ? null : mIdx);
                        }}
                        className="text-stone-300 hover:text-stone-700 p-0.5 cursor-pointer no-print opacity-60 hover:opacity-100"
                        title="小節メニュー"
                      >
                        <MoreVertical className="h-2.5 w-2.5" />
                      </button>
                    </div>

                    {activeMenuMeasure === mIdx && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="absolute left-6 -top-2 z-40 flex flex-col gap-1 rounded-lg bg-white p-1.5 shadow-xl border border-stone-300 text-xs min-w-[145px] text-stone-700 no-print"
                      >
                        <div className="flex items-center justify-between border-b pb-1 font-bold text-stone-800 text-[11px]">
                          <span>第 {mIdx + 1} 小節</span>
                          <button
                            onClick={() => setActiveMenuMeasure(null)}
                            className="text-stone-400 hover:text-stone-700 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            onMeasureClick(mIdx);
                            setActiveMenuMeasure(null);
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 hover:bg-stone-100 rounded text-left cursor-pointer"
                        >
                          <Play className="h-3 w-3 text-indigo-600 fill-current" /> ここから再生
                        </button>
                        {onInsertMeasure && (
                          <button
                            onClick={() => {
                              onInsertMeasure(mIdx);
                              setActiveMenuMeasure(null);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-stone-100 rounded text-left cursor-pointer border-t"
                          >
                            <Plus className="h-3 w-3 text-emerald-600" /> 前に小節挿入
                          </button>
                        )}
                        {onDuplicateMeasure && (
                          <button
                            onClick={() => {
                              onDuplicateMeasure(mIdx);
                              setActiveMenuMeasure(null);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-stone-100 rounded text-left cursor-pointer"
                          >
                            <Copy className="h-3 w-3 text-blue-600" /> 複製
                          </button>
                        )}
                        {onDeleteMeasure && score.measures.length > 1 && (
                          <button
                            onClick={() => {
                              onDeleteMeasure(mIdx);
                              setActiveMenuMeasure(null);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-red-50 text-red-600 rounded text-left cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3 text-red-600" /> 削除
                          </button>
                        )}
                      </div>
                    )}

                    {measure.beats.map((beat, bIdx) => {
                      const div = beat.div;
                      const beatHeight = isRubyOn ? 'h-16' : 'h-14';

                      return (
                        <div
                          key={bIdx}
                          className={`relative flex flex-1 min-w-0 flex-col border-l first:border-l-0 border-stone-300 ${beatHeight}`}
                        >
                          {div === 1 ? (
                            <div
                              id={`slot-h-${mIdx}-${bIdx}-0`}
                              onMouseDown={e => onSlotMouseDown?.(mIdx, bIdx, 0, e)}
                              onMouseEnter={() => onSlotMouseEnter?.(mIdx, bIdx, 0)}
                              onClick={e => onSlotClick(mIdx, bIdx, 0, false, e.shiftKey, e.ctrlKey || e.metaKey)}
                              className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                selectedSlotKeys?.has(`${mIdx}-${bIdx}-0`)
                                  ? 'bg-amber-200/90 ring-2 ring-amber-600 ring-inset'
                                  : cursor.m === mIdx && cursor.b === bIdx && cursor.s === 0
                                  ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                  : ''
                              } ${currentPlayKey === `${mIdx}-${bIdx}-0` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                            >
                              {renderSlotContentH(beat.slots[0], isArabic, isRubyOn, renderRuby, false, score.view.scoreFontSize)}
                            </div>
                          ) : (
                            <div className="flex flex-1 divide-x divide-stone-300">
                              {beat.slots.map((sl, sIdx) => {
                                const slotKey = `${mIdx}-${bIdx}-${sIdx}`;
                                const isMultiSel = selectedSlotKeys?.has(slotKey);
                                return (
                                  <div
                                    key={sIdx}
                                    id={`slot-h-${mIdx}-${bIdx}-${sIdx}`}
                                    onMouseDown={e => onSlotMouseDown?.(mIdx, bIdx, sIdx, e)}
                                    onMouseEnter={() => onSlotMouseEnter?.(mIdx, bIdx, sIdx)}
                                    onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey, e.ctrlKey || e.metaKey)}
                                    className={`relative flex flex-1 flex-col items-center justify-center cursor-pointer transition-colors ${
                                      isMultiSel
                                        ? 'bg-amber-200/90 ring-2 ring-amber-600 ring-inset'
                                        : cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx
                                        ? 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset'
                                        : ''
                                    } ${currentPlayKey === `${mIdx}-${bIdx}-${sIdx}` ? 'bg-amber-300/80 ring-2 ring-amber-500' : 'hover:bg-amber-50/50'}`}
                                  >
                                    {renderSlotContentH(sl, isArabic, isRubyOn, renderRuby, false, score.view.scoreFontSize)}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {score.view.showLyrics && (
                            <input
                              type="text"
                              data-lyric-input={`${mIdx}-${bIdx}`}
                              value={beat.lyrics || ''}
                              onChange={e => onLyricsChange && onLyricsChange(mIdx, bIdx, e.target.value)}
                              onKeyDown={e => handleLyricKeyDown(e, mIdx, bIdx, score.measures)}
                              placeholder="歌詞"
                              className="w-full text-center border-t border-dotted border-stone-400 bg-transparent px-0.5 focus:bg-white focus:outline-none text-[10px]"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {Array.from({ length: perLine - row.measures.length }).map((_, emptyIdx) => (
                <div
                  key={`empty-${emptyIdx}`}
                  style={{ width: `${100 / perLine}%`, flexBasis: `${100 / perLine}%` }}
                  className="border-l border-stone-300/60 bg-stone-50/20 min-w-0 shrink-0"
                />
              ))}
            </div>
          </div>
        ))}

        {onAddMeasure && (
          <div className="flex justify-center pt-2 no-print">
            <button
              onClick={onAddMeasure}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-4 py-2 text-xs font-semibold text-stone-500 hover:border-amber-600 hover:bg-amber-50/50 hover:text-amber-800 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>小節を追加</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function renderSlotContentH(
  sl: any,
  isArabic: boolean,
  isRubyOn: boolean,
  renderRuby: (notes: number[], oshi?: number, ato?: boolean) => React.ReactNode,
  small: boolean = false,
  scoreFontSize?: string
) {
  if (!sl) return null;
  if (sl.rest) {
    return <span className="text-lg leading-none font-sans font-light text-stone-900">休</span>;
  }
  if (sl.tie) {
    return <span className="w-3/4 h-0.5 bg-stone-900 block"></span>;
  }
  if (sl.repeat2) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full" title="2拍前くり返し">
        <span className="font-score font-black text-2xl sm:text-3xl text-stone-900 leading-none select-none tracking-tighter">
          𝄀𝄀
        </span>
      </div>
    );
  }

  let lh = '';
  if (sl.oshi === 1) lh += '強';
  else if (sl.oshi === 2) lh += '巾';
  LEFT_HAND_ORNS.forEach(k => {
    if (sl[k]) lh += ORN_MARKS[k];
  });

  let rh = '';
  RIGHT_HAND_ORNS.forEach(k => {
    if (sl[k]) rh += ORN_MARKS[k];
  });

  const noteCount = sl.notes?.length || 0;
  const isChord = noteCount > 1;
  const fingerText = sl.finger ? String(sl.finger) : '';

  if (noteCount === 0) {
    if (!lh && !rh && !fingerText) return null;
    return (
      <div className="relative flex items-center justify-center w-full h-full px-0.5 overflow-hidden select-none">
        {rh && (
          <span className="absolute right-0.5 top-0.5 text-[9px] font-semibold text-stone-800 leading-none font-score select-none">
            {rh}
          </span>
        )}
        {fingerText && (
          <span className="absolute right-1 top-0.5 font-sans font-extrabold text-[9px] text-amber-950 bg-amber-200/90 rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none shadow-2xs">
            {fingerText}
          </span>
        )}
        <div className="w-full max-w-full flex items-center justify-center shrink-0">
          <div className="flex items-center justify-center gap-0.5 select-none font-score leading-none">
            {lh && (
              <span className="text-xs sm:text-sm shrink-0 font-semibold text-red-700/90 font-score tracking-tighter mr-0.5 select-none">
                {lh}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center w-full h-full px-0.5 overflow-hidden">
      {rh && (
        <span className="absolute right-0.5 top-0.5 text-[9px] font-semibold text-stone-900 leading-none font-score select-none">
          {rh}
        </span>
      )}
      {fingerText && (
        <span className="absolute right-1 top-0.5 font-sans font-extrabold text-[9px] text-amber-950 bg-amber-200/90 rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none shadow-2xs select-none">
          {fingerText}
        </span>
      )}
      <div className="w-full max-w-full flex items-center justify-center shrink-0">
        <div className="flex items-center justify-center gap-0.5 select-none font-score leading-none">
          {lh && (
            <span className="text-xs sm:text-sm shrink-0 font-semibold text-red-700/90 font-score tracking-tighter mr-0.5 select-none">
              {lh}
            </span>
          )}
          {sl.notes.map((n: number, idx: number) => {
            const char = isArabic ? String(n + 1) : KANJI_STRINGS[n];
            return (
              <span
                key={idx}
                className={`text-base sm:text-lg font-bold shrink-0 ${isChord ? 'border-b border-stone-400/50 pb-0.5' : ''} ${isArabic ? 'font-sans' : ''}`}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>
      {isRubyOn && renderRuby(sl.notes, sl.oshi, sl.ato)}
    </div>
  );
}
