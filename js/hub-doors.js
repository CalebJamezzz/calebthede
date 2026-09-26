// ══ THREE DOORS — hub homepage nav ══
// Desktop hover-intent: a quick pass of the mouse across all three panels
// used to trigger a resize on each one in turn, which read as "jumping."
// Waiting ~70ms before committing to .is-active means a deliberate pause
// wakes a panel; a fast sweep across them doesn't.
document.addEventListener('DOMContentLoaded', () => {
  const allWorlds = document.querySelectorAll('.worlds .world');
  if (!allWorlds.length) return;

  const hoverTimers = new WeakMap();
  allWorlds.forEach(w => {
    w.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimers.get(w));
      hoverTimers.set(w, setTimeout(() => w.classList.add('is-active'), 70));
    });
    w.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimers.get(w));
      w.classList.remove('is-active');
      // Clicking a door focuses its <a> (normal browser behavior); with
      // :focus-within also in the CSS trigger list, that focus alone keeps
      // the panel expanded forever once the mouse leaves. Blur it back out
      // — keyboard/Tab users never trigger mouseleave, so this doesn't
      // affect keyboard navigation.
      if (w.contains(document.activeElement)) document.activeElement.blur();
    });
  });

  // Mobile/tablet: wake a panel as you scroll, since hover doesn't exist on
  // touch. Matched by width (narrow windows) OR (hover:none) so touch
  // tablets get this too regardless of width — without it, a tap focuses a
  // door's <a> and (with no mouseleave ever firing on touch) it stays
  // expanded forever, since only the desktop hover-intent handler clears
  // that focus.
  // Deliberately NOT using IntersectionObserver's percentage rootMargin
  // here — that's unreliably supported across WebKit versions, and when a
  // browser ignores the percentage it silently falls back to a
  // full-viewport band, which lets every panel "intersect" at once and
  // leaves whichever was processed last stuck awake regardless of scroll
  // position.
  // Also deliberately NOT using each panel's LIVE getBoundingClientRect —
  // the awake panel grows to ~majority-of-viewport height while dormant
  // strips stay a compact 170px (keep in sync with the mobile .world height
  // in main.css), and that live height feeds back into the decision two
  // different ways that both starve whichever panel comes next: a taller
  // awake panel's real center stays misleadingly close to viewport-center
  // long after it's mostly scrolled past, AND — worse — while an earlier
  // panel is still occupying the extra ~450px, the page may not even HAVE
  // enough scroll room left for a later panel's real top to reach a fixed
  // trigger line at all (it needs the earlier panel to shrink back first,
  // which needs the later one to already be "current" first — a deadlock).
  // Fix: compute each panel's position as if every panel occupied an equal,
  // fixed-size SLOT — a synthetic layout unaffected by which one is
  // actually expanded right now — and pick whichever synthetic slot-center
  // is closest to the viewport's center. The real (possibly-expanded)
  // panel only gets used for the final visibility gate below.
  // SLOT_H is deliberately much bigger than the real 170px dormant height,
  // not a stand-in for it: using the real dormant height here (170) gave
  // each panel only an ~85px-radius catchment before the next one won,
  // which is a couple of wheel notches — nowhere near enough scroll to
  // actually look at a panel that's rendering at ~majority-of-viewport
  // size before it flips to the next one. SLOT_H sets how much scrolling
  // one panel gets to "own" instead, independent of any real CSS height.
  const mq = window.matchMedia('(max-width: 1024px), (hover: none)');
  const SLOT_H = 460;
  let mobileActive = false;
  let ticking = false;

  function updateAwake(){
    ticking = false;
    const worldsEl = allWorlds[0].parentElement;
    const worldsRect = worldsEl.getBoundingClientRect();
    if (worldsRect.bottom <= 0 || worldsRect.top >= window.innerHeight){
      allWorlds.forEach(w => w.classList.remove('is-awake'));
      return;
    }
    // The last panel has no trailing content after it for its slot-center
    // to ever scroll up to the viewport's center — the page runs out of
    // scroll room first (its own real height, plus the footer, is smaller
    // than SLOT_H). Once the page is scrolled to (or essentially at) the
    // bottom, force it open directly rather than leaving it unreachable.
    const doc = document.documentElement;
    const atBottom = window.scrollY + window.innerHeight >= doc.scrollHeight - 2;
    let closest;
    if (atBottom){
      closest = allWorlds[allWorlds.length - 1];
    } else {
      const center = window.innerHeight / 2;
      let closestDist = Infinity;
      allWorlds.forEach((w, i) => {
        const mid = worldsRect.top + i * SLOT_H + SLOT_H / 2;
        const dist = Math.abs(mid - center);
        if (dist < closestDist){ closestDist = dist; closest = w; }
      });
    }
    allWorlds.forEach(w => w.classList.toggle('is-awake', w === closest));
  }
  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateAwake);
  }
  function startObserving(){
    if (mobileActive) return;
    mobileActive = true;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateAwake();
  }
  function stopObserving(){
    if (!mobileActive) return;
    mobileActive = false;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    allWorlds.forEach(w => w.classList.remove('is-awake'));
  }
  function sync(){ mq.matches ? startObserving() : stopObserving(); }
  mq.addEventListener('change', sync);
  sync();
});

// ── Easter egg: click the ring-spiral in the hero to ignite it ──
// (Replaces the old Pisces-constellation click effect, which lived on
// artwork that no longer exists on this page.)
document.addEventListener('DOMContentLoaded', () => {
  const orbits = document.querySelector('.hero-orbits');
  if (!orbits) return;
  orbits.style.pointerEvents = 'auto';
  orbits.style.cursor = 'pointer';
  orbits.addEventListener('click', () => {
    orbits.classList.remove('ignited');
    void orbits.offsetWidth; // reflow → restart animation
    orbits.classList.add('ignited');
    clearTimeout(orbits._ig);
    orbits._ig = setTimeout(() => orbits.classList.remove('ignited'), 2200);
    if (typeof toast === 'function') {
      toast('✦ Three doors, one hand drawing the map.', 'success', 6000);
    }
  });
});
