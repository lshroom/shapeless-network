import * as THREE from 'three';
import { NOISE_GLSL } from '../_helpers.js';

export default {
  id: 'fluff',
  label: 'Vertex Sphere',
  color: 0xff8acc,
  controls: [
    { p:'amount', label:'Amount',    min:0, max:3, step:0.01, val:0.6 },
    { p:'scale',  label:'Scale',     min:0.2, max:6, step:0.05, val:1.6 },
    { p:'speed',  label:'Speed',     min:0, max:3, step:0.01, val:0.6 },
    { p:'bass',   label:'Bass push', min:0, max:5, step:0.05, val:2 },
    { p:'high',   label:'High ripple',min:0, max:5, step:0.05, val:1.5 },
    { p:'wire',   label:'Wire', type:'select', options:[{v:0,l:'solid'},{v:1,l:'wire'}], val:0 },
    { p:'color',  label:'Color', type:'color', val:'#ff8acc' },
  ],
  init({ scene, audio }) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime:{value:0}, uAmount:{value:0.6}, uScale:{value:1.6},
                  uBass:{value:0}, uHigh:{value:0}, uColor:{value:new THREE.Color(0xff8acc)} },
      vertexShader: `
        uniform float uTime,uAmount,uScale,uBass,uHigh;
        varying float vH;
        ${NOISE_GLSL}
        void main(){
          float n = fbm3(position * uScale + uTime * 0.6);
          float ripple = sin(length(position) * 6.0 + uTime * 4.0) * uHigh * 0.12;
          float d = uAmount * n + uBass * 0.18 + ripple;
          vec3 p = position + normal * d;
          vH = d;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        varying float vH; uniform vec3 uColor;
        void main(){
          vec3 col = mix(vec3(0.05,0.02,0.08), uColor, clamp(vH * 1.6 + 0.2, 0.0, 1.0));
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 6), mat);
    scene.add(mesh);
    scene.add(new THREE.AmbientLight(0x445566, 0.4));
    const state = { speed:0.6, bass:2, high:1.5 };
    return {
      set(p, v) {
        if (p === 'amount') mat.uniforms.uAmount.value = v;
        else if (p === 'scale') mat.uniforms.uScale.value = v;
        else if (p === 'speed') state.speed = v;
        else if (p === 'bass') state.bass = v;
        else if (p === 'high') state.high = v;
        else if (p === 'wire') mat.wireframe = !!v;
        else if (p === 'color') mat.uniforms.uColor.value.set(v);
      },
      update(t) {
        mat.uniforms.uTime.value = t * state.speed;
        mat.uniforms.uBass.value = audio.bass * state.bass;
        mat.uniforms.uHigh.value = audio.high * state.high;
        mesh.rotation.y = t * 0.1;
      },
      dispose() { scene.remove(mesh); mesh.geometry.dispose(); mat.dispose(); },
    };
  },
};
