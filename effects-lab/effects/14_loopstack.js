import * as THREE from 'three';

export default {
  id: 'loopStack',
  label: 'Loop-Stack Tori',
  color: 0xe05fff,
  controls: [
    { p:'count', label:'Loops',   min:2, max:16, step:1, val:6 },
    { p:'spacing', label:'Spacing', min:0.3, max:3, step:0.05, val:1 },
    { p:'radius', label:'Radius', min:1, max:8, step:0.1, val:3 },
    { p:'tube',   label:'Tube',   min:0.05, max:1, step:0.01, val:0.25 },
    { p:'spin',   label:'Spin',   min:0, max:3, step:0.01, val:0.5 },
    { p:'color',  label:'Color', type:'color', val:'#e05fff' },
  ],
  init({ scene, audio }) {
    const group = new THREE.Group(); scene.add(group);
    scene.add(new THREE.AmbientLight(0x334455, 0.6));
    const mat = new THREE.MeshStandardMaterial({ color:0xe05fff, emissive:0xe05fff, emissiveIntensity:0.5, metalness:0.6, roughness:0.3, transparent:true, opacity:0.85 });
    let tori = [];
    const state = { count:6, spacing:1, radius:3, tube:0.25, spin:0.5 };
    function build() {
      while (group.children.length) { const c = group.children[0]; group.remove(c); c.geometry.dispose(); }
      tori = [];
      for (let i = 0; i < state.count; i++) {
        const m = new THREE.Mesh(new THREE.TorusGeometry(state.radius, state.tube, 16, 64), mat);
        m.position.y = (i - state.count/2) * state.spacing;
        m.rotation.x = Math.PI/2;
        group.add(m); tori.push(m);
      }
    }
    build();
    return {
      set(p, v) {
        if (p === 'color') { mat.color.set(v); mat.emissive.set(v); }
        else if (p === 'spin') state.spin = v;
        else { state[p] = v; build(); }
      },
      update(t) {
        tori.forEach((m, i) => {
          const a = audio.freq[Math.floor((i/tori.length) * 100 + 4)] / 255;
          m.scale.setScalar(0.7 + a * 1.5);
          m.rotation.z = t * state.spin * (i % 2 ? 1 : -1);
        });
        mat.emissiveIntensity = 0.3 + audio.rms * 1.5;
      },
      dispose() { scene.remove(group); group.children.forEach(c => c.geometry.dispose()); mat.dispose(); },
    };
  },
};
