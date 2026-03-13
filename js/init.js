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
