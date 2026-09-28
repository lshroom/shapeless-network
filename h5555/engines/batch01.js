// HOLOGRAM 5555 — Batch 01: 12 flagship engines, each a distinct algorithm.
import { THREE, register, GLSL, audioUniforms, pushAudio, raymarchQuad, pal } from '/h5555/core.js';

const RM = `${GLSL.palette}`; // shared palette for raymarch engines

// ===========================================================================
// 001 — Clifford Attractor (static orbit cloud, audio pulse + spin)
// ===========================================================================
register({
  id:'clifford', name:'Clifford Attractor', group:'Strange Attractors',
  tags:['particles','chaos','points'],
  controls:[
    {id:'a',label:'a',min:-3,max:3,def:-1.7},{id:'b',label:'b',min:-3,max:3,def:1.8},
    {id:'c',label:'c',min:-3,max:3,def:-1.9},{id:'d',label:'d',min:-3,max:3,def:-0.4},
    {id:'spin',label:'spin',min:0,max:2,def:0.4},{id:'react',label:'audio react',min:0,max:3,def:1.2},
  ],
  init(ctx){
    const N=200000; const pos=new Float32Array(N*3), col=new Float32Array(N*3);
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:0.012,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.7});
    const pts=new THREE.Points(geo,mat); ctx.scene.add(pts);
    let lastP=[0,0,0,0];
    function rebuild(a,b,c,d){
      let x=0.1,y=0.1;
      for(let i=0;i<N;i++){
        const nx=Math.sin(a*y)+c*Math.cos(a*x);
        const ny=Math.sin(b*x)+d*Math.cos(b*y);
        x=nx;y=ny;
        const z=Math.sin((x+y)*1.3)*1.2;
        pos[i*3]=x*1.6; pos[i*3+1]=y*1.6; pos[i*3+2]=z;
        const cc=pal((x+2)/4,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0,0.2,0.5]);
        col[i*3]=cc.r;col[i*3+1]=cc.g;col[i*3+2]=cc.b;
      }
      geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
    }
    rebuild(-1.7,1.8,-1.9,-0.4);
    ctx.camera.position.set(0,0,7);
    return {
      update(dt,t){
        const p=ctx.params, ap=[p.a,p.b,p.c,p.d];
        if(ap.some((v,i)=>v!==lastP[i])){ rebuild(p.a,p.b,p.c,p.d); lastP=ap; }
        pts.rotation.y+=dt*p.spin; pts.rotation.x=Math.sin(t*0.2)*0.3;
        const s=1+ctx.audio.bass*p.react*0.5; pts.scale.setScalar(s);
        mat.size=0.01+ctx.audio.high*0.03; mat.opacity=0.5+ctx.audio.rms*0.5;
      },
      dispose(){ ctx.scene.remove(pts); geo.dispose(); mat.dispose(); }
    };
  }
});

// ===========================================================================
// 002 — Mandelbulb (raymarched, audio morphs power + glow)
// ===========================================================================
register({
  id:'mandelbulb', name:'Mandelbulb Fractal', group:'Fractals',
  tags:['raymarch','fractal','3d'],
  controls:[{id:'power',label:'power',min:2,max:12,def:8},{id:'react',label:'audio morph',min:0,max:4,def:2}],
  init(ctx){
    const {mesh,uniforms}=raymarchQuad(`
      ${RM}
      uniform float uPower,uReact;
      float de(vec3 p){
        vec3 z=p; float dr=1.0; float r=0.0;
        float pw=uPower+sin(uTime*0.3)*1.0+uBass*uReact*2.0;
        for(int i=0;i<8;i++){
          r=length(z); if(r>2.0)break;
          float th=acos(z.z/r); float ph=atan(z.y,z.x);
          dr=pow(r,pw-1.0)*pw*dr+1.0;
          float zr=pow(r,pw); th*=pw; ph*=pw;
          z=zr*vec3(sin(th)*cos(ph),sin(ph)*sin(th),cos(th))+p;
        }
        return 0.5*log(r)*r/dr;
      }
      vec3 render(vec3 ro,vec3 rd){
        float t=0.0; float glow=0.0; vec3 col=vec3(0.0);
        for(int i=0;i<90;i++){
          vec3 p=ro+rd*t; float d=de(p);
          glow+=exp(-d*22.0);
          if(d<0.001){
            vec2 e=vec2(0.001,0.0);
            vec3 n=normalize(vec3(de(p+e.xyy)-de(p-e.xyy),de(p+e.yxy)-de(p-e.yxy),de(p+e.yyx)-de(p-e.yyx)));
            float diff=max(dot(n,normalize(vec3(1,1,1))),0.0);
            float ao=1.0-float(i)/90.0;
            col=spectral(0.5+length(p)*0.3+uMid*0.3)*(0.3+0.7*diff)*ao;
            break;
          }
          t+=d; if(t>8.0)break;
        }
        col+=spectral(uTime*0.05+uHigh)*glow*0.0035*(0.5+uRms);
        return col;
      }`,{uPower:{value:8},uReact:{value:2}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,0,3);
    return {
      update(dt,t){ pushAudio(uniforms,ctx.audio,t);
        uniforms.uRes.value.set(innerWidth,innerHeight);
        uniforms.uCamPos.value.copy(ctx.camera.position);
        uniforms.uCamMat.value.copy(ctx.camera.matrixWorld);
        uniforms.uPower.value=ctx.params.power; uniforms.uReact.value=ctx.params.react; },
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
    };
  }
});

// ===========================================================================
// 003 — Black Hole (gravitational lensing + accretion disk, raymarched)
// ===========================================================================
register({
  id:'blackhole', name:'Black Hole Lensing', group:'Spacetime',
  tags:['raymarch','relativity','disk'],
  controls:[{id:'mass',label:'mass',min:0.3,max:2,def:1},{id:'disk',label:'disk glow',min:0,max:3,def:1.4}],
  init(ctx){
    const {mesh,uniforms}=raymarchQuad(`
      ${RM} ${GLSL.hash}
      uniform float uMass,uDisk;
      float starfield(vec3 rd){ vec3 p=rd*40.0; float s=hash11(floor(p.x)+floor(p.y)*57.0+floor(p.z)*113.0); return smoothstep(0.997,1.0,s); }
      vec3 render(vec3 ro,vec3 rd){
        vec3 pos=ro; vec3 vel=rd; vec3 col=vec3(0.0);
        float M=uMass*0.6;
        for(int i=0;i<160;i++){
          float r=length(pos);
          if(r<M*1.0){ return col; } // swallowed
          vec3 g=-normalize(pos)*M/(r*r)*0.6;   // gravity bends the ray
          vel=normalize(vel+g*0.08);
          pos+=vel*0.12;
          // accretion disk in y~0 plane
          float dr=length(pos.xz);
          if(abs(pos.y)<0.06 && dr>M*1.8 && dr<5.0){
            float heat=1.0-(dr-M*1.8)/(5.0-M*1.8);
            float dopp=0.6+0.4*sin(atan(pos.z,pos.x)*1.0+uTime);
            col+=spectral(0.05+heat*0.25+uMid*0.2)*heat*uDisk*0.18*dopp*(0.6+uBass);
          }
          if(r>10.0){ col+=vec3(starfield(vel))*(0.6+uHigh); break; }
        }
        return col;
      }`,{uMass:{value:1},uDisk:{value:1.4}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,2,7);
    return {
      update(dt,t){ pushAudio(uniforms,ctx.audio,t);
        uniforms.uRes.value.set(innerWidth,innerHeight);
        uniforms.uCamPos.value.copy(ctx.camera.position);
        uniforms.uCamMat.value.copy(ctx.camera.matrixWorld);
        uniforms.uMass.value=ctx.params.mass; uniforms.uDisk.value=ctx.params.disk; },
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
    };
  }
});

// ===========================================================================
// 004 — Curl Noise Flow (CPU-advected particle field, audio turbulence)
// ===========================================================================
register({
  id:'curlflow', name:'Curl Noise Flow', group:'Flow Fields',
  tags:['particles','flow','noise'],
  controls:[{id:'speed',label:'speed',min:0,max:3,def:1},{id:'scale',label:'turbulence',min:0.2,max:3,def:1},{id:'react',label:'audio',min:0,max:3,def:1.5}],
  init(ctx){
    const N=45000; const pos=new Float32Array(N*3), col=new Float32Array(N*3);
    const home=new Float32Array(N*3);
    for(let i=0;i<N;i++){ const x=(Math.random()-0.5)*8,y=(Math.random()-0.5)*8,z=(Math.random()-0.5)*8;
      pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z; home[i*3]=x;home[i*3+1]=y;home[i*3+2]=z; }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:0.03,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.8});
    const pts=new THREE.Points(geo,mat); ctx.scene.add(pts);
    // cheap 3D value-noise curl on CPU
    function n3(x,y,z){ return Math.sin(x*1.3+Math.cos(y*0.7))*Math.cos(y*1.1+Math.sin(z*0.9))*Math.sin(z*1.2+Math.cos(x*0.5)); }
    function curl(x,y,z,e){
      const dz1=n3(x,y+e,z)-n3(x,y-e,z), dy1=n3(x,y,z+e)-n3(x,y,z-e);
      const dx2=n3(x,y,z+e)-n3(x,y,z-e), dz2=n3(x+e,y,z)-n3(x-e,y,z);
      const dy3=n3(x+e,y,z)-n3(x-e,y,z), dx3=n3(x,y+e,z)-n3(x,y-e,z);
      return [(dz1-dy1)/(2*e),(dx2-dz2)/(2*e),(dy3-dx3)/(2*e)];
    }
    return {
      update(dt,t){
        const p=ctx.params, sc=p.scale*(1+ctx.audio.bass*p.react), sp=p.speed*(0.5+ctx.audio.rms*p.react)*dt*2;
        for(let i=0;i<N;i++){
          const ix=i*3; let x=pos[ix],y=pos[ix+1],z=pos[ix+2];
          const v=curl(x*0.25*sc+t*0.05,y*0.25*sc,z*0.25*sc,0.15);
          x+=v[0]*sp; y+=v[1]*sp; z+=v[2]*sp;
          // respawn far particles to home
          if(x*x+y*y+z*z>50){ x=home[ix]+ (Math.random()-0.5); y=home[ix+1]; z=home[ix+2]; }
          pos[ix]=x;pos[ix+1]=y;pos[ix+2]=z;
          const sp2=Math.min(1,(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])*0.3);
          const cc=pal(sp2+ctx.audio.high*0.3,[0.4,0.5,0.6],[0.5,0.5,0.5],[1,1,1],[0.1,0.3,0.6]);
          col[ix]=cc.r;col[ix+1]=cc.g;col[ix+2]=cc.b;
        }
        geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
        pts.rotation.y+=dt*0.05; mat.size=0.025+ctx.audio.high*0.03;
      },
      dispose(){ ctx.scene.remove(pts); geo.dispose(); mat.dispose(); }
    };
  }
});

// ===========================================================================
// 005 — Gyroid (triply-periodic minimal surface, raymarched, audio breathes)
// ===========================================================================
register({
  id:'gyroid', name:'Gyroid Lattice', group:'Minimal Surfaces',
  tags:['raymarch','tpms','geometry'],
  controls:[{id:'scale',label:'cell scale',min:1,max:8,def:3},{id:'thick',label:'thickness',min:0.02,max:0.6,def:0.12}],
  init(ctx){
    const {mesh,uniforms}=raymarchQuad(`
      ${RM}
      uniform float uScale,uThick;
      float de(vec3 p){
        float s=uScale+uBass*2.0;
        vec3 q=p*s;
        float g=dot(sin(q),cos(q.yzx));
        float lattice=(abs(g)-uThick*(1.0+uMid))/s;
        float ball=length(p)-2.6;        // carve a finite spherical chunk
        return max(lattice,ball);
      }
      vec3 render(vec3 ro,vec3 rd){
        float t=0.0; vec3 col=vec3(0.0);
        for(int i=0;i<100;i++){
          vec3 p=ro+rd*t; float d=de(p);
          if(d<0.001){
            vec2 e=vec2(0.002,0.0);
            vec3 n=normalize(vec3(de(p+e.xyy)-de(p-e.xyy),de(p+e.yxy)-de(p-e.yxy),de(p+e.yyx)-de(p-e.yyx)));
            float diff=max(dot(n,normalize(vec3(0.6,0.8,0.4))),0.0);
            float fres=pow(1.0-max(dot(n,-rd),0.0),3.0);
            float ao=1.0-float(i)/100.0;
            col=spectral(0.5+p.z*0.1+uTime*0.05+uHigh*0.3)*(0.25+0.6*diff)*ao+fres*0.25*spectral(uMid);
            break;
          }
          t+=d; if(t>14.0)break;
        }
        return col;
      }`,{uScale:{value:3},uThick:{value:0.12}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,0,7);
    return {
      update(dt,t){ pushAudio(uniforms,ctx.audio,t);
        uniforms.uRes.value.set(innerWidth,innerHeight);
        uniforms.uCamPos.value.copy(ctx.camera.position);
        uniforms.uCamMat.value.copy(ctx.camera.matrixWorld);
        uniforms.uScale.value=ctx.params.scale; uniforms.uThick.value=ctx.params.thick; },
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
    };
  }
});

// ===========================================================================
// 006 — SDF Morph (smooth-min blended primitives morphing with audio)
// ===========================================================================
register({
  id:'sdfmorph', name:'SDF Morph Field', group:'SDF',
  tags:['raymarch','morph','organic'],
  controls:[{id:'blend',label:'blend',min:0.1,max:2,def:0.8},{id:'count',label:'spheres',min:2,max:9,def:6}],
  init(ctx){
    const {mesh,uniforms}=raymarchQuad(`
      ${RM}
      uniform float uBlend,uCount;
      float smin(float a,float b,float k){ float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0); return mix(b,a,h)-k*h*(1.0-h); }
      float de(vec3 p){
        float d=10.0; float n=uCount;
        for(int i=0;i<9;i++){ if(float(i)>=n)break;
          float fi=float(i);
          vec3 c=vec3(sin(uTime*0.5+fi*2.1),cos(uTime*0.4+fi*1.7),sin(uTime*0.3+fi*1.3))*(1.5+uBass);
          float r=0.4+0.3*sin(uTime+fi)+uMid*0.3;
          d=smin(d,length(p-c)-r,uBlend);
        }
        return d;
      }
      vec3 render(vec3 ro,vec3 rd){
        float t=0.0; vec3 col=vec3(0.0);
        for(int i=0;i<90;i++){
          vec3 p=ro+rd*t; float d=de(p);
          if(d<0.001){
            vec2 e=vec2(0.002,0.0);
            vec3 nrm=normalize(vec3(de(p+e.xyy)-de(p-e.xyy),de(p+e.yxy)-de(p-e.yxy),de(p+e.yyx)-de(p-e.yyx)));
            float diff=max(dot(nrm,normalize(vec3(1,1,0.5))),0.0);
            float fres=pow(1.0-max(dot(nrm,-rd),0.0),2.5);
            col=spectral(0.5+length(p)*0.2+uHigh*0.3)*(0.3+0.7*diff)+fres*0.6*spectral(uTime*0.1);
            break;
          }
          t+=d; if(t>12.0)break;
        }
        return col;
      }`,{uBlend:{value:0.8},uCount:{value:6}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,0,6);
    return {
      update(dt,t){ pushAudio(uniforms,ctx.audio,t);
        uniforms.uRes.value.set(innerWidth,innerHeight);
        uniforms.uCamPos.value.copy(ctx.camera.position);
        uniforms.uCamMat.value.copy(ctx.camera.matrixWorld);
        uniforms.uBlend.value=ctx.params.blend; uniforms.uCount.value=ctx.params.count; },
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
    };
  }
});

// ===========================================================================
// 007 — Metaball Marching Cubes (real isosurface mesh, audio blobs)
// ===========================================================================
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
register({
  id:'metaball', name:'Metaball Isosurface', group:'Implicit Surfaces',
  tags:['marching-cubes','blobs','mesh'],
  controls:[{id:'count',label:'blobs',min:2,max:12,def:7},{id:'iso',label:'iso',min:30,max:160,def:80}],
  init(ctx){
    const mat=new THREE.MeshStandardMaterial({color:0x88aaff,roughness:0.25,metalness:0.6,emissive:0x112244});
    const mc=new MarchingCubes(56,mat,true,true,90000);
    mc.scale.setScalar(3.2); ctx.scene.add(mc);
    const l1=new THREE.DirectionalLight(0xffffff,2); l1.position.set(3,4,5); ctx.scene.add(l1);
    const l2=new THREE.DirectionalLight(0xff66aa,1.2); l2.position.set(-4,-2,3); ctx.scene.add(l2);
    ctx.scene.add(new THREE.AmbientLight(0x223355,0.6));
    ctx.camera.position.set(0,0,7);
    return {
      update(dt,t){
        mc.reset(); const n=ctx.params.count|0; const str=0.9+ctx.audio.bass*0.9; const sub=10;
        for(let i=0;i<n;i++){
          const fi=i/ n;
          const x=0.5+0.3*Math.sin(t*0.7+fi*6.28+ctx.audio.mid*3);
          const y=0.5+0.3*Math.cos(t*0.6+fi*5.1);
          const z=0.5+0.3*Math.sin(t*0.5+fi*3.7);
          mc.addBall(x,y,z,str,sub);
        }
        mc.isolation=ctx.params.iso;
        mc.update();   // polygonize the field — without this nothing renders
        mat.emissive.setRGB(ctx.audio.bass*0.4,ctx.audio.mid*0.2,ctx.audio.high*0.5);
        mc.rotation.y+=dt*0.2;
      },
      dispose(){ ctx.scene.remove(mc); mc.geometry?.dispose?.(); mat.dispose(); }
    };
  }
});

// ===========================================================================
// 008 — Chladni 3D Plate (particle grid driven to nodal lines by frequency)
// ===========================================================================
register({
  id:'chladni', name:'Chladni Plate 3D', group:'Cymatics',
  tags:['particles','resonance','grid'],
  controls:[{id:'m',label:'m mode',min:1,max:9,def:4},{id:'n',label:'n mode',min:1,max:9,def:3},{id:'amp',label:'amplitude',min:0.2,max:3,def:1.2}],
  init(ctx){
    const S=160, N=S*S; const pos=new Float32Array(N*3), col=new Float32Array(N*3);
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:0.03,vertexColors:true,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false});
    const pts=new THREE.Points(geo,mat); ctx.scene.add(pts);
    ctx.camera.position.set(0,4,5);
    return {
      update(dt,t){
        const p=ctx.params; const m=p.m+ctx.audio.mid*3, n=p.n+ctx.audio.high*2;
        const amp=p.amp*(0.5+ctx.audio.bass);
        let k=0;
        for(let i=0;i<S;i++)for(let j=0;j<S;j++){
          const x=(i/(S-1)-0.5)*6, z=(j/(S-1)-0.5)*6;
          const u=x/6+0.5, v=z/6+0.5;
          const f=Math.sin(m*Math.PI*u)*Math.sin(n*Math.PI*v)-Math.sin(n*Math.PI*u)*Math.sin(m*Math.PI*v);
          const y=f*amp;
          pos[k]=x; pos[k+1]=y; pos[k+2]=z;
          const cc=pal(0.5+y*0.3,[0.5,0.4,0.5],[0.5,0.5,0.5],[1,1,1],[0.1,0.3,0.6]);
          col[k]=cc.r;col[k+1]=cc.g;col[k+2]=cc.b; k+=3;
        }
        geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
        pts.rotation.y+=dt*0.15; mat.size=0.025+ctx.audio.rms*0.04;
      },
      dispose(){ ctx.scene.remove(pts); geo.dispose(); mat.dispose(); }
    };
  }
});

// ===========================================================================
// 009 — Lorenz Ribbon (the butterfly attractor as a glowing line, audio spin)
// ===========================================================================
register({
  id:'lorenz', name:'Lorenz Butterfly', group:'Strange Attractors',
  tags:['line','chaos','ribbon'],
  controls:[{id:'sigma',label:'σ',min:5,max:20,def:10},{id:'rho',label:'ρ',min:14,max:40,def:28},{id:'beta',label:'β',min:1,max:5,def:2.667}],
  init(ctx){
    const N=40000; const pos=new Float32Array(N*3), col=new Float32Array(N*3);
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.7,blending:THREE.AdditiveBlending});
    const line=new THREE.Line(geo,mat); line.scale.setScalar(0.12); ctx.scene.add(line);
    let lp=[10,28,2.667];
    function rebuild(s,r,b){
      let x=0.1,y=0,z=0; const h=0.005;
      for(let i=0;i<N;i++){
        const dx=s*(y-x),dy=x*(r-z)-y,dz=x*y-b*z;
        x+=dx*h;y+=dy*h;z+=dz*h;
        pos[i*3]=x;pos[i*3+1]=z-25;pos[i*3+2]=y;
        const cc=pal(i/N,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0,0.33,0.67]);
        col[i*3]=cc.r;col[i*3+1]=cc.g;col[i*3+2]=cc.b;
      }
      geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
    }
    rebuild(10,28,2.667); ctx.camera.position.set(0,0,6);
    return {
      update(dt,t){ const p=ctx.params;
        if(p.sigma!==lp[0]||p.rho!==lp[1]||p.beta!==lp[2]){ rebuild(p.sigma,p.rho,p.beta); lp=[p.sigma,p.rho,p.beta]; }
        line.rotation.y+=dt*(0.2+ctx.audio.mid); line.rotation.z=Math.sin(t*0.2)*0.2;
        line.scale.setScalar(0.1+ctx.audio.bass*0.06); mat.opacity=0.5+ctx.audio.rms*0.5;
      },
      dispose(){ ctx.scene.remove(line); geo.dispose(); mat.dispose(); }
    };
  }
});

// ===========================================================================
// 010 — Volumetric Plasma (raymarched noise clouds, audio ignites color)
// ===========================================================================
register({
  id:'plasma', name:'Volumetric Plasma', group:'Volumetrics',
  tags:['raymarch','volume','noise'],
  controls:[{id:'density',label:'density',min:0.2,max:3,def:1.2},{id:'speed',label:'speed',min:0,max:3,def:1}],
  init(ctx){
    const {mesh,uniforms}=raymarchQuad(`
      ${RM} ${GLSL.snoise3}
      uniform float uDensity,uSpeed;
      float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*snoise(p); p*=2.0; a*=0.5; } return v; }
      vec3 render(vec3 ro,vec3 rd){
        vec3 col=vec3(0.0); float t=1.0; float trans=1.0;
        for(int i=0;i<60;i++){
          vec3 p=ro+rd*t;
          float d=fbm(p*0.5+vec3(0.0,uTime*uSpeed*0.2,0.0))*0.5+0.5;
          d*=uDensity*(0.6+uBass);
          float dens=smoothstep(0.5,0.9,d);
          vec3 c=spectral(0.5+d*0.4+uMid*0.3+uTime*0.02)*(0.5+uRms);
          col+=c*dens*trans*0.15;
          trans*=1.0-dens*0.12;
          t+=0.18; if(trans<0.02||t>12.0)break;
        }
        return col;
      }`,{uDensity:{value:1.2},uSpeed:{value:1}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,0,5);
    return {
      update(dt,t){ pushAudio(uniforms,ctx.audio,t);
        uniforms.uRes.value.set(innerWidth,innerHeight);
        uniforms.uCamPos.value.copy(ctx.camera.position);
        uniforms.uCamMat.value.copy(ctx.camera.matrixWorld);
        uniforms.uDensity.value=ctx.params.density; uniforms.uSpeed.value=ctx.params.speed; },
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
    };
  }
});

// ===========================================================================
// 011 — Galaxy Spiral (logarithmic-spiral star disk, audio core flare)
// ===========================================================================
register({
  id:'galaxy', name:'Galaxy Spiral', group:'Cosmology',
  tags:['particles','spiral','stars'],
  controls:[{id:'arms',label:'arms',min:2,max:7,def:4},{id:'twist',label:'twist',min:0.5,max:5,def:2.2},{id:'react',label:'core flare',min:0,max:3,def:1.5}],
  init(ctx){
    const N=120000; const pos=new Float32Array(N*3), col=new Float32Array(N*3), rad=new Float32Array(N);
    const geo=new THREE.BufferGeometry();
    function build(arms,twist){
      for(let i=0;i<N;i++){
        const r=Math.pow(Math.random(),0.5)*5;
        const arm=Math.floor(Math.random()*arms);
        const ang=r*twist+arm*(6.28/arms)+(Math.random()-0.5)*0.5/(r*0.3+0.2);
        const x=Math.cos(ang)*r+(Math.random()-0.5)*0.3;
        const z=Math.sin(ang)*r+(Math.random()-0.5)*0.3;
        const y=(Math.random()-0.5)*Math.exp(-r*0.4)*1.5;
        pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z; rad[i]=r;
        const cc=pal(1-r/5,[0.6,0.5,0.4],[0.4,0.4,0.5],[1,1,1],[0.05,0.2,0.5]);
        col[i*3]=cc.r;col[i*3+1]=cc.g;col[i*3+2]=cc.b;
      }
      geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
    }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    build(4,2.2);
    const mat=new THREE.PointsMaterial({size:0.025,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.85});
    const pts=new THREE.Points(geo,mat); ctx.scene.add(pts);
    let la=4,lt=2.2; ctx.camera.position.set(0,4,8);
    return {
      update(dt,t){ const p=ctx.params;
        if(p.arms!==la||p.twist!==lt){ build(p.arms|0,p.twist); la=p.arms|0; lt=p.twist; }
        pts.rotation.y+=dt*(0.1+ctx.audio.mid*0.3);
        mat.size=0.02+ctx.audio.high*0.03;
        // core flare: scale near-center brightness via opacity pulse
        mat.opacity=0.7+ctx.audio.bass*p.react*0.3;
      },
      dispose(){ ctx.scene.remove(pts); geo.dispose(); mat.dispose(); }
    };
  }
});

// ===========================================================================
// 012 — Audio Terrain (waveform/spectrum sculpted into a flowing 3D landscape)
// ===========================================================================
register({
  id:'terrain', name:'Spectral Terrain', group:'Spectral',
  tags:['mesh','displacement','spectrum'],
  controls:[{id:'height',label:'height',min:0.5,max:5,def:2},{id:'flow',label:'flow',min:0,max:3,def:1}],
  init(ctx){
    const SEG=128; const geo=new THREE.PlaneGeometry(12,12,SEG,SEG);
    geo.rotateX(-Math.PI/2);
    const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.6,metalness:0.2,side:THREE.DoubleSide,flatShading:false});
    const colArr=new Float32Array((SEG+1)*(SEG+1)*3);
    geo.setAttribute('color',new THREE.BufferAttribute(colArr,3));
    const mesh=new THREE.Mesh(geo,mat); ctx.scene.add(mesh);
    ctx.scene.add(new THREE.AmbientLight(0x335577,0.7));
    const dl=new THREE.DirectionalLight(0xffffff,1.6); dl.position.set(2,5,3); ctx.scene.add(dl);
    ctx.camera.position.set(0,5,9);
    const pa=geo.attributes.position;
    let rows=[]; for(let i=0;i<SEG+1;i++) rows.push(new Float32Array(SEG+1));
    return {
      update(dt,t){ const p=ctx.params; const spec=ctx.audio.spectrum;
        // scroll terrain toward camera, inject new row from spectrum at the back
        for(let i=SEG;i>0;i--) rows[i].set(rows[i-1]);
        for(let j=0;j<SEG+1;j++){ const bin=(j/(SEG))*120|0; rows[0][j]=spec[bin]*p.height; }
        let k=0;
        for(let i=0;i<SEG+1;i++)for(let j=0;j<SEG+1;j++){
          const h=rows[i][j];
          pa.setY((i*(SEG+1)+j), h);
          const cc=pal(0.5+h*0.3,[0.4,0.45,0.6],[0.5,0.5,0.5],[1,1,1],[0.1,0.3,0.6]);
          colArr[k]=cc.r;colArr[k+1]=cc.g;colArr[k+2]=cc.b; k+=3;
        }
        pa.needsUpdate=true; geo.attributes.color.needsUpdate=true; geo.computeVertexNormals();
        mesh.rotation.y=Math.sin(t*0.05*p.flow)*0.2;
      },
      dispose(){ ctx.scene.remove(mesh); geo.dispose(); mat.dispose(); }
    };
  }
});
