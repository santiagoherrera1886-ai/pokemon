# Templo del Alba de la Pelea hecho en Blender: piso de baldosas de mármol con franja dorada, muro de bloques
# tallados con enredaderas, roca cálida que se angosta hacia abajo con cristales dorados, columnas con estrías
# (dos rotas), portal con sol dorado y estandartes, braseros encendidos y cerezos en flor. Igual de ancho que el choque.
import os, sys, math, random
import bpy, bmesh
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from stagelib import *
sc = clear(); random.seed(5)

A, Z, DEPTH, FRM, SLOPE = -9.5, 9.5, 5.6, 1.6, 1.35
ROCK = ('#4a3050', '#7a4a5e', '#b8806e', '#dcae88', '#f0d0a8')

# Piso: losa de mármol (arriba en y=0.015), franja dorada al frente.
slab = block('piso', 0, -.2, 0, 19.3, .43, 5.0, .06)
gold = [block('franja', 0, -.25, 2.515, 19.32, .085, .05, .015), block('franja_atras', 0, -.25, -2.515, 19.32, .085, .05, .015)]
# Muro de bloques debajo del piso (se ve al frente y en los lados) y un núcleo que tapa los huecos.
rnd = random.Random(3); wall = [block('nucleo', 0, -1.05, 0, 18.7, 1.25, 4.5, .02)]
for row in range(2):
    yc = -.42 - .33 - row * .66; x = A + .1
    first = True
    while x < Z - .15:
        w = rnd.uniform(.55, .95) if (first and row % 2) else rnd.uniform(1.15, 1.8); w = min(w, Z - .1 - x)
        if w < .4: break
        wall.append(block(f'muro{row}_{len(wall)}', x + w / 2, yc + rnd.uniform(-.015, .015), 2.12, w - .05, .62, .5, .07, .035, rnd.randint(0, 9999))); x += w; first = False
    for sgn in (-1, 1):
        zz = -2.25
        while zz < 2.3:
            d = min(rnd.uniform(1.1, 1.6), 2.35 - zz)
            wall.append(block(f'lado{row}_{sgn}_{len(wall)}', sgn * 9.22, yc, zz + d / 2, .5, .62, d - .05, .07, .035, rnd.randint(0, 9999))); zz += d
# Roca natural debajo del muro.
rock = chunky_rock('templo_roca', rock_profile(A + .2, Z - .2, -1.5, DEPTH, FRM, SLOPE), -2.2, 2.2, top_keep=-1.85, seed=3)
# Columnas atrás (dos rotas) y un tambor caído.
cols = []
for i, x in enumerate([-8.6, -6.3, -4.0, 4.0, 6.3, 8.6]):
    br = i in (1, 4)
    cols += column(f'col{i}', x, -1.95, (1.7 if i == 1 else 2.4) if br else 3.7, 70 + i, broken=br)
from mathutils import Matrix
drum = column('tambor', 0, 0, .75, 79)[2]; drum.data.transform(Matrix.Translation(-sum((Vector(v) for v in drum.bound_box), Vector()) / 8))
drum.rotation_euler = (0, math.radians(90), math.radians(-14)); drum.location = B(-5.1, .34, -1.15); apply_transform(drum); cols.append(drum)
for o in list(sc.objects):
    if o.name.startswith('tambor') and o is not drum: bpy.data.objects.remove(o)
# Portal del centro con el sol dorado y estandartes.
gate = [block('pilar0', -1.62, 2.3, -2.15, .82, 4.6, .82, .06, .03, 1), block('pilar1', 1.62, 2.3, -2.15, .82, 4.6, .82, .06, .03, 2),
        block('dintel', 0, 4.9, -2.15, 4.5, .6, .96, .06, .03, 3), block('cornisa', 0, 5.29, -2.15, 4.95, .18, 1.12, .05, .02, 4),
        block('escalon', 0, .07, -1.95, 3.0, .14, .7, .04, .015, 5)]
sun = [cyl('sol', B(0, 3.55, -1.66), B(0, 3.55, -1.78), .64, .64, 48), cyl('sol_centro', B(0, 3.55, -1.6), B(0, 3.55, -1.66), .42, .45, 48)]
for k in range(16):
    a = k / 16 * math.tau; L = 1.12 if k % 2 == 0 else .92
    sun.append(cyl(f'rayo{k}', B(math.cos(a) * .66, 3.55 + math.sin(a) * .66, -1.72), B(math.cos(a) * L, 3.55 + math.sin(a) * L, -1.72), .085 if k % 2 == 0 else .06, .01, 4))
banners = [banner(f'estandarte{i}', s * 1.62, 4.58, -1.66, seed=i) for i, s in enumerate((-1, 1))]
braz = [brazier(f'brasero{i}', s * 3.0, -1.55, 1.0) for i, s in enumerate((-1, 1))]
# Cerezos en flor en las puntas, arbustos atrás, enredaderas en el muro y pétalos en el piso.
trees = [tree('cerezo0', -9.0, -1.35, 1.12, 21), tree('cerezo1', 9.05, -1.5, 1.0, 22)]
bushes = [bush(f'arbusto{i}', x, -2.35, .55 + (i % 3) * .15, 30 + i) for i, x in enumerate([-7.5, -5.2, -2.8, 2.8, 5.2, 7.5])]
vines = [vine(f'enredadera{i}', x, -.36, 2.42, n, 50 + i) for i, (x, n) in enumerate([(-8.4, 7), (-6.9, 4), (-3.7, 6), (-.9, 3), (2.2, 7), (4.6, 4), (7.3, 8), (8.9, 5)])]
petals = []
pcols = [(1, .78, .86), (1, .9, .94), (.98, .62, .76), (1, 1, 1)]
for i in range(80):
    side = i % 3; x = random.uniform(-9.2, 9.2) if side else random.choice([random.uniform(-9.3, -7.8), random.uniform(7.8, 9.3)])
    zz = random.uniform(-2.3, -1.3) if side else random.uniform(-1.2, 2.3)
    f = ico(f'petalo{i}', B(x, .03, zz), .06, 1); f.scale = (1.3, 1, .3); apply_transform(f); c = pcols[i % 4]; paint(f, lambda co, n, c=c: c); petals.append(f)
def under(x):  # altura del fondo de la roca en x (el perfil baja en curva en el centro)
    xl, xr = A + .2 + (DEPTH - FRM) * SLOPE, Z - .2 - (DEPTH - FRM) * SLOPE; t = max(0.0, min(1.0, (x - xr) / (xl - xr)))
    return -DEPTH - math.sin(t * math.pi) * .5 + .08
cryst = [crystal_cluster(f'cristal{i}', x, under(x), z, s, 90 + i, down=True) for i, (x, z, s) in enumerate([(-2.2, .5, 1.0), (1.6, -.4, .85), (3.0, .7, .6), (-3.2, -.6, .55)])]

# ---------- Horneado (las sombras de rincón ven todo el escenario) ----------
slab_img = bake_tex_obj(slab, marble_floor(), 2048, 'piso_tex', 16, .003, 60)
wall = join(wall, 'muro'); decimate(wall, .1)
wall_img = bake_tex_obj(wall, stone_colors(-1.8, -.4, ('#9a7a64', '#c4a283', '#e2c8a4'), moss='#5f9c3a', moss_amt=.7, ao_dist=.4, edge=.5, dark='#4a2e36'), 1024, 'muro_tex', 14)
rock_hi = rock; rock = duplicate(rock_hi, 'templo_roca_lo'); decimate(rock, .26); smooth_shade(rock, 40); uv_unwrap(rock, .003, 66)
rock_img = bake_hi_lo(rock_hi, rock, bake_material('roca_bake', rock_colors(-1.5, DEPTH, ROCK, crack='#3a1a2a', edge=(1.0, .82, .66))), 2048, 'troca_tex', 'EMIT', 20)
rock_nrm = bake_hi_lo(rock_hi, rock, None, 1024, 'troca_nrm', 'NORMAL', 4)
bpy.data.objects.remove(rock_hi); rock.name = 'templo_roca'
cols = join(cols, 'columnas'); decimate(cols, .35)
cols_img = bake_tex_obj(cols, marble_colors(0, 4.6), 1024, 'columnas_tex', 14, .003, 66)
gate = join(gate, 'portal'); decimate(gate, .3)
gate_img = bake_tex_obj(gate, marble_colors(0, 5.4, ('#cdb8a8', '#eadccc', '#f8f0e4'), edge=.5), 1024, 'portal_tex', 14, .003, 60)
trunks = join([t[0] for t in trees], 'troncos'); crowns = join([t[1] for t in trees], 'copas')
bake_vertex_colors(trunks, bake_material('tronco_bake', simple_colors([(0, '#3a2228'), (1, '#7a5040')], 0, 2.2, .4)), 12)
bake_vertex_colors(crowns, bake_material('copa_bake', blossom_colors(.9, 4.0)), 16)
bushes = join(bushes, 'arbustos'); bake_vertex_colors(bushes, bake_material('arbusto_bake', leaf_colors(0, 1.0)), 12)
vines = join(vines, 'enredaderas'); bake_vertex_colors(vines, bake_material('enred_bake', leaf_colors(-1.6, -.3)), 10)
goldp = join(gold + sun + [p for b_, f_ in braz for p in b_], 'oro'); paint(goldp, lambda co, n: (1.0, .7, .22))
flames = join([f_ for b_, f_ in braz], 'llamas'); paint(flames, lambda co, n: lerp3((1.0, .3, .03), (1.0, .62, .12), (co.z - .95) / .7))
banners = join(banners, 'estandartes'); petals = join(petals, 'petalos')
ban_img = bake_texture(banners, bake_material('tela_bake', banner_colors()), 512, 'tela_tex', 4)
cryst = join(cryst, 'cristales'); paint(cryst, lambda co, n: lerp3((1.0, .55, .12), (1.0, .92, .55), .3 + .7 * max(0, -n.z)))

# ---------- Aligerar y materiales finales ----------
for o, ratio, ang in [(trunks, .4, 50), (crowns, .3, 60), (bushes, .3, 60), (vines, .5, 60)]:
    decimate(o, ratio); smooth_shade(o, ang)
smooth_shade(slab, 30); smooth_shade(wall, 40); smooth_shade(cols, 40); smooth_shade(gate, 35); smooth_shade(goldp, 35); smooth_shade(banners, 60); smooth_shade(flames, 70)
slab.data.materials.clear(); slab.data.materials.append(textured_material('piso', slab_img, .38))
wall.data.materials.clear(); wall.data.materials.append(textured_material('muro', wall_img, .85))
rock.data.materials.clear(); rock.data.materials.append(pbr_material('roca_templo', rock_img, rock_nrm, .88, 1.0))
cols.data.materials.clear(); cols.data.materials.append(textured_material('columnas', cols_img, .45))
gate.data.materials.clear(); gate.data.materials.append(textured_material('portal', gate_img, .5))
finish(trunks, 'tronco', rough=.9); finish(crowns, 'flores_cerezo', rough=.75); finish(bushes, 'arbustos', rough=.85); finish(vines, 'enredaderas', rough=.85)
finish(goldp, 'oro', rough=.3, metallic=1.0, emissive=(1.0, .62, .16), strength=.22)
finish(flames, 'fuego', rough=.5, emissive=(1.0, .32, .03), strength=.95)
banners.data.materials.clear(); banners.data.materials.append(textured_material('tela', ban_img, .8)); finish(petals, 'petalos', rough=.6)
finish(cryst, 'cristales_oro', rough=.15, emissive=(1.0, .6, .15), strength=1.3)
allp = [slab, wall, rock, cols, gate, trunks, crowns, bushes, vines, goldp, flames, banners, petals, cryst]
for p in allp: print(p.name, len(p.data.vertices))
for o in sc.objects: o.select_set(o in allp)
bpy.ops.export_scene.gltf(filepath=f'{OUT}/templo.glb', export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_image_format='JPEG', export_jpeg_quality=88)
bpy.ops.wm.save_as_mainfile(filepath=f'{OUT}/templo.blend')
print('listo')
