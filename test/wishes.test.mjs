/* The wishes drift past the corner of the page, but not at every moment: a card over
   someone's half-written wish, or over the list they are already reading, is a nuisance
   rather than a flourish. The gate is what this checks. */
import { JSDOM, VirtualConsole } from '/Users/thuann/projects/saas-ak-app/node_modules/.pnpm/jsdom@30.0.1_@noble+hashes@2.2.0/node_modules/jsdom/lib/api.js';
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(import.meta.dirname, "..");
const WISHES = [
  { name: "Minh", relation: "Bạn của cả hai", wish: "Chúc hai bạn trăm năm hạnh phúc." },
  { name: "Lan", relation: "Bạn cô dâu", wish: "Mừng hai đứa về chung một nhà." },
];

const vc = new VirtualConsole();
const errors = [];
vc.on("jsdomError", (e) => errors.push(e.message));

let bookSeen = () => false;   // the test decides whether the guest book is on screen

const dom = await JSDOM.fromFile(path.join(root, "index.html"), {
  runScripts: "dangerously", resources: "usable", pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    // jsdom refuses localStorage on a file:// document, the same way a browser does in a
    // private window. The page copes with that; the check below needs somewhere to look.
    const mem = new Map();
    Object.defineProperty(w, "localStorage", {
      configurable: true,
      value: {
        getItem: (k) => (mem.has(k) ? mem.get(k) : null),
        setItem: (k, v) => mem.set(k, String(v)),
        removeItem: (k) => mem.delete(k),
      },
    });
    w.HTMLMediaElement.prototype.play = () => Promise.resolve();
    w.HTMLMediaElement.prototype.load = () => {};
    w.__asked = 0;
    w.fetch = (u) => {
      if (String(u).includes("what=wishes")) w.__asked++;
      return Promise.resolve({ ok: true, json: async () => (String(u).includes("what=wishes") ? WISHES : []) });
    };
    w.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; }
      observe(el) { this.cb([{ isIntersecting: el.id === "guestbook" ? bookSeen() : true, target: el }], this); }
      unobserve() {} disconnect() {}
    };
  },
});
const { window } = dom, d = window.document;
await new Promise((r) => window.addEventListener("load", r));
window.AK.startWishToasts.timing = { first: 30, shown: 400, gap: 30 };

let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}` + (ok ? "" : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`));
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// watched rather than sampled at an instant: the page runs its own cycle alongside
const until = async (want, ms = 1500) => {
  for (let t = 0; t < ms; t += 10) { if (want()) return true; await wait(10); }
  return false;
};
const card = () => d.querySelector(".wisht");
const last = () => [...d.querySelectorAll(".wisht")].pop();
const shows = (c) => !!c && !c.hidden && c.classList.contains("is-in");
const showing = () => shows(card());

await wait(100);
check("nothing threw", errors, []);
check("a card is made once the wishes are in", !!card(), true);
check("but it waits for the doors", showing(), false);

// a real tap, not a bare event: parting the doors is also what marks the page open, and
// a cycle started later reads that mark rather than waiting for an event already gone
d.getElementById("doors").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await wait(120);
check("then a wish drifts in", showing(), true);
check("and it is one that was written",
  WISHES.some((w) => w.wish === d.querySelector(".wisht__text").textContent), true);
check("signed by whoever wrote it",
  WISHES.some((w) => w.name === d.querySelector(".wisht__by").textContent), true);

// Each case below starts its own cycle, so what it watches is a card of its own rather
// than one left mid-slide by the case before it.

// someone writing their own wish should not have one land on top of it
d.getElementById("wish-text").focus();
window.AK.startWishToasts(WISHES);
await wait(200);
check("it holds off while a guest is typing", shows(last()), false);
d.getElementById("wish-text").blur();

// nor while the whole list is on screen to be read properly
bookSeen = () => true;
window.AK.startWishToasts(WISHES);
await wait(200);
check("and while the guest book itself is in view", shows(last()), false);

// and once neither is true it comes back
bookSeen = () => false;
window.AK.startWishToasts(WISHES);
await wait(200);
check("then it drifts again", shows(last()), true);

// Both places cut a long wish short, so both have to lead somewhere that does not.
{
  const long = { name: "Dài", relation: "Bạn", wish: "x ".repeat(400).trim() };
  const box = d.getElementById("wish-full");
  box.showModal = function () { this.setAttribute("open", ""); };
  box.close = function () { this.removeAttribute("open"); };

  window.AK.openWish(long);
  check("a wish opens in full, uncut", d.querySelector(".wishfull__text").textContent, long.wish);
  check("and the sheet is open", box.hasAttribute("open"), true);
  box.querySelector(".wishfull__close").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  check("the close button shuts it", box.hasAttribute("open"), false);

  const note = d.querySelector("#wishes .note__open");
  check("every note in the strip opens one", !!note, true);
  note.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  check("and it carries that note's wish",
    WISHES.some((w) => w.wish === d.querySelector(".wishfull__text").textContent), true);
  box.close();

  const c = last();
  if (shows(c)) {
    c.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    check("tapping a drifting card opens it too", box.hasAttribute("open"), true);
  }
}

// The roll is one list laid out twice and carried up by exactly one copy, so the seam
// has nothing to show. jsdom measures nothing, so the height is stood in for here.
{
  const track = d.getElementById("wishes");
  const written = track.querySelectorAll(".note:not(.note--copy)").length;
  Object.defineProperty(track, "scrollHeight", { value: 800, configurable: true });
  window.AK.runCredits(track);

  check("the list is laid out twice", track.querySelectorAll(".note").length, written * 2);
  check("and the copy is not read out again",
    [...track.querySelectorAll(".note--copy")].every((n) => n.getAttribute("aria-hidden") === "true"), true);
  check("the track travels exactly one copy", track.style.getPropertyValue("--credits-reach"), "800px");
  check("and it is running", track.classList.contains("is-running"), true);

  // running it twice must not leave two copies behind
  window.AK.runCredits(track);
  check("re-measuring does not pile copies up", track.querySelectorAll(".note").length, written * 2);

  // The mark between two wishes has to sit on every one of them. On all but the first,
  // the wish at the top of the roll and the same wish coming round again would differ,
  // and the turn of the loop would show.
  const marks = [...d.styleSheets].flatMap((sh) => {
    try { return [...sh.cssRules]; } catch { return []; }
  }).map((r) => r.selectorText).filter(Boolean);
  check("the mark between wishes is on every wish, not just the later ones",
    marks.some((sel) => /\.note\s*\+\s*\.note::before/.test(sel)), false);
}

// Two cycles on one page meant two sets of timers: a card arrived and was replaced at
// once, then kept changing. Whoever asks last gets the only cycle.
{
  window.AK.startWishToasts(WISHES);
  window.AK.startWishToasts(WISHES);
  window.AK.startWishToasts(WISHES);
  check("however often it is started, there is one card", d.querySelectorAll(".wisht").length, 1);

  window.AK.startWishToasts.timing = { first: 20, shown: 400, gap: 400 };
  window.AK.startWishToasts(WISHES);
  await until(() => shows(last()));
  const first = d.querySelector(".wisht__text").textContent;
  await wait(200);                       // well inside the time one card is held
  check("and a card is not replaced the moment it arrives",
    d.querySelector(".wisht__text").textContent, first);
}

// Apps Script answers slowly when cold, so what came back last time is kept and shown
// at once on the next visit.
check("the wishes are kept for next time",
  JSON.parse(window.localStorage.getItem("ak:wishes") || "[]").length, WISHES.length);

// Nothing can push a wish to a page that is open already, so the page asks again. A
// guest who writes one sees it at once; the sheet is asked again shortly after, which
// puts it in the order everyone else sees and brings in anything written meanwhile.
{
  const before = window.__asked;
  await window.AK.askForWishes();
  check("the page can ask the sheet again", window.__asked > before, true);

  const box = d.getElementById("wishes");
  const was = box.querySelectorAll(".note:not(.note--copy)").length;
  d.getElementById("wish-name").value = "Người mới";
  d.getElementById("wish-text").value = "Chúc mừng hai bạn.";
  d.getElementById("wish-form").dispatchEvent(new window.Event("submit", { cancelable: true, bubbles: true }));
  check("a wish just written is on the page at once",
    box.querySelectorAll(".note:not(.note--copy)").length, was + 1);
}

// The card is ruled paper, so the words have to sit on the rules. The ruling, the wish
// and the name are three numbers that must agree, in each width separately: the narrow
// card was put right and the wide one kept the narrow ruling under wider-set text, which
// drifts a little further off every line.
{
  const css = fs.readFileSync(path.join(root, "css/guestbook.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  // every media block out, which leaves what applies at any width
  const base = css.replace(/@media[^{]+\{(?:[^{}]|\{[^{}]*\})*\}/g, "");
  // every wide block in the file, not the first: the card's own is the second of three
  const wide = [...css.matchAll(/@media \(min-width: 768px\)[^{]*\{((?:[^{}]|\{[^{}]*\})*)\}/g)]
    .map((m) => m[1]).join("\n");

  const num = (block, re) => { const m = block.match(re); return m ? Number(m[1]) : null; };
  const ruling = (b) => num(b, /\.wisht\s*\{[^}]*var\(--rule\)\s*[\d.]+px\s+([\d.]+)px/);
  const line = (b, sel) => num(b, new RegExp("\\" + sel + "\\s*\\{[^}]*line-height:\\s*([\\d.]+)px"));

  for (const [name, block] of [["narrow", base], ["wide", wide]]) {
    const step = ruling(block);
    // stated, not absent: a missing number on both sides would agree with itself
    check(`the ${name} card states a ruling`, typeof step === "number" && step > 0, true);
    check(`the ${name} card's wish sits on its ruling`, line(block, ".wisht__text"), step);
    check(`and so does the ${name} card's name`, line(block, ".wisht__by"), step);
  }

  // The browser holds a modal dialog fixed and centred. Positioning it here puts it back
  // in the flow at the foot of the document, and opening it from the middle of the page
  // carries the reader down there.
  check("the sheet leaves its own placing to the browser",
    /\.wishfull(\[open\])?\s*\{[^}]*position\s*:/.test(css), false);

  // The lines stop short of the card's edge while the paper runs right to it. The number
  // of layers comes from background-image alone, so a background-color plus one image is
  // one layer, the second clip is dropped, and the paper gets cut back with the lines.
  check("the ruling keeps inside the card's padding",
    /\.wisht\s*\{[^}]*background-clip:\s*content-box\s*,\s*border-box/.test(base), true);
  for (const [name, block] of [["narrow", base], ["wide", wide]]) {
    const m = block.match(/\.wisht\s*\{[^}]*background-image:([^;]*);/);
    // commas at the top level only: every gradient has commas of its own inside it
    let depth = 0, layers = m ? 1 : 0;
    for (const ch of m ? m[1] : "") {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === "," && depth === 0) layers++;
    }
    check(`the ${name} card paints the paper as its own layer`, layers, 2);
  }
}

console.log(fail ? `\n${fail} failing` : "\nall good");
process.exit(fail ? 1 : 0);
