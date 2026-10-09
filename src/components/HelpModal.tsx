/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle, Keyboard, Info, X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-bold font-serif text-slate-100">工工四（クンクンシー）操作ヘルプ</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6 text-xs text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="font-bold text-amber-400 flex items-center gap-1.5 mb-2 font-serif text-sm">
              <Info className="h-4 w-4 text-amber-400" /> 工工四（クンクンシー）の読み方と入力の基本
            </h3>
            <ul className="list-disc list-inside space-y-1.5 leading-relaxed text-slate-300">
              <li>
                <strong>縦書き格子表記</strong>: 譜面は【右から左】へと進みます。1列に基本12マスが縦に配置されます。
              </li>
              <li>
                <strong>音符入力</strong>: マス目をクリックし、画面下の【男弦】【中弦】【女弦】キーパッドまたは各勘所ボタンをタップして入力します。
              </li>
              <li>
                <strong>奏法記号</strong>: 打（打ち音）・踏（踏み音）・弾（弾き音）を各セルに指定できます。
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="font-bold text-amber-400 flex items-center gap-1.5 mb-2 font-serif text-sm">
              <Keyboard className="h-4 w-4 text-amber-400" /> キーボードショートカット
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-4 font-semibold">操作</th>
                    <th className="py-2 font-semibold">キー</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-slate-200">
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium">再生 / 一時停止</td>
                    <td className="py-1.5"><kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[11px]">Space</kbd> / <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[11px]">Esc</kbd></td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium">印刷</td>
                    <td className="py-1.5"><kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[11px]">P</kbd></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-5 py-2 text-xs cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
