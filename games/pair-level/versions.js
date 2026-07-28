/* VEILRUN — Pair Level version manifest (newest / default first).
   Every version of the game loads this and renders a dropdown from it, so the list
   stays consistent everywhere. To add a new edition: snapshot the current build into
   versions/<id>/, then add ONE line at the top of this array. */
window.VR_VERSIONS = [
  { id: "v1", name: "Seam Gate",    url: "/games/pair-level/index.html" },
  { id: "v0", name: "Foundry Gate", url: "/games/pair-level/versions/v0/index.html" }
];
(function () {
  var el = document.getElementById("verpick");
  if (!el || !window.VR_VERSIONS || window.VR_VERSIONS.length < 2) return; // hide the picker until there's more than one
  var cur = el.getAttribute("data-cur") || "";
  var opts = window.VR_VERSIONS.map(function (v) {
    return '<option value="' + v.url + '"' + (v.id === cur ? " selected" : "") + ">" + v.id + " · " + v.name + "</option>";
  }).join("");
  el.innerHTML = '<label style="font-size:13px;color:#9b95b4;display:inline-flex;align-items:center;gap:8px">Version'
    + '<select onchange="if(this.value)location.href=this.value" '
    + 'style="background:#161022;color:#e8e4f5;border:1px solid #3a3556;border-radius:10px;padding:11px 14px;font-size:15px;min-height:44px">'
    + opts + "</select></label>";
})();
