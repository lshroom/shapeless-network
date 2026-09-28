import * as THREE from 'three';
import { NOISE_GLSL } from '../_helpers.js';

const VERT = `
uniform float uTime, uSpeed, uScale, uAmount, uAudio;
varying vec3 vNorm; varying float vN;
${NOISE_GLSL}
void main(){
  float low  = fbm3(position * uScale + vec3(uTime * uSpeed));
  float fuzz = fbm3(position * uScale * 6.0 + vec3(-uTime * uSpeed * 0.8));
  fuzz += 0.5 * fbm3(position * uScale * 14.0 + vec3(uTime * uSpeed * 1.3));
  float disp = (low * 0.6 + fuzz * 0.4) * uAmount * (1.0 + uAudio * 1.5);
  vec3 pos = position + normal * disp;
  vNorm = normalize(normalMatrix * normal);
  vN = fuzz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

const FRAG = `
uniform vec3 uColor; uniform float uAudio;
varying vec3 vNorm; varying float vN;
void main(){
  vec3 light = normalize(vec3(0.5, 1.0, 0.8));
  float diff = max(dot(vNorm, light), 0.0);
  float rim = pow(1.0 - abs(dot(vNorm, vec3(0,0,1))), 2.5);
  vec3 c = uColor * (0.2 + diff * 0.7 + rim * 0.4 * (1.0 + uAudio));
  gl_FragColor = vec4(c + vN * 0.08, 1.0);
}`;

export default {
  id: 'fluff',
  label: 'Fluff',
  color: 0xff99cc,
  controls: [
    { p:'amount', label:'Amount',  min:0,   max:1.5, step:0.01, val:0.35 },
    { p:'scale',  label:'Scale',   min:0.2, max:4,   step:0.05, val:1.2 },
    { p:'speed',  label:'Speed',   min:0,   max:3,   step:0.02, val:0.5 },
    { p:'shape',  label:'Shape',   type:'select', val:'sphere', options:[{v:'sphere',l:'Sphere'},{v:'torus',l:'Torus'},{v:'box',l:'Box'},{v:'ico',l:'Icosa'}] },
    { p:'color',  label:'Color',   type:'color',  val:'#ff99cc' },
  ],
  init({ scene, audio }) {
    const uniforms = {
      uTime:{value:0}, uSpeed:{value:0.5}, uScale:{value:1.2},
      uAmount:{value:0.35}, uAudio:{value:0}, uColor:{value:new THREE.Color(0xff99cc)},
    };
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader:VERT, fragmentShader:FRAG, side:THREE.FrontSide });
    let mesh = null;
    const state = { shape:'sphere' };

    function buildMesh(shape) {
      if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); }
      let geo;
      if (shape === 'torus') geo = new THREE.TorusGeometry(0.9, 0.34, 64, 96);
      else if (shape === 'box') geo = new THREE.BoxGeometry(1.4,1.4,1.4, 20,20,20);
      else if (shape === 'ico') geo = new THREE.IcosahedronGeometry(1.1, 5);
      else geo = new THREE.SphereGeometry(1, 80, 80);
      mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
    }
    buildMesh('sphere');
    scene.add(new THREE.AmbientLight(0x223344, 0.4));

    return {
      set(p, v) {
        if (p === 'shape') { state.shape = v; buildMesh(v); }
        else if (p === 'color') uniforms.uColor.value.set(v);
        else if (uniforms['u' + p.charAt(0).toUpperCase() + p.slice(1)]) uniforms['u' + p.charAt(0).toUpperCase() + p.slice(1)].value = v;
      },
      update(t) {
        uniforms.uTime.value = t;
        uniforms.uAudio.value = audio.rms;
        if (mesh) mesh.rotation.y = t * 0.1;
      },
      dispose() { if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); } mat.dispose(); },
    };
  },
};
