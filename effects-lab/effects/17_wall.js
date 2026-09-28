import * as THREE from 'three';

export default {
  id: 'wall',
  label: 'Sound Wall',
  color: 0x6f9bff,
  controls: [
    { p:'width',  label:'Width',   min:8, max:60, step:0.5, val:24 },
    { p:'height', label:'Height',  min:4, max:30, step:0.5, val:12 },
    { p:'cols',   label:'Cols',    min:8, max:128, step:1, val:48 },
    { p:'rows',   label:'Rows',    min:4, max:64, step:1, val:24 },
    { p:'amp',    label:'Push',    min:0, max:8, step:0.05, val:2.5 },
    { p:'mode',   label:'Mode', type:'select', options:[{v:'concrete',l:'concrete'},{v:'glass',l:'glass'},{v:'fabric',l:'fabric'}], val:'concrete' },
    { p:'color',  label:'Color', type:'color', val:'#6f9bff' },
  ],
  init({ scene, audio }) {
    scene.add(new THREE.AmbientLight(0x445566, 0.6));
    const d = new THREE.DirectionalLight(0xffffff, 0.5); d.position.set(5,10,5); scene.add(d);
    const modes = {
      concrete: () => new THREE.MeshStandardMaterial({ color:0x6f9bff, roughness:0.9, metalness:0.0 }),
      glass:    () => new THREE.MeshStandardMaterial({ color:0x6f9bff, roughness:0.1, metalness:0.0, transparent:true, opacity:0.7 }),
      fabric:   () => new THREE.MeshStandardMaterial({ color:0x6f9bff, roughness:0.7, metalness:0.2, emissive:0x6f9bff, emissiveIntensity:0.2 }),
    };
    let mat = modes.concrete();
    let geo, mesh;
    const state = { width:24, height:12, cols:48, rows:24, amp:2.5, mode:'concrete' };
    function build() {
      if (mesh) { scene.remove(mesh); geo.dispose(); }
      geo = new THREE.PlaneGeometry(state.width, state.height, state.cols, state.rows);
      mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
    }
    build();
    return {
      set(p, v) {
        if (p === 'color') mat.color.set(v);
        else if (p === 'mode') { state.mode = v; mat.dispose(); mat = modes[v](); mat.color.set(state.colorVal || 0x6f9bff); mesh.material = mat; }
        else if (p === 'amp') state.amp = v;
        else { state[p] = v; build(); }
      },
      update() {
        const pos = geo.attributes.position;
        const cols = state.cols + 1, rows = state.rows + 1;
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const u = x / cols;
          const a = audio.freq[Math.floor(u * audio.freq.length * 0.7)] / 255;
          pos.setZ(y*cols + x, a * state.amp);
        }
        pos.needsUpdate = true; geo.computeVertexNormals();
      },
      dispose() { scene.remove(mesh); geo.dispose(); mat.dispose(); },
    };
  },
};
