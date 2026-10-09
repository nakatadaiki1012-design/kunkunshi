/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KunkunshiScore, ViewMode } from '../types/kunkunshi';
import { exportAppFilesZip } from '../utils/zipExport';
import {
  Music,
  Sliders,
  FolderOpen,
  Download,
  HelpCircle,
  Play,
  Edit3,
  Printer,
  Sparkles,
  Maximize2,
  FilePlus,
  Package,
  Loader2,
  Settings2,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface HeaderProps {
  currentScore: KunkunshiScore;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenAiModal: () => void;
  onOpenPresetModal: () => void;
  onOpenTuningModal: () => void;
  onOpenNewScoreModal: () => void;
  onOpenHelpModal: () => void;
  onExportJson: () => void;
  onToggleFullscreen: () => void;
  onUpdateScoreMeta: (meta: Partial<KunkunshiScore>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScore,
  viewMode,
  setViewMode,
  onOpenAiModal,
  onOpenPresetModal,
  onOpenTuningModal,
  onOpenNewScoreModal,
  onOpenHelpModal,
  onExportJson,
  onToggleFullscreen,
  onUpdateScoreMeta
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleDownloadAppZip = async () => {
    try {
      setIsDownloadingZip(true);
      const blob = await exportAppFilesZip(currentScore);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kunkunshi-editor-app-files.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('ZIP出力エラー: ' + (e?.message || ''));
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-1.5 px-4 py-2.5 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      {/* Top Header Zone */}
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Song Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-lg shadow-sm font-serif">
              工
            </div>
            <span className="text-base font-bold tracking-tight text-amber-400 whitespace-nowrap shrink-0 font-serif">
              工工四エディタ Pro
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-700 text-xs text-slate-300">
            <Music className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <input
              type="text"
              value={currentScore.title}
              onChange={e => onUpdateScoreMeta({ title: e.target.value })}
              className="bg-transparent font-bold text-slate-100 focus:outline-none focus:border-b focus:border-amber-400 font-serif text-sm max-w-[180px]"
              placeholder="曲名を入力"
            />
            <span className="text-amber-400 font-mono">({currentScore.pitchKey})</span>
          </div>
        </div>

        {/* View Mode Buttons */}
        <nav className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('performance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'performance'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="演奏・視認特化モード"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>演奏モード</span>
          </button>

          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'edit'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="工工四の編集"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>編集モード</span>
          </button>

          <button
            onClick={() => setViewMode('print')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'print'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="印刷・PDF用"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>印刷モード</span>
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenNewScoreModal}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="新規工工四スコアを作成"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">新規</span>
          </button>

          <button
            onClick={onOpenPresetModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
            title="既存の工工四データ読み込み / ライブラリ"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">曲ライブラリ</span>
          </button>

          <button
            onClick={onOpenTuningModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition-colors border border-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
            title="調子（本調子・二揚げ・三揚げ）設定"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">調子</span>
          </button>

          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="AIで工工四自動生成"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI工工四作成</span>
          </button>

          <button
            onClick={handleDownloadAppZip}
            disabled={isDownloadingZip}
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="ソースコードZIP保存"
          >
            {isDownloadingZip ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Package className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="全画面表示"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenHelpModal}
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="ヘルプ"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
