/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KunkunshiScore, TuningType } from '../types/kunkunshi';
import { Sparkles, X, Loader2, Key } from 'lucide-react';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScoreGenerated: (newScore: KunkunshiScore) => void;
  currentScore: KunkunshiScore;
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onScoreGenerated,
  currentScore
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'transpose'>('generate');
  const [songTitle, setSongTitle] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [tuning, setTuning] = useState<TuningType>('Honchoushi');
  const [targetTuning, setTargetTuning] = useState<TuningType>('Niagari');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/generate-kunkunshi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songTitle, userPrompt, tuning }),
      });

      const data = await response.json();
      if (!data.success || !data.score) {
        throw new Error(data.error || '工工四の生成に失敗しました。');
      }

      onScoreGenerated(data.score);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || '通信エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranspose = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/transpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: currentScore, targetTuning }),
      });

      const data = await response.json();
      if (!data.success || !data.score) {
        throw new Error(data.error || '移調処理に失敗しました。');
      }

      onScoreGenerated(data.score);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || '通信エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-slate-100">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100 font-serif">
              AI 工工四（クンクンシー）作成＆アシスタント
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center border-b border-slate-800 text-xs bg-slate-900">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-3 text-center font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'generate'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            新規楽曲から自動生成
          </button>
          <button
            onClick={() => setActiveTab('transpose')}
            className={`flex-1 py-3 text-center font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'transpose'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            調子変換 (本調子↔二揚げ)
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {activeTab === 'generate' ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  曲名 / 歌詞フレーズ <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="例: ハイサイおじさん, 島人ぬ宝, 芭蕉布..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 font-serif focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">基本調子</label>
                <select
                  value={tuning}
                  onChange={(e) => setTuning(e.target.value as TuningType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="Honchoushi">本調子 (C-F-C)</option>
                  <option value="Niagari">二揚げ (C-G-C)</option>
                  <option value="Sanagari">三揚げ (C-F-A#)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  追加の指示 (任意)
                </label>
                <textarea
                  rows={3}
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="例: 初心者向けに基本の抑えで作成してください。"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-lg">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !songTitle.trim()}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AIが工工四を生成中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>AIで工工四を生成</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">現在開いている曲:</span>
                <span className="font-serif font-bold text-sm text-amber-300">{currentScore.title}</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">変換後の目標調子</label>
                <select
                  value={targetTuning}
                  onChange={(e) => setTargetTuning(e.target.value as TuningType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="Honchoushi">本調子 (C-F-C)</option>
                  <option value="Niagari">二揚げ (C-G-C)</option>
                  <option value="Sanagari">三揚げ (C-F-A#)</option>
                </select>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-lg">
                  {errorMessage}
                </div>
              )}

              <button
                onClick={handleTranspose}
                disabled={isLoading || currentScore.tuning === targetTuning}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>調子を自動変換中...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>{targetTuning} へ移調・変換</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
