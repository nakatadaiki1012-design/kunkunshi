/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  KunkunshiScore,
  CursorPosition,
  Slot,
  KANDOKORO,
  POSITION_NAMES,
  STRING_NAMES,
  LEFT_HAND_ORNS,
  RIGHT_HAND_ORNS,
  ORN_MARKS,
  getPitches,
  getOpenStrings,
  pc,
  NOTE_CDE,
  NOTE_DOREMI,
  getTuningLabel,
  noteName,
  accidentalOf,
  ACC_MARK
} from '../types/kunkunshi';
import { slotOffsetInBeat } from '../audio/timeline';
import { Plus, Play, Repeat, Trash2, Copy, Edit2, Check, X, MoreVertical } from 'lucide-react';

interface ScoreSheetTabProps {
  score: KunkunshiScore;
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
  onUpdateScoreMeta?: (meta: Partial<KunkunshiScore>) => void;
  onInsertMeasure?: (mIdx: number) => void;
  onDuplicateMeasure?: (mIdx: number) => void;
  onDeleteMeasure?: (mIdx: number) => void;
  onAddMeasure?: () => void;
  onSetLoop?: (active: boolean, a?: number, b?: number) => void;
  autoScroll?: boolean;
}

export const ScoreSheetTab: React.FC<ScoreSheetTabProps> = ({
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
  const openStrings = getOpenStrings(score);
  const perLine = score.view.perLine || 4;
  const isRubyOn = score.view.ruby !== 'off';
  const useDoremi = score.view.tabLabel === 'doremi';

  // Inline meta editing state
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

  // Group measures into rows
  const rows: { measures: number[] }[] = [];
  for (let i = 0; i < score.measures.length; i += perLine) {
    const measureIndices = [];
    for (let j = 0; j < perLine && i + j < score.measures.length; j++) {
      measureIndices.push(i + j);
    }
    rows.push({ measures: measureIndices });
  }

  // Auto-scroll active measure or active playing slot
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
      data-layout="tab"
      style={{ zoom: score.view.zoom }}
      className={`relative flex flex-col gap-6 select-none ${fontClass} text-stone-900 transition-all w-full max-w-5xl mx-auto pb-6`}
    >
      {/* Header: Title, Subtitle, Composer */}
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
              placeholder="曲名を入力"
            />
            <button onClick={saveEdit} className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded font-bold cursor-pointer">
              保存
            </button>
            <button onClick={() => setEditingField(null)} className="px-1.5 text-xs text-stone-500 cursor-pointer">
              取消
            </button>
          </div>
        ) : (
          <h1
            onClick={() => startEdit('title', score.title)}
            className="group relative text-2xl sm:text-3xl font-extrabold tracking-widest text-stone-950 font-score cursor-pointer hover:text-indigo-900 transition-colors flex items-center gap-2 justify-center"
            title="クリックして曲名を編集"
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
              placeholder="副題を入力"
            />
            <button onClick={saveEdit} className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded font-bold cursor-pointer">
              保存
            </button>
          </div>
        ) : (
          <h2
            onClick={() => startEdit('subtitle', score.subtitle || '')}
            className="group text-sm font-semibold text-stone-600 mt-1 font-score tracking-wider cursor-pointer hover:text-indigo-900"
            title="クリックして副題を編集"
          >
            {score.subtitle || <span className="opacity-0 group-hover:opacity-60 text-xs">+副題を追加</span>}
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
                placeholder="作曲 / 編曲者"
              />
              <button onClick={saveEdit} className="px-1.5 py-0.5 text-xs bg-indigo-600 text-white rounded cursor-pointer">
                保存
              </button>
            </div>
          ) : (
            <span
              onClick={() => startEdit('composer', score.composer || '')}
              className="group cursor-pointer hover:text-indigo-900"
              title="クリックして作曲・編曲者を編集"
            >
              {score.composer ? `作曲 / 編曲: ${score.composer}` : <span className="opacity-0 group-hover:opacity-60">+作曲者</span>}
            </span>
          )}

          <div className="flex items-center gap-4">
            <span className="font-semibold text-stone-800">{score.beatsPerMeasure}/4 拍子</span>

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
                title="クリックしてテンポを変更"
              >
                ♩={score.tempo}
              </span>
            )}

            <span>{getTuningLabel(score)}</span>
          </div>
        </div>

        {/* Tuning Chart (Horizontal) */}
        {score.view.chart === 'on' && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-sans border border-stone-300 rounded bg-stone-50/80 px-3 py-1.5 shadow-xs">
            <span className="font-bold text-stone-700">調弦:</span>
            {STRING_NAMES.map((k, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <span className="font-score font-semibold text-stone-900">{k}</span>
                <span className="text-stone-500">{noteName(openStrings[i], false)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rows of Measures */}
      <div className="flex flex-col gap-4">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="score-row flex items-stretch pt-4">
            {/* 行の左端：弦の名前（上から 女弦・中弦・男弦） */}
            <div className="w-9 shrink-0 relative font-score text-stone-600" style={{ height: ROW_H }}>
              {[2, 1, 0].map(str => (
                <span
                  key={str}
                  className="absolute right-1 -translate-y-1/2 text-[11px] font-bold leading-none"
                  style={{ top: lineY(str) }}
                >
                  {STRING_NAMES[str].slice(0, 1)}
                </span>
              ))}
              <span className="absolute left-0 top-0 font-sans text-[10px] text-stone-400 tabular-nums">
                {row.measures[0] + 1}
              </span>
            </div>

            {/* 1行ぶんの小節（3本の線の上に勘所の文字を置く） */}
            <div className="relative flex flex-1 border-l-[3px] border-stone-900">
              {/* 3本の弦の線 */}
              {[2, 1, 0].map(str => (
                <div
                  key={str}
                  className="absolute left-0 right-0 h-px bg-stone-500 pointer-events-none"
                  style={{ top: lineY(str) }}
                />
              ))}
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
                    className={`relative flex flex-1 min-w-0 border-r-[2px] border-stone-900 transition-colors ${
                      mIdx === score.measures.length - 1 ? 'border-r-[5px] border-double border-stone-950' : ''
                    } ${
                      isSelectedMeasure
                        ? 'bg-amber-100/60 ring-2 ring-indigo-500/50'
                        : isCurrentCursorMeasure
                        ? 'bg-indigo-50/40'
                        : ''
                    }`}
                  >
                    {/* Measure Number Clickable & Actions */}
                    <div className="absolute left-1 -top-4 z-20 flex items-center gap-0.5">
                      <button
                        onClick={() => onMeasureClick(mIdx)}
                        title={`第${mIdx + 1}小節から再生 (右アイコンで小節操作)`}
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
                        title="小節メニュー（挿入・複製・削除・ループ）"
                      >
                        <MoreVertical className="h-2.5 w-2.5" />
                      </button>
                    </div>

                    {/* Measure Actions Popover */}
                    {activeMenuMeasure === mIdx && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="absolute left-6 -top-2 z-40 flex flex-col gap-1 rounded-lg bg-white p-1.5 shadow-xl border border-stone-300 text-xs min-w-[145px] text-stone-700 no-print"
                      >
                        <div className="flex items-center justify-between border-b pb-1 font-bold text-stone-800 text-[11px]">
                          <span>第{mIdx + 1}小節の操作</span>
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
                        {onSetLoop && (
                          <>
                            <button
                              onClick={() => {
                                onSetLoop(true, mIdx + 1, score.measures.length);
                                setActiveMenuMeasure(null);
                              }}
                              className="flex items-center gap-1.5 px-2 py-1 hover:bg-stone-100 rounded text-left cursor-pointer"
                            >
                              <Repeat className="h-3 w-3 text-amber-600" /> ループ開始(A)に設定
                            </button>
                            <button
                              onClick={() => {
                                onSetLoop(true, 1, mIdx + 1);
                                setActiveMenuMeasure(null);
                              }}
                              className="flex items-center gap-1.5 px-2 py-1 hover:bg-stone-100 rounded text-left cursor-pointer"
                            >
                              <Repeat className="h-3 w-3 text-amber-600" /> ループ終了(B)に設定
                            </button>
                          </>
                        )}
                        {onInsertMeasure && (
                          <button
                            onClick={() => {
                              onInsertMeasure(mIdx);
                              setActiveMenuMeasure(null);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-stone-100 rounded text-left cursor-pointer border-t"
                          >
                            <Plus className="h-3 w-3 text-emerald-600" /> 前に小節を挿入
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
                            <Copy className="h-3 w-3 text-blue-600" /> この小節を複製
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
                            <Trash2 className="h-3 w-3 text-red-600" /> この小節を削除
                          </button>
                        )}
                      </div>
                    )}

                    {/* 拍ごとに、音の長さに合わせた幅でマスを並べる */}
                    {measure.beats.map((beat, bIdx) => (
                      <div key={bIdx} className="relative flex flex-1 min-w-0 flex-col">
                        <div className="relative flex" style={{ height: ROW_H }}>
                          {beat.slots.map((sl, sIdx) => {
                            const start = slotOffsetInBeat(beat, sIdx);
                            const end = sIdx + 1 < beat.slots.length ? slotOffsetInBeat(beat, sIdx + 1) : 1;
                            const key = `${mIdx}-${bIdx}-${sIdx}`;
                            const isSel = selectedSlotKeys?.has(key);
                            const isCur = cursor.m === mIdx && cursor.b === bIdx && cursor.s === sIdx;
                            const isPlay = currentPlayKey === key;
                            return (
                              <div
                                key={sIdx}
                                id={`slot-h-${key}`}
                                style={{ width: `${(end - start) * 100}%` }}
                                onMouseDown={e => onSlotMouseDown?.(mIdx, bIdx, sIdx, e)}
                                onMouseEnter={() => onSlotMouseEnter?.(mIdx, bIdx, sIdx)}
                                onClick={e => onSlotClick(mIdx, bIdx, sIdx, false, e.shiftKey, e.ctrlKey || e.metaKey)}
                                className={`relative h-full cursor-pointer transition-colors ${
                                  isPlay
                                    ? 'bg-amber-300/60'
                                    : isSel
                                    ? 'bg-amber-200/70 ring-2 ring-amber-600 ring-inset'
                                    : isCur
                                    ? 'bg-indigo-100/80 ring-2 ring-indigo-600 ring-inset'
                                    : 'hover:bg-amber-50/70'
                                }`}
                              >
                                {renderTabSlot(sl, pitches, useDoremi, isRubyOn, score.view.ruby === 'cde')}
                              </div>
                            );
                          })}
                          {/* 拍の区切り（薄い点線）と3連の印 */}
                          {bIdx > 0 && (
                            <div className="absolute left-0 h-full border-l border-dotted border-stone-300 pointer-events-none" style={{ top: 0 }} />
                          )}
                          {beat.div === 3 && beat.subDiv !== '8_16_16' && beat.subDiv !== '16_16_8' && (
                            <span className="absolute left-1/2 -translate-x-1/2 bottom-0 text-[9px] italic font-sans text-stone-500 pointer-events-none">
                              3
                            </span>
                          )}
                        </div>

                        {/* 歌詞（拍ごと） */}
                        {score.view.showLyrics && (
                          <input
                            type="text"
                            value={beat.lyrics || ''}
                            onChange={e => onLyricsChange && onLyricsChange(mIdx, bIdx, e.target.value)}
                            placeholder="歌詞"
                            className="w-full text-center text-[11px] font-score bg-transparent px-0.5 focus:bg-white focus:outline-none placeholder:text-stone-300 print:placeholder-transparent"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* 行の残りを空けておき、どの行も同じ幅のグリッドにする */}
              {Array.from({ length: perLine - row.measures.length }).map((_, emptyIdx) => (
                <div
                  key={`empty-${emptyIdx}`}
                  style={{ width: `${100 / perLine}%`, flexBasis: `${100 / perLine}%` }}
                  className="min-w-0 shrink-0 bg-[#fdfcf8] relative z-10"
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
              <span>小節を追加する</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/** タブ譜1段の高さ（上の奏法記号の余白＋3本の線） */
const ROW_H = 104;
const TOP_PAD = 22;
const LINE_GAP = 30;
/** 弦の線の高さ位置（上から 女弦・中弦・男弦） */
function lineY(str: number): number {
  return TOP_PAD + (2 - str) * LINE_GAP;
}

function renderTabSlot(sl: Slot | undefined, pitches: number[], useDoremi: boolean, isRubyOn: boolean, cde: boolean) {
  if (!sl) return null;
  const center = 'absolute left-1/2 -translate-x-1/2 -translate-y-1/2 leading-none select-none';

  if (sl.rest) {
    return (
      <span className={`${center} text-base font-sans text-stone-800 bg-[#fdfcf8] px-0.5`} style={{ top: lineY(1) }}>
        ○
      </span>
    );
  }
  if (sl.tie) {
    return (
      <span className={`${center} text-base text-stone-800 bg-[#fdfcf8]`} style={{ top: lineY(1) }} title="延ばし">
        ー
      </span>
    );
  }
  if (sl.repeat2 || sl.repeat1) {
    return (
      <span className={`${center} text-xl font-score text-stone-900 bg-[#fdfcf8]`} style={{ top: lineY(1) }}>
        {sl.repeat2 ? '𝄥' : '〃'}
      </span>
    );
  }

  let marks = ACC_MARK(sl);
  LEFT_HAND_ORNS.forEach(k => {
    if (sl[k]) marks += ORN_MARKS[k];
  });
  RIGHT_HAND_ORNS.forEach(k => {
    if (sl[k]) marks += ORN_MARKS[k];
  });
  const acc = accidentalOf(sl);
  const names = cde ? NOTE_CDE : NOTE_DOREMI;

  return (
    <>
      {marks && (
        <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red-700 font-score leading-none whitespace-nowrap">
          {marks}
        </span>
      )}
      {sl.finger && (
        <span className="absolute top-0.5 right-0.5 text-[8px] font-sans font-extrabold text-amber-950 bg-amber-200/90 rounded-full w-3 h-3 flex items-center justify-center leading-none">
          {['', '人', '中', '小'][sl.finger] || sl.finger}
        </span>
      )}
      {sl.notes.map(pos => {
        const k = KANDOKORO[pos];
        if (!k) return null;
        const sounding = pitches[pos] + acc;
        const label = useDoremi ? names[pc(sounding)] : POSITION_NAMES[pos];
        return (
          <span
            key={pos}
            className={`${center} flex flex-col items-center bg-[#fdfcf8] px-0.5 font-score font-bold text-stone-950 ${
              label.length > 1 ? 'text-[13px] tracking-tighter' : 'text-lg'
            }`}
            style={{ top: lineY(k.str) }}
            title={`${k.name}（${STRING_NAMES[k.str]}）`}
          >
            {label}
            {isRubyOn && !useDoremi && (
              <span className="text-[8px] font-sans font-normal text-stone-500 leading-none">{names[pc(sounding)]}</span>
            )}
          </span>
        );
      })}
    </>
  );
}
