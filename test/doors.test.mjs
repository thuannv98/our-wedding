/* The doors wait for a tap, and the cover's entrance waits for them. jsdom has no
   IntersectionObserver, so the watcher is stood in for here; without that the fallback
   path runs and this would pass without ever exercising the gate. */
import { JSDOM, VirtualConsole } from "jsdom";
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

// The button says what the visitor can hear. "play" fires when playback is asked for,
// "playing" when sound actually starts, and the file is not fetched until the doors
// open: marked from "play", the button claimed to be playing through seconds of silent
// loading, and a tap then did the opposite of what it looked like it would do.
{
  const audio = d.getElementById("audio"), button = d.getElementById("music");
  const fire = (name) => audio.dispatchEvent(new window.Event(name));
  const playing = () => button.classList.contains("is-playing");

  fire("pause");
  check("the button starts still", playing(), false);
  fire("play");
  check("asking for the track does not make it look playing", playing(), false);
  fire("playing");
  check("sound starting does", playing(), true);
  fire("pause");
  check("and pausing stops it looking playing", playing(), false);

  // and the slash is there to see, rather than one still state looking like the other
  const slash = button.querySelector(".music__slash");
  check("a struck-through note marks the still state", !!slash, true);
  check("hidden only while it plays",
    /\.music\.is-playing\s+\.music__slash\s*\{[^}]*display:\s*none/
      .test(fs.readFileSync(path.join(root, "css/dock.css"), "utf8")), true);
}

console.log(fail ? `\n${fail} failing` : "\nall good");
process.exit(fail ? 1 : 0);
