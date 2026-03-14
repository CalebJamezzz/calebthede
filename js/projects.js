// ══ PROJECT SVG ══
function makeProjSVG(projId, category){
  const seed = (projId||'x').split('').reduce((a,ch)=>a+ch.charCodeAt(0),0);
  const r = seedRand(seed);
  const w=600, h=160;
  const palettes = {
    'Development': {bg:'#0A1520', accent:'#4EC9B0', accent2:'#2A7A68'},
    'Design':      {bg:'#150A20', accent:'#A78BFA', accent2:'#6D4AC8'},
    'QA / Tools':  {bg:'#1A1205', accent:'var(--gold)', accent2:'#8A6820'},
  };
  const p = palettes[category] || palettes['Development'];
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">`;
  svg += `<defs>
    <linearGradient id="pbg${seed}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${p.bg}"/>
      <stop offset="100%" stop-color="#0D0F14"/>
    </linearGradient>
    <linearGradient id="pfade${seed}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="40%" stop-color="transparent"/>
      <stop offset="100%" stop-color="#0D0F14"/>
    </linearGradient>
  </defs>`;
  svg += `<rect width="${w}" height="${h}" fill="url(#pbg${seed})"/>`;

  if(category === 'Design'){
    // Flowing bezier curves
    for(let i=0;i<5;i++){
      const y1=r()*h, y2=r()*h, y3=r()*h;
      const op = 0.08 + r()*0.12;
      svg += `<path d="M0,${y1} C${w*.3},${y2} ${w*.6},${y3} ${w},${r()*h}" fill="none" stroke="${p.accent}" stroke-width="${1+r()*1.5}" opacity="${op}"/>`;
    }
    // Scattered dots
    for(let i=0;i<20;i++){
      svg += `<circle cx="${r()*w}" cy="${r()*h}" r="${.8+r()*2}" fill="${p.accent}" opacity="${.15+r()*.25}"/>`;
    }
  } else if(category === 'QA / Tools'){
    // Grid + data lines
    for(let x=0;x<w;x+=40) svg += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${p.accent}" stroke-width=".3" opacity=".07"/>`;
    for(let y=0;y<h;y+=30) svg += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${p.accent}" stroke-width=".3" opacity=".07"/>`;
    // Highlight bars (like data rows)
    for(let i=0;i<4;i++){
      const bx=r()*(w*.6), by=r()*h*.8, bw=80+r()*120;
      svg += `<rect x="${bx}" y="${by}" width="${bw}" height="${8+r()*6}" rx="2" fill="${p.accent}" opacity="${.06+r()*.08}"/>`;
    }
    // Accent line
    svg += `<line x1="0" y1="${h*.5+r()*20}" x2="${w}" y2="${h*.5+r()*20}" stroke="${p.accent}" stroke-width="1" opacity=".15"/>`;
  } else {
    // Development: circuit nodes + connections
    const nodes=[];
    for(let i=0;i<10;i++) nodes.push([r()*w, r()*h]);
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const d=Math.hypot(nodes[j][0]-nodes[i][0],nodes[j][1]-nodes[i][1]);
        if(d<120){
          svg+=`<line x1="${nodes[i][0]}" y1="${nodes[i][1]}" x2="${nodes[j][0]}" y2="${nodes[j][1]}" stroke="${p.accent}" stroke-width="${.3+r()*.5}" opacity="${.08+r()*.1}"/>`;
        }
      }
    }
    nodes.forEach(([nx,ny])=>{
      svg+=`<circle cx="${nx}" cy="${ny}" r="${1.5+r()*3}" fill="${p.accent}" opacity="${.2+r()*.3}"/>`;
    });
  }

  // Right fade + bottom fade
  svg += `<rect width="${w}" height="${h}" fill="url(#pfade${seed})"/>`;
  svg += `<rect x="${w*.5}" width="${w*.5}" height="${h}" fill="url(#pbg${seed})" opacity=".5"/>`;
  svg += `</svg>`;
  return {svg, accent: p.accent};
}

// ══ PROJECTS CRUD ══




function renderZiggisRow(grid){
  const SEED = 'ziggis-capstone';
  const zRowSvg = makeProjSVG(SEED, 'Development').svg;
  const catColor = 'rgba(78,201,176,.8)', catBorder = 'rgba(78,201,176,.3)';
  const card = document.createElement('div');
  card.className = 'pcard';
  card.innerHTML = `
    <div class="pcard-banner">
      ${zRowSvg}
      <span class="pcard-cat" style="color:${catColor};border-color:${catBorder};background:rgba(13,15,20,.8)">Development</span>
    </div>
    <div class="pcard-body">
      <h3 class="pcard-title">Ziggi's Coffee Manager App</h3>
      <p class="pcard-subtitle">Full-Stack · Capstone · Figma Design</p>
      <p class="pcard-desc">A full-stack management app built from real pain points as a Ziggi's Coffee manager — team messaging, shift scheduling, and smart inventory ordering.</p>
    </div>
    <div class="pcard-side">
      <div class="pcard-tags">
        <span class="ptag">Python</span>
        <span class="ptag">Full-Stack</span>
        <span class="ptag">Figma</span>
        <span class="ptag">Capstone</span>
      </div>
      <div class="pcard-links">
        <a class="proj-link-btn github" href="https://github.com/CalebJamezzz" target="_blank" onclick="event.stopPropagation()">⌥ GitHub</a>
      </div>
    </div>`;
  grid.appendChild(card);
}
function renderZiggisFallback(featWrap){
  const SEED = 'ziggis-capstone';
  const zSvg = makeProjSVG(SEED, 'Development').svg;
  featWrap.innerHTML = `
    <div class="proj-featured">
      <div class="proj-featured-banner">${zSvg}
        <span class="proj-featured-badge">★ Featured · Capstone Project</span>
      </div>
      <div class="proj-featured-body">
        <div>
          <h2 class="proj-featured-title">Ziggi's Coffee<br><em>Manager App</em></h2>
          <p style="font-family:'JetBrains Mono',monospace;font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:var(--text-dim);margin-bottom:1.2rem">Full-Stack · Capstone · Figma Design</p>
          <p class="proj-featured-desc">My college capstone — a full-stack management app built from real pain points I experienced as a manager at Ziggi's Coffee. A unified platform for team messaging, shift scheduling, and smart inventory ordering — designed in Figma, built from scratch.</p>
          <div class="proj-links">
            <a class="proj-link-btn github" href="https://github.com/CalebJamezzz" target="_blank">⌥ GitHub</a>
          </div>
          <div class="proj-tags">
            <span class="ptag">Python</span>
            <span class="ptag">Full-Stack</span>
            <span class="ptag">Scheduling</span>
            <span class="ptag">Messaging</span>
            <span class="ptag">Figma Design</span>
            <span class="ptag">Capstone</span>
          </div>
        </div>
        <ul class="feat-list">
          <li class="feat-item"><span class="fi">💬</span><div><p class="fi-lbl">Team Messaging</p><p class="fi-desc">Internal messaging for staff and manager communication.</p></div></li>
          <li class="feat-item"><span class="fi">📅</span><div><p class="fi-lbl">Shift Scheduler</p><p class="fi-desc">Build and publish schedules with full team visibility.</p></div></li>
          <li class="feat-item"><span class="fi">📋</span><div><p class="fi-lbl">Smart Order Lists</p><p class="fi-desc">Enter current stock — app calculates exactly what to order.</p></div></li>
          <li class="feat-item"><span class="fi">🔐</span><div><p class="fi-lbl">Manager Actions</p><p class="fi-desc">Role-based access separating manager tools from staff views.</p></div></li>
        </ul>
      </div>
    </div>`;
}
async function loadProjects(){
  const grid = document.getElementById('projGrid');
  const featWrap = document.getElementById('projFeaturedWrap');
  const empty = document.getElementById('projEmpty');
  projFilter = 'all';
  document.querySelectorAll('#projFilterBar .fb').forEach(b=>b.classList.remove('active'));
  const firstFb = document.querySelector('#projFilterBar .fb');
  if(firstFb) firstFb.classList.add('active');
  grid.innerHTML = '<div style="padding:2rem 0">'+constellationLoader()+'</div>';
  featWrap.innerHTML = '';

  const {data:projects} = await sb.from('projects').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});
  grid.innerHTML = '';

  if(!projects||!projects.length){renderZiggisFallback(featWrap);empty.style.display='none';return}
  empty.style.display = 'none';

  // Newest project auto-features at top, rest go to grid
  const newest = projects[0];
  const rest = projects.slice(1);

  // Render newest as featured banner
  const fBanner = projBanner(newest);
  const fTags = (newest.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
  const fLinks = buildProjLinks(newest);
  featWrap.innerHTML = `
    <div class="proj-featured" data-proj="${newest.id}">
      <div class="proj-featured-banner">${fBanner}
        <span class="proj-featured-badge">✦ Newest · ${newest.category}</span>
      </div>
      <div class="proj-featured-body">
        <div>
          <h2 class="proj-featured-title">${formatProjTitle(newest.title)}</h2>
          ${newest.subtitle?`<p style="font-family:'JetBrains Mono',monospace;font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:var(--text-dim);margin-bottom:1rem">${newest.subtitle}</p>`:''}
          <p class="proj-featured-desc">${newest.description||''}</p>
          <div class="proj-links">${fLinks}</div>
          <div class="proj-tags">${fTags.map(t=>`<span class="ptag">${t}</span>`).join('')}</div>
          <div style="display:flex;gap:.6rem;margin-top:1.5rem" class="admin-only">
            <button class="btn-sm" onclick="openProjectModal('${newest.id}')">Edit</button>
            <button class="btn-sm danger" onclick="deleteProject('${newest.id}')">Delete</button>
          </div>
        </div>
        <div></div>
      </div>
    </div>`;
  refreshAdmin(featWrap);
  // Observe any newly injected reveal elements
  featWrap.querySelectorAll('.reveal:not(.visible)').forEach(el=>{
    if(_revealObs) _revealObs.observe(el); else el.classList.add('visible');
  });

  // Rest go to grid — Ziggi's appended as last row
  renderProjGrid(rest, true);
}

function renderProjGrid(projects, appendZiggis=false){
  const grid = document.getElementById('projGrid');
  grid.innerHTML = '';
  const filtered = projFilter==='all' ? projects : projects.filter(p=>p.category===projFilter);
  if(!filtered.length && !appendZiggis){
    return;
  }
  filtered.forEach(p=>{
    const pBanner = projBanner(p);
    const tags = (p.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
    const links = buildProjLinks(p);
    const catColor = {Development:'rgba(78,201,176,.8)', Design:'rgba(167,139,250,.8)', 'QA / Tools':'rgba(200,164,90,.8)'}[p.category]||'rgba(255,255,255,.5)';
    const catBorder = {Development:'rgba(78,201,176,.3)', Design:'rgba(167,139,250,.3)', 'QA / Tools':'rgba(200,164,90,.3)'}[p.category]||'rgba(255,255,255,.15)';
    const card = document.createElement('div');
    card.className = 'pcard';
    card.dataset.cat = p.category;
    card.innerHTML = `
      <div class="pcard-banner">
        ${pBanner}
        <span class="pcard-cat" style="color:${catColor};border-color:${catBorder};background:rgba(13,15,20,.8)">${p.category}</span>
      </div>
      <div class="pcard-body">
        <h3 class="pcard-title">${p.title}</h3>
        ${p.subtitle?`<p class="pcard-subtitle">${p.subtitle}</p>`:''}
        <p class="pcard-desc">${p.description||'<em style="opacity:.4">No description yet.</em>'}</p>
      </div>
      <div class="pcard-side">
        <div class="pcard-tags">${tags.map(t=>`<span class="ptag">${t}</span>`).join('')}</div>
        ${links?`<div class="pcard-links">${links}</div>`:''}
        <div class="pcard-admin admin-only">
          <button class="btn-sm" onclick="event.stopPropagation();openProjectModal('${p.id}')">Edit</button>
          <button class="btn-sm danger" onclick="event.stopPropagation();deleteProject('${p.id}')">Delete</button>
        </div>
      </div>`;
    grid.appendChild(card);
    refreshAdmin(card);
  });
  if(appendZiggis) renderZiggisRow(grid);
}


function projBanner(p){
  if(p.banner_image){
    return `<img src="${p.banner_image}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"/>`;
  }
  return makeProjSVG(p.id, p.category).svg;
}
function projBannerFromSeed(seed, category, imageUrl){
  if(imageUrl){
    return `<img src="${imageUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"/>`;
  }
  return makeProjSVG(seed, category).svg;
}
function buildProjLinks(p){
  let html = '';
  if(p.link_github) html += `<a class="proj-link-btn github" href="${p.link_github}" target="_blank" onclick="event.stopPropagation()">⌥ GitHub</a>`;
  if(p.link_figma)  html += `<a class="proj-link-btn figma"  href="${p.link_figma}"  target="_blank" onclick="event.stopPropagation()">◈ Figma</a>`;
  if(p.link_demo)   html += `<a class="proj-link-btn demo"   href="${p.link_demo}"   target="_blank" onclick="event.stopPropagation()">↗ Demo</a>`;
  if(p.lab_entry_id) html += `<a class="proj-link-btn lab" href="/lab" onclick="event.stopPropagation();sessionStorage.setItem('openLabEntry','${p.lab_entry_id}');return true;">◉ Try in Lab</a>`;
  return html;
}

function formatProjTitle(title){
  const words = title.trim().split(' ');
  if(words.length < 3) return `${words.slice(0,-1).join(' ')}<br><em>${words[words.length-1]}</em>`;
  const split = Math.ceil(words.length/2);
  return `${words.slice(0,split).join(' ')}<br><em>${words.slice(split).join(' ')}</em>`;
}

function filterProjects(cat, btn){
  document.querySelectorAll('#projFilterBar .fb').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  projFilter = cat;
  // Re-render with current data
  loadProjects();
}

function openProjectModal(id=null){
  document.getElementById('projectModalTitle').textContent = id ? 'Edit Project' : 'New Project';
  document.getElementById('editProjectId').value = id||'';

  // Load lab demo entries into dropdown
  sb.from('lab_entries').select('id,title,category').eq('category','demo').order('title',{ascending:true}).then(({data:labs})=>{
    const sel = document.getElementById('projLabEntry');
    sel.innerHTML = '<option value="">None</option>';
    (labs||[]).forEach(l=>{
      const opt = document.createElement('option');
      opt.value = l.id; opt.textContent = l.title;
      sel.appendChild(opt);
    });
    if(id){
      sb.from('projects').select('*').eq('id',id).single().then(({data:p})=>{
        document.getElementById('projTitle').value = p?.title||'';
        document.getElementById('projSubtitle').value = p?.subtitle||'';
        document.getElementById('projDesc').value = p?.description||'';
        document.getElementById('projCategory').value = p?.category||'Development';
        document.getElementById('projTags').value = p?.tags||'';
        document.getElementById('projGithub').value = p?.link_github||'';
        document.getElementById('projFigma').value = p?.link_figma||'';
        document.getElementById('projDemo').value = p?.link_demo||'';
        document.getElementById('projBanner').value = p?.banner_image||'';
        document.getElementById('projSort').value = p?.sort_order||0;
        document.getElementById('projHighlight').value = p?.highlight?'true':'false';
        sel.value = p?.lab_entry_id||'';
      });
    } else {
      ['projTitle','projSubtitle','projDesc','projTags','projGithub','projFigma','projDemo','projBanner'].forEach(id=>document.getElementById(id).value='');
      document.getElementById('projCategory').value='Development';
      document.getElementById('projSort').value='0';
      document.getElementById('projHighlight').value='false';
      sel.value='';
    }
  });
  openModal('projectModal');
}

async function saveProject(){
  const editId = document.getElementById('editProjectId').value;
  const data = {
    title:       document.getElementById('projTitle').value.trim(),
    subtitle:    document.getElementById('projSubtitle').value.trim()||null,
    description: document.getElementById('projDesc').value.trim(),
    category:    document.getElementById('projCategory').value,
    tags:        document.getElementById('projTags').value.trim(),
    link_github: document.getElementById('projGithub').value.trim()||null,
    link_figma:  document.getElementById('projFigma').value.trim()||null,
    link_demo:   document.getElementById('projDemo').value.trim()||null,
    banner_image: document.getElementById('projBanner').value.trim()||null,
    sort_order:  parseInt(document.getElementById('projSort').value)||0,
    highlight:   document.getElementById('projHighlight').value==='true',
    lab_entry_id: document.getElementById('projLabEntry').value||null,
  };
  if(!data.title){alert('Please add a title.');return}
  setLoading('projSaveBtn',true);
  const {error} = editId
    ? await sb.from('projects').update(data).eq('id',editId)
    : await sb.from('projects').insert(data);
  setLoading('projSaveBtn',false,'Save');
  if(error){toast('Error saving','error');return}
  toast(editId?'Project updated':'Project added');
  closeModal('projectModal');
  loadProjects();
}

async function deleteProject(id){
  if(!confirm('Delete this project?')) return;
  await sb.from('projects').delete().eq('id',id);
  toast('Project deleted');
  loadProjects();
}

