/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KunkunshiScore } from '../types/kunkunshi';
import { exportAppFilesZip } from '../utils/zipExport';
import { Download, Upload, Music, Printer, FileText, CheckCircle2, Loader2, FolderArchive, Package, X } from 'lucide-react';

interface ExportModalProps {
  score: KunkunshiScore;
  isOpen: boolean;
  onClose: () => void;
  onImportScore: (score: KunkunshiScore) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  score,
  isOpen,
  onClose,
  onImportScore
}) => {
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
      downloadBlob(zipBlob, 'kunkunshi-editor-app-files.zip');
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed || !Array.isArray(parsed.columns)) {
          throw new Error('正しい工工四フォーマットではありません');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-bold font-serif text-slate-100">ファイル出力 & インポート</h2>
            <p className="text-xs text-slate-400 mt-0.5">工工四 JSON、印刷、ソースコードZIP保存を行います</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs">
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
            <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
              <FolderArchive className="h-4 w-4 text-amber-400" /> ソースコード一式 (.zip)
            </h3>
            <p className="text-slate-400 mb-3">
              このWebアプリの全ソースコード（React, Vite, Web Audio, スコアデータ）をZIP保存します。
            </p>
            <button
              onClick={handleExportZip}
              disabled={isPackagingZip}
              className="flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 px-4 py-2.5 font-bold disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {isPackagingZip ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" /> ZIP生成中...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4" /> アプリZIP保存
                </>
              )}
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
              <FileText className="h-4 w-4 text-amber-400" /> 譜面データ JSON
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> JSONファイル保存
              </button>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                {copiedJson ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> コピー完了
                  </>
                ) : (
                  'JSONテキストコピー'
                )}
              </button>
              <label className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 cursor-pointer">
                <Upload className="h-3.5 w-3.5" /> JSON読み込み
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
              <Printer className="h-4 w-4 text-amber-400" /> 印刷 / PDF保存
            </h3>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 cursor-pointer"
            >
              <Printer className="h-4 w-4" /> 印刷実行 (Ctrl+P)
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
