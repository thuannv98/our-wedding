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
      node.querySelector(".note__by b").textContent = w.name || "Một người bạn";
      const rel = node.querySelector(".note__relation");
      if (w.relation) rel.textContent = ` · ${w.relation}`; else rel.remove();
      frag.append(node);
    }
    if (!frag.childElementCount) return;
    if (first) box.prepend(frag); else box.append(frag);
    if (outer) outer.hidden = false;
  }

  function loadWishes() {
    const endpoint = get("form.endpoint");
    if (!endpoint || typeof fetch !== "function") return;
    const url = endpoint + (endpoint.includes("?") ? "&" : "?") + "what=wishes";
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => addWishes(Array.isArray(list) ? list : []))
      .catch(() => { /* a guest should see the form, not a failure to load */ });
  }

  AK.setupForms = setupForms;
})(window.AK = window.AK || {});
