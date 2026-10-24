/*!
 * Filòs — © 2026 i titolari del progetto Filòs. Tutti i diritti riservati.
 * Codice e contenuti sono opere protette dalla legge sul diritto d'autore (L. 633/1941).
 * È vietata qualsiasi copia, riproduzione, modifica o ridistribuzione senza autorizzazione scritta.
 */
// ══════════════════════════════════════════
// QUANTO VALE? — A DISTANZA
// Stesso funzionamento degli altri giochi a domande a distanza (Anno giusto, Prima o dopo, Bandiere):
// sfida con notifica, sala d'attesa, 30 secondi per rispondere, 20 di risultati, spareggio se si è pari.
//  rooms/{code}/qx/players/{nome} = {n,t}
//  rooms/{code}/qx/meta = {phase, order, game, qs, q, rv, end, main, tbp, tbs}
//  rooms/{code}/qx/left/{nome} = true
//  rooms/{code}/qx/g{game}/a{q}/{nome} = {v:numero,t}
// Le domande sono indici dell'elenco QUANTO VALE? (stesso ordine in tutte le lingue).
// ══════════════════════════════════════════
var QXR_Q_MS=RL_ANS_MS; // tempo per rispondere a ogni domanda
var QXR_MAX_PLAYERS=8,QXR_ROUNDS=10,QXR_FORCE_MS=45000;
var QXR={code:null,me:null,data:null,unsub:null,sig:"",val:null,valKey:"",busy:false,closed:false};

function qxrPath(p){return "rooms/"+QXR.code+"/qx"+(p?"/"+p:"");}

// ── Stato derivato ──
function qxrState(){
 var d=QXR.data||{};var meta=d.meta||{phase:"lobby",order:[],game:1};
 var players=Object.keys(d.players||{}).sort(function(a,b){return (d.players[a].t||0)-(d.players[b].t||0);}).map(function(k){return d.players[k].n||k;});
 var left=d.left||{};
 var isLeft=function(n){return !!left[cdrKey(n)];};
 var lobby=players.filter(function(n){return !isLeft(n);});
 var order=meta.order||[];
 var active=order.filter(function(n){return !isLeft(n);});
 var phase=meta.phase||"lobby";
 var game=meta.game||1;
 var qs=meta.qs||[];
 var q=Math.max(0,Math.min(meta.q||0,Math.max(0,qs.length-1)));
 var gd=d["g"+game]||{};
 var data=(typeof QUANTO_VALE_DATA!=="undefined")?QUANTO_VALE_DATA:[];
 function answersOf(r){
  var raw=gd["a"+r]||{};var out={};
  order.forEach(function(n){var a=raw[cdrKey(n)];if(a&&(a.skip||typeof a.v==="number"))out[n]=a;});
  return out;
 }
 var cur=answersOf(q);
 var elig=rlElig(meta,active,q);
 var allIn=elig.length>0&&elig.every(function(n){return !!cur[n];});
 var rvMap=d.rv||{};
 var reveal=phase==="play"&&(allIn||meta.rv===q||!!rvMap[game+"_"+q]);
 // Punteggi: un punto a chi si avvicina di più (a pari distanza, a tutti i più vicini)
 var scores={};order.forEach(function(n){scores[n]=0;});
 var rounds=[];
 var lastScored=phase==="play"?(reveal?q:q-1):-1;
 for(var r=0;r<=lastScored;r++){
  var item=data[qs[r]];if(!item)continue;
  var ans=answersOf(r);var best=null;
  order.forEach(function(n){var a=ans[n];if(a&&!a.skip){var df=Math.abs(a.v-item.risposta);if(best===null||df<best)best=df;}});
  var winners=[];
  if(best!==null)order.forEach(function(n){var a=ans[n];if(a&&!a.skip&&Math.abs(a.v-item.risposta)===best){scores[n]++;winners.push(n);}});
  rounds.push({answers:ans,best:best,winners:winners});
 }
 var ended=false,interrupted=false;
 if(phase==="play"){
  if(meta.end)ended=true;
  else if(active.length<2){ended=true;interrupted=true;}
  else if(rlBlock(meta,q)&&elig.length<2)ended=true;
 }
 var leader=(phase==="lobby"?lobby:active.length?active:lobby)[0]||null;
 return {meta:meta,phase:phase,players:players,lobby:lobby,order:order,active:active,isLeft:isLeft,game:game,qs:qs,q:q,cur:cur,allIn:allIn,reveal:reveal,scores:scores,rounds:rounds,ended:ended,interrupted:interrupted,leader:leader,last:q>=qs.length-1,elig:elig,rt:(reveal?rlRevealAt(meta,cur,elig,allIn):0),main:rlMain(meta)};
}
function qxrQuestion(idx){var l=(typeof qvData==="function")?qvData():[];return l[idx]||(typeof QUANTO_VALE_DATA!=="undefined"?QUANTO_VALE_DATA[idx]:null);}
function qxrCount(){return (typeof QUANTO_VALE_DATA!=="undefined")?QUANTO_VALE_DATA.length:0;}
// 10 domande mai uscite (su questo telefono) e una riserva di altre domande per gli spareggi
function qxrRoundData(){
 var all=[];for(var i=0;i<qxrCount();i++)all.push(i);
 var qs=freshPick("r_qv",all,QXR_ROUNDS);
 var tbp=freshPick("r_qv",all,12,qs);
 return {qs:qs,main:qs.length,tbp:tbp};
}
function qxrNum(v){return Number(v).toLocaleString(LANG==="en"?"en-US":LANG==="es"?"es-ES":"it-IT");}
function qxrStep(q){return Math.max(1,Math.round((q.max-q.min)/200));}
// ── Stanza: crea, entra, esci ──
function qxrCreate(done){
 cdrStrings();qxrStrings();
 if(!fbDB){done(false,T("firebaseErr"));return;}
 var tries=0;
 (function attempt(){
  tries++;var code=String(Math.floor(1000+Math.random()*9000));
  cdrNet(fbGet(fbRef(fbDB,"rooms/"+code))).then(function(snap){
   if(snap.exists()&&tries<8){attempt();return;}
   var me=cdrMyName();var now=Date.now();
   var room={created:now,kind:"qvx",qx:{meta:{phase:"lobby",order:[],game:1},players:{}}};
   room.qx.players[cdrKey(me)]={n:me,t:now};
   cdrNet(fbSet(fbRef(fbDB,"rooms/"+code),room)).then(function(){qxrAttach(code,me);done(true);}).catch(function(){done(false,T("connErr"));});
  }).catch(function(){done(false,T("connErr"));});
 })();
}
function qxrJoin(code,done){
 cdrStrings();qxrStrings();
 if(!fbDB){done(false,T("firebaseErr"));return;}
 code=String(code||"").replace(/\D/g,"");
 if(code.length!==4){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
 cdrNet(fbGet(fbRef(fbDB,"rooms/"+code+"/qx"))).then(function(snap){
  if(!snap.exists()){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
  var d=snap.val()||{};var meta=d.meta||{};
  if(meta.phase&&meta.phase!=="lobby"){done(false,T("cdrAlreadyStarted"));return;}
  var left=d.left||{};
  var taken=Object.keys(d.players||{}).filter(function(k){return !left[k];}).map(function(k){return d.players[k].n||k;});
  if(!taken.length){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
  if(taken.length>=QXR_MAX_PLAYERS){done(false,T("qxrRoomFull"));return;}
  var me=cdrUniqueName(cdrMyName(),taken);var k=cdrKey(me);
  var clearLeft=left[k]?cdrNet(fbSet(fbRef(fbDB,"rooms/"+code+"/qx/left/"+k),null)):Promise.resolve();
  clearLeft.then(function(){return cdrNet(fbSet(fbRef(fbDB,"rooms/"+code+"/qx/players/"+k),{n:me,t:Date.now()}));}).then(function(){qxrAttach(code,me);done(true);}).catch(function(){done(false,T("connErr"));});
 }).catch(function(){done(false,T("connErr"));});
}
function qxrAttach(code,me){
 qxrDetach();
 QXR.code=code;QXR.me=me;QXR.data=null;QXR.sig="";QXR.val=null;QXR.valKey="";QXR.closed=false;QXR.busy=false;
 QXR.unsub=fbOnValue(fbRef(fbDB,"rooms/"+code+"/qx"),function(snap){
  var v=snap.val();
  if(!v){QXR.closed=true;QXR.data=null;}else{QXR.data=v;}
  if(S.screen==="qxr")qxrRender(false);
 });
}
function qxrDetach(){if(QXR.unsub){try{QXR.unsub();}catch(e){}}QXR.unsub=null;clearTimeout(QXR.forceTimer);}
function qxrLeave(){
 if(QXR.code&&QXR.me&&fbDB&&!QXR.closed){
  // Lo stato si legge prima di segnare l'uscita: scrivere su Firebase aggiorna subito i dati locali
  // Se chi guida annulla la sfida mentre si aspetta, o se non resta nessuno, la stanza viene chiusa per tutti
  var close=false;
  try{var st=qxrState();close=(st.phase==="lobby"&&st.leader===QXR.me)||st.lobby.filter(function(n){return n!==QXR.me;}).length===0;}catch(e){}
  var code=QXR.code;
  if(close){try{fbRemove(fbRef(fbDB,"rooms/"+code));}catch(e){}}
  else{try{fbSet(fbRef(fbDB,qxrPath("left/"+cdrKey(QXR.me))),true);}catch(e){}}
 }
 qxrDetach();
 QXR.code=null;QXR.me=null;QXR.data=null;QXR.sig="";QXR.val=null;QXR.closed=false;
}
window.addEventListener("pagehide",function(e){if(QXR.code&&!(e&&e.persisted))qxrLeave();});
function qxrExit(){qxrLeave();goBackToGames();}

// ── Azioni ──
function qxrStart(){
 var st=qxrState();if(st.leader!==QXR.me||st.lobby.length<2||QXR.busy)return;
 QXR.busy=true;
 cdrNet(fbSet(fbRef(fbDB,qxrPath("meta")),Object.assign({phase:"play",order:st.lobby.slice(0,QXR_MAX_PLAYERS),game:st.game,q:0,rv:-1,end:false,qt:fbNow()},qxrRoundData()))).then(function(){QXR.busy=false;}).catch(function(){QXR.busy=false;cdrToast(T("connErr"));});
}
function qxrAnswer(v){
 var st=qxrState();
 if(st.phase!=="play"||st.ended||st.reveal||st.elig.indexOf(QXR.me)<0||st.cur[QXR.me]||QXR.busy)return;
 QXR.busy=true;
 var ref=fbRef(fbDB,qxrPath("g"+st.game+"/a"+st.q+"/"+cdrKey(QXR.me)));
 // La risposta si scrive una volta sola (doppio tocco o rete lenta non la cambiano)
 cdrNet(fbGet(ref)).then(function(snap){
  if(snap.exists()){QXR.busy=false;QXR.sig="";qxrRender(true);return;}
  return cdrNet(fbSet(ref,{v:v,t:fbNow()})).then(function(){QXR.busy=false;QXR.sig="";qxrRender(true);});
 }).catch(function(){QXR.busy=false;cdrToast(T("connErr"));QXR.sig="";qxrRender(true);});
}
// Se qualcuno non risponde (telefono spento, app chiusa) dopo un po' chi ha già risposto può mostrare le risposte.
// Scrivere due volte lo stesso valore non cambia nulla, quindi più telefoni possono farlo insieme senza problemi.
function qxrForceReveal(){
 var st=qxrState();if(st.reveal||st.ended||st.phase!=="play")return;
 // Segnale separato: non riscrive mai la partita, quindi non può riportare indietro la domanda
 try{fbSet(fbRef(fbDB,qxrPath("rv/"+st.game+"_"+st.q)),true);}catch(e){}
}
// Allo scadere del tempo ogni telefono ancora in partita mostra le risposte (scrivere due volte non cambia nulla)
function qxrTimeUp(game,q){
 var st=qxrState();if(st.game!==game||st.q!==q||st.reveal||st.ended||st.phase!=="play")return;
 if(st.active.indexOf(QXR.me)<0)return;
 // Se avevo già scelto senza confermare, la mia scelta parte da sola
 if(!st.cur[QXR.me]&&QXR.touchedKey===st.game+"|"+st.q){qxrAnswer(QXR.val);setTimeout(qxrForceReveal,800);return;}
 // Un attimo di attesa: le scelte non confermate degli altri fanno in tempo ad arrivare
 setTimeout(qxrForceReveal,1500);
}
function qxrTimer(wrap,st){
 if(!st.meta||!st.meta.qt)return;
 var g=st.game,q=st.q;
 rlTimer(wrap,st.meta.qt,QXR_Q_MS,function(){qxrTimeUp(g,q);});
}
// Passaggio automatico alla domanda dopo (o allo spareggio, o alla fine), uguale su tutti i telefoni
function qxrNext(game,q){
 var st=qxrState();if(st.phase!=="play"||!st.reveal||st.ended||QXR.busy)return;
 if(game!==undefined&&(st.game!==game||st.q!==q))return;
 if(st.active.indexOf(QXR.me)<0)return;
 QXR.busy=true;
 var m=rlNextMeta(st.meta,st.q,st.rt||fbNow(),st.active,st.scores);
 cdrNet(fbSet(fbRef(fbDB,qxrPath("meta")),m)).then(function(){QXR.busy=false;}).catch(function(){QXR.busy=false;});
}
function qxrRematch(){
 var st=qxrState();if(st.leader!==QXR.me||QXR.busy)return;
 var still=st.order.filter(function(n){return !st.isLeft(n);});
 QXR.busy=true;
 var m=still.length<2?{phase:"lobby",order:[],game:st.game+1}:Object.assign({phase:"play",order:still,game:st.game+1,q:0,rv:-1,end:false,qt:fbNow()},qxrRoundData());
 cdrNet(fbSet(fbRef(fbDB,qxrPath("meta")),m)).then(function(){QXR.busy=false;}).catch(function(){QXR.busy=false;cdrToast(T("connErr"));});
}
// Chi guida sceglie il livello (sala d'attesa, oppure fine partita per la rivincita)
function qxrSetLevel(l){
 var st=qxrState();if(st.leader!==QXR.me||QXR.busy||RL_LEVELS.indexOf(l)<0)return;
 QXR.busy=true;
 cdrNet(fbSet(fbRef(fbDB,qxrPath("meta")),Object.assign({},st.meta,{lvl:l}))).then(function(){QXR.busy=false;}).catch(function(){QXR.busy=false;cdrToast(T("connErr"));});
}
function qxrInvite(silent){
 if(!fbDB||!QXR.code)return;
 var inv={from:QXR.me,game:"QUANTO VALE?",kind:"qvx",cat:"relax",roomCode:QXR.code,dev:(typeof filosDevId==="function"?filosDevId():null),pubCode:(typeof FILOS_PUB_CODE!=="undefined"?FILOS_PUB_CODE:null)||null,ts:Date.now()};
 var key="inv_"+Date.now();
 try{fbSet(fbRef(fbDB,"filos_invites/"+key),inv);setTimeout(function(){try{fbRemove(fbRef(fbDB,"filos_invites/"+key));}catch(e){}},30000);if(!silent)cdrToast(T("cdrInviteSent"));}catch(e){}
}

// ── Schermate ──
function renderQvRemote(){qxrRender(true);}
function qxrSignature(st){
 var s=[QXR.closed,st.phase,rlLevel(st.meta),st.lobby,st.active,st.game,st.q,st.reveal,st.ended,st.leader,LANG,!!st.cur[QXR.me]];
 // Mentre si sceglie l'anno la schermata non si ridisegna quando rispondono gli altri (il cursore resterebbe a metà)
 if(st.cur[QXR.me]||st.reveal||st.active.indexOf(QXR.me)<0)s.push(Object.keys(st.cur));
 return JSON.stringify(s);
}
function qxrRender(force){
 if(S.screen!=="qxr")return;
 cdrStrings();qxrStrings();
 var st=QXR.code?qxrState():null;
 var sig=QXR.code?qxrSignature(st):"none";
 if(!force&&sig===QXR.sig)return;
 QXR.sig=sig;
 clr();
 addBackArrow(qxrExit);
 var wrap=div("codice-wrap cdr agr qxr");wrap.style.textAlign="center";
 document.getElementById("root").appendChild(wrap);
 if(!QXR.code){qxrScreenStart(wrap);return;}
 if(QXR.closed){
  wrap.appendChild(div("codice-big",T("cdrClosed")));
  wrap.appendChild(div("codice-sub",T("cdrClosedSub")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),qxrExit));
  return;
 }
 if(!QXR.data){wrap.appendChild(div("codice-sub",T("cdrConnecting")));return;}
 if(st.isLeft(QXR.me)){
  wrap.appendChild(div("codice-big",T("cdrYouLeft")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),qxrExit));
  return;
 }
 if(st.phase==="lobby"){qxrScreenLobby(wrap,st);return;}
 if(st.order.indexOf(QXR.me)<0){
  wrap.appendChild(div("codice-big",T("cdrAlreadyStarted")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),qxrExit));
  return;
 }
 if(st.ended){qxrScreenEnd(wrap,st);return;}
 if(st.reveal){qxrScreenReveal(wrap,st);return;}
 if(st.elig.indexOf(QXR.me)<0)qxrScreenWatch(wrap,st);
 else if(!st.cur[QXR.me])qxrScreenAnswer(wrap,st);
 else qxrScreenWait(wrap,st);
}
// Dalla versione al tavolo (Cultura): "Sfida un altro tavolo" crea subito la partita a distanza
function qxrChallenge(){
 S.screen="qxr";render();
 var b=document.querySelector(".codice-wrap.qxr .codice-cta");if(b)b.click();
}
function qxrScreenStart(wrap){
 cdrHeader(wrap,T("cdrRemote"),T("qvTitle"),T("qxrIntro"));
 if(!fbDB){wrap.appendChild(div("codice-sub",T("firebaseErr")));return;}
 var err=div("cdr-err");
 var sfida=btn("codice-cta",T("ui_sfida_un_altro_tavolo"),function(){
  if(sfida.disabled)return;
  sfida.disabled=true;sfida.textContent=T("ui_invio_sfida");err.textContent="";
  qxrCreate(function(ok,msg){
   if(!ok){sfida.disabled=false;sfida.textContent=T("ui_sfida_un_altro_tavolo");err.textContent=msg||T("connErr");return;}
   qxrInvite(true);
   if(S.screen!=="qxr"){qxrLeave();return;}
   qxrRender(true);
  });
 });
 wrap.appendChild(sfida);
 wrap.appendChild(div("codice-legend",T("ui_gli_altri_dispositivi_riceveranno_una")));
 wrap.appendChild(err);
}
function qxrScreenLobby(wrap,st){
 var lead=st.leader===QXR.me;
 cdrHeader(wrap,lead?T("ui_in_attesa_degli_altri"):T("ui_connesso"),T("qvTitle"),lead?null:T("cdrWaitHost").replace("{n}",st.leader||""));
 wrap.appendChild(div("codice-section",T("playersInRoom")+" "+st.lobby.length+"/"+QXR_MAX_PLAYERS));
 var list=div("cdr-list");
 st.lobby.forEach(function(n){var r=div("cdr-row");r.appendChild(div("cdr-dot on"));r.appendChild(div("cdr-name",n+(n===QXR.me?" "+T("cdrYou"):"")));if(n===st.leader)r.appendChild(div("cdr-tag",T("cdrHost")));list.appendChild(r);});
 wrap.appendChild(list);
 if(lead){
  var go=btn("codice-cta",T("qvStart"),qxrStart);
  go.disabled=st.lobby.length<2;
  wrap.appendChild(go);
  if(st.lobby.length<2)wrap.appendChild(div("codice-legend",T("ui_aspetta_che_si_colleghi_almeno")));
  if(st.lobby.length<QXR_MAX_PLAYERS)wrap.appendChild(btn("cdr-link",T("cdrResend"),function(){qxrInvite();}));
  wrap.appendChild(btn("cdr-link muted",T("ui_annulla_sfida"),qxrExit));
 } else {
  wrap.appendChild(btn("cdr-link muted",T("ui_esci_dalla_stanza"),qxrExit));
 }
}
function qxrQuestionBox(wrap,st){
 wrap.appendChild(div("agr-round",rlRoundLabel(st.meta,st.q,T("qxrRound"))));
 rlTbNote(wrap,st.meta,st.q,QXR.me);
 var q=qxrQuestion(st.qs[st.q])||{q:""};
 wrap.appendChild(div("agr-q",q.q));
 return q;
}
function qxrScreenAnswer(wrap,st){
 var q=qxrQuestionBox(wrap,st);
 qxrTimer(wrap,st);
 if(!q||typeof q.min!=="number")return;
 var key=st.game+"|"+st.q;var step=qxrStep(q);
 if(QXR.valKey!==key){QXR.valKey=key;QXR.val=Math.round((q.min+q.max)/2/step)*step;if(QXR.val<q.min)QXR.val=q.min;if(QXR.val>q.max)QXR.val=q.max;}
 var val=div("agr-year");val.textContent=qxrNum(QXR.val);wrap.appendChild(val);
 if(q.unit)wrap.appendChild(div("qxr-unit",q.unit));
 var slider=document.createElement("input");
 slider.type="range";slider.className="agr-slider";slider.min=q.min;slider.max=q.max;slider.step=step;slider.value=QXR.val;
 slider.oninput=function(){QXR.touchedKey=key;QXR.val=parseInt(this.value,10);val.textContent=qxrNum(QXR.val);};
 wrap.appendChild(slider);
 var range=div("agr-range");range.appendChild(el("span","",qxrNum(q.min)));range.appendChild(el("span","",qxrNum(q.max)));wrap.appendChild(range);
 var fine=div("agr-fine");
 [-10,-1,1,10].forEach(function(k){
  var dv=k*step;
  fine.appendChild(btn("agr-step",(dv>0?"+":"−")+qxrNum(Math.abs(dv)),function(){
   QXR.touchedKey=key;QXR.val=Math.max(q.min,Math.min(q.max,QXR.val+dv));slider.value=QXR.val;val.textContent=qxrNum(QXR.val);
  }));
 });
 wrap.appendChild(fine);
 var ok=btn("codice-cta",T("qxrConfirm"),function(){if(ok.disabled)return;ok.disabled=true;qxrAnswer(QXR.val);});
 wrap.appendChild(ok);
}
function qxrScreenWatch(wrap,st){
 qxrQuestionBox(wrap,st);
 qxrTimer(wrap,st);
 wrap.appendChild(div("codice-sub",T("rlTbWatch").replace("{n}",rlNames(st.elig,QXR.me))));
 qxrChips(wrap,st);
}
function qxrChips(wrap,st){
 var chips=div("agr-chips");
 st.elig.forEach(function(n){chips.appendChild(div("agr-chip"+(st.cur[n]?" on":""),n===QXR.me?T("cdrYou2"):n));});
 wrap.appendChild(chips);
}
function qxrScreenWait(wrap,st){
 qxrQuestionBox(wrap,st);
 qxrTimer(wrap,st);
 var mine=st.cur[QXR.me];
 var box=div("agr-sent");
 box.appendChild(div("agr-sent-t",T("qvAnswerSent")));
 if(mine&&!mine.skip)box.appendChild(div("agr-sent-v",T("qxrYourAnswer").replace("{y}",qxrNum(mine.v)+((qxrQuestion(st.qs[st.q])||{}).unit?" "+qxrQuestion(st.qs[st.q]).unit:""))));
 wrap.appendChild(box);
 var missing=st.elig.filter(function(n){return !st.cur[n];});
 wrap.appendChild(div("codice-sub",T("qxrWaiting").replace("{a}",st.elig.length-missing.length).replace("{t}",st.elig.length)));
 qxrChips(wrap,st);
 if(!(st.meta&&st.meta.qt)){
  var key=st.game+"|"+st.q;
  if(QXR.waitKey!==key){QXR.waitKey=key;QXR.waitSince=Date.now();}
  var waited=Date.now()-QXR.waitSince;
  if(waited>=(st.leader===QXR.me?QXR_FORCE_MS:QXR_FORCE_MS+15000)){
   wrap.appendChild(btn("ebtn out agr-force",T("qxrForce"),qxrForceReveal));
   wrap.appendChild(div("codice-legend",T("qxrForceHint")));
  } else {
   clearTimeout(QXR.forceTimer);QXR.forceTimer=setTimeout(function(){QXR.sig="";qxrRender(true);},(st.leader===QXR.me?QXR_FORCE_MS:QXR_FORCE_MS+15000)-waited+200);
  }
 }
}
function qxrScreenReveal(wrap,st){
 var q=qxrQuestionBox(wrap,st);
 var g0=st.game,q0=st.q;rlRevealCountdown(wrap,st,st.rt,function(){qxrNext(g0,q0);});
 var item=(typeof QUANTO_VALE_DATA!=="undefined")?QUANTO_VALE_DATA[st.qs[st.q]]:null;
 var ans=item?item.risposta:q.risposta;var unit=q.unit?" "+q.unit:"";
 var box=div("agr-answer");
 box.appendChild(div("agr-answer-l",T("ui_risposta_corretta")));
 box.appendChild(div("agr-answer-v",qxrNum(ans)+unit));
 if(q.curiosita)box.appendChild(div("agr-answer-c",q.curiosita));
 wrap.appendChild(box);
 var rd=st.rounds[st.q]||{answers:{},winners:[]};
 var rows=(rlBlock(st.meta,st.q)?st.elig:st.order).map(function(n){var a=rd.answers[n];return {n:n,a:a,d:(a&&!a.skip)?Math.abs(a.v-ans):Infinity};}).sort(function(x,y){return x.d-y.d;});
 var list=div("agr-list");
 rows.forEach(function(r){
  var won=rd.winners.indexOf(r.n)>=0;
  var row=div("agr-row"+(won?" win":""));
  row.appendChild(div("agr-row-n",(r.n===QXR.me?T("cdrYou2"):r.n)+(st.isLeft(r.n)?" · "+T("cdrLeftTag"):"")));
  row.appendChild(div("agr-row-v",(r.a&&!r.a.skip)?qxrNum(r.a.v)+" · "+T("ui_scarto")+" "+qxrNum(r.d):T("qxrNoAnswer")));
  list.appendChild(row);
 });
 wrap.appendChild(list);
 if(rd.winners.length){
  var me=rd.winners.indexOf(QXR.me)>=0;
  wrap.appendChild(div("agr-point",me?T("qxrPointMe"):T("qxrPoint").replace("{n}",rd.winners.join(", "))));
 }
 qxrScores(wrap,st);
}
function qxrScores(wrap,st){
 wrap.appendChild(div("codice-section",T("ui_punteggi_totali")));
 var sc=div("agr-scores");
 st.order.slice().sort(function(a,b){return st.scores[b]-st.scores[a];}).forEach(function(n){
  var r=div("agr-score");r.appendChild(div("agr-score-n",(n===QXR.me?T("cdrYou2"):n)+(st.isLeft(n)?" · "+T("cdrLeftTag"):"")));r.appendChild(div("agr-score-v",st.scores[n]+" pt"));sc.appendChild(r);
 });
 wrap.appendChild(sc);
}
function qxrScreenEnd(wrap,st){
 if(st.interrupted){
  wrap.appendChild(div("end-title",T("cdrInterrupted")));
  wrap.appendChild(div("end-sub",T("cdrInterruptedSub")));
 } else {
  var max=-1;st.order.forEach(function(n){if(st.scores[n]>max)max=st.scores[n];});
  var top=st.order.filter(function(n){return st.scores[n]===max;});
  var title=top.length>1?T("qxrTie").replace("{n}",top.join(", ")):(top[0]===QXR.me?T("cdrYouWon"):winTxt(top[0]));
  wrap.appendChild(div("end-title",title));
  wrap.appendChild(div("end-sub",(st.meta.tbs&&st.meta.tbs.length)?T("rlWonTb"):T("qxrEndSub").replace("{p}",max).replace("{t}",st.main)));
 }
 qxrScores(wrap,st);
 var btns=div("endbtns");
 if(st.leader===QXR.me)btns.appendChild(btn("ebtn",T("qvPlayAgain"),qxrRematch));
 else wrap.appendChild(div("cdr-wait",T("cdrWaitRematch").replace("{n}",st.leader||"")));
 btns.appendChild(btn("ebtn out",T("exitBtn"),function(){qxrLeave();goHome();}));
 wrap.appendChild(btns);
}

// Stringhe (aggiunte quando l'interfaccia è pronta: STRINGS è definito dopo questo file)
function qxrStrings(){
 if(typeof STRINGS==="undefined"||STRINGS.it.qxrIntro)return;
 if(typeof agrStrings==="function")agrStrings();
 ["it","en","es"].forEach(function(l){var t=STRINGS[l],o={};Object.keys(t).forEach(function(k){if(k.indexOf("agr")===0)o["qxr"+k.slice(3)]=t[k];});Object.assign(t,o);});
}
