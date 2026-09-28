import * as THREE from 'three';

export default {
  id: 'ribbon',
  label: 'Waveform Ribbon',
  color: 0x5fe17a,
  controls: [
    { p:'length', label:'Length',    min:6, max:50, step:0.5, val:24 },
    { p:'twist',  label:'Twist',     min:0, max:30, step:0.1, val:8 },
    { p:'amp',    label:'Amplitude', min:0.1, max:8, step:0.05, val:3 },
    { p:'width',  label:'Width',     min:0.05, max:2, step:0.01, val:0.6 },
    { p:'spin',   label:'Spin',      min:0, max:3, step:0.01, val:0.5 },
    { p:'color',  label:'Color', type:'color', val:'#5fe17a' },
  ],
  init({ scene, audio }) {
    const N = 256;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 2 * 3);
    const idx = [];
    for (let i = 0; i < N - 1; i++) {
      const a = i*2, b = i*2+1, c = (i+1)*2, d = (i+1)*2+1;
      idx.push(a,b,c, b,d,c);
    }
    geo.setIndex(idx); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.MeshBasicMaterial({ color:0x5fe17a, side:THREE.DoubleSide, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false });
    const mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
    const state = { length:24, twist:8, amp:3, width:0.6, spin:0.5 };
    return {
      set(p, v) { if (p === 'color') mat.color.set(v); else state[p] = v; },
      update(t) {
        for (let i = 0; i < N; i++) {
          const u = i/(N-1); const x = (u - 0.5) * state.length;
          const samp = (audio.time[Math.floor(u * (audio.time.length - 1))] - 128) / 128;
          const a = u * state.twist + t * state.spin; const r = samp * state.amp;
          const cy = Math.cos(a) * r, cz = Math.sin(a) * r;
          const ey = Math.sin(a) * state.width, ez = -Math.cos(a) * state.width;
          pos[i*6+0] = x; pos[i*6+1] = cy + ey; pos[i*6+2] = cz + ez;
          pos[i*6+3] = x; pos[i*6+4] = cy - ey; pos[i*6+5] = cz - ez;
        }
        geo.attributes.position.needsUpdate = true;
      },
      dispose() { scene.remove(mesh); geo.dispose(); mat.dispose(); },
    };
  },
};
