/* The rules this rewrite exists to hold:
   a value is declared once, and only tokens.css names a raw one. */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const cssFiles = fs.readdirSync(path.join(root, "css")).filter((f) => f.endsWith(".css"));

let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}` + (ok ? "" : `\n       ${JSON.stringify(got, null, 1).slice(0, 600)}`));
};

// 1. no colour is written outside the token file
const COLOUR = /#[0-9a-f]{3,8}\b|\brgb\(|\bhsl\(/gi;
const strayColours = cssFiles.filter((f) => f !== "tokens.css").flatMap((f) =>
  read(`css/${f}`).split("\n").map((line, i) => ({ f, i: i + 1, line: line.trim() }))
    .filter(({ line }) => COLOUR.test(line) && !line.startsWith("/*"))
    .map(({ f, i, line }) => `${f}:${i}  ${line.slice(0, 70)}`));
check("colours live only in tokens.css", strayColours, []);

// 2. no font family is named twice
const fontNames = cssFiles.flatMap((f) => [...read(`css/${f}`).matchAll(/font-family:\s*([^;]+)/g)]
  .map((m) => `${f}: ${m[1].trim()}`));
check("font families are only ever token references",
  fontNames.filter((v) => !/var\(--font-/.test(v)), []);

// 3. the page carries no inline style and no style block
const html = read("index.html");
check("no inline styles in the markup", [...html.matchAll(/\sstyle="/g)].length, 0);
check("no stylesheet buried in the page", [...html.matchAll(/<style[\s>]/g)].length, 0);

// 4. no list repeats a picture. The same photo may appear in the album and in a
// portrait gallery, which is a choice; the same photo twice in one list is a mistake.
const data = read("data.js");
const paths = [...data.matchAll(/"(img\/[^"]+)"/g)].map((m) => m[1]);
const W = JSON.parse(data.slice(data.indexOf("{"), data.lastIndexOf("}") + 1));
const lists = { album: W.album, "groom.portrait": W.groom.portrait, "bride.portrait": W.bride.portrait };
const repeats = Object.entries(lists).flatMap(([name, list]) =>
  list.filter((p, i) => list.indexOf(p) !== i).map((p) => `${name}: ${p}`));
check("no list repeats a picture", repeats, []);

// 5. every file the data names exists
const missing = [...new Set(paths)].filter((p) => !fs.existsSync(path.join(root, p)));
check("every picture named exists", missing, []);

// 6. no key in the data file goes unread by the page
const source = ["index.html", ...cssFiles.map((f) => `css/${f}`),
  ...fs.readdirSync(path.join(root, "js")).map((f) => `js/${f}`)].map(read).join("\n");
const topLevel = [...data.matchAll(/^  "([A-Za-z]\w*)":/gm)].map((m) => m[1]);
check("no key in data.js is dead", topLevel.filter((k) => !source.includes(k)), []);

// Twice now a sweeping edit has deleted a block of rules and left the markup that
// needed them behind: the page kept working, the piece just stopped being drawn.
// Every class the markup uses must have a rule somewhere.
{
  const allCss = cssFiles.map((f) => read(`css/${f}`)).join("\n");
  const used = new Set();
  for (const m of html.matchAll(/class="([^"]+)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) used.add(c);
  }
  const unstyled = [...used].filter((c) => !allCss.includes("." + c));
  check("every class in the markup has a rule", unstyled, []);
}

// A block left behind after a rewrite keeps styling the markup and fights the new one:
// a stale .music rule put a second note on the button for a whole round. A selector
// that appears in two different files is almost always that.
{
  const owners = new Map();
  for (const f of cssFiles.filter((f) => f !== "motion.css")) {   // motion overlays the rest by design
    const body = read(`css/${f}`).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of body.matchAll(/(^|[}])\s*([^{}@]+)\{/g)) {
      for (const sel of m[2].split(",")) {
        const key = sel.trim();
        if (!key || key.startsWith(":root") || key.startsWith("from") || key.startsWith("to") || /^\d/.test(key)) continue;
        if (!owners.has(key)) owners.set(key, new Set());
        owners.get(key).add(f);
      }
    }
  }
  const split = [...owners].filter(([, files]) => files.size > 1)
    .map(([sel, files]) => `${sel} in ${[...files].join(" + ")}`);
  check("no selector is styled from two files", split, []);
}

// A section whose backdrop is absolutely placed while its contents are in normal flow
// paints the backdrop over them, and the section comes out blank. Wherever a backdrop
// and its siblings differ that way, both must say which layer they are on.
{
  const all = cssFiles.map((f) => read(`css/${f}`)).join("\n");
  const backdrops = [".arch", ".rsvp__panel", ".cover__photo", ".cover__scrim", ".ceremony__panel",
    ".closing__photo", ".closing__scrim"];
  const noLayer = backdrops.filter((sel) => {
    const blocks = [...all.matchAll(new RegExp(sel.replace(".", "\\.") + "\\s*[,{][^}]*\\}", "g"))];
    return blocks.length > 0 && !blocks.some((b) => /z-index/.test(b[0]));
  });
  check("every backdrop says which layer it is on", noLayer, []);
}

// A blanket `parent > *` rule places every child at once, which is how three sections
// were drawn; the trap is that it carries the same weight as a child's own `.class`
// rule, so whichever is written later wins. That is how the ornament came out at its
// natural size, how the cards piled up, and how the honeypot appeared on the page.
// A child named by such a rule must be named more specifically than the blanket.
{
  const { JSDOM } = await import("/Users/thuann/projects/saas-ak-app/node_modules/.pnpm/jsdom@30.0.1_@noble+hashes@2.2.0/node_modules/jsdom/lib/api.js");
  const doc = new JSDOM(html).window.document;

  // every rule in load order, each remembering which width it was written for
  const rules = [];
  for (const f of [...html.matchAll(/href="css\/([^"]+)"/g)].map((m) => m[1])) {
    const src = read(`css/${f}`).replace(/\/\*[\s\S]*?\*\//g, "");
    let at = 0, media = "", depth = 0, head = "";
    for (let i = 0; i < src.length; i++) {
      if (src[i] === "{") {
        head = src.slice(at, i).trim(); at = i + 1; depth++;
        if (head.startsWith("@")) { media = head; continue; }
        const decl = src.slice(i + 1, src.indexOf("}", i));
        for (const sel of head.split(",")) {
          const one = sel.trim();
          if (one && !/^(:root|from|to|\d|@)/.test(one)) rules.push({ f, media, n: rules.length, sel: one, decl });
        }
      } else if (src[i] === "}") { depth--; at = i + 1; if (depth === 0) media = ""; }
    }
  }
  const props = (decl) => new Map([...decl.matchAll(/(^|[;{\s])([a-z-]+)\s*:\s*([^;]+)/g)]
    .map((m) => [m[2], m[3].trim()]));
  // (classes, elements); no id is used anywhere in this page
  const weigh = (sel) => {
    const bare = sel.replace(/:not\(([^)]*)\)/g, "$1");
    return [(bare.match(/\.[\w-]+|\[|::?[\w-]+/g) || []).length,
            (bare.match(/(^|[\s>+~])[a-z]+\b/g) || []).length];
  };
  const laterWins = (a, b) => a.w[0] !== b.w[0] ? a.w[0] > b.w[0]
    : a.w[1] !== b.w[1] ? a.w[1] > b.w[1] : a.n > b.n;
  // only rules written for the same width are compared: a mobile blanket undoing the
  // desktop placement is the point of it, not a clash
  const sameWidth = (a, b) => a.media === b.media;

  const clobbered = [];
  for (const blanket of rules) {
    if (!/>\s*(\*|:not\()/.test(blanket.sel)) continue;
    blanket.w = weigh(blanket.sel);
    const bp = props(blanket.decl);
    let kids;
    try { kids = [...doc.querySelectorAll(blanket.sel)]; } catch { continue; }
    for (const kid of kids) {
      for (const own of rules) {
        if (own === blanket || !sameWidth(blanket, own)) continue;
        if (/[>+~\s]/.test(own.sel.replace(/:not\([^)]*\)/g, ""))) continue;   // a plain name only
        let hit = false;
        try { hit = kid.matches(own.sel); } catch { continue; }
        if (!hit) continue;
        own.w = weigh(own.sel);
        if (!laterWins(blanket, own)) continue;
        for (const [p, v] of props(own.decl))
          if (bp.has(p) && bp.get(p) !== v)
            clobbered.push(`${own.f}: ${own.sel} { ${p}: ${v} }  loses to  ${blanket.f}: ${blanket.sel} { ${p}: ${bp.get(p)} }`);
      }
    }
  }
  check("no blanket child rule outranks a piece's own rule", [...new Set(clobbered)].sort(), []);

  // A piece given a percentage offset but never given a position silently ignores it and
  // falls back into the flow. The ceremony buttons did exactly that on a wide screen:
  // they sit inside a wrapper, so the blanket `.ceremony > *` that positions the card's
  // other parts never reached them, and `display: contents` on the wrapper changes the
  // boxes, not what a selector matches. Every placed piece must have a position.
  {
    // the cards and tiles only exist once a script has stamped them out
    for (const [tplId, host] of [["tpl-ceremony", '[data-list="ceremonies"]'],
                                 ["tpl-story-photo", '[data-list="story.photos"]'],
                                 ["tpl-album-item", '[data-list="album"]']]) {
      const tpl = doc.getElementById(tplId), into = doc.querySelector(host);
      if (tpl && into) into.appendChild(tpl.content.cloneNode(true));
    }

    const OFFSET = /(?:^|[;{\s])(top|left|right|bottom)\s*:\s*-?[\d.]+%/;
    const POSITIONED = /(?:^|[;{\s])position\s*:\s*(absolute|relative|fixed|sticky)/;
    const adrift = [];
    for (const r of rules) {
      if (!OFFSET.test(r.decl)) continue;
      let targets = [];
      try { targets = [...doc.querySelectorAll(r.sel)]; } catch { continue; }
      for (const el of targets) {
        const placed = rules.some((o) => {
          // a position set outside any media block still applies inside one, so this
          // asks a wider question than the clobber check above does
          if (!POSITIONED.test(o.decl)) return false;
          if (o.media !== "" && o.media !== r.media) return false;
          try { return el.matches(o.sel); } catch { return false; }
        });
        if (!placed) adrift.push(`${r.f}: ${r.sel} is placed by percentage but never positioned`);
      }
    }
    check("every piece placed by percentage has a position", [...new Set(adrift)].sort(), []);
  }
}


// The honeypot has to stay off the page: a visible one both looks broken and stops
// catching anything. It sits inside a stage that places all its children, and a blanket
// reset there once put it back in the flow, so no rule anywhere may move it.
{
  const all = cssFiles.map((f) => ({ f, src: read(`css/${f}`).replace(/\/\*[\s\S]*?\*\//g, "") }));
  const loose = all.flatMap(({ f, src }) =>
    [...src.matchAll(/([^{}@]*\bfield--hp\b[^{}]*)\{([^}]*)\}/g)]
      .filter((m) => !/position:\s*absolute/.test(m[2]))
      .map((m) => `${f}: ${m[1].trim()}`));
  check("the honeypot is never put back in the flow", loose, []);
  const hp = [...html.matchAll(/class="field--hp"/g)].length;
  check("both forms carry a honeypot", hp, 2);
}

// 166 files nobody referenced had piled up in img/, and two of them were the same
// 7.5MB photograph under different names, so a guest downloaded it twice. Neither is
// visible from the page, which is why both lasted.
{
  const crypto = await import("node:crypto");
  const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true })
    .flatMap((e) => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
  const source = ["index.html", "data.js", ...cssFiles.map((f) => `css/${f}`),
    ...fs.readdirSync(path.join(root, "js")).map((f) => `js/${f}`)].map(read).join("\n");

  const all = walk("img").filter((p) => !p.startsWith("img/favico/"));   // a whole icon set, kept whole
  check("no picture sits in img/ unused", all.filter((p) => !source.includes(p)), []);

  const seen = new Map();
  const twins = [];
  for (const p of all) {
    const sum = crypto.createHash("md5").update(fs.readFileSync(path.join(root, p))).digest("hex");
    if (seen.has(sum)) twins.push(`${seen.get(sum)} == ${p}`);
    else seen.set(sum, p);
  }
  check("no picture is kept twice under two names", twins, []);

  // The photographs went up straight off the camera: 258MB of them, one 27MB on its own,
  // on a page a guest opens on a phone. Resized once, they have to stay resized.
  const BUDGET = 500 * 1024;
  const heavy = all.map((p) => [p, fs.statSync(path.join(root, p)).size])
    .filter(([, n]) => n > BUDGET)
    .map(([p, n]) => `${p} ${(n / 1024).toFixed(0)}KB`);
  check("no picture is heavier than 500KB", heavy, []);
}

console.log(fail ? `\n${fail} failing` : "\nall good");
process.exit(fail ? 1 : 0);
