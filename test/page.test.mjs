import fs from "node:fs";
import { render } from "./render.mjs";

let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}` + (ok ? "" : `\n       got  ${JSON.stringify(got)}\n       want ${JSON.stringify(want)}`));
};
const text = (d, sel) => d.querySelector(sel)?.textContent.trim() ?? "(missing)";

const { d, window, errors, asked } = await render();
const W = window.WEDDING;

check("nothing threw", errors, []);
check("page title from data", d.title, W.pageTitle);
check("groom name on the cover", text(d, '.cover__names [data-text="groom.name"]'), W.groom.name);
check("cover photo applied", d.querySelector(".cover__photo img").getAttribute("src"), W.cover.photo);
check("the phone gets its own crop", d.querySelector(".cover__photo source").getAttribute("srcset"), W.cover.photoMobile);
check("the cover date reads in English", text(d, ".cover__date"), "Oct 23 2026");
check("four pictures beside the story", d.querySelectorAll(".story__photo img").length, W.story.photos.length);
check("the first one is the first in the data", d.querySelector(".story__photo img").getAttribute("src"), W.story.photos[0]);
check("one card per ceremony", d.querySelectorAll(".ceremony").length, W.ceremonies.length);
check("first ceremony title", text(d, ".ceremony__title"), W.ceremonies[0].title);
// the weekday is computed from the date and sits beside the hour, the date under it
check("weekday derived, not typed", /Thứ|Chủ Nhật/.test(text(d, ".ceremony__time")), true);
check("the date is written short beneath", /^Ngày \d{2}\/\d{2}\/\d{4}$/.test(text(d, ".ceremony__date")), true);
// the picker leads with a placeholder, then one option per ceremony
check("venue picker filled from the same list", d.querySelectorAll("#rsvp-venue option").length, W.ceremonies.length + 1);
check("and it starts on the placeholder", d.querySelector("#rsvp-venue option").value, "");
check("each ceremony offers an RSVP link", d.querySelectorAll(".ceremony__rsvp").length, W.ceremonies.length);
check("and a map link where there is one", d.querySelectorAll(".ceremony__map").length, W.ceremonies.filter((c) => c.map).length);
// only the album opens a slideshow: every other picture is there to look at
{
  const clickable = [...d.querySelectorAll("img")].filter((i) => i.closest("button, a"));
  const outside = clickable.filter((i) => !i.closest("#album"));
  check("nothing outside the album is clickable", outside.map((i) => i.className || i.src), []);
  check("and every album tile is", clickable.length, d.querySelectorAll(".album__tile").length);
}

check("a tile per photo", d.querySelectorAll(".album__tile").length, W.album.length);
check("the mosaic places nine", [...d.querySelectorAll(".album__tile")].length >= 9, true);
check("the button opens the slideshow", !!d.querySelector(".album__more"), true);
check("calendar drawn", d.querySelectorAll(".std__day:not(.std__day--empty)").length, 31);
// derived from the data: two ceremonies share a day here, so two cells carry marks
const month = W.weddingDate.slice(0, 7);
const markedDays = new Set(W.ceremonies.filter((c) => c.date.startsWith(month)).map((c) => c.date));
check("every ceremony day in that month is marked", d.querySelectorAll(".std__day--marked").length, markedDays.size);
check("the shared day carries both icons", d.querySelector(".std__day--marked .std__marks").children.length, 2);
check("wish relations offered", d.querySelectorAll("#wish-relation option").length, W.wishRelations.length);
check("only wishes are fetched", asked.filter((u) => u.includes("what=wishes")).length, 1);
check("rsvp answers are never fetched", asked.some((u) => /rsvp/i.test(u)), false);

// a parent left unnamed drops its line
// the couple section, laid out the way the old page had it
check("both photos placed", d.querySelectorAll(".couple__photo").length, 2);
check("the ornament sits above the title", !!d.querySelector(".couple__mark"), true);
check("the name comes before its rule", (() => {
  const plate = d.querySelector(".nameplate");
  return plate.children[0].className === "nameplate__name";
})(), true);
check("a heart on the rule", d.querySelectorAll(".nameplate__rule svg").length, 2);
check("two portrait buttons", d.querySelectorAll(".couple__portrait").length, 2);
check("each carries a chevron", d.querySelectorAll(".couple__portrait svg").length, 2);
{
  // the buttons open a panel below rather than a dialog, and only one at a time
  const groom = d.querySelector('[data-portrait="groom"]');
  const bride = d.querySelector('[data-portrait="bride"]');
  check("both panels start closed", [d.getElementById("portrait-groom").hidden, d.getElementById("portrait-bride").hidden], [true, true]);
  groom.dispatchEvent(new window.Event("click"));
  check("his panel opens", d.getElementById("portrait-groom").hidden, false);
  check("and the button says so", groom.getAttribute("aria-expanded"), "true");
  bride.dispatchEvent(new window.Event("click"));
  check("opening hers closes his", [d.getElementById("portrait-groom").hidden, d.getElementById("portrait-bride").hidden], [true, false]);
  bride.dispatchEvent(new window.Event("click"));
  check("clicking the open one closes it", d.getElementById("portrait-bride").hidden, true);
  check("the intro keeps its separate lines", d.querySelectorAll("#portrait-groom .portrait__intro p").length,
    W.groom.intro.split("\n").filter((l) => l.trim()).length);
}
check("no role label, as in the original", d.querySelectorAll(".person__role").length, 0);

check("groom has no father in the data", (W.groom.father || "").trim(), "");
check("so only one parent line shows", text(d, '[data-parents="groom"]').split("\n").length, 1);
check("and the bride keeps both", d.querySelector('[data-parents="bride"]').innerHTML.split("<br>").length, 2);

check("the door has two halves", d.querySelectorAll(".doors__half").length, 2);
check("both halves carry the picture", [...d.querySelectorAll(".doors__art img")].map((i) => i.getAttribute("src")), [W.doorPhoto, W.doorPhoto]);
check("and a narrow-screen crop", [...d.querySelectorAll(".doors__art source")].map((s) => s.getAttribute("srcset")), [W.doorPhotoMobile, W.doorPhotoMobile]);
check("the slide takes the four seconds the old page took",
  /\.doors__half\s*\{[^}]*transition:\s*transform 4s ease-in-out/.test(fs.readFileSync(new URL("../css/sections.css", import.meta.url), "utf8")), true);
check("the calendar stands between two sprigs", d.querySelectorAll(".std__row .std__sprig").length, 2);

// the guest book is a book: two pages, a rolled spine and the sprig
check("the book has both pages", d.querySelectorAll(".book__page").length, 2);
check("the spine is there", !!d.querySelector(".book__spine"), true);
check("the sprig is drawn", d.querySelectorAll(".sprig__leaf").length > 0, true);
check("the form sits on the right page", !!d.querySelector(".book__page--right #wish-form"), true);
check("suggestions offered", d.querySelectorAll("#wish-pick option").length, W.wishSuggestions.length + 1);

// sending without a name, or without a wish, answers with a message and keeps the form
{
  const form = d.getElementById("wish-form");
  const fire = () => form.dispatchEvent(new window.Event("submit", { cancelable: true, bubbles: true }));
  fire();
  check("no name is refused", d.querySelector(".toast")?.textContent, "Bạn cho tụi mình xin cái tên nhé");
  check("and the form stays open", d.querySelector(".book__done").hidden, true);
  d.getElementById("wish-name").value = "Thu Hà";
  fire();
  check("no wish is refused too", d.querySelector(".toast")?.textContent, "Viết cho hai đứa đôi dòng nhé");
  check("still open", d.querySelector(".book__done").hidden, true);
  d.getElementById("wish-name").value = "";
}

// the lists are the ones the old page offered
check("twelve suggestions", d.querySelectorAll("#wish-pick option").length - 1, 12);
check("five relations", d.querySelectorAll("#wish-relation option").length, 5);

// a wish written now appears on a note straight away
d.getElementById("wish-name").value = "Nguyễn Thu Hà";
d.getElementById("wish-text").value = "Chúc hai bạn trăm năm hạnh phúc";
d.getElementById("wish-form").dispatchEvent(new window.Event("submit", { cancelable: true, bubbles: true }));
check("the note appears", d.querySelectorAll(".notes__track .note:not(.note--copy)").length, 1);
check("the notes box is revealed", d.getElementById("wishes-box").hidden, false);
check("and the form says thank you", d.querySelector(".book__done").hidden, false);

// the run of sections and the ground each sits on, taken from the old page
{
  const sections = [...d.querySelectorAll("main > section")];
  check("sections run in the old order",
    sections.map((s) => s.id),
    ["story", "couple", "portrait-groom", "portrait-bride", "invitation",
     "save-the-date", "album", "guestbook", "rsvp", "foreword"]);   // thanks merged into it
  check("each sits on the ground the old page gave it",
    sections.map((s) => `${s.id}:${s.dataset.ground}`),
    ["story:xanh", "couple:trang", "portrait-groom:trang", "portrait-bride:trang",
     "invitation:xanh", "save-the-date:trang", "album:xanh", "guestbook:trang",
     "rsvp:xanh", "foreword:trang"]);
}

// the closing block, as the old page arranged it
check("the foreword has its own section", text(d, "#foreword-title"), "Đôi Lời Ngỏ");
check("thank you has its own heading", text(d, "#thanks-title"), "Thank you!");
check("and both close one block, under one photograph",
  d.querySelectorAll("#foreword .closing__photo, #foreword #thanks").length, 2);
// The saint names belong where the parents' saint names are, and nowhere else: on the
// cover the pair runs half as long again as the box, and wraps onto the countdown.
check("the nameplates carry the saint names",
  [...d.querySelectorAll(".nameplate__name")].map((e) => e.textContent),
  [W.groom.saintName, W.bride.saintName]);
check("the cover keeps the short names",
  text(d, ".cover__names").replace(/\s+/g, " ").trim(),
  `${W.groom.name} ♥ ${W.bride.name}`.replace(/\s+/g, " "));

// What a shared link shows comes from the file itself: Zalo and Messenger fetch the HTML
// and never run the scripts, so a description set from data.js would never reach them.
{
  const head = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8").slice(0, 2000);
  const desc = head.match(/<meta name="description" content="([^"]*)"/);
  check("the file itself carries a description", desc?.[1], "Happy Wedding - Văn Thuận ♥ Thanh Thùy");
  check("and it is not left at a placeholder", /Wedding Invitation|Thiệp cưới/.test(desc?.[1] ?? ""), false);
}

// The story is three paragraphs, and it reaches the page through data-lines: written as
// one data-text it would all run together in a single block.
check("the story is set as three paragraphs",
  d.querySelectorAll(".story__text p").length, 3);

// The strip of wishes read back from the sheet must stand in the section's own flow.
// Inside .gb__wrap it inherited an absolute position in a box with a locked ratio, so on
// a wide screen it hung past the bottom and the next section painted over it: the DOM was
// right, the request was right, and nothing was on screen.
{
  const strip = d.getElementById("wishes-box");
  check("the wishes strip is in the section's flow",
    strip?.parentElement?.id, "guestbook");
  check("and not inside the book's fixed canvas",
    strip?.closest(".gb__stage, .gb__wrap") === null, true);
}

check("both names close the page", text(d, ".thanks__names"), `${W.groom.name} - ${W.bride.name}`);

// motion: nothing may be left invisible, and reduced motion turns it all off
const named = [...d.querySelectorAll("[data-anim]")];
// the old page left nothing inert: text grows a little under the pointer too
{
  const motion = fs.readFileSync(new URL("../css/motion.css", import.meta.url), "utf8");
  check("text has a hover scale", /:hover[\s\S]{0,400}?transform:\s*scale\(1\.03\)/.test(motion), true);
  check("and it is behind hover: hover", /@media \(hover: hover\)/.test(motion), true);
  check("the transition matches the old 150ms linear", /transition:\s*transform 150ms linear/.test(motion), true);
}

// a hover rule that names a class the page dropped does nothing and hides the loss
{
  const motion = fs.readFileSync(new URL("../css/motion.css", import.meta.url), "utf8");
  const named = [...motion.matchAll(/\.([a-z][\w-]*)(?=[\s,:{])/g)].map((m) => m[1]);
  const markup = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const dead = [...new Set(named)].filter((c) => !markup.includes(c) && !["petals", "petal", "is-in", "is-shown", "cover", "card", "btn"].includes(c));
  check("no hover rule names a class that is gone", dead, []);
}

check("every animated piece names an animation", named.filter((el) => !el.getAttribute("data-anim")).length, 0);
const css = fs.readFileSync(new URL("../css/motion.css", import.meta.url), "utf8");
check("every name used has a rule", [...new Set(named.map((el) => el.dataset.anim))]
  .filter((n) => !css.includes(`[data-anim="${n}"]`)), []);
check("every rule points at a keyframe", [...new Set(named.map((el) => el.dataset.anim))]
  .filter((n) => !new RegExp("@keyframes\\s+" + n + "\\b").test(css)), []);
check("the watcher brought them in", named.filter((el) => !el.classList.contains("is-in") && !el.classList.contains("is-shown")).length, 0);

// the floating controls: music on the left, two buttons and a list on the right
{
  check("music is one round note", !!d.querySelector("button.music .music__note"), true);
  check("two buttons on the right", d.querySelectorAll(".dock__btn").length, 2);
  check("each of the three carries an icon",
    [".music__note", "#to-top .dock__icon", "#menu-btn .dock__icon"]
      .filter((sel) => !d.querySelector(sel)), []);
  const menu = d.getElementById("menu");
  check("the list starts closed", menu.hidden, true);
  d.getElementById("menu-btn").dispatchEvent(new window.Event("click"));
  check("the button opens it", menu.hidden, false);
  // only the sections that opt in: the short ones in between are passed on the way down
  const listed = [...d.querySelectorAll("main > section[data-menu]")];
  check("one entry per section that opts in", d.querySelectorAll(".menu a").length, listed.length);
  check("and the short sections stay out",
    [...d.querySelectorAll(".menu a")].map((a) => a.getAttribute("href").slice(1)),
    ["couple", "invitation", "album", "guestbook", "rsvp"]);
  check("every entry points at a section on the page",
    [...d.querySelectorAll(".menu a")].filter((a) => !d.querySelector(a.getAttribute("href"))).length, 0);
  d.getElementById("menu-btn").dispatchEvent(new window.Event("click"));
  check("and closes again", menu.hidden, true);
}

// a rule set per card outranks the plain one, so a phone layout has to name them again
{
  const css = fs.readFileSync(new URL("../css/sections.css", import.meta.url), "utf8");
  const phone = [...css.matchAll(/@media \(max-width: 767px\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)]
    .map((m) => m[1]).join("\n");
  check("the phone layout unpins each ceremony card",
    [1, 2, 3].filter((n) => !new RegExp(`\\.ceremony:nth-child\\(${n}\\)`).test(phone)), []);
  // the couple section is a fixed canvas on a wide screen, so every piece it pins has
  // to be named again for the phone; a blanket child rule outranks them and will not do
  // the pieces inside a card are placed by percentage too, and wrap the same way
  check("the phone layout unpins the inside of a card",
    /\.ceremony\s*>\s*\*\s*\{[^}]*position:\s*static/.test(phone), true);
  check("and lets the card grow with its text",
    /\.ceremony\s*\{[^}]*aspect-ratio:\s*auto/.test(phone), true);
  check("and names every piece of the couple section",
    ["couple__mark", "couple__title", "couple__photo", "nameplate",
     "couple__parents", "couple__home", "couple__portrait"]
      .filter((c) => !phone.includes("." + c)), []);
}

// the page must work opened straight off the disk, where a browser refuses ES modules
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
check("no module script, which file:// would block", /type="module"/.test(html), false);
check("every script the page asks for exists",
  [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1])
    .filter((f) => !fs.existsSync(new URL("../" + f, import.meta.url))), []);

console.log(fail ? `\n${fail} failing` : "\nall good");
process.exit(fail ? 1 : 0);
