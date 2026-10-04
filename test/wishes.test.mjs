/* The wishes drift past the corner of the page, but not at every moment: a card over
   someone's half-written wish, or over the list they are already reading, is a nuisance
   rather than a flourish. The gate is what this checks. */
import { JSDOM, VirtualConsole } from '/Users/thuann/projects/saas-ak-app/node_modules/.pnpm/jsdom@30.0.1_@noble+hashes@2.2.0/node_modules/jsdom/lib/api.js';
import path from "node:path";

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
    w.HTMLMediaElement.prototype.play = () => Promise.resolve();
    w.HTMLMediaElement.prototype.load = () => {};
    w.fetch = (u) => Promise.resolve({
      ok: true, json: async () => (String(u).includes("what=wishes") ? WISHES : []),
    });
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

console.log(fail ? `\n${fail} failing` : "\nall good");
process.exit(fail ? 1 : 0);
