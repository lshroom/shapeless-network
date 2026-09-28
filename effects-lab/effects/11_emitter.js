import * as THREE from 'three';

export default {
  id: 'emitter',
  label: 'Particle Emitter',
  color: 0x6affda,
  controls: [
    { p:'rate',   label:'Rate',     min:10, max:600, step:5, val:200 },
    { p:'life',   label:'Lifetime', min:0.5, max:6, step:0.05, val:2 },
    { p:'speed',  label:'Speed',    min:0.5, max:15, step:0.1, val:5 },
    { p:'spread', label:'Spread',   min:0, max:Math.PI, step:0.01, val:0.8 },
    { p:'size',   label:'Size',     min:0.05, max:2, step:0.01, val:0.15 },
    { p:'gravity',label:'Gravity',  min:-5, max:5, step:0.05, val:0 },
    { p:'color',  label:'Color', type:'color', val:'#6affda' },
  ],
  init({ scene, audio }) {
    const MAX = 4000;
    const pos = new Float32Array(MAX * 3);
    const life = new Float32Array(MAX);
    const vel = new Float32Array(MAX * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color:0x6affda, size:0.15, transparent:true, opacity:0.85, blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true });
    const pts = new THREE.Points(g, mat); scene.add(pts);
    let head = 0, lastT = 0;
    const state = { rate:200, life:2, speed:5, spread:0.8, gravity:0 };
    for (let i = 0; i < MAX; i++) life[i] = 0;
    return {
      set(p, v) {
        if (p === 'color') mat.color.set(v);
        else if (p === 'size') mat.size = v;
        else state[p] = v;
      },
      update(t) {
        const dt = Math.min(0.1, t - lastT); lastT = t;
        const emit = Math.floor((state.rate * (0.5 + audio.rms * 1.5)) * dt);
        for (let e = 0; e < emit; e++) {
          const i = head; head = (head + 1) % MAX;
          pos[i*3] = 0; pos[i*3+1] = 0; pos[i*3+2] = 0;
          const ph = Math.acos(1 - Math.random() * (1 - Math.cos(state.spread)));
          const th = Math.random() * Math.PI * 2;
          const s = state.speed * (0.6 + Math.random() * 0.8);
          vel[i*3]   = Math.sin(ph) * Math.cos(th) * s;
          vel[i*3+1] = Math.cos(ph) * s;
          vel[i*3+2] = Math.sin(ph) * Math.sin(th) * s;
          life[i] = state.life;
        }
        for (let i = 0; i < MAX; i++) {
          if (life[i] <= 0) { pos[i*3+1] = -9999; continue; }
          life[i] -= dt;
          vel[i*3+1] -= state.gravity * dt;
          pos[i*3]   += vel[i*3] * dt;
          pos[i*3+1] += vel[i*3+1] * dt;
          pos[i*3+2] += vel[i*3+2] * dt;
        }
        mat.size = state.size * (0.5 + audio.rms * 4);
        g.attributes.position.needsUpdate = true;
      },
      dispose() { scene.remove(pts); g.dispose(); mat.dispose(); },
    };
  },
};
