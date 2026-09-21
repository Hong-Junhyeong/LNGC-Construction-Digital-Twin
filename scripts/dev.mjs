// The supervised Sites preview forwards Vite flags; normal `pnpm dev` uses Next.js.
const args=process.argv.slice(2);
if(args.includes('--host')){
 process.argv=[process.execPath,process.argv[1],'dev',...args];
 await import('./run-framework.mjs');
}else{
 process.argv=[process.execPath,process.argv[1],'dev',...args];
 await import('../node_modules/next/dist/bin/next');
}
