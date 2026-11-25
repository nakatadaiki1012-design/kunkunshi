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
import { Q } from './quality.js';
import { KANDOKORO, POSITION_NAMES, STRING_NAMES } from '../types/kunkunshi';
import { chordFromNotes, FINGER_COLORS, FINGER_NAMES } from './chord.js';
export { chordFromNotes, FINGER_COLORS, FINGER_NAMES };

/* 三線は横に構える：空（上）は -y（男弦の側）、棹の表（客席）は +z、胴は +x */
export const VIEWS = {
  diag:  { label: 'ななめ', el: 24, az: 30, dist: 760 },
  self:  { label: '自分目線', el: 60, az: 8, dist: 660 },
  front: { label: '正面', el: 6, az: 4, dist: 720 },
  side:  { label: '横から', el: 16, az: -62, dist: 560 },
};
const UP = [0, -1, 0];

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
  const hemi = new THREE.HemisphereLight('#eaf6ff', '#d8c7a0', 0.7); hemi.position.set(0, -1, 0); scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff6ea', 2.6);
  key.position.set(-120, -420, 380); key.castShadow = !!Q.shadow;
  key.shadow.mapSize.set(Q.shadow || 512, Q.shadow || 512);
  Object.assign(key.shadow.camera, { left: -350, right: 350, top: 350, bottom: -350, near: 50, far: 1500 });
  key.target.position.set(200, 0, -40); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.8;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#ffd9b8', 0.6); rim.position.set(400, 200, 150); scene.add(rim);

  const sanshin = buildSanshin();
  scene.add(sanshin.group);

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
  scene.add(rig.root);
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
    scene.add(disc, glow);
    return { disc, glow };
  });

  // カメラ
  const camera = new THREE.PerspectiveCamera(26, 16/9, 10, 20000);
  const target = new THREE.Vector3(130, 6, -4);
  let viewName = 'diag';
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = true; controls.screenSpacePanning = true; controls.minDistance = 140; controls.maxDistance = 1400;
  controls.rotateSpeed = 0.7; controls.zoomSpeed = 0.8; controls.enableDamping = true; controls.dampingFactor = 0.12;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.addEventListener('change', () => kick());
  function setView(name){
    viewName = VIEWS[name] ? name : 'diag';
    // 見る中心：手のあたりと胴の間（胴が画面に入るように少し胴寄り）
    target.set(Math.min(Math.max((cur?.target?.[0] ?? 130) + 70, 150), 300), 6, -10);
    const v = VIEWS[viewName], narrow = canvas.clientWidth < 520;
    const d = v.dist * (narrow ? 1.25 : 1), el = v.el * DEG, az = v.az * DEG;
    camera.up.set(...UP);
    camera.position.copy(target).add(new THREE.Vector3(Math.sin(az)*Math.cos(el), -Math.sin(el), Math.cos(az)*Math.cos(el)).multiplyScalar(d));
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
  function project(p, W, H){ tmpV.set(p[0], p[1], p[2]).project(camera); if(tmpV.z > 1) return null; return [(tmpV.x + 1)/2*W, (1 - tmpV.y)/2*H]; }
  function frame(){
    raf = 0; if(!alive) return;
    const now = performance.now();
    let moving = false;
    if(from !== to){
      const t = Math.min(1, (now - t0)/dur);
      cur = t >= 1 ? to : blendPose(from, to, t);
      if(t >= 1) from = to; else moving = true;
      dirty = true;
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
    if(moving || camMoving) kick();
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
  setView('diag');
  applyPose(rig, cur); markDirty();

  return {
    show, setView, setGhost, prepare,
    get viewName(){ return viewName; },
    get label(){ return label; },
    dispose(){
      alive = false; if(raf) cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      renderer.dispose(); pmrem.dispose();
    }
  };
}
