import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {once} from 'node:events';
const child=spawn(process.execPath,['scripts/serve-static.mjs'],{env:{...process.env,PORT:'39005'},stdio:['ignore','pipe','pipe']});
let started=false;
try{
 await Promise.race([once(child.stdout,'data').then(()=>{started=true}),once(child,'exit').then(([code])=>{throw new Error('Static server exited: '+code)}),new Promise((_,reject)=>{const t=setTimeout(()=>reject(new Error('Static server startup timeout')),10000);t.unref()})]);
 assert(started);
 for(const route of ['/','/overview/','/twin/','/production/','/quality/','/simulation/','/insight/']){
  const r=await fetch('http://localhost:39005'+route);assert.equal(r.status,200,route);const html=await r.text();assert(html.includes('LNGC Production Twin'),route);assert(html.includes('<h1'),route);
  const css=html.match(/href="([^\"]+\.css[^\"]*)"/);assert(css,'Stylesheet missing');assert.equal((await fetch('http://localhost:39005'+css[1])).status,200);
 }
 assert.equal((await fetch('http://localhost:39005/no-such-route/')).status,404);
 console.log('PASS: 7 exported routes, stylesheet delivery and 404 handling.');
}finally{child.kill('SIGTERM')}
