/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KotoScore } from '../types/koto';
import { exportScoreToWav } from '../utils/wavExport';
import { exportScoreToMidi } from '../utils/midiExport';
import { exportAppFilesZip } from '../utils/zipExport';
import { Download, Upload, Music, Printer, FileText, CheckCircle2, Loader2, FolderArchive, Package } from 'lucide-react';

interface ExportModalProps {
  score: KotoScore;
  isOpen: boolean;
  onClose: () => void;
  onImportScore: (score: KotoScore) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  score,
  isOpen,
  onClose,
  onImportScore
}) => {
  const [isRenderingWav, setIsRenderingWav] = useState(false);
  const [wavProgress, setWavProgress] = useState(0);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isPackagingZip, setIsPackagingZip] = useState(false);

  if (!isOpen) return null;

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportZip = async () => {
    try {
      setIsPackagingZip(true);
      const zipBlob = await exportAppFilesZip(score);
      downloadBlob(zipBlob, 'koto-tab-editor-app-files.zip');
    } catch (err: any) {
      console.error('ZIP export error:', err);
      alert('ZIP出力エラー: ' + (err?.message || ''));
    } finally {
      setIsPackagingZip(false);
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(score, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    downloadBlob(blob, `${score.title || '無題'}.json`);
  };

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(score, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleExportMidi = () => {
    const midiBlob = exportScoreToMidi(score);
    downloadBlob(midiBlob, `${score.title || '無題'}.mid`);
  };

  const handleExportWav = async () => {
    try {
      setIsRenderingWav(true);
      setWavProgress(10);
      const wavBlob = await exportScoreToWav(score, p => setWavProgress(p));
      downloadBlob(wavBlob, `${score.title || '無題'}.wav`);
    } catch (err) {
      console.error('WAV export error:', err);
      alert('WAV出力に失敗しました');
    } finally {
      setIsRenderingWav(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed || !Array.isArray(parsed.measures)) {
          throw new Error('正しい箏文化譜JSONフォーマットではありません');
        }
        onImportScore(parsed);
        onClose();
      } catch (err: any) {
        alert('ファイルの読み込みに失敗しました: ' + (err.message || ''));
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-stone-50 border border-stone-300 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h2 className="text-xl font-bold font-score text-stone-900">ファイル出力 & インポート</h2>
            <p className="text-xs text-stone-500 mt-0.5">WAVオーディオ・MIDI・JSON・印刷用出力を行います</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-amber-900/20 bg-amber-50/50 p-4">
            <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5 mb-2">
              <Music className="h-4 w-4 text-amber-700" /> 演奏音声・MIDI出力
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleExportWav}
                disabled={isRenderingWav}
                className="flex items-center justify-between rounded-lg border border-amber-300 bg-white p-3 text-left shadow-2xs hover:bg-amber-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-bold text-sm text-stone-900">WAV 音声ファイル (.wav)</div>
                  <div className="text-[11px] text-stone-500">高音質オーディオレンダリング</div>
                </div>
                {isRenderingWav ? (
                  <div className="flex items-center gap-1 text-xs text-amber-700 font-bold">
                    <Loader2 className="h-4 w-4 animate-spin" /> {wavProgress}%
                  </div>
                ) : (
                  <Download className="h-4 w-4 text-amber-800" />
                )}
              </button>

              <button
                onClick={handleExportMidi}
                className="flex items-center justify-between rounded-lg border border-amber-300 bg-white p-3 text-left shadow-2xs hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-bold text-sm text-stone-900">MIDI ファイル (.mid)</div>
                  <div className="text-[11px] text-stone-500">DAW・DTMソフト連携用</div>
                </div>
                <Download className="h-4 w-4 text-amber-800" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-indigo-900/30 bg-indigo-50/60 p-4">
            <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 mb-1.5">
              <FolderArchive className="h-4 w-4 text-indigo-700" /> ソースコード一式 (.zip)
            </h3>
            <p className="text-xs text-stone-600 mb-3">
              このWebアプリの全ソースコード（React, Vite, Web Audio, スコアデータ）をZIP保存します。
            </p>
            <button
              onClick={handleExportZip}
              disabled={isPackagingZip}
              className="flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {isPackagingZip ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-200" /> ZIP生成中...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4" /> アプリZIP保存
                </>
              )}
            </button>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-2">
              <FileText className="h-4 w-4 text-stone-600" /> 譜面データ JSON
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-stone-100/80 px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-200 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> JSONファイル保存
              </button>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-stone-100/80 px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-200 cursor-pointer"
              >
                {copiedJson ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> コピー完了
                  </>
                ) : (
                  'JSONテキストコピー'
                )}
              </button>
              <label className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-100 cursor-pointer">
                <Upload className="h-3.5 w-3.5" /> JSON読み込み
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-2">
              <Printer className="h-4 w-4 text-stone-600" /> 印刷 / PDF保存
            </h3>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 cursor-pointer"
            >
              <Printer className="h-4 w-4" /> 印刷実行 (Ctrl+P)
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-stone-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-300 cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
