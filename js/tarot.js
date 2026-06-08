// ══ THE BLUE EMBER TAROT ══
// A hidden 78-card deck. Cards peek from the page edges; click one to draw.
// Procedural art now, image-ready later: set `imagePath` on any card and the
// face swaps from the rune emblem to the illustration with no other changes.

function _maj(id, name, trad, up, rev, theme){
  return { id, arcana:'major', suit:null, number:id, name, traditionalName:trad,
           upright:up, reversed:rev, theme, imagePath:'' };
}
function _min(suit, rank, name, up, rev){
  const theme = { flames:'Divine power', bones:'Knowledge', ruptures:'Consequence', runes:'Intuition' }[suit];
  return { id:suit+'-'+rank.toLowerCase(), arcana:'minor', suit, number:rank, name,
           traditionalName:'', upright:up, reversed:rev, theme, imagePath:'' };
}

const TAROT_DECK = [
  // ── Major Arcana — Cade's arc: Discovery (0–VII), Fracture (VIII–XIV), Integration (XV–XXI) ──
  _maj('0','The Vessel','The Fool',
    'New beginnings, innocence, a leap into the unknown. Power not yet understood. The moment before everything changes.',
    'Naivety becomes danger. Refusing to accept the weight of what is coming. Standing at the edge but stepping back.','Discovery'),
  _maj('I','The Flame','The Magician',
    'Mastery of power. The ability to shape reality through will and knowledge. The blue flame as divine authority. You have what you need.',
    'Power without direction. The flame burning too hot, too fast. Skill used for the wrong purpose or in the wrong moment.','Discovery'),
  _maj('II','The Seer','The High Priestess',
    'Intuition over logic. Patterns seen before they are understood. Laila’s gift: reading what others cannot. Trust what you sense.',
    'Intuition suppressed or ignored. The vision refused because it is inconvenient. Information withheld from those who need it.','Discovery'),
  _maj('III','The Mother','The Empress',
    'Unconditional love as the foundation of power. Hailey’s presence: warmth that makes strength possible. Protection through sacrifice.',
    'Grief unprocessed. The wound left by love that has been taken. The absence that reshapes everything around it.','Discovery'),
  _maj('IV','The Underworld King','The Emperor',
    'Ancient authority. A decision made from a place of power that carries consequences for generations. Hades: the father who believed he was protecting.',
    'Authority without wisdom. A plan that made sense alone becomes catastrophic in contact with reality. Control that destroys what it meant to preserve.','Discovery'),
  _maj('V','The Scholar','The Hierophant',
    'Knowledge as access. Benjamin: the researcher who arrives with questions and leaves with understanding. History as the key to the present.',
    'Obsession with knowledge as a substitute for healing. Chasing answers to avoid feeling the grief underneath the questions.','Discovery'),
  _maj('VI','The Other Half','The Lovers',
    'Two halves of one whole. The recognition that what feels like an enemy may be necessary. Integration over destruction. The choice toward wholeness.',
    'Rejection of the shadow self. Choosing the comfortable half and discarding the rest. Incompleteness mistaken for safety.','Discovery'),
  _maj('VII','The Rupture','The Chariot',
    'Forward motion through the tear in reality. Controlled power aimed at a single purpose. Victory through will when the world is literally splitting open.',
    'Charging into chaos without direction. Power without a destination tears more than it closes. Speed that creates the very rupture it meant to seal.','Discovery'),
  _maj('VIII','The Fracture','Strength',
    'Holding on when darkness is consuming from within. The fierce refusal to let go entirely. Strength is not the absence of breaking — it is continuing anyway.',
    'The grip finally failing. Surrender to the darkness not from peace but from exhaustion. The moment before the vessel cracks.','Fracture'),
  _maj('IX','The Hollow King','The Hermit',
    'Isolation as consequence. Dark Cade alone with what remains of an identity. The question: what are you when everything that defined you is gone?',
    'Solitude weaponized. Using absence to punish those who would not accept you. Loneliness turned outward as resentment.','Fracture'),
  _maj('X','The Veil','Wheel of Fortune',
    'The boundary between worlds holds everything in balance. What seems like fate is actually a system — and systems can be understood, repaired, restored.',
    'The Veil at its breaking point. Forces beyond control converging. The wheel turning whether anyone is ready or not.','Fracture'),
  _maj('XI','The Rune','Justice',
    'Truth encoded in symbol. The rune does not judge — it reveals. What is drawn with meaning carries meaning. Cause and consequence as a precise system.',
    'The rune misread or misdrawn. Intention without understanding. Power that backfires because the language was not fully known.','Fracture'),
  _maj('XII','The Descent','The Hanged Man',
    'Suspension between worlds. The necessary pause where nothing can be forced. What looks like defeat is actually the stillness before integration.',
    'Refusing to hang still. Fighting the suspension and making it worse. The moment that requires acceptance met with struggle.','Fracture'),
  _maj('XIII','The Sacrifice','Death',
    'Hailey’s rune. The ending that makes the return possible. Transformation through loss. What she gave without knowing the full meaning of what she gave.',
    'The transformation refused. Clinging to what must be released. Grief that becomes stagnation rather than passage.','Fracture'),
  _maj('XIV','The Balance','Temperance',
    'Blue flame and black shadow in equal measure. Neither erasing the other. The long work of integration: not victory of one side but the patient blending of both.',
    'Imbalance mistaken for strength. One force dominating because the other was never allowed to exist. The vessel cracking under pressure.','Fracture'),
  _maj('XV','The Binding','The Devil',
    'The chains are made of the same rune light as the power. What binds you is not external — it was woven from your own inheritance. Recognition is the first freedom.',
    'The chains accepted as identity. The darkness believed to be the whole self. Mistaking the cage for the person inside it.','Integration'),
  _maj('XVI','The Divided Flame','The Tower',
    'The structure must come down. The false separation between light and dark cannot hold. The crack is not failure — it is the necessary collapse before something true can be built.',
    'Collapse without purpose. Destruction that leaves nothing behind. The tower falling because no one understood what it was holding up.','Integration'),
  _maj('XVII','The Return Rune','The Star',
    'Hope drawn without full understanding. Hailey’s last act: a beacon she did not consciously choose. The rune that means return. The light left behind for someone who needed a way back.',
    'The beacon missed or arrived too late. The guide present but not recognized. Hope that does not reach the person it was meant for.','Integration'),
  _maj('XVIII','The Shadow','The Moon',
    'Dark Cade in the space between. What is not fully seen is not fully understood. The shadow carries its own truth — look at it directly before drawing conclusions.',
    'Fear of the shadow turning it into something monstrous. The refusal to look becoming the thing that gives darkness its power.','Integration'),
  _maj('XIX','The Divine Heir','The Sun',
    'Cade’s full power recognized. The divine inheritance not as burden but as truth. Clarity after the long dark. The moment when even gods step back.',
    'Power without the wisdom of the journey. Brightness that blinds rather than illuminates. The heir who has not yet earned what they carry.','Integration'),
  _maj('XX','Blood and Fire','Judgement',
    'The confrontation that was always coming. Father and son across the chasm. The truth that can only be spoken when both are ready to hear it. Forgiveness as a choice, not a feeling.',
    'The reckoning refused or arrived too soon. Truth without compassion. The bridge built before both sides are ready to cross.','Integration'),
  _maj('XXI','Whole','The World',
    'Integration complete. Blue flame and shadow unified. The last ember before the becoming. Not the end — the arrival. Cade as he was always meant to be.',
    'The threshold not crossed. Standing at the door of wholeness and turning back. The incomplete vessel that could have been complete.','Integration'),

  // ── Suit of Flames (Wands) — passion, power, divine inheritance ──
  _min('flames','Ace','Ace of Flames',
    'The first ember. Raw potential awakening. Something in you is stirring that has always been there.',
    'Power suppressed. The flame present but refused. Fear of what the awakening might cost.'),
  _min('flames','Two','Two of Flames',
    'Two forces in early tension. The red flame and the blue not yet reconciled. Creative friction that could become something.',
    'Conflict between aspects of power. The two flames fighting instead of blending. Instability that has not found its direction.'),
  _min('flames','Three','Three of Flames',
    'Early mastery building. The runes beginning to take shape. Growth through practice and trust in the process.',
    'Growth stalled by impatience. Runes attempted before the language is understood. The fire that burns the hand reaching too fast.'),
  _min('flames','Four','Four of Flames',
    'Stability in power. A moment of rest between ruptures. The flame steady enough to pause and assess the landscape.',
    'Restlessness in stability. The flame too controlled, becoming distant. Power held so carefully it loses its warmth.'),
  _min('flames','Five','Five of Flames',
    'Conflict between competing fires. The group’s different approaches clashing. Necessary friction that will eventually produce clarity.',
    'Conflict that becomes destructive rather than clarifying. The argument that tears instead of sharpens. Power turned against allies.'),
  _min('flames','Six','Six of Flames',
    'The flame used in service of return. Coming back to something that was lost. The blue fire as a guide home.',
    'Delayed return. The path back longer and harder than expected. Power used for the journey but the destination not yet in sight.'),
  _min('flames','Seven','Seven of Flames',
    'Holding the line. The single flame against the pressure of ruptures. Determination when the odds are not favorable.',
    'Overwhelmed by incoming forces. The flame flickering under too much pressure. Courage present but insufficient alone.'),
  _min('flames','Eight','Eight of Flames',
    'Speed and precision in the use of power. The rune drawn in motion. Action under pressure that somehow lands exactly right.',
    'Haste without accuracy. The rune drawn wrong because there was no time. Speed that creates new problems instead of solving the current one.'),
  _min('flames','Nine','Nine of Flames',
    'Mastery approaching its fullest expression. The flame and the shadow beginning to move as one. The vessel nearing completion.',
    'Mastery at the threshold of arrogance. Power so developed it no longer listens. The flame burning so brightly it forgets what it is for.'),
  _min('flames','Ten','Ten of Flames',
    'The final form. Blue flame and black shadow unified. Everything the vessel was created to hold, finally in balance.',
    'Incomplete integration. The ten reached but not sustained. The wholeness glimpsed but not yet lived.'),
  _min('flames','Page','Page of Flames',
    'A young person encountering power for the first time. Cade at the beginning: curious, open, slightly afraid of what he is holding.',
    'Immaturity with power. The Page who wants the flame without the understanding. Enthusiasm that will need tempering.'),
  _min('flames','Knight','Knight of Flames',
    'Cade in action. Moving through ruptures with growing confidence. The Knight of Flames charges where others hesitate.',
    'Recklessness in power. Charging through ruptures without sufficient understanding. The flame used before the rune has been fully drawn.'),
  _min('flames','Queen','Queen of Flames',
    'Laila as fire: intuition that burns as brightly as any direct power. The Queen of Flames reads the pattern before it speaks.',
    'Intuition weaponized or suppressed. The fire turned inward until it consumes rather than illuminates.'),
  _min('flames','King','King of Flames',
    'Hades as the King of his own element. Fire as ancient authority. The divine flame at its most complete and most costly.',
    'Authority without accountability. Power that protects itself at the expense of what it was meant to guard. Hades’ worst choice.'),

  // ── Suit of Bones (Pentacles) — knowledge, archaeology, evidence ──
  _min('bones','Ace','Ace of Bones',
    'A fragment of underworld matter in the hand. Knowledge waiting to be understood. The first discovery that changes the shape of the investigation.',
    'Evidence overlooked. The bone present but its meaning missed. Information that would change everything, ignored.'),
  _min('bones','Two','Two of Bones',
    'Two pieces that do not yet connect. Benjamin’s early research: fragments without a full picture. The patience required to hold incomplete knowledge without forcing a conclusion.',
    'Forcing two incompatible pieces together. The theory that satisfies emotionally but does not actually fit the evidence.'),
  _min('bones','Three','Three of Bones',
    'Collaboration producing understanding. Sutton, Benjamin, and Laila reading the same fragments from different disciplines. Three perspectives creating one clearer picture.',
    'Collaboration breaking down. Each person certain their interpretation is correct. Knowledge that divides instead of uniting.'),
  _min('bones','Four','Four of Bones',
    'The archive. Everything gathered and organized. Sutton’s careful documentation as the foundation the group will build on. The value of knowing what you know.',
    'Hoarding information. Knowledge kept instead of shared. The archive that protects its keeper from having to act.'),
  _min('bones','Five','Five of Bones',
    'Loss of resources or knowledge. The bones misread, the totem built wrong. Failure as information. What does not work still teaches, if you are willing to learn from it.',
    'Refusing to acknowledge the failure. Rebuilding the same wrong structure and expecting different results.'),
  _min('bones','Six','Six of Bones',
    'Knowledge shared generously. Benjamin bringing his research to the group without reservation. Understanding offered as a gift, not leverage.',
    'Knowledge withheld as power. Information given only when it benefits the keeper. The scholar who does not teach.'),
  _min('bones','Seven','Seven of Bones',
    'Assessment of what has been accumulated. The long look at the research and asking: is this actually leading somewhere? Strategic patience in the investigation.',
    'Doubt about the entire direction. Wondering whether all the gathered knowledge has been gathering toward nothing.'),
  _min('bones','Eight','Eight of Bones',
    'Mastery through repetition. The skill that comes from doing the same careful work many times. Beau’s engineering: reliable because it was never rushed.',
    'Perfectionism that prevents completion. The work never finished because it never feels ready enough.'),
  _min('bones','Nine','Nine of Bones',
    'Earned knowledge. The understanding that only comes from having been through everything. Benjamin at the end: not the researcher chasing answers, but the person who found something he did not expect.',
    'Knowledge without wisdom. All the information accumulated but none of it integrated into how you live.'),
  _min('bones','Ten','Ten of Bones',
    'The complete record. The totems rebuilt, the Veil restored, the bones returned to their purpose. Everything that was gathered now used for what it was always meant to be.',
    'A legacy of incomplete work. Knowledge that outlasts its keeper without being finished. The archive that was never fully translated.'),
  _min('bones','Page','Page of Bones',
    'Benjamin at the beginning of his search: young, driven by grief, not yet knowing what he is looking for. The student who has just found the first fragment.',
    'Research driven by the wrong question. The Page of Bones searching for blame rather than understanding.'),
  _min('bones','Knight','Knight of Bones',
    'Rowan on the road. Decades of moving toward an answer that keeps shifting just out of reach. The Knight of Bones does not stop — even when the map runs out.',
    'The pursuit that has become its own purpose. Moving because stopping would mean acknowledging the grief underneath the motion.'),
  _min('bones','Queen','Queen of Bones',
    'Sutton as the keeper of evidence. The Queen of Bones does not let feeling distort the record. Precision as a form of care: if the data is wrong, people get hurt.',
    'Emotional suppression disguised as objectivity. The Queen of Bones whose precision becomes a wall against her own grief.'),
  _min('bones','King','King of Bones',
    'Benjamin at the end of his arc: the scholar who found not just answers but forgiveness. The King of Bones holds the full record and chooses understanding over revenge.',
    'The King who never reached forgiveness. Knowledge weaponized. The historian who uses the past as a reason not to move forward.'),

  // ── Suit of Ruptures (Swords) — conflict, truth, consequence ──
  _min('ruptures','Ace','Ace of Ruptures',
    'The first tear. Truth cutting through. The moment the world shows its real shape. Ruptures are not only destructive — they are honest.',
    'The truth avoided. The tear sealed before what came through could be acknowledged. Suppression that builds pressure.'),
  _min('ruptures','Two','Two of Ruptures',
    'Holding two truths at once. The impossible balance between who Cade is and what he carries. The moment before choosing a direction.',
    'False balance. Pretending two incompatible things can both be true indefinitely. The stalemate that is actually a slow collapse.'),
  _min('ruptures','Three','Three of Ruptures',
    'Grief acknowledged. Hailey’s death. The wound that cannot be argued away or rationalized. Feeling what happened as the only honest response.',
    'Grief suppressed. The wound that becomes the darkness’s door. What is not mourned does not heal — it waits.'),
  _min('ruptures','Four','Four of Ruptures',
    'Rest after rupture. The stillness that follows breaking. Necessary withdrawal. Healing is not weakness — it is the prerequisite for what comes next.',
    'Withdrawal that becomes isolation. Rest that becomes avoidance. The stillness that is actually the first stage of the hollow.'),
  _min('ruptures','Five','Five of Ruptures',
    'Defeat that is not final. The rupture that could not be closed. Loss that teaches more than victory would have. What remains after something fails.',
    'Defeat accepted as permanent. The rupture that defines everything after it. Giving up before the possibility of repair has been fully explored.'),
  _min('ruptures','Six','Six of Ruptures',
    'Moving through the tear to something better. The group crossing between worlds not as victims but as travelers. Transition as chosen motion.',
    'The crossing that goes wrong. Moving between worlds without understanding the cost. The passage that does not lead where it promised.'),
  _min('ruptures','Seven','Seven of Ruptures',
    'Strategy in chaos. Finding the pattern in how the ruptures behave. The moment someone realizes the attacks are not random — they are directed.',
    'Paranoia. Seeing pattern where there is only chaos. The strategy that spends more energy on suspicion than on the actual ruptures.'),
  _min('ruptures','Eight','Eight of Ruptures',
    'Restriction by circumstance. The rupture that traps rather than releases. What needs to be seen cannot be seen from inside it. Temporary helplessness before clarity.',
    'The restriction refused before it can teach. Breaking free too soon. The lesson inside the limitation not learned.'),
  _min('ruptures','Nine','Nine of Ruptures',
    'The nightmare before the truth. Dark Cade’s chapter: the long night of believing the worst version of what you are. The suffering that precedes the question: is this actually who I am?',
    'The nightmare accepted as permanent identity. The Nine of Ruptures that never becomes the dawn.'),
  _min('ruptures','Ten','Ten of Ruptures',
    'The end of a cycle of pain. The rupture that closes for the last time. Everything that tore is either sealed or acknowledged. The world changed by what it survived.',
    'Cycles of pain that repeat because nothing was learned from the breaking. The tenth rupture in a sequence that never resolved.'),
  _min('ruptures','Page','Page of Ruptures',
    'The mind newly opened to uncomfortable truth. The moment someone first encounters evidence that the world does not work the way they believed.',
    'Truth rejected because it is too disruptive. The Page of Ruptures who reads the evidence and chooses comfortable ignorance.'),
  _min('ruptures','Knight','Knight of Ruptures',
    'Benjamin pursuing truth with the force of someone who has lost everything to ignorance. The Knight of Ruptures will not stop until the full picture is found.',
    'The pursuit of truth as aggression. Looking for answers with a weapon already in hand. Justice that was always going to be revenge.'),
  _min('ruptures','Queen','Queen of Ruptures',
    'Sutton after the scar. The wound that never fully healed becoming the measure of everything. The Queen of Ruptures carries what broke her without letting it define her.',
    'The wound as identity. The scar that becomes the reason for every choice. Grief that outlives its usefulness.'),
  _min('ruptures','King','King of Ruptures',
    'Cade at his most powerful and most honest. The King of Ruptures has been broken and rebuilt. He knows exactly what tore him and why. That knowledge is now armor.',
    'Power born of pain that protects nothing. The wound that armored the King against the very thing he needed most.'),

  // ── Suit of Runes (Cups) — emotion, intuition, symbolic magic ──
  _min('runes','Ace','Ace of Runes',
    'A single symbol carrying more meaning than language can hold. Intuition speaking through form. The moment Laila pulls the first significant card and knows it is not random.',
    'The symbol misread. Meaning assigned that was not there. Intuition confused with projection.'),
  _min('runes','Two','Two of Runes',
    'A choice that is also a feeling. The heart and the head reading the same spread and arriving at different conclusions. Sitting with the contradiction before acting.',
    'Indecision that is actually avoidance. Waiting for the cards to tell you what you already know. Using uncertainty as a reason not to choose.'),
  _min('runes','Three','Three of Runes',
    'Celebration of connection. The group around the table together, for once not chasing a rupture. What they have built together, acknowledged.',
    'The celebration that does not reach everyone. The gathering from which someone is absent — grieved for or forgotten.'),
  _min('runes','Four','Four of Runes',
    'Emotional security. The moment after crisis when it is safe to feel what happened. The necessary stillness of processing what has been survived.',
    'Emotional numbness mistaken for stability. The calm that is actually the beginning of the hollow. Stillness that is closing off rather than resting.'),
  _min('runes','Five','Five of Runes',
    'Loss felt fully. The grief after Hailey. The cards pulled in the days after and finding no comfort — only confirmation of what is real.',
    'Grief resisted. The emotion too large to acknowledge. The reading refused because some truths hurt too much to name.'),
  _min('runes','Six','Six of Runes',
    'Emotional memory. Nostalgia as information. The pull toward what was good before everything changed — not as escape, but as reminder of what is worth restoring.',
    'Nostalgia as avoidance. Living in the past because the present is too hard. The memory used to prevent the future.'),
  _min('runes','Seven','Seven of Runes',
    'The vision that tells the truth before anyone is ready to hear it. Laila’s most difficult reading: the spread that shows what the group cannot yet accept.',
    'The vision dismissed. The reading that was accurate but ignored because it was inconvenient. Intuition overridden by what someone wanted to believe.'),
  _min('runes','Eight','Eight of Runes',
    'Moving through emotion rather than around it. The grief processed in motion. Benjamin and Cade traveling together: the feeling present but not paralyzing.',
    'Emotional avoidance through constant motion. Running from a feeling until the body gives out. The movement that is actually flight.'),
  _min('runes','Nine','Nine of Runes',
    'Satisfaction in the work of healing. The moment Cade realizes that being a therapist and being a vessel are not contradictory. Understanding others has always been understanding himself.',
    'Isolation after accomplishment. The Nine of Runes who did the work and still feels alone with what they know.'),
  _min('runes','Ten','Ten of Runes',
    'Emotional completion. The family rebuilt around what survived. Not the same as before — better, because it was chosen consciously the second time.',
    'The emotional ending delayed. The relationship that could not survive what happened. Loss that was always coming but arrived too late to prepare for.'),
  _min('runes','Page','Page of Runes',
    'Laila at the café, reading cards for coworkers. The gift not yet understood as power. Intuition as personality before it became practice.',
    'The gift used carelessly. The Page of Runes who reads for entertainment and accidentally sees something true they were not ready for.'),
  _min('runes','Knight','Knight of Runes',
    'Rowan moving toward Cade the moment the bond breaks. The Knight of Runes does not have directions — only the feeling that someone needs them, and the willingness to go.',
    'Action driven by emotion without sufficient thought. The Knight of Runes who arrives at the right place with entirely the wrong approach.'),
  _min('runes','Queen','Queen of Runes',
    'Hailey. Warmth as power. The Queen of Runes knows what you need before you do, gives it without announcement, and asks nothing in return.',
    'The Queen of Runes whose care was never acknowledged while she was present. What her absence revealed about what she had been holding.'),
  _min('runes','King','King of Runes',
    'Cade as therapist and vessel: the man who spent his career helping others understand themselves, finally understanding himself. Emotional intelligence as divine authority.',
    'The healer who cannot heal himself. The King of Runes who knows every tool but refuses to use them on the one person who needs them most.'),
];

// ── Suit glyphs + labels ────────────────────────────────────────────────────
const TAROT_SUITS = {
  flames:   { label:'Flames',   element:'Wands',     pip:'♣' },
  bones:    { label:'Bones',    element:'Pentacles', pip:'◈' },
  ruptures: { label:'Ruptures', element:'Swords',    pip:'⚔' },
  runes:    { label:'Runes',    element:'Cups',      pip:'ᚱ' },
};

// ── Wire generated card art ─────────────────────────────────────────────────
// Images live in images/tarot/ as 600px JPEGs. Filenames match the generator:
//   majors  → NN_<name-slug>.jpg   (e.g. 00_the_vessel.jpg)
//   minors  → <suit>_NN_<rank>.jpg (e.g. flames_01_ace.jpg)
const TAROT_IMG_DIR = 'images/tarot/';
const TAROT_CARD_BACK = TAROT_IMG_DIR + 'card_back.jpg';
(function assignTarotArt(){
  const ROMAN = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII',
                 'XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];
  const RANKN = { Ace:1, Two:2, Three:3, Four:4, Five:5, Six:6, Seven:7, Eight:8,
                  Nine:9, Ten:10, Page:11, Knight:12, Queen:13, King:14 };
  const pad = (n) => String(n).padStart(2, '0');
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  TAROT_DECK.forEach((c) => {
    if (c.arcana === 'major') {
      const n = ROMAN.indexOf(c.id);
      if (n !== -1) c.imagePath = `${TAROT_IMG_DIR}${pad(n)}_${slug(c.name)}.jpg`;
    } else {
      const n = RANKN[c.number];
      if (n) c.imagePath = `${TAROT_IMG_DIR}${c.suit}_${pad(n)}_${c.number.toLowerCase()}.jpg`;
    }
  });
})();

(function(){
  // Don't run twice (some pages include scripts more than once defensively)
  if (window.__tarotInit) return;
  window.__tarotInit = true;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pick(){ return TAROT_DECK[Math.floor(Math.random()*TAROT_DECK.length)]; }
  function drawUnique(n){
    const pool = TAROT_DECK.slice(); const out = [];
    for (let i=0;i<n && pool.length;i++){
      const idx = Math.floor(Math.random()*pool.length);
      out.push({ card: pool.splice(idx,1)[0], reversed: Math.random()<0.32 });
    }
    return out;
  }

  // The Blue Ember emblem — a blue flame wreathed in shadow tendrils.
  function emblemSVG(reversed){
    return `<svg class="tarot-emblem ${reversed?'rev':''}" viewBox="0 0 120 160" aria-hidden="true">
      <defs>
        <radialGradient id="tgFlame" cx="50%" cy="62%" r="55%">
          <stop offset="0%" stop-color="#cfe6ff"/><stop offset="38%" stop-color="#6fa8e0"/>
          <stop offset="72%" stop-color="#2f5fb0"/><stop offset="100%" stop-color="#10204a"/>
        </radialGradient>
      </defs>
      <g class="tarot-tendrils" stroke="#0c1326" stroke-width="2" fill="none" opacity=".8" stroke-linecap="round">
        <path d="M60 150 C30 130 22 96 40 78"/><path d="M60 150 C90 130 98 96 80 78"/>
        <path d="M60 150 C44 124 40 104 52 92"/><path d="M60 150 C76 124 80 104 68 92"/>
      </g>
      <path class="tarot-flame" fill="url(#tgFlame)" d="M60 22 C70 48 92 58 88 92 C86 120 72 134 60 138 C48 134 34 120 32 92 C28 58 50 48 60 22 Z"/>
      <path class="tarot-flame-core" fill="#eaf4ff" opacity=".85" d="M60 64 C66 78 74 84 70 102 C68 116 64 124 60 126 C56 124 52 116 50 102 C46 84 54 78 60 64 Z"/>
      <circle class="tarot-ember" cx="60" cy="150" r="3.4" fill="#bfe0ff"/>
    </svg>`;
  }

  function faceArt(card, reversed){
    if (card.imagePath){
      return `<div class="tarot-art tarot-art--full"><img src="${card.imagePath}" alt="${card.name}" loading="lazy"></div>`;
    }
    return `<div class="tarot-art tarot-art--procedural">${emblemSVG(reversed)}</div>`;
  }

  const RANK_ABBR = { Ace:'A', Two:'II', Three:'III', Four:'IV', Five:'V', Six:'VI', Seven:'VII',
                      Eight:'VIII', Nine:'IX', Ten:'X', Page:'P', Knight:'Kn', Queen:'Q', King:'K' };
  function cornerMark(card){
    if (card.arcana==='major') return `<span class="tarot-numeral">${card.id}</span>`;
    return `<span class="tarot-numeral" title="${TAROT_SUITS[card.suit].label}">${RANK_ABBR[card.number]||card.number}</span>`;
  }

  function faceHTML(card, reversed){
    // Generated art is a complete card (ornate frame, no baked-in text) — show it
    // full-bleed and let the reading readout carry the name. Procedural fallback
    // keeps the corner numeral + name bar.
    if (card.imagePath){
      return `
      <div class="tarot-face tarot-face--front tarot-face--img ${reversed?'is-reversed':''}">
        ${faceArt(card, reversed)}
        ${reversed?'<span class="tarot-rev-tag">Reversed</span>':''}
      </div>`;
    }
    const sub = card.arcana==='major'
      ? `${card.traditionalName} · ${card.theme}`
      : `${TAROT_SUITS[card.suit].label} · ${card.theme}`;
    return `
      <div class="tarot-face tarot-face--front ${reversed?'is-reversed':''}">
        <div class="tarot-corner tl">${cornerMark(card)}</div>
        ${faceArt(card, reversed)}
        <div class="tarot-namebar">
          <span class="tarot-name">${card.name}</span>
          <span class="tarot-sub">${sub}</span>
        </div>
        ${reversed?'<span class="tarot-rev-tag">Reversed</span>':''}
      </div>`;
  }

  function backHTML(){
    return `<div class="tarot-face tarot-face--back tarot-face--img">
      <div class="tarot-art tarot-art--full"><img src="${TAROT_CARD_BACK}" alt="" loading="lazy"></div>
    </div>`;
  }

  function cardHTML(card, reversed){
    return `<div class="tarot-card"><div class="tarot-card-inner">${backHTML()}${faceHTML(card, reversed)}</div></div>`;
  }

  function meaningBlock(card, reversed, posLabel){
    const meaning = reversed ? card.reversed : card.upright;
    const orient = reversed ? 'Reversed' : 'Upright';
    return `<div class="tarot-meaning">
        ${posLabel?`<span class="tarot-pos">${posLabel}</span>`:''}
        <h4>${card.name} <em>· ${orient}</em></h4>
        <p>${meaning}</p>
      </div>`;
  }

  // ── Build the overlay + peeking cards once ──────────────────────────────────
  const overlay = document.createElement('div');
  overlay.className = 'tarot-overlay';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML = `
    <div class="tarot-modal" role="dialog" aria-label="The Blue Ember Tarot">
      <button class="tarot-close" aria-label="Close">✕</button>
      <p class="tarot-eyebrow">Codex · The Hidden Deck</p>
      <h3 class="tarot-title">The <em>Blue Ember</em> Tarot</h3>
      <p class="tarot-lede">Seventy-eight cards mapping Cade’s descent. Draw, and read what the Veil offers.</p>
      <div class="tarot-modes">
        <button class="tarot-mode-btn" data-mode="single">Draw one</button>
        <button class="tarot-mode-btn" data-mode="spread">Past · Present · Future</button>
      </div>
      <div class="tarot-stage"></div>
      <div class="tarot-readout"></div>
      <button class="tarot-again" hidden>Draw again</button>
    </div>`;

  const peekWrap = document.createElement('div');
  peekWrap.className = 'tarot-peeks';
  peekWrap.innerHTML = `
    <button class="tarot-peek tarot-peek--right" aria-label="Draw a tarot card">${backHTML()}</button>
    <button class="tarot-peek tarot-peek--left" aria-label="Draw a tarot card">${backHTML()}</button>`;

  function mount(){
    document.body.appendChild(peekWrap);
    document.body.appendChild(overlay);
    wire();
  }

  let currentMode = 'single';

  function openOverlay(mode){
    currentMode = mode || currentMode;
    overlay.classList.add('visible');
    overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    overlay.querySelectorAll('.tarot-mode-btn').forEach(b=>b.classList.toggle('active', b.dataset.mode===currentMode));
    deal(currentMode);
  }
  function closeOverlay(){
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  function deal(mode){
    const stage = overlay.querySelector('.tarot-stage');
    const readout = overlay.querySelector('.tarot-readout');
    const again = overlay.querySelector('.tarot-again');
    readout.innerHTML = '';
    again.hidden = true;

    if (mode==='single'){
      const [d] = drawUnique(1);
      stage.className = 'tarot-stage';
      stage.innerHTML = cardHTML(d.card, d.reversed);
      const cardEl = stage.querySelector('.tarot-card');
      flip(cardEl, 120, ()=>{
        readout.innerHTML = meaningBlock(d.card, d.reversed, '');
        readout.classList.add('show');
        again.hidden = false;
      });
    } else {
      const draws = drawUnique(3);
      const labels = ['Past','Present','Future'];
      stage.className = 'tarot-stage tarot-stage--spread';
      stage.innerHTML = draws.map((d,i)=>`<div class="tarot-slot"><span class="tarot-slot-label">${labels[i]}</span>${cardHTML(d.card, d.reversed)}</div>`).join('');
      const cards = stage.querySelectorAll('.tarot-card');
      cards.forEach((el,i)=> flip(el, 200 + i*420, ()=>{
        if (i===cards.length-1){
          readout.innerHTML = draws.map((d,i2)=>meaningBlock(d.card, d.reversed, labels[i2])).join('');
          readout.classList.add('show');
          again.hidden = false;
        }
      }));
    }
  }

  function flip(cardEl, delay, done){
    if (reduceMotion){
      cardEl.classList.add('flipped','instant');
      done && done();
      return;
    }
    setTimeout(()=>{
      cardEl.classList.add('flipped');
      cardEl.addEventListener('transitionend', function te(e){
        if (e.propertyName==='transform'){ cardEl.removeEventListener('transitionend', te); done && done(); }
      });
    }, delay);
  }

  function wire(){
    peekWrap.querySelectorAll('.tarot-peek').forEach(p=>{
      p.addEventListener('click', ()=> openOverlay('single'));
    });
    overlay.querySelector('.tarot-close').addEventListener('click', closeOverlay);
    overlay.addEventListener('click', e=>{ if (e.target===overlay) closeOverlay(); });
    document.addEventListener('keydown', e=>{ if (e.key==='Escape' && overlay.classList.contains('visible')) closeOverlay(); });
    overlay.querySelectorAll('.tarot-mode-btn').forEach(b=>{
      b.addEventListener('click', ()=>{
        currentMode = b.dataset.mode;
        overlay.querySelectorAll('.tarot-mode-btn').forEach(x=>x.classList.toggle('active', x===b));
        deal(currentMode);
      });
    });
    overlay.querySelector('.tarot-again').addEventListener('click', ()=> deal(currentMode));
  }

  // Typed keyword: "tarot" anywhere opens the deck (complements the peeking cards)
  let tbuf = '';
  document.addEventListener('keypress', e=>{
    if (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA') return;
    tbuf = (tbuf + e.key).slice(-5).toLowerCase();
    if (tbuf.includes('tarot')){ tbuf=''; openOverlay('single'); }
  });

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  // Expose for other easter eggs / console pokers
  window.openTarot = openOverlay;
})();
