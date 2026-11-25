/* =========================================================
   三線の3Dモデル（実寸に近い形）
   天（チラ）・カラクイ（糸巻き）・上駒（ウチジル）・棹・野坂（スンウリ）・鳩胸（ウトゥチカラ）・
   胴（チーガ・蛇皮張り）・ティーガー（胴巻き）・ウマ（駒）・棹の先（糸を掛ける所）・弦3本
   寸法：沖縄県立博物館紀要 第26号の寸法図（天115・野479・心215・チイガ194×184×83、野坂・鳩胸）による（geom.js）
   座標は geom.js と同じ：x = 上駒→胴 / y = 男弦（天井側）→女弦（床側） / z = 棹の表（客席側）
   ========================================================= */
import * as THREE from 'three';
import { fretX, halfW, strY, STRING_R, stringZ, NECK_DEPTH, BODY_X0, BODY_LEN, BODY_W, BODY_DEPTH, UMA_X, HEAD_LEN, TAIL_LEN, SKIN_Z } from './geom.js';
import { FINGER_COLORS } from './chord.js';

/* ---------- 絵（その場で描く） ---------- */
function canvasTex(w, h, draw){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
// 蛇皮（ニシキヘビの鱗とまだら模様）
const snakeTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#2d2617'; g.fillRect(0, 0, w, h);
  let seed = 7; const r = () => ((seed = (seed*16807) % 2147483647) - 1) / 2147483646;
  for(let i=0;i<26;i++){
    const x = r()*w, y = r()*h, rx = 30 + r()*55, ry = 20 + r()*35;
    const gr = g.createRadialGradient(x, y, 2, x, y, rx);
    gr.addColorStop(0, 'rgba(185,160,105,0.85)'); gr.addColorStop(0.7, 'rgba(120,100,60,0.55)'); gr.addColorStop(1, 'rgba(45,38,23,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, r()*3, 0, 7); g.fill();
  }
  for(let y=0; y<h+12; y+=11) for(let x=(y/11)%2 ? 7 : 0; x<w+14; x+=14){
    g.strokeStyle = 'rgba(20,16,8,0.55)'; g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(x, y, 6.2, 5, 0, 0, 7); g.stroke();
    g.fillStyle = 'rgba(255,240,200,0.06)'; g.fill();
  }
});
// ティーガー（胴巻き）：紅型のような色の帯
const tiigaaTex = () => canvasTex(1024, 96, (g, w, h) => {
  g.fillStyle = '#b8322a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fbb817'; g.fillRect(0, 8, w, 6); g.fillRect(0, h-14, w, 6);
  g.fillStyle = '#1f6f8b'; g.fillRect(0, 0, w, 4); g.fillRect(0, h-4, w, 4);
  for(let x=0; x<w; x+=80){
    g.fillStyle = '#1f6f8b'; g.beginPath(); g.arc(x+40, h/2, 16, 0, 7); g.fill();
    g.fillStyle = '#fff3d6';
    for(let k=0;k<5;k++){ const a = k*1.2566; g.beginPath(); g.ellipse(x+40+Math.cos(a)*9, h/2+Math.sin(a)*9, 7, 4, a, 0, 7); g.fill(); }
    g.fillStyle = '#fbb817'; g.beginPath(); g.arc(x+40, h/2, 4, 0, 7); g.fill();
  }
});

/* ---------- 棹・天を1本の形として作る ----------
   中心の線にそって、断面（表は平ら・横は少しまっすぐ・裏は丸い）を並べる。
   天（上駒より先）は後ろへ反りながら少し細く・薄くなる。胴の手前は野坂（表）と鳩胸（裏）で広がる */
// 天の中心の線：上駒から先へ s mm 進んだ所（x は負の向き、z は後ろへ）。先へ行くほど強く反り、先では約45°
export function headPoint(s){ return [-s, 0, -(0.0016*s*s + 0.000016*s*s*s)]; }
function headTangent(s){ const t = [-1, 0, -(0.0032*s + 0.000048*s*s)], l = Math.hypot(t[0], t[2]); return [t[0]/l, 0, t[2]/l]; }

// 断面の形（y：横、z：表からの高さ。表が z=0）
function section(hw, dpt){
  const pts = [];
  const r = 1.6;                                   // 表の角の丸み
  pts.push([hw - r, 0], [-(hw - r), 0], [-hw, -r], [-hw, -5]);
  for(let i=1;i<18;i++){ const a = Math.PI + i/18*Math.PI; pts.push([Math.cos(a)*hw, -5 + Math.sin(a)*dpt]); }
  pts.push([hw, -5], [hw, -r]);
  return pts;
}
// 野坂（表）：胴の手前36mmで、表が SKIN_Z まで下がる。鳩胸（裏）：胴の手前152mmから裏が深くなり、胴の所で厚み約75mm
export function nosakaDrop(x){ const e = Math.min(1, Math.max(0, (x - (BODY_X0 - 36))/36)); return SKIN_Z*e*e*(3 - 2*e); }
function neckShape(x){
  let hw = halfW(x), dpt = NECK_DEPTH(x);
  const e = Math.min(1, Math.max(0, (x - (BODY_X0 - 36))/36));
  hw += 5*e*e;                                                   // 野坂で表が少し広がる
  const u = Math.min(1, Math.max(0, (x - (BODY_X0 - 152))/152));
  dpt += (75 - 5 - NECK_DEPTH(BODY_X0) + Math.abs(SKIN_Z)) * Math.pow(u, 2.4);    // 鳩胸（表の高さが下がった分も足して、裏は約75mm）
  // 胴の中（心）は細い角材。胴の下に出る先も細い
  if(x > BODY_X0 + 6){ hw = 7; dpt = 9; }
  return section(hw, dpt);
}
function buildNeckAndHead(mat){
  const rings = [];       // { c:中心, T:進む向き, N:表の向き, prof:断面 }
  // 天の先（上駒から HEAD_LEN 先）→ 上駒
  for(let i=0;i<=22;i++){
    const s = HEAD_LEN*(1 - i/22);
    const T = headTangent(s).map(v => -v);                               // 胴の向きへ進む
    const N = [ -T[2], 0, T[0] ];                                       // 表の向き（T を y 軸まわりに90°）
    const k = s/HEAD_LEN;
    // 天は先へ行くほど少し細く・薄く。いちばん先は丸く閉じる
    const end = Math.max(0, (k - 0.9)/0.1);
    // 天は先へ行くほど少し幅広く・薄く（糸倉のあたりは厚い）
    const hw = (halfW(0) + k*4) * Math.sqrt(Math.max(0.05, 1 - end*end));
    const dpt = (NECK_DEPTH(0) - k*7) * Math.sqrt(Math.max(0.05, 1 - end*end));
    rings.push({ c: headPoint(s), N, prof: section(hw, dpt) });
  }
  // 上駒 → 胴を通りぬけて、胴の下の棹の先まで
  const xEnd = BODY_X0 + BODY_LEN + TAIL_LEN;
  for(let x=3; x<=xEnd; x+=(x > BODY_X0 - 60 && x < BODY_X0 + 10) ? 5 : 15){
    // 野坂で表が下がる。胴の中では、心を蛇皮より下げる（同じ高さだと、ちらついて見える）
    const z = x > BODY_X0 + 6 ? SKIN_Z - 6 : nosakaDrop(x);
    rings.push({ c: [x, 0, z], N: [0, 0, 1], prof: neckShape(x) });
  }
  rings.push({ c: [xEnd + 3, 0, SKIN_Z - 9], N: [0, 0, 1], prof: section(3, 4) });     // 先を丸く閉じる
  const n = rings[0].prof.length, pos = [], idx = [];
  for(const { c, N, prof } of rings){
    for(const [y, z] of prof) pos.push(c[0] + N[0]*z, c[1] + y, c[2] + N[2]*z);
  }
  for(let i=0;i<rings.length-1;i++) for(let k=0;k<n;k++){
    const a = i*n + k, b = i*n + (k+1)%n, c = (i+1)*n + k, d = (i+1)*n + (k+1)%n;
    idx.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true;
  return m;
}

/* ---------- カラクイ（糸巻き）：回転体。天を横に貫く細い軸と、つまむ所 ---------- */
function karakuiGeometry(){
  // [半径, 長さ方向の位置]（0 が天の中心、先へ行くほどプラス）
  const prof = [[0,-16],[3.4,-16],[3.6,-8],[3.8,10],[5.8,12],[6.0,16],[4.6,18],[5.0,24],
                [6.2,40],[7.0,58],[7.6,74],[8.0,86],[7.2,90],[8.2,93],[8.4,98],[6.5,104],[3.5,107],[0,108]];
  return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 24);
}

export function buildSanshin(){
  const group = new THREE.Group();
  // 黒い漆塗り（つやあり）
  const lacquer = new THREE.MeshPhysicalMaterial({ color:'#0c0b0a', roughness:0.42, metalness:0, clearcoat:0.55, clearcoatRoughness:0.38, envMapIntensity:0.35, side: THREE.DoubleSide });   // 映り込みが強すぎて白く光らないように
  group.add(buildNeckAndHead(lacquer));

  // 上駒（ウチジル）：象牙色の小さな駒
  const nut = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2*halfW(0) - 1, 2.6), new THREE.MeshStandardMaterial({ color:'#eadfc6', roughness:0.45 }));
  nut.position.set(-1.6, 0, 1.3); nut.castShadow = true; group.add(nut);

  // カラクイ3本：男弦（天井側）・中弦（床側）・女弦（天井側）
  const pegMat = new THREE.MeshPhysicalMaterial({ color:'#140e0b', roughness:0.32, clearcoat:0.7 });
  const pegGeo = karakuiGeometry();
  const PEGS = [{ s: 28, side: -1 }, { s: 52, side: 1 }, { s: 76, side: -1 }];   // 糸倉の横に、互い違いに
  const pegAnchor = [];
  PEGS.forEach(({ s, side }) => {
    const c = headPoint(s), z = c[2] - 6;
    const peg = new THREE.Mesh(pegGeo, pegMat);
    peg.position.set(c[0], 0, z);
    if(side < 0) peg.rotation.x = Math.PI;          // 天井側へ向ける（回転体の軸は y）
    peg.castShadow = true; group.add(peg);
    pegAnchor.push([c[0], side*2, z + 2]);          // 弦を巻く所（天の中）
  });

  // 胴（チーガ）：角の丸い四角の木枠に、表と裏に蛇皮
  // 角を丸めた四角で、4つの辺は外へ少しふくらむ（チイガの板の外側は曲面に削る）
  const r = 26, L = BODY_LEN, W = BODY_W, bul = 4;
  const shape = new THREE.Shape();
  shape.moveTo(-L/2 + r, -W/2);
  shape.quadraticCurveTo(0, -W/2 - bul, L/2 - r, -W/2); shape.quadraticCurveTo(L/2, -W/2, L/2, -W/2 + r);
  shape.quadraticCurveTo(L/2 + bul, 0, L/2, W/2 - r);  shape.quadraticCurveTo(L/2, W/2, L/2 - r, W/2);
  shape.quadraticCurveTo(0, W/2 + bul, -L/2 + r, W/2); shape.quadraticCurveTo(-L/2, W/2, -L/2, W/2 - r);
  shape.quadraticCurveTo(-L/2 - bul, 0, -L/2, -W/2 + r); shape.quadraticCurveTo(-L/2, -W/2, -L/2 + r, -W/2);
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: BODY_DEPTH - 6, bevelEnabled: true, bevelThickness: 3, bevelSize: 3, bevelSegments: 3, curveSegments: 12 });
  { const uv = bodyGeo.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i, uv.getX(i)/120, uv.getY(i)/120); }
  const skinTex = snakeTex(); skinTex.wrapS = skinTex.wrapT = THREE.RepeatWrapping;
  const skinMat = new THREE.MeshStandardMaterial({ map: skinTex, roughness: 0.6 });
  const frameMat = new THREE.MeshStandardMaterial({ color:'#1b120c', roughness:0.35 });
  const body = new THREE.Mesh(bodyGeo, [skinMat, frameMat]);
  body.position.set(BODY_X0 + L/2, 0, SKIN_Z - (BODY_DEPTH - 6) - 3);   // 表の蛇皮が SKIN_Z
  body.castShadow = body.receiveShadow = true;
  group.add(body);
  // ティーガー（胴巻き）：胴の横まわりを、表と裏の縁を少し残して覆う布
  const bandDepth = BODY_DEPTH*0.72;
  const band = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: bandDepth, bevelEnabled: true, bevelThickness: 0, bevelSize: 4.2, bevelSegments: 1, curveSegments: 12 }),
    [new THREE.MeshBasicMaterial({ visible: false }), new THREE.MeshStandardMaterial({ map: tiigaaTex(), roughness: 0.85 })]);
  { const g = band.geometry, uv = g.attributes.uv, p = g.attributes.position;
    for(let i=0;i<uv.count;i++){ const a = Math.atan2(p.getY(i), p.getX(i)); uv.setXY(i, (a/(2*Math.PI)+0.5)*6, p.getZ(i)/bandDepth); } }
  band.position.set(BODY_X0 + L/2, 0, SKIN_Z - BODY_DEPTH/2 - bandDepth/2);
  group.add(band);

  // ウマ（駒）：竹の駒。下が広く上がせまい台形
  const umaH = stringZ(UMA_X) - SKIN_Z, umaW = 2*strY(2, UMA_X) + 12;
  const umaShape = new THREE.Shape();
  umaShape.moveTo(-umaW/2 - 5, 0); umaShape.lineTo(umaW/2 + 5, 0); umaShape.lineTo(umaW/2, umaH); umaShape.lineTo(-umaW/2, umaH); umaShape.closePath();
  const umaGeo = new THREE.ExtrudeGeometry(umaShape, { depth: 5, bevelEnabled: false });
  const uma = new THREE.Mesh(umaGeo, new THREE.MeshStandardMaterial({ color:'#d9c08a', roughness:0.55 }));
  // 形の横（x）→ 弦をまたぐ向き（y）、形の縦（y）→ 高さ（z）、厚み（z）→ 棹の向き（x）
  uma.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,1), new THREE.Vector3(1,0,0)));
  uma.position.set(UMA_X - 2.5, 0, SKIN_Z); uma.castShadow = true; group.add(uma);

  // 勘所シール（練習用に棹の表に貼る目印）。色は本手で押さえる指の色
  const STICK = [[2, 1], [4, 2], [5, 4], [7, 2], [9, 4]];
  for(const [n, f] of STICK){
    const x = fretX(n);
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2*halfW(x) - 2), new THREE.MeshBasicMaterial({ color: FINGER_COLORS[f], transparent: true, opacity: 0.85 }));
    strip.position.set(x, 0, 0.06); group.add(strip);
  }

  // 弦：カラクイ → 上駒 →（押さえた所）→ ウマ → 棹の先（糸を掛ける所）
  const strMat = new THREE.MeshStandardMaterial({ color:'#f4ead2', roughness:0.35, metalness:0.1 });
  const openMat = new THREE.MeshBasicMaterial({ color:'#5fe0ff' });
  const unit = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
  const tieX = BODY_X0 + BODY_LEN + TAIL_LEN*0.4;
  const place = (m, p, q, rr) => {
    const A = new THREE.Vector3(...p), B = new THREE.Vector3(...q);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.scale.set(rr, A.distanceTo(B), rr);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), B.sub(A).normalize());
  };
  const strings = [0,1,2].map(s => {
    const seg = [0,1,2,3].map(() => new THREE.Mesh(unit, strMat));
    seg.forEach(m => group.add(m));
    const rr = STRING_R[s];
    const nutP = [-1, strY(s, 0), stringZ(0)], umaP = [UMA_X, strY(s, UMA_X), stringZ(UMA_X)];
    place(seg[2], pegAnchor[s], nutP, rr * 0.9);                                    // カラクイ → 上駒
    place(seg[3], umaP, [tieX, strY(s, UMA_X)*0.35, SKIN_Z - 1.5], rr);             // ウマ → 糸掛け（心の先）
    return { seg, s, nutP, umaP, rr };
  });
  // str：弦ごとの { contact: 押さえる位置x } または null（開放）。open：光らせる開放弦
  function setStrings(str, open = []){
    strings.forEach(({ seg, s, nutP, umaP, rr }) => {
      const info = str && str[s];
      const mat = open.includes(s) ? openMat : strMat;
      seg[0].material = seg[1].material = mat;
      if(info){
        const x = info.contact, pc = [x, strY(s, x), rr + 0.1];
        place(seg[0], nutP, pc, rr); place(seg[1], pc, umaP, rr); seg[1].visible = true;
      } else { place(seg[0], nutP, umaP, rr); seg[1].visible = false; }
    });
  }
  setStrings(null);
  return { group, setStrings };
}
