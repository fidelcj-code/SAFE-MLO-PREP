import { CATEGORIES } from '../data/questions.js';
export const MODES = Object.freeze(['adaptive','fresh','review']);
export const DIFFICULTIES = Object.freeze(['test-day','mixed','impossible']);
export const CAT_CODES = Object.freeze(Object.keys(CATEGORIES));
export function validateQuestionBank(bank) {
 const ids=new Set(),errors=[];
 for(const q of bank){
  if(ids.has(q.id))errors.push(`Duplicate id ${q.id}`);ids.add(q.id);
  if(!CAT_CODES.includes(q.category))errors.push(`Bad category ${q.id}`);
  if(!Array.isArray(q.choices)||q.choices.length!==4||new Set(q.choices).size!==4)errors.push(`Invalid choices ${q.id}`);
  if(!Number.isInteger(q.correct)||q.correct<0||q.correct>3)errors.push(`Invalid key ${q.id}`);
  if(!q.source?.startsWith('https://'))errors.push(`Missing source ${q.id}`);
  if(q.isMath&&(!q.steps||q.steps.length<3))errors.push(`Math steps missing ${q.id}`);
  if(!q.family||!q.prompt||!q.why)errors.push(`Missing content ${q.id}`);
 }
 return errors;
}
export function metricSummary(bank,exposures={},attempts=[]) {
 const valid=bank.filter(q=>q.status==='verified');
 const uniqueFamilies=new Set(valid.map(q=>q.family));
 const seen=new Set(Object.keys(exposures));
 const eligibleFresh=new Set(valid.filter(q=>!seen.has(q.family)).map(q=>q.family));
 const first=[];const accounted=new Set();
 for(const a of attempts){if(a.isFirst&&!accounted.has(a.family)){first.push(a);accounted.add(a.family)}}
 const accuracy=first.length?Math.round(first.filter(a=>a.correct).length/first.length*100):null;
 return {answered:new Set(attempts.map(a=>a.family)).size,fresh:eligibleFresh.size,total:uniqueFamilies.size,firstCount:first.length,firstAccuracy:accuracy,attempts:attempts.length};
}
export function byCategoryMetrics(attempts=[]) {
 const result={};for(const k of CAT_CODES)result[k]={correct:0,total:0,accuracy:null};
 const firsts=new Set();for(const a of attempts){if(!a.isFirst||firsts.has(a.family)||!result[a.category])continue;firsts.add(a.family);result[a.category].total++;if(a.correct)result[a.category].correct++}
 for(const k of CAT_CODES)result[k].accuracy=result[k].total?Math.round(result[k].correct/result[k].total*100):null;
 return result;
}
function candidatePasses(q,s){
 if(q.status!=='verified')return false;
 if(s.category&&s.category!=='ALL'&&q.category!==s.category)return false;
 if(s.difficulty==='test-day'&&q.level===3)return false;
 if(s.difficulty==='impossible'&&q.level<3)return false;
 return true;
}
function shuffle(arr,rng=Math.random){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
export function availableCounts(bank,exposures,attempts,s){
 const pool=bank.filter(q=>candidatePasses(q,s));
 const seen=new Set(Object.keys(exposures||{}));
 const missed=new Set((attempts||[]).filter(a=>!a.correct).map(a=>a.family));
 return {all:pool.length,fresh:new Set(pool.filter(q=>!seen.has(q.family)).map(q=>q.family)).size,review:new Set(pool.filter(q=>missed.has(q.family)&&seen.has(q.family)).map(q=>q.family)).size};
}
export function selectQuestions(bank,exposures={},attempts=[],settings={},rng=Math.random){
 const s={mode:'adaptive',difficulty:'mixed',math:'normal',category:'ALL',count:10,...settings};
 const requested=Math.max(1,Math.min(120,Number(s.count)||10));
 const seen=new Set(Object.keys(exposures||{}));
 const missed=new Set(attempts.filter(a=>!a.correct).map(a=>a.family));
 const base=shuffle(bank.filter(q=>candidatePasses(q,s)),rng);
 const fresh=base.filter(q=>!seen.has(q.family));
 const review=base.filter(q=>seen.has(q.family)&&missed.has(q.family));
 let chosen=[];
 const picked=new Set();
 const mathCeil=s.math==='fewer'?Math.max(1,Math.floor(requested*.10)):Math.max(1,Math.ceil(requested*.3));
 function add(pool,limit){
  if(limit<=0)return 0;let added=0;
  // Choose less-represented categories first, adjusted for the official weights.
  while(added<limit){
   let candidates=pool.filter(q=>!picked.has(q.family)&&(!q.isMath||chosen.filter(x=>x.isMath).length<mathCeil));
   if(!candidates.length)break;
   candidates.sort((a,b)=>{
    const da=chosen.filter(q=>q.category===a.category).length/(CATEGORIES[a.category].weight/100);
    const db=chosen.filter(q=>q.category===b.category).length/(CATEGORIES[b.category].weight/100);
    return da-db;
   });
   const q=candidates[0];chosen.push(q);picked.add(q.family);added++;
  }return added;
 }
 if(s.mode==='fresh')add(fresh,requested);
 else if(s.mode==='review')add(review,requested);
 else{
  const reviewTarget=Math.round(requested*.25),freshTarget=requested-reviewTarget;
  add(fresh,freshTarget);add(review,reviewTarget);
  add(fresh,requested-chosen.length);add(review,requested-chosen.length);
 }
 // In Normal math mode, include at least one when there is a suitable candidate and capacity.
 if(s.math==='normal' && chosen.length && !chosen.some(q=>q.isMath) && (s.mode!=='review')){
  const source=s.mode==='fresh'?fresh:base.filter(q=>!seen.has(q.family));
  const math=source.find(q=>q.isMath&&!picked.has(q.family));
  if(math){const remove=chosen.findIndex(q=>!q.isMath);if(remove!==-1){picked.delete(chosen[remove].family);chosen[remove]=math;picked.add(math.family)}}
 }
 const freshCount=chosen.filter(q=>!seen.has(q.family)).length;
 return {questions:shuffle(chosen,rng),requested,available:chosen.length,freshCount,reviewCount:chosen.length-freshCount,shortage:requested-chosen.length};
}
export function scoreSession(session,bank){
 const map=new Map(bank.map(q=>[q.id,q]));const total=session.questions.length;
 const answered=session.questions.filter(id=>Number.isInteger(session.answers[id]));
 const correct=answered.filter(id=>session.answers[id]===map.get(id)?.correct).length;
 const pct=total?Math.round(correct/total*100):0;
 return {total,answered:answered.length,correct,pct,passed:pct>=75};
}
export function reviewDue(exposure){if(!exposure?.lastAnsweredAt)return true;const lapses=Math.max(0,exposure?.lapses||0);const intervalHours=exposure.lastCorrect?Math.min(168,24*Math.max(1,3-lapses)):0;return Date.now()-Date.parse(exposure.lastAnsweredAt)>=intervalHours*3600000}
export function notebookPages(notes){const pages=[];let pair=[];for(const n of notes){if(n.isMath){if(pair.length)pages.push({type:'regular',notes:pair});pair=[];pages.push({type:'math',notes:[n]})}else{pair.push(n);if(pair.length===2){pages.push({type:'regular',notes:pair});pair=[]}}}if(pair.length)pages.push({type:'regular',notes:pair});return pages}
