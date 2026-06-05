// ── CHAPTER PREVIEW ──
function updateChPreview(){
  const content=(typeof quillGet!=='undefined'?quillGet('chContentEditor'):null)||document.getElementById('chContent')?.value||'';
  const preview=document.getElementById('chPreviewBody');
  if(preview) preview.innerHTML=renderBody(content);
  const stripped=content.replace(/<[^>]*>/g,'');
  const words=stripped.split(/\s+/).filter(Boolean).length;
  const pages=Math.max(0,Math.ceil(words/WORDS_PER_PAGE));
  const wc=document.getElementById('chWordCount');if(wc) wc.textContent=words.toLocaleString()+' words';
  const pe=document.getElementById('chPageEst');if(pe) pe.textContent='~'+pages+' page'+(pages===1?'':'s');
}

function updateChPublishedLbl(){
  const checked=document.getElementById('chPublished')?.checked;
  const lbl=document.getElementById('chPublishedLbl');
  const track=document.getElementById('chToggleTrack');
  if(lbl){lbl.textContent=checked?'Published — visible':'Draft — hidden';lbl.classList.toggle('on',checked);}
  if(track)track.classList.toggle('on',checked);
}

// ── CELESTIAL BOOK COVER GENERATOR ──
function seedRand(seed){
  let s=seed;
  return ()=>{s=(s*1664525+1013904223)&0xffffffff;return(s>>>0)/0xffffffff};
}
function makeCelestialSVG(bookId,w=200,h=300){
  const seed=bookId.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const r=seedRand(seed);
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`;
  // Orbital rings
  const cx=w*(.3+r()*.4),cy=h*(.25+r()*.3);
  const orbitals=2+Math.floor(r()*2);
  for(let i=0;i<orbitals;i++){
    const rx=30+i*22+r()*20,ry=rx*(.5+r()*.4);
    const rot=-20+r()*50;
    svg+=`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="0.5" transform="rotate(${rot},${cx},${cy})"/>`;
    // planet dot on orbit
    const angle=r()*Math.PI*2;
    const px=cx+rx*Math.cos(angle),py=cy+ry*Math.sin(angle);
    svg+=`<circle cx="${px}" cy="${py}" r="${.8+r()*1.2}" fill="rgba(255,255,255,0.5)"/>`;
  }
  // Constellation lines + stars
  const stars=[];const numStars=5+Math.floor(r()*5);
  for(let i=0;i<numStars;i++) stars.push([r()*w,r()*h,r()]);
  // connect nearby stars
  for(let i=0;i<stars.length-1;i++){
    const[x1,y1]=stars[i],[x2,y2]=stars[i+1];
    const d=Math.hypot(x2-x1,y2-y1);
    if(d<80) svg+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>`;
  }
  stars.forEach(([sx,sy,sr])=>{
    const size=1+sr*2.5;
    svg+=`<circle cx="${sx}" cy="${sy}" r="${size}" fill="rgba(255,255,255,${0.3+sr*0.5})"/>`;
    if(sr>.7) svg+=`<circle cx="${sx}" cy="${sy}" r="${size*2.5}" fill="rgba(255,255,255,0.05)"/>`;
  });
  // Decorative border arc
  svg+=`<path d="M ${w*.1} ${h*.85} Q ${w*.5} ${h*.75} ${w*.9} ${h*.85}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.6"/>`;
  svg+='</svg>';
  return svg;
}

const COVERS=['linear-gradient(135deg,#0D3B33,#1A6B5A)','linear-gradient(135deg,#3B2A0D,#7A5420)','linear-gradient(135deg,#0D1226,#1A2456)','linear-gradient(135deg,#2B0D0D,#6B1A1A)','linear-gradient(135deg,#0D2B10,#1A5E20)','linear-gradient(135deg,#1A1F2E,#2E3A50)','linear-gradient(135deg,#1E0D2B,#4A1A6B)','linear-gradient(135deg,#2B1A0D,#6B3A1A)'];
let selectedCover=COVERS[0];

function buildSwatches(current){const wrap=document.getElementById('colorSwatches');wrap.innerHTML='';COVERS.forEach(c=>{const s=document.createElement('div');s.className='swatch'+(c===(current||selectedCover)?' selected':'');s.style.background=c;s.onclick=()=>{selectedCover=c;document.getElementById('bookColor').value=c;wrap.querySelectorAll('.swatch').forEach(x=>x.classList.remove('selected'));s.classList.add('selected')};wrap.appendChild(s)});document.getElementById('bookColor').value=current||selectedCover}

function showLibBrowse(){document.getElementById('libBrowse').style.display='block';document.getElementById('libBookDetail').style.display='none';document.getElementById('libArticleReader').style.display='none'}
function showLibBookDetail(){document.getElementById('libBrowse').style.display='none';document.getElementById('libBookDetail').style.display='block';document.getElementById('libArticleReader').style.display='none'}
function showLibArticleReader(){document.getElementById('libBrowse').style.display='none';document.getElementById('libBookDetail').style.display='none';document.getElementById('libArticleReader').style.display='block'}
function switchLibTab(tab,el){document.querySelectorAll('.lib-tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.lib-panel').forEach(p=>p.classList.remove('active'));el.classList.add('active');document.getElementById('lib'+tab).classList.add('active');safePush({sub:'tab',tab:tab.toLowerCase()},'','#'+tab.toLowerCase());}

let currentBookId=null,activeChId=null;
const WORDS_PER_PAGE=180;

async function loadLibrary(){showLibBrowse();await Promise.all([loadBooks(),loadArticles()])}


function makeArticleSVG(articleId, tag){
  const seed=articleId.split('').reduce((a,ch)=>a+ch.charCodeAt(0),0);
  const r=seedRand(seed);
  // Pick palette from tag
  const palettes={
    psychology:['#4EC9B0','#1A6B5A'],
    mythology:['#C8A45A','#7A5420'],
    essay:['#6B8FBF','#1A2456'],
    design:['#B07FBF','#4A1A6B'],
  };
  const tagKey=Object.keys(palettes).find(k=>(tag||'').toLowerCase().includes(k));
  const [c1,c2]=palettes[tagKey]||['#C8A45A','#3B2A0D'];
  const w=400,h=110;
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">`;
  // Background gradient
  svg+=`<defs><linearGradient id="ag${seed}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c2}" stop-opacity="1"/><stop offset="100%" stop-color="${c2}" stop-opacity=".4"/></linearGradient></defs>`;
  svg+=`<rect width="${w}" height="${h}" fill="url(#ag${seed})"/>`;
  // Flowing bezier curves — ink/manuscript feel
  for(let i=0;i<4;i++){
    const y1=r()*h, y2=r()*h, y3=r()*h;
    const cp1x=r()*w, cp2x=r()*w;
    svg+=`<path d="M 0 ${y1} C ${cp1x} ${y2}, ${cp2x} ${y3}, ${w} ${r()*h}" fill="none" stroke="${c1}" stroke-width="${.4+r()*.8}" opacity="${.15+r()*.2}"/>`;
  }
  // Scattered particles
  for(let i=0;i<22;i++){
    const px=r()*w,py=r()*h,pr=.6+r()*2;
    svg+=`<circle cx="${px}" cy="${py}" r="${pr}" fill="${c1}" opacity="${.15+r()*.35}"/>`;
  }
  // Central glyph — ornate circle with cross hairs
  const gx=w*(.35+r()*.3),gy=h*(.3+r()*.4),gr=12+r()*8;
  svg+=`<circle cx="${gx}" cy="${gy}" r="${gr}" fill="none" stroke="${c1}" stroke-width=".7" opacity=".35"/>`;
  svg+=`<circle cx="${gx}" cy="${gy}" r="${gr*.55}" fill="none" stroke="${c1}" stroke-width=".4" opacity=".25"/>`;
  svg+=`<line x1="${gx-gr*1.4}" y1="${gy}" x2="${gx+gr*1.4}" y2="${gy}" stroke="${c1}" stroke-width=".4" opacity=".2"/>`;
  svg+=`<line x1="${gx}" y1="${gy-gr*1.4}" x2="${gx}" y2="${gy+gr*1.4}" stroke="${c1}" stroke-width=".4" opacity=".2"/>`;
  // Overlay vignette
  svg+=`<rect width="${w}" height="${h}" fill="url(#ag${seed})" opacity=".3"/>`;
  svg+='</svg>';
  return {svg, tagColor:c1};
}
async function loadBooks(){
  const container=document.getElementById('booksContainer'),empty=document.getElementById('booksEmpty');
  container.innerHTML='<div style="padding:2rem 0">'+constellationLoader()+'</div>';
  const[{data:books},{data:chapters},{data:allSeries}]=await Promise.all([
    sb.from('books').select('*').order('created_at',{ascending:true}),
    sb.from('chapters').select('id,book_id,content,published'),
    sb.from('series').select('*').order('created_at',{ascending:true})
  ]);
  container.innerHTML='';
  if(!books||!books.length){empty.style.display='flex';return}
  empty.style.display='none';
  window._allBooks=books;window._allChapters=chapters;window._allSeries=allSeries;

  function makeBookCard(b){
    const chs=(chapters||[]).filter(c=>c.book_id===b.id);
    const count=chs.length;
    const pubCount=chs.filter(c=>c.published).length;
    const totalChCount=b.total_chapters||count;
    const card=document.createElement('div');card.className='book-card';
    const bgStyle=b.cover_image?`background:${b.color||COVERS[0]};background-image:url(${b.cover_image});background-size:cover;background-position:center`:`background:${b.color||COVERS[0]}`;
    const totalWords=chs.reduce((sum,ch)=>sum+(ch.content||'').split(/\s+/).filter(Boolean).length,0);
    const pageCount=Math.max(0,Math.ceil(totalWords/WORDS_PER_PAGE))||'—';
    const readMins=totalWords>0?Math.max(1,Math.ceil(totalWords/200)):'—';
    const statusLabel=b.status==='complete'?'Complete':b.status==='in_progress'?'In Progress':'Draft';
    const statusClass=b.status||'in_progress';
    const spineStatus=b.status!=='draft'
      ?`<div class="book-spine-status ${statusClass}">${statusLabel}</div>`
      :`<div class="book-spine-status in_progress admin-only blk">Draft</div>`;
    card.innerHTML=`
      <div class="book-spine">
        <div class="book-spine-bg" style="${bgStyle}"></div>
        <div class="book-spine-svg">${makeCelestialSVG(b.id)}</div>
        ${spineStatus}
        <div class="book-spine-content">
          <span class="book-spine-title">${b.title}</span>
        </div>
      </div>
      <div class="book-foot">
        <div class="book-foot-title">${b.title}</div>
        <div class="book-foot-meta">
          <span style="color:var(--teal)">${pubCount} of ${totalChCount} ch</span>
          <span>${pageCount} pg</span>
          <span>${readMins} min</span>
        </div>
        <div class="admin-only" style="margin-top:.5rem">
          <button class="btn-sm" style="width:100%" onclick="event.stopPropagation();openBookModal('${b.id}')">Edit</button>
        </div>
      </div>`;
    card.onclick=()=>openBook(b.id,b.title,b.description);
    refreshAdmin(card);
    return card;
  }

  // --- Series sections first ---
  const usedBookIds=new Set();
  (allSeries||[]).forEach(ser=>{
    const serBooks=books
      .filter(b=>b.series_id===ser.id && b.status!=='draft')
      .sort((a,b)=>(a.series_order||99)-(b.series_order||99));
    const serBooksDraft=books.filter(b=>b.series_id===ser.id && b.status==='draft');
    const allSerBooks=[...serBooks,...serBooksDraft];
    if(!allSerBooks.length)return;
    allSerBooks.forEach(b=>usedBookIds.add(b.id));

    const section=document.createElement('div');section.style.cssText='margin-bottom:3.5rem';
    const totalPlanned=ser.total_books||serBooks.length;
    section.innerHTML=`
      <div class="series-header">
        <div>
          <p class="series-eyebrow">Series</p>
          <h3 class="series-title">${ser.name}</h3>
          <p class="series-meta">${serBooks.length} of ${totalPlanned} book${totalPlanned!==1?'s':''} published${ser.description?` · ${ser.description}`:''}</p>
        </div>
        <button class="btn-sm admin-only blk" onclick="openSeriesModal('${ser.id}')">Edit Series</button>
      </div>`;
    const grid=document.createElement('div');grid.className='books-grid';
    allSerBooks.forEach(b=>{
      const card=makeBookCard(b);
      if(b.series_order){
        const numBadge=document.createElement('div');
        numBadge.className='book-series-num';
        numBadge.textContent='#'+b.series_order;
        card.querySelector('.book-spine-content').appendChild(numBadge);
      }
      grid.appendChild(card);
    });
    // Placeholder cards for unwritten books
    const written=allSerBooks.length;
    for(let i=written;i<totalPlanned;i++){
      const ph=document.createElement('div');ph.className='book-card book-card-placeholder';
      ph.innerHTML=`<div class="book-spine book-spine-placeholder"><span style="font-family:'JetBrains Mono',monospace;font-size:.55rem;letter-spacing:.1em;color:rgba(255,255,255,.2)">Book ${i+1}</span></div><div class="book-foot"><div class="book-foot-title" style="opacity:.3">Coming soon</div></div>`;
      grid.appendChild(ph);
    }
    section.appendChild(grid);
    container.appendChild(section);
    refreshAdmin(section);
  });

  // --- Standalone books ---
  const standalones=books.filter(b=>!b.series_id && b.status!=='draft');
  const standaloneDrafts=books.filter(b=>!b.series_id && b.status==='draft');
  if(standalones.length||standaloneDrafts.length){
    const section=document.createElement('div');section.style.cssText='margin-bottom:3rem';
    if(standalones.length){
      const hdr=document.createElement('div');hdr.className='lib-section-header';hdr.style.marginBottom='1.5rem';
      hdr.innerHTML=`<h3 style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:300;color:var(--text-dim);letter-spacing:.05em">Standalone</h3>`;
      section.appendChild(hdr);
      const grid=document.createElement('div');grid.className='books-grid';
      standalones.forEach(b=>grid.appendChild(makeBookCard(b)));
      section.appendChild(grid);
    }
    if(standaloneDrafts.length){
      const draftSection=document.createElement('div');draftSection.className='admin-only blk';draftSection.style.marginTop='1.5rem';
      const hdr=document.createElement('div');hdr.className='lib-section-header';hdr.style.marginBottom='1rem';
      hdr.innerHTML=`<h3 style="font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:300;color:var(--text-dim);letter-spacing:.05em">Drafts</h3>`;
      draftSection.appendChild(hdr);
      const grid=document.createElement('div');grid.className='books-grid';
      standaloneDrafts.forEach(b=>grid.appendChild(makeBookCard(b)));
      draftSection.appendChild(grid);
      section.appendChild(draftSection);
    }
    container.appendChild(section);
  }
}

function openBookModal(id=null){
  document.getElementById('bookModalTitle').textContent=id?'Edit Book':'New Book';
  document.getElementById('editBookId').value=id||'';
  // Load series options
  sb.from('series').select('*').order('name',{ascending:true}).then(({data:seriesList})=>{
    const sel=document.getElementById('bookSeriesId');
    sel.innerHTML='<option value="">Standalone (no series)</option>';
    (seriesList||[]).forEach(s=>{
      const opt=document.createElement('option');opt.value=s.id;opt.textContent=s.name;
      sel.appendChild(opt);
    });
    if(id){
      sb.from('books').select('*').eq('id',id).single().then(({data:b})=>{
        document.getElementById('bookTitle').value=b?.title||'';
        document.getElementById('bookDesc').value=b?.description||'';
        document.getElementById('bookCoverImage').value=b?.cover_image||'';
        document.getElementById('bookTotalChapters').value=b?.total_chapters||'';
        sel.value=b?.series_id||'';
        document.getElementById('bookSeriesOrder').value=b?.series_order||'';
        document.getElementById('seriesOrderWrap').style.display=b?.series_id?'block':'none';
        selectedCover=b?.color||COVERS[0];buildSwatches(selectedCover);
        refreshCoverPreview();
      });
    } else {
      document.getElementById('bookTitle').value='';
      document.getElementById('bookDesc').value='';
      document.getElementById('bookCoverImage').value='';
      document.getElementById('bookTotalChapters').value='';
      sel.value='';
      document.getElementById('bookSeriesOrder').value='';
      document.getElementById('seriesOrderWrap').style.display='none';
      selectedCover=COVERS[0];buildSwatches();
      const fileEl=document.getElementById('bookCoverFile');if(fileEl)fileEl.value='';
      refreshCoverPreview();
    }
  });
  openModal('bookModal');
}

// ── Cover image: upload / preview / clear ───────────────
function refreshCoverPreview(){
  const url=(document.getElementById('bookCoverImage')?.value||'').trim();
  const prev=document.getElementById('coverPreview');
  const img=document.getElementById('coverPreviewImg');
  const clr=document.getElementById('coverClearBtn');
  if(url){ if(img)img.src=url; if(prev)prev.style.display='block'; if(clr)clr.style.display='inline-block'; }
  else{ if(prev)prev.style.display='none'; if(clr)clr.style.display='none'; }
}

function onCoverUrlInput(){
  const status=document.getElementById('coverUploadStatus');if(status)status.textContent='';
  refreshCoverPreview();
}

function clearCoverImage(){
  document.getElementById('bookCoverImage').value='';
  const fileEl=document.getElementById('bookCoverFile');if(fileEl)fileEl.value='';
  const status=document.getElementById('coverUploadStatus');if(status)status.textContent='';
  refreshCoverPreview();
}

async function uploadCoverFile(e){
  const file=e.target.files&&e.target.files[0];
  if(!file)return;
  const status=document.getElementById('coverUploadStatus');
  if(!file.type.startsWith('image/')){ if(status){status.style.color='var(--danger,#e06c75)';status.textContent='That file is not an image.';} return; }
  if(file.size>5*1024*1024){ if(status){status.style.color='var(--danger,#e06c75)';status.textContent='Image is over 5MB — please use a smaller file.';} return; }
  if(status){status.style.color='var(--teal)';status.textContent='Uploading…';}
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
  const path='covers/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
  const{error}=await sb.storage.from('library').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
  if(error){
    if(status){status.style.color='var(--danger,#e06c75)';status.textContent='Upload failed: '+(error.message||'check that the "library" bucket exists');}
    return;
  }
  const{data}=sb.storage.from('library').getPublicUrl(path);
  document.getElementById('bookCoverImage').value=data?.publicUrl||'';
  if(status){status.style.color='var(--teal)';status.textContent='✓ Uploaded';}
  refreshCoverPreview();
}

async function saveBook(){
  const title=document.getElementById('bookTitle').value.trim();if(!title){alert('Please add a title.');return}
  const editId=document.getElementById('editBookId').value;
  const description=document.getElementById('bookDesc').value.trim();
  const color=document.getElementById('bookColor').value||selectedCover;
  const cover_image=document.getElementById('bookCoverImage').value.trim()||null;
  const series_id=document.getElementById('bookSeriesId').value||null;
  const series_order=document.getElementById('bookSeriesOrder').value?parseInt(document.getElementById('bookSeriesOrder').value):null;
  const total_chapters=document.getElementById('bookTotalChapters').value?parseInt(document.getElementById('bookTotalChapters').value):null;

  // Auto-compute status from published chapter count vs total
  let status='in_progress';
  if(editId && total_chapters){
    const{count}=await sb.from('chapters')
      .select('id',{count:'exact',head:true})
      .eq('book_id',editId).eq('published',true);
    if(count>=total_chapters) status='complete';
  }

  setLoading('bookSaveBtn',true);
  const{error}=editId
    ?await sb.from('books').update({title,description,color,cover_image,status,series_id,series_order,total_chapters}).eq('id',editId)
    :await sb.from('books').insert({title,description,color,cover_image,status:'in_progress',series_id,series_order,total_chapters});
  setLoading('bookSaveBtn',false,'Save Book');
  if(error){toast('Error saving book','error');return}
  toast(editId?'Book updated':'Book created');closeModal('bookModal');loadBooks();
}

async function openBook(id,title,desc,skipHistory){
  currentBookId=id;activeChId=null;
  document.getElementById('bookDetailTitle').textContent=title;
  document.getElementById('bookDetailDesc').textContent=desc||'';
  // Show TOC first immediately, then load chapter detail in background
  showLibBookDetail();
  await renderTOC();
  if(!skipHistory)safePush({sub:'book',id,title,desc},'','#book/'+id);
  return true;
}
function closeBookDetail(){showLibBrowse();loadBooks();safePush({sub:'browse'},'','#');}

async function deleteCurrentBook(){
  if(!confirm('Delete this book and all its chapters?'))return;
  await sb.from('books').delete().eq('id',currentBookId);
  toast('Book deleted');closeBookDetail();
}

// ══ MANUSCRIPT IMPORT (.docx → book + chapters) ══
async function openImportModal(presetMode){
  window._importHtml='';window._importChapters=[];
  document.getElementById('importBookTitle').value='';
  document.getElementById('importFile').value='';
  document.getElementById('importHeading').value='h1';
  document.getElementById('importMode').value='new';
  document.getElementById('importBookSelectWrap').style.display='none';
  const upNote=document.getElementById('importUpdateNote'); if(upNote)upNote.style.display='none';
  document.getElementById('importPreview').innerHTML='<p class="import-status" style="opacity:.6">Choose a .docx file to see detected chapters.</p>';
  openModal('importModal');
  // Populate the "book to update" dropdown
  const sel=document.getElementById('importBookSelect');
  sel.innerHTML='<option value="">Loading…</option>';
  const{data:books}=await sb.from('books').select('id,title').order('created_at',{ascending:false});
  sel.innerHTML=(books||[]).map(b=>`<option value="${b.id}">${(b.title||'Untitled').replace(/</g,'&lt;')}</option>`).join('')
    ||'<option value="">No books yet</option>';
  // Re-sync entry from a book: preselect update mode + the current book
  if(presetMode==='update'){
    document.getElementById('importMode').value='update';
    if(currentBookId) sel.value=currentBookId;
    onImportModeChange();
  }
}

function onImportModeChange(){
  const mode=document.getElementById('importMode').value;
  const wrap=document.getElementById('importBookSelectWrap');
  const runBtn=document.getElementById('importRunBtn');
  const note=document.getElementById('importUpdateNote');
  if(mode==='update'){
    wrap.style.display='block';
    onImportBookSelect();
    if(runBtn)runBtn.textContent='Re-sync chapters';
    if(note)note.style.display='block';
  }else{
    wrap.style.display='none';
    if(runBtn)runBtn.textContent='Import';
    if(note)note.style.display='none';
  }
}

function onImportBookSelect(){
  const sel=document.getElementById('importBookSelect');
  const opt=sel.options[sel.selectedIndex];
  if(opt&&opt.textContent&&!document.getElementById('importBookTitle').value.trim()){
    document.getElementById('importBookTitle').value=opt.textContent;
  }
}

async function handleManuscriptFile(input){
  const file=input.files&&input.files[0];
  if(!file)return;
  const preview=document.getElementById('importPreview');
  preview.innerHTML='<p class="import-status">Converting…</p>';
  const titleEl=document.getElementById('importBookTitle');
  if(!titleEl.value.trim()) titleEl.value=file.name.replace(/\.docx$/i,'').replace(/[_-]+/g,' ').trim();
  try{
    const arrayBuffer=await file.arrayBuffer();
    const result=await mammoth.convertToHtml({arrayBuffer});
    window._importHtml=result.value||'';
    renderImportPreview();
  }catch(e){
    console.error('manuscript import:',e);
    preview.innerHTML='<p class="import-status" style="color:var(--danger)">Could not read that file. Make sure it’s a .docx exported from Google Docs (File → Download → Microsoft Word).</p>';
  }
}

// Split converted HTML into chapters at the chosen heading tag, preserving order.
function splitManuscript(html,headingTag){
  const div=document.createElement('div');div.innerHTML=html||'';
  const chapters=[];let cur=null;const lead=[];
  Array.from(div.childNodes).forEach(n=>{
    const isHeading=n.nodeType===1&&n.tagName.toLowerCase()===headingTag;
    if(isHeading){cur={title:(n.textContent||'').trim()||'Untitled',parts:[]};chapters.push(cur);}
    else if(cur){if(n.outerHTML)cur.parts.push(n.outerHTML);}
    else if(n.outerHTML&&(n.textContent||'').trim())lead.push(n.outerHTML);
  });
  const result=[];
  const leadHtml=lead.join('');
  if(leadHtml.replace(/<[^>]*>/g,'').trim()) result.push({title:'Opening',content:leadHtml});
  chapters.forEach(c=>result.push({title:c.title,content:c.parts.join('')}));
  return result;
}

function renderImportPreview(){
  const sel=document.getElementById('importHeading').value;
  const chapters=splitManuscript(window._importHtml||'',sel);
  window._importChapters=chapters;
  const preview=document.getElementById('importPreview');
  if(!window._importHtml){preview.innerHTML='<p class="import-status" style="opacity:.6">Choose a .docx file to see detected chapters.</p>';return;}
  if(!chapters.length){preview.innerHTML='<p class="import-status">No headings found. Pick a different heading level, or style your chapter titles as Heading 1 in Google Docs.</p>';return;}
  preview.innerHTML='<div class="import-ch-head"><p class="import-status" style="margin:0">'+chapters.length+' chapter'+(chapters.length>1?'s':'')+' detected — edit titles & set publish state:</p>'+
    '<div class="import-ch-bulk"><button type="button" class="toc-ctl" title="Publish all" onclick="setAllImportPub(true)">all ●</button><button type="button" class="toc-ctl" title="Draft all" onclick="setAllImportPub(false)">all ○</button></div></div>'+
    chapters.map((c,i)=>{
      const words=(c.content||'').replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;
      const safe=(c.title||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
      return '<div class="import-ch-row"><span class="import-ch-idx">'+(i+1)+'</span><input class="import-ch-title" value="'+safe+'"/><span class="import-ch-words">'+words+' words</span>'+
        '<button type="button" class="toc-ctl import-ch-pub on" data-pub="1" title="Published — click to make draft" onclick="toggleImportPub(this)">●</button></div>';
    }).join('');
}

function toggleImportPub(btn){
  const on=btn.dataset.pub==='1';
  btn.dataset.pub=on?'0':'1';
  btn.classList.toggle('on',!on);
  btn.textContent=on?'○':'●';
  btn.title=on?'Draft — click to publish':'Published — click to make draft';
}

function setAllImportPub(state){
  document.querySelectorAll('.import-ch-pub').forEach(btn=>{
    btn.dataset.pub=state?'1':'0';
    btn.classList.toggle('on',state);
    btn.textContent=state?'●':'○';
    btn.title=state?'Published — click to make draft':'Draft — click to publish';
  });
}

async function runManuscriptImport(){
  const mode=document.getElementById('importMode').value;
  const title=document.getElementById('importBookTitle').value.trim();
  if(!title){alert('Give the book a title.');return;}
  const chapters=window._importChapters||[];
  if(!chapters.length){alert('No chapters detected. Choose a .docx file first.');return;}
  const titles=[...document.querySelectorAll('.import-ch-title')].map(i=>i.value.trim());
  const pubs=[...document.querySelectorAll('.import-ch-pub')].map(b=>b.dataset.pub==='1');
  if(mode==='update'){ await resyncManuscript(title,chapters,titles,pubs); return; }

  setLoading('importRunBtn',true);
  const anyPub=pubs.some(Boolean);
  const color=COVERS[Math.floor(Math.random()*COVERS.length)];
  const{data:book,error:bErr}=await sb.from('books').insert({title,description:'',color,status:anyPub?'in_progress':'draft',total_chapters:chapters.length}).select().single();
  if(bErr||!book){console.error(bErr);toast('Error creating book','error');setLoading('importRunBtn',false,'Import');return;}
  const rows=chapters.map((c,i)=>({book_id:book.id,title:titles[i]||c.title,content:c.content,published:pubs[i]!==false,position:i}));
  const{error:cErr}=await sb.from('chapters').insert(rows);
  setLoading('importRunBtn',false,'Import');
  if(cErr){console.error(cErr);toast('Book created, but chapters failed to save','error');return;}
  toast('Imported '+rows.length+' chapter'+(rows.length>1?'s':''));
  closeModal('importModal');
  await loadBooks();
  openBook(book.id,title,'');
}

// Re-sync a re-exported .docx into an existing book, matching chapters by
// position so existing chapter IDs (and reader bookmarks) survive.
async function resyncManuscript(title,chapters,titles,pubs){
  pubs=pubs||[];
  const bookId=document.getElementById('importBookSelect').value;
  if(!bookId){alert('Pick a book to update.');return;}
  if(!confirm('Re-sync '+chapters.length+' chapter'+(chapters.length>1?'s':'')+' into this book? Matching slots are overwritten; extra chapters beyond the new file are deleted.'))return;
  setLoading('importRunBtn',true);
  const{data:existing,error:exErr}=await sb.from('chapters')
    .select('id,position').eq('book_id',bookId)
    .order('position',{ascending:true,nullsFirst:false});
  if(exErr){console.error(exErr);toast('Could not load existing chapters','error');setLoading('importRunBtn',false,'Re-sync chapters');return;}
  const old=existing||[];
  const ops=[];
  chapters.forEach((c,i)=>{
    const t=titles[i]||c.title;
    if(i<old.length){
      // Preserve the existing chapter's publish state — manage it from the TOC.
      ops.push(sb.from('chapters').update({title:t,content:c.content,position:i}).eq('id',old[i].id));
    }else{
      ops.push(sb.from('chapters').insert({book_id:bookId,title:t,content:c.content,position:i,published:pubs[i]!==false}));
    }
  });
  // Remove chapters that no longer exist in the re-exported file
  const extras=old.slice(chapters.length).map(c=>c.id);
  if(extras.length) ops.push(sb.from('chapters').delete().in('id',extras));
  ops.push(sb.from('books').update({title,total_chapters:chapters.length}).eq('id',bookId));
  const results=await Promise.all(ops);
  setLoading('importRunBtn',false,'Re-sync chapters');
  const failed=results.find(r=>r&&r.error);
  if(failed){console.error(failed.error);toast('Re-sync hit an error — check the console','error');return;}
  toast('Re-synced '+chapters.length+' chapter'+(chapters.length>1?'s':''));
  closeModal('importModal');
  await loadBooks();
  openBook(bookId,title,'');
  autoUpdateBookStatus(bookId);
}

let tocChapters=[];

let currentArticleId=null;

let allArticles = [];
let activeArticleTag = null;

async function loadArticles(){
  const grid=document.getElementById('articlesGrid'),empty=document.getElementById('articlesEmpty');
  grid.innerHTML='<div style="padding:2rem 0">'+constellationLoader()+'</div>';
  const{data:articles}=await sb.from('articles').select('*').order('created_at',{ascending:false});
  grid.innerHTML='';
  if(!articles||!articles.length){empty.style.display='block';document.getElementById('articleTagFilters').style.display='none';return}
  empty.style.display='none';
  allArticles = articles;
  buildArticleTagFilters(articles);
  renderArticleCards(articles);
}

function buildArticleTagFilters(articles){
  const bar = document.getElementById('articleTagFilters');
  const tags = [...new Set(articles.map(a=>a.tag).filter(Boolean))].sort();
  if(tags.length < 2){bar.style.display='none';return}
  bar.style.display='flex';
  bar.innerHTML = `<button class="tag-filter-pill active" onclick="filterArticlesByTag(null,this)">All</button>`
    + tags.map(t=>`<button class="tag-filter-pill" onclick="filterArticlesByTag('${t}',this)">${t}</button>`).join('');
}

function filterArticlesByTag(tag, btn){
  activeArticleTag = tag;
  document.querySelectorAll('.tag-filter-pill').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  const filtered = tag ? allArticles.filter(a=>a.tag===tag) : allArticles;
  renderArticleCards(filtered);
}

function renderArticleCards(articles){
  const grid=document.getElementById('articlesGrid'),empty=document.getElementById('articlesEmpty');
  grid.innerHTML='';
  if(!articles.length){empty.style.display='block';return}
  empty.style.display='none';
  articles.forEach(a=>{
    const preview=(a.content||'').replace(/^###\s*/gm,'').replace(/<[^>]*>/g,'').slice(0,220)+'…';
    const words=(a.content||'').split(/\s+/).filter(Boolean).length;
    const mins=Math.max(1,Math.ceil(words/200));
    const card=document.createElement('div');card.className='article-card';
    const{svg:artSvg,tagColor}=makeArticleSVG(a.id,a.tag);
    card.innerHTML=`
      <div class="article-card-banner">
        ${artSvg}
        <span class="article-card-tag" style="color:${tagColor};border-color:${tagColor}33;background:rgba(0,0,0,.35)">${a.tag||'Article'}</span>
      </div>
      <div class="article-card-body">
        <h3 class="article-title">${a.title}</h3>
        <p class="article-preview">${preview}</p>
        <div class="article-footer">
          <span>${fmtDate(a.created_at)}</span>
          <span>${mins} min read</span>
        </div>
        <div class="article-card-actions">
          <button class="btn-sm admin-only" onclick="event.stopPropagation();openArticleModal('${a.id}')">Edit</button>
          <button class="btn-sm danger admin-only" onclick="event.stopPropagation();deleteArticle('${a.id}')">Delete</button>
        </div>
      </div>`;
    card.onclick=()=>openArticle(a);grid.appendChild(card);refreshAdmin(card);
  });
}


// ══════════════════════════════════════════════════════
// READER — distraction-free single-column scroll reader
// ══════════════════════════════════════════════════════
let roActive    = false;
let roChapters  = [];   // published chapters in reading order
let roIsBook    = true;
let roCurChIdx  = 0;     // chapter currently in view
let roScrollSaveT = null;

const RO_FONTS  = ['sm','md','lg','xl'];
let roCurFont   = localStorage.getItem('roFont')  || 'md';
let roCurTheme  = localStorage.getItem('roTheme') || 'sepia';

function roEsc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Enter ──────────────────────────────────────────────
// opts: {chId} jump to a chapter, {top:true} start at the beginning.
// With no opts, resumes the current chapter or last bookmark.
async function enterReaderMode(opts){
  opts = opts || {};
  const overlay  = document.getElementById('readerOverlay');
  const inner    = document.getElementById('roScrollInner');
  const scroller = document.getElementById('roScroll');
  if(!overlay || !inner || !scroller) return;

  const articleVisible = document.getElementById('libArticleReader').style.display !== 'none';
  roIsBook = !articleVisible;

  overlay.classList.add('active');
  requestAnimationFrame(()=>overlay.classList.add('ro-shown'));
  document.body.classList.add('reader-locked');
  document.body.style.overflow = 'hidden';
  roSetTheme(roCurTheme, true);
  roSetFont(roCurFont, true);
  roActive = true;

  if(roIsBook){
    inner.innerHTML = '<div class="ro-loading">Loading…</div>';
    const {data:allChs} = await sb.from('chapters')
      .select('id,num,title,content,position')
      .eq('book_id', currentBookId)
      .eq('published', true)
      .order('position', {ascending:true,nullsFirst:false})
      .order('num', {ascending:true});
    roChapters = allChs || [];
    document.getElementById('roTitle').textContent =
      document.getElementById('bookDetailTitle')?.textContent || '';

    if(!roChapters.length){
      inner.innerHTML = '<div class="ro-loading">No published chapters yet.</div>';
      return;
    }

    inner.innerHTML = roChapters.map((ch,i)=>
      '<section class="ro-chapter" id="roCh-'+ch.id+'" data-idx="'+i+'" data-chid="'+ch.id+'">'+
        '<p class="ro-ch-eyebrow">Chapter '+(ch.num||i+1)+'</p>'+
        '<h2 class="ro-ch-title">'+roEsc(ch.title)+'</h2>'+
        '<div class="ro-ch-body">'+renderBody(ch.content)+'</div>'+
      '</section>'
    ).join('') + '<div class="ro-end">✦</div>';

    const sel = document.getElementById('roChapterSelect');
    if(sel){
      sel.innerHTML = roChapters.map((ch,i)=>
        '<option value="'+i+'">Ch. '+(ch.num||i+1)+(ch.title?' · '+roEsc(ch.title):'')+'</option>'
      ).join('');
      sel.style.display = '';
    }

    // Decide where to land
    const bm = loadBookmark(currentBookId);
    let targetCh = opts.chId || (opts.top ? null : activeChId);
    if(!targetCh && !opts.top && bm) targetCh = bm.chId;

    requestAnimationFrame(()=>{
      if(targetCh){
        const el = document.getElementById('roCh-'+targetCh);
        if(el){
          const within = (bm && bm.chId===targetCh && bm.scrollWithin) ? bm.scrollWithin : 0;
          scroller.scrollTop = Math.max(0, el.offsetTop - 24 + within);
        } else scroller.scrollTop = 0;
      } else scroller.scrollTop = 0;
      roOnScroll();
    });
  } else {
    const rawContent = document.getElementById('readerBody')?.innerHTML || '';
    const artTitle   = document.getElementById('readerTitle')?.textContent || '';
    document.getElementById('roTitle').textContent = artTitle;
    roChapters = [];
    const selArt = document.getElementById('roChapterSelect');
    if(selArt){ selArt.innerHTML = ''; selArt.style.display = 'none'; }
    inner.innerHTML =
      '<section class="ro-chapter"><h2 class="ro-ch-title">'+roEsc(artTitle)+'</h2>'+
      '<div class="ro-ch-body">'+rawContent+'</div></section>';
    requestAnimationFrame(()=>{ scroller.scrollTop = 0; roOnScroll(); });
  }

  scroller.addEventListener('scroll', roOnScroll, {passive:true});
  document.addEventListener('keydown', roKeyHandler);
}

// ── Exit ───────────────────────────────────────────────
function exitReaderMode(){
  const overlay  = document.getElementById('readerOverlay');
  const scroller = document.getElementById('roScroll');
  saveReaderBookmark();
  overlay.classList.remove('ro-shown');
  roActive = false;
  if(scroller) scroller.removeEventListener('scroll', roOnScroll);
  document.removeEventListener('keydown', roKeyHandler);
  setTimeout(()=>overlay.classList.remove('active'), 220);
  document.body.classList.remove('reader-locked');
  document.body.style.overflow = '';
  // Reflect progress on the TOC if it's the visible view
  if(roIsBook && roChapters[roCurChIdx]){
    activeChId = roChapters[roCurChIdx].id;
    const toc = document.getElementById('libBookTOC');
    if(toc && toc.style.display !== 'none' && typeof renderTOC==='function') renderTOC();
  }
}

// ── Jump to a chapter via the dropdown ─────────────────
function roJumpToChapter(idx){
  idx = parseInt(idx,10);
  const ch = roChapters[idx];
  const scroller = document.getElementById('roScroll');
  if(!ch || !scroller) return;
  const el = document.getElementById('roCh-'+ch.id);
  if(!el) return;
  roCurChIdx = idx;
  scroller.scrollTo({top: Math.max(0, el.offsetTop - 24), behavior:'smooth'});
}

// ── Keyboard ───────────────────────────────────────────
function roKeyHandler(e){
  if(!roActive) return;
  const scroller = document.getElementById('roScroll');
  if(e.key==='Escape'){ exitReaderMode(); return; }
  if(!scroller) return;
  const page = scroller.clientHeight * 0.9;
  if(e.key==='ArrowDown'){ e.preventDefault(); scroller.scrollBy({top:90}); }
  else if(e.key==='ArrowUp'){ e.preventDefault(); scroller.scrollBy({top:-90}); }
  else if(e.key===' '||e.key==='PageDown'){ e.preventDefault(); scroller.scrollBy({top:page,behavior:'smooth'}); }
  else if(e.key==='PageUp'){ e.preventDefault(); scroller.scrollBy({top:-page,behavior:'smooth'}); }
}

// ── Scroll: progress bar + current chapter + bookmark ──
function roOnScroll(){
  const scroller = document.getElementById('roScroll');
  if(!scroller) return;
  const max = scroller.scrollHeight - scroller.clientHeight;
  const pct = max>0 ? scroller.scrollTop/max : 0;
  const fill = document.getElementById('roProgressFill');
  if(fill) fill.style.width = (pct*100)+'%';
  if(roIsBook && roChapters.length){
    const probe = scroller.scrollTop + 90;
    let idx = 0;
    document.querySelectorAll('.ro-chapter').forEach(sec=>{
      if(sec.offsetTop <= probe) idx = parseInt(sec.dataset.idx,10)||0;
    });
    if(idx !== roCurChIdx){
      roCurChIdx = idx;
      const sel = document.getElementById('roChapterSelect');
      if(sel && +sel.value !== idx) sel.value = idx;
    }
  }
  if(roScrollSaveT) clearTimeout(roScrollSaveT);
  roScrollSaveT = setTimeout(saveReaderBookmark, 400);
  // Near the very bottom → completion screen
  if(roIsBook && max>0 && scroller.scrollTop >= max - 8 && typeof checkBookCompletion==='function'){
    checkBookCompletion();
  }
}

function saveReaderBookmark(){
  if(!roIsBook || !currentBookId || !roChapters.length) return;
  const scroller = document.getElementById('roScroll');
  const ch = roChapters[roCurChIdx];
  if(!ch || !scroller) return;
  const el = document.getElementById('roCh-'+ch.id);
  const within = el ? Math.max(0, scroller.scrollTop - el.offsetTop + 24) : 0;
  try{
    localStorage.setItem(bmKey(currentBookId), JSON.stringify({
      bookId: currentBookId, chId: ch.id, chIdx: roCurChIdx,
      chNum: ch.num||roCurChIdx+1, chTitle: ch.title,
      scrollWithin: Math.round(within), savedAt: Date.now()
    }));
  }catch(e){}
}

// ── Font ───────────────────────────────────────────────
function roSetFont(size, silent){
  if(!RO_FONTS.includes(size)) size='md';
  roCurFont=size;
  const ov=document.getElementById('readerOverlay');
  RO_FONTS.forEach(f=>ov.classList.remove('ro-font-'+f));
  ov.classList.add('ro-font-'+size);
  if(!silent) localStorage.setItem('roFont',size);
  document.querySelectorAll('.ro-font-btn').forEach((btn,i)=>{
    const on = RO_FONTS[i]===size;
    btn.style.color       = on?'var(--gold)':'';
    btn.style.borderColor = on?'rgba(200,164,90,.4)':'transparent';
  });
}

// ── Theme (sepia / light / dark) ───────────────────────
function roSetTheme(theme, silent){
  const themes=['sepia','light','dark'];
  if(!themes.includes(theme)) theme='sepia';
  roCurTheme=theme;
  const ov=document.getElementById('readerOverlay');
  themes.forEach(t=>ov.classList.remove('ro-theme-'+t));
  ov.classList.add('ro-theme-'+theme);
  if(!silent) localStorage.setItem('roTheme',theme);
  document.querySelectorAll('.ro-theme-btn').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.th===theme);
  });
}

// ══════════════════════════════════════════════════════
// BOOKMARK + TABLE OF CONTENTS
// ══════════════════════════════════════════════════════

// ── Bookmark helpers ───────────────────────────────────
function bmKey(bookId){ return 'bm_' + bookId; }

function loadBookmark(bookId){
  try{ return JSON.parse(localStorage.getItem(bmKey(bookId))); }
  catch(e){ return null; }
}

function clearBookmark(bookId){
  localStorage.removeItem(bmKey(bookId));
}

// ── TOC ── single book view ────────────────────────────
function showTOC(){
  document.getElementById('libBookTOC').style.display = 'block';
}

async function renderTOC(){
  const bm = loadBookmark(currentBookId);
  const tocList   = document.getElementById('tocList');
  const tocEmpty  = document.getElementById('tocEmpty');
  const resumeWrap = document.getElementById('tocResumeWrap');
  const resumeBtn  = document.getElementById('tocResumeBtn');
  const bookTitle  = document.getElementById('bookDetailTitle')?.textContent || '';
  // Fetch book for status badge
  const{data:tocBook} = await sb.from('books').select('status,total_chapters').eq('id',currentBookId).single();
  const tocStatus = tocBook?.status||'in_progress';
  const tocStatusLabel = tocStatus==='complete'?'Complete':'In Progress';
  const tocStatusEl = document.getElementById('tocStatusBadge');
  if(tocStatusEl){
    tocStatusEl.textContent = tocStatusLabel;
    tocStatusEl.className = 'book-spine-status ' + tocStatus;
    tocStatusEl.style.display = 'inline-block';
    tocStatusEl.style.position = 'static';
    tocStatusEl.style.marginLeft = '.8rem';
    tocStatusEl.style.verticalAlign = 'middle';
    tocStatusEl.style.fontSize = '.55rem';
  }
  document.getElementById('tocBookTitle').textContent = bookTitle;

  // Show resume button if bookmark exists
  if(bm){
    resumeWrap.style.display = 'block';
    resumeBtn.textContent = `✦ Resume — Ch.${bm.chNum}${bm.chTitle?' · '+bm.chTitle:''}`;
  } else {
    resumeWrap.style.display = 'none';
  }

  // Fetch chapters for TOC
  const{data:chs} = await sb.from('chapters')
    .select('id,num,title,content,published,position')
    .eq('book_id', currentBookId)
    .order('position', {ascending:true,nullsFirst:false})
    .order('num', {ascending:true});

  if(!chs || !chs.length){
    tocList.innerHTML = '';
    tocEmpty.style.display = 'block';
    return;
  }
  tocEmpty.style.display = 'none';
  tocChapters = chs;

  tocList.innerHTML = chs.map((ch,i) => {
    const words = (ch.content||'').replace(/<[^>]*>/g,'').split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.ceil(words / 200));
    const isBookmarked = bm && bm.chId === ch.id;
    const isDraft = !ch.published;
    const last = i===chs.length-1;
    const admin = `
      <div class="toc-admin admin-only" onclick="event.stopPropagation()">
        <button class="toc-ctl" title="Move up" onclick="moveTocChapter(${i},-1)"${i===0?' disabled':''}>↑</button>
        <button class="toc-ctl" title="Move down" onclick="moveTocChapter(${i},1)"${last?' disabled':''}>↓</button>
        <button class="toc-ctl${ch.published?' on':''}" title="${ch.published?'Unpublish (make draft)':'Publish'}" onclick="toggleTocPublish('${ch.id}')">${ch.published?'●':'○'}</button>
        <button class="toc-ctl danger" title="Delete chapter" onclick="deleteTocChapter('${ch.id}')">✕</button>
      </div>`;
    return `
    <div class="toc-row${isBookmarked?' has-bookmark':''}" onclick="tocOpenChapter('${ch.id}')">
      <span class="toc-num">${ch.num||i+1}</span>
      <div class="toc-info">
        <span class="toc-title">${ch.title}</span>
        <span class="toc-meta">
          ${mins} min read
          ${isDraft?'<span class="toc-draft-pill admin-only">draft</span>':''}
          ${isBookmarked?`<span style="color:var(--gold);opacity:.8">✦ bookmarked</span>`:''}
        </span>
      </div>
      ${admin}
      <span class="toc-arrow">→</span>
    </div>`;
  }).join('');

  showTOC();
}

// ── TOC admin controls (single source of book management) ──
async function moveTocChapter(idx,dir){
  const arr=[...tocChapters];
  const j=idx+dir;
  if(j<0||j>=arr.length)return;
  [arr[idx],arr[j]]=[arr[j],arr[idx]];
  await Promise.all(arr.map((c,i)=>sb.from('chapters').update({position:i}).eq('id',c.id)));
  await renderTOC();
}

async function toggleTocPublish(id){
  const ch=tocChapters.find(c=>c.id===id);if(!ch)return;
  const newState=!ch.published;
  const{error}=await sb.from('chapters').update({published:newState}).eq('id',id);
  if(error){toast('Error updating','error');return;}
  toast(newState?'Chapter published':'Chapter set to draft');
  await renderTOC();
  autoUpdateBookStatus(currentBookId);
}

async function deleteTocChapter(id){
  if(!confirm('Delete this chapter? This cannot be undone.'))return;
  const{error}=await sb.from('chapters').delete().eq('id',id);
  if(error){toast('Error deleting','error');return;}
  if(activeChId===id)activeChId=null;
  toast('Chapter deleted');
  await renderTOC();
  autoUpdateBookStatus(currentBookId);
}

// Reading routes — keep the TOC underneath so exiting the reader returns here.
async function tocOpenChapter(chId){
  activeChId = chId;
  await enterReaderMode({chId});
}

async function startFromBeginning(){
  await enterReaderMode({top:true});
}

async function resumeReading(){
  const bm = loadBookmark(currentBookId);
  await enterReaderMode(bm ? {chId: bm.chId} : {top:true});
}

// ══════════════════════════════════════════════════════
// SERIES MANAGEMENT
// ══════════════════════════════════════════════════════

function handleSeriesSelect(){
  const val = document.getElementById('bookSeriesId').value;
  document.getElementById('seriesOrderWrap').style.display = val ? 'block' : 'none';
}

function openNewSeriesInline(){
  const wrap = document.getElementById('newSeriesInline');
  wrap.style.display = wrap.style.display === 'none' ? 'flex' : 'none';
}

function cancelNewSeries(){
  document.getElementById('newSeriesInline').style.display = 'none';
  document.getElementById('newSeriesName').value = '';
  document.getElementById('newSeriesTotalBooks').value = '';
}

async function createSeriesAndSelect(){
  const name = document.getElementById('newSeriesName').value.trim();
  if(!name){ toast('Please enter a series name','error'); return; }
  const total_books = parseInt(document.getElementById('newSeriesTotalBooks').value) || 0;
  const{data,error} = await sb.from('series').insert({name, total_books}).select().single();
  if(error){ toast('Error creating series','error'); return; }
  // Add to dropdown and select it
  const sel = document.getElementById('bookSeriesId');
  const opt = document.createElement('option');
  opt.value = data.id; opt.textContent = data.name;
  sel.appendChild(opt);
  sel.value = data.id;
  handleSeriesSelect();
  cancelNewSeries();
  toast('Series created — "' + data.name + '"');
}

async function openSeriesModal(seriesId){
  const{data:s} = await sb.from('series').select('*').eq('id',seriesId).single();
  if(!s) return;
  const name = prompt('Series name:', s.name);
  if(name === null) return;
  const total = prompt('Total books planned:', s.total_books || '');
  if(total === null) return;
  const{error} = await sb.from('series').update({
    name: name.trim(),
    total_books: parseInt(total) || 0
  }).eq('id', seriesId);
  if(error){ toast('Error updating series','error'); return; }
  toast('Series updated'); loadBooks();
}

// ══════════════════════════════════════════════════════
// BOOK COMPLETION SCREEN
// ══════════════════════════════════════════════════════

async function checkBookCompletion(){
  if(!currentBookId || !roIsBook || !roChapters.length) return;
  // Only trigger once the last chapter is in view
  if(roCurChIdx + 1 < roChapters.length) return;

  // Check if already seen
  if(localStorage.getItem('completed_' + currentBookId)) return;

  // Fetch book + series info
  const{data:book} = await sb.from('books')
    .select('*, series:series_id(id,name,total_books)')
    .eq('id', currentBookId).single();
  if(!book) return;

  const isComplete = book.status === 'complete';
  const overlay = document.getElementById('bookCompleteOverlay');
  const ser = book.series;

  // Build constellation SVG
  const svgEl = document.getElementById('completeSVG');
  svgEl.innerHTML = makeCelestialSVG(currentBookId, 400, 200);

  if(isComplete){
    document.getElementById('completeEyebrow').textContent = 'You finished it.';
    document.getElementById('completeTitle').textContent = book.title;
    if(ser){
      const seriesEl = document.getElementById('completeSeries');
      seriesEl.textContent = `Book ${book.series_order || 1} of ${ser.total_books || '?'} · ${ser.name}`;
      seriesEl.style.display = 'block';
      document.getElementById('completeNote').textContent =
        `You've read every page. Thank you for being here for this one. The story continues — Book ${(book.series_order||1)+1} is coming.`;
    } else {
      document.getElementById('completeNote').textContent =
        'You\'ve read every page. Thank you for being here for this one.';
    }
    localStorage.setItem('completed_' + currentBookId, '1');
  } else {
    // Caught up — book still in progress
    document.getElementById('completeEyebrow').textContent = 'You\'re all caught up.';
    document.getElementById('completeTitle').textContent = book.title;
    if(ser){
      const seriesEl = document.getElementById('completeSeries');
      seriesEl.textContent = ser.name;
      seriesEl.style.display = 'block';
    }
    document.getElementById('completeNote').textContent =
      'You\'ve reached the last published chapter. More is coming — check back soon.';
  }

  // Fade in
  overlay.style.display = 'flex';
  requestAnimationFrame(()=>{ overlay.style.opacity = '1'; });
}

function dismissCompletion(){
  const overlay = document.getElementById('bookCompleteOverlay');
  overlay.style.opacity = '0';
  setTimeout(()=>{ overlay.style.display = 'none'; }, 800);
  // Don't exit reader mode — let user continue reading
}

// Auto-update book status when chapters are published/unpublished
async function autoUpdateBookStatus(bookId){
  const{data:book}=await sb.from('books').select('total_chapters').eq('id',bookId).single();
  if(!book?.total_chapters)return; // no target set — don't auto-change
  const{count}=await sb.from('chapters').select('id',{count:'exact',head:true}).eq('book_id',bookId).eq('published',true);
  const newStatus=count>=book.total_chapters?'complete':'in_progress';
  await sb.from('books').update({status:newStatus}).eq('id',bookId);
}

// ── SHARE ──────────────────────────────────────────────
function updateArticlePreview(){
  const content=(typeof quillGet!=='undefined'?quillGet('articleContentEditor'):null)||document.getElementById('articleContent')?.value||'';
  const preview=document.getElementById('articlePreviewBody');
  if(preview) preview.innerHTML=renderBody(content);
  const stripped=content.replace(/<[^>]*>/g,'');
  const words=stripped.split(/\s+/).filter(Boolean).length;
  const mins=Math.max(1,Math.ceil(words/200));
  const wc=document.getElementById('articleWordCount');if(wc) wc.textContent=words.toLocaleString()+' words';
  const rt=document.getElementById('articleReadTime');if(rt) rt.textContent=mins+' min read';
}
function triggerArticlePasteClean(){
  navigator.clipboard.read().then(async items=>{
    for(const item of items){
      if(item.types.includes('text/html')){
        const blob=await item.getType('text/html');
        const cleaned=cleanGoogleDocs(await blob.text());
        if(typeof quillSet!=='undefined') quillSet('articleContentEditor',cleaned);
        else document.getElementById('articleContent').value=cleaned;
        toast('Cleaned and pasted from clipboard','success');return;
      }
      if(item.types.includes('text/plain')){
        const blob=await item.getType('text/plain');
        const text=await blob.text();
        if(typeof quillSet!=='undefined') quillSet('articleContentEditor',text);
        else document.getElementById('articleContent').value=text;
        toast('Pasted as plain text','success');return;
      }
    }
  }).catch(()=>{
    const q=typeof _quillInstances!=='undefined'?_quillInstances['articleContentEditor']:null;
    if(q) q.focus();
    toast('Paste with Ctrl+V — auto-clean will run','success');
  });
}
function insertArticleFmt(prefix){
  const ta=document.getElementById('articleContent');
  const start=ta.selectionStart,end=ta.selectionEnd;
  ta.value=ta.value.substring(0,start)+'\n\n'+prefix+(ta.value.substring(start,end)||'…')+'\n\n'+ta.value.substring(end);
  updateArticlePreview();ta.focus();
}
// Auto-clean paste into article editor
document.addEventListener('paste',e=>{
  // Let Quill handle its own paste via clipboard module
  const active=document.activeElement;
  if(active&&active.closest&&active.closest('.ql-editor')) return;
  if(active.id!=='articleContent') return;
  const html=e.clipboardData.getData('text/html');
  if(html&&(html.includes('google')||html.includes('docs-'))){
    e.preventDefault();
    if(typeof quillSet!=='undefined') quillSet('articleContentEditor',cleanGoogleDocs(html));
    else document.getElementById('articleContent').value=cleanGoogleDocs(html);
    toast('Google Docs formatting cleaned','success');
  }
  setTimeout(updateArticlePreview,50);
});
function openArticleModal(id=null){
  document.getElementById('articleModalTitle').textContent=id?'Edit Article':'New Article';
  document.getElementById('editArticleId').value=id||'';
  if(id){
    sb.from('articles').select('*').eq('id',id).single().then(({data:a})=>{
      document.getElementById('articleTitle').value=a?.title||'';
      document.getElementById('articleTag').value=a?.tag||'';
      document.getElementById('articleBanner').value=a?.banner_image||'';
      quillSet('articleContentEditor',a?.content||'');
      setTimeout(()=>{ if(typeof updateArticlePreview==='function') updateArticlePreview(); },50);
    });
  } else {
    document.getElementById('articleTitle').value='';
    document.getElementById('articleTag').value='';
    document.getElementById('articleBanner').value='';
    quillSet('articleContentEditor','');
  }
  openModal('articleModal');
}

async function saveArticle(){
  const title=document.getElementById('articleTitle').value.trim(),tag=document.getElementById('articleTag').value.trim(),content=(typeof _articleRawHtml!=='undefined'&&_articleRawHtml)||(typeof quillGet!=='undefined'?quillGet('articleContentEditor'):null)||document.getElementById('articleContent').value.trim(),banner_image=document.getElementById('articleBanner').value.trim()||null;
  if(!title||!content){alert('Please add a title and content.');return}
  const editId=document.getElementById('editArticleId').value;
  setLoading('articleSaveBtn',true);
  const{error}=editId?await sb.from('articles').update({title,tag,content,banner_image}).eq('id',editId):await sb.from('articles').insert({title,tag,content,banner_image});
  setLoading('articleSaveBtn',false,'Save');
  if(error){toast('Error saving','error');return}
  _articleRawHtml=null;if(typeof clearArticleRawHtml==='function')clearArticleRawHtml();toast(editId?'Article updated':'Article created');closeModal('articleModal');loadArticles();
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

function closeArticleReader(){showLibBrowse();loadArticles();switchLibTab('Articles',document.querySelectorAll('.lib-tab')[1]);safePush({sub:'articles'},'','#articles');}

async function deleteArticle(id,fromReader=false){
  if(!confirm('Delete this article?'))return;
  await sb.from('articles').delete().eq('id',id);
  toast('Article deleted');if(fromReader)closeArticleReader();else loadArticles();
}

function toggleArticleHtmlImport(){
  const panel = document.getElementById('articleHtmlImport');
  const btn = document.getElementById('htmlImportToggle');
  const open = panel.style.display === 'none';
  panel.style.display = open ? 'block' : 'none';
  if(btn) btn.style.background = open ? 'rgba(200,164,90,.15)' : '';
  if(open) document.getElementById('articleHtmlRaw').focus();
}

// Stores raw HTML when bypassing Quill (for tables/code/complex markup)
let _articleRawHtml = null;

function importArticleHtml(){
  const raw = document.getElementById('articleHtmlRaw').value.trim();
  if(!raw){ toast('No HTML to import','error'); return; }

  // Store raw HTML directly — don't push through Quill which strips tables/code
  _articleRawHtml = raw;

  // Show a read-only indicator in the Quill editor area
  const editorEl = document.getElementById('articleContentEditor');
  if(editorEl){
    const q = _quillInstances['articleContentEditor'];
    if(q) q.enable(false); // disable Quill editing
    editorEl.style.opacity = '0.5';
    editorEl.title = 'Rich HTML imported — editing disabled. Clear to use editor.';
  }

  // Show a notice badge
  let badge = document.getElementById('articleHtmlBadge');
  if(!badge){
    badge = document.createElement('div');
    badge.id = 'articleHtmlBadge';
    badge.style.cssText = 'background:rgba(200,164,90,.12);border:1px solid rgba(200,164,90,.3);border-radius:4px;padding:.4rem .8rem;font-family:JetBrains Mono,monospace;font-size:.62rem;color:var(--gold);display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:.5rem';
    badge.innerHTML = '<span>✦ Rich HTML imported — tables & code preserved</span><button onclick="clearArticleRawHtml()" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:.9rem" title="Clear and re-enable editor">✕</button>';
    editorEl?.parentNode?.insertBefore(badge, editorEl.nextSibling);
  }
  badge.style.display = 'flex';

  document.getElementById('articleHtmlRaw').value = '';
  toggleArticleHtmlImport();

  // Update preview directly from raw HTML
  const preview = document.getElementById('articlePreviewBody');
  if(preview) preview.innerHTML = raw;
  const stripped = raw.replace(/<[^>]*>/g,'');
  const words = stripped.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1,Math.ceil(words/200));
  const wc = document.getElementById('articleWordCount'); if(wc) wc.textContent = words.toLocaleString()+' words';
  const rt = document.getElementById('articleReadTime'); if(rt) rt.textContent = mins+' min read';

  toast('HTML imported — tables & code preserved','success');
}

function clearArticleRawHtml(){
  _articleRawHtml = null;
  const editorEl = document.getElementById('articleContentEditor');
  const q = _quillInstances?.['articleContentEditor'];
  if(q){ q.enable(true); q.setText(''); }
  if(editorEl){ editorEl.style.opacity='1'; editorEl.title=''; }
  const badge = document.getElementById('articleHtmlBadge');
  if(badge) badge.style.display = 'none';
  if(typeof updateArticlePreview==='function') updateArticlePreview();
  toast('Editor cleared','success');
}


function shareArticle(){
  const artId = typeof currentArticleId !== 'undefined' ? currentArticleId : null;
  const url   = artId
    ? window.location.origin + '/library#article/' + artId
    : window.location.href;
  copyShareLink(url, 'Article link copied!');
}

function copyShareLink(url, msg){
  if(navigator.share){
    navigator.share({ url }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(url).then(()=>{
      toast('✦ ' + msg, 'success');
    }).catch(()=>{
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = url;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toast('✦ ' + msg, 'success');
    });
  }
}
