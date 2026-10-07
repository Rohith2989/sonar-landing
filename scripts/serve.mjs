import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.woff':'font/woff','.woff2':'font/woff2'};
const config=JSON.parse(await readFile('vercel.json','utf8'));
const server=createServer(async(req,res)=>{
  try {
    let urlPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const exact=config.rewrites.find(rule=>rule.source===urlPath);
    if(exact)urlPath=exact.destination;
    else if(/^\/competitor-tracking\/[^/]+$/.test(urlPath))urlPath=`/prerendered${urlPath}.html`;
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
    const file=path.resolve(root,`.${urlPath}`);
    if(!file.startsWith(root+path.sep)||urlPath.split('/').some(part=>part.startsWith('.'))){res.writeHead(403);res.end();return;}
    const info=await stat(file);if(!info.isFile())throw new Error('missing');
    res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:await readFile(file));
  }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
server.listen(Number(process.env.PORT??4173),'127.0.0.1',()=>console.log('Sonar preview: http://127.0.0.1:4173'));
