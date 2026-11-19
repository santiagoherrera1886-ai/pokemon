# Utilidades para armar los escenarios de la Pelea en Blender (coordenadas del juego: x derecha, y arriba, z hacia la cámara).
import bpy, bmesh, math, random, os
from mathutils import Vector
# FAST=1: texturas y muestras a la cuarta parte para revisar rápido cómo va quedando.
FAST = bool(os.environ.get('FAST'))
def tsize(n): return max(128, n // 4) if FAST else n
def spp(n): return max(2, n // 4) if FAST else n

def B(x, y, z):  # juego -> Blender (z arriba, -y hacia la cámara)
    return Vector((x, -z, y))

def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 24
    return sc

def link(obj):
    bpy.context.scene.collection.objects.link(obj); return obj

def apply_mods(obj):
    with bpy.context.temp_override(object=obj, active_object=obj, selected_objects=[obj], selected_editable_objects=[obj]):
        for m in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=m.name)

def mesh_from_bm(name, bm):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    return link(bpy.data.objects.new(name, me))

def prism(name, pts2d, z0, z1):
    """Extruye un contorno 2D (x, y del juego) entre z0 y z1 del juego."""
    bm = bmesh.new()
    vs0 = [bm.verts.new(B(x, y, z0)) for x, y in pts2d]
    vs1 = [bm.verts.new(B(x, y, z1)) for x, y in pts2d]
    n = len(pts2d)
    bm.faces.new(vs0); bm.faces.new(list(reversed(vs1)))
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((vs0[i], vs0[j], vs1[j], vs1[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_from_bm(name, bm)

def smooth_shade(obj, angle=40):
    with bpy.context.temp_override(object=obj, active_object=obj, selected_objects=[obj], selected_editable_objects=[obj]):
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angle))

def bake_material(name, build):
    """Material para hornear: build(nt, out_socket) arma los nodos y devuelve el color final."""
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission')
    nt.links.new(em.outputs[0], out.inputs['Surface'])
    col = build(nt)
    nt.links.new(col, em.inputs['Color'])
    return mat

def bake_vertex_colors(obj, mat, samples=24):
    me = obj.data
    attr = me.color_attributes.new(name='Col', type='BYTE_COLOR', domain='POINT')
    me.color_attributes.active_color = attr
    obj.data.materials.clear(); obj.data.materials.append(mat)
    sc = bpy.context.scene; sc.cycles.samples = spp(samples); sc.render.bake.target = 'VERTEX_COLORS'
    for o in bpy.context.scene.objects: o.select_set(False)
    obj.select_set(True); bpy.context.view_layer.objects.active = obj
    bpy.ops.object.bake(type='EMIT')
    return attr

def final_material(name, rough=.88, emissive=None, strength=0.0, metallic=0.0):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    nt = mat.node_tree; bsdf = nt.nodes.get('Principled BSDF')
    vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'
    nt.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = rough; bsdf.inputs['Metallic'].default_value = metallic
    if emissive:
        bsdf.inputs['Emission Color'].default_value = (*emissive, 1); bsdf.inputs['Emission Strength'].default_value = strength
    return mat

def finish(obj, mat_name, **kw):
    obj.data.materials.clear(); obj.data.materials.append(final_material(mat_name, **kw))

def node(nt, kind, **props):
    n = nt.nodes.new(kind)
    for k, v in props.items():
        setattr(n, k, v)
    return n

def ramp(nt, stops, src):
    r = nt.nodes.new('ShaderNodeValToRGB'); els = r.color_ramp.elements
    els[0].position, els[0].color = stops[0][0], (*hexrgb(stops[0][1]), 1)
    els[1].position, els[1].color = stops[-1][0], (*hexrgb(stops[-1][1]), 1)
    for p, c in stops[1:-1]:
        e = els.new(p); e.color = (*hexrgb(c), 1)
    nt.links.new(src, r.inputs['Fac']); return r.outputs['Color']

def hexrgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + .055) / 1.055) ** 2.4 if v > .04045 else v / 12.92 for v in c)  # sRGB -> lineal

def mix(nt, a, b, fac, mode='MIX'):
    m = nt.nodes.new('ShaderNodeMix'); m.data_type = 'RGBA'; m.blend_type = mode
    if isinstance(fac, float): m.inputs['Factor'].default_value = fac
    else: nt.links.new(fac, m.inputs['Factor'])
    nt.links.new(a, m.inputs['A']) if not isinstance(a, tuple) else setattr(m.inputs['A'], 'default_value', (*a, 1))
    nt.links.new(b, m.inputs['B']) if not isinstance(b, tuple) else setattr(m.inputs['B'], 'default_value', (*b, 1))
    return m.outputs['Result']

def export_glb(path, objs):
    for o in bpy.context.scene.objects: o.select_set(o in objs)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True)

def join(objs, name):
    objs = [o for o in objs if o]
    with bpy.context.temp_override(object=objs[0], active_object=objs[0], selected_objects=objs, selected_editable_objects=objs):
        bpy.ops.object.join()
    objs[0].name = name; objs[0].data.name = name
    return objs[0]

def apply_transform(obj):
    with bpy.context.temp_override(object=obj, active_object=obj, selected_objects=[obj], selected_editable_objects=[obj]):
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

def ico(name, center, r, subdiv=3):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=r)
    o = mesh_from_bm(name, bm); o.location = center; apply_transform(o); return o

def cyl(name, p0, p1, r0, r1, seg=12):
    """Cilindro con radios distintos entre dos puntos de Blender."""
    from mathutils import Vector
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r0, radius2=r1, depth=1)
    o = mesh_from_bm(name, bm); d = Vector(p1) - Vector(p0)
    o.scale = (1, 1, d.length); o.location = (Vector(p0) + Vector(p1)) / 2
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
    apply_transform(o); return o

def remesh(obj, voxel, smooth=.4, iters=2):
    r = obj.modifiers.new('remesh', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = voxel
    if smooth: s = obj.modifiers.new('smooth', 'SMOOTH'); s.factor = smooth; s.iterations = iters
    apply_mods(obj); return obj

def displace(obj, kind='CLOUDS', scale=.5, strength=.1, mid=.5, **tex):
    t = bpy.data.textures.new(obj.name + '_tx', kind); t.noise_scale = scale
    for k, v in tex.items(): setattr(t, k, v)
    d = obj.modifiers.new('disp', 'DISPLACE'); d.texture = t; d.strength = strength; d.mid_level = mid; d.texture_coords = 'OBJECT'
    apply_mods(obj); return obj

def uv_unwrap(obj, margin=.004, angle=55):
    for o in bpy.context.scene.objects: o.select_set(False)
    obj.select_set(True); bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(angle), island_margin=margin)
    bpy.ops.object.mode_set(mode='OBJECT')

def bake_texture(obj, mat, size, name, samples=24):
    """Hornea el color del material a una imagen (con sus coordenadas UV) y deja el material final con esa imagen."""
    img = bpy.data.images.new(name, tsize(size), tsize(size), alpha=False)
    nt = mat.node_tree; tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img; nt.nodes.active = tex
    obj.data.materials.clear(); obj.data.materials.append(mat)
    sc = bpy.context.scene; sc.cycles.samples = spp(samples); sc.render.bake.target = 'IMAGE_TEXTURES'; sc.render.bake.margin = 8
    for o in sc.objects: o.select_set(False)
    obj.select_set(True); bpy.context.view_layer.objects.active = obj
    bpy.ops.object.bake(type='EMIT')
    img.pack()
    return img

def add_emission(nt, bsdf, img, strength):
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img
    nt.links.new(t.outputs['Color'], bsdf.inputs['Emission Color']); bsdf.inputs['Emission Strength'].default_value = strength

def textured_material(name, img, rough=.9, emit_img=None, emit_strength=1.0, metallic=0.0):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    nt = mat.node_tree; bsdf = nt.nodes.get('Principled BSDF')
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img; nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = rough; bsdf.inputs['Metallic'].default_value = metallic
    if emit_img is not None: add_emission(nt, bsdf, emit_img, emit_strength)
    return mat

def duplicate(obj, name):
    o = obj.copy(); o.data = obj.data.copy(); o.name = name; o.data.name = name; bpy.context.scene.collection.objects.link(o); return o

def bake_hi_lo(hi, lo, mat_hi, size, name, kind='EMIT', samples=16, extrusion=.15, dist=.5):
    """Hornea del modelo con mucho detalle (hi) al liviano (lo): color o mapa de relieve (normales)."""
    sc = bpy.context.scene
    img = bpy.data.images.new(name, tsize(size), tsize(size), alpha=False)
    if kind == 'NORMAL': img.colorspace_settings.name = 'Non-Color'
    lo_mat = bpy.data.materials.new(name + '_lo'); lo_mat.use_nodes = True; nt = lo_mat.node_tree
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img; nt.nodes.active = t
    lo.data.materials.clear(); lo.data.materials.append(lo_mat)
    if mat_hi is not None: hi.data.materials.clear(); hi.data.materials.append(mat_hi)
    b = sc.render.bake; b.use_selected_to_active = True; b.cage_extrusion = extrusion; b.max_ray_distance = dist; b.target = 'IMAGE_TEXTURES'; b.margin = 8
    sc.cycles.samples = spp(samples)
    for o in sc.objects: o.select_set(False)
    hi.select_set(True); lo.select_set(True); bpy.context.view_layer.objects.active = lo
    if kind == 'NORMAL': bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT')
    else: bpy.ops.object.bake(type=kind)
    b.use_selected_to_active = False
    img.pack(); return img

def pbr_material(name, color_img, normal_img=None, rough=.9, normal_strength=1.0, emit_img=None, emit_strength=1.0):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    nt = mat.node_tree; bsdf = nt.nodes.get('Principled BSDF')
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = color_img; nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
    if normal_img is not None:
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = normal_img; n.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = normal_strength
        nt.links.new(n.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    bsdf.inputs['Roughness'].default_value = rough
    if emit_img is not None: add_emission(nt, bsdf, emit_img, emit_strength)
    return mat
