// ══ THE SCRIPTORIUM · admin console ══
// Books workspace first (the heavy one). Essays/Projects/Lab land next.

const cEl  = id => document.getElementById(id);
const cVal = id => (cEl(id)?.value ?? '').trim();
const cEsc = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

let SCR_INITED = false;
let SCR_SERIES = [];
let SCR_BOOKS  = [];
let SCR_BOOK   = null;     // current book row
let SCR_CKED   = null;     // CKEditor instance (writer body)
let SCR_COVER  = null;     // pending cover url for current book
let SCR_RETAILERS = [];    // retailer links for current book
let SCR_REVIEWS   = [];    // reviews for current book

let SCR_WRITE_CTX = 'excerpt'; // which entity the full-screen writer is editing
let SCR_WS         = 'books';  // active workspace
let SCR_ARTS       = [];       // all essays/articles
let SCR_ART        = null;     // current article row
let SCR_ART_BANNER = null;     // pending banner url for current article
let SCR_ARTS_LOADED = false;   // lazy-load essays on first visit

let SCR_PROJS = [], SCR_PROJ = null, SCR_PROJ_BANNER = null, SCR_PROJS_LOADED = false;
let SCR_LABS  = [], SCR_LAB  = null, SCR_LABS_LOADED  = false;

// ── shared image upload → Supabase 'library' bucket ──
async function composeUpload(file){
  const ext  = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = 'content/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
  const { error } = await sb.storage.from('library').upload(path, file, { contentType:file.type, upsert:false });
  if(error) throw new Error(error.message);
  const { data } = sb.storage.from('library').getPublicUrl(path);
  return data.publicUrl;
}

// CKEditor image uploads → same bucket
class CSupabaseAdapter {
  constructor(loader){ this.loader = loader; }
  upload(){ return this.loader.file.then(file => composeUpload(file).then(url => ({ default:url }))); }
  abort(){}
}
function CSupabaseUploadPlugin(editor){
  editor.plugins.get('FileRepository').createUploadAdapter = loader => new CSupabaseAdapter(loader);
}

// ── small helpers ──
function scrReadingTime(html){
  const words = (html||'').replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words/200));
}

// ════════ ADMIN GATE ════════
function composeOnAdmin(on){
  cEl('composeGate').style.display = on ? 'none' : 'flex';
  cEl('composeApp').style.display  = on ? 'block' : 'none';
  if(on) scrLoadAll();
}

// ════════ LOAD + BROWSER ════════
async function scrLoadAll(){
  const [{ data:series }, { data:books }] = await Promise.all([
    sb.from('series').select('*').order('created_at',{ascending:true}),
    sb.from('books').select('*').order('created_at',{ascending:true}),
  ]);
  SCR_SERIES = series || [];
  SCR_BOOKS  = books  || [];
  scrRenderBrowser();
}

function scrRenderBrowser(){
  const wrap = cEl('scrBookList');
  if(!SCR_BOOKS.length){ wrap.innerHTML = '<p class="scr-muted">No books yet. Create one or import a manuscript.</p>'; return; }
  // group by series
  const groups = [];
  const standalone = SCR_BOOKS.filter(b => !b.series_id);
  SCR_SERIES.forEach(s => {
    const inSeries = SCR_BOOKS.filter(b => b.series_id === s.id)
      .sort((a,b)=>(a.series_order||0)-(b.series_order||0));
    if(inSeries.length) groups.push({ series:s, books:inSeries });
  });
  let html = '';
  groups.forEach(g => {
    html += `<div class="scr-series-grp"><div class="scr-series-lbl">${cEsc(g.series.name)} <span class="scr-series-tot">${g.books.length}${g.series.total_books?'/'+g.series.total_books:''}</span><button class="scr-series-edit" onclick="scrOpenSeries('${g.series.id}')" title="Edit series">✎</button></div>` +
      g.books.map(scrBookRow).join('') + `</div>`;
  });
  if(standalone.length){
    html += `<div class="scr-series-grp"><div class="scr-series-lbl">Standalone</div>` +
      standalone.map(scrBookRow).join('') + `</div>`;
  }
  wrap.innerHTML = html;
}
function scrBookRow(b){
  const active = SCR_BOOK && SCR_BOOK.id === b.id ? ' active' : '';
  const thumb = b.cover_image
    ? `<span class="scr-bk-cover" style="background-image:url(${b.cover_image})"></span>`
    : `<span class="scr-bk-cover" style="background:${b.color||'#3a3550'}"></span>`;
  const stMap = {draft:'Draft', in_progress:'Writing', hiatus:'Hiatus', complete:'Complete'};
  return `<button class="scr-bk-row${active}" onclick="scrSelectBook('${b.id}')">
    ${thumb}
    <span class="scr-bk-meta">
      <span class="scr-bk-title">${cEsc(b.title||'Untitled')}</span>
      <span class="scr-bk-sub">${stMap[b.status]||'Draft'}</span>
    </span>
  </button>`;
}

// ════════ BOOK DETAIL ════════
async function scrSelectBook(id){
  const { data:book } = await sb.from('books').select('*').eq('id',id).single();
  if(!book) return;
  SCR_BOOK = book;
  SCR_COVER = book.cover_image || null;
  SCR_RETAILERS = Array.isArray(book.retailer_links) ? book.retailer_links.map(r=>({...r})) : [];
  SCR_REVIEWS = Array.isArray(book.reviews) ? book.reviews.map(r=>({...r})) : [];
  cEl('scrDetailEmpty').style.display = 'none';
  cEl('scrBookPanel').style.display = 'block';
  // fill header
  cEl('scrTitle').value = book.title || '';
  cEl('scrDesc').value = book.description || '';
  cEl('scrStatus').value = book.status || 'draft';
  cEl('scrSeriesOrder').value = book.series_order ?? '';
  scrFillSeriesSelect(book.series_id);
  scrRenderCover();
  scrRenderBrowser();
  scrRenderRetailerRows();
  scrRenderReviewRows();
  scrRenderExcerptSummary();
  scrRenderLaunchSummary();
}
function scrFillSeriesSelect(selected){
  const sel = cEl('scrSeries');
  sel.innerHTML = '<option value="">— none —</option>' +
    SCR_SERIES.map(s => `<option value="${s.id}"${s.id===selected?' selected':''}>${cEsc(s.name)}</option>`).join('');
}
function scrRenderCover(){
  const prev = cEl('scrCoverPrev');
  if(SCR_COVER){
    prev.classList.add('has-img');
    prev.style.background = '';
    prev.innerHTML = `<img src="${cEsc(SCR_COVER)}" alt="cover"/>`;
    cEl('scrCoverClear').style.display = '';
  }else{
    prev.classList.remove('has-img');
    prev.style.background = (SCR_BOOK && SCR_BOOK.color) || '#3a3550';
    prev.textContent = (SCR_BOOK && SCR_BOOK.title ? SCR_BOOK.title[0] : '✦');
    cEl('scrCoverClear').style.display = 'none';
  }
}
async function scrUploadCover(e){
  const file = e.target.files && e.target.files[0]; if(!file) return;
  cEl('scrCoverPrev').textContent = '…';
  try{ SCR_COVER = await composeUpload(file); scrRenderCover(); toast('Cover uploaded'); }
  catch(err){ toast('Upload failed: '+err.message,'error'); }
}
function scrClearCover(){ SCR_COVER = null; scrRenderCover(); }

async function scrSaveBook(){
  if(!SCR_BOOK) return;
  const payload = {
    title: cVal('scrTitle') || 'Untitled',
    description: cVal('scrDesc'),
    status: cVal('scrStatus'),
    cover_image: SCR_COVER || null,
    series_id: cVal('scrSeries') || null,
    series_order: parseInt(cVal('scrSeriesOrder')) || null,
    retailer_links: SCR_RETAILERS.filter(r=>r.label||r.url),
    reviews: SCR_REVIEWS.filter(r=>r.quote),
  };
  setLoading('scrSaveBookBtn', true);
  const { error } = await sb.from('books').update(payload).eq('id', SCR_BOOK.id);
  setLoading('scrSaveBookBtn', false, 'Save book');
  if(error){ toast('Save failed: '+error.message,'error'); return; }
  toast('Book saved');
  Object.assign(SCR_BOOK, payload);
  await scrLoadAll();
  scrRenderBrowser();
}
async function scrNewBook(){
  const { data, error } = await sb.from('books').insert({ title:'Untitled book', status:'draft', color:'#3a3550' }).select().single();
  if(error){ toast('Could not create book: '+error.message,'error'); return; }
  await scrLoadAll();
  scrSelectBook(data.id);
}
async function scrDeleteBook(){
  if(!SCR_BOOK) return;
  const ok = await scrConfirm({ title:'Delete book?', message:`"${SCR_BOOK.title}" will be permanently removed. This cannot be undone.`, confirmText:'Delete book', danger:true });
  if(!ok) return;
  const { error } = await sb.from('books').delete().eq('id', SCR_BOOK.id);
  if(error){ toast('Delete failed: '+error.message,'error'); return; }
  toast('Book deleted');
  SCR_BOOK = null;
  cEl('scrBookPanel').style.display = 'none';
  cEl('scrDetailEmpty').style.display = '';
  await scrLoadAll();
}

// ════════ CUSTOM CONFIRM ════════
let _scrConfirmCb = null;
function scrConfirm(opts){
  opts = opts || {};
  cEl('scrConfirmTitle').textContent = opts.title || 'Are you sure?';
  cEl('scrConfirmMsg').textContent   = opts.message || '';
  const ok = cEl('scrConfirmOk');
  ok.textContent = opts.confirmText || 'Confirm';
  ok.classList.toggle('danger', !!opts.danger);
  cEl('scrConfirmOverlay').classList.add('open');
  return new Promise(res => { _scrConfirmCb = res; });
}
function scrConfirmResolve(v){
  cEl('scrConfirmOverlay').classList.remove('open');
  const cb = _scrConfirmCb; _scrConfirmCb = null;
  if(cb) cb(v);
}

// ════════ SERIES ════════
let SCR_SERIES_ID = null;
function scrNewSeries(){ scrOpenSeries(null); }
function scrOpenSeries(id){
  const s = id ? SCR_SERIES.find(x => String(x.id)===String(id)) : null;
  SCR_SERIES_ID = s ? s.id : null;
  cEl('scrSeriesTitle').textContent = s ? 'Edit series' : 'New series';
  cEl('scrSeriesName').value  = s ? (s.name||'') : '';
  cEl('scrSeriesTotal').value = s && s.total_books != null ? s.total_books : '';
  cEl('scrDeleteSeriesBtn').style.display = s ? '' : 'none';
  cEl('scrSeriesStatus').textContent = '';
  cEl('scrSeriesOverlay').classList.add('open');
}
function scrCloseSeries(){ cEl('scrSeriesOverlay').classList.remove('open'); }
async function scrSaveSeries(){
  const name = cVal('scrSeriesName');
  if(!name){ cEl('scrSeriesStatus').textContent = 'Name required.'; return; }
  const total = parseInt(cVal('scrSeriesTotal')) || null;
  setLoading('scrSaveSeriesBtn', true);
  const { error } = SCR_SERIES_ID
    ? await sb.from('series').update({ name, total_books:total }).eq('id', SCR_SERIES_ID)
    : await sb.from('series').insert({ name, total_books:total });
  setLoading('scrSaveSeriesBtn', false, 'Save series');
  if(error){ cEl('scrSeriesStatus').textContent = error.message; return; }
  toast(SCR_SERIES_ID ? 'Series updated' : 'Series created');
  scrCloseSeries();
  await scrLoadAll();
  if(SCR_BOOK) scrFillSeriesSelect(SCR_BOOK.series_id);
}
async function scrDeleteSeries(){
  if(!SCR_SERIES_ID) return;
  const ok = await scrConfirm({ title:'Delete series?', message:'The series will be removed. Its books are kept and become standalone.', confirmText:'Delete series', danger:true });
  if(!ok) return;
  await sb.from('books').update({ series_id:null }).eq('series_id', SCR_SERIES_ID);
  const { error } = await sb.from('series').delete().eq('id', SCR_SERIES_ID);
  if(error){ toast('Delete failed: '+error.message,'error'); return; }
  toast('Series deleted');
  scrCloseSeries();
  if(SCR_BOOK && SCR_BOOK.series_id === SCR_SERIES_ID){ SCR_BOOK.series_id = null; }
  await scrLoadAll();
  if(SCR_BOOK){ scrFillSeriesSelect(SCR_BOOK.series_id); }
}

// ════════ RETAILER LINKS ════════
function scrRenderRetailerRows(){
  const wrap = cEl('scrRetailerRows');
  if(!SCR_RETAILERS.length){ wrap.innerHTML = '<p class="scr-muted">No retailer links yet.</p>'; return; }
  wrap.innerHTML = SCR_RETAILERS.map((r,i) => `
    <div class="scr-row">
      <input placeholder="Label (e.g. Amazon)" value="${cEsc(r.label||'')}" oninput="SCR_RETAILERS[${i}].label=this.value"/>
      <input placeholder="https://…" value="${cEsc(r.url||'')}" oninput="SCR_RETAILERS[${i}].url=this.value"/>
      <button class="scr-row-remove" onclick="SCR_RETAILERS.splice(${i},1);scrRenderRetailerRows()">✕</button>
    </div>`).join('');
}
function scrAddRetailerRow(){
  if(!SCR_BOOK){ toast('Select a book first.','error'); return; }
  SCR_RETAILERS.push({ label:'', url:'' });
  scrRenderRetailerRows();
}

// ════════ REVIEWS ════════
function scrRenderReviewRows(){
  const wrap = cEl('scrReviewRows');
  if(!SCR_REVIEWS.length){ wrap.innerHTML = '<p class="scr-muted">No reviews yet.</p>'; return; }
  wrap.innerHTML = SCR_REVIEWS.map((r,i) => `
    <div class="scr-row">
      <textarea rows="2" placeholder="Quote" oninput="SCR_REVIEWS[${i}].quote=this.value">${cEsc(r.quote||'')}</textarea>
      <input placeholder="Source (e.g. Kirkus, a reader)" value="${cEsc(r.source||'')}" oninput="SCR_REVIEWS[${i}].source=this.value"/>
      <button class="scr-row-remove" onclick="SCR_REVIEWS.splice(${i},1);scrRenderReviewRows()">✕</button>
    </div>`).join('');
}
function scrAddReviewRow(){
  if(!SCR_BOOK){ toast('Select a book first.','error'); return; }
  SCR_REVIEWS.push({ quote:'', source:'' });
  scrRenderReviewRows();
}

// ════════ EXCERPT + LAUNCH NOTE (rich text, via the shared writer) ════════
function scrRenderExcerptSummary(){
  const el = cEl('scrExcerptSummary'); if(!el || !SCR_BOOK) return;
  const words = (SCR_BOOK.excerpt||'').replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;
  el.innerHTML = words
    ? `<p class="scr-muted">${words.toLocaleString()} words · ${scrReadingTime(SCR_BOOK.excerpt)} min read</p>`
    : '<p class="scr-muted">No excerpt yet — open the writer to add a sample from the book.</p>';
}
function scrRenderLaunchSummary(){
  const el = cEl('scrLaunchSummary'); if(!el || !SCR_BOOK) return;
  const words = (SCR_BOOK.launch_note||'').replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;
  el.innerHTML = words
    ? `<p class="scr-muted">${words.toLocaleString()} words · ${scrReadingTime(SCR_BOOK.launch_note)} min read</p>`
    : '<p class="scr-muted">No launch note yet — open the writer to write about the book.</p>';
}
async function scrWriteExcerpt(){
  if(!SCR_BOOK){ toast('Select a book first.','error'); return; }
  SCR_WRITE_CTX = 'excerpt';
  await scrShowWriter(SCR_BOOK.title||'Book', 'Excerpt', SCR_BOOK.excerpt);
}
async function scrWriteLaunchNote(){
  if(!SCR_BOOK){ toast('Select a book first.','error'); return; }
  SCR_WRITE_CTX = 'launch_note';
  await scrShowWriter(SCR_BOOK.title||'Book', 'Launch note', SCR_BOOK.launch_note);
}

// ════════ FULL-SCREEN WRITER (content only) ════════
function scrInitCkEditor(){
  if(SCR_CKED) return Promise.resolve(SCR_CKED);
  if(!window.CKEDITOR || !CKEDITOR.ClassicEditor){
    cEl('scrWriteStatus').textContent = 'Editor failed to load.';
    return Promise.resolve(null);
  }
  return CKEDITOR.ClassicEditor.create(cEl('scrCkBody'), {
    // The super-build ships premium collaboration/track-changes/etc. plugins that
    // auto-init and require a Cloud Services license (channelId). We don't use them —
    // strip them so the editor mounts on a plain static site.
    removePlugins:[
      // real-time collaboration (needs a paid Cloud Services channel)
      'RealTimeCollaborativeEditing','RealTimeCollaborativeComments',
      'RealTimeCollaborativeRevisionHistory','RealTimeCollaborativeTrackChanges',
      'PresenceList','Comments','TrackChanges','TrackChangesData','RevisionHistory',
      // cloud-dependent uploaders — we upload via the Supabase adapter instead.
      // (NOTE: keep CloudServices itself loaded; CKBoxUtils depends on it.)
      'CKBox','CKFinder','EasyImage',
      // other premium features we don't use
      'Pagination','PaginationDropdown','ExportPdf','ExportWord','WProofreader',
      'MathType','SlashCommand','Template','DocumentOutline','FormatPainter',
      'TableOfContents','TableOfContentsAuto','PasteFromOfficeEnhanced','CaseChange',
      'MultiLevelList','Markdown','AIAssistant','OpenAITextAdapter','AWSTextAdapter'
    ],
    extraPlugins:[CSupabaseUploadPlugin],
    toolbar:{ items:[
      'undo','redo','|','heading','|','fontSize','fontColor','fontBackgroundColor','|',
      'bold','italic','underline','strikethrough','|',
      'link','blockQuote','code','codeBlock','|',
      'bulletedList','numberedList','|','outdent','indent','alignment','|',
      'insertImage','insertTable','mediaEmbed','horizontalLine','specialCharacters','|',
      'removeFormat','findAndReplace','sourceEditing'
    ], shouldNotGroupWhenFull:true },
    image:{ toolbar:['imageStyle:inline','imageStyle:block','imageStyle:side','|','toggleImageCaption','imageTextAlternative'] },
    table:{ contentToolbar:['tableColumn','tableRow','mergeTableCells'] }
  }).then(ed => { SCR_CKED = ed; return ed; })
    .catch(err => { console.error('CKEditor failed', err); cEl('scrWriteStatus').textContent = 'Editor error: '+(err && err.message || err); return null; });
}
// Shared mount: open the full-screen writer with given header text + body html.
async function scrShowWriter(eyebrow, title, content){
  cEl('scrWriteBook').textContent  = eyebrow || '';
  cEl('scrWriteTitle').textContent = title || 'Untitled';
  cEl('scrWriteStatus').textContent = '';
  cEl('scrWriteOverlay').classList.add('open');
  // mount only now that the container is visible + full-size (reliable mount)
  const ed = await scrInitCkEditor();
  if(ed) ed.setData(content || '');
}
function scrCloseWrite(){ cEl('scrWriteOverlay').classList.remove('open'); }
// One place that maps each writer context → table, body column, and refresh.
const SCR_WRITE_CFG = {
  excerpt:     { table:'books',    field:'excerpt',     id:()=>SCR_BOOK && SCR_BOOK.id, set:h=>{ if(SCR_BOOK) SCR_BOOK.excerpt = h; },     after:()=>scrRenderExcerptSummary() },
  launch_note: { table:'books',    field:'launch_note',  id:()=>SCR_BOOK && SCR_BOOK.id, set:h=>{ if(SCR_BOOK) SCR_BOOK.launch_note = h; }, after:()=>scrRenderLaunchSummary() },
  article: { table:'articles',     field:'content',     id:()=>SCR_ART  && SCR_ART.id,  set:h=>{ if(SCR_ART)  SCR_ART.content  = h; }, after:()=>scrRenderArtSummary() },
  project: { table:'projects',     field:'description', id:()=>SCR_PROJ && SCR_PROJ.id, set:h=>{ if(SCR_PROJ) SCR_PROJ.description = h; }, after:()=>scrRenderProjSummary() },
  lab:     { table:'lab_entries',  field:'description', id:()=>SCR_LAB  && SCR_LAB.id,  set:h=>{ if(SCR_LAB)  SCR_LAB.description  = h; }, after:()=>scrRenderLabSummary() },
};
async function scrSaveContent(){
  if(!SCR_CKED){ toast('Editor not ready.','error'); return; }
  const cfg = SCR_WRITE_CFG[SCR_WRITE_CTX] || SCR_WRITE_CFG.excerpt;
  const id = cfg.id();
  if(!id){ toast('Nothing selected.','error'); return; }
  const html = SCR_CKED.getData();
  setLoading('scrSaveContentBtn', true);
  const upd = {}; upd[cfg.field] = html;
  const { error } = await sb.from(cfg.table).update(upd).eq('id', id);
  setLoading('scrSaveContentBtn', false, 'Save content');
  if(error){ cEl('scrWriteStatus').textContent = error.message; toast('Save failed: '+error.message,'error'); return; }
  if(cfg.set) cfg.set(html);
  cEl('scrWriteStatus').textContent = 'Saved ✓';
  toast('Content saved');
  if(cfg.after) await cfg.after();
}

// ════════ WORKSPACE SWITCHING ════════
function scrSwitchWs(name){
  SCR_WS = name;
  document.querySelectorAll('.scr-ws').forEach(b => b.classList.toggle('active', b.dataset.ws === name));
  const map = { books:'scrBooksWs', essays:'scrEssaysWs', atlas:'scrAtlasWs', orbit:'scrOrbitWs' };
  Object.entries(map).forEach(([ws, id]) => {
    const el = cEl(id); if(el) el.style.display = (ws === name) ? '' : 'none';
  });
  if(name === 'essays' && !SCR_ARTS_LOADED)  scrLoadArticles();
  if(name === 'atlas'  && !SCR_PROJS_LOADED) scrLoadProjects();
  if(name === 'orbit'  && !SCR_LABS_LOADED)  scrLoadLab();
}

// ════════ ESSAYS (articles) ════════
async function scrLoadArticles(){
  SCR_ARTS_LOADED = true;
  const { data } = await sb.from('articles').select('*').order('created_at',{ascending:false});
  SCR_ARTS = data || [];
  scrRenderArticleList();
}
function scrRenderArticleList(){
  const wrap = cEl('scrArticleList');
  if(!SCR_ARTS.length){ wrap.innerHTML = '<p class="scr-muted">No essays yet. Create one to begin.</p>'; return; }
  wrap.innerHTML = `<div class="scr-series-grp">` + SCR_ARTS.map(scrArtRow).join('') + `</div>`;
}
function scrArtRow(a){
  const active = SCR_ART && SCR_ART.id === a.id ? ' active' : '';
  const thumb = a.banner_image
    ? `<span class="scr-bk-cover" style="background-image:url(${a.banner_image})"></span>`
    : `<span class="scr-bk-cover" style="background:#2f6f6b"></span>`;
  return `<button class="scr-bk-row${active}" onclick="scrSelectArticle('${a.id}')">
    ${thumb}
    <span class="scr-bk-meta">
      <span class="scr-bk-title">${cEsc(a.title||'Untitled')}</span>
      <span class="scr-bk-sub">${cEsc(a.tag||'Essay')}</span>
    </span>
  </button>`;
}
async function scrSelectArticle(id){
  const { data:art } = await sb.from('articles').select('*').eq('id',id).single();
  if(!art) return;
  SCR_ART = art;
  SCR_ART_BANNER = art.banner_image || null;
  cEl('scrArticleEmpty').style.display = 'none';
  cEl('scrArticlePanel').style.display = 'block';
  cEl('scrArtTitle').value = art.title || '';
  cEl('scrArtTag').value = art.tag || '';
  scrRenderBanner();
  scrRenderArtSummary();
  scrRenderArticleList();
}
function scrRenderBanner(){
  const prev = cEl('scrArtBannerPrev');
  if(SCR_ART_BANNER){
    prev.classList.add('has-img');
    prev.style.background = '';
    prev.innerHTML = `<img src="${cEsc(SCR_ART_BANNER)}" alt="banner"/>`;
    cEl('scrArtBannerClear').style.display = '';
  }else{
    prev.classList.remove('has-img');
    prev.innerHTML = '';
    prev.style.background = '#2f6f6b';
    prev.textContent = (SCR_ART && SCR_ART.title ? SCR_ART.title[0] : '✦');
    cEl('scrArtBannerClear').style.display = 'none';
  }
}
async function scrUploadBanner(e){
  const file = e.target.files && e.target.files[0]; if(!file) return;
  cEl('scrArtBannerPrev').textContent = '…';
  try{ SCR_ART_BANNER = await composeUpload(file); scrRenderBanner(); toast('Banner uploaded'); }
  catch(err){ toast('Upload failed: '+err.message,'error'); }
}
function scrClearBanner(){ SCR_ART_BANNER = null; scrRenderBanner(); }
function scrRenderArtSummary(){
  const el = cEl('scrArtSummary'); if(!el) return;
  if(!SCR_ART){ el.innerHTML = ''; return; }
  const words = (SCR_ART.content||'').replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;
  if(!words){ el.innerHTML = '<p class="scr-muted">No content yet — open the writer to draft this essay.</p>'; return; }
  el.innerHTML = `<p class="scr-muted">${words.toLocaleString()} words · ${scrReadingTime(SCR_ART.content)} min read</p>`;
}
async function scrSaveArticle(){
  if(!SCR_ART) return;
  const payload = {
    title: cVal('scrArtTitle') || 'Untitled',
    tag: cVal('scrArtTag') || null,
    banner_image: SCR_ART_BANNER || null,
  };
  setLoading('scrSaveArtBtn', true);
  const { error } = await sb.from('articles').update(payload).eq('id', SCR_ART.id);
  setLoading('scrSaveArtBtn', false, 'Save essay');
  if(error){ toast('Save failed: '+error.message,'error'); return; }
  toast('Essay saved');
  Object.assign(SCR_ART, payload);
  await scrLoadArticles();
}
async function scrNewArticle(){
  const { data, error } = await sb.from('articles').insert({ title:'Untitled essay', tag:'Essay', content:'' }).select().single();
  if(error){ toast('Could not create essay: '+error.message,'error'); return; }
  await scrLoadArticles();
  scrSelectArticle(data.id);
}
async function scrDeleteArticle(){
  if(!SCR_ART) return;
  const ok = await scrConfirm({ title:'Delete essay?', message:`"${SCR_ART.title}" will be permanently removed. This cannot be undone.`, confirmText:'Delete essay', danger:true });
  if(!ok) return;
  const { error } = await sb.from('articles').delete().eq('id', SCR_ART.id);
  if(error){ toast('Delete failed: '+error.message,'error'); return; }
  toast('Essay deleted');
  SCR_ART = null;
  cEl('scrArticlePanel').style.display = 'none';
  cEl('scrArticleEmpty').style.display = '';
  await scrLoadArticles();
}
async function scrWriteArticle(){
  if(!SCR_ART){ toast('Select an essay first.','error'); return; }
  SCR_WRITE_CTX = 'article';
  await scrShowWriter('Essay', SCR_ART.title || 'Untitled', SCR_ART.content, false);
}

// ════════ ATLAS (projects) ════════
const SCR_PROJ_STATUS = { in_progress:'In progress', shipped:'Shipped', archived:'Archived' };
async function scrLoadProjects(){
  SCR_PROJS_LOADED = true;
  const { data } = await sb.from('projects').select('*')
    .order('sort_order',{ascending:true}).order('created_at',{ascending:false});
  SCR_PROJS = data || [];
  scrRenderProjectList();
}
function scrRenderProjectList(){
  const wrap = cEl('scrProjectList');
  if(!SCR_PROJS.length){ wrap.innerHTML = '<p class="scr-muted">No projects yet. Create one to begin.</p>'; return; }
  wrap.innerHTML = `<div class="scr-series-grp">` + SCR_PROJS.map(scrProjRow).join('') + `</div>`;
}
function scrProjRow(p){
  const active = SCR_PROJ && SCR_PROJ.id === p.id ? ' active' : '';
  const thumb = p.banner_image
    ? `<span class="scr-bk-cover" style="background-image:url(${p.banner_image})"></span>`
    : `<span class="scr-bk-cover" style="background:#2f6f6b"></span>`;
  const star = p.highlight ? ' ✦' : '';
  return `<button class="scr-bk-row${active}" onclick="scrSelectProject('${p.id}')">
    ${thumb}
    <span class="scr-bk-meta">
      <span class="scr-bk-title">${cEsc(p.title||'Untitled')}${star}</span>
      <span class="scr-bk-sub">${SCR_PROJ_STATUS[p.status]||'Shipped'}</span>
    </span>
  </button>`;
}
async function scrSelectProject(id){
  const { data:p } = await sb.from('projects').select('*').eq('id',id).single();
  if(!p) return;
  SCR_PROJ = p;
  SCR_PROJ_BANNER = p.banner_image || null;
  cEl('scrProjectEmpty').style.display = 'none';
  cEl('scrProjectPanel').style.display = 'block';
  cEl('scrProjTitle').value = p.title || '';
  cEl('scrProjSubtitle').value = p.subtitle || '';
  cEl('scrProjStatus').value = p.status || 'shipped';
  cEl('scrProjCategory').value = p.category || '';
  cEl('scrProjSort').value = p.sort_order ?? 0;
  cEl('scrProjHighlight').value = p.highlight ? 'true' : 'false';
  cEl('scrProjTags').value = p.tags || '';
  cEl('scrProjGithub').value = p.link_github || '';
  cEl('scrProjDemo').value = p.link_demo || '';
  cEl('scrProjLinkLabel').value = p.link_other_label || '';
  cEl('scrProjLinkUrl').value = p.link_other_url || '';
  cEl('scrProjH1Label').value = p.highlight1_label || '';
  cEl('scrProjH1Value').value = p.highlight1_value || '';
  cEl('scrProjH2Label').value = p.highlight2_label || '';
  cEl('scrProjH2Value').value = p.highlight2_value || '';
  cEl('scrProjH3Label').value = p.highlight3_label || '';
  cEl('scrProjH3Value').value = p.highlight3_value || '';
  scrRenderProjBanner();
  scrRenderProjSummary();
  scrRenderProjectList();
}
function scrRenderProjBanner(){
  const prev = cEl('scrProjBannerPrev');
  if(SCR_PROJ_BANNER){
    prev.classList.add('has-img'); prev.style.background = '';
    prev.innerHTML = `<img src="${cEsc(SCR_PROJ_BANNER)}" alt="banner"/>`;
    cEl('scrProjBannerClear').style.display = '';
  }else{
    prev.classList.remove('has-img'); prev.innerHTML = '';
    prev.style.background = '#2f6f6b';
    prev.textContent = (SCR_PROJ && SCR_PROJ.title ? SCR_PROJ.title[0] : '✦');
    cEl('scrProjBannerClear').style.display = 'none';
  }
}
async function scrUploadProjBanner(e){
  const file = e.target.files && e.target.files[0]; if(!file) return;
  cEl('scrProjBannerPrev').textContent = '…';
  try{ SCR_PROJ_BANNER = await composeUpload(file); scrRenderProjBanner(); toast('Banner uploaded'); }
  catch(err){ toast('Upload failed: '+err.message,'error'); }
}
function scrClearProjBanner(){ SCR_PROJ_BANNER = null; scrRenderProjBanner(); }
function scrRenderProjSummary(){
  const el = cEl('scrProjSummary'); if(!el || !SCR_PROJ) return;
  const words = (SCR_PROJ.description||'').replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;
  el.innerHTML = words
    ? `<p class="scr-muted">${words.toLocaleString()} words · ${scrReadingTime(SCR_PROJ.description)} min read</p>`
    : '<p class="scr-muted">No description yet — open the writer to add one.</p>';
}
async function scrSaveProject(){
  if(!SCR_PROJ) return;
  const payload = {
    title: cVal('scrProjTitle') || 'Untitled',
    subtitle: cVal('scrProjSubtitle') || null,
    status: cVal('scrProjStatus'),
    category: cVal('scrProjCategory') || null,
    sort_order: parseInt(cVal('scrProjSort')) || 0,
    highlight: cEl('scrProjHighlight').value === 'true',
    tags: cVal('scrProjTags') || null,
    link_github: cVal('scrProjGithub') || null,
    link_demo: cVal('scrProjDemo') || null,
    link_other_label: cVal('scrProjLinkLabel') || null,
    link_other_url: cVal('scrProjLinkUrl') || null,
    banner_image: SCR_PROJ_BANNER || null,
    highlight1_label: cVal('scrProjH1Label') || null,
    highlight1_value: cVal('scrProjH1Value') || null,
    highlight2_label: cVal('scrProjH2Label') || null,
    highlight2_value: cVal('scrProjH2Value') || null,
    highlight3_label: cVal('scrProjH3Label') || null,
    highlight3_value: cVal('scrProjH3Value') || null,
  };
  setLoading('scrSaveProjBtn', true);
  const { error } = await sb.from('projects').update(payload).eq('id', SCR_PROJ.id);
  setLoading('scrSaveProjBtn', false, 'Save project');
  if(error){ toast('Save failed: '+error.message,'error'); return; }
  toast('Project saved');
  Object.assign(SCR_PROJ, payload);
  await scrLoadProjects();
}
async function scrNewProject(){
  const { data, error } = await sb.from('projects').insert({ title:'Untitled project', status:'in_progress', description:'', sort_order:0 }).select().single();
  if(error){ toast('Could not create project: '+error.message,'error'); return; }
  await scrLoadProjects();
  scrSelectProject(data.id);
}
async function scrDeleteProject(){
  if(!SCR_PROJ) return;
  const ok = await scrConfirm({ title:'Delete project?', message:`"${SCR_PROJ.title}" will be permanently removed. This cannot be undone.`, confirmText:'Delete project', danger:true });
  if(!ok) return;
  const { error } = await sb.from('projects').delete().eq('id', SCR_PROJ.id);
  if(error){ toast('Delete failed: '+error.message,'error'); return; }
  toast('Project deleted');
  SCR_PROJ = null;
  cEl('scrProjectPanel').style.display = 'none';
  cEl('scrProjectEmpty').style.display = '';
  await scrLoadProjects();
}
async function scrWriteProject(){
  if(!SCR_PROJ){ toast('Select a project first.','error'); return; }
  SCR_WRITE_CTX = 'project';
  await scrShowWriter('Atlas', SCR_PROJ.title || 'Untitled', SCR_PROJ.description, false);
}

// ════════ ORBIT (lab) ════════
const SCR_LAB_CATS = { game:'Game', puzzle:'Puzzle', psych:'Psych test', experiment:'Experiment', tool:'Tool' };
async function scrLoadLab(){
  SCR_LABS_LOADED = true;
  const { data } = await sb.from('lab_entries').select('*').order('created_at',{ascending:false});
  SCR_LABS = data || [];
  scrRenderLabList();
}
function scrRenderLabList(){
  const wrap = cEl('scrLabList');
  if(!SCR_LABS.length){ wrap.innerHTML = '<p class="scr-muted">No entries yet. Create one to begin.</p>'; return; }
  wrap.innerHTML = `<div class="scr-series-grp">` + SCR_LABS.map(scrLabRow).join('') + `</div>`;
}
function scrLabRow(e){
  const active = SCR_LAB && SCR_LAB.id === e.id ? ' active' : '';
  const cat = e.category || e.type || 'experiment';
  return `<button class="scr-bk-row${active}" onclick="scrSelectLab('${e.id}')">
    <span class="scr-bk-cover" style="background:#2f6f6b"></span>
    <span class="scr-bk-meta">
      <span class="scr-bk-title">${cEsc(e.title||'Untitled')}</span>
      <span class="scr-bk-sub">${cEsc(SCR_LAB_CATS[cat]||cat)}</span>
    </span>
  </button>`;
}
function scrLabDeriveKind(e){
  if(e.embed_html) return 'html';
  if(e.embed_url)  return 'url';
  if(e.link)       return 'link';
  return 'url';
}
async function scrSelectLab(id){
  const { data:e } = await sb.from('lab_entries').select('*').eq('id',id).single();
  if(!e) return;
  SCR_LAB = e;
  cEl('scrLabEmpty').style.display = 'none';
  cEl('scrLabPanel').style.display = 'block';
  cEl('scrLabTitle').value = e.title || '';
  cEl('scrLabCategory').value = e.category || e.type || 'experiment';
  cEl('scrLabTags').value = e.tags || '';
  cEl('scrLabEmbedHtml').value = e.embed_html || '';
  const kind = scrLabDeriveKind(e);
  cEl('scrLabKind').value = kind;
  cEl('scrLabUrl').value = (kind === 'link') ? (e.link || '') : (e.embed_url || '');
  cEl('scrLabHtmlName').textContent = (kind === 'url' && e.embed_url) ? 'Hosted file in use' : 'No file uploaded';
  scrLabKindChange();
  scrRenderLabSummary();
  scrRenderLabList();
}
// Show only the inputs relevant to the chosen kind.
function scrLabKindChange(){
  const kind = cEl('scrLabKind').value;
  cEl('scrLabUrlField').style.display    = (kind === 'url' || kind === 'link') ? '' : 'none';
  cEl('scrLabUploadField').style.display = (kind === 'upload') ? '' : 'none';
  cEl('scrLabHtmlField').style.display   = (kind === 'html') ? '' : 'none';
  cEl('scrLabUrlLabel').textContent = (kind === 'link') ? 'External link URL' : 'Embed URL';
}
async function scrUploadLabHtml(e){
  const file = e.target.files && e.target.files[0]; if(!file) return;
  cEl('scrLabHtmlName').textContent = 'Uploading…';
  try{
    const url = await composeUpload(file);
    cEl('scrLabUrl').value = url;           // hosted file becomes the embed URL
    cEl('scrLabHtmlName').textContent = file.name + ' ✓';
    toast('HTML uploaded');
  }catch(err){ cEl('scrLabHtmlName').textContent = 'Upload failed'; toast('Upload failed: '+err.message,'error'); }
}
function scrRenderLabSummary(){
  const el = cEl('scrLabSummary'); if(!el || !SCR_LAB) return;
  const words = (SCR_LAB.description||'').replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;
  el.innerHTML = words
    ? `<p class="scr-muted">${words.toLocaleString()} words · ${scrReadingTime(SCR_LAB.description)} min read</p>`
    : '<p class="scr-muted">No description yet — open the writer to add one.</p>';
}
async function scrSaveLab(){
  if(!SCR_LAB) return;
  const kind = cEl('scrLabKind').value;
  const cat = cVal('scrLabCategory');
  const url = cVal('scrLabUrl');
  const payload = {
    title: cVal('scrLabTitle') || 'Untitled',
    category: cat,
    type: cat,                       // kept in sync for back-compat
    tags: cVal('scrLabTags') || null,
    embed_url:  (kind === 'url' || kind === 'upload') ? (url || null) : null,
    embed_html: (kind === 'html') ? (cVal('scrLabEmbedHtml') || null) : null,
    link:       (kind === 'link') ? (url || null) : null,
  };
  setLoading('scrSaveLabBtn', true);
  const { error } = await sb.from('lab_entries').update(payload).eq('id', SCR_LAB.id);
  setLoading('scrSaveLabBtn', false, 'Save entry');
  if(error){ toast('Save failed: '+error.message,'error'); return; }
  toast('Entry saved');
  Object.assign(SCR_LAB, payload);
  await scrLoadLab();
}
async function scrNewLab(){
  const { data, error } = await sb.from('lab_entries').insert({ title:'Untitled entry', category:'experiment', type:'experiment', description:'' }).select().single();
  if(error){ toast('Could not create entry: '+error.message,'error'); return; }
  await scrLoadLab();
  scrSelectLab(data.id);
}
async function scrDeleteLab(){
  if(!SCR_LAB) return;
  const ok = await scrConfirm({ title:'Delete entry?', message:`"${SCR_LAB.title}" will be permanently removed. This cannot be undone.`, confirmText:'Delete entry', danger:true });
  if(!ok) return;
  const { error } = await sb.from('lab_entries').delete().eq('id', SCR_LAB.id);
  if(error){ toast('Delete failed: '+error.message,'error'); return; }
  toast('Entry deleted');
  SCR_LAB = null;
  cEl('scrLabPanel').style.display = 'none';
  cEl('scrLabEmpty').style.display = '';
  await scrLoadLab();
}
async function scrWriteLab(){
  if(!SCR_LAB){ toast('Select an entry first.','error'); return; }
  SCR_WRITE_CTX = 'lab';
  await scrShowWriter('Orbit', SCR_LAB.title || 'Untitled', SCR_LAB.description, false);
}

// ════════ BOOT ════════
function initCompose(){
  if(SCR_INITED) return; SCR_INITED = true;
  if(typeof grantAdmin === 'function'){
    const _g = grantAdmin, _r = revokeAdmin;
    grantAdmin  = function(){ _g.apply(this, arguments); composeOnAdmin(true); };
    revokeAdmin = function(){ _r.apply(this, arguments); composeOnAdmin(false); };
  }
  sb.auth.getSession().then(({ data }) => composeOnAdmin(!!(data && data.session)));
}
