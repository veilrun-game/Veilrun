# Seam Slider — paired scene assets

Each scene is the SAME place in both worlds, one folder per scene:

```
seam/
  market/    overcity.png + underweft.png
  rooftop/   overcity.png + underweft.png   (add later)
  transit/   overcity.png + underweft.png   (add later)
```

- `overcity.png`  — the scene in the Overcity (warm, grounded, arcane light bleeding in)
- `underweft.png` — the SAME scene in the Underweft (lifelike despite the magic)

Scenes are registered in `js/landing.js` (`SEAM_SCENES`) and appear as tabs under
the slider. A gradient placeholder shows for any half whose file is missing. 1456×816
(16:9) is the target size — keep both halves identical dimensions so the wipe aligns.

## How the aligned pair is made (Midjourney Retexture)

The two halves MUST share the exact same geometry or the seam wipe looks wrong. The
reliable way: generate/pick the **Overcity** frame first, then **Retexture** it into the
Underweft — retexture keeps every building, car, and street line and only re-skins the
world. Download BOTH the source Overcity frame and its retexture; they're pixel-aligned.

1. Overcity recipe (photoreal, grounded): `photorealistic cinematic street photograph of a
   real gritty industrial megacity at dusk … wet asphalt, umbrellas, warm sodium
   streetlights … shot on 35mm --no tangled cables, cyberpunk neon, fantasy, painterly --raw`
2. Open the chosen frame → **More → Edit → Open in Edit Tab → Retexture tab**.
3. Underweft retexture prompt (photoreal magic, same place):
   `the same industrial megacity street reborn as an enchanted parallel world, the identical
   buildings and wet street now woven from ancient stone and glowing crystal, threaded with
   luminous violet and teal arcane filaments, bioluminescent mist … cinematic, shot on 35mm,
   realistic --sref https://cdn.midjourney.com/1236341d-d70f-4405-92e1-03dc59150d6b/0_0.png
   --sw 30 --no cartoon, flat illustration, painterly, cgi videogame`  (Raw on.)
4. Download the retexture (Underweft) + the source frame (Overcity) → drop into the scene folder.

Note: MJ's "Edit from URL" / "Edit Uploaded Image" open a native OS dialog — use the
in-app **More → Edit** path on an existing library frame instead.
