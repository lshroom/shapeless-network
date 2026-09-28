// HOLOGRAM 5555 — Batch 05: engines 049-060. Art / chemistry / nature / sky.
import { THREE, register, GLSL, audioUniforms, pushAudio, raymarchQuad, pal } from '/h5555/core.js';
const RM = `${GLSL.palette}`;
function rmUpdate(uniforms, ctx, extra){ return (dt,t)=>{ pushAudio(uniforms,ctx.audio,t);
  uniforms.uRes.value.set(innerWidth,innerHeight); uniforms.uCamPos.value.copy(ctx.camera.position);
  uniforms.uCamMat.value.copy(ctx.camera.matrixWorld); if(extra) extra(uniforms,ctx,dt,t); }; }

// 049 — Klimt Gold (ornamental gold-leaf swirls, raymarched relief)
register({ id:'klimt', name:'Klimt Gold Leaf', group:'Fine Art', tags:['raymarch','ornament','gold'],
  controls:[{id:'swirl',label:'swirl',min:1,max:8,def:4},{id:'relief',label:'relief',min:0.05,max:0.4,def:0.15}],
  init(ctx){ const {mesh,uniforms}=raymarchQuad(`${RM}
    uniform float uSwirl,uRelief;
    float pat(vec2 p){ float a=atan(p.y,p.x), r=length(p);
      float spiral=sin(a*uSwirl + r*4.0 - uTime*0.5);
      float rings=sin(r*8.0); return spiral*0.6+rings*0.4; }
    float de(vec3 p){ float plane=p.z+1.0; float g=pat(p.xy);
      return plane - smoothstep(0.0,1.0,abs(g))*uRelief*(1.0+uBass); }
    vec3 render(vec3 ro,vec3 rd){ float t=0.0;
      for(int i=0;i<80;i++){ vec3 p=ro+rd*t; float d=de(p);
        if(d<0.002){ vec2 e=vec2(0.005,0.0);
          vec3 nr=normalize(vec3(de(p+e.xyy)-de(p-e.xyy),de(p+e.yxy)-de(p-e.yxy),de(p+e.yyx)-de(p-e.yyx)));
          float diff=max(dot(nr,normalize(vec3(0.4,0.5,1.0))),0.0);
          float spec=pow(max(dot(reflect(-normalize(vec3(0.4,0.5,1.0)),nr),-rd),0.0),20.0);
          vec3 gold=vec3(1.0,0.78,0.3); float g=pat(p.xy);
          vec3 col=gold*(0.3+0.6*diff)+spec*1.2 + spectral(0.13+uMid*0.1)*abs(g)*0.2; return col; }
        t+=max(d*0.7,0.01); if(t>14.0)break; } return vec3(0.05,0.04,0.02); }`,{uSwirl:{value:4},uRelief:{value:0.15}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,0,4);
    return { update:rmUpdate(uniforms,ctx,(u,c)=>{u.uSwirl.value=c.params.swirl;u.uRelief.value=c.params.relief;}),
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); } }; } });

// 050 — Rothko (soft breathing color-field rectangles, raymarched)
register({ id:'rothko', name:'Rothko Color Field', group:'Fine Art', tags:['raymarch','color','soft'],
  controls:[{id:'soft',label:'edge softness',min:0.05,max:0.6,def:0.25},{id:'breathe',label:'breathe',min:0,max:3,def:1}],
  init(ctx){ const {mesh,uniforms}=raymarchQuad(`${RM}
    uniform float uSoft,uBreathe;
    float rect(vec2 p,vec2 c,vec2 s,float soft){ vec2 d=abs(p-c)-s; return smoothstep(soft,-soft,max(d.x,d.y)); }
    vec3 render(vec3 ro,vec3 rd){
      float t=(-2.5-ro.z)/(rd.z-0.0001); vec3 p=ro+rd*t; vec2 uv=p.xy*0.35;
      float br=uBreathe*0.1*sin(uTime*0.8);
      vec3 bg=spectral(0.02+uMid*0.05);
      vec3 c1=spectral(0.05+uBass*0.1), c2=spectral(0.55+uHigh*0.1);
      float r1=rect(uv,vec2(0.0,0.6),vec2(1.4,0.7+br),uSoft);
      float r2=rect(uv,vec2(0.0,-0.7),vec2(1.4,0.55+br),uSoft);
      vec3 col=bg; col=mix(col,c1,r1*0.85); col=mix(col,c2,r2*0.85);
      return col*(0.7+uRms*0.3); }`,{uSoft:{value:0.25},uBreathe:{value:1}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,0,3);
    return { update:rmUpdate(uniforms,ctx,(u,c)=>{u.uSoft.value=c.params.soft;u.uBreathe.value=c.params.breathe;}),
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); } }; } });

// 051 — Kandinsky (floating geometric primitives composition)
register({ id:'kandinsky', name:'Kandinsky Composition', group:'Fine Art', tags:['mesh','geometric','abstract'],
  controls:[{id:'count',label:'shapes',min:6,max:40,def:22},{id:'motion',label:'motion',min:0,max:3,def:1}],
  init(ctx){ const group=new THREE.Group(); ctx.scene.add(group);
    ctx.scene.add(new THREE.AmbientLight(0xffffff,0.9));
    const dl=new THREE.DirectionalLight(0xffffff,0.8); dl.position.set(2,3,4); ctx.scene.add(dl);
    ctx.camera.position.set(0,0,10); const COLORS=[0xff3b30,0xffcc00,0x0a84ff,0x34c759,0xff2d55,0xf5f5f5,0x111111];
    let shapes=[]; let lastN=-1;
    function rnd(){ return Math.random()*7|0; }
    function build(N){ shapes.forEach(s=>{ group.remove(s); s.geometry.dispose(); s.material.dispose(); }); shapes=[];
      for(let i=0;i<N;i++){ let g; const k=rnd();
        if(k===0) g=new THREE.CircleGeometry(0.3+Math.random()*0.6,32);
        else if(k===1) g=new THREE.RingGeometry(0.2,0.4+Math.random()*0.4,32);
        else if(k===2){ g=new THREE.ConeGeometry(0.4,0.8,3); }
        else if(k===3) g=new THREE.BoxGeometry(0.15,1.5*Math.random()+0.3,0.15);
        else g=new THREE.CircleGeometry(0.15+Math.random()*0.3,32);
        const m=new THREE.MeshStandardMaterial({color:COLORS[(Math.random()*COLORS.length)|0],roughness:0.6,side:THREE.DoubleSide});
        const s=new THREE.Mesh(g,m); s.position.set((Math.random()-0.5)*8,(Math.random()-0.5)*7,(Math.random()-0.5)*4);
        s.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
        s.userData={ph:Math.random()*6.28,sp:0.3+Math.random()}; group.add(s); shapes.push(s); }
    }
    build(22);
    return { update(dt,t){ const N=ctx.params.count|0; if(N!==lastN){ build(N); lastN=N; } const mo=ctx.params.motion;
        shapes.forEach(s=>{ s.rotation.z+=dt*s.userData.sp*mo; s.position.y+=Math.sin(t+s.userData.ph)*0.005*mo;
          s.scale.setScalar(1+ctx.audio.bass*0.3*Math.sin(s.userData.ph*2)); });
        group.rotation.y+=dt*0.05*mo;
      }, dispose(){ shapes.forEach(s=>{ s.geometry.dispose(); s.material.dispose(); }); ctx.scene.remove(group); } }; } });

// 052 — BZ Reaction (hodgepodge cellular automaton → reliable rotating spiral waves)
register({ id:'bzreaction', name:'BZ Chemical Spirals', group:'Chemistry', tags:['mesh','excitable','spiral'],
  controls:[{id:'g',label:'infection',min:5,max:50,def:22},{id:'height',label:'relief',min:0.2,max:3,def:1}],
  init(ctx){ const W=160; const NMAX=100; let cell=new Int32Array(W*W), nxt=new Int32Array(W*W);
    for(let i=0;i<W*W;i++) cell[i]=(Math.random()*NMAX)|0; // random seed → spirals self-organize
    const geo=new THREE.PlaneGeometry(8,8,W-1,W-1); geo.rotateX(-Math.PI/2);
    const colArr=new Float32Array(W*W*3); geo.setAttribute('color',new THREE.BufferAttribute(colArr,3));
    const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.5,metalness:0.2,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geo,mat); ctx.scene.add(mesh);
    ctx.scene.add(new THREE.AmbientLight(0x335577,0.7)); const dl=new THREE.DirectionalLight(0xffffff,1.5); dl.position.set(3,5,2); ctx.scene.add(dl);
    ctx.camera.position.set(0,6,7); const pa=geo.attributes.position; const k1=2,k2=3;
    function stepCA(g){
      for(let y=0;y<W;y++)for(let x=0;x<W;x++){ const i=y*W+x; const s=cell[i];
        let A=0,B=0,S=0; // infected count, ill count, sum
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ const xx=(x+dx+W)%W, yy=(y+dy+W)%W; const ns=cell[yy*W+xx];
          if(ns>0&&ns<NMAX)A++; else if(ns>=NMAX)B++; S+=ns; }
        if(s===0) nxt[i]=((A/k1)|0)+((B/k2)|0);
        else if(s<NMAX) nxt[i]=Math.min(NMAX,((S/(A+1))|0)+g);
        else nxt[i]=0;
      }
      const tmp=cell; cell=nxt; nxt=tmp;
    }
    return { update(dt,t){ const g=(ctx.params.g+ctx.audio.bass*15)|0; stepCA(g);
        const h=ctx.params.height; let c=0;
        for(let i=0;i<W*W;i++){ const val=cell[i]/NMAX; pa.setY(i, val*h*0.5);
          const cc=pal(0.45+val*0.45+ctx.audio.high*0.15,[0.4,0.45,0.5],[0.5,0.5,0.5],[1,1,1],[0.1,0.4,0.6]);
          colArr[c]=cc.r;colArr[c+1]=cc.g;colArr[c+2]=cc.b; c+=3; }
        pa.needsUpdate=true; geo.attributes.color.needsUpdate=true; geo.computeVertexNormals(); mesh.rotation.y+=dt*0.08;
      }, dispose(){ ctx.scene.remove(mesh); geo.dispose(); mat.dispose(); } }; } });

// 053 — Peacock Iridescence (thin-film eyespot field, view-dependent color)
register({ id:'peacock', name:'Peacock Iridescence', group:'Bio Optics', tags:['raymarch','iridescent','feather'],
  controls:[{id:'eyes',label:'eyespots',min:2,max:8,def:4},{id:'shift',label:'color shift',min:0.5,max:3,def:1.5}],
  init(ctx){ const {mesh,uniforms}=raymarchQuad(`${RM}
    uniform float uEyes,uShift;
    vec3 render(vec3 ro,vec3 rd){
      float t=(-2.0-ro.z)/(rd.z-0.0001); vec3 p=ro+rd*t; vec2 uv=p.xy;
      vec2 cell=fract(uv*uEyes)-0.5; vec2 id=floor(uv*uEyes);
      float r=length(cell);
      float eye=smoothstep(0.45,0.0,r);
      // thin-film interference: color cycles with radius + view angle
      float interf=r*8.0 + dot(rd,vec3(0.0,0.0,1.0))*uShift*3.0 + uTime*0.2 + uMid*2.0;
      vec3 irid=spectral(fract(interf));
      vec3 col=mix(vec3(0.02,0.05,0.04), irid*(0.6+uBass), eye);
      col+=smoothstep(0.12,0.0,r)*vec3(0.1,0.15,0.05); // dark eye center
      return col*(0.7+uRms*0.3); }`,{uEyes:{value:4},uShift:{value:1.5}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,0,4);
    return { update:rmUpdate(uniforms,ctx,(u,c)=>{u.uEyes.value=c.params.eyes;u.uShift.value=c.params.shift;}),
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); } }; } });

// 054 — Mycelium (flat spreading fungal network, space colonization on a disk)
register({ id:'mycelium', name:'Mycelium Network', group:'Nature Growth', tags:['line','network','growth'],
  controls:[{id:'rate',label:'spread',min:1,max:12,def:5},{id:'spin',label:'spin',min:0,max:2,def:0.2}],
  init(ctx){ const MAX=18000; const pos=new Float32Array(MAX*3), col=new Float32Array(MAX*3);
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.7,blending:THREE.AdditiveBlending});
    const seg=new THREE.LineSegments(geo,mat); ctx.scene.add(seg); ctx.camera.position.set(0,5,6);
    let attractors=[]; for(let i=0;i<1200;i++){ const a=Math.random()*6.28,r=Math.sqrt(Math.random())*4.5; attractors.push(new THREE.Vector3(Math.cos(a)*r,(Math.random()-0.5)*0.6,Math.sin(a)*r)); }
    let nodes=[new THREE.Vector3(0,0,0)]; let n=0; const DI=0.16,KILL=0.3,INFL=1.2;
    function grow(){ if(!attractors.length||nodes.length>3000)return; const dir=new Map();
      attractors.forEach(at=>{ let best=-1,bd=INFL*INFL; nodes.forEach((nd,ni)=>{ const d=at.distanceToSquared(nd); if(d<bd){bd=d;best=ni;} });
        if(best>=0){ if(!dir.has(best))dir.set(best,new THREE.Vector3()); dir.get(best).add(at.clone().sub(nodes[best]).normalize()); } });
      const added=[]; dir.forEach((d,ni)=>{ d.y*=0.3; d.normalize().multiplyScalar(DI); const nn=nodes[ni].clone().add(d); added.push([nodes[ni],nn]); nodes.push(nn); });
      added.forEach(([a,b])=>{ if(n+2>MAX)return; const cc=pal(0.12+a.length()*0.05,[0.6,0.6,0.55],[0.3,0.3,0.3],[1,1,1],[0.1,0.2,0.3]);
        pos[n*3]=a.x;pos[n*3+1]=a.y;pos[n*3+2]=a.z;col[n*3]=cc.r;col[n*3+1]=cc.g;col[n*3+2]=cc.b;n++;
        pos[n*3]=b.x;pos[n*3+1]=b.y;pos[n*3+2]=b.z;col[n*3]=cc.r;col[n*3+1]=cc.g;col[n*3+2]=cc.b;n++; });
      attractors=attractors.filter(at=>{ let m=Infinity; nodes.forEach(nd=>{ const d=at.distanceToSquared(nd); if(d<m)m=d; }); return m>KILL*KILL; });
      geo.setDrawRange(0,n); geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true; }
    return { update(dt,t){ const r=Math.ceil(ctx.params.rate*(1+ctx.audio.bass)); for(let g=0;g<r;g++)grow();
        seg.rotation.y+=dt*ctx.params.spin; mat.opacity=0.5+ctx.audio.rms*0.4;
      }, dispose(){ ctx.scene.remove(seg); geo.dispose(); mat.dispose(); } }; } });

// 055 — Lava Lamp (raymarched buoyant blobs, lava palette)
register({ id:'lavalamp', name:'Lava Lamp', group:'Fluid Dynamics', tags:['raymarch','blobs','buoyancy'],
  controls:[{id:'blobs',label:'blobs',min:3,max:9,def:6},{id:'speed',label:'rise speed',min:0.2,max:3,def:1}],
  init(ctx){ const {mesh,uniforms}=raymarchQuad(`${RM}
    uniform float uBlobs,uSpeed;
    float smin(float a,float b,float k){ float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0); return mix(b,a,h)-k*h*(1.0-h); }
    float de(vec3 p){ float d=10.0; int n=int(uBlobs);
      for(int i=0;i<9;i++){ if(i>=n)break; float fi=float(i);
        float ph=uTime*uSpeed*0.5+fi*1.7;
        float y=sin(ph)*2.2;                       // bob up and down
        float x=sin(ph*0.6+fi)*0.8, z=cos(ph*0.5+fi)*0.8;
        float r=0.5+0.2*sin(uTime+fi)+uBass*0.2;
        d=smin(d,length(p-vec3(x,y,z))-r,0.5); }
      return d; }
    vec3 render(vec3 ro,vec3 rd){ float t=0.0;
      for(int i=0;i<90;i++){ vec3 p=ro+rd*t; float d=de(p);
        if(d<0.001){ vec2 e=vec2(0.002,0.0);
          vec3 nr=normalize(vec3(de(p+e.xyy)-de(p-e.xyy),de(p+e.yxy)-de(p-e.yxy),de(p+e.yyx)-de(p-e.yyx)));
          float diff=max(dot(nr,normalize(vec3(0.5,0.8,0.6))),0.0);
          float fres=pow(1.0-max(dot(nr,-rd),0.0),2.0);
          vec3 lava=mix(vec3(0.9,0.1,0.02),vec3(1.0,0.7,0.1),diff);
          return lava*(0.4+0.6*diff)+fres*vec3(1.0,0.5,0.2)*0.5; }
        t+=d; if(t>14.0)break; } return vec3(0.04,0.01,0.02); }`,{uBlobs:{value:6},uSpeed:{value:1}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,0,7);
    return { update:rmUpdate(uniforms,ctx,(u,c)=>{u.uBlobs.value=c.params.blobs;u.uSpeed.value=c.params.speed;}),
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); } }; } });

// 056 — Sandpile (abelian sandpile avalanche fractal as 3D height/color)
register({ id:'sandpile', name:'Abelian Sandpile', group:'Math', tags:['mesh','fractal','cellular'],
  controls:[{id:'drop',label:'drop rate',min:50,max:2000,def:300},{id:'height',label:'relief',min:0.02,max:0.6,def:0.1}],
  init(ctx){ const W=129; const C=Math.floor(W/2); const grid=new Int32Array(W*W);
    const geo=new THREE.PlaneGeometry(8,8,W-1,W-1); geo.rotateX(-Math.PI/2);
    const colArr=new Float32Array(W*W*3); geo.setAttribute('color',new THREE.BufferAttribute(colArr,3));
    const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.6,metalness:0.2,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geo,mat); ctx.scene.add(mesh);
    ctx.scene.add(new THREE.AmbientLight(0x335577,0.8)); const dl=new THREE.DirectionalLight(0xffffff,1.4); dl.position.set(2,5,3); ctx.scene.add(dl);
    ctx.camera.position.set(0,9,0.5); const pa=geo.attributes.position;
    const COL=[[0.1,0.1,0.2],[0.2,0.4,0.7],[0.6,0.7,0.3],[1.0,0.7,0.2]];
    function topple(){ let stable=false; let iter=0;
      while(!stable && iter<8){ stable=true; iter++;
        for(let y=1;y<W-1;y++)for(let x=1;x<W-1;x++){ const i=y*W+x; if(grid[i]>=4){ const q=(grid[i]/4)|0; grid[i]-=q*4;
          grid[i-1]+=q;grid[i+1]+=q;grid[i-W]+=q;grid[i+W]+=q; stable=false; } } } }
    return { update(dt,t){ const drop=Math.floor(ctx.params.drop*(1+ctx.audio.bass));
        grid[C*W+C]+=drop; topple();
        const h=ctx.params.height; let c=0;
        for(let i=0;i<W*W;i++){ const g=Math.min(3,grid[i]); pa.setY(i,g*h*0.4);
          const cc=COL[g]; colArr[c]=cc[0]+ctx.audio.high*0.2;colArr[c+1]=cc[1];colArr[c+2]=cc[2]; c+=3; }
        pa.needsUpdate=true; geo.attributes.color.needsUpdate=true; geo.computeVertexNormals(); mesh.rotation.y+=dt*0.08;
      }, dispose(){ ctx.scene.remove(mesh); geo.dispose(); mat.dispose(); } }; } });

// 057 — Spiderweb (radial + spiral web resonating to audio)
register({ id:'spiderweb', name:'Resonant Spiderweb', group:'Nature Growth', tags:['line','web','resonance'],
  controls:[{id:'spokes',label:'spokes',min:6,max:24,def:14},{id:'rings',label:'rings',min:4,max:16,def:9}],
  init(ctx){ const geo=new THREE.BufferGeometry(); let pos,col; const mat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.8,blending:THREE.AdditiveBlending});
    const seg=new THREE.LineSegments(geo,mat); ctx.scene.add(seg); ctx.camera.position.set(0,0,6);
    let S=-1,R=-1; let edges=[];
    function build(spokes,rings){ edges=[]; // build node grid [ring][spoke]
      for(let r=0;r<rings;r++)for(let s=0;s<spokes;s++){ const s2=(s+1)%spokes;
        edges.push([r,s,r,s2]); // ring thread
        if(r<rings-1) edges.push([r,s,r+1,s]); // radial
      }
      pos=new Float32Array(edges.length*2*3); col=new Float32Array(edges.length*2*3);
      geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    }
    build(14,9);
    return { update(dt,t){ const spokes=ctx.params.spokes|0, rings=ctx.params.rings|0;
        if(spokes!==S||rings!==R){ build(spokes,rings); S=spokes;R=rings; }
        function node(r,s){ const ang=s/spokes*6.28; const rad=(r+1)/rings*3.5;
          const z=Math.sin(t*3+r*0.8)*0.2*ctx.audio.rms*4 + Math.sin(ang*3+t)*0.1*ctx.audio.mid*3;
          return [Math.cos(ang)*rad,Math.sin(ang)*rad,z]; }
        let k=0; edges.forEach(([r1,s1,r2,s2])=>{ const a=node(r1,s1),b=node(r2,s2);
          pos[k]=a[0];pos[k+1]=a[1];pos[k+2]=a[2]; pos[k+3]=b[0];pos[k+4]=b[1];pos[k+5]=b[2];
          const cc=pal(0.55+ctx.audio.high*0.2,[0.6,0.6,0.7],[0.3,0.3,0.3],[1,1,1],[0.5,0.6,0.7]);
          for(let m=0;m<2;m++){col[k+m*3]=cc.r;col[k+m*3+1]=cc.g;col[k+m*3+2]=cc.b;} k+=6; });
        geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
        seg.rotation.z+=dt*0.05; seg.rotation.x=Math.sin(t*0.2)*0.4;
      }, dispose(){ ctx.scene.remove(seg); geo.dispose(); mat.dispose(); } }; } });

// 058 — Soap Film (catenoid↔helicoid minimal-surface morph)
register({ id:'soapfilm', name:'Soap Film Minimal', group:'Math Surfaces', tags:['mesh','minimal','morph'],
  controls:[{id:'morph',label:'morph',min:0,max:1,def:0.5},{id:'auto',label:'auto morph',min:0,max:2,def:1}],
  init(ctx){ const NU=120,NV=40; const geo=new THREE.PlaneGeometry(1,1,NU-1,NV-1);
    const colArr=new Float32Array(NU*NV*3); geo.setAttribute('color',new THREE.BufferAttribute(colArr,3));
    const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.2,metalness:0.4,side:THREE.DoubleSide,transparent:true,opacity:0.92});
    const mesh=new THREE.Mesh(geo,mat); ctx.scene.add(mesh);
    ctx.scene.add(new THREE.AmbientLight(0x445577,0.7)); const dl=new THREE.DirectionalLight(0xffffff,1.6); dl.position.set(3,4,5); ctx.scene.add(dl);
    const dl2=new THREE.DirectionalLight(0xff66cc,0.7); dl2.position.set(-3,-2,2); ctx.scene.add(dl2);
    ctx.camera.position.set(0,0,5); const pa=geo.attributes.position; const cnt=pa.count;
    return { update(dt,t){ let th=ctx.params.morph*Math.PI/2; if(ctx.params.auto>0) th=(Math.sin(t*0.3*ctx.params.auto)*0.5+0.5)*Math.PI/2;
        const ct=Math.cos(th),st=Math.sin(th); let c=0;
        for(let iy=0;iy<NV;iy++)for(let ix=0;ix<NU;ix++){ const i=iy*NU+ix;
          const u=ix/(NU-1)*Math.PI*2; const vv=(iy/(NV-1)-0.5)*2.5;
          // associated family: catenoid(θ=0) ↔ helicoid(θ=π/2)
          const x=ct*Math.cosh(vv)*Math.cos(u) + st*Math.sinh(vv)*Math.sin(u);
          const y=ct*Math.cosh(vv)*Math.sin(u) - st*Math.sinh(vv)*Math.cos(u);
          const z=u*st + vv*ct - st*Math.PI; // shift to center
          const s=0.6*(1+ctx.audio.bass*0.2); pa.setXYZ(i,x*s,z*s,y*s);
          const cc=pal(0.5+vv*0.15+ctx.audio.high*0.2,[0.4,0.5,0.7],[0.4,0.4,0.4],[1,1,1],[0.5,0.6,0.7]);
          colArr[c]=cc.r;colArr[c+1]=cc.g;colArr[c+2]=cc.b; c+=3; }
        pa.needsUpdate=true; geo.attributes.color.needsUpdate=true; geo.computeVertexNormals(); mesh.rotation.y+=dt*0.2;
      }, dispose(){ ctx.scene.remove(mesh); geo.dispose(); mat.dispose(); } }; } });

// 059 — Crepuscular Rays (volumetric god rays through gaps, raymarched)
register({ id:'godrays', name:'Crepuscular Rays', group:'Sky Phenomena', tags:['raymarch','volume','light'],
  controls:[{id:'density',label:'density',min:0.2,max:3,def:1.2},{id:'sun',label:'sun height',min:-0.3,max:1,def:0.5}],
  init(ctx){ const {mesh,uniforms}=raymarchQuad(`${RM} ${GLSL.snoise3}
    uniform float uDensity,uSun;
    vec3 render(vec3 ro,vec3 rd){
      vec3 sundir=normalize(vec3(0.0,uSun,-1.0)); vec3 col=vec3(0.0); float t=0.5; float light=0.0;
      for(int i=0;i<48;i++){ vec3 p=ro+rd*t;
        // occluder clouds: noise slab above
        float cloud=snoise(p*0.4+vec3(uTime*0.05,0.0,0.0))*0.5+0.5;
        float occ=smoothstep(0.4,0.7,cloud)*smoothstep(3.0,1.0,p.y);
        float shaft=max(dot(rd,sundir),0.0); shaft=pow(shaft,8.0);
        light+=shaft*(1.0-occ)*uDensity*0.03*(0.6+uBass);
        t+=0.3; if(t>16.0)break; }
      vec3 sky=mix(vec3(0.1,0.12,0.2),vec3(0.5,0.6,0.8),clamp(rd.y+0.5,0.0,1.0));
      col=sky + vec3(1.0,0.85,0.5)*light*(0.6+uMid); return col; }`,{uDensity:{value:1.2},uSun:{value:0.5}});
    ctx.scene.add(mesh); ctx.camera.position.set(0,0,0.1);
    return { update:rmUpdate(uniforms,ctx,(u,c)=>{u.uDensity.value=c.params.density;u.uSun.value=c.params.sun;}),
      dispose(){ ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); } }; } });

// 060 — Fibonacci Sphere (golden-angle points on a sphere, audio spikes)
register({ id:'fibsphere', name:'Fibonacci Sphere', group:'Golden Ratio', tags:['points','phi','sphere'],
  controls:[{id:'spike',label:'spike',min:0,max:1.5,def:0.5},{id:'spin',label:'spin',min:0,max:2,def:0.3}],
  init(ctx){ const N=40000; const dir=new Float32Array(N*3); const pos=new Float32Array(N*3), col=new Float32Array(N*3);
    const ga=Math.PI*(3-Math.sqrt(5));
    for(let i=0;i<N;i++){ const y=1-(i/(N-1))*2; const r=Math.sqrt(1-y*y); const th=ga*i;
      dir[i*3]=Math.cos(th)*r; dir[i*3+1]=y; dir[i*3+2]=Math.sin(th)*r; }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:0.03,vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.85});
    const pts=new THREE.Points(geo,mat); ctx.scene.add(pts); ctx.camera.position.set(0,0,5);
    return { update(dt,t){ const spike=ctx.params.spike;
        for(let i=0;i<N;i++){ const dx=dir[i*3],dy=dir[i*3+1],dz=dir[i*3+2];
          const band=Math.abs(Math.sin(dy*6+t*2)); const bin=((i*512/N)|0)%512; const sp=ctx.audio.spectrum[bin];
          const r=2*(1+ spike*(sp+band*0.2*ctx.audio.bass));
          pos[i*3]=dx*r;pos[i*3+1]=dy*r;pos[i*3+2]=dz*r;
          const cc=pal(0.5+sp*0.4+(dy*0.5+0.5)*0.2,[0.5,0.4,0.6],[0.5,0.5,0.5],[1,1,1],[0,0.33,0.67]);
          col[i*3]=cc.r;col[i*3+1]=cc.g;col[i*3+2]=cc.b; }
        geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true;
        pts.rotation.y+=dt*ctx.params.spin; mat.size=0.025+ctx.audio.high*0.03;
      }, dispose(){ ctx.scene.remove(pts); geo.dispose(); mat.dispose(); } }; } });
