/* VEILRUN — Runeway version manifest (default first).
   Every Runeway build loads this and renders a dropdown from it, so the list stays
   consistent everywhere. The Lab's Magpie+Babel tile opens the DEFAULT (first) entry;
   other builds are reachable from this in-game Version dropdown.
   v2 was promoted to default on 9/24 (VR-215): top of this array AND versions[0]
   in js/data.js. Same pattern as pair-level/versions.js. */
window.VR_VERSIONS = [
  { id: "v2", name: "Cross the Seam",           url: "/games/runeway-v2/index.html" },   // VR-215 — default since 9/24
  { id: "v1", name: "Runeway (4 levels)",       url: "/games/runeway/index.html" }
];
(function () {
  var el = document.getElementById("verpick");
  if (!el || !window.VR_VERSIONS || window.VR_VERSIONS.length < 2) return; // hide until there's more than one
  var cur = el.getAttribute("data-cur") || "";
  var opts = window.VR_VERSIONS.map(function (v) {
    return '<option value="' + v.url + '"' + (v.id === cur ? " selected" : "") + ">" + v.id + " · " + v.name + "</option>";
  }).join("");
  el.innerHTML = '<label style="font-size:13px;color:#9b95b4;display:inline-flex;align-items:center;gap:8px">Version'
    + '<select onchange="if(this.value)location.href=this.value" '
    + 'style="background:#161022;color:#e8e4f5;border:1px solid #3a3556;border-radius:10px;padding:11px 14px;font-size:15px;min-height:44px">'
    + opts + "</select></label>";
})();
