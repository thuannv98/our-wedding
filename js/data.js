/** The one place the rest of the code reads content from. */
(function (AK) {
  "use strict";

  const data = window.WEDDING || {};

  /** `get("groom.name")` -> the value, or undefined. Never throws on a missing branch. */
  function get(path) {
    return String(path).split(".").reduce((o, k) => (o == null ? o : o[k]), data);
  }

  /** A value counts as absent when it is missing or only whitespace. */
  function has(path) {
    const v = get(path);
    return v != null && String(v).trim() !== "";
  }

  AK.data = data;
  AK.get = get;
  AK.has = has;
})(window.AK = window.AK || {});
