import * as THREE from 'three';

export default {
  id: 'sculpt',
  label: 'WAV Sculpture',
  color: 0xc78bff,
  controls: [
    { p:'length', label:'Length',  min:6, max:60, step:0.5, val:28 },
    { p:'depth',  label:'Depth',   min:1, max:20, step:0.1, val:8 },
    { p:'rings',  label:'Rings',   min:6, max:80, step:1, val:32 },
    { p:'spin',   label:'Spin',    min:0, max:2, step:0.01, val:0.2 },
    { p:'color',  label:'Color', type:'color', val:'#c78bff' },
  ],
  init({ scene, audio }) {
    const N = 256, R = 32;
    const geo = new THREE.PlaneGeometry(28, 8, N-1, R-1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color:0xc78bff, emissive:0xc78bff, emissiveIntensity:0.4, metalness:0.3, roughness:0.5, side:THREE.DoubleSide, wireframe:false });
    const mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
    scene.add(new THREE.AmbientLight(0x445566, 0.5));
    const d = new THREE.DirectionalLight(0xffffff, 0.6); d.position.set(5, 10, 5); scene.add(d);
    const history = [];
    for (let i = 0; i < R; i++) history.push(new Float32Array(N));
    const state = { length:28, depth:8, spin:0.2 };
    return {
      set(p, v) { if (p === 'color') { mat.color.set(v); mat.emissive.set(v); } else if (p !== 'rings') state[p] = v; },
      update(t) {
        history.unshift(history.pop());
        const cur = history[0];
        for (let i = 0; i < N; i++) cur[i] = (audio.time[Math.floor(i/N * audio.time.length)] - 128) / 128;
        const pos = geo.attributes.position;
        for (let r = 0; r < R; r++) {
          for (let i = 0; i < N; i++) {
            const idx = r * N + i;
            pos.setX(idx, (i/(N-1) - 0.5) * state.length);
            pos.setY(idx, history[r][i] * state.depth);
            pos.setZ(idx, (r/(R-1) - 0.5) * state.length * 0.35);
          }
        }
        pos.needsUpdate = true; geo.computeVertexNormals();
        mesh.rotation.y = t * state.spin;
      },
      dispose() { scene.remove(mesh); geo.dispose(); mat.dispose(); },
    };
  },
};
