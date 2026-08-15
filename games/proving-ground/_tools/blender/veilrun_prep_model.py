# VEILRUN — VR-91 · prepare a Rodin GLB for production.
#
# Everything in here is needed whichever way we go — sprites, real-time, or both.
# It does the unglamorous, exact work that a script is genuinely good at, and
# leaves the artistry to the model that already exists.
#
# HOW TO RUN (no MCP, no add-ons):
#   Blender > Scripting > New > paste > Run Script
#   ...or headless, which is what I'd do:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python <this file>
#
# What it fixes, and why each one matters:
#   1. ORIGIN AT THE FEET. Rodin centres the origin in the body (feet at Y=-0.861).
#      The whole sprite contract anchors at the feet, and a game character's
#      transform is its ground contact. Everything downstream assumes this.
#   2. CENTRED ON X/Z. He's 23mm off-centre, so he'd orbit slightly when turning.
#   3. SCALED TO THE ARENA. 1.722 units tall -> worldHeight 1.80 from the contract.
#   4. FACING -Y. The game's forward vector is (-sin yaw, -cos yaw); a model facing
#      the other way is how v0 shipped with Vesper running backwards.
#   5. A LOW-POLY DERIVATION, optional. Decimate + bake normals, so the browser
#      build wears the high-poly's face at a fraction of the cost.

import bpy, os, math

# ----------------------------------------------------------------- settings
SRC = ("/Users/jordankersey/Desktop/Claude Access/Games/Veilrun/Art & Assets/assets/"
       "vesper_canon_v2/Veilrun Character 3D Control_Rodin 3D V2_2026-08-12_01-45-59.glb")
OUT_DIR = ("/Users/jordankersey/Desktop/Claude Access/Games/Veilrun/Art & Assets/assets/"
           "vesper_canon_v2/prepped")

TARGET_HEIGHT = 1.80        # worldHeight from the VR-91 asset contract
MAKE_LOWPOLY  = True        # decimate a browser-ready copy alongside the master
LOWPOLY_TRIS  = 20000       # hero-character budget for the web
LOWPOLY_TEX   = 1024        # px. THE file size lives here, not in the polygons:
                            # Rodin ships ~10 MB of PNG, which is 92% of the
                            # decimated GLB. 4096 -> 1024 is 16x fewer pixels.

def log(m): print("[VEILRUN] " + m)

def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

def import_glb(path):
    if not os.path.exists(path):
        raise SystemExit("[VEILRUN] source not found:\n  " + path)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before and o.type == "MESH"]
    if not new:
        raise SystemExit("[VEILRUN] no mesh in the GLB")
    log("imported %d mesh object(s)" % len(new))
    return new

def join(objs):
    if len(objs) == 1: return objs[0]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    return bpy.context.object

def apply_all(ob):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

def world_bounds(ob):
    cs = [ob.matrix_world @ v.co for v in ob.data.vertices]
    xs = [c.x for c in cs]; ys = [c.y for c in cs]; zs = [c.z for c in cs]
    return (min(xs), max(xs)), (min(ys), max(ys)), (min(zs), max(zs))

def normalise(ob):
    """Feet on the floor, centred, scaled to the arena, facing -Y."""
    apply_all(ob)
    (x0, x1), (y0, y1), (z0, z1) = world_bounds(ob)
    log("as imported: %.3f W x %.3f D x %.3f H  (Blender is Z-up)" % (x1-x0, y1-y0, z1-z0))

    s = TARGET_HEIGHT / (z1 - z0)
    ob.scale = (s, s, s); apply_all(ob)
    log("scaled x%.4f -> %.3f tall" % (s, TARGET_HEIGHT))

    (x0, x1), (y0, y1), (z0, z1) = world_bounds(ob)
    ob.location = (-(x0 + x1) / 2.0, -(y0 + y1) / 2.0, -z0)   # centre X/Y, feet to Z=0
    apply_all(ob)

    (x0, x1), (y0, y1), (z0, z1) = world_bounds(ob)
    log("normalised: feet Z=%.4f  centre X=%.4f Y=%.4f  height %.4f"
        % (z0, (x0+x1)/2, (y0+y1)/2, z1-z0))
    ob.name = "VESPER_high"
    return ob

def make_lowpoly(src, target_tris):
    bpy.ops.object.select_all(action="DESELECT")
    src.select_set(True); bpy.context.view_layer.objects.active = src
    bpy.ops.object.duplicate()
    low = bpy.context.object; low.name = "VESPER_low"

    tris = sum(len(p.vertices) - 2 for p in low.data.polygons)
    ratio = min(1.0, float(target_tris) / max(tris, 1))
    m = low.modifiers.new("decimate", "DECIMATE")
    m.decimate_type = "COLLAPSE"; m.ratio = ratio
    bpy.context.view_layer.objects.active = low
    bpy.ops.object.modifier_apply(modifier=m.name)

    after = sum(len(p.vertices) - 2 for p in low.data.polygons)
    log("low-poly: %d -> %d tris (ratio %.4f)" % (tris, after, ratio))
    log("NOTE: this keeps the original UVs and textures, so it already looks close.")
    log("      A normal-map bake from VESPER_high recovers the fine surface detail —")
    log("      worth doing only once we know a real-time build is happening.")
    return low

def shrink_textures(px):
    """Resize every image datablock in place. Geometry decimation does nothing
       for download size — this is the step that actually makes it shippable."""
    total_before = 0
    for im in bpy.data.images:
        if not im.has_data or im.size[0] == 0:
            continue
        w, h = im.size
        total_before += w * h
        if max(w, h) <= px:
            continue
        s = float(px) / max(w, h)
        nw, nh = max(1, int(w * s)), max(1, int(h * s))
        im.scale(nw, nh)
        log("texture %s  %dx%d -> %dx%d" % (im.name, w, h, nw, nh))
    return total_before

def export(ob, path):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB",
                              use_selection=True, export_apply=True)
    log("exported %s  (%.1f MB)" % (os.path.basename(path), os.path.getsize(path)/1048576))

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    clear()
    high = normalise(join(import_glb(SRC)))
    export(high, os.path.join(OUT_DIR, "vesper_high.glb"))
    if MAKE_LOWPOLY:
        low = make_lowpoly(high, LOWPOLY_TRIS)
        # decimation nudges vertices, so re-seat him on the floor afterwards
        apply_all(low)
        (x0, x1), (y0, y1), (z0, z1) = world_bounds(low)
        low.scale = (TARGET_HEIGHT / (z1 - z0),) * 3
        apply_all(low)
        (x0, x1), (y0, y1), (z0, z1) = world_bounds(low)
        low.location = (-(x0 + x1) / 2.0, -(y0 + y1) / 2.0, -z0)
        apply_all(low)
        (x0, x1), (y0, y1), (z0, z1) = world_bounds(low)
        log("low-poly re-seated: feet Z=%.4f  height %.4f" % (z0, z1 - z0))

        # textures LAST — this mutates the shared image datablocks, so the
        # high-poly must already be exported at full resolution.
        shrink_textures(LOWPOLY_TEX)
        export(low, os.path.join(OUT_DIR, "vesper_low.glb"))
        low.hide_set(True)
    blend = os.path.join(OUT_DIR, "vesper.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend)
    log("saved %s" % blend)
    log("done — origin at the feet, centred, %.2f units tall, ready to rig." % TARGET_HEIGHT)

main()
