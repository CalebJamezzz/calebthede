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

// ── Shared cover rendering — used by both the library-grid card and the
// book detail page's hero, so a cover (or its generated placeholder) looks
// identical wherever it appears. ──
function bookStatusInfo(b){
  const statusClass=b.status||'in_progress';
  const statusLabel=b.status==='complete'?'Complete':b.status==='in_progress'?'In Progress':b.status==='hiatus'?'On Hiatus':'Draft';
  return{statusClass,statusLabel};
}
function bookSpineInner(b){
  if(b.cover_image){
    // A real cover already carries the title + author + badges — keep the art clean.
    return `<div class="book-spine-bg" style="background:${b.color||COVERS[0]};background-image:url(${b.cover_image});background-size:cover;background-position:${b.cover_position||'50% 50%'}"></div>`;
  }
  // No cover → generated placeholder: colour field + constellation + title & status overlay.
  const{statusClass,statusLabel}=bookStatusInfo(b);
  const spineStatus=b.status!=='draft'
    ?`<div class="book-spine-status ${statusClass}">${statusLabel}</div>`
    :`<div class="book-spine-status in_progress admin-only blk">Draft</div>`;
  return `
    <div class="book-spine-bg" style="background:${b.color||COVERS[0]}"></div>
    <div class="book-spine-svg">${makeCelestialSVG(b.id)}</div>
    ${spineStatus}
    <div class="book-spine-content">
      <span class="book-spine-title">${b.title}</span>
    </div>`;
}
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
async function loadLibrary(){showLibBrowse();await Promise.all([loadBooks(),loadArticles(),loadBookTeaser(),loadLatestWriting()])}

// Newest essays — relocated from the old homepage. Absolute URL: a root-
// relative "/" only resolves to marginalia.html when the click happens on
// marginalia.calebthede.com's own root — anywhere else (this local server,
// or the apex domain) "/" resolves to the hub homepage instead, so the
// link would silently land on the wrong page. Same rule as every other
// cross-page link on this site.
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
    return `<a class="writing-card" href="https://marginalia.calebthede.com/#article/${a.id}">
      <p class="wc-tag">${a.tag||'Essay'}</p>
      <h3 class="wc-title">${a.title}</h3>
      <p class="wc-preview">${preview}</p>
      <div class="wc-meta"><span>${fmtDate(a.created_at)}</span><span>${mins} min</span></div>
    </a>`;
  }).join('');
  if(section) section.style.display='block';
}

// Teaser for the primary (oldest-created) book — relocated from the old
// homepage. Same-origin hash link since this now lives on library.html.
async function loadBookTeaser(){
  const teaser=document.getElementById('bookTeaser');
  if(!teaser)return;
  const{data:books}=await sb.from('books').select('id,title,description,cover_image,cover_position,color,status,series_id,series_order,retailer_links').order('created_at',{ascending:true});
  if(!books||!books.length)return;

  const display = books[0];
  const available = (display.retailer_links||[]).length > 0;

  document.getElementById('btTitle').textContent=display.title;
  document.getElementById('btDesc').textContent=(display.description||'').split('\n\n')[0];

  const eyebrow=document.getElementById('btEyebrow');
  if(eyebrow) eyebrow.textContent = available ? 'Available now' : (display.status==='draft' ? 'Coming soon' : 'Now Writing');

  const cta=document.getElementById('btCta');
  if(cta) cta.textContent = available ? 'Get '+display.title+' →' : 'Explore the Library →';

  const countEl=document.getElementById('btCount');
  const subEl=document.getElementById('btSub');
  let series=null;
  if(display.series_id){
    ({data:series}=await sb.from('series').select('name,total_books').eq('id',display.series_id).single());
  }
  if(countEl){
    if(series){
      const total=series.total_books;
      countEl.textContent = (display.series_order&&total?`Book ${display.series_order} of ${total}`:'Part of the series') + (available?' · Available now':'');
    } else {
      countEl.textContent = available?'Available now':'Coming soon';
    }
  }
  if(subEl) subEl.textContent = series ? series.name+' series' : 'Standalone';

  const cover=document.getElementById('btCover');
  if(cover){
    if(display.cover_image){ cover.style.backgroundImage='url('+display.cover_image+')'; cover.style.backgroundPosition=display.cover_position||'50% 50%'; cover.classList.add('has-cover'); cover.textContent=''; }
    else { cover.style.background=display.color||''; cover.textContent=display.title; }
  }

  document.getElementById('btPrimaryCta').href='/shelf#book/'+display.id;
  teaser.style.display='block';
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
    const{statusLabel,statusClass}=bookStatusInfo(b);
    const availLabel=(b.retailer_links||[]).length?'Available now':'Coming soon';
    const blurbFull=escHtml((b.description||'').replace(/<[^>]*>/g,'').trim());
    const hasCover=!!b.cover_image;

    const card=document.createElement('div');
    card.className='book-card '+(hasCover?'has-cover':'no-cover');

    const spineInner=bookSpineInner(b);

    // On cover cards the status moves to the caption (it isn't painted on the art).
    const footStatus=(hasCover&&b.status!=='complete')
      ? `<span class="book-foot-status ${statusClass}${b.status==='draft'?' admin-only blk':''}">${statusLabel}</span>`
      : '';

    card.innerHTML=`
      <div class="book-spine">${spineInner}</div>
      <div class="book-foot">
        <div class="book-foot-title">${b.title}</div>
        <div class="book-foot-meta">
          <span style="color:var(--teal)">${availLabel}</span>
          ${footStatus}
        </div>
        ${blurbFull?`<p class="book-foot-desc">${blurbFull}</p>`:''}
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
        const numBadge=document.createElement('span');
        numBadge.className='book-series-num';
        numBadge.textContent='Book '+b.series_order;
        const meta=card.querySelector('.book-foot-meta');
        if(meta)meta.insertBefore(numBadge,meta.firstChild);
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
  const coverEl=document.getElementById('bookDetailCover');
  if(coverEl&&b){ coverEl.className='book-spine book-detail-cover'+(b.cover_image?' has-cover':' no-cover'); coverEl.innerHTML=bookSpineInner(b); }
  const compWrap=document.getElementById('bookCompanionWrap'),compLink=document.getElementById('bookCompanionLink');
  if(compWrap&&compLink){
    const cu=(b&&b.companion_url||'').trim();
    if(cu){compLink.href=cu;compLink.textContent=((b.companion_label||'').trim()||'Explore more')+' →';compWrap.style.display='block';}
    else compWrap.style.display='none';
  }
  const buyBox=document.getElementById('bookBuyBox');
  const buyRow=document.getElementById('bookBuyRow');
  const links=(b&&b.retailer_links)||[];
  buyRow.innerHTML=links.map(l=>`<a class="book-buy-btn" href="${escHtml(l.url||'#')}" target="_blank" rel="noopener">${escHtml(l.label||'Buy now')} →</a>`).join('');
  if(buyBox) buyBox.style.display=links.length?'block':'none';

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
    card.innerHTML=`
      <span class="article-card-tab">${a.tag||'Note'}</span>
      ${a.banner_image?`<div class="article-card-banner" style="background-image:url('${a.banner_image}')" role="img" aria-label=""></div>`:''}
      <div class="article-card-body">
        <h3 class="article-title">${a.title}</h3>
        <p class="article-preview">${preview}</p>
        <div class="article-footer">
          <span>${fmtDate(a.created_at)}</span>
          <span>${mins} min read</span>
        </div>
        <div class="article-card-actions">
          <button class="btn-sm danger admin-only" onclick="event.stopPropagation();deleteArticle('${a.id}')">Delete</button>
        </div>
      </div>`;
    card.onclick=()=>openArticle(a);grid.appendChild(card);refreshAdmin(card);
  });
}


// ── READER ──────────────────────────────────────────────
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


function shareArticle(){
  const artId = typeof currentArticleId !== 'undefined' ? currentArticleId : null;
  const url   = artId
    ? 'https://marginalia.calebthede.com/#article/' + artId
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

// Ember field: sparse blue sparks drifting up every Library page.
(function(){
  if(document.body.dataset.page!=='library') return;
  const field=document.createElement('div');
  field.className='lib-ember-field';field.setAttribute('aria-hidden','true');
  const N=16;
  for(let i=0;i<N;i++){
    const s=document.createElement('i');
    s.style.left=(3+Math.random()*94)+'%';
    s.style.animationDuration=(14+Math.random()*14)+'s';
    s.style.animationDelay=(-Math.random()*26)+'s';
    s.style.setProperty('--dx',((Math.random()*80)-40)+'px');
    field.appendChild(s);
  }
  document.body.appendChild(field);
})();
