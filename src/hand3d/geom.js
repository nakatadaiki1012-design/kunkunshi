/* =========================================================
   三線の寸法（単位 mm）
   参考：一般的な三線（全長 約800 / 弦長 約600 / 棹の幅 約24 / 胴 約200×185・厚み 約90）
   座標：x = 上駒（ウチジル）→ 胴の方向 / y = 男弦（天井側）→ 女弦（床側） / z = 棹の表（客席側）
   棹の表面が z=0。胴の皮もほぼ同じ高さ（z=0）で、弦はウマ（駒）で約10mm持ち上がる
   （ウクレレ・ハンドガイドの geom.js と同じ名前の値を、三線の寸法にしたもの）
   ========================================================= */
export const SCALE_LEN = 600;                                       // 弦長（上駒〜ウマ）
export const fretX = n => SCALE_LEN*(1-Math.pow(2,-n/12));          // 開放弦から n 半音上の勘所の位置（フレットはない）
export const slotCenter = f => fretX(f);                            // 三線は押さえる点そのものが音の高さ
export const halfW = x => 11.5 + Math.max(0,x)*0.004;               // 棹の半幅（上駒23mm → 胴の手前26mm）
export const strY = (i,x) => (i-1)*(7.2 + Math.max(0,x)*0.006);     // 弦の位置（0=男弦・1=中弦・2=女弦）
export const STRING_R = [0.55,0.45,0.38];                          // 弦の太さ（半径）
export const stringZ = x => 2.2 + Math.max(0,x)*0.013;              // 弦の高さ（上駒2.2mm → ウマ約10mm）
export const FRET_TOP = 0;                                          // フレットはないので、指は弦を棹の表まで押し下げる
export const NECK_DEPTH = x => 19 + Math.min(Math.max(0,x),400)*0.012;   // 棹の厚み（表の下）
export const NECK_BACK_Z = -5 - NECK_DEPTH(60);
export const BODY_X0 = 420, BODY_LEN = 200, BODY_W = 186, BODY_DEPTH = 92;   // 胴（チーガ）
export const UMA_X = SCALE_LEN;                                     // ウマ（駒）の位置
export const HEAD_LEN = 150;                                        // 天（チラ）の長さ
export const NUM_FRETS = 0;

/* ---------- ベクトル計算 ---------- */
export const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
export const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const vlen=a=>Math.hypot(a[0],a[1],a[2]);
export const norm=a=>{const l=vlen(a)||1; return [a[0]/l,a[1]/l,a[2]/l];};
export const lerp=(a,b,t)=>a+(b-a)*t;
export const lerp3=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
export const DEG = Math.PI/180;
