import * as THREE from 'three';
import { NOISE_GLSL } from '../_helpers.js';

const VERT = `
uniform float uTime, uAudio, uMorph, uSpeed;
varying float vD; varying vec3 vNorm;
${NOISE_GLSL}
void main(){
  float n = fbm3(position * 1.2 + uTime * uSpeed * 0.4);
  float n2 = fbm3(position * 3.0 - uTime * uSpeed * 0.3);
  float morph = mix(n, n2, uMorph);
  float d = morph * (0.35 + uAudio * 0.9);
  vec3 pos = position + normal * d;
  vD = morph; vNorm = normalize(normalMatrix * (normal + vec3(n-0.5)*0.3));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

const FRAG = `
uniform vec3 uColorA, uColorB; uniform float uAudio;
varying float vD; varying vec3 vNorm;
void main(){
  vec3 light = normalize(vec3(1,1.5,1));
  float diff = max(dot(vNorm, light), 0.0);
  float rim = pow(1.0 - abs(dot(vNorm, vec3(0,0,1))), 3.0);
  vec3 c = mix(uColorA, uColorB, vD);
  gl_FragColor = vec4(c * (0.15 + diff*0.75) + uColorB * rim * (0.3 + uAudio), 1.0);
}`;

export default {
  id: 'sculpt',
  label: 'Sculpt',
  color: 0xff6644,
  controls: [
    { p:'morph',   label:'Morph',    min:0,   max:1,   step:0.01, val:0.5 },
    { p:'speed',   label:'Speed',    min:0,   max:2,   step:0.02, val:0.6 },
    { p:'detail',  label:'Detail',   min:1,   max:7,   step:1,    val:4 },
    { p:'colorA',  label:'Color A',  type:'color', val:'#ff6644' },
    { p:'colorB',  label:'Color B',  type:'color', val:'#4488ff' },
  ],
  init({ scene, audio }) {
    const uniforms = {
      uTime:{value:0}, uAudio:{value:0}, uMorph:{value:0.5}, uSpeed:{value:0.6},
      uColorA:{value:new THREE.Color(0xff6644)}, uColorB:{value:new THREE.Color(0x4488ff)},
    };
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader:VERT, fragmentShader:FRAG });
    let mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(2, 4), mat);
    scene.add(mesh);
    scene.add(new THREE.AmbientLight(0x223344, 0.3));
    const state = { detail:4 };

    return {
      set(p, v) {
        if (p === 'colorA') uniforms.uColorA.value.set(v);
        else if (p === 'colorB') uniforms.uColorB.value.set(v);
        else if (p === 'detail') {
          scene.remove(mesh); mesh.geometry.dispose();
          mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(2, Math.round(v)), mat);
          scene.add(mesh); state.detail = v;
        }
        else if (uniforms['u' + p.charAt(0).toUpperCase() + p.slice(1)]) uniforms['u' + p.charAt(0).toUpperCase() + p.slice(1)].value = v;
      },
      update(t) {
        uniforms.uTime.value = t;
        uniforms.uAudio.value = audio.rms;
        mesh.rotation.y = t * 0.1;
        mesh.rotation.x = Math.sin(t * 0.07) * 0.15;
      },
      dispose() { scene.remove(mesh); mesh.geometry.dispose(); mat.dispose(); },
    };
  },
};
