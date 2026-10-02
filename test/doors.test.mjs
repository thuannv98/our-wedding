/* The doors wait for a tap, and the cover's entrance waits for them. jsdom has no
   IntersectionObserver, so the watcher is stood in for here; without that the fallback
   path runs and this would pass without ever exercising the gate. */
import { JSDOM, VirtualConsole } from '/Users/thuann/projects/saas-ak-app/node_modules/.pnpm/jsdom@30.0.1_@noble+hashes@2.2.0/node_modules/jsdom/lib/api.js';
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(import.meta.dirname, "..");
const vc = new VirtualConsole();
const errors = [];
vc.on("jsdomError", (e) => errors.push(e.message));

const dom = await JSDOM.fromFile(path.join(root, "index.html"), {
  runScripts: "dangerously", resources: "usable", pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.HTMLMediaElement.prototype.play = () => Promise.resolve();
    w.HTMLMediaElement.prototype.load = () => {};   // jsdom fetches nothing
    w.fetch = () => Promise.resolve({ ok: true, json: async () => [] });
    // every observed element counts as in view the moment it is observed
    w.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; }
      observe(el) { this.cb([{ isIntersecting: true, target: el }], this); }
      unobserve() {}
      disconnect() {}
    };
  },
});
const { window } = dom, d = window.document;
await new Promise((r) => window.addEventListener("load", r));
await new Promise((r) => setTimeout(r, 2700));   // past the longest the words may be held

let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}` + (ok ? "" : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`));
};
const shown = (el) => el.classList.contains("is-in") || el.classList.contains("is-shown");

const cover = [...d.querySelectorAll(".cover [data-anim]")];
const rest = [...d.querySelectorAll("[data-anim]")].filter((e) => !e.closest(".cover"));

check("nothing threw", errors, []);
check("the cover has pieces to animate", cover.length > 0, true);
check("they hold while the doors are shut", cover.filter(shown).length, 0);
check("the rest of the page does not wait", rest.filter(shown).length, rest.length);

// 3.6MB of music fetched at page load would race the cover photograph, and nothing can
// be heard before the tap regardless. It waits for the cover, then buffers in the gap
// before the visitor reaches for the screen.
// the markup, not the live element: by now the script has already warmed it up
const markup = fs.readFileSync(path.join(root, "index.html"), "utf8");
check("the music is not fetched at page load",
  /<audio[^>]*preload="none"/.test(markup), true);
check("but it is warming up by the time the tap is invited",
  d.getElementById("audio").preload, "auto");

// The tap is the whole point: it parts the doors and is the gesture the browser
// needs before it will play the music, so nothing may open without one.
const doors = d.getElementById("doors");
check("the doors are shut until someone taps", doors.classList.contains("is-open"), false);
check("but they invite the tap", doors.classList.contains("is-ready"), true);
check("and the invitation is in the data file, not the markup",
  (d.getElementById("doors-open").textContent || "").trim().length > 0, true);

let opened = 0;
window.addEventListener("ak:doors-open", () => { opened++; });
doors.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await new Promise((r) => setTimeout(r, 20));

check("a tap parts them", doors.classList.contains("is-open"), true);
check("and says so once, for the music to hear", opened, 1);
check("and they play once the doors part", cover.filter(shown).length, cover.length);

console.log(fail ? `\n${fail} failing` : "\nall good");
process.exit(fail ? 1 : 0);
