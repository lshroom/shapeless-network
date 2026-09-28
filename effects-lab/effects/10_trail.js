import * as THREE from 'three';

export default {
  id: 'trail',
  label: 'Trail / Feedback',
  color: 0xff5fb7,
  controls: [
    { p:'count',  label:'Trails',   min:4, max:80, step:1, val:24 },
    { p:'length', label:'Length',   min:20, max:400, step:5, val:120 },
    { p:'radius', label:'Radius',   min:1, max:18, step:0.1, val:6 },
    { p:'speed',  label:'Speed',    min:0, max:3, step:0.01, val:0.8 },
    { p:'thick',  label:'Thickness',min:1, max:8, step:0.5, val:2 },
    { p:'color',  label:'Color', type:'color', val:'#ff5fb7' },
  ],
  init({ scene, audio }) {
    const group = new THREE.Group(); scene.add(group);
    const mat = new THREE.LineBasicMaterial({ color:0xff5fb7, transparent:true, opacity:0.8, blending:THREE.AdditiveBlending, depthWrite:false });
    let trails = [];
    const state = { count:24, length:120, radius:6, speed:0.8 };
    function build() {
      while (group.children.length) { const c = group.children[0]; group.remove(c); c.geometry.dispose(); }
      trails = [];
      for (let i = 0; i < state.count; i++) {
        const buf = new Float32Array(state.length * 3);
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(buf, 3));
        const l = new THREE.Line(g, mat); group.add(l);
        trails.push({ g, buf, phase: Math.random() * Math.PI * 2, k: 0.5 + Math.random() * 1.5 });
      }
    }
    build();
    return {
      set(p, v) {
        if (p === 'color') mat.color.set(v);
        else if (p === 'thick') mat.linewidth = v;
        else if (p === 'speed') state.speed = v;
        else { state[p] = v; build(); }
      },
      update(t) {
        const a = audio.rms;
        trails.forEach((tr, i) => {
          for (let j = state.length - 1; j > 0; j--) {
            tr.buf[j*3+0] = tr.buf[(j-1)*3+0];
            tr.buf[j*3+1] = tr.buf[(j-1)*3+1];
            tr.buf[j*3+2] = tr.buf[(j-1)*3+2];
          }
          const ang = t * state.speed * tr.k + tr.phase;
          const r = state.radius * (0.6 + a * 0.8);
          tr.buf[0] = Math.cos(ang) * r;
          tr.buf[1] = Math.sin(ang * 1.3 + i) * r * 0.7;
          tr.buf[2] = Math.sin(ang) * r;
          tr.g.attributes.position.needsUpdate = true;
        });
      },
      dispose() { scene.remove(group); group.children.forEach(c => c.geometry.dispose()); mat.dispose(); },
    };
  },
};
