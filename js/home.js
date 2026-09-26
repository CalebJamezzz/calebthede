// ══ HOME DATA ══

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

