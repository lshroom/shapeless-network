import * as THREE from 'three';

export function makeLabel(text, hexColor) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.font = 'bold 22px system-ui';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#' + hexColor.toString(16).padStart(6,'0');
  ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12;
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent:true, depthTest:false }));
  sp.scale.set(1.5, 0.38, 1); sp.renderOrder = 999;
  return sp;
}

export function disposeObject(obj) {
  obj.traverse(o => {
    if (o.geometry) o.geometry.dispose?.();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => {
        Object.values(m).forEach(v => v && v.isTexture && v.dispose?.());
        m.dispose?.();
      });
    }
  });
}

// Common noise (matches several shaders in the doc)
export const NOISE_GLSL = /* glsl */`
  float h(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
  float n3(vec3 p){
    vec3 i = floor(p), f = fract(p);
    f = f*f*(3.-2.*f);
    return mix(mix(mix(h(i), h(i+vec3(1,0,0)), f.x),
                   mix(h(i+vec3(0,1,0)), h(i+vec3(1,1,0)), f.x), f.y),
               mix(mix(h(i+vec3(0,0,1)), h(i+vec3(1,0,1)), f.x),
                   mix(h(i+vec3(0,1,1)), h(i+vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm3(vec3 p){
    float v = 0.0, a = 0.5;
    for (int i=0;i<4;i++){ v += a * n3(p); p *= 2.07; a *= 0.5; }
    return v;
  }
`;
