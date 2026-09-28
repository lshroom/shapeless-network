import * as THREE from 'three';

export default {
  id: 'ticker',
  label: 'Ticker Pulse',
  color: 0x5fffd0,
  controls: [
    { p:'beams', label:'Beams',  min:4, max:64, step:1, val:24 },
    { p:'length',label:'Length', min:2, max:30, step:0.5, val:12 },
    { p:'thick', label:'Thick',  min:0.05, max:1, step:0.01, val:0.2 },
    { p:'spin',  label:'Spin',   min:0, max:3, step:0.01, val:0.3 },
    { p:'color', label:'Color', type:'color', val:'#5fffd0' },
  ],
  init({ scene, audio }) {
    const group = new THREE.Group(); scene.add(group);
    const mat = new THREE.MeshBasicMaterial({ color:0x5fffd0, transparent:true, opacity:0.85, blending:THREE.AdditiveBlending, depthWrite:false });
    let beams = [];
    const state = { beams:24, length:12, thick:0.2, spin:0.3 };
    function build() {
      while (group.children.length) { const c = group.children[0]; group.remove(c); c.geometry.dispose(); }
      beams = [];
      for (let i = 0; i < state.beams; i++) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(state.thick, state.thick, 1, 8), mat);
        const a = (i / state.beams) * Math.PI * 2;
        m.position.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5);
        m.lookAt(Math.cos(a) * 10, 0, Math.sin(a) * 10);
        m.rotateX(Math.PI/2);
        group.add(m); beams.push({ m, a, bin: Math.floor(i / state.beams * 128) });
      }
    }
    build();
    return {
      set(p, v) {
        if (p === 'color') mat.color.set(v);
        else if (p === 'spin') state.spin = v;
        else { state[p] = v; build(); }
      },
      update(t) {
        beams.forEach(b => {
          const a = audio.freq[b.bin] / 255;
          const L = state.length * (0.2 + a * 1.3);
          b.m.scale.y = L;
          b.m.position.set(Math.cos(b.a) * L/2, 0, Math.sin(b.a) * L/2);
        });
        group.rotation.y = t * state.spin;
      },
      dispose() { scene.remove(group); group.children.forEach(c => c.geometry.dispose()); mat.dispose(); },
    };
  },
};
