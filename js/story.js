/* The four pictures beside the story, in the order the data file lists them. */
(function (AK) {
  "use strict";

  var get = AK.get;

  function renderStory(root) {
    root = root || document;
    var list = root.querySelector('[data-list="story.photos"]');
    var tpl = root.getElementById("tpl-story-photo");
    if (!list || !tpl) return;
    var photos = (get("story.photos") || []).filter(Boolean);
    if (!photos.length) { list.remove(); return; }

    photos.forEach(function (src, i) {
      var node = tpl.content.firstElementChild.cloneNode(true);
      var img = node.querySelector("img");
      img.src = src;
      node.style.setProperty("--anim-delay", (i * 0.12) + "s");
      list.appendChild(node);
    });
  }

  AK.renderStory = renderStory;
})(window.AK = window.AK || {});
