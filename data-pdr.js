/*!
 * Filòs — © 2026 i titolari del progetto Filòs. Tutti i diritti riservati.
 * Codice e contenuti sono opere protette dalla legge sul diritto d'autore (L. 633/1941).
 * È vietata qualsiasi copia, riproduzione, modifica o ridistribuzione senza autorizzazione scritta.
 */
// ══════════════════════════════════════════
// PRIMA O DOPO? — A DISTANZA
// Stesso collegamento di Indovina il codice e Anno giusto (sfida con notifica, sala d'attesa, Guida).
// Ogni telefono ricostruisce la partita dagli stessi dati condivisi:
//  rooms/{code}/pd/players/{nome} = {n,t}
//  rooms/{code}/pd/meta = {phase, order, game, qs, q, rv, end}   scritto da chi guida
//  rooms/{code}/pd/left/{nome} = true
//  rooms/{code}/pd/g{game}/a{q}/{nome} = {c:"B"|"A"|"S"} | {skip:true}
// Le domande sono indici dell'elenco PRIMA O DOPO? (stesso ordine in tutte le lingue):
// ognuno legge la domanda nella propria lingua.
// PDR_KEY: per ogni domanda, il primo evento è venuto Prima (B), Dopo (A) o nello Stesso periodo (S).
// Ricavata dalle risposte del gioco e controllata a mano una per una.
// ══════════════════════════════════════════
var PDR_KEY="BBBABBBBBBBBBBAABBBABBBBBBBBBSBASBSBBBBSSABBAAABBSSSAASABSBBBAABBSBBBBBBBBASBBBAAA";
var PDR_MAX_PLAYERS=8,PDR_ROUNDS=10,PDR_FORCE_MS=45000;
var PDR={code:null,me:null,data:null,unsub:null,sig:"",val:null,valKey:"",busy:false,closed:false};

function pdrPath(p){return "rooms/"+PDR.code+"/pd"+(p?"/"+p:"");}
function pdrMaxYear(){return new Date().getFullYear();}

// ── Stato derivato ──
function pdrState(){
 var d=PDR.data||{};var meta=d.meta||{phase:"lobby",order:[],game:1};
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
 function answersOf(r){
  var raw=gd["a"+r]||{};var out={};
  order.forEach(function(n){var a=raw[cdrKey(n)];if(a&&(a.skip||/^[BAS]$/.test(a.c||"")))out[n]=a;});
  return out;
 }
 var cur=answersOf(q);
 var allIn=active.length>0&&active.every(function(n){return !!cur[n];});
 var reveal=phase==="play"&&(allIn||meta.rv===q);
 // Punteggi: un punto a chi risponde giusto
 var scores={};order.forEach(function(n){scores[n]=0;});
 var rounds=[];
 var lastScored=phase==="play"?(reveal?q:q-1):-1;
 for(var r=0;r<=lastScored;r++){
  var key=PDR_KEY.charAt(qs[r]);if(!key)continue;
  var ans=answersOf(r);var winners=[];
  order.forEach(function(n){var a=ans[n];if(a&&!a.skip&&a.c===key){scores[n]++;winners.push(n);}});
  rounds.push({answers:ans,key:key,winners:winners});
 }
 var ended=false,interrupted=false;
 if(phase==="play"){
  if(meta.end)ended=true;
  else if(active.length<2){ended=true;interrupted=true;}
 }
 var leader=(phase==="lobby"?lobby:active.length?active:lobby)[0]||null;
 return {meta:meta,phase:phase,players:players,lobby:lobby,order:order,active:active,isLeft:isLeft,game:game,qs:qs,q:q,cur:cur,allIn:allIn,reveal:reveal,scores:scores,rounds:rounds,ended:ended,interrupted:interrupted,leader:leader,last:q>=qs.length-1};
}
function pdrList(){
 var D=(LANG==="en"&&typeof QUIZ_DATA_EN!=="undefined")?QUIZ_DATA_EN:(LANG==="es"&&typeof QUIZ_DATA_ES!=="undefined")?QUIZ_DATA_ES:(typeof QUIZ_DATA!=="undefined"?QUIZ_DATA:null);
 var g=D&&D["PRIMA O DOPO?"];
 if(!g&&typeof QUIZ_DATA!=="undefined")g=QUIZ_DATA["PRIMA O DOPO?"];
 return (g&&g.questions)||[];
}
function pdrQuestion(idx){
 var it=pdrList()[idx];if(!it)return null;
 // Toglie "PRIMA O DOPO?" davanti: la domanda resta "X rispetto a Y?"
 var t=String(it.q).replace(/^\s*(PRIMA O DOPO\?|BEFORE OR AFTER\?|¿ANTES O DESPUÉS\?)\s*/i,"");
 t=t.charAt(0).toUpperCase()+t.slice(1);
 return {q:t,a:it.a,extra:it.extra};
}
function pdrPickQuestions(lvl){
 var tot=(typeof QUIZ_DATA!=="undefined"&&QUIZ_DATA["PRIMA O DOPO?"])?Math.min(QUIZ_DATA["PRIMA O DOPO?"].questions.length,PDR_KEY.length):0;
 // Stessi tre livelli della versione al tavolo (elenco diviso in tre parti)
 var idx=rlThirds(tot,lvl);var n=idx.length;
 for(var j=idx.length-1;j>0;j--){var k=Math.floor(Math.random()*(j+1));var t=idx[j];idx[j]=idx[k];idx[k]=t;}
 return idx.slice(0,Math.min(PDR_ROUNDS,n));
}

// ── Stanza: crea, entra, esci ──
function pdrCreate(done){
 cdrStrings();pdrStrings();
 if(!fbDB){done(false,T("firebaseErr"));return;}
 var tries=0;
 (function attempt(){
  tries++;var code=String(Math.floor(1000+Math.random()*9000));
  cdrNet(fbGet(fbRef(fbDB,"rooms/"+code))).then(function(snap){
   if(snap.exists()&&tries<8){attempt();return;}
   var me=cdrMyName();var now=Date.now();
   var room={created:now,kind:"primadopo",pd:{meta:{phase:"lobby",order:[],game:1},players:{}}};
   room.pd.players[cdrKey(me)]={n:me,t:now};
   cdrNet(fbSet(fbRef(fbDB,"rooms/"+code),room)).then(function(){pdrAttach(code,me);done(true);}).catch(function(){done(false,T("connErr"));});
  }).catch(function(){done(false,T("connErr"));});
 })();
}
function pdrJoin(code,done){
 cdrStrings();pdrStrings();
 if(!fbDB){done(false,T("firebaseErr"));return;}
 code=String(code||"").replace(/\D/g,"");
 if(code.length!==4){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
 cdrNet(fbGet(fbRef(fbDB,"rooms/"+code+"/pd"))).then(function(snap){
  if(!snap.exists()){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
  var d=snap.val()||{};var meta=d.meta||{};
  if(meta.phase&&meta.phase!=="lobby"){done(false,T("cdrAlreadyStarted"));return;}
  var left=d.left||{};
  var taken=Object.keys(d.players||{}).filter(function(k){return !left[k];}).map(function(k){return d.players[k].n||k;});
  if(!taken.length){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
  if(taken.length>=PDR_MAX_PLAYERS){done(false,T("pdrRoomFull"));return;}
  var me=cdrUniqueName(cdrMyName(),taken);var k=cdrKey(me);
  var clearLeft=left[k]?cdrNet(fbSet(fbRef(fbDB,"rooms/"+code+"/pd/left/"+k),null)):Promise.resolve();
  clearLeft.then(function(){return cdrNet(fbSet(fbRef(fbDB,"rooms/"+code+"/pd/players/"+k),{n:me,t:Date.now()}));}).then(function(){pdrAttach(code,me);done(true);}).catch(function(){done(false,T("connErr"));});
 }).catch(function(){done(false,T("connErr"));});
}
function pdrAttach(code,me){
 pdrDetach();
 PDR.code=code;PDR.me=me;PDR.data=null;PDR.sig="";PDR.val=null;PDR.valKey="";PDR.closed=false;PDR.busy=false;
 PDR.unsub=fbOnValue(fbRef(fbDB,"rooms/"+code+"/pd"),function(snap){
  var v=snap.val();
  if(!v){PDR.closed=true;PDR.data=null;}else{PDR.data=v;}
  if(S.screen==="pdr")pdrRender(false);
 });
}
function pdrDetach(){if(PDR.unsub){try{PDR.unsub();}catch(e){}}PDR.unsub=null;clearTimeout(PDR.forceTimer);}
function pdrLeave(){
 if(PDR.code&&PDR.me&&fbDB&&!PDR.closed){
  // Lo stato si legge prima di segnare l'uscita: scrivere su Firebase aggiorna subito i dati locali
  // Se chi guida annulla la sfida mentre si aspetta, o se non resta nessuno, la stanza viene chiusa per tutti
  var close=false;
  try{var st=pdrState();close=(st.phase==="lobby"&&st.leader===PDR.me)||st.lobby.filter(function(n){return n!==PDR.me;}).length===0;}catch(e){}
  var code=PDR.code;
  if(close){try{fbRemove(fbRef(fbDB,"rooms/"+code));}catch(e){}}
  else{try{fbSet(fbRef(fbDB,pdrPath("left/"+cdrKey(PDR.me))),true);}catch(e){}}
 }
 pdrDetach();
 PDR.code=null;PDR.me=null;PDR.data=null;PDR.sig="";PDR.val=null;PDR.closed=false;
}
window.addEventListener("pagehide",function(e){if(PDR.code&&!(e&&e.persisted))pdrLeave();});
function pdrExit(){pdrLeave();goBackToGames();}

// ── Azioni ──
function pdrStart(){
 var st=pdrState();if(st.leader!==PDR.me||st.lobby.length<2||PDR.busy)return;
 PDR.busy=true;
 cdrNet(fbSet(fbRef(fbDB,pdrPath("meta")),{phase:"play",order:st.lobby.slice(0,PDR_MAX_PLAYERS),game:st.game,qs:pdrPickQuestions(rlLevel(st.meta)),q:0,rv:-1,end:false,lvl:rlLevel(st.meta)})).then(function(){PDR.busy=false;}).catch(function(){PDR.busy=false;cdrToast(T("connErr"));});
}
function pdrAnswer(v){
 if(!/^[BAS]$/.test(v||""))return;
 var st=pdrState();
 if(st.phase!=="play"||st.ended||st.reveal||st.active.indexOf(PDR.me)<0||st.cur[PDR.me]||PDR.busy)return;
 PDR.busy=true;
 var ref=fbRef(fbDB,pdrPath("g"+st.game+"/a"+st.q+"/"+cdrKey(PDR.me)));
 // La risposta si scrive una volta sola (doppio tocco o rete lenta non la cambiano)
 cdrNet(fbGet(ref)).then(function(snap){
  if(snap.exists()){PDR.busy=false;PDR.sig="";pdrRender(true);return;}
  return cdrNet(fbSet(ref,{c:v,t:Date.now()})).then(function(){PDR.busy=false;PDR.sig="";pdrRender(true);});
 }).catch(function(){PDR.busy=false;cdrToast(T("connErr"));PDR.sig="";pdrRender(true);});
}
// Se qualcuno non risponde (telefono spento, app chiusa) dopo un po' chi ha già risposto può mostrare le risposte.
// Scrivere due volte lo stesso valore non cambia nulla, quindi più telefoni possono farlo insieme senza problemi.
function pdrForceReveal(){
 var st=pdrState();if(!st.cur[PDR.me]||st.reveal||st.ended||PDR.busy)return;
 PDR.busy=true;
 var m=Object.assign({},st.meta,{rv:st.q});
 cdrNet(fbSet(fbRef(fbDB,pdrPath("meta")),m)).then(function(){PDR.busy=false;}).catch(function(){PDR.busy=false;cdrToast(T("connErr"));});
}
function pdrNext(){
 var st=pdrState();if(!st.reveal||st.ended||PDR.busy)return;
 PDR.busy=true;
 var m=Object.assign({},st.meta);
 if(st.last)m.end=true;else{m.q=st.q+1;m.rv=-1;}
 cdrNet(fbSet(fbRef(fbDB,pdrPath("meta")),m)).then(function(){PDR.busy=false;}).catch(function(){PDR.busy=false;cdrToast(T("connErr"));});
}
function pdrRematch(){
 var st=pdrState();if(st.leader!==PDR.me||PDR.busy)return;
 var still=st.order.filter(function(n){return !st.isLeft(n);});
 PDR.busy=true;
 var lv=rlLevel(st.meta);
 var m=still.length<2?{phase:"lobby",order:[],game:st.game+1,lvl:lv}:{phase:"play",order:still,game:st.game+1,qs:pdrPickQuestions(lv),q:0,rv:-1,end:false,lvl:lv};
 cdrNet(fbSet(fbRef(fbDB,pdrPath("meta")),m)).then(function(){PDR.busy=false;}).catch(function(){PDR.busy=false;cdrToast(T("connErr"));});
}
// Chi guida sceglie il livello (sala d'attesa, oppure fine partita per la rivincita)
function pdrSetLevel(l){
 var st=pdrState();if(st.leader!==PDR.me||PDR.busy||RL_LEVELS.indexOf(l)<0)return;
 PDR.busy=true;
 cdrNet(fbSet(fbRef(fbDB,pdrPath("meta")),Object.assign({},st.meta,{lvl:l}))).then(function(){PDR.busy=false;}).catch(function(){PDR.busy=false;cdrToast(T("connErr"));});
}
function pdrInvite(silent){
 if(!fbDB||!PDR.code)return;
 var inv={from:PDR.me,game:"PRIMA O DOPO?",kind:"primadopo",cat:"relax",roomCode:PDR.code,dev:(typeof filosDevId==="function"?filosDevId():null),pubCode:(typeof FILOS_PUB_CODE!=="undefined"?FILOS_PUB_CODE:null)||null,ts:Date.now()};
 var key="inv_"+Date.now();
 try{fbSet(fbRef(fbDB,"filos_invites/"+key),inv);setTimeout(function(){try{fbRemove(fbRef(fbDB,"filos_invites/"+key));}catch(e){}},30000);if(!silent)cdrToast(T("cdrInviteSent"));}catch(e){}
}

// ── Schermate ──
function renderPdRemote(){pdrRender(true);}
function pdrSignature(st){
 var s=[PDR.closed,st.phase,rlLevel(st.meta),st.lobby,st.active,st.game,st.q,st.reveal,st.ended,st.leader,LANG,!!st.cur[PDR.me]];
 // Mentre si sceglie la risposta la schermata non si ridisegna quando rispondono gli altri
 if(st.cur[PDR.me]||st.reveal||st.active.indexOf(PDR.me)<0)s.push(Object.keys(st.cur));
 return JSON.stringify(s);
}
function pdrRender(force){
 if(S.screen!=="pdr")return;
 cdrStrings();pdrStrings();
 var st=PDR.code?pdrState():null;
 var sig=PDR.code?pdrSignature(st):"none";
 if(!force&&sig===PDR.sig)return;
 PDR.sig=sig;
 clr();
 addBackArrow(pdrExit);
 var wrap=div("codice-wrap cdr agr");wrap.style.textAlign="center";
 document.getElementById("root").appendChild(wrap);
 if(!PDR.code){pdrScreenStart(wrap);return;}
 if(PDR.closed){
  wrap.appendChild(div("codice-big",T("cdrClosed")));
  wrap.appendChild(div("codice-sub",T("cdrClosedSub")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),pdrExit));
  return;
 }
 if(!PDR.data){wrap.appendChild(div("codice-sub",T("cdrConnecting")));return;}
 if(st.isLeft(PDR.me)){
  wrap.appendChild(div("codice-big",T("cdrYouLeft")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),pdrExit));
  return;
 }
 if(st.phase==="lobby"){pdrScreenLobby(wrap,st);return;}
 if(st.order.indexOf(PDR.me)<0){
  wrap.appendChild(div("codice-big",T("cdrAlreadyStarted")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),pdrExit));
  return;
 }
 if(st.ended){pdrScreenEnd(wrap,st);return;}
 if(st.reveal){pdrScreenReveal(wrap,st);return;}
 if(!st.cur[PDR.me])pdrScreenAnswer(wrap,st);
 else pdrScreenWait(wrap,st);
}
function pdrScreenStart(wrap){
 cdrHeader(wrap,T("cdrRemote"),T("pdrTitle"),T("pdrIntro"));
 if(!fbDB){wrap.appendChild(div("codice-sub",T("firebaseErr")));return;}
 var err=div("cdr-err");
 var sfida=btn("codice-cta",T("ui_sfida_un_altro_tavolo"),function(){
  if(sfida.disabled)return;
  sfida.disabled=true;sfida.textContent=T("ui_invio_sfida");err.textContent="";
  pdrCreate(function(ok,msg){
   if(!ok){sfida.disabled=false;sfida.textContent=T("ui_sfida_un_altro_tavolo");err.textContent=msg||T("connErr");return;}
   pdrInvite(true);
   if(S.screen!=="pdr"){pdrLeave();return;}
   pdrRender(true);
  });
 });
 wrap.appendChild(sfida);
 wrap.appendChild(div("codice-legend",T("ui_gli_altri_dispositivi_riceveranno_una")));
 wrap.appendChild(err);
}
function pdrScreenLobby(wrap,st){
 var lead=st.leader===PDR.me;
 cdrHeader(wrap,lead?T("ui_in_attesa_degli_altri"):T("ui_connesso"),T("pdrTitle"),lead?null:T("cdrWaitHost").replace("{n}",st.leader||""));
 wrap.appendChild(div("codice-section",T("playersInRoom")+" "+st.lobby.length+"/"+PDR_MAX_PLAYERS));
 var list=div("cdr-list");
 st.lobby.forEach(function(n){var r=div("cdr-row");r.appendChild(div("cdr-dot on"));r.appendChild(div("cdr-name",n+(n===PDR.me?" "+T("cdrYou"):"")));if(n===st.leader)r.appendChild(div("cdr-tag",T("cdrHost")));list.appendChild(r);});
 wrap.appendChild(list);
 rlLevelPicker(wrap,rlLevel(st.meta),lead,pdrSetLevel);
 if(lead){
  var go=btn("codice-cta",T("qvStart"),pdrStart);
  go.disabled=st.lobby.length<2;
  wrap.appendChild(go);
  if(st.lobby.length<2)wrap.appendChild(div("codice-legend",T("ui_aspetta_che_si_colleghi_almeno")));
  if(st.lobby.length<PDR_MAX_PLAYERS)wrap.appendChild(btn("cdr-link",T("cdrResend"),function(){pdrInvite();}));
  wrap.appendChild(btn("cdr-link muted",T("ui_annulla_sfida"),pdrExit));
 } else {
  wrap.appendChild(btn("cdr-link muted",T("ui_esci_dalla_stanza"),pdrExit));
 }
}
function pdrQuestionBox(wrap,st){
 wrap.appendChild(div("agr-round",T("pdrRound").replace("{n}",st.q+1).replace("{t}",st.qs.length)+" · "+rlLevelName(rlLevel(st.meta))));
 var q=pdrQuestion(st.qs[st.q])||{q:""};
 wrap.appendChild(div("agr-q",q.q));
 return q;
}
function pdrChoiceLabel(c){return c==="B"?T("pdrBefore"):c==="A"?T("pdrAfter"):T("pdrSame");}
function pdrScreenAnswer(wrap,st){
 pdrQuestionBox(wrap,st);
 var key=st.game+"|"+st.q;
 if(PDR.valKey!==key){PDR.valKey=key;PDR.val=null;}
 wrap.appendChild(div("pdr-hint",T("pdrHint")));
 var opts=div("pdr-opts");var ok;
 ["B","A","S"].forEach(function(c){
  var b=btn("pdr-opt"+(PDR.val===c?" on":"")+(c==="S"?" same":""),pdrChoiceLabel(c),function(){
   PDR.val=c;
   [].forEach.call(opts.children,function(x){x.classList.toggle("on",x===b);});
   if(ok)ok.disabled=false;
  });
  opts.appendChild(b);
 });
 wrap.appendChild(opts);
 ok=btn("codice-cta",T("pdrConfirm"),function(){if(ok.disabled||!PDR.val)return;ok.disabled=true;pdrAnswer(PDR.val);});
 ok.disabled=!PDR.val;
 wrap.appendChild(ok);
}
function pdrChips(wrap,st){
 var chips=div("agr-chips");
 st.active.forEach(function(n){chips.appendChild(div("agr-chip"+(st.cur[n]?" on":""),n===PDR.me?T("cdrYou2"):n));});
 wrap.appendChild(chips);
}
function pdrScreenWait(wrap,st){
 pdrQuestionBox(wrap,st);
 var mine=st.cur[PDR.me];
 var box=div("agr-sent");
 box.appendChild(div("agr-sent-t",T("qvAnswerSent")));
 if(mine&&!mine.skip)box.appendChild(div("agr-sent-v",T("pdrYourAnswer").replace("{y}",pdrChoiceLabel(mine.c))));
 wrap.appendChild(box);
 var missing=st.active.filter(function(n){return !st.cur[n];});
 wrap.appendChild(div("codice-sub",T("pdrWaiting").replace("{a}",st.active.length-missing.length).replace("{t}",st.active.length)));
 pdrChips(wrap,st);
 {
  var key=st.game+"|"+st.q;
  if(PDR.waitKey!==key){PDR.waitKey=key;PDR.waitSince=Date.now();}
  var waited=Date.now()-PDR.waitSince;
  if(waited>=(st.leader===PDR.me?PDR_FORCE_MS:PDR_FORCE_MS+15000)){
   wrap.appendChild(btn("ebtn out agr-force",T("pdrForce"),pdrForceReveal));
   wrap.appendChild(div("codice-legend",T("pdrForceHint")));
  } else {
   clearTimeout(PDR.forceTimer);PDR.forceTimer=setTimeout(function(){PDR.sig="";pdrRender(true);},(st.leader===PDR.me?PDR_FORCE_MS:PDR_FORCE_MS+15000)-waited+200);
  }
 }
}
function pdrScreenReveal(wrap,st){
 var q=pdrQuestionBox(wrap,st)||{};
 var rd=st.rounds[st.q]||{answers:{},winners:[],key:PDR_KEY.charAt(st.qs[st.q])};
 var box=div("agr-answer");
 box.appendChild(div("agr-answer-l",T("ui_risposta_corretta")));
 box.appendChild(div("agr-answer-v pdr-key",pdrChoiceLabel(rd.key)));
 // La spiegazione dice già quale viene prima: la frase di risposta del gioco al tavolo ("PRIMA Wikipedia…") si mostra solo se manca la spiegazione
 if(q.a&&!q.extra)box.appendChild(div("pdr-a",q.a));
 if(q.extra)box.appendChild(div("agr-answer-c",q.extra));
 wrap.appendChild(box);
 var rows=st.order.map(function(n){var a=rd.answers[n];return {n:n,a:a,ok:!!(a&&!a.skip&&a.c===rd.key)};}).sort(function(x,y){return (y.ok?1:0)-(x.ok?1:0);});
 var list=div("agr-list");
 rows.forEach(function(r){
  var row=div("agr-row"+(r.ok?" win":""));
  row.appendChild(div("agr-row-n",(r.n===PDR.me?T("cdrYou2"):r.n)+(st.isLeft(r.n)?" · "+T("cdrLeftTag"):"")));
  row.appendChild(div("agr-row-v",(r.a&&!r.a.skip)?pdrChoiceLabel(r.a.c)+(r.ok?"  ✓":"  ✗"):T("pdrNoAnswer")));
  list.appendChild(row);
 });
 wrap.appendChild(list);
 if(rd.winners.length){
  var me=rd.winners.indexOf(PDR.me)>=0;
  wrap.appendChild(div("agr-point",me?T("pdrPointMe"):T("pdrPoint").replace("{n}",rd.winners.join(", "))));
 } else wrap.appendChild(div("agr-point",T("pdrNobody")));
 pdrScores(wrap,st);
 if(st.leader===PDR.me){
  var nx=btn("codice-cta",st.last?T("pdrFinal"):T("pdrNext"),function(){if(nx.disabled)return;nx.disabled=true;pdrNext();});
  wrap.appendChild(nx);
 } else {
  wrap.appendChild(div("cdr-wait",T("pdrWaitNext").replace("{n}",st.leader||"")));
  // Se chi guida non va avanti (telefono bloccato) dopo 30 secondi può farlo anche un altro
  var rk=st.game+"|"+st.q;
  if(PDR.revKey!==rk){PDR.revKey=rk;PDR.revSince=Date.now();}
  var w=Date.now()-PDR.revSince;
  if(w>=30000){var nx2=btn("ebtn out",st.last?T("pdrFinal"):T("pdrNext"),function(){if(nx2.disabled)return;nx2.disabled=true;pdrNext();});wrap.appendChild(nx2);}
  else{clearTimeout(PDR.forceTimer);PDR.forceTimer=setTimeout(function(){PDR.sig="";pdrRender(true);},30000-w+200);}
 }
}
function pdrScores(wrap,st){
 wrap.appendChild(div("codice-section",T("ui_punteggi_totali")));
 var sc=div("agr-scores");
 st.order.slice().sort(function(a,b){return st.scores[b]-st.scores[a];}).forEach(function(n){
  var r=div("agr-score");r.appendChild(div("agr-score-n",(n===PDR.me?T("cdrYou2"):n)+(st.isLeft(n)?" · "+T("cdrLeftTag"):"")));r.appendChild(div("agr-score-v",st.scores[n]+" pt"));sc.appendChild(r);
 });
 wrap.appendChild(sc);
}
function pdrScreenEnd(wrap,st){
 if(st.interrupted){
  wrap.appendChild(div("end-title",T("cdrInterrupted")));
  wrap.appendChild(div("end-sub",T("cdrInterruptedSub")));
 } else {
  var max=-1;st.order.forEach(function(n){if(st.scores[n]>max)max=st.scores[n];});
  var top=st.order.filter(function(n){return st.scores[n]===max;});
  var title=top.length>1?T("pdrTie").replace("{n}",top.join(", ")):(top[0]===PDR.me?T("cdrYouWon"):top[0]+" "+T("qvWon"));
  wrap.appendChild(div("end-title",title));
  wrap.appendChild(div("end-sub",T("pdrEndSub").replace("{p}",max).replace("{t}",st.qs.length)));
 }
 pdrScores(wrap,st);
 if(st.leader===PDR.me)rlLevelPicker(wrap,rlLevel(st.meta),true,pdrSetLevel);
 var btns=div("endbtns");
 if(st.leader===PDR.me)btns.appendChild(btn("ebtn",T("qvPlayAgain"),pdrRematch));
 else wrap.appendChild(div("cdr-wait",T("cdrWaitRematch").replace("{n}",st.leader||"")));
 btns.appendChild(btn("ebtn out",T("exitBtn"),function(){pdrLeave();goHome();}));
 wrap.appendChild(btns);
}

// Stringhe (aggiunte quando l'interfaccia è pronta: STRINGS è definito dopo questo file)
function pdrStrings(){
 if(typeof STRINGS==="undefined"||STRINGS.it.pdrIntro)return;
 Object.assign(STRINGS.it,{pdrTitle:"PRIMA O DOPO?",pdrIntro:"Ognuno risponde dal proprio telefono, anche da tavoli diversi. Lancia la sfida: agli altri arriva una notifica e toccando Gioca entrano nella partita.",pdrRound:"Domanda {n} di {t}",pdrHint:"Il primo è venuto prima o dopo il secondo?",pdrBefore:"Prima",pdrAfter:"Dopo",pdrSame:"Stesso periodo",pdrConfirm:"Conferma",pdrYourAnswer:"La tua risposta: {y}",pdrWaiting:"Hanno risposto {a} su {t}",pdrForce:"Mostra le risposte",pdrForceHint:"Chi non ha ancora risposto non prende punti in questa domanda.",pdrNoAnswer:"nessuna risposta",pdrPoint:"Punto a {n}",pdrPointMe:"Hai indovinato, punto per te!",pdrNobody:"Nessuno ha indovinato",pdrNext:"Prossima domanda",pdrFinal:"Risultati finali",pdrWaitNext:"Aspetta che {n} vada avanti",pdrTie:"Pareggio tra {n}",pdrEndSub:"{p} punti su {t} domande",pdrRoomFull:"La partita è al completo (massimo 8 giocatori)"});
 Object.assign(STRINGS.en,{pdrTitle:"BEFORE OR AFTER?",pdrIntro:"Everyone answers on their own phone, even from different tables. Send the challenge: the others get a notification and tap Play to join.",pdrRound:"Question {n} of {t}",pdrHint:"Did the first one come before or after the second?",pdrBefore:"Before",pdrAfter:"After",pdrSame:"Same time",pdrConfirm:"Confirm",pdrYourAnswer:"Your answer: {y}",pdrWaiting:"{a} of {t} have answered",pdrForce:"Show the answers",pdrForceHint:"Anyone who hasn't answered yet gets no point for this question.",pdrNoAnswer:"no answer",pdrPoint:"Point to {n}",pdrPointMe:"You got it, point for you!",pdrNobody:"Nobody got it right",pdrNext:"Next question",pdrFinal:"Final results",pdrWaitNext:"Waiting for {n} to move on",pdrTie:"Tie between {n}",pdrEndSub:"{p} points out of {t} questions",pdrRoomFull:"The game is full (maximum 8 players)"});
 Object.assign(STRINGS.es,{pdrTitle:"¿ANTES O DESPUÉS?",pdrIntro:"Cada uno responde desde su móvil, incluso desde mesas distintas. Lanza el desafío: a los demás les llega una notificación y al tocar Jugar entran en la partida.",pdrRound:"Pregunta {n} de {t}",pdrHint:"¿El primero fue antes o después que el segundo?",pdrBefore:"Antes",pdrAfter:"Después",pdrSame:"Misma época",pdrConfirm:"Confirmar",pdrYourAnswer:"Tu respuesta: {y}",pdrWaiting:"Han respondido {a} de {t}",pdrForce:"Mostrar las respuestas",pdrForceHint:"Quien aún no ha respondido no suma puntos en esta pregunta.",pdrNoAnswer:"sin respuesta",pdrPoint:"Punto para {n}",pdrPointMe:"¡Acertaste, punto para ti!",pdrNobody:"Nadie ha acertado",pdrNext:"Siguiente pregunta",pdrFinal:"Resultados finales",pdrWaitNext:"Esperando a que {n} siga",pdrTie:"Empate entre {n}",pdrEndSub:"{p} puntos de {t} preguntas",pdrRoomFull:"La partida está completa (máximo 8 jugadores)"});
}
