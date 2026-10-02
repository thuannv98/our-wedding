/* The scripts are plain scripts now, so the test lets jsdom load and run the page
   exactly as a browser does rather than importing the pieces by hand. */
import { JSDOM, VirtualConsole } from '/Users/thuann/projects/saas-ak-app/node_modules/.pnpm/jsdom@30.0.1_@noble+hashes@2.2.0/node_modules/jsdom/lib/api.js';
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

export async function render({ data: edit, fetchResult } = {}) {
  const errors = [];
  const asked = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message));
  vc.on("error", (...a) => errors.push(a.join(" ")));

  const dom = await JSDOM.fromFile(path.join(root, "index.html"), {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
      w.HTMLDialogElement.prototype.close = function () { this.open = false; };
      w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      w.HTMLMediaElement.prototype.pause = function () {};
      w.fetch = (url) => {
        asked.push(String(url));
        return Promise.resolve({ ok: true, json: async () => fetchResult ?? [] });
      };
      if (edit) {
        // the data file is a plain script, so it is edited the moment it has run
        Object.defineProperty(w, "WEDDING", {
          configurable: true,
          set(v) { edit(v); Object.defineProperty(w, "WEDDING", { value: v, writable: true, configurable: true }); },
          get() { return undefined; },
        });
      }
    },
  });

  await new Promise((r) => dom.window.addEventListener("load", r));
  await new Promise((r) => setTimeout(r, 120));
  return { window: dom.window, d: dom.window.document, errors, asked };
}
