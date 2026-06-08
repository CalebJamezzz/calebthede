// ══ HOME DATA ══

// One project, charted in full — the "Selected work" spotlight.
async function loadFeaturedProject(){
  const wrap = document.getElementById('featuredProject');
  const section = document.getElementById('featuredSection');
  if(!wrap) return;
  const {data:projects} = await sb.from('projects').select('*').eq('highlight',true).limit(1);
  if(!projects||!projects.length){ if(section) section.style.display='none'; return }
  const p = projects[0];
  const banner = p.banner_image
    ? `<img src="${p.banner_image}" alt="${(p.title||'').replace(/"/g,'&quot;')}"/>`
    : makeProjSVG(p.id, p.category).svg;
  const blurb = p.subtitle
    ? p.subtitle
    : (p.description||'').replace(/<[^>]*>/g,'').replace(/[#*_>`]/g,'').trim().slice(0,180);
  const tags = (p.tags||'').split(',').map(t=>t.trim()).filter(Boolean).slice(0,4);
  wrap.innerHTML = `
    <div class="featured-banner">${banner}</div>
    <div class="featured-body">
      <p class="featured-eyebrow">✦ Pinned${p.category?' · '+p.category:''}</p>
      <h3 class="featured-title">${p.title}</h3>
      ${blurb?`<p class="featured-desc">${blurb}</p>`:''}
      ${tags.length?`<div class="featured-tags">${tags.map(t=>`<span class="ptag">${t}</span>`).join('')}</div>`:''}
      <span class="featured-link">Explore Projects →</span>
    </div>`;
  if(section) section.style.display='block';
}

// Newest essays from the Library.
async function loadLatestWriting(){
  const wrap = document.getElementById('latestWriting');
  const section = document.getElementById('latestSection');
  if(!wrap) return;
  const {data:articles} = await sb.from('articles').select('*').order('created_at',{ascending:false}).limit(3);
  if(!articles||!articles.length){ if(section) section.style.display='none'; return }
  wrap.innerHTML = articles.map(a=>{
    const preview = (a.content||'').replace(/<[^>]*>/g,'').replace(/^###\s*/gm,'').replace(/[#*_>`]/g,'').trim().slice(0,140)+'…';
    const words = (a.content||'').split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.ceil(words/200));
    return `<a class="writing-card" href="/library">
      <p class="wc-tag">${a.tag||'Essay'}</p>
      <h3 class="wc-title">${a.title}</h3>
      <p class="wc-preview">${preview}</p>
      <div class="wc-meta"><span>${fmtDate(a.created_at)}</span><span>${mins} min</span></div>
    </a>`;
  }).join('');
  if(section) section.style.display='block';
}

async function loadHomeData(){
  await Promise.all([loadBookTeaser(), loadFeaturedProject(), loadLatestWriting()]);
}

async function loadStatus(){
  const wrap=document.getElementById('statusItems');
  if(!wrap) return;
  const{data:items}=await sb.from('status_items').select('*').order('sort_order',{ascending:true});
  if(!items||!items.length){wrap.innerHTML='';return}
  wrap.innerHTML=items.map(s=>`
    <div class="status-item">
      <span class="si-label">${s.label}</span>
      <span class="si-value">${s.value}${s.pill_text?`<span class="si-pill${s.pill_color==='gold'?' gold':''}">${s.pill_text}</span>`:''}</span>
    </div>`).join('');
  refreshAdmin(wrap.closest('.status-plate'));
}

async function loadBookTeaser(){
  const{data:books}=await sb.from('books').select('id,title,description,cover_image,color').order('created_at',{ascending:true});
  if(!books||!books.length)return;

  // Find the most recently saved bookmark across ALL books
  let activeBm=null, activeBmBook=null;
  try{
    books.forEach(b=>{
      const bm=JSON.parse(localStorage.getItem('bm_'+b.id));
      if(bm&&(!activeBm||bm.savedAt>activeBm.savedAt)){
        activeBm=bm; activeBmBook=b;
      }
    });
  }catch(e){}

  // If a bookmark exists, show that book as "Continue Reading"
  // Otherwise fall back to the first/primary book as "Now Writing"
  const display = activeBmBook || books[0];

  document.getElementById('btTitle').textContent=display.title;
  document.getElementById('btDesc').textContent=display.description||"Cade learns he's the son of Hades, marked by a blue flame tied to the Veil — but the real war is with the shadow he carries. An eight-book descent from Awakening to Integration: Greek myth as the first psychology.";

  // book cover — real image if uploaded, else the procedural ember constellation
  const cover=document.getElementById('btCover');
  if(cover){
    if(display.cover_image){ cover.style.backgroundImage='url('+display.cover_image+')'; cover.classList.add('has-cover'); }
    else if(display.color){ cover.style.background=display.color; }
  }

  if(activeBm){
    document.getElementById('btEyebrow').textContent='Continue Reading';
    document.getElementById('btCta').textContent=`Ch.${activeBm.chNum} — ${activeBm.chTitle}, page ${activeBm.pageInCh+1}`;
    document.getElementById('bookTeaser').href='/library#book/'+activeBmBook.id+'/resume';
  }

  document.getElementById('bookTeaser').style.display='block';
}

// ══ STATUS EDITING ══
let statusEditRows=[];

function openStatusModal(){
  sb.from('status_items').select('*').order('sort_order',{ascending:true}).then(({data:items})=>{
    statusEditRows=(items||[]).map(s=>({...s}));
    renderStatusEditRows();
    openModal('statusModal');
  });
}

function renderStatusEditRows(){
  const list=document.getElementById('statusEditList');
  list.innerHTML=statusEditRows.map((s,i)=>`
    <div style="display:grid;grid-template-columns:90px 1fr 80px 60px 28px;gap:.5rem;align-items:center">
      <input value="${s.label||''}" placeholder="Label" oninput="statusEditRows[${i}].label=this.value" style="background:var(--bg3);border:1px solid var(--border);border-radius:3px;padding:.5rem .7rem;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:.72rem;outline:none"/>
      <input value="${s.value||''}" placeholder="Value text" oninput="statusEditRows[${i}].value=this.value" style="background:var(--bg3);border:1px solid var(--border);border-radius:3px;padding:.5rem .7rem;color:var(--text);font-size:.85rem;font-family:'Lato',sans-serif;outline:none"/>
      <input value="${s.pill_text||''}" placeholder="Pill" oninput="statusEditRows[${i}].pill_text=this.value" style="background:var(--bg3);border:1px solid var(--border);border-radius:3px;padding:.5rem .7rem;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:.7rem;outline:none"/>
      <select onchange="statusEditRows[${i}].pill_color=this.value" style="background:var(--bg3);border:1px solid var(--border);border-radius:3px;padding:.5rem .4rem;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:.68rem;outline:none">
        <option value="teal"${(s.pill_color||'teal')==='teal'?' selected':''}>Teal</option>
        <option value="gold"${s.pill_color==='gold'?' selected':''}>Gold</option>
      </select>
      <button onclick="statusEditRows.splice(${i},1);renderStatusEditRows()" style="background:none;border:1px solid var(--border);border-radius:3px;color:var(--danger);cursor:pointer;padding:.3rem .5rem;font-size:.8rem;transition:border-color .2s" onmouseover="this.style.borderColor='var(--danger)'" onmouseout="this.style.borderColor='var(--border)'">✕</button>
    </div>`).join('');
}

function addStatusRow(){
  statusEditRows.push({label:'',value:'',pill_text:'',pill_color:'teal',sort_order:statusEditRows.length});
  renderStatusEditRows();
}

async function saveStatusItems(){
  setLoading('statusSaveBtn',true);
  await sb.from('status_items').delete().neq('id','00000000-0000-0000-0000-000000000000');
  const rows=statusEditRows.filter(r=>r.label&&r.value).map((r,i)=>({label:r.label,value:r.value,pill_text:r.pill_text||null,pill_color:r.pill_color||'teal',sort_order:i}));
  if(rows.length)await sb.from('status_items').insert(rows);
  setLoading('statusSaveBtn',false,'Save All');
  toast('Status updated');closeModal('statusModal');loadStatus();
}

