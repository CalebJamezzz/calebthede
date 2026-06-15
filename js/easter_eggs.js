// ══ UI UTILITIES ══
// (The hidden easter eggs, blue-flame cursor, Konami overlay, random
//  shooting-star bursts and rainbow color-cycler were removed. What
//  remains is the constellation loading spinner used across the site.)

// Constellation loader — replaces .loading-spinner placeholders site-wide.
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
