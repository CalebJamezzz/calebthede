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
function switchLibTab(tab,el){document.querySelectorAll('.lib-tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.lib-panel').forEach(p=>p.classList.remove('active'));el.classList.add('active');document.getElementById('lib'+tab).classList.add('active')}

let currentBookId=null,activeChId=null;

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
  const{data:books}=await sb.from('books').select('*').order('created_at',{ascending:false});
  const{data:chapters}=await sb.from('chapters').select('id,book_id,content');
  container.innerHTML='';
  if(!books||!books.length){empty.style.display='flex';return}
  empty.style.display='none';
  const groups=[
    {key:'in_progress',label:'In Progress',books:[]},
    {key:'complete',   label:'Complete',   books:[]},
    {key:'draft',      label:'Drafts',     books:[],adminOnly:true},
  ];
  books.forEach(b=>{
    const g=groups.find(g=>g.key===(b.status||'in_progress'))||groups[0];
    g.books.push(b);
  });
  groups.forEach(group=>{
    if(!group.books.length)return;
    const section=document.createElement('div');
    section.style.cssText='margin-bottom:3rem';
    if(group.adminOnly)section.classList.add('admin-only','blk');
    const hdr=document.createElement('div');hdr.className='lib-section-header';hdr.style.marginBottom='1.5rem';
    hdr.innerHTML=`<h3 style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:300;color:var(--text-dim);letter-spacing:.05em">${group.label}</h3>`;
    section.appendChild(hdr);
    const grid=document.createElement('div');grid.className='books-grid';
    group.books.forEach(b=>{
      const count=(chapters||[]).filter(c=>c.book_id===b.id).length;
      const card=document.createElement('div');card.className='book-card';
      const bgStyle=b.cover_image?`background:${b.color||COVERS[0]};background-image:url(${b.cover_image});background-size:cover;background-position:center`:`background:${b.color||COVERS[0]}`;
      const chs=(chapters||[]).filter(ch=>ch.book_id===b.id);
      const totalWords=chs.reduce((sum,ch)=>sum+(ch.content||'').split(/\s+/).filter(Boolean).length,0);
      const pageCount=Math.max(0,Math.ceil(totalWords/WORDS_PER_PAGE))||'—';
      const readMins=totalWords>0?Math.max(1,Math.ceil(totalWords/200)):'—';
      card.innerHTML=`
        <div class="book-spine">
          <div class="book-spine-bg" style="${bgStyle}"></div>
          <div class="book-spine-svg">${makeCelestialSVG(b.id)}</div>
          <div class="book-spine-content">
            <span class="book-spine-title">${b.title}</span>
          </div>
        </div>
        <div class="book-foot">
          <div class="book-foot-title">${b.title}</div>
          <div class="book-foot-meta">
            <span style="color:var(--teal)">${count} ch</span>
            <span>${pageCount} pg</span>
            <span>${readMins} min</span>
          </div>
          <div class="admin-only" style="margin-top:.5rem">
            <button class="btn-sm" style="width:100%" onclick="event.stopPropagation();openBookModal('${b.id}')">Edit</button>
          </div>
        </div>`;
      card.onclick=()=>openBook(b.id,b.title,b.description);
      grid.appendChild(card);refreshAdmin(card);
    });
    section.appendChild(grid);
    container.appendChild(section);
    refreshAdmin(section);
  });
}

function openBookModal(id=null){
  document.getElementById('bookModalTitle').textContent=id?'Edit Book':'New Book';
  document.getElementById('editBookId').value=id||'';
  if(id){sb.from('books').select('*').eq('id',id).single().then(({data:b})=>{document.getElementById('bookTitle').value=b?.title||'';document.getElementById('bookDesc').value=b?.description||'';document.getElementById('bookCoverImage').value=b?.cover_image||'';document.getElementById('bookStatus').value=b?.status||'in_progress';selectedCover=b?.color||COVERS[0];buildSwatches(selectedCover)})}
  else{document.getElementById('bookTitle').value='';document.getElementById('bookDesc').value='';document.getElementById('bookCoverImage').value='';document.getElementById('bookStatus').value='in_progress';selectedCover=COVERS[0];buildSwatches()}
  openModal('bookModal');
}

async function saveBook(){
  const title=document.getElementById('bookTitle').value.trim();if(!title){alert('Please add a title.');return}
  const description=document.getElementById('bookDesc').value.trim(),color=document.getElementById('bookColor').value||selectedCover,cover_image=document.getElementById('bookCoverImage').value.trim()||null,status=document.getElementById('bookStatus').value,editId=document.getElementById('editBookId').value;
  setLoading('bookSaveBtn',true);
  const{error}=editId?await sb.from('books').update({title,description,color,cover_image,status}).eq('id',editId):await sb.from('books').insert({title,description,color,cover_image,status});
  setLoading('bookSaveBtn',false,'Save Book');
  if(error){toast('Error saving book','error');return}
  toast(editId?'Book updated':'Book created');closeModal('bookModal');loadBooks();
}

async function openBook(id,title,desc,skipHistory){
  currentBookId=id;activeChId=null;
  document.getElementById('bookDetailTitle').textContent=title;
  document.getElementById('bookDetailDesc').textContent=desc||'';
  await renderBookDetail();showLibBookDetail();
  if(!skipHistory)safePush({sub:'book',id,title,desc},'','#book/'+id);
}
function closeBookDetail(){showLibBrowse();loadBooks();safePush({sub:'browse'},'','#');}

async function deleteCurrentBook(){
  if(!confirm('Delete this book and all its chapters?'))return;
  await sb.from('books').delete().eq('id',currentBookId);
  toast('Book deleted');closeBookDetail();
}

let chapterIndex=[],activeChIdx=-1;
const WORDS_PER_PAGE=250;
let bookTotalPages=0,chapterPageOffsets=[],estimatedPagesPerChapter=[],actualPagesPerChapter=[];

async function renderBookDetail(){
  const list=document.getElementById('chList'),empty=document.getElementById('chEmpty'),reader=document.getElementById('chReader'),tracker=document.getElementById('celestialTracker');
  list.innerHTML='<li style="font-family:JetBrains Mono,monospace;font-size:.6rem;color:var(--text-dim);padding:.5rem 0">Loading…</li>';
  // Admins see all chapters; public only sees published ones (RLS handles this server-side)
  const{data:chs,error:chErr}=await sb.from('chapters').select('id,num,title,content,published').eq('book_id',currentBookId).order('num',{ascending:true});
  if(chErr)console.warn('chapters fetch:',chErr);
  list.innerHTML='';chapterIndex=chs||[];
  if(!chapterIndex.length){empty.style.display='flex';empty.style.flexDirection='column';empty.style.alignItems='center';reader.style.display='none';tracker.style.display='none';refreshAdmin(list.closest('.ch-sidebar'));return}
  empty.style.display='none';
  let pageCount=1;chapterPageOffsets=[];estimatedPagesPerChapter=[];actualPagesPerChapter=[];
  chapterIndex.forEach(ch=>{
    chapterPageOffsets.push(pageCount);
    const est=Math.max(1,Math.ceil(((ch.content||'').split(/\s+/).filter(Boolean).length)/WORDS_PER_PAGE));
    estimatedPagesPerChapter.push(est);
    actualPagesPerChapter.push(null);
    pageCount+=est;
  });
  bookTotalPages=pageCount-1;
  chapterIndex.forEach((ch,i)=>{
    const li=document.createElement('li');li.className='ch-item';li.dataset.id=ch.id;li.dataset.idx=i;
    const draftPill=ch.published===false?`<span class="ch-draft-pill">draft</span>`:'';li.innerHTML=`<span class="ch-num-lbl">${ch.num||i+1}</span>${ch.title}${draftPill}`;
    li.onclick=()=>showChapter(ch.id,i);list.appendChild(li);
  });
  refreshAdmin(list.closest('.ch-sidebar'));
  buildStarDots();tracker.style.display='flex';
  const startIdx=activeChId?chapterIndex.findIndex(c=>c.id===activeChId):0;
  showChapter(chapterIndex[Math.max(0,startIdx)].id,Math.max(0,startIdx));
}

function buildStarDots(){
  const container=document.getElementById('starDots');container.innerHTML='';
  if(!chapterIndex.length)return;
  if(chapterIndex.length===1){container.style.justifyContent='center';}else{container.style.justifyContent='space-between';}
  const total=chapterIndex.length,maxDots=Math.min(total,48),step=total/maxDots;
  for(let i=0;i<maxDots;i++){
    const chIdx=Math.min(Math.round(i*step),total-1),ch=chapterIndex[chIdx];
    const dot=document.createElement('div');dot.className='star-dot';dot.dataset.idx=chIdx;
    dot.innerHTML=`<span class="star-dot-tooltip">Ch. ${ch.num||chIdx+1} · ${ch.title}</span>`;
    dot.onclick=()=>showChapter(ch.id,chIdx);container.appendChild(dot);
  }
}

function updateStarDots(idx){
  const total=chapterIndex.length,dots=[...document.querySelectorAll('.star-dot')],maxDots=dots.length,step=total/maxDots;
  dots.forEach((dot,i)=>{
    const chIdx=Math.min(Math.round(i*step),total-1);
    dot.classList.remove('done','current');
    if(chIdx<idx)dot.classList.add('done');
    else if(chIdx===idx)dot.classList.add('current');
  });
  document.getElementById('constellationFill').style.width=(total>1?(idx/(total-1))*100:100)+'%';
}

// ══ PAGE PAGINATION ══
let currentPages=[],currentPageIdx=0;

function paginateContent(content,wordsPerPage){
  const blocks=(content||'').split(/\n\n+/).map(b=>b.trim()).filter(Boolean);
  const pages=[];let cur=[],wc=0;
  blocks.forEach(b=>{
    const bw=b.replace(/<[^>]*>/g,'').split(/\s+/).filter(Boolean).length;
    if(wc>0&&wc+bw>wordsPerPage){pages.push(cur.join('\n\n'));cur=[b];wc=bw;}
    else{cur.push(b);wc+=bw;}
  });
  if(cur.length)pages.push(cur.join('\n\n'));
  return pages.length?pages:[''];
}

function renderPage(pageIdx){
  document.getElementById('chBodyArea').innerHTML=renderBody(currentPages[pageIdx]||'');
  updatePageNav(pageIdx);
}

function updatePageNav(pageIdx){
  const total=currentPages.length,nav=document.getElementById('pageNav');
  if(total<=1){nav.style.display='none';return}
  nav.style.display='flex';
  // Recalculate absolute page using actual counts for all preceding chapters
  let absPage=1;
  for(let i=0;i<activeChIdx;i++) absPage+=(actualPagesPerChapter[i]||estimatedPagesPerChapter[i]||1);
  absPage+=pageIdx;
  const atFirst=pageIdx===0,atLast=pageIdx===total-1;
  document.getElementById('pagePrevBtn').disabled=atFirst;
  document.getElementById('pageNextBtn').disabled=atLast;
  document.getElementById('pageFirstBtn').disabled=atFirst;
  document.getElementById('pageLastBtn').disabled=atLast;
  document.getElementById('pageNavInfo').innerHTML=
    `Page\u00a0<strong>${absPage}</strong>\u00a0of ${bookTotalPages}<br>`+
    `<span style="opacity:.55">Chapter page ${pageIdx+1} of ${total}</span>`;
}


function scrollToChapterTop(){
  const tracker=document.getElementById('celestialTracker');
  const trackerH=tracker&&tracker.offsetParent?tracker.offsetHeight:0;
  const navH=72;
  const header=document.getElementById('chReader');
  if(!header)return;
  const top=header.getBoundingClientRect().top+window.scrollY-(navH+trackerH);
  window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
}
async function togglePublish(){
  const ch=chapterIndex[activeChIdx];if(!ch)return;
  const newState=!ch.published;
  const{error}=await sb.from('chapters').update({published:newState}).eq('id',ch.id);
  if(error){toast('Error updating','error');return;}
  ch.published=newState;
  toast(newState?'Chapter published — now visible to readers':'Chapter unpublished — draft only');
  document.getElementById('chPublishBtn').textContent=newState?'Unpublish':'Publish';
  document.getElementById('chPublishBtn').style.borderColor=newState?'rgba(78,201,176,.4)':'';
  document.getElementById('chPublishBtn').style.color=newState?'var(--teal)':'';
  // refresh sidebar draft pill
  document.querySelectorAll('.ch-item').forEach((el,i)=>{
    if(i===activeChIdx){
      const pill=el.querySelector('.ch-draft-pill');
      if(newState&&pill)pill.remove();
      else if(!newState&&!pill){const p=document.createElement('span');p.className='ch-draft-pill';p.textContent='draft';el.appendChild(p);}
    }
  });
}

function jumpToPage(target){
  const idx=target==='last'?currentPages.length-1:0;
  currentPageIdx=idx;renderPage(idx);scrollToChapterTop();
}

function jumpToChapter(target){
  const idx=target==='last'?chapterIndex.length-1:0;
  showChapter(chapterIndex[idx].id,idx);
}

function stepPage(dir){
  const next=currentPageIdx+dir;
  if(next<0){stepChapter(-1);return}
  if(next>=currentPages.length){stepChapter(1);return}
  currentPageIdx=next;renderPage(next);
  scrollToChapterTop();
}

async function showChapter(id,idx){
  activeChId=id;activeChIdx=idx;
  const body=document.getElementById('chBodyArea'),reader=document.getElementById('chReader');
  reader.style.display='block';document.getElementById('chEmpty').style.display='none';
  const focusBtn=document.getElementById('focusReaderBtn');if(focusBtn)focusBtn.style.display='flex';
  body.innerHTML='<div class="reader-loading">'+constellationLoader()+'</div>';
  document.getElementById('pageNav').style.display='none';
  document.getElementById('chEyebrow').textContent='';document.getElementById('chTitleH').textContent='';
  document.querySelectorAll('.ch-item').forEach((li,i)=>li.classList.toggle('active',i===idx));
  updateStarDots(idx);
  const{data:ch}=await sb.from('chapters').select('*').eq('id',id).single();
  if(!ch){body.innerHTML='<p style="color:var(--danger)">Chapter not found.</p>';return}
  const total=chapterIndex.length;
  document.getElementById('chEyebrow').textContent=`Chapter ${ch.num||idx+1}`;
  document.getElementById('chTitleH').textContent=ch.title;
  currentPages=paginateContent(ch.content,WORDS_PER_PAGE);
  // Update bookTotalPages with actual page count for this chapter
  if(actualPagesPerChapter[idx]!==currentPages.length){
    actualPagesPerChapter[idx]=currentPages.length;
    bookTotalPages=chapterPageOffsets.reduce((sum,_,i)=>sum+(actualPagesPerChapter[i]||estimatedPagesPerChapter[i]||1),0);
  }
  currentPageIdx=0;renderPage(0);
  const atFirst=idx===0,atLast=idx===total-1;
  document.getElementById('chPrevBtn').disabled=atFirst;
  document.getElementById('chNextBtn').disabled=atLast;
  document.getElementById('chFirstBtn').disabled=atFirst;
  document.getElementById('chLastBtn').disabled=atLast;
  document.getElementById('chNavProgress').textContent=`${idx+1} of ${total}`;
  const pageStart=chapterPageOffsets[idx]||1,pageEnd=Math.min(pageStart+currentPages.length-1,bookTotalPages);
  document.getElementById('celestialMeta').innerHTML=
    `<strong>Chapter\u00a0${idx+1}</strong> of ${total}<br>`+
    `Pages\u00a0<strong>${pageStart}\u2013${pageEnd}</strong> of ${bookTotalPages}`;
  document.getElementById('chEditBtn').onclick=()=>openChModal(id,currentBookId);
  document.getElementById('chDeleteBtn').onclick=()=>deleteChapter(id);
  const publishBtn=document.getElementById('chPublishBtn');
  const isPublished=chapterIndex[idx]?.published;
  publishBtn.textContent=isPublished?'Unpublish':'Publish';
  publishBtn.style.borderColor=isPublished?'rgba(78,201,176,.4)':'';
  publishBtn.style.color=isPublished?'var(--teal)':'';
  scrollToChapterTop();
}

function stepChapter(dir){
  const next=activeChIdx+dir;
  if(next<0||next>=chapterIndex.length)return;
  showChapter(chapterIndex[next].id,next);
}


async function openChModal(id=null,bookId=null){
  document.getElementById('chModalTitle').textContent=id?'Edit Chapter':'Add Chapter';
  document.getElementById('editChId').value=id||'';document.getElementById('chBookId').value=bookId||currentBookId||'';
  if(id){const{data:ch}=await sb.from('chapters').select('*').eq('id',id).single();document.getElementById('chNum').value=ch?.num||'';document.getElementById('chTitle').value=ch?.title||'';document.getElementById('chContent').value=ch?.content||'';document.getElementById('chPublished').checked=ch?.published||false;updateChPublishedLbl();updateChPreview();}
  else{document.getElementById('chNum').value='';document.getElementById('chTitle').value='';document.getElementById('chContent').value='';document.getElementById('chPublished').checked=false;updateChPublishedLbl();updateChPreview();}
  openModal('chModal');
}

async function saveChapter(){
  const num=document.getElementById('chNum').value.trim(),title=document.getElementById('chTitle').value.trim(),content=document.getElementById('chContent').value.trim(),book_id=document.getElementById('chBookId').value,published=document.getElementById('chPublished').checked;
  if(!title||!content){alert('Please add a title and content.');return}
  const editId=document.getElementById('editChId').value;
  setLoading('chSaveBtn',true);
  const{error}=editId?await sb.from('chapters').update({num,title,content,published}).eq('id',editId):await sb.from('chapters').insert({num,title,content,published,book_id});
  setLoading('chSaveBtn',false,'Save');
  if(error){toast('Error saving chapter','error');return}
  toast(editId?'Chapter updated':'Chapter added');closeModal('chModal');await renderBookDetail();
}

async function deleteChapter(id){
  if(!confirm('Delete this chapter?'))return;
  await sb.from('chapters').delete().eq('id',id);
  if(activeChId===id)activeChId=null;
  toast('Chapter deleted');await renderBookDetail();
}



let currentArticleId=null;

async function loadArticles(){
  const grid=document.getElementById('articlesGrid'),empty=document.getElementById('articlesEmpty');
  grid.innerHTML='<div style="padding:2rem 0">'+constellationLoader()+'</div>';
  const{data:articles}=await sb.from('articles').select('*').order('created_at',{ascending:false});
  grid.innerHTML='';
  if(!articles||!articles.length){empty.style.display='block';return}
  empty.style.display='none';
  articles.forEach(a=>{
    const preview=(a.content||'').replace(/^###\s*/gm,'').slice(0,220)+'…';
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
// READER MODE — flat book paging across all chapters
// ══════════════════════════════════════════════════════
let roActive   = false;
let roFlat     = [];   // [{content, chIdx, chTitle, pageInCh, totalInCh}]
let roFlatIdx  = 0;    // index of left-page in flat array
let roIsBook   = true;
let roFlipping = false;

const RO_FONTS = ['sm','md','lg','xl'];
let roCurFont = localStorage.getItem('roFont') || 'md';

function roIsMobile(){ return window.innerWidth <= 768; }
function roSpread()  { return roIsMobile() ? 1 : 2; }

// ── Enter ──────────────────────────────────────────────
async function enterReaderMode(){
  const overlay = document.getElementById('readerOverlay');
  if(!overlay) return;

  const articleVisible = document.getElementById('libArticleReader').style.display !== 'none';
  roIsBook = !articleVisible;

  if(roIsBook){
    // Show a loading state immediately
    overlay.classList.add('active');
    document.body.classList.add('reader-locked');
    document.body.style.overflow = 'hidden';
    document.getElementById('roContentLeft').innerHTML =
      '<div style="opacity:.3;font-family:'JetBrains Mono',monospace;font-size:.7rem;letter-spacing:.1em">Loading…</div>';
    document.getElementById('roContentRight').innerHTML = '';

    // Fetch ALL published chapters for this book
    const {data:allChs} = await sb.from('chapters')
      .select('id,num,title,content')
      .eq('book_id', currentBookId)
      .eq('published', true)
      .order('num', {ascending:true});

    roFlat = [];
    (allChs||[]).forEach((ch,ci)=>{
      const pages = paginateContent(ch.content, 250);
      pages.forEach((pg,pi)=>{
        roFlat.push({
          content: pg,
          chIdx: ci,
          chId: ch.id,
          chNum: ch.num || (ci+1),
          chTitle: ch.title,
          pageInCh: pi,
          totalInCh: pages.length,
          totalChs: (allChs||[]).length
        });
      });
    });

    // Find where we currently are in the flat array
    roFlatIdx = roFlat.findIndex(p => p.chId === activeChId && p.pageInCh === currentPageIdx);
    if(roFlatIdx < 0) roFlatIdx = 0;

    // Align to even spread on desktop (left page always even index)
    if(roSpread() === 2 && roFlatIdx % 2 !== 0) roFlatIdx = Math.max(0, roFlatIdx - 1);

    const bookTitle = document.getElementById('bookDetailTitle')?.textContent || '';
    document.getElementById('roTitle').textContent = bookTitle;

  } else {
    // Article mode — paginate the article body
    const rawContent = document.getElementById('readerBody')?.innerHTML || '';
    const pages = paginateContent(rawContent, 250);
    roFlat = pages.map((pg,i)=>({content:pg, chIdx:0, chTitle:'', pageInCh:i, totalInCh:pages.length, totalChs:1}));
    roFlatIdx = 0;
    const artTitle = document.getElementById('readerTitle')?.textContent || '';
    document.getElementById('roTitle').textContent = artTitle;
    overlay.classList.add('active');
    document.body.classList.add('reader-locked');
    document.body.style.overflow = 'hidden';
  }

  roSetFont(roCurFont, true);
  roActive = true;
  roRender();
  roUpdateNav();
  roUpdateProgress();
  document.addEventListener('keydown', roKeyHandler);
}

// ── Exit ───────────────────────────────────────────────
function exitReaderMode(){
  document.getElementById('readerOverlay').classList.remove('active');
  document.body.classList.remove('reader-locked');
  document.body.style.overflow = '';
  roActive = false;
  document.removeEventListener('keydown', roKeyHandler);

  // Sync main reader back to current flat position
  if(roIsBook && roFlat.length){
    const cur = roFlat[roFlatIdx];
    if(cur && cur.chId !== activeChId){
      showChapter(cur.chId, cur.chIdx);
    } else if(cur){
      currentPageIdx = cur.pageInCh;
      renderPage(cur.pageInCh);
      scrollToChapterTop();
    }
  }
}

// ── Keyboard ───────────────────────────────────────────
function roKeyHandler(e){
  if(!roActive) return;
  if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();roStep(1);}
  if(e.key==='ArrowLeft' ||e.key==='ArrowUp')  {e.preventDefault();roStep(-1);}
  if(e.key==='Escape') exitReaderMode();
}

// ── Step ───────────────────────────────────────────────
function roStep(dir){
  if(roFlipping) return;
  const spread = roSpread();
  const next = roFlatIdx + dir * spread;
  if(next < 0 || next >= roFlat.length) return;
  roFlatIdx = next;
  roAnimate(dir > 0 ? 'forward' : 'back');
}

// ── Animate ────────────────────────────────────────────
function roAnimate(dir){
  roFlipping = true;
  const pagesEl = document.getElementById('roPages');
  const cls = dir==='forward' ? 'flip-forward' : 'flip-back';
  pagesEl.classList.add(cls);
  setTimeout(()=>{ roRender(); roUpdateNav(); roUpdateProgress(); }, 120);
  setTimeout(()=>{ pagesEl.classList.remove(cls); roFlipping=false; }, 300);
}

// ── Render ─────────────────────────────────────────────
function roRender(){
  const spread = roSpread();
  const left  = roFlat[roFlatIdx];
  const right = spread > 1 ? roFlat[roFlatIdx + 1] : null;
  const spine = document.querySelector('.ro-spine');
  const rightPage = document.querySelector('.ro-page-right');

  // Left page
  document.getElementById('roContentLeft').innerHTML = left ? renderBody(left.content) : '';
  document.getElementById('roNumLeft').innerHTML = left
    ? roPageLabel(roFlatIdx, left) : '';

  // Chapter break marker at the top of left if it starts a new chapter
  if(left && left.pageInCh === 0 && left.chIdx > 0){
    document.getElementById('roContentLeft').innerHTML =
      `<div style="font-family:'JetBrains Mono',monospace;font-size:.55rem;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:1.2rem;padding-bottom:.8rem;border-bottom:1px solid rgba(78,201,176,.15)">Chapter ${left.chNum} — ${left.chTitle}</div>`
      + document.getElementById('roContentLeft').innerHTML;
  }

  // Right page
  if(right){
    document.getElementById('roContentRight').innerHTML = renderBody(right.content);
    document.getElementById('roNumRight').innerHTML = roPageLabel(roFlatIdx+1, right);
    // Chapter break marker on right page
    if(right.pageInCh === 0 && right.chIdx > 0){
      document.getElementById('roContentRight').innerHTML =
        `<div style="font-family:'JetBrains Mono',monospace;font-size:.55rem;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:1.2rem;padding-bottom:.8rem;border-bottom:1px solid rgba(78,201,176,.15)">Chapter ${right.chNum} — ${right.chTitle}</div>`
        + document.getElementById('roContentRight').innerHTML;
    }
    if(spine) spine.style.visibility = 'visible';
    if(rightPage) rightPage.style.visibility = 'visible';
  } else {
    document.getElementById('roContentRight').innerHTML = '';
    document.getElementById('roNumRight').innerHTML = '';
    if(spine) spine.style.visibility = 'hidden';
    if(rightPage) rightPage.style.visibility = 'hidden';
  }
}

function roPageLabel(flatIdx, page){
  // Show flat page number out of total
  return `${flatIdx+1} <span style="opacity:.35">/ ${roFlat.length}</span>`;
}

// ── Nav ────────────────────────────────────────────────
function roUpdateNav(){
  const spread = roSpread();
  const atStart = roFlatIdx <= 0;
  const atEnd   = roFlatIdx + spread >= roFlat.length;

  document.getElementById('roPrevBtn').disabled = atStart;
  document.getElementById('roNextBtn').disabled = atEnd;

  // Chapter jump buttons — find first page of prev/next chapter
  const cur = roFlat[roFlatIdx];
  const prevChStart = cur ? roFlat.slice(0,roFlatIdx).reverse().find(p=>p.chIdx < cur.chIdx) : null;
  const nextChStart = cur ? roFlat.slice(roFlatIdx+1).find(p=>p.chIdx > cur.chIdx) : null;

  document.getElementById('roChPrevBtn').disabled = !prevChStart;
  document.getElementById('roChNextBtn').disabled = !nextChStart;

  // Center info — show which chapter(s) are visible
  const right = spread > 1 ? roFlat[roFlatIdx+1] : null;
  let chLabel = cur ? `Chapter ${cur.chNum}` : '';
  if(right && right.chIdx !== cur?.chIdx) chLabel += ` → ${right.chNum}`;
  document.getElementById('roChapterLabel').textContent = chLabel;

  // Page info
  const showing = (right && roFlatIdx+1 < roFlat.length)
    ? `${roFlatIdx+1}–${roFlatIdx+2}` : `${roFlatIdx+1}`;
  document.getElementById('roPageNum').textContent = showing;
  document.getElementById('roPageTotal').textContent = roFlat.length;
}

// ── Chapter jump ───────────────────────────────────────
function roJumpChapter(dir){
  const cur = roFlat[roFlatIdx];
  if(!cur) return;
  let target;
  if(dir > 0){
    target = roFlat.findIndex((p,i)=> i > roFlatIdx && p.chIdx > cur.chIdx && p.pageInCh===0);
  } else {
    // Find first page of the chapter before current
    const prevChIdx = roFlat.slice(0,roFlatIdx).reverse().find(p=>p.chIdx < cur.chIdx)?.chIdx;
    if(prevChIdx == null) return;
    target = roFlat.findIndex(p=>p.chIdx===prevChIdx && p.pageInCh===0);
  }
  if(target < 0) return;
  // Align to spread
  if(roSpread()===2 && target%2!==0) target=Math.max(0,target-1);
  roFlatIdx = target;
  roAnimate(dir>0?'forward':'back');
}

// ── Progress ───────────────────────────────────────────
function roUpdateProgress(){
  const fill = document.getElementById('roProgressFill');
  if(!fill || roFlat.length<=1) return;
  fill.style.width = (roFlatIdx/(roFlat.length-1)*100)+'%';
}

// ── Font ───────────────────────────────────────────────
function roSetFont(size, silent){
  if(!RO_FONTS.includes(size)) size='md';
  roCurFont=size;
  document.body.dataset.rfont=size;
  if(!silent) localStorage.setItem('roFont',size);
  document.querySelectorAll('.ro-font-btn').forEach((btn,i)=>{
    btn.style.color        = RO_FONTS[i]===size?'var(--gold)':'';
    btn.style.borderColor  = RO_FONTS[i]===size?'rgba(200,164,90,.4)':'transparent';
  });
}

// ── Resize handler ─────────────────────────────────────
window.addEventListener('resize',()=>{
  if(roActive){ roRender(); roUpdateNav(); }
});
