/* ============================================================================
 * VEILRUN — Shared 2D Pair-Level Engine (v2)
 * ----------------------------------------------------------------------------
 * Factored out of the five copy-pasted games/<name>/index.html prototypes so we
 * stop hand-editing shared input / physics / camera / leaderboard code in 5+
 * places. v1 games are unchanged and keep their inline copies; new v2 games load
 * this module and keep only their own level data, character kits, mechanics, and
 * rendering.
 *
 * Exposes a single global: window.VE = { Physics, Camera, Controller, Net, util }.
 * Engine constants match the shipped prototypes: TILE=40, COLS=24, ROWS=14.
 *
 * Behaviour is a faithful port of runeway v1's stepChar/resolveAxis/onGround,
 * camera math, and Supabase wiring — verified against that file — generalised so
 * per-game specifics (solidAt, movers, gameId, storage prefix) are injected.
 * ==========================================================================*/
(function (global) {
  "use strict";

  var TILE = 40, COLS = 24, ROWS = 14;

  /* ---- small shared utilities ------------------------------------------ */
  var util = {
    TILE: TILE, COLS: COLS, ROWS: ROWS,
    dist: function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); },
    clamp: function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; },
    esc: function (s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    },
    fmt: function (ms) {
      var s = ms / 1000, m = Math.floor(s / 60), r = s - m * 60;
      return m + ":" + (r < 10 ? "0" : "") + r.toFixed(1);
    },
    // Parse a 24x14 char map into a tile grid + tagged cells. `legend` maps a
    // character to a handler(x,y) that may record spawns/exits/etc.; anything
    // not solid ('#') and not in the legend becomes "empty".
    parseMap: function (rows, legend) {
      var base = [];
      for (var y = 0; y < ROWS; y++) {
        base[y] = [];
        var row = rows[y] || "";
        for (var x = 0; x < COLS; x++) {
          var ch = row[x] || " ";
          if (ch === "#") { base[y][x] = "solid"; }
          else { base[y][x] = "empty"; if (legend && legend[ch]) legend[ch](x, y); }
        }
      }
      return base;
    }
  };

  /* ======================================================================
   * VE.Physics — AABB tile collision, gravity, one-way movers.
   * Faithful port of runeway v1: gravity 0.55, fall cap 14. `solidAt(tx,ty)`
   * and the mover list are injected so the same physics serves any world /
   * any game (incl. per-character worlds for cross-world traversal).
   * ==================================================================== */
  var Physics = {
    create: function (opts) {
      opts = opts || {};
      var GRAV = opts.gravity != null ? opts.gravity : 0.55;
      var MAXFALL = opts.maxFall != null ? opts.maxFall : 14;

      function resolveAxis(o, axis, solidAt) {
        var x0 = Math.floor(o.x / TILE), x1 = Math.floor((o.x + o.w - 1) / TILE);
        var y0 = Math.floor(o.y / TILE), y1 = Math.floor((o.y + o.h - 1) / TILE);
        for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) {
          if (!solidAt(tx, ty)) continue;
          var px = tx * TILE, py = ty * TILE;
          if (!(o.x < px + TILE && o.x + o.w > px && o.y < py + TILE && o.y + o.h > py)) continue;
          if (axis === "x") { if (o.vx > 0) o.x = px - o.w; else if (o.vx < 0) o.x = px + TILE; o.vx = 0; }
          else { if (o.vy > 0) { o.y = py - o.h; o.vy = 0; } else if (o.vy < 0) { o.y = py + TILE; o.vy = 0; } }
        }
      }

      // One-way platforms: land only when falling onto the top edge.
      function landMover(o, movers) {
        if (!movers) return;
        for (var i = 0; i < movers.length; i++) {
          var m = movers[i];
          if (o.vy >= 0 && o.x + o.w > m.x + 3 && o.x < m.x + m.w - 3) {
            var top = m.y;
            if ((o.y + o.h) >= top && (o.y + o.h) <= top + 14 + o.vy) { o.y = top - o.h; o.vy = 0; }
          }
        }
      }

      function onGround(o, solidAt, movers) {
        var y = Math.floor((o.y + o.h + 1) / TILE);
        var x0 = Math.floor((o.x + 3) / TILE), x1 = Math.floor((o.x + o.w - 3) / TILE);
        for (var tx = x0; tx <= x1; tx++) if (solidAt(tx, y)) return true;
        if (movers) for (var i = 0; i < movers.length; i++) {
          var m = movers[i];
          if (o.x + o.w > m.x + 3 && o.x < m.x + m.w - 3 && Math.abs((o.y + o.h) - m.y) < 4) return true;
        }
        return false;
      }

      // Integrate one character for a frame. `world` = { solidAt, movers, floorY }.
      // Returns true if the character fell off the bottom of the world.
      function step(o, world) {
        var solidAt = world.solidAt, movers = world.movers;
        o.x += o.vx; resolveAxis(o, "x", solidAt);
        o.vy += GRAV; if (o.vy > MAXFALL) o.vy = MAXFALL;
        o.y += o.vy; resolveAxis(o, "y", solidAt); landMover(o, movers);
        var floor = world.floorY != null ? world.floorY : (ROWS * TILE + 60);
        return o.y > floor;
      }

      return {
        step: step,
        onGround: function (o, world) { return onGround(o, world.solidAt, world.movers); },
        resolveAxis: resolveAxis,
        gravity: GRAV, maxFall: MAXFALL
      };
    }
  };

  /* ======================================================================
   * VE.Camera — mobile = zoom+follow active char; desktop (aspect>=1.4) =
   * whole-map. Map-toggle button. Faithful port of runeway v1 camera.
   * ==================================================================== */
  var Camera = {
    create: function (cfg) {
      var cv = cfg.canvas, stage = cfg.stage;
      var worldW = cfg.worldW != null ? cfg.worldW : COLS * TILE;
      var worldH = cfg.worldH != null ? cfg.worldH : ROWS * TILE;
      var state = { dpr: 1, zoom: 1, followCam: false, cam: { x: 0, y: 0 }, mapMode: false };

      function resize() {
        state.dpr = Math.min(global.devicePixelRatio || 1, 2);
        var cw = Math.max(1, stage.clientWidth), ch = Math.max(1, stage.clientHeight);
        cv.width = Math.round(cw * state.dpr); cv.height = Math.round(ch * state.dpr);
        var aspect = cw / ch;
        if (state.mapMode || aspect >= 1.4) {
          state.zoom = Math.min(cv.width / worldW, cv.height / worldH); state.followCam = false;
        } else {
          var tilesX = Math.max(6, Math.min(11, Math.round(aspect * 15)));
          state.zoom = cv.width / (tilesX * TILE); state.followCam = true;
        }
      }

      function update(target, snap) {
        var viewW = cv.width / state.zoom, viewH = cv.height / state.zoom, tx, ty;
        if (state.followCam && target) { tx = target.x + target.w / 2 - viewW / 2; ty = target.y + target.h / 2 - viewH / 2; }
        else { tx = (worldW - viewW) / 2; ty = (worldH - viewH) / 2; }
        tx = viewW < worldW ? util.clamp(tx, 0, worldW - viewW) : (worldW - viewW) / 2;
        ty = viewH < worldH ? util.clamp(ty, 0, worldH - viewH) : (worldH - viewH) / 2;
        if (snap) { state.cam.x = tx; state.cam.y = ty; return; }
        state.cam.x += (tx - state.cam.x) * 0.2; state.cam.y += (ty - state.cam.y) * 0.2;
        if (Math.abs(tx - state.cam.x) < 0.4) state.cam.x = tx;
        if (Math.abs(ty - state.cam.y) < 0.4) state.cam.y = ty;
      }

      function apply(ctx) { ctx.setTransform(state.zoom, 0, 0, state.zoom, -state.cam.x * state.zoom, -state.cam.y * state.zoom); }
      function toggleMap() { state.mapMode = !state.mapMode; resize(); }

      return {
        resize: resize, update: update, apply: apply, toggleMap: toggleMap, state: state,
        get zoom() { return state.zoom; }, get cam() { return state.cam; },
        get mapMode() { return state.mapMode; }, get followCam() { return state.followCam; }
      };
    }
  };

  /* ======================================================================
   * VE.Controller — the v2 two-row / 5-button controller + left stick.
   *   Stick:  Left/Right = move · Up = Jump · Down = reserved (unbound)
   *   Right:  [Primary][Secondary][Signature]  (big row, relabel per char)
   *           [Interact][Switch]               (small row)
   *   Keyboard: A/D or arrows = move · W/Up = jump · S/Down = reserved
   *             J/K/L = Primary/Secondary/Signature · E = Interact
   *             Tab = Switch · R = reset
   * Injects its own scoped CSS (.ve-*) so any game gets the controller for free.
   * Data-driven: each character declares slot labels; empty labels dim the slot.
   * ==================================================================== */
  var Controller = (function () {
    var CSS = [
      "#ve-pad{flex:0 0 auto;width:100%;display:flex;justify-content:space-between;align-items:center;",
      "gap:10px;padding:8px 10px calc(8px + env(safe-area-inset-bottom));user-select:none;",
      "background:rgba(8,6,15,.55);border-top:1px solid var(--line,#3C345C);touch-action:none;box-sizing:border-box;}",
      /* ---- left analog joystick (circle-in-circle) ---- */
      "#ve-pad .ve-stick{position:relative;flex:0 0 auto;width:clamp(92px,30vw,132px);aspect-ratio:1/1;border-radius:50%;",
      "background:radial-gradient(circle at 50% 42%,rgba(42,36,66,.92),rgba(15,12,28,.92));",
      "border:1px solid var(--line,#3C345C);touch-action:none;}",
      "#ve-pad .ve-stick .ve-arrow{position:absolute;color:#8f89a8;font-size:13px;line-height:1;pointer-events:none;}",
      "#ve-pad .ve-stick .ve-up{top:7px;left:50%;transform:translateX(-50%);}",
      "#ve-pad .ve-stick .ve-down{bottom:7px;left:50%;transform:translateX(-50%);opacity:.35;}",
      "#ve-pad .ve-stick .ve-left{left:8px;top:50%;transform:translateY(-50%);}",
      "#ve-pad .ve-stick .ve-right{right:8px;top:50%;transform:translateY(-50%);}",
      "#ve-pad .ve-stick .ve-knob{position:absolute;left:50%;top:50%;width:44%;height:44%;margin:-22% 0 0 -22%;border-radius:50%;",
      "background:rgba(120,200,210,.26);border:1px solid rgba(150,220,230,.75);transition:transform .04s linear;pointer-events:none;}",
      "#ve-pad .ve-stick.ve-active{border-color:rgba(150,220,230,.7);}",
      "#ve-pad .ve-stick.ve-active .ve-knob{background:rgba(120,200,210,.5);}",
      /* ---- right 6-button grid (3x2) ---- */
      "#ve-pad .ve-grid{flex:1 1 auto;min-width:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:1fr;gap:6px;max-width:360px;}",
      "#ve-pad .ve-btn{border-radius:12px;background:rgba(30,26,52,.85);border:1px solid var(--line,#3C345C);color:#fff;",
      "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:clamp(44px,10vw,58px);",
      "touch-action:none;text-align:center;line-height:1.05;font-family:inherit;overflow:hidden;}",
      "#ve-pad .ve-btn:active{background:rgba(90,200,200,.5);}",
      "#ve-pad .ve-btn .ico{font-size:clamp(15px,4.4vw,19px);line-height:1;}",
      "#ve-pad .ve-btn .lbl{font-size:clamp(8px,2.6vw,10px);line-height:1.05;color:#cfc9e6;max-width:96%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
      "#ve-pad .ve-btn.ve-unbound{opacity:.42;border-style:dashed;}",
      "#ve-pad .ve-btn.ve-sys{background:rgba(22,18,38,.92);}",
      "@media (hover:hover) and (pointer:fine){#ve-pad{display:none;}}"
    ].join("");

    function injectCSS() {
      if (document.getElementById("ve-pad-css")) return;
      var s = document.createElement("style"); s.id = "ve-pad-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }

    function bindPress(el, fn) {
      if (!el) return;
      var down = function (e) { e.preventDefault(); fn(); };
      el.addEventListener("touchstart", down, { passive: false });
      el.addEventListener("mousedown", down);
    }

    // opts: { mount, chars:{key:{name,labels:{primary,secondary,signature,interact}}},
    //         activeKey, on:{move,jump,primary,secondary,signature,interact,switch,reset},
    //         isPlay:()=>bool, onStart:()=>void }
    function mount(opts) {
      injectCSS();
      var held = { left: false, right: false, up: false, down: false };
      var on = opts.on || {};
      var isPlay = opts.isPlay || function () { return true; };
      var pad = opts.mount;
      pad.id = "ve-pad";
      pad.innerHTML =
        '<div class="ve-stick" id="ve-stick">' +
        '  <span class="ve-arrow ve-up">▲</span>' +
        '  <span class="ve-arrow ve-right">▶</span>' +
        '  <span class="ve-arrow ve-down">▼</span>' +
        '  <span class="ve-arrow ve-left">◀</span>' +
        '  <div class="ve-knob" id="ve-knob"></div>' +
        '</div>' +
        '<div class="ve-grid">' +
        '  <div class="ve-btn" data-k="primary"><span class="ico">✦</span><span class="lbl" data-lbl="primary">Primary</span></div>' +
        '  <div class="ve-btn" data-k="secondary"><span class="ico">◈</span><span class="lbl" data-lbl="secondary">Secondary</span></div>' +
        '  <div class="ve-btn" data-k="signature"><span class="ico">★</span><span class="lbl" data-lbl="signature">Signature</span></div>' +
        '  <div class="ve-btn" data-k="interact"><span class="ico">⊹</span><span class="lbl" data-lbl="interact">Interact</span></div>' +
        '  <div class="ve-btn ve-sys" data-k="switch"><span class="ico">⇄</span><span class="lbl">Switch</span></div>' +
        '  <div class="ve-btn ve-sys" data-k="reset"><span class="ico">↻</span><span class="lbl">Reset</span></div>' +
        '</div>';

      var curKey = opts.activeKey;
      var KIT = ["primary", "secondary", "signature", "interact"];
      function slotEmpty(slot) { var c = opts.chars[curKey]; return !(c && c.labels && c.labels[slot]); }
      // Fire a kit/interact slot. An unbound slot surfaces a feedback hook instead of an action.
      function triggerSlot(slot) {
        if (!isPlay()) return;
        if (KIT.indexOf(slot) >= 0 && slotEmpty(slot)) { if (on.unbound) on.unbound(slot); return; }
        if (on[slot]) on[slot]();
      }
      function sys(k) { if (!isPlay()) return; if (k === "switch" && on.switch) on.switch(); else if (k === "reset" && on.reset) on.reset(); }

      // Right 6-button grid
      pad.querySelectorAll(".ve-grid .ve-btn").forEach(function (btn) {
        var k = btn.getAttribute("data-k");
        var down = function (e) {
          e.preventDefault(); opts.onStart && opts.onStart();
          if (k === "switch" || k === "reset") sys(k); else triggerSlot(k);
        };
        btn.addEventListener("touchstart", down, { passive: false });
        btn.addEventListener("mousedown", down);
      });

      // Left analog stick: drag OR tap a direction. Up = jump (edge-triggered); Down = reserved.
      var stick = pad.querySelector("#ve-stick"), knob = pad.querySelector("#ve-knob");
      var activePtr = null;
      function centerKnob() { knob.style.transform = "translate(0px,0px)"; }
      function clearDir() { held.left = held.right = held.up = held.down = false; centerKnob(); stick.classList.remove("ve-active"); }
      function applyStick(cx, cy) {
        var r = stick.getBoundingClientRect(), R = r.width / 2;
        var dx = cx - (r.left + R), dy = cy - (r.top + R), dead = R * 0.30;
        held.left = dx < -dead; held.right = dx > dead;
        var upNow = dy < -dead;
        if (upNow && !held.up) { held.up = true; if (isPlay() && on.jump) on.jump(); }
        if (!upNow) held.up = false;
        held.down = dy > dead; // reserved — no bound action this build
        var mag = Math.min(1, Math.hypot(dx, dy) / R), ang = Math.atan2(dy, dx);
        knob.style.transform = "translate(" + (Math.cos(ang) * mag * R * 0.5) + "px," + (Math.sin(ang) * mag * R * 0.5) + "px)";
      }
      stick.addEventListener("pointerdown", function (e) {
        e.preventDefault(); activePtr = e.pointerId;
        try { stick.setPointerCapture(e.pointerId); } catch (_) {}
        stick.classList.add("ve-active"); opts.onStart && opts.onStart(); applyStick(e.clientX, e.clientY);
      });
      stick.addEventListener("pointermove", function (e) { if (e.pointerId !== activePtr) return; e.preventDefault(); applyStick(e.clientX, e.clientY); });
      var endPtr = function (e) { if (e.pointerId !== activePtr) return; activePtr = null; clearDir(); };
      stick.addEventListener("pointerup", endPtr);
      stick.addEventListener("pointercancel", endPtr);
      stick.addEventListener("lostpointercapture", function () { if (activePtr != null) { activePtr = null; clearDir(); } });

      // Keyboard — two-handed desktop layout: RIGHT hand on the arrow keys (move + jump),
      // LEFT hand on a QWE/ASD block that mirrors the on-screen 6-button grid:
      //   Q W E = Primary / Secondary / Signature   ·   A S D = Interact / Switch / Reset
      // Tab (switch) and R (reset) kept as aliases. (Down arrow = reserved.)
      function kd(e) {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].indexOf(e.key) >= 0) e.preventDefault();
        if (!isPlay()) { if ((e.key === "Enter" || e.key === " ") && opts.onStart) opts.onStart(); return; }
        var k = e.key.toLowerCase(); opts.onStart && opts.onStart();
        if (k === "arrowleft") held.left = true;
        else if (k === "arrowright") held.right = true;
        else if (k === "arrowup") { if (!held.up) { held.up = true; if (on.jump) on.jump(); } }
        else if (k === "arrowdown") held.down = true;
        else if (k === "q") triggerSlot("primary");
        else if (k === "w") triggerSlot("secondary");
        else if (k === "e") triggerSlot("signature");
        else if (k === "a") triggerSlot("interact");
        else if (k === "s") sys("switch");
        else if (k === "d" || k === "r") sys("reset");
        else if (k === "tab" || k === "shift") { e.preventDefault(); sys("switch"); }
      }
      function ku(e) {
        var k = e.key.toLowerCase();
        if (k === "arrowleft") held.left = false;
        else if (k === "arrowright") held.right = false;
        else if (k === "arrowup") held.up = false;
        else if (k === "arrowdown") held.down = false;
      }
      document.addEventListener("keydown", kd);
      document.addEventListener("keyup", ku);

      // Relabel kit slots for the active character; empty slots render as unbound feedback hooks.
      function setLabels(key) {
        curKey = key; var c = opts.chars[key]; if (!c) return; var lbls = c.labels || {};
        KIT.forEach(function (slot) {
          var el = pad.querySelector('.ve-btn[data-k="' + slot + '"]');
          var txt = pad.querySelector('[data-lbl="' + slot + '"]');
          var name = lbls[slot];
          if (txt) txt.textContent = name || "—";
          if (el) el.classList.toggle("ve-unbound", !name);
        });
      }
      if (opts.activeKey) setLabels(opts.activeKey);

      return { held: held, setLabels: setLabels, el: pad };
    }

    return { mount: mount };
  })();

  /* ======================================================================
   * VE.Net — Supabase best-time leaderboard + points. Reuses the shared
   * game_scores / game_points tables (no per-game SQL). Anon publishable key
   * only. Faithful port of runeway v1 wiring, parameterised by gameId +
   * localStorage prefix so each game keeps its own boards + keys.
   * ==================================================================== */
  var Net = {
    create: function (cfg) {
      var URL = cfg.url, KEY = cfg.key, prefix = cfg.prefix || "vr_";
      var gameId = typeof cfg.gameId === "function" ? cfg.gameId : function () { return cfg.gameId; };
      var who = cfg.who || function () { return localStorage.getItem("vr_who") || localStorage.getItem("vr_account") || "anon"; };

      function post(path, body) {
        return fetch(URL + path, {
          method: "POST",
          headers: { apikey: KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify(body)
        }).catch(function () {});
      }
      return {
        who: who,
        gameId: gameId,
        levelDone: function (id) { return localStorage.getItem(prefix + "done_" + id) === "1"; },
        markDone: function (id) { localStorage.setItem(prefix + "done_" + id, "1"); },
        localBest: function () { var v = +localStorage.getItem(prefix + "best_" + gameId()); return v > 0 ? v : null; },
        setLocalBest: function (ms) { var b = this.localBest(); if (b == null || ms < b) localStorage.setItem(prefix + "best_" + gameId(), String(Math.round(ms))); },
        // Award the one-time "try" point per level id.
        tryOnce: function (id) {
          if (!localStorage.getItem(prefix + "trypts_" + id)) { localStorage.setItem(prefix + "trypts_" + id, "1"); this.awardPoints("try", 2, id); }
        },
        clearOnce: function (id) {
          if (!localStorage.getItem(prefix + "clearpts_" + id)) { localStorage.setItem(prefix + "clearpts_" + id, "1"); this.awardPoints("clear", 10, id); return true; }
          return false;
        },
        awardPoints: function (event, pts, meta) { return post("/rest/v1/game_points", { who: who(), event: event, points: pts, meta: meta || "" }); },
        saveScore: function (ms) { return post("/rest/v1/game_scores", { who: who(), game_id: gameId(), time_ms: Math.round(ms) }); },
        loadBoard: function () {
          return fetch(URL + "/rest/v1/game_scores?game_id=eq." + gameId() + "&select=who,time_ms", { headers: { apikey: KEY } })
            .then(function (r) { return r.json(); })
            .then(function (rows) {
              if (!Array.isArray(rows)) return null;
              var best = {};
              rows.forEach(function (x) { if (best[x.who] == null || x.time_ms < best[x.who]) best[x.who] = x.time_ms; });
              return Object.keys(best).map(function (w) { return { who: w, ms: best[w] }; }).sort(function (a, b) { return a.ms - b.ms; });
            })
            .catch(function () { return null; });
        }
      };
    }
  };

  global.VE = { Physics: Physics, Camera: Camera, Controller: Controller, Net: Net, util: util };
})(typeof window !== "undefined" ? window : this);
