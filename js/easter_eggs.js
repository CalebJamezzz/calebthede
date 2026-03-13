// ══ EASTER EGGS ══

// 1. Konami code: ↑↑↓↓←→←→BA
const KONAMI=[38,38,40,40,37,39,37,39,66,65];
let konamiIdx=0;
document.addEventListener('keydown',e=>{
  if(e.keyCode===KONAMI[konamiIdx]){
    konamiIdx++;
    if(konamiIdx===KONAMI.length){konamiIdx=0;triggerKonami()}
  } else {konamiIdx=0}
});

function triggerKonami(){
  const o=document.getElementById('konamiOverlay');
  o.classList.add('visible');
  document.body.style.overflow='hidden';
  document.querySelectorAll('.kf').forEach((el,i)=>setTimeout(()=>el.classList.add('show'),300+i*180));
}
function closeKonami(){
  document.getElementById('konamiOverlay').classList.remove('visible');
  document.body.style.overflow='';
  document.querySelectorAll('.kf').forEach(el=>el.classList.remove('show'));
}

// 2. Triple-click the logo — secret toast
let logoClicks=0,logoTimer=null;
document.querySelector('.nav-logo').addEventListener('click',()=>{
  logoClicks++;
  clearTimeout(logoTimer);
  if(logoClicks===3){
    logoClicks=0;
    toast('👀 You found one. There are more hidden around the site.','success');
  } else {logoTimer=setTimeout(()=>logoClicks=0,600)}
});

// 3. Hover the footer copyright 5x fast
let footerHovers=0,footerTimer=null;
document.addEventListener('mouseover',e=>{
  if(e.target.closest('footer span:first-child')){
    footerHovers++;clearTimeout(footerTimer);
    footerTimer=setTimeout(()=>footerHovers=0,1200);
    if(footerHovers>=5){footerHovers=0;toast('🧠 Psychology + Code. Two paths, one direction.','success')}
  }
});

// 4. Type "myth" anywhere (not in an input) to trigger a toast
let typedBuffer='';
document.addEventListener('keypress',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  typedBuffer=(typedBuffer+e.key).slice(-6).toLowerCase();
  if(typedBuffer.includes('myth')){typedBuffer='';toast('✦ The mythology book is in the Library. Give it a read.','success')}
  if(typedBuffer.includes('caleb')){typedBuffer='';triggerShootingStar();toast('👋 Hey, that\'s me.','success')}
  if(typedBuffer.includes('ziggi')){typedBuffer='';toast('☕ Ziggi\'s Coffee — where the capstone app was born. Good espresso too.','success')}
  if(typedBuffer.slice(-2)==='qa'){typedBuffer='';toast('🧪 // test passed · no bugs found · probably.','success')}
});

// 5. Type "ziggi" → coffee easter egg
// 6. Type "qa" → QA engineer joke
// (typedBuffer already tracks keypress — just extend the checks)

// 7. Click the teal/gold palette swatch on about stat cards 7 times
let statClicks=0,statTimer=null;
document.addEventListener('click',e=>{
  if(e.target.closest('.stat')){
    statClicks++;clearTimeout(statTimer);
    statTimer=setTimeout(()=>statClicks=0,2000);
    if(statClicks>=7){statClicks=0;toast('🎨 Teal for logic. Gold for meaning. You clicked seven times to find that out.','success')}
  }
});

// 8. Idle on the Library page for 30s without clicking
let libraryIdleTimer=null;
function resetLibraryIdle(){
  clearTimeout(libraryIdleTimer);
  if(document.getElementById('page-library').classList.contains('active')){
    libraryIdleTimer=setTimeout(()=>{
      toast('📖 Still here? The book is waiting. Chapter one is a good place to start.','success');
    },30000);
  }
}
document.addEventListener('mousemove',resetLibraryIdle);
document.addEventListener('keydown',resetLibraryIdle);

// 9. Scroll to the very bottom of the contact page and back up 3 times
let contactScrollDir=null,contactScrollCount=0;
document.addEventListener('scroll',()=>{
  if(!document.getElementById('page-contact').classList.contains('active'))return;
  const atBottom=window.innerHeight+window.scrollY>=document.body.offsetHeight-20;
  const atTop=window.scrollY<20;
  if(atBottom&&contactScrollDir!=='bottom'){contactScrollDir='bottom';if(contactScrollCount<6)contactScrollCount++}
  if(atTop&&contactScrollDir!=='top'){contactScrollDir='top';if(contactScrollCount<6)contactScrollCount++}
  if(contactScrollCount>=6){contactScrollCount=0;toast('📬 You really want to reach out. Just hit send — I read everything.','success')}
},{ passive:true });


// ── SHOOTING STAR ────────────────────────────────────────────────────────────
const ssCanvas = document.getElementById('shootingStarCanvas');
const ssCtx = ssCanvas.getContext('2d');
let ssParticles = [];
let ssAnimId = null;

function resizeSSCanvas(){
  ssCanvas.width = window.innerWidth;
  ssCanvas.height = window.innerHeight;
}
resizeSSCanvas();
window.addEventListener('resize', resizeSSCanvas);

function shootStar(fromX, fromY, toX, toY, onExplode){
  // Star trail
  let progress = 0;
  const duration = 600;
  const startTime = performance.now();
  const trail = [];

  function animateStar(now){
    progress = Math.min((now - startTime) / duration, 1);
    const x = fromX + (toX - fromX) * easeInQuad(progress);
    const y = fromY + (toY - fromY) * easeInQuad(progress);

    trail.push({x, y, alpha: 1});
    trail.forEach((p, i) => p.alpha = (i / trail.length) * 0.6);
    if(trail.length > 22) trail.shift();

    ssCtx.clearRect(0, 0, ssCanvas.width, ssCanvas.height);

    // Draw trail
    trail.forEach(p => {
      ssCtx.beginPath();
      ssCtx.arc(p.x, p.y, 1.5, 0, Math.PI*2);
      ssCtx.fillStyle = `rgba(200,164,90,${p.alpha})`;
      ssCtx.fill();
    });

    // Draw star head
    ssCtx.beginPath();
    ssCtx.arc(x, y, 3.5, 0, Math.PI*2);
    ssCtx.fillStyle = '#fff';
    ssCtx.shadowColor = '#C8A45A';
    ssCtx.shadowBlur = 12;
    ssCtx.fill();
    ssCtx.shadowBlur = 0;

    if(progress < 1){
      requestAnimationFrame(animateStar);
    } else {
      explodeStar(toX, toY);
      if(onExplode) onExplode();
    }
  }
  requestAnimationFrame(animateStar);
}

function easeInQuad(t){ return t*t }

function explodeStar(x, y){
  const colors = ['#ff6b6b','#ff9f43','#ffd32a','#0be881','#67e8f9','#a78bfa','#f472b6','#fff','#C8A45A','#4EC9B0'];
  const particles = Array.from({length:55}, (_, i) => {
    const angle = (i / 55) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 2 + Math.random() * 5;
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random()*colors.length)],
      alpha: 1,
      size: 1 + Math.random() * 2.5,
      decay: 0.012 + Math.random() * 0.018,
      gravity: 0.08
    };
  });

  // Rainbow flash — JS driven so colors actually cycle
  startRainbow();

  function animateExplosion(){
    ssCtx.clearRect(0, 0, ssCanvas.width, ssCanvas.height);
    let alive = false;
    particles.forEach(p => {
      if(p.alpha <= 0) return;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.97;
      p.alpha -= p.decay;

      ssCtx.beginPath();
      ssCtx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ssCtx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2,'0');
      ssCtx.shadowColor = p.color;
      ssCtx.shadowBlur = 4;
      ssCtx.fill();
    });
    ssCtx.shadowBlur = 0;
    if(alive) requestAnimationFrame(animateExplosion);
    else ssCtx.clearRect(0, 0, ssCanvas.width, ssCanvas.height);
  }
  requestAnimationFrame(animateExplosion);
}

// Trigger: random edge → center-ish target
function triggerShootingStar(){
  const w = window.innerWidth, h = window.innerHeight;
  const fromX = Math.random() < 0.5 ? 0 : w;
  const fromY = Math.random() * h * 0.5;
  const toX = w * 0.3 + Math.random() * w * 0.4;
  const toY = h * 0.3 + Math.random() * h * 0.4;
  shootStar(fromX, fromY, toX, toY);
}

// Fire on: konami, secret finds, random every 90–180s
function scheduleRandomStar(){
  const delay = 120000 + Math.random() * 80000;
  setTimeout(()=>{ triggerShootingStar(); scheduleRandomStar(); }, delay);
}
scheduleRandomStar();


// ── BLUE FLAME CURSOR ────────────────────────────────────────────────────────
var flameActive = false;
var flameTimeout = null;

function activateFlameCursor(duration=30000){
  if(flameActive) clearTimeout(flameTimeout);
  flameActive = true;
  document.body.classList.add('flame-cursor');
  toast('🔵 A blue flame awakens…','success');
  flameTimeout = setTimeout(()=>{
    flameActive = false;
    document.body.classList.remove('flame-cursor');
  }, duration);
}

// Trigger 1: Spend 60 seconds on the Library page
var chapterReadTimer=null;
function startChapterReadTimer(){
  clearTimeout(chapterReadTimer);
  chapterReadTimer = setTimeout(()=>{
    if(document.getElementById('page-library').classList.contains('active')){
      activateFlameCursor(45000);
    }
  }, 60000);
}
function stopChapterReadTimer(){ clearTimeout(chapterReadTimer); }

// Trigger 2: Hold mousedown on any book card for 3 seconds
var bookHoldTimer=null;
document.addEventListener('mousedown', e=>{
  const cover = e.target.closest('.book-card');
  if(cover){
    bookHoldTimer = setTimeout(()=>{ activateFlameCursor(); }, 3000);
  }
});
document.addEventListener('mouseup', ()=>clearTimeout(bookHoldTimer));
document.addEventListener('mouseleave', ()=>clearTimeout(bookHoldTimer));


// Constellation loader helper
function constellationLoader(small=false){
  const s = small ? 24 : 48;
  const cx = s/2, cy = s/2, r = s*0.38;
  // 5 stars on a circle
  const stars = Array.from({length:5},(_,i)=>{
    const a = (i/5)*Math.PI*2 - Math.PI/2;
    return {x: cx+Math.cos(a)*r, y: cy+Math.sin(a)*r};
  });
  const lines = [[0,1],[1,2],[2,3],[3,4],[4,0],[0,2]];
  const linesHTML = lines.map(([a,b])=>
    `<line x1="${stars[a].x.toFixed(1)}" y1="${stars[a].y.toFixed(1)}" x2="${stars[b].x.toFixed(1)}" y2="${stars[b].y.toFixed(1)}" stroke="var(--gold)" stroke-width=".6" opacity=".3"/>`
  ).join('');
  const starsHTML = stars.map((st,i)=>
    `<circle class="star-pulse" cx="${st.x.toFixed(1)}" cy="${st.y.toFixed(1)}" r="1.5" fill="var(--gold)" style="animation-delay:${i*0.18}s"/>`
  ).join('');
  const centerDot = `<circle cx="${cx}" cy="${cy}" r="1.2" fill="var(--teal)" opacity=".7"/>`;
  const orbitR = r*0.55;
  const orbitHTML = `<circle class="orbit-ring" cx="${(cx+orbitR).toFixed(1)}" cy="${cy}" r="1.5" fill="var(--teal)" opacity=".6"/>`;
  const label = small ? '' : `<span style="color:var(--text-dim);font-family:'JetBrains Mono',monospace;font-size:.65rem;letter-spacing:.2em;text-transform:uppercase">Loading…</span>`;
  return `<span class="const-loader"><svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">${linesHTML}${starsHTML}${centerDot}${orbitHTML}</svg>${label}</span>`;
}

// Patch loading-spinner spans — replace on DOM changes
function upgradeSpinners(root=document){
  root.querySelectorAll('.loading-spinner').forEach(el=>{
    if(!el.dataset.upgraded){
      el.dataset.upgraded='1';
      el.outerHTML = constellationLoader(true);
    }
  });
}
const _spinnerObserver = new MutationObserver(()=>upgradeSpinners());
_spinnerObserver.observe(document.body,{childList:true,subtree:true});


// ── JS RAINBOW CYCLER ────────────────────────────────────────────────────────
var rainbowTimer = null;
var rainbowColors = [
  ['#ff6b6b','#ff6b6b','#cc4444','#cc4444'],
  ['#ff9f43','#ff9f43','#cc7a28','#cc7a28'],
  ['#ffd32a','#ffd32a','#ccaa00','#ccaa00'],
  ['#0be881','#0be881','#09b864','#09b864'],
  ['#67e8f9','#67e8f9','#3abcd4','#3abcd4'],
  ['#a78bfa','#a78bfa','#7c5cd4','#7c5cd4'],
  ['#f472b6','#f472b6','#c44d90','#c44d90'],
  ['#fb923c','#fb923c','#c96a1a','#c96a1a'],
];
var rainbowOrig = ['#4EC9B0','#C8A45A','#2C7A6A','#8A6E37'];

function startRainbow(){
  clearInterval(rainbowTimer);
  console.log('startRainbow called, light-mode:', document.body.classList.contains('light-mode'));
  if(document.body.classList.contains('light-mode')){
    startLightGlow();
    return;
  }
  var idx=0, total=rainbowColors.length*4;
  var root=document.body;
  rainbowTimer=setInterval(()=>{
    if(document.body.classList.contains('light-mode')){clearInterval(rainbowTimer);root.style.removeProperty('--teal');root.style.removeProperty('--gold');root.style.removeProperty('--teal-dim');root.style.removeProperty('--gold-dim');startLightGlow();return;}
    var col=rainbowColors[idx % rainbowColors.length];
    root.style.setProperty('--teal',col[0]);
    root.style.setProperty('--gold',col[1]);
    root.style.setProperty('--teal-dim',col[2]);
    root.style.setProperty('--gold-dim',col[3]);
    idx++;
    if(idx>=total){
      clearInterval(rainbowTimer);
      // Remove inline styles so CSS vars take over naturally
      root.style.removeProperty('--teal');
      root.style.removeProperty('--gold');
      root.style.removeProperty('--teal-dim');
      root.style.removeProperty('--gold-dim');
    }
  }, 500);
}

// Light mode: warm sunset color sweep
function startLightGlow(){
  var root=document.body;
  var lightOrig=['#0A7A60','#9A5C0A','#0D9E7A','#C47820'];
  // warm ember sweep — pure warm tones, no blues or purples
  var sunsetColors=[
    ['#E8920A','#E8A020','#C47010','#C47010'],
    ['#E86A10','#E87010','#C04010','#B05010'],
    ['#D84020','#D85020','#B02010','#A03010'],
    ['#C82030','#C83020','#A01020','#901020'],
    ['#D43050','#C82030','#A82040','#901020'],
    ['#E06030','#D04020','#B04020','#902010'],
    ['#E88020','#E89010','#C06010','#B07010'],
    ['#C8A020','#C8A040','#9A7810','#9A6010'],
    lightOrig,
  ];
  var idx=0, total=(sunsetColors.length-1)*4;
  var glowTimer=setInterval(()=>{
    var col=sunsetColors[idx % (sunsetColors.length-1)];
    root.style.setProperty('--teal',col[0]);
    root.style.setProperty('--gold',col[1]);
    root.style.setProperty('--teal-dim',col[2]);
    root.style.setProperty('--gold-dim',col[3]);
    idx++;
    if(idx>=total){
      clearInterval(glowTimer);
      root.style.removeProperty('--teal');
      root.style.removeProperty('--gold');
      root.style.removeProperty('--teal-dim');
      root.style.removeProperty('--gold-dim');
    }
  }, 500);
}

// Load home data on start
loadHomeData();
