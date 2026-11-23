/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModal } from '../hooks/useModal';
import React from 'react';
import { HelpCircle, Keyboard, Music2, Info } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  useModal(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="ヘルプ" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-stone-50 border border-stone-300 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-700" />
            <h2 className="text-xl font-bold font-score text-stone-900">使い方と工工四の手引き</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-6 text-sm text-stone-700">
          {/* 工工四の読み方 */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="font-bold text-stone-900 flex items-center gap-1.5 mb-2 font-score">
              <Info className="h-4 w-4 text-amber-700" /> 工工四（くんくんしー）の読み方
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-600 leading-relaxed">
              <li>
                <strong>1文字で「弦」と「押さえる場所（勘所）」を表します。</strong>
                男弦：合・乙・老・下老 ／ 中弦：四・上・中・尺 ／ 女弦：工・五・六・七・八・九
              </li>
              <li>
                <strong>縦書き工工四</strong>：作文用紙のようなマス目に、上から下・右の列から左の列へ読みます。1マスが1拍です。マスの右の細い列に歌詞を書けます。
              </li>
              <li>
                <strong>タブ譜</strong>：3本の線が上から 女弦・中弦・男弦 です。線の上に勘所の字（またはドレミ）が書かれ、左から右へ読みます。
              </li>
              <li>
                <strong>2つの形は同じ楽譜</strong>：上のボタンで切り替えるだけで、入力した内容はそのまま両方に表示されます。
              </li>
              <li>
                <strong>空きマスは延ばし</strong>：音が入っていないマスは前の音を延ばします。音を止めたいときは「○（休符）」を入れます。
              </li>
              <li>
                <strong>音の高さ</strong>：4本 本調子（C・F・C）なら 合ド 乙レ 老ミ 四ファ 上ソ 中ラ 尺シ♭（尺♯でシ） 工ド 五レ 六ミ 七ファ 八ソ 九ラ。勘所は曲や流派で少し動くことがあるので、♯・♭ で調整できます。
              </li>
            </ul>
          </div>

          {/* Multiple notes in one cell guide */}
          <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4">
            <h3 className="font-bold text-stone-900 flex items-center gap-1.5 mb-2 font-score text-base">
              <Music2 className="h-4 w-4 text-amber-800" /> 一マスに複数音を入れる方法
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-stone-700 leading-relaxed">
              <div className="rounded-lg bg-white border border-amber-200/80 p-3">
                <span className="font-bold text-indigo-900 block mb-1">
                  ① 1マスを分けて2つ以上の音を入れる（8分・3連・16分）
                </span>
                <p className="text-stone-600 mb-2">
                  1拍のマスの中に2つ以上の音符を順番に弾く場合：
                </p>
                <ul className="list-disc list-inside space-y-1 text-stone-600">
                  <li>
                    下部バーの <strong>「♪♪ (8分)」「3連」「♬ (16分)」</strong> ボタンを押すと、選択中のマスが即座に分割されます。
                  </li>
                  <li>
                    キーボードの <strong>Q (4分) / W (8分) / E (3連) / R (16分)</strong> キーでも瞬時に切り替わります。
                  </li>
                  <li>
                    4分音符のマスは、<strong>下半分をクリック</strong>するだけでも自動的に8分音符に分割されます。
                  </li>
                </ul>
              </div>

              <div className="rounded-lg bg-white border border-amber-200/80 p-3">
                <span className="font-bold text-amber-900 block mb-1">
                  ② 2本の弦を同時に弾く（合わせ）
                </span>
                <p className="text-stone-600 mb-2">
                  同じマス（タイミング）に複数の音を重ねて鳴らす場合：
                </p>
                <ul className="list-disc list-inside space-y-1 text-stone-600">
                  <li>
                    下部バーの <strong>「合わせ」</strong> ボタンをONにすると、勘所キーを押しても進まず、同じマスに別の弦の音が重なります（例：「合工」）。同じ弦の音は入れ替わります。
                  </li>
                  <li>
                    キーボードなら <strong>Shiftキーを押しながら勘所キー</strong>で、その場に音を重ねられます。
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Table */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="font-bold text-stone-900 flex items-center gap-1.5 mb-2 font-score">
              <Keyboard className="h-4 w-4 text-indigo-700" /> キーボード操作一覧
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
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">勘所（男弦・中弦）</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">1</kbd>〜<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">4</kbd> ／ <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">5</kbd>〜<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">8</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">合・乙・老・下老 ／ 四・上・中・尺</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">勘所（女弦）</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">9</kbd>, <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">0</kbd>, <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">-</kbd>, <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">^</kbd>, <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">¥</kbd>, <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">@</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">工・五・六・七・八・九</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">音の長さ</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Q</kbd> 4分 / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">W</kbd> 8分 / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">E</kbd> 3連 / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">R</kbd> 16分</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">次の音符にも長さが引き継がれます</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">合わせ（2本同時）</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Shift</kbd> + 勘所キー</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">同じマスに別の弦の音を重ねて入力</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">休符 / 延ばし</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">P</kbd> または <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">.</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">T</kbd> または <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">,</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">○（休符） / ー（タイ・延ばし）</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">♯ / ♭</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Z</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">X</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">勘所を半音上げる（尺♯ など）／ 半音下げる</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">打・掛</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">U</kbd> (打) / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">K</kbd> (掛)</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">バチで弾かず左手で鳴らす（ハンマリング／プリング）</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">押し上げ・スリ・揺り</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Y</kbd> (押) / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">I</kbd> (摺) / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">M</kbd> (ユ)</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">弾いてから音を上げる／下から滑って入る／ビブラート</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">スクイ・トレモロ・消音</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">C</kbd> (ス) / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">N</kbd> (〰) / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">V</kbd> (止)</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">右手（爪）の奏法（再生にも反映）</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">再生 / 停止</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Space</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Esc</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500"><kbd className="bg-stone-100 border px-1 py-0.5 rounded text-[10px]">Shift+Space</kbd>でカーソル位置から再生</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">消す</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Delete</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Backspace</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">Delete はそのマス（選択中は選択範囲）を消す。Backspace は空のマスなら1つ戻ってから消す</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">カーソル移動</td>
                    <td className="py-1.5">矢印 / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Enter</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Home</kbd>・<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">End</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">縦書きは↑↓で1マスずつ、←→で段（列）を移動。Enter で次の小節の頭へ</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">保存 / 印刷 / 新規</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">S</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">P</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">N</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">保存画面、印刷、新しい楽譜の作成（ポップアップは Esc で閉じます）</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">複数セルの選択（Excel感覚）</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">ドラッグ</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Shift</kbd>+矢印 / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Shift</kbd>+クリック</td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">マウスのドラッグやShiftキーで複数マスを一度に範囲選択</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">セルのコピー / 貼付 / 切取</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">C</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">V</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">X</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">Excelのように複数マスをコピーし、目的の位置に連続貼り付け</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 font-sans font-medium text-stone-800">元に戻す / やり直し</td>
                    <td className="py-1.5"><kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Z</kbd> / <kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Ctrl</kbd>+<kbd className="bg-stone-100 border px-1.5 py-0.5 rounded text-[11px]">Y</kbd></td>
                    <td className="py-1.5 pl-4 font-sans text-stone-500">アンドゥ・リドゥ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-stone-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
