/*!
 * Filòs — © 2026 i titolari del progetto Filòs. Tutti i diritti riservati.
 * Codice e contenuti sono opere protette dalla legge sul diritto d'autore (L. 633/1941).
 * È vietata qualsiasi copia, riproduzione, modifica o ridistribuzione senza autorizzazione scritta.
 */
// ══════════════════════════════════════════
// CHE BANDIERA È? — A DISTANZA
// Stesso collegamento degli altri giochi a distanza (sfida con notifica, sala d'attesa, Guida).
// Ogni telefono ricostruisce la partita dagli stessi dati condivisi:
//  rooms/{code}/fl/players/{nome} = {n,t}
//  rooms/{code}/fl/meta = {phase, order, game, qs, opts, q, rv, end}   scritto da chi guida
//  rooms/{code}/fl/left/{nome} = true
//  rooms/{code}/fl/g{game}/a{q}/{nome} = {c:indice del paese scelto} | {skip:true}
// qs: le 10 bandiere (indici dell'elenco CHE BANDIERA È?, stesso ordine in tutte le lingue).
// opts: per ogni bandiera i 4 paesi tra cui scegliere, già mescolati, uguali per tutti:
// ognuno li legge nella propria lingua.
// ══════════════════════════════════════════
var FGR_MAX_PLAYERS=8,FGR_ROUNDS=10,FGR_FORCE_MS=45000;
var FGR={code:null,me:null,data:null,unsub:null,sig:"",val:null,valKey:"",busy:false,closed:false};

function fgrPath(p){return "rooms/"+FGR.code+"/fl"+(p?"/"+p:"");}
function fgrMaxYear(){return new Date().getFullYear();}

// ── Stato derivato ──
function fgrState(){
 var d=FGR.data||{};var meta=d.meta||{phase:"lobby",order:[],game:1};
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
 var opts=meta.opts||[];
 var gd=d["g"+game]||{};
 function answersOf(r){
  var raw=gd["a"+r]||{};var out={};
  order.forEach(function(n){var a=raw[cdrKey(n)];if(a&&(a.skip||(typeof a.c==="number"&&(opts[r]||[]).indexOf(a.c)>=0)))out[n]=a;});
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
  var key=qs[r];if(typeof key!=="number")continue;
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
 return {meta:meta,phase:phase,players:players,lobby:lobby,order:order,active:active,isLeft:isLeft,game:game,qs:qs,opts:opts,q:q,cur:cur,allIn:allIn,reveal:reveal,scores:scores,rounds:rounds,ended:ended,interrupted:interrupted,leader:leader,last:q>=qs.length-1};
}
function fgrList(){
 var D=(LANG==="en"&&typeof QUIZ_DATA_EN!=="undefined")?QUIZ_DATA_EN:(LANG==="es"&&typeof QUIZ_DATA_ES!=="undefined")?QUIZ_DATA_ES:(typeof QUIZ_DATA!=="undefined"?QUIZ_DATA:null);
 var g=D&&D["CHE BANDIERA È?"];
 if(!g&&typeof QUIZ_DATA!=="undefined")g=QUIZ_DATA["CHE BANDIERA È?"];
 return (g&&g.questions)||[];
}
function fgrCount(){return (typeof QUIZ_DATA!=="undefined"&&QUIZ_DATA["CHE BANDIERA È?"])?QUIZ_DATA["CHE BANDIERA È?"].questions.length:0;}
// Immagine della bandiera (solo l'indirizzo dell'immagine, preso dai dati del gioco)
function fgrFlagSrc(idx){var it=fgrList()[idx];var m=it&&String(it.q).match(/src="([^"]+)"/);return m?m[1]:"";}
function fgrName(idx){var it=fgrList()[idx];return it?String(it.a):"";}
function fgrQuestion(idx){var it=fgrList()[idx];if(!it)return null;return {src:fgrFlagSrc(idx),a:it.a,extra:it.extra};}
function fgrShuffle(a){for(var j=a.length-1;j>0;j--){var k=Math.floor(Math.random()*(j+1));var t=a[j];a[j]=a[k];a[k]=t;}return a;}
// 10 bandiere diverse, e per ognuna 4 paesi (quello giusto più 3 a caso) in ordine casuale
function fgrPickRound(){
 var n=fgrCount();var idx=[];for(var i=0;i<n;i++)idx.push(i);
 var qs=fgrShuffle(idx.slice()).slice(0,Math.min(FGR_ROUNDS,n));
 var opts=qs.map(function(q){
  var others=fgrShuffle(idx.filter(function(x){return x!==q;})).slice(0,Math.min(3,n-1));
  return fgrShuffle([q].concat(others));
 });
 return {qs:qs,opts:opts};
}
// ── Stanza: crea, entra, esci ──
function fgrCreate(done){
 cdrStrings();fgrStrings();
 if(!fbDB){done(false,T("firebaseErr"));return;}
 var tries=0;
 (function attempt(){
  tries++;var code=String(Math.floor(1000+Math.random()*9000));
  cdrNet(fbGet(fbRef(fbDB,"rooms/"+code))).then(function(snap){
   if(snap.exists()&&tries<8){attempt();return;}
   var me=cdrMyName();var now=Date.now();
   var room={created:now,kind:"bandiera",fl:{meta:{phase:"lobby",order:[],game:1},players:{}}};
   room.fl.players[cdrKey(me)]={n:me,t:now};
   cdrNet(fbSet(fbRef(fbDB,"rooms/"+code),room)).then(function(){fgrAttach(code,me);done(true);}).catch(function(){done(false,T("connErr"));});
  }).catch(function(){done(false,T("connErr"));});
 })();
}
function fgrJoin(code,done){
 cdrStrings();fgrStrings();
 if(!fbDB){done(false,T("firebaseErr"));return;}
 code=String(code||"").replace(/\D/g,"");
 if(code.length!==4){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
 cdrNet(fbGet(fbRef(fbDB,"rooms/"+code+"/fl"))).then(function(snap){
  if(!snap.exists()){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
  var d=snap.val()||{};var meta=d.meta||{};
  if(meta.phase&&meta.phase!=="lobby"){done(false,T("cdrAlreadyStarted"));return;}
  var left=d.left||{};
  var taken=Object.keys(d.players||{}).filter(function(k){return !left[k];}).map(function(k){return d.players[k].n||k;});
  if(!taken.length){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
  if(taken.length>=FGR_MAX_PLAYERS){done(false,T("fgrRoomFull"));return;}
  var me=cdrUniqueName(cdrMyName(),taken);var k=cdrKey(me);
  var clearLeft=left[k]?cdrNet(fbSet(fbRef(fbDB,"rooms/"+code+"/fl/left/"+k),null)):Promise.resolve();
  clearLeft.then(function(){return cdrNet(fbSet(fbRef(fbDB,"rooms/"+code+"/fl/players/"+k),{n:me,t:Date.now()}));}).then(function(){fgrAttach(code,me);done(true);}).catch(function(){done(false,T("connErr"));});
 }).catch(function(){done(false,T("connErr"));});
}
function fgrAttach(code,me){
 fgrDetach();
 FGR.code=code;FGR.me=me;FGR.data=null;FGR.sig="";FGR.val=null;FGR.valKey="";FGR.closed=false;FGR.busy=false;
 FGR.unsub=fbOnValue(fbRef(fbDB,"rooms/"+code+"/fl"),function(snap){
  var v=snap.val();
  if(!v){FGR.closed=true;FGR.data=null;}else{FGR.data=v;}
  if(S.screen==="fgr")fgrRender(false);
 });
}
function fgrDetach(){if(FGR.unsub){try{FGR.unsub();}catch(e){}}FGR.unsub=null;clearTimeout(FGR.forceTimer);}
function fgrLeave(){
 if(FGR.code&&FGR.me&&fbDB&&!FGR.closed){
  // Lo stato si legge prima di segnare l'uscita: scrivere su Firebase aggiorna subito i dati locali
  // Se chi guida annulla la sfida mentre si aspetta, o se non resta nessuno, la stanza viene chiusa per tutti
  var close=false;
  try{var st=fgrState();close=(st.phase==="lobby"&&st.leader===FGR.me)||st.lobby.filter(function(n){return n!==FGR.me;}).length===0;}catch(e){}
  var code=FGR.code;
  if(close){try{fbRemove(fbRef(fbDB,"rooms/"+code));}catch(e){}}
  else{try{fbSet(fbRef(fbDB,fgrPath("left/"+cdrKey(FGR.me))),true);}catch(e){}}
 }
 fgrDetach();
 FGR.code=null;FGR.me=null;FGR.data=null;FGR.sig="";FGR.val=null;FGR.closed=false;
}
window.addEventListener("pagehide",function(e){if(FGR.code&&!(e&&e.persisted))fgrLeave();});
function fgrExit(){fgrLeave();goBackToGames();}

// ── Azioni ──
function fgrStart(){
 var st=fgrState();if(st.leader!==FGR.me||st.lobby.length<2||FGR.busy)return;
 FGR.busy=true;
 cdrNet(fbSet(fbRef(fbDB,fgrPath("meta")),Object.assign({phase:"play",order:st.lobby.slice(0,FGR_MAX_PLAYERS),game:st.game,q:0,rv:-1,end:false},fgrPickRound()))).then(function(){FGR.busy=false;}).catch(function(){FGR.busy=false;cdrToast(T("connErr"));});
}
function fgrAnswer(v){
 if(typeof v!=="number")return;
 var st=fgrState();
 if(st.phase!=="play"||st.ended||st.reveal||st.active.indexOf(FGR.me)<0||st.cur[FGR.me]||FGR.busy)return;
 if((st.opts[st.q]||[]).indexOf(v)<0)return;
 FGR.busy=true;
 var ref=fbRef(fbDB,fgrPath("g"+st.game+"/a"+st.q+"/"+cdrKey(FGR.me)));
 // La risposta si scrive una volta sola (doppio tocco o rete lenta non la cambiano)
 cdrNet(fbGet(ref)).then(function(snap){
  if(snap.exists()){FGR.busy=false;FGR.sig="";fgrRender(true);return;}
  return cdrNet(fbSet(ref,{c:v,t:Date.now()})).then(function(){FGR.busy=false;FGR.sig="";fgrRender(true);});
 }).catch(function(){FGR.busy=false;cdrToast(T("connErr"));FGR.sig="";fgrRender(true);});
}
// Se qualcuno non risponde (telefono spento, app chiusa) dopo un po' chi ha già risposto può mostrare le risposte.
// Scrivere due volte lo stesso valore non cambia nulla, quindi più telefoni possono farlo insieme senza problemi.
function fgrForceReveal(){
 var st=fgrState();if(!st.cur[FGR.me]||st.reveal||st.ended||FGR.busy)return;
 FGR.busy=true;
 var m=Object.assign({},st.meta,{rv:st.q});
 cdrNet(fbSet(fbRef(fbDB,fgrPath("meta")),m)).then(function(){FGR.busy=false;}).catch(function(){FGR.busy=false;cdrToast(T("connErr"));});
}
function fgrNext(){
 var st=fgrState();if(!st.reveal||st.ended||FGR.busy)return;
 FGR.busy=true;
 var m=Object.assign({},st.meta);
 if(st.last)m.end=true;else{m.q=st.q+1;m.rv=-1;}
 cdrNet(fbSet(fbRef(fbDB,fgrPath("meta")),m)).then(function(){FGR.busy=false;}).catch(function(){FGR.busy=false;cdrToast(T("connErr"));});
}
function fgrRematch(){
 var st=fgrState();if(st.leader!==FGR.me||FGR.busy)return;
 var still=st.order.filter(function(n){return !st.isLeft(n);});
 FGR.busy=true;
 var m=still.length<2?{phase:"lobby",order:[],game:st.game+1}:Object.assign({phase:"play",order:still,game:st.game+1,q:0,rv:-1,end:false},fgrPickRound());
 cdrNet(fbSet(fbRef(fbDB,fgrPath("meta")),m)).then(function(){FGR.busy=false;}).catch(function(){FGR.busy=false;cdrToast(T("connErr"));});
}
function fgrInvite(silent){
 if(!fbDB||!FGR.code)return;
 var inv={from:FGR.me,game:"CHE BANDIERA È?",kind:"bandiera",cat:"relax",roomCode:FGR.code,dev:(typeof filosDevId==="function"?filosDevId():null),pubCode:(typeof FILOS_PUB_CODE!=="undefined"?FILOS_PUB_CODE:null)||null,ts:Date.now()};
 var key="inv_"+Date.now();
 try{fbSet(fbRef(fbDB,"filos_invites/"+key),inv);setTimeout(function(){try{fbRemove(fbRef(fbDB,"filos_invites/"+key));}catch(e){}},30000);if(!silent)cdrToast(T("cdrInviteSent"));}catch(e){}
}

// ── Schermate ──
function renderFlRemote(){fgrRender(true);}
function fgrSignature(st){
 var s=[FGR.closed,st.phase,st.lobby,st.active,st.game,st.q,st.reveal,st.ended,st.leader,LANG,!!st.cur[FGR.me]];
 // Mentre si sceglie la risposta la schermata non si ridisegna quando rispondono gli altri
 if(st.cur[FGR.me]||st.reveal||st.active.indexOf(FGR.me)<0)s.push(Object.keys(st.cur));
 return JSON.stringify(s);
}
function fgrRender(force){
 if(S.screen!=="fgr")return;
 cdrStrings();fgrStrings();
 var st=FGR.code?fgrState():null;
 var sig=FGR.code?fgrSignature(st):"none";
 if(!force&&sig===FGR.sig)return;
 FGR.sig=sig;
 clr();
 addBackArrow(fgrExit);
 var wrap=div("codice-wrap cdr agr fgr");wrap.style.textAlign="center";
 document.getElementById("root").appendChild(wrap);
 if(!FGR.code){fgrScreenStart(wrap);return;}
 if(FGR.closed){
  wrap.appendChild(div("codice-big",T("cdrClosed")));
  wrap.appendChild(div("codice-sub",T("cdrClosedSub")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),fgrExit));
  return;
 }
 if(!FGR.data){wrap.appendChild(div("codice-sub",T("cdrConnecting")));return;}
 if(st.isLeft(FGR.me)){
  wrap.appendChild(div("codice-big",T("cdrYouLeft")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),fgrExit));
  return;
 }
 if(st.phase==="lobby"){fgrScreenLobby(wrap,st);return;}
 if(st.order.indexOf(FGR.me)<0){
  wrap.appendChild(div("codice-big",T("cdrAlreadyStarted")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),fgrExit));
  return;
 }
 if(st.ended){fgrScreenEnd(wrap,st);return;}
 if(st.reveal){fgrScreenReveal(wrap,st);return;}
 if(!st.cur[FGR.me])fgrScreenAnswer(wrap,st);
 else fgrScreenWait(wrap,st);
}
function fgrScreenStart(wrap){
 cdrHeader(wrap,T("cdrRemote"),T("fgrTitle"),T("fgrIntro"));
 if(!fbDB){wrap.appendChild(div("codice-sub",T("firebaseErr")));return;}
 var err=div("cdr-err");
 var sfida=btn("codice-cta",T("ui_sfida_un_altro_tavolo"),function(){
  if(sfida.disabled)return;
  sfida.disabled=true;sfida.textContent=T("ui_invio_sfida");err.textContent="";
  fgrCreate(function(ok,msg){
   if(!ok){sfida.disabled=false;sfida.textContent=T("ui_sfida_un_altro_tavolo");err.textContent=msg||T("connErr");return;}
   fgrInvite(true);
   if(S.screen!=="fgr"){fgrLeave();return;}
   fgrRender(true);
  });
 });
 wrap.appendChild(sfida);
 wrap.appendChild(div("codice-legend",T("ui_gli_altri_dispositivi_riceveranno_una")));
 wrap.appendChild(err);
}
function fgrScreenLobby(wrap,st){
 var lead=st.leader===FGR.me;
 cdrHeader(wrap,lead?T("ui_in_attesa_degli_altri"):T("ui_connesso"),T("fgrTitle"),lead?null:T("cdrWaitHost").replace("{n}",st.leader||""));
 wrap.appendChild(div("codice-section",T("playersInRoom")+" "+st.lobby.length+"/"+FGR_MAX_PLAYERS));
 var list=div("cdr-list");
 st.lobby.forEach(function(n){var r=div("cdr-row");r.appendChild(div("cdr-dot on"));r.appendChild(div("cdr-name",n+(n===FGR.me?" "+T("cdrYou"):"")));if(n===st.leader)r.appendChild(div("cdr-tag",T("cdrHost")));list.appendChild(r);});
 wrap.appendChild(list);
 if(lead){
  var go=btn("codice-cta",T("qvStart"),fgrStart);
  go.disabled=st.lobby.length<2;
  wrap.appendChild(go);
  if(st.lobby.length<2)wrap.appendChild(div("codice-legend",T("ui_aspetta_che_si_colleghi_almeno")));
  if(st.lobby.length<FGR_MAX_PLAYERS)wrap.appendChild(btn("cdr-link",T("cdrResend"),function(){fgrInvite();}));
  wrap.appendChild(btn("cdr-link muted",T("ui_annulla_sfida"),fgrExit));
 } else {
  wrap.appendChild(btn("cdr-link muted",T("ui_esci_dalla_stanza"),fgrExit));
 }
}
function fgrQuestionBox(wrap,st){
 wrap.appendChild(div("agr-round",T("fgrRound").replace("{n}",st.q+1).replace("{t}",st.qs.length)));
 var q=fgrQuestion(st.qs[st.q])||{src:"",a:"",extra:""};
 var box=div("fgr-flag");
 if(q.src){var im=document.createElement("img");im.src=q.src;im.alt="";box.appendChild(im);}
 wrap.appendChild(box);
 return q;
}
function fgrChoiceLabel(c){return fgrName(c);}
function fgrScreenAnswer(wrap,st){
 fgrQuestionBox(wrap,st);
 var key=st.game+"|"+st.q;
 if(FGR.valKey!==key){FGR.valKey=key;FGR.val=null;}
 wrap.appendChild(div("pdr-hint",T("fgrHint")));
 var opts=div("pdr-opts");var ok;
 (st.opts[st.q]||[]).forEach(function(c){
  var b=btn("pdr-opt fgr-opt"+(FGR.val===c?" on":""),fgrChoiceLabel(c),function(){
   FGR.val=c;
   [].forEach.call(opts.children,function(x){x.classList.toggle("on",x===b);});
   if(ok)ok.disabled=false;
  });
  opts.appendChild(b);
 });
 wrap.appendChild(opts);
 ok=btn("codice-cta",T("fgrConfirm"),function(){if(ok.disabled||FGR.val===null)return;ok.disabled=true;fgrAnswer(FGR.val);});
 ok.disabled=FGR.val===null;
 wrap.appendChild(ok);
}
function fgrChips(wrap,st){
 var chips=div("agr-chips");
 st.active.forEach(function(n){chips.appendChild(div("agr-chip"+(st.cur[n]?" on":""),n===FGR.me?T("cdrYou2"):n));});
 wrap.appendChild(chips);
}
function fgrScreenWait(wrap,st){
 fgrQuestionBox(wrap,st);
 var mine=st.cur[FGR.me];
 var box=div("agr-sent");
 box.appendChild(div("agr-sent-t",T("qvAnswerSent")));
 if(mine&&!mine.skip)box.appendChild(div("agr-sent-v",T("fgrYourAnswer").replace("{y}",fgrChoiceLabel(mine.c))));
 wrap.appendChild(box);
 var missing=st.active.filter(function(n){return !st.cur[n];});
 wrap.appendChild(div("codice-sub",T("fgrWaiting").replace("{a}",st.active.length-missing.length).replace("{t}",st.active.length)));
 fgrChips(wrap,st);
 {
  var key=st.game+"|"+st.q;
  if(FGR.waitKey!==key){FGR.waitKey=key;FGR.waitSince=Date.now();}
  var waited=Date.now()-FGR.waitSince;
  if(waited>=(st.leader===FGR.me?FGR_FORCE_MS:FGR_FORCE_MS+15000)){
   wrap.appendChild(btn("ebtn out agr-force",T("fgrForce"),fgrForceReveal));
   wrap.appendChild(div("codice-legend",T("fgrForceHint")));
  } else {
   clearTimeout(FGR.forceTimer);FGR.forceTimer=setTimeout(function(){FGR.sig="";fgrRender(true);},(st.leader===FGR.me?FGR_FORCE_MS:FGR_FORCE_MS+15000)-waited+200);
  }
 }
}
function fgrScreenReveal(wrap,st){
 var q=fgrQuestionBox(wrap,st)||{};
 var rd=st.rounds[st.q]||{answers:{},winners:[],key:st.qs[st.q]};
 var box=div("agr-answer");
 box.appendChild(div("agr-answer-l",T("ui_risposta_corretta")));
 box.appendChild(div("agr-answer-v pdr-key fgr-key",fgrChoiceLabel(rd.key)));
 if(q.extra)box.appendChild(div("agr-answer-c",q.extra));
 wrap.appendChild(box);
 var rows=st.order.map(function(n){var a=rd.answers[n];return {n:n,a:a,ok:!!(a&&!a.skip&&a.c===rd.key)};}).sort(function(x,y){return (y.ok?1:0)-(x.ok?1:0);});
 var list=div("agr-list");
 rows.forEach(function(r){
  var row=div("agr-row"+(r.ok?" win":""));
  row.appendChild(div("agr-row-n",(r.n===FGR.me?T("cdrYou2"):r.n)+(st.isLeft(r.n)?" · "+T("cdrLeftTag"):"")));
  row.appendChild(div("agr-row-v",(r.a&&!r.a.skip)?fgrChoiceLabel(r.a.c)+(r.ok?"  ✓":"  ✗"):T("fgrNoAnswer")));
  list.appendChild(row);
 });
 wrap.appendChild(list);
 if(rd.winners.length){
  var me=rd.winners.indexOf(FGR.me)>=0;
  wrap.appendChild(div("agr-point",me?T("fgrPointMe"):T("fgrPoint").replace("{n}",rd.winners.join(", "))));
 } else wrap.appendChild(div("agr-point",T("fgrNobody")));
 fgrScores(wrap,st);
 if(st.leader===FGR.me){
  var nx=btn("codice-cta",st.last?T("fgrFinal"):T("fgrNext"),function(){if(nx.disabled)return;nx.disabled=true;fgrNext();});
  wrap.appendChild(nx);
 } else {
  wrap.appendChild(div("cdr-wait",T("fgrWaitNext").replace("{n}",st.leader||"")));
  // Se chi guida non va avanti (telefono bloccato) dopo 30 secondi può farlo anche un altro
  var rk=st.game+"|"+st.q;
  if(FGR.revKey!==rk){FGR.revKey=rk;FGR.revSince=Date.now();}
  var w=Date.now()-FGR.revSince;
  if(w>=30000){var nx2=btn("ebtn out",st.last?T("fgrFinal"):T("fgrNext"),function(){if(nx2.disabled)return;nx2.disabled=true;fgrNext();});wrap.appendChild(nx2);}
  else{clearTimeout(FGR.forceTimer);FGR.forceTimer=setTimeout(function(){FGR.sig="";fgrRender(true);},30000-w+200);}
 }
}
function fgrScores(wrap,st){
 wrap.appendChild(div("codice-section",T("ui_punteggi_totali")));
 var sc=div("agr-scores");
 st.order.slice().sort(function(a,b){return st.scores[b]-st.scores[a];}).forEach(function(n){
  var r=div("agr-score");r.appendChild(div("agr-score-n",(n===FGR.me?T("cdrYou2"):n)+(st.isLeft(n)?" · "+T("cdrLeftTag"):"")));r.appendChild(div("agr-score-v",st.scores[n]+" pt"));sc.appendChild(r);
 });
 wrap.appendChild(sc);
}
function fgrScreenEnd(wrap,st){
 if(st.interrupted){
  wrap.appendChild(div("end-title",T("cdrInterrupted")));
  wrap.appendChild(div("end-sub",T("cdrInterruptedSub")));
 } else {
  var max=-1;st.order.forEach(function(n){if(st.scores[n]>max)max=st.scores[n];});
  var top=st.order.filter(function(n){return st.scores[n]===max;});
  var title=top.length>1?T("fgrTie").replace("{n}",top.join(", ")):(top[0]===FGR.me?T("cdrYouWon"):top[0]+" "+T("qvWon"));
  wrap.appendChild(div("end-title",title));
  wrap.appendChild(div("end-sub",T("fgrEndSub").replace("{p}",max).replace("{t}",st.qs.length)));
 }
 fgrScores(wrap,st);
 var btns=div("endbtns");
 if(st.leader===FGR.me)btns.appendChild(btn("ebtn",T("qvPlayAgain"),fgrRematch));
 else wrap.appendChild(div("cdr-wait",T("cdrWaitRematch").replace("{n}",st.leader||"")));
 btns.appendChild(btn("ebtn out",T("exitBtn"),function(){fgrLeave();goHome();}));
 wrap.appendChild(btns);
}

// Stringhe (aggiunte quando l'interfaccia è pronta: STRINGS è definito dopo questo file)
function fgrStrings(){
 if(typeof STRINGS==="undefined"||STRINGS.it.fgrIntro)return;
 Object.assign(STRINGS.it,{fgrTitle:"CHE BANDIERA È?",fgrIntro:"Ognuno risponde dal proprio telefono, anche da tavoli diversi. Lancia la sfida: agli altri arriva una notifica e toccando Gioca entrano nella partita.",fgrRound:"Bandiera {n} di {t}",fgrHint:"Di quale paese è questa bandiera?",fgrConfirm:"Conferma",fgrYourAnswer:"La tua risposta: {y}",fgrWaiting:"Hanno risposto {a} su {t}",fgrForce:"Mostra le risposte",fgrForceHint:"Chi non ha ancora risposto non prende punti in questa bandiera.",fgrNoAnswer:"nessuna risposta",fgrPoint:"Punto a {n}",fgrPointMe:"Hai indovinato, punto per te!",fgrNobody:"Nessuno ha indovinato",fgrNext:"Prossima bandiera",fgrFinal:"Risultati finali",fgrWaitNext:"Aspetta che {n} vada avanti",fgrTie:"Pareggio tra {n}",fgrEndSub:"{p} punti su {t} bandiere",fgrRoomFull:"La partita è al completo (massimo 8 giocatori)"});
 Object.assign(STRINGS.en,{fgrTitle:"WHAT FLAG IS IT?",fgrIntro:"Everyone answers on their own phone, even from different tables. Send the challenge: the others get a notification and tap Play to join.",fgrRound:"Flag {n} of {t}",fgrHint:"Which country does this flag belong to?",fgrConfirm:"Confirm",fgrYourAnswer:"Your answer: {y}",fgrWaiting:"{a} of {t} have answered",fgrForce:"Show the answers",fgrForceHint:"Anyone who hasn't answered yet gets no point for this flag.",fgrNoAnswer:"no answer",fgrPoint:"Point to {n}",fgrPointMe:"You got it, point for you!",fgrNobody:"Nobody got it right",fgrNext:"Next flag",fgrFinal:"Final results",fgrWaitNext:"Waiting for {n} to move on",fgrTie:"Tie between {n}",fgrEndSub:"{p} points out of {t} flags",fgrRoomFull:"The game is full (maximum 8 players)"});
 Object.assign(STRINGS.es,{fgrTitle:"¿QUÉ BANDERA ES?",fgrIntro:"Cada uno responde desde su móvil, incluso desde mesas distintas. Lanza el desafío: a los demás les llega una notificación y al tocar Jugar entran en la partida.",fgrRound:"Bandera {n} de {t}",fgrHint:"¿De qué país es esta bandera?",fgrConfirm:"Confirmar",fgrYourAnswer:"Tu respuesta: {y}",fgrWaiting:"Han respondido {a} de {t}",fgrForce:"Mostrar las respuestas",fgrForceHint:"Quien aún no ha respondido no suma puntos en esta bandera.",fgrNoAnswer:"sin respuesta",fgrPoint:"Punto para {n}",fgrPointMe:"¡Acertaste, punto para ti!",fgrNobody:"Nadie ha acertado",fgrNext:"Siguiente bandera",fgrFinal:"Resultados finales",fgrWaitNext:"Esperando a que {n} siga",fgrTie:"Empate entre {n}",fgrEndSub:"{p} puntos de {t} banderas",fgrRoomFull:"La partida está completa (máximo 8 jugadores)"});
}
