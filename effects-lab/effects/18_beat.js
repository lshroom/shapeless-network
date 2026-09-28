import * as THREE from 'three';

export default {
  id: 'beat',
  label: 'Beat Burst',
  color: 0xffe45f,
  controls: [
    { p:'threshold', label:'Threshold', min:0.01, max:1, step:0.01, val:0.15 },
    { p:'maxR',      label:'Max Radius',min:3, max:30, step:0.5, val:14 },
    { p:'thick',     label:'Thickness', min:0.05, max:1, step:0.01, val:0.2 },
    { p:'life',      label:'Lifetime',  min:0.3, max:3, step:0.05, val:1.2 },
    { p:'color',     label:'Color', type:'color', val:'#ffe45f' },
  ],
  init({ scene, audio }) {
    const group = new THREE.Group(); scene.add(group);
    const mat = new THREE.MeshBasicMaterial({ color:0xffe45f, transparent:true, opacity:1, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false });
    const rings = [];
    const state = { threshold:0.4, maxR:14, thick:0.2, life:1.2 };
    let cooldown = 0, lastT = 0;
    return {
      set(p, v) { if (p === 'color') mat.color.set(v); else state[p] = v; },
      update(t) {
        const dt = Math.min(0.1, t - lastT); lastT = t;
        cooldown -= dt;
        if ((audio.kick > state.threshold || audio.rms > state.threshold * 2) && cooldown <= 0) {
          const g = new THREE.RingGeometry(0.1, 0.1 + state.thick, 64);
          const m = new THREE.Mesh(g, mat.clone());
          m.rotation.x = -Math.PI / 2;
          group.add(m); rings.push({ m, age: 0 });
          cooldown = 0.15;
        }
        for (let i = rings.length - 1; i >= 0; i--) {
          const r = rings[i];
          r.age += dt;
          const k = r.age / state.life;
          if (k >= 1) { group.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); rings.splice(i,1); continue; }
          r.m.scale.setScalar(1 + k * state.maxR);
          r.m.material.opacity = 1 - k;
        }
      },
      dispose() { scene.remove(group); rings.forEach(r => { r.m.geometry.dispose(); r.m.material.dispose(); }); mat.dispose(); },
    };
  },
};
