/*!
 * Filòs — © 2026 i titolari del progetto Filòs. Tutti i diritti riservati.
 * Codice e contenuti sono opere protette dalla legge sul diritto d'autore (L. 633/1941).
 * È vietata qualsiasi copia, riproduzione, modifica o ridistribuzione senza autorizzazione scritta.
 */
// ══════════════════════════════════════════
// ANNO GIUSTO — A DISTANZA
// Stesso collegamento di Indovina il codice (sfida con notifica, sala d'attesa, Guida).
// Ogni telefono ricostruisce la partita dagli stessi dati condivisi, così tutti vedono
// la stessa domanda, le stesse risposte e gli stessi punteggi:
//  rooms/{code}/ag/players/{nome} = {n,t}
//  rooms/{code}/ag/meta = {phase, order, game, qs, q, rv, end}   scritto da chi guida
//  rooms/{code}/ag/left/{nome} = true
//  rooms/{code}/ag/g{game}/a{q}/{nome} = {v:anno} | {skip:true}
// Le domande sono indici dell'elenco ANNO GIUSTO (uguale in tutte le lingue):
// ognuno legge la domanda nella propria lingua.
// ══════════════════════════════════════════
var AGR_MAX_PLAYERS=8,AGR_ROUNDS=10,AGR_FORCE_MS=45000;
var AGR={code:null,me:null,data:null,unsub:null,sig:"",val:null,valKey:"",busy:false,closed:false};

function agrPath(p){return "rooms/"+AGR.code+"/ag"+(p?"/"+p:"");}
function agrMaxYear(){return new Date().getFullYear();}

// ── Stato derivato ──
function agrState(){
 var d=AGR.data||{};var meta=d.meta||{phase:"lobby",order:[],game:1};
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
 var data=(typeof ANNO_GIUSTO_DATA!=="undefined")?ANNO_GIUSTO_DATA:[];
 function answersOf(r){
  var raw=gd["a"+r]||{};var out={};
  order.forEach(function(n){var a=raw[cdrKey(n)];if(a&&(a.skip||typeof a.v==="number"))out[n]=a;});
  return out;
 }
 var cur=answersOf(q);
 var allIn=active.length>0&&active.every(function(n){return !!cur[n];});
 var reveal=phase==="play"&&(allIn||meta.rv===q);
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
 }
 var leader=(phase==="lobby"?lobby:active.length?active:lobby)[0]||null;
 return {meta:meta,phase:phase,players:players,lobby:lobby,order:order,active:active,isLeft:isLeft,game:game,qs:qs,q:q,cur:cur,allIn:allIn,reveal:reveal,scores:scores,rounds:rounds,ended:ended,interrupted:interrupted,leader:leader,last:q>=qs.length-1};
}
function agrQuestion(idx){var l=agData();return l[idx]||(typeof ANNO_GIUSTO_DATA!=="undefined"?ANNO_GIUSTO_DATA[idx]:null);}
function agrPickQuestions(){
 var n=(typeof ANNO_GIUSTO_DATA!=="undefined")?ANNO_GIUSTO_DATA.length:0;
 var idx=[];for(var i=0;i<n;i++)idx.push(i);
 for(var j=idx.length-1;j>0;j--){var k=Math.floor(Math.random()*(j+1));var t=idx[j];idx[j]=idx[k];idx[k]=t;}
 return idx.slice(0,Math.min(AGR_ROUNDS,n));
}

// ── Stanza: crea, entra, esci ──
function agrCreate(done){
 cdrStrings();agrStrings();
 if(!fbDB){done(false,T("firebaseErr"));return;}
 var tries=0;
 (function attempt(){
  tries++;var code=String(Math.floor(1000+Math.random()*9000));
  cdrNet(fbGet(fbRef(fbDB,"rooms/"+code))).then(function(snap){
   if(snap.exists()&&tries<8){attempt();return;}
   var me=cdrMyName();var now=Date.now();
   var room={created:now,kind:"anno",ag:{meta:{phase:"lobby",order:[],game:1},players:{}}};
   room.ag.players[cdrKey(me)]={n:me,t:now};
   cdrNet(fbSet(fbRef(fbDB,"rooms/"+code),room)).then(function(){agrAttach(code,me);done(true);}).catch(function(){done(false,T("connErr"));});
  }).catch(function(){done(false,T("connErr"));});
 })();
}
function agrJoin(code,done){
 cdrStrings();agrStrings();
 if(!fbDB){done(false,T("firebaseErr"));return;}
 code=String(code||"").replace(/\D/g,"");
 if(code.length!==4){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
 cdrNet(fbGet(fbRef(fbDB,"rooms/"+code+"/ag"))).then(function(snap){
  if(!snap.exists()){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
  var d=snap.val()||{};var meta=d.meta||{};
  if(meta.phase&&meta.phase!=="lobby"){done(false,T("cdrAlreadyStarted"));return;}
  var left=d.left||{};
  var taken=Object.keys(d.players||{}).filter(function(k){return !left[k];}).map(function(k){return d.players[k].n||k;});
  if(!taken.length){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
  if(taken.length>=AGR_MAX_PLAYERS){done(false,T("agrRoomFull"));return;}
  var me=cdrUniqueName(cdrMyName(),taken);var k=cdrKey(me);
  var clearLeft=left[k]?cdrNet(fbSet(fbRef(fbDB,"rooms/"+code+"/ag/left/"+k),null)):Promise.resolve();
  clearLeft.then(function(){return cdrNet(fbSet(fbRef(fbDB,"rooms/"+code+"/ag/players/"+k),{n:me,t:Date.now()}));}).then(function(){agrAttach(code,me);done(true);}).catch(function(){done(false,T("connErr"));});
 }).catch(function(){done(false,T("connErr"));});
}
function agrAttach(code,me){
 agrDetach();
 AGR.code=code;AGR.me=me;AGR.data=null;AGR.sig="";AGR.val=null;AGR.valKey="";AGR.closed=false;AGR.busy=false;
 AGR.unsub=fbOnValue(fbRef(fbDB,"rooms/"+code+"/ag"),function(snap){
  var v=snap.val();
  if(!v){AGR.closed=true;AGR.data=null;}else{AGR.data=v;}
  if(S.screen==="agr")agrRender(false);
 });
}
function agrDetach(){if(AGR.unsub){try{AGR.unsub();}catch(e){}}AGR.unsub=null;clearTimeout(AGR.forceTimer);}
function agrLeave(){
 if(AGR.code&&AGR.me&&fbDB&&!AGR.closed){
  // Lo stato si legge prima di segnare l'uscita: scrivere su Firebase aggiorna subito i dati locali
  // Se chi guida annulla la sfida mentre si aspetta, o se non resta nessuno, la stanza viene chiusa per tutti
  var close=false;
  try{var st=agrState();close=(st.phase==="lobby"&&st.leader===AGR.me)||st.lobby.filter(function(n){return n!==AGR.me;}).length===0;}catch(e){}
  var code=AGR.code;
  if(close){try{fbRemove(fbRef(fbDB,"rooms/"+code));}catch(e){}}
  else{try{fbSet(fbRef(fbDB,agrPath("left/"+cdrKey(AGR.me))),true);}catch(e){}}
 }
 agrDetach();
 AGR.code=null;AGR.me=null;AGR.data=null;AGR.sig="";AGR.val=null;AGR.closed=false;
}
window.addEventListener("pagehide",function(e){if(AGR.code&&!(e&&e.persisted))agrLeave();});
function agrExit(){agrLeave();goBackToGames();}

// ── Azioni ──
function agrStart(){
 var st=agrState();if(st.leader!==AGR.me||st.lobby.length<2||AGR.busy)return;
 AGR.busy=true;
 cdrNet(fbSet(fbRef(fbDB,agrPath("meta")),{phase:"play",order:st.lobby.slice(0,AGR_MAX_PLAYERS),game:st.game,qs:agrPickQuestions(),q:0,rv:-1,end:false})).then(function(){AGR.busy=false;}).catch(function(){AGR.busy=false;cdrToast(T("connErr"));});
}
function agrAnswer(v){
 var st=agrState();
 if(st.phase!=="play"||st.ended||st.reveal||st.active.indexOf(AGR.me)<0||st.cur[AGR.me]||AGR.busy)return;
 AGR.busy=true;
 var ref=fbRef(fbDB,agrPath("g"+st.game+"/a"+st.q+"/"+cdrKey(AGR.me)));
 // La risposta si scrive una volta sola (doppio tocco o rete lenta non la cambiano)
 cdrNet(fbGet(ref)).then(function(snap){
  if(snap.exists()){AGR.busy=false;AGR.sig="";agrRender(true);return;}
  return cdrNet(fbSet(ref,{v:v,t:Date.now()})).then(function(){AGR.busy=false;AGR.sig="";agrRender(true);});
 }).catch(function(){AGR.busy=false;cdrToast(T("connErr"));AGR.sig="";agrRender(true);});
}
// Se qualcuno non risponde (telefono spento, app chiusa) dopo un po' chi ha già risposto può mostrare le risposte.
// Scrivere due volte lo stesso valore non cambia nulla, quindi più telefoni possono farlo insieme senza problemi.
function agrForceReveal(){
 var st=agrState();if(!st.cur[AGR.me]||st.reveal||st.ended||AGR.busy)return;
 AGR.busy=true;
 var m=Object.assign({},st.meta,{rv:st.q});
 cdrNet(fbSet(fbRef(fbDB,agrPath("meta")),m)).then(function(){AGR.busy=false;}).catch(function(){AGR.busy=false;cdrToast(T("connErr"));});
}
function agrNext(){
 var st=agrState();if(!st.reveal||st.ended||AGR.busy)return;
 AGR.busy=true;
 var m=Object.assign({},st.meta);
 if(st.last)m.end=true;else{m.q=st.q+1;m.rv=-1;}
 cdrNet(fbSet(fbRef(fbDB,agrPath("meta")),m)).then(function(){AGR.busy=false;}).catch(function(){AGR.busy=false;cdrToast(T("connErr"));});
}
function agrRematch(){
 var st=agrState();if(st.leader!==AGR.me||AGR.busy)return;
 var still=st.order.filter(function(n){return !st.isLeft(n);});
 AGR.busy=true;
 var m=still.length<2?{phase:"lobby",order:[],game:st.game+1}:{phase:"play",order:still,game:st.game+1,qs:agrPickQuestions(),q:0,rv:-1,end:false};
 cdrNet(fbSet(fbRef(fbDB,agrPath("meta")),m)).then(function(){AGR.busy=false;}).catch(function(){AGR.busy=false;cdrToast(T("connErr"));});
}
function agrInvite(silent){
 if(!fbDB||!AGR.code)return;
 var inv={from:AGR.me,game:"ANNO GIUSTO",kind:"anno",cat:"relax",roomCode:AGR.code,dev:(typeof filosDevId==="function"?filosDevId():null),pubCode:(typeof FILOS_PUB_CODE!=="undefined"?FILOS_PUB_CODE:null)||null,ts:Date.now()};
 var key="inv_"+Date.now();
 try{fbSet(fbRef(fbDB,"filos_invites/"+key),inv);setTimeout(function(){try{fbRemove(fbRef(fbDB,"filos_invites/"+key));}catch(e){}},30000);if(!silent)cdrToast(T("cdrInviteSent"));}catch(e){}
}

// ── Schermate ──
function renderAgRemote(){agrRender(true);}
function agrSignature(st){
 var s=[AGR.closed,st.phase,st.lobby,st.active,st.game,st.q,st.reveal,st.ended,st.leader,LANG,!!st.cur[AGR.me]];
 // Mentre si sceglie l'anno la schermata non si ridisegna quando rispondono gli altri (il cursore resterebbe a metà)
 if(st.cur[AGR.me]||st.reveal||st.active.indexOf(AGR.me)<0)s.push(Object.keys(st.cur));
 return JSON.stringify(s);
}
function agrRender(force){
 if(S.screen!=="agr")return;
 cdrStrings();agrStrings();
 var st=AGR.code?agrState():null;
 var sig=AGR.code?agrSignature(st):"none";
 if(!force&&sig===AGR.sig)return;
 AGR.sig=sig;
 clr();
 addBackArrow(agrExit);
 var wrap=div("codice-wrap cdr agr");wrap.style.textAlign="center";
 document.getElementById("root").appendChild(wrap);
 if(!AGR.code){agrScreenStart(wrap);return;}
 if(AGR.closed){
  wrap.appendChild(div("codice-big",T("cdrClosed")));
  wrap.appendChild(div("codice-sub",T("cdrClosedSub")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),agrExit));
  return;
 }
 if(!AGR.data){wrap.appendChild(div("codice-sub",T("cdrConnecting")));return;}
 if(st.isLeft(AGR.me)){
  wrap.appendChild(div("codice-big",T("cdrYouLeft")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),agrExit));
  return;
 }
 if(st.phase==="lobby"){agrScreenLobby(wrap,st);return;}
 if(st.order.indexOf(AGR.me)<0){
  wrap.appendChild(div("codice-big",T("cdrAlreadyStarted")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),agrExit));
  return;
 }
 if(st.ended){agrScreenEnd(wrap,st);return;}
 if(st.reveal){agrScreenReveal(wrap,st);return;}
 if(!st.cur[AGR.me])agrScreenAnswer(wrap,st);
 else agrScreenWait(wrap,st);
}
function agrScreenStart(wrap){
 cdrHeader(wrap,T("cdrRemote"),T("ui_anno_giusto"),T("agrIntro"));
 if(!fbDB){wrap.appendChild(div("codice-sub",T("firebaseErr")));return;}
 var err=div("cdr-err");
 var sfida=btn("codice-cta",T("ui_sfida_un_altro_tavolo"),function(){
  if(sfida.disabled)return;
  sfida.disabled=true;sfida.textContent=T("ui_invio_sfida");err.textContent="";
  agrCreate(function(ok,msg){
   if(!ok){sfida.disabled=false;sfida.textContent=T("ui_sfida_un_altro_tavolo");err.textContent=msg||T("connErr");return;}
   agrInvite(true);
   if(S.screen!=="agr"){agrLeave();return;}
   agrRender(true);
  });
 });
 wrap.appendChild(sfida);
 wrap.appendChild(div("codice-legend",T("ui_gli_altri_dispositivi_riceveranno_una")));
 wrap.appendChild(err);
}
function agrScreenLobby(wrap,st){
 var lead=st.leader===AGR.me;
 cdrHeader(wrap,lead?T("ui_in_attesa_degli_altri"):T("ui_connesso"),T("ui_anno_giusto"),lead?null:T("cdrWaitHost").replace("{n}",st.leader||""));
 wrap.appendChild(div("codice-section",T("playersInRoom")+" "+st.lobby.length+"/"+AGR_MAX_PLAYERS));
 var list=div("cdr-list");
 st.lobby.forEach(function(n){var r=div("cdr-row");r.appendChild(div("cdr-dot on"));r.appendChild(div("cdr-name",n+(n===AGR.me?" "+T("cdrYou"):"")));if(n===st.leader)r.appendChild(div("cdr-tag",T("cdrHost")));list.appendChild(r);});
 wrap.appendChild(list);
 if(lead){
  var go=btn("codice-cta",T("qvStart"),agrStart);
  go.disabled=st.lobby.length<2;
  wrap.appendChild(go);
  if(st.lobby.length<2)wrap.appendChild(div("codice-legend",T("ui_aspetta_che_si_colleghi_almeno")));
  if(st.lobby.length<AGR_MAX_PLAYERS)wrap.appendChild(btn("cdr-link",T("cdrResend"),function(){agrInvite();}));
  wrap.appendChild(btn("cdr-link muted",T("ui_annulla_sfida"),agrExit));
 } else {
  wrap.appendChild(btn("cdr-link muted",T("ui_esci_dalla_stanza"),agrExit));
 }
}
function agrQuestionBox(wrap,st){
 wrap.appendChild(div("agr-round",T("agrRound").replace("{n}",st.q+1).replace("{t}",st.qs.length)));
 var q=agrQuestion(st.qs[st.q])||{q:""};
 wrap.appendChild(div("agr-q",q.q));
 return q;
}
function agrScreenAnswer(wrap,st){
 agrQuestionBox(wrap,st);
 var key=st.game+"|"+st.q;
 if(AGR.valKey!==key){AGR.valKey=key;AGR.val=1000;}
 var max=agrMaxYear();
 var year=div("agr-year");year.textContent=agYear(AGR.val);wrap.appendChild(year);
 var slider=document.createElement("input");
 slider.type="range";slider.className="agr-slider";slider.min=-3000;slider.max=max;slider.step=1;slider.value=AGR.val;
 slider.oninput=function(){AGR.val=parseInt(this.value,10);year.textContent=agYear(AGR.val);};
 wrap.appendChild(slider);
 var range=div("agr-range");range.appendChild(el("span","",agYear(-3000)));range.appendChild(el("span","",String(max)));wrap.appendChild(range);
 var fine=div("agr-fine");
 [-10,-1,1,10].forEach(function(dv){
  fine.appendChild(btn("agr-step",(dv>0?"+":"−")+Math.abs(dv),function(){
   AGR.val=Math.max(-3000,Math.min(max,AGR.val+dv));slider.value=AGR.val;year.textContent=agYear(AGR.val);
  }));
 });
 wrap.appendChild(fine);
 var ok=btn("codice-cta",T("agrConfirm"),function(){if(ok.disabled)return;ok.disabled=true;agrAnswer(AGR.val);});
 wrap.appendChild(ok);
}
function agrChips(wrap,st){
 var chips=div("agr-chips");
 st.active.forEach(function(n){chips.appendChild(div("agr-chip"+(st.cur[n]?" on":""),n===AGR.me?T("cdrYou2"):n));});
 wrap.appendChild(chips);
}
function agrScreenWait(wrap,st){
 agrQuestionBox(wrap,st);
 var mine=st.cur[AGR.me];
 var box=div("agr-sent");
 box.appendChild(div("agr-sent-t",T("qvAnswerSent")));
 if(mine&&!mine.skip)box.appendChild(div("agr-sent-v",T("agrYourAnswer").replace("{y}",agYear(mine.v))));
 wrap.appendChild(box);
 var missing=st.active.filter(function(n){return !st.cur[n];});
 wrap.appendChild(div("codice-sub",T("agrWaiting").replace("{a}",st.active.length-missing.length).replace("{t}",st.active.length)));
 agrChips(wrap,st);
 {
  var key=st.game+"|"+st.q;
  if(AGR.waitKey!==key){AGR.waitKey=key;AGR.waitSince=Date.now();}
  var waited=Date.now()-AGR.waitSince;
  if(waited>=(st.leader===AGR.me?AGR_FORCE_MS:AGR_FORCE_MS+15000)){
   wrap.appendChild(btn("ebtn out agr-force",T("agrForce"),agrForceReveal));
   wrap.appendChild(div("codice-legend",T("agrForceHint")));
  } else {
   clearTimeout(AGR.forceTimer);AGR.forceTimer=setTimeout(function(){AGR.sig="";agrRender(true);},(st.leader===AGR.me?AGR_FORCE_MS:AGR_FORCE_MS+15000)-waited+200);
  }
 }
}
function agrScreenReveal(wrap,st){
 var q=agrQuestionBox(wrap,st);
 var item=(typeof ANNO_GIUSTO_DATA!=="undefined")?ANNO_GIUSTO_DATA[st.qs[st.q]]:null;
 var ans=item?item.risposta:q.risposta;
 var box=div("agr-answer");
 box.appendChild(div("agr-answer-l",T("ui_risposta_corretta")));
 box.appendChild(div("agr-answer-v",agYear(ans)));
 if(q.curiosita)box.appendChild(div("agr-answer-c",q.curiosita));
 wrap.appendChild(box);
 var rd=st.rounds[st.q]||{answers:{},winners:[]};
 var rows=st.order.map(function(n){var a=rd.answers[n];return {n:n,a:a,d:(a&&!a.skip)?Math.abs(a.v-ans):Infinity};}).sort(function(x,y){return x.d-y.d;});
 var list=div("agr-list");
 rows.forEach(function(r){
  var won=rd.winners.indexOf(r.n)>=0;
  var row=div("agr-row"+(won?" win":""));
  row.appendChild(div("agr-row-n",(r.n===AGR.me?T("cdrYou2"):r.n)+(st.isLeft(r.n)?" · "+T("cdrLeftTag"):"")));
  row.appendChild(div("agr-row-v",(r.a&&!r.a.skip)?agYear(r.a.v)+" · ±"+r.d:T("agrNoAnswer")));
  list.appendChild(row);
 });
 wrap.appendChild(list);
 if(rd.winners.length){
  var me=rd.winners.indexOf(AGR.me)>=0;
  wrap.appendChild(div("agr-point",me?T("agrPointMe"):T("agrPoint").replace("{n}",rd.winners.join(", "))));
 }
 agrScores(wrap,st);
 if(st.leader===AGR.me){
  var nx=btn("codice-cta",st.last?T("agrFinal"):T("agrNext"),function(){if(nx.disabled)return;nx.disabled=true;agrNext();});
  wrap.appendChild(nx);
 } else {
  wrap.appendChild(div("cdr-wait",T("agrWaitNext").replace("{n}",st.leader||"")));
  // Se chi guida non va avanti (telefono bloccato) dopo 30 secondi può farlo anche un altro
  var rk=st.game+"|"+st.q;
  if(AGR.revKey!==rk){AGR.revKey=rk;AGR.revSince=Date.now();}
  var w=Date.now()-AGR.revSince;
  if(w>=30000){var nx2=btn("ebtn out",st.last?T("agrFinal"):T("agrNext"),function(){if(nx2.disabled)return;nx2.disabled=true;agrNext();});wrap.appendChild(nx2);}
  else{clearTimeout(AGR.forceTimer);AGR.forceTimer=setTimeout(function(){AGR.sig="";agrRender(true);},30000-w+200);}
 }
}
function agrScores(wrap,st){
 wrap.appendChild(div("codice-section",T("ui_punteggi_totali")));
 var sc=div("agr-scores");
 st.order.slice().sort(function(a,b){return st.scores[b]-st.scores[a];}).forEach(function(n){
  var r=div("agr-score");r.appendChild(div("agr-score-n",(n===AGR.me?T("cdrYou2"):n)+(st.isLeft(n)?" · "+T("cdrLeftTag"):"")));r.appendChild(div("agr-score-v",st.scores[n]+" pt"));sc.appendChild(r);
 });
 wrap.appendChild(sc);
}
function agrScreenEnd(wrap,st){
 if(st.interrupted){
  wrap.appendChild(div("end-title",T("cdrInterrupted")));
  wrap.appendChild(div("end-sub",T("cdrInterruptedSub")));
 } else {
  var max=-1;st.order.forEach(function(n){if(st.scores[n]>max)max=st.scores[n];});
  var top=st.order.filter(function(n){return st.scores[n]===max;});
  var title=top.length>1?T("agrTie").replace("{n}",top.join(", ")):(top[0]===AGR.me?T("cdrYouWon"):top[0]+" "+T("qvWon"));
  wrap.appendChild(div("end-title",title));
  wrap.appendChild(div("end-sub",T("agrEndSub").replace("{p}",max).replace("{t}",st.qs.length)));
 }
 agrScores(wrap,st);
 var btns=div("endbtns");
 if(st.leader===AGR.me)btns.appendChild(btn("ebtn",T("qvPlayAgain"),agrRematch));
 else wrap.appendChild(div("cdr-wait",T("cdrWaitRematch").replace("{n}",st.leader||"")));
 btns.appendChild(btn("ebtn out",T("exitBtn"),function(){agrLeave();goHome();}));
 wrap.appendChild(btns);
}

// Stringhe (aggiunte quando l'interfaccia è pronta: STRINGS è definito dopo questo file)
function agrStrings(){
 if(typeof STRINGS==="undefined"||STRINGS.it.agrIntro)return;
 Object.assign(STRINGS.it,{agrIntro:"Ognuno risponde dal proprio telefono, anche da tavoli diversi. Lancia la sfida: agli altri arriva una notifica e toccando Gioca entrano nella partita.",agrRound:"Domanda {n} di {t}",agrConfirm:"Conferma",agrYourAnswer:"La tua risposta: {y}",agrWaiting:"Hanno risposto {a} su {t}",agrForce:"Mostra le risposte",agrForceHint:"Chi non ha ancora risposto non prende punti in questa domanda.",agrNoAnswer:"nessuna risposta",agrPoint:"Punto a {n}",agrPointMe:"Punto per te!",agrNext:"Prossima domanda",agrFinal:"Risultati finali",agrWaitNext:"Aspetta che {n} vada avanti",agrTie:"Pareggio tra {n}",agrEndSub:"{p} punti su {t} domande",agrRoomFull:"La partita è al completo (massimo 8 giocatori)"});
 Object.assign(STRINGS.en,{agrIntro:"Everyone answers on their own phone, even from different tables. Send the challenge: the others get a notification and tap Play to join.",agrRound:"Question {n} of {t}",agrConfirm:"Confirm",agrYourAnswer:"Your answer: {y}",agrWaiting:"{a} of {t} have answered",agrForce:"Show the answers",agrForceHint:"Anyone who hasn't answered yet gets no point for this question.",agrNoAnswer:"no answer",agrPoint:"Point to {n}",agrPointMe:"Point for you!",agrNext:"Next question",agrFinal:"Final results",agrWaitNext:"Waiting for {n} to move on",agrTie:"Tie between {n}",agrEndSub:"{p} points out of {t} questions",agrRoomFull:"The game is full (maximum 8 players)"});
 Object.assign(STRINGS.es,{agrIntro:"Cada uno responde desde su móvil, incluso desde mesas distintas. Lanza el desafío: a los demás les llega una notificación y al tocar Jugar entran en la partida.",agrRound:"Pregunta {n} de {t}",agrConfirm:"Confirmar",agrYourAnswer:"Tu respuesta: {y}",agrWaiting:"Han respondido {a} de {t}",agrForce:"Mostrar las respuestas",agrForceHint:"Quien aún no ha respondido no suma puntos en esta pregunta.",agrNoAnswer:"sin respuesta",agrPoint:"Punto para {n}",agrPointMe:"¡Punto para ti!",agrNext:"Siguiente pregunta",agrFinal:"Resultados finales",agrWaitNext:"Esperando a que {n} siga",agrTie:"Empate entre {n}",agrEndSub:"{p} puntos de {t} preguntas",agrRoomFull:"La partida está completa (máximo 8 jugadores)"});
}
