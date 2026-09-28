import * as THREE from 'three';

export default {
  id: 'seqDisc',
  label: 'Sequencer Disc',
  color: 0xff8a3a,
  controls: [
    { p:'rings', label:'Rings', min:2, max:8, step:1, val:4 },
    { p:'steps', label:'Steps', min:4, max:32, step:1, val:16 },
    { p:'radius',label:'Radius',min:3, max:14, step:0.1, val:8 },
    { p:'bpm',   label:'BPM',   min:40, max:200, step:1, val:120 },
    { p:'color', label:'Color', type:'color', val:'#ff8a3a' },
  ],
  init({ scene, audio }) {
    const group = new THREE.Group(); scene.add(group);
    scene.add(new THREE.AmbientLight(0x445566, 0.6));
    const mat = new THREE.MeshStandardMaterial({ color:0xff8a3a, emissive:0xff8a3a, emissiveIntensity:0.3, metalness:0.4, roughness:0.4 });
    const playMat = new THREE.MeshStandardMaterial({ color:0xffffff, emissive:0xffffff, emissiveIntensity:1.5 });
    let pads = [], state = { rings:4, steps:16, radius:8, bpm:120 };
    function build() {
      while (group.children.length) { const c = group.children[0]; group.remove(c); c.geometry.dispose(); }
      pads = [];
      for (let r = 0; r < state.rings; r++) {
        const rr = state.radius * (0.35 + r/state.rings * 0.65);
        for (let s = 0; s < state.steps; s++) {
          const a = (s/state.steps) * Math.PI * 2;
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.6), mat);
          m.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr);
          m.rotation.y = -a; group.add(m); pads.push({ m, r, s });
        }
      }
    }
    build();
    return {
      set(p, v) {
        if (p === 'color') { mat.color.set(v); mat.emissive.set(v); }
        else if (p === 'bpm') state.bpm = v;
        else { state[p] = v; build(); }
      },
      update(t) {
        const stepIdx = Math.floor((t * state.bpm / 60) % state.steps);
        pads.forEach(({ m, r, s }) => {
          const active = s === stepIdx;
          m.material = active ? playMat : mat;
          const a = audio.freq[Math.floor((r/state.rings) * 80 + 4)] / 255;
          m.scale.y = active ? 1 + a * 4 : 0.5 + a * 1.5;
        });
        group.rotation.y = t * 0.05;
      },
      dispose() { scene.remove(group); group.children.forEach(c => c.geometry.dispose()); mat.dispose(); playMat.dispose(); },
    };
  },
};
