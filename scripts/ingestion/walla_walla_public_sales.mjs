#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';

const COUNTY='Walla Walla',CODE='071',OFFICIAL='https://www.co.walla-walla.wa.us';
const MODE='public_assessor_propertyaccess_sale_search_current_year';
const SEARCH='https://propertysearch.co.walla-walla.wa.us/PropertyAccess/SaleSearch.aspx?cid=0';
const RESULTS='https://propertysearch.co.walla-walla.wa.us/PropertyAccess/SearchResultsSales.aspx?cid=0';
const PAYLOAD='walla-walla-propertyaccess-sale-search-2026-sanitized.json';
const GENERATED_AT=process.argv[2]??new Date().toISOString();
const ROOT=process.argv[3]??'frontend/apps/os-shell/public/launch-data/washington';
const START='01/01/2026';
const END='09/10/2026';
function inv(c,m){if(!c)throw new Error(m)}
function rec(v){return typeof v==='object'&&v!==null&&!Array.isArray(v)}
function canon(v){if(v===null||typeof v==='boolean'||typeof v==='string'){const s=JSON.stringify(v);if(s!==undefined)return s}if(typeof v==='number'&&Number.isFinite(v))return JSON.stringify(v);if(Array.isArray(v))return`[${v.map(canon).join(',')}]`;if(rec(v))return`{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;throw new Error('non-json value')}
function sha(v){return createHash('sha256').update(canon(v)).digest('hex')}
function ns(v){const s=String(v??'').replace(/\s+/g,' ').trim();return s&&s!=='&nbsp'?s:null}
function entity(s){return String(s??'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))).replace(/\s+/g,' ').trim()}
function strip(html){return entity(String(html).replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' '))}
function hidden(html,name){const e=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),m=html.match(new RegExp(`<input[^>]+name=["']${e}["'][^>]*>`,'i'))?.[0];return m?.match(/value=["']([^"']*)["']/i)?.[1]?.replace(/&quot;/g,'"').replace(/&amp;/g,'&')??''}
function date(v){const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(v??'').trim());inv(m,`bad Walla Walla date ${v}`);return`${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`}
function money(v){const n=Number(String(v??'').replace(/[$,\s]/g,''));return Number.isFinite(n)&&n>0?n:null}
async function get(url,cookie){const r=await fetch(url,{headers:{cookie,accept:'text/html'},redirect:'manual'});inv(r.ok,`GET ${url} HTTP ${r.status}`);return r}
async function fetchHtml(url,cookie){return await (await get(url,cookie)).text()}
async function fetchSales(){
  const first=await fetch(SEARCH,{headers:{accept:'text/html'},redirect:'manual'});
  inv(first.ok,`search HTTP ${first.status}`);
  const cookie=(first.headers.get('set-cookie')??'').split(';')[0];
  inv(cookie,'missing Walla Walla session cookie');
  const html=await first.text();
  const body=new URLSearchParams();
  for(const name of ['__VIEWSTATE','__VIEWSTATEGENERATOR','__EVENTVALIDATION']) body.set(name,hidden(html,name));
  body.set('saleSearchOptions$price_range_from','1');
  body.set('saleSearchOptions$saleDateBegin',START);
  body.set('saleSearchOptions$saleDateEnd',END);
  body.set('saleSearchOptions$search','Search');
  const post=await fetch(SEARCH,{method:'POST',headers:{cookie,referer:SEARCH,'content-type':'application/x-www-form-urlencoded'},body,redirect:'manual'});
  inv(post.status===302,`search POST expected 302 got ${post.status}`);
  const result1=new URL(post.headers.get('location')??'',SEARCH).href;
  const firstResult=await fetchHtml(result1,cookie);
  const count=Number(firstResult.match(/1\s*-\s*25\s*of\s*(\d+)/i)?.[1]);
  inv(Number.isInteger(count)&&count>0,'missing result count');
  const pages=Math.ceil(count/25), rows=[];
  for(let page=1;page<=pages;page++){
    const pageHtml=page===1?firstResult:await fetchHtml(`${RESULTS}&rtype=address&page=${page}`,cookie);
    rows.push(...parseRows(pageHtml,page));
  }
  inv(rows.length===count,`parsed row count ${rows.length} != advertised ${count}`);
  return{count,rows,search:{url:SEARCH,start:START,end:END,pages}};
}
function parseRows(html,page){
  const table=html.match(/<table[\s\S]*?<\/table>/i)?.[0];
  inv(table,`missing results table page ${page}`);
  const rows=[];
  for(const m of table.matchAll(/<tr[\s\S]*?<\/tr>/gi)){
    const cells=[...m[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>strip(x[1]));
    if(cells.length!==17||cells[3]==='Property ID')continue;
    const propertyId=ns(cells[3]), geoId=ns(cells[4]), propType=ns(cells[7]), situs=ns(cells[8]), saleDate=ns(cells[11]), salePrice=money(cells[12]), deed=ns(cells[13]), excise=ns(cells[14]);
    if(!propertyId||!geoId||!saleDate||salePrice===null)continue;
    rows.push({page,propertyId,geoId,propType,situs,saleDate:date(saleDate),salePrice,documentNumber:deed??excise,exciseNumber:excise});
  }
  return rows;
}
function map(a,i,payloadHash,genDate){
  if(a.saleDate>genDate)return null;
  const id=[CODE,a.propertyId,a.geoId,a.documentNumber,a.exciseNumber,a.saleDate,a.salePrice].map(v=>String(v??'').trim()).join('|');
  return{saleId:`WA-${CODE}-${createHash('sha256').update(id).digest('hex').slice(0,32)}`,county:COUNTY,countyCode:CODE,parcelNumber:a.geoId,saleDate:a.saleDate,saleYear:Number(a.saleDate.slice(0,4)),salePrice:a.salePrice,adjustedSalePrice:null,documentNumber:a.documentNumber,deedType:null,situsAddress:a.situs,situsCity:null,situsZip:null,useCode:a.propType,acres:null,grantor:null,grantee:null,saleNote:null,neighborhoodCode:null,currentNeighborhoodCode:null,sourceMode:MODE,candidateSource:'walla-walla-official-propertyaccess-sale-search-current-year',confidenceScore:0.95,qualityScore:0.95,qualityBand:'official_assessor_sale_search_public_record',reviewStatus:'ready',grossLivingArea:null,lotSizeSqft:null,yearBuilt:null,bedrooms:null,bathrooms:null,condition:null,qualityGrade:null,provenance:{sourceUrl:SEARCH,sourceFinalUrl:RESULTS,sourcePayloadPath:PAYLOAD,sourcePayloadSha256:payloadHash,candidateIndexSource:`${PAYLOAD}#page:${a.page}:propertyId:${a.propertyId}`,candidateRecordType:'official-propertyaccess-sale-search-row',candidateSourceOrdinal:i,componentRows:[{sourceKey:'sale-search-row',sourceUrl:SEARCH,sourcePayloadPath:PAYLOAD,sourcePayloadSha256:payloadHash,candidateIndexSource:`${PAYLOAD}#page:${a.page}:propertyId:${a.propertyId}`} ]},flags:{duplicateRisk:false,needsReview:false,futureSaleDate:false,manualException:false}};
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
  inv(records.length>0,'no stageable Walla Walla sales');
  const ids=new Set();for(const record of records){inv(!ids.has(record.saleId),`duplicate ${record.saleId}`);ids.add(record.saleId)}
  const review=0,latest=records[0].saleDate,salesRoute=`/launch-data/washington/sales/by-county/${CODE}.json`,detailRoute=`/launch-data/washington/counties/${CODE}.json`;
  const shard={schemaVersion:'terrafusion.washington.sales-shard.v1',generatedAt:GENERATED_AT,county:COUNTY,countyCode:CODE,summary:{records:records.length,latestSaleDate:latest,reviewRecords:review,recordsWithNeighborhoodCode:0,topNeighborhoodCodes:{}},records};
  const detail={schemaVersion:'terrafusion.washington.county-detail.v1',generatedAt:GENERATED_AT,county:COUNTY,countyCode:CODE,operationalState:{primarySourceMode:MODE,prometheusStatus:'public_data_ready'},summary:{records:records.length,latestSaleDate:latest},salesRoute};
  const statusEntry={county:COUNTY,countyCode:CODE,priority:'washington_assessor_launch',prometheusStatus:'public_data_ready',primarySourceMode:MODE,latestSaleDate:latest,candidateSales:payload.count,stagedSales:records.length,needsReview:review,confidence:{averageQualityScore:0.95,parserStatus:'ready',rawStatus:'official_propertyaccess_sale_search_verified',rawDriftDetected:false},staticRoutes:{detail:detailRoute,salesShard:salesRoute}};
  const attest={algorithm:'SHA-256',canonicalJsonSha256:sha(shard),county:COUNTY,countyCode:CODE,officialSourceBaseUrl:OFFICIAL,route:salesRoute,sourcePayloadSha256:[payloadHash],sourcePosture:MODE};
  const manifestPath=join(ROOT,'manifest.json'),statusPath=join(ROOT,'counties','status.json');
  const manifest=gen(await rj(manifestPath),GENERATED_AT),status=gen(await rj(statusPath),GENERATED_AT);
  const keptAtt=manifest.salesShardAttestations.filter(e=>e.countyCode!==CODE),keptStatus=status.counties.filter(e=>e.countyCode!==CODE),shards=new Map();
  for(const a of keptAtt){const sp=join(ROOT,'sales','by-county',`${a.countyCode}.json`),dp=join(ROOT,'counties',`${a.countyCode}.json`),s=gen(await rj(sp),GENERATED_AT);await wj(sp,s);await wj(dp,gen(await rj(dp),GENERATED_AT));a.canonicalJsonSha256=sha(s);shards.set(a.countyCode,s)}
  shards.set(CODE,shard);
  status.generatedAt=GENERATED_AT;status.sourcePosture='mixed_public_assessor_sources';status.counties=[...keptStatus,statusEntry].sort((a,b)=>a.countyCode.localeCompare(b.countyCode));
  manifest.generatedAt=GENERATED_AT;manifest.sourcePosture=status.sourcePosture;manifest.statusCanonicalJsonSha256=sha(status);manifest.salesShardAttestations=[...keptAtt,attest].sort((a,b)=>a.countyCode.localeCompare(b.countyCode));
  manifest.summary={counties:status.counties.length,rawLanded:status.counties.length,parserReady:status.counties.filter(c=>c.confidence?.parserStatus==='ready').length,candidateSales:status.counties.reduce((t,c)=>t+c.candidateSales,0),stagedSales:status.counties.reduce((t,c)=>t+c.stagedSales,0),needsReview:status.counties.reduce((t,c)=>t+c.needsReview,0),prometheusNeedsReview:status.counties.filter(c=>c.prometheusStatus==='needs_review').length,recordsWithNeighborhoodCode:[...shards.values()].reduce((t,s)=>t+s.summary.recordsWithNeighborhoodCode,0),futureSaleDateRecords:[...shards.values()].reduce((t,s)=>t+s.records.filter(r=>r.flags?.futureSaleDate===true).length,0),criticalContradictions:0,garfieldExceptions:0,bentonCityAsNeighborhoodRecords:0};
  await wj(join(ROOT,'sales','by-county',`${CODE}.json`),shard);await wj(join(ROOT,'counties',`${CODE}.json`),detail);await wj(statusPath,status);await wj(manifestPath,manifest);
  await wj(join(ROOT,'receipts','walla-walla-source.json'),{schemaVersion:'terrafusion.washington.public-source-receipt.v1',county:COUNTY,countyCode:CODE,generatedAt:GENERATED_AT,sourceUrl:SEARCH,sourceFinalUrl:RESULTS,sourcePayloadPath:PAYLOAD,sourcePayloadRecords:payload.count,sourcePayloadSha256:payloadHash,candidateSales:payload.count,stagedSales:records.length,quarantinedSales:payload.count-records.length,needsReview:review,searchWindow:{start:START,end:END},omittedFields:['owner','grantor','grantee','buyer','seller','legalDescription','geometry','map']});
  console.log(JSON.stringify({county:COUNTY,countyCode:CODE,sourcePayloadSha256:payloadHash,candidateRecords:payload.count,stagedRecords:records.length,quarantinedRecords:payload.count-records.length,reviewRecords:review,latestSaleDate:latest,manifestCanonicalJsonSha256:sha(manifest)},null,2));
}
await main();
