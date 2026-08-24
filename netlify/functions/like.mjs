import { getStore } from "@netlify/blobs";

const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};

export default async (req, context) => {
  const slug=(context.params.slug||"").replace(/[^a-zA-Z0-9._-]/g,"").slice(0,120);
  if(!slug) return new Response(JSON.stringify({error:"invalid slug"}),{status:400,headers});
  const store=getStore({name:"recipe-likes",consistency:"strong"});
  if(req.method==="GET"){
    const data=await store.get(slug,{type:"json",consistency:"strong"});
    return new Response(JSON.stringify({count:Number(data?.count||0)}),{headers});
  }
  if(req.method!=="POST") return new Response(JSON.stringify({error:"method not allowed"}),{status:405,headers:{...headers,allow:"GET, POST"}});
  for(let i=0;i<6;i++){
    const entry=await store.getWithMetadata(slug,{type:"json",consistency:"strong"});
    if(!entry){
      const result=await store.setJSON(slug,{count:1},{onlyIfNew:true});
      if(result.modified) return new Response(JSON.stringify({count:1}),{headers});
      continue;
    }
    const next=Number(entry.data?.count||0)+1;
    const result=await store.setJSON(slug,{count:next},{onlyIfMatch:entry.etag});
    if(result.modified) return new Response(JSON.stringify({count:next}),{headers});
  }
  return new Response(JSON.stringify({error:"please retry"}),{status:409,headers});
};

export const config={path:"/api/likes/:slug"};