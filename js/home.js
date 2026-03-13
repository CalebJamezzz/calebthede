// ══ HOME DATA ══

async function loadHighlightedProject(){
  const wrap = document.getElementById('builderHighlight');
  if(!wrap) return;
  const {data:projects} = await sb.from('projects').select('*').eq('highlight',true).limit(1);
  if(!projects||!projects.length){wrap.style.display='none';return}
  const p = projects[0];
  const {svg} = makeProjSVG(p.id, p.category);
  const tags = (p.tags||'').split(',').map(t=>t.trim()).filter(Boolean).slice(0,3);
  let links = '';
  if(p.link_github) links += `<a class="builder-highlight-link" href="${p.link_github}" target="_blank" onclick="event.stopPropagation()">GitHub</a>`;
  if(p.link_figma)  links += `<a class="builder-highlight-link" href="${p.link_figma}"  target="_blank" onclick="event.stopPropagation()">Figma</a>`;
  if(p.link_demo)   links += `<a class="builder-highlight-link" href="${p.link_demo}"   target="_blank" onclick="event.stopPropagation()">Demo</a>`;
  wrap.innerHTML = `
    <div class="builder-highlight-banner">${svg}</div>
    <div class="builder-highlight-body">
      <p class="builder-highlight-label">// Pinned Project</p>
      <h4 class="builder-highlight-title">${p.title}</h4>
      <div class="builder-highlight-tags">${tags.map(t=>`<span class="ptag" style="font-size:.5rem;padding:.15rem .5rem">${t}</span>`).join('')}</div>
      ${links?`<div class="builder-highlight-links">${links}</div>`:''}
    </div>`;
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
}
async function loadHomeData(){
  await Promise.all([loadStatus(), loadBookTeaser(), loadHighlightedProject()]);
}

async function loadStatus(){
  const wrap=document.getElementById('statusItems');
  const{data:items}=await sb.from('status_items').select('*').order('sort_order',{ascending:true});
  if(!items||!items.length){wrap.innerHTML='';return}
  wrap.innerHTML=items.map(s=>`
    <div class="status-item">
      <span class="si-label">${s.label}</span>
      <span class="si-value">${s.value}${s.pill_text?`<span class="si-pill${s.pill_color==='gold'?' gold':''}">${s.pill_text}</span>`:''}</span>
    </div>`).join('');
  refreshAdmin(wrap.closest('.status-card'));
}

async function loadBookTeaser(){
  const{data:books}=await sb.from('books').select('id,title,description').order('created_at',{ascending:true});
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
  document.getElementById('btDesc').textContent=display.description||'A book weaving together mythology and psychology — ancient stories as a lens for modern human behavior.';

  if(activeBm){
    document.getElementById('btEyebrow').textContent='Continue Reading';
    document.getElementById('btCta').textContent=`Ch.${activeBm.chNum} — ${activeBm.chTitle}, page ${activeBm.pageInCh+1}`;
    document.getElementById('bookTeaser').href='/library#book/'+activeBmBook.id;
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

