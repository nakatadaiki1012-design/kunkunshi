/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KunkunshiScore, getTuningLabel, TEMPO_MIN, TEMPO_MAX, TUNING_PRESETS, honOfRoot } from '../types/kunkunshi';
import {
  Music,
  Sliders,
  FolderOpen,
  Download,
  HelpCircle,
  Eye,
  ZoomIn,
  ZoomOut,
  Type,
  ChevronDown,
  ChevronUp,
  Settings2,
  Maximize2,
  Printer,
  FilePlus
} from 'lucide-react';

interface HeaderProps {
  score: KunkunshiScore;
  onUpdateScoreMeta: (meta: Partial<KunkunshiScore>) => void;
  onUpdateView: (view: Partial<KunkunshiScore['view']>) => void;
  onOpenLibrary: () => void;
  onOpenTuning: () => void;
  onOpenExport: () => void;
  onOpenHelp: () => void;
  onOpenPracticeMode?: () => void;
  onOpenNewScoreWizard?: () => void;
  onPrint?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  score,
  onUpdateScoreMeta,
  onUpdateView,
  onOpenLibrary,
  onOpenTuning,
  onOpenExport,
  onOpenHelp,
  onOpenPracticeMode,
  onOpenNewScoreWizard,
  onPrint
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [tempoText, setTempoText] = useState(String(score.tempo));
  // 他の場所（演奏モード・元に戻すなど）でテンポが変わったら入力欄にも反映する
  useEffect(() => {
    setTempoText(String(score.tempo));
  }, [score.tempo]);
  const view = score.view;

  const handleZoom = (delta: number) => {
    const nextZoom = Math.min(1.5, Math.max(0.65, Math.round((view.zoom + delta) * 100) / 100));
    onUpdateView({ zoom: nextZoom });
  };

  return (
    <header className="shrink-0 flex flex-col gap-1.5 short:gap-0.5 overflow-hidden rounded-xl border border-indigo-900/20 bg-stone-50/95 px-2.5 sm:px-3 pb-1 sm:pb-1.5 shadow-sm backdrop-blur-md no-print transition-all">
      {/* ミンサー織の帯（五つと四つの絣） */}
      <div className="minsa-band -mx-2.5 sm:-mx-3" aria-hidden="true" />
      {/* Top row: Brand & Primary Modals */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex items-center gap-1.5" title="工工四エディタ">
          {/* 赤瓦の色に、ハイビスカスの花 */}
          <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-800 text-white shadow-xs ring-1 ring-amber-400/60">
            <span className="font-score font-extrabold text-sm sm:text-base leading-none">工</span>
            <svg viewBox="0 0 20 20" className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5" aria-hidden="true">
              <g fill="#fbb817">
                {[0, 72, 144, 216, 288].map(r => (
                  <ellipse key={r} cx="10" cy="5" rx="3.4" ry="4.6" transform={`rotate(${r} 10 10)`} />
                ))}
              </g>
              <circle cx="10" cy="10" r="2" fill="#c8452b" />
            </svg>
          </div>
          <span className="hidden md:flex flex-col leading-none">
            <span className="font-score font-bold text-sm text-indigo-900">工工四エディタ</span>
            <span className="text-[9px] tracking-widest text-red-700 font-bold">くんくんしー</span>
          </span>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={score.title}
              onChange={e => onUpdateScoreMeta({ title: e.target.value })}
              placeholder="曲名を入力"
              className="font-score font-extrabold text-xs sm:text-sm text-stone-900 border-b border-transparent hover:border-stone-300 focus:border-indigo-500 focus:outline-none bg-transparent max-w-[96px] sm:max-w-[200px] short:max-w-[130px] py-0.5"
            />
            <span className="hidden sm:inline short:!hidden rounded bg-amber-100/80 px-1 py-0.2 font-mono text-[9px] font-bold text-amber-900 shrink-0">
              {score.tuning.preset === 'custom' ? 'カスタム' : `${honOfRoot(score.tuning.root)} ${TUNING_PRESETS[score.tuning.preset]?.name || ''}`}
            </span>
          </div>
        </div>

        {/* 楽譜の形の切り替え（作文用紙のような縦書き ／ タブ譜） */}
        <div className="inline-flex rounded-lg border border-stone-300 bg-stone-100 p-0.5 shrink-0" role="group" aria-label="楽譜の形">
          <button
            onClick={() => onUpdateView({ layout: 'vertical' })}
            aria-label="縦書き工工四"
            className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              view.layout === 'vertical' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
            title="昔からの工工四（作文用紙のようなマス目・縦書き・右から左へ）"
          >
            縦書き<span className="hidden sm:inline short:!hidden">工工四</span>
          </button>
          <button
            onClick={() => onUpdateView({ layout: 'tab' })}
            aria-label="タブ譜"
            className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              view.layout === 'tab' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
            title="3本の線（上から 女弦・中弦・男弦）に勘所を書くタブ譜（横書き・左から右へ）"
          >
            タブ<span className="hidden sm:inline short:!hidden">譜</span>
          </button>
          <button
            onClick={() => onUpdateView({ layout: 'staff' })}
            aria-label="五線譜"
            className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              view.layout === 'staff' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
            title="五線譜（ト音記号の下に8）。五線の上をクリックして音を入れられます"
          >
            五線<span className="hidden sm:inline short:!hidden">譜</span>
          </button>
        </div>

        {/* Modal & Options Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-1">
          {onOpenNewScoreWizard && (
            <button
              onClick={onOpenNewScoreWizard}
              className="flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 px-2 py-0.5 sm:py-1 text-xs font-bold shadow-2xs cursor-pointer shrink-0 whitespace-nowrap transition-colors"
              title="空白の楽譜を新しく作成する (Ctrl+N)"
              aria-label="空白の楽譜を新しく作成する (Ctrl+N)"
            >
              <FilePlus className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-700 shrink-0" />
              <span className="hidden sm:inline short:!hidden">新規楽譜</span>
            </button>
          )}

          <button
            onClick={onOpenLibrary}
            className="flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 sm:py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer shrink-0 whitespace-nowrap"
            title="楽曲ライブラリ"
              aria-label="楽曲ライブラリ"
          >
            <FolderOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-700 shrink-0" />
            <span className="hidden sm:inline short:!hidden">楽曲集</span>
          </button>

          <button
            onClick={onOpenTuning}
            className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50/80 px-2 py-0.5 sm:py-1 text-xs font-semibold text-amber-950 hover:bg-amber-100 cursor-pointer shrink-0 whitespace-nowrap"
            title="調弦設定"
              aria-label="調弦設定"
          >
            <Sliders className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-700 shrink-0" />
            <span className="hidden sm:inline short:!hidden">調弦</span>
          </button>

          {onOpenPracticeMode && (
            <button
              onClick={onOpenPracticeMode}
              className="flex items-center gap-1 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              title="演奏・練習モード（全画面で譜面を大きく集中表示）"
            >
              <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span>演奏</span>
            </button>
          )}

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1 rounded-md bg-indigo-700 px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-bold text-white shadow-2xs hover:bg-indigo-600 cursor-pointer shrink-0 whitespace-nowrap"
            title="保存・WAV/MIDI書き出し・詳細出力"
          >
            <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span>保存</span>
          </button>

          {onPrint && (
            <button
              onClick={onPrint}
              className="flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2 py-0.5 sm:py-1 text-xs font-bold text-stone-800 shadow-2xs hover:bg-stone-100 cursor-pointer shrink-0 whitespace-nowrap"
              title="印刷画面・PDF保存プレビューを開く (Ctrl+P)"
              aria-label="印刷画面・PDF保存プレビューを開く (Ctrl+P)"
            >
              <Printer className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-stone-700 shrink-0" />
              <span className="hidden sm:inline short:!hidden">印刷</span>
            </button>
          )}

          {/* Settings / View options expand toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 sm:py-1 text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
              showOptions
                ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            }`}
            title="表示設定・詳細切り替え"
              aria-label="表示設定・詳細切り替え"
          >
            <Settings2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="hidden md:inline short:!hidden">設定</span>
            {showOptions ? <ChevronUp className="h-2.5 w-2.5 shrink-0" /> : <ChevronDown className="h-2.5 w-2.5 shrink-0" />}
          </button>

          <button
            onClick={onOpenHelp}
            className="flex items-center justify-center rounded-md border border-stone-200 bg-white p-1 text-stone-600 hover:bg-stone-100 cursor-pointer shrink-0"
            title="ヘルプ"
              aria-label="ヘルプ"
          >
            <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* Collapsible Options & View Mode Toggles */}
      {showOptions && (
        <div className="flex flex-col gap-2 border-t border-stone-200 pt-2 text-xs text-stone-700 animate-in fade-in-50 duration-150">
          {/* Metadata: Tempo, Time signature, Subtitle, Composer */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-stone-400">テンポ:</span>
              <input
                type="number"
                inputMode="numeric"
                min={TEMPO_MIN}
                max={TEMPO_MAX}
                value={tempoText}
                onChange={e => {
                  setTempoText(e.target.value);
                  const n = Number(e.target.value);
                  // 入力の途中（空・桁が足りない）では反映せず、範囲内の整数になったら反映する
                  if (Number.isInteger(n) && n >= TEMPO_MIN && n <= TEMPO_MAX) onUpdateScoreMeta({ tempo: n });
                }}
                onBlur={() => setTempoText(String(score.tempo))}
                aria-label="テンポ"
                className="w-14 rounded-md border border-stone-300 bg-white px-1.5 py-1 text-center font-bold text-stone-900 focus:outline-indigo-500 text-xs"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-stone-400">拍子:</span>
              <select
                value={score.beatsPerMeasure}
                onChange={e => onUpdateScoreMeta({ beatsPerMeasure: Number(e.target.value) as any })}
                className="rounded-md border border-stone-300 bg-white px-2 py-1 font-semibold text-stone-800 text-xs"
              >
                <option value="4">4/4 拍子</option>
                <option value="3">3/4 拍子</option>
                <option value="2">2/4 拍子</option>
              </select>
            </div>

            <div className="flex items-center gap-1 flex-1 min-w-[130px]">
              <span className="text-[11px] font-semibold text-stone-400">副題:</span>
              <input
                type="text"
                value={score.subtitle}
                onChange={e => onUpdateScoreMeta({ subtitle: e.target.value })}
                placeholder="副題"
                className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-stone-800 text-xs"
              />
            </div>

            <div className="flex items-center gap-1 flex-1 min-w-[130px]">
              <span className="text-[11px] font-semibold text-stone-400">作曲者:</span>
              <input
                type="text"
                value={score.composer}
                onChange={e => onUpdateScoreMeta({ composer: e.target.value })}
                placeholder="作曲・編曲"
                className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-stone-800 text-xs"
              />
            </div>
          </div>

          {/* View Toggles: Vertical / Horizontal, Kanji / Arabic, Ruby, Zoom */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* タブ譜の線の上に書く文字 */}
              {view.layout === 'tab' && (
                <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-0.5" title="タブ譜の線の上に書く文字">
                  <button
                    onClick={() => onUpdateView({ tabLabel: 'kanji' })}
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer ${
                      view.tabLabel !== 'doremi' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    工工四の字
                  </button>
                  <button
                    onClick={() => onUpdateView({ tabLabel: 'doremi' })}
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer ${
                      view.tabLabel === 'doremi' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    ドレミ
                  </button>
                </div>
              )}

              {/* Ruby */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-stone-400">ルビ:</span>
                <select
                  value={view.ruby}
                  onChange={e => onUpdateView({ ruby: e.target.value as any })}
                  className="rounded-md border border-stone-300 bg-white px-1.5 py-0.5 text-xs font-medium text-stone-700"
                >
                  <option value="off">非表示</option>
                  <option value="doremi">ドレミ</option>
                  <option value="cde">CDE</option>
                </select>
              </div>

              {/* Measures per line */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-stone-400">1段:</span>
                <select
                  value={view.perLine}
                  onChange={e => onUpdateView({ perLine: Number(e.target.value) })}
                  className="rounded-md border border-stone-300 bg-white px-1.5 py-0.5 text-xs font-medium text-stone-700"
                >
                  {[1, 2, 3, 4, 6, 8].map(n => (
                    <option key={n} value={n}>
                      {n}小節
                    </option>
                  ))}
                </select>
              </div>

              {/* Paper orientation for printing */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-stone-400">用紙:</span>
                <select
                  value={view.paper}
                  onChange={e => onUpdateView({ paper: e.target.value as 'portrait' | 'landscape' })}
                  className="rounded-md border border-stone-300 bg-white px-1.5 py-0.5 text-xs font-medium text-stone-700 cursor-pointer"
                  title="印刷するときのA4の向き"
                >
                  <option value="portrait">A4 縦</option>
                  <option value="landscape">A4 横</option>
                </select>
              </div>

              {/* Tuning chart on the score */}
              <button
                onClick={() => onUpdateView({ chart: view.chart === 'on' ? 'off' : 'on' })}
                className={`rounded-md border px-2 py-0.5 text-xs font-semibold cursor-pointer transition-colors ${
                  view.chart === 'on'
                    ? 'border-amber-400 bg-amber-50 text-amber-900'
                    : 'border-stone-200 bg-white text-stone-500 hover:text-stone-800'
                }`}
                title="譜面に調弦（3本の弦の音名）を載せる"
              >
                調弦表
              </button>

              {/* Font selection */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-stone-400">書体:</span>
                <select
                  value={view.fontStyle || 'shippori'}
                  onChange={e => onUpdateView({ fontStyle: e.target.value as any })}
                  className="rounded-md border border-stone-300 bg-white px-1.5 py-0.5 text-xs font-medium text-stone-700 cursor-pointer"
                >
                  <option value="shippori">しっぽり明朝（工工四らしい）</option>
                  <option value="kaisei">解星デコール（優美）</option>
                  <option value="yuji">游築・筆文字（古典風格）</option>
                  <option value="klee">クレー（教科書筆記）</option>
                  <option value="noto">Noto Serif（標準明朝）</option>
                </select>
              </div>

              {/* 16th note layout (縦4段: 8分音符より縦に小さく表示 / 2x2分割) */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-stone-400">16分:</span>
                <select
                  value={view.sixteenthLayout || 'vertical'}
                  onChange={e => onUpdateView({ sixteenthLayout: e.target.value as any })}
                  className="rounded-md border border-stone-300 bg-white px-1.5 py-0.5 text-xs font-medium text-stone-700 cursor-pointer"
                  title="16分音符の配置方式"
                >
                  <option value="vertical">縦4段（8分より縦に小さい）</option>
                  <option value="grid">2×2（横分割）</option>
                </select>
              </div>
            </div>

            {/* Right: 仮想三線, Lyrics, Zoom */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateView({ showSanshinBoard: !view.showSanshinBoard })}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold cursor-pointer border transition-colors ${
                  view.showSanshinBoard
                    ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold'
                    : 'border-stone-200 bg-white text-stone-500 hover:text-stone-800'
                }`}
                title="入力パネルの上に三線の棹（勘所）を表示・非表示"
              >
                <Music className="h-3 w-3" />
                <span>仮想三線</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateView({ showLyrics: !view.showLyrics })}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold cursor-pointer border transition-colors ${
                    view.showLyrics
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-900 font-bold'
                      : 'border-stone-200 bg-white text-stone-500 hover:text-stone-800'
                  }`}
                  title="歌詞の表示・非表示を切り替え"
                >
                  <Type className="h-3 w-3" />
                  <span>歌詞</span>
                </button>
                {view.showLyrics && (
                  <button
                    onClick={() =>
                      onUpdateView({
                        lyricsPosition: view.lyricsPosition === 'bottom' ? 'right' : 'bottom'
                      })
                    }
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-50 cursor-pointer shadow-2xs"
                    title="歌詞の位置を切り替え（マスの右側に薄い縦列 / マスの下）"
                  >
                    <span>位置: {view.lyricsPosition === 'bottom' ? 'マスの下' : 'マスの右列'}</span>
                  </button>
                )}
              </div>

              {/* Zoom buttons */}
              <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5">
                <button
                  onClick={() => handleZoom(-0.1)}
                  className="p-1 text-stone-500 hover:text-stone-900 cursor-pointer"
                  title="縮小"
                >
                  <ZoomOut className="h-3 w-3" />
                </button>
                <span className="px-1 text-[10px] font-mono font-semibold text-stone-600">
                  {Math.round(view.zoom * 100)}%
                </span>
                <button
                  onClick={() => handleZoom(0.1)}
                  className="p-1 text-stone-500 hover:text-stone-900 cursor-pointer"
                  title="拡大"
                >
                  <ZoomIn className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
