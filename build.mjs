import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const src=path.join(__dirname,"src"), out=path.join(__dirname,"docs");
const basePath="";
const assetVersion="20260912-4";
const readJSON=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const esc=s=>String(s??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const attr=esc;
const safeUrl=u=>{const s=String(u||"").trim(); return /^(https?:\/\/|\/|\.\.?\/)/i.test(s)?s:"#"};
const publicUrl=u=>{const s=safeUrl(u);return s.startsWith("/")?`${basePath}${s}`:s};
const absoluteUrl=(site,u)=>new URL(publicUrl(u),`${site.url}/`).href;
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
function copySearchConsoleVerification(){const dir=path.join(src,"search-console");if(!fs.existsSync(dir))return;for(const name of fs.readdirSync(dir)){if(/^google[a-z0-9_-]+\.html$/i.test(name)){fs.copyFileSync(path.join(dir,name),path.join(out,name))}}}
function header(site,home=false){const top=home?'':basePath+'/';const links=(site.nav||[]).map(({label,id})=>`<a${id==='contact'?' class="nav-cta"':''} href="${top}#${id}">${label}</a>`).join('');return `<header><div class="container nav"><a class="brand" href="${home?'#top':top}">${esc(site.name)}<small>${esc(site.tagline)}</small></a><nav class="navlinks" aria-label="メインメニュー">${links}</nav><button class="menu-toggle" id="menuToggle" type="button" aria-expanded="false" aria-controls="mobileMenu"><span>MENU</span><i></i><i></i></button></div></header><div class="menu-backdrop" id="menuBackdrop" hidden></div><aside class="mobile-menu" id="mobileMenu" aria-hidden="true"><div class="mobile-menu-head"><span>MENU</span><button id="menuClose" type="button" aria-label="メニューを閉じる">×</button></div><nav aria-label="スマートフォンメニュー">${links}</nav></aside>`}
function footer(site){return `<footer><div class="container footer-row"><span>${esc(site.name)}</span><span>© ${new Date().getFullYear()} ${esc(site.name)}</span></div></footer>`}
function businessStructuredData(site){
  const offers=[
    {"@type":"Offer",name:site.counseling.title,price:"0",priceCurrency:"JPY",description:site.counseling.body},
    {"@type":"Offer",name:site.admission.title,price:String(site.admission.price).replace(/[^\d]/g,""),priceCurrency:"JPY"},
    ...site.prices.map(plan=>{const price=String(plan.price).replace(/[^\d]/g,"");const priceSpecification={"@type":"UnitPriceSpecification",priceCurrency:"JPY"};if(String(plan.price).includes("〜")){priceSpecification.minPrice=price}else{priceSpecification.price=price}return {"@type":"Offer",name:`${plan.name} ${plan.unit}`,description:`${plan.description} ${plan.detail}`,priceSpecification}})
  ];
  const business={
    "@type":"ExerciseGym",
    "@id":`${site.url}/#business`,
    name:site.name,
    url:`${site.url}/`,
    description:site.seo?.description||site.description,
    image:absoluteUrl(site,site.hero.image),
    address:{"@type":"PostalAddress",streetAddress:site.visit.streetAddress,addressLocality:site.visit.locality,addressRegion:site.visit.region,addressCountry:"JP"},
    areaServed:{"@type":"City",name:site.visit.locality},
    sameAs:[site.contact.instagram,site.contact.line],
    employee:{"@type":"Person",name:site.trainer.name,jobTitle:site.trainer.jobTitle,description:site.trainer.body,award:site.trainer.award},
    priceRange:site.seo.priceRange,
    makesOffer:offers
  };
  const website={"@type":"WebSite","@id":`${site.url}/#website`,url:`${site.url}/`,name:site.name,inLanguage:"ja"};
  return JSON.stringify({"@context":"https://schema.org","@graph":[website,business]}).replace(/</g,"\\u003c");
}
function head(site,title,desc,url,options={}){const structured=options===true||options.structured===true;const noindex=options.noindex===true||url.endsWith("/404.html");const type=options.type||"website";const finalTitle=structured&&site.seo?.title?site.seo.title:title;const finalDesc=structured&&site.seo?.description?site.seo.description:desc;const image=absoluteUrl(site,site.hero.image);const robots=noindex?'<meta name="robots" content="noindex,nofollow">':'';const data=structured?`<script type="application/ld+json">${businessStructuredData(site)}</script>`:'';return `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#f5f3ed">${robots}<title>${esc(finalTitle)}</title><meta name="description" content="${attr(finalDesc)}"><link rel="canonical" href="${attr(url)}"><meta property="og:locale" content="ja_JP"><meta property="og:type" content="${attr(type)}"><meta property="og:site_name" content="${attr(site.name)}"><meta property="og:title" content="${attr(finalTitle)}"><meta property="og:description" content="${attr(finalDesc)}"><meta property="og:url" content="${attr(url)}"><meta property="og:image" content="${attr(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${attr(finalTitle)}"><meta name="twitter:description" content="${attr(finalDesc)}"><meta name="twitter:image" content="${attr(image)}">${data}<link rel="stylesheet" href="${basePath}/assets/css/site.css?v=${assetVersion}"><script>document.documentElement.classList.add('js')</script><script>window.RECIPE_BASE_PATH='${basePath}'</script><script src="${basePath}/assets/js/site.js?v=${assetVersion}" defer></script></head>`}
function card(p){const cover=p.image?`<div class="post-cover has-image"><img src="${attr(publicUrl(p.image))}" alt=""></div>`:`<div class="post-cover"><span>${esc(p.coverLabel||p.category)}</span></div>`;return `<article class="post reveal">${cover}<div class="post-body"><div class="post-meta">${fmtDate(p.date)} / ${esc(p.category)}</div><h3 title="${attr(p.title)}">${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><div class="post-actions"><button class="like-btn" data-like-slug="${attr(p.slug)}">👍 参考になった <span>0</span></button><a class="read-more" href="${basePath}/journal/${encodeURIComponent(p.slug)}/">記事を読む →</a></div></div></article>`}
function contactActions(site){return `<div class="contact-actions reveal"><a class="contact-action line-primary" href="${attr(site.contact.line)}" target="_blank" rel="noopener noreferrer" aria-label="${attr(site.contact.lineAriaLabel)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.1c0 4-4 7.3-9 7.3-.8 0-1.6-.1-2.3-.2L5.6 21l1.1-3.5C4.4 16.2 3 13.9 3 11.1 3 7.1 7 4 12 4s9 3.1 9 7.1Z"></path></svg><span>${esc(site.contact.lineCta)}</span></a><a class="contact-action instagram-secondary" href="${attr(site.contact.instagram)}" target="_blank" rel="noopener noreferrer" aria-label="${attr(site.contact.instagramAriaLabel)}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg><span>${esc(site.contact.instagramCta)}</span></a></div>`}
function home(site,posts){const plans=site.prices.map(x=>`<article class="plan${x.featured?' featured':''} reveal"><div class="tag">${esc(x.tag)}</div><h3>${esc(x.name)}</h3><div class="price-num">${esc(x.price)} <small>${esc(x.unit)}</small></div><p>${esc(x.description)}</p><div class="bottom">${esc(x.detail)}</div></article>`).join("");const cards=posts.map(card).join("");const methodLead=(site.method?.leadSentences||[]).map(s=>s.emphasis?`<span class="method-sentence method-sentence-emphasis">${(s.phrases||[s.text]).map(p=>`<span class="method-phrase">${esc(p)}</span>`).join("")}</span>`:`<span class="method-sentence">${esc(s.text)}</span>`).join("");const methodCards=(site.method?.steps||[]).map(s=>`<article class="method-card reveal" data-num="${attr(s.num)}"><div class="num">${esc(s.num)}</div><h3 class="serif">${esc(s.title)}</h3><p>${esc(s.body)}</p></article>`).join("");const thoughts=(site.trainerThoughts||[]).map(t=>`<details><summary>${esc(t.question)}</summary><p>${esc(t.answer)}</p></details>`).join("");const flow=(site.flow||[]).map((x,i)=>`<article class="flow-step reveal"><span>0${i+1}</span><h3 class="serif">${(x.titleLines||[x.title]).map(line=>`<span class="mobile-line">${esc(line)}</span>`).join("")}</h3><p>${esc(x.body)}</p></article>`).join("");const faq=(site.faq||[]).slice(0,4).map(x=>`<details class="faq-item reveal"><summary><span class="qa-label">Q</span>${esc(x.question)}</summary><p><span class="qa-label">A</span>${esc(x.answer)}</p></details>`).join("");const trainerIdentity=site.trainer.name||site.trainer.career?`<div class="trainer-identity">${site.trainer.name?`<strong class="serif">${esc(site.trainer.name)}</strong>`:''}${site.trainer.career?`<span>${esc(site.trainer.career)}</span>`:''}</div>`:'';return `<!doctype html><html lang="ja">${head(site,`${site.name} | ${site.hero.title}`,site.description,site.url+'/',true)}<body>${header(site,true)}<main id="top">
<section class="hero"><div class="hero-media"><img src="${attr(safeUrl(site.hero.image))}" alt="${attr(site.name)} ${attr(site.hero.imageAlt)}"></div><div class="container hero-inner"><div class="hero-context"><span>${esc(site.hero.location)}</span><span>${esc(site.hero.specialty)}</span></div><h1 class="serif">
${site.sections.hero.titleLines.map(l=>`  <span class="mobile-line">${esc(l)}</span>`).join("\n")}
</h1><p class="hero-lead"><span>${esc(site.hero.lead)}</span><span>${esc(site.hero.trainerLead)}</span></p><div class="hero-actions"><a class="btn primary" href="#contact">${esc(site.sections.hero.primaryCta)}</a><a class="btn" href="#concept">${esc(site.sections.hero.secondaryCta)}</a></div></div><div class="scroll-note">SCROLL</div></section>
<section class="section" id="concept"><div class="container concept-grid reveal"><div><div class="eyebrow">${esc(site.sections.concept.eyebrow)}</div><h2 class="serif">
${site.sections.concept.titleLines.map(l=>`  <span class="mobile-line">${esc(l)}</span>`).join("\n")}
</h2></div><div class="lead concept-copy"><p>${esc(site.concept.intro)}</p><p><strong>${esc(site.concept.strong)}</strong></p><p>${esc(site.concept.body)}</p></div></div></section>
<section class="section method" id="method"><div class="container"><div class="section-head reveal"><div class="eyebrow">${esc(site.sections.method.eyebrow)}</div><h2 class="serif">${esc(site.sections.method.title)}</h2><p class="lead method-lead">${methodLead}</p></div><div class="method-grid">${methodCards}</div></div></section>
<section class="training"><div class="container training-inner"><div class="training-photo"><img src="${attr(safeUrl(site.training.image))}" alt="${attr(site.name)} ${attr(site.training.imageAlt)}" width="964" height="1698" loading="lazy"></div><div class="training-copy reveal"><div class="eyebrow">${esc(site.sections.training.eyebrow)}</div><h2 class="serif mobile-one-line">${esc(site.sections.training.title)}</h2><p>${esc(site.training.body)}</p></div></div></section>
<section class="section trainer" id="trainer"><div class="container trainer-grid"><div class="trainer-photo reveal"><img src="${attr(safeUrl(site.trainer.image))}" alt="${attr(site.name)} ${attr(site.trainer.imageAlt)}"></div><div class="trainer-copy reveal"><div class="eyebrow">${esc(site.sections.trainer.eyebrow)}</div><h2 class="serif trainer-heading">
  ${esc(site.sections.trainer.title)}
</h2>${trainerIdentity}<blockquote class="trainer-motto">「${esc(site.trainer.motto)}」</blockquote><p>${esc(site.trainer.body)}</p><div class="trainer-thoughts">${thoughts}</div></div></div></section>
<section class="section flow" id="flow"><div class="container"><div class="section-head reveal"><div class="eyebrow">${esc(site.sections.flow.eyebrow)}</div><h2 class="serif">${esc(site.sections.flow.title)}</h2><p class="lead">${esc(site.sections.flow.lead)}</p></div><div class="flow-grid">${flow}</div></div></section>
<section class="section price" id="price"><div class="container"><div class="section-head reveal"><div class="eyebrow">${esc(site.sections.price.eyebrow)}</div><h2 class="serif">${site.sections.price.titleLines.map(l=>`<span class="mobile-line">${esc(l)}</span>`).join("")}</h2><p class="lead">${esc(site.sections.price.lead)}</p></div><div class="price-fees reveal"><div class="price-fee"><span>${esc(site.counseling.label)}</span><strong>${esc(site.counseling.title)}</strong><b>${esc(site.counseling.price)}</b></div><div class="price-fee"><span>${esc(site.admission.label)}</span><strong>${esc(site.admission.title)}</strong><b>${esc(site.admission.price)}</b></div></div><div class="price-grid">${plans}</div></div></section>
<section class="section visit" id="visit">
  <div class="container visit-grid">
    <div class="visit-copy reveal">
   <div class="eyebrow">${esc(site.sections.visit.eyebrow)}</div>
    <h2 class="serif">
  ${esc(site.sections.visit.title)}
</h2>   
      <p class="lead">${esc(site.visit.lead)}</p>

      <div class="info-list">
        <div class="info-row">
          <span>所在地</span>
          <address>${esc(site.visit.address)}</address>
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
        title="${attr(site.name)} ${attr(site.visit.mapTitle)}"
        src="${attr(safeUrl(site.visit.mapEmbed))}"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen>
      </iframe>

      <div class="map-card">
        <strong>${esc(site.name)}</strong>
        <span>${esc(site.sections.visit.mapCardLabel)}</span>
      </div>
    </div>
  </div>
</section>
<section class="section faq" id="faq"><div class="container"><div class="section-head reveal"><div class="eyebrow">${esc(site.sections.faq.eyebrow)}</div><h2 class="serif">${esc(site.sections.faq.title)}</h2></div><div class="faq-list">${faq}</div></div></section>
<section class="section contact" id="contact"><div class="container"><div class="contact-head reveal"><div class="contact-title-block"><div class="eyebrow">${esc(site.sections.contact.eyebrow)}</div><h2 class="serif">${esc(site.sections.contact.title)}</h2></div><div class="contact-intro"><p class="lead">${esc(site.contact.lead)}</p></div></div><div class="trial-guide reveal"><dl class="trial-facts"><div><dt>${esc(site.contact.trialContentLabel)}</dt><dd>${esc(site.contact.trialContent)}</dd></div><div><dt>${esc(site.contact.trialDurationLabel)}</dt><dd>${esc(site.contact.trialDuration)}</dd></div></dl><p>${esc(site.contact.bookingNote)}<br>${esc(site.contact.decisionNote)}</p></div>${contactActions(site)}</div></section>
<section class="journal" id="journal"><div class="container"><div class="journal-head reveal"><div><div class="eyebrow">${esc(site.sections.journal.eyebrow)}</div><h2 class="serif">${esc(site.sections.journal.title)}</h2><p class="lead">${esc(site.sections.journal.lead)}</p></div>${cards?`<div class="journal-nav" aria-label="ブログを横に移動"><button class="journal-arrow" id="blogPrev" aria-label="前の記事">←</button><button class="journal-arrow" id="blogNext" aria-label="次の記事">→</button></div>`:''}</div></div><div class="journal-rail" id="journalRail">${cards||`<p class="journal-empty">${esc(site.sections.journal.emptyMessage)}</p>`}</div></section>
</main>${footer(site)}</body></html>`}
function article(site,p){const cover=p.image?`<div class="article-cover"><img src="${attr(safeUrl(p.image))}" alt="${attr(p.title)}"></div>`:"";return `<!doctype html><html lang="ja">${head(site,`${p.title} | ${site.name}`,p.excerpt,`${site.url}/journal/${encodeURIComponent(p.slug)}/`)}<body>${header(site)}<main class="article-page"><section class="article-hero"><div class="container"><div class="eyebrow">${fmtDate(p.date)} / ${esc(p.category)}</div><h1 class="serif">${esc(p.title)}</h1><p class="article-excerpt">${esc(p.excerpt)}</p></div>${cover}</section><article class="article-content">${markdown(p.body)}<div class="article-tools"><button class="like-btn" data-like-slug="${attr(p.slug)}">👍 参考になった <span>0</span></button><a class="back-journal" href="${basePath}/#journal">← ${esc(site.sections.journal.title)}へ戻る</a></div></article></main>${footer(site)}</body></html>`}
function notFound(site){return `<!doctype html><html lang="ja">${head(site,`${site.notFound.metaTitle} | ${site.name}`,site.description,site.url+'/404.html')}<body><main class="thanks-page"><div class="thanks-card"><div class="eyebrow">404</div><h1 class="serif">${esc(site.notFound.title)}</h1><p>${esc(site.notFound.body)}</p><a class="btn sage" href="${basePath}/">${esc(site.notFound.cta)}</a></div></main></body></html>`}

fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
copyDir(path.join(src,"assets"),path.join(out,"assets"));copyDir(path.join(src,"admin"),path.join(out,"admin"));
copySearchConsoleVerification();
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

/* ==========================================================================
   公開前チェック
   site.json の記入漏れ、存在しない画像の参照、リンク切れを検出する。
   エラーが1件でもあればビルドを失敗させ、GitHub Actions 側も失敗扱いになる。
   ========================================================================== */

const errors = [];
const warnings = [];

function requireText(label, value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    errors.push(`site.json の ${label} が未設定です`);
  }
}

function requireList(label, value, itemCheck) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`site.json の ${label} が空です`);
    return;
  }
  if (itemCheck) value.forEach((item, i) => itemCheck(item, `${label}[${i}]`));
}

function requireUrl(label, value) {
  requireText(label, value);
  if (value && !/^https?:\/\//.test(String(value))) {
    errors.push(`site.json の ${label} は http(s):// で始まる必要があります（現在: ${value}）`);
  }
}

// --- 1. サイト全体の必須項目 ---
requireText("name", site.name);
requireText("tagline", site.tagline);
requireText("description", site.description);
requireUrl("url", site.url);
requireText("seo.title", site.seo?.title);
requireText("seo.description", site.seo?.description);

// --- 2. 集客導線（ここが欠けると問い合わせが受け取れない） ---
requireUrl("contact.line", site.contact?.line);
requireUrl("contact.instagram", site.contact?.instagram);
requireText("contact.lineCta", site.contact?.lineCta);
requireText("contact.instagramCta", site.contact?.instagramCta);

// --- 3. ヒーローと各セクションの見出し ---
requireText("hero.title", site.hero?.title);
requireText("hero.image", site.hero?.image);
requireList("sections.hero.titleLines", site.sections?.hero?.titleLines);
for (const [id, section] of Object.entries(site.sections || {})) {
  if (id === "hero") continue;
  requireText(`sections.${id}.eyebrow`, section.eyebrow);
  if (!section.title && !Array.isArray(section.titleLines)) {
    errors.push(`site.json の sections.${id} に title か titleLines のどちらかが必要です`);
  }
}

// --- 4. 一覧系のデータ ---
requireList("nav", site.nav, (item, label) => {
  requireText(`${label}.label`, item.label);
  requireText(`${label}.id`, item.id);
});
requireList("prices", site.prices, (item, label) => {
  requireText(`${label}.name`, item.name);
  requireText(`${label}.price`, item.price);
});
requireList("faq", site.faq, (item, label) => {
  requireText(`${label}.question`, item.question);
  requireText(`${label}.answer`, item.answer);
});
requireList("flow", site.flow, (item, label) => requireText(`${label}.title`, item.title));
requireList("method.steps", site.method?.steps, (item, label) => requireText(`${label}.title`, item.title));
requireList("trainerThoughts", site.trainerThoughts, (item, label) => {
  requireText(`${label}.question`, item.question);
  requireText(`${label}.answer`, item.answer);
});

// --- 5. 生成されたHTMLを読み、参照先が実在するか確認する ---
function collectHtmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

const htmlFiles = collectHtmlFiles(out);
const referencedFiles = new Set();

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const shown = path.relative(out, file);

  // 参照しているローカルファイルが存在するか
  for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    let local = ref;
    if (site.url && local.startsWith(site.url)) local = local.slice(site.url.length) || "/";
    if (/^(https?:|data:|mailto:|tel:|#|\/\/)/.test(local)) continue;
    const cleaned = decodeURIComponent(local.split("?")[0].split("#")[0]);
    if (!cleaned || cleaned.endsWith("/")) continue;
    const target = path.join(out, cleaned.replace(/^\//, ""));
    referencedFiles.add(path.resolve(target));
    if (!fs.existsSync(target)) {
      errors.push(`${shown} が参照している ${ref} が見つかりません`);
    }
  }

  // ページ内リンク（#concept など）の飛び先が存在するか
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) {
    if (!ids.has(anchor)) {
      errors.push(`${shown} のリンク #${anchor} に対応する要素がありません`);
    }
  }
}

// --- 6. どこからも参照されていない画像（削除し忘れの検出） ---
function collectAssetFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? collectAssetFiles(full) : [full];
  });
}

for (const file of collectAssetFiles(path.join(out, "assets"))) {
  if (/\.(css|js)$/.test(file)) continue;
  if (!referencedFiles.has(path.resolve(file))) {
    warnings.push(`${path.relative(out, file)} はどこからも参照されていません`);
  }
}

// --- 結果 ---
for (const warning of warnings) console.warn(`warning: ${warning}`);
if (errors.length) {
  console.error(`\n公開前チェックで ${errors.length} 件の問題が見つかりました:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`公開前チェック: 問題なし${warnings.length ? `（警告 ${warnings.length} 件）` : ""}`);
