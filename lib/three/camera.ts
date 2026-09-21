import {Box3,MathUtils,PerspectiveCamera,Vector3} from 'three';
export type CameraView='reset'|'fit'|'side'|'front'|'top';
/** Conservative full-model envelope, including sensor. Fit adapts to viewport aspect. */
export const MODEL_BOUNDS=new Box3(new Vector3(-30,-2.6,-90),new Vector3(325,81,165));
export const VESSEL_BOUNDS=new Box3(new Vector3(-15,-2.6,-34),new Vector3(310,81,34));
export function fitCamera(camera:PerspectiveCamera,view:CameraView,currentTarget:Vector3,bounds:Box3=MODEL_BOUNDS){
 const center=bounds.getCenter(new Vector3());
 const directions={reset:new Vector3(.65,.48,1),side:new Vector3(0,.06,1),front:new Vector3(1,.03,0),top:new Vector3(0,1,.0001)};
 const direction=(view==='fit'?camera.position.clone().sub(currentTarget):directions[view]).normalize();
 const right=new Vector3().crossVectors(new Vector3(0,1,0),direction).normalize();
 const up=new Vector3().crossVectors(direction,right).normalize();
 const v=MathUtils.degToRad(camera.fov/2),h=Math.atan(Math.tan(v)*camera.aspect);let distance=0;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new Vector3(x,y,z).sub(center);distance=Math.max(distance,p.dot(direction)+Math.max(Math.abs(p.dot(right))/Math.tan(h),Math.abs(p.dot(up))/Math.tan(v)))}
 camera.position.copy(center).addScaledVector(direction,distance*1.17);camera.near=.5;camera.far=3000;camera.updateProjectionMatrix();camera.lookAt(center);return center;
}
