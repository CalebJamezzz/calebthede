// ── BLUE EMBER: characters, world, and "Beyond the Book" ──────────────
// Content lives in Supabase (be_entries), never hard-coded here, so it can
// grow as new books release without touching this file. The one thing that
// IS hard-coded is BE_SEED_DATA below — a one-time import of the starter
// content package — and even that only ever gets inserted as status:'draft'
// by an explicit admin click; nothing in this file ever flips a row to
// 'approved' on its own. See supabase/blue_ember_schema.sql for the table.

const BE_PROGRESS_KEY = 'blueEmber.readerProgress';

function beGetProgress(){
  try{ return parseInt(localStorage.getItem(BE_PROGRESS_KEY),10) || 0; }
  catch(e){ return 0; }
}
function beSetProgress(n){
  try{ localStorage.setItem(BE_PROGRESS_KEY, String(n)); }catch(e){}
  window.dispatchEvent(new CustomEvent('be-progress-change',{detail:{progress:n}}));
}
window.addEventListener('storage', e=>{
  if(e.key===BE_PROGRESS_KEY) renderBlueEmberPage();
});

let _beEntries = [];
let _beReleasedBooks = [];

async function loadBlueEmberPage(){
  const root = document.getElementById('beRoot');
  if(!root) return;

  const [{data:entries}, {data:series}] = await Promise.all([
    sb.from('be_entries').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:true}),
    sb.from('series').select('id,total_books').eq('name','Blue Ember').maybeSingle()
  ]);
  _beEntries = entries||[];

  let books = [];
  if(series){
    const {data:b} = await sb.from('books').select('id,title,description,cover_image,cover_position,status,series_order,retailer_links').eq('series_id',series.id).order('series_order',{ascending:true});
    books = b||[];
  }
  _beReleasedBooks = books.filter(b=>b.status!=='draft');

  renderBookCard(books.find(b=>b.series_order===1) || books[0]);
  renderProgressControl();
  renderBlueEmberPage();
  window.addEventListener('be-progress-change', renderBlueEmberPage);
}

function renderBookCard(book){
  const el = document.getElementById('beBookCard');
  if(!el || !book) return;
  const links = (book.retailer_links||[]).map(l=>`<a class="be-buy-btn" href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join('');
  el.innerHTML = `
    <div class="book-embers" aria-hidden="true"><span class="bspark"></span><span class="bspark"></span><span class="bspark"></span><span class="bspark"></span><span class="bspark"></span><span class="bspark"></span><span class="bspark"></span></div>
    <div class="be-book-cover" style="${book.cover_image?`background-image:url('${book.cover_image}');background-position:${book.cover_position||'50% 50%'}`:`background:${book.color||'#101a26'}`}"></div>
    <div class="be-book-info">
      <p class="be-book-eyebrow">Book One</p>
      <h2 class="be-book-title">${book.title}</h2>
      <p class="be-book-desc">${(book.description||'').split('\n\n')[0]}</p>
      <div class="be-buy-row">${links || '<span class="be-buy-soon">Coming to retailers soon</span>'}</div>
    </div>`;
}

function renderProgressControl(){
  const el = document.getElementById('beProgressControl');
  if(!el) return;
  const progress = beGetProgress();
  const opts = [{v:0,label:'Not yet'}].concat(_beReleasedBooks.map(b=>({v:b.series_order,label:'Book '+b.series_order})));
  el.innerHTML = `
    <span class="be-progress-label">I've read</span>
    <div class="be-progress-pills" role="group" aria-label="Reading progress">
      ${opts.map(o=>`<button class="be-progress-pill${o.v===progress?' active':''}" onclick="beSetProgress(${o.v})">${o.label}</button>`).join('')}
    </div>`;
}

function beVisibleEntries(kind, progress, isAdmin){
  return _beEntries.filter(e=>{
    if(e.kind!==kind) return false;
    if(isAdmin) return true;
    return e.status==='approved' && e.entry_tier<=progress;
  });
}

function renderBlueEmberPage(){
  const progress = beGetProgress();
  const isAdmin = document.body.classList.contains('is-admin');
  renderProgressControl();
  renderBeGrid('character', 'beCharacters', progress, isAdmin);
  renderBeGrid('world', 'beWorld', progress, isAdmin);
  renderBeGrid('beyond', 'beBeyond', progress, isAdmin);
}

function beCardMeta(e, progress, isAdmin){
  // "Book N" is shown to everyone — it's already implied by the fact this
  // card is visible at all (entry_tier <= progress gated it), so it adds
  // provenance, not a spoiler.
  const badges = [`<span class="be-badge be-badge-book">Book ${e.first_appearance||1}</span>`];
  if(isAdmin && e.status==='draft') badges.push('<span class="be-badge be-badge-draft">Draft</span>');
  if(isAdmin && e.entry_tier>progress) badges.push(`<span class="be-badge be-badge-tier">Tier ${e.entry_tier}</span>`);
  return badges.join('');
}

function renderBeGrid(kind, containerId, progress, isAdmin){
  const container = document.getElementById(containerId);
  if(!container) return;
  const entries = beVisibleEntries(kind, progress, isAdmin);
  const emptyEl = document.getElementById(containerId+'Empty');
  if(!entries.length){
    container.innerHTML='';
    if(emptyEl) emptyEl.style.display = (kind==='beyond') ? 'flex' : 'none';
    return;
  }
  if(emptyEl) emptyEl.style.display='none';
  container.innerHTML = entries.map(e=>`
    <button class="be-card" onclick="openBeDetail('${e.id}')">
      ${beCardMeta(e,progress,isAdmin)}
      <h3 class="be-card-name">${e.name}</h3>
      ${e.role?`<p class="be-card-role">${e.role}</p>`:''}
      <p class="be-card-summary">${e.summary||''}</p>
    </button>`).join('');
}

function openBeDetail(id){
  const e = _beEntries.find(x=>x.id===id);
  if(!e) return;
  const progress = beGetProgress();
  const isAdmin = document.body.classList.contains('is-admin');
  const sections = (e.sections||[]);
  const visible = sections.filter(s=>isAdmin || s.tier<=progress);
  const hiddenTiers = [...new Set(sections.filter(s=>!isAdmin && s.tier>progress).map(s=>s.tier))].sort((a,b)=>a-b);

  const relRows = (e.relationships||[]).filter(r=>isAdmin||r.tier<=progress).map(r=>{
    const target=_beEntries.find(x=>x.slug===r.with && x.kind==='character');
    return `<div class="be-rel"><span class="be-rel-label">${r.label||'Related'}</span>${target && (isAdmin||target.entry_tier<=progress) ? `<button class="be-rel-link" onclick="openBeDetail('${target.id}')">${target.name}</button>` : ''}${r.note?`<span class="be-rel-note">${r.note}</span>`:''}</div>`;
  }).join('');

  const quoteRows = (e.quotes||[]).filter(q=>isAdmin||q.tier<=progress).map(q=>
    `<blockquote class="be-quote">&ldquo;${q.text}&rdquo;<cite>${q.source||''}</cite></blockquote>`).join('');

  const sectionHtml = visible.map(s=>`
    <div class="be-section">
      ${s.heading?`<h3 class="be-section-heading">${s.heading}</h3>`:''}
      <div class="be-section-body">${renderBody(s.body)}</div>
    </div>`).join('');

  const hiddenNotice = hiddenTiers.length
    ? `<p class="be-hidden-notice">${hiddenTiers.length} section${hiddenTiers.length>1?'s':''} hidden. Contains spoilers for Book ${hiddenTiers.join(', Book ')}.</p>`
    : '';

  const adminBar = isAdmin ? `
    <div class="be-admin-bar">
      <span class="be-badge ${e.status==='approved'?'be-badge-approved':'be-badge-draft'}">${e.status}</span>
      <span class="be-badge be-badge-tier">Entry tier ${e.entry_tier}</span>
      <a class="btn-sm" href="/compose">Manage in Scriptorium →</a>
    </div>` : '';

  document.getElementById('beDetailBody').innerHTML = `
    ${adminBar}
    <p class="be-detail-kind">${e.kind}</p>
    <h2 class="be-detail-name">${e.name}</h2>
    ${e.role?`<p class="be-detail-role">${e.role}</p>`:''}
    ${quoteRows}
    ${relRows?`<div class="be-rels">${relRows}</div>`:''}
    ${sectionHtml}
    ${hiddenNotice}`;
  openModal('beDetailModal');
}

function slugify(s){ return (s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }

// ── ONE-TIME SEED: the starter content package, imported as drafts only.
// Never edited to 'approved' here — that's Caleb's call, from the Scriptorium.
async function seedBlueEmberContent(){
  const {data:existing,error:readErr} = await sb.from('be_entries').select('kind,slug');
  if(readErr){ toast('Could not read entries: '+readErr.message,'error'); return; }
  const have = new Set((existing||[]).map(e=>e.kind+':'+e.slug));
  const fresh = BE_SEED_DATA.filter(e=>!have.has(e.kind+':'+e.slug));
  if(!fresh.length){ toast('Every starter entry is already there','error'); return; }
  if(!confirm('Import '+fresh.length+' starter entries as drafts?'+(have.size?' ('+(BE_SEED_DATA.length-fresh.length)+' already exist and will be skipped.)':''))) return;
  const rows = fresh.map(e=>({...e, relationships:e.relationships||[], quotes:e.quotes||[], sections:e.sections||[]}));
  const {error} = await sb.from('be_entries').insert(rows);
  if(error){ toast('Import failed: '+error.message,'error'); return; }
  toast('Imported '+fresh.length+'. Review and approve each entry.');
  if(typeof loadBlueEmberPage==='function' && document.getElementById('beRoot')) await loadBlueEmberPage();
}

const BE_SEED_DATA = [
  {
    kind:'character', slug:'cade', name:'Cade', status:'draft', entry_tier:0, first_appearance:1,
    role:'Narrator of Book 1',
    summary:"A twenty-five-year-old psychologist in Colorado Springs who reads people carefully, puts them first, and is about to find out he can set things on fire.",
    relationships:[
      {with:'laila',tier:0,label:'Best friend',note:"The one who can find him underneath whatever he's presenting."},
      {with:'sutton',tier:0,label:'Best friend',note:"Shows up before he asks, and won't let him wave off a fall."},
      {with:'hades',tier:1,label:'Father',note:"The father-shaped space in Cade's life finally gets a name."}
    ],
    quotes:[
      {text:"The first time I set something on fire, I did not feel fear. I felt warmth.",source:"Book 1, Ch. 1",tier:0},
      {text:"Mythology had never been an escape for me. It had been a map I didn't know I was following.",source:"Book 1, Ch. 6",tier:1}
    ],
    sections:[
      {tier:0, heading:null, body:"<h3>At a glance</h3><ul><li><strong>Age:</strong> 25 when Book 1 opens. His birthday is February 27.</li><li><strong>Lives in:</strong> Colorado Springs, in an apartment with a bookshelf of mythology that has followed him through three apartments and two degrees.</li><li><strong>Work:</strong> Psychologist. His sessions with clients keep going even when the rest of his life stops making sense.</li><li><strong>Raised by:</strong> His mother, who never spoke ill of his father and never spoke much of him at all.</li><li><strong>Keeps close:</strong> Laila and Sutton.</li></ul><h3>The steady one</h3><p>Cade puts other people first, and he does it so naturally that he would not call it a choice. When someone he loves needs something, his own needs go quiet. It isn't performed. It's just the shape his love takes.</p><p>The cost is a layer between him and everyone else. He doesn't share what he's carrying because he doesn't want it to become their weight too, so the people who love him can only ever get so close. He can be in a room full of people who would do anything for him and still be slightly alone in it.</p><p>He also carries blame that isn't his. When something goes wrong near him, he takes the responsibility before anyone has offered it. This is not low self-worth. He's confident in his mind, curious about almost everything, and funnier than his gravity suggests. The guilt is more specific than insecurity: it's what love feels like when something harms the people it's aimed at.</p><p>He's good at people. That's the psychologist in him, but it's also just how he's built. He notices what sits underneath what someone presents, and he's the person others call in a crisis because he stays steady. The irony is that he applies none of that precision to himself. In Book 1 he catches himself saying \"I'm fine\" in the exact tone his clients use when they aren't.</p><p>None of this makes him heavy company. He finds things interesting and funny, and people want to be near him.</p><h3>Small details</h3><ul><li>He picks tables where he can see the door.</li><li>There's a small scar near his thumb from a kitchen accident years ago.</li><li>His safest childhood memory is sitting at the kitchen table while his mother balanced the bills, sunlight in her hair.</li></ul>"},
      {tier:1, heading:"What Book 1 shows", body:"<h4>A reflex before a power</h4><p>When the café ceiling comes down, the first thing Cade does is shove Sutton out of the way. That comes before the flame does. Everything he does with the fire afterward traces back to that instinct.</p><p>Weeks later, when a creature pulls itself out of the concrete of a parking garage, he steps between it and his friends without deciding to. \"Back,\" he says, and the word lands less like a threat than like a boundary. He isn't someone who reaches for the flame because he can. He reaches for it because someone needs protecting and he happens to be the person standing in the way.</p><h4>The flame, red and then blue</h4><p>It starts red, and it starts as reflex. Then a blue filament threads through the red, \"inhabiting the red rather than replacing it.\" Over the weeks of Sutton's lab sessions the flame stops needing a rupture or a panic to appear. It needs attention. That is the part that unsettles him. He is more disturbed by how normal it has started to feel than by anything it does.</p><h4>A map he didn't know he was following</h4><p>Cade has always loved the gods who live apart from the others, the ones who \"occupied thresholds rather than thrones.\" Separation, he admits, always resonated with him more than spectacle. When he rereads those stories after the flame appears, he senses something father-shaped brushing against the edge of the space his father left. Mythology, he realizes, was never an escape. It was a map.</p><h4>The name</h4><p>His mother finally tells him what his father called himself when they met: Aiden. Hours later, in one of the old texts he's reading with Laila and Sutton, Cade notices a name written in an older form of Greek that looks like it might share a root. Laila gives a sensible explanation for why names drift between languages. It's a good explanation. It just doesn't stay convincing.</p><p>By the end of the book he knows who Aiden was, and who has been watching him from the shadows.</p>"}
    ],
    source_notes:"Book 1 working manuscript (Ch. 1, 3, 6, 8, 21-25) and 'Cade Series Character Arc' (Human Core section only). Verify quotes against final copyedited text. HELD BACK: everything from Book 2 onward, the author-self note, and all arc material about later books."
  },
  {
    kind:'character', slug:'laila', name:'Laila', status:'draft', entry_tier:0, first_appearance:1,
    role:"Cade's best friend",
    summary:"Cade's closest friend: a psychology student and tarot reader who hears what's underneath what people say.",
    relationships:[
      {with:'cade',tier:0,label:'Best friend',note:"Built earliest and deepest of the three. She reads him under whatever he's presenting."},
      {with:'sutton',tier:0,label:'Best friend',note:"Sutton reaches for data when something's wrong; Laila reaches for the feeling under the data. They usually arrive at the same answer by different roads."}
    ],
    quotes:[
      {text:"It wasn't prophecy. It was symbolic language. A mirror. A way to give people words.",source:"Book 1, Ch. 7",tier:0},
      {text:"Not evil. Binding. Power tied to something older than surface choice.",source:"Book 1, Ch. 7",tier:1}
    ],
    sections:[
      {tier:0, heading:null, body:"<h3>At a glance</h3><ul><li><strong>Reads tarot,</strong> and used to do it at the café where she worked: slow afternoons, bad tips, spreads for coworkers. Her deck's edges are soft from years of handling.</li><li><strong>Studies psychology</strong> formally, though she'd say she was already doing it before she had the words.</li><li><strong>Practices witchcraft.</strong> The crystals, the spells she makes for the people she loves. None of it is an affectation. It's the oldest language she has for noticing more than what's visible.</li><li><strong>The one who touches things.</strong> At a market stand she'll pick up every bar of handmade soap and ask the vendor questions she doesn't need answers to, as if texture mattered more than scent.</li></ul><h3>The listener</h3><p>Laila is the most present person in the trio. She exists in a room fully, without the part of herself that most people keep slightly elsewhere. Over the years she noticed that her attention was something people needed, so she gave it freely, and it became the way she knows how to love.</p><p>She listens at a level most people don't. She hears the thing under the thing. She's also self-aware about how that can land, so she'll say \"not trying to use therapy speak, but\" before she offers something that came from care rather than professional distance. The qualifier isn't insecurity. It's her making sure the care arrives as love and not as analysis.</p><p>Her tarot works the same way. She's clear that the cards aren't prophecy. They're a mirror: a structure that lets her say true things she might otherwise hold back, and gives other people words for what they feel.</p><p>She has an emo side in the honest sense. She feels things deeply, doesn't pretend otherwise, and is drawn toward the weight of things rather than frightened by it. She sits with the heavy stuff and doesn't rush it. That isn't darkness in her. It's depth.</p><p>In the trio she's the emotional center, which is not the same as the leader. She doesn't fix the room's feelings. She makes the room large enough to hold what's actually in it.</p>"},
      {tier:1, heading:"What Book 1 shows", body:"<h4>The first one to move</h4><p>In the café collapse, when a child starts to cry, Laila changes direction. \"She said she had her,\" Cade remembers. \"I believed her.\"</p><h4>She names the pattern early</h4><p>Weeks before anyone else will say it out loud, she is the one watching Cade and using the word \"converging.\" She doesn't want to talk about it under fluorescent lights or in front of monitors. She asks to meet somewhere with sky above them, and they stand at the edge of Garden of the Gods, in front of rock that feels older than the city.</p><p>She has stopped pulling cards for other people. She's been pulling them for him. The Tower, Judgment, the Devil. \"Not evil,\" she tells him. \"Binding.\"</p><h4>The one with the explanation</h4><p>When Cade points to a Greek name in an old text that looks a lot like the name his mother gave him for his father, Laila is the one who explains how names shift across translations and centuries. It's careful, accurate, and reassuring. It also does exactly what a good rational explanation does: makes the resemblance feel like it doesn't mean anything.</p><p>She is also the first to say the word \"veil\" out loud in the alley, moments before the flame does something it has never done.</p><h3>Beyond the page: what past relationships cost her</h3><p>Laila has often been more of a mother than a partner. Her gift for feeling what others need is strong enough to override her own needs before she notices. She orients toward what the other person requires, gives it, keeps giving it, and when the relationship finally has to end she feels guilty for leaving. She tries to justify what was done to her instead of letting it be unjust. Leaving costs her twice: once for going, and once for the guilt.</p><p>This isn't low self-worth. She knows who she is and trusts her sight. It's more particular than that. Her care is so instinctive that it can become the whole of a relationship before she's realized it, and by then the other person has learned to receive without giving back and she has learned to call that normal.</p><p>What she hasn't had yet is someone who sees her first. Not her warmth, not her beauty, not the care she provides. Her: the way her mind works, something she says that lands and makes the other person stop.</p>"}
    ],
    source_notes:"Book 1 working manuscript (Ch. 1, 5, 7, 21-25) and 'Laila Series Character Arc' (Human Core, The Wound). HELD BACK: the grandmother and bloodline material, her sight as anything beyond strong intuition, and everything from Book 2 onward. Caleb should confirm the 'wound' block before approving."
  },
  {
    kind:'character', slug:'sutton', name:'Sutton', status:'draft', entry_tier:0, first_appearance:1,
    role:"Cade's best friend and the group's researcher",
    summary:"The scientist of the trio: precise, blunt, and one of the kindest people Cade knows.",
    relationships:[
      {with:'cade',tier:0,label:'Best friend',note:"Documents what he can't explain, and checks his hands for burns before she checks anything else."},
      {with:'laila',tier:0,label:'Best friend',note:"Complementary instincts: what can be measured and what can't."}
    ],
    quotes:[
      {text:"I can measure what it's doing. I cannot predict the end point. And I don't like not knowing the end point.",source:"Book 1, Ch. 6",tier:1}
    ],
    sections:[
      {tier:0, heading:null, body:"<h3>At a glance</h3><ul><li><strong>Work:</strong> Researcher. She runs the monitoring and experimentation the group relies on and moves through a lab \"as if it belonged to her.\"</li><li><strong>Fascinated by bones.</strong> Not as a professional quirk but as a real love. She studied them in school, did lab work with them, and considered working in a morgue so she could study them more closely. She finds what a skeleton can say about a life and a death, and the long time between, genuinely beautiful.</li><li><strong>Family:</strong> A younger sister, and an intact family. Sutton took the protective role without being asked, the way she does everything.</li><li><strong>Bookshelf:</strong> Dense research texts with annotations and folded corners.</li></ul><h3>Warm and sharp are the same thing</h3><p>Sutton is smart, and she knows it, but that's not who she is. Who she is: someone who shows up before you ask. She waters the plant without announcing it. She makes food when nobody requested food. She checks in on people because she can tell something is off before they say so.</p><p>The precision and the kindness aren't in tension. They're the same trait in different registers. Every spreadsheet, sensor calibration, and field note is an act of love aimed at the people she's trying to protect. The logic is how she says it.</p><p>If someone harms someone she loves, she will put that person in their place. Not aggressively. Precisely. She makes them see exactly what they did.</p><p>She's also open to the supernatural. She's no credulous believer and doesn't accept things without evidence, but she is curious about things beyond what can currently be measured. When the strange things start happening, she isn't a reluctant convert. She's electrified. She'd been waiting for something to be real.</p><p>Together, the three of them have a rare ease: hours together that feel like rest instead of effort. Sutton doesn't let many people fully in. The ones she does, she loves fiercely.</p>"},
      {tier:1, heading:"What Book 1 shows", body:"<h4>The person who builds the map</h4><p>It's Sutton who first sees the pattern. She layers timestamps over incident reports, adds a marker to the city map every time another transformer fails or a sidewalk buckles, and watches the curve tighten. \"Tell me you don't see it,\" she says. When Cade says the events are narrowing, she corrects him: \"It's clustering.\" The word lacks its usual certainty.</p><h4>The lab as a monitoring station</h4><p>For weeks Sutton runs sessions with Cade in a research building that empties at dusk, charting what the flame does to him with a steadiness that isn't coldness. Emotion lives in her, too; she just compartmentalizes. What worries her isn't that the flame happens. It's the cumulative shift she sees in the data, and the fact that she can't predict where it ends.</p><h4>The bone</h4><p>When the ruptures leave debris behind, it's Sutton who freezes over a fragment of bone that survived heat that should have destroyed it. She wraps it in cloth, images it, and compares the fine markings on it to symbols in a notebook. Her hypothesis: if those symbols define boundaries, the bone might not just be evidence of something crossing over. It could be part of whatever maintains the separation.</p>"}
    ],
    source_notes:"Book 1 working manuscript (Ch. 1, 3, 6, 7, 14, 21-25) and 'Sutton Series Character Arc' (Human Core, The Younger Sister). HELD BACK: her past with Beau, her fear of being 'not enough if not useful', why she stayed in Colorado, and everything from Book 2 onward."
  },
  {
    kind:'character', slug:'hades', name:'Hades', status:'draft', entry_tier:1, first_appearance:1,
    role:"The Watcher; Cade's father",
    summary:"The god of the underworld, who watched Cade from the shadows through Book 1 and finally spoke.",
    relationships:[
      {with:'cade',tier:1,label:'Father',note:"Known to Cade's mother, in the mortal world, as Aiden."}
    ],
    quotes:[
      {text:"The veil was meant to protect the world from what exists within you.",source:"Book 1, Ch. 25",tier:1}
    ],
    sections:[
      {tier:1, heading:null, body:"<h3>At a glance</h3><ul><li><strong>Who:</strong> Hades, ruler of the underworld in the oldest stories.</li><li><strong>Known in the mortal world as:</strong> Aiden. That's the name Cade's mother knew him by.</li><li><strong>In Book 1:</strong> A shadow that watches, then a voice, then a man in a long coat in an alley near the café.</li></ul><h3>The Watcher</h3><p>He is never in the story the way the creatures are. There's no rupture, no tearing air. In the early chapters he's a presence at the edge of things: a shadow along the edge of Cade's apartment window the night his mother visits, a figure in reflections when the flame reacts to something Cade can't explain. He never attacks. He watches.</p><p>Then the voice starts, and it arrives inside Cade's thoughts in pieces, like something pushing through a distance it wasn't meant to cross.</p><p>\"Cade.\"<br>\"Not… yet.\"<br>\"Son.\"<br>\"Barrier… failing.\"<br>\"Not… safe.\"<br>\"Two… forces.\"<br>\"Son… listen.\"<br>\"Too soon.\"</p><p>When he finally steps out of the shadow in the alley, he looks almost ordinary. The air around him doesn't warp. Cade notices only that the structure of his face carries a familiarity he can't place. Then, as the blue flame hovers over Cade's palm, a blue light gathers behind the man's eyes too, the same shade, controlled and deliberate, as if he's choosing to let Cade see something that was always there.</p><h3>What he tells Cade</h3><p>He confirms what the voice already said: Cade is his son. He says his mother knew him \"by another name,\" but \"the name that matters now is the one preserved in the oldest stories.\" Then: \"I am Hades.\"</p><p>He doesn't explain himself. What he offers instead is a correction. Cade has feared the fractures because he believed they were the threat. The veil, Hades says, was never meant to protect Cade's world from what lies beyond it. It was meant to protect the world from what exists within Cade.</p><p>The scene ends there, on the sentence and not the answer.</p><h3>In the old stories</h3><p>In Greek tradition, Hades is both a god and a place: the ruler of the dead, and the realm he rules. He rarely leaves the underworld and has a reputation for keeping to himself. The ancient sources also call him by other names. Older Greek forms include Aides and Aidoneus, and he's sometimes called Plouton, the wealth-giver, because the riches of the earth, its metals and seeds, come from below.</p><p>That's why, in Book 1, a name in an old Greek spelling can look \"similar, but not the same\" as the shorter name Cade's mother remembers. Names in ancient stories change as they cross languages and centuries, and the older forms tend to be longer.</p>"}
    ],
    source_notes:"Book 1 working manuscript (Ch. 21-25 only) and 'Hades Series Character Arc' (Book One section only). HELD BACK: everything about why Hades made his choices, what he withholds, and every later book. The 'In the old stories' section is general Greek-mythology background written by Claude for the site, not series canon — confirm before approving or cut it."
  },
  {
    kind:'world', slug:'the-blue-flame', name:'The Blue Flame', status:'draft', entry_tier:0, first_appearance:1,
    summary:"Fire that starts red, as reflex, and changes.",
    sections:[
      {tier:0, heading:null, body:"<h3>Where it starts</h3><p>The first time it happens, Cade doesn't feel fear. He feels warmth: measured, almost patient, in his hands before he has decided to raise them. Red light meets a falling beam, and the wood blackens and breaks before it reaches his shoulders.</p>"},
      {tier:1, heading:null, body:"<h3>Red, then blue</h3><p>The red flame is instinct. It answers danger, and it works: it shatters steel and warps beams. But it isn't the whole thing.</p><p>Over weeks of testing, Cade notices a cooling at the center of the ember. A blue filament threads through the red, \"inhabiting the red rather than replacing it.\" It doesn't flare or surge the way the red does. It aligns. Over time, igniting the flame stops needing a rupture, panic, or anger. It needs attention.</p><h3>What it costs</h3><ul><li>A dull ache behind the eyes after long sessions.</li><li>Hands that stay warm for hours.</li><li>A pressure that builds with each rupture, sometimes with a nosebleed, and, in the last chapters, glowing eyes.</li><li>Sutton's data shows a cumulative shift inward that she can measure but can't predict.</li></ul><h3>How Cade uses it</h3><p>Never for its own sake. His first controlled use of the flame is protecting Sutton and Laila, not as a moment of glory but as the reflex of someone who decided long before he had any power that other people came first. Every use afterward traces back to that.</p>"}
    ],
    source_notes:"Book 1 working manuscript (Ch. 1, 3, 6, 8, 24, 25) and 'Cade Series Character Arc' (First Controlled Use of the Flame)."
  },
  {
    kind:'world', slug:'the-veil', name:'The Veil', status:'draft', entry_tier:1, first_appearance:1,
    summary:"The barrier between the mortal world and what lies beyond it, and what Hades says it was really for.",
    quotes:[{text:"The veil was meant to protect the world from what exists within you.",source:"Book 1, Ch. 25",tier:1}],
    sections:[
      {tier:1, heading:null, body:"<h3>What Book 1 says</h3><p>The word \"veil\" enters the book in its second half, as Cade's name for the boundary the fractures keep straining. He feels it as physical pressure, \"thin and elastic, bending but refusing to tear.\" When creatures cross, the membrane thins under repeated strain.</p><h3>The theory in the notebook</h3><p>Sutton and Laila compare the markings on the bone fragment with symbols in an old notebook. The lines intersect in patterns too ordered to be damage. Sutton's working theory is that if those symbols define boundaries, the bone may not only be evidence of something crossing over. It may be part of whatever maintains the separation.</p><h3>What Hades says</h3><p>In the alley, Hades tells Cade that the fractures were never the danger he believed. The veil \"was never meant to protect your world from what lies beyond it.\"</p><p>He finishes the sentence: it was meant to protect the world from what exists within Cade.</p><p>The book ends before he explains what that means.</p>"}
    ],
    source_notes:"Book 1 working manuscript (Ch. 14, 16, 20-25 only). HELD BACK: all cosmology, history, and mechanics from Caleb's series bible."
  },
  {
    kind:'world', slug:'ruptures', name:'Ruptures', status:'draft', entry_tier:0, first_appearance:1,
    summary:"Tremors, outages, and cracks in the pavement that each have a reasonable explanation, until they don't.",
    sections:[
      {tier:0, heading:null, body:"<h3>The pattern</h3><p>It doesn't start with monsters. It starts with the news: a smoldering apartment building, a collapse, a ruptured gas line. Then a tremor that rattles glassware and sends dogs barking. A power outage that lasts less than a minute. A stretch of sidewalk that buckles overnight, a transformer failure two streets north, a gas leak contained before ignition.</p><p>Each event, taken alone, has an explanation. Aging infrastructure. Minor fault shifts. Cities settle under their own weight. Sutton's gift is refusing to take them alone. When she lays them out in order on a city map, they form an arc that tightens toward one place.</p><h3>What to watch for</h3><ul><li>Tremors that move through the ground and into the body.</li><li>Small failures clustering in one direction on the map.</li></ul>"},
      {tier:1, heading:null, body:"<h3>What a rupture looks like up close</h3><p>Near a rupture, the air wavers like heat, then thickens. A jagged seam opens along a wall and widens as the pressure builds.</p><h3>What comes through</h3><p>In Book 1, a rupture is a tear in something that should hold. When the seam opens, things cross.</p><p>The first creature Cade meets rises out of a parking garage floor. It doesn't lunge. It's still, almost deliberate, with elongated claws, a gaunt frame, and smoke-veined fissures that seem to breathe in a measured rhythm. It looks at Cade with something that feels like recognition. When he hits it with the red flame, it absorbs the force and rebalances. Red, he realizes, doesn't work on this one.</p><p>By the end of the book the tears are no longer small. In the final one, near the café, multiple creatures cross at once, on live television.</p><h3>Cade and the ruptures</h3><p>Cade feels ruptures before they happen. A pressure builds behind his eyes and in his chest, and the flame responds like a reflex. In the last chapters he learns something new about the connection: the pull can point somewhere. Not every sign is a warning.</p>"}
    ],
    source_notes:"Book 1 working manuscript (Ch. 1, 6, 7, 8, 25). The creature description is limited to what Book 1 states on the page."
  },
  {
    kind:'world', slug:'the-bone-fragment', name:'The Bone Fragment', status:'draft', entry_tier:1, first_appearance:1,
    summary:"Marked bone that survived heat it shouldn't have, found in the rubble of a rupture.",
    sections:[
      {tier:1, heading:null, body:"<h3>The find</h3><p>Sutton spots it while sifting through the rubble after a rupture: a small piece of bone, \"darker but unburned despite surrounding heat damage,\" marked with fine lines. She wraps it in cloth without meaning to make a ceremony of it.</p><p>Under hospital lighting it looks darker. Under magnification the markings turn out to be precise: \"lines intersecting in patterns too ordered to dismiss as damage.\"</p><h3>What they notice</h3><ul><li><strong>Laila:</strong> \"It feels old. Not just ancient. Older than something that should still exist here.\" She holds her fingers near it without touching it.</li><li><strong>Sutton:</strong> the intersecting lines match symbols in a notebook they're already working through.</li><li><strong>Cade:</strong> when he touches it, the ember under his skin responds, and the warmth doesn't fully settle after he lets go. Later Sutton points out that the reaction is measurable and tied to him specifically, and that whatever the bones are, they don't behave like inert evidence.</li></ul><h3>The open question</h3><p>At the end of Book 1 the group has a fragment, a theory, and no answer. Sutton's guess is that it may be part of whatever maintains the boundary between worlds. Nobody in the story knows yet whether she's right.</p>"}
    ],
    source_notes:"Book 1 working manuscript (Ch. 10-14, 22 only). HELD BACK: what the bones are and everything about their role later in the series."
  },
  {
    kind:'world', slug:'colorado-springs', name:'Colorado Springs', status:'draft', entry_tier:0, first_appearance:1,
    summary:"The city at the foot of the mountains where Blue Ember begins: real, high, and older-feeling than anything built on it.",
    quotes:[{text:"From certain angles, Colorado Springs looks permanent.",source:"Book 1, Ch. 1",tier:0}],
    sections:[
      {tier:0, heading:null, body:"<h3>The setting</h3><p>Blue Ember is set in the real Colorado Springs, Colorado. The story opens on a still morning before sunrise, when the mountains hold their shape in shadow and the air is thin enough that every distant sound carries. It sits at roughly 6,000 feet, and the book leans on that thin, clear quiet.</p><p>The city is mostly ordinary: apartments, a research building that empties by dusk, a café with a back table where Cade likes to see the door. What sets it apart is what surrounds it.</p><h3>Garden of the Gods</h3><p>Garden of the Gods is a real public park on the western edge of the city, known for its towering red sandstone formations. In the book it's the trio's thinking place. The rock reads as ancient in a way that makes the rest of the city feel temporary, \"as though buildings and roads were only brief interruptions in something far older.\"</p><p>Laila is the one who says it best: the place always feels older than the rest of the city, \"like it remembers something we don't.\"</p>"},
      {tier:1, heading:"The café", body:"<p>The café where Book 1 begins is more than the place where it starts. It's where the first rupture appears, where the flame first shows itself, and, by the end, the center of a map the three of them uncover in an old book. Laila has a line for it: \"Places remember things.\"</p><p>When they return to the block near the end of the book, the repairs are done and the windows reflect a quiet street as if nothing violent ever happened there.</p>"}
    ],
    source_notes:"Book 1 working manuscript (Ch. 1, 7, 24). Real-world facts (elevation, Garden of the Gods) are general knowledge added for context."
  }
];
