/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KunkunshiScore } from '../types/kunkunshi';
import { PRESET_SCORES } from '../data/presetScores';
import { Music, Plus, Upload, Download, Trash2, CheckCircle2, FileJson, Copy, Check, X } from 'lucide-react';

interface ScoreLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore: KunkunshiScore;
  savedScores: KunkunshiScore[];
  onSelectScore: (score: KunkunshiScore) => void;
  onCreateNewScore: () => void;
  onImportJson: (jsonString: string) => void;
  onDeleteSavedScore: (id: string) => void;
}

export const ScoreLibraryModal: React.FC<ScoreLibraryModalProps> = ({
  isOpen,
  onClose,
  currentScore,
  savedScores,
  onSelectScore,
  onCreateNewScore,
  onImportJson,
  onDeleteSavedScore
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'saved' | 'import'>('presets');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          onImportJson(content);
          setImportError(null);
          onClose();
        } catch (err: any) {
          setImportError('JSONファイルの読み込みに失敗しました。');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleTextImport = () => {
    try {
      onImportJson(importText);
      setImportError(null);
      onClose();
    } catch (err: any) {
      setImportError('JSON構文エラーです。');
    }
  };

  const handleCopyCurrentJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentScore, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-slate-100">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold font-serif text-slate-100">
              工工四（クンクンシー）曲データ・ライブラリ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 pt-3 border-b border-slate-800 text-xs bg-slate-900">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'presets'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            定番・伝統曲ライブラリ ({PRESET_SCORES.length})
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'saved'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            保存した工工四 ({savedScores.length})
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            インポート / エクスポート
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2">
                <span className="text-slate-400">
                  沖縄の代表的な名曲・伝統古典曲の工工四データです。選択して編集や演奏が可能です。
                </span>
                <button
                  onClick={() => {
                    onCreateNewScore();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>新規白紙スコアを作成</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESET_SCORES.map((preset) => {
                  const isSelected = currentScore.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        onSelectScore(preset);
                        onClose();
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400/80 ring-1 ring-amber-400'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                            {preset.tuning} · {preset.pitchKey}
                          </span>
                          <h3 className="text-base font-bold text-slate-100 font-serif mt-0.5">
                            {preset.title}
                          </h3>
                          {preset.subtitle && (
                            <p className="text-slate-400 text-xs mt-0.5">{preset.subtitle}</p>
                          )}
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                        )}
                      </div>

                      {preset.notes && (
                        <p className="mt-2 text-slate-400 line-clamp-2 text-[11px] leading-relaxed">
                          {preset.notes}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-2">
                        <span>全 {preset.columns.length} 行 / {preset.tempoBpm} BPM</span>
                        <span className="text-amber-300 font-semibold">選択して読み込む →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-3">
              {savedScores.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl p-6">
                  <FileJson className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-400" />
                  <p className="font-semibold text-sm text-slate-300">保存された工工四はまだありません</p>
                  <p className="text-xs mt-1">
                    スコアを編集するとブラウザのローカルストレージに自動保存されます。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedScores.map((score) => (
                    <div
                      key={score.id}
                      className="p-4 rounded-xl border bg-slate-950/60 border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-amber-400 font-bold">
                            {score.tuning} · {score.pitchKey}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSavedScore(score.id);
                            }}
                            className="p-1 text-slate-500 hover:text-red-400 rounded cursor-pointer"
                            title="削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h3 className="text-base font-bold text-slate-100 font-serif mt-1">
                          {score.title}
                        </h3>
                        <p className="text-slate-400 text-xs mt-0.5">
                          更新日: {score.updatedAt}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          onSelectScore(score);
                          onClose();
                        }}
                        className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg transition-colors text-center cursor-pointer"
                      >
                        読み込んで表示・編集
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-200 font-serif flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>工工四 JSONファイルを読み込む</span>
                </h3>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-slate-950 hover:file:bg-amber-500 cursor-pointer"
                />
              </div>

              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-200 font-serif flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-amber-400" />
                  <span>JSONテキストを直接貼り付け</span>
                </h3>
                <textarea
                  rows={4}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="工工四のJSON文字列をここへ貼り付けてください..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleTextImport}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg cursor-pointer"
                >
                  テキストから読み込み
                </button>
              </div>

              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-200 font-serif flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>現在開いているスコアのエクスポート</span>
                </h3>
                <button
                  onClick={handleCopyCurrentJson}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>コピー完了！</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>JSONをクリップボードにコピー</span>
                    </>
                  )}
                </button>
              </div>

              {importError && (
                <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-lg">
                  {importError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
