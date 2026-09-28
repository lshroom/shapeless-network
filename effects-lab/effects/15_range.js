import * as THREE from 'three';

export default {
  id: 'range',
  label: 'Range Sphere',
  color: 0x9affae,
  controls: [
    { p:'size',   label:'Size',    min:1, max:10, step:0.1, val:4 },
    { p:'detail', label:'Detail',  min:1, max:5, step:1, val:3 },
    { p:'amp',    label:'Pulse',   min:0, max:3, step:0.01, val:1 },
    { p:'color',  label:'Color', type:'color', val:'#9affae' },
  ],
  init({ scene, audio }) {
    const mat = new THREE.MeshBasicMaterial({ color:0x9affae, wireframe:true, transparent:true, opacity:0.8 });
    let mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 3), mat); scene.add(mesh);
    const state = { size:4, amp:1 };
    return {
      set(p, v) {
        if (p === 'color') mat.color.set(v);
        else if (p === 'detail') { const old = mesh; mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, v), mat); scene.add(mesh); scene.remove(old); old.geometry.dispose(); }
        else if (p === 'size') state.size = v;
        else if (p === 'amp') state.amp = v;
      },
      update(t) {
        const s = state.size * (0.7 + audio.rms * state.amp);
        mesh.scale.setScalar(s);
        mesh.rotation.y = t * 0.2; mesh.rotation.x = t * 0.1;
        mat.opacity = 0.4 + audio.high * 0.6;
      },
      dispose() { scene.remove(mesh); mesh.geometry.dispose(); mat.dispose(); },
    };
  },
};
