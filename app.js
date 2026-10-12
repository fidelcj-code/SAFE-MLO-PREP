import {QUESTIONS,CATEGORIES,SOURCES} from '../data/questions.js';
import {selectQuestions,metricSummary,byCategoryMetrics,availableCounts,scoreSession,notebookPages} from './engine.js';
import {loadState,saveState,exportData,validateImport} from './store.js';
const app=document.getElementById('app');
let state=loadState();let toastTimer;
const QMAP=new Map(QUESTIONS.map(q=>[q.id,q]));
const HTML=(v)=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const nfmt=(n)=>Number(n||0).toLocaleString('en-US');
const newId=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`;
const icon={dashboard:'◈',practice:'✦',exam:'◷',notebook:'▤',analytics:'◉',settings:'⚙'};
const navs=[['dashboard','Dashboard'],['practice','Practice'],['exam','Simulated Exams'],['notebook','Notebook'],['analytics','Analytics'],['settings','Settings']];
function persist(){if(!saveState(state))toast('Storage could not be saved. Export a backup.',true)}
function toast(message,error=false){clearTimeout(toastTimer);document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.setAttribute('role',error?'alert':'status');el.textContent=message;document.body.append(el);toastTimer=setTimeout(()=>el.remove(),3100)}
const catText=(c)=>CATEGORIES[c]?.name||c;
const pct=(num)=>num===null||num===undefined?'—':`${num}%`;
const button=(act,title,extra='')=>`<button class="btn ${extra}" data-act="${act}">${title}</button>`;
function sectionTitle(title,sub=''){return `<div class="screen-title"><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div>`}
function layout(content){
 const nav=navs.map(([key,label])=>`<button type="button" data-route="${key}" class="${state.route===key?'active':''}" ${state.active&&(key==='practice'||key==='exam')?'':' '}><span class="symbol">${icon[key]}</span>${label}</button>`).join('');
 const mobi=navs.filter(x=>x[0]!=='analytics').map(([key,label])=>`<button data-route="${key}" class="${state.route===key?'active':''}"><span>${icon[key]}</span>${label==='Simulated Exams'?'Exams':label}</button>`).join('');
 app.innerHTML=`<aside class="sidebar"><a class="brand" href="#dashboard" data-route="dashboard"><span class="brand-icon">✧</span><span class="brand-text">SAFE MLO<br/><em>MASTER</em></span></a><nav class="nav" aria-label="Main navigation">${nav}</nav><div class="side-bottom"><strong>ORIGINAL STUDY PLATFORM</strong><p class="fineprint" style="margin-top:7px">2020 cinematic violet styling. Progress saved to this browser only.</p></div></aside><main class="main"><header class="topbar"><span>SAFE MLO MASTER <span style="color:#8b6cab">/</span> ${HTML(navs.find(n=>n[0]===state.route)?.[1]||'Dashboard')}</span><span class="top-pill">✦ PERSONAL STUDY SPACE</span></header>${content}<footer class="section fineprint">Independent educational project · Not affiliated with NMLS, CompuCram, HBO, or Netflix · Content must be reviewed for regulatory updates. <a href="${HTML(SOURCES.NMLS)}" target="_blank" rel="noopener noreferrer">Official NMLS outline ↗</a></footer></main><nav class="mobile-nav" aria-label="Mobile navigation">${mobi}</nav>`;
}
function render(){if(state.active?.type==='exam' && Date.now()>=state.active.deadlineAt){finishSession(true);return}
 const routes={dashboard:renderDashboard,practice:()=>renderSetup('practice'),exam:()=>renderSetup('exam'),notebook:renderNotebook,analytics:renderAnalytics,settings:renderSettings};
 layout((state.active&&(state.route==='practice'||state.route==='exam'))?renderSession():routes[state.route]?.()||renderDashboard());
 updateTimer();if(state.route==='notebook')validateNotebookLayout();
}
function validateNotebookLayout(){
 const affected=[];
 document.querySelectorAll('.sheet .slot').forEach((slot,i)=>{
  const overflowing=slot.scrollHeight>slot.clientHeight+2;
  slot.classList.toggle('overflowing',overflowing);
  if(overflowing)affected.push(i+1);
 });
 const banner=document.getElementById('notebook-overflow');
 if(banner){banner.hidden=affected.length===0;banner.textContent=affected.length?`${affected.length} notebook entry/entries exceed their allotted print area. Reduce their text or the ruled lines, or increase page size, before printing.`:''}
}
function renderDashboard(){
 const m=metricSummary(QUESTIONS,state.exposures,state.attempts);const cats=byCategoryMetrics(state.attempts);
 return `<section class="hero"><span class="eyebrow">YOUR PERSONAL STUDY EXPERIENCE</span><h1>Your next chapter<br/><span>starts here.</span></h1><p>Fresh questions. Real progress. Complete mastery.</p><div class="actions">${button('dash-practice','Continue Studying →','light')}${button('dash-exam','Try a Mini Exam','ghost')}</div></section>
 <section class="section"><div class="section-head"><h2>Your journey in numbers</h2><span class="chip">Starter bank · ${QUESTIONS.length} questions</span></div>
 <div class="stats"><div class="stat"><span class="stat-icon">✦</span><p class="meta">Unique Answered</p><div class="number">${nfmt(m.answered)}</div><p class="meta">Across all sessions</p></div><div class="stat"><span class="stat-icon">◈</span><p class="meta">Verified Fresh Available</p><div class="number">${nfmt(m.fresh)}</div><p class="meta">Unseen question families</p></div><div class="stat"><span class="stat-icon">◉</span><p class="meta">First-Attempt Accuracy</p><div class="number">${pct(m.firstAccuracy)}</div><p class="meta">${m.firstCount} completed first attempts</p></div></div></section>
 <section class="section"><div class="section-head"><h2>Discover your next lesson</h2><span class="muted small">Exam categories</span></div><div class="category-grid">${Object.entries(CATEGORIES).map(([key,c])=>`<button class="category-card" data-category="${key}"><span class="eyebrow">${key}</span><strong>${c.weight}%</strong><span class="cat-name">${c.name}</span><span class="tiny muted">${pct(cats[key].accuracy)} first-attempt</span></button>`).join('')}</div></section>
 <section class="section two-col"><div class="panel"><h3>Designed around how you learn</h3><p class="muted small" style="margin-bottom:18px">Adaptive question selection is active by default, with Fresh Only and Review Missed whenever you need them.</p><div class="actions">${button('dash-practice','Explore Practice','primary')}${button('dash-notebook','Open Notebook','ghost')}</div></div><div class="panel"><h3>Your examination blueprint</h3><p class="small muted">120 total · 115 scored · 5 unscored · 190 minutes · 75% passing standard.</p><div class="divider"></div><p class="small muted">This version includes shorter <b>all-scored mini-exams</b>, not a misleading 120-question simulation with insufficient unique content.</p></div></section>`;
}
function modeCards(){return `<div class="mode-grid" role="group" aria-label="Question selection mode">${[['fresh','✦','Fresh Only','Unseen questions. No repeats across sessions.'],['review','↺','Review Missed','Revisit mistakes and reinforce knowledge.'],['adaptive','◈','Adaptive','Fresh questions plus intentional review.']].map(([key,emoji,label,desc])=>`<button class="mode-card ${state.settings.mode===key?'active':''}" data-mode="${key}" aria-pressed="${state.settings.mode===key}"><span style="font-size:1.45rem;color:#eba7f4">${emoji}</span><strong>${label} ${key==='adaptive'?'<span class="badge">DEFAULT</span>':''}</strong><span class="mode-description">${desc}</span></button>`).join('')}</div>`}
function renderSetup(type){const s=state.settings;const counts=availableCounts(QUESTIONS,state.exposures,state.attempts,s);const previous=state.sessions.filter(x=>x.type===type).slice(-3).reverse();const max=Math.min(30,QUESTIONS.length);
 return `${sectionTitle(type==='exam'?'Simulated Exams':'Practice Questions',type==='exam'?'Focused timed mini-exams with review only after submission.':'Build true mastery with fresh challenges and intentional review.')}
 ${type==='exam'?`<div class="notice warn">This starter bank has ${QUESTIONS.length} original questions. Full-length 120-question official-style simulations are <b>not available yet</b>. The mini-exams below are practice tools; every question counts toward the mini-exam score.</div>`:''}
 <section class="section" style="margin-top:18px"><div class="section-head"><h2>Choose your question experience</h2></div>${modeCards()}</section>
 <section class="section"><div class="panel"><h3>Customize your session</h3><div class="field-grid">
 <label class="field">Number of questions<select data-setting="count">${[5,10,15,20,25,30].map(n=>`<option value="${n}" ${Number(s.count)===n?'selected':''}>${n} questions</option>`).join('')}</select></label>
 <label class="field">Question style<select data-setting="difficulty"><option value="test-day" ${s.difficulty==='test-day'?'selected':''}>Test Day</option><option value="mixed" ${s.difficulty==='mixed'?'selected':''}>Mixed</option><option value="impossible" ${s.difficulty==='impossible'?'selected':''}>Impossible</option></select></label>
 <label class="field">Mathematics<select data-setting="math"><option value="normal" ${s.math==='normal'?'selected':''}>Normal</option><option value="fewer" ${s.math==='fewer'?'selected':''}>Fewer</option></select></label>
 <label class="field">NMLS category<select data-setting="category"><option value="ALL" ${s.category==='ALL'?'selected':''}>All 5 categories</option>${Object.entries(CATEGORIES).map(([k,c])=>`<option value="${k}" ${s.category===k?'selected':''}>${k} — ${c.name}</option>`).join('')}</select></label>
 </div><div class="divider"></div><div class="kpi-row"><span class="chip">✦ ${counts.fresh} fresh eligible</span><span class="chip">↺ ${counts.review} missed eligible</span><span class="chip">▤ ${counts.all} in filtered bank</span></div>
 <div class="notice" style="margin-top:17px">Adaptive targets approximately 75% fresh and 25% review, depending on availability. Test Day approximates standard difficulty; Impossible contains our hardest scenarios. The official exam does not publish a fixed number of math questions.</div>
 <div class="actions" style="margin-top:18px">${button('start-'+type,type==='exam'?'Start Timed Mini-Exam →':'Start Practice →','primary')}</div></div></section>
 ${previous.length?`<section class="section"><h3>Recent sessions</h3><div class="panel">${previous.map(x=>`<div class="review-row"><div class="left"><b>${x.type==='exam'?'Mini exam':'Practice'} · ${x.total} questions</b><p>${new Date(x.endedAt).toLocaleString()}</p></div><span class="chip">${x.pct}%</span></div>`).join('')}</div></section>`:''}`;
}
function currentSession(){return state.active}
function renderSession(){const s=currentSession();if(!s)return renderSetup(state.route);
 const q=QMAP.get(s.questions[s.cursor]);if(!q){return `<div class="notice warn">This session contains a question that is unavailable. ${button('leave-session','Return to setup')}</div>`}
 const choice=s.answers[q.id],revealed=s.type==='practice'&&s.revealed[q.id];
 const isExam=s.type==='exam';const answered=Object.keys(s.answers).length;
 return `<div class="question-head"><div><span class="eyebrow">${isExam?'TIMED MINI-EXAM':'FOCUSED PRACTICE'}</span><h2 style="margin-top:9px">Question ${s.cursor+1} <span class="muted">of ${s.questions.length}</span></h2></div><div class="actions"><span class="chip">${HTML(q.category)} · ${HTML(q.topic)}</span>${isExam?'<span class="chip pink" id="timer" role="timer">⏱ --:--</span>':''}</div></div>
 <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(answered/s.questions.length*100)}"><div class="progress-fill" style="width:${Math.round(answered/s.questions.length*100)}%"></div></div>
 <section class="panel"><div class="question-head"><div class="actions"><span class="chip">${q.isMath?'✎ Mathematics':'◈ Concept'}</span><span class="chip">${HTML(q.topic)}</span></div><button data-act="flag" class="btn sm ghost" aria-pressed="${s.flags.includes(q.id)}">${s.flags.includes(q.id)?'⚑ Flagged':'⚐ Flag for review'}</button></div>
 <p class="question-body">${HTML(q.prompt)}</p><div class="choices">${q.choices.map((c,i)=>{const selected=choice===i;const cls=revealed?(i===q.correct?'correct':selected?'incorrect':''):selected?'selected':'';return `<button class="choice ${cls}" ${revealed?'disabled':''} data-choice="${i}" aria-pressed="${selected}" type="button"><span class="letter">${'ABCD'[i]}</span><span>${HTML(c)}</span></button>`}).join('')}</div>
 ${revealed?`<div class="divider"></div><div class="notice ${choice===q.correct?'success':'warn'}">${choice===q.correct?'Correct — excellent.':'Not quite. The correct answer is '+('ABCD'[q.correct])+'.'}</div><div class="explanation" style="margin-top:13px">${explanationHTML(q)}</div><div class="actions" style="margin-top:14px">${button('save-current-note','＋ Save to Notebook','ghost')}</div>`:''}
 <div class="question-footer"><div class="actions">${button('previous','← Previous','ghost')}${button('next','Next →', 'ghost')}</div><div class="actions">${button('end-session',isExam?'Submit Exam':'Finish Practice',isExam?'primary':'ghost')}</div></div></section>
 <section class="panel"><div class="section-head"><h3>Question Navigator</h3><span class="small muted">${answered}/${s.questions.length} answered · ${s.flags.length} flagged</span></div><div class="exam-numbers">${s.questions.map((id,i)=>`<button data-jump="${i}" class="${i===s.cursor?'current':''} ${Number.isInteger(s.answers[id])?'answered':''} ${s.flags.includes(id)?'flagged':''}" aria-label="Go to question ${i+1}">${i+1}</button>`).join('')}</div></section>`;
}
function explanationHTML(q){return [['Correct Answer',`${'ABCD'[q.correct]}. ${q.choices[q.correct]}`],['Key Definition',q.definition],['Why',q.why],['Trap',q.choiceReasons.map((r,i)=>`${'ABCD'[i]}: ${r}`).join('  ·  ')],['Exam Trigger',q.trigger],['Memory',q.memory],...(q.isMath?[['Solve By Hand',q.steps.map((line,i)=>`${i+1}. ${line}`).join('\n')]]:[])].map(([k,v])=>`<div class="expl-row"><b>${HTML(k)}</b><p style="white-space:pre-wrap">${HTML(v)}</p></div>`).join('')+`<p class="fineprint">Reference for further review: <a href="${HTML(q.source)}" rel="noopener noreferrer" target="_blank">Open regulatory/topic source ↗</a></p>`}
function finishedSessionHTML(){return ''}
function renderAnalytics(){const m=metricSummary(QUESTIONS,state.exposures,state.attempts);const metrics=byCategoryMetrics(state.attempts);const sessions=state.sessions.slice(-12).reverse();
 return `${sectionTitle('Progress & Analytics','First-attempt knowledge is tracked separately from memorized review questions.')}
 <div class="stats"><div class="stat"><p class="meta">Unique answered</p><div class="number">${m.answered}</div></div><div class="stat"><p class="meta">Verified fresh available</p><div class="number">${m.fresh}</div></div><div class="stat"><p class="meta">First-attempt accuracy</p><div class="number">${pct(m.firstAccuracy)}</div></div></div>
 <section class="section two-col"><div class="panel"><h3>Knowledge by category</h3><div class="category-progress">${Object.entries(CATEGORIES).map(([k,c])=>`<div><div class="line"><span>${k} · ${c.name}</span><span>${metrics[k].total} first tries · ${pct(metrics[k].accuracy)}</span></div><div class="progress-track"><div class="progress-fill" style="width:${metrics[k].accuracy??0}%"></div></div></div>`).join('')}</div></div><div class="panel"><h3>Readiness</h3><div class="number" style="font-family:var(--sans);font-weight:900;font-size:1.5rem;color:#d4a5ff;margin:17px 0">${m.firstCount<20?'Collecting evidence':m.firstAccuracy>=85?'Practice-Test Ready':m.firstAccuracy>=75?'Approaching Readiness':'Developing'}</div><p class="muted small">${m.firstCount<20?'Complete at least 20 unseen first attempts to receive a preliminary classification.':'Preliminary classification based on this limited question bank, not a validated probability of passing.'}</p><div class="divider"></div><p class="fineprint">Thresholds are illustrative: Developing &lt;75%; Approaching 75–84%; Practice-Test Ready ≥85% with at least 20 fresh attempts. Coverage and full-length scores are not yet validated.</p></div></section>
 <section class="section"><h3>Recent results</h3>${sessions.length?`<div class="panel"><table class="table"><thead><tr><th>Date</th><th>Type</th><th>Mode</th><th>Score</th></tr></thead><tbody>${sessions.map(s=>`<tr><td>${new Date(s.endedAt).toLocaleDateString()}</td><td>${s.type==='exam'?'Mini exam':'Practice'}</td><td>${HTML(s.mode)}</td><td>${s.correct}/${s.total} · ${s.pct}%</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Finish a practice set or mini-exam to see your progress.</div>'}</section>`;
}
function notesForNotebook(){return state.notes.slice()}
function notePreviewText(n){return n.content||''}
function renderSheetNote(n){if(!n)return `<div class="slot"><div class="slot-title" style="color:#9d86a5">NEXT QUESTION · blank space</div><div class="ruled"><span class="line-label">Writing area</span></div></div>`;
 return `<div class="slot"><div class="slot-title">${HTML(n.title)}</div><div class="slot-text">${HTML(notePreviewText(n))}</div>${n.isMath&&n.steps?.length?`<div class="slot-text" style="margin-top:3mm;font-weight:700">HAND CALCULATION</div><div class="slot-text">${HTML(n.steps.map((s,i)=>`${i+1}. ${s}`).join('\n'))}</div>`:''}<div class="ruled"><span class="line-label">${state.notebook.lines} ruled lines</span></div></div>`;
}
function renderNotebook(){const n=state.notebook,notes=notesForNotebook(),pages=notebookPages(notes);
 const settingsField=(name,label,min,max,unit)=>`<label class="field">${label}<input type="number" min="${min}" max="${max}" step="1" data-notebook="${name}" value="${n[name]}"><span class="tiny muted">${unit}</span></label>`;
 return `${sectionTitle('Your Digital Notebook','Two standard notes per page; mathematics gets its own dedicated hand-solution page.')}
 <div class="panel"><div class="section-head"><h3>Notebook settings</h3><div class="actions">${button('new-note','＋ Add Manual Note','primary')}${button('print-notebook','Print / Save PDF','ghost')}</div></div><div class="notebook-toolbar">${settingsField('width','Page width',120,220,'millimeters')}${settingsField('height','Page height',180,310,'millimeters')}${settingsField('ruleGap','Line spacing',5,15,'millimeters')}${settingsField('lines','Ruled lines',0,18,'per note')}</div><div id="notebook-overflow" class="notice warn" hidden style="margin-top:12px"></div><p class="fineprint" style="margin-top:12px">For accurate output, choose matching paper settings in your browser print dialog and turn off header/footer options. Long notes may need shortening to maintain the exact page layout.</p></div>
 <section class="section two-col"><div class="panel"><div class="section-head"><h3>Saved entries (${notes.length})</h3></div>${notes.length?notes.map((note,i)=>`<div class="review-row"><div class="left"><b>${HTML(note.title)}</b><p>${note.isMath?'Dedicated math page':'Standard question note'} · ${HTML(note.category||'Personal')}</p></div><div class="actions"><button class="btn sm" data-edit-note="${HTML(note.id)}">Edit</button><button class="btn sm danger" data-delete-note="${HTML(note.id)}">Delete</button></div></div>`).join(''):'<div class="empty"><h3>No notes yet</h3><p>After you answer a practice question, save its explanation here—or write your own note.</p></div>'}</div><div class="panel"><h3>Page layout rules</h3><p class="muted small">Standard entries are paired in two equal slots. Math questions use a single full page with formula, calculation steps, and ruled space to solve by hand.</p><div class="divider"></div><p class="small muted">${pages.length} print page${pages.length===1?'':'s'} prepared.</p></div></section>
 ${pages.length?`<section class="section"><div class="section-head"><h2>Live print preview</h2><span class="chip">${pages.length} pages</span></div><div class="notebook-pages">${pages.map((page,i)=>`<article class="sheet ${page.type==='math'?'math':''}" style="--page-w:${n.width}mm;--page-h:${n.height}mm;--rule-gap:${n.ruleGap}mm;--rule-height:${n.ruleGap*n.lines}mm"><div class="sheet-header"><span>SAFE MLO MASTER · ${page.type==='math'?'MATH WORKSHEET':'STUDY NOTEBOOK'}</span><span>${i+1} / ${pages.length}</span></div>${page.type==='math'?renderSheetNote(page.notes[0]):renderSheetNote(page.notes[0])+renderSheetNote(page.notes[1])}<div class="sheet-footer">Progress is made one concept at a time.</div></article>`).join('')}</div></section>`:'<div class="notice" style="margin-top:18px">Your notebook preview will appear here when you save your first entry.</div>'}`;
}
function renderSettings(){return `${sectionTitle('Settings & Backup','Your work is stored locally on this device and browser. Export backups regularly.')}
 <div class="panel"><h3>Data portability</h3><p class="muted small" style="margin:10px 0 18px">Download your attempts, questions seen, session history, settings, and notebook as JSON. You can restore the backup on another device.</p><div class="data-actions">${button('export-data','↓ Export JSON Backup','primary')}<label class="btn ghost">↑ Import JSON Backup<input id="import-file" type="file" accept=".json,application/json" hidden></label>${button('clear-data','Reset All Local Progress','danger')}</div></div>
 <div class="panel"><h3>Application information</h3><p class="muted small">Version 0.1.0 · ${QUESTIONS.length} source-linked starter questions · Local browser storage · No account or server synchronization.</p><div class="divider"></div><p class="muted small">Netflix Sans is proprietary. This app uses licensed/open alternatives (Montserrat and Inter) rather than distributing Netflix Sans. Original HBO Max 2020 styling is used only as visual inspiration, with independent branding and no protected imagery.</p></div>
 <div class="notice warn" style="margin-top:15px">Regulatory requirements change. Always confirm official NMLS and CFPB requirements before relying on legal statements in the study bank. This is not an official exam or verified pass predictor.</div>`}
function exposeQuestions(questions){const time=new Date().toISOString();for(const q of questions){if(!state.exposures[q.family])state.exposures[q.family]={firstSeenAt:time,seenIds:[q.id],exposureCount:1,firstCorrect:null,firstAnsweredAt:null,lastAnsweredAt:null,lapses:0};else{const e=state.exposures[q.family];e.exposureCount=(e.exposureCount||0)+1;e.seenIds=[...new Set([...(e.seenIds||[]),q.id])]}}}
function startSession(type){if(state.active){if(!confirm('Replace your unfinished session? Its unanswered questions will stay marked as seen.'))return}
 const request={...state.settings};const selected=selectQuestions(QUESTIONS,state.exposures,state.attempts,request);
 if(!selected.questions.length){toast('No eligible questions. Try another mode or category.',true);return}
 if(selected.shortage>0&&!confirm(`Only ${selected.available} of ${selected.requested} eligible questions are available. Start a shorter set with no hidden repeats?`))return;
 const active={id:newId(),type,mode:request.mode,math:request.math,difficulty:request.difficulty,startedAt:new Date().toISOString(),deadlineAt:type==='exam'?Date.now()+Math.round(selected.questions.length/120*190*60000):null,questions:selected.questions.map(q=>q.id),freshIds:selected.questions.filter(q=>!state.exposures[q.family]).map(q=>q.id),answers:{},revealed:{},cursor:0,flags:[],done:false};
 exposeQuestions(selected.questions);state.active=active;state.route=type;persist();render();toast(`Started: ${selected.freshCount} fresh · ${selected.reviewCount} review`);
}
function recordAttempt(q,chosen,s){const prior=state.attempts.some(a=>a.family===q.family);const correct=chosen===q.correct;
 state.attempts.push({id:newId(),questionId:q.id,family:q.family,category:q.category,isMath:q.isMath,selected:chosen,correct,isFirst:!prior,wasFreshAtStart:s.freshIds.includes(q.id),sessionId:s.id,mode:s.mode,answeredAt:new Date().toISOString()});
 const e=state.exposures[q.family];e.lastAnsweredAt=new Date().toISOString();e.lastCorrect=correct;if(!correct)e.lapses=(e.lapses||0)+1;
 if(!prior){e.firstCorrect=correct;e.firstAnsweredAt=e.lastAnsweredAt}
}
function selectAnswer(index){const s=currentSession();if(!s)return;const q=QMAP.get(s.questions[s.cursor]);if(!q)return;
 if(s.type==='practice'&&s.revealed[q.id])return;
 if(s.type==='exam'){s.answers[q.id]=index}
 else{s.answers[q.id]=index;s.revealed[q.id]=true;recordAttempt(q,index,s)}
 persist();render();}
function finishSession(expired=false){const s=currentSession();if(!s)return;
 if(s.type==='exam'&&!expired){const missing=s.questions.length-Object.keys(s.answers).length;if(missing&& !confirm(`Submit with ${missing} unanswered questions? They will count as incorrect.`))return}
 if(s.type==='exam'){for(const id of s.questions){if(Number.isInteger(s.answers[id]))recordAttempt(QMAP.get(id),s.answers[id],s)}}
 const r=scoreSession(s,QUESTIONS);state.sessions.push({id:s.id,type:s.type,mode:s.mode,startedAt:s.startedAt,endedAt:new Date().toISOString(),...r});state.sessions=state.sessions.slice(-150);
 state.active=null;state.route='analytics';persist();render();
 const div=document.createElement('div');div.className='modal-backdrop';div.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-label="Study session results"><span class="eyebrow">SESSION COMPLETE</span><h2 style="margin-top:10px">${expired?'Time expired.':'Your results are in.'}</h2><div class="number" style="font-size:2.6rem;font-weight:900;color:#f4abf3;margin:20px 0">${r.pct}%</div><p>${r.correct} correct out of ${r.total} questions. ${r.total-r.answered} unanswered. ${s.type==='exam'?'This is a mini-exam practice score, not an official SAFE MLO score.':'Review your learning progress in Analytics.'}</p><div class="modal-actions"><button class="btn primary" data-act="close-modal">See My Analytics →</button></div></div>`;document.body.append(div);
}
function createNoteFromQuestion(){const s=currentSession();if(!s)return;const q=QMAP.get(s.questions[s.cursor]);if(!s.revealed[q.id]){toast('Answer the practice question before saving a note.',true);return}
 if(state.notes.some(n=>n.questionId===q.id)){toast('Already saved to your notebook.');return}
 const content=`${q.prompt}\n${q.choices.map((v,i)=>`${'ABCD'[i]}. ${v}`).join('  ')}\nCorrect: ${'ABCD'[q.correct]}. ${q.choices[q.correct]}\nRule: ${q.definition}\nTrap: ${q.choiceReasons.filter((_,i)=>i!==q.correct)[0]}\nTrigger: ${q.trigger}\nMemory: ${q.memory}`;
 state.notes.push({id:newId(),questionId:q.id,title:`${q.id} · ${q.topic}`,category:q.category,isMath:q.isMath,content:q.isMath?`Question: ${q.prompt}\nCorrect: ${q.choices[q.correct]}\nFormula: ${q.definition}\nMemory: ${q.memory}`:content,steps:[...q.steps],createdAt:new Date().toISOString()});persist();toast('Saved to notebook.');}
function showNoteEditor(id){const old=id?state.notes.find(n=>n.id===id):null;const modal=document.createElement('div');modal.className='modal-backdrop';modal.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-label="Notebook note editor"><h2>${old?'Edit entry':'New notebook entry'}</h2><div class="field" style="margin:16px 0"><label for="note-title">Title</label><input id="note-title" value="${HTML(old?.title||'My Study Note')}" maxlength="160"></div><div class="field"><label for="note-content">Note content</label><textarea id="note-content" rows="11" maxlength="6000">${HTML(old?.content||'')}</textarea></div><label class="check" style="margin-top:13px"><input id="note-math" type="checkbox" ${old?.isMath?'checked':''}> Dedicated mathematics page</label><div class="modal-actions" style="margin-top:20px"><button class="btn ghost" data-act="close-modal">Cancel</button><button class="btn primary" data-act="confirm-note" data-note-id="${HTML(id||'')}">Save Note</button></div></div>`;document.body.append(modal);modal.querySelector('#note-title').focus()}
function downloadFile(name,text,type){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function notebookConfig(key,value){const limits={width:[120,220],height:[180,310],ruleGap:[5,15],lines:[0,18]};const n=Number(value);if(!Number.isFinite(n)){toast('Enter a valid number.',true);return}const [min,max]=limits[key];state.notebook[key]=Math.max(min,Math.min(max,Math.round(n)));persist();render()}
function navigate(route){document.querySelector('.modal-backdrop')?.remove();state.route=route;persist();render();window.scrollTo(0,0)}
function updateTimer(){const el=document.querySelector('#timer'),s=state.active;if(!el||!s||s.type!=='exam')return;const sec=Math.max(0,Math.ceil((s.deadlineAt-Date.now())/1000));el.textContent=`⏱ ${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;if(sec===0)finishSession(true)}
setInterval(updateTimer,1000);
document.addEventListener('click',e=>{
 const link=e.target.closest('[data-route]');if(link){e.preventDefault();navigate(link.dataset.route);return}
 const cat=e.target.closest('[data-category]');if(cat){state.settings.category=cat.dataset.category;navigate('practice');return}
 const mode=e.target.closest('[data-mode]');if(mode){state.settings.mode=mode.dataset.mode;persist();render();return}
 const choice=e.target.closest('[data-choice]');if(choice){selectAnswer(Number(choice.dataset.choice));return}
 const jump=e.target.closest('[data-jump]');if(jump&&state.active){state.active.cursor=Number(jump.dataset.jump);persist();render();return}
 const edit=e.target.closest('[data-edit-note]');if(edit){showNoteEditor(edit.dataset.editNote);return}
 const remove=e.target.closest('[data-delete-note]');if(remove){if(confirm('Delete this notebook entry?')){state.notes=state.notes.filter(x=>x.id!==remove.dataset.deleteNote);persist();render()}return}
 const act=e.target.closest('[data-act]');if(!act)return;const a=act.dataset.act;const s=currentSession();
 switch(a){
 case 'dash-practice':navigate('practice');break;case 'dash-exam':navigate('exam');break;case 'dash-notebook':navigate('notebook');break;
 case 'start-practice':startSession('practice');break;case 'start-exam':startSession('exam');break;
 case 'next':if(s){s.cursor=Math.min(s.questions.length-1,s.cursor+1);persist();render()}break;
 case 'previous':if(s){s.cursor=Math.max(0,s.cursor-1);persist();render()}break;
 case 'flag':if(s){const id=s.questions[s.cursor];s.flags=s.flags.includes(id)?s.flags.filter(x=>x!==id):[...s.flags,id];persist();render()}break;
 case 'end-session':finishSession();break;
 case 'leave-session':state.active=null;persist();render();break;
 case 'save-current-note':createNoteFromQuestion();break;
 case 'new-note':showNoteEditor(null);break;
 case 'print-notebook':if(!state.notes.length){toast('Add a note before printing.',true);return}validateNotebookLayout();if(document.querySelector('.sheet .slot.overflowing')){toast('Adjust overflowing notes or line counts before printing.',true);return}window.print();break;
 case 'close-modal':document.querySelector('.modal-backdrop')?.remove();break;
 case 'confirm-note':{
  const title=document.getElementById('note-title')?.value.trim();const content=document.getElementById('note-content')?.value.trim();const isMath=document.getElementById('note-math')?.checked;
  if(!title||!content){toast('Title and content are required.',true);return}
  const id=act.dataset.noteId;let note=state.notes.find(n=>n.id===id);
  if(note){note.title=title;note.content=content;note.isMath=isMath}
  else state.notes.push({id:newId(),title,content,isMath,category:'Personal',steps:[],createdAt:new Date().toISOString()});
  persist();document.querySelector('.modal-backdrop')?.remove();render();toast('Note saved.');break}
 case 'export-data':downloadFile(`safe-mlo-master-backup-${new Date().toISOString().slice(0,10)}.json`,exportData(state),'application/json');break;
 case 'clear-data':if(confirm('Permanently erase ALL progress and saved notebook entries in this browser? Export a backup first.')){state=loadState({getItem(){return null}});persist();render();toast('Local progress reset.')}break;
 }
});
document.addEventListener('change',async e=>{
 const setting=e.target.closest('[data-setting]');if(setting){const key=setting.dataset.setting;state.settings[key]=key==='count'?Number(setting.value):setting.value;persist();render();return}
 const notebook=e.target.closest('[data-notebook]');if(notebook){notebookConfig(notebook.dataset.notebook,notebook.value);return}
 if(e.target.id==='import-file'){const file=e.target.files?.[0];if(!file)return;try{const payload=JSON.parse(await file.text());const restored=validateImport(payload);if(!confirm('Replace ALL local progress with this backup?'))return;state={...loadState({getItem(){return null}}),...restored,route:'dashboard'};persist();render();toast('Backup imported.')}catch(error){toast(error.message||'Could not import backup.',true)}}
});
window.addEventListener('hashchange',()=>{const hash=window.location.hash.slice(1);if(navs.some(([r])=>r===hash)){state.route=hash;render()}});
if(location.hash&&navs.some(([r])=>r===location.hash.slice(1)))state.route=location.hash.slice(1);
render();
