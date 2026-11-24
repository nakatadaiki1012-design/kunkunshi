/* =========================================================
   画質と軽さ：端末の性能に合わせて、手の細かさ・影・解像度を切り替える
   （ウクレレ・ハンドガイドの quality.js を簡単にしたもの）
   ========================================================= */
export const TIERS = {
  high: { label:'きれい', pr:1.5,  aa:true,  shadow:2048, subdiv:2 },
  mid:  { label:'ふつう', pr:1.25, aa:true,  shadow:1024, subdiv:1 },
  low:  { label:'軽い',   pr:1.0,  aa:false, shadow:0,    subdiv:1 },
};
function detectTier(){
  const ua = navigator.userAgent || '';
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 900);
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || (mobile ? 3 : 8);
  if(!mobile) return 'high';
  if(mem <= 3 || cores <= 4) return 'low';
  return (window.devicePixelRatio || 1) >= 3 ? 'low' : 'mid';
}
const tier = typeof window === 'undefined' ? 'mid' : detectTier();
export const Q = {...TIERS[tier], tier};
