/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { POSITION_COUNT } from '../types/kunkunshi';

type HandApi = {
  show: (notes: number[], oshi?: number, opts?: { instant?: boolean; duration?: number; position?: string; finger?: number; pluck?: boolean }) => void;
  setRight: (on: boolean) => void;
  setView: (name: string) => void;
  setGhost: (on: boolean) => void;
  prepare: (list: { notes: number[]; oshi?: number; position?: string }[]) => void;
  dispose: () => void;
  label: { text: string; sub: string };
};

const VIEW_BUTTONS: [string, string][] = [
  ['front', '正面'],
  ['diag', 'ななめ'],
  ['self', '自分目線'],
  ['side', '横から'],
  ['left', '左手'],
  ['right', '右手']
];

interface Hand3DPanelProps {
  /** いまのマスの勘所（0〜13） */
  notes: number[];
  /** 0=なし 1=♯ 2=♭ */
  oshi: number;
  /** 演奏中は、手を早めに動かす */
  playing?: boolean;
  /** 手の位置：'low'（本手）／'shaku'（尺位） */
  position?: 'low' | 'shaku';
  /** マスに書いた指番号（1=人差指 2=中指 3=小指） */
  finger?: number;
  /** 音が出るたびに変わる値（同じ音をもう一度入れた時も、右手で弾くため） */
  noteEvent?: string;
}

/**
 * 三線の棹を押さえる左手の3D。ウクレレ・ギターのハンドガイドと同じ「骨の入った手のモデル」を、
 * 関節の角度を計算して動かす。three.js は大きいので、この部品を開いた時だけ読み込む。
 */
const Hand3DPanel: React.FC<Hand3DPanelProps> = ({ notes, oshi, playing, position = 'low', finger, noteEvent }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<HandApi | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [view, setView] = useState('front');
  const [ghost, setGhost] = useState(false);
  const [right, setRight] = useState(true);
  const [label, setLabel] = useState({ text: '', sub: '' });
  const latest = useRef({ notes, oshi, position, finger });
  latest.current = { notes, oshi, position, finger };

  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const mod: any = await import('../hand3d/sanshinHand.js');
        if (disposed || !canvasRef.current) return;
        const api: HandApi = await mod.createSanshinHand({ canvas: canvasRef.current, overlay: overlayRef.current });
        if (disposed) {
          api.dispose();
          return;
        }
        apiRef.current = api;
        api.show(latest.current.notes, latest.current.oshi, { instant: true, position: latest.current.position, finger: latest.current.finger });
        setLabel({ ...api.label });
        // 14の勘所の形を、ひまな時に先に計算しておく
        api.prepare([
          ...Array.from({ length: POSITION_COUNT }, (_, i) => ({ notes: [i], position: 'low' })),
          ...Array.from({ length: POSITION_COUNT }, (_, i) => ({ notes: [i], position: 'shaku' }))
        ]);
        setStatus('ready');
      } catch (e) {
        console.error(e);
        if (!disposed) setStatus('error');
      }
    })();
    return () => {
      disposed = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, []);

  const key = notes.join(',') + ':' + oshi + ':' + position + ':' + (finger || 0) + ':' + (noteEvent || '');
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    api.show(notes, oshi, { duration: playing ? 140 : 260, position, finger, pluck: true });
    setLabel({ ...api.label });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-baseline gap-2 min-h-[28px]">
          <span className="font-score text-2xl font-bold text-amber-200 leading-none">{label.text || '—'}</span>
          <span className="text-[11px] text-stone-300">{label.text ? label.sub : '音の入ったマスを選ぶと、その押さえ方になります'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {VIEW_BUTTONS.map(([k, l]) => (
            <button
              key={k}
              onClick={() => {
                setView(k);
                apiRef.current?.setView(k);
              }}
              className={`rounded px-2 py-0.5 text-[11px] font-bold cursor-pointer border ${
                view === k ? 'bg-amber-400 text-stone-950 border-amber-300' : 'bg-stone-900 text-amber-100 border-stone-700 hover:border-amber-500'
              }`}
            >
              {l}
            </button>
          ))}
          <button
            onClick={() => {
              setGhost(g => !g);
              apiRef.current?.setGhost(!ghost);
            }}
            className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold cursor-pointer border ${
              ghost ? 'bg-indigo-400 text-stone-950 border-indigo-300' : 'bg-stone-900 text-amber-100 border-stone-700 hover:border-indigo-400'
            }`}
            title="手を半透明にして、押さえている場所を見やすくする"
          >
            <Eye className="h-3 w-3" /> 半透明
          </button>
          <button
            onClick={() => {
              setRight(r => !r);
              apiRef.current?.setRight(!right);
            }}
            className={`rounded px-2 py-0.5 text-[11px] font-bold cursor-pointer border ${
              right ? 'bg-amber-400 text-stone-950 border-amber-300' : 'bg-stone-900 text-amber-100 border-stone-700 hover:border-amber-500'
            }`}
            title="爪をはめた右手を表示する（音を入れたり再生したりすると、その弦を弾きます）"
          >
            右手（爪）
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg border border-stone-700" style={{ height: 'min(64vh, 560px)' }}>
        <canvas ref={canvasRef} className="block h-full w-full touch-none" />
        <div ref={overlayRef} className="h3d-overlay pointer-events-none absolute inset-0" />
        {status !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/70 text-sm text-amber-100">
            {status === 'loading' ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> 3Dの手を準備しています…
              </span>
            ) : (
              <span>この端末では3Dを表示できませんでした（WebGL が使えるブラウザで開いてください）</span>
            )}
          </div>
        )}
      </div>
      <p className="text-[10px] text-stone-400">
        ドラッグで回す・2本指（右ドラッグ）で移動・ピンチ（ホイール）で拡大。棹の表の色の線は勘所シール（本手で押さえる指の色）です。
        八・九が近くにある所は、人差指を尺位（下老・尺・七）まで上げた押さえ方になります。
        手の3Dモデル：WebXR Input Profiles（MIT License）。
      </p>
    </div>
  );
};

export default Hand3DPanel;
