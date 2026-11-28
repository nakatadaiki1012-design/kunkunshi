/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModal } from '../hooks/useModal';
import React from 'react';
import {
  KunkunshiScore,
  TUNING_PRESETS,
  KANDOKORO,
  STRING_NAMES,
  POSITIONS_BY_STRING,
  HON_NAMES,
  HON_BASE_MIDI,
  honOfRoot,
  getPitches,
  getOpenStrings,
  noteName,
  midiToHz,
  clamp
} from '../types/kunkunshi';
import { sanshinSynth } from '../audio/sanshinSynth';
import { Volume2, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

interface TuningModalProps {
  score: KunkunshiScore;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTuning: (newTuning: KunkunshiScore['tuning']) => void;
}

export const TuningModal: React.FC<TuningModalProps> = ({
  score,
  isOpen,
  onClose,
  onUpdateTuning
}) => {
  useModal(isOpen, onClose);

  if (!isOpen) return null;

  const currentTuning = score.tuning;
  const pitches = getPitches(score);
  const open = getOpenStrings(score);

  const handlePresetChange = (presetKey: string) => {
    if (presetKey === 'custom') {
      onUpdateTuning({
        ...currentTuning,
        preset: 'custom',
        custom: [...open]
      });
    } else {
      onUpdateTuning({
        ...currentTuning,
        preset: presetKey,
        custom: null
      });
    }
  };

  const handleRootChange = (newRoot: number) => {
    onUpdateTuning({
      ...currentTuning,
      root: clamp(newRoot, 45, 56)
    });
  };

  const handleTranspose = (delta: number) => {
    if (currentTuning.preset === 'custom' && currentTuning.custom) {
      onUpdateTuning({
        ...currentTuning,
        custom: currentTuning.custom.map(p => p + delta)
      });
    } else {
      onUpdateTuning({
        ...currentTuning,
        root: clamp(currentTuning.root + delta, 45, 56)
      });
    }
  };

  const handleCustomStringPitchChange = (index: number, newPitch: number) => {
    const newCustom: number[] = [...open];
    newCustom[index] = clamp(newPitch, 24, 96);
    onUpdateTuning({
      ...currentTuning,
      preset: 'custom',
      custom: newCustom
    });
  };

  const playPitch = (str: number, midi: number) => {
    sanshinSynth.pluck(str, midi, 0, 0.9);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="ちんだみ（調弦）" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-stone-50 border border-stone-300 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h2 className="text-xl font-bold font-score text-stone-900">ちんだみ（調弦）</h2>
            <p className="text-xs text-stone-500 mt-0.5">調子（本調子・二揚げ・三下げ…）と、高さ（〜本）を選びます</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Preset Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">調子（プリセット）</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(TUNING_PRESETS).map(([key, preset]) => {
                const isSelected = currentTuning.preset === key;
                return (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key)}
                    className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/30'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <span className="font-bold text-sm font-score">{preset.name}</span>
                    <span className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">{preset.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Root Note & Transpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-stone-100/70 p-4 border border-stone-200">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                高さ（男弦の音）: {honOfRoot(currentTuning.root)}（{noteName(currentTuning.root)}）
              </label>
              <select
                disabled={currentTuning.preset === 'custom'}
                value={currentTuning.root}
                onChange={e => handleRootChange(Number(e.target.value))}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 disabled:opacity-50"
              >
                {HON_NAMES.map((hon, i) => {
                  // 1本（A）がいちばん低く、12本（G♯）がいちばん高い
                  const m = HON_BASE_MIDI + i;
                  return (
                    <option key={m} value={m}>
                      {hon}（{noteName(m, false)}）{i === 3 ? '― よく使う高さ' : ''}
                    </option>
                  );
                })}
              </select>
              <p className="mt-1 text-[10px] text-stone-500">ふつうは4本（C）。声の高さに合わせて変えます。</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">全体移調（半音シフト）</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTranspose(-1)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md border border-stone-300 bg-white py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <ArrowDown className="h-3.5 w-3.5 text-stone-500" /> 半音下げ (-1)
                </button>
                <button
                  onClick={() => handleTranspose(1)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md border border-stone-300 bg-white py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <ArrowUp className="h-3.5 w-3.5 text-stone-500" /> 半音上げ (+1)
                </button>
              </div>
            </div>
          </div>

          {/* 3本の弦と勘所の一覧 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-700">3本の弦と勘所の音</label>
              <span className="text-[11px] text-stone-500">スピーカーや勘所を押すと音を確かめられます</span>
            </div>
            <div className="flex flex-col gap-2">
              {[2, 1, 0].map(str => {
                const midi = open[str];
                return (
                  <div key={str} className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white p-2 text-xs shadow-2xs">
                    <div className="flex items-center gap-2 w-40 shrink-0">
                      <span className="flex h-7 px-1.5 items-center justify-center rounded bg-stone-900 font-score font-bold text-stone-50">
                        {STRING_NAMES[str]}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-800">{noteName(midi)}</span>
                        <span className="text-[10px] text-stone-400 font-mono">{Math.round(midiToHz(midi))}Hz</span>
                      </div>
                      {currentTuning.preset === 'custom' && (
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleCustomStringPitchChange(str, midi + 1)}
                            className="px-1 text-[10px] bg-stone-100 hover:bg-stone-200 rounded cursor-pointer"
                            aria-label={`${STRING_NAMES[str]}を半音上げる`}
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleCustomStringPitchChange(str, midi - 1)}
                            className="px-1 text-[10px] bg-stone-100 hover:bg-stone-200 rounded cursor-pointer"
                            aria-label={`${STRING_NAMES[str]}を半音下げる`}
                          >
                            -
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => playPitch(str, midi)}
                        className="rounded p-1 text-stone-500 hover:bg-amber-100 hover:text-amber-800 cursor-pointer"
                        title="開放弦を試聴"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {POSITIONS_BY_STRING[str].map(pos => (
                        <button
                          key={pos}
                          onClick={() => playPitch(str, pitches[pos])}
                          className="flex items-baseline gap-1 rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 hover:bg-amber-50 hover:border-amber-400 cursor-pointer"
                          title={`${KANDOKORO[pos].name}（${KANDOKORO[pos].yomi}）・${KANDOKORO[pos].finger}`}
                        >
                          <span className="font-score font-bold text-sm text-stone-900">{KANDOKORO[pos].name}</span>
                          <span className="text-[10px] text-stone-500">{noteName(pitches[pos], false)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-stone-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};
