# Isla Flotante de la Pelea hecha en Blender: roca en bloques con grietas, colores cálidos arriba y morados abajo,
# sombras de rincón horneadas, bordes iluminados y pasto que chorrea. Igual de ancha y profunda que el choque del juego.
import os, sys, math, random
import bpy, bmesh
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(OUT, exist_ok=True)

def rock_profile(a, b, top, depth, frm, slope, n=14, dip=.5):
    pts = [(a, top), (b, top), (b, -frm)]
    for i in range(1, n + 1):
        y = -frm - (depth - frm) * i / n; cut = (-y - frm) * slope
        pts.append((b - cut, y))
    xl, xr = a + (depth - frm) * slope, b - (depth - frm) * slope
    for i in range(1, 6):
        t = i / 6; x = xr + (xl - xr) * t; pts.append((x, -depth - math.sin(t * math.pi) * dip))
    for i in range(n, 0, -1):
        y = -frm - (depth - frm) * i / n; cut = (-y - frm) * slope
        pts.append((a + cut, y))
    pts.append((a, -frm))
    return pts

def smoothstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)

def chunk_displace(obj, scale=1.25, step=.14, tilt=.18, crack=.18, crack_w=.2, weight=None, seed=0):
    """Roca en bloques: cada celda de Voronoi sale o entra un poco y queda inclinada a su manera (caras planas),
    y entre celdas queda una grieta angosta. Se mueve cada vértice por su normal."""
    import numpy as np
    from mathutils import noise
    me = obj.data; n = len(me.vertices)
    co = np.empty(n * 3, 'f4'); me.vertices.foreach_get('co', co); co = co.reshape(n, 3)
    nr = np.empty(n * 3, 'f4'); me.vertex_normals.foreach_get('vector', nr); nr = nr.reshape(n, 3)
    off = Vector((seed * 17.31, seed * 5.13, seed * 9.77)); out = co.copy()
    for i in range(n):
        p = Vector(co[i]); w = weight(p) if weight else 1.0
        if w <= 0: continue
        q = p / scale + off
        d, pts = noise.voronoi(q, distance_metric='DISTANCE'); c = pts[0]
        e = (d[1] - d[0]) * scale
        # Meseta de la celda (altura e inclinación propias). Junto al borde todas bajan al mismo fondo de grieta,
        # así no queda un escalón en zigzag donde se tocan dos celdas.
        facet = max(-.6, min(.6, noise.cell_vector(c + Vector((3.1, 7.7, 1.3))).dot(q - c))) * tilt * scale
        sm = smoothstep(0, crack_w, e)
        o = sm * (noise.cell(c) * step + facet) - (1 - sm) * (step + crack)
        out[i] += nr[i] * (o * w)
    me.vertices.foreach_set('co', out.ravel()); me.update()

def chunky_rock(name, pts, z0, z1, voxel=.045, crack=.18, top_keep=-.35, seed=1, scale=1.25, step=.14, tilt=.18, crack_w=.2):
    obj = prism(name, pts, z0, z1)
    bm = bmesh.new(); bm.from_mesh(obj.data)
    bmesh.ops.bevel(bm, geom=[e for e in bm.edges], offset=.3, segments=3, affect='EDGES', profile=.5, clamp_overlap=True)
    bm.to_mesh(obj.data); bm.free()
    r = obj.modifiers.new('remesh', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = voxel
    sm = obj.modifiers.new('smooth0', 'SMOOTH'); sm.factor = .8; sm.iterations = 8
    apply_mods(obj)
    # Ondulación grande para que el contorno no sea perfecto.
    t0 = bpy.data.textures.new(name + '_big', 'CLOUDS'); t0.noise_scale = 1.6
    d0 = obj.modifiers.new('big', 'DISPLACE'); d0.texture = t0; d0.strength = .1; d0.mid_level = .5; d0.texture_coords = 'OBJECT'
    vg = obj.vertex_groups.new(name='disp')
    for v in obj.data.vertices:
        w = max(0.0, min(1.0, (top_keep - v.co.z) / .55)); vg.add([v.index], w * w * (3 - 2 * w), 'REPLACE')
    d0.vertex_group = 'disp'; apply_mods(obj)
    # Bloques y grietas: nada cerca de arriba (va debajo de la tapa), todo más abajo.
    chunk_displace(obj, scale, step, tilt, crack, crack_w, weight=lambda p: smoothstep(top_keep, top_keep - .55, p.z), seed=seed)
    sm = obj.modifiers.new('smooth', 'SMOOTH'); sm.factor = .3; sm.iterations = 2
    apply_mods(obj)
    return obj

def rock_colors(top, depth, pal=('#4a3358', '#7a4a52', '#b8784e', '#dba070', '#efc28c'), crack='#2a1a24', glow=None, edge=(1.0, .85, .62)):
    def build(nt):
        geo = node(nt, 'ShaderNodeNewGeometry'); sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
        mr = node(nt, 'ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -depth - .5; mr.inputs['From Max'].default_value = top
        nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
        base = ramp(nt, [(0, pal[0]), (.3, pal[1]), (.62, pal[2]), (.85, pal[3]), (1, pal[4])], mr.outputs['Result'])
        vor = node(nt, 'ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = .9
        tc = node(nt, 'ShaderNodeTexCoord'); nt.links.new(tc.outputs['Object'], vor.inputs['Vector'])
        var = mix(nt, base, vor.outputs['Color'], .12, 'OVERLAY')
        pt = ramp(nt, [(.49, '#000000'), (.56, '#ffffff')], geo.outputs['Pointiness'])
        lit = mix(nt, var, edge, node_fac(nt, pt, .55), 'SCREEN')
        ao = node(nt, 'ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = .7; ao.samples = 16
        aor = ramp(nt, [(0, '#3a2a4a'), (1, '#ffffff')], ao.outputs['AO'])
        col = mix(nt, lit, aor, .7, 'MULTIPLY')
        ao2 = node(nt, 'ShaderNodeAmbientOcclusion'); ao2.inputs['Distance'].default_value = .12; ao2.samples = 16
        if glow:  # grietas encendidas (lava): el fondo de la grieta queda del color del brillo
            mask = ramp(nt, [(.3, '#ffffff'), (.62, '#000000')], ao2.outputs['AO'])
            return mix(nt, col, hexrgb(glow), node_fac(nt, mask, 1.0), 'MIX')
        crev = ramp(nt, [(.35, crack), (.8, '#ffffff')], ao2.outputs['AO'])
        return mix(nt, col, crev, .9, 'MULTIPLY')
    return build

def node_fac(nt, color_socket, k):
    # Convierte un color a factor (escalado) para usarlo en Mix.
    m = nt.nodes.new('ShaderNodeMath'); m.operation = 'MULTIPLY'; m.inputs[1].default_value = k
    bw = nt.nodes.new('ShaderNodeRGBToBW'); nt.links.new(color_socket, bw.inputs[0]); nt.links.new(bw.outputs[0], m.inputs[0])
    return m.outputs[0]

def cap(name, a, b, top, thick, z0, z1, seed, drip=1.0, voxel=.05):
    rnd = random.Random(seed); base = top - thick * .55; n = max(8, round((b - a) / .45)); pts = [(a, top), (b, top), (b, base)]
    for i in range(n):
        x0 = b - (b - a) * i / n; x1 = b - (b - a) * (i + 1) / n; big = rnd.random() < .42
        drop = (thick * (.9 + rnd.random() * 1.1) if big else thick * (.15 + rnd.random() * .35)) * drip
        for k in range(1, 6):
            t = k / 6; pts.append((x0 + (x1 - x0) * t, base - math.sin(t * math.pi) * drop * 1.05))
        pts.append((x1, base))
    obj = prism(name, pts, z0, z1)
    bm = bmesh.new(); bm.from_mesh(obj.data); bmesh.ops.bevel(bm, geom=[e for e in bm.edges], offset=.07, segments=3, affect='EDGES', profile=.5, clamp_overlap=True); bm.to_mesh(obj.data); bm.free()
    r = obj.modifiers.new('remesh', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = voxel
    sm = obj.modifiers.new('smooth', 'SMOOTH'); sm.factor = .4; sm.iterations = 2
    apply_mods(obj)
    # El piso queda plano a la altura exacta.
    for v in obj.data.vertices:
        if v.co.z > top - .03: v.co.z = top
    return obj

def grass_colors(top, pal=('#24753a', '#46a83f', '#6cc544', '#86d64e'), patch=('#3f9a3a', '#6cc544', '#9ee05c'), fine_pal=('#2f8a3a', '#5cb848', '#b6ea70')):
    def build(nt):
        geo = node(nt, 'ShaderNodeNewGeometry'); sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
        mr = node(nt, 'ShaderNodeMapRange'); mr.inputs['From Min'].default_value = top - .75; mr.inputs['From Max'].default_value = top
        nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
        base = ramp(nt, [(0, pal[0]), (.55, pal[1]), (.9, pal[2]), (1, pal[3])], mr.outputs['Result'])
        nz = node(nt, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = .55; nz.inputs['Detail'].default_value = 3
        tc = node(nt, 'ShaderNodeTexCoord'); nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        patches = ramp(nt, [(.4, patch[0]), (.5, patch[1]), (.62, patch[2])], nz.outputs['Fac'])
        var = mix(nt, base, patches, .35, 'MIX')
        fine = node(nt, 'ShaderNodeTexNoise'); fine.inputs['Scale'].default_value = 26; fine.inputs['Detail'].default_value = 2; nt.links.new(tc.outputs['Object'], fine.inputs['Vector'])
        var = mix(nt, var, ramp(nt, [(.35, fine_pal[0]), (.5, fine_pal[1]), (.68, fine_pal[2])], fine.outputs['Fac']), .28, 'MIX')
        ao = node(nt, 'ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = .4; ao.samples = 16
        aor = ramp(nt, [(0, '#204a30'), (1, '#ffffff')], ao.outputs['AO'])
        return mix(nt, var, aor, .8, 'MULTIPLY')
    return build

def decimate(obj, ratio):
    d = obj.modifiers.new('dec', 'DECIMATE'); d.ratio = ratio; apply_mods(obj)


# ---------- Utilidades de color sin hornear ----------
def paint(obj, fn):
    me = obj.data; attr = me.color_attributes.new(name='Col', type='BYTE_COLOR', domain='POINT')
    for v in me.vertices:
        c = fn(v.co, v.normal); attr.data[v.index].color = (*c, 1)
    me.color_attributes.active_color = attr
def lerp3(a, b, t):
    t = max(0.0, min(1.0, t)); return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))

def leaf_colors(z0, z1):
    def build(nt):
        geo = node(nt, 'ShaderNodeNewGeometry'); sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
        mr = node(nt, 'ShaderNodeMapRange'); mr.inputs['From Min'].default_value = z0; mr.inputs['From Max'].default_value = z1; nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
        base = ramp(nt, [(0, '#1f5a4a'), (.35, '#2f8a44'), (.7, '#5cb848'), (1, '#b2e264')], mr.outputs['Result'])
        nz = node(nt, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 2.2; tc = node(nt, 'ShaderNodeTexCoord'); nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        var = mix(nt, base, ramp(nt, [(.35, '#2a7a40'), (.65, '#9ad85a')], nz.outputs['Fac']), .25, 'MIX')
        pt = ramp(nt, [(.5, '#000000'), (.56, '#ffffff')], geo.outputs['Pointiness'])
        lit = mix(nt, var, (.85, 1.0, .55), node_fac(nt, pt, .45), 'SCREEN')
        ao = node(nt, 'ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = .8; ao.samples = 16
        return mix(nt, lit, ramp(nt, [(0, '#12302a'), (1, '#ffffff')], ao.outputs['AO']), .9, 'MULTIPLY')
    return build
def simple_colors(stops, z0, z1, ao_dist=.5, moss=None):
    def build(nt):
        geo = node(nt, 'ShaderNodeNewGeometry'); sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
        mr = node(nt, 'ShaderNodeMapRange'); mr.inputs['From Min'].default_value = z0; mr.inputs['From Max'].default_value = z1; nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
        col = ramp(nt, stops, mr.outputs['Result'])
        if moss:
            nsep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Normal'], nsep.inputs[0])
            mk = node(nt, 'ShaderNodeMapRange'); mk.inputs['From Min'].default_value = .55; mk.inputs['From Max'].default_value = .85; nt.links.new(nsep.outputs['Z'], mk.inputs['Value'])
            col = mix(nt, col, hexrgb(moss), mk.outputs['Result'], 'MIX')
        pt = ramp(nt, [(.49, '#000000'), (.56, '#ffffff')], geo.outputs['Pointiness'])
        col = mix(nt, col, (1.0, .95, .85), node_fac(nt, pt, .4), 'SCREEN')
        ao = node(nt, 'ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = ao_dist; ao.samples = 16
        return mix(nt, col, ramp(nt, [(0, '#2a2030'), (1, '#ffffff')], ao.outputs['AO']), .85, 'MULTIPLY')
    return build
def dots_colors(base_hex, dot_hex, z0, z1):
    def build(nt):
        geo = node(nt, 'ShaderNodeNewGeometry'); vor = node(nt, 'ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 7
        tc = node(nt, 'ShaderNodeTexCoord'); nt.links.new(tc.outputs['Object'], vor.inputs['Vector'])
        dots = ramp(nt, [(.16, '#ffffff'), (.2, '#000000')], vor.outputs['Distance'])
        col = mix(nt, hexrgb(base_hex), hexrgb(dot_hex), node_fac(nt, dots, 1.0), 'MIX')
        pt = ramp(nt, [(.5, '#000000'), (.56, '#ffffff')], geo.outputs['Pointiness'])
        col = mix(nt, col, (1, 1, 1), node_fac(nt, pt, .35), 'SCREEN')
        ao = node(nt, 'ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = .15; ao.samples = 16
        return mix(nt, col, ramp(nt, [(0, '#80303a'), (1, '#ffffff')], ao.outputs['AO']), .5, 'MULTIPLY')
    return build

# ---------- Objetos ----------
def tree(name, x, z, s, seed):
    rnd = random.Random(seed); base = B(x, 0, z); parts = []; p = base.copy(); r = .2 * s
    for i in range(4):
        q = p + Vector((rnd.uniform(-.12, .12) * s, rnd.uniform(-.06, .06) * s, .42 * s)); parts.append(cyl(f'{name}_t{i}', p, q, r, r * .8, 10)); p = q; r *= .8
    for k in range(4):
        a = k * math.pi / 2 + rnd.uniform(-.4, .4); parts.append(cyl(f'{name}_r{k}', base + Vector((0, 0, .18 * s)), base + Vector((math.cos(a) * .42 * s, math.sin(a) * .42 * s, -.04)), .1 * s, .03 * s, 8))
    trunk = join(parts, name + '_tronco'); remesh(trunk, .03 * s, .5, 3)
    blobs = [ico(f'{name}_b{k}', p + Vector((dx, dy, dz)) * s, rr * s * rnd.uniform(.92, 1.08), 3) for k, (dx, dy, dz, rr) in enumerate([(0, 0, .5, 1.0), (.62, .1, .22, .72), (-.6, -.12, .28, .74), (.1, .05, 1.05, .7), (0, .5, .32, .62), (-.25, -.45, .72, .58)])]
    crown = join(blobs, name + '_copa'); remesh(crown, .055 * s, .5, 2); displace(crown, 'CLOUDS', .3 * s, .14 * s)
    return trunk, crown, (p.z - .4 * s, p.z + 1.9 * s)
def bush(name, x, z, s, seed):
    rnd = random.Random(seed); c = B(x, 0, z)
    blobs = [ico(f'{name}_{k}', c + Vector(((k - 1.5) * .4 * s, rnd.uniform(-.15, .15) * s, (.25 + rnd.random() * .15) * s)), (.42 + rnd.random() * .22) * s, 3) for k in range(4)]
    o = join(blobs, name); remesh(o, .05 * s, .5, 2); displace(o, 'CLOUDS', .25 * s, .1 * s); return o
def boulder(name, x, y, z, s, seed):
    # Se arma en el origen, se deforma y después se pone en su sitio (si no, la escala y el giro la mueven de lugar).
    rnd = random.Random(seed); o = ico(name, Vector((0, 0, 0)), .5 * s, 3); o.scale = (rnd.uniform(.9, 1.3), rnd.uniform(.8, 1.1), rnd.uniform(.6, .85)); o.rotation_euler = (0, 0, rnd.random() * 6); o.location = B(x, y, z); apply_transform(o)
    remesh(o, max(.03, .04 * s), 0); displace(o, 'VORONOI', .45 * s, -.12 * s, 0, distance_metric='DISTANCE', weight_1=-1, weight_2=1, weight_3=0, weight_4=0, noise_intensity=1.5)
    displace(o, 'VORONOI', .4 * s, .1 * s, .5, distance_metric='DISTANCE'); sm = o.modifiers.new('s', 'SMOOTH'); sm.factor = .5; sm.iterations = 2; apply_mods(o); return o
def crystal_cluster(name, x, y, z, s, seed, down=False):
    rnd = random.Random(seed); parts = []
    for k in range(rnd.randint(3, 5)):
        h = (.5 + rnd.random() * .7) * s * (1.3 if k == 0 else 1); rr = (.09 + rnd.random() * .06) * s
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=rr, radius2=rr * .92, depth=h)
        tip = bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=rr * .92, radius2=0, depth=rr * 2.2)
        for v in tip['verts']: v.co.z += h / 2 + rr * 1.1
        o = mesh_from_bm(f'{name}_{k}', bm)
        tilt = 0 if k == 0 else rnd.uniform(.25, .6); a = rnd.random() * 6.28
        o.rotation_euler = (math.cos(a) * tilt + (math.pi if down else 0), math.sin(a) * tilt, rnd.random()); o.location = B(x, y, z) + Vector((0, 0, (-h / 2 if down else h / 2) * .85)); apply_transform(o); parts.append(o)
    return join(parts, name)
def mushroom(name, x, z, s):
    stem = cyl(name + '_pie', B(x, 0, z), B(x, .34 * s, z), .12 * s, .09 * s, 16); remesh(stem, .02 * s, .5, 2)
    cap = ico(name + '_som', B(x, .3 * s, z), .32 * s, 5)
    for v in cap.data.vertices:  # cúpula: la mitad de abajo se aplana como el borde del sombrero
        if v.co.z < B(x, .3 * s, z).z: v.co.z = B(x, .3 * s, z).z + (v.co.z - B(x, .3 * s, z).z) * .18
        else: v.co.z = B(x, .3 * s, z).z + (v.co.z - B(x, .3 * s, z).z) * .8
    return stem, cap
def tuft(name, x, y, z, s, seed):
    rnd = random.Random(seed); parts = []
    for k in range(7):
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=3, radius1=.035 * s, radius2=0, depth=(.22 + rnd.random() * .16) * s)
        o = mesh_from_bm(f'{name}_{k}', bm); h = o.dimensions.z
        o.location = B(x + rnd.uniform(-.08, .08) * s, y + h / 2 * .9, z + rnd.uniform(-.06, .06) * s); o.rotation_euler = (rnd.uniform(-.45, .45), rnd.uniform(-.45, .45), rnd.random() * 6); apply_transform(o); parts.append(o)
    return join(parts, name)
def block(name, x, y, z, w, h, d, bevel=.06, chip=0.0, seed=0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1); o = mesh_from_bm(name, bm); o.scale = (w, d, h); o.location = B(x, y, z); apply_transform(o)
    b = o.modifiers.new('bev', 'BEVEL'); b.width = bevel; b.segments = 3
    if chip:  # piedra tallada a mano: superficie un poco irregular y esquinas mordidas
        sd = o.modifiers.new('sub', 'SUBSURF'); sd.subdivision_type = 'SIMPLE'; sd.levels = 3
        t = bpy.data.textures.new(name + '_chip', 'CLOUDS'); t.noise_scale = .32
        d1 = o.modifiers.new('chip', 'DISPLACE'); d1.texture = t; d1.strength = chip; d1.mid_level = .5; d1.texture_coords = 'OBJECT'
        t2 = bpy.data.textures.new(name + '_bite', 'VORONOI'); t2.distance_metric = 'DISTANCE'; t2.noise_scale = .5; t2.noise_intensity = 2.2
        d2 = o.modifiers.new('bite', 'DISPLACE'); d2.texture = t2; d2.strength = chip * 1.4; d2.mid_level = 1.0; d2.texture_coords = 'OBJECT'
    apply_mods(o); return o


# ---------- Luz propia (lava, cristales) ----------
def glow_mask(top, depth, glow='#ff6a1a', hot='#ffd27a', ao_dist=.16, lo=.3, hi=.55, tip=0.0, tip_h=2.4):
    """Para hornear la luz propia de la roca: color del brillo en el fondo de las grietas, negro en lo demás."""
    def build(nt):
        geo = node(nt, 'ShaderNodeNewGeometry'); sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
        ao = node(nt, 'ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = ao_dist; ao.samples = 16
        m = ramp(nt, [(lo, '#ffffff'), (hi, '#000000')], ao.outputs['AO'])
        col = mix(nt, (0.0, 0.0, 0.0), hexrgb(glow), node_fac(nt, m, 1.0), 'MIX')
        m2 = ramp(nt, [(lo * .5, '#ffffff'), (lo * .85, '#000000')], ao.outputs['AO'])
        col = mix(nt, col, hexrgb(hot), node_fac(nt, m2, 1.0), 'MIX')
        if tip:  # la punta de abajo brilla como magma
            mr = node(nt, 'ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -depth - .3; mr.inputs['From Max'].default_value = -depth + tip_h
            mr.inputs['To Min'].default_value = tip; mr.inputs['To Max'].default_value = 0.0; nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
            col = mix(nt, col, hexrgb(glow), mr.outputs['Result'], 'LIGHTEN')
        return col
    return build

def crust_colors(top, base=('#1e1618', '#30232a', '#4a3a3a'), ash='#7a6a66', hot='#d2440c'):
    """Costra de lava fría arriba; donde chorrea por el borde se pone naranja."""
    def build(nt):
        geo = node(nt, 'ShaderNodeNewGeometry'); sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
        mr = node(nt, 'ShaderNodeMapRange'); mr.inputs['From Min'].default_value = top - .75; mr.inputs['From Max'].default_value = top
        nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
        col = ramp(nt, [(0, hot), (.32, '#6a2a18'), (.55, base[0]), (.9, base[1]), (1, base[2])], mr.outputs['Result'])
        tc = node(nt, 'ShaderNodeTexCoord')
        nz = node(nt, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = .7; nz.inputs['Detail'].default_value = 3; nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        col = mix(nt, col, ramp(nt, [(.42, base[1]), (.62, ash)], nz.outputs['Fac']), .3, 'MIX')
        fine = node(nt, 'ShaderNodeTexNoise'); fine.inputs['Scale'].default_value = 24; nt.links.new(tc.outputs['Object'], fine.inputs['Vector'])
        col = mix(nt, col, ramp(nt, [(.35, '#1a1214'), (.7, ash)], fine.outputs['Fac']), .22, 'MIX')
        vor = node(nt, 'ShaderNodeTexVoronoi'); vor.feature = 'DISTANCE_TO_EDGE'; vor.inputs['Scale'].default_value = .85; nt.links.new(tc.outputs['Object'], vor.inputs['Vector'])
        col = mix(nt, col, ramp(nt, [(0, '#ff6a1a'), (.03, '#7a2a14'), (.07, '#ffffff')], vor.outputs['Distance']), .55, 'MULTIPLY')
        pt = ramp(nt, [(.5, '#000000'), (.56, '#ffffff')], geo.outputs['Pointiness'])
        col = mix(nt, col, (1.0, .7, .5), node_fac(nt, pt, .3), 'SCREEN')
        ao = node(nt, 'ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = .4; ao.samples = 16
        return mix(nt, col, ramp(nt, [(0, '#1a0e10'), (1, '#ffffff')], ao.outputs['AO']), .8, 'MULTIPLY')
    return build

def crust_glow(top, lines=.45, glow='#ff6a1a', hot='#ffcf6a'):
    def build(nt):
        geo = node(nt, 'ShaderNodeNewGeometry'); sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
        mr = node(nt, 'ShaderNodeMapRange'); mr.inputs['From Min'].default_value = top - .22; mr.inputs['From Max'].default_value = top - .9
        nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
        drip = ramp(nt, [(0, '#000000'), (.35, glow), (1, hot)], mr.outputs['Result'])
        tc = node(nt, 'ShaderNodeTexCoord')
        vor = node(nt, 'ShaderNodeTexVoronoi'); vor.feature = 'DISTANCE_TO_EDGE'; vor.inputs['Scale'].default_value = .85; nt.links.new(tc.outputs['Object'], vor.inputs['Vector'])
        ln = ramp(nt, [(0, glow), (.028, '#000000')], vor.outputs['Distance'])
        return mix(nt, drip, ln, lines, 'LIGHTEN')
    return build

# ---------- Volcán ----------
def hex_column(name, x, z, r, h, seed, y0=-.2):
    rnd = random.Random(seed)
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=r, radius2=r * rnd.uniform(.9, 1.0), depth=h)
    o = mesh_from_bm(name, bm); kx, ky = rnd.uniform(-.3, .3), rnd.uniform(-.3, .3)
    for v in o.data.vertices:
        if v.co.z > 0: v.co.z += v.co.x * kx + v.co.y * ky
    o.location = B(x, y0 + h / 2, z); o.rotation_euler = (rnd.uniform(-.05, .05), rnd.uniform(-.05, .05), rnd.random() * 6.28); apply_transform(o)
    b = o.modifiers.new('bev', 'BEVEL'); b.width = .04; b.segments = 2; apply_mods(o)
    return o

def basalt_cluster(name, x, z, n, hmin, hmax, seed, spread=.6):
    rnd = random.Random(seed); parts = []
    for k in range(n):
        a = rnd.random() * 6.28; d = rnd.random() * spread
        parts.append(hex_column(f'{name}_{k}', x + math.cos(a) * d, z + math.sin(a) * d * .5, rnd.uniform(.22, .34), rnd.uniform(hmin, hmax), seed * 31 + k))
    return join(parts, name)

def vent(name, x, z, s):
    o = cyl(name, B(x, -.2, z), B(x, .45 * s, z), .66 * s, .22 * s, 18)
    remesh(o, .035 * s, .5, 3); displace(o, 'VORONOI', .28 * s, .07 * s, .5, distance_metric='DISTANCE')
    c = B(x, .45 * s, z)
    for v in o.data.vertices:  # boca hundida
        r = math.hypot(v.co.x - c.x, v.co.y - c.y)
        if v.co.z > c.z - .12 * s and r < .26 * s: v.co.z -= (.26 * s - r) * .7
    glow = cyl(name + '_brasa', B(x, .3 * s, z), B(x, .36 * s, z), .2 * s, .2 * s, 16)
    return o, glow

def dead_tree(name, x, z, s, seed):
    rnd = random.Random(seed); base = B(x, -.15, z); parts = []; p = base.copy(); r = .17 * s; pts = [p]
    for i in range(5):
        q = p + Vector((rnd.uniform(-.16, .16) * s, rnd.uniform(-.08, .08) * s, .38 * s)); parts.append(cyl(f'{name}_t{i}', p, q, r, r * .8, 10)); p = q; r *= .8; pts.append(p)
    for k in range(5):
        st = pts[2 + k % 3]; a = (k / 5) * 6.28 + rnd.uniform(-.4, .4); L = (.45 + rnd.random() * .45) * s
        e = st + Vector((math.cos(a) * L, math.sin(a) * L * .45, (.22 + rnd.random() * .35) * s)); parts.append(cyl(f'{name}_b{k}', st, e, .075 * s, .035 * s, 8))
        e2 = e + Vector((math.cos(a + .7) * L * .45, math.sin(a + .7) * L * .2, .22 * s)); parts.append(cyl(f'{name}_c{k}', e, e2, .04 * s, .03 * s, 6))
    for k in range(4):
        a = k * math.pi / 2 + rnd.uniform(-.4, .4); parts.append(cyl(f'{name}_r{k}', base + Vector((0, 0, .2 * s)), base + Vector((math.cos(a) * .45 * s, math.sin(a) * .45 * s, .05)), .1 * s, .035 * s, 8))
    o = join(parts, name); remesh(o, .02 * s, .5, 2); return o

def lava_pool(name, x, z, rx, rz, seed):
    rnd = random.Random(seed)
    pool = cyl(name, B(0, -.05, 0), B(0, .055, 0), 1.0, 1.0, 32); pool.scale = (rx, rz, 1); pool.location = B(x, 0, z); apply_transform(pool)
    rim = []
    for k in range(14):
        a = k / 14 * 6.28 + rnd.uniform(-.1, .1)
        rim.append(boulder(f'{name}_b{k}', x + math.cos(a) * rx * 1.04, -.04, z + math.sin(a) * rz * 1.04, rnd.uniform(.17, .25), seed * 13 + k))
    return pool, join(rim, name + '_borde')

# ---------- Piedra tallada (ruinas, templo) ----------
def stone_colors(z0, z1, pal=('#9c8466', '#c9b291', '#eadcbd'), moss='#5f9c3a', moss_amt=1.0, ao_dist=.45, edge=.45, dark='#4a3a36'):
    """Piedra clara con manchas, bordes con luz, musgo arriba (si moss) y sombra en los rincones."""
    def build(nt):
        geo = node(nt, 'ShaderNodeNewGeometry'); sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
        mr = node(nt, 'ShaderNodeMapRange'); mr.inputs['From Min'].default_value = z0; mr.inputs['From Max'].default_value = z1; nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
        col = ramp(nt, [(0, pal[0]), (.55, pal[1]), (1, pal[2])], mr.outputs['Result'])
        tc = node(nt, 'ShaderNodeTexCoord')
        big = node(nt, 'ShaderNodeTexNoise'); big.inputs['Scale'].default_value = .9; big.inputs['Detail'].default_value = 3; nt.links.new(tc.outputs['Object'], big.inputs['Vector'])
        col = mix(nt, col, ramp(nt, [(.38, pal[0]), (.5, pal[1]), (.64, pal[2])], big.outputs['Fac']), .32, 'MIX')
        fine = node(nt, 'ShaderNodeTexNoise'); fine.inputs['Scale'].default_value = 9; fine.inputs['Detail'].default_value = 4; nt.links.new(tc.outputs['Object'], fine.inputs['Vector'])
        col = mix(nt, col, ramp(nt, [(.38, '#8a7a6a'), (.5, '#c8bba8'), (.62, '#fff8ea')], fine.outputs['Fac']), .18, 'OVERLAY')
        if moss:
            nsep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Normal'], nsep.inputs[0])
            up = node(nt, 'ShaderNodeMapRange'); up.inputs['From Min'].default_value = .35; up.inputs['From Max'].default_value = .75; nt.links.new(nsep.outputs['Z'], up.inputs['Value'])
            mn = node(nt, 'ShaderNodeTexNoise'); mn.inputs['Scale'].default_value = 2.4; mn.inputs['Detail'].default_value = 4; nt.links.new(tc.outputs['Object'], mn.inputs['Vector'])
            patch = node(nt, 'ShaderNodeMapRange'); patch.inputs['From Min'].default_value = .42; patch.inputs['From Max'].default_value = .52; nt.links.new(mn.outputs['Fac'], patch.inputs['Value'])
            m = node(nt, 'ShaderNodeMath'); m.operation = 'MULTIPLY'; nt.links.new(up.outputs['Result'], m.inputs[0]); nt.links.new(patch.outputs['Result'], m.inputs[1])
            m2 = node(nt, 'ShaderNodeMath'); m2.operation = 'MULTIPLY'; m2.inputs[1].default_value = moss_amt; nt.links.new(m.outputs[0], m2.inputs[0])
            mossc = mix(nt, hexrgb(moss), ramp(nt, [(.3, '#2f6a2a'), (.7, '#9ad45a')], fine.outputs['Fac']), .45, 'MIX')
            col = mix(nt, col, mossc, m2.outputs[0], 'MIX')
        if edge:
            pt = ramp(nt, [(.5, '#000000'), (.56, '#ffffff')], geo.outputs['Pointiness'])
            col = mix(nt, col, (1.0, .96, .88), node_fac(nt, pt, edge), 'SCREEN')
        ao = node(nt, 'ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = ao_dist; ao.samples = 16
        return mix(nt, col, ramp(nt, [(0, dark), (1, '#ffffff')], ao.outputs['AO']), .85, 'MULTIPLY')
    return build

def bake_tex_obj(obj, build, size, name, samples=12, margin=.004, angle=60):
    """Desdobla (UV) y hornea los colores del objeto a una imagen."""
    uv_unwrap(obj, margin, angle)
    return bake_texture(obj, bake_material(name + '_bake', build), size, name, samples)

# ---------- Templo ----------
def marble_colors(z0, z1, pal=('#d6c4b8', '#efe4d8', '#fbf6ee'), vein='#b09a94', ao_dist=.5, dark='#6a4a56', edge=.4, vein_scale=.45):
    """Mármol claro con vetas finas, bordes con luz y sombra en los rincones."""
    def build(nt):
        geo = node(nt, 'ShaderNodeNewGeometry'); sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
        mr = node(nt, 'ShaderNodeMapRange'); mr.inputs['From Min'].default_value = z0; mr.inputs['From Max'].default_value = z1; nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
        col = ramp(nt, [(0, pal[0]), (.5, pal[1]), (1, pal[2])], mr.outputs['Result'])
        tc = node(nt, 'ShaderNodeTexCoord')
        nz = node(nt, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.1; nz.inputs['Detail'].default_value = 3; nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        col = mix(nt, col, ramp(nt, [(.4, pal[0]), (.6, pal[2])], nz.outputs['Fac']), .25, 'MIX')
        wv = node(nt, 'ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'DIAGONAL'
        wv.inputs['Scale'].default_value = vein_scale; wv.inputs['Distortion'].default_value = 11; wv.inputs['Detail'].default_value = 5; wv.inputs['Detail Scale'].default_value = 1.6
        nt.links.new(tc.outputs['Object'], wv.inputs['Vector'])
        vm = ramp(nt, [(0, '#ffffff'), (.035, '#ffffff'), (.09, '#000000')], wv.outputs['Fac'])
        col = mix(nt, col, hexrgb(vein), node_fac(nt, vm, .55), 'MIX')
        pt = ramp(nt, [(.5, '#000000'), (.56, '#ffffff')], geo.outputs['Pointiness'])
        col = mix(nt, col, (1.0, .97, .9), node_fac(nt, pt, edge), 'SCREEN')
        ao = node(nt, 'ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = ao_dist; ao.samples = 16
        return mix(nt, col, ramp(nt, [(0, dark), (1, '#ffffff')], ao.outputs['AO']), .85, 'MULTIPLY')
    return build

def marble_floor(tile=1.25, pal=('#f7f0e6', '#ead8cc', '#fbf5ec'), vein='#b8a096', grout='#9a7a6a', ao_dist=.7, dark='#6a4a56'):
    """Piso de baldosas de mármol (dos tonos), juntas finas y vetas; sombra de lo que tiene encima."""
    def build(nt):
        geo = node(nt, 'ShaderNodeNewGeometry'); tc = node(nt, 'ShaderNodeTexCoord')
        br = node(nt, 'ShaderNodeTexBrick'); br.offset = 0.0; br.squash = 1.0
        br.inputs['Scale'].default_value = 1.0; br.inputs['Mortar Size'].default_value = .022; br.inputs['Mortar Smooth'].default_value = .4
        br.inputs['Brick Width'].default_value = tile; br.inputs['Row Height'].default_value = tile; br.inputs['Bias'].default_value = 0.0
        br.inputs['Color1'].default_value = (*hexrgb(pal[0]), 1); br.inputs['Color2'].default_value = (*hexrgb(pal[1]), 1); br.inputs['Mortar'].default_value = (*hexrgb(grout), 1)
        nt.links.new(tc.outputs['Object'], br.inputs['Vector'])
        col = br.outputs['Color']
        nz = node(nt, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = .9; nz.inputs['Detail'].default_value = 3; nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        col = mix(nt, col, ramp(nt, [(.4, pal[1]), (.6, pal[2])], nz.outputs['Fac']), .2, 'MIX')
        wv = node(nt, 'ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'DIAGONAL'
        wv.inputs['Scale'].default_value = .32; wv.inputs['Distortion'].default_value = 12; wv.inputs['Detail'].default_value = 5; wv.inputs['Detail Scale'].default_value = 1.6
        nt.links.new(tc.outputs['Object'], wv.inputs['Vector'])
        vm = ramp(nt, [(0, '#ffffff'), (.03, '#ffffff'), (.08, '#000000')], wv.outputs['Fac'])
        col = mix(nt, col, hexrgb(vein), node_fac(nt, vm, .5), 'MIX')
        ao = node(nt, 'ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = ao_dist; ao.samples = 16
        return mix(nt, col, ramp(nt, [(0, dark), (1, '#ffffff')], ao.outputs['AO']), .85, 'MULTIPLY')
    return build

def blossom_colors(z0, z1):
    def build(nt):
        geo = node(nt, 'ShaderNodeNewGeometry'); sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
        mr = node(nt, 'ShaderNodeMapRange'); mr.inputs['From Min'].default_value = z0; mr.inputs['From Max'].default_value = z1; nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
        base = ramp(nt, [(0, '#9a3a6a'), (.4, '#d86a9a'), (.75, '#f4a6c8'), (1, '#ffe0ee')], mr.outputs['Result'])
        nz = node(nt, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 2.6; tc = node(nt, 'ShaderNodeTexCoord'); nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        var = mix(nt, base, ramp(nt, [(.35, '#c8508a'), (.65, '#ffd2e6')], nz.outputs['Fac']), .3, 'MIX')
        pt = ramp(nt, [(.5, '#000000'), (.56, '#ffffff')], geo.outputs['Pointiness'])
        lit = mix(nt, var, (1.0, .9, .95), node_fac(nt, pt, .45), 'SCREEN')
        ao = node(nt, 'ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = .8; ao.samples = 16
        return mix(nt, lit, ramp(nt, [(0, '#4a1838'), (1, '#ffffff')], ao.outputs['AO']), .9, 'MULTIPLY')
    return build

def column(name, x, z, h, seed, broken=False, r=.36, flutes=20):
    """Columna con estrías: plinto, base redonda, fuste (roto arriba si broken) y capitel."""
    rnd = random.Random(seed); parts = [block(name + '_plinto', x, .11, z, .98, .22, .98, .05, .02, seed)]
    base = cyl(name + '_base', B(x, .2, z), B(x, .38, z), r * 1.38, r * 1.3, 32); bv = base.modifiers.new('b', 'BEVEL'); bv.width = .07; bv.segments = 4; apply_mods(base); parts.append(base)
    seg = flutes * 4; bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=broken, segments=seg, radius1=r, radius2=r * .9, depth=h)
    for v in bm.verts:
        rr = math.hypot(v.co.x, v.co.y)
        if rr > 1e-4:
            ang = math.atan2(v.co.y, v.co.x); k = 1 - .075 * (.5 + .5 * math.cos(ang * flutes))
            v.co.x *= k; v.co.y *= k
        if broken and v.co.z > 0:
            v.co.z += rnd.uniform(-.22, .06) if rr > 1e-4 else -.12
    sh = mesh_from_bm(name + '_fuste', bm); sh.location = B(x, .38 + h / 2, z); apply_transform(sh); parts.append(sh)
    if not broken:
        top = .38 + h
        ech = cyl(name + '_equino', B(x, top - .02, z), B(x, top + .2, z), r * .95, r * 1.42, 32); bv = ech.modifiers.new('b', 'BEVEL'); bv.width = .04; bv.segments = 3; apply_mods(ech); parts.append(ech)
        parts.append(block(name + '_abaco', x, top + .3, z, 1.08, .2, 1.08, .04, .02, seed + 1))
    return parts

def banner(name, x, y_top, z, w=.78, h=2.3, seed=0):
    """Estandarte rojo con borde y emblema dorados, con pliegues y cola de golondrina abajo."""
    bm = bmesh.new(); bm.loops.layers.uv.new('UVMap'); bmesh.ops.create_grid(bm, x_segments=10, y_segments=30, size=.5, calc_uvs=True)
    for v in bm.verts:
        u, t = v.co.x, v.co.y + .5  # u en [-.5, .5]; t de 0 (abajo) a 1 (arriba)
        v.co.x = u * w; z_up = (t - 1) * h
        if t < .12: z_up += (1 - abs(u) * 2) * .26 * (1 - t / .12)  # muesca de cola de golondrina
        v.co.y = math.sin(u * 9 + seed) * .035 - (1 - t) * .06; v.co.z = z_up
    o = mesh_from_bm(name, bm); o.location = B(x, y_top, z); apply_transform(o)
    return o

def banner_colors(w=.78, h=2.3):
    """Tela roja con borde, sol y rayas doradas, dibujada con las UV del estandarte."""
    def build(nt):
        uv = node(nt, 'ShaderNodeUVMap'); sep = node(nt, 'ShaderNodeSeparateXYZ'); nt.links.new(uv.outputs['UV'], sep.inputs[0])
        def m(op, a, b=None):
            n = node(nt, 'ShaderNodeMath'); n.operation = op
            for i, v in enumerate((a, b)):
                if v is None: continue
                if isinstance(v, (int, float)): n.inputs[i].default_value = v
                else: nt.links.new(v, n.inputs[i])
            return n.outputs[0]
        u = m('SUBTRACT', sep.outputs['X'], .5); t = sep.outputs['Y']
        border = m('MAXIMUM', m('GREATER_THAN', m('ABSOLUTE', u), .4), m('GREATER_THAN', t, .94))
        inner = m('MAXIMUM', m('GREATER_THAN', m('ABSOLUTE', u), .33), m('GREATER_THAN', t, .9))
        line = m('SUBTRACT', inner, border)
        dy = m('MULTIPLY', m('SUBTRACT', t, .64), h / w); r = m('LENGTH' if False else 'SQRT', m('ADD', m('MULTIPLY', u, u), m('MULTIPLY', dy, dy)))
        ring = m('MULTIPLY', m('LESS_THAN', r, .25), m('GREATER_THAN', r, .19))
        disc = m('LESS_THAN', r, .12)
        ang = m('ARCTAN2', dy, u); rays = m('MULTIPLY', m('GREATER_THAN', m('SINE', m('MULTIPLY', ang, 8.0)), .55), m('MULTIPLY', m('GREATER_THAN', r, .26), m('LESS_THAN', r, .36)))
        band = m('MULTIPLY', m('GREATER_THAN', t, .2), m('LESS_THAN', t, .235))
        g = m('MINIMUM', m('ADD', m('ADD', m('ADD', border, ring), m('ADD', disc, rays)), m('ADD', band, m('MULTIPLY', line, .0))), 1.0)
        dark = m('MULTIPLY', line, 1.0)
        nz = node(nt, 'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 40; nt.links.new(uv.outputs['UV'], nz.inputs['Vector'])
        cloth = mix(nt, hexrgb('#9a0c22'), hexrgb('#c8243c'), nz.outputs['Fac'], 'MIX')
        cloth = mix(nt, cloth, hexrgb('#6a0616'), dark, 'MIX')
        goldc = mix(nt, hexrgb('#e8a83a'), hexrgb('#ffd27a'), nz.outputs['Fac'], 'MIX')
        return mix(nt, cloth, goldc, g, 'MIX')
    return build

def brazier(name, x, z, s=1.0):
    ped = cyl(name + '_pie', B(x, 0, z), B(x, .82 * s, z), .2 * s, .12 * s, 20); bv = ped.modifiers.new('b', 'BEVEL'); bv.width = .03; bv.segments = 2; apply_mods(ped)
    foot = cyl(name + '_base', B(x, 0, z), B(x, .1 * s, z), .3 * s, .28 * s, 20)
    bowl = ico(name + '_cuenco', B(x, .98 * s, z), .38 * s, 4); c = B(x, .98 * s, z)
    for v in bowl.data.vertices:
        if v.co.z > c.z: v.co.z = c.z + (v.co.z - c.z) * .12
        else: v.co.z = c.z + (v.co.z - c.z) * .62
    flame = ico(name + '_llama', B(x, 1.16 * s, z), .22 * s, 3); fc = B(x, 1.1 * s, z)
    for v in flame.data.vertices:
        if v.co.z > fc.z:
            k = (v.co.z - fc.z) / (.3 * s); v.co.z = fc.z + (v.co.z - fc.z) * 2.6
            v.co.x = fc.x + (v.co.x - fc.x) * max(.05, 1 - k * .55); v.co.y = fc.y + (v.co.y - fc.y) * max(.05, 1 - k * .55)
    return [ped, foot, bowl], flame

def vine(name, x, y_top, z, n, seed):
    rnd = random.Random(seed); parts = []; px = x
    for k in range(n):
        px += rnd.uniform(-.05, .05); y = y_top - k * .15
        for j in range(2):
            lf = ico(f'{name}_{k}_{j}', Vector((0, 0, 0)), rnd.uniform(.075, .1), 2)
            for v in lf.data.vertices:
                if v.co.z < 0: v.co.x *= 1 + v.co.z * 6; v.co.y *= 1 + v.co.z * 6  # punta hacia abajo
            lf.scale = (1.0, .22, 1.35); lf.rotation_euler = (rnd.uniform(-.3, .3), rnd.uniform(-.7, .7), rnd.uniform(-.5, .5))
            lf.location = B(px + (.06 if (k + j) % 2 else -.06) + rnd.uniform(-.03, .03), y - j * .08, z + .02 * j); apply_transform(lf); parts.append(lf)
    return join(parts, name)
