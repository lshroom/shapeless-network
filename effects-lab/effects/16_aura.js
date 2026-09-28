import * as THREE from 'three';

export default {
  id: 'aura',
  label: 'Aura Zone',
  color: 0xffb86a,
  controls: [
    { p:'size',    label:'Size',    min:2, max:18, step:0.1, val:7 },
    { p:'softness',label:'Softness',min:0.1, max:4, step:0.01, val:1.5 },
    { p:'pulse',   label:'Pulse',   min:0, max:3, step:0.01, val:1 },
    { p:'color',   label:'Color', type:'color', val:'#ffb86a' },
  ],
  init({ scene, audio }) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor:{value:new THREE.Color(0xffb86a)}, uSoft:{value:1.5}, uPulse:{value:0} },
      vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vN; varying vec3 vP;
        uniform vec3 uColor; uniform float uSoft, uPulse;
        void main() {
          vec3 V = normalize(-vec3(0.0,0.0,1.0));
          float fres = pow(1.0 - max(dot(vN, V), 0.0), uSoft);
          float a = fres * (0.6 + uPulse);
          gl_FragColor = vec4(uColor, clamp(a, 0.0, 1.0));
        }`,
      transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.FrontSide,
    });
    let mesh = new THREE.Mesh(new THREE.SphereGeometry(7, 48, 48), mat); scene.add(mesh);
    const state = { size:7, pulse:1 };
    return {
      set(p, v) {
        if (p === 'color') mat.uniforms.uColor.value.set(v);
        else if (p === 'softness') mat.uniforms.uSoft.value = v;
        else if (p === 'size') { state.size = v; mesh.scale.setScalar(v/7); }
        else if (p === 'pulse') state.pulse = v;
      },
      update() {
        mat.uniforms.uPulse.value = audio.rms * state.pulse;
      },
      dispose() { scene.remove(mesh); mesh.geometry.dispose(); mat.dispose(); },
    };
  },
};
