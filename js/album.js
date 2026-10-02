(function (AK) {
  "use strict";

  var data = AK.data, get = AK.get;

  /** The album grid, and the lightbox it opens into. */
  function renderAlbum(root = document) {
    const list = root.querySelector('[data-list="album"]');
    const tpl = root.getElementById("tpl-album-item");
    const photos = (get("album") || []).filter(Boolean);
    if (!list || !tpl || !photos.length) { list?.closest(".section")?.remove(); return; }

    // the mosaic holds nine; the rest live in the lightbox behind the button

    photos.forEach((src, i) => {
      const node = tpl.content.firstElementChild.cloneNode(true);
      const img = node.querySelector("img");
      img.src = src;
      img.alt = `Ảnh cưới ${i + 1}`;
      node.querySelector("button").addEventListener("click", () => open(i));
      node.style.setProperty("--anim-delay", ((i % 6) * 0.08) + "s");
      list.append(node);
    });

    // the button opens the slideshow rather than unfolding more tiles, as it did before
    const more = root.querySelector(".album__more");
    if (more) more.addEventListener("click", () => open(0));

    const box = root.getElementById("lightbox");
    const img = box.querySelector(".lightbox__img");
    let at = 0;

    const show = (i) => {
      at = (i + photos.length) % photos.length;
      img.src = photos[at];
      img.alt = `Ảnh cưới ${at + 1} trên ${photos.length}`;
    };
    const open = (i) => { show(i); box.showModal(); };

    box.querySelector(".lightbox__close").addEventListener("click", () => box.close());
    box.querySelector(".lightbox__nav--prev").addEventListener("click", () => show(at - 1));
    box.querySelector(".lightbox__nav--next").addEventListener("click", () => show(at + 1));
    box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
    box.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(at - 1);
      if (e.key === "ArrowRight") show(at + 1);
    });
  }

  AK.renderAlbum = renderAlbum;
})(window.AK = window.AK || {});
