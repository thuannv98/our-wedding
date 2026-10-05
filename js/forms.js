(function (AK) {
  "use strict";

  var get = AK.get, toast = AK.toast;

  /**
   * The two forms, and the wishes read back from the sheet.
   *
   * The endpoint accepts writes and returns only the wishes; the RSVP answers are never
   * readable from the page, because anything this page can fetch, any visitor can fetch.
   */

  function send(kind, fields) {
    const endpoint = get("form.endpoint");
    if (!endpoint || typeof fetch !== "function") return;
    const body = new URLSearchParams({ kind, secret: get("form.secret") || "", ...fields });
    try {
      // Apps Script sends no CORS headers on the write path, so the reply is unreadable
      // by design; the row still lands and the page shows its own confirmation.
      fetch(endpoint, { method: "POST", mode: "no-cors", body });
    } catch { /* the thank-you still stands */ }
  }

  /** Swaps a form for its thank-you line. */
  function complete(form, name) {
    const done = form.querySelector(".form__done");
    if (!done) return;
    done.querySelector("b").textContent = name;
    form.querySelectorAll(":scope > :not(.form__done)").forEach((el) => { el.hidden = true; });
    done.hidden = false;
  }

  function fieldsOf(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function setupForms(root = document) {
    const rsvp = root.getElementById("rsvp-form");
    if (rsvp) {
      rsvp.addEventListener("submit", (e) => {
        e.preventDefault();
        const f = fieldsOf(rsvp);
        if (!String(f.name || "").trim()) {
        toast("Bạn cho tụi mình xin cái tên nhé");
        rsvp.querySelector("#rsvp-name").focus();
        return;
      }
        send("rsvp", f);
        complete(rsvp, f.name.trim());
      });
    }

    const wish = root.getElementById("wish-form");
    if (!wish) return;

    const relations = root.getElementById("wish-relation");
    for (const r of get("wishRelations") || []) {
      relations.append(new Option(r, r));
    }

    const text = root.getElementById("wish-text");
    const pick = root.getElementById("wish-pick");
    for (const s of get("wishSuggestions") || []) {
      pick.append(new Option(s.length > 46 ? s.slice(0, 46) + "…" : s, s));
    }
    pick.addEventListener("change", () => {
      if (!pick.value) return;
      text.value = pick.value;
      pick.selectedIndex = 0;
      text.focus();
    });

    wish.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = fieldsOf(wish);
      if (!String(f.name || "").trim()) {
        toast("Bạn cho tụi mình xin cái tên nhé");
        root.getElementById("wish-name").focus();
        return;
      }
      if (!String(f.wish || "").trim()) {
        toast("Viết cho hai đứa đôi dòng nhé");
        text.focus();
        return;
      }
      send("wish", f);
      if (String(f.wish || "").trim()) {
        addWishes([{ name: f.name.trim(), relation: f.relation, wish: f.wish.trim() }], true);
      }
      complete(wish, f.name.trim());
      setTimeout(() => AK.askForWishes?.(), 4000);
    });

    loadWishes();
  }

  function addWishes(list, first = false) {
    const box = document.getElementById("wishes");
    const outer = document.getElementById("wishes-box");
    const tpl = document.getElementById("tpl-wish");
    if (!box || !tpl || !list?.length) return;
    const frag = document.createDocumentFragment();
    for (const w of list) {
      if (!w?.wish) continue;
      const node = tpl.content.firstElementChild.cloneNode(true);
      node.querySelector(".note__text").textContent = w.wish;
      node.querySelector(".note__by").textContent = w.name || "Một người bạn";
      node.querySelector(".note__open")?.addEventListener("click", () => AK.openWish?.(w));
      frag.append(node);
    }
    if (!frag.childElementCount) return;
    if (first) box.prepend(frag); else box.append(frag);
    if (outer) outer.hidden = false;
    if (AK.runCredits) AK.runCredits(box);
  }

  // Apps Script answers in a second or two warm and a good deal longer cold, which is a
  // long time to look at a page with no wishes on it. What came back last time is kept
  // here and shown at once, then replaced the moment the real answer lands.
  const KEPT = "ak:wishes";

  // Nothing can push a new wish to a page that is already open: Apps Script has no way to
  // call out, and a page served as files has nothing listening. So the page asks, and it
  // asks only while someone is in front of the guest book with the tab in view. Left to
  // run in a forgotten tab this would knock on Google's door every minute until the
  // battery went flat.
  const EVERY = 45000;

  let shown = [];       // what the page is drawing now
  let asking = false;
  let asked = 0;

  function remember(list) {
    try { localStorage.setItem(KEPT, JSON.stringify(list)); } catch { /* private window */ }
  }
  function recall() {
    try {
      const kept = JSON.parse(localStorage.getItem(KEPT) || "[]");
      return Array.isArray(kept) ? kept : [];
    } catch { return []; }
  }

  function showWishes(list) {
    shown = list;
    const box = document.getElementById("wishes");
    if (box) box.replaceChildren();
    addWishes(list);
    if (AK.startWishToasts) AK.startWishToasts(list);
  }

  function ask() {
    const endpoint = get("form.endpoint");
    if (!endpoint || typeof fetch !== "function" || asking) return Promise.resolve();
    asking = true;
    asked = Date.now();
    const url = endpoint + (endpoint.includes("?") ? "&" : "?") + "what=wishes";
    return fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => {
        if (!Array.isArray(list)) return;
        remember(list);
        // redrawing starts the roll over, so it happens only when there is something new
        if (JSON.stringify(list) !== JSON.stringify(shown)) showWishes(list);
      })
      .catch(() => { /* a guest should see the form, not a failure to load */ })
      .finally(() => { asking = false; });
  }

  function watchWishes() {
    let timer = null;
    let near = false;

    const due = () => Date.now() - asked >= EVERY;
    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => {
      if (timer || !near || document.hidden) return;
      if (due()) ask();
      timer = setInterval(() => { if (!document.hidden) ask(); }, EVERY);
    };

    const book = document.getElementById("guestbook");
    if (typeof IntersectionObserver === "function" && book) {
      new IntersectionObserver((entries) => {
        near = entries[0].isIntersecting;
        if (near) start(); else stop();
      }, { threshold: 0.1 }).observe(book);
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop(); else start();
    });

    AK.askForWishes = ask;      // so a guest who has just written one sees the rest too
  }

  function loadWishes() {
    const kept = recall();
    if (kept.length) showWishes(kept);
    ask();
    watchWishes();
  }

  AK.setupForms = setupForms;
})(window.AK = window.AK || {});
