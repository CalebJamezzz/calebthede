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
        <span class="ask-header-title">JuztCleb</span>
        <button class="ask-close" onclick="closeAsk()">✕</button>
      </div>
      <div class="ask-messages" id="askMessages">
        <div class="ask-welcome">
          <p>Hey — I'm JuztCleb. Ask me anything about Caleb's writing, projects, or ideas.</p>
        </div>
      </div>
      <div class="ask-input-row">
        <input class="ask-input" id="askInput" type="text" placeholder="Ask anything…" autocomplete="off"/>
        <button class="ask-send-btn" id="askSendBtn" onclick="sendAskMessage()">↑</button>
      </div>
      <div class="ask-footer">
        <span>Searches the site's actual content</span>
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
let askHistory = []; // conversation history

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

function sendAskMessage(){
  const input = document.getElementById('askInput');
  const q = input.value.trim();
  if(!q) return;
  input.value = '';
  runAsk(q);
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
  input.addEventListener('keydown', e=>{
    if(e.key==='Enter'){
      e.preventDefault();
      sendAskMessage();
    }
  });
});

function clearAskMessages(){
  document.getElementById('askMessages').innerHTML = `
    <div class="ask-welcome">
      <p>Hey — I'm JuztCleb. Ask me anything about Caleb's writing, projects, or ideas.</p>
    </div>`;
  askHistory = [];
}

async function runAsk(query){
  if(!sb) return;
  const messagesEl = document.getElementById('askMessages');

  // Remove welcome message after first message
  const welcome = messagesEl.querySelector('.ask-welcome');
  if(welcome) welcome.remove();

  // Add user message
  messagesEl.innerHTML += `<div class="ask-msg ask-msg-user">${escapeHtml(query)}</div>`;

  // Add typing indicator
  const typingId = 'typing-' + Date.now();
  messagesEl.innerHTML += `<div class="ask-msg ask-msg-bot" id="${typingId}"><span class="ask-typing">✦ thinking…</span></div>`;
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // Add to history
  askHistory.push({ role: 'user', content: query });

  // Search Supabase for context
  const [artRes, chRes, labRes, artContent] = await Promise.all([
    sb.from('articles').select('id,title,tag,content').ilike('title','%'+query+'%').limit(3),
    sb.from('chapters').select('id,book_id,num,title,content').eq('published',true).ilike('title','%'+query+'%').limit(2),
    sb.from('lab_entries').select('id,title,description').ilike('title','%'+query+'%').limit(2),
    sb.from('articles').select('id,title,tag,content').ilike('content','%'+query+'%').limit(2),
  ]);

  const arts = [...new Map([...(artRes.data||[]),...(artContent.data||[])].map(a=>[a.id,a])).values()].slice(0,3);
  const chs = chRes.data||[];
  const labs = labRes.data||[];

  // Build context
  const chunks = [];
  arts.slice(0,2).forEach(a=> chunks.push(`[Article: "${a.title}"] ${(a.content||'').replace(/<[^>]*>/g,'').slice(0,500)}`));
  chs.slice(0,2).forEach(c=> chunks.push(`[Chapter: "${c.title}"] ${(c.content||'').replace(/<[^>]*>/g,'').slice(0,500)}`));
  labs.slice(0,1).forEach(l=> chunks.push(`[Lab: "${l.title}"] ${(l.description||'').slice(0,300)}`));

  // Also build search results links
  let links = '';
  if(arts.length) links += arts.map(a=>`<a class="ask-result-link" href="/library#article/${a.id}" onclick="closeAsk()">${a.tag?`<span class="ask-result-tag">${a.tag}</span>`:''}${a.title}</a>`).join('');
  if(chs.length) links += chs.map(c=>`<a class="ask-result-link" href="/library" onclick="closeAsk()"><span class="ask-result-tag">Ch.${c.num||'?'}</span>${c.title}</a>`).join('');

  const context = chunks.length ? `Relevant site content:\n\n${chunks.join('\n\n')}` : '';

  const systemPrompt = `You are JuztCleb — the AI voice of Caleb Thede's personal site at calebthede.com. You are a conversational assistant, not a search engine.

About Caleb:
- Full-stack developer and QA Engineer at TopNotch LTD
- B.S. Computer Science (CSU Global, 3.33 GPA), A.S. Psychology (Red Rocks CC, 3.8 GPA)
- Based in Colorado. Gaming tag: JuztCleb
- Writing the Blue Ember series — mythology and psychology as a lens for modern human behavior (8 books planned)
- Deeply interested in the intersection of CS and psychology: technology built to understand people
- Pursuing a Master's in Psychology
- Previously managed a team of 16 at Ziggi's Coffee — his capstone app was born there
- Open to developer and design roles

Personality: Conversational, warm, direct. Not robotic. Think of yourself as a knowledgeable friend who knows Caleb's work well.
Keep responses concise — 2-4 sentences unless depth is needed.
If referencing specific content, name it.
${context ? `\n${context}` : ''}`;

  try {
    if(askAbort) askAbort.abort();
    askAbort = new AbortController();

    const res = await fetch('/api/ask', {
      method: 'POST',
      signal: askAbort.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: systemPrompt,
        messages: askHistory
      })
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || "I'm not sure about that one — try asking differently.";

    // Add assistant reply to history
    askHistory.push({ role: 'assistant', content: text });

    // Replace typing indicator with real response
    const typingEl = document.getElementById(typingId);
    if(typingEl){
      let html = text.replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>');
      if(links) html += `<div class="ask-result-links">${links}</div>`;
      typingEl.innerHTML = html;
    }
  } catch(e){
    const typingEl = document.getElementById(typingId);
    if(typingEl && e.name !== 'AbortError'){
      typingEl.innerHTML = 'Something went wrong — try again.';
    }
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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