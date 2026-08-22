# VEILRUN — VR-91 · weld Mixamo clips into one game-ready GLB.
#
# Mixamo gives you one FBX per animation, each with its own armature. The game
# wants ONE file with one skeleton and five named clips. This does that.
#
# HOW TO RUN:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python <this file>
#
# PUT THE DOWNLOADS HERE (any filename — matched on keywords):
#   Art & Assets/assets/vesper_canon_v2/mixamo/
#     something-with-"idle"      .fbx   <- ONE of them must be the WITH-SKIN download
#     something-with-"walk"      .fbx
#     something-with-"slash"     .fbx
#     something-with-"hit"       .fbx
#     something-with-"dying"     .fbx
#
# OUTPUT: assets/models/vesper.glb  — exactly where the game already looks.
#
# Two Mixamo gotchas this handles for you:
#   * Mixamo exports at ~100x scale (centimetres). Rescaled back to worldHeight.
#   * Root motion is DETECTED and stripped, so you don't have to remember the
#     "In Place" checkbox. Travel channels drift end-to-end; bob and sway come
#     back to where they started. Only the drifters are removed.
#   * Clips are exported as NLA strips, which is how the glTF exporter emits
#     multiple named animations rather than one merged blob.

import bpy, os, math, glob

# ---------------------------------------------------------------------------
# PER-CHARACTER PROFILES (VR-117, 8/22)
#
# Was: one hard-coded SRC_DIR/OUT_GLB pair for Vesper. The husk merge needs a
# second run over a different folder with a different clip table, and copying
# the script to do it is how two pipelines drift apart. So the character is a
# parameter now, and Vesper's profile is byte-for-byte what the script did
# before — a re-run of `vesper` must produce the same GLB it always did.
#
#   blender --background --python veilrun_merge_anims.py -- --char husk
#   VEILRUN_CHAR=husk  (env, for a headless bpy-as-a-module run)
#
# VEILRUN_SRC / VEILRUN_OUT override the paths for a run somewhere that isn't
# Jordan's Mac. Nothing else in the profile can be overridden — the clip table
# is the contract, not a convenience.
# ---------------------------------------------------------------------------
import sys

CA = "/Users/jordankersey/Desktop/Claude Access/Games/Veilrun/Art & Assets/assets"
REPO = "/Users/jordankersey/Documents/GitHub/Veilrun"

# (game clip name, filename keywords, keywords that DISQUALIFY a file, strip root motion?)
#
# STRIP ROOT MOTION only on LOOPING clips. A walk that travels slides you away
# from where the game thinks you are, every cycle, forever — that's the bug.
# A death is a ONE-SHOT: it is *supposed* to travel, because falling over is
# travel, and the drift-detection heuristic cannot tell "walks away" from
# "collapses". Stripping it made Vesper die standing up.
# The exclusions matter: "Walking Turn 180" contains "walk" and would happily
# steal the move slot from the actual walk cycle.
VESPER_WANT = [
    ("idle",    ["idle", "breath"],                    [],              True),
    ("move",    ["walk"],                              ["turn","back"], True),
    ("run",     ["run", "jog", "sprint"],              [],              True),
    ("stalk",   ["sneak", "crouch", "stalk", "creep"], [],              True),
    ("attack",  ["slash", "attack", "stab", "sword"],  ["assassin"],    True),
    ("execute", ["assassin", "execute", "finisher"],   [],              True),
    ("hurt",    ["hit", "impact", "react"],            [],              True),
    # VR-117: "fall" also matches "Falling", which is an ENTRANCE clip, not a
    # death. Before this exclusion a folder containing both would hand the death
    # slot to a man dropping through the floor — and it would not error, it
    # would just look wrong.
    ("down",    ["dying", "death", "die", "fall"],     ["falling"],     False),  # let him fall
]

# The husks get all THIRTEEN clips in one GLB, not the eight the player uses.
# VR-118 (seam load-in) and VR-119 (SEARCH state) are both blocked on this file,
# and neither should need a second Blender run to get a clip that was sitting in
# the same folder the whole time.
#
# Keys are the literal Mixamo filenames, because they are known and exact —
# guessing keywords is what caused every collision this script has ever had.
# ORDER MATTERS: first match wins, so `dodge` must veto "back" or it eats
# "Dodging Back" — the same substring collision class as "Walking Turn 180".
HUSK_WANT = [
    ("run",       ["y-bot-run"],      [],       True),   # SEEK — running you down
    ("walk",      ["sad walk"],       [],       True),   # SEARCH — lost you, wandering
    ("scan",      ["looking around"], [],       True),   # SEARCH — stopped, scanning
    ("dizzy",     ["dizzy"],          [],       True),   # SEARCH — confused turn, and stagger
    ("attack",    ["stabbing"],       [],       True),
    ("hurt",      ["big hit"],        [],       True),
    ("down",      ["dying"],          [],       False),  # one-shot: it should travel
    ("dodge",     ["dodging"],        ["back"], True),
    ("dodgeback", ["dodging back"],   [],       True),
    ("fall",      ["falling"],        [],       True),   # entrance A beat 1
    ("getup",     ["getting up"],     [],       True),   # entrance A beat 2
    ("float",     ["floating"],       [],       True),   # entrance B beat 1
    ("land",      ["landing"],        [],       True),   # entrance B beat 2
]
# Every entrance clip is stripped: the seam rise owns Y (`spawnRise` lerps
# -1.6 -> 0 in code), so a clip that also travels vertically would double it.

PROFILES = {
    "vesper": dict(src=CA + "/vesper_canon_v2/mixamo",
                   out=REPO + "/assets/models/vesper.glb",
                   height=1.80, want=VESPER_WANT),
    "husk":   dict(src=CA + "/husk-ybot-v1/ybot",
                   out=REPO + "/assets/models/husk.glb",
                   height=1.78, want=HUSK_WANT),   # matches SPR.DEF.husk.h
}

def _pick_char():
    argv = sys.argv
    if "--" in argv:
        rest = argv[argv.index("--") + 1:]
        if "--char" in rest:
            i = rest.index("--char")
            if i + 1 < len(rest): return rest[i + 1]
    return os.environ.get("VEILRUN_CHAR", "vesper")

CHAR = _pick_char()
if CHAR not in PROFILES:
    raise SystemExit("[VEILRUN] unknown character %r — try one of: %s"
                     % (CHAR, ", ".join(PROFILES)))
_P = PROFILES[CHAR]
SRC_DIR = os.environ.get("VEILRUN_SRC", _P["src"])
OUT_GLB = os.environ.get("VEILRUN_OUT", _P["out"])
TARGET_HEIGHT = _P["height"]        # must match the game's worldHeight
WANT = _P["want"]

def log(m): print("[VEILRUN] " + m)

log("character: %s" % CHAR)
log("  src: %s" % SRC_DIR)
log("  out: %s" % OUT_GLB)

def clear():
    bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete(use_global=False)
    for c in (bpy.data.actions, bpy.data.armatures, bpy.data.meshes):
        for b in list(c):
            if b.users == 0: c.remove(b)

def find_files():
    """Newest match wins, searched recursively.

       Recursive because downloads land in dated subfolders (mixamo/R2/...) and
       moving files around by hand is exactly the sort of chore that gets skipped.
       Newest-first because a re-download is always meant to REPLACE the old take —
       so a fresh Walking in R2 beats the stale one sitting in the parent."""
    files = glob.glob(os.path.join(SRC_DIR, "**", "*.fbx"), recursive=True)
    if not files: raise SystemExit("[VEILRUN] no .fbx anywhere under\n  " + SRC_DIR)
    files.sort(key=os.path.getmtime, reverse=True)
    log("found %d fbx (newest first)" % len(files))
    picked, used = [], set()
    for name, keys, veto, _strip in WANT:
        hit = None
        for f in files:
            if f in used: continue
            low = os.path.basename(f).lower()
            if any(v in low for v in veto): continue
            if any(k in low for k in keys): hit = f; break
        if hit:
            used.add(hit); picked.append((name, hit, _strip))
            rel = os.path.relpath(hit, SRC_DIR)
            log("  %-8s <- %s" % (name, rel))
        else:
            log("  %-8s <- MISSING (game falls back for this state)" % name)
    skipped = [os.path.relpath(f, SRC_DIR) for f in files if f not in used]
    if skipped: log("  unused: " + ", ".join(skipped))
    return picked

def import_fbx(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=True)
    new = [o for o in bpy.data.objects if o not in before]
    arm = next((o for o in new if o.type == "ARMATURE"), None)
    meshes = [o for o in new if o.type == "MESH"]
    return arm, meshes, new

def fcurve_owners(act):
    """Yield every object that owns an `.fcurves` collection on this Action.

       Blender 4.4+ (and 5.x) restructured Actions into layers > strips >
       channelbags, and REMOVED `Action.fcurves`. Older Blenders only have the
       flat `Action.fcurves`. Supporting both is three lines and saves the script
       from dying on whichever version someone happens to have installed."""
    if hasattr(act, "fcurves"):
        yield act
        return
    for layer in getattr(act, "layers", []):
        for strip in getattr(layer, "strips", []):
            for cb in getattr(strip, "channelbags", []):
                yield cb

def strip_root_motion(act):
    """Delete the hip channel that TRAVELS, keep the ones that oscillate.

       Mixamo's "In Place" checkbox does this at download time; forget to tick it
       and the clip walks the character away from where the game thinks it is —
       which reads as sliding forward and snapping back on every loop. Rather
       than trust the checkbox, we detect it: a travel channel drifts steadily
       from its first key to its last, while bob and sway return to where they
       started. Only the drifters go, so the vertical bob survives."""
    removed = []
    for owner in fcurve_owners(act):
        for fc in list(owner.fcurves):
            if "location" not in fc.data_path or "Hips" not in fc.data_path:
                continue
            if len(fc.keyframe_points) < 2:
                continue
            vals = [k.co[1] for k in fc.keyframe_points]
            drift = abs(vals[-1] - vals[0])
            span = max(vals) - min(vals)
            if span > 1e-6 and drift > 0.45 * span:   # goes somewhere and stays there
                axis = "XYZ"[fc.array_index]          # read BEFORE removing: the
                owner.fcurves.remove(fc)              # struct is dead afterwards
                removed.append(axis)
    if removed:
        log("  stripped root motion on %s: %s (kept the oscillating channels)"
            % (act.name, "+".join(removed)))
    else:
        log("  %s: no travelling hip channel found (already in place?)" % act.name)
    return removed

def action_of(arm):
    return arm.animation_data.action if (arm and arm.animation_data) else None

def main():
    picked = find_files()
    if not picked: raise SystemExit("[VEILRUN] nothing matched")
    clear()

    # --- base: the first file that actually carries a mesh (the with-skin one) ---
    base_arm = base_meshes = None
    base_name = None
    for name, path, _strip in picked:
        arm, meshes, _ = import_fbx(path)
        if meshes:
            base_arm, base_meshes, base_name = arm, meshes, name
            a = action_of(arm)
            if a:
                a.name = name; a.use_fake_user = True
                if _strip: strip_root_motion(a)
                else: log("  %s: one-shot, root motion KEPT (it should travel)" % name)
            log("base rig from '%s' (%d mesh, %d bones)" % (name, len(meshes), len(arm.data.bones)))
            break
        else:
            for o in bpy.data.objects: pass
    if base_arm is None:
        raise SystemExit("[VEILRUN] none of the FBX files contained a mesh — "
                         "re-download ONE animation with 'With Skin'.")

    # --- every other clip: import, steal the action, bin the duplicate rig ---
    actions = {}
    a = action_of(base_arm)
    if a: actions[base_name] = a
    for name, path, _strip in picked:
        if name == base_name: continue
        arm, meshes, new = import_fbx(path)
        act = action_of(arm)
        if act:
            act.name = name; act.use_fake_user = True
            if _strip: strip_root_motion(act)
            else: log("  %s: one-shot, root motion KEPT (it should travel)" % name)
            actions[name] = act
            log("clip '%s' — %d frames" % (name, int(act.frame_range[1] - act.frame_range[0])))
        else:
            log("clip '%s' — no animation data found, skipped" % name)
        bpy.ops.object.select_all(action="DESELECT")
        for o in new: o.select_set(True)
        bpy.ops.object.delete()          # the borrowed skeleton goes; the action stays

    # --- scale: Mixamo works in centimetres, the arena in metres ---
    bpy.ops.object.select_all(action="DESELECT")
    for o in [base_arm] + base_meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = base_arm
    # EVERY mesh, not just the first one. A Mixamo character usually arrives as
    # two meshes — a body surface and a joint-ball overlay — and the joints are
    # SHORTER than the body. Measuring meshes[0] measured whichever one the FBX
    # importer happened to list first, and on the Y Bot that was the joints: the
    # husk came out 2.02m instead of 1.78m, 13% too tall, with nothing to say so.
    # (VR-117, 8/22)
    zs = []
    for _m in base_meshes:
        zs += [(_m.matrix_world @ v.co).z for v in _m.data.vertices]
    h = max(zs) - min(zs)
    if h > 0.01:
        s = TARGET_HEIGHT / h
        # MULTIPLY the existing scale, never assign over it. Mixamo's FBX lands
        # with the armature at 0.01 (bones authored in centimetres) or at 1.0,
        # depending on which download preset the clip came from — and `h` above
        # is already the WORLD height, so it has that 0.01 baked into it.
        # Assigning `s` outright threw the 0.01 away and produced a character
        # 112x too big. It did not error and it did not look wrong in Blender;
        # it looked wrong in the game, as a grey wall. Vesper never caught this
        # because his wave happened to import at 1.0. (VR-117, 8/22)
        base_arm.scale = tuple(v * s for v in base_arm.scale)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        zs2 = []
        for _m in base_meshes:
            zs2 += [(_m.matrix_world @ v.co).z for v in _m.data.vertices]
        h2 = max(zs2) - min(zs2)
        log("rescaled x%.4f  (%.2f -> %.2f)" % (s, h, h2))
        # Prove it landed rather than trusting the arithmetic. A wrongly-sized
        # character is invisible to every other check we own until someone loads
        # the game, which is exactly the class of bug this merge keeps producing.
        if abs(h2 - TARGET_HEIGHT) > 0.02:
            raise SystemExit("[VEILRUN] scale did not land: wanted %.2f, got %.2f — "
                             "refusing to export a wrongly-sized character."
                             % (TARGET_HEIGHT, h2))

    # --- NLA strips: this is what makes the exporter emit NAMED clips ---
    if base_arm.animation_data is None: base_arm.animation_data_create()
    base_arm.animation_data.action = None
    for t in list(base_arm.animation_data.nla_tracks):
        base_arm.animation_data.nla_tracks.remove(t)
    for name, act in actions.items():
        track = base_arm.animation_data.nla_tracks.new()
        track.name = name
        strip = track.strips.new(name, int(act.frame_range[0]), act)
        strip.name = name
    log("NLA tracks: " + ", ".join(actions.keys()))

    os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    kw = dict(filepath=OUT_GLB, export_format="GLB", export_apply=False,
              export_animations=True, export_nla_strips=True, export_skins=True)
    try:
        bpy.ops.export_scene.gltf(**kw)
    except TypeError:
        bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB")
    log("exported %s  (%.1f MB)  with %d clip(s)"
        % (OUT_GLB, os.path.getsize(OUT_GLB)/1048576, len(actions)))
    log("done — reload the game, %s should walk in." % CHAR)

main()
