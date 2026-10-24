'use strict';

const REPO='personal-gym-recipe/personal-gym-recipe.github.io';
const BRANCH='main';
const DATA_PATH='src/data/site.json';
const KEY='recipeGithubToken';
const MAX_SOURCE_SIZE=20*1024*1024;
const MAX_EDGE=1600;
const JPEG_QUALITY=.88;
const $=selector=>document.querySelector(selector);

let token=sessionStorage.getItem(KEY)||'';
let siteData=null;
let images=[];
let localPreview=false;

const enc=path=>path.split('/').map(encodeURIComponent).join('/');
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const decode64=value=>new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\n/g,'')),char=>char.charCodeAt(0)));
const bytesLabel=bytes=>bytes>=1024*1024?`${(bytes/1024/1024).toFixed(1)}MB`:`${Math.max(1,Math.round(bytes/1024))}KB`;
const rawUrl=src=>`https://raw.githubusercontent.com/${REPO}/${BRANCH}/src${src}?v=${Date.now()}`;

function message(element,text,error=false){element.textContent=text;element.classList.toggle('error',error)}
function setSaving(active,label){for(const button of [$('#saveButton'),$('#mobileSaveButton')]){button.disabled=active||localPreview;button.textContent=label}$('#reloadButton').disabled=active}

async function api(path,options={}){
  const response=await fetch(`https://api.github.com/repos/${REPO}${path}`,{
    ...options,
    headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28',...(options.headers||{})}
  });
  if(!response.ok){
    let detail='';
    try{detail=(await response.json()).message}catch{}
    const friendly=response.status===401?'キーが正しくないか、有効期限が切れています。':response.status===403?'このキーに必要な権限がありません。ContentsをRead and writeにしてください。':response.status===404?'対象リポジトリまたはファイルが見つかりません。キーの対象を確認してください。':detail||`GitHubエラー (${response.status})`;
    throw new Error(friendly);
  }
  return response.status===204?null:response.json();
}

async function connect(){
  token=$('#tokenInput').value.trim();
  if(!token)return message($('#loginMessage'),'キーを入力してください。',true);
  const button=$('#loginButton');button.disabled=true;button.textContent='確認中…';
  try{
    const repo=await api('');
    if(!repo.permissions?.push)throw new Error('このキーにはリポジトリへの書き込み権限がありません。');
    sessionStorage.setItem(KEY,token);
    showManager(`${repo.full_name} に接続中`);
    await loadGallery();
  }catch(error){token='';sessionStorage.removeItem(KEY);message($('#loginMessage'),error.message,true)}
  finally{button.disabled=false;button.textContent='接続する'}
}

function showManager(label){
  $('#loginView').hidden=true;$('#managerView').hidden=false;$('#logoutButton').hidden=localPreview;
  $('#connectionLabel').textContent=label;
}

function logout(){sessionStorage.removeItem(KEY);token='';location.reload()}

function normaliseGallery(data){
  if(!Array.isArray(data?.images)||data.images.length!==6)throw new Error('ギャラリー設定が6件ではありません。site.jsonを確認してください。');
  return data.images.map(item=>({src:String(item.src||''),alt:String(item.alt||''),width:Number(item.width)||1,height:Number(item.height)||1,_preview:'',_pending:null}));
}

async function loadGallery(){
  message($('#managerMessage'),'最新のギャラリーを読み込んでいます。');
  try{
    const file=await api(`/contents/${enc(DATA_PATH)}?ref=${encodeURIComponent(BRANCH)}`);
    siteData=JSON.parse(decode64(file.content));
    images=normaliseGallery(siteData.gallery);
    renderGallery();
    message($('#managerMessage'),'最新の6枚を読み込みました。');
  }catch(error){message($('#managerMessage'),error.message,true)}
}

async function loadLocalPreview(){
  localPreview=true;
  showManager('ローカル確認中');
  const response=await fetch('/admin/gallery-data.json',{cache:'no-store'});
  if(!response.ok)throw new Error('ローカル用ギャラリーデータを読み込めませんでした。');
  siteData={gallery:await response.json()};
  images=normaliseGallery(siteData.gallery);
  renderGallery();
  setSaving(false,'ローカル確認では保存できません');
  message($('#managerMessage'),'ローカル確認用です。写真選択と並べ替えは試せますが、GitHubには保存されません。');
}

function previewSource(image){return image._preview||(localPreview?image.src:rawUrl(image.src))}

function renderGallery(){
  $('#galleryList').innerHTML=images.map((image,index)=>`<article class="gallery-card" data-index="${index}">
    <div class="gallery-card-preview"><img src="${escapeHtml(previewSource(image))}" alt=""><span class="gallery-number">${String(index+1).padStart(2,'0')} / 06</span></div>
    <div class="gallery-card-fields">
      <h2>${String(index+1).padStart(2,'0')}枚目</h2>
      <label>画像の説明<input class="alt-input" value="${escapeHtml(image.alt)}" maxlength="100" required><small>目が見えない方や画像を読み込めない場合に使われます。</small></label>
      <label class="file-button">写真を差し替える<input class="image-input" type="file" accept="image/jpeg,image/png,image/webp"></label>
      <p class="image-meta">${image._pending?`${escapeHtml(image._pending.originalName)}<br>${bytesLabel(image._pending.originalSize)} → ${bytesLabel(image._pending.blob.size)} / ${image.width}×${image.height}px`:`現在の画像：${escapeHtml(image.src.split('/').pop())}`}</p>
      <div class="order-controls"><button class="order-button move-prev" type="button" ${index===0?'disabled':''}>← 前へ</button><button class="order-button move-next" type="button" ${index===images.length-1?'disabled':''}>後へ →</button></div>
    </div>
  </article>`).join('');

  document.querySelectorAll('.gallery-card').forEach(card=>{
    const index=Number(card.dataset.index);
    card.querySelector('.alt-input').addEventListener('input',event=>{images[index].alt=event.target.value});
    card.querySelector('.image-input').addEventListener('change',event=>selectImage(index,event.target.files[0]));
    card.querySelector('.move-prev').addEventListener('click',()=>moveImage(index,index-1));
    card.querySelector('.move-next').addEventListener('click',()=>moveImage(index,index+1));
  });
}

function moveImage(from,to){
  if(to<0||to>=images.length)return;
  const [image]=images.splice(from,1);images.splice(to,0,image);renderGallery();
  message($('#managerMessage'),'並び順を変更しました。保存するまで公開サイトには反映されません。');
}

async function selectImage(index,file){
  if(!file)return;
  if(!/^image\/(jpeg|png|webp)$/.test(file.type))return message($('#managerMessage'),'JPEG・PNG・WebP画像を選んでください。',true);
  if(file.size>MAX_SOURCE_SIZE)return message($('#managerMessage'),'元画像は20MB以下にしてください。',true);
  message($('#managerMessage'),'画像を軽量化しています。');
  try{
    const optimized=await optimizeImage(file);
    const current=images[index];
    if(current._preview?.startsWith('blob:'))URL.revokeObjectURL(current._preview);
    current._preview=URL.createObjectURL(optimized.blob);
    current._pending={...optimized,originalName:file.name,originalSize:file.size};
    current.width=optimized.width;current.height=optimized.height;
    renderGallery();
    message($('#managerMessage'),`${file.name} を ${bytesLabel(file.size)} から ${bytesLabel(optimized.blob.size)} に調整しました。`);
  }catch(error){message($('#managerMessage'),error.message,true)}
}

async function optimizeImage(file){
  const source=URL.createObjectURL(file);
  try{
    const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('画像を読み込めませんでした。別の画像をお試しください。'));img.src=source});
    const scale=Math.min(1,MAX_EDGE/Math.max(image.naturalWidth,image.naturalHeight));
    const width=Math.max(1,Math.round(image.naturalWidth*scale));
    const height=Math.max(1,Math.round(image.naturalHeight*scale));
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d',{alpha:false});context.fillStyle='#fff';context.fillRect(0,0,width,height);context.drawImage(image,0,0,width,height);
    const converted=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',JPEG_QUALITY));
    if(!converted)throw new Error('画像の軽量化に失敗しました。');
    const blob=file.type==='image/jpeg'&&scale===1&&converted.size>=file.size?file:converted;
    return {blob,width,height};
  }finally{URL.revokeObjectURL(source)}
}

async function blobToBase64(blob){
  const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';const step=0x8000;
  for(let i=0;i<bytes.length;i+=step)binary+=String.fromCharCode(...bytes.subarray(i,i+step));
  return btoa(binary);
}

async function createBlob(content,encoding){return api('/git/blobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content,encoding})})}

async function saveGallery(){
  if(localPreview)return;
  const blank=images.findIndex(image=>!image.alt.trim());
  if(blank>=0)return message($('#managerMessage'),`${blank+1}枚目の画像説明を入力してください。`,true);
  setSaving(true,'保存中…');
  message($('#managerMessage'),'6枚をひとつの更新としてGitHubへ保存しています。ページを閉じないでください。');
  try{
    const ref=await api(`/git/ref/heads/${encodeURIComponent(BRANCH)}`);
    const parentSha=ref.object.sha;
    const parent=await api(`/git/commits/${parentSha}`);
    const entries=[];
    for(const image of images){
      if(!image._pending)continue;
      const blob=await createBlob(await blobToBase64(image._pending.blob),'base64');
      entries.push({path:`src${image.src}`,mode:'100644',type:'blob',sha:blob.sha});
    }
    siteData.gallery.images=images.map(({src,alt,width,height})=>({src,alt:alt.trim(),width,height}));
    const dataBlob=await createBlob(`${JSON.stringify(siteData,null,2)}\n`,'utf-8');
    entries.push({path:DATA_PATH,mode:'100644',type:'blob',sha:dataBlob.sha});
    const tree=await api('/git/trees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base_tree:parent.tree.sha,tree:entries})});
    const commit=await api('/git/commits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'content: update studio gallery',tree:tree.sha,parents:[parentSha]})});
    await api(`/git/refs/heads/${encodeURIComponent(BRANCH)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:commit.sha,force:false})});
    message($('#managerMessage'),'保存しました。公開サイトは通常1〜2分で自動更新されます。');
    await loadGallery();
  }catch(error){
    const hint=/422|reference update failed|fast forward/i.test(error.message)?'ほかの更新と重なりました。「変更を取り消す」で最新状態を読み込み、もう一度お試しください。':error.message;
    message($('#managerMessage'),hint,true);
  }finally{setSaving(false,'GitHubへ保存して公開')}
}

$('#loginButton').addEventListener('click',connect);
$('#tokenInput').addEventListener('keydown',event=>{if(event.key==='Enter')connect()});
$('#showToken').addEventListener('change',event=>{$('#tokenInput').type=event.target.checked?'text':'password'});
$('#logoutButton').addEventListener('click',logout);
$('#reloadButton').addEventListener('click',()=>localPreview?loadLocalPreview():loadGallery());
$('#saveButton').addEventListener('click',saveGallery);
$('#mobileSaveButton').addEventListener('click',saveGallery);

if(token){showManager(`${REPO} に接続中`);loadGallery()}
else if(['127.0.0.1','localhost'].includes(location.hostname)){loadLocalPreview().catch(error=>message($('#managerMessage'),error.message,true))}
