import React from 'react';
import { ViewMode, KunkunshiScore } from '../types/kunkunshi';
import { Play, Edit3, Printer, Sparkles, FolderOpen, Download, Music, Maximize2 } from 'lucide-react';

interface HeaderProps {
  currentScore: KunkunshiScore;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenAiModal: () => void;
  onOpenPresetModal: () => void;
  onExportJson: () => void;
  onToggleFullscreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScore,
  viewMode,
  setViewMode,
  onOpenAiModal,
  onOpenPresetModal,
  onExportJson,
  onToggleFullscreen,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 py-3 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      {/* Zone 1: Brand Wordmark & Song Title */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-slate-950 font-bold text-lg shadow-sm">
            工
          </div>
          <span className="text-base font-bold tracking-tight text-amber-400 whitespace-nowrap shrink-0 font-serif">
            工工四エディタ Pro
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-700 text-xs text-slate-300">
          <Music className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-semibold text-slate-100 max-w-[180px] truncate">
            {currentScore.title}
          </span>
          <span className="text-slate-400">({currentScore.pitchKey})</span>
        </div>
      </div>

      {/* Zone 2: Primary View Mode Tabs (単一行・一目瞭然) */}
      <nav className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
        <button
          onClick={() => setViewMode('performance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
            viewMode === 'performance'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="演奏・視認特化モード"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>演奏モード</span>
        </button>

        <button
          onClick={() => setViewMode('edit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
            viewMode === 'edit'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="工工四の編集"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>編集モード</span>
        </button>

        <button
          onClick={() => setViewMode('print')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
            viewMode === 'print'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="印刷・PDF用"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>印刷モード</span>
        </button>
      </nav>

      {/* Zone 3: Quick Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenPresetModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 whitespace-nowrap shrink-0"
          title="既存の工工四データ読み込み / ライブラリ"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">曲ライブラリ</span>
        </button>

        <button
          onClick={onOpenAiModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          title="AIで工工四自動生成"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI工工四作成</span>
        </button>

        <button
          onClick={onExportJson}
          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
          title="JSON保存/エクスポート"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleFullscreen}
          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
          title="全画面表示"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
