import React from 'react';
import { KunkunshiScore } from '../types/kunkunshi';
import { Printer } from 'lucide-react';

interface PrintScoreViewProps {
  score: KunkunshiScore;
}

export const PrintScoreView: React.FC<PrintScoreViewProps> = ({ score }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full min-h-screen bg-slate-800 p-6 flex flex-col items-center">
      {/* Top Floating Control Bar (Hidden on actual print) */}
      <div className="mb-6 flex items-center gap-4 print:hidden bg-slate-900 p-3 rounded-xl border border-slate-700 shadow-lg">
        <span className="text-xs text-slate-300">
          🖨️ A4用紙・印刷用の白黒高精細レイアウトです。
        </span>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-lg shadow transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>印刷・PDF保存</span>
        </button>
      </div>

      {/* Printable Sheet (Standard White Page with Crisp Black Lines) */}
      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-[15mm] border border-slate-300 shadow-2xl print:border-none print:shadow-none print:p-0 print:m-0 font-serif">
        {/* Header Title Block */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <span className="text-[10pt] uppercase tracking-widest block font-sans">
            工工四（クンクンシー）琉球三線譜
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-1">{score.title}</h1>
          {score.subtitle && <p className="text-xs mt-1 font-medium">{score.subtitle}</p>}

          <div className="flex items-center justify-center gap-6 mt-3 text-xs border-t border-dotted border-slate-400 pt-2 font-sans font-bold">
            <span>調子: {score.tuning}</span>
            <span>高さ: {score.pitchKey}</span>
            <span>速度: {score.tempoBpm} BPM</span>
          </div>
        </div>

        {/* Vertical Columns Container (Right-to-Left) */}
        <div className="flex flex-row-reverse items-start gap-2 justify-end overflow-x-auto pb-4">
          {score.columns.map((col, colIdx) => (
            <div key={col.id} className="flex flex-col items-center shrink-0 w-[42px]">
              {/* Column Header */}
              <div className="w-full py-0.5 text-center text-[10px] font-bold border-b border-black">
                {col.sectionTitle || `${colIdx + 1}`}
              </div>

              {/* Vertical Cells */}
              <div className="w-full flex flex-col border-t border-l border-r border-black">
                {col.cells.map((cell) => (
                  <div
                    key={cell.id}
                    className="w-[42px] h-[46px] border-b border-r border-black relative flex items-center justify-center"
                  >
                    <span className="font-serif font-black text-xl leading-none">
                      {cell.note || ''}
                    </span>

                    {cell.technique && (
                      <span className="absolute top-0.5 right-0.5 text-[9px] font-bold text-black">
                        {cell.technique}
                      </span>
                    )}

                    {cell.lyric && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] font-bold">
                        {cell.lyric}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-4 border-t border-slate-400 flex items-center justify-between text-[9pt] font-sans text-slate-600">
          <span>工工四エディタ Pro 出力データ</span>
          <span>{new Date().toLocaleDateString('ja-JP')}</span>
        </div>
      </div>
    </div>
  );
};
