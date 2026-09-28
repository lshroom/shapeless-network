import * as THREE from 'three';

export default {
  id: 'floor',
  label: 'Color-Temp Floor',
  color: 0xff7a5a,
  controls: [
    { p:'size',   label:'Size',    min:10, max:80, step:1, val:40 },
    { p:'div',    label:'Divisions', min:8, max:80, step:1, val:32 },
    { p:'amp',    label:'Amplitude', min:0, max:6, step:0.05, val:2 },
    { p:'warm',   label:'Warm', type:'color', val:'#ff6a3a' },
    { p:'cool',   label:'Cool', type:'color', val:'#3a8aff' },
  ],
  init({ scene, audio }) {
    let geo, mesh;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime:{value:0}, uBass:{value:0}, uHigh:{value:0}, uWarm:{value:new THREE.Color(0xff6a3a)}, uCool:{value:new THREE.Color(0x3a8aff)} },
      vertexShader: `
        uniform float uTime, uBass; varying vec2 vUv; varying float vH;
        void main() {
          vUv = uv;
          float r = length(position.xz);
          float h = sin(r * 0.5 - uTime * 2.0) * uBass;
          vH = h;
          vec3 p = position; p.y = h;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        varying vec2 vUv; varying float vH;
        uniform vec3 uWarm, uCool; uniform float uHigh;
        void main() {
          float t = clamp(vH * 0.5 + 0.5 + uHigh * 0.3, 0.0, 1.0);
          vec3 c = mix(uCool, uWarm, t);
          gl_FragColor = vec4(c, 1.0);
        }`,
      side: THREE.DoubleSide, wireframe:false,
    });
    function build(size, div) {
      if (mesh) { scene.remove(mesh); geo.dispose(); }
      geo = new THREE.PlaneGeometry(size, size, div, div);
      geo.rotateX(-Math.PI/2);
      mesh = new THREE.Mesh(geo, mat); mesh.position.y = -2; scene.add(mesh);
    }
    const state = { size:40, div:32, amp:2 };
    build(40, 32);
    return {
      set(p, v) {
        if (p === 'warm') mat.uniforms.uWarm.value.set(v);
        else if (p === 'cool') mat.uniforms.uCool.value.set(v);
        else if (p === 'size') { state.size = v; build(state.size, state.div); }
        else if (p === 'div') { state.div = v; build(state.size, state.div); }
        else if (p === 'amp') state.amp = v;
      },
      update(t) {
        mat.uniforms.uTime.value = t;
        mat.uniforms.uBass.value = audio.bass * state.amp;
        mat.uniforms.uHigh.value = audio.high;
      },
      dispose() { scene.remove(mesh); geo.dispose(); mat.dispose(); },
    };
  },
};
