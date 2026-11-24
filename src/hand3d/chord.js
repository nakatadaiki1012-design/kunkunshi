/* =========================================================
   勘所 → 押さえる指と位置（3Dの手に渡す形）
   ========================================================= */
import { KANDOKORO } from '../types/kunkunshi';

export const FINGER_COLORS = ['', '#e0533d', '#f0a000', '#3f8f4e', '#2a8fc0'];
export const FINGER_NAMES = ['', '人差指', '中指', '薬指', '小指'];
const FINGER_OF = { 人差指: 1, 中指: 2, 小指: 4 };

/** 勘所の番号 → 手の形を決めるための入力（弦ごとの「何半音上」と「押さえる指」） */
export function chordFromNotes(notes, oshi = 0){
  const acc = oshi === 1 ? 1 : oshi === 2 ? -1 : 0;
  const frets = [0, 0, 0], fingers = [0, 0, 0], open = [];
  const pressed = [];
  for(const pos of notes || []){
    const k = KANDOKORO[pos]; if(!k) continue;
    const off = Math.max(0, k.off + acc);
    if(off === 0){ open.push(k.str); continue; }
    frets[k.str] = off;
    pressed.push({ str: k.str, off, finger: FINGER_OF[k.finger] || 1 });
  }
  // 合わせで同じ指が2本の弦にかかる時は、高い勘所の方を次の指に替える（人差指→中指→小指→薬指）
  pressed.sort((a, b) => a.off - b.off);
  const usedF = new Set();
  for(const p of pressed){
    let f = p.finger;
    if(usedF.has(f)) f = [1, 2, 4, 3].find(g => !usedF.has(g) && g > p.finger) || [1, 2, 4, 3].find(g => !usedF.has(g));
    usedF.add(f); fingers[p.str] = f;
  }
  const name = frets.join(',') + '|' + fingers.join(',');
  return { name, frets, fingers, barre: null, open };
}

