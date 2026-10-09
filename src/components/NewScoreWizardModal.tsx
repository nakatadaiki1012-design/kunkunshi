/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KunkunshiScore, TuningType, createEmptyKunkunshiScore } from '../types/kunkunshi';
import { FilePlus, Sparkles, X } from 'lucide-react';

interface NewScoreWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateScore: (newScore: KunkunshiScore) => void;
}

export const NewScoreWizardModal: React.FC<NewScoreWizardModalProps> = ({
  isOpen,
  onClose,
  onCreateScore
}) => {
  const [title, setTitle] = useState('安里屋ユンタ');
  const [subtitle, setSubtitle] = useState('沖縄八重山民謡');
  const [composer, setComposer] = useState('八重山古謡');
  const [tuning, setTuning] = useState<TuningType>('Honchoushi');
  const [pitchKey, setPitchKey] = useState('4本本調子 (C-F-C)');
  const [bpm, setBpm] = useState(84);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newScore = createEmptyKunkunshiScore();
    newScore.title = title.trim() || '無題の工工四';
    newScore.subtitle = subtitle.trim();
    newScore.composer = composer.trim();
    newScore.tuning = tuning;
    newScore.pitchKey = pitchKey;
    newScore.tempoBpm = bpm;

    onCreateScore(newScore);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold font-serif text-slate-100">
              新規工工四スコア作成
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">曲名 <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例: 安里屋ユンタ, 涙そうそう..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 font-serif focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">副題</label>
              <input
                type="text"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="例: 八重山民謡"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">作曲 / 作詞</label>
              <input
                type="text"
                value={composer}
                onChange={e => setComposer(e.target.value)}
                placeholder="例: 沖縄民謡"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">調子</label>
              <select
                value={tuning}
                onChange={e => setTuning(e.target.value as TuningType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Honchoushi">本調子 (C-F-C)</option>
                <option value="Niagari">二揚げ (C-G-C)</option>
                <option value="Sanagari">三揚げ (C-F-A#)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">勘所の高さ</label>
              <select
                value={pitchKey}
                onChange={e => setPitchKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="3本本調子 (B-E-B)">3本本調子 (B)</option>
                <option value="4本本調子 (C-F-C)">4本本調子 (C・標準)</option>
                <option value="5本本調子 (C#-F#-C#)">5本本調子 (C#)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">初期テンポ (BPM)</label>
            <input
              type="number"
              min={40}
              max={200}
              value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>工工四を作成</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
