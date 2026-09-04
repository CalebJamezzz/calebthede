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

function _libShow(id,disp){const el=document.getElementById(id);if(el)el.style.display=disp;}
function showLibBrowse(){_libShow('libBrowse','block');_libShow('libBookDetail','none');_libShow('libArticleReader','none')}
function showLibBookDetail(){_libShow('libBrowse','none');_libShow('libBookDetail','block');_libShow('libArticleReader','none')}
function showLibArticleReader(){_libShow('libBrowse','none');_libShow('libBookDetail','none');_libShow('libArticleReader','block')}
// Legacy tab switcher — Library is now books-only and Marginalia is its own
// page, so there are no tabs. Kept as a guarded no-op for older history/hash
// entries that may still call it.
function switchLibTab(tab,el){
  if(!el||!el.classList)return;
  document.querySelectorAll('.lib-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.lib-panel').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  const panel=document.getElementById('lib'+tab);if(panel)panel.classList.add('active');
  safePush({sub:'tab',tab:tab.toLowerCase()},'','#'+tab.toLowerCase());
}

let currentBookId=null;

// Live tally for the hero legend card.
function libSetCount(id,n){const el=document.getElementById(id);if(el)el.textContent=n;}

// Page-aware: Library (/library) renders books; Marginalia (/marginalia)
// renders articles. Each loader no-ops if its container isn't on the page.
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
  if(!container)return; // not on the Library page
  container.innerHTML='<div style="padding:2rem 0">'+constellationLoader()+'</div>';
  const[{data:books},{data:allSeries}]=await Promise.all([
    sb.from('books').select('*').order('created_at',{ascending:true}),
    sb.from('series').select('*').order('created_at',{ascending:true})
  ]);
  container.innerHTML='';
  const isAdminBooks=document.body.classList.contains('is-admin');
  libSetCount('libCountBooks',(books||[]).filter(b=>isAdminBooks||b.status!=='draft').length);
  if(!books||!books.length){empty.style.display='flex';return}
  empty.style.display='none';
  window._allBooks=books;window._allSeries=allSeries;

  function makeBookCard(b){
    const statusLabel=b.status==='complete'?'Complete':b.status==='in_progress'?'In Progress':b.status==='hiatus'?'On Hiatus':'Draft';
    const statusClass=b.status||'in_progress';
    const availLabel=(b.retailer_links||[]).length?'Available now':'Coming soon';
    const blurbSnippet=(b.description||'').replace(/<[^>]*>/g,'').trim().slice(0,90);
    const hasCover=!!b.cover_image;

    const card=document.createElement('div');
    card.className='book-card '+(hasCover?'has-cover':'no-cover');

    let spineInner;
    if(hasCover){
      // A real cover already carries the title + author + badges — keep the art clean.
      spineInner=`<div class="book-spine-bg" style="background:${b.color||COVERS[0]};background-image:url(${b.cover_image});background-size:cover;background-position:${b.cover_position||'50% 50%'}"></div>`;
    }else{
      // No cover → generated placeholder: colour field + constellation + title & status overlay.
      const spineStatus=b.status!=='draft'
        ?`<div class="book-spine-status ${statusClass}">${statusLabel}</div>`
        :`<div class="book-spine-status in_progress admin-only blk">Draft</div>`;
      spineInner=`
        <div class="book-spine-bg" style="background:${b.color||COVERS[0]}"></div>
        <div class="book-spine-svg">${makeCelestialSVG(b.id)}</div>
        ${spineStatus}
        <div class="book-spine-content">
          <span class="book-spine-title">${b.title}</span>
        </div>`;
    }

    // On cover cards the status moves to the caption (it isn't painted on the art).
    const footStatus=hasCover
      ? `<span class="book-foot-status ${statusClass}${b.status==='draft'?' admin-only blk':''}">${statusLabel}</span>`
      : '';

    card.innerHTML=`
      <div class="book-spine">${spineInner}</div>
      <div class="book-foot">
        <div class="book-foot-title">${b.title}</div>
        <div class="book-foot-meta">
          <span style="color:var(--teal)">${availLabel}</span>
          ${blurbSnippet?`<span>${blurbSnippet}${blurbSnippet.length>=90?'…':''}</span>`:''}
        </div>
        ${footStatus}
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

    const section=document.createElement('div');
    section.className='series-band';
    const totalPlanned=ser.total_books||serBooks.length;
    section.innerHTML=`
      <div class="series-header">
        <div>
          <p class="series-eyebrow">Series · ${serBooks.length} of ${totalPlanned} published</p>
          <h3 class="series-title">${ser.name}</h3>
          <p class="series-meta">${ser.description||''}</p>
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
        const foot=card.querySelector('.book-foot')||card;
        const meta=foot.querySelector('.book-foot-meta');
        if(meta)foot.insertBefore(numBadge,meta);else foot.appendChild(numBadge);
      }
      grid.appendChild(card);
    });
    // Placeholder cards for unwritten books
    const written=allSerBooks.length;
    for(let i=written;i<totalPlanned;i++){
      const ph=document.createElement('div');ph.className='book-card book-card-placeholder';
      ph.innerHTML=`<div class="book-spine book-spine-placeholder"><span class="ph-glyph">✦</span><span class="ph-num">Book ${i+1}</span></div><div class="book-foot"><span class="ph-soon">Coming soon</span></div>`;
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
        document.getElementById('bookCoverPosition').value=b?.cover_position||'50% 50%';
        document.getElementById('bookStatus').value=b?.status||'draft';
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
      document.getElementById('bookCoverPosition').value='50% 50%';
      document.getElementById('bookStatus').value='in_progress';
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
  const box=document.getElementById('coverPreviewBox');
  const img=document.getElementById('coverPreviewImg');
  const clr=document.getElementById('coverClearBtn');
  const posInput=document.getElementById('bookCoverPosition');
  if(url){
    if(img){ img.src=url; img.style.objectPosition=posInput?.value||'50% 50%'; }
    if(prev)prev.style.display='block';
    if(clr)clr.style.display='inline-block';
    if(box){
      initFocalPicker(box, (x,y)=>{
        const pos=x+'% '+y+'%';
        if(posInput)posInput.value=pos;
        if(img)img.style.objectPosition=pos;
      });
      const [fx,fy]=(posInput?.value||'50% 50%').split(' ').map(v=>parseFloat(v)||50);
      setFocalMarker(box,fx,fy);
    }
  }
  else{ if(prev)prev.style.display='none'; if(clr)clr.style.display='none'; }
}

function onCoverUrlInput(){
  const status=document.getElementById('coverUploadStatus');if(status)status.textContent='';
  const posInput=document.getElementById('bookCoverPosition');if(posInput)posInput.value='50% 50%';
  refreshCoverPreview();
}

function clearCoverImage(){
  document.getElementById('bookCoverImage').value='';
  document.getElementById('bookCoverPosition').value='50% 50%';
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
  document.getElementById('bookCoverPosition').value='50% 50%';
  if(status){status.style.color='var(--teal)';status.textContent='✓ Uploaded';}
  refreshCoverPreview();
}

async function saveBook(){
  const title=document.getElementById('bookTitle').value.trim();if(!title){alert('Please add a title.');return}
  const editId=document.getElementById('editBookId').value;
  const description=document.getElementById('bookDesc').value.trim();
  const status=document.getElementById('bookStatus').value||'draft';
  const color=document.getElementById('bookColor').value||selectedCover;
  const cover_image=document.getElementById('bookCoverImage').value.trim()||null;
  const cover_position=document.getElementById('bookCoverPosition').value||'50% 50%';
  const series_id=document.getElementById('bookSeriesId').value||null;
  const series_order=document.getElementById('bookSeriesOrder').value?parseInt(document.getElementById('bookSeriesOrder').value):null;

  setLoading('bookSaveBtn',true);
  const{error}=editId
    ?await sb.from('books').update({title,description,color,cover_image,cover_position,status,series_id,series_order}).eq('id',editId)
    :await sb.from('books').insert({title,description,color,cover_image,cover_position,status,series_id,series_order});
  setLoading('bookSaveBtn',false,'Save Book');
  if(error){toast('Error saving book','error');return}
  toast(editId?'Book updated':'Book created');closeModal('bookModal');loadBooks();
}

async function openBook(id,title,desc,skipHistory){
  currentBookId=id;
  document.getElementById('bookDetailTitle').textContent=title;
  document.getElementById('bookDetailDesc').textContent=desc||'';
  showLibBookDetail();
  await renderBookPromo();
  if(!skipHistory)safePush({sub:'book',id,title,desc},'','#book/'+id);
  return true;
}
function closeBookDetail(){showLibBrowse();loadBooks();safePush({sub:'browse'},'','#');}

async function deleteCurrentBook(){
  if(!confirm('Delete this book?'))return;
  await sb.from('books').delete().eq('id',currentBookId);
  toast('Book deleted');closeBookDetail();
}

// ── Book promo page: blurb (in header), buy links, excerpt, reviews, launch note ──
function escHtml(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function bookReviewCard(r){
  const quote=(r&&r.quote||'').trim();
  if(!quote)return'';
  const source=(r&&r.source||'').trim();
  return `<div class="book-review-quote">"${escHtml(quote)}"${source?`<span class="book-review-source">${escHtml(source)}</span>`:''}</div>`;
}
async function renderBookPromo(){
  const{data:b}=await sb.from('books').select('*').eq('id',currentBookId).single();
  const buyRow=document.getElementById('bookBuyRow');
  const links=(b&&b.retailer_links)||[];
  buyRow.innerHTML=links.map(l=>`<a class="book-buy-btn" href="${escHtml(l.url||'#')}" target="_blank" rel="noopener">${escHtml(l.label||'Buy now')} →</a>`).join('');
  buyRow.style.display=links.length?'flex':'none';

  const excerptSection=document.getElementById('bookExcerptSection');
  const excerpt=(b&&b.excerpt||'').trim();
  document.getElementById('bookExcerptBody').innerHTML=renderBody(excerpt);
  excerptSection.style.display=excerpt?'block':'none';

  const reviewsSection=document.getElementById('bookReviewsSection');
  const reviews=(b&&b.reviews)||[];
  document.getElementById('bookReviewsBody').innerHTML=reviews.map(bookReviewCard).join('');
  reviewsSection.style.display=reviews.length?'block':'none';

  const launchSection=document.getElementById('bookLaunchSection');
  const launchNote=(b&&b.launch_note||'').trim();
  document.getElementById('bookLaunchBody').innerHTML=renderBody(launchNote);
  launchSection.style.display=launchNote?'block':'none';

  const empty=document.getElementById('bookPromoEmpty');
  empty.style.display=(!links.length&&!excerpt&&!reviews.length&&!launchNote)?'block':'none';
}

let currentArticleId=null;

let allArticles = [];
let activeArticleTag = null;

async function loadArticles(){
  const grid=document.getElementById('articlesGrid'),empty=document.getElementById('articlesEmpty');
  if(!grid)return; // not on the Marginalia page
  grid.innerHTML='<div style="padding:2rem 0">'+constellationLoader()+'</div>';
  const{data:articles}=await sb.from('articles').select('*').order('created_at',{ascending:false});
  grid.innerHTML='';
  libSetCount('libCountMarg',(articles||[]).length);
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

function closeArticleReader(){showLibBrowse();loadArticles();safePush({sub:'browse'},'','#');}

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
    ? window.location.origin + '/marginalia#article/' + artId
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

// ══════════════════════════════════════════════════════
// FOCUS READER — distraction-free scroll view for a Marginalia essay
// ══════════════════════════════════════════════════════
let roActive = false;
const RO_FONTS  = ['sm','md','lg','xl'];
let roCurFont   = localStorage.getItem('roFont')  || 'md';
let roCurTheme  = localStorage.getItem('roTheme') || 'sepia';

function roEsc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function enterReaderMode(){
  const overlay  = document.getElementById('readerOverlay');
  const inner    = document.getElementById('roScrollInner');
  const scroller = document.getElementById('roScroll');
  if(!overlay || !inner || !scroller) return;

  overlay.classList.add('active');
  requestAnimationFrame(()=>overlay.classList.add('ro-shown'));
  document.body.classList.add('reader-locked');
  document.body.style.overflow = 'hidden';
  roSetTheme(roCurTheme, true);
  roSetFont(roCurFont, true);
  roActive = true;

  const rawContent = document.getElementById('readerBody')?.innerHTML || '';
  const artTitle   = document.getElementById('readerTitle')?.textContent || '';
  document.getElementById('roTitle').textContent = artTitle;
  const selArt = document.getElementById('roChapterSelect');
  if(selArt){ selArt.innerHTML = ''; selArt.style.display = 'none'; }
  inner.innerHTML =
    '<section class="ro-chapter"><h2 class="ro-ch-title">'+roEsc(artTitle)+'</h2>'+
    '<div class="ro-ch-body">'+rawContent+'</div></section>';
  requestAnimationFrame(()=>{ scroller.scrollTop = 0; roOnScroll(); });

  scroller.addEventListener('scroll', roOnScroll, {passive:true});
  document.addEventListener('keydown', roKeyHandler);
}

function exitReaderMode(){
  const overlay  = document.getElementById('readerOverlay');
  const scroller = document.getElementById('roScroll');
  overlay.classList.remove('ro-shown');
  roActive = false;
  if(scroller) scroller.removeEventListener('scroll', roOnScroll);
  document.removeEventListener('keydown', roKeyHandler);
  setTimeout(()=>overlay.classList.remove('active'), 220);
  document.body.classList.remove('reader-locked');
  document.body.style.overflow = '';
}

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

function roOnScroll(){
  const scroller = document.getElementById('roScroll');
  if(!scroller) return;
  const max = scroller.scrollHeight - scroller.clientHeight;
  const pct = max>0 ? scroller.scrollTop/max : 0;
  const fill = document.getElementById('roProgressFill');
  if(fill) fill.style.width = (pct*100)+'%';
}

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
