// ══ ABOUT · closing epigraph ══
// Pull a real opening passage from the manuscript: the primary book's
// first published chapter (by position). Hides gracefully if nothing exists.
async function loadEpigraph(){
  const wrap = document.getElementById('epigraphText');
  const section = document.getElementById('epigraphSection');
  const cite = document.getElementById('epigraphCite');
  if(!wrap || !section) return;

  const hide = () => { section.style.display = 'none'; };
  try{
    const {data:books} = await sb.from('books').select('id,title').order('created_at',{ascending:true}).limit(1);
    if(!books || !books.length) return hide();
    const book = books[0];

    // Live = published OR scheduled publish_at in the past (degrade gracefully
    // if the publish_at column doesn't exist yet).
    const nowIso = new Date().toISOString();
    let chRes = await sb.from('chapters')
      .select('title,content,position,published,publish_at')
      .eq('book_id', book.id)
      .or(`published.eq.true,publish_at.lte.${nowIso}`)
      .order('position',{ascending:true}).limit(1);
    if(chRes.error && /publish_at/.test((chRes.error.message||'')+(chRes.error.details||''))){
      chRes = await sb.from('chapters')
        .select('title,content,position,published')
        .eq('book_id', book.id).eq('published', true)
        .order('position',{ascending:true}).limit(1);
    }
    const chs = chRes.data;
    if(!chs || !chs.length) return hide();
    const ch = chs[0];

    const text = (ch.content||'').replace(/<[^>]*>/g,' ').replace(/[#*_>`]/g,'').replace(/\s+/g,' ').trim();
    if(!text) return hide();

    // first ~2 sentences, capped near 260 chars
    let excerpt = text.slice(0, 260);
    const stop = Math.max(excerpt.lastIndexOf('. '), excerpt.lastIndexOf('? '), excerpt.lastIndexOf('! '));
    if(stop > 120) excerpt = excerpt.slice(0, stop + 1);
    else if(text.length > excerpt.length) excerpt = excerpt.trim() + '…';

    wrap.textContent = '“' + excerpt + '”';
    if(cite) cite.textContent = '— ' + book.title + (ch.title ? ', ' + ch.title : '') + ' →';
    section.style.display = 'block';
  }catch(e){ hide(); }
}

// ══ ABOUT · constellation star-chart ══
// A charted asterism in the left margin: one star per section, set at varied
// coordinates and joined by thin lines. A bright "thread" ignites along those
// lines as you scroll; the section in view glows teal; passed stars fill gold.
// Clicking a star smooth-scrolls to its section.
function initStarChart(){
  const chart = document.getElementById('starChart');
  if(!chart) return;
  const base = chart.querySelector('#scBase');
  const prog = chart.querySelector('#scProg');

  const stars = Array.from(chart.querySelectorAll('.sc-star'));
  // Resolve each star to a live section; drop any with no target.
  const items = stars.map(btn => {
    const id = btn.dataset.target;
    let sec = document.getElementById(id);
    if(!sec) sec = document.querySelector('[data-sec="'+id+'"]');
    return sec ? { btn, sec } : null;
  }).filter(Boolean);
  if(!items.length) return;

  // Charted star positions within the 90×560 viewBox — a zig-zag asterism.
  const PTS = [
    {x:20, y:22},  {x:62, y:104}, {x:30, y:188}, {x:72, y:270},
    {x:24, y:356}, {x:64, y:440}, {x:38, y:540}
  ];
  // Place a star button (centered) and return its point, falling back along
  // the rail if there are more sections than charted points.
  items.forEach(({btn}, i) => {
    const p = PTS[i] || {x: (i%2 ? 64 : 26), y: 22 + (518/Math.max(1,items.length-1))*i};
    btn._pt = p;
    btn.style.left = (p.x / 90 * 100) + '%';
    btn.style.top  = (p.y / 560 * 100) + '%';
  });
  const ptsStr = items.map(({btn}) => btn._pt.x + ',' + btn._pt.y).join(' ');
  if(base) base.setAttribute('points', ptsStr);
  if(prog) prog.setAttribute('points', ptsStr);

  // Cumulative geometric length fraction at each star, so the drawn thread can
  // land exactly on a vertex the moment that section becomes active.
  const cum = [0];
  for(let i=1;i<items.length;i++){
    const a = items[i-1].btn._pt, b = items[i].btn._pt;
    cum[i] = cum[i-1] + Math.hypot(b.x - a.x, b.y - a.y);
  }
  const totalLen = cum[items.length-1] || 1;
  for(let i=0;i<cum.length;i++) cum[i] /= totalLen;

  const NAV = 76; // sticky-nav offset
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // click → scroll to section
  items.forEach(({btn, sec}) => {
    btn.addEventListener('click', () => {
      const y = sec.getBoundingClientRect().top + window.pageYOffset - NAV;
      window.scrollTo({ top: Math.max(0, y), behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  let ticking = false;
  function update(){
    ticking = false;
    const viewMid = window.pageYOffset + window.innerHeight * 0.42;

    // section-top anchors (account for the sticky nav)
    const anchors = items.map(({sec}) =>
      sec.getBoundingClientRect().top + window.pageYOffset - NAV);

    // active = last section whose anchor is above the viewing line
    let activeIdx = 0;
    anchors.forEach((a, i) => { if(a - 8 <= viewMid) activeIdx = i; });

    items.forEach(({btn}, i) => {
      btn.classList.toggle('passed', i < activeIdx);
      btn.classList.toggle('active', i === activeIdx);
    });

    // Thread reaches a star exactly as its section becomes active: interpolate
    // along cumulative vertex fractions using how far we are into the segment.
    if(prog && items.length > 1){
      let geom;
      if(activeIdx >= items.length - 1){
        geom = 1;
      }else{
        const segPx = Math.max(1, anchors[activeIdx+1] - anchors[activeIdx]);
        const intra = Math.max(0, Math.min(1, (viewMid - anchors[activeIdx]) / segPx));
        geom = cum[activeIdx] + intra * (cum[activeIdx+1] - cum[activeIdx]);
      }
      prog.style.strokeDashoffset = (1 - geom).toString();
    }
  }
  function onScroll(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll, { passive:true });
  update();
}
