/* =========================================================
   三線の寸法（単位 mm）
   出典：沖縄県立博物館紀要 第26号（2000）「博物館における三線づくり」の寸法図
     ・棹：天 115 ＋ 野（上駒〜胴）479（一尺五寸八分）＋ 心（胴を貫く所）215 ＝ 全長 809
     ・野坂：胴の手前 36mm で、表が 12mm ほど下がって胴の皮へつながる
     ・鳩胸：胴の手前 152mm から裏が深くなり、胴の所で厚み 約75mm
     ・チイガ（胴）：棹の方向 194 × 横 184 × 厚み 83
   棹の厚み・幅（実測例）：上の細い所 厚み18〜23・幅22〜25、中央 厚み20〜26・幅24〜27
   座標：x = 上駒（ウチジル）→ 胴の方向 / y = 男弦の側 → 女弦の側 / z = 棹の表（客席側）
   棹の表面が z=0。胴の皮は棹の表より少し低い（SKIN_Z）。弦はウマ（駒）で持ち上がる
   （ウクレレ・ハンドガイドの geom.js と同じ名前の値を、三線の寸法にしたもの）
   ========================================================= */
export const SCALE_LEN = 610;                                       // 弦長（上駒〜ウマ）
export const fretX = n => SCALE_LEN*(1-Math.pow(2,-n/12));          // 開放弦から n 半音上の勘所の位置（フレットはない）
export const slotCenter = f => fretX(f);                            // 三線は押さえる点そのものが音の高さ
export const halfW = x => 11.4 + Math.max(0,x)*0.0045;              // 棹の半幅（上駒23mm → 中央25mm → 胴の手前27mm）
export const strY = (i,x) => (i-1)*(7.0 + Math.max(0,x)*0.0062);    // 弦の位置（0=男弦・1=中弦・2=女弦）
export const STRING_R = [0.55,0.45,0.38];                          // 弦の太さ（半径）
export const stringZ = x => 2.4 + Math.max(0,x)*0.006;              // 弦の高さ（上駒2.4mm → ウマ約6mm。棹の表から）
export const FRET_TOP = 0;                                          // フレットはないので、指は弦を棹の表まで押し下げる
export const NECK_DEPTH = x => 14.5 + Math.min(Math.max(0,x),400)*0.011;   // 棹の厚み（表の5mm下から裏まで）。全体で 19.5 → 24
export const NECK_BACK_Z = -5 - NECK_DEPTH(60);
export const BODY_X0 = 479, BODY_LEN = 194, BODY_W = 184, BODY_DEPTH = 83;   // 胴（チイガ）：上の縁は上駒から 479mm
export const SKIN_Z = -9;                                           // 胴の皮の高さ（野坂で棹の表から下がる）
export const UMA_X = SCALE_LEN;                                     // ウマ（駒）の位置（胴の下の縁から約63mm）
export const HEAD_LEN = 115;                                        // 天（チラ）の長さ（上駒から先）
export const TAIL_LEN = 21;                                         // 胴の下に出る心の先（糸掛けを掛ける所）
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
