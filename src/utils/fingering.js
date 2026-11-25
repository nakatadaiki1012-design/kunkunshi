/* =========================================================
   勘所 → 押さえる指と位置（棹の図で光らせる指の色に使う）
   三線の左手は、2つの位置を行き来する：
     本手（低い位置）… 人差指＝乙・上・五（2半音）、中指＝老・中・六（4）、小指＝下老・尺・七（5）
     尺位（高い位置）… 人差指を下老・尺・七（5）まで上げ、中指＝八（7）、小指＝九（9）
   八・九を弾く時と、その近くの下老・尺・七は尺位で押さえる
   ========================================================= */
import { KANDOKORO } from '../types/kunkunshi';

export const FINGER_COLORS = ['', '#e0533d', '#f0a000', '#3f8f4e', '#2a8fc0'];
export const FINGER_NAMES = ['', '人差指', '中指', '薬指', '小指'];
const FINGER_OF = { 人差指: 1, 中指: 2, 小指: 4 };
// マスに書いた指番号（1=人差指 2=中指 3=小指）→ 手のモデルの指（1 人差・2 中・4 小）
const SLOT_FINGER = [0, 1, 2, 4];

/** 前後の音（勘所の番号の配列のリスト）から、手の位置を決める。八・九があれば尺位 */
export function choosePosition(context){
  for(const notes of context || []) for(const p of notes || []){ const k = KANDOKORO[p]; if(k && k.off >= 7) return 'shaku'; }
  return 'low';
}

function fingerFor(off, position){
  if(off >= 9) return 4;
  if(off >= 7) return 2;
  if(off >= 5) return position === 'shaku' ? 1 : 4;
  if(off >= 4) return 2;
  return 1;
}

/**
 * 勘所の番号 → 手の形を決めるための入力（弦ごとの「何半音上」と「押さえる指」）
 * opts.position：'low'（本手）／'shaku'（尺位）。opts.finger：マスに書いた指番号（あれば優先）
 */
export function chordFromNotes(notes, oshi = 0, opts = {}){
  const acc = oshi === 1 ? 1 : oshi === 2 ? -1 : 0;
  const position = opts.position === 'shaku' ? 'shaku' : 'low';
  const frets = [0, 0, 0], fingers = [0, 0, 0], open = [];
  const pressed = [];
  for(const pos of notes || []){
    const k = KANDOKORO[pos]; if(!k) continue;
    const off = Math.max(0, k.off + acc);
    if(off === 0){ open.push(k.str); continue; }
    frets[k.str] = off;
    pressed.push({ str: k.str, off, finger: fingerFor(k.off, position) || FINGER_OF[k.finger] || 1 });
  }
  // マスに指番号が書いてあれば、それに従う（1音だけの時）
  if(opts.finger && pressed.length === 1 && SLOT_FINGER[opts.finger]) pressed[0].finger = SLOT_FINGER[opts.finger];
  // 合わせで同じ指が2本の弦にかかる時は、高い勘所の方を次の指に替える（人差指→中指→小指→薬指）
  pressed.sort((a, b) => a.off - b.off);
  const usedF = new Set();
  for(const p of pressed){
    let f = p.finger;
    if(usedF.has(f)) f = [1, 2, 4, 3].find(g => !usedF.has(g) && g > p.finger) || [1, 2, 4, 3].find(g => !usedF.has(g));
    usedF.add(f); fingers[p.str] = f;
  }
  const name = frets.join(',') + '|' + fingers.join(',');
  return { name, frets, fingers, barre: null, open, position };
}
