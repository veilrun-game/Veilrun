var fs=require("fs"),path=require("path"),vm=require("vm");
var ROOT=__dirname;
function stubEl(){return{innerHTML:"",textContent:"",value:"",style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},querySelector(){return stubEl()},querySelectorAll(){return[]},addEventListener(){},appendChild(){},remove(){},options:[],add(){},focus(){},dataset:{},hidden:false,attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]??null},removeAttribute(k){delete this.attrs[k]}}}
var els={},ctx=vm.createContext({});ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};
ctx.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=String(v)},removeItem(k){delete this._d[k]}};
ctx.sessionStorage=ctx.localStorage;ctx.matchMedia=()=>({matches:false,addEventListener(){}});
ctx.location={hash:"#reference"};
ctx.document={getElementById:id=>els[id]||(els[id]=stubEl()),querySelector:()=>stubEl(),querySelectorAll:()=>[],addEventListener(){},createElement:()=>stubEl(),body:stubEl()};
ctx.VBackend=null;
["js/data.js","js/galleries.js","js/media.js","js/board.js","js/components.js","js/app.js"].forEach(f=>vm.runInContext(fs.readFileSync(path.join(ROOT,f),"utf8"),ctx,{filename:f}));
var A=ctx.VApp,D=ctx.VEILRUN;
function n(who,slug,l,g,t,gt){return{slug,who,loves:l,gripes:g,tags:t||[],gripe_tags:gt||[],raw_name:"",created_at:"2026-08-16",updated_at:"2026-08-16"}}
var demo=[
 ["helldivers2",[n("Todd","helldivers2","the drop-in drop-out — you can join a squad mid-drop and it never feels like you interrupted","the grind between missions",["multiplayer / playing with friends"],["grindy"]),n("Jordan","helldivers2","friendly fire being permanent","menus, so many menus",["multiplayer / playing with friends"],["grindy","clunky menus & controls"]),n("Ali","helldivers2","you feel strong without ever feeling safe","the same three mission types",["multiplayer / playing with friends"],["grindy"]),n("Mike","helldivers2","calling in a strike on your own squad","load times",["the movement"],["grindy"])]],
 ["seaofthieves",[n("Naz","seaofthieves","everyone has a job and the ship falls apart if one of you stops","griefers",["shared roles"],["toxic players"]),n("Ramon","seaofthieves","sailing at night with nobody talking","the sail-for-20-minutes-then-lose-it loop",["shared roles"],["punishing"]),n("Julian","seaofthieves","patching holes while someone else steers","",["shared roles"],[])]],
 ["eldenring",[n("Zach","eldenring","the world does not explain itself to you","bosses that read your inputs",[],["punishing"])]],
 ["spellbreak",[n("Todd","spellbreak","the gauntlet combos","nobody left to play it with",[],[])]],
 ["mariokart",[n("Wren","mariokart","blue shells are funny when they hit someone else","blue shells",[],[])]]
];
var cards=demo.map(([s,ns])=>A.__grefCard(s,ns,[])).join("\n");
var css=["css/tokens.css","css/base.css","css/gameref.css"].map(f=>fs.readFileSync(path.join(ROOT,f),"utf8")).join("\n");
fs.writeFileSync("/tmp/gref-preview.html",`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600&family=Inter:wght@400;600&display=swap">
<style>${css}
body{padding:2rem 0} .wrap{max-width:900px;margin:0 auto;padding:0 1rem}
.pv-note{font-size:.8rem;opacity:.6;margin:0 0 1rem}</style></head>
<body><div class="wrap"><p class="pv-note">VR-109 preview — static render of the real grefCardHtml() against the real CSS. Click a row to expand.</p>
<div class="gr-list">${cards}</div></div>
<script>
var VApp={grefToggle:function(s){var c=document.getElementById("grcard-"+s),d=document.getElementById("grdetail-"+s);if(!c||!d)return;var o=d.hidden;d.hidden=!o;c.classList.toggle("open",o);c.querySelector(".gr-summary").setAttribute("aria-expanded",String(o));},
grefArtFail:function(i){var n=i.getAttribute("data-next");if(n){i.removeAttribute("data-next");i.src=n;return;}i.remove();},grefMore:function(id,b){document.getElementById(id).classList.remove("gr-hidden");b.remove();},grefOpen:function(){}};
</script></body></html>`);
console.log("wrote /tmp/gref-preview.html");
