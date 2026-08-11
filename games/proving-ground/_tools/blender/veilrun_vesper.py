# VEILRUN — VR-91 · stick-figure Vesper, built and rendered to the sprite contract.
#
# HOW TO USE (no MCP, no add-ons):
#   1. Open Blender. Switch to the "Scripting" workspace (top tab bar).
#   2. New > paste this whole file in.
#   3. Press "Run Script" (the ▶ button). OUT_DIR is already set to a folder
#      Claude can read, so you can just say "renders are done" afterwards.
#
# It clears the scene, builds the character, and renders 20 PNGs:
#   vesper_<state>_f<0-3>.png   —  5 states x 4 facings
# straight into OUT_DIR, transparent, framed to the contract. Then:
#   python3 _tools/_fit.py <OUT_DIR> /tmp/fitted
#   python3 _tools/_sprites.py /tmp/fitted --pack
#
# WHY THIS AND NOT MIDJOURNEY: the front and the back are provably the same
# character because they are the same object. A new state is a render, not a
# re-roll. And the model stays the source of truth — when Vesper's look changes,
# every sprite is regenerated instead of redrawn.

import bpy, math, os
from mathutils import Vector

# ------------------------------------------------------------------ settings
# Renders land inside the mounted "Claude Access" folder, so Claude can open
# every frame and critique it without any MCP, socket or extra install.
OUT_DIR   = "/Users/jordankersey/Desktop/Claude Access/Games/Veilrun/Art & Assets/assets/vesper_blender_v1"
RES       = 1024        # contract canvas
CAM_PITCH = 35.0        # degrees above horizontal — matches the arcade camera
FACINGS   = 4
STATES    = ["idle", "move", "attack", "hurt", "down"]
SAMPLES   = 32          # EEVEE samples; raise for a final pass

ACCENT  = (0.59, 0.35, 0.90, 1.0)   # Vesper indigo #965AE6
CLOTH   = (0.13, 0.10, 0.21, 1.0)
CLOAK   = (0.29, 0.16, 0.55, 1.0)
STEEL   = (0.79, 0.75, 0.92, 1.0)

# ---------------------------------------------------------------- utilities
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.curves):
        for b in list(block):
            if b.users == 0:
                block.remove(b)

def mat(name, rgba, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = 0.75
    if emit:
        # Blender 4.x renamed these sockets; support both
        for key in ("Emission Color", "Emission"):
            if key in bsdf.inputs:
                bsdf.inputs[key].default_value = rgba
                break
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emit
    return m

def limb(name, parent, head, tail, radius, material):
    """A capsule-ish limb from head->tail. Parented so posing is a rotation."""
    d = Vector(tail) - Vector(head)
    length = d.length
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=length,
                                        location=(0, 0, -length / 2))
    ob = bpy.context.object
    ob.name = name
    bpy.ops.object.shade_smooth()
    for z in (0, -length):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=(0, 0, z))
        s = bpy.context.object
        bpy.ops.object.shade_smooth()
        s.parent = ob
        s.matrix_parent_inverse = ob.matrix_world.inverted()
        s.data.materials.append(material)
    ob.data.materials.append(material)

    piv = bpy.data.objects.new(name + "_pivot", None)
    bpy.context.collection.objects.link(piv)
    piv.location = head
    ob.parent = piv
    ob.matrix_parent_inverse = piv.matrix_world.inverted()
    if parent:
        piv.parent = parent
    return piv

# ------------------------------------------------------------------- build
def build():
    clear_scene()
    m_cloth, m_cloak = mat("cloth", CLOTH), mat("cloak", CLOAK)
    m_steel, m_eye  = mat("steel", STEEL), mat("eye", ACCENT, emit=6.0)

    root = bpy.data.objects.new("VESPER", None)
    bpy.context.collection.objects.link(root)

    # The character faces -Y, matching the game's forward vector (-sin, -cos).
    hips  = limb("spine", root, (0, 0, 0.88), (0, 0, 1.42), 0.075, m_cloth)
    head  = limb("neck",  hips, (0, 0, 1.42), (0, 0, 1.58), 0.055, m_cloth)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.155, location=(0, 0, 1.70))
    skull = bpy.context.object; skull.name = "skull"
    bpy.ops.object.shade_smooth()
    skull.data.materials.append(m_cloth); skull.parent = head
    skull.matrix_parent_inverse = head.matrix_world.inverted()

    # hood — a cone over the skull, open at the bottom
    bpy.ops.mesh.primitive_cone_add(radius1=0.22, radius2=0.0, depth=0.42,
                                    location=(0, 0.02, 1.80))
    hood = bpy.context.object; hood.name = "hood"
    hood.data.materials.append(m_cloak); hood.parent = head
    hood.matrix_parent_inverse = head.matrix_world.inverted()

    for sx in (-1, 1):   # eyes, on the -Y face
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.028,
                                             location=(0.055 * sx, -0.13, 1.70))
        e = bpy.context.object
        bpy.ops.object.shade_smooth()
        e.data.materials.append(m_eye); e.parent = head
        e.matrix_parent_inverse = head.matrix_world.inverted()

    # cloak — a cone BEHIND him (+Y), which is the thing v0 had on the wrong side
    bpy.ops.mesh.primitive_cone_add(radius1=0.42, radius2=0.10, depth=1.05,
                                    location=(0, 0.14, 0.95))
    ck = bpy.context.object; ck.name = "cloak"
    ck.rotation_euler.x = math.radians(-6)
    ck.data.materials.append(m_cloak); ck.parent = hips
    ck.matrix_parent_inverse = hips.matrix_world.inverted()

    arms, legs, blades = {}, {}, {}
    for side, sx in (("L", -1), ("R", 1)):
        up = limb("arm_up_" + side, hips, (0.17 * sx, 0, 1.36), (0.17 * sx, 0, 1.05), 0.045, m_cloth)
        lo = limb("arm_lo_" + side, up,   (0.17 * sx, 0, 1.05), (0.17 * sx, 0, 0.78), 0.038, m_cloth)
        arms[side] = (up, lo)
        # forearm-length dagger — deliberately short, this is the canon call
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0.17 * sx, -0.06, 0.60))
        b = bpy.context.object; b.name = "dagger_" + side
        b.scale = (0.012, 0.030, 0.15)
        b.data.materials.append(m_steel); b.parent = lo
        b.matrix_parent_inverse = lo.matrix_world.inverted()
        blades[side] = b

        th = limb("leg_up_" + side, root, (0.10 * sx, 0, 0.88), (0.10 * sx, 0, 0.46), 0.055, m_cloth)
        sh = limb("leg_lo_" + side, th,   (0.10 * sx, 0, 0.46), (0.10 * sx, 0, 0.03), 0.045, m_cloth)
        legs[side] = (th, sh)

    return dict(root=root, hips=hips, head=head, arms=arms, legs=legs, blades=blades)

# ------------------------------------------------------------------- poses
# (x-rotation in degrees) — small numbers, because at ~90px on screen a pose
# reads as a silhouette, not as anatomy.
POSES = {
    "idle":   dict(hips=0,   armL=(8, 12),   armR=(-8, 14),  legL=(2, -3),   legR=(-2, 3),   root_z=0.0),
    "move":   dict(hips=6,   armL=(-38, 22), armR=(34, 18),  legL=(30, -34), legR=(-28, 12), root_z=0.03),
    "attack": dict(hips=14,  armL=(20, 30),  armR=(-96, 8),  legL=(24, -18), legR=(-16, 26), root_z=0.0),
    "hurt":   dict(hips=-22, armL=(46, 34),  armR=(52, 30),  legL=(-14, 20), legR=(10, 24),  root_z=0.02),
    "down":   dict(hips=-58, armL=(70, 20),  armR=(66, 26),  legL=(-72, 96), legR=(-64, 88), root_z=-0.34),
}

def pose(rig, name):
    p = POSES[name]
    rig["hips"].rotation_euler.x = math.radians(p["hips"])
    rig["root"].location.z = p["root_z"]
    for side, key in (("L", "armL"), ("R", "armR")):
        up, lo = rig["arms"][side]
        up.rotation_euler.x = math.radians(p[key][0])
        lo.rotation_euler.x = math.radians(p[key][1])
    for side, key in (("L", "legL"), ("R", "legR")):
        th, sh = rig["legs"][side]
        th.rotation_euler.x = math.radians(p[key][0])
        sh.rotation_euler.x = math.radians(p[key][1])

# ------------------------------------------------------- lighting + camera
def setup_scene():
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in \
        [i.identifier for i in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE"
    try: sc.eevee.taa_render_samples = SAMPLES
    except Exception: pass
    sc.render.resolution_x = sc.render.resolution_y = RES
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = True                 # contract: transparent bg
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"      # no filmic wash

    # key — cool white, upper front-left, matching the arena's directional light
    key = bpy.data.lights.new("key", type="AREA"); key.energy = 900; key.size = 4
    key.color = (0.80, 0.85, 0.95)
    ko = bpy.data.objects.new("key", key); bpy.context.collection.objects.link(ko)
    ko.location = (-3.4, -3.6, 4.6); ko.rotation_euler = (math.radians(48), 0, math.radians(-42))

    # rim — the seam's magenta, from behind right
    rim = bpy.data.lights.new("rim", type="AREA"); rim.energy = 420; rim.size = 3
    rim.color = (0.84, 0.36, 0.86)
    ro = bpy.data.objects.new("rim", rim); bpy.context.collection.objects.link(ro)
    ro.location = (3.2, 3.4, 2.8); ro.rotation_euler = (math.radians(70), 0, math.radians(140))

    fill = bpy.data.lights.new("fill", type="AREA"); fill.energy = 90; fill.size = 6
    fill.color = (0.30, 0.26, 0.55)
    fo = bpy.data.objects.new("fill", fill); bpy.context.collection.objects.link(fo)
    fo.location = (2.0, -3.0, 1.2); fo.rotation_euler = (math.radians(85), 0, math.radians(35))

    # ORTHOGRAPHIC on purpose: perspective makes the near facing bigger than the
    # far one, which breaks the contract's "same height in every facing" rule.
    cam = bpy.data.cameras.new("cam"); cam.type = "ORTHO"; cam.ortho_scale = 2.35
    co = bpy.data.objects.new("cam", cam); bpy.context.collection.objects.link(co)
    sc.camera = co
    return co

def place_camera(co, deg):
    """Orbit the camera instead of turning the character — identical result,
       and it guarantees the facings are exactly evenly spaced."""
    pitch = math.radians(CAM_PITCH)
    yaw   = math.radians(deg)
    dist  = 8.0
    tgt   = Vector((0, 0, 0.92))
    co.location = tgt + Vector((math.sin(yaw) * math.cos(pitch) * dist,
                                -math.cos(yaw) * math.cos(pitch) * dist,
                                math.sin(pitch) * dist))
    d = tgt - co.location
    co.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()

# ------------------------------------------------------------------ render
def main():
    rig = build()
    co  = setup_scene()
    os.makedirs(OUT_DIR, exist_ok=True)
    n = 0
    for st in STATES:
        pose(rig, st)
        for f in range(FACINGS):
            place_camera(co, f * (360.0 / FACINGS))
            bpy.context.scene.render.filepath = os.path.join(OUT_DIR, "vesper_%s_f%d.png" % (st, f))
            bpy.ops.render.render(write_still=True)
            n += 1
    print("\nVEILRUN: wrote %d sprites to %s" % (n, OUT_DIR))
    print("next:  python3 _tools/_fit.py '%s' /tmp/fitted" % OUT_DIR)
    print("       python3 _tools/_sprites.py /tmp/fitted --pack")

main()
