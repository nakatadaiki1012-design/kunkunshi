/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  KunkunshiCell,
  MALE_STRING_NOTES,
  MIDDLE_STRING_NOTES,
  FEMALE_STRING_NOTES,
  REST_RHYTHM_NOTES
} from '../types/kunkunshi';
import { Plus, Trash2, ArrowRight, ArrowLeft, Eraser } from 'lucide-react';

interface DockProps {
  selectedCell: KunkunshiCell | null;
  selectedColumnId: string | null;
  onUpdateCellNote: (note: string) => void;
  onUpdateCellTechnique: (technique: string) => void;
  onUpdateCellLyric: (lyric: string) => void;
  onClearCell: () => void;
  onAddColumn: () => void;
  onDeleteColumn: () => void;
  onSelectNextCell: () => void;
  onSelectPrevCell: () => void;
}

export const Dock: React.FC<DockProps> = ({
  selectedCell,
  selectedColumnId,
  onUpdateCellNote,
  onUpdateCellTechnique,
  onUpdateCellLyric,
  onClearCell,
  onAddColumn,
  onDeleteColumn,
  onSelectNextCell,
  onSelectPrevCell
}) => {
  if (!selectedCell) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-3 text-center text-xs text-slate-400 shadow-2xl flex items-center justify-between px-6 select-none">
        <span>👈 編集したいセル（マス目）をクリックしてください</span>
        <button
          onClick={onAddColumn}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>新しい列（行）を追加</span>
        </button>
      </div>
    );
  }

  const techniques = ['打', '踏', '弾', '掛', ''];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-slate-950/95 backdrop-blur border-t-2 border-amber-500/60 p-3 shadow-2xl text-slate-100 max-h-[260px] overflow-y-auto select-none">
      <div className="max-w-6xl mx-auto flex flex-col gap-2.5">
        {/* Active Cell Info & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded">
              選択中セル: {selectedCell.id}
            </span>
            <span className="text-slate-400 font-serif">
              音階: <strong className="text-white font-black text-sm">{selectedCell.note || '未入力'}</strong>
            </span>
          </div>

          {/* Lyric Input */}
          <div className="flex items-center gap-2">
            <label className="text-slate-400 font-medium">歌詞 (1文字):</label>
            <input
              type="text"
              value={selectedCell.lyric || ''}
              onChange={(e) => onUpdateCellLyric(e.target.value)}
              placeholder="例: あ"
              maxLength={2}
              className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-serif text-amber-300 font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onSelectPrevCell}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
              title="前のマスへ"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">前マス</span>
            </button>

            <button
              onClick={onSelectNextCell}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
              title="次のマスへ"
            >
              <span className="hidden sm:inline">次マス</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClearCell}
              className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded border border-red-800/80 flex items-center gap-1 cursor-pointer"
              title="マスをクリア"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">消去</span>
            </button>

            <span className="text-slate-700">|</span>

            <button
              onClick={onAddColumn}
              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>列追加</span>
            </button>

            {selectedColumnId && (
              <button
                onClick={onDeleteColumn}
                className="p-1.5 bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                title="選択中の列を削除"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Note Pitch Keypad Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* 男弦 */}
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-amber-500 font-bold block mb-1">【男弦】（低音）</span>
            <div className="flex flex-wrap gap-1.5">
              {MALE_STRING_NOTES.map((note) => (
                <button
                  key={note}
                  onClick={() => {
                    onUpdateCellNote(note);
                    onSelectNextCell();
                  }}
                  className={`px-3 py-1.5 rounded font-serif text-sm font-bold border transition-transform active:scale-95 cursor-pointer ${
                    selectedCell.note === note
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* 中弦 */}
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-amber-500 font-bold block mb-1">【中弦】（中音）</span>
            <div className="flex flex-wrap gap-1.5">
              {MIDDLE_STRING_NOTES.map((note) => (
                <button
                  key={note}
                  onClick={() => {
                    onUpdateCellNote(note);
                    onSelectNextCell();
                  }}
                  className={`px-3 py-1.5 rounded font-serif text-sm font-bold border transition-transform active:scale-95 cursor-pointer ${
                    selectedCell.note === note
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* 女弦 */}
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-amber-500 font-bold block mb-1">【女弦】（高音）</span>
            <div className="flex flex-wrap gap-1.5">
              {FEMALE_STRING_NOTES.map((note) => (
                <button
                  key={note}
                  onClick={() => {
                    onUpdateCellNote(note);
                    onSelectNextCell();
                  }}
                  className={`px-3 py-1.5 rounded font-serif text-sm font-bold border transition-transform active:scale-95 cursor-pointer ${
                    selectedCell.note === note
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* 休符 & 技法 */}
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col gap-1.5">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1">休符 / 記号</span>
              <div className="flex flex-wrap gap-1">
                {REST_RHYTHM_NOTES.map((note) => (
                  <button
                    key={note}
                    onClick={() => {
                      onUpdateCellNote(note);
                      onSelectNextCell();
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-serif font-bold rounded border border-slate-700 cursor-pointer"
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-red-400 font-bold block mb-1">奏法記号 (打/踏/弾)</span>
              <div className="flex flex-wrap gap-1">
                {techniques.map((tech) => (
                  <button
                    key={tech || 'none'}
                    onClick={() => onUpdateCellTechnique(tech)}
                    className={`px-2 py-0.5 text-xs font-bold rounded border cursor-pointer ${
                      selectedCell.technique === tech
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-slate-800 hover:bg-slate-700 text-red-300 border-slate-700'
                    }`}
                  >
                    {tech || 'なし'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
