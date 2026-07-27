/* VEILRUN — Pair Level version manifest (newest first).
   Every version of the game loads this and renders a dropdown from it, so the list
   stays consistent everywhere. To add a new edition: snapshot the current build into
   versions/<id>/, then add ONE line at the top of this array. */
window.VR_VERSIONS = [
  { id: "v0.2", name: "Seam Gate",    url: "/games/pair-level/index.html" },
  { id: "v0.1", name: "Foundry Gate", url: "/games/pair-level/versions/v0.1/index.html" }
];
(function () {
  var el = document.getElementById("verpick");
  if (!el || !window.VR_VERSIONS) return;
  var cur = el.getAttribute("data-cur") || "";
  var opts = window.VR_VERSIONS.map(function (v, i) {
    var label = v.id + " · " + v.name + (i === 0 ? " (latest)" : "");
    return '<option value="' + v.url + '"' + (v.id === cur ? " selected" : "") + ">" + label + "</option>";
  }).join("");
  el.innerHTML = '<label style="font-size:11px;color:#8f89a8">Version&nbsp;'
    + '<select onchange="if(this.value)location.href=this.value" '
    + 'style="background:#161022;color:#cfc9e6;border:1px solid #2a2740;border-radius:6px;padding:4px 8px;font-size:12px">'
    + opts + "</select></label>";
})();
