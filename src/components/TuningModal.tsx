/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { KunkunshiScore, TuningType } from '../types/kunkunshi';
import { Sliders, Volume2, X } from 'lucide-react';
import { sanshinSynth } from '../utils/audioSynth';

interface TuningModalProps {
  score: KunkunshiScore;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTuning: (tuning: TuningType, pitchKey: string) => void;
}

export const TuningModal: React.FC<TuningModalProps> = ({
  score,
  isOpen,
  onClose,
  onUpdateTuning
}) => {
  if (!isOpen) return null;

  const playPitchTest = (note: string) => {
    sanshinSynth.playNote(note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold font-serif text-slate-100">
              三線の調子・高さ（勘所）設定
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">調子（チューニング）</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Honchoushi', name: '本調子 (C-F-C)', desc: '標準的な基本調子。1弦と2弦が4度、2弦と3弦が5度。' },
                { id: 'Niagari', name: '二揚げ (C-G-C)', desc: '中弦（2弦）を全音上げた調子。賑やかな祝宴曲など。' },
                { id: 'Sanagari', name: '三揚げ (C-F-B♭)', desc: '女弦（3弦）を下げる調子。独特の和風旋律。' },
                { id: 'Custom', name: 'カスタム調子', desc: '自由チューニング設定' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => onUpdateTuning(item.id as TuningType, score.pitchKey)}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer ${
                    score.tuning === item.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-sm">{item.name}</span>
                  <span className="text-[10px] text-slate-400 leading-relaxed">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">勘所の高さ（本数・基調音）</label>
            <select
              value={score.pitchKey}
              onChange={e => onUpdateTuning(score.tuning, e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="1本本調子 (A-D-A)">1本本調子 (A-D-A / 低音)</option>
              <option value="2本本調子 (A#-D#-A#)">2本本調子 (A#-D#-A#)</option>
              <option value="3本本調子 (B-E-B)">3本本調子 (B-E-B)</option>
              <option value="4本本調子 (C-F-C)">4本本調子 (C-F-C / 標準)</option>
              <option value="5本本調子 (C#-F#-C#)">5本本調子 (C#-F#-C#)</option>
              <option value="6本本調子 (D-G-D)">6本本調子 (D-G-D / 高音)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-2">基本音の試聴（テスト鳴らし）</label>
            <div className="flex flex-wrap gap-2">
              {['合', '四', '七', '工', '五', '六', '八', '九', '巾'].map(n => (
                <button
                  key={n}
                  onClick={() => playPitchTest(n)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-amber-600 hover:text-slate-950 text-amber-300 font-serif font-bold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{n}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-end border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow cursor-pointer"
          >
            設定完了
          </button>
        </div>
      </div>
    </div>
  );
};
