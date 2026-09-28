import * as THREE from 'three';

export default {
  id: 'textcloud',
  label: 'Text Cloud',
  color: 0xaaddff,
  controls: [
    { p:'text',    label:'Text',    type:'select', val:'GHOST', options:[{v:'GHOST',l:'GHOST'},{v:'LOVE',l:'LOVE'},{v:'WORLD',l:'WORLD'},{v:'MUSIC',l:'MUSIC'},{v:'∞',l:'∞'}] },
    { p:'size',    label:'Pt Size', min:0.02, max:0.3, step:0.005, val:0.06 },
    { p:'spread',  label:'Spread',  min:0.5, max:8, step:0.1, val:3 },
    { p:'speed',   label:'Speed',   min:0, max:3, step:0.05, val:0.6 },
    { p:'color',   label:'Color',   type:'color', val:'#aaddff' },
  ],
  init({ scene, audio }) {
    // Build particle cloud from text on a 2D canvas
    const SRC = 512, SRC_H = 256;
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = SRC; srcCanvas.height = SRC_H;
    const ctx = srcCanvas.getContext('2d', { willReadFrequently:true });
    const state = { text:'GHOST', size:0.06, spread:3, speed:0.6 };

    const mat = new THREE.PointsMaterial({ color:0xaaddff, size:0.06, sizeAttenuation:true, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false });
    let pts = null, targets = null, origins = null, N = 0;

    function buildCloud(text) {
      if (pts) { scene.remove(pts); pts.geometry.dispose(); }
      ctx.clearRect(0, 0, SRC, SRC_H);
      ctx.fillStyle = '#fff';
      const fs = Math.min(SRC * 0.7, SRC_H * 0.85);
      ctx.font = `bold ${fs}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, SRC/2, SRC_H/2);
      const data = ctx.getImageData(0, 0, SRC, SRC_H).data;
      const pts2d = [];
      for (let y = 0; y < SRC_H; y += 3) for (let x = 0; x < SRC; x += 3)
        if (data[(y*SRC+x)*4+3] > 128) pts2d.push([(x/SRC-0.5)*state.spread*2, -(y/SRC_H-0.5)*state.spread]);
      N = pts2d.length;
      const pos = new Float32Array(N*3), vel = new Float32Array(N*3);
      targets = new Float32Array(N*3); origins = new Float32Array(N*3);
      for (let i = 0; i < N; i++) {
        const rx = (Math.random()-0.5)*6, ry = (Math.random()-0.5)*6, rz = (Math.random()-0.5)*6;
        pos[i*3]=rx; pos[i*3+1]=ry; pos[i*3+2]=rz;
        targets[i*3]=pts2d[i][0]; targets[i*3+1]=pts2d[i][1]; targets[i*3+2]=0;
        origins[i*3]=rx; origins[i*3+1]=ry; origins[i*3+2]=rz;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      pts = new THREE.Points(geo, mat); scene.add(pts);
    }
    buildCloud('GHOST');
    scene.add(new THREE.AmbientLight(0x334466, 0.5));

    return {
      set(p, v) {
        if (p === 'text') { state.text = v; buildCloud(v); }
        else if (p === 'color') mat.color.set(v);
        else if (p === 'size') mat.size = v;
        else state[p] = v;
      },
      update(t) {
        if (!pts) return;
        const pos = pts.geometry.attributes.position.array;
        const rms = audio.rms;
        const lp = 0.04 + state.speed * 0.02;
        for (let i = 0; i < N; i++) {
          const tx = targets[i*3] + (Math.sin(t*0.5+i*0.01)*rms*0.4);
          const ty = targets[i*3+1] + (Math.cos(t*0.4+i*0.013)*rms*0.3);
          pos[i*3]   += (tx - pos[i*3])   * lp;
          pos[i*3+1] += (ty - pos[i*3+1]) * lp;
          pos[i*3+2] += (0  - pos[i*3+2]) * lp;
        }
        mat.size = state.size * (1 + rms * 3);
        pts.geometry.attributes.position.needsUpdate = true;
        pts.rotation.y = Math.sin(t * 0.08) * 0.3;
      },
      dispose() { if(pts){scene.remove(pts);pts.geometry.dispose();} mat.dispose(); },
    };
  },
};
