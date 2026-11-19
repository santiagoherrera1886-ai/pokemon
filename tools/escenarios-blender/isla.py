# Isla Flotante de la Pelea hecha en Blender.
import os, sys, math, random
import bpy, bmesh
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from stagelib import *
sc = clear(); random.seed(7)
parts = []
rock = chunky_rock('isla_roca', rock_profile(-8, 8, -.12, 6, 1.1, 1.25), -2.3, 2.3, seed=1)
grass = cap('isla_pasto', -8.3, 8.3, .015, .36, -2.48, 2.48, seed=3)
plats = []
for i, (pa, pb, h) in enumerate([(-5.8, -1.8, 3.2), (1.8, 5.8, 3.2), (-2, 2, 6.2)]):
    pr = chunky_rock(f'plat{i}_roca', [(x, y + h) for x, y in rock_profile(pa + .05, pb - .05, -.12, 1.05, .32, 1.05, n=6, dip=.25)], -1.15, 1.15, voxel=.05, top_keep=h - .3, seed=10 + i)
    pg = cap(f'plat{i}_pasto', pa - .14, pb + .14, h + .015, .26, -1.32, 1.32, seed=20 + i, drip=.8, voxel=.045)
    plats.append((pr, pg, h))
# Árboles, arbustos, rocas, cristales, hongos y ruina atrás (z negativo = detrás de los peleadores).
trees = [tree(f'arbol{i}', x, z, s, 40 + i) for i, (x, z, s) in enumerate([(-7.0, -1.85, 1.15), (6.7, -1.8, 1.3), (3.5, -2.0, .9), (-3.5, -2.05, .85)])]
bushes = [bush(f'arbusto{i}', x, -2.05 - (i % 2) * .12, .7 + (i % 3) * .18, 60 + i) for i, x in enumerate([-6.1, -4.6, -2.4, -0.4, 1.9, 4.4, 5.6, 7.4])]
rocks = [boulder(f'piedra{i}', x, y, z, s, 80 + i) for i, (x, y, z, s) in enumerate([(-7.6, .15, -1.2, .9), (7.5, .12, -1.0, .75), (-1.9, .1, -1.75, .55), (2.6, .1, -1.6, .5), (-4.3, 3.3, -.85, .5), (4.6, 3.3, -.8, .45)])]
cryst = [crystal_cluster('cristal0', -5.3, 0, -1.55, .9, 91), crystal_cluster('cristal1', 5.2, 0, -1.6, .8, 92)]
cryst += [crystal_cluster(f'cristal_pl{i}', (pa + pb) / 2, h - 1.05, 0, .7, 95 + i, down=True) for i, (pa, pb, h) in enumerate([(-5.8, -1.8, 3.2), (1.8, 5.8, 3.2), (-2, 2, 6.2)])]
cryst.append(crystal_cluster('cristal_arco', 0, 3.25, -2.1, .8, 99))
mush = [mushroom(f'hongo{i}', x, z, s) for i, (x, z, s) in enumerate([(-6.2, 1.95, .9), (6.2, -1.25, 1.1), (1.5, -1.6, .75), (-2.9, 3.2 - 3.2 + -0.6, .6)])]
arch = []
for sgn in (-1, 1):
    for k in range(4): arch.append(block(f'arco{sgn}_{k}', sgn * 1.35 + random.uniform(-.04, .04), .33 + k * .65, -2.15 + random.uniform(-.03, .03), .62, .6, .62, .07, .045, k))
arch += [block('arco_l0', -.85, 2.85, -2.15, 1.95, .5, .76, .07, .05, 8), block('arco_l1', .95, 2.88, -2.15, 1.75, .48, .74, .07, .05, 9)]
arch.append(block('arco_base', 0, .08, -2.15, 3.9, .16, .9, .04, .02, 10))
tufts = [tuft(f'mata{i}', -8.1 + i * .48 + random.uniform(-.1, .1), 0, 2.38 + random.uniform(-.06, .06), 1.0, 200 + i) for i in range(34)]
tufts += [tuft(f'matab{i}', -8.1 + i * .55 + random.uniform(-.1, .1), 0, -2.35 + random.uniform(-.06, .06), 1.2, 300 + i) for i in range(30)]
for j, (pa, pb, h) in enumerate([(-5.8, -1.8, 3.2), (1.8, 5.8, 3.2), (-2, 2, 6.2)]):
    tufts += [tuft(f'matap{j}_{i}', pa + (pb - pa) * (i + .5) / 8, h, 1.25 if i % 2 else -1.25, .85, 400 + j * 10 + i) for i in range(8)]
flowers = []
cols = [(1, 1, 1), (1, .85, .25), (1, .55, .75), (.75, .65, 1), (1, .65, .35)]
for i in range(70):
    front = i % 2; x = random.uniform(-7.7, 7.7); z = random.uniform(1.55, 2.3) if front else random.uniform(-1.4, -2.2)
    f = ico(f'flor{i}', B(x, .07, z), .07, 1); f.scale = (1, 1, .6); apply_transform(f); c = cols[i % 5]; paint(f, lambda co, n, c=c: c); flowers.append(f)

# ---------- Horneado de colores (las sombras de rincón ven todo el escenario) ----------
# Roca y pasto: primero se aligeran y después se hornean a textura (así las grietas quedan nítidas).
rock_hi = rock; rock = duplicate(rock_hi, 'isla_roca_lo'); decimate(rock, .26); smooth_shade(rock, 40); uv_unwrap(rock, .003, 66)
rock_img = bake_hi_lo(rock_hi, rock, bake_material('roca_bake', rock_colors(-.12, 6)), 2048, 'roca_tex', 'EMIT', 20)
rock_nrm = bake_hi_lo(rock_hi, rock, None, 1024, 'roca_nrm', 'NORMAL', 4)
bpy.data.objects.remove(rock_hi); rock.name = 'isla_roca'
decimate(grass, .16); smooth_shade(grass, 60); uv_unwrap(grass)
grass_img = bake_texture(grass, bake_material('pasto_bake', grass_colors(.015)), 1024, 'pasto_tex', 16)
plat_imgs = []
for i, (pr, pg, h) in enumerate(plats):
    pr_hi = pr; pr = duplicate(pr_hi, f'plat{i}_roca_lo'); decimate(pr, .35); smooth_shade(pr, 40); uv_unwrap(pr, .004, 60)
    ri = bake_hi_lo(pr_hi, pr, bake_material(f'p{i}_bake', rock_colors(h - .12, 1.05 - h)), 512, f'p{i}_tex', 'EMIT', 16)
    rn = bake_hi_lo(pr_hi, pr, None, 512, f'p{i}_nrm', 'NORMAL', 4)
    bpy.data.objects.remove(pr_hi); pr.name = f'plat{i}_roca'; plats[i] = (pr, pg, h)
    decimate(pg, .2); smooth_shade(pg, 60); uv_unwrap(pg)
    gi = bake_texture(pg, bake_material(f'pg{i}_bake', grass_colors(h + .015)), 512, f'pg{i}_tex', 12)
    plat_imgs.append((ri, gi, rn))
trunks = join([t[0] for t in trees], 'troncos'); crowns = join([t[1] for t in trees], 'copas')
bake_vertex_colors(trunks, bake_material('tronco_bake', simple_colors([(0, '#4a2e22'), (1, '#9a6a44')], 0, 2.2, .4)), 12)
bake_vertex_colors(crowns, bake_material('copa_bake', leaf_colors(.9, 4.2)), 16)
bushes = join(bushes, 'arbustos'); bake_vertex_colors(bushes, bake_material('arbusto_bake', leaf_colors(0, 1.0)), 14)
rocks = join(rocks, 'piedras'); bake_vertex_colors(rocks, bake_material('piedra_bake', simple_colors([(0, '#8a6a5a'), (1, '#d8b488')], -.2, 3.8, .35)), 14)
arch = join(arch, 'ruina'); decimate(arch, .15); arch_img = bake_tex_obj(arch, stone_colors(0, 3.2), 512, 'ruina_tex', 14)
stems = join([m[0] for m in mush], 'hongos_pie'); paint(stems, lambda co, n: lerp3((.85, .78, .62), (1, .97, .9), co.z * 3))
caps = join([m[1] for m in mush], 'hongos_sombrero'); bake_vertex_colors(caps, bake_material('hongo_bake', dots_colors('#e8483a', '#fff6ea', 0, 1)), 10)
cryst = join(cryst, 'cristales'); paint(cryst, lambda co, n: lerp3((.05, .55, .95), (.6, .95, 1.0), .35 + .65 * max(0, n.z)))
tufts = join(tufts, 'matas'); paint(tufts, lambda co, n: lerp3((.12, .42, .2), (.62, .9, .32), ((co.z % 3.2) if co.z > 2 else co.z) / .34))
flowers = join(flowers, 'flores')

# ---------- Aligerar y materiales finales ----------
for o, ratio, ang in [(trunks, .4, 50), (crowns, .3, 60), (bushes, .28, 60), (rocks, .4, 40), (caps, .5, 70), (stems, .6, 60)]:
    decimate(o, ratio); smooth_shade(o, ang)
rock.data.materials.clear(); rock.data.materials.append(pbr_material('roca', rock_img, rock_nrm, .9, 1.0))
grass.data.materials.clear(); grass.data.materials.append(textured_material('pasto', grass_img, .95))
finish(trunks, 'tronco', rough=.9); finish(crowns, 'hojas', rough=.8); finish(bushes, 'arbustos', rough=.85)
finish(rocks, 'piedras', rough=.9); smooth_shade(arch, 40); arch.data.materials.clear(); arch.data.materials.append(textured_material('ruina', arch_img, .8)); finish(stems, 'pie', rough=.7); finish(caps, 'sombrero', rough=.45); finish(tufts, 'matas', rough=.9); finish(flowers, 'flores', rough=.6)
finish(cryst, 'cristales', rough=.15, emissive=(.05, .55, 1.0), strength=1.1)
for (pr, pg, h), (ri, gi, rn) in zip(plats, plat_imgs):
    pr.data.materials.clear(); pr.data.materials.append(pbr_material(pr.name, ri, rn, .9, 1.0)); pg.data.materials.clear(); pg.data.materials.append(textured_material(pg.name, gi, .95))
allp = [rock, grass, trunks, crowns, bushes, rocks, arch, stems, caps, cryst, tufts, flowers] + [o for pr, pg, h in plats for o in (pr, pg)]
for p in allp: print(p.name, len(p.data.vertices))
for o in allp: o.select_set(o in allp)
bpy.ops.export_scene.gltf(filepath=f'{OUT}/isla.glb', export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_image_format='JPEG', export_jpeg_quality=88)
bpy.ops.wm.save_as_mainfile(filepath=f'{OUT}/isla.blend')
print('listo')
