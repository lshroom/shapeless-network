import * as THREE from 'three';

export default {
  id: 'bars',
  label: '3D Bars',
  color: 0xffa840,
  controls: [
    { p:'count',   label:'Count',   min:8, max:160, step:1, val:64 },
    { p:'height',  label:'Height ×',min:0.5, max:30, step:0.1, val:10 },
    { p:'spacing', label:'Spacing', min:0, max:0.5, step:0.01, val:0.06 },
    { p:'smooth',  label:'Smooth',  min:0, max:0.97, step:0.01, val:0.5 },
    { p:'layout',  label:'Layout', type:'select', options:[{v:'line',l:'line'},{v:'circle',l:'circle'},{v:'spiral',l:'spiral'}], val:'line' },
    { p:'radius',  label:'Radius',  min:1, max:18, step:0.1, val:6 },
    { p:'mirror',  label:'Mirror', type:'select', options:[{v:0,l:'no'},{v:1,l:'yes'}], val:1 },
    { p:'color',   label:'Color', type:'color', val:'#ffa840' },
  ],
  init({ scene, audio }) {
    const group = new THREE.Group(); scene.add(group);
    scene.add(new THREE.AmbientLight(0x556677, 0.6));
    const d = new THREE.DirectionalLight(0xffffff, 0.5); d.position.set(5, 10, 5); scene.add(d);
    const mat = new THREE.MeshStandardMaterial({ color:0xffa840, emissive:0xffa840, emissiveIntensity:0.4, metalness:0.2, roughness:0.4 });
    let bars = [], smoothed = [];
    const state = { spacing:0.06, layout:'line', radius:6, smooth:0.5, height:10, mirror:1 };
    const W = 0.18;
    function build(n) {
      while (group.children.length) { const c = group.children[0]; group.remove(c); c.geometry.dispose(); }
      bars = []; smoothed = new Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(W, 1, W), mat);
        m.scale.y = 0.01; group.add(m); bars.push(m);
      }
      layout();
    }
    function layout() {
      const n = bars.length;
      bars.forEach((b, i) => {
        if (state.layout === 'circle') { const a = (i/n) * Math.PI*2; b.position.set(Math.cos(a)*state.radius, 0, Math.sin(a)*state.radius); b.rotation.y = -a; }
        else if (state.layout === 'spiral') { const a = (i/n) * Math.PI*4; const r = 0.5 + (i/n) * state.radius; b.position.set(Math.cos(a)*r, 0, Math.sin(a)*r); b.rotation.y = -a; }
        else { b.position.set((i - n/2) * (W + state.spacing), 0, 0); b.rotation.y = 0; }
      });
    }
    build(64);
    return {
      set(p, v) {
        if (p === 'count') build(v);
        else if (p === 'spacing' || p === 'layout' || p === 'radius') { state[p] = v; layout(); }
        else if (p === 'color') { mat.color.set(v); mat.emissive.set(v); }
        else state[p] = v;
      },
      update() {
        const n = bars.length, bins = audio.freq.length;
        for (let i = 0; i < n; i++) {
          const s = Math.floor((i/n) * bins * 0.6), e = Math.floor(((i+1)/n) * bins * 0.6);
          let x = 0, c = 0; for (let k = s; k < e; k++) { x += audio.freq[k]; c++; }
          const v = c ? x/c/255 : 0;
          smoothed[i] = smoothed[i] * state.smooth + v * (1 - state.smooth);
          const h = Math.max(0.02, smoothed[i] * state.height);
          bars[i].scale.y = h;
          bars[i].position.y = state.mirror ? 0 : h/2;
        }
      },
      dispose() { scene.remove(group); group.children.forEach(c => c.geometry.dispose()); mat.dispose(); },
    };
  },
};
