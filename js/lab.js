// ══ ORBIT · experiments in motion ══
// Read-only. Authoring lives in the Scriptorium (/compose).
// Grouped by origin: Built (interactive embeds) → Found (tests in the wild).
// Topics are free tags (Psychology, Game, …) and may overlap — a thing can be both.

let allLabEntries = [];
let expandedEntry = null;

// status → chip class + label
const ORBIT_STATUS = {
  active:   { cls:'st-active',   label:'Active' },
  brewing:  { cls:'st-brewing',  label:'Brewing' },
  archived: { cls:'st-archived', label:'Archived' },
};

// topic → accent colour (free tags allowed; unknown topics cycle a neutral palette)
const ORBIT_TOPIC_COLORS = {
  psychology: 'var(--gold)',
  game:       '#a78bfa',
  tool:       'var(--teal)',
  design:     '#60a5fa',
  ai:         '#34d399',
};
const ORBIT_FALLBACK_COLORS = ['var(--teal)', 'var(--gold)', '#a78bfa', '#60a5fa', '#34d399'];

function orbitTopicColor(topic){
  const key = String(topic||'').trim().toLowerCase();
  if(ORBIT_TOPIC_COLORS[key]) return ORBIT_TOPIC_COLORS[key];
  const s = key.split('').reduce((a,ch)=>a+ch.charCodeAt(0),0);
  return ORBIT_FALLBACK_COLORS[s % ORBIT_FALLBACK_COLORS.length];
}

const ORBIT_ROMAN = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'];
function orbitRoman(n){ return ORBIT_ROMAN[n] || String(n); }

// Built = something interactive lives here; Found = a curated external link only.
function orbitOrigin(e){ return (e.embed_html || e.embed_url) ? 'built' : 'find'; }

// Handle #launch/id hash — redirect to permanent embed page
function handleLabHash(){
  const hash = location.hash;
  if(!hash || !hash.startsWith('#launch/')) return;
  const id = hash.slice(8);
  if(!id) return;
  window.open(window.location.origin + '/lab-embed?id=' + id, '_blank');
  history.replaceState(null, '', '/lab');
}

// orbital glyph — concentric orbits + a moon, accent-tinted, spins on hover
function orbitGlyph(){
  return `<svg class="orb-glyph" viewBox="0 0 64 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse class="ring" cx="32" cy="25" rx="27" ry="10"/>
    <ellipse class="ring" cx="32" cy="25" rx="14" ry="22"/>
    <circle class="core" cx="32" cy="25" r="3.1"/>
    <g class="spin"><circle class="moon" cx="59" cy="25" r="2.3"/></g>
    <g class="spin" style="animation-duration:9s"><circle class="moon" cx="18" cy="3" r="1.7"/></g>
  </svg>`;
}

function orbitLinks(e){
  const origin = orbitOrigin(e);
  const hasEmbed = !!(e.embed_html || e.embed_url);
  let h = '';
  if(hasEmbed){
    h += `<button class="orb-link launch" onclick="event.stopPropagation();toggleEmbed('${e.id}')"><span id="launch-icon-${e.id}">▶</span> <span id="launch-label-${e.id}">Launch</span></button>`;
    h += `<button class="orb-link ghost" onclick="event.stopPropagation();copyLabLink('${e.id}')">↗ Share</button>`;
  }
  if(e.link){
    const label = origin === 'find' ? 'Visit' : 'Source';
    h += `<a class="orb-link ${origin === 'find' ? 'visit' : 'ghost'}" href="${e.link}" target="_blank" rel="noopener" onclick="event.stopPropagation()">↗ ${label}</a>`;
  }
  h += `<span class="admin-only"><button class="orb-link edit" onclick="event.stopPropagation();location.href='/compose'">✎ Edit in Scriptorium</button></span>`;
  return h;
}

function orbitTopics(tags){
  if(!tags.length) return '';
  return `<div class="orb-topics">${tags.map(t =>
    `<span class="orb-topic" style="--tc:${orbitTopicColor(t)}">${t}</span>`
  ).join('')}</div>`;
}

function orbitCard(e, idx){
  const origin = orbitOrigin(e);
  const status = ORBIT_STATUS[e.status] || ORBIT_STATUS.active;
  const tags = (e.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
  const accent = tags.length ? orbitTopicColor(tags[0]) : (origin === 'find' ? 'var(--gold)' : 'var(--teal)');
  const kind = origin === 'find' ? '↗ Found · in the wild' : '▶ Built · interactive';

  const card = document.createElement('article');
  card.className = 'orb reveal';
  card.id = 'tile-' + e.id;
  card.style.setProperty('--orb-accent', accent);
  card.innerHTML = `
    ${orbitGlyph()}
    <div class="orb-body">
      <div class="orb-top">
        <p class="orb-kind">${kind}</p>
        <span class="orb-chip ${status.cls}"><span class="orb-dot"></span>${status.label}</span>
      </div>
      <p class="orb-no">Orbit · ${orbitRoman(idx+1)}</p>
      <h3 class="orb-title">${e.title || 'Untitled'}</h3>
      ${e.description ? `<div class="orb-desc">${e.description}</div>` : ''}
      ${orbitTopics(tags)}
      <div class="orb-foot">${orbitLinks(e)}</div>
      <div class="orb-embed-panel" id="embed-${e.id}" style="display:none">
        <div class="orb-embed-inner" id="embed-inner-${e.id}"></div>
      </div>
    </div>`;
  refreshAdmin(card);
  return card;
}

function orbitSetCount(id, n){
  const el = document.getElementById(id);
  if(el) el.textContent = n;
}

function orbitEmpty(root){
  root.innerHTML = `<div class="orbit-group"><div class="empty-state">
    <span class="empty-icon">◉</span><h3>Nothing in orbit yet</h3>
    <p>Experiments, interactive toys, and tests worth charting will appear here.</p>
    <a class="btn-primary admin-only" style="margin-top:1rem" href="/compose">✦ Open the Scriptorium →</a>
  </div></div>`;
  refreshAdmin(root);
}

async function loadLab(){
  const root = document.getElementById('orbitRoot');
  if(!root) return;
  root.innerHTML = '<div style="padding:3rem 4rem">' + constellationLoader() + '</div>';

  const { data:entries, error } = await sb.from('lab_entries').select('*')
    .order('created_at', {ascending:false});

  if(error){ root.innerHTML=''; toast('Could not load Orbit','error'); return; }
  if(!entries || !entries.length){ orbitEmpty(root); return; }
  allLabEntries = entries;

  const built = entries.filter(e => orbitOrigin(e) === 'built');
  const finds = entries.filter(e => orbitOrigin(e) === 'find');
  orbitSetCount('orbCountBuilt', built.length);
  orbitSetCount('orbCountFinds', finds.length);

  root.innerHTML = '';

  const GROUPS = [
    { items: built, lead:'Built',  trail:'made here',     noun:'experiment' },
    { items: finds, lead:'Found',  trail:'tests in the wild', noun:'find' },
  ];

  GROUPS.forEach(g => {
    if(!g.items.length) return;
    const noun = g.items.length === 1 ? g.noun : g.noun + 's';
    const divider = document.createElement('div');
    divider.className = 'divider reveal';
    divider.innerHTML = `<span class="legend">${g.lead}</span><span class="ln"></span>
      <span class="star">✦</span><span class="count">${g.items.length} ${noun}</span><span class="ln"></span>
      <span class="legend">${g.trail}</span>`;
    root.appendChild(divider);

    const group = document.createElement('div');
    group.className = 'orbit-group';
    const grid = document.createElement('div');
    grid.className = 'orbit-grid';
    g.items.forEach((e,i)=> grid.appendChild(orbitCard(e, i)));
    group.appendChild(grid);
    root.appendChild(group);
  });

  refreshAdmin(root);
  if(typeof atlasObserveReveals === 'function'){ atlasObserveReveals(root); }
  else {
    root.querySelectorAll('.reveal:not(.visible)').forEach(el=>{
      if(typeof _revealObs !== 'undefined' && _revealObs) _revealObs.observe(el);
      else el.classList.add('visible');
    });
  }

  // Auto-open if arriving from a project link
  const autoOpen = sessionStorage.getItem('openLabEntry');
  if(autoOpen){
    sessionStorage.removeItem('openLabEntry');
    setTimeout(()=>{
      const tile = document.getElementById('tile-' + autoOpen);
      if(tile){
        tile.scrollIntoView({behavior:'smooth', block:'center'});
        setTimeout(()=>toggleEmbed(autoOpen), 400);
      }
    }, 300);
  }
}

function copyLabLink(id){
  const url = window.location.origin + '/lab-embed?id=' + id;
  navigator.clipboard.writeText(url).then(() => {
    toast('Link copied to clipboard', 'success');
  }).catch(() => {
    const el = document.createElement('textarea');
    el.value = url;
    el.style.position = 'fixed'; el.style.opacity = '0';
    document.body.appendChild(el); el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    toast('Link copied to clipboard', 'success');
  });
}

function toggleEmbed(id){
  const panel = document.getElementById('embed-' + id);
  const inner = document.getElementById('embed-inner-' + id);
  const icon = document.getElementById('launch-icon-' + id);
  const label = document.getElementById('launch-label-' + id);
  const tile = document.getElementById('tile-' + id);
  if(!panel) return;

  if(panel.style.display === 'none'){
    const entry = allLabEntries.find(e => e.id === id);
    if(!entry) return;

    if(entry.embed_url){
      inner.innerHTML = `<iframe src="${entry.embed_url}" frameborder="0" allowfullscreen></iframe>`;
    } else if(entry.embed_html){
      // Open in new tab so full features (file upload, scripts) work without sandbox restrictions
      const blob = new Blob([entry.embed_html], {type:'text/html'});
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(()=>URL.revokeObjectURL(url), 5000);
      return;
    }

    panel.style.display = 'block';
    if(icon) icon.textContent = '◼';
    if(label) label.textContent = 'Close';
    if(tile) tile.classList.add('orb-expanded');
    setTimeout(() => panel.scrollIntoView({behavior:'smooth', block:'nearest'}), 100);
    expandedEntry = id;
  } else {
    panel.style.display = 'none';
    inner.innerHTML = '';
    if(icon) icon.textContent = '▶';
    if(label) label.textContent = 'Launch';
    if(tile) tile.classList.remove('orb-expanded');
    expandedEntry = null;
  }
}
