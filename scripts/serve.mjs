import {createReadStream} from 'node:fs';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime','.woff':'font/woff','.woff2':'font/woff2'};
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
    const headers={'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
    if(req.headers.range) {
      const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      let start=range?.[1] ? Number(range[1]) : 0;
      let end=range?.[2] ? Number(range[2]) : info.size-1;
      if(range && !range[1] && range[2]) { start=Math.max(0,info.size-Number(range[2]));end=info.size-1; }
      end=Math.min(end,info.size-1);
      if(!range || start>end || start>=info.size) {res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${info.size}`,'Content-Length':end-start+1});
      if(req.method==='HEAD')res.end();else createReadStream(file,{start,end}).pipe(res);
      return;
    }
    res.writeHead(200,{...headers,'Content-Length':info.size});
    if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);
  }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
server.listen(Number(process.env.PORT??4173),'127.0.0.1',()=>console.log('Sonar preview: http://127.0.0.1:4173'));
