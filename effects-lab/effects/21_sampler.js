import * as THREE from 'three';

export default {
  id: 'sampler',
  label: 'Sampler Cube',
  color: 0x5fffae,
  controls: [
    { p:'size',    label:'Size',     min:1,   max:8,  step:0.1,  val:3 },
    { p:'amp',     label:'WaveAmp',  min:0.1, max:4,  step:0.05, val:1.2 },
    { p:'opacity', label:'Opacity',  min:0.05,max:1,  step:0.01, val:0.35 },
    { p:'spin',    label:'Spin',     min:0,   max:3,  step:0.01, val:0.4 },
    { p:'color',   label:'Color',    type:'color', val:'#5fffae' },
  ],
  init({ scene, audio }) {
    const N = 128;
    // 3 canvases: waveform, freq bars, circle
    const cvs = [0,1,2].map(() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256; return c;
    });
    const ctxs = cvs.map(c => c.getContext('2d'));
    const texs = cvs.map(c => new THREE.CanvasTexture(c));

    const col = new THREE.Color(0x5fffae);
    // one shared material per texture, DoubleSide + transparent
    const mats = texs.map(tex => new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.35,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    }));

    // assign: +x/-x = freq bars, +y/-y = circle, +z/-z = waveform
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    const faceMats = [mats[1], mats[1], mats[2], mats[2], mats[0], mats[0]];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(3,3,3), faceMats);
    scene.add(mesh);

    const state = { size:3, amp:1.2, opacity:0.35, spin:0.4, color:'#5fffae' };

    function drawWave(ctx, t) {
      ctx.clearRect(0,0,256,256);
      const hex = '#' + col.getHexString();
      ctx.strokeStyle = hex; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = i/(N-1)*256;
        const s = (audio.time[Math.floor(i/N*audio.time.length)]-128)/128;
        const y = 128 + s * 100 * state.amp;
        i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.stroke();
    }

    function drawBars(ctx) {
      ctx.clearRect(0,0,256,256);
      const hex = '#' + col.getHexString();
      const bins = 32;
      const bw = 256/bins - 1;
      for (let i = 0; i < bins; i++) {
        const v = audio.freq[Math.floor(i/bins*audio.freq.length)] / 255;
        const h = v * 220 * state.amp;
        ctx.fillStyle = hex;
        ctx.globalAlpha = 0.5 + v * 0.5;
        ctx.fillRect(i*(bw+1), 256-h, bw, h);
      }
      ctx.globalAlpha = 1;
    }

    function drawCircle(ctx, t) {
      ctx.clearRect(0,0,256,256);
      const hex = '#' + col.getHexString();
      ctx.strokeStyle = hex; ctx.lineWidth = 2; ctx.beginPath();
      const pts = 128;
      for (let i = 0; i <= pts; i++) {
        const angle = (i/pts)*Math.PI*2;
        const v = audio.freq[Math.floor(i/pts*audio.freq.length)]/255;
        const r = 80 + v * 70 * state.amp;
        const x = 128 + Math.cos(angle)*r;
        const y = 128 + Math.sin(angle)*r;
        i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.closePath(); ctx.stroke();
    }

    return {
      set(p, v) {
        if (p === 'color') col.set(v);
        else if (p === 'size') mesh.scale.setScalar(v/3);
        else if (p === 'opacity') mats.forEach(m => m.opacity = v);
        else state[p] = v;
      },
      update(t) {
        drawWave(ctxs[0], t);
        drawBars(ctxs[1]);
        drawCircle(ctxs[2], t);
        texs.forEach(tx => { tx.needsUpdate = true; });
        mesh.rotation.y = t * state.spin;
        mesh.rotation.x = t * state.spin * 0.4;
      },
      dispose() {
        scene.remove(mesh); mesh.geometry.dispose();
        mats.forEach(m => m.dispose()); texs.forEach(t => t.dispose());
      },
    };
  },
};
