import * as THREE from 'three';

export default {
  id: 'waterfall',
  label: 'FFT Waterfall',
  color: 0x66c2ff,
  controls: [
    { p:'width',  label:'Width',   min:8, max:60, step:0.5, val:30 },
    { p:'depth',  label:'Depth',   min:8, max:60, step:0.5, val:30 },
    { p:'height', label:'Height',  min:0.5, max:20, step:0.1, val:6 },
    { p:'bins',   label:'Bins',    min:32, max:256, step:1, val:128 },
    { p:'rows',   label:'Rows',    min:32, max:256, step:1, val:96 },
    { p:'color',  label:'Color', type:'color', val:'#66c2ff' },
  ],
  init({ scene, audio }) {
    let N = 128, R = 96;
    let geo, mesh, history;
    const mat = new THREE.MeshBasicMaterial({ color:0x66c2ff, wireframe:true, transparent:true, opacity:0.8 });
    function build() {
      if (mesh) { scene.remove(mesh); geo.dispose(); }
      geo = new THREE.PlaneGeometry(state.width, state.depth, N-1, R-1);
      geo.rotateX(-Math.PI/2);
      mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
      history = []; for (let i=0;i<R;i++) history.push(new Float32Array(N));
    }
    const state = { width:30, depth:30, height:6 };
    build();
    return {
      set(p, v) {
        if (p === 'color') mat.color.set(v);
        else if (p === 'bins') { N = v; build(); }
        else if (p === 'rows') { R = v; build(); }
        else { state[p] = v; build(); }
      },
      update() {
        history.unshift(history.pop());
        const cur = history[0];
        for (let i = 0; i < N; i++) cur[i] = audio.freq[Math.floor(i/N * audio.freq.length * 0.7)] / 255;
        const pos = geo.attributes.position;
        for (let r = 0; r < R; r++) for (let i = 0; i < N; i++) {
          pos.setY(r*N + i, history[r][i] * state.height);
        }
        pos.needsUpdate = true;
      },
      dispose() { scene.remove(mesh); geo.dispose(); mat.dispose(); },
    };
  },
};
