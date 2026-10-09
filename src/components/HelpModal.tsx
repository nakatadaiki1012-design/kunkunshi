/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle, Keyboard, Music2, Info } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-stone-50 border border-stone-300 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-700" />
            <h2 className="text-xl font-bold font-score text-stone-900">操作ヘルプ・ショートカット一覧</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-6 text-sm text-stone-700">
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="font-bold text-stone-900 flex items-center gap-1.5 mb-2 font-score">
              <Info className="h-4 w-4 text-amber-700" /> 箏文化譜の読み方と基本操作
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-600 leading-relaxed">
              <li>
                <strong>縦書き表示</strong>: 伝統的な文化譜表記です。小節は右から左へと進みます。
              </li>
              <li>
                <strong>音符の入力</strong>: キーボードの数字キー `1`〜`0` またはキーパッドで一〜巾の絃を入力します。
              </li>
              <li>
                <strong>和音入力</strong>: `Shift` キーを押しながら絃キーを押すか、和音モードをONにして入力します。
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="font-bold text-stone-900 flex items-center gap-1.5 mb-2 font-score">
              <Keyboard className="h-4 w-4 text-indigo-700" /> キーボードショートカット
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-300 text-stone-500">
                    <th className="py-2 pr-4 font-semibold">操作</th>
                    <th className="py-2 font-semibold">キー</th>
                    <th className="py-2 pl-4 font-semibold">説明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">一〜巾の絃</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">1</kbd>〜<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">0</kbd>, <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">-</kbd>, <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">^</kbd>, <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px] font-sans">円マーク</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">一〜巾の絃を打弦・入力</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">和音入力</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Shift</kbd> + 絃キー</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">同じマスに2つ目の音を重ねる</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">音長変更</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Q</kbd> (4分) / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">W</kbd> (8分) / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">E</kbd> (3連) / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">R</kbd> (16分)</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">選択中の拍の分割切替</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">押し手（強押し / 巾押し）</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Z</kbd> (半音強押) / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">X</kbd> (全音巾押)</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">左手押し手トグル</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">再生 / 一時停止</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Space</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Esc</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">再生停止</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">コピペ</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">C</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">V</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">X</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">Excel風複数セルコピー</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-stone-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800 cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
