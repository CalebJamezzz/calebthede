#!/usr/bin/env node
/**
 * Blue Ember Tarot — DALL·E 3 image generator
 * ------------------------------------------------------------------
 * Generates an illustration for the card back + all 78 cards and saves
 * them to ./output as PNGs. Resumable: any card whose file already
 * exists is skipped, so you can stop/restart freely. A run log of
 * successes and failures is written to ./output/_generation-log.json
 * (and a human-readable _generation-log.txt).
 *
 * Requirements: Node 18+ (uses global fetch). No npm install needed.
 * Setup: put OPENAI_API_KEY=sk-... in a .env file next to this script.
 * Run:   node generate.js
 */

const fs = require('fs');
const path = require('path');

// ── Config ───────────────────────────────────────────────────────────────
const MODEL        = 'gpt-image-1';
const SIZE         = '1024x1536';   // tall vertical (portrait) card format
const QUALITY      = 'medium';      // gpt-image-1: 'low' | 'medium' | 'high' (higher costs more)
const DELAY_MS     = 2000;          // pause between API calls (rate limiting)
const MAX_RETRIES  = 3;             // retries on 429 / 5xx with backoff
const OUTPUT_DIR   = path.join(__dirname, 'output');
const LOG_JSON     = path.join(OUTPUT_DIR, '_generation-log.json');
const LOG_TXT      = path.join(OUTPUT_DIR, '_generation-log.txt');
const API_URL      = 'https://api.openai.com/v1/images/generations';

// Style prefix applied to every CARD FACE prompt. The card back is a
// different kind of image and uses its own complete prompt (no prefix).
const STYLE_PREFIX =
  'Ornate fantasy tarot card in a single consistent deck style, vertical ' +
  'portrait format. The artwork is a polished, semi-realistic digital fantasy ' +
  'painting — richly detailed and LUMINOUS, the figure clearly lit and fully ' +
  'visible (never lost in shadow), set against a deep midnight navy-and-black ' +
  'background scattered with stars and faint glowing gold constellation rings ' +
  'and astrolabe circles. Every card shares the SAME ornate frame: an elaborate ' +
  'gold-and-silver filigree border with scrolling corner flourishes, a glowing ' +
  'electric-blue flame flourish curling from the upper-LEFT corner and a ' +
  'matching black shadow-vine flourish in the upper-RIGHT corner, a small ' +
  'radiant celestial sunburst medallion centered at the very top, a larger gold ' +
  'compass-rose star medallion centered at the bottom, black rose accents in the ' +
  'lower corners, and an aged slightly distressed dark outer edge. Palette: deep ' +
  'blues and blacks, antique gold, and signature electric-blue flame. Dramatic ' +
  'cinematic lighting. CRITICAL: absolutely NO text, NO words, NO letters, NO ' +
  'numbers, NO title or name banner anywhere in the image. Subject:';

// ── Card data ──────────────────────────────────────────────────────────────
const CARD_BACK_PROMPT =
  'A tarot card back design, dark fantasy style, perfectly symmetrical, deep ' +
  'navy black background, a large central Blue Ember series symbol — a single ' +
  'blue flame with black shadow tendrils spiraling around it forming a unified ' +
  'circular emblem, ornate gold and silver filigree border framing the entire ' +
  'card, subtle rune symbols repeating in a diamond pattern across the ' +
  'background like a watermark, vertical rectangle format, no text, no words';

// [slug, description] — file becomes NN_slug.png (NN = arcana number 00–21)
const MAJORS = [
  ['the_vessel', "a young man with short curly auburn red hair and round wire frame glasses standing at the edge of a dark cliff, one hand open at his side with the faintest red ember just beginning to glow in his palm, expression of innocent curiosity, shadow creatures barely visible in the darkness below, deep blue and black"],
  ['the_flame', "a young man with short curly auburn red hair and round wire frame glasses, one arm raised with vivid blue flame burning above his head, other arm pointing downward, as above so below pose, rune symbols orbiting his body, deep blue and gold"],
  ['the_seer', "a young woman with long dark wavy hair holding a fan of glowing tarot cards, hazel eyes looking directly at the viewer with quiet knowing, candles surrounding her feet, vision clouds above the cards showing fragmented futures, deep blue and warm amber"],
  ['the_mother', "a warm woman in her forties with auburn hints in her dark hair, eyes closed in peace, a single glowing rune symbol on her outstretched palm radiating soft light outward, gentle smile, warm amber and soft blue"],
  ['the_underworld_king', "a tall imposing older man with silver streaked dark hair and close cropped beard, seated on a throne of dark underworld stone, dark robes with ember details, one hand extended with deep red ember fire, expression of authority carrying deep regret, deep red and black"],
  ['the_scholar', "a man with short dark wavy hair and strong jaw in a worn field jacket, holding a glowing ancient bone fragment with a rune pattern visible inside it, expression of calm focused discovery, ancient ruins behind him, deep red and blue"],
  ['the_other_half', "two identical men facing each other across a void, left figure with curly auburn red hair and glasses with blue flame in palm, right figure with dark hair and cracked pale skin with shadow tendrils, both reaching toward each other, a single rune glowing in the space between their hands, deep black and blue"],
  ['the_rupture', "a young man with curly auburn red hair and glasses running through a tear in reality, blue flame blazing from both hands, the tear showing darkness and creatures beyond, debris and energy swirling around him, deep blue and white"],
  ['the_fracture', "a young man with curly auburn red hair and glasses gripping his own forearm as dark cracked veins crawl upward toward blue runes on his skin, expression of fierce resistance, storm clouds and bone structures behind him, deep blue and red"],
  ['the_hollow_king', "a young man with dark curly hair and cracked pale skin standing alone in a vast empty void, hollow dark eyes with faint blue light deep within, shadow tendrils drifting from his hands, expression of profound loneliness, desaturated deep blue and black"],
  ['the_veil', "a massive circular glowing barrier suspended in cosmic darkness, ancient totem structures at its edges holding it in place, blue rune light running along the boundary, creatures pressing against it from outside barely visible, deep cosmic blue and silver"],
  ['the_rune', "a single large glowing rune symbol floating in darkness, blue white light radiating outward from it in soft waves, ancient and deliberate design, the rune drawn as if by fire in the air, deep black and blue"],
  ['the_descent', "a young man with curly auburn red hair and glasses suspended upside down between two worlds, above him light and blue flame, below him darkness and shadow, expression of calm acceptance rather than fear, deep blue and black divided composition"],
  ['the_sacrifice', "a woman's outstretched hand in darkness with a glowing return rune drawn on her palm, soft blue white light radiating outward, the hand is the only element visible emerging from shadow, bittersweet and sacred feeling, deep black and soft blue"],
  ['the_balance', "blue divine flame and black shadow energy spiraling around each other in perfect equilibrium, neither dominating the other, forming a unified pillar of light and dark, ancient Greek columns visible on either side, deep blue black and silver"],
  ['the_binding', "a figure wrapped in chains made of glowing rune light, half the chains are blue flame half are black shadow, expression of someone realizing they created their own prison, dark stone chamber, deep black and electric blue"],
  ['the_divided_flame', "a tall dark tower struck down the center by blue lightning, left half of the tower glowing with blue divine light, right half consumed by black shadow, bone fragments falling through the air around it, deep stormy blue and black"],
  ['the_return_rune', "a glowing circular rune symbol floating in a starlit sky above dark ruins, soft warm blue light radiating from it like a beacon, smaller rune symbols orbiting it like stars, the feeling of something guiding someone home, deep midnight blue and silver"],
  ['the_shadow', "a dark figure half visible in shadow, dark curly hair, hollow eyes with faint blue light barely visible, one hand reaching out of the darkness toward the viewer, expression of longing rather than threat, deep desaturated black and barely visible blue"],
  ['the_divine_heir', "a young man with curly auburn red hair and glasses standing in golden blue light, blue flame burning in both hands raised above his head, expression of fierce pride, ancient Greek columns framing him, creatures retreating at the edges, deep gold and blue"],
  ['blood_and_fire', "two men on opposite sides of a deep lava chasm, left side a young man with curly auburn red hair and glasses with blue flame, right side a tall imposing older man in dark robes, a glowing blue rune bridge forming between them, deep red orange and blue"],
  ['whole', "a young man with curly auburn red hair and glasses standing with arms open, blue divine flame and black shadow spiraling together in perfect harmony around his body, a single small ember floating upward from his palm, the Veil glowing restored behind him, expression of complete peace, warm and cool light perfectly blended"],
];

const RANK_NAMES = ['ace','two','three','four','five','six','seven','eight','nine','ten','page','knight','queen','king'];

// Each suit: 14 descriptions in rank order (Ace … King)
const SUITS = {
  flames: [
    "a single open hand with one perfect blue flame burning above it rising from the center of the palm, dark background, deep blue and gold, the flame small but intense, the feeling of something ancient just beginning",
    "a young man with curly auburn red hair and glasses holding a red ember in one hand and a blue flame in the other, the two lights casting competing shadows, an open horizon behind him, deep blue and red",
    "a young man with curly auburn red hair and glasses drawing a glowing rune in the air with his blue flame, the rune partially formed and already holding its shape, early mastery visible in his expression, deep blue and silver",
    "a group of four people standing in a circle around a steady blue flame hovering between them, expressions of brief rest and relief, ruins visible in the background but far away, warm blue and amber",
    "five figures each holding a flame of a slightly different color, the flames clashing and overlapping in the air between them, chaotic blue red and orange",
    "a young man with curly auburn red hair and glasses walking toward a warm distant light, the blue flame in his hand steady and pointing forward like a compass, deep blue and warm gold",
    "a young man with curly auburn red hair and glasses standing on higher ground, blue flame raised against six approaching shadow figures below, deep blue and black",
    "eight blue flame streaks cutting through darkness in sharp diagonal lines, motion blur suggesting speed and precision, a rune symbol briefly visible where two lines cross, electric blue and black",
    "a young man with curly auburn red hair and glasses standing before nine glowing rune symbols arranged in an arc, one hand on his own shoulder, expression of someone who has almost made it, deep blue and silver",
    "a figure carrying ten interwoven flames merged into one large spiral of blue and black light, the Veil glowing restored in the background, deep blue black and silver",
    "a young person with wide curious eyes kneeling to examine a small blue flame on the ground, the flame reflecting in their glasses, dark alley setting, deep blue and shadow",
    "a young man with curly auburn red hair and glasses running at full speed through a rupture tear, blue flame blazing from both hands, creatures retreating in his wake, electric blue and black",
    "a woman with long dark wavy hair seated in a throne of blue flame light, hazel eyes sharp and knowing, one hand holding a single flame like a scepter, candles and tarot cards at her feet, deep blue and gold",
    "a tall imposing older man with silver streaked hair in dark robes seated on a throne of ancient stone, a large blue flame burning in his outstretched palm, expression of authority and regret, deep red and blue",
  ],
  bones: [
    "a single ancient bone fragment held in an open hand, a faint rune symbol glowing from within it, dark earth and stone background, deep blue and amber, the feeling of discovery",
    "a researcher's desk with two bone fragments laid side by side each with different rune markings, a journal open between them, the connection not yet clear, warm amber and deep blue",
    "three people around a table covered in bone fragments and ancient texts each pointing to a different section, a connecting pattern beginning to emerge, warm amber and blue",
    "a large stone vault filled with carefully organized bone fragments on shelves, a single figure standing in the center cataloguing everything, deep amber and shadow",
    "five bone fragments scattered across cracked earth, a figure kneeling among them looking at a failed totem structure, dark and desaturated blue",
    "a man with short dark wavy hair and a field jacket handing a glowing bone fragment to a young man with curly auburn red hair and glasses, knowledge freely given, warm blue and amber",
    "a researcher standing before a wall covered in pinned bone rubbings and connecting strings, arms crossed, assessing the pattern, deep amber and cool blue",
    "hands carefully working on a totem structure fitting bone fragments together with precision tools, rune light beginning to glow where pieces correctly connect, warm amber and blue",
    "a man with short dark wavy hair and a field jacket sitting alone at a desk surrounded by completed research, expression of hard-won satisfaction, deep warm amber",
    "a completed totem structure standing in a landscape, ancient bone components glowing softly with rune light, the Veil visible behind it restored, deep blue and gold",
    "a young person at an archaeological dig site holding up a bone fragment to the light with both hands, eyes wide with the first discovery, deep amber and blue",
    "a man in a worn leather motorcycle jacket riding across an open road at night, one hand on the handlebars, the other pressed to his chest where a rune cord hangs around his neck, deep blue and amber",
    "a young woman with long dark hair and round glasses standing before a scientific display showing rupture data, tablet in hand, warm golden brown complexion in cool blue laboratory light",
    "a man with short dark wavy hair and a strong jaw seated at a desk covered in ancient records, expression of someone who chose forgiveness over revenge, deep amber and blue",
  ],
  ruptures: [
    "a single vertical tear in the air, blue white light visible through the crack, reality splitting cleanly, the first honest break, deep black and electric blue",
    "a figure standing blindfolded between two rupture tears pulling in opposite directions, arms out to each side, deep blue and grey",
    "three rupture cracks converging on a single point in the air, grief made visible in the structure of broken reality, deep blue and red",
    "a figure lying still on the ground in a space between closed ruptures, posture of rest rather than defeat, quiet deep blue and shadow",
    "two figures walking away from a scene of multiple failed rupture seals, one looking back one looking forward, cold desaturated blue",
    "a small boat crossing a dark body of water with rupture light visible on the far shore, the crossing purposeful and quiet, deep blue and distant gold",
    "a figure in shadow carefully collecting bone fragments from a rupture site at night while others sleep nearby, deep blue and black",
    "a figure bound with rune-light rope standing in a field of eight rupture spikes driven into the earth around them, blindfolded, deep blue and grey",
    "a figure sitting upright in bed in darkness, nine rupture cracks visible in the wall behind them like a nightmare, deep blue and black",
    "a figure lying face down on cracked earth with ten rupture tears sealed above them, deep blue and dark red",
    "a young person standing at the edge of a small rupture looking into it with intense focus rather than fear, deep blue and silver",
    "a man with short dark wavy hair charging directly toward a large rupture tear with fierce determination, electric blue and black",
    "a young woman with long dark hair and round glasses standing still before a large rupture scar, one hand on her own forearm where a matching scar is visible, deep blue and silver",
    "a young man with curly auburn red hair and glasses standing before a sealed rupture, both hands at his sides, the blue flame steady, deep blue and silver",
  ],
  runes: [
    "a single glowing rune symbol floating above an open hand casting soft blue light upward, expression of wonder and recognition, deep blue and warm amber",
    "a figure standing at a crossroads holding two glowing rune symbols one in each hand both pulling in different directions, deep blue and silver",
    "three figures raising cups of rune light together in celebration, the symbols interweaving above their joined hands, deep blue and warm gold",
    "a figure seated beneath a tree with three rune symbols glowing on the ground before them and one floating just out of reach above, contemplative rest, deep blue and warm amber",
    "five rune symbols in a spread on the ground two still glowing and three faded dark, a figure kneeling among them with head bowed, deep blue and grey",
    "a young person offering a small glowing rune symbol to a child, the giving gentle and uncomplicated, warm amber and soft blue",
    "a figure lying beneath a canopy of seven rune symbols floating above them like a constellation, eyes open but dreamy, deep blue and silver",
    "a figure walking away from eight rune symbols that still glow on the ground behind them, not looking back, deep blue and soft amber",
    "a figure seated alone at a table set for one surrounded by nine glowing rune symbols in a circle, self-sufficient peace, warm deep blue and candlelight",
    "a family or chosen group gathered around a hearth where ten rune symbols glow softly in the fire, expressions of belonging, warm amber and deep blue",
    "a young woman with long dark hair sitting cross-legged on the floor with a tarot deck spread around her pulling a single card that glows slightly more than the others, warm candlelight and blue",
    "a man in a worn leather motorcycle jacket riding through night rain, expression of someone moving entirely on feeling rather than map, deep blue and amber headlight glow",
    "a warm woman in her forties seated in a comfortable home chair, both hands resting open on her knees with faint rune light just visible on her palms, deep amber and soft blue",
    "a young man with curly auburn red hair and glasses seated in a therapist chair leaning slightly forward with full attention, blue flame barely visible at his fingertips, deep blue and warm amber",
  ],
};

// ── Build the full job list ──────────────────────────────────────────────
function buildCards() {
  const cards = [];

  // Card back (own prompt, no style prefix)
  cards.push({ file: 'card_back.png', label: 'Card Back', prompt: CARD_BACK_PROMPT, usePrefix: false });

  // Major Arcana → 00_the_vessel.png … 21_whole.png
  MAJORS.forEach(([slug, desc], i) => {
    const nn = String(i).padStart(2, '0');
    cards.push({ file: `${nn}_${slug}.png`, label: `Major ${nn} · ${slug}`, prompt: desc, usePrefix: true });
  });

  // Minor Arcana → flames_01_ace.png … runes_14_king.png
  for (const suit of Object.keys(SUITS)) {
    SUITS[suit].forEach((desc, i) => {
      const nn = String(i + 1).padStart(2, '0');
      const rank = RANK_NAMES[i];
      cards.push({ file: `${suit}_${nn}_${rank}.png`, label: `${suit} ${nn} · ${rank}`, prompt: desc, usePrefix: true });
    });
  }

  return cards;
}

// ── .env loader (no dependency) ────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildPrompt(card) {
  return card.usePrefix ? `${STYLE_PREFIX} ${card.prompt}` : card.prompt;
}

async function generateOne(card, apiKey) {
  const body = {
    model: MODEL,
    prompt: buildPrompt(card),
    n: 1,
    size: SIZE,
    quality: QUALITY,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let res;
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      if (attempt < MAX_RETRIES) {
        const wait = 2000 * attempt;
        console.log(`     ↻ network error, retrying in ${wait / 1000}s (attempt ${attempt}/${MAX_RETRIES})…`);
        await sleep(wait);
        continue;
      }
      throw new Error(`network error: ${networkErr.message}`);
    }

    if (res.ok) {
      const json = await res.json();
      const datum = json && json.data && json.data[0];
      if (!datum) throw new Error('no image data in response');
      let buf;
      if (datum.b64_json) {
        // Some models/endpoints return base64 inline
        buf = Buffer.from(datum.b64_json, 'base64');
      } else if (datum.url) {
        // dall-e-3 default: a temporary URL we download
        const imgRes = await fetch(datum.url);
        if (!imgRes.ok) throw new Error(`image download failed: HTTP ${imgRes.status}`);
        buf = Buffer.from(await imgRes.arrayBuffer());
      } else {
        throw new Error('no image data (neither b64_json nor url) in response');
      }
      fs.writeFileSync(path.join(OUTPUT_DIR, card.file), buf);
      return { revisedPrompt: datum.revised_prompt || null };
    }

    // Non-OK: read error text
    const text = await res.text().catch(() => '');
    const retriable = res.status === 429 || res.status >= 500;
    if (retriable && attempt < MAX_RETRIES) {
      const wait = 5000 * attempt; // backoff: 5s, 10s
      console.log(`     ↻ HTTP ${res.status}, retrying in ${wait / 1000}s (attempt ${attempt}/${MAX_RETRIES})…`);
      await sleep(wait);
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  throw new Error('exhausted retries');
}

function writeLogs(results) {
  const succeeded = results.filter((r) => r.status === 'success');
  const skipped = results.filter((r) => r.status === 'skipped');
  const failed = results.filter((r) => r.status === 'failed');

  fs.writeFileSync(
    LOG_JSON,
    JSON.stringify(
      {
        runAt: new Date().toISOString(),
        model: MODEL,
        size: SIZE,
        quality: QUALITY,
        totals: { total: results.length, succeeded: succeeded.length, skipped: skipped.length, failed: failed.length },
        succeeded: succeeded.map((r) => ({ file: r.file, label: r.label })),
        skipped: skipped.map((r) => ({ file: r.file, label: r.label })),
        failed: failed.map((r) => ({ file: r.file, label: r.label, error: r.error })),
      },
      null,
      2
    )
  );

  const lines = [];
  lines.push(`Blue Ember Tarot — generation log`);
  lines.push(`Run at: ${new Date().toISOString()}`);
  lines.push(`Model: ${MODEL} · Size: ${SIZE} · Quality: ${QUALITY}`);
  lines.push('');
  lines.push(`TOTALS — ${succeeded.length} generated, ${skipped.length} skipped (already existed), ${failed.length} failed`);
  lines.push('');
  if (failed.length) {
    lines.push('FAILED (rerun the script to retry these):');
    failed.forEach((r) => lines.push(`  ✗ ${r.file}  —  ${r.error}`));
    lines.push('');
  }
  lines.push('GENERATED THIS RUN:');
  succeeded.forEach((r) => lines.push(`  ✓ ${r.file}`));
  lines.push('');
  lines.push('SKIPPED (already on disk):');
  skipped.forEach((r) => lines.push(`  • ${r.file}`));
  fs.writeFileSync(LOG_TXT, lines.join('\n'));
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  loadEnv();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('\n✗ OPENAI_API_KEY not found.');
    console.error('  Create a .env file next to this script containing:');
    console.error('      OPENAI_API_KEY=sk-...\n');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Optional: `--limit N` generates at most N cards this run (handy for a test pass).
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

  let cards = buildCards();
  if (Number.isFinite(limit)) {
    cards = cards.slice(0, limit);
    console.log(`\n⚙  --limit ${limit}: generating only the first ${cards.length} card(s) this run.`);
  }
  const results = [];
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`\n🔮 Blue Ember Tarot — generating ${cards.length} images (${MODEL}, ${SIZE}, ${QUALITY})`);
  console.log(`   Output: ${OUTPUT_DIR}\n`);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const pos = `[${String(i + 1).padStart(2, '0')}/${cards.length}]`;
    const outPath = path.join(OUTPUT_DIR, card.file);

    // Resumable: skip anything already on disk
    if (fs.existsSync(outPath)) {
      console.log(`${pos} ⏭  skip   ${card.file}  (already exists)`);
      skipped++;
      results.push({ ...card, status: 'skipped' });
      continue;
    }

    process.stdout.write(`${pos} 🎨 draw   ${card.file} … `);
    try {
      await generateOne(card, apiKey);
      generated++;
      console.log('done ✓');
      results.push({ ...card, status: 'success' });
    } catch (err) {
      failed++;
      console.log(`FAILED ✗  (${err.message})`);
      results.push({ ...card, status: 'failed', error: err.message });
    }

    // Write logs after every card so progress survives an interruption
    writeLogs(results);

    // Delay between API calls (only when we actually called the API and have more to do)
    const moreToCome = cards.slice(i + 1).some((c) => !fs.existsSync(path.join(OUTPUT_DIR, c.file)));
    if (moreToCome) await sleep(DELAY_MS);
  }

  console.log(`\n──────────────────────────────────────────────`);
  console.log(`✅ Done. ${generated} generated, ${skipped} skipped, ${failed} failed.`);
  if (failed) {
    console.log(`⚠  ${failed} failed — see ${path.basename(LOG_TXT)} for the list, then re-run to retry just those.`);
  }
  console.log(`📝 Logs: ${LOG_JSON}`);
  console.log(`         ${LOG_TXT}\n`);
}

main().catch((e) => {
  console.error('\nFatal error:', e);
  process.exit(1);
});
