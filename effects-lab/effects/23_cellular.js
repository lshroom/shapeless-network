import * as THREE from 'three';

// 2D simplex noise (same as cellular.html)
function snoise2(x, y) {
  const F2 = 0.366025404, G2 = 0.211324865;
  const s = (x + y) * F2, i = Math.floor(x + s), j = Math.floor(y + s);
  const t = (i + j) * G2, X0 = i - t, Y0 = j - t;
  const x0 = x - X0, y0 = y - Y0;
  const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2*G2, y2 = y0 - 1 + 2*G2;
  function grad(h, dx, dy) { const v = [1,1,-1,-1,1,-1,1,-1]; const k = h & 7; return v[k*2]*dx + v[k*2+1]*dy; }
  const ph = (i * 1619 + j * 31337) & 255;
  const p1 = (i1 ? ((i+1)*1619+(j)*31337)&255 : (i*1619+(j+1)*31337)&255);
  const p2 = ((i+1)*1619+(j+1)*31337)&255;
  const n0 = Math.max(0, 0.5 - x0*x0 - y0*y0) ** 4 * grad(ph, x0, y0);
  const n1 = Math.max(0, 0.5 - x1*x1 - y1*y1) ** 4 * grad(p1, x1, y1);
  const n2 = Math.max(0, 0.5 - x2*x2 - y2*y2) ** 4 * grad(p2, x2, y2);
  return 70 * (n0 + n1 + n2);
}

export default {
  id: 'cellular',
  label: 'Cellular',
  color: 0x44ffcc,
  controls: [
    { p:'count',  label:'Count',   min:100, max:2000, step:50,  val:800 },
    { p:'radius', label:'Radius',  min:1,   max:8,    step:0.1, val:3.5 },
    { p:'speed',  label:'Speed',   min:0.1, max:4,    step:0.05,val:1 },
    { p:'period', label:'Period',  min:0.5, max:6,    step:0.1, val:2 },
    { p:'color',  label:'Color',   type:'color', val:'#44ffcc' },
  ],
  init({ THREE: T, scene, audio }) {
    const MAX = 2000;
    const col = new THREE.Color(0x44ffcc);
    const geo = new THREE.SphereGeometry(0.04, 5, 5);
    const mat = new THREE.MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: 0.4 });
    const mesh = new THREE.InstancedMesh(geo, mat, MAX);
    mesh.count = 800;
    scene.add(mesh);
    scene.add(new THREE.PointLight(0xffffff, 1.5, 30));
    scene.add(new THREE.AmbientLight(0x223344, 0.8));
    const dummy = new THREE.Object3D();
    const state = { count:800, radius:3.5, speed:1, period:2 };
    return {
      set(p, v) {
        if (p === 'color') { col.set(v); mat.color.set(v); mat.emissive.set(v); }
        else { state[p] = v; if (p === 'count') mesh.count = Math.round(v); }
      },
      update(t) {
        const rms = audio.rms;
        const n = mesh.count;
        for (let i = 0; i < n; i++) {
          const tx = snoise2(i * state.period * 0.01, t * state.speed * 0.3) * state.radius;
          const ty = snoise2(i * state.period * 0.01 + 50, t * state.speed * 0.3) * state.radius;
          const tz = snoise2(i * state.period * 0.01 + 100, t * state.speed * 0.3) * state.radius;
          const s = 0.8 + rms * 3 * (0.5 + 0.5 * Math.sin(i));
          dummy.position.set(tx, ty, tz);
          dummy.scale.setScalar(s);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        mat.emissiveIntensity = 0.3 + rms * 2;
      },
      dispose() { scene.remove(mesh); geo.dispose(); mat.dispose(); },
    };
  },
};
