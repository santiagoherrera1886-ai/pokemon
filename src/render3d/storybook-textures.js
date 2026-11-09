// ALBORADA · visual language: handmade pixel-diorama material library.
// Procedural, project-owned textures. No commercial / downloaded assets.
// Every material repeats within the existing gameplay tile. No map changes.
import * as T from 'three';
const rnd=(x,y,s=0)=>{const f=Math.sin(x*127.1+y*311.7+s*79.9)*43758.5453;return f-Math.floor(f)};

function makeTile(g,n,type){
  const ctx=g;ctx.clearRect(0,0,n,n);
  const fill=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
  const line=(color,x,y,w,h)=>fill(color,x,y,w,h);
  const rect=(color,x,y,w,h,stroke)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,w-2,h-2)};
  if(type==='grass'){
    fill('#a1bea1',0,0,n,n);
    for(let i=0;i<310;i++){
      const x=Math.floor(rnd(i,2)*n),y=Math.floor(rnd(i,7)*n),t=rnd(i,11);
      fill(t<.39?'#8cae91':t<.68?'#b2cca3':t<.91?'#a7bb9c':'#c6d8b0',x,y,2+(i%3)*2,2+(i%2)*2);
    }
    for(let i=0;i<17;i++){
      let x=Math.floor(rnd(i,22)*n),y=Math.floor(rnd(i,36)*n);
      line('#738f81',x,y,2,5);line('#759c7c',x+4,y-2,2,5);line('#d3dcb2',x,y-3,4,2);
    }
  }
  if(type==='road'){
    fill('#a5a2ae',0,0,n,n);
    // Offset stone paving: visually evident streets, no original grey plane.
    for(let row=0;row<4;row++){
      const y=row*n/4,offset=row%2?-(n/6):0;
      for(let col=-1;col<5;col++){
        const x=col*n/3+offset;
        rect(['#9997a9','#a8a4b4','#b5acb8','#958fa3'][(row*3+col+24)%4],x+1,y+1,n/3-2,n/4-2,'#746d8d');
        line('#d0c7c1',x+4,y+3,n/3-9,2);
      }
    }
    for(let i=0;i<45;i++){
      const x=rnd(i,1)*n,y=rnd(i,2)*n;
      fill(i%3?'#857e9b':'#c3b3b6',x,y,2,2);
    }
  }
  if(type==='sidewalk'){
    fill('#d8c9b5',0,0,n,n);
    rect('#e7ddca',2,2,n-4,n-4,'#c3b3aa');
    for(let i=0;i<4;i++){
      line('#a795ac',i*n/4,0,2,n);
      line('#b3a4a3',0,i*n/4,n,2);
    }
    for(let i=0;i<8;i++){
      const x=9+i%4*29,y=9+Math.floor(i/4)*58;
      line(i%3?'#d1b7aa':'#d4c2d7',x,y,8,3);
    }
    // Original decorative floral tiles in each sidewalk square.
    for(const [x,y] of [[n*.5,n*.5],[n*.1,n*.1],[n*.90,n*.90]]){
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);
      fill('#bba3bd',-4,-4,8,8);fill('#fff2df',-2,-2,4,4);ctx.restore();
    }
  }
  if(type==='path'){
    fill('#c9baa5',0,0,n,n);
    for(let i=0;i<64;i++){
      const x=rnd(i,3)*n,y=rnd(i,6)*n,d=3+Math.floor(rnd(i,8)*7);
      fill(i%3?'#dbcfb4':'#a99a97',x,y,d,2);
    }
    line('#aa9e95',0,n/2-2,n,2);
    for(let i=0;i<6;i++){
      const x=i*n/6+10,y=i%2?20:95;
      fill('#f0e1c4',x,y,5,3);
    }
  }
  if(type==='tile'){
    fill('#dbd0c3',0,0,n,n);
    for(let y=0;y<4;y++)for(let x=0;x<4;x++){
      rect((x+y)%2?'#e8dfd5':'#d8d1d9',x*n/4+1,y*n/4+1,n/4-2,n/4-2,'#bcafb5');
      const cx=x*n/4+n/8,cy=y*n/4+n/8;
      if((x+y)%3===0){
        fill('#b2a1bc',cx-5,cy-5,10,10);fill('#f8eee4',cx-3,cy-3,6,6);
      }
    }
  }
  if(type==='stone'){
    fill('#9b9aaa',0,0,n,n);
    for(let i=0;i<68;i++){
      const x=Math.floor(rnd(i,2)*n),y=Math.floor(rnd(i,4)*n);
      fill(i%2?'#87869b':'#ada6b3',x,y,8,3);
    }
    for(let i=0;i<11;i++){
      const x=rnd(i,8)*n,y=rnd(i,9)*n;
      line('#74798f',x,y,14,2);line('#c8bfbe',x+2,y+3,7,2);
    }
  }
}
export function makeStorybookTextures(resources){
  const textures={};
  for(const type of ['grass','road','sidewalk','path','tile','stone']){
    const t=resources.texture((g,n)=>makeTile(g,n,type),128);
    t.magFilter=T.NearestFilter;t.minFilter=T.LinearMipmapLinearFilter;
    t.wrapS=t.wrapT=T.ClampToEdgeWrapping;
    textures[type]=t;
  }
  return textures;
}
