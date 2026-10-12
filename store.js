const KEY='safe-mlo-master-v1';
export const DEFAULTS={
 route:'dashboard',settings:{mode:'adaptive',difficulty:'mixed',math:'normal',category:'ALL',count:10},
 notebook:{width:190,height:260,ruleGap:8,lines:6},exposures:{},attempts:[],sessions:[],active:null,notes:[],onboarded:true
};
export function loadState(storage){
 let raw;try{storage=storage||globalThis.localStorage;raw=storage.getItem(KEY)}catch{return structuredClone(DEFAULTS)}
 if(!raw)return structuredClone(DEFAULTS);
 try{const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid state');
  return {...structuredClone(DEFAULTS),...data,settings:{...DEFAULTS.settings,...data.settings},notebook:{...DEFAULTS.notebook,...data.notebook},exposures:data.exposures&&typeof data.exposures==='object'?data.exposures:{},attempts:Array.isArray(data.attempts)?data.attempts:[],notes:Array.isArray(data.notes)?data.notes:[],sessions:Array.isArray(data.sessions)?data.sessions:[]}
 }catch{return structuredClone(DEFAULTS)}
}
export function saveState(state,storage){try{storage=storage||globalThis.localStorage;storage.setItem(KEY,JSON.stringify({...state,route:'dashboard'}));return true}catch{return false}}
export function exportData(state){return JSON.stringify({app:'SAFE MLO Master',version:1,exportedAt:new Date().toISOString(),data:state},null,2)}
export function validateImport(payload){if(!payload||payload.app!=='SAFE MLO Master'||payload.version!==1||!payload.data||!Array.isArray(payload.data.attempts)||!Array.isArray(payload.data.notes)||!payload.data.exposures||typeof payload.data.exposures!=='object')throw Error('This is not a valid SAFE MLO Master v1 backup.');return payload.data}
