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


