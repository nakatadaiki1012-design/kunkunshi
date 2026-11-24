/* =========================================================
   三線の3Dモデル（実寸に近い形）
   棹（さお）・天（ちら）・カラクイ（糸巻き）・胴（ちーが・蛇皮張り）・ティーガー（胴巻き）・ウマ（駒）・弦3本
   座標は geom.js と同じ：x = 上駒→胴 / y = 男弦（天井側）→女弦（床側） / z = 棹の表（客席側）
   ========================================================= */
import * as THREE from 'three';
import { fretX, halfW, strY, STRING_R, stringZ, NECK_DEPTH, BODY_X0, BODY_LEN, BODY_W, BODY_DEPTH, UMA_X, HEAD_LEN } from './geom.js';

/* ---------- 絵（その場で描く） ---------- */
function canvasTex(w, h, draw){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
// 蛇皮（ニシキヘビの鱗）
const snakeTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#2d2617'; g.fillRect(0, 0, w, h);
  let seed = 7; const r = () => ((seed = (seed*16807) % 2147483647) - 1) / 2147483646;
  // 大きなまだら模様
  for(let i=0;i<26;i++){
    const x = r()*w, y = r()*h, rx = 30 + r()*55, ry = 20 + r()*35;
    const gr = g.createRadialGradient(x, y, 2, x, y, rx);
    gr.addColorStop(0, 'rgba(185,160,105,0.85)'); gr.addColorStop(0.7, 'rgba(120,100,60,0.55)'); gr.addColorStop(1, 'rgba(45,38,23,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, r()*3, 0, 7); g.fill();
  }
  // 細かい鱗
  for(let y=0; y<h+12; y+=11) for(let x=(y/11)%2 ? 7 : 0; x<w+14; x+=14){
    g.strokeStyle = 'rgba(20,16,8,0.55)'; g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(x, y, 6.2, 5, 0, 0, 7); g.stroke();
    g.fillStyle = 'rgba(255,240,200,0.06)'; g.fill();
  }
});
// ティーガー（胴巻き）：紅型のような色の帯
const tiigaaTex = () => canvasTex(1024, 64, (g, w, h) => {
  g.fillStyle = '#b8322a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fbb817'; g.fillRect(0, 6, w, 5); g.fillRect(0, h-11, w, 5);
  for(let x=0; x<w; x+=64){
    g.fillStyle = '#1f6f8b'; g.beginPath(); g.arc(x+32, h/2, 12, 0, 7); g.fill();
    g.fillStyle = '#fff3d6';
    for(let k=0;k<5;k++){ const a = k*1.2566; g.beginPath(); g.ellipse(x+32+Math.cos(a)*7, h/2+Math.sin(a)*7, 5, 3, a, 0, 7); g.fill(); }
    g.fillStyle = '#fbb817'; g.beginPath(); g.arc(x+32, h/2, 3, 0, 7); g.fill();
  }
});

/* ---------- 棹の断面：表は平ら、横は5mmまっすぐ、裏は丸い（thumb.js の neckSD と同じ形） ---------- */
function neckRing(x){
  const hw = halfW(x), dpt = NECK_DEPTH(x), pts = [];
  pts.push([hw, 0], [-hw, 0], [-hw, -5]);
  for(let i=1;i<16;i++){ const a = Math.PI + i/16*Math.PI; pts.push([Math.cos(a)*hw, -5 + Math.sin(a)*dpt]); }
  pts.push([hw, -5]);
  return pts;
}
function buildNeck(mat){
  const xs = []; for(let x=-6; x<=BODY_X0+BODY_LEN+12; x+=12) xs.push(x);
  const ring0 = neckRing(0), n = ring0.length;
  const pos = [], idx = [];
  xs.forEach(x => neckRing(x).forEach(([y, z]) => pos.push(x, y, z)));
  for(let i=0;i<xs.length-1;i++) for(let k=0;k<n;k++){
    const a = i*n + k, b = i*n + (k+1)%n, c = (i+1)*n + k, d = (i+1)*n + (k+1)%n;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true;
  return m;
}

export function buildSanshin(){
  const group = new THREE.Group();
  // 黒い漆塗りの棹（つやあり）
  const lacquer = new THREE.MeshPhysicalMaterial({ color:'#0c0b0a', roughness:0.22, metalness:0, clearcoat:1, clearcoatRoughness:0.12, side: THREE.DoubleSide });
  group.add(buildNeck(lacquer));

  // 天（ちら）：上駒の先で、後ろへ反りながら細くなる
  const headPts = [];
  for(let i=0;i<=10;i++){ const t = i/10; headPts.push(new THREE.Vector3(-6 - t*HEAD_LEN, 0, -10 - t*t*55)); }
  const headCurve = new THREE.CatmullRomCurve3(headPts);
  const head = new THREE.Mesh(new THREE.TubeGeometry(headCurve, 24, 1, 12, false), lacquer);
  // 太さを先へ行くほど細く（チューブを各段ごとに拡大縮小）
  { const p = head.geometry.attributes.position, c = new THREE.Vector3();
    for(let i=0;i<p.count;i++){ const seg = Math.floor(i/13), t = seg/24; headCurve.getPoint(t, c);
      const k = 12 - t*5, dx = p.getX(i)-c.x, dy = p.getY(i)-c.y, dz = p.getZ(i)-c.z;
      p.setXYZ(i, c.x + dx*k*0.9, c.y + dy*k, c.z + dz*k*0.9); }
    head.geometry.computeVertexNormals(); }
  head.castShadow = true; group.add(head);
  // 上駒（うちじる）
  const nut = new THREE.Mesh(new THREE.BoxGeometry(3, 2*halfW(0), 2.4), new THREE.MeshStandardMaterial({color:'#eadfc6', roughness:0.5}));
  nut.position.set(-2, 0, 1.2); group.add(nut);
  // カラクイ（糸巻き）3本：天の横から出る
  const pegMat = new THREE.MeshPhysicalMaterial({ color:'#1a1210', roughness:0.35, clearcoat:0.8 });
  [[ -45, -1], [-80, 1], [-112, -1]].forEach(([x, side]) => {
    const c = new THREE.Vector3(); headCurve.getPoint(Math.min(1, (-6 - x)/HEAD_LEN), c);
    // カラクイ：天を横に貫く細めの軸と、つまむ所（先へ太くなる）
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 40, 14), pegMat);
    shaft.position.set(c.x, c.y + side*8, c.z); shaft.castShadow = true; group.add(shaft);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(side > 0 ? 7.5 : 4.2, side > 0 ? 4.2 : 7.5, 62, 16), pegMat);
    grip.position.set(c.x, c.y + side*58, c.z); grip.castShadow = true; group.add(grip);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(7.6, 16, 12), pegMat);
    knob.scale.set(1, 0.45, 1); knob.position.set(c.x, c.y + side*89, c.z); group.add(knob);
  });

  // 胴（ちーが）：角の丸い四角の木枠に、表と裏に蛇皮
  const r = 34, L = BODY_LEN, W = BODY_W;
  const shape = new THREE.Shape();
  shape.moveTo(-L/2 + r, -W/2);
  shape.lineTo(L/2 - r, -W/2); shape.quadraticCurveTo(L/2, -W/2, L/2, -W/2 + r);
  shape.lineTo(L/2, W/2 - r);  shape.quadraticCurveTo(L/2, W/2, L/2 - r, W/2);
  shape.lineTo(-L/2 + r, W/2); shape.quadraticCurveTo(-L/2, W/2, -L/2, W/2 - r);
  shape.lineTo(-L/2, -W/2 + r); shape.quadraticCurveTo(-L/2, -W/2, -L/2 + r, -W/2);
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: BODY_DEPTH, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 2, curveSegments: 10 });
  const skinTex = snakeTex(); skinTex.wrapS = skinTex.wrapT = THREE.RepeatWrapping;
  const skinMat = new THREE.MeshStandardMaterial({ map: skinTex, roughness: 0.6 });
  const frameMat = new THREE.MeshStandardMaterial({ color:'#1b120c', roughness:0.4 });
  // 表と裏（面）は蛇皮、側面は木枠
  { const uv = bodyGeo.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i, uv.getX(i)/120, uv.getY(i)/120); }
  const body = new THREE.Mesh(bodyGeo, [skinMat, frameMat]);
  body.position.set(BODY_X0 + L/2, 0, -BODY_DEPTH - 2);      // 表の蛇皮が棹の表と同じ高さ（z=0）
  body.castShadow = body.receiveShadow = true;
  group.add(body);
  // ティーガー（胴巻き）：胴の横まわりに巻いた布
  const band = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: BODY_DEPTH*0.62, bevelEnabled: true, bevelThickness: 0, bevelSize: 3.5, bevelSegments: 1, curveSegments: 10 }),
    [new THREE.MeshBasicMaterial({visible:false}), new THREE.MeshStandardMaterial({ map: tiigaaTex(), roughness: 0.85 })]);
  { const g = band.geometry, uv = g.attributes.uv, p = g.attributes.position;
    for(let i=0;i<uv.count;i++){ const a = Math.atan2(p.getY(i), p.getX(i)); uv.setXY(i, (a/(2*Math.PI)+0.5)*6, p.getZ(i)/(BODY_DEPTH*0.62)); } }
  band.position.set(BODY_X0 + L/2, 0, -BODY_DEPTH*0.81 - 0.5);
  group.add(band);

  // ウマ（駒）：竹の小さな駒
  const uma = new THREE.Mesh(new THREE.BoxGeometry(4, 2*strY(2, UMA_X) + 12, stringZ(UMA_X)), new THREE.MeshStandardMaterial({ color:'#d9c08a', roughness:0.55 }));
  uma.position.set(UMA_X, 0, stringZ(UMA_X)/2); uma.castShadow = true; group.add(uma);

  // 勘所の目印（練習用のシールのような小さな点）。棹の床側の縁に、勘所ごとに
  const dotMat = new THREE.MeshBasicMaterial({ color:'#fbb817' });
  for(const n of [2, 4, 5, 7, 9]){
    const d = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.6, 16), dotMat);
    const x = fretX(n); d.position.set(x, halfW(x) + 0.2, -2.5); group.add(d);
  }

  // 弦：上駒からウマまで。押さえた弦は、指のところで棹の表まで沈む
  const strMat = new THREE.MeshStandardMaterial({ color:'#f4ead2', roughness:0.35, metalness:0.1, emissive:'#000000' });
  const openMat = new THREE.MeshBasicMaterial({ color:'#5fe0ff' });
  const unit = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
  const strings = [0,1,2].map(s => {
    const a = new THREE.Mesh(unit, strMat), b = new THREE.Mesh(unit, strMat);
    group.add(a, b);
    return { a, b, s };
  });
  const place = (m, p, q, r) => {
    const A = new THREE.Vector3(...p), B = new THREE.Vector3(...q);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.scale.set(r, A.distanceTo(B), r);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), B.sub(A).normalize());
  };
  // str：弦ごとの { contact: 押さえる位置x } または null（開放）。open：光らせる開放弦
  function setStrings(str, open = []){
    strings.forEach(({a, b, s}) => {
      const r = STRING_R[s];
      const p0 = [-1, strY(s, 0), stringZ(0)], p1 = [UMA_X, strY(s, UMA_X), stringZ(UMA_X)];
      const info = str && str[s];
      const mat = open.includes(s) ? openMat : strMat;
      a.material = b.material = mat;
      if(info){
        const x = info.contact, pc = [x, strY(s, x), r + 0.1];
        place(a, p0, pc, r); place(b, pc, p1, r); b.visible = true;
      } else { place(a, p0, p1, r); b.visible = false; }
    });
  }
  setStrings(null);
  return { group, setStrings };
}
