// Sculpted low-poly foliage for Alborada's storybook world.
// Scalloped, toothed silhouette, not the repeated round blobs or cone evergreens.
import * as T from 'three';

export function createFoliageGeometry(){
  const positions=[];
  const n=14;
  const rim=[];
  for(let i=0;i<n;i++){
    const a=2*Math.PI*i/n;
    const serration=i%2===0?1.06:.81;
    const lean=Math.sin(i*13.37)*.07;
    const radius=serration*(1+lean);
    rim.push([Math.cos(a)*radius,.04+(i%3-1)*.16,Math.sin(a)*radius*.88]);
  }
  const root=[0,-.71,0],tip=[.05,.79,-.05],upper=[0,.37,0];
  const tri=(a,b,c)=>positions.push(...a,...b,...c);
  for(let i=0;i<n;i++){
    const a=rim[i],b=rim[(i+1)%n];
    // Faceted upper leaf lobe changes outline from all camera angles.
    const mid=[(a[0]+b[0])*.38,.46+((i*7)%4)*.055,(a[2]+b[2])*.38];
    tri(a,b,mid);tri(a,mid,tip);tri(mid,b,tip);
    tri(root,b,a);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.computeVertexNormals();g.computeBoundingSphere();g.computeBoundingBox();
  g.userData.kind='alborada-3d-foliage';
  return g;
}

export function createFlowerGeometry(){
  // Five little angular petals point out of a faceted core.
  const p=[];
  const tri=(a,b,c)=>p.push(...a,...b,...c);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    const x=Math.cos(a),z=Math.sin(a);
    const center=[0,.06,0],point=[x*.62,.17+(i%2)*.08,z*.62],left=[x*.33-z*.20,0,z*.33+x*.20],right=[x*.33+z*.20,0,z*.33-x*.20];
    tri(center,left,point);tri(center,point,right);
    tri([0,-.08,0],point,left);tri([0,-.08,0],right,point);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;
}
