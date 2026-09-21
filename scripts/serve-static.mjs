import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('out');
const port=Number(process.env.PORT||3000);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.txt':'text/plain; charset=utf-8','.woff2':'font/woff2'};
createServer(async(req,res)=>{
 try{
  let file=resolve(root,'.'+decodeURIComponent(new URL(req.url||'/', 'http://localhost').pathname));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return}
  try{if((await stat(file)).isDirectory())file=resolve(file,'index.html')}catch{if(!extname(file))file=resolve(file,'index.html')}
  const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});try{res.end(await readFile(resolve(root,'404.html')))}catch{res.end('Build first: pnpm build')}}
}).listen(port,'0.0.0.0',()=>console.log(`Static app: http://localhost:${port}`));
