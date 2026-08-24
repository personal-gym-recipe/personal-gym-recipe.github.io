import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const src=path.join(__dirname,"src"), out=path.join(__dirname,"docs");
const basePath="";
const assetVersion="20260824-4";
const readJSON=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const esc=s=>String(s??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const attr=esc;
const safeUrl=u=>{const s=String(u||"").trim(); return /^(https?:\/\/|\/|\.\.?\/)/i.test(s)?s:"#"};
const publicUrl=u=>{const s=safeUrl(u);return s.startsWith("/")?`${basePath}${s}`:s};
// This organization Pages site is published at the root of its github.io URL.
const page=html=>html;
const fmtDate=s=>{const d=new Date(String(s)+"T00:00:00+09:00"); return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit"}).format(d).replaceAll("/",".")};
const slugFromFile=f=>path.basename(f,".json");

function inline(md){
  let s=esc(md);
  s=s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(_,alt,url)=>`<img src="${attr(publicUrl(url))}" alt="${alt}">`);
  s=s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,text,url)=>`<a href="${attr(safeUrl(url))}">${text}</a>`);
  s=s.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  s=s.replace(/`([^`]+)`/g,"<code>$1</code>");
  return s;
}
function markdown(md){
  const lines=String(md||"").replace(/\r/g,"").split("\n"); let html=[],para=[],list=null;
  const flushP=()=>{if(para.length){html.push(`<p>${inline(para.join(" "))}</p>`);para=[]}};
  const flushL=()=>{if(list){html.push(`</${list}>`);list=null}};
  for(const raw of lines){const line=raw.trimEnd();
    if(!line.trim()){flushP();flushL();continue}
    let m;
    if((m=line.match(/^(#{2,3})\s+(.+)$/))){flushP();flushL();const n=m[1].length;html.push(`<h${n}>${inline(m[2])}</h${n}>`);continue}
    if((m=line.match(/^>\s?(.+)$/))){flushP();flushL();html.push(`<blockquote>${inline(m[1])}</blockquote>`);continue}
    if((m=line.match(/^[-*]\s+(.+)$/))){flushP();if(list!=="ul"){flushL();list="ul";html.push("<ul>")}html.push(`<li>${inline(m[1])}</li>`);continue}
    if((m=line.match(/^\d+\.\s+(.+)$/))){flushP();if(list!=="ol"){flushL();list="ol";html.push("<ol>")}html.push(`<li>${inline(m[1])}</li>`);continue}
    para.push(line.trim());
  }
  flushP();flushL();return html.join("\n");
}
function copyDir(from,to){fs.mkdirSync(to,{recursive:true});for(const ent of fs.readdirSync(from,{withFileTypes:true})){const a=path.join(from,ent.name),b=path.join(to,ent.name);ent.isDirectory()?copyDir(a,b):fs.copyFileSync(a,b)}}
function header(site,home=false){const top=home?'':basePath+'/';const items=[['Recipeについて','concept'],['トレーナー','trainer'],['指導の流れ','flow'],['導入器具','equipment'],['料金','price'],['アクセス','visit'],['ブログ','journal'],['Q&A','faq'],['お問い合わせ','contact']];const links=items.map(([label,id])=>`<a${id==='contact'?' class="nav-cta"':''} href="${top}#${id}">${label}</a>`).join('');return `<header><div class="container nav"><a class="brand" href="${home?'#top':top}">${esc(site.name)}<small>${esc(site.tagline)}</small></a><nav class="navlinks" aria-label="メインメニュー">${links}</nav><button class="menu-toggle" id="menuToggle" type="button" aria-expanded="false" aria-controls="mobileMenu"><span>MENU</span><i></i><i></i></button></div></header><div class="menu-backdrop" id="menuBackdrop" hidden></div><aside class="mobile-menu" id="mobileMenu" aria-hidden="true"><div class="mobile-menu-head"><span>MENU</span><button id="menuClose" type="button" aria-label="メニューを閉じる">×</button></div><nav aria-label="スマートフォンメニュー">${links}</nav></aside>`}
function footer(site){return `<footer><div class="container footer-row"><span>${esc(site.name)}</span><span>© ${new Date().getFullYear()} ${esc(site.name)}</span></div></footer>`}
function head(site,title,desc,url){return `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#f5f3ed"><title>${esc(title)}</title><meta name="description" content="${attr(desc)}"><link rel="canonical" href="${attr(url)}"><link rel="stylesheet" href="${basePath}/assets/css/site.css?v=${assetVersion}"><script>document.documentElement.classList.add('js')</script><script>window.RECIPE_BASE_PATH='${basePath}'</script><script src="${basePath}/assets/js/site.js?v=${assetVersion}" defer></script></head>`}
function card(p){const cover=p.image?`<div class="post-cover has-image"><img src="${attr(publicUrl(p.image))}" alt=""></div>`:`<div class="post-cover"><span>${esc(p.coverLabel||p.category)}</span></div>`;return `<article class="post reveal">${cover}<div class="post-body"><div class="post-meta">${fmtDate(p.date)} / ${esc(p.category)}</div><h3 title="${attr(p.title)}">${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><div class="post-actions"><button class="like-btn" data-like-slug="${attr(p.slug)}">👍 参考になった <span>0</span></button><a class="read-more" href="${basePath}/journal/${encodeURIComponent(p.slug)}/">記事を読む →</a></div></div></article>`}
function contactActions(site){return `<div class="contact-actions reveal"><a class="contact-action line-primary" href="${attr(site.contact.line)}" target="_blank" rel="noopener noreferrer" aria-label="公式LINEで初回体験を申し込む"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.1c0 4-4 7.3-9 7.3-.8 0-1.6-.1-2.3-.2L5.6 21l1.1-3.5C4.4 16.2 3 13.9 3 11.1 3 7.1 7 4 12 4s9 3.1 9 7.1Z"></path></svg><span>初回体験をLINEで申し込む</span></a><a class="contact-action instagram-secondary" href="${attr(site.contact.instagram)}" target="_blank" rel="noopener noreferrer" aria-label="Instagramでジムの雰囲気を見る"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg><span>Instagramでジムの雰囲気を見る</span></a></div>`}
function home(site,posts){const plans=site.prices.map(x=>`<article class="plan${x.featured?' featured':''} reveal"><div class="tag">${esc(x.tag)}</div><h3>${esc(x.name)}</h3><div class="price-num">${esc(x.price)} <small>${esc(x.unit)}</small></div><p>${esc(x.description)}</p><div class="bottom">${esc(x.detail)}</div></article>`).join("");const cards=posts.map(card).join("");const mail=site.contact.email?`<div class="mail-line">メール：<a href="mailto:${attr(site.contact.email)}">${esc(site.contact.email)}</a></div>`:"";const flowTitleLines=[["目的を聞く"],["身体の状態を","確認する"],["その人に合う","方法を提案する"]];const flow=(site.flow||[]).map((x,i)=>`<article class="flow-step reveal"><span>0${i+1}</span><h3 class="serif">${(flowTitleLines[i]||[x.title]).map(line=>`<span class="mobile-line">${esc(line)}</span>`).join("")}</h3><p>${esc(x.body)}</p></article>`).join("");const featured=(site.equipment?.featured||[]).slice(0,3).map(x=>`<article class="equipment-card reveal">${x.image?`<img src="${attr(publicUrl(x.image))}" alt="${attr(x.name)}">`:''}<div><span>${esc(x.model||'REP')}</span><h3 class="serif">${esc(x.name)}</h3><p>${esc(x.feature)}</p><p class="why"><strong>選んだ理由</strong>${esc(x.reason)}</p></div></article>`).join("");const additional=(site.equipment?.additional||[]).length?`<details class="equipment-more"><summary>その他の設備を見る</summary><ul>${site.equipment.additional.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:'';const faq=(site.faq||[]).slice(0,4).map(x=>`<details class="faq-item reveal"><summary>${esc(x.question)}</summary><p>${esc(x.answer)}</p></details>`).join("");const trainerIdentity=site.trainer.name||site.trainer.career?`<div class="trainer-identity">${site.trainer.name?`<strong class="serif">${esc(site.trainer.name)}</strong>`:''}${site.trainer.career?`<span>${esc(site.trainer.career)}</span>`:''}</div>`:'';const socials=`<div class="social-links"><a href="${attr(site.contact.instagram)}" target="_blank" rel="noopener noreferrer" aria-label="Instagramを開く"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg><span>Instagram</span></a><a href="${attr(site.contact.line)}" target="_blank" rel="noopener noreferrer" aria-label="公式LINEを開く"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.1c0 4-4 7.3-9 7.3-.8 0-1.6-.1-2.3-.2L5.6 21l1.1-3.5C4.4 16.2 3 13.9 3 11.1 3 7.1 7 4 12 4s9 3.1 9 7.1Z"></path></svg><span>公式LINE</span></a></div>`;return `<!doctype html><html lang="ja">${head(site,`${site.name} | ${site.hero.title}`,site.description,site.url+'/',true)}<body>${header(site,true)}<main id="top">
<section class="hero"><div class="hero-media"><img src="${attr(safeUrl(site.hero.image))}" alt="${attr(site.name)} ジム内観"></div><div class="container hero-inner"><div class="eyebrow">${esc(site.hero.eyebrow)}</div><h1 class="serif">
  <span class="mobile-line">身体には、</span>
  <span class="mobile-line">あなただけの</span>
  <span class="mobile-line">Recipeがある。</span>
</h1><p>${esc(site.hero.lead)}</p><div class="hero-actions"><a class="btn primary" href="#contact">お問い合わせ</a><a class="btn" href="#concept">Recipeを知る</a></div></div><div class="scroll-note">SCROLL</div></section>
<section class="section" id="concept"><div class="container concept-grid reveal"><div><div class="eyebrow">01 / Philosophy</div><h2 class="serif">
  <span class="mobile-line">強くなる前に、</span>
  <span class="mobile-line">自分の身体を知る。</span>
</h2></div><div class="lead concept-copy"><p>${esc(site.concept.intro)}</p><p><strong>${esc(site.concept.strong)}</strong></p><p>${esc(site.concept.body)}</p></div></div></section>
<section class="manifesto"><div class="container manifesto-stack"><div class="manifesto-line serif"><span class="keep">持ち上げる前に、</span><span class="keep">立ち方から。</span></div><div class="manifesto-line serif accent">鍛えるだけじゃない。</div><div class="manifesto-line serif">身体を理解する。</div><div class="manifesto-line serif accent">それが、Recipe。</div></div></section>
<section class="section method" id="method"><div class="container"><div class="section-head reveal"><div class="eyebrow">02 / Free Weight Method</div><h2 class="serif"><span class="mobile-line">身体が変わる、</span><span class="mobile-line">3つの順番。</span></h2><p class="lead">Recipeが大切にするのは、支えのないダンベルやバーベルを扱うフリーウェイトです。重力のある日常の中で身体を適切に支えるため、重さより先に「重心・姿勢・力の伝え方」を理解することから始めます。</p></div><div class="method-grid"><article class="method-card reveal" data-num="01"><div class="num">01</div><h3 class="serif">重心を知る。</h3><p>身体とウェイトの重心がどこにあるのか。まず、自分がどこで身体を支えているのかを知ることから始めます。</p></article><article class="method-card reveal" data-num="02"><div class="num">02</div><h3 class="serif">姿勢を覚える。</h3><p>力を出す前に、重心を捉え、力を受け止められる姿勢をつくる。それがすべてのトレーニングの土台になります。</p></article><article class="method-card reveal" data-num="03"><div class="num">03</div><h3 class="serif">力を伝えて動かす。</h3><p>重心と姿勢が整ったら、ウェイトを実際に動かし、身体から道具へ力を伝える感覚を身につけます。日常生活やスポーツにも応用できる身体の使い方を目指します。</p></article></div></div></section>
<section class="training"><div class="training-photo"><img src="${attr(safeUrl(site.training.image))}" alt="${attr(site.name)} トレーニング指導"></div><div class="training-copy reveal"><div class="eyebrow">Private Training</div><h2 class="serif mobile-one-line">一回、一回を、濃く。</h2><p>${esc(site.training.body)}</p></div></section>
<section class="section trainer" id="trainer"><div class="container trainer-grid"><div class="trainer-photo reveal"><img src="${attr(safeUrl(site.trainer.image))}" alt="${attr(site.name)} トレーナー"></div><div class="trainer-copy reveal"><div class="eyebrow">03 / Trainer</div><h2 class="serif trainer-heading">
  <span class="mobile-line">“できる”まで、</span>
  <span class="mobile-line">わかりやすく伝える。</span>
</h2>${trainerIdentity}<blockquote class="trainer-motto">「${esc(site.trainer.motto)}」</blockquote><p>${esc(site.trainer.body)}</p><div class="stats"><div class="stat"><strong class="serif">${esc(site.trainer.years)}</strong><span>YEARS / トレーナー歴</span></div><div class="stat"><strong class="serif">${esc(site.trainer.core)}</strong><span>CORE STYLE / 指導の中心</span></div><div class="stat"><strong class="serif">${esc(site.trainer.specialty)}</strong><span>WEIGHT / 得意分野</span></div></div><div class="trainer-thoughts"><details><summary>フリーウェイトの魅力を、もっと深く伝えたい。</summary><p>${esc(site.story.openingReason)}</p></details><details><summary>あなたに合う“Recipe”を一緒につくる。</summary><p>${esc(site.story.nameOrigin)}</p></details><details><summary>運動を、日常の力に変えたい人へ。</summary><p>${esc(site.story.audience)}</p></details><details><summary>ジムの外でも生きる動きを。</summary><p>${esc(site.story.coachingPolicy)}</p></details></div></div></div></section>
<section class="section flow" id="flow"><div class="container"><div class="section-head reveal"><div class="eyebrow">04 / Personal Flow</div><h2 class="serif"><span class="mobile-line">あなたを知ること</span><span class="mobile-line">から、始める。</span></h2><p class="lead">用意された内容を一律にこなすのではなく、目的と今の身体を知り、その人に合う進め方を一緒につくります。</p></div><div class="flow-grid">${flow}</div></div></section>
<section class="section equipment" id="equipment"><div class="container"><div class="equipment-intro reveal"><div><div class="eyebrow">05 / Equipment</div><h2 class="serif"><span class="mobile-line">身体と向き合う</span><span class="mobile-line">ための、確かな道具。</span></h2></div><div><p>${esc(site.equipment?.makerIntro)}</p></div></div>${featured?`<div class="equipment-grid">${featured}</div>`:''}${additional}</div></section>
<section class="section price" id="price"><div class="container"><div class="section-head reveal"><div class="eyebrow">06 / Price</div><h2 class="serif"><span class="mobile-line">続け方も、</span><span class="mobile-line">あなたに合わせる。</span></h2><p class="lead">目的やトレーニング経験に合わせて、無理のないペースから始められます。</p></div><div class="price-fees reveal"><div class="price-fee"><span>COUNSELING</span><strong>${esc(site.counseling.title)}</strong><b>${esc(site.counseling.price)}</b></div><div class="price-fee"><span>MEMBERSHIP</span><strong>${esc(site.admission.title)}</strong><b>${esc(site.admission.price)}</b></div></div><div class="price-grid">${plans}</div></div></section>
<section class="section visit" id="visit">
  <div class="container visit-grid">
    <div class="visit-copy reveal">
   <div class="eyebrow">07 / Visit</div>
    <h2 class="serif">
  <span class="mobile-line">身体を変える時間を、</span>
  <span class="mobile-line">もっと身近に。</span>
</h2>   
      <p class="lead">${esc(site.visit.lead)}</p>

      <div class="info-list">
        <div class="info-row">
          <span>所在地</span>
          <span>${esc(site.visit.address)}</span>
        </div>

        <div class="info-row">
          <span>アクセス</span>
          <span>${esc(site.visit.access)}</span>
        </div>

        <div class="info-row">
          <span>駐車場</span>
          <span>${esc(site.visit.parking)}</span>
        </div>
      </div>
    </div>

    <div class="map-box reveal">
      <iframe
        title="${attr(site.name)} 周辺マップ"
        src="${attr(safeUrl(site.visit.mapEmbed))}"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen>
      </iframe>

      <div class="map-card">
        <strong>${esc(site.name)}</strong>
        <span>桑名シティホテル 4F</span>
      </div>
    </div>
  </div>
</section>
<section class="section faq" id="faq"><div class="container"><div class="section-head reveal"><div class="eyebrow">08 / Q&amp;A</div><h2 class="serif"><span class="mobile-line">ご来店前の、</span><span class="mobile-line">よくあるご質問。</span></h2><p class="lead">質問を押すと回答が開きます。</p></div><div class="faq-list">${faq}</div></div></section>
<section class="section contact" id="contact"><div class="container"><div class="contact-head reveal"><div class="contact-title-block"><div class="eyebrow">09 / Contact</div><h2 class="serif">
  <span class="mobile-line">まずは、あなたの</span>
  <span class="mobile-line">身体を知る</span>
  <span class="mobile-line">時間から。</span>
</h2></div><div class="contact-intro"><p class="lead">${esc(site.contact.lead)}</p></div></div>${contactActions(site)}</div></section>
<section class="journal" id="journal"><div class="container"><div class="journal-head reveal"><div><div class="eyebrow">10 / Journal</div><h2 class="serif">Recipe Journal</h2><p class="lead">身体のことを、もう少し深く知りたい人へ。</p></div><div class="journal-nav" aria-label="ブログを横に移動"><button class="journal-arrow" id="blogPrev" aria-label="前の記事">←</button><button class="journal-arrow" id="blogNext" aria-label="次の記事">→</button></div></div></div><div class="journal-rail" id="journalRail">${cards}</div></section>
</main>${footer(site)}</body></html>`}
function article(site,p){const cover=p.image?`<div class="article-cover"><img src="${attr(safeUrl(p.image))}" alt="${attr(p.title)}"></div>`:"";return `<!doctype html><html lang="ja">${head(site,`${p.title} | ${site.name}`,p.excerpt,`${site.url}/journal/${encodeURIComponent(p.slug)}/`)}<body>${header(site)}<main class="article-page"><section class="article-hero"><div class="container"><div class="eyebrow">${fmtDate(p.date)} / ${esc(p.category)}</div><h1 class="serif">${esc(p.title)}</h1><p class="article-excerpt">${esc(p.excerpt)}</p></div>${cover}</section><article class="article-content">${markdown(p.body)}<div class="article-tools"><button class="like-btn" data-like-slug="${attr(p.slug)}">👍 参考になった <span>0</span></button><a class="back-journal" href="${basePath}/#journal">← Recipe Journalへ戻る</a></div></article></main>${footer(site)}</body></html>`}
function notFound(site){return `<!doctype html><html lang="ja">${head(site,`ページが見つかりません | ${site.name}`,site.description,site.url+'/404.html')}<body><main class="thanks-page"><div class="thanks-card"><div class="eyebrow">404</div><h1 class="serif">ページが見つかりません。</h1><p>URLをご確認いただくか、トップページへお戻りください。</p><a class="btn sage" href="${basePath}/">トップページへ</a></div></main></body></html>`}

fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
copyDir(path.join(src,"assets"),path.join(out,"assets"));copyDir(path.join(src,"admin"),path.join(out,"admin"));
const site=readJSON(path.join(src,"data/site.json"));
const posts=fs.readdirSync(path.join(src,"posts")).filter(f=>f.endsWith(".json")).map(f=>({...readJSON(path.join(src,"posts",f)),slug:slugFromFile(f)})).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
fs.writeFileSync(path.join(out,"index.html"),page(home(site,posts)));
for(const p of posts){const dir=path.join(out,"journal",p.slug);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,"index.html"),page(article(site,p)))}
fs.writeFileSync(path.join(out,"404.html"),page(notFound(site)));
fs.writeFileSync(path.join(out,".nojekyll"),"");
const urls=['/',...posts.map(p=>`/journal/${encodeURIComponent(p.slug)}/`)];
fs.writeFileSync(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${esc(site.url+u)}</loc></url>`).join('')}</urlset>`);
fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
console.log(`Built ${posts.length} journal pages into ${out}`);
