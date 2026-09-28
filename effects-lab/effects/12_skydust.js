import * as THREE from 'three';

export default {
  id: 'skydust',
  label: 'SkyDust Spatial',
  color: 0xb6e8ff,
  controls: [
    { p:'voices', label:'Voices',  min:4, max:32, step:1, val:12 },
    { p:'radius', label:'Radius',  min:3, max:25, step:0.5, val:12 },
    { p:'size',   label:'Size',    min:0.2, max:3, step:0.05, val:0.8 },
    { p:'drift',  label:'Drift',   min:0, max:2, step:0.01, val:0.4 },
    { p:'color',  label:'Color', type:'color', val:'#b6e8ff' },
  ],
  init({ scene, audio }) {
    const group = new THREE.Group(); scene.add(group);
    scene.add(new THREE.AmbientLight(0x223344, 0.6));
    const mat = new THREE.MeshBasicMaterial({ color:0xb6e8ff, transparent:true, opacity:0.85, blending:THREE.AdditiveBlending, depthWrite:false });
    let voices = [];
    const state = { voices:12, radius:12, size:0.8, drift:0.4 };
    function build() {
      while (group.children.length) { const c = group.children[0]; group.remove(c); c.geometry.dispose(); }
      voices = [];
      for (let i = 0; i < state.voices; i++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(state.size, 12, 12), mat);
        const ph = Math.random() * Math.PI * 2;
        const th = Math.acos(2 * Math.random() - 1);
        m.userData = { ph, th, sp: 0.3 + Math.random() * 1.2, bin: Math.floor(Math.random() * 128) };
        group.add(m); voices.push(m);
      }
    }
    build();
    return {
      set(p, v) {
        if (p === 'color') mat.color.set(v);
        else if (p === 'size') { state.size = v; voices.forEach(m => m.scale.setScalar(v / 0.8)); }
        else { state[p] = v; if (p === 'voices') build(); }
      },
      update(t) {
        voices.forEach(m => {
          const d = m.userData;
          const a = audio.freq[d.bin] / 255;
          const ang = t * state.drift * d.sp + d.ph;
          const r = state.radius * (0.4 + a * 1.2);
          m.position.set(
            Math.sin(d.th) * Math.cos(ang) * r,
            Math.cos(d.th + a) * r * 0.6,
            Math.sin(d.th) * Math.sin(ang) * r,
          );
          mat.opacity = 0.4 + audio.rms * 0.6;
        });
      },
      dispose() { scene.remove(group); group.children.forEach(c => c.geometry.dispose()); mat.dispose(); },
    };
  },
};
