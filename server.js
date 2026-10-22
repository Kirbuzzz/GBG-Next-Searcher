const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const PORT=process.env.PORT||3000,ADMIN=process.env.ADMIN_KEY||"";
const DIR=process.env.DATA_DIR||path.join(__dirname,"data"),FILE=path.join(DIR,"levels.json");
fs.mkdirSync(DIR,{recursive:true});
const uid=()=>crypto.randomBytes(6).toString("hex");
let levels;
function save(){fs.writeFileSync(FILE+".tmp",JSON.stringify(levels));fs.renameSync(FILE+".tmp",FILE)}
try{levels=JSON.parse(fs.readFileSync(FILE,"utf8"))}
catch{levels=JSON.parse(fs.readFileSync(path.join(__dirname,"seed.json"),"utf8")).map(v=>({...v,id:uid(),t:0}));save()}
const clean=(s,m)=>String(s||"").replace(/[\u0000-\u001f\u007f<>]/g,"").trim().slice(0,m);
function normId(s){s=String(s||"").toUpperCase().replace(/[^A-Z0-9]/g,"");return /^G\d{3}[A-Z0-9]{6}$/.test(s)?`G ${s.slice(1,4)} ${s.slice(4,7)} ${s.slice(7)}`:null}
const hits=new Map(),MAX=5,WIN=10*60*1000;
function limited(ip){const n=Date.now(),a=(hits.get(ip)||[]).filter(t=>n-t<WIN);if(a.length>=MAX){hits.set(ip,a);return true}a.push(n);hits.set(ip,a);return false}
setInterval(()=>{const n=Date.now();for(const[k,v]of hits)if(!v.some(t=>n-t<WIN))hits.delete(k)},WIN).unref();
const ok=(a,b)=>{a=Buffer.from(a);b=Buffer.from(b);return a.length===b.length&&crypto.timingSafeEqual(a,b)};
const H={"X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'"};
const send=(r,c,o,t="application/json")=>{r.writeHead(c,{...H,"Content-Type":t+"; charset=utf-8","Cache-Control":"no-store"});r.end(typeof o==="string"?o:JSON.stringify(o))};
function body(q){return new Promise((res,rej)=>{let b="";q.on("data",d=>{b+=d;if(b.length>2048){rej();q.destroy()}});q.on("end",()=>res(b));q.on("error",rej)})}
http.createServer(async(q,r)=>{
 const u=q.url.split("?")[0],ip=(q.headers["x-forwarded-for"]||q.socket.remoteAddress||"").split(",")[0].trim();
 try{
  if(u==="/api/levels"&&q.method==="GET")return send(r,200,levels.map(({id,n,c,i,t})=>({id,n,c,i,t})));
  if(u==="/api/levels"&&q.method==="POST"){
   if(limited(ip))return send(r,429,{error:"rate"});
   let j;try{j=JSON.parse(await body(q))}catch{return send(r,400,{error:"bad"})}
   const n=clean(j.n,60),c=clean(j.c,40),i=normId(j.i);
   if(!n||!i)return send(r,400,{error:"bad"});
   if(levels.some(l=>l.i===i))return send(r,409,{error:"dup"});
   if(levels.length>=5000)return send(r,507,{error:"full"});
   levels.unshift({id:uid(),n,c,i,t:Date.now()});save();return send(r,201,{ok:true});
  }
  const m=u.match(/^\/api\/levels\/([a-f0-9]+)$/);
  if(m&&q.method==="DELETE"){
   if(!ADMIN||!ok(String(q.headers["x-admin-key"]||""),ADMIN))return send(r,401,{error:"auth"});
   const k=levels.findIndex(l=>l.id===m[1]);if(k<0)return send(r,404,{error:"none"});
   levels.splice(k,1);save();return send(r,200,{ok:true});
  }
  if((u==="/"||u==="/index.html")&&q.method==="GET")return send(r,200,fs.readFileSync(path.join(__dirname,"public","index.html"),"utf8"),"text/html");
  send(r,404,{error:"404"});
 }catch{send(r,500,{error:"err"})}
}).listen(PORT,()=>console.log("Servidor en puerto "+PORT+(ADMIN?"":" (sin ADMIN_KEY: no se puede borrar)")));
