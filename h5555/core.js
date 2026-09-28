// HOLOGRAM 5555 — core shared helpers for all engines.
// Engines import from here. Keep this lean and dependency-free (only three).
import * as THREE from 'three';

export { THREE };

// ---------------------------------------------------------------------------
// Engine registry. Each engine self-registers; the shell reads H5555.engines.
// ---------------------------------------------------------------------------
export const H5555 = (window.H5555 = window.H5555 || { engines: [], byId: {} });
export function register(engine) {
  if (H5555.byId[engine.id]) { console.warn('dup engine id', engine.id); return; }
  engine.tags = engine.tags || [];
  engine.controls = engine.controls || [];
  H5555.byId[engine.id] = engine;
  H5555.engines.push(engine);
}

// ---------------------------------------------------------------------------
// GLSL chunks — paste into shaders via template literals.
// ---------------------------------------------------------------------------
export const GLSL = {
  // 3D simplex noise (Ashima / Stefan Gustavson) — public domain.
  snoise3: `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }`,
  // curl of the noise field (for divergence-free flow).
  curl: `
  vec3 snoiseVec3(vec3 x){
    float s=snoise(x);
    float s1=snoise(vec3(x.y-19.1,x.z+33.4,x.x+47.2));
    float s2=snoise(vec3(x.z+74.2,x.x-124.5,x.y+99.4));
    return vec3(s,s1,s2);
  }
  vec3 curlNoise(vec3 p){
    const float e=0.1; vec3 dx=vec3(e,0,0),dy=vec3(0,e,0),dz=vec3(0,0,e);
    vec3 p_x0=snoiseVec3(p-dx),p_x1=snoiseVec3(p+dx);
    vec3 p_y0=snoiseVec3(p-dy),p_y1=snoiseVec3(p+dy);
    vec3 p_z0=snoiseVec3(p-dz),p_z1=snoiseVec3(p+dz);
    float x=(p_y1.z-p_y0.z)-(p_z1.y-p_z0.y);
    float y=(p_z1.x-p_z0.x)-(p_x1.z-p_x0.z);
    float z=(p_x1.y-p_x0.y)-(p_y1.x-p_y0.x);
    return normalize(vec3(x,y,z)/(2.0*e));
  }`,
  // iq cosine palette — t in 0..1 returns vibrant color.
  palette: `
  vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d){ return a+b*cos(6.28318*(c*t+d)); }
  vec3 spectral(float t){ return pal(t, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0,0.33,0.67)); }`,
  // hash
  hash: `
  float hash11(float p){ p=fract(p*0.1031); p*=p+33.33; p*=p+p; return fract(p); }
  vec3 hash31(float p){ vec3 p3=fract(vec3(p)*vec3(0.1031,0.1030,0.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xxy+p3.yzz)*p3.zyx); }`,
};

// ---------------------------------------------------------------------------
// JS palette (Konyi-adjacent vibrant) for non-shader colour needs.
// ---------------------------------------------------------------------------
export function pal(t, a = [0.5, 0.5, 0.5], b = [0.5, 0.5, 0.5], c = [1, 1, 1], d = [0, 0.33, 0.67]) {
  const col = new THREE.Color();
  col.setRGB(
    a[0] + b[0] * Math.cos(6.28318 * (c[0] * t + d[0])),
    a[1] + b[1] * Math.cos(6.28318 * (c[1] * t + d[1])),
    a[2] + b[2] * Math.cos(6.28318 * (c[2] * t + d[2]))
  );
  return col;
}

// Standard set of audio uniforms every shader engine can reuse.
export function audioUniforms() {
  return {
    uTime: { value: 0 },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uHigh: { value: 0 },
    uRms: { value: 0 },
    uBeat: { value: 0 },
  };
}
export function pushAudio(uniforms, audio, t) {
  if (uniforms.uTime) uniforms.uTime.value = t;
  if (uniforms.uBass) uniforms.uBass.value = audio.bass;
  if (uniforms.uMid) uniforms.uMid.value = audio.mid;
  if (uniforms.uHigh) uniforms.uHigh.value = audio.high;
  if (uniforms.uRms) uniforms.uRms.value = audio.rms;
  if (uniforms.uBeat) uniforms.uBeat.value = audio.beatEnv;
}

// Full-screen raymarch quad helper: give it a fragment body that defines
// `vec3 render(vec3 ro, vec3 rd)` and it builds a camera-fed ShaderMaterial mesh.
export function raymarchQuad(fragBody, extraUniforms = {}) {
  const uniforms = Object.assign(audioUniforms(), {
    uRes: { value: new THREE.Vector2(1, 1) },
    uCamPos: { value: new THREE.Vector3() },
    uCamMat: { value: new THREE.Matrix4() },
  }, extraUniforms);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 uRes; uniform vec3 uCamPos; uniform mat4 uCamMat;
      uniform float uTime,uBass,uMid,uHigh,uRms,uBeat;
      ${fragBody}
      void main(){
        vec2 p=(vUv*2.0-1.0); p.x*=uRes.x/uRes.y;
        vec3 rd=normalize((uCamMat*vec4(p,-1.5,0.0)).xyz);
        vec3 ro=uCamPos;
        vec3 col=render(ro,rd);
        col=pow(clamp(col,0.0,1.0),vec3(0.4545));
        gl_FragColor=vec4(col,1.0);
      }`,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return { mesh, uniforms, mat };
}

// dispose helper — call on every mesh you created.
export function disposeObj(obj) {
  obj.traverse?.((o) => {
    o.geometry?.dispose?.();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => { Object.values(m).forEach((v) => v?.isTexture && v.dispose?.()); m.dispose?.(); });
    }
  });
  if (obj.geometry) obj.geometry.dispose?.();
  if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose?.());
}
