import * as THREE from 'three';
import { NOISE_GLSL } from '../_helpers.js';

export default {
  id: 'entropy',
  label: 'Spectral Entropy',
  color: 0xffd45f,
  controls: [
    { p:'size',   label:'Size',    min:1, max:6, step:0.05, val:2.8 },
    { p:'detail', label:'Detail',  min:1, max:6, step:1, val:4 },
    { p:'amount', label:'Amount',  min:0, max:3, step:0.01, val:1 },
    { p:'speed',  label:'Speed',   min:0, max:3, step:0.01, val:0.5 },
    { p:'color',  label:'Color', type:'color', val:'#ffd45f' },
  ],
  init({ scene, audio }) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime:{value:0}, uE:{value:0}, uAmount:{value:1}, uColor:{value:new THREE.Color(0xffd45f)} },
      vertexShader: `
        uniform float uTime, uE, uAmount;
        varying float vN;
        ${NOISE_GLSL}
        void main() {
          float n = fbm3(position * 0.8 + uTime * 0.3);
          float d = (n - 0.5) * uAmount * uE * 2.0;
          vec3 p = position + normal * d;
          vN = n;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        varying float vN; uniform vec3 uColor;
        void main(){ gl_FragColor = vec4(uColor * (0.4 + vN*1.2), 1.0); }`,
    });
    let mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(2.8, 4), mat); scene.add(mesh);
    scene.add(new THREE.AmbientLight(0x556677, 0.5));
    const state = { speed:0.5 };
    function entropy() {
      let sum = 0; for (let i = 0; i < audio.freq.length; i++) sum += audio.freq[i];
      if (sum < 1) return 0;
      let h = 0; for (let i = 0; i < audio.freq.length; i++) { const p = audio.freq[i]/sum; if (p > 0) h -= p * Math.log2(p); }
      return h / Math.log2(audio.freq.length);
    }
    return {
      set(p, v) {
        if (p === 'color') mat.uniforms.uColor.value.set(v);
        else if (p === 'amount') mat.uniforms.uAmount.value = v;
        else if (p === 'size') mesh.scale.setScalar(v / 2.8);
        else if (p === 'detail') { const old = mesh; mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(2.8, v), mat); mesh.scale.copy(old.scale); scene.add(mesh); scene.remove(old); old.geometry.dispose(); }
        else if (p === 'speed') state.speed = v;
      },
      update(t) {
        mat.uniforms.uTime.value = t * state.speed;
        mat.uniforms.uE.value = entropy();
        mesh.rotation.y = t * 0.15;
      },
      dispose() { scene.remove(mesh); mesh.geometry.dispose(); mat.dispose(); },
    };
  },
};
