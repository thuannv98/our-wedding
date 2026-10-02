/* Sections that reproduce a fixed arrangement are checked by arithmetic, not by eye:
   each piece is placed as a percentage of its own box, so it must land where the old
   page put it on its canvas. */
import fs from "node:fs";

const css = ["sections", "album", "calendar", "components", "rsvp"]
  .concat(["guestbook"]).map((f) => fs.readFileSync(new URL(`../css/${f}.css`, import.meta.url), "utf8")).join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/@media[^{]+\{(?:[^{}]|\{[^{}]*\})*\}/g, "");

const RULES = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  selectors: m[1].split(",").map((x) => x.trim()),
  body: m[2],
}));

const pct = (selector, prop) => {
  let found = null;
  for (const r of RULES) {
    if (!r.selectors.includes(selector)) continue;
    // a bare 0 is the same as 0%, and is how it tends to be written
    const m = [...r.body.matchAll(new RegExp("(?:^|;)\\s*" + prop + "\\s*:\\s*(-?[\\d.]+)(%|\\b)", "g"))];
    for (const hit of m) {
      if (hit[2] === "%" || Number(hit[1]) === 0) found = Number(hit[1]);
    }
  }
  return found;
};

let fail = 0, checked = 0;
const near = (label, got, want, tol = 1) => {
  checked++;
  const ok = got !== null && Math.abs(got - want) <= tol;
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label.padEnd(36)} ${got === null ? "(no rule)" : got.toFixed(1) + "px"}  want ${want.toFixed(1)}px`);
};

/** canvas: the box the old page drew on; scale: what it rendered at */
function section(name, { canvas, scale = 1, checks }) {
  console.log(`\n--- ${name} (${canvas[0]}x${canvas[1]}${scale !== 1 ? ` at ${scale}` : ""})`);
  const [w, h] = [canvas[0] * scale, canvas[1] * scale];
  for (const [sel, prop, axis, oldValue] of checks) {
    const p = pct(sel, prop);
    const got = p === null ? null : (p / 100) * (axis === "x" ? w : h);
    near(`${sel} ${prop}`, got, oldValue * scale);
  }
}

section("Chú Rể & Cô Dâu", {
  canvas: [960, 1164], scale: 0.741,
  checks: [
    [".couple__mark", "left", "x", 434], [".couple__mark", "top", "y", 58],
    [".couple__mark", "width", "x", 92], [".couple__mark", "height", "y", 92],
    [".couple__title", "top", "y", 146],
    [".couple__photo", "top", "y", 250], [".couple__photo", "width", "x", 397],
    [".couple__photo", "height", "y", 487],
    [".couple__photo--groom", "left", "x", 66], [".couple__photo--bride", "left", "x", 495],
    [".nameplate", "top", "y", 748], [".nameplate", "width", "x", 397],
    [".nameplate", "height", "y", 72],
    [".couple__parents", "top", "y", 836], [".couple__home", "top", "y", 922],
    [".couple__portrait", "top", "y", 1003.4],   // raised a little from the old 1024 [".couple__portrait", "width", "x", 302],
    [".couple__portrait--groom", "left", "x", 130], [".couple__portrait--bride", "left", "x", 540],
    [".arch", "height", "y", 1112],
  ],
});

// re-spaced on purpose: see the note in sections.css. The canvas and the three tops
// below are ours, not the old page's.
section("Thư Mời Cưới", {
  canvas: [960, 971.2],
  checks: [
    [".invite__mark", "left", "x", 269.5 + 182.078], [".invite__mark", "top", "y", 18],
    [".invite__mark", "width", "x", 56], [".invite__mark", "height", "y", 56],
    [".invite__title", "left", "x", 269.5], [".invite__title", "top", "y", 18 + 56],
    [".invite__title", "width", "x", 421],
    [".invite__rule", "left", "x", 269.5 + 161], [".invite__rule", "top", "y", 18 + 56 + 51],
    [".invite__rule", "width", "x", 99],
    [".invite__names", "left", "x", 270], [".invite__names", "top", "y", 150.696],
    [".invite__names", "width", "x", 420.5],
    [".invite__kinhmoi", "top", "y", 150.696 + 76],
    [".invite__line", "top", "y", 270.696],      // where the guest line used to sit
    [".ceremony", "width", "x", 465],
    [".ceremony:nth-child(1)", "left", "x", 247.5], [".ceremony:nth-child(1)", "top", "y", 390],
    [".ceremony:nth-child(2)", "left", "x", 0], [".ceremony:nth-child(2)", "top", "y", 675.6],
    [".ceremony:nth-child(3)", "left", "x", 495], [".ceremony:nth-child(3)", "top", "y", 675.6],
  ],
});


// the heading was pulled closer to the mosaic, so this canvas is ours too
section("Album Ảnh Cưới", {
  canvas: [960, 1353],
  checks: [
    [".album__title", "top", "y", 48.7],
    [".album__more", "left", "x", 386.019], [".album__more", "top", "y", 1177.5],
    [".album__more", "width", "x", 185], [".album__more", "height", "y", 83.6],
    [".album__tile:nth-child(1)", "left", "x", 0.000], [".album__tile:nth-child(1)", "top", "y", 196.2],
    [".album__tile:nth-child(2)", "left", "x", 324.200], [".album__tile:nth-child(2)", "top", "y", 196.2],
    [".album__tile:nth-child(3)", "left", "x", 490.900], [".album__tile:nth-child(3)", "top", "y", 196.2],
    [".album__tile:nth-child(4)", "left", "x", 656.500], [".album__tile:nth-child(4)", "top", "y", 196.2],
    [".album__tile:nth-child(5)", "left", "x", 324.200], [".album__tile:nth-child(5)", "top", "y", 427.7],
    [".album__tile:nth-child(6)", "left", "x", 489.600], [".album__tile:nth-child(6)", "top", "y", 427.7],
    [".album__tile:nth-child(7)", "left", "x", 0.000], [".album__tile:nth-child(7)", "top", "y", 665.9],
    [".album__tile:nth-child(8)", "left", "x", 323.300], [".album__tile:nth-child(8)", "top", "y", 665.9],
    [".album__tile:nth-child(9)", "left", "x", 656.500], [".album__tile:nth-child(9)", "top", "y", 665.9],
  ],
});

section("Lời chúc cho Dâu Rể", {
  canvas: [960, 700],
  checks: [
    [".gb__bird", "left", "x", 444.5], [".gb__bird", "top", "y", 0],
    [".gb__bird", "width", "x", 100], [".gb__bird", "height", "y", 100],
    [".gb__heading", "left", "x", 130], [".gb__heading", "top", "y", 72],
    [".gb__heading", "width", "x", 700],
    [".gb__wrap", "top", "y", 176],
  ],
});

section("Xác Nhận Tham Dự", {
  canvas: [960, 856],
  checks: [
    [".rsvp__panel", "left", "x", 26.179], [".rsvp__panel", "top", "y", 46.4],
    [".rsvp__panel", "width", "x", 904.877], [".rsvp__panel", "height", "y", 744],
    [".rsvp__photo", "left", "x", 379.696], [".rsvp__photo", "top", "y", 59.558],
    [".rsvp__photo", "width", "x", 197.842], [".rsvp__photo", "height", "y", 197.842],
    [".rsvp__head", "left", "x", 233], [".rsvp__head", "top", "y", 257.4],
    [".rsvp__head", "width", "x", 494], [".rsvp__head", "height", "y", 81.713],
    [".rsvp__lead", "top", "y", 352.9],
    [".rsvp__form", "left", "x", 124.323], [".rsvp__form", "top", "y", 423.423],
    [".rsvp__form", "width", "x", 711.354], [".rsvp__form", "height", "y", 265.286],
    [".rsvp__back", "left", "x", 124.323], [".rsvp__back", "top", "y", 703.709],
  ],
});

section("Đôi Lời Ngỏ", {
  canvas: [960, 340],
  checks: [
    [".foreword__title", "top", "y", 14],
    [".foreword__text", "top", "y", 110], [".foreword__text", "width", "x", 693],
  ],
});

section("Thank you", {
  canvas: [960, 380],
  checks: [
    [".thanks__mark", "left", "x", 451.5], [".thanks__mark", "top", "y", 33],
    [".thanks__mark", "width", "x", 77], [".thanks__mark", "height", "y", 77],
    [".thanks__title", "left", "x", 153], [".thanks__title", "top", "y", 89],
    [".thanks__title", "width", "x", 674],
    [".thanks__names", "left", "x", 293], [".thanks__names", "top", "y", 263],
    [".thanks__names", "width", "x", 394],
  ],
});

// inside one card, measured against its own 465 x 255.595 box
console.log("\n--- inside a ceremony card (465x255.595)");
for (const [sel, prop, axis, want] of [
  [".ceremony__panel", "top", "y", 30.595], [".ceremony__panel", "height", "y", 225],
  [".ceremony__photo", "left", "x", 264],
  [".ceremony__photo", "width", "x", 170.576], [".ceremony__photo", "height", "y", 113.595],
  [".ceremony__title", "left", "x", 49], [".ceremony__title", "top", "y", 45.595],
  [".ceremony__icon--time", "left", "x", 15], [".ceremony__icon--time", "top", "y", 88.595],
  [".ceremony__icon--place", "left", "x", 17], [".ceremony__icon--place", "top", "y", 136.595],
  [".ceremony__when", "top", "y", 88.395], [".ceremony__where", "top", "y", 136.595],
  [".ceremony__btn", "top", "y", 191.595], [".ceremony__btn", "width", "x", 160],
  [".ceremony__rsvp", "left", "x", 43], [".ceremony__map", "left", "x", 264],
]) {
  const p = pct(sel, prop);
  const got = p === null ? null : (p / 100) * (axis === "x" ? 465 : 255.595);
  near(`${sel} ${prop}`, got, want, 0.6);
}

// A percentage means nothing without knowing what it is measured against. Any wrapper
// holding absolutely placed children must itself span its parent, or the children
// resolve against a shrink-to-fit box and pile up in a corner.
// the gap between the two rows of ceremonies should equal the gap between the two
// cards standing side by side, which is the point of the re-spacing
console.log("\n--- the two gaps between ceremony cards");
{
  // the card has an aspect-ratio rather than a height, so its height comes from its width
  const H = 971.2, W = 960;
  const cardW = (pct(".ceremony", "width") / 100) * W;
  const cardH = cardW * (255.595 / 465);
  const across = ((pct(".ceremony:nth-child(3)", "left") - pct(".ceremony", "width")) / 100) * W;
  const down = ((pct(".ceremony:nth-child(2)", "top") - pct(".ceremony:nth-child(1)", "top")) / 100) * H - cardH;
  near("gap down matches gap across", down, across, 0.6);
}

// The cover is not placed by percentages: it is a flow layout written in real pixels.
// That is exactly where the mistake hid for a round, because the old page's own numbers
// were copied in whole while it drew them on a 420px canvas the browser squeezed into
// 360. Every one of them has to carry that 0.857 before it is written here.
console.log("\n--- Trang bìa (the old canvas, at 0.857)");
{
  const px = (selector, prop) => {
    let found = null;
    for (const r of RULES) {
      if (!r.selectors.includes(selector)) continue;
      for (const m of r.body.matchAll(new RegExp("(?:^|;)\\s*" + prop + "\\s*:\\s*([\\d.]+)px", "g"))) found = Number(m[1]);
    }
    return found;
  };
  const FIT = 360 / 420;
  for (const [sel, prop, canvasValue] of [
    [".cover", "min-height", 543.444],
    [".cover__date", "font-size", 22],
    [".cover__title", "font-size", 70],
    [".cover__names", "font-size", 34],
    [".countdown li", "width", 64], [".countdown li", "height", 64],
    [".countdown b", "font-size", 20],
    [".countdown span", "font-size", 13],
  ]) {
    near(`${sel} ${prop}`, px(sel, prop), canvasValue * FIT);
  }
}

console.log("\n--- wrappers that the placed children measure against");
for (const sel of [".ceremonies", ".album__mosaic"]) {
  for (const [prop, want] of [["width", 100], ["height", 100], ["left", 0], ["top", 0]]) {
    near(`${sel} ${prop}`, pct(sel, prop), want, 0);
  }
}

console.log(fail
  ? `\n${fail} of ${checked} off`
  : `\nall ${checked} pieces sit where they should (most from the old page, a few re-spaced on purpose)`);
process.exit(fail ? 1 : 0);
