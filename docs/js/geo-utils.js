// geo-utils.js - Merge simple primitives into one BufferGeometry, so detailed models still render as
// a single InstancedMesh (one draw call) and keep per-instance health colours.

import * as THREE from 'three';

// parts: [{ geo, pos:[x,y,z], rot:[x,y,z], scale:[x,y,z] }]
export function mergeParts(parts) {
  const positions = [], normals = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), n = new THREE.Matrix3();
  for (const p of parts) {
    let g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    e.set(...(p.rot || [0, 0, 0])); q.setFromEuler(e);
    m.compose(new THREE.Vector3(...(p.pos || [0, 0, 0])), q, new THREE.Vector3(...(p.scale || [1, 1, 1])));
    g.applyMatrix4(m);
    if (!g.attributes.normal) g.computeVertexNormals();
    positions.push(g.attributes.position.array); normals.push(g.attributes.normal.array);
  }
  const total = positions.reduce((s, a) => s + a.length, 0);
  const pos = new Float32Array(total), nor = new Float32Array(total);
  let o = 0;
  positions.forEach((a, i) => { pos.set(a, o); nor.set(normals[i], o); o += a.length; });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.computeBoundingBox(); out.computeBoundingSphere();
  return out;
}

export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const cyl = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);
