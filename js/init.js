
// ── Inject Ask overlay + FAB on every page ──
(function(){
  // Floating button — constellation icon
  const s=42,cx=21,cy=21,r=21*0.38;
  const stars=Array.from({length:5},(_,i)=>{const a=(i/5)*Math.PI*2-Math.PI/2;return{x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r}});
  const lines=[[0,1],[1,2],[2,3],[3,4],[4,0],[0,2]];
  const linesHTML=lines.map(([a,b])=>`<line x1="${stars[a].x.toFixed(1)}" y1="${stars[a].y.toFixed(1)}" x2="${stars[b].x.toFixed(1)}" y2="${stars[b].y.toFixed(1)}" stroke="var(--gold)" stroke-width=".7" opacity=".4"/>`).join('');
  const starsHTML=stars.map((st,i)=>`<circle class="star-pulse" cx="${st.x.toFixed(1)}" cy="${st.y.toFixed(1)}" r="1.8" fill="var(--gold)" style="animation-delay:${i*0.18}s"/>`).join('');
  const centerDot=`<circle cx="${cx}" cy="${cy}" r="1.4" fill="var(--teal)" opacity=".8"/>`;
  const orbitR=r*0.55;
  const orbitHTML=`<circle class="orbit-ring" cx="${(cx+orbitR).toFixed(1)}" cy="${cy}" r="1.8" fill="var(--teal)" opacity=".7"/>`;
  const fabSVG=`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">${linesHTML}${starsHTML}${centerDot}${orbitHTML}</svg>`;

  const fab = document.createElement('button');
  fab.id = 'askFab';
  fab.className = 'ask-fab';
  fab.title = 'Ask JuztCleb';
  fab.innerHTML = fabSVG + '<span class="ask-fab-label">Ask JuztCleb</span>';
  fab.onclick = () => openAsk();
  document.body.appendChild(fab);

  // Overlay
  const overlay = document.createElement('div');
  overlay.id = 'askOverlay';
  overlay.innerHTML = `
    <div class="ask-backdrop" onclick="closeAsk()"></div>
    <div class="ask-panel">
      <div class="ask-header">
        <span class="ask-header-icon">✦</span>
        <span class="ask-header-title">Ask JuztCleb</span>
        <button class="ask-close" onclick="closeAsk()">✕</button>
      </div>
      <div class="ask-input-wrap">
        <input class="ask-input" id="askInput" type="text" placeholder="Ask anything — writing, projects, ideas, about Caleb…" autocomplete="off"/>
        <span class="ask-shortcut">⌘K</span>
      </div>
      <div class="ask-results" id="askResults"></div>
      <div class="ask-answer-wrap" id="askAnswerWrap" style="display:none">
        <div class="ask-answer-label">✦ JuztCleb</div>
        <div class="ask-answer" id="askAnswer"></div>
      </div>
      <div class="ask-footer">
        <span>Powered by the site's actual content</span>
        <span>esc to close</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
})();
// Shared utility — used by both library.js and projects.js
function seedRand(seed){
  let s=seed;
  return ()=>{s=(s*1664525+1013904223)&0xffffffff;return(s>>>0)/0xffffffff};
}

// sb, adminMode declared inline in each page's <script> block

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

// Multi-page navigation — showPage navigates to actual HTML files
// Library sub-nav (book/article reader) stays in-page via hash
function showPage(name,skipHistory){
  const pages=['home','about','projects','library','lab','contact'];
  if(!pages.includes(name))name='home';
  // Check if we're already on this page
  const currentPage=document.body.dataset.page;
  if(currentPage===name){
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }
  const urls={home:'/',about:'/about',projects:'/projects',library:'/library',lab:'/lab',contact:'/contact'};
  window.location.href=urls[name];
}

// Library deep-link handler (for book/article opens from other pages)
function navigateToBook(bookId){window.location.href='/library#book/'+bookId;}
function navigateToArticle(articleId){window.location.href='/library#article/'+articleId;}

// Handle library hash routing (called on library page load)
function handleLibraryHash(){
  const hash=location.hash;
  if(!hash)return;
  const parts=hash.replace('#','').split('/');
  const sub=parts[0];const id=parts[1];
  if(sub==='book'&&id){
    const autoResume = parts[2]==='resume';
    setTimeout(()=>{
      sb.from('books').select('*').eq('id',id).single().then(({data:b})=>{
        if(b)openBook(b.id,b.title,b.description,true).then(()=>{
          if(autoResume&&typeof resumeReading==='function') resumeReading();
        });
      });
    },600);
  } else if(sub==='article'&&id){
    setTimeout(()=>{
      sb.from('articles').select('*').eq('id',id).single().then(({data:a})=>{if(a)openArticle(a,true);});
    },600);
  }
}

// Back/forward within library
window.addEventListener('popstate',e=>{
  const state=e.state;
  if(state?.sub==='book'){openBook(state.id,state.title,state.desc,true);return;}
  if(state?.sub==='article'){
    sb.from('articles').select('*').eq('id',state.id).single().then(({data:a})=>{if(a)openArticle(a,true);});return;
  }
  if(state?.sub==='browse')showLibBrowse();
});

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


// ── NEWSLETTER FORMS ──
async function handleNewsletterSubmit(e){
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  try{
    await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(data).toString()});
    form.style.display='none';
    document.getElementById('newsletter-success').style.display='block';
  } catch(err){
    alert('Something went wrong. Please try again.');
  }
}

async function handleFooterNewsletterSubmit(e){
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  try{
    await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(data).toString()});
    form.style.display='none';
    const success = document.getElementById('footer-nl-success');
    if(success) success.style.display='block';
  } catch(err){
    // silent fail on footer
  }
}

// ══════════════════════════════════════════════════════
// ASK JUZTCLEB — Search + AI Agent
// ══════════════════════════════════════════════════════
let askOpen = false;
let askDebounce = null;
let askAbort = null;

function openAsk(){
  const fab = document.getElementById('askFab');
  const overlay = document.getElementById('askOverlay');
  // Explode animation from FAB position
  fab.classList.add('ask-fab-exploding');
  setTimeout(()=>{
    overlay.classList.add('active');
    document.body.classList.add('ask-open');
    askOpen = true;
    setTimeout(()=>document.getElementById('askInput').focus(), 80);
    setTimeout(()=>fab.classList.remove('ask-fab-exploding'), 400);
  }, 120);
}

function closeAsk(){
  document.getElementById('askOverlay').classList.remove('active');
  document.body.classList.remove('ask-open');
  askOpen = false;
  clearTimeout(askDebounce);
  if(askAbort){ askAbort.abort(); askAbort = null; }
}

// Cmd/Ctrl+K
document.addEventListener('keydown', e=>{
  if((e.metaKey||e.ctrlKey) && e.key==='k'){ e.preventDefault(); askOpen ? closeAsk() : openAsk(); }
  if(e.key==='Escape' && askOpen) closeAsk();
});

// Input handler
document.addEventListener('DOMContentLoaded', ()=>{
  const input = document.getElementById('askInput');
  if(!input) return;
  input.addEventListener('input', ()=>{
    clearTimeout(askDebounce);
    const q = input.value.trim();
    if(!q){ clearAskResults(); return; }
    askDebounce = setTimeout(()=>runAsk(q), 400);
  });
  input.addEventListener('keydown', e=>{
    if(e.key==='Enter'){
      clearTimeout(askDebounce);
      const q = input.value.trim();
      if(q) runAsk(q, true);
    }
  });
});

function clearAskResults(){
  document.getElementById('askResults').innerHTML = '';
  document.getElementById('askAnswerWrap').style.display = 'none';
  document.getElementById('askAnswer').innerHTML = '';
}

async function runAsk(query, forceAI=false){
  if(!sb) return;
  clearAskResults();

  const resultsEl = document.getElementById('askResults');
  resultsEl.innerHTML = '<div class="ask-searching">Searching…</div>';

  // 1. Search Supabase — articles, chapters, lab entries
  const [artRes, chRes, labRes] = await Promise.all([
    sb.from('articles').select('id,title,tag,content').ilike('title','%'+query+'%').limit(4),
    sb.from('chapters').select('id,book_id,num,title,content').eq('published',true).ilike('title','%'+query+'%').limit(3),
    typeof sb.from('lab_entries') !== 'undefined'
      ? sb.from('lab_entries').select('id,title,content').ilike('title','%'+query+'%').limit(3)
      : Promise.resolve({data:[]}),
  ]);

  // Also do content search on articles
  const [artContent] = await Promise.all([
    sb.from('articles').select('id,title,tag,content').ilike('content','%'+query+'%').limit(3),
  ]);

  // Merge and deduplicate
  const arts = [...new Map([
    ...(artRes.data||[]),
    ...(artContent.data||[])
  ].map(a=>[a.id,a])).values()].slice(0,4);
  const chs = chRes.data||[];
  const labs = labRes.data||[];

  const hasResults = arts.length || chs.length || labs.length;
  resultsEl.innerHTML = '';

  if(hasResults){
    if(arts.length){
      resultsEl.innerHTML += `<div class="ask-group-label">Articles</div>`;
      arts.forEach(a=>{
        resultsEl.innerHTML += `<a class="ask-result-item" href="/library#article/${a.id}">
          <span class="ask-result-tag">${a.tag||'Article'}</span>
          <span class="ask-result-title">${a.title}</span>
        </a>`;
      });
    }
    if(chs.length){
      resultsEl.innerHTML += `<div class="ask-group-label">Book Chapters</div>`;
      chs.forEach(c=>{
        resultsEl.innerHTML += `<a class="ask-result-item" href="/library">
          <span class="ask-result-tag">Ch.${c.num||'?'}</span>
          <span class="ask-result-title">${c.title}</span>
        </a>`;
      });
    }
    if(labs.length){
      resultsEl.innerHTML += `<div class="ask-group-label">Lab</div>`;
      labs.forEach(l=>{
        resultsEl.innerHTML += `<a class="ask-result-item" href="/lab">
          <span class="ask-result-tag">Lab</span>
          <span class="ask-result-title">${l.title}</span>
        </a>`;
      });
    }
    // Add click handlers to close overlay
    resultsEl.querySelectorAll('.ask-result-item').forEach(el=>{
      el.addEventListener('click', ()=>closeAsk());
    });
  } else {
    resultsEl.innerHTML = '<div class="ask-no-results">No direct matches — see what JuztCleb thinks below ↓</div>';
  }

  // 2. AI answer — always run on Enter, run on debounce if query is a question
  const isQuestion = forceAI || query.length > 20 || /\?|what|who|why|how|tell|explain|about/i.test(query);
  if(isQuestion) await runAIAnswer(query, arts, chs, labs);
}

async function runAIAnswer(query, arts=[], chs=[], labs=[]){
  const wrapEl = document.getElementById('askAnswerWrap');
  const answerEl = document.getElementById('askAnswer');
  wrapEl.style.display = 'block';
  answerEl.innerHTML = '<span class="ask-typing">thinking…</span>';

  // Build context from search results
  const contextChunks = [];
  arts.slice(0,2).forEach(a=>{
    const snippet = (a.content||'').replace(/<[^>]*>/g,'').slice(0,600);
    contextChunks.push(`[Article: "${a.title}"] ${snippet}`);
  });
  chs.slice(0,2).forEach(c=>{
    const snippet = (c.content||'').replace(/<[^>]*>/g,'').slice(0,600);
    contextChunks.push(`[Book chapter: "${c.title}"] ${snippet}`);
  });
  labs.slice(0,1).forEach(l=>{
    const snippet = (l.content||'').replace(/<[^>]*>/g,'').slice(0,300);
    contextChunks.push(`[Lab entry: "${l.title}"] ${snippet}`);
  });

  const context = contextChunks.length
    ? `Here is relevant content from the site:\n\n${contextChunks.join('\n\n')}`
    : 'No specific content matched — answer from general knowledge about Caleb.';

  const systemPrompt = `You are JuztCleb — the AI voice of Caleb Thede's personal site at calebthede.com.

About Caleb:
- Full-stack developer, QA Engineer at TopNotch LTD
- B.S. Computer Science (CSU Global, 3.33 GPA), A.S. Psychology (Red Rocks CC, 3.8 GPA)
- Based in Colorado
- Writing a book series called "Blue Ember" — mythology and psychology as a lens for modern human behavior
- Interested in the intersection of CS and psychology: how technology can be built to better understand people
- Pursuing a Master's in Psychology
- Gaming tag: JuztCleb
- Previously managed a team of 16 at Ziggi's Coffee, which inspired his capstone project

Your role:
- Help visitors explore Caleb's writing, projects, and ideas
- Answer questions about his work grounded in the actual content provided
- Be conversational, warm, and direct — not robotic
- Keep answers concise (2-4 sentences max unless the question needs more)
- If you reference specific content, mention its title
- If you don't know something, say so briefly and suggest where to look on the site

${context}`;

  try {
    if(askAbort) askAbort.abort();
    askAbort = new AbortController();

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: askAbort.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: query }]
      })
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || 'I couldn\'t find an answer for that.';
    answerEl.innerHTML = text.replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>');
  } catch(e){
    if(e.name !== 'AbortError'){
      answerEl.innerHTML = 'Something went wrong — try rephrasing your question.';
    }
  }
}

// ── Inline search for Library articles ──
function filterArticlesInline(q){
  if(typeof allArticles === 'undefined') return;
  const term = q.toLowerCase().trim();
  if(!term){ renderArticleCards(allArticles); return; }
  const filtered = allArticles.filter(a=>
    (a.title||'').toLowerCase().includes(term) ||
    (a.content||'').toLowerCase().includes(term) ||
    (a.tag||'').toLowerCase().includes(term)
  );
  renderArticleCards(filtered);
}

// ── Inline search for Lab ──
function filterLabInline(q){
  if(typeof allLabEntries === 'undefined') return;
  const term = q.toLowerCase().trim();
  if(!term){ renderLabCards(allLabEntries); return; }
  const filtered = allLabEntries.filter(e=>
    (e.title||'').toLowerCase().includes(term) ||
    (e.body||e.content||'').toLowerCase().includes(term) ||
    (e.type||e.category||'').toLowerCase().includes(term)
  );
  renderLabCards(filtered);
}

// ── Inline search for Books ──
function filterBooksInline(q){
  const container = document.getElementById('booksContainer');
  if(!container) return;
  const term = q.toLowerCase().trim();
  if(!term){
    // Reload full books display
    if(typeof loadBooks === 'function') loadBooks();
    return;
  }
  // Search book titles and series names in the rendered cards
  container.querySelectorAll('.book-card, [class*="series"]').forEach(el=>{
    const text = el.textContent.toLowerCase();
    el.style.display = text.includes(term) ? '' : 'none';
  });
  // Also hide empty series headers
  container.querySelectorAll('div[style*="margin-bottom:3"]').forEach(section=>{
    const visibleCards = section.querySelectorAll('.book-card:not([style*="display: none"])');
    section.style.display = visibleCards.length ? '' : 'none';
  });
}
