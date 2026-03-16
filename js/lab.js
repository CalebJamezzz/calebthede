// ── LAB ──────────────────────────────────────────────────
let labFilter = 'all';
let allLabEntries = [];
let expandedEntry = null;

const CATEGORY_LABELS = {
  psychology: 'Psychology',
  experiment: 'Experiment',
  tool: 'Tool',
  demo: 'Demo'
};

const CATEGORY_COLORS = {
  psychology: 'var(--teal)',
  experiment: 'var(--gold)',
  tool: '#a78bfa',
  demo: '#60a5fa'
};

const STATUS_LABELS = {
  active: 'Active',
  brewing: 'Brewing',
  archived: 'Archived'
};

// Handle #launch/id hash — redirect to permanent embed page
function handleLabHash(){
  const hash = location.hash;
  if(!hash || !hash.startsWith('#launch/')) return;
  const id = hash.slice(8);
  if(!id) return;
  window.open(window.location.origin + '/lab/embed?id=' + id, '_blank');
  history.replaceState(null, '', '/lab');
}

async function loadLab(){
  const grid = document.getElementById('labGrid');
  const empty = document.getElementById('labEmpty');
  grid.innerHTML = '<div style="padding:3rem 0">' + constellationLoader() + '</div>';
  
  let query = sb.from('lab_entries').select('*').order('created_at', {ascending:false});
  if(labFilter !== 'all') query = query.eq('category', labFilter);
  const {data:entries} = await query;
  
  grid.innerHTML = '';
  if(!entries || !entries.length){ empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  allLabEntries = entries;
  renderLabCards(entries);

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

function renderLabCards(entries){
  const grid = document.getElementById('labGrid');
  const empty = document.getElementById('labEmpty');
  grid.innerHTML = '';
  if(!entries || !entries.length){ empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  entries.forEach(e => {
    const cat = e.category || e.type || 'experiment';
    const catLabel = CATEGORY_LABELS[cat] || cat;
    const catColor = CATEGORY_COLORS[cat] || 'var(--gold)';
    const status = e.status || 'active';
    const statusLabel = STATUS_LABELS[status] || status;
    const hasEmbed = e.embed_html || e.embed_url;
    const tags = (e.tags||'').split(',').map(t=>t.trim()).filter(Boolean);

    const tile = document.createElement('div');
    tile.className = 'lab-tile';
    tile.id = 'tile-' + e.id;
    tile.innerHTML = `
      <div class="lab-tile-header">
        <div class="lab-tile-meta">
          <span class="lab-cat-badge" style="color:${catColor};border-color:${catColor}33;background:${catColor}11">${catLabel}</span>
          <span class="lab-status-badge lab-status-${status}">${statusLabel}</span>
        </div>
        <div class="lab-tile-actions">
          ${hasEmbed ? `<button class="lab-launch-btn" onclick="toggleEmbed('${e.id}')"><span id="launch-icon-${e.id}">▶</span> <span id="launch-label-${e.id}">Launch</span></button>` : ''}
          ${hasEmbed ? `<button class="lab-share-btn" onclick="event.stopPropagation();copyLabLink('${e.id}')">↗ Share</button>` : ''}
          ${e.link ? `<a class="lab-ext-link" href="${e.link}" target="_blank">↗</a>` : ''}
          <button class="lab-edit-btn admin-only" onclick="event.stopPropagation();openLabModal('${e.id}')">Edit</button>
          <button class="lab-del-btn admin-only danger" onclick="event.stopPropagation();deleteLabEntry('${e.id}')">Delete</button>
        </div>
      </div>
      <h3 class="lab-tile-title">${e.title}</h3>
      ${e.description ? `<p class="lab-tile-desc">${e.description}</p>` : ''}
      ${tags.length ? `<div class="lab-tags">${tags.map(t=>`<span class="lab-tag">${t}</span>`).join('')}</div>` : ''}
      <div class="lab-embed-panel" id="embed-${e.id}" style="display:none">
        <div class="lab-embed-inner" id="embed-inner-${e.id}"></div>
      </div>
    `;
    
    grid.appendChild(tile);
    refreshAdmin(tile);
  });
}

function copyLabLink(id){
  const url = window.location.origin + '/lab/embed?id=' + id;
  navigator.clipboard.writeText(url).then(() => {
    toast('Link copied to clipboard', 'success');
  }).catch(() => {
    // Fallback
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

  if(panel.style.display === 'none'){
    // Open
    const entry = allLabEntries.find(e => e.id === id);
    if(!entry) return;
    
    if(entry.embed_url){
      inner.innerHTML = `<iframe src="${entry.embed_url}" frameborder="0" allowfullscreen style="width:100%;height:500px;border-radius:6px;background:#0D0F14"></iframe>`;
    } else if(entry.embed_html){
      // Open in new tab so full features (file upload, scripts) work without sandbox restrictions
      const blob = new Blob([entry.embed_html], {type:'text/html'});
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Revoke after short delay
      setTimeout(()=>URL.revokeObjectURL(url), 5000);
      // Don't expand the panel — close immediately
      return;
    }
    
    panel.style.display = 'block';
    icon.textContent = '◼';
    label.textContent = 'Close';
    tile.classList.add('lab-tile-expanded');
    setTimeout(() => panel.scrollIntoView({behavior:'smooth', block:'nearest'}), 100);
    expandedEntry = id;
  } else {
    // Close
    panel.style.display = 'none';
    inner.innerHTML = '';
    icon.textContent = '▶';
    label.textContent = 'Launch';
    tile.classList.remove('lab-tile-expanded');
    expandedEntry = null;
  }
}

function filterLab(type, btn){
  document.querySelectorAll('.lab-fb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  labFilter = type;
  loadLab();
}

// ── ADMIN ────────────────────────────────────────────────

function openLabModal(id=null){
  document.getElementById('labModalTitle').textContent = id ? 'Edit Entry' : 'New Lab Entry';
  document.getElementById('editLabId').value = id||'';
  if(id){
    sb.from('lab_entries').select('*').eq('id',id).single().then(({data:e})=>{
      document.getElementById('labType').value = e?.category||e?.type||'experiment';
      document.getElementById('labStatus').value = e?.status||'active';
      document.getElementById('labTitle').value = e?.title||'';
      quillSet('labDescEditor', e?.description||'');
      document.getElementById('labEmbedHtml').value = e?.embed_html||'';
      document.getElementById('labEmbedUrl').value = e?.embed_url||'';
      document.getElementById('labLink').value = e?.link||'';
      document.getElementById('labTags').value = e?.tags||'';
    });
  } else {
    document.getElementById('labType').value = 'psychology';
    document.getElementById('labStatus').value = 'active';
    document.getElementById('labTitle').value = '';
    quillSet('labDescEditor', '');
    document.getElementById('labEmbedHtml').value = '';
    document.getElementById('labEmbedUrl').value = '';
    document.getElementById('labLink').value = '';
    document.getElementById('labTags').value = '';
  }
  openModal('labModal');
}

async function saveLabEntry(){
  const title = document.getElementById('labTitle').value.trim();
  if(!title){ alert('Please add a title.'); return; }
  const editId = document.getElementById('editLabId').value;
  const payload = {
    category: document.getElementById('labType').value,
    type: document.getElementById('labType').value, // keep for backward compat
    status: document.getElementById('labStatus').value,
    title,
    description: quillGet('labDescEditor'),
    embed_html: document.getElementById('labEmbedHtml').value.trim() || null,
    embed_url: document.getElementById('labEmbedUrl').value.trim() || null,
    link: document.getElementById('labLink').value.trim() || null,
    tags: document.getElementById('labTags').value.trim() || null,
  };
  setLoading('labSaveBtn', true);
  const {error} = editId
    ? await sb.from('lab_entries').update(payload).eq('id', editId)
    : await sb.from('lab_entries').insert(payload);
  setLoading('labSaveBtn', false, 'Save');
  if(error){ toast('Error saving entry', 'error'); return; }
  toast(editId ? 'Entry updated' : 'Entry added');
  closeModal('labModal');
  loadLab();
}

async function deleteLabEntry(id){
  if(!confirm('Delete this entry?')) return;
  await sb.from('lab_entries').delete().eq('id', id);
  toast('Entry deleted');
  loadLab();
}

// ── ARTICLE READER (shared with library) ─────────────────

function openArticle(a, skipHistory){
  currentArticleId = a.id;
  const artWords = (a.content||'').split(/\s+/).filter(Boolean).length;
  const artMins = Math.max(1, Math.ceil(artWords/200));
  const bannerEl = document.getElementById('readerBanner');
  if(a.banner_image){ bannerEl.style.backgroundImage=`url(${a.banner_image})`;bannerEl.style.display='block'; }
  else{ bannerEl.style.display='none'; }
  document.getElementById('readerTag').textContent = a.tag||'Article';
  document.getElementById('readerTitle').textContent = a.title;
  document.getElementById('readerMeta').textContent = fmtDate(a.created_at);
  document.getElementById('readerReadTime').textContent = artWords.toLocaleString()+' words · '+artMins+' min read';
  document.getElementById('readerBody').innerHTML = renderBody(a.content);
  document.getElementById('readerEditBtn').onclick = ()=>openArticleModal(a.id);
  document.getElementById('readerDeleteBtn').onclick = ()=>deleteArticle(a.id,true);
  showLibArticleReader();
  if(!skipHistory) safePush({sub:'article',id:a.id,title:a.title},'','#article/'+a.id);
}

function closeArticleReader(){
  showLibBrowse();
  loadArticles();
  switchLibTab('Articles', document.querySelectorAll('.lib-tab')[1]);
  safePush({sub:'articles'},'','#articles');
}

