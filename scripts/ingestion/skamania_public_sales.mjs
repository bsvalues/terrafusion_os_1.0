#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';

const COUNTY='Skamania',CODE='059',OFFICIAL='https://www.skamaniacounty.org';
const MODE='public_assessor_taxsifter_sale_search_current_year';
const BASE='https://skamaniawa-taxsifter.publicaccessnow.com';
const DISCLAIMER=`${BASE}/Disclaimer.aspx`;
const SEARCH=`${BASE}/SalesSearch/SalesSearch.aspx`;
const PAYLOAD='skamania-taxsifter-sale-search-2026-sanitized.json';
const GENERATED_AT=process.argv[2]??new Date().toISOString();
const ROOT=process.argv[3]??'frontend/apps/os-shell/public/launch-data/washington';
const START='01/01/2026';
const END='09/10/2026';

const jar=new Map();
function inv(c,m){if(!c)throw new Error(m)}
function rec(v){return typeof v==='object'&&v!==null&&!Array.isArray(v)}
function canon(v){if(v===null||typeof v==='boolean'||typeof v==='string'){const s=JSON.stringify(v);if(s!==undefined)return s}if(typeof v==='number'&&Number.isFinite(v))return JSON.stringify(v);if(Array.isArray(v))return`[${v.map(canon).join(',')}]`;if(rec(v))return`{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;throw new Error('non-json value')}
function sha(v){return createHash('sha256').update(canon(v)).digest('hex')}
function entity(s){return String(s??'').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))).replace(/\s+/g,' ').trim()}
function strip(html){return entity(String(html).replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' '))}
function attrs(tag){const out={};for(const m of tag.matchAll(/\s([:\w$-]+)(?:=(["'])(.*?)\2)?/g))out[m[1].toLowerCase()]=entity(m[3]??'');return out}
function hidden(html,name){const e=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),m=html.match(new RegExp(`<input[^>]+name=["']${e}["'][^>]*>`,'i'))?.[0];return m?.match(/value=["']([^"']*)["']/i)?.[1]?.replace(/&quot;/g,'"').replace(/&amp;/g,'&')??''}
function absorbCookies(r){const raw=r.headers.getSetCookie?.()??(r.headers.get('set-cookie')?[r.headers.get('set-cookie')]:[]);for(const c of raw){const f=String(c).split(';')[0],i=f.indexOf('=');if(i>0)jar.set(f.slice(0,i),f.slice(i+1))}}
function cookie(){return[...jar.entries()].map(([k,v])=>`${k}=${v}`).join('; ')}
function date(v){const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(v??'').trim());inv(m,`bad Skamania date ${v}`);return`${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`}
function money(v){const n=Number(String(v??'').replace(/[$,\s]/g,''));return Number.isFinite(n)&&n>0?n:null}
function num(v){const s=String(v??'').replace(/[,\s]/g,'');if(!s)return null;const n=Number(s);return Number.isFinite(n)?n:null}
async function ft(url,opts={}){const r=await fetch(url,{redirect:'manual',...opts});absorbCookies(r);return{r,text:await r.text()}}
function formBody(html,extra={}){
  const body=new URLSearchParams();
  for(const m of html.matchAll(/<input\b[^>]*>/gi)){
    const a=attrs(m[0]);if(!a.name)continue;
    const type=(a.type??'text').toLowerCase();
    if(['button','submit','image','reset'].includes(type))continue;
    if(['checkbox','radio'].includes(type)&&!('checked'in a))continue;
    body.append(a.name,a.value??'');
  }
  for(const [k,v]of Object.entries(extra))body.set(k,v);
  return body;
}
async function post(url,referer,html,extra){
  const r=await fetch(url,{method:'POST',redirect:'manual',headers:{cookie:cookie(),referer,'content-type':'application/x-www-form-urlencoded',accept:'text/html'},body:formBody(html,extra)});
  absorbCookies(r);
  return{r,text:await r.text()};
}
function pageIndex(html){return Number(html.match(/name="ctl00\$cphContent\$hdfSelectedPageIndex"[^>]*value="(\d+)"/)?.[1]??NaN)}
function total(html){const h=html.match(/name="ctl00\$cphContent\$hdfResultCount"[^>]*value="(\d+)"/)?.[1];return Number(h??String(strip(html).match(/([\d,]+)\s+records found/i)?.[1]??'').replace(/,/g,''))}
function targets(html){const out=[];for(const m of html.matchAll(/<a[^>]+href="javascript:__doPostBack\(&#39;([^&]+)&#39;,&#39;([^&]*)&[^>]*>([\s\S]*?)<\/a>/g))out.push({target:entity(m[1]),arg:entity(m[2]),label:strip(m[3])});return out}
function parseRows(html,page){
  const rows=[];
  for(const m of html.matchAll(/<tr[\s\S]*?<\/tr>/gi)){
    const cells=[...m[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>strip(x[1]));
    if(cells.length<8||!/^\d+/.test(cells[0]??'')||!/\d{1,2}\/\d{1,2}\/\d{4}/.test(cells[1]??''))continue;
    const parcelNumber=cells[0],saleDate=date(cells[1]),documentNumber=cells[2]||null,situsAddress=cells[4]||null,useCode=cells[5]||null,acres=num(cells[6]),salePrice=money(cells[7]);
    if(!parcelNumber||!saleDate||salePrice===null)continue;
    rows.push({page,parcelNumber,saleDate,documentNumber,situsAddress,useCode,acres,salePrice});
  }
  return rows;
}
async function fetchSales(){
  const d=await ft(DISCLAIMER,{headers:{accept:'text/html'}});
  inv(cookie(),'missing Skamania session cookie');
  const agree=await post(DISCLAIMER,DISCLAIMER,d.text,{'ctl00$cphContent$btnAgree':'I Agree'});
  if(agree.r.status>=300&&agree.r.status<400&&agree.r.headers.get('location'))await ft(new URL(agree.r.headers.get('location'),DISCLAIMER).href,{headers:{cookie:cookie(),accept:'text/html'}});
  const s=await ft(SEARCH,{headers:{cookie:cookie(),accept:'text/html'}});
  let p=await post(SEARCH,SEARCH,s.text,{'ctl00$cphContent$txtdateFrom':START,'ctl00$cphContent$txtdateTo':END,'ctl00$cphContent$txtpriceFrom':'1','ctl00$cphContent$txtpriceTo':'999999999','ctl00$cphContent$searchbutton':'Search'});
  let html=p.text;
  const count=total(html);
  inv(Number.isInteger(count)&&count>0,'missing Skamania result count');
  const pages=Math.ceil(count/50), rows=[], seen=new Set();
  for(let guard=0;guard<pages+2;guard++){
    const idx=pageIndex(html), parsed=parseRows(html,idx);
    inv(Number.isInteger(idx)&&idx>0,`missing Skamania page index at guard ${guard}`);
    inv(!seen.has(idx),`repeated Skamania page ${idx}`);
    inv(parsed.length>0,`no Skamania rows on page ${idx}`);
    seen.add(idx);
    rows.push(...parsed);
    if(rows.length>=count)break;
    const ts=targets(html);
    const next=ts.find(x=>x.label===String(idx+1)&&/NumberedLink/.test(x.target))??ts.find(x=>x.target.endsWith('lbForwardLink'));
    inv(next,`missing Skamania next page target after page ${idx}`);
    p=await post(SEARCH,SEARCH,html,{'__EVENTTARGET':next.target,'__EVENTARGUMENT':next.arg});
    html=p.text;
  }
  inv(seen.size===pages,`Skamania page count ${seen.size} != expected ${pages}`);
  inv(rows.length===count,`Skamania parsed rows ${rows.length} != advertised ${count}`);
  inv(new Set(rows.map(r=>[r.parcelNumber,r.saleDate,r.documentNumber,r.salePrice,r.useCode].join('|'))).size===rows.length,'duplicate Skamania staged source row identity');
  return{count,pages,rows,search:{url:SEARCH,start:START,end:END,pages}};
}
function map(a,i,payloadHash,genDate){
  if(a.saleDate>genDate)return null;
  const id=[CODE,a.parcelNumber,a.documentNumber,a.saleDate,a.salePrice,a.useCode].map(v=>String(v??'').trim()).join('|');
  return{saleId:`WA-${CODE}-${createHash('sha256').update(id).digest('hex').slice(0,32)}`,county:COUNTY,countyCode:CODE,parcelNumber:a.parcelNumber,saleDate:a.saleDate,saleYear:Number(a.saleDate.slice(0,4)),salePrice:a.salePrice,adjustedSalePrice:null,documentNumber:a.documentNumber,deedType:null,situsAddress:a.situsAddress,situsCity:null,situsZip:null,useCode:a.useCode,acres:a.acres,grantor:null,grantee:null,saleNote:null,neighborhoodCode:null,currentNeighborhoodCode:null,sourceMode:MODE,candidateSource:'skamania-official-taxsifter-sale-search-current-year',confidenceScore:0.95,qualityScore:0.95,qualityBand:'official_assessor_sale_search_public_record',reviewStatus:'ready',grossLivingArea:null,lotSizeSqft:null,yearBuilt:null,bedrooms:null,bathrooms:null,condition:null,qualityGrade:null,provenance:{sourceUrl:SEARCH,sourceFinalUrl:SEARCH,sourcePayloadPath:PAYLOAD,sourcePayloadSha256:payloadHash,candidateIndexSource:`${PAYLOAD}#page:${a.page}:parcel:${a.parcelNumber}:document:${a.documentNumber??'unknown'}`,candidateRecordType:'official-taxsifter-sale-search-row',candidateSourceOrdinal:i,componentRows:[{sourceKey:'sale-search-row',sourceUrl:SEARCH,sourcePayloadPath:PAYLOAD,sourcePayloadSha256:payloadHash,candidateIndexSource:`${PAYLOAD}#page:${a.page}:parcel:${a.parcelNumber}:document:${a.documentNumber??'unknown'}`}]},flags:{duplicateRisk:false,needsReview:false,futureSaleDate:false,manualException:false}};
}
async function rj(p){return JSON.parse(await readFile(p,'utf8'))}
async function wj(p,v){await mkdir(dirname(p),{recursive:true});await writeFile(p,`${JSON.stringify(v)}\n`,'utf8')}
function gen(v,g){if(Array.isArray(v))return v.map(e=>gen(e,g));if(rec(v)){const n={};for(const[k,e]of Object.entries(v))n[k]=k==='generatedAt'?g:gen(e,g);return n}return v}
async function main(){
  inv(new Date(GENERATED_AT).toISOString()===GENERATED_AT,'bad generatedAt');
  const genDate=GENERATED_AT.slice(0,10), payload=await fetchSales();
  const sanitized={search:payload.search,count:payload.count,rows:payload.rows};
  const payloadHash=sha(sanitized);
  const records=payload.rows.map((a,i)=>map(a,i+1,payloadHash,genDate)).filter(Boolean).sort((l,r)=>r.saleDate.localeCompare(l.saleDate)||l.saleId.localeCompare(r.saleId));
  inv(records.length===payload.count,'Skamania record filter changed row count');
  const ids=new Set();for(const record of records){inv(!ids.has(record.saleId),`duplicate ${record.saleId}`);ids.add(record.saleId)}
  const review=0,latest=records[0].saleDate,salesRoute=`/launch-data/washington/sales/by-county/${CODE}.json`,detailRoute=`/launch-data/washington/counties/${CODE}.json`;
  const shard={schemaVersion:'terrafusion.washington.sales-shard.v1',generatedAt:GENERATED_AT,county:COUNTY,countyCode:CODE,summary:{records:records.length,latestSaleDate:latest,reviewRecords:review,recordsWithNeighborhoodCode:0,topNeighborhoodCodes:{}},records};
  const detail={schemaVersion:'terrafusion.washington.county-detail.v1',generatedAt:GENERATED_AT,county:COUNTY,countyCode:CODE,operationalState:{primarySourceMode:MODE,prometheusStatus:'public_data_ready'},summary:{records:records.length,latestSaleDate:latest},salesRoute};
  const statusEntry={county:COUNTY,countyCode:CODE,priority:'washington_assessor_launch',prometheusStatus:'public_data_ready',primarySourceMode:MODE,latestSaleDate:latest,candidateSales:payload.count,stagedSales:records.length,needsReview:review,confidence:{averageQualityScore:0.95,parserStatus:'ready',rawStatus:'official_taxsifter_sale_search_verified',rawDriftDetected:false},staticRoutes:{detail:detailRoute,salesShard:salesRoute}};
  const attest={algorithm:'SHA-256',canonicalJsonSha256:sha(shard),county:COUNTY,countyCode:CODE,officialSourceBaseUrl:OFFICIAL,route:salesRoute,sourcePayloadSha256:[payloadHash],sourcePosture:MODE};
  const manifestPath=join(ROOT,'manifest.json'),statusPath=join(ROOT,'counties','status.json');
  const manifest=gen(await rj(manifestPath),GENERATED_AT),status=gen(await rj(statusPath),GENERATED_AT);
  const keptAtt=manifest.salesShardAttestations.filter(e=>e.countyCode!==CODE),keptStatus=status.counties.filter(e=>e.countyCode!==CODE),shards=new Map();
  for(const a of keptAtt){const sp=join(ROOT,'sales','by-county',`${a.countyCode}.json`),dp=join(ROOT,'counties',`${a.countyCode}.json`),s=gen(await rj(sp),GENERATED_AT);await wj(sp,s);await wj(dp,gen(await rj(dp),GENERATED_AT));a.canonicalJsonSha256=sha(s);shards.set(a.countyCode,s)}
  shards.set(CODE,shard);
  status.generatedAt=GENERATED_AT;status.sourcePosture='mixed_public_assessor_sources';status.counties=[...keptStatus,statusEntry].sort((a,b)=>a.countyCode.localeCompare(b.countyCode));
  manifest.generatedAt=GENERATED_AT;manifest.sourcePosture=status.sourcePosture;manifest.statusCanonicalJsonSha256=sha(status);manifest.salesShardAttestations=[...keptAtt,attest].sort((a,b)=>a.countyCode.localeCompare(b.countyCode));
  manifest.summary={counties:status.counties.length,rawLanded:status.counties.length,parserReady:status.counties.filter(c=>c.confidence?.parserStatus==='ready').length,candidateSales:status.counties.reduce((t,c)=>t+c.candidateSales,0),stagedSales:status.counties.reduce((t,c)=>t+c.stagedSales,0),needsReview:status.counties.reduce((t,c)=>t+c.needsReview,0),prometheusNeedsReview:status.counties.filter(c=>c.prometheusStatus==='needs_review').length,recordsWithNeighborhoodCode:[...shards.values()].reduce((t,s)=>t+s.summary.recordsWithNeighborhoodCode,0),futureSaleDateRecords:[...shards.values()].reduce((t,s)=>t+s.records.filter(r=>r.flags?.futureSaleDate===true).length,0),criticalContradictions:0,garfieldExceptions:0,bentonCityAsNeighborhoodRecords:0};
  await wj(join(ROOT,'sales','by-county',`${CODE}.json`),shard);
  await wj(join(ROOT,'counties',`${CODE}.json`),detail);
  await wj(statusPath,status);
  await wj(manifestPath,manifest);
  await wj(join(ROOT,'receipts','skamania-source.json'),{schemaVersion:'terrafusion.washington.public-source-receipt.v1',county:COUNTY,countyCode:CODE,generatedAt:GENERATED_AT,sourceUrl:SEARCH,sourceFinalUrl:SEARCH,sourcePayloadPath:PAYLOAD,sourcePayloadRecords:payload.count,sourcePayloadSha256:payloadHash,candidateSales:payload.count,stagedSales:records.length,quarantinedSales:payload.count-records.length,needsReview:review,searchWindow:{start:START,end:END},pages:payload.pages,omittedFields:['owner','grantor','grantee','buyer','seller','legalDescription','geometry','map']});
  console.log(JSON.stringify({county:COUNTY,countyCode:CODE,sourcePayloadSha256:payloadHash,candidateRecords:payload.count,stagedRecords:records.length,quarantinedRecords:payload.count-records.length,reviewRecords:review,latestSaleDate:latest,manifestCanonicalJsonSha256:sha(manifest)},null,2));
}
await main();
