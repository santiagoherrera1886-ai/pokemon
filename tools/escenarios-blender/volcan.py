# Cráter de Fragua de la Pelea hecho en Blender: basalto oscuro en bloques con grietas de lava encendidas,
# costra de lava fría que chorrea naranja por el borde, columnas de basalto, respiraderos con brasas,
# árboles quemados, pozos de lava y cristales morados. Igual de ancho y profundo que el choque del juego.
import os, sys, math, random
import bpy, bmesh
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from stagelib import *
sc = clear(); random.seed(11)

A, Z, TOP, DEPTH, FRM, SLOPE = -9, 9, -.12, 6.4, 1.2, 1.15
PAL = ('#0e0a0c', '#191214', '#261a1a', '#3a2824', '#4e3428')
PLATS = [(-7, -3, 2.8), (3, 7, 2.8)]

rock = chunky_rock('volcan_roca', rock_profile(A, Z, TOP, DEPTH, FRM, SLOPE), -2.3, 2.3, seed=2, crack=.22, crack_w=.22, scale=1.15, step=.16, tilt=.2)
crust = cap('volcan_costra', A - .3, Z + .3, .015, .36, -2.48, 2.48, seed=4, drip=.75)
plats = []
for i, (pa, pb, h) in enumerate(PLATS):
    pr = chunky_rock(f'vplat{i}_roca', [(x, y + h) for x, y in rock_profile(pa + .05, pb - .05, -.12, 1.1, .32, 1.05, n=6, dip=.25)], -1.15, 1.15, voxel=.05, crack=.16, crack_w=.2, top_keep=h - .3, seed=12 + i, scale=.85)
    pg = cap(f'vplat{i}_costra', pa - .14, pb + .14, h + .015, .26, -1.32, 1.32, seed=22 + i, drip=.65, voxel=.045)
    plats.append((pr, pg, h))

# Atrás de los peleadores (z negativo): columnas de basalto, respiraderos (el juego les pone humo en x -6.8, 0.8 y 7),
# árboles quemados, pozos de lava y cristales.
cols = [basalt_cluster('basalto0', -8.0, -1.75, 6, .9, 2.7, 1), basalt_cluster('basalto1', -4.3, -2.2, 4, .5, 1.5, 2),
        basalt_cluster('basalto2', 3.3, -2.15, 6, 1.2, 3.3, 3), basalt_cluster('basalto3', 8.1, -1.6, 5, .7, 2.2, 4),
        basalt_cluster('basalto4', -8.55, 1.95, 3, .2, .42, 5, .3), basalt_cluster('basalto5', 8.5, 1.9, 3, .2, .38, 6, .3)]
vents = [vent(f'respiradero{i}', x, -2.0, s) for i, (x, s) in enumerate([(-6.8, 1.0), (.8, .9), (7.0, 1.05)])]
trees = [dead_tree('arbol0', -5.4, -2.3, 1.05, 41), dead_tree('arbol1', 5.5, -2.25, .95, 42)]
pools = [lava_pool('pozo0', -2.9, -1.85, .95, .5, 51), lava_pool('pozo1', 4.6, -1.65, .7, .42, 52)]
cryst = [crystal_cluster('cristal0', -1.4, 0, -2.15, .95, 61), crystal_cluster('cristal1', 2.3, 0, -2.2, .8, 62), crystal_cluster('cristal2', -7.3, 0, -2.25, .6, 63)]
cryst += [crystal_cluster(f'cristal_pl{i}', (pa + pb) / 2, h - 1.15, 0, .75, 65 + i, down=True) for i, (pa, pb, h) in enumerate(PLATS)]
pebbles = [boulder(f'piedrita{i}', random.uniform(A + .3, Z - .3), .02, (2.3 if i % 2 else -2.3) + random.uniform(-.1, .1), random.uniform(.2, .32), 300 + i) for i in range(30)]
pebbles += [boulder(f'roca{i}', x, .05, z, s, 320 + i) for i, (x, z, s) in enumerate([(-6.0, -1.3, .55), (6.3, -1.2, .5), (-.4, -1.55, .42), (1.9, -1.45, .38)])]

# ---------- Horneado ----------
rock_hi = rock; rock = duplicate(rock_hi, 'volcan_roca_lo'); decimate(rock, .26); smooth_shade(rock, 40); uv_unwrap(rock, .003, 66)
rock_img = bake_hi_lo(rock_hi, rock, bake_material('roca_bake', rock_colors(TOP, DEPTH, PAL, crack='#3a0e06', glow='#c2410c', edge=(.62, .36, .26))), 2048, 'vroca_tex', 'EMIT', 20)
rock_glow = bake_hi_lo(rock_hi, rock, bake_material('roca_glow', glow_mask(TOP, DEPTH, lo=.2, hi=.4, tip=.4)), 1024, 'vroca_glow', 'EMIT', 12)
rock_nrm = bake_hi_lo(rock_hi, rock, None, 1024, 'vroca_nrm', 'NORMAL', 4)
bpy.data.objects.remove(rock_hi); rock.name = 'volcan_roca'
decimate(crust, .16); smooth_shade(crust, 60); uv_unwrap(crust)
crust_img = bake_texture(crust, bake_material('costra_bake', crust_colors(.015, ('#141012', '#1f191c', '#2e2629'), '#4a3e3c')), 1024, 'costra_tex', 16)
crust_lit = bake_texture(crust, bake_material('costra_glow', crust_glow(.015)), 512, 'costra_glow', 6)
plat_imgs = []
for i, (pr, pg, h) in enumerate(plats):
    pr_hi = pr; pr = duplicate(pr_hi, f'vplat{i}_roca_lo'); decimate(pr, .35); smooth_shade(pr, 40); uv_unwrap(pr, .004, 60)
    ri = bake_hi_lo(pr_hi, pr, bake_material(f'vp{i}_bake', rock_colors(h - .12, 1.1 - h, PAL, crack='#3a0e06', glow='#c2410c', edge=(.62, .36, .26))), 512, f'vp{i}_tex', 'EMIT', 16)
    rg = bake_hi_lo(pr_hi, pr, bake_material(f'vp{i}_glow', glow_mask(h - .12, 1.1 - h, lo=.2, hi=.4, tip=.22, tip_h=.35)), 256, f'vp{i}_glow', 'EMIT', 8)
    rn = bake_hi_lo(pr_hi, pr, None, 512, f'vp{i}_nrm', 'NORMAL', 4)
    bpy.data.objects.remove(pr_hi); pr.name = f'vplat{i}_roca'; plats[i] = (pr, pg, h)
    decimate(pg, .2); smooth_shade(pg, 60); uv_unwrap(pg)
    gi = bake_texture(pg, bake_material(f'vpg{i}_bake', crust_colors(h + .015, ('#141012', '#1f191c', '#2e2629'), '#4a3e3c')), 512, f'vpg{i}_tex', 12)
    gg = bake_texture(pg, bake_material(f'vpg{i}_glow', crust_glow(h + .015, .3)), 256, f'vpg{i}_glow', 4)
    plat_imgs.append((ri, rg, rn, gi, gg))
cols = join(cols, 'basalto'); cols_img = bake_tex_obj(cols, stone_colors(-.2, 3.4, ('#151012', '#271e22', '#3c3034'), moss='#6a5a56', moss_amt=.9, ao_dist=.35, edge=0.0, dark='#080404'), 512, 'basalto_tex', 14, .004, 45)
vent_bodies = join([v[0] for v in vents], 'respiraderos'); bake_vertex_colors(vent_bodies, bake_material('resp_bake', simple_colors([(0, '#140e10'), (.7, '#2e2020'), (1, '#9a3a12')], -.2, .5, .3)), 12)
embers = join([v[1] for v in vents], 'brasas')
trees = join(trees, 'arboles_quemados'); bake_vertex_colors(trees, bake_material('arbol_bake', simple_colors([(0, '#120c0c'), (.5, '#2a1c1a'), (1, '#4a3430')], 0, 3.2, .35)), 12)
pool_lava = join([p[0] for p in pools], 'lava'); pool_rims = join([p[1] for p in pools], 'pozos_borde')
rocks = join(pebbles + [pool_rims], 'piedras'); bake_vertex_colors(rocks, bake_material('piedra_bake', simple_colors([(0, '#120c0e'), (1, '#3a2c2a')], -.1, .6, .25, moss='#5a4c4a')), 12)
cryst = join(cryst, 'cristales'); paint(cryst, lambda co, n: lerp3((.3, .04, .7), (.72, .4, 1.0), .3 + .7 * max(0, n.z)))

# ---------- Aligerar y materiales finales ----------
smooth_shade(cols, 35)
for o, ratio, ang in [(vent_bodies, .45, 50), (trees, .35, 50), (rocks, .45, 40)]:
    decimate(o, ratio); smooth_shade(o, ang)
rock.data.materials.clear(); rock.data.materials.append(pbr_material('roca_volcan', rock_img, rock_nrm, .95, .85, rock_glow, 2.2))
crust.data.materials.clear(); crust.data.materials.append(textured_material('costra', crust_img, .8, crust_lit, 2.0))
cols.data.materials.clear(); cols.data.materials.append(textured_material('basalto', cols_img, .7)); finish(vent_bodies, 'respiraderos', rough=.85); finish(trees, 'arboles', rough=.9); finish(rocks, 'piedras', rough=.85)
finish(cryst, 'cristales_morados', rough=.15, emissive=(.55, .18, 1.0), strength=1.4)
paint(embers, lambda co, n: (1.0, .4, .08)); finish(embers, 'brasas', rough=.6, emissive=(1.0, .36, .05), strength=2.4)
paint(pool_lava, lambda co, n: (.9, .16, .02)); finish(pool_lava, 'lava', rough=1.0, emissive=(1.0, .26, .02), strength=1.3)
for (pr, pg, h), (ri, rg, rn, gi, gg) in zip(plats, plat_imgs):
    pr.data.materials.clear(); pr.data.materials.append(pbr_material(pr.name, ri, rn, .95, .85, rg, 2.2))
    pg.data.materials.clear(); pg.data.materials.append(textured_material(pg.name, gi, .8, gg, 2.0))
allp = [rock, crust, cols, vent_bodies, embers, trees, pool_lava, rocks, cryst] + [o for pr, pg, h in plats for o in (pr, pg)]
for p in allp: print(p.name, len(p.data.vertices))
for o in sc.objects: o.select_set(o in allp)
bpy.ops.export_scene.gltf(filepath=f'{OUT}/volcan.glb', export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_image_format='JPEG', export_jpeg_quality=88)
bpy.ops.wm.save_as_mainfile(filepath=f'{OUT}/volcan.blend')
print('listo')
