/* =========================================================
   右手（爪で弾く）
   ・三線の爪（チミ）は人差し指にはめる。指輪のような輪を人差し指の中ほどにはめ、刃は指の腹側にそって指先の先まで出る
   ・手は軽くにぎり、人差し指は爪にそってゆるく曲げる。親指は人差し指の横に添えて爪を支える
   ・前腕は胴の上の縁にのせ、手は胴の皮の上（野坂の少し下）で弦を弾く
   ・弾く（ダウン）：爪の先が男弦の側から女弦の側へ弦を通りぬける。弾いたあとは少し浮かせて戻る
   ウクレレ・ハンドガイドの strum.js の考え方（手首を原点にした手の形を作ってから置く）を三線用にしたもの
   ========================================================= */
import { jointName, THUMB_JOINTS } from './handrig.js';
import { makeThumbModel, solveThumbTo } from './thumb.js';
import { strY, stringZ, BODY_X0, add, sub, mul, dot, cross, norm, vlen, DEG } from './geom.js';

export const PLUCK_X = BODY_X0 + 26;           // 弾く場所：胴の皮の上、野坂のすぐ下
export const TSUME_LEN = 72, TSUME_OUT = 30;   // 爪の長さと、指先から先へ出る長さ（mm）

const CFG = {
  curl: { 1: [22, 34, 14], 2: [72, 96, 62], 3: [82, 100, 62], 4: [88, 100, 60] },   // 指の曲げ（付け根・第二・第一関節）。人差し指は爪にそってゆるく
  // 手の向き（三線の座標）：指は女弦の側・皮の方へ向き、手の甲は客席側
  F: [-0.30, 0.80, -0.52],
  U: [0.15, -0.25, 0.95],
  elbow: [0.62, -0.42, -0.66],                 // 手首→ひじ：前腕は胴の上の縁にのって、体の方へ
};

// 手首を原点にした手の形（1回だけ計算）
function localHand(rig){
  if(rig._tsumeHand) return rig._tsumeHand;
  const palm = [0, -1, 0];
  const J = [];
  const pts1 = {};
  for(let f = 1; f <= 4; f++){
    const M = rig.rest[jointName(f, 0)], K = rig.rest[jointName(f, 1)], T = rig.rest[jointName(f, 4)];
    const d0 = norm(sub(T, K));
    const n1 = norm(sub(palm, mul(d0, dot(d0, palm))));
    const L = rig.lengths[f], c = CFG.curl[f];
    const pts = [K]; let a = 0, p = K;
    for(let i = 0; i < 3; i++){ a += c[i]*DEG; p = add(p, add(mul(d0, Math.cos(a)*L[i]), mul(n1, Math.sin(a)*L[i]))); pts.push(p); }
    const axis = norm(cross(d0, n1));
    const Bm = rig.restBasis[jointName(f, 0)];
    J.push({ name: jointName(f, 0), pos: M, fwd: norm(sub(K, M)), dorsal: Bm[1] });
    for(let i = 0; i < 4; i++){
      const fwd = norm(sub(pts[Math.min(i + 1, 3)], pts[Math.min(i, 2)]));
      J.push({ name: jointName(f, i + 1), pos: pts[i], fwd, dorsal: cross(fwd, axis) });
    }
    if(f === 1) Object.assign(pts1, { pts, n1, axis });
  }
  // 親指：腹を人差し指の第二関節の横（親指側）に当てて、爪を支える
  rig.thumbModel ||= makeThumbModel(THUMB_JOINTS.map(n => rig.rest[n]), THUMB_JOINTS.map(n => rig.restBasis[n]), palm, rig.rest[jointName(1, 1)]);
  const radial = norm(sub(rig.rest[jointName(1, 1)], rig.rest[jointName(2, 1)]));
  const thTarget = add(add(mul(add(pts1.pts[1], pts1.pts[2]), 0.5), mul(radial, 9)), mul(palm, 4));
  const th = solveThumbTo(rig.thumbModel, thTarget);
  for(let i = 0; i < 4; i++){
    const B = rig.thumbModel.restBasis[i], R = th.Rs[i];
    const mv = v => [dot(R[0], v), dot(R[1], v), dot(R[2], v)];
    J.push({ name: THUMB_JOINTS[i], pos: th.pts[i], fwd: mv(mul(B[2], -1)), dorsal: mv(B[1]) });
  }
  // 爪：人差し指の第二関節から、指の腹側にそって、指先の TSUME_OUT 先まで
  const [, P, D, T] = pts1.pts;
  const dir = norm(sub(T, P));
  const pad = pts1.n1;                                           // 指の腹の向き
  const base = add(P, mul(pad, 6));
  const tip = add(add(T, mul(dir, TSUME_OUT)), mul(pad, 3));
  const out = { J, tsume: { base, tip, side: pts1.axis, pad } };
  rig._tsumeHand = out;
  return out;
}

/** 手首の座標軸（三線の座標） */
function frame(){
  const F = norm(CFG.F);
  let U = sub(CFG.U, mul(F, dot(CFG.U, F))); U = norm(U);
  const Z = mul(F, -1), Y = U, X = cross(Y, Z);
  return { F, U, X, Y, Z };
}
const toW = (H, W, o) => add(W, add(add(mul(H.X, o[0]), mul(H.Y, o[1])), mul(H.Z, o[2])));
const toD = (H, o) => add(add(mul(H.X, o[0]), mul(H.Y, o[1])), mul(H.Z, o[2]));

/**
 * 右手の形。st = { from, to, t }：弾く弦（from→to、0=男弦 2=女弦）と、弾いてからの時間の割合 t（0〜1。1以上は構え）
 * 戻り値：joints（関節）と tsume（爪の根元・先・向き。三線の座標）
 */
export function rightHandPose(rig, st){
  const { J, tsume } = localHand(rig);
  const H = frame();
  // 爪の先をどこに置くか
  const y0 = strY(st.from ?? 0, PLUCK_X) - 9, y1 = strY(st.to ?? 0, PLUCK_X) + 7;
  const zS = stringZ(PLUCK_X);
  let y, z;
  const t = st.t ?? 1;
  if(t < 0.22){ const u = t/0.22, e = u*u*(3 - 2*u); y = y0 + (y1 - y0)*e; z = zS - 1.2*Math.sin(Math.PI*e); }        // 弦を通りぬける（少し押し込む）
  else if(t < 1){ const u = (t - 0.22)/0.78, e = u*u*(3 - 2*u); y = y1 + (strY(0, PLUCK_X) - 9 - y1)*e; z = zS + 9*Math.sin(Math.PI*e); }   // 浮かせて戻る
  else { y = strY(0, PLUCK_X) - 9; z = zS + 1; }                                                                     // 構え：男弦の少し上
  const want = [PLUCK_X, y, z];
  const W = sub(want, toD(H, tsume.tip));
  const joints = [];
  joints.push({ name: 'wrist', pos: W, fwd: H.F, dorsal: H.U });
  { const A = norm(CFG.elbow), fw = mul(A, -1); joints.push({ name: 'forearm', pos: W, fwd: fw, dorsal: sub(H.U, mul(fw, dot(H.U, fw))) }); }
  for(const j of J) joints.push({ name: j.name, pos: toW(H, W, j.pos), fwd: norm(toD(H, j.fwd)), dorsal: norm(toD(H, j.dorsal)) });
  return {
    joints,
    tsume: { base: toW(H, W, tsume.base), tip: toW(H, W, tsume.tip), side: norm(toD(H, tsume.side)), pad: norm(toD(H, tsume.pad)) }
  };
}
export { vlen };
