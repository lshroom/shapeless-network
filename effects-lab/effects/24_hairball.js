import * as THREE from 'three';

const NOISE_GLSL = `
float vnoise(vec3 p){
  vec3 i=floor(p); vec3 f=fract(p); f=f*f*(3.0-2.0*f);
  float n=i.x+i.y*157.0+113.0*i.z;
  return mix(mix(mix(fract(sin(n+0.0)*43758.5),fract(sin(n+1.0)*43758.5),f.x),
                 mix(fract(sin(n+157.0)*43758.5),fract(sin(n+158.0)*43758.5),f.x),f.y),
             mix(mix(fract(sin(n+113.0)*43758.5),fract(sin(n+114.0)*43758.5),f.x),
                 mix(fract(sin(n+270.0)*43758.5),fract(sin(n+271.0)*43758.5),f.x),f.y),f.z);
}`;

const VERT = `
uniform float uShell, uShellCount, uDensity, uLength, uTime, uSway, uAudio;
varying float vAlpha; varying vec2 vUv2;
${NOISE_GLSL}
void main(){
  vUv2 = uv * uDensity;
  float t = uShell / uShellCount;
  float w1 = vnoise(position * 6.0 + vec3(uTime * uSway));
  float w2 = vnoise(position * 6.0 + vec3(13.7));
  vec3 bent = normal + vec3(w1-0.5, w2-0.5, w1+w2-0.5) * 0.18;
  bent = normalize(bent);
  float audioLen = uLength * (1.0 + uAudio * 0.8);
  vec3 pos = position + bent * t * audioLen;
  vAlpha = 1.0 - t;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

const FRAG = `
uniform float uDensity, uShell, uShellCount; uniform vec3 uColor;
varying float vAlpha; varying vec2 vUv2;
void main(){
  vec2 uv = fract(vUv2) - 0.5;
  float d = dot(uv, uv);
  float t = uShell / uShellCount;
  if (d > 0.16 * (1.0 - t * 0.5)) discard;
  gl_FragColor = vec4(uColor, vAlpha * 0.9);
}`;

export default {
  id: 'hairball',
  label: 'Hairball',
  color: 0xffe0aa,
  controls: [
    { p:'shells',  label:'Shells',   min:4,  max:32, step:1,    val:16 },
    { p:'length',  label:'Length',   min:0.1,max:1.5,step:0.01, val:0.45 },
    { p:'density', label:'Density',  min:2,  max:30, step:0.5,  val:12 },
    { p:'sway',    label:'Sway',     min:0,  max:2,  step:0.01, val:0.4 },
    { p:'shape',   label:'Shape',    type:'select', val:'sphere', options:[{v:'sphere',l:'Sphere'},{v:'torus',l:'Torus'},{v:'ico',l:'Icosahedron'}] },
    { p:'color',   label:'Color',    type:'color',  val:'#ffe0aa' },
  ],
  init({ scene, audio }) {
    let group = new THREE.Group(); scene.add(group);
    scene.add(new THREE.AmbientLight(0x334455, 0.6));
    const state = { shells:16, length:0.45, density:12, sway:0.4, shape:'sphere', color:'#ffe0aa' };
    let meshes = [];

    function rebuild() {
      group.clear(); meshes = [];
      let geo;
      if (state.shape === 'torus') geo = new THREE.TorusGeometry(0.85, 0.36, 32, 64);
      else if (state.shape === 'ico') geo = new THREE.IcosahedronGeometry(1.05, 4);
      else geo = new THREE.SphereGeometry(1, 48, 48);
      for (let s = 0; s < state.shells; s++) {
        const mat = new THREE.ShaderMaterial({
          uniforms: {
            uShell: {value:s}, uShellCount:{value:state.shells},
            uDensity:{value:state.density}, uLength:{value:state.length},
            uTime:{value:0}, uSway:{value:state.sway}, uAudio:{value:0},
            uColor:{value:new THREE.Color(state.color)},
          },
          vertexShader: VERT, fragmentShader: FRAG,
          transparent:true, side:THREE.FrontSide, depthWrite:false,
        });
        const m = new THREE.Mesh(geo, mat); group.add(m); meshes.push(mat);
      }
    }
    rebuild();

    return {
      set(p, v) {
        state[p] = v;
        if (p === 'shape') rebuild();
        else meshes.forEach((m,i) => {
          if (p === 'color') m.uniforms.uColor.value.set(v);
          else if (p === 'shells') { m.uniforms.uShellCount.value = v; m.uniforms.uShell.value = i; }
          else if (p === 'length') m.uniforms.uLength.value = v;
          else if (p === 'density') m.uniforms.uDensity.value = v;
          else if (p === 'sway') m.uniforms.uSway.value = v;
        });
      },
      update(t) {
        const rms = audio.rms;
        meshes.forEach(m => { m.uniforms.uTime.value = t; m.uniforms.uAudio.value = rms; });
        group.rotation.y = t * 0.12;
      },
      dispose() { scene.remove(group); group.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material) o.material.dispose(); }); },
    };
  },
};
