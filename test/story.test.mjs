/* The drawing and the four photographs turn over into each other. The drawing is what a
   guest has not seen before, so it is the face that greets them. */
import { JSDOM, VirtualConsole } from '/Users/thuann/projects/saas-ak-app/node_modules/.pnpm/jsdom@30.0.1_@noble+hashes@2.2.0/node_modules/jsdom/lib/api.js';
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const vc = new VirtualConsole();
const errors = [];
vc.on("jsdomError", (e) => errors.push(e.message));

const dom = await JSDOM.fromFile(path.join(root, "index.html"), {
  runScripts: "dangerously", resources: "usable", pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.HTMLMediaElement.prototype.play = () => Promise.resolve();
    w.HTMLMediaElement.prototype.load = () => {};
    w.fetch = () => Promise.resolve({ ok: true, json: async () => [] });
    w.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; }
      observe(el) { this.cb([{ isIntersecting: true, target: el }], this); }
      unobserve() {} disconnect() {}
    };
  },
});
const { window } = dom, d = window.document;
await new Promise((r) => window.addEventListener("load", r));

let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}` + (ok ? "" : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`));
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const box = d.getElementById("story-flip");

check("nothing threw", errors, []);
check("both faces are there",
  [!!box.querySelector(".story__drawing"), box.querySelectorAll(".story__photo").length], [true, 4]);
check("the drawing comes first", box.classList.contains("is-turned"), false);
check("and it is the one named in the data file",
  box.querySelector(".story__drawing").getAttribute("src"),
  JSON.parse(fs.readFileSync(path.join(root, "data.js"), "utf8").match(/\{[\s\S]*\}/)[0]).story.cover);

// the box carries the shape, so neither face can change the size of the other
const css = fs.readFileSync(path.join(root, "css/sections.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const ratioOn = (sel) => new RegExp("\\" + sel + "\\s*\\{[^}]*aspect-ratio").test(css);
check("the shape belongs to the box, not to one face", [ratioOn(".story__flip"), ratioOn(".story__photos")], [true, false]);

// only the drawing is smaller; the four photographs keep the room they always had, and
// the drawing sits in the middle of that room both ways
check("the drawing is the only one scaled back",
  /\.story__drawing\s*\{[^}]*height:\s*83\.4%/.test(css), true);
check("and it is centred in the box both ways",
  /\.story__face--one\s*\{[^}]*place-items:\s*center/.test(css), true);
check("the box itself is not shrunk", /\.story__flip\s*\{[^}]*width:\s*100%/.test(css), true);

// Watched rather than sampled at a fixed instant: the page starts its own turning at
// load, and asking "what is it now" races that. What matters is that it does turn, and
// that it comes back.
const until = async (want, ms = 1500) => {
  for (let t = 0; t < ms; t += 10) { if (want()) return true; await wait(10); }
  return false;
};
// It must not start counting behind a closed door. The cover is shorter than a phone
// screen, so the top of this section is already in view while the red panel is still up,
// and the first turn used to come and go before the guest had opened the invitation.
window.AK.setupStoryFlip.hold = 40;
window.AK.setupStoryFlip(d);
await wait(200);
check("it does not turn behind the closed doors", box.classList.contains("is-turned"), false);

d.getElementById("doors").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
check("then it turns to the photographs", await until(() => box.classList.contains("is-turned")), true);
check("and back again", await until(() => !box.classList.contains("is-turned")), true);

console.log(fail ? `\n${fail} failing` : "\nall good");
process.exit(fail ? 1 : 0);
