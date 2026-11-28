/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModal } from '../hooks/useModal';
import React, { useState } from 'react';
import {
  KunkunshiScore,
  createNewMeasure,
  getDefaultView,
  createEmptyScore,
  ScoreLayout,
  HON_NAMES,
  HON_BASE_MIDI,
  noteName
} from '../types/kunkunshi';
import {
  FilePlus,
  Music2,
  Sliders,
  Clock,
  Sparkles,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround,
  X,
  Check,
  Music4
} from 'lucide-react';

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
  // Wizard state with sensible defaults
  const [title, setTitle] = useState('無題');
  const [subtitle, setSubtitle] = useState('');
  const [composer, setComposer] = useState('');
  const [root, setRoot] = useState(48);
  const [tuningPreset, setTuningPreset] = useState('honchoshi');
  const [beatsPerMeasure, setBeatsPerMeasure] = useState<2 | 3 | 4>(4);
  const [measureCount, setMeasureCount] = useState(12);
  const [tempo, setTempo] = useState(90);
  const [layout, setLayout] = useState<ScoreLayout>('vertical');
  const [showAdvancedMeta, setShowAdvancedMeta] = useState(false);

  useModal(isOpen, onClose);

  if (!isOpen) return null;

  // よく使う調子
  const popularTunings = [
    { id: 'honchoshi', name: '本調子', tag: 'いちばん基本' },
    { id: 'niagari', name: '二揚げ', tag: '明るく華やか' },
    { id: 'sansage', name: '三下げ', tag: 'しっとり' },
    { id: 'ichiagari', name: '一揚げ', tag: '男弦を上げる' }
  ];

  const handleBuildAndCreate = () => {
    const baseView = getDefaultView();
    baseView.layout = layout;

    const newScore: KunkunshiScore = {
      app: 'kunkunshi',
      version: 1,
      id: `score_${Date.now()}`,
      title: title.trim() || '無題',
      subtitle: subtitle.trim(),
      composer: composer.trim(),
      tempo,
      beatsPerMeasure,
      tuning: { preset: tuningPreset, root, custom: null },
      view: baseView,
      measures: Array.from({ length: measureCount }, () => createNewMeasure(beatsPerMeasure)),
      updatedAt: Date.now()
    };

    onCreateScore(newScore);
    onClose();
  };

  // いちばんよく使う設定で、すぐ作る
  const handleInstantCreateDefault = () => {
    const newScore = createEmptyScore();
    newScore.id = `score_${Date.now()}`;
    newScore.measures = Array.from({ length: 12 }, () => createNewMeasure(4));
    onCreateScore(newScore);
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="新しい楽譜を作成" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/65 p-3 sm:p-4 backdrop-blur-xs no-print animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-white border border-stone-300 shadow-2xl p-5 sm:p-6 overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-sm">
              <FilePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-score text-stone-900 leading-tight">
                新しい楽譜を作成
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                調弦や拍子を選んで、空白の譜面を作成します
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
            title="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1-Click Shortcut Banner */}
        <div className="mt-4 rounded-xl bg-gradient-to-r from-indigo-50 via-amber-50 to-stone-50 border border-indigo-200/80 p-3 flex items-center justify-between gap-2">
          <div className="text-xs text-emerald-950">
            <span className="font-bold flex items-center gap-1 text-emerald-800">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> 最も一般的な設定ですぐ開始:
            </span>
            <span className="text-[11px] text-stone-600 mt-0.5 block">
              4本 本調子・4拍子・12小節・縦書き工工四
            </span>
          </div>
          <button
            onClick={handleInstantCreateDefault}
            className="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            すぐ作成
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-4">
          {/* 1. Title */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              曲名 <span className="text-stone-400 font-normal">（後からいつでも変更可能）</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="曲名を入力（例: 安里屋ユンタ、オリジナル曲）"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-score"
              autoFocus
            />
            {/* Optional Subtitle / Composer Toggle */}
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setShowAdvancedMeta(!showAdvancedMeta)}
                className="text-[11px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
              >
                {showAdvancedMeta ? '▲ 副題・作曲者を閉じる' : '▼ 副題・作曲者も入力する'}
              </button>
              {showAdvancedMeta && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-stone-100 animate-fade-in">
                  <div>
                    <label className="block text-[11px] text-stone-600 mb-0.5">副題（任意）</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={e => setSubtitle(e.target.value)}
                      placeholder="例: 八重山民謡"
                      className="w-full rounded border border-stone-300 px-2 py-1 text-xs text-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-600 mb-0.5">作曲者（任意）</label>
                    <input
                      type="text"
                      value={composer}
                      onChange={e => setComposer(e.target.value)}
                      placeholder="例: 作曲者・編曲者"
                      className="w-full rounded border border-stone-300 px-2 py-1 text-xs text-stone-800"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. 楽譜の形 */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">楽譜の形（あとから切り替えられます）</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setLayout('vertical')}
                className={`flex flex-col items-center justify-center gap-0.5 p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  layout === 'vertical'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-1 ring-indigo-600'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-1">
                  <AlignVerticalSpaceAround className="h-3.5 w-3.5" />
                  縦書き工工四
                </span>
                <span className="text-[10px] font-normal text-stone-500">作文用紙のようなマス目</span>
              </button>
              <button
                type="button"
                onClick={() => setLayout('tab')}
                className={`flex flex-col items-center justify-center gap-0.5 p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  layout === 'tab'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-1 ring-indigo-600'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-1">
                  <AlignHorizontalSpaceAround className="h-3.5 w-3.5" />
                  タブ譜
                </span>
                <span className="text-[10px] font-normal text-stone-500">3本の線（女弦・中弦・男弦）</span>
              </button>
              <button
                type="button"
                onClick={() => setLayout('staff')}
                className={`flex flex-col items-center justify-center gap-0.5 p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  layout === 'staff'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-1 ring-indigo-600'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Music4 className="h-3.5 w-3.5" />
                  五線譜
                </span>
                <span className="text-[10px] font-normal text-stone-500">ト音記号・下に工工四</span>
              </button>
            </div>
          </div>

          {/* 3. 調子と高さ */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">調子（ちんだみ）</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {popularTunings.map(t => {
                  const isSelected = tuningPreset === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTuningPreset(t.id)}
                      className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/90 ring-1 ring-amber-600 shadow-2xs'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-950' : 'text-stone-900'}`}>{t.name}</span>
                        {isSelected && <Check className="h-3 w-3 text-amber-700" />}
                      </div>
                      <span className="text-[10px] text-amber-800/80 font-medium mt-0.5">{t.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">高さ</label>
              <select
                value={root}
                onChange={e => setRoot(Number(e.target.value))}
                className="w-full rounded-lg border border-stone-300 bg-white px-2 py-2 text-xs font-semibold text-stone-800"
              >
                {HON_NAMES.map((hon, i) => (
                  <option key={i} value={HON_BASE_MIDI + i}>
                    {hon}（{noteName(HON_BASE_MIDI + i, false)}）
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Beats & Measures count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-stone-100">
            {/* Time signature */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                拍子
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[4, 3, 2].map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBeatsPerMeasure(b as any)}
                    className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      beatsPerMeasure === b
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {b}/4 拍子
                  </button>
                ))}
              </div>
            </div>

            {/* Measures count */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                初期小節数
              </label>
              <div className="flex items-center gap-1">
                {[6, 12, 18, 24].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setMeasureCount(cnt)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      measureCount === cnt
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {cnt}小節
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Tempo */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-stone-100">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-stone-500" />
              テンポ: ♩={tempo}
            </span>
            <div className="flex items-center gap-1.5">
              {[60, 80, 90, 110].map(tVal => (
                <button
                  key={tVal}
                  type="button"
                  onClick={() => setTempo(tVal)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                    tempo === tVal
                      ? 'border-stone-800 bg-stone-800 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {tVal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleBuildAndCreate}
            className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FilePlus className="h-4 w-4" />
            <span>空白の楽譜を作成</span>
          </button>
        </div>
      </div>
    </div>
  );
};
