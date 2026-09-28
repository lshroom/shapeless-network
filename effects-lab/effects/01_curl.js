import * as THREE from 'three';
import { NOISE_GLSL } from '../_helpers.js';

export default {
  id: 'curl',
  label: 'Curl Particles',
  color: 0x5ad9ff,
  controls: [
    { p:'count',   label:'Count',     min:2000, max:60000, step:500, val:14000 },
    { p:'speed',   label:'Speed',     min:0, max:3, step:0.01, val:0.6 },
    { p:'size',    label:'Size',      min:0.5, max:8, step:0.1, val:2.4 },
    { p:'opacity', label:'Opacity',   min:0.05, max:1, step:0.01, val:0.7 },
    { p:'bx',      label:'Bass→X',    min:0, max:3, step:0.01, val:1 },
    { p:'by',      label:'Mid→Y',     min:0, max:3, step:0.01, val:1 },
    { p:'bz',      label:'High→Z',    min:0, max:3, step:0.01, val:1 },
    { p:'rad',     label:'Sphere R',  min:2, max:30, step:0.5, val:11 },
    { p:'fill',    label:'Fill',      type:'select', val:'empty', options:[{v:'empty',l:'Empty'},{v:'white',l:'White'},{v:'hollow',l:'Hollow'}] },
    { p:'color',   label:'Color',     type:'color', val:'#5ad9ff' },
  ],
  init({ scene, audio }) {
    const opts = { count:14000 };
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime:{value:0}, uTX:{value:1}, uTY:{value:1}, uTZ:{value:1},
                  uAmp:{value:1}, uMaxDist:{value:11}, uPSize:{value:2.4}, uOp:{value:0.7},
                  uColor:{value:new THREE.Color(0x5ad9ff)} },
      vertexShader: `
        uniform float uTime,uTX,uTY,uTZ,uAmp,uMaxDist,uPSize;
        ${NOISE_GLSL}
        void main(){
          vec3 p = position;
          vec3 c = vec3(n3(p*0.18 + vec3(uTime*uTX,0,0)) - 0.5,
                        n3(p*0.18 + vec3(0,uTime*uTY,0)) - 0.5,
                        n3(p*0.18 + vec3(0,0,uTime*uTZ)) - 0.5);
          p += c * uAmp * 2.0;
          float L = length(p);
          if (L > uMaxDist) p *= uMaxDist / L;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uPSize * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uOp;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(uColor, (1.0 - d*2.0) * uOp);
        }`,
      blending: THREE.AdditiveBlending, depthWrite:false, depthTest:false, transparent:true,
    });

    // inner fill sphere — renders before particles so particles glow over it
    const fillMat = new THREE.MeshBasicMaterial({ color:0x000000, side:THREE.FrontSide, depthWrite:true });
    const fillMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 48), fillMat);
    fillMesh.renderOrder = 0;
    fillMesh.visible = false;
    scene.add(fillMesh);

    function geo(n) {
      const g = new THREE.BufferGeometry(); const p = new Float32Array(n*3);
      for (let i = 0; i < n; i++) {
        const r = Math.cbrt(Math.random()) * 8;
        const phi = Math.acos(2*Math.random() - 1), th = Math.random() * Math.PI * 2;
        p[i*3] = r*Math.sin(phi)*Math.cos(th); p[i*3+1] = r*Math.sin(phi)*Math.sin(th); p[i*3+2] = r*Math.cos(phi);
      }
      g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g;
    }
    let pts = new THREE.Points(geo(opts.count), mat);
    pts.renderOrder = 1;
    scene.add(pts);
    const state = { speed:0.6, bx:1, by:1, bz:1, rad:11 };
    return {
      set(p, v) {
        if (p === 'count') { const old = pts; pts = new THREE.Points(geo(v), mat); scene.add(pts); scene.remove(old); old.geometry.dispose(); opts.count = v; }
        else if (p === 'speed') state.speed = v;
        else if (p === 'size') mat.uniforms.uPSize.value = v;
        else if (p === 'opacity') mat.uniforms.uOp.value = v;
        else if (p === 'bx') state.bx = v;
        else if (p === 'by') state.by = v;
        else if (p === 'bz') state.bz = v;
        else if (p === 'rad') { mat.uniforms.uMaxDist.value = v; state.rad = v; fillMesh.scale.setScalar(v * 0.92); }
        else if (p === 'color') mat.uniforms.uColor.value.set(v);
        else if (p === 'fill') {
          if (v === 'empty')  { fillMesh.visible = false; }
          else if (v === 'white')  { fillMesh.visible = true; fillMat.color.set(0xffffff); }
          else if (v === 'hollow') { fillMesh.visible = true; fillMat.color.set(0x000000); }
          fillMesh.scale.setScalar(state.rad * 0.92);
        }
      },
      update(t) {
        mat.uniforms.uTime.value = t * state.speed;
        mat.uniforms.uTX.value = state.bx * (0.4 + audio.bass * 1.6);
        mat.uniforms.uTY.value = state.by * (0.4 + audio.mid  * 1.6);
        mat.uniforms.uTZ.value = state.bz * (0.4 + audio.high * 1.6);
        mat.uniforms.uAmp.value = 1.0 + audio.rms * 1.5;
      },
      dispose() { scene.remove(pts); pts.geometry.dispose(); mat.dispose(); scene.remove(fillMesh); fillMesh.geometry.dispose(); fillMat.dispose(); },
    };
  },
};
