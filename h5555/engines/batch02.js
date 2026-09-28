// HOLOGRAM 5555 — Batch 02: engines 013-024. Each a distinct algorithm.
import { THREE, register, GLSL, audioUniforms, pushAudio, raymarchQuad, pal } from '/h5555/core.js';
const RM = `${GLSL.palette}`;

// helper to wire a raymarch engine's per-frame camera + audio + custom uniforms
function rmUpdate(uniforms, ctx, extra) {
  return (dt, t) => {
    pushAudio(uniforms, ctx.audio, t);
    uniforms.uRes.value.set(innerWidth, innerHeight);
    uniforms.uCamPos.value.copy(ctx.camera.position);
    uniforms.uCamMat.value.copy(ctx.camera.matrixWorld);
    if (extra) extra(uniforms, ctx, dt, t);
  };
}

// ===========================================================================
// 013 — N-body Orbits (50k stars orbiting 2 drifting attractors → galaxy dance)
// ===========================================================================
register({
  id:'nbody', name:'N-Body Galaxy Dance', group:'N-Body Gravity',
  tags:['particles','gravity','orbits'],
  controls:[{id:'G',label:'gravity',min:0.2,max:4,def:1.5},{id:'react',label:'audio kick',min:0,max:3,def:1.4}],
  init(ctx){
    const N=50000; const pos=new Float32Array(N*3), vel=new Float32Array(N*3), col=new Float32Array(N*3);
    for(let i=0;i<N;i++){ const r=2+Math.random()*4, a=Math.random()*6.28;
      const sx=(Math.random()<0.5?-3:3);
      pos[i*3]=Math.cos(a)*r+sx; pos[i*3+1]=(Math.random()-0.5)*1.5; pos[i*3+2]=Math.sin(a)*r;
      const sp=1.2/Math.sqrt(r); vel[i*3]=-Math.sin(a)*sp; vel[i*3+1]=0; vel[i*3+2]=Math.cos(a)*sp; }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:0.02,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.8});
    const pts=new THREE.Points(geo,mat); ctx.scene.add(pts); ctx.camera.position.set(0,6,12);
    return { update(dt,t){
        const G=ctx.params.G*(1+ctx.audio.bass*ctx.params.react);
        const a1x=Math.cos(t*0.3)*4, a1z=Math.sin(t*0.3)*4, a2x=-Math.cos(t*0.3)*4, a2z=-Math.sin(t*0.3)*4;
        const h=Math.min(dt,0.03);
        for(let i=0;i<N;i++){ const ix=i*3; let x=pos[ix],y=pos[ix+1],z=pos[ix+2];
          let dx=a1x-x,dy=-y,dz=a1z-z; let d2=dx*dx+dy*dy+dz*dz+0.5; let f=G/d2/Math.sqrt(d2);
          vel[ix]+=dx*f*h; vel[ix+1]+=dy*f*h; vel[ix+2]+=dz*f*h;
          dx=a2x-x;dz=a2z-z; d2=dx*dx+y*y+dz*dz+0.5; f=G/d2/Math.sqrt(d2);
          vel[ix]+=dx*f*h; vel[ix+1]+=(-y)*f*h; vel[ix+2]+=dz*f*h;
          x+=vel[ix]*h; y+=vel[ix+1]*h; z+=vel[ix+2]*h;
          pos[ix]=x;pos[ix+1]=y;pos[ix+2]=z;
          const spd=Math.min(1,(vel[ix]*vel[ix]+vel[ix+2]*vel[ix+2])*0.3);
          const cc=pal(spd+ctx.audio.high*0.2,[0.5,0.4,0.5],[0.5,0.5,0.5],[1,1,1],[0.05,0.25,0.55]);
          col[ix]=cc.r;col[ix+1]=cc.g;col[ix+2]=cc.b;
        }
        geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
        mat.size=0.015+ctx.audio.rms*0.03;
      }, dispose(){ ctx.scene.remove(pts); geo.dispose(); mat.dispose(); } };
  }
});

// ===========================================================================
// 014 — DLA Crystal (diffusion-limited aggregation growing a 3D dendrite)
// ===========================================================================
register({
  id:'dla', name:'DLA Crystal Growth', group:'Crystal Growth',
  tags:['fractal','growth','points'],
  controls:[{id:'rate',label:'growth rate',min:1,max:30,def:10},{id:'spin',label:'spin',min:0,max:2,def:0.4}],
  init(ctx){
    const MAX=6000; const pos=new Float32Array(MAX*3), col=new Float32Array(MAX*3);
    let count=1; pos.set([0,0,0]); // seed (O(count) sticking — keep MAX modest)
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    geo.setDrawRange(0,1);
    const mat=new THREE.PointsMaterial({size:0.06,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
    const pts=new THREE.Points(geo,mat); ctx.scene.add(pts); ctx.camera.position.set(0,0,9);
    const stick=0.26; let clusterR=0.2;
    function grow(){
      if(count>=MAX) return;
      // launch a walker just outside the current cluster, drift inward + random
      const R=clusterR+1.2;
      const a=Math.random()*6.28,b=Math.acos(2*Math.random()-1);
      let x=R*Math.sin(b)*Math.cos(a),y=R*Math.sin(b)*Math.sin(a),z=R*Math.cos(b);
      for(let step=0;step<300;step++){
        const r=Math.sqrt(x*x+y*y+z*z)||1; const inward=0.08;
        x+=(Math.random()-0.5)*0.3 - x/r*inward;
        y+=(Math.random()-0.5)*0.3 - y/r*inward;
        z+=(Math.random()-0.5)*0.3 - z/r*inward;
        if(x*x+y*y+z*z>(R+3)*(R+3)) return; // wandered off
        for(let k=0;k<count;k++){ const dx=x-pos[k*3],dy=y-pos[k*3+1],dz=z-pos[k*3+2];
          if(dx*dx+dy*dy+dz*dz<stick*stick){
            clusterR=Math.max(clusterR,Math.sqrt(x*x+y*y+z*z));
            const i=count++; pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z;
            const r=Math.sqrt(x*x+y*y+z*z); const cc=pal(r*0.08,[0.5,0.5,0.6],[0.5,0.5,0.4],[1,1,1],[0.1,0.3,0.6]);
            col[i*3]=cc.r;col[i*3+1]=cc.g;col[i*3+2]=cc.b;
            geo.setDrawRange(0,count); geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
            return;
          }
        }
      }
    }
    return { update(dt,t){
        const rate=(ctx.params.rate*(1+ctx.audio.bass*2))|0;
        for(let g=0;g<rate;g++) grow();
        pts.rotation.y+=dt*ctx.params.spin; pts.rotation.x=Math.sin(t*0.2)*0.2;
        mat.size=0.05+ctx.audio.high*0.04;
      }, dispose(){ ctx.scene.remove(pts); geo.dispose(); mat.dispose(); } };
  }
});

// ===========================================================================
// 015 — Fourier Epicycles 3D (stacked rotating circles tracing a glowing path)
// ===========================================================================
register({
  id:'epicycles', name:'Fourier Epicycles 3D', group:'Fourier',
  tags:['line','rotation','harmonic'],
  controls:[{id:'terms',label:'harmonics',min:3,max:40,def:18},{id:'speed',label:'speed',min:0.1,max:3,def:1}],
  init(ctx){
    const TRAIL=2000; const tp=new Float32Array(TRAIL*3), tc=new Float32Array(TRAIL*3);
    const tgeo=new THREE.BufferGeometry();
    tgeo.setAttribute('position',new THREE.BufferAttribute(tp,3));
    tgeo.setAttribute('color',new THREE.BufferAttribute(tc,3));
    const tmat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending});
    const trail=new THREE.Line(tgeo,tmat); ctx.scene.add(trail);
    const arms=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x6688ff,transparent:true,opacity:0.5}));
    ctx.scene.add(arms);
    let filled=0; ctx.camera.position.set(0,0,7);
    return { update(dt,t){
        const K=ctx.params.terms|0; const sp=ctx.params.speed;
        // build epicycle chain in XY, with Z wobble from harmonics → 3D
        let x=0,y=0,z=0; const armPts=[new THREE.Vector3(0,0,0)];
        for(let k=1;k<=K;k++){ const amp=1.0/k*(1+ctx.audio.spectrum[(k*4)%512]*2);
          const ph=t*sp*k*(k%2?1:-1);
          x+=Math.cos(ph)*amp; y+=Math.sin(ph)*amp; z+=Math.sin(ph*0.5+k)*amp*0.4;
          armPts.push(new THREE.Vector3(x,y,z));
        }
        arms.geometry.setFromPoints(armPts);
        // append tip to trail; shift older samples down once full (no origin artifact)
        const cc=pal((t*0.1)%1,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0,0.33,0.67]);
        if(filled<TRAIL){ const h=filled*3; tp[h]=x;tp[h+1]=y;tp[h+2]=z; tc[h]=cc.r;tc[h+1]=cc.g;tc[h+2]=cc.b; filled++; }
        else { tp.copyWithin(0,3); tc.copyWithin(0,3); const h=(TRAIL-1)*3;
          tp[h]=x;tp[h+1]=y;tp[h+2]=z; tc[h]=cc.r;tc[h+1]=cc.g;tc[h+2]=cc.b; }
        tgeo.attributes.position.needsUpdate=true; tgeo.attributes.color.needsUpdate=true;
        tgeo.setDrawRange(0,filled);
        trail.rotation.y+=dt*0.1; arms.rotation.copy(trail.rotation);
      }, dispose(){ ctx.scene.remove(trail); ctx.scene.remove(arms);
        tgeo.dispose(); tmat.dispose(); arms.geometry.dispose(); arms.material.dispose(); } };
  }
});

// ===========================================================================
// 016 — Reaction-Diffusion (Gray-Scott CPU sim displaced + colored on 3D plane)
// ===========================================================================
register({
  id:'grayscott', name:'Gray-Scott Morphogenesis', group:'Reaction-Diffusion',
  tags:['mesh','turing','pattern'],
  controls:[{id:'feed',label:'feed',min:0.01,max:0.09,def:0.037},{id:'kill',label:'kill',min:0.04,max:0.07,def:0.06},{id:'height',label:'relief',min:0.2,max:3,def:1.2}],
  init(ctx){
    const W=120; const A=new Float32Array(W*W).fill(1), B=new Float32Array(W*W).fill(0);
    const A2=new Float32Array(W*W), B2=new Float32Array(W*W);
    for(let i=0;i<30;i++){ const x=(W/2+(Math.random()-0.5)*20)|0, y=(W/2+(Math.random()-0.5)*20)|0; B[y*W+x]=1; }
    const geo=new THREE.PlaneGeometry(8,8,W-1,W-1); geo.rotateX(-Math.PI/2);
    const colArr=new Float32Array(W*W*3); geo.setAttribute('color',new THREE.BufferAttribute(colArr,3));
    const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.5,metalness:0.3,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geo,mat); ctx.scene.add(mesh);
    ctx.scene.add(new THREE.AmbientLight(0x335577,0.7));
    const dl=new THREE.DirectionalLight(0xffffff,1.6); dl.position.set(3,5,2); ctx.scene.add(dl);
    ctx.camera.position.set(0,5,8);
    const pa=geo.attributes.position;
    return { update(dt,t){
        const f=ctx.params.feed*(1+ctx.audio.bass*0.3), k=ctx.params.kill, Da=0.16, Db=0.08;
        for(let it=0;it<6;it++){
          for(let y=1;y<W-1;y++)for(let x=1;x<W-1;x++){ const i=y*W+x;
            const lapA=A[i-1]+A[i+1]+A[i-W]+A[i+W]-4*A[i];
            const lapB=B[i-1]+B[i+1]+B[i-W]+B[i+W]-4*B[i];
            const ab=A[i]*B[i]*B[i];
            A2[i]=A[i]+(Da*lapA-ab+f*(1-A[i]));
            B2[i]=B[i]+(Db*lapB+ab-(k+f)*B[i]);
          }
          A.set(A2); B.set(B2);
        }
        const h=ctx.params.height; let c=0;
        for(let i=0;i<W*W;i++){ const v=B[i]; pa.setY(i, v*h);
          const cc=pal(0.4+v*0.6+ctx.audio.high*0.2,[0.4,0.45,0.6],[0.5,0.5,0.5],[1,1,1],[0.1,0.3,0.6]);
          colArr[c]=cc.r;colArr[c+1]=cc.g;colArr[c+2]=cc.b; c+=3; }
        pa.needsUpdate=true; geo.attributes.color.needsUpdate=true; geo.computeVertexNormals();
        mesh.rotation.y+=dt*0.1;
      }, dispose(){ ctx.scene.remove(mesh); geo.dispose(); mat.dispose(); } };
  }
});

// ===========================================================================
// 017 — Time Tunnel (slit-scan style infinite raymarched tunnel, audio warps)
// ===========================================================================
register({
  id:'timetunnel', name:'Slit-Scan Time Tunnel', group:'Time / Slit-Scan',
  tags:['raymarch','tunnel','warp'],
  controls:[{id:'speed',label:'travel',min:0,max:5,def:2},{id:'twist',label:'twist',min:0,max:3,def:1}],
  init(ctx){
    const {mesh,uniforms}=raymarchQuad(`
      ${RM} ${GLSL.hash}
      uniform float uSpeed,uTwist;
      vec3 render(vec3 ro,vec3 rd){
        vec3 col=vec3(0.0); float t=0.0;
        for(int i=0;i<70;i++){
          vec3 p=ro+rd*t;
          float z=p.z+uTime*uSpeed;
          float ang=atan(p.y,p.x)+z*uTwist*0.2;
          float rad=length(p.xy);
          // tunnel wall at radius ~2, ringed by audio
          float wall=2.0+0.3*sin(ang*6.0+z*0.5)+uBass*0.6;
          float d=abs(rad-wall);
          if(d<0.02){
            float band=sin(z*2.0+uTime*uSpeed*2.0)*0.5+0.5;
            col=spectral(band*0.4+ang*0.1+uMid*0.3)*(1.0-t/40.0)*(0.6+uRms);
            break;
          }
          t+=max(d*0.5,0.05); if(t>40.0)break;
        }
        col+=spectral(uTime*0.05+uHigh)*0.04*(0.5+uHigh); // haze
        return col;
      }`,{uSpeed:{value:2},uTwist:{value:1}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,0,0.1);
    return { update:rmUpdate(uniforms,ctx,(u,c)=>{ u.uSpeed.value=c.params.speed; u.uTwist.value=c.params.twist; }),
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); } };
  }
});

// ===========================================================================
// 018 — Vortex Smoke Rings (particles advected by stacked vortex rings)
// ===========================================================================
register({
  id:'vortexring', name:'Vortex Smoke Rings', group:'Fluid Dynamics',
  tags:['particles','vortex','smoke'],
  controls:[{id:'strength',label:'swirl',min:0.2,max:4,def:1.5},{id:'rings',label:'rings',min:1,max:5,def:3}],
  init(ctx){
    const N=42000; const pos=new Float32Array(N*3), col=new Float32Array(N*3);
    // each particle lives on a torus: ring index, toroidal φ, poloidal ψ, jitter
    const ring=new Float32Array(N), phi=new Float32Array(N), psi=new Float32Array(N), jit=new Float32Array(N);
    for(let i=0;i<N;i++){ ring[i]=Math.floor(Math.random()*5); phi[i]=Math.random()*6.28; psi[i]=Math.random()*6.28; jit[i]=0.8+Math.random()*0.4; }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:0.03,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.55});
    const pts=new THREE.Points(geo,mat); ctx.scene.add(pts); ctx.camera.position.set(0,0,10);
    const tubeR=0.45;
    return { update(dt,t){
        const S=ctx.params.strength*(1+ctx.audio.bass*1.5), RINGS=ctx.params.rings|0; const h=Math.min(dt,0.03);
        for(let i=0;i<N;i++){ const ix=i*3;
          const ri=ring[i]%RINGS;
          // each ring rises on its own loop & expands as it climbs
          const cycle=( (t*0.25 + ri/RINGS) % 1 );          // 0..1 lifecycle
          const ringY=-4 + cycle*8;                          // bottom → top
          const Rring=1.0 + cycle*1.4;                       // expands while rising
          psi[i]+=S*1.2*h;                                   // poloidal roll (the smoke curl)
          const pr=tubeR*jit[i]*(1.0-cycle*0.4);             // tube thins near top
          const x=(Rring+pr*Math.cos(psi[i]))*Math.cos(phi[i]);
          const z=(Rring+pr*Math.cos(psi[i]))*Math.sin(phi[i]);
          const y=ringY+pr*Math.sin(psi[i]);
          pos[ix]=x;pos[ix+1]=y;pos[ix+2]=z;
          const cc=pal(0.45+cycle*0.4+ctx.audio.high*0.2,[0.5,0.4,0.5],[0.5,0.5,0.5],[1,1,1],[0.1,0.3,0.6]);
          const fade=Math.sin(cycle*Math.PI);                // fade in/out over lifecycle
          col[ix]=cc.r*fade;col[ix+1]=cc.g*fade;col[ix+2]=cc.b*fade;
        }
        geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
        pts.rotation.y+=dt*0.15; mat.size=0.025+ctx.audio.rms*0.03;
      }, dispose(){ ctx.scene.remove(pts); geo.dispose(); mat.dispose(); } };
  }
});

// ===========================================================================
// 019 — Menger Sponge (raymarched recursive fractal cube)
// ===========================================================================
register({
  id:'menger', name:'Menger Sponge', group:'Fractals',
  tags:['raymarch','fractal','cube'],
  controls:[{id:'iter',label:'iterations',min:1,max:6,def:4},{id:'spin',label:'spin',min:0,max:2,def:0.3}],
  init(ctx){
    const {mesh,uniforms}=raymarchQuad(`
      ${RM}
      uniform float uIter,uSpin;
      float box(vec3 p,vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0); }
      float de(vec3 p){
        float d=box(p,vec3(1.0)); float s=1.0;
        int n=int(uIter);
        for(int i=0;i<6;i++){ if(i>=n)break;
          vec3 a=mod(p*s,2.0)-1.0; s*=3.0;
          vec3 r=abs(1.0-3.0*abs(a));
          float c=(min(max(r.x,r.y),min(max(r.y,r.z),max(r.x,r.z)))-1.0)/s;
          d=max(d,c);
        }
        return d;
      }
      vec3 render(vec3 ro,vec3 rd){
        float t=0.0; vec3 col=vec3(0.0);
        for(int i=0;i<90;i++){ vec3 p=ro+rd*t; float d=de(p);
          if(d<0.001){ vec2 e=vec2(0.001,0.0);
            vec3 nr=normalize(vec3(de(p+e.xyy)-de(p-e.xyy),de(p+e.yxy)-de(p-e.yxy),de(p+e.yyx)-de(p-e.yyx)));
            float diff=max(dot(nr,normalize(vec3(1,1,0.6))),0.0); float ao=1.0-float(i)/90.0;
            col=spectral(0.5+length(p)*0.2+uMid*0.3)*(0.3+0.7*diff)*ao; break; }
          t+=d; if(t>20.0)break; }
        return col;
      }`,{uIter:{value:4},uSpin:{value:0.3}});
    ctx.scene.add(mesh); ctx.camera.position.set(2.5,2,3.5);
    return { update:rmUpdate(uniforms,ctx,(u,c)=>{ u.uIter.value=c.params.iter; }),
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); } };
  }
});

// ===========================================================================
// 020 — Boids Murmuration (3D flocking swarm, audio = cohesion energy)
// ===========================================================================
register({
  id:'boids', name:'Boids Murmuration', group:'Particle Life',
  tags:['flocking','swarm','points'],
  controls:[{id:'sep',label:'separation',min:0,max:3,def:1.2},{id:'align',label:'alignment',min:0,max:3,def:1},{id:'coh',label:'cohesion',min:0,max:3,def:1}],
  init(ctx){
    const N=900; const pos=new Float32Array(N*3), vel=new Float32Array(N*3), col=new Float32Array(N*3);
    for(let i=0;i<N;i++){ pos[i*3]=(Math.random()-0.5)*6;pos[i*3+1]=(Math.random()-0.5)*6;pos[i*3+2]=(Math.random()-0.5)*6;
      vel[i*3]=(Math.random()-0.5);vel[i*3+1]=(Math.random()-0.5);vel[i*3+2]=(Math.random()-0.5); }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:0.08,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
    const pts=new THREE.Points(geo,mat); ctx.scene.add(pts); ctx.camera.position.set(0,0,11);
    return { update(dt,t){
        const sep=ctx.params.sep,al=ctx.params.align,co=ctx.params.coh*(1+ctx.audio.bass); const h=Math.min(dt,0.03);
        for(let i=0;i<N;i++){ const ix=i*3; let sx=0,sy=0,sz=0,ax=0,ay=0,az=0,cx=0,cy=0,cz=0,n=0;
          for(let j=0;j<N;j++){ if(j===i)continue; const jx=j*3;
            const dx=pos[ix]-pos[jx],dy=pos[ix+1]-pos[jx+1],dz=pos[ix+2]-pos[jx+2];
            const d2=dx*dx+dy*dy+dz*dz;
            if(d2<9){ ax+=vel[jx];ay+=vel[jx+1];az+=vel[jx+2]; cx+=pos[jx];cy+=pos[jx+1];cz+=pos[jx+2]; n++; }
            if(d2<0.5){ sx+=dx/(d2+0.05);sy+=dy/(d2+0.05);sz+=dz/(d2+0.05); }   // separation only when very close
          }
          if(n>0){ cx=cx/n-pos[ix];cy=cy/n-pos[ix+1];cz=cz/n-pos[ix+2];
            vel[ix]+=(sx*sep*0.5+(ax/n-vel[ix])*al*0.6+cx*co*0.9)*h; vel[ix+1]+=(sy*sep*0.5+(ay/n-vel[ix+1])*al*0.6+cy*co*0.9)*h; vel[ix+2]+=(sz*sep*0.5+(az/n-vel[ix+2])*al*0.6+cz*co*0.9)*h; }
          // gentle pull to center, cap speed
          vel[ix]-=pos[ix]*0.004;vel[ix+1]-=pos[ix+1]*0.004;vel[ix+2]-=pos[ix+2]*0.004;
          const sp=Math.sqrt(vel[ix]**2+vel[ix+1]**2+vel[ix+2]**2)||1; const mx=2.5;
          if(sp>mx){ vel[ix]*=mx/sp;vel[ix+1]*=mx/sp;vel[ix+2]*=mx/sp; }
          pos[ix]+=vel[ix]*h*2;pos[ix+1]+=vel[ix+1]*h*2;pos[ix+2]+=vel[ix+2]*h*2;
          const cc=pal(sp/mx+ctx.audio.high*0.3,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0,0.33,0.67]);
          col[ix]=cc.r;col[ix+1]=cc.g;col[ix+2]=cc.b;
        }
        geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
        pts.rotation.y+=dt*0.05; mat.size=0.06+ctx.audio.rms*0.05;
      }, dispose(){ ctx.scene.remove(pts); geo.dispose(); mat.dispose(); } };
  }
});

// ===========================================================================
// 021 — Wave Interference (concentric ripples from moving sources on 3D field)
// ===========================================================================
register({
  id:'interference', name:'Wave Interference Field', group:'Wave Physics',
  tags:['mesh','waves','interference'],
  controls:[{id:'sources',label:'sources',min:2,max:6,def:3},{id:'freq',label:'frequency',min:1,max:10,def:5},{id:'height',label:'amplitude',min:0.3,max:3,def:1.4}],
  init(ctx){
    const W=140; const geo=new THREE.PlaneGeometry(10,10,W-1,W-1); geo.rotateX(-Math.PI/2);
    const colArr=new Float32Array(W*W*3); geo.setAttribute('color',new THREE.BufferAttribute(colArr,3));
    const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.4,metalness:0.4,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geo,mat); ctx.scene.add(mesh);
    ctx.scene.add(new THREE.AmbientLight(0x335577,0.7));
    const dl=new THREE.DirectionalLight(0xffffff,1.5); dl.position.set(2,5,3); ctx.scene.add(dl);
    ctx.camera.position.set(0,6,9);
    const pa=geo.attributes.position;
    return { update(dt,t){
        const S=ctx.params.sources|0, fr=ctx.params.freq*(1+ctx.audio.mid*0.5), h=ctx.params.height*(0.5+ctx.audio.bass);
        const src=[]; for(let s=0;s<S;s++){ const a=t*0.5+s*6.28/S; src.push([Math.cos(a)*3,Math.sin(a)*3]); }
        let c=0;
        for(let iy=0;iy<W;iy++)for(let ix=0;ix<W;ix++){ const px=(ix/(W-1)-0.5)*10, pz=(iy/(W-1)-0.5)*10;
          let v=0; for(let s=0;s<S;s++){ const d=Math.hypot(px-src[s][0],pz-src[s][1]); v+=Math.sin(d*fr-t*4)/(1+d*0.3); }
          const y=v*h*0.4; pa.setY(iy*W+ix,y);
          const cc=pal(0.5+v*0.2+ctx.audio.high*0.2,[0.4,0.45,0.6],[0.5,0.5,0.5],[1,1,1],[0.1,0.3,0.6]);
          colArr[c]=cc.r;colArr[c+1]=cc.g;colArr[c+2]=cc.b; c+=3;
        }
        pa.needsUpdate=true; geo.attributes.color.needsUpdate=true; geo.computeVertexNormals();
      }, dispose(){ ctx.scene.remove(mesh); geo.dispose(); mat.dispose(); } };
  }
});

// ===========================================================================
// 022 — Hopf Fibration (nested fiber circles of S³ projected to R³)
// ===========================================================================
register({
  id:'hopf', name:'Hopf Fibration', group:'Topology',
  tags:['line','topology','geometry'],
  controls:[{id:'fibers',label:'fibers',min:6,max:40,def:20},{id:'spin',label:'spin',min:0,max:2,def:0.4}],
  init(ctx){
    const group=new THREE.Group(); ctx.scene.add(group);
    let lines=[]; let lastF=-1;
    function build(F){
      lines.forEach(l=>{ group.remove(l); l.geometry.dispose(); l.material.dispose(); }); lines=[];
      for(let f=0;f<F;f++){
        const base=f/F*Math.PI; // latitude on S² base
        const SEG=200; const pts=[];
        for(let i=0;i<=SEG;i++){ const t=i/SEG*Math.PI*2;
          // point on base S²
          const a=base, b=f*0.7;
          const s0=Math.cos(a/2), s1=Math.sin(a/2);
          // fiber param t → quaternion → stereographic project from S³
          const q0=s0*Math.cos(t), q1=s0*Math.sin(t), q2=s1*Math.cos(t+b), q3=s1*Math.sin(t+b);
          const k=1/(1-q3+0.0001);
          pts.push(new THREE.Vector3(q0*k,q1*k,q2*k));
        }
        const g=new THREE.BufferGeometry().setFromPoints(pts);
        const col=pal(f/F,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0,0.33,0.67]);
        const m=new THREE.LineBasicMaterial({color:col,transparent:true,opacity:0.7,blending:THREE.AdditiveBlending});
        const ln=new THREE.Line(g,m); group.add(ln); lines.push(ln);
      }
    }
    build(20); group.scale.setScalar(1.2); ctx.camera.position.set(0,0,6);
    return { update(dt,t){ const F=ctx.params.fibers|0; if(F!==lastF){ build(F); lastF=F; }
        group.rotation.y+=dt*ctx.params.spin; group.rotation.x=Math.sin(t*0.2)*0.3;
        group.scale.setScalar(1.0+ctx.audio.bass*0.4);
        lines.forEach(l=>l.material.opacity=0.4+ctx.audio.rms*0.5);
      }, dispose(){ lines.forEach(l=>{ l.geometry.dispose(); l.material.dispose(); }); ctx.scene.remove(group); } };
  }
});

// ===========================================================================
// 023 — Vortex Street (particles past a cylinder shed alternating vortices)
// ===========================================================================
register({
  id:'karman', name:'Kármán Vortex Street', group:'Fluid Dynamics',
  tags:['particles','flow','vortex'],
  controls:[{id:'flow',label:'flow speed',min:0.5,max:4,def:1.8},{id:'shed',label:'shed rate',min:0.2,max:3,def:1.2}],
  init(ctx){
    const N=30000; const pos=new Float32Array(N*3), col=new Float32Array(N*3);
    for(let i=0;i<N;i++){ pos[i*3]=-7+Math.random()*14; pos[i*3+1]=(Math.random()-0.5)*4; pos[i*3+2]=(Math.random()-0.5)*1; }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:0.03,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.7});
    const pts=new THREE.Points(geo,mat); ctx.scene.add(pts);
    // cylinder marker
    const cyl=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,2,24),new THREE.MeshBasicMaterial({color:0x223355}));
    cyl.rotation.x=Math.PI/2; ctx.scene.add(cyl); ctx.camera.position.set(0,0,9);
    return { update(dt,t){
        const U=ctx.params.flow*(1+ctx.audio.bass*0.5), shed=ctx.params.shed; const h=Math.min(dt,0.03);
        for(let i=0;i<N;i++){ const ix=i*3; let x=pos[ix],y=pos[ix+1],z=pos[ix+2];
          let vx=U, vy=0;
          // wake region x>0.5: alternating vortices
          if(x>0.3){ const phase=Math.sin(x*1.5-t*shed*3); const side=Math.sign(phase);
            const vcx=x, vcy=side*0.8; const dx=x-vcx, dy=y-vcy; const dd=dx*dx+dy*dy+0.3;
            vx+=-dy/dd*shed*1.5*side; vy+=dx/dd*shed*1.5*side - phase*0.5; }
          // deflect around cylinder at origin
          const r2=x*x+y*y; if(r2<0.6){ const r=Math.sqrt(r2)+0.01; vx+=x/r*0.5; vy+=y/r*0.5; }
          x+=vx*h; y+=vy*h;
          if(x>7||Math.abs(y)>3){ x=-7+Math.random(); y=(Math.random()-0.5)*4; }
          pos[ix]=x;pos[ix+1]=y;pos[ix+2]=z;
          const sp=Math.min(1,(vx*vx+vy*vy)*0.1);
          const cc=pal(sp+ctx.audio.high*0.2,[0.4,0.5,0.6],[0.5,0.5,0.5],[1,1,1],[0.1,0.3,0.6]);
          col[ix]=cc.r;col[ix+1]=cc.g;col[ix+2]=cc.b;
        }
        geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
        mat.size=0.025+ctx.audio.rms*0.03;
      }, dispose(){ ctx.scene.remove(pts); ctx.scene.remove(cyl); geo.dispose(); mat.dispose(); cyl.geometry.dispose(); cyl.material.dispose(); } };
  }
});

// ===========================================================================
// 024 — Quantum Orbital (hydrogen |ψ|² electron cloud, audio morphs n,l,m)
// ===========================================================================
register({
  id:'orbital', name:'Quantum Orbital Cloud', group:'Quantum',
  tags:['points','probability','quantum'],
  controls:[{id:'mode',label:'orbital',options:['2p_z','3d_z²','3d_xy','4f'],def:1},{id:'spin',label:'spin',min:0,max:2,def:0.3}],
  init(ctx){
    const N=80000; const pos=new Float32Array(N*3), col=new Float32Array(N*3);
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:0.04,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.7});
    const pts=new THREE.Points(geo,mat); ctx.scene.add(pts); ctx.camera.position.set(0,0,12);
    // angular probability shapes (real spherical harmonics, |Y|² * radial)
    function shape(mode){
      // normalize acceptance: angular peak × radial peak (radial exp(-r/3)r² peaks ≈4.87 at r=6)
      const angMax = mode===0?1 : mode===1?4 : mode===2?1 : 4;
      const PEAK = angMax * 4.87;
      for(let i=0;i<N;i++){
        let r,th,ph,amp;
        let tries=0;
        while(true){
          r=Math.random()*8; th=Math.acos(2*Math.random()-1); ph=Math.random()*6.28;
          const ct=Math.cos(th), st=Math.sin(th);
          if(mode===0) amp=ct*ct;                                   // 2p_z
          else if(mode===1) amp=Math.pow(3*ct*ct-1,2);              // 3d_z²
          else if(mode===2) amp=Math.pow(st*st*Math.sin(2*ph),2);   // 3d_xy
          else amp=Math.pow(ct*(5*ct*ct-3),2);                      // 4f_z³
          const radial=Math.exp(-r/3)*r*r;
          if(Math.random() < (amp*radial)/PEAK || ++tries>120) break;
        }
        const ct=Math.cos(th),st=Math.sin(th);
        pos[i*3]=r*st*Math.cos(ph); pos[i*3+1]=r*ct; pos[i*3+2]=r*st*Math.sin(ph);
        const cc=pal(0.3+amp*0.5,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0.05,0.3,0.6]);
        col[i*3]=cc.r;col[i*3+1]=cc.g;col[i*3+2]=cc.b;
      }
      geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
    }
    shape(1); let lastMode=1;
    return { update(dt,t){ const m=ctx.params.mode|0; if(m!==lastMode){ shape(m); lastMode=m; }
        pts.rotation.y+=dt*ctx.params.spin; pts.scale.setScalar(1+ctx.audio.bass*0.3);
        mat.size=0.03+ctx.audio.high*0.03; mat.opacity=0.5+ctx.audio.rms*0.4;
      }, dispose(){ ctx.scene.remove(pts); geo.dispose(); mat.dispose(); } };
  }
});
