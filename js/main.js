const{createClient}=supabase;
const sb=createClient('https://lbviiggrxzhyxrpivbbi.supabase.co','sb_publishable_eQRvx-J1Cp4nlq6Q6TOjIA__QYJmJq6');

function toast(msg,type='success'){const t=document.getElementById('toast');t.textContent=msg;t.className=`toast ${type} visible`;setTimeout(()=>t.classList.remove('visible'),3000)}

(function(){
  // Only enable custom cursor on non-touch devices
  if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    document.body.classList.add('has-custom-cursor');
    const c=document.getElementById('cursor'),r=document.getElementById('cursorRing');
    let mx=0,my=0,rx=0,ry=0;
    document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;const fl=document.getElementById('flameCursor');if(fl){fl.style.left=e.clientX+'px';fl.style.top=e.clientY+'px';}});
    (function tick(){rx+=(mx-rx)*.18;ry+=(my-ry)*.18;c.style.transform=`translate(${mx-5}px,${my-5}px)`;r.style.transform=`translate(${rx-18}px,${ry-18}px)`;requestAnimationFrame(tick)})();
  }
})();

const canPush=(()=>{try{return window.self===window.top&&window.location.href!=='about:srcdoc';}catch(e){return false;}})();
function safePush(state,title,url){if(canPush)try{history.pushState(state,title,url);}catch(e){}}


sb.auth.onAuthStateChange((event,session)=>{if(session)grantAdmin();else revokeAdmin()});

function toggleAdmin(){if(adminMode)sb.auth.signOut();else{openModal('loginModal');setTimeout(()=>document.getElementById('loginEmail').focus(),100)}}

async function doLogin(){
  const email=document.getElementById('loginEmail').value.trim(),pw=document.getElementById('loginPw').value,btn=document.getElementById('loginBtn');
  btn.innerHTML=constellationLoader(true)+' Signing in…';btn.disabled=true;
  const{error}=await sb.auth.signInWithPassword({email,password:pw});
  btn.innerHTML='Sign In';btn.disabled=false;
  if(error){document.getElementById('loginError').classList.add('visible')}
  else{closeModal('loginModal');document.getElementById('loginPw').value='';document.getElementById('loginError').classList.remove('visible')}
}

function grantAdmin(){adminMode=true;document.body.classList.add('is-admin');document.getElementById('adminBadge').classList.add('visible');document.getElementById('lockBtn').textContent='🔓';document.getElementById('lockBtn').title='Sign out';toast('Admin mode on')}
function revokeAdmin(){adminMode=false;document.body.classList.remove('is-admin');document.getElementById('adminBadge').classList.remove('visible');document.getElementById('lockBtn').textContent='🔒';document.getElementById('lockBtn').title='Admin login'}

function showPage(name,skipHistory){
  if(typeof stopChapterReadTimer==='function') stopChapterReadTimer();
  if(name==='library') setTimeout(()=>{if(typeof startChapterReadTimer==='function')startChapterReadTimer();},500);
  const pages=['home','about','projects','library','lab','contact'];
  if(!pages.includes(name))name='home';
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-center a').forEach(a=>a.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.getElementById('nav-'+name).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(initReveal,60);
  if(name==='library')loadLibrary();
  if(name==='lab')loadLab();
  if(name==='projects')loadProjects();
  if(!skipHistory)safePush({page:name},'','#'+name);
}
// Handle browser back/forward
window.addEventListener('popstate',e=>{
  const state=e.state;
  if(state?.sub==='book'){openBook(state.id,state.title,state.desc,true);return;}
  if(state?.sub==='article'){
    sb.from('articles').select('*').eq('id',state.id).single().then(({data:a})=>{if(a)openArticle(a,true);});return;
  }
  const name=state?.page||location.hash.split('/')[0].replace('#','')||'home';
  showPage(name,true);
});
// On load, restore from hash
(function(){
  const hash=location.hash;
  const parts=hash.replace('#','').split('/');
  const page=parts[0]||'home';
  const sub=parts[1];const id=parts[2];
  if(page==='library'&&sub==='book'&&id){
    showPage('library',true);
    // Wait for library to load then open the book
    const tryOpen=()=>{
      const{data:b}=sb.from('books').select('*').eq('id',id).single().then(({data:b})=>{
        if(b)openBook(b.id,b.title,b.description,true);
      });
    };
    setTimeout(tryOpen,600);
  } else if(page==='library'&&sub==='article'&&id){
    showPage('library',true);
    setTimeout(()=>{
      sb.from('articles').select('*').eq('id',id).single().then(({data:a})=>{if(a)openArticle(a,true);});
    },600);
  } else if(page){
    showPage(page,true);
  } else {
    showPage('home',true);
  }
})();

let _revealObs=null;
var projFilter='all';
function initReveal(){
  if(_revealObs)_revealObs.disconnect();
  _revealObs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('visible');
        e.target.querySelectorAll('.sb').forEach(b=>b.style.width=b.dataset.w+'%');
        _revealObs.unobserve(e.target);
      }
    });
  },{threshold:.1,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal:not(.visible)').forEach(el=>_revealObs.observe(el));
}
initReveal();

function filterP(cat,btn){document.querySelectorAll('.fb').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.pcard').forEach(c=>{c.style.display=(cat==='all'||(c.dataset.cat||'').split(' ').includes(cat))?'':'none'})}
function handleSubmit(e){
  e.preventDefault();
  const form=document.getElementById('the-form');
  const data=new FormData(form);
  fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(data).toString()})
    .then(()=>{
      form.style.display='none';
      document.getElementById('form-success').style.display='block';
    })
    .catch(()=>toast('Something went wrong. Try emailing calebthede@gmail.com directly.','error'));
}
function openModal(id){document.getElementById(id).classList.add('open')}
function closeModal(id){document.getElementById(id).classList.remove('open')}
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')}));
function setLoading(btnId,loading,label){const b=document.getElementById(btnId);if(!b)return;b.innerHTML=loading?constellationLoader(true)+' Saving…':label;b.disabled=loading}
function renderBody(content){return(content||'').split('\n\n').map(p=>p.trim().startsWith('###')?`<h3>${p.replace(/^###\s*/,'')}</h3>`:`<p>${p}</p>`).join('')}
function fmtDate(iso){if(!iso)return'';return new Date(iso).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
function refreshAdmin(el){if(adminMode)el.querySelectorAll('.admin-only').forEach(x=>x.style.removeProperty('display'))}

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
  if(!skipHistory)safePush({page:'library',sub:'book',id,title,desc},'','#library/book/'+id);
}
function closeBookDetail(){showLibBrowse();loadBooks();safePush({page:'library'},'','#library');}

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
  const title=document.getElementById('articleTitle').value.trim(),tag=document.getElementById('articleTag').value.trim(),content=typeof quillGet!=='undefined'?quillGet('articleContentEditor'):document.getElementById('articleContent').value.trim(),banner_image=document.getElementById('articleBanner').value.trim()||null;
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
  if(!skipHistory)safePush({page:'library',sub:'article',id:a.id},'','#library/article/'+a.id);
}

function closeArticleReader(){showLibBrowse();loadArticles();switchLibTab('Articles',document.querySelectorAll('.lib-tab')[1]);safePush({page:'library'},'','#library');}

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
    });
  } else {
    ['projTitle','projSubtitle','projDesc','projTags','projGithub','projFigma','projDemo','projBanner'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('projCategory').value='Development';
    document.getElementById('projSort').value='0';
    document.getElementById('projHighlight').value='false';
  }
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
  await Promise.all([loadStatus(), loadBookTeaser(), loadRecentlyAdded(), loadHighlightedProject()]);
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
  const{data:books}=await sb.from('books').select('id,title,description').order('created_at',{ascending:true}).limit(1);
  if(!books||!books.length)return;
  const b=books[0];
  document.getElementById('btTitle').textContent=b.title;
  document.getElementById('btDesc').textContent=b.description||'A book weaving together mythology and psychology — ancient stories as a lens for modern human behavior.';
  document.getElementById('bookTeaser').style.display='block';
}

async function loadRecentlyAdded(){
  const[{data:articles},{data:labs}]=await Promise.all([
    sb.from('articles').select('id,title,created_at').order('created_at',{ascending:false}).limit(1),
    sb.from('lab_entries').select('id,title,created_at').order('created_at',{ascending:false}).limit(1)
  ]);
  const a=articles&&articles[0],l=labs&&labs[0];
  if(!a&&!l)return;
  let item,source,page;
  if(a&&l){item=new Date(a.created_at)>new Date(l.created_at)?{...a,src:'lib'}:{...l,src:'lab'}}
  else{item=a?{...a,src:'lib'}:{...l,src:'lab'}}
  source=item.src;page=source==='lib'?'library':'lab';
  document.getElementById('recentSource').textContent=source==='lib'?'Library':'Lab';
  document.getElementById('recentSource').className='recent-source '+(source==='lib'?'lib':'lab');
  document.getElementById('recentTitle').textContent=item.title;
  document.getElementById('recentDate').textContent=fmtDate(item.created_at);
  document.getElementById('recentLink').onclick=()=>showPage(page);
  document.getElementById('recentStrip').style.display='block';
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

// ══ THEME ══
function toggleTheme(){
  const light=document.body.classList.toggle('light-mode');
  document.getElementById('themeBtn').textContent=light?'🌑':'🌙';
  localStorage.setItem('ct_theme',light?'light':'dark');
}
(function initTheme(){
  if(localStorage.getItem('ct_theme')==='light'){
    document.body.classList.add('light-mode');
    document.getElementById('themeBtn').textContent='🌑';
  }
})();

// ══ CHAPTER EDITOR ══
function cleanGoogleDocs(html){
  const d=document.createElement('div');d.innerHTML=html;
  // Remove script/style/comments
  d.querySelectorAll('script,style,meta,link').forEach(el=>el.remove());
  // Convert headings
  d.querySelectorAll('h1,h2').forEach(el=>{el.outerHTML='\n\n### '+el.textContent.trim()+'\n\n'});
  d.querySelectorAll('h3,h4,h5,h6').forEach(el=>{el.outerHTML='\n\n#### '+el.textContent.trim()+'\n\n'});
  // Convert blockquotes
  d.querySelectorAll('blockquote').forEach(el=>{el.outerHTML='\n\n> '+el.textContent.trim()+'\n\n'});
  // Paragraphs and line breaks → double newline
  d.querySelectorAll('p').forEach(el=>{el.outerHTML='\n\n'+el.textContent.trim()+'\n\n'});
  d.querySelectorAll('br').forEach(el=>{el.outerHTML='\n'});
  // List items
  d.querySelectorAll('li').forEach(el=>{el.outerHTML='\n- '+el.textContent.trim()});
  // Get text
  let text=d.textContent||d.innerText||'';
  // Collapse 3+ newlines to 2
  text=text.replace(/\n{3,}/g,'\n\n').trim();
  return text;
}

function triggerPasteClean(){
  navigator.clipboard.read().then(async items=>{
    for(const item of items){
      if(item.types.includes('text/html')){
        const blob=await item.getType('text/html');
        const html=await blob.text();
        const cleaned=cleanGoogleDocs(html);
        document.getElementById('chContent').value=cleaned;
        updateChPreview();
        toast('Cleaned and pasted from clipboard','success');
        return;
      }
      if(item.types.includes('text/plain')){
        const blob=await item.getType('text/plain');
        const text=await blob.text();
        document.getElementById('chContent').value=text;
        updateChPreview();
        toast('Pasted as plain text','success');
        return;
      }
    }
  }).catch(()=>{
    // Fallback: focus textarea and let browser paste natively, then clean
    const ta=document.getElementById('chContent');ta.focus();
    toast('Paste with Ctrl+V — auto-clean will run','success');
  });
}

// Auto-clean on paste into the textarea
document.addEventListener('paste',e=>{
  if(document.activeElement.id!=='chContent')return;
  const html=e.clipboardData.getData('text/html');
  if(html&&html.includes('google')||html.includes('docs-')||html.includes('id="docs-')){
    e.preventDefault();
    const cleaned=cleanGoogleDocs(html);
    document.getElementById('chContent').value=cleaned;
    updateChPreview();
    toast('Google Docs formatting cleaned','success');
  }
  // plain paste falls through normally, then update preview
  setTimeout(updateChPreview,50);
});

function updateChPublishedLbl(){
  const checked=document.getElementById('chPublished').checked;
  const lbl=document.getElementById('chPublishedLbl');
  const track=document.getElementById('chToggleTrack');
  lbl.textContent=checked?'Published — visible':'Draft — hidden';
  lbl.classList.toggle('on',checked);
  if(track)track.classList.toggle('on',checked);
}
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('chPublished').addEventListener('change',updateChPublishedLbl);
});

function updateChPreview(){
  const content=document.getElementById('chContent').value||'';
  document.getElementById('chPreviewBody').innerHTML=renderBody(content);
  const words=content.split(/\s+/).filter(Boolean).length;
  const pages=Math.max(0,Math.ceil(words/WORDS_PER_PAGE));
  document.getElementById('chWordCount').textContent=words.toLocaleString()+' words';
  document.getElementById('chPageEst').textContent='~'+pages+' page'+(pages===1?'':'s');
}

function insertFmt(prefix){
  const ta=document.getElementById('chContent');
  const start=ta.selectionStart,end=ta.selectionEnd;
  const before=ta.value.substring(0,start),after=ta.value.substring(end);
  const sel=ta.value.substring(start,end);
  ta.value=before+'\n\n'+prefix+(sel||'…')+'\n\n'+after;
  updateChPreview();ta.focus();
}
function toggleMobileNav(){
  const d=document.getElementById('mobileDrawer'),h=document.getElementById('hamburger');
  d.classList.toggle('open');h.classList.toggle('open');
  document.body.style.overflow=d.classList.contains('open')?'hidden':'';
}
function closeMobileNav(){
  document.getElementById('mobileDrawer').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  document.body.style.overflow='';
}

// Update mobile nav active state
const origShowPage = showPage;
window.showPage = function(name, skipHistory){
  origShowPage(name, skipHistory);
  document.querySelectorAll('.mobile-nav-item').forEach(el=>el.classList.remove('active'));
  const mn=document.getElementById('mnav-'+name);
  if(mn)mn.classList.add('active');
}

// ══ EASTER EGGS ══

// 1. Konami code: ↑↑↓↓←→←→BA
const KONAMI=[38,38,40,40,37,39,37,39,66,65];
let konamiIdx=0;
document.addEventListener('keydown',e=>{
  if(e.keyCode===KONAMI[konamiIdx]){
    konamiIdx++;
    if(konamiIdx===KONAMI.length){konamiIdx=0;triggerKonami()}
  } else {konamiIdx=0}
});

function triggerKonami(){
  const o=document.getElementById('konamiOverlay');
  o.classList.add('visible');
  document.body.style.overflow='hidden';
  document.querySelectorAll('.kf').forEach((el,i)=>setTimeout(()=>el.classList.add('show'),300+i*180));
}
function closeKonami(){
  document.getElementById('konamiOverlay').classList.remove('visible');
  document.body.style.overflow='';
  document.querySelectorAll('.kf').forEach(el=>el.classList.remove('show'));
}

// 2. Triple-click the logo — secret toast
let logoClicks=0,logoTimer=null;
document.querySelector('.nav-logo').addEventListener('click',()=>{
  logoClicks++;
  clearTimeout(logoTimer);
  if(logoClicks===3){
    logoClicks=0;
    toast('👀 You found one. There are more hidden around the site.','success');
  } else {logoTimer=setTimeout(()=>logoClicks=0,600)}
});

// 3. Hover the footer copyright 5x fast
let footerHovers=0,footerTimer=null;
document.addEventListener('mouseover',e=>{
  if(e.target.closest('footer span:first-child')){
    footerHovers++;clearTimeout(footerTimer);
    footerTimer=setTimeout(()=>footerHovers=0,1200);
    if(footerHovers>=5){footerHovers=0;toast('🧠 Psychology + Code. Two paths, one direction.','success')}
  }
});

// 4. Type "myth" anywhere (not in an input) to trigger a toast
let typedBuffer='';
document.addEventListener('keypress',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  typedBuffer=(typedBuffer+e.key).slice(-6).toLowerCase();
  if(typedBuffer.includes('myth')){typedBuffer='';toast('✦ The mythology book is in the Library. Give it a read.','success')}
  if(typedBuffer.includes('caleb')){typedBuffer='';triggerShootingStar();toast('👋 Hey, that\'s me.','success')}
  if(typedBuffer.includes('ziggi')){typedBuffer='';toast('☕ Ziggi\'s Coffee — where the capstone app was born. Good espresso too.','success')}
  if(typedBuffer.slice(-2)==='qa'){typedBuffer='';toast('🧪 // test passed · no bugs found · probably.','success')}
});

// 5. Type "ziggi" → coffee easter egg
// 6. Type "qa" → QA engineer joke
// (typedBuffer already tracks keypress — just extend the checks)

// 7. Click the teal/gold palette swatch on about stat cards 7 times
let statClicks=0,statTimer=null;
document.addEventListener('click',e=>{
  if(e.target.closest('.stat')){
    statClicks++;clearTimeout(statTimer);
    statTimer=setTimeout(()=>statClicks=0,2000);
    if(statClicks>=7){statClicks=0;toast('🎨 Teal for logic. Gold for meaning. You clicked seven times to find that out.','success')}
  }
});

// 8. Idle on the Library page for 30s without clicking
let libraryIdleTimer=null;
function resetLibraryIdle(){
  clearTimeout(libraryIdleTimer);
  if(document.getElementById('page-library').classList.contains('active')){
    libraryIdleTimer=setTimeout(()=>{
      toast('📖 Still here? The book is waiting. Chapter one is a good place to start.','success');
    },30000);
  }
}
document.addEventListener('mousemove',resetLibraryIdle);
document.addEventListener('keydown',resetLibraryIdle);

// 9. Scroll to the very bottom of the contact page and back up 3 times
let contactScrollDir=null,contactScrollCount=0;
document.addEventListener('scroll',()=>{
  if(!document.getElementById('page-contact').classList.contains('active'))return;
  const atBottom=window.innerHeight+window.scrollY>=document.body.offsetHeight-20;
  const atTop=window.scrollY<20;
  if(atBottom&&contactScrollDir!=='bottom'){contactScrollDir='bottom';if(contactScrollCount<6)contactScrollCount++}
  if(atTop&&contactScrollDir!=='top'){contactScrollDir='top';if(contactScrollCount<6)contactScrollCount++}
  if(contactScrollCount>=6){contactScrollCount=0;toast('📬 You really want to reach out. Just hit send — I read everything.','success')}
},{ passive:true });


// ── SHOOTING STAR ────────────────────────────────────────────────────────────
const ssCanvas = document.getElementById('shootingStarCanvas');
const ssCtx = ssCanvas.getContext('2d');
let ssParticles = [];
let ssAnimId = null;

function resizeSSCanvas(){
  ssCanvas.width = window.innerWidth;
  ssCanvas.height = window.innerHeight;
}
resizeSSCanvas();
window.addEventListener('resize', resizeSSCanvas);

function shootStar(fromX, fromY, toX, toY, onExplode){
  // Star trail
  let progress = 0;
  const duration = 600;
  const startTime = performance.now();
  const trail = [];

  function animateStar(now){
    progress = Math.min((now - startTime) / duration, 1);
    const x = fromX + (toX - fromX) * easeInQuad(progress);
    const y = fromY + (toY - fromY) * easeInQuad(progress);

    trail.push({x, y, alpha: 1});
    trail.forEach((p, i) => p.alpha = (i / trail.length) * 0.6);
    if(trail.length > 22) trail.shift();

    ssCtx.clearRect(0, 0, ssCanvas.width, ssCanvas.height);

    // Draw trail
    trail.forEach(p => {
      ssCtx.beginPath();
      ssCtx.arc(p.x, p.y, 1.5, 0, Math.PI*2);
      ssCtx.fillStyle = `rgba(200,164,90,${p.alpha})`;
      ssCtx.fill();
    });

    // Draw star head
    ssCtx.beginPath();
    ssCtx.arc(x, y, 3.5, 0, Math.PI*2);
    ssCtx.fillStyle = '#fff';
    ssCtx.shadowColor = '#C8A45A';
    ssCtx.shadowBlur = 12;
    ssCtx.fill();
    ssCtx.shadowBlur = 0;

    if(progress < 1){
      requestAnimationFrame(animateStar);
    } else {
      explodeStar(toX, toY);
      if(onExplode) onExplode();
    }
  }
  requestAnimationFrame(animateStar);
}

function easeInQuad(t){ return t*t }

function explodeStar(x, y){
  const colors = ['#ff6b6b','#ff9f43','#ffd32a','#0be881','#67e8f9','#a78bfa','#f472b6','#fff','#C8A45A','#4EC9B0'];
  const particles = Array.from({length:55}, (_, i) => {
    const angle = (i / 55) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 2 + Math.random() * 5;
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random()*colors.length)],
      alpha: 1,
      size: 1 + Math.random() * 2.5,
      decay: 0.012 + Math.random() * 0.018,
      gravity: 0.08
    };
  });

  // Rainbow flash — JS driven so colors actually cycle
  startRainbow();

  function animateExplosion(){
    ssCtx.clearRect(0, 0, ssCanvas.width, ssCanvas.height);
    let alive = false;
    particles.forEach(p => {
      if(p.alpha <= 0) return;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.97;
      p.alpha -= p.decay;

      ssCtx.beginPath();
      ssCtx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ssCtx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2,'0');
      ssCtx.shadowColor = p.color;
      ssCtx.shadowBlur = 4;
      ssCtx.fill();
    });
    ssCtx.shadowBlur = 0;
    if(alive) requestAnimationFrame(animateExplosion);
    else ssCtx.clearRect(0, 0, ssCanvas.width, ssCanvas.height);
  }
  requestAnimationFrame(animateExplosion);
}

// Trigger: random edge → center-ish target
function triggerShootingStar(){
  const w = window.innerWidth, h = window.innerHeight;
  const fromX = Math.random() < 0.5 ? 0 : w;
  const fromY = Math.random() * h * 0.5;
  const toX = w * 0.3 + Math.random() * w * 0.4;
  const toY = h * 0.3 + Math.random() * h * 0.4;
  shootStar(fromX, fromY, toX, toY);
}

// Fire on: konami, secret finds, random every 90–180s
function scheduleRandomStar(){
  const delay = 120000 + Math.random() * 80000;
  setTimeout(()=>{ triggerShootingStar(); scheduleRandomStar(); }, delay);
}
scheduleRandomStar();


// ── BLUE FLAME CURSOR ────────────────────────────────────────────────────────
var flameActive = false;
var flameTimeout = null;

function activateFlameCursor(duration=30000){
  if(flameActive) clearTimeout(flameTimeout);
  flameActive = true;
  document.body.classList.add('flame-cursor');
  toast('🔵 A blue flame awakens…','success');
  flameTimeout = setTimeout(()=>{
    flameActive = false;
    document.body.classList.remove('flame-cursor');
  }, duration);
}

// Trigger 1: Spend 60 seconds on the Library page
var chapterReadTimer=null;
function startChapterReadTimer(){
  clearTimeout(chapterReadTimer);
  chapterReadTimer = setTimeout(()=>{
    if(document.getElementById('page-library').classList.contains('active')){
      activateFlameCursor(45000);
    }
  }, 60000);
}
function stopChapterReadTimer(){ clearTimeout(chapterReadTimer); }

// Trigger 2: Hold mousedown on any book card for 3 seconds
var bookHoldTimer=null;
document.addEventListener('mousedown', e=>{
  const cover = e.target.closest('.book-card');
  if(cover){
    bookHoldTimer = setTimeout(()=>{ activateFlameCursor(); }, 3000);
  }
});
document.addEventListener('mouseup', ()=>clearTimeout(bookHoldTimer));
document.addEventListener('mouseleave', ()=>clearTimeout(bookHoldTimer));


// Constellation loader helper
function constellationLoader(small=false){
  const s = small ? 24 : 48;
  const cx = s/2, cy = s/2, r = s*0.38;
  // 5 stars on a circle
  const stars = Array.from({length:5},(_,i)=>{
    const a = (i/5)*Math.PI*2 - Math.PI/2;
    return {x: cx+Math.cos(a)*r, y: cy+Math.sin(a)*r};
  });
  const lines = [[0,1],[1,2],[2,3],[3,4],[4,0],[0,2]];
  const linesHTML = lines.map(([a,b])=>
    `<line x1="${stars[a].x.toFixed(1)}" y1="${stars[a].y.toFixed(1)}" x2="${stars[b].x.toFixed(1)}" y2="${stars[b].y.toFixed(1)}" stroke="var(--gold)" stroke-width=".6" opacity=".3"/>`
  ).join('');
  const starsHTML = stars.map((st,i)=>
    `<circle class="star-pulse" cx="${st.x.toFixed(1)}" cy="${st.y.toFixed(1)}" r="1.5" fill="var(--gold)" style="animation-delay:${i*0.18}s"/>`
  ).join('');
  const centerDot = `<circle cx="${cx}" cy="${cy}" r="1.2" fill="var(--teal)" opacity=".7"/>`;
  const orbitR = r*0.55;
  const orbitHTML = `<circle class="orbit-ring" cx="${(cx+orbitR).toFixed(1)}" cy="${cy}" r="1.5" fill="var(--teal)" opacity=".6"/>`;
  const label = small ? '' : `<span style="color:var(--text-dim);font-family:'JetBrains Mono',monospace;font-size:.65rem;letter-spacing:.2em;text-transform:uppercase">Loading…</span>`;
  return `<span class="const-loader"><svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">${linesHTML}${starsHTML}${centerDot}${orbitHTML}</svg>${label}</span>`;
}

// Patch loading-spinner spans — replace on DOM changes
function upgradeSpinners(root=document){
  root.querySelectorAll('.loading-spinner').forEach(el=>{
    if(!el.dataset.upgraded){
      el.dataset.upgraded='1';
      el.outerHTML = constellationLoader(true);
    }
  });
}
const _spinnerObserver = new MutationObserver(()=>upgradeSpinners());
_spinnerObserver.observe(document.body,{childList:true,subtree:true});


// ── JS RAINBOW CYCLER ────────────────────────────────────────────────────────
var rainbowTimer = null;
var rainbowColors = [
  ['#ff6b6b','#ff6b6b','#cc4444','#cc4444'],
  ['#ff9f43','#ff9f43','#cc7a28','#cc7a28'],
  ['#ffd32a','#ffd32a','#ccaa00','#ccaa00'],
  ['#0be881','#0be881','#09b864','#09b864'],
  ['#67e8f9','#67e8f9','#3abcd4','#3abcd4'],
  ['#a78bfa','#a78bfa','#7c5cd4','#7c5cd4'],
  ['#f472b6','#f472b6','#c44d90','#c44d90'],
  ['#fb923c','#fb923c','#c96a1a','#c96a1a'],
];
var rainbowOrig = ['#4EC9B0','#C8A45A','#2C7A6A','#8A6E37'];

function startRainbow(){
  clearInterval(rainbowTimer);
  console.log('startRainbow called, light-mode:', document.body.classList.contains('light-mode'));
  if(document.body.classList.contains('light-mode')){
    startLightGlow();
    return;
  }
  var idx=0, total=rainbowColors.length*4;
  var root=document.body;
  rainbowTimer=setInterval(()=>{
    if(document.body.classList.contains('light-mode')){clearInterval(rainbowTimer);root.style.removeProperty('--teal');root.style.removeProperty('--gold');root.style.removeProperty('--teal-dim');root.style.removeProperty('--gold-dim');startLightGlow();return;}
    var col=rainbowColors[idx % rainbowColors.length];
    root.style.setProperty('--teal',col[0]);
    root.style.setProperty('--gold',col[1]);
    root.style.setProperty('--teal-dim',col[2]);
    root.style.setProperty('--gold-dim',col[3]);
    idx++;
    if(idx>=total){
      clearInterval(rainbowTimer);
      // Remove inline styles so CSS vars take over naturally
      root.style.removeProperty('--teal');
      root.style.removeProperty('--gold');
      root.style.removeProperty('--teal-dim');
      root.style.removeProperty('--gold-dim');
    }
  }, 500);
}

// Light mode: warm sunset color sweep
function startLightGlow(){
  var root=document.body;
  var lightOrig=['#0A7A60','#9A5C0A','#0D9E7A','#C47820'];
  // warm ember sweep — pure warm tones, no blues or purples
  var sunsetColors=[
    ['#E8920A','#E8A020','#C47010','#C47010'],
    ['#E86A10','#E87010','#C04010','#B05010'],
    ['#D84020','#D85020','#B02010','#A03010'],
    ['#C82030','#C83020','#A01020','#901020'],
    ['#D43050','#C82030','#A82040','#901020'],
    ['#E06030','#D04020','#B04020','#902010'],
    ['#E88020','#E89010','#C06010','#B07010'],
    ['#C8A020','#C8A040','#9A7810','#9A6010'],
    lightOrig,
  ];
  var idx=0, total=(sunsetColors.length-1)*4;
  var glowTimer=setInterval(()=>{
    var col=sunsetColors[idx % (sunsetColors.length-1)];
    root.style.setProperty('--teal',col[0]);
    root.style.setProperty('--gold',col[1]);
    root.style.setProperty('--teal-dim',col[2]);
    root.style.setProperty('--gold-dim',col[3]);
    idx++;
    if(idx>=total){
      clearInterval(glowTimer);
      root.style.removeProperty('--teal');
      root.style.removeProperty('--gold');
      root.style.removeProperty('--teal-dim');
      root.style.removeProperty('--gold-dim');
    }
  }, 500);
}

// Load home data on start
loadHomeData();
