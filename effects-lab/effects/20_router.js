import * as THREE from 'three';

const SEGS = 20; // points per beam

export default {
  id: 'router',
  label: 'Router Hub',
  color: 0xff7ae6,
  controls: [
    { p:'beams',  label:'Beams',   min:4,  max:32,  step:1,    val:12 },
    { p:'beamLen',label:'Length',  min:1,  max:20,  step:0.1,  val:7 },
    { p:'curl',   label:'Curl',    min:0,  max:3,   step:0.02, val:0.6 },
    { p:'breakAmt',label:'Break',  min:0,  max:1,   step:0.01, val:0 },
    { p:'spin',   label:'Spin',    min:0,  max:3,   step:0.01, val:0.6 },
    { p:'size',   label:'Hub',     min:0.5,max:6,   step:0.05, val:2.4 },
    { p:'color',  label:'Color',   type:'color', val:'#ff7ae6' },
  ],
  init({ scene, audio }) {
    const group = new THREE.Group(); scene.add(group);
    scene.add(new THREE.AmbientLight(0x445566, 0.6));

    const hubMat = new THREE.MeshStandardMaterial({ color:0xff7ae6, emissive:0xff7ae6, emissiveIntensity:0.4, metalness:0.5, roughness:0.3 });
    let hub = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), hubMat);
    group.add(hub);

    const lineMat = new THREE.LineBasicMaterial({ color:0xff7ae6, transparent:true, opacity:0.8, blending:THREE.AdditiveBlending, depthWrite:false });

    const state = { beams:12, beamLen:7, curl:0.6, breakAmt:0, spin:0.6, size:2.4 };
    let lines = [];

    // pre-computed beam directions
    let dirs = [];

    function buildBeams() {
      lines.forEach(l => { group.remove(l); l.geometry.dispose(); });
      lines = []; dirs = [];
      for (let i = 0; i < state.beams; i++) {
        const ph = Math.acos(2 * (i / state.beams) - 1);
        const th = i * 2.4;
        dirs.push(new THREE.Vector3(
          Math.sin(ph) * Math.cos(th),
          Math.cos(ph),
          Math.sin(ph) * Math.sin(th)
        ).normalize());

        const pts = new Float32Array((SEGS + 1) * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
        const line = new THREE.Line(geo, lineMat);
        group.add(line); lines.push(line);
      }
    }
    buildBeams();

    // per-beam perpendicular axes for curl direction
    function getPerp(dir) {
      const up = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0,1,0) : new THREE.Vector3(1,0,0);
      return new THREE.Vector3().crossVectors(dir, up).normalize();
    }

    return {
      set(p, v) {
        if (p === 'color') { hubMat.color.set(v); hubMat.emissive.set(v); lineMat.color.set(v); }
        else if (p === 'size') { state.size = v; hub.scale.setScalar(v / 2.4); }
        else if (p === 'beams') { state.beams = v; buildBeams(); }
        else state[p] = v;
      },
      update(t) {
        hub.rotation.y = t * state.spin;
        hub.rotation.x = t * state.spin * 0.7;
        hubMat.emissiveIntensity = 0.3 + audio.rms * 1.5;

        lines.forEach((line, i) => {
          const dir = dirs[i];
          const freqVal = audio.freq[Math.floor(i * audio.freq.length / state.beams)] / 255;
          const perp1 = getPerp(dir);
          const perp2 = new THREE.Vector3().crossVectors(dir, perp1).normalize();

          const L = state.beamLen * (0.3 + freqVal * 1.2);
          const curlStrength = state.curl * (0.5 + audio.rms * 2 + freqVal * 1.5);
          const breakGap = state.breakAmt;

          const pos = line.geometry.attributes.position.array;
          let cur = dir.clone().multiplyScalar(state.size * 0.42); // start at hub surface

          for (let s = 0; s <= SEGS; s++) {
            const k = s / SEGS;

            // hide this point if in a break gap
            if (breakGap > 0) {
              const cycle = (k * (1 + breakGap * 6)) % 1;
              if (cycle > (1 - breakGap)) {
                // gap — teleport to previous so no line drawn
                const prev = s > 0 ? s - 1 : 0;
                pos[s*3]   = pos[prev*3];
                pos[s*3+1] = pos[prev*3+1];
                pos[s*3+2] = pos[prev*3+2];
                continue;
              }
            }

            pos[s*3]   = cur.x;
            pos[s*3+1] = cur.y;
            pos[s*3+2] = cur.z;

            // step: advance along beam direction + curl deflection
            const stepLen = L / SEGS;
            const curlAngle = k * curlStrength * Math.PI;
            const deflect = perp1.clone().multiplyScalar(Math.sin(curlAngle + t * 0.8 + i) * stepLen)
              .add(perp2.clone().multiplyScalar(Math.cos(curlAngle * 0.7 + t * 0.6) * stepLen * 0.5 * audio.rms));
            cur.add(dir.clone().multiplyScalar(stepLen)).add(deflect);
          }

          line.geometry.attributes.position.needsUpdate = true;
          line.geometry.computeBoundingSphere();
        });
      },
      dispose() {
        scene.remove(group);
        lines.forEach(l => l.geometry.dispose());
        hub.geometry.dispose(); hubMat.dispose(); lineMat.dispose();
      },
    };
  },
};
