// ══ ATLAS · public projects, charted ══
// Read-only. All authoring now lives in the Scriptorium (/compose).
// Projects are grouped by where each one stands today: In progress → Shipped → Archived.

const ATLAS_STATUS = {
  in_progress: { label:'In Progress', cls:'st-prog' },
  shipped:     { label:'Shipped',     cls:'st-ship' },
  archived:    { label:'Archived',    cls:'st-arch' },
};
const ATLAS_ORDER = ['in_progress','shipped','archived'];
const ATLAS_GROUP_LEGEND = {
  in_progress: ['Underway',  'currently charting'],
  shipped:     ['Shipped',   'charted & live'],
  archived:    ['The Archive','past expeditions'],
};

// ── small charted asterism for text-led plates (no banner) ──
// Plain <line>/<circle> — colour comes from CSS so it can be status-tinted.
function atlasGlyph(seed){
  const s = (String(seed)||'x').split('').reduce((a,ch)=>a+ch.charCodeAt(0),0);
  const r = seedRand(s);
  const w = 58, h = 46, n = 5, nodes = [];
  for(let i=0;i<n;i++) nodes.push([6 + r()*(w-12), 6 + r()*(h-12)]);
  let svg = `<svg class="apl-glyph" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
  for(let i=0;i<n-1;i++) svg += `<line x1="${nodes[i][0].toFixed(1)}" y1="${nodes[i][1].toFixed(1)}" x2="${nodes[i+1][0].toFixed(1)}" y2="${nodes[i+1][1].toFixed(1)}"/>`;
  nodes.forEach(([x,y],i)=> svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.3+r()*1.4).toFixed(1)}"/>`);
  svg += `</svg>`;
  return svg;
}

function atlasLinks(p){
  let h = '';
  if(p.link_github)    h += `<a class="apl-link github" href="${p.link_github}" target="_blank" rel="noopener" onclick="event.stopPropagation()">⌥ GitHub</a>`;
  if(p.link_demo)      h += `<a class="apl-link demo" href="${p.link_demo}" target="_blank" rel="noopener" onclick="event.stopPropagation()">↗ Live</a>`;
  if(p.link_other_url) h += `<a class="apl-link other" href="${p.link_other_url}" target="_blank" rel="noopener" onclick="event.stopPropagation()">◈ ${p.link_other_label || 'Link'}</a>`;
  return h;
}

function atlasStats(p){
  const hs = [
    p.highlight1_label && { l:p.highlight1_label, v:p.highlight1_value || '—' },
    p.highlight2_label && { l:p.highlight2_label, v:p.highlight2_value || '—' },
    p.highlight3_label && { l:p.highlight3_label, v:p.highlight3_value || '—' },
  ].filter(Boolean);
  if(!hs.length) return '';
  return `<div class="apl-stats">${hs.map(h=>
    `<div class="apl-stat"><span class="v">${String(h.v).replace(/(\d+)/g,'<em>$1</em>')}</span><span class="l">${h.l}</span></div>`
  ).join('')}</div>`;
}

const ATLAS_ROMAN = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'];
function atlasRoman(n){ return ATLAS_ROMAN[n] || String(n); }

function atlasAdmin(p){
  return `<span class="apl-admin admin-only"><a class="apl-link edit" href="/compose" onclick="event.stopPropagation()">✎ Edit in Scriptorium</a></span>`;
}

// overlaid status pill (banner cards)
function atlasPill(s){
  return `<span class="apl-status ${s.cls}"><span class="apl-dot"></span>${s.label}</span>`;
}
// inline status chip (text-led plates)
function atlasChip(s){
  return `<span class="apl-chip ${s.cls}"><span class="apl-dot"></span>${s.label}</span>`;
}

// banner figure — only when a real image was uploaded
function atlasFig(p, s){
  return `<div class="apl-fig">
      <img src="${p.banner_image}" alt="" loading="lazy"/>
      ${atlasPill(s)}
      <span class="ph-corner tl"></span><span class="ph-corner tr"></span><span class="ph-corner bl"></span><span class="ph-corner br"></span>
    </div>`;
}

function atlasCard(p, status, idx){
  const s = ATLAS_STATUS[status] || ATLAS_STATUS.shipped;
  const tags = (p.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
  const hasBanner = !!p.banner_image;
  const links = atlasLinks(p);
  return `<article class="apl reveal ${s.cls} ${hasBanner ? 'has-banner' : 'no-banner'}" data-proj="${p.id}">
    ${hasBanner ? atlasFig(p, s) : atlasGlyph(p.id)}
    <div class="apl-body">
      ${hasBanner ? '' : atlasChip(s)}
      <p class="apl-no">Forge · ${atlasRoman(idx+1)}</p>
      ${p.category ? `<p class="apl-greek">${p.category}</p>` : ''}
      <h3 class="apl-title">${p.title || 'Untitled'}</h3>
      ${p.subtitle ? `<p class="apl-sub">${p.subtitle}</p>` : ''}
      <div class="apl-desc">${p.description || '<em style="opacity:.4">No description yet.</em>'}</div>
      ${atlasStats(p)}
      ${tags.length ? `<div class="apl-tags">${tags.map(t=>`<span class="ptag">${t}</span>`).join('')}</div>` : ''}
      <div class="apl-foot">${links}${atlasAdmin(p)}</div>
    </div>
  </article>`;
}

function atlasFeatured(p){
  const status = p.status || 'shipped';
  const s = ATLAS_STATUS[status] || ATLAS_STATUS.shipped;
  const tags = (p.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
  const hasBanner = !!p.banner_image;
  const links = atlasLinks(p);
  return `<article class="apl feat reveal ${s.cls} ${hasBanner ? 'has-banner' : 'no-banner'}" data-proj="${p.id}">
    ${hasBanner ? atlasFig(p, s) : atlasGlyph(p.id)}
    <div class="apl-body">
      ${hasBanner ? '' : atlasChip(s)}
      <p class="apl-no feat-no">✦ Featured · the flagship</p>
      ${p.category ? `<p class="apl-greek">${p.category}</p>` : ''}
      <h3 class="apl-title">${p.title || 'Untitled'}</h3>
      ${p.subtitle ? `<p class="apl-sub">${p.subtitle}</p>` : ''}
      <div class="apl-desc apl-desc--full">${p.description || ''}</div>
      ${atlasStats(p)}
      ${tags.length ? `<div class="apl-tags">${tags.map(t=>`<span class="ptag">${t}</span>`).join('')}</div>` : ''}
      <div class="apl-foot">${links}${atlasAdmin(p)}</div>
    </div>
  </article>`;
}

function atlasEmpty(root){
  root.innerHTML = `<div class="atlas-group"><div class="empty-state">
    <span class="empty-icon">◈</span><h3>No projects charted yet</h3>
    <p>Add your first entry in the Scriptorium.</p>
    <a class="btn-primary admin-only" style="margin-top:1rem" href="/compose">✦ Open the Scriptorium →</a>
  </div></div>`;
  refreshAdmin(root);
}

function atlasObserveReveals(root){
  root.querySelectorAll('.reveal:not(.visible)').forEach(el=>{
    if(typeof _revealObs !== 'undefined' && _revealObs) _revealObs.observe(el);
    else el.classList.add('visible');
  });
}

function atlasSetCount(id, n){
  const el = document.getElementById(id);
  if(el) el.textContent = n;
}

async function loadProjects(){
  const root = document.getElementById('atlasRoot');
  if(!root) return;
  root.innerHTML = '<div style="padding:3rem 4rem">' + constellationLoader() + '</div>';

  const { data:projects, error } = await sb.from('projects').select('*')
    .order('sort_order',{ascending:true}).order('created_at',{ascending:false});

  if(error){ root.innerHTML=''; toast('Could not load projects','error'); return; }
  if(!projects || !projects.length){ atlasEmpty(root); return; }

  // live tally for the legend card (counts every project, featured included)
  atlasSetCount('atlasCountProg', projects.filter(p=>(p.status||'shipped')==='in_progress').length);
  atlasSetCount('atlasCountShip', projects.filter(p=>(p.status||'shipped')==='shipped').length);
  atlasSetCount('atlasCountArch', projects.filter(p=>(p.status||'shipped')==='archived').length);

  // Featured = first project flagged highlight (its own plate at the top).
  const featured = projects.find(p=>p.highlight) || null;

  let html = '';
  if(featured) html += `<div class="atlas-featured">${atlasFeatured(featured)}</div>`;

  ATLAS_ORDER.forEach(status=>{
    const items = projects.filter(p => (p.status||'shipped') === status && p !== featured);
    if(!items.length) return;
    const [lead, trail] = ATLAS_GROUP_LEGEND[status];
    const noun = items.length === 1 ? 'entry' : 'entries';
    html += `<div class="divider reveal">
      <span class="legend">${lead}</span><span class="ln"></span>
      <span class="star">✦</span><span class="count">${items.length} ${noun}</span><span class="ln"></span>
      <span class="legend">${trail}</span>
    </div>`;
    html += `<div class="atlas-group"><div class="atlas-grid">`;
    items.forEach((p,i)=> html += atlasCard(p, status, i));
    html += `</div></div>`;
  });

  root.innerHTML = html;
  refreshAdmin(root);
  atlasObserveReveals(root);
}
