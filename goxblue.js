// GOXBLUE / GADL Pseudo-3D Engine - v0.4
const GoxblueModes = {ORTHO:'ortho',ISOMETRIC:'isometric',OBLIQUE:'oblique',ONE_POINT:'onepoint',TWO_POINT:'twopoint',THREE_POINT:'threepoint',CAMERA:'camera'};

class Vector3 {constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;} clone(){return new Vector3(this.x,this.y,this.z);} add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;} multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}}

class PerspectiveCamera {
  constructor(){this.position=new Vector3(0,15,40); this.rotation=new Vector3(-0.45,0.3,0); this.zoom=1;}
  project(p){
    let x=p.x-this.position.x, y=p.y-this.position.y, z=p.z-this.position.z;
    const cy=Math.cos(this.rotation.y), sy=Math.sin(this.rotation.y);
    const tx=x*cy-z*sy, tz=x*sy+z*cy; x=tx; z=tz;
    const cx=Math.cos(this.rotation.x), sx=Math.sin(this.rotation.x);
    const ty=y*cx-z*sx, tz2=y*sx+z*cx; y=ty; z=tz2;
    if(z<1)z=1;
    const f=900/(z+350)*this.zoom;
    return {x:x*f+innerWidth/2, y:y*f+innerHeight/2-140, scale:f*0.85, depth:z};
  }
}

class Entity {
  constructor(x=0,y=8,z=0,color='#0ff',size=28){this.position=new Vector3(x,y,z); this.velocity=new Vector3(); this.color=color; this.size=size; this.rotation=0;}
  update(d){this.position.add(this.velocity.multiplyScalar(d*55)); this.rotation+=d*2;}
}

class Particle {
  constructor(x,y,z,color){this.position=new Vector3(x,y,z); this.velocity=new Vector3(Math.random()*15-7.5,Math.random()*12-3,Math.random()*15-7.5); this.life=1.8; this.color=color; this.size=Math.random()*16+8;}
  update(d){this.position.add(this.velocity.multiplyScalar(d*65)); this.velocity.y-=22*d; this.life-=d; this.size*=0.96;}
}

class GoxblueEngine {
  constructor(){
    this.canvas=document.getElementById('game')||this.createCanvas();
    this.ctx=this.canvas.getContext('2d');
    this.camera=new PerspectiveCamera();
    this.entities=[]; this.particles=[]; this.mode=GoxblueModes.CAMERA;
    this.keys={}; this.mouse={down:false}; this.lastTime=performance.now();
    this.setup(); this.resize(); this.createScene(); this.loop();
  }
  createCanvas(){const c=document.createElement('canvas');c.id='game';document.body.appendChild(c);return c;}
  resize(){this.canvas.width=innerWidth; this.canvas.height=innerHeight;}
  setup(){
    addEventListener('keydown',e=>this.keys[e.key.toLowerCase()]=true);
    addEventListener('keyup',e=>this.keys[e.key.toLowerCase()]=false);
    this.canvas.addEventListener('mousemove',e=>{if(this.mouse.down){this.camera.rotation.y+=e.movementX*0.004; this.camera.rotation.x=Math.max(-1.5,Math.min(1.5,this.camera.rotation.x+e.movementY*0.004));}});
    this.canvas.addEventListener('mousedown',()=>{this.mouse.down=true});
    this.canvas.addEventListener('mouseup',()=>{this.mouse.down=false});
    addEventListener('keypress',e=>{
      if(e.key>='1'&&e.key<='7') this.mode=Object.values(GoxblueModes)[+e.key-1];
      if(e.key==='f') this.canvas.requestFullscreen();
      if(e.key===' ') this.burst(0,12,0,90,'#ff0');
    });
  }
  createScene(){
    for(let x=-40;x<=40;x+=6)for(let z=-40;z<=40;z+=6){
      this.entities.push(new Entity(x,0,z,'#1a1a2e',20));
    }
    const cl=['#f00','#0f0','#00f','#ff0','#f0f'];
    for(let i=0;i<30;i++){
      const e=new Entity(Math.random()*140-70,12+Math.random()*30,Math.random()*140-70,cl[i%cl.length],32);
      e.velocity.x=(Math.random()-0.5)*3; e.velocity.z=(Math.random()-0.5)*3;
      this.entities.push(e);
    }
  }
  burst(x,y,z,cnt,color){for(let i=0;i<cnt;i++) this.particles.push(new Particle(x,y,z,color));}
  drawCube(proj,e){
    const s=e.size*(proj.scale||1)*0.9, ctx=this.ctx;
    ctx.save(); ctx.translate(proj.x,proj.y); ctx.rotate(e.rotation*0.02);
    const sh=Math.max(0.25,1-proj.depth/220);
    ctx.fillStyle=e.color; ctx.fillRect(-s/2,-s/2,s,s);
    ctx.fillStyle='#ffffff33'; ctx.beginPath(); ctx.moveTo(-s/2,-s/2); ctx.lineTo(-s/2+s*0.35,-s/2-s*0.4); ctx.lineTo(s/2+s*0.35,-s/2-s*0.4); ctx.lineTo(s/2,-s/2); ctx.fill();
    ctx.fillStyle='#00000055'; ctx.beginPath(); ctx.moveTo(s/2,-s/2); ctx.lineTo(s/2+s*0.35,-s/2-s*0.4); ctx.lineTo(s/2+s*0.35,s/2-s*0.4); ctx.lineTo(s/2,s/2); ctx.fill();
    ctx.restore();
  }
  render(){
    this.ctx.fillStyle='#05050f'; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    const sorted=[...this.entities,...this.particles].sort((a,b)=>(b.position?.z||0)-(a.position?.z||0));
    sorted.forEach(o=>{
      const proj = this.mode===GoxblueModes.CAMERA ? this.camera.project(o.position||o) : {x:o.position.x*0.8+o.position.z*0.5+this.canvas.width/2, y:o.position.y*0.5-o.position.z*0.4+this.canvas.height/2-180, scale:1, depth:40};
      if(o instanceof Particle){
        this.ctx.globalAlpha=o.life; this.ctx.fillStyle=o.color; this.ctx.fillRect(proj.x-o.size/2,proj.y-o.size/2,o.size,o.size);
      } else this.drawCube(proj,o);
    });
    this.ctx.globalAlpha=1;
    this.ctx.fillStyle='#0f0'; this.ctx.font='bold 16px monospace';
    this.ctx.fillText(`GADL Pseudo-3D | Mode: ${this.mode.toUpperCase()}`,20,40);
  }
  update(d){
    const sp=60*d;
    if(this.keys['w']) this.camera.position.z-=sp;
    if(this.keys['s']) this.camera.position.z+=sp;
    if(this.keys['a']) this.camera.position.x-=sp;
    if(this.keys['d']) this.camera.position.x+=sp;
    if(this.keys[' ']) this.camera.position.y+=sp*0.8;
    if(this.keys['shift']) this.camera.position.y-=sp*0.8;
    this.entities.forEach(e=>e.update(d));
    this.particles=this.particles.filter(p=>{p.update(d);return p.life>0;});
  }
  loop(){
    requestAnimationFrame(()=>this.loop());
    const now=performance.now(), d=(now-this.lastTime)/1000; this.lastTime=now;
    this.update(d); this.render();
  }
}

new GoxblueEngine();
