// HOLOGRAM 5555 — Batch 03: engines 025-036. Each a distinct algorithm.
import { THREE, register, GLSL, audioUniforms, pushAudio, raymarchQuad, pal } from '/h5555/core.js';
const RM = `${GLSL.palette}`;
function rmUpdate(uniforms, ctx, extra){ return (dt,t)=>{ pushAudio(uniforms,ctx.audio,t);
  uniforms.uRes.value.set(innerWidth,innerHeight); uniforms.uCamPos.value.copy(ctx.camera.position);
  uniforms.uCamMat.value.copy(ctx.camera.matrixWorld); if(extra) extra(uniforms,ctx,dt,t); }; }

// ===========================================================================
// 025 — Caustics (raymarched water-surface light caustics on a floor)
// ===========================================================================
register({
  id:'caustics', name:'Water Caustics', group:'Optics',
  tags:['raymarch','caustics','light'],
  controls:[{id:'scale',label:'ripple scale',min:1,max:8,def:3},{id:'speed',label:'speed',min:0,max:3,def:1}],
  init(ctx){
    const {mesh,uniforms}=raymarchQuad(`
      ${RM} ${GLSL.snoise3}
      uniform float uScale,uSpeed;
      float caustic(vec2 p){
        vec2 i=p; float c=1.0; float t=uTime*uSpeed*0.4;
        for(int n=0;n<5;n++){ float tt=t*(1.0-(3.5/float(n+1)));
          i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));
          c+=1.0/length(vec2(p.x/(sin(i.x+tt)/0.1),p.y/(cos(i.y+tt)/0.1)));
        }
        c/=5.0; c=1.17-pow(c,1.4); return pow(abs(c),8.0);
      }
      vec3 render(vec3 ro,vec3 rd){
        float t=(-2.0-ro.y)/(rd.y-0.0001); if(t<0.0) return vec3(0.02,0.03,0.06);
        vec3 p=ro+rd*t; vec2 uv=p.xz*0.15*uScale;
        float c=caustic(uv)*(0.6+uBass);
        vec3 col=spectral(0.55+uMid*0.2)*c + vec3(0.02,0.05,0.09);
        col*=1.0-min(t*0.02,0.6); return col;
      }`,{uScale:{value:3},uSpeed:{value:1}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,2,6);
    return { update:rmUpdate(uniforms,ctx,(u,c)=>{u.uScale.value=c.params.scale;u.uSpeed.value=c.params.speed;}),
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); } };
  }
});

// ===========================================================================
// 026 — Aurora (raymarched volumetric curtains of light, audio drives shimmer)
// ===========================================================================
register({
  id:'aurora', name:'Aurora Borealis', group:'Plasma / Magnetism',
  tags:['raymarch','volume','aurora'],
  controls:[{id:'height',label:'curtain height',min:1,max:5,def:2.5},{id:'speed',label:'flow',min:0,max:3,def:1}],
  init(ctx){
    const {mesh,uniforms}=raymarchQuad(`
      ${RM} ${GLSL.snoise3}
      uniform float uHeight,uSpeed;
      vec3 render(vec3 ro,vec3 rd){
        vec3 col=vec3(0.0); float trans=1.0; float t=0.5;
        for(int i=0;i<50;i++){ vec3 p=ro+rd*t;
          // vertical curtains: density from horizontal noise, fades with height
          float curtain=snoise(vec3(p.x*0.4+uTime*uSpeed*0.2, uTime*uSpeed*0.1, p.z*0.4))*0.5+0.5;
          curtain=pow(curtain,2.0);
          float hfade=smoothstep(uHeight+2.0,-1.0,p.y)*smoothstep(-2.0,0.5,p.y);
          float dens=curtain*hfade*(0.6+uMid);
          vec3 c=spectral(0.35+p.y*0.08+uHigh*0.2); // green-purple band by height
          col+=c*dens*trans*0.15; trans*=1.0-dens*0.1;
          t+=0.25; if(trans<0.02||t>16.0)break;
        }
        col+=vec3(0.01,0.02,0.04); return col;
      }`,{uHeight:{value:2.5},uSpeed:{value:1}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,0,8);
    return { update:rmUpdate(uniforms,ctx,(u,c)=>{u.uHeight.value=c.params.height;u.uSpeed.value=c.params.speed;}),
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); } };
  }
});

// ===========================================================================
// 027 — Tesseract (4D hypercube rotating in 4D, projected to 3D)
// ===========================================================================
register({
  id:'tesseract', name:'4D Tesseract', group:'Polytopes',
  tags:['line','4d','geometry'],
  controls:[{id:'speedXW',label:'XW rotation',min:0,max:2,def:0.5},{id:'speedYZ',label:'YZ rotation',min:0,max:2,def:0.3}],
  init(ctx){
    // 16 vertices of a 4-cube
    const V=[]; for(let i=0;i<16;i++) V.push([(i&1?1:-1),(i&2?1:-1),(i&4?1:-1),(i&8?1:-1)]);
    const edges=[]; for(let i=0;i<16;i++)for(let j=i+1;j<16;j++){ let diff=0; for(let k=0;k<4;k++) if(V[i][k]!==V[j][k])diff++; if(diff===1) edges.push([i,j]); }
    const pos=new Float32Array(edges.length*2*3), col=new Float32Array(edges.length*2*3);
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.85,blending:THREE.AdditiveBlending});
    const seg=new THREE.LineSegments(geo,mat); ctx.scene.add(seg);
    // vertex glow points
    const vp=new Float32Array(16*3), vc=new Float32Array(16*3);
    const vgeo=new THREE.BufferGeometry(); vgeo.setAttribute('position',new THREE.BufferAttribute(vp,3));
    vgeo.setAttribute('color',new THREE.BufferAttribute(vc,3));
    const vmat=new THREE.PointsMaterial({size:0.15,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
    const vpts=new THREE.Points(vgeo,vmat); ctx.scene.add(vpts); ctx.camera.position.set(0,0,6);
    return { update(dt,t){
        const aXW=t*ctx.params.speedXW, aYZ=t*ctx.params.speedYZ; const proj=[];
        for(let i=0;i<16;i++){ let [x,y,z,w]=V[i];
          // rotate in XW plane
          let nx=x*Math.cos(aXW)-w*Math.sin(aXW), nw=x*Math.sin(aXW)+w*Math.cos(aXW); x=nx;w=nw;
          // rotate in YZ plane
          let ny=y*Math.cos(aYZ)-z*Math.sin(aYZ), nz=y*Math.sin(aYZ)+z*Math.cos(aYZ); y=ny;z=nz;
          const d=2.5/(2.5-w*(1+ctx.audio.bass*0.5)); // 4D→3D perspective
          proj.push([x*d,y*d,z*d]);
          vp[i*3]=x*d;vp[i*3+1]=y*d;vp[i*3+2]=z*d;
          const cc=pal((w+1)/2,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0,0.33,0.67]);
          vc[i*3]=cc.r;vc[i*3+1]=cc.g;vc[i*3+2]=cc.b;
        }
        let k=0; edges.forEach(([a,b])=>{ const pa=proj[a],pb=proj[b];
          pos[k]=pa[0];pos[k+1]=pa[1];pos[k+2]=pa[2]; pos[k+3]=pb[0];pos[k+4]=pb[1];pos[k+5]=pb[2];
          const cc=pal(0.5+ctx.audio.mid*0.3,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0,0.33,0.67]);
          for(let m=0;m<2;m++){ col[k+m*3]=cc.r;col[k+m*3+1]=cc.g;col[k+m*3+2]=cc.b; } k+=6;
        });
        geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
        vgeo.attributes.position.needsUpdate=true; vgeo.attributes.color.needsUpdate=true;
        seg.rotation.y+=dt*0.2; vpts.rotation.copy(seg.rotation); vmat.size=0.1+ctx.audio.high*0.15;
      }, dispose(){ ctx.scene.remove(seg); ctx.scene.remove(vpts); geo.dispose(); mat.dispose(); vgeo.dispose(); vmat.dispose(); } };
  }
});

// ===========================================================================
// 028 — Kuramoto Sync (coupled oscillators on a sphere flash into sync)
// ===========================================================================
register({
  id:'kuramoto', name:'Kuramoto Sync', group:'Statistical Physics',
  tags:['oscillators','sync','sphere'],
  controls:[{id:'coupling',label:'coupling',min:0,max:5,def:2},{id:'spread',label:'freq spread',min:0,max:2,def:0.8}],
  init(ctx){
    const N=4000; const phase=new Float32Array(N), freq=new Float32Array(N), px=new Float32Array(N), py=new Float32Array(N), pz=new Float32Array(N);
    for(let i=0;i<N;i++){ phase[i]=Math.random()*6.28; freq[i]=(Math.random()-0.5)*2;
      const a=Math.random()*6.28,b=Math.acos(2*Math.random()-1); px[i]=Math.sin(b)*Math.cos(a);py[i]=Math.sin(b)*Math.sin(a);pz[i]=Math.cos(b); }
    const pos=new Float32Array(N*3), col=new Float32Array(N*3);
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:0.05,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
    const pts=new THREE.Points(geo,mat); ctx.scene.add(pts); ctx.camera.position.set(0,0,4);
    return { update(dt,t){
        const K=ctx.params.coupling*(1+ctx.audio.bass), sp=ctx.params.spread; const h=Math.min(dt,0.03);
        // mean field (order parameter)
        let sx=0,sy=0; for(let i=0;i<N;i++){ sx+=Math.cos(phase[i]); sy+=Math.sin(phase[i]); }
        sx/=N;sy/=N; const psi=Math.atan2(sy,sx), R=Math.sqrt(sx*sx+sy*sy);
        for(let i=0;i<N;i++){ phase[i]+=(freq[i]*sp + K*R*Math.sin(psi-phase[i]))*h*3;
          const r=1.0+0.25*Math.sin(phase[i]); // pulse radius by phase
          pos[i*3]=px[i]*r;pos[i*3+1]=py[i]*r;pos[i*3+2]=pz[i]*r;
          const c=(Math.sin(phase[i])*0.5+0.5);
          const cc=pal(c+ctx.audio.high*0.2,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0,0.33,0.67]);
          col[i*3]=cc.r;col[i*3+1]=cc.g;col[i*3+2]=cc.b;
        }
        geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
        pts.rotation.y+=dt*0.2; mat.size=0.04+R*0.06+ctx.audio.rms*0.03; // tighter sync = bigger
      }, dispose(){ ctx.scene.remove(pts); geo.dispose(); mat.dispose(); } };
  }
});

// ===========================================================================
// 029 — Cloth (position-based dynamics sheet rippling in audio wind)
// ===========================================================================
register({
  id:'cloth', name:'Cloth in Wind', group:'Soft Body',
  tags:['mesh','physics','cloth'],
  controls:[{id:'wind',label:'wind',min:0,max:4,def:1.5},{id:'stiff',label:'stiffness',min:0.1,max:1,def:0.6}],
  init(ctx){
    const G=40; const N=G*G; const cur=new Float32Array(N*3), prev=new Float32Array(N*3);
    for(let y=0;y<G;y++)for(let x=0;x<G;x++){ const i=(y*G+x)*3;
      cur[i]=(x/(G-1)-0.5)*6; cur[i+1]=(0.5-y/(G-1))*6; cur[i+2]=0;
      prev[i]=cur[i];prev[i+1]=cur[i+1];prev[i+2]=cur[i+2]; }
    const geo=new THREE.PlaneGeometry(6,6,G-1,G-1);
    const colArr=new Float32Array(N*3); geo.setAttribute('color',new THREE.BufferAttribute(colArr,3));
    const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.5,metalness:0.2,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geo,mat); ctx.scene.add(mesh);
    ctx.scene.add(new THREE.AmbientLight(0x445577,0.7));
    const dl=new THREE.DirectionalLight(0xffffff,1.5); dl.position.set(2,3,4); ctx.scene.add(dl);
    ctx.camera.position.set(0,0,8);
    const pa=geo.attributes.position; const rest=6/(G-1);
    function idx(x,y){ return (y*G+x)*3; }
    return { update(dt,t){
        const wind=ctx.params.wind*(1+ctx.audio.bass), stf=ctx.params.stiff;
        // verlet integrate
        for(let i=0;i<N;i++){ const ix=i*3;
          if(i<G){ continue; } // pin top row
          for(let a=0;a<3;a++){ const tmp=cur[ix+a];
            let acc=(a===1?-9.0:0); if(a===2) acc+=Math.sin(t*3+cur[ix]*0.5)*wind*4; // wind on Z
            cur[ix+a]+=(cur[ix+a]-prev[ix+a])*0.98+acc*dt*dt; prev[ix+a]=tmp;
          }
        }
        // satisfy distance constraints (few iterations)
        for(let it=0;it<3;it++){
          for(let y=0;y<G;y++)for(let x=0;x<G;x++){ const i=idx(x,y);
            if(x<G-1){ const j=idx(x+1,y); solve(i,j); }
            if(y<G-1){ const j=idx(x,y+1); solve(i,j); }
          }
        }
        function solve(i,j){ const dx=cur[j]-cur[i],dy=cur[j+1]-cur[i+1],dz=cur[j+2]-cur[i+2];
          const d=Math.sqrt(dx*dx+dy*dy+dz*dz)||1; const diff=(d-rest)/d*0.5*stf;
          const pinI=(i/3)<G, pinJ=(j/3)<G;
          if(!pinI){ cur[i]+=dx*diff;cur[i+1]+=dy*diff;cur[i+2]+=dz*diff; }
          if(!pinJ){ cur[j]-=dx*diff;cur[j+1]-=dy*diff;cur[j+2]-=dz*diff; }
        }
        for(let i=0;i<N;i++){ pa.setXYZ(i,cur[i*3],cur[i*3+1],cur[i*3+2]);
          const cc=pal(0.5+cur[i*3+2]*0.1+ctx.audio.high*0.2,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0.1,0.3,0.6]);
          colArr[i*3]=cc.r;colArr[i*3+1]=cc.g;colArr[i*3+2]=cc.b; }
        pa.needsUpdate=true; geo.attributes.color.needsUpdate=true; geo.computeVertexNormals();
      }, dispose(){ ctx.scene.remove(mesh); geo.dispose(); mat.dispose(); } };
  }
});

// ===========================================================================
// 030 — Mandelbox (raymarched box-fold fractal)
// ===========================================================================
register({
  id:'mandelbox', name:'Mandelbox', group:'Fractals',
  tags:['raymarch','fractal','fold'],
  controls:[{id:'scale',label:'scale',min:-3,max:3,def:-1.8},{id:'react',label:'audio fold',min:0,max:2,def:0.8}],
  init(ctx){
    const {mesh,uniforms}=raymarchQuad(`
      ${RM}
      uniform float uScale,uReact;
      float de(vec3 p){
        vec3 z=p; float dr=1.0; float s=uScale+uReact*uBass;
        for(int i=0;i<10;i++){
          z=clamp(z,-1.0,1.0)*2.0-z;          // box fold
          float r2=dot(z,z);
          if(r2<0.25){ z*=4.0; dr*=4.0; } else if(r2<1.0){ z/=r2; dr/=r2; } // sphere fold
          z=s*z+p; dr=dr*abs(s)+1.0;
        }
        return length(z)/abs(dr);
      }
      vec3 render(vec3 ro,vec3 rd){ float t=0.0; vec3 col=vec3(0.0);
        for(int i=0;i<90;i++){ vec3 p=ro+rd*t; float d=de(p);
          if(d<0.001){ vec2 e=vec2(0.001,0.0);
            vec3 nr=normalize(vec3(de(p+e.xyy)-de(p-e.xyy),de(p+e.yxy)-de(p-e.yxy),de(p+e.yyx)-de(p-e.yyx)));
            float diff=max(dot(nr,normalize(vec3(1,1,0.6))),0.0); float ao=1.0-float(i)/90.0;
            col=spectral(0.5+length(p)*0.15+uMid*0.3)*(0.3+0.7*diff)*ao; break; }
          t+=d; if(t>30.0)break; }
        return col;
      }`,{uScale:{value:-1.8},uReact:{value:0.8}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,0,8);
    return { update:rmUpdate(uniforms,ctx,(u,c)=>{u.uScale.value=c.params.scale;u.uReact.value=c.params.react;}),
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); } };
  }
});

// ===========================================================================
// 031 — Voronoi Shatter (3D cellular fracture pattern, audio cracks it open)
// ===========================================================================
register({
  id:'voronoi3d', name:'Voronoi Shatter', group:'Generative',
  tags:['raymarch','cellular','crystal'],
  controls:[{id:'cells',label:'cell density',min:1,max:6,def:3},{id:'crack',label:'crack width',min:0.01,max:0.2,def:0.05}],
  init(ctx){
    const {mesh,uniforms}=raymarchQuad(`
      ${RM} ${GLSL.hash}
      uniform float uCells,uCrack;
      // 3D voronoi edge distance
      float voro(vec3 p){
        vec3 g=floor(p), f=fract(p); float d1=9.0,d2=9.0;
        for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)for(int z=-1;z<=1;z++){
          vec3 o=vec3(float(x),float(y),float(z));
          vec3 r=o+hash31(dot(g+o,vec3(1.0,57.0,113.0)))-f;
          float d=dot(r,r); if(d<d1){ d2=d1; d1=d; } else if(d<d2) d2=d;
        }
        return sqrt(d2)-sqrt(d1); // edge proximity
      }
      vec3 render(vec3 ro,vec3 rd){ float t=0.0; vec3 col=vec3(0.0);
        for(int i=0;i<60;i++){ vec3 p=ro+rd*t;
          float sphere=length(p)-2.2; // bound
          float edge=voro(p*uCells+uTime*0.1);
          float d=max(sphere, uCrack*(1.0+uBass)-edge); // shell where near a cell edge
          if(d<0.002){ vec2 e=vec2(0.01,0.0);
            float c=edge;
            col=spectral(0.5+c+uMid*0.3+length(p)*0.1)*(0.5+0.5*c)*(1.0-float(i)/60.0); break; }
          t+=max(d*0.6,0.01); if(t>12.0)break; }
        return col;
      }`,{uCells:{value:3},uCrack:{value:0.05}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,0,6);
    return { update:rmUpdate(uniforms,ctx,(u,c)=>{u.uCells.value=c.params.cells;u.uCrack.value=c.params.crack;}),
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); } };
  }
});

// ===========================================================================
// 032 — Superformula (3D supershape mesh morphing with audio)
// ===========================================================================
register({
  id:'superformula', name:'Superformula Shape', group:'Math Surfaces',
  tags:['mesh','parametric','morph'],
  controls:[{id:'m',label:'symmetry',min:1,max:14,def:6},{id:'n1',label:'n1',min:0.1,max:5,def:1},{id:'react',label:'audio morph',min:0,max:3,def:1.5}],
  init(ctx){
    const SEG=120; const geo=new THREE.SphereGeometry(1,SEG,SEG);
    const base=geo.attributes.position.array.slice();
    const colArr=new Float32Array(geo.attributes.position.count*3); geo.setAttribute('color',new THREE.BufferAttribute(colArr,3));
    const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.3,metalness:0.5,side:THREE.DoubleSide,flatShading:false});
    const mesh=new THREE.Mesh(geo,mat); ctx.scene.add(mesh);
    ctx.scene.add(new THREE.AmbientLight(0x445577,0.7));
    const dl=new THREE.DirectionalLight(0xffffff,1.6); dl.position.set(3,4,5); ctx.scene.add(dl);
    const dl2=new THREE.DirectionalLight(0xff66aa,0.8); dl2.position.set(-3,-2,2); ctx.scene.add(dl2);
    ctx.camera.position.set(0,0,4);
    const pa=geo.attributes.position; const cnt=pa.count;
    function sf(angle,m,n1,n2,n3){ const t1=Math.pow(Math.abs(Math.cos(m*angle/4)),n2);
      const t2=Math.pow(Math.abs(Math.sin(m*angle/4)),n3); return Math.pow(t1+t2,-1/n1); }
    return { update(dt,t){
        const m=ctx.params.m+ctx.audio.mid*ctx.params.react*2, n1=ctx.params.n1*(0.5+ctx.audio.bass*ctx.params.react);
        for(let i=0;i<cnt;i++){ const bx=base[i*3],by=base[i*3+1],bz=base[i*3+2];
          // spherical coords from base sphere
          const theta=Math.atan2(bz,bx); const phi=Math.asin(Math.max(-1,Math.min(1,by)));
          const r1=sf(theta,m,n1,1.7,1.7), r2=sf(phi,m,n1,1.7,1.7);
          const x=r1*Math.cos(theta)*r2*Math.cos(phi);
          const y=r2*Math.sin(phi);
          const z=r1*Math.sin(theta)*r2*Math.cos(phi);
          const s=1.6; pa.setXYZ(i,x*s,y*s,z*s);
          const cc=pal(0.5+r1*0.2+ctx.audio.high*0.2,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0.1,0.3,0.6]);
          colArr[i*3]=cc.r;colArr[i*3+1]=cc.g;colArr[i*3+2]=cc.b;
        }
        pa.needsUpdate=true; geo.attributes.color.needsUpdate=true; geo.computeVertexNormals();
        mesh.rotation.y+=dt*0.3;
      }, dispose(){ ctx.scene.remove(mesh); geo.dispose(); mat.dispose(); } };
  }
});

// ===========================================================================
// 033 — Magnetic Field Lines (dipole field traced as glowing streamlines)
// ===========================================================================
register({
  id:'magnetic', name:'Magnetic Dipole Field', group:'EM Fields',
  tags:['line','field','physics'],
  controls:[{id:'lines',label:'field lines',min:12,max:80,def:40},{id:'spin',label:'spin',min:0,max:2,def:0.3}],
  init(ctx){
    const group=new THREE.Group(); ctx.scene.add(group); let lines=[]; let last=-1;
    function dipoleB(p){ // dipole moment along +y
      const m=new THREE.Vector3(0,1,0); const r=p.length()||0.001;
      const rhat=p.clone().normalize();
      const term=rhat.clone().multiplyScalar(3*m.dot(rhat)).sub(m);
      return term.divideScalar(r*r*r);
    }
    function build(L){
      lines.forEach(l=>{ group.remove(l); l.geometry.dispose(); l.material.dispose(); }); lines=[];
      for(let f=0;f<L;f++){ const a=f/L*6.28; const start=new THREE.Vector3(Math.cos(a)*0.4,0.9,Math.sin(a)*0.4);
        const pts=[]; let p=start.clone();
        for(let s=0;s<300;s++){ pts.push(p.clone()); const B=dipoleB(p); const step=B.normalize().multiplyScalar(0.06); p.add(step);
          if(p.length()>5||p.length()<0.2) break; }
        const g=new THREE.BufferGeometry().setFromPoints(pts);
        const col=pal(f/L,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0,0.33,0.67]);
        const mt=new THREE.LineBasicMaterial({color:col,transparent:true,opacity:0.6,blending:THREE.AdditiveBlending});
        const ln=new THREE.Line(g,mt); group.add(ln); lines.push(ln);
      }
    }
    build(40); ctx.camera.position.set(0,0,7);
    return { update(dt,t){ const L=ctx.params.lines|0; if(L!==last){ build(L); last=L; }
        group.rotation.y+=dt*ctx.params.spin; group.scale.setScalar(1+ctx.audio.bass*0.3);
        lines.forEach(l=>l.material.opacity=0.4+ctx.audio.rms*0.5);
      }, dispose(){ lines.forEach(l=>{ l.geometry.dispose(); l.material.dispose(); }); ctx.scene.remove(group); } };
  }
});

// ===========================================================================
// 034 — Lissajous 3D (parametric oscilloscope curve, audio sets frequencies)
// ===========================================================================
register({
  id:'lissajous', name:'Lissajous Oscilloscope', group:'Spectral',
  tags:['line','parametric','oscilloscope'],
  controls:[{id:'fx',label:'freq X',min:1,max:9,def:3},{id:'fy',label:'freq Y',min:1,max:9,def:2},{id:'fz',label:'freq Z',min:1,max:9,def:4}],
  init(ctx){
    const N=4000; const pos=new Float32Array(N*3), col=new Float32Array(N*3);
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.85,blending:THREE.AdditiveBlending});
    const line=new THREE.Line(geo,mat); ctx.scene.add(line); ctx.camera.position.set(0,0,6);
    return { update(dt,t){ const fx=ctx.params.fx,fy=ctx.params.fy,fz=ctx.params.fz;
        const ph=t*0.3; const amp=2*(1+ctx.audio.bass*0.3);
        for(let i=0;i<N;i++){ const u=i/N*6.28;
          pos[i*3]=Math.sin(fx*u+ph)*amp;
          pos[i*3+1]=Math.sin(fy*u+ph*1.3)*amp;
          pos[i*3+2]=Math.sin(fz*u)*amp;
          const cc=pal(i/N+ctx.audio.high*0.2,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0,0.33,0.67]);
          col[i*3]=cc.r;col[i*3+1]=cc.g;col[i*3+2]=cc.b;
        }
        geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
        line.rotation.y+=dt*0.2; line.rotation.x=Math.sin(t*0.15)*0.3; mat.opacity=0.6+ctx.audio.rms*0.4;
      }, dispose(){ ctx.scene.remove(line); geo.dispose(); mat.dispose(); } };
  }
});

// ===========================================================================
// 035 — Quasicrystal (5-fold Penrose-style interference, raymarched relief)
// ===========================================================================
register({
  id:'quasicrystal', name:'Quasicrystal Interference', group:'Generative',
  tags:['raymarch','quasicrystal','waves'],
  controls:[{id:'waves',label:'plane waves',min:3,max:11,def:7},{id:'freq',label:'frequency',min:2,max:20,def:10}],
  init(ctx){
    const {mesh,uniforms}=raymarchQuad(`
      ${RM}
      uniform float uWaves,uFreq;
      float qc(vec2 p){ float s=0.0; int n=int(uWaves);
        for(int i=0;i<11;i++){ if(i>=n)break; float a=3.14159*float(i)/uWaves;
          s+=cos(dot(p,vec2(cos(a),sin(a)))*uFreq + uTime*0.5); }
        return s/uWaves;
      }
      vec3 render(vec3 ro,vec3 rd){
        float t=(-2.0-ro.y)/(rd.y-0.0001); if(t<0.0) return vec3(0.02,0.02,0.05);
        vec3 p=ro+rd*t; float v=qc(p.xz*0.3)*(0.6+uBass);
        vec3 col=spectral(0.5+v*0.5+uMid*0.2)*(0.4+0.6*abs(v));
        col*=1.0-min(t*0.015,0.6); return col;
      }`,{uWaves:{value:7},uFreq:{value:10}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,3,5);
    return { update:rmUpdate(uniforms,ctx,(u,c)=>{u.uWaves.value=c.params.waves;u.uFreq.value=c.params.freq;}),
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); } };
  }
});

// ===========================================================================
// 036 — Torus Knot Flow (particles streaming along a (p,q) torus knot)
// ===========================================================================
register({
  id:'torusknot', name:'Torus Knot Flow', group:'Topology',
  tags:['particles','knot','flow'],
  controls:[{id:'p',label:'p winds',min:1,max:9,def:3},{id:'q',label:'q winds',min:1,max:9,def:2},{id:'speed',label:'speed',min:0,max:3,def:1}],
  init(ctx){
    const N=60000; const pos=new Float32Array(N*3), col=new Float32Array(N*3), off=new Float32Array(N);
    for(let i=0;i<N;i++) off[i]=Math.random();
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:0.025,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.8});
    const pts=new THREE.Points(geo,mat); ctx.scene.add(pts); ctx.camera.position.set(0,0,8);
    return { update(dt,t){ const p=ctx.params.p,q=ctx.params.q,sp=ctx.params.speed;
        const flow=t*sp*0.3; const tube=0.4*(1+ctx.audio.bass*0.5);
        for(let i=0;i<N;i++){ const u=(off[i]+flow)%1*6.28;
          const r=2+Math.cos(q*u);
          const cx=r*Math.cos(p*u), cy=r*Math.sin(p*u), cz=-Math.sin(q*u)*2;
          // scatter around the centerline
          const a=off[i]*628.0+t; const rr=tube*((i%50)/50);
          pos[i*3]=cx+Math.cos(a)*rr; pos[i*3+1]=cy+Math.sin(a)*rr; pos[i*3+2]=cz+Math.cos(a*1.3)*rr;
          const cc=pal((u/6.28)+ctx.audio.high*0.2,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0,0.33,0.67]);
          col[i*3]=cc.r;col[i*3+1]=cc.g;col[i*3+2]=cc.b;
        }
        geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
        pts.rotation.y+=dt*0.2; mat.size=0.02+ctx.audio.rms*0.03;
      }, dispose(){ ctx.scene.remove(pts); geo.dispose(); mat.dispose(); } };
  }
});
