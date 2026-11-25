/* =========================================================
   三線を押さえる左手の3D表示（three.js）
   ウクレレ・ハンドガイド／ギター・ハンドガイドの view.js をもとにした、三線用の小さな表示。
   ・show(notes, oshi)：勘所の番号（0〜13）から、押さえる指と位置を決めて、手をその形へなめらかに動かす
   ・カメラはドラッグで回せる。ピンチ（ホイール）で拡大
   ========================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildSanshin } from './sanshinModel.js';
import { loadHand, applyPose } from './handrig.js';
import { computePose, blendPose } from './pose.js';
import { strY, stringZ, halfW, fretX, STRING_R, DEG } from './geom.js';
import { rightHandPose } from './rightHand.js';
import { Q } from './quality.js';
import { KANDOKORO, POSITION_NAMES, STRING_NAMES } from '../types/kunkunshi';
import { chordFromNotes, FINGER_COLORS, FINGER_NAMES } from './chord.js';
export { chordFromNotes, FINGER_COLORS, FINGER_NAMES };

/* 構え：胴を右の太ももにのせ、棹を約42°に立てる（天が肩の高さ。正面から見て、天は右上＝弾く人の左）。
   三線の座標（x：上駒→胴、y：男弦→女弦、z：棹の表）を、まわりの座標（y が上、z が客席）へ傾けて置く。
   カメラの向き：el＝見下ろす角度、az＝正面（客席）から右へ回した角度 */
export const TILT = 42;
export const VIEWS = {
  diag:  { label: 'ななめ', el: 16, az: -30, dist: 1500, at: [290, 10, -10] },
  self:  { label: '自分目線', el: 46, az: 168, dist: 1300, at: [290, 10, -10] },
  front: { label: '正面', el: 4, az: 0, dist: 1600, at: [290, 10, -10] },
  side:  { label: '横から', el: 12, az: -75, dist: 1350, at: [290, 10, -10] },
  left:  { label: '左手', el: 20, az: -20, dist: 620, at: [110, 20, -10] },
  right: { label: '右手', el: 8, az: 38, dist: 600, at: [520, 0, -10] },
};

export async function createSanshinHand({ canvas, overlay }){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: Q.aa, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.pr));
  renderer.shadowMap.enabled = Q.shadow > 0; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // 背景：沖縄の空と海の色のグラデーション
  {
    const c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#bfe8f2'); gr.addColorStop(0.55, '#e9f6f3'); gr.addColorStop(1, '#f3e9d4');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const hemi = new THREE.HemisphereLight('#eaf6ff', '#d8c7a0', 0.7); hemi.position.set(0, 1, 0); scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff6ea', 2.6);
  key.position.set(-260, 620, 560); key.castShadow = !!Q.shadow;
  key.shadow.mapSize.set(Q.shadow || 512, Q.shadow || 512);
  Object.assign(key.shadow.camera, { left: -350, right: 350, top: 350, bottom: -350, near: 50, far: 1500 });
  key.target.position.set(0, 0, 0); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.8;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#ffd9b8', 0.6); rim.position.set(400, -150, -300); scene.add(rim);

  // 構えた三線（三線と両手をまとめて傾ける）
  const holder = new THREE.Group();
  {
    const c = Math.cos(TILT*DEG), s = Math.sin(TILT*DEG);
    // 三線の x（胴の方）→ 左下、y（女弦の側）→ 右下、z（棹の表）→ 客席。正面から見て天が右上
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(-c, -s, 0), new THREE.Vector3(s, -c, 0), new THREE.Vector3(0, 0, 1));
    holder.quaternion.setFromRotationMatrix(m);
    // 棹の表を、少しだけ上（弾く人の方）へ向ける
    holder.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -10*DEG));
    holder.position.set(140, 60, 0);
  }
  scene.add(holder);
  const sanshin = buildSanshin();
  holder.add(sanshin.group);

  // 手：肌は少し透明感のある質感（ウクレレ・ハンドガイドと同じ）
  const skin = new THREE.MeshStandardMaterial({ color: '#d9997a', roughness: 0.52, metalness: 0, envMapIntensity: 0.6 });
  skin.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      float wrapL = clamp(dot(normal, normalize(vec3(-0.25,-0.45,0.85)))*0.5+0.5, 0.0, 1.0);
      reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(0.32,0.09,0.05) * (1.0-wrapL) * 0.9;
      float rimL = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);
      reflectedLight.indirectDiffuse += vec3(1.0,0.62,0.5) * rimL * 0.12;`);
  };
  /* 腕は手首の少し先までだけ見せる（手首から30〜85mmで、だんだん透明にして消す） */
  function addArmFade(mat, rig, depthOnly){
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh, r) => {
      prev && prev.call(mat, sh, r);
      sh.uniforms.uWristP = { value: rig.fade.p }; sh.uniforms.uWristZ = { value: rig.fade.z };
      sh.vertexShader = 'uniform vec3 uWristP; uniform vec3 uWristZ; varying float vAlong;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vAlong = dot(position - uWristP, uWristZ);');
      sh.fragmentShader = 'varying float vAlong;\n' +
        sh.fragmentShader.replace('#include <alphatest_fragment>', `#include <alphatest_fragment>
          float armFade = 1.0 - smoothstep(0.03, 0.085, vAlong);
          ${depthOnly ? 'if(armFade < 0.6) discard;' : 'diffuseColor.a *= armFade*armFade*(3.0-2.0*armFade); if(diffuseColor.a < 0.004) discard;'}`);
    };
    mat.customProgramCacheKey = () => 'armfade-' + mat.uuid + (depthOnly ? 'd' : '');
  }
  const rig = await loadHand(skin, 'left');
  addArmFade(skin, rig);
  skin.transparent = true;
  holder.add(rig.root);
  // 右手（爪をはめて弾く）
  const skinR = new THREE.MeshStandardMaterial({ color: '#d9997a', roughness: 0.52, metalness: 0, envMapIntensity: 0.6, transparent: true });
  const rigR = await loadHand(skinR, 'right');
  addArmFade(skinR, rigR);
  holder.add(rigR.root);
  // 爪（チミ）：水牛の角のような黒っぽい色。刃は細長く先へ細くなる。指にはめる輪つき
  const tsumeMat = new THREE.MeshPhysicalMaterial({ color: '#8a5a2e', roughness: 0.28, clearcoat: 0.7, emissive: '#2a1606' });   // 水牛の角の色（蛇皮の上でも見えるよう少し明るめ）
  const tsume = new THREE.Group();
  const tsumeRing = new THREE.Mesh(new THREE.TorusGeometry(9.5, 1.5, 8, 24), tsumeMat);
  {
    const sh = new THREE.Shape();                    // 長さ方向 x（0→1）、幅 y
    sh.moveTo(0, -7); sh.quadraticCurveTo(0.5, -6.5, 0.82, -3.2); sh.quadraticCurveTo(1, -1.2, 1.02, 0);
    sh.quadraticCurveTo(1, 1.2, 0.82, 3.2); sh.quadraticCurveTo(0.5, 6.5, 0, 7); sh.closePath();
    const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 2.6, bevelEnabled: false, curveSegments: 10 }), tsumeMat);
    blade.geometry.translate(0, 0, -1.3); blade.castShadow = true;
    tsume.userData.blade = blade; tsume.add(blade);
  }
  holder.add(tsume, tsumeRing);
  function placeTsume(ts){
    const base = new THREE.Vector3(...ts.base), dir = new THREE.Vector3(...ts.tip).sub(base);
    const L = dir.length(); dir.normalize();
    const side = new THREE.Vector3(...ts.side), pad = new THREE.Vector3().crossVectors(dir, side).normalize();
    side.crossVectors(pad, dir).normalize();
    tsume.userData.blade.scale.set(L, 1, 1);
    tsume.position.copy(base);
    tsume.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(dir, side, pad));
    // 輪：刃の根元で、指をぐるっと囲む
    tsumeRing.position.copy(base).addScaledVector(new THREE.Vector3(...ts.pad), -6).addScaledVector(dir, 6);
    tsumeRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  }
  let rightOn = true;
  const pluck = { from: 0, to: 0, start: -1e9, dur: 420 };
  function setRight(on){ rightOn = on; rigR.root.visible = tsume.visible = tsumeRing.visible = on; markDirty(); }
  // 半透明の手：先に奥行きだけを描いてから、いちばん手前の皮膚だけを半透明で描く
  const depthMat = new THREE.MeshBasicMaterial({ colorWrite: false });
  const handDepth = new THREE.SkinnedMesh(rig.mesh.geometry, depthMat);
  handDepth.bind(rig.mesh.skeleton, rig.mesh.bindMatrix);
  addArmFade(depthMat, rig, true);
  handDepth.frustumCulled = false; handDepth.renderOrder = 1; handDepth.visible = false;
  rig.mesh.parent.add(handDepth);
  let ghost = false;
  function setGhost(on){
    ghost = on;
    skin.opacity = on ? 0.55 : 1; skin.depthWrite = !on;
    skin.emissive.set(on ? '#5a2a18' : '#000000');
    rig.mesh.renderOrder = on ? 2 : 0; handDepth.visible = on; rig.mesh.castShadow = !on;
    skin.needsUpdate = true; markDirty();
  }

  // 押さえる場所の印（指の色の丸と光）
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const marks = [0, 1, 2].map(() => {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(4.2, 32), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0.9, depthWrite: false }));
    disc.renderOrder = 3;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthTest: false, depthWrite: false, opacity: 0.9 }));
    glow.scale.set(14, 14, 1); glow.renderOrder = 9;
    holder.add(disc, glow);
    return { disc, glow };
  });

  // カメラ
  const camera = new THREE.PerspectiveCamera(26, 16/9, 10, 20000);
  const target = new THREE.Vector3();
  let viewName = 'diag';
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = true; controls.screenSpacePanning = true; controls.minDistance = 140; controls.maxDistance = 2600;
  controls.rotateSpeed = 0.7; controls.zoomSpeed = 0.8; controls.enableDamping = true; controls.dampingFactor = 0.12;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.addEventListener('change', () => kick());
  function setView(name){
    viewName = VIEWS[name] ? name : 'diag';
    // 見る中心：左手と右手の間（棹のまん中あたり）
    holder.updateMatrixWorld(true);
    const v = VIEWS[viewName], narrow = canvas.clientWidth < 520;
    target.copy(holder.localToWorld(new THREE.Vector3(...v.at)));
    const d = v.dist * (narrow ? 1.25 : 1), el = v.el * DEG, az = v.az * DEG;
    camera.up.set(0, 1, 0);
    camera.position.copy(target).add(new THREE.Vector3(Math.sin(az)*Math.cos(el), Math.sin(el), Math.cos(az)*Math.cos(el)).multiplyScalar(d));
    controls.target.copy(target); controls.update(); kick();
  }

  // 手の形
  let cur = computePose(chordFromNotes([]), rig), from = cur, to = cur, t0 = 0, dur = 1;
  let label = { text: '', sub: '' }, chordNow = chordFromNotes([]);
  const queue = [];       // ひまな時に先に計算しておく形
  function poseFor(chord){ return computePose(chord, rig); }

  function show(notes, oshi = 0, opts = {}){
    const chord = chordFromNotes(notes, oshi, { position: opts.position, finger: opts.finger });
    chordNow = chord;
    const p = poseFor(chord);
    from = cur; to = p; t0 = performance.now(); dur = opts.instant ? 1 : (opts.duration || 220);
    // 右手：音がある時は、その弦を爪で弾く（2本なら上の弦から下の弦へ通りぬける）
    if(opts.pluck && notes && notes.length){
      const strs = notes.map(n => KANDOKORO[n]?.str).filter(v => v !== undefined).sort((a, b) => a - b);
      if(strs.length){ pluck.from = strs[0]; pluck.to = strs[strs.length - 1]; pluck.start = performance.now() + (opts.instant ? 0 : Math.min(dur, 120)); }
    }
    const names = (notes || []).map(n => POSITION_NAMES[n]).filter(Boolean);
    const acc = oshi === 1 ? '♯' : oshi === 2 ? '♭' : '';
    label = {
      text: names.length ? acc + names.join('') : '',
      sub: (notes || []).map(n => {
        const k = KANDOKORO[n]; if(!k) return '';
        const f = chord.fingers[k.str];
        return `${STRING_NAMES[k.str]}・${f ? FINGER_NAMES[f] : '開放（押さえない）'}`;
      }).join(' ／ ') + (chord.frets.some(v => v > 0) ? (chord.position === 'shaku' ? '（尺位）' : '（本手）') : '')
    };
    kick();
  }

  // 描く（必要な時だけ）
  let raf = 0, dirty = true, alive = true;
  function markDirty(){ dirty = true; kick(); }
  function kick(){ if(!raf && alive) raf = requestAnimationFrame(frame); }
  const tmpV = new THREE.Vector3();
  function project(p, W, H){ tmpV.set(p[0], p[1], p[2]); holder.localToWorld(tmpV); tmpV.project(camera); if(tmpV.z > 1) return null; return [(tmpV.x + 1)/2*W, (1 - tmpV.y)/2*H]; }
  function frame(){
    raf = 0; if(!alive) return;
    const now = performance.now();
    let moving = false, rightAnim = false;
    if(from !== to){
      const t = Math.min(1, (now - t0)/dur);
      cur = t >= 1 ? to : blendPose(from, to, t);
      if(t >= 1) from = to; else moving = true;
      dirty = true;
    }
    // 右手：弾いている間は動かす
    const pt = (now - pluck.start)/pluck.dur;
    const plucking = rightOn && pt > -1 && pt < 1;
    if(plucking || dirty){
      if(rightOn){
        const rp = rightHandPose(rigR, { from: pluck.from, to: pluck.to, t: pt < 0 ? 1 : pt });
        applyPose(rigR, rp); placeTsume(rp.tsume);
      }
      if(plucking) rightAnim = true;
      renderer.shadowMap.needsUpdate = true;
    }
    const camMoving = controls.update();
    // 大きさ
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const s = renderer.getSize(new THREE.Vector2());
    if(w && h && (s.x !== w || s.y !== h)){ renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix(); }
    if(dirty){
      applyPose(rig, cur);
      sanshin.setStrings(cur.str, chordNow.open);
      cur.str.forEach((info, s) => {
        const m = marks[s];
        m.disc.visible = m.glow.visible = !!info && !moving;
        if(!info) return;
        const f = chordNow.fingers[s] || 1, x = info.contact, y = strY(s, x);
        m.disc.material.color.set(FINGER_COLORS[f]); m.glow.material.color.set(FINGER_COLORS[f]);
        m.disc.position.set(x, y, 0.08); m.glow.position.set(x, y, STRING_R[s] + 1.2);
        m.glow.visible = ghost && !moving;
      });
      renderer.shadowMap.needsUpdate = true;
      dirty = false;
    }
    renderer.render(scene, camera);
    // 文字（勘所の名前・弦の名前・指の名前）
    if(overlay){
      let html = '';
      const at = (p, cls, txt, style = '') => { const q = project(p, w, h); if(q && q[0] > -40 && q[0] < w + 40 && q[1] > -40 && q[1] < h + 40) html += `<div class="${cls}" style="left:${q[0].toFixed(1)}px;top:${q[1].toFixed(1)}px;${style}">${txt}</div>`; };
      for(let s = 0; s < 3; s++) at([-14, strY(s, 0), stringZ(0) + 3], 'h3d-lab', STRING_NAMES[s].slice(0, 1));
      // 勘所の目印の名前（棹の床側の縁）
      [[2,'乙 上 五'],[4,'老 中 六'],[5,'下老 尺 七'],[7,'八'],[9,'九']].forEach(([n, t], i) => at([fretX(n), halfW(fretX(n)) + (i % 2 ? 26 : 11), -3], 'h3d-pos', t));   // 勘所シールの名前。近い勘所が重ならないよう、互い違いに
      if(!moving) for(let f = 1; f <= 4; f++){
        const F = cur.fingers[f]; if(!F || F.mode === 'hover') continue;
        at(F.pts[3], 'h3d-badge', FINGER_NAMES[f].slice(0, 1), `background:${FINGER_COLORS[f]}`);
      }
      if(overlay._html !== html){ overlay._html = html; overlay.innerHTML = html; }
    }
    if(moving || camMoving || rightAnim) kick();
    else idleWork();
  }
  // ひまな時に、よく使う形を先に計算しておく（演奏中に計算で止まらないように）
  function idleWork(){
    if(!queue.length) return;
    const ric = window.requestIdleCallback || (fn => setTimeout(fn, 60));
    ric(() => { if(!alive || !queue.length) return; poseFor(queue.shift()); if(queue.length) idleWork(); });
  }
  function prepare(list){
    for(const { notes, oshi, position } of list) queue.push(chordFromNotes(notes, oshi || 0, { position }));
    idleWork();
  }

  const ro = new ResizeObserver(() => markDirty());
  ro.observe(canvas);
  setView('front');
  applyPose(rig, cur); markDirty();

  return {
    show, setView, setGhost, setRight, prepare,
    get viewName(){ return viewName; },
    get label(){ return label; },
    dispose(){
      alive = false; if(raf) cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      renderer.dispose(); pmrem.dispose();
    }
  };
}
