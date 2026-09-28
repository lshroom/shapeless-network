import * as THREE from 'three';

export default {
  id: 'scope',
  label: 'Oscilloscope',
  color: 0x5fe3c8,
  controls: [
    { p:'width',  label:'Width',     min:4, max:60, step:0.5, val:30 },
    { p:'amp',    label:'Amplitude', min:0.1, max:10, step:0.05, val:4 },
    { p:'yoff',   label:'Y Offset',  min:-8, max:8, step:0.1, val:0 },
    { p:'thick',  label:'Thickness', min:1, max:12, step:0.5, val:3 },
    { p:'glow',   label:'Glow',      min:0, max:1, step:0.01, val:0.7 },
    { p:'color',  label:'Color', type:'color', val:'#5fe3c8' },
  ],
  init({ scene, audio }) {
    const N = 512;
    const pts = new Float32Array(N * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({ color:0x5fe3c8, transparent:true, opacity:0.95, linewidth:3 });
    const line = new THREE.Line(geo, mat); scene.add(line);
    const state = { width:30, amp:4, yoff:0, glow:0.7 };
    return {
      set(p, v) {
        if (p === 'color') mat.color.set(v);
        else if (p === 'thick') mat.linewidth = v;
        else if (p === 'glow') { state.glow = v; mat.opacity = 0.4 + v * 0.6; }
        else state[p] = v;
      },
      update() {
        for (let i = 0; i < N; i++) {
          const u = i/(N-1);
          const s = audio.time[Math.floor(u * (audio.time.length - 1))];
          pts[i*3+0] = (u - 0.5) * state.width;
          pts[i*3+1] = ((s - 128) / 128) * state.amp + state.yoff;
          pts[i*3+2] = 0;
        }
        geo.attributes.position.needsUpdate = true;
      },
      dispose() { scene.remove(line); geo.dispose(); mat.dispose(); },
    };
  },
};
