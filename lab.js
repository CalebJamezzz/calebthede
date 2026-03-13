// ── ARTICLE EDITOR ──
function updateArticlePreview(){
  const content=document.getElementById('articleContent').value||'';
  document.getElementById('articlePreviewBody').innerHTML=renderBody(content);
  const words=content.split(/\s+/).filter(Boolean).length;
  const mins=Math.max(1,Math.ceil(words/200));
  document.getElementById('articleWordCount').textContent=words.toLocaleString()+' words';
  document.getElementById('articleReadTime').textContent=mins+' min read';
}
function triggerArticlePasteClean(){
  navigator.clipboard.read().then(async items=>{
    for(const item of items){
      if(item.types.includes('text/html')){
        const blob=await item.getType('text/html');
        const cleaned=cleanGoogleDocs(await blob.text());
        document.getElementById('articleContent').value=cleaned;
        updateArticlePreview();toast('Cleaned and pasted from clipboard','success');return;
      }
      if(item.types.includes('text/plain')){
        const blob=await item.getType('text/plain');
        document.getElementById('articleContent').value=await blob.text();
        updateArticlePreview();toast('Pasted as plain text','success');return;
      }
    }
  }).catch(()=>{document.getElementById('articleContent').focus();toast('Paste with Ctrl+V — auto-clean will run','success');});
}
function insertArticleFmt(prefix){
  const ta=document.getElementById('articleContent');
  const start=ta.selectionStart,end=ta.selectionEnd;
  ta.value=ta.value.substring(0,start)+'\n\n'+prefix+(ta.value.substring(start,end)||'…')+'\n\n'+ta.value.substring(end);
  updateArticlePreview();ta.focus();
}
// Auto-clean paste into article editor
document.addEventListener('paste',e=>{
  if(document.activeElement.id!=='articleContent')return;
  const html=e.clipboardData.getData('text/html');
  if(html&&(html.includes('google')||html.includes('docs-'))){
    e.preventDefault();
    document.getElementById('articleContent').value=cleanGoogleDocs(html);
    updateArticlePreview();toast('Google Docs formatting cleaned','success');
  }
  setTimeout(updateArticlePreview,50);
});
function openArticleModal(id=null){
  document.getElementById('articleModalTitle').textContent=id?'Edit Article':'New Article';
  document.getElementById('editArticleId').value=id||'';
  if(id){sb.from('articles').select('*').eq('id',id).single().then(({data:a})=>{document.getElementById('articleTitle').value=a?.title||'';document.getElementById('articleTag').value=a?.tag||'';document.getElementById('articleContent').value=a?.content||'';document.getElementById('articleBanner').value=a?.banner_image||'';updateArticlePreview();})}
  else{document.getElementById('articleTitle').value='';document.getElementById('articleTag').value='';document.getElementById('articleContent').value='';document.getElementById('articleBanner').value='';updateArticlePreview();}
  openModal('articleModal');
}

async function saveArticle(){
  const title=document.getElementById('articleTitle').value.trim(),tag=document.getElementById('articleTag').value.trim(),content=document.getElementById('articleContent').value.trim(),banner_image=document.getElementById('articleBanner').value.trim()||null;
  if(!title||!content){alert('Please add a title and content.');return}
  const editId=document.getElementById('editArticleId').value;
  setLoading('articleSaveBtn',true);
  const{error}=editId?await sb.from('articles').update({title,tag,content,banner_image}).eq('id',editId):await sb.from('articles').insert({title,tag,content,banner_image});
  setLoading('articleSaveBtn',false,'Save');
  if(error){toast('Error saving','error');return}
  toast(editId?'Article updated':'Article created');closeModal('articleModal');loadArticles();
}

function openArticle(a,skipHistory){
  currentArticleId=a.id;
  const artWords=(a.content||'').split(/\s+/).filter(Boolean).length;
  const artMins=Math.max(1,Math.ceil(artWords/200));
  // Banner image
  const bannerEl=document.getElementById('readerBanner');
  if(a.banner_image){bannerEl.style.backgroundImage=`url(${a.banner_image})`;bannerEl.style.display='block';}
  else{bannerEl.style.display='none';}
  document.getElementById('readerTag').textContent=a.tag||'Article';
  document.getElementById('readerTitle').textContent=a.title;
  document.getElementById('readerMeta').textContent=fmtDate(a.created_at);
  document.getElementById('readerReadTime').textContent=artWords.toLocaleString()+' words · '+artMins+' min read';
  document.getElementById('readerBody').innerHTML=renderBody(a.content);
  document.getElementById('readerEditBtn').onclick=()=>openArticleModal(a.id);
  document.getElementById('readerDeleteBtn').onclick=()=>deleteArticle(a.id,true);
  showLibArticleReader();
  if(!skipHistory)safePush({sub:'article',id:a.id},'','#article/'+a.id);
}

function closeArticleReader(){showLibBrowse();loadArticles();switchLibTab('Articles',document.querySelectorAll('.lib-tab')[1]);safePush({sub:'browse'},'','#');}

async function deleteArticle(id,fromReader=false){
  if(!confirm('Delete this article?'))return;
  await sb.from('articles').delete().eq('id',id);
  toast('Article deleted');if(fromReader)closeArticleReader();else loadArticles();
}

let labFilter='all';


function makeLabSVG(entryId, type){
  const seed=entryId.split('').reduce((a,ch)=>a+ch.charCodeAt(0),0);
  const r=seedRand(seed);
  const palette={
    'Design Concept':['#4EC9B0','#0D2B26'],
    'Project Idea':  ['var(--gold)','#2B1E0A'],
    'Research Note': ['#C87FD5','#1E0A2B'],
    'Experiment':    ['#5AB4C8','#0A1E2B'],
    'Other':         ['#908C86','#1A1A1A'],
  };
  const [accent, bg2]=palette[type]||palette['Other'];
  const w=320,h=90;
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">`;
  svg+=`<defs><linearGradient id="lg${seed}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${bg2}"/><stop offset="100%" stop-color="#0D0F14"/></linearGradient></defs>`;
  svg+=`<rect width="${w}" height="${h}" fill="url(#lg${seed})"/>`;
  // Generate nodes
  const nodes=[];
  const count=6+Math.floor(r()*6);
  for(let i=0;i<count;i++) nodes.push([r()*w, r()*h]);
  // Connect nearby nodes with lines
  for(let i=0;i<nodes.length;i++){
    for(let j=i+1;j<nodes.length;j++){
      const d=Math.hypot(nodes[j][0]-nodes[i][0],nodes[j][1]-nodes[i][1]);
      if(d<90){
        svg+=`<line x1="${nodes[i][0]}" y1="${nodes[i][1]}" x2="${nodes[j][0]}" y2="${nodes[j][1]}" stroke="${accent}" stroke-width="${.3+r()*.4}" opacity="${.12+r()*.15}"/>`;
      }
    }
  }
  // Draw nodes
  nodes.forEach(([nx,ny])=>{
    const nr=1.5+r()*3;
    svg+=`<circle cx="${nx}" cy="${ny}" r="${nr}" fill="${accent}" opacity="${.25+r()*.45}"/>`;
    if(r()>.7) svg+=`<circle cx="${nx}" cy="${ny}" r="${nr*2.2}" fill="none" stroke="${accent}" stroke-width=".4" opacity=".12"/>`;
  });
  // Subtle horizontal scan line
  const sy=h*(.3+r()*.4);
  svg+=`<line x1="0" y1="${sy}" x2="${w}" y2="${sy}" stroke="${accent}" stroke-width=".4" opacity=".08"/>`;
  // Fade overlay on right
  svg+=`<rect x="${w*.6}" width="${w*.4}" height="${h}" fill="url(#lg${seed})" opacity=".6"/>`;
  svg+='</svg>';
  return {svg, accent};
}
async function loadLab(){
  const grid=document.getElementById('labGrid'),empty=document.getElementById('labEmpty');
  grid.innerHTML='<div style="padding:2rem 0">'+constellationLoader()+'</div>';
  let query=sb.from('lab_entries').select('*').order('created_at',{ascending:false});
  if(labFilter!=='all')query=query.eq('type',labFilter);
  const{data:entries}=await query;
  grid.innerHTML='';
  if(!entries||!entries.length){empty.style.display='block';return}
  empty.style.display='none';
  const tc={'Design Concept':'design','Project Idea':'idea','Research Note':'research','Experiment':'experiment','Other':'other'};
  entries.forEach(e=>{
    const cls=tc[e.type]||'other',preview=(e.description||'').slice(0,220)+(e.description&&e.description.length>220?'…':'');
    const card=document.createElement('div');card.className='lab-card';
    const{svg:labSvg,accent}=makeLabSVG(e.id,e.type);
    card.innerHTML=`
      <div class="lab-card-banner">${labSvg}</div>
      <div class="lab-card-body">
        <span class="lab-badge ${cls}">${e.type}</span>
        <h3 class="lab-card-title">${e.title}</h3>
        <p class="lab-card-desc">${preview||'<em style="opacity:.4">No notes yet.</em>'}</p>
        ${e.link?`<a class="lab-link-btn" href="${e.link}" target="_blank" onclick="event.stopPropagation()">↗ View</a>`:''}
        <div class="lab-card-footer">
          <span class="lab-card-date">${fmtDate(e.created_at)}</span>
          <div class="lab-card-actions">
            <button class="btn-sm admin-only" onclick="event.stopPropagation();openLabModal('${e.id}')">Edit</button>
            <button class="btn-sm danger admin-only" onclick="event.stopPropagation();deleteLabEntry('${e.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    grid.appendChild(card);refreshAdmin(card);
  });
}

function filterLab(type,btn){document.querySelectorAll('.lab-fb').forEach(b=>b.classList.remove('active'));btn.classList.add('active');labFilter=type;loadLab()}

function openLabModal(id=null){
  document.getElementById('labModalTitle').textContent=id?'Edit Entry':'New Lab Entry';
  document.getElementById('editLabId').value=id||'';
  if(id){sb.from('lab_entries').select('*').eq('id',id).single().then(({data:e})=>{document.getElementById('labType').value=e?.type||'Design Concept';document.getElementById('labTitle').value=e?.title||'';document.getElementById('labDesc').value=e?.description||'';document.getElementById('labLink').value=e?.link||'';})}
  else{document.getElementById('labType').value='Design Concept';document.getElementById('labTitle').value='';document.getElementById('labDesc').value='';document.getElementById('labLink').value='';}
  openModal('labModal');
}

async function saveLabEntry(){
  const type=document.getElementById('labType').value,title=document.getElementById('labTitle').value.trim(),description=document.getElementById('labDesc').value.trim(),link=document.getElementById('labLink').value.trim()||null;
  if(!title){alert('Please add a title.');return}
  const editId=document.getElementById('editLabId').value;
  setLoading('labSaveBtn',true);
  const{error}=editId?await sb.from('lab_entries').update({type,title,description,link}).eq('id',editId):await sb.from('lab_entries').insert({type,title,description,link});
  setLoading('labSaveBtn',false,'Save');
  if(error){toast('Error saving','error');return}
  toast(editId?'Entry updated':'Entry added');closeModal('labModal');loadLab();
}

async function deleteLabEntry(id){
  if(!confirm('Delete this lab entry?'))return;
  const{error}=await sb.from('lab_entries').delete().eq('id',id);
  if(error){toast('Error deleting','error');return}
  toast('Entry deleted');loadLab();
}

