import * as THREE from 'three';

export default {
  id: 'tunnel',
  label: 'Star Tunnel',
  color: 0xffffff,
  controls: [
    { p:'count',  label:'Stars',  min:500, max:8000, step:100, val:3000 },
    { p:'radius', label:'Radius', min:3, max:25, step:0.5, val:10 },
    { p:'depth',  label:'Depth',  min:20, max:200, step:5, val:80 },
    { p:'speed',  label:'Speed',  min:1, max:60, step:0.5, val:20 },
    { p:'size',   label:'Size',   min:0.5, max:5, step:0.05, val:1.5 },
    { p:'pulse',  label:'Pulse',  min:0, max:3, step:0.05, val:1 },
    { p:'color',  label:'Color', type:'color', val:'#ffffff' },
  ],
  init({ scene, audio, camera }) {
    let pts, pos;
    const mat = new THREE.PointsMaterial({ color:0xffffff, size:1.5, transparent:true, opacity:0.95, blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true });
    const state = { count:3000, radius:10, depth:80, speed:20, size:1.5, pulse:1 };
    function build() {
      if (pts) { scene.remove(pts); pts.geometry.dispose(); }
      const g = new THREE.BufferGeometry();
      pos = new Float32Array(state.count * 3);
      for (let i = 0; i < state.count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = state.radius * (0.4 + Math.random() * 0.6);
        pos[i*3] = Math.cos(a) * r;
        pos[i*3+1] = Math.sin(a) * r;
        pos[i*3+2] = -Math.random() * state.depth;
      }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      pts = new THREE.Points(g, mat); scene.add(pts);
    }
    build();
    let lastT = 0;
    return {
      set(p, v) {
        if (p === 'color') mat.color.set(v);
        else if (p === 'size') { state.size = v; mat.size = v; }
        else if (p === 'speed') state.speed = v;
        else if (p === 'pulse') state.pulse = v;
        else { state[p] = v; build(); }
      },
      update(t) {
        const dt = Math.min(0.1, t - lastT); lastT = t;
        const p = state.pulse;
        const rms = audio.rms;
        const bass = audio.bass / 255;
        const kick = audio.kick / 255;

        // speed surges on bass/kick
        const speedMult = 0.4 + rms * 2 * p + kick * 6 * p;
        const s = state.speed * speedMult * dt;

        // size pulses with rms
        mat.size = (state.size ?? 1.5) * (0.6 + rms * 3 * p + kick * 4 * p);
        mat.opacity = Math.min(1, 0.6 + rms * 1.5 * p);

        // radius breathes with bass
        const radiusMod = state.radius * (1 + bass * 0.4 * p);

        for (let i = 0; i < state.count; i++) {
          pos[i*3+2] += s;
          if (pos[i*3+2] > 5) {
            const a = Math.random() * Math.PI * 2;
            const r = radiusMod * (0.4 + Math.random() * 0.6);
            pos[i*3]   = Math.cos(a) * r;
            pos[i*3+1] = Math.sin(a) * r;
            pos[i*3+2] = -state.depth;
          }
        }
        pts.geometry.attributes.position.needsUpdate = true;
      },
      dispose() { scene.remove(pts); pts.geometry.dispose(); mat.dispose(); },
    };
  },
};
