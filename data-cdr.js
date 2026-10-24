/*!
 * Filòs — © 2026 i titolari del progetto Filòs. Tutti i diritti riservati.
 * Codice e contenuti sono opere protette dalla legge sul diritto d'autore (L. 633/1941).
 * È vietata qualsiasi copia, riproduzione, modifica o ridistribuzione senza autorizzazione scritta.
 */
// ══════════════════════════════════════════
// INDOVINA IL CODICE — A DISTANZA
// Ogni giocatore usa il proprio telefono. Lo stato della partita è ricostruito da ogni
// telefono a partire dagli stessi dati condivisi (giocatori, codici, tentativi), così
// tutti vedono sempre la stessa cosa:
//  rooms/{code}/cd/players/{nome} = {t}         chi è entrato nella stanza
//  rooms/{code}/cd/meta = {phase, order, round}  scritto da chi guida la stanza
//  rooms/{code}/cd/left/{nome} = true            chi è uscito
//  rooms/{code}/cd/r{round}/secrets/{nome}       codice segreto (offuscato)
//  rooms/{code}/cd/r{round}/moves/{n}            tentativi, in ordine
// ══════════════════════════════════════════
var CDR_MAX_PLAYERS=6;
var CDR={code:null,me:null,data:null,unsub:null,sig:"",typing:false,entry:[],target:null,view:null,busy:false,closed:false};

function cdrT(k){return T(k);}
// Le operazioni di rete hanno un limite di tempo: con connessione assente o lenta si mostra un errore invece di restare bloccati
function cdrNet(promise,ms){return new Promise(function(res,rej){var done=false;var t=setTimeout(function(){if(!done){done=true;rej(new Error("timeout"));}},ms||9000);promise.then(function(v){if(!done){done=true;clearTimeout(t);res(v);}},function(e){if(!done){done=true;clearTimeout(t);rej(e);}});});}
function cdrPath(p){return "rooms/"+CDR.code+"/cd"+(p?"/"+p:"");}
function cdrKey(name){return String(name).replace(/[.#$\[\]\/]/g,"_");}
function cdrEnc(secret,round){var s=secret.join("")+"|"+CDR.code+"|"+round;var o="";for(var i=0;i<s.length;i++)o+=String.fromCharCode(s.charCodeAt(i)^(23+i*7)%61);return btoa(o);}
function cdrDec(v,round){try{var s=atob(v),o="";for(var i=0;i<s.length;i++)o+=String.fromCharCode(s.charCodeAt(i)^(23+i*7)%61);var p=o.split("|");if(p[1]!==String(CDR.code)||p[2]!==String(round))return null;return p[0].split("");}catch(e){return null;}}

// Stato derivato: tutti i telefoni calcolano la stessa cosa dagli stessi dati
function cdrState(){
 var d=CDR.data||{};var meta=d.meta||{phase:"lobby",order:[],round:1};
 var players=Object.keys(d.players||{}).sort(function(a,b){return (d.players[a].t||0)-(d.players[b].t||0);}).map(function(k){return d.players[k].n||k;});
 var left=d.left||{};
 var isLeft=function(n){return !!left[cdrKey(n)];};
 var lobby=players.filter(function(n){return !isLeft(n);});
 var order=(meta.order||[]);
 var active=order.filter(function(n){return !isLeft(n);});
 var round=meta.round||1;var rd=d["r"+round]||{};
 var secretsRaw=rd.secrets||{};var secrets={};
 order.forEach(function(n){var v=secretsRaw[cdrKey(n)];if(v){var s=cdrDec(v,round);if(s&&s.length===4)secrets[n]=s;}});
 var movesRaw=rd.moves||{};var moves=[];
 Object.keys(movesRaw).map(Number).filter(function(n){return !isNaN(n);}).sort(function(a,b){return a-b;}).forEach(function(n){
  var m=movesRaw[n];if(!m||!m.by)return;
  if(m.pass){moves.push({n:n,by:m.by,pass:true,t:m.t||0});return;}
  if(!m.target||!m.guess)return;
  var g=String(m.guess).split("");var sec=secrets[m.target];if(!sec||g.length!==4)return;
  var sc=codiceScore(sec,g);moves.push({n:n,by:m.by,target:m.target,guess:g,g:sc.g,y:sc.y,t:m.t||0});
 });
 // Vincitore: il primo che indovina un codice
 var winner=null,winnerTarget=null;
 for(var i=0;i<moves.length;i++){if(!moves[i].pass&&moves[i].g===4){winner=moves[i].by;winnerTarget=moves[i].target;moves=moves.slice(0,i+1);break;}}
 // A chi tocca: il giocatore attivo dopo l'ultimo che ha giocato
 function nextAfter(name){
  var idx=order.indexOf(name);
  for(var k=1;k<=order.length;k++){var c=order[(idx+k)%order.length];if(!isLeft(c))return c;}
  return null;
 }
 var turn=null;
 if(active.length){
  if(!moves.length){turn=active[0];}
  else{turn=nextAfter(moves[moves.length-1].by);}
 }
 var phase=meta.phase||"lobby";
 var allSecrets=active.length>0&&active.every(function(n){return !!secrets[n];});
 if(phase==="play"&&!allSecrets)phase="secret";
 if(phase==="secret"&&allSecrets)phase="play";
 var ended=false,interrupted=false;
 if(phase!=="lobby"){
  if(winner)ended=true;
  else if(active.length<2){ended=true;interrupted=true;}
 }
 // Chi guida la stanza: il primo giocatore ancora presente (se chi l'ha creata esce, passa al successivo)
 var leader=(phase==="lobby"?lobby:active.length?active:lobby)[0]||null;
 var tries=moves.filter(function(m){return !m.pass;});
 // Inizio del turno in corso (ora del server): ultima mossa, oppure l'ultimo codice segreto salvato
 var stimes=rd.st||{};var turnStart=0;
 if(moves.length)turnStart=moves[moves.length-1].t||0;
 else order.forEach(function(n){var t=stimes[cdrKey(n)];if(t&&t>turnStart)turnStart=t;});
 return {turnStart:turnStart,tries:tries,meta:meta,phase:phase,players:players,lobby:lobby,order:order,active:active,secrets:secrets,moves:moves,turn:turn,winner:winner,winnerTarget:winnerTarget,ended:ended,interrupted:interrupted,leader:leader,round:round,isLeft:isLeft,nextMove:Object.keys(movesRaw).length};
}

// ── Stanza: crea, entra, esci ──
function cdrUniqueName(base,taken){var n=base,c=2;var low=taken.map(function(x){return String(x).toLowerCase();});while(low.indexOf(n.toLowerCase())>=0){n=base+" "+c++;}return n;}
function cdrMyName(){var n=(typeof FILOS_NAME!=="undefined"&&FILOS_NAME)?String(FILOS_NAME).trim():"";return (n||T("qvPlayer")+"1").slice(0,16);}
function cdrCreate(done){
 cdrStrings();
 if(!fbDB){done(false,T("firebaseErr"));return;}
 var tries=0;
 (function attempt(){
  tries++;var code=String(Math.floor(1000+Math.random()*9000));
  cdrNet(fbGet(fbRef(fbDB,"rooms/"+code))).then(function(snap){
   if(snap.exists()&&tries<8){attempt();return;}
   var me=cdrMyName();var now=Date.now();
   var room={created:now,kind:"codice",cd:{meta:{phase:"lobby",order:[],round:1},players:{}}};
   room.cd.players[cdrKey(me)]={n:me,t:now};
   cdrNet(fbSet(fbRef(fbDB,"rooms/"+code),room)).then(function(){cdrAttach(code,me);done(true);}).catch(function(){done(false,T("connErr"));});
  }).catch(function(){done(false,T("connErr"));});
 })();
}
function cdrJoin(code,done){
 cdrStrings();
 if(!fbDB){done(false,T("firebaseErr"));return;}
 code=String(code||"").replace(/\D/g,"");
 if(code.length!==4){done(false,T("codeError4"));return;}
 cdrNet(fbGet(fbRef(fbDB,"rooms/"+code+"/cd"))).then(function(snap){
  if(!snap.exists()){done(false,T("roomNotFound"));return;}
  var d=snap.val()||{};var meta=d.meta||{};
  if(meta.phase&&meta.phase!=="lobby"){done(false,T("cdrAlreadyStarted"));return;}
  var left=d.left||{};
  var taken=Object.keys(d.players||{}).filter(function(k){return !left[k];}).map(function(k){return d.players[k].n||k;});
  if(taken.length>=CDR_MAX_PLAYERS){done(false,T("cdrRoomFull"));return;}
  var me=cdrUniqueName(cdrMyName(),taken);
  var k=cdrKey(me);
  // Se con lo stesso nome qualcuno era uscito dalla stanza in attesa, si rientra da capo
  var clearLeft=left[k]?cdrNet(fbSet(fbRef(fbDB,"rooms/"+code+"/cd/left/"+k),null)):Promise.resolve();
  clearLeft.then(function(){return cdrNet(fbSet(fbRef(fbDB,"rooms/"+code+"/cd/players/"+k),{n:me,t:Date.now()}));}).then(function(){cdrAttach(code,me);done(true);}).catch(function(){done(false,T("connErr"));});
 }).catch(function(){done(false,T("connErr"));});
}
function cdrAttach(code,me){
 cdrDetach();
 CDR.code=code;CDR.me=me;CDR.data=null;CDR.sig="";CDR.entry=[];CDR.target=null;CDR.view=null;CDR.closed=false;CDR.busy=false;
 CDR.unsub=fbOnValue(fbRef(fbDB,"rooms/"+code+"/cd"),function(snap){
  var v=snap.val();
  if(!v){CDR.closed=true;CDR.data=null;}else{CDR.data=v;}
  if(String(S.screen||"").indexOf("cdr")===0)cdrRender(false);
 });
}
function cdrDetach(){if(CDR.unsub){try{CDR.unsub();}catch(e){}}CDR.unsub=null;}
// Esce dalla stanza (segnala agli altri e smette di ascoltare)
function cdrLeave(){
 if(CDR.code&&CDR.me&&fbDB&&!CDR.closed){
  // Lo stato si legge prima di segnare l'uscita: scrivere su Firebase aggiorna subito i dati locali
  // Se chi guida annulla la sfida mentre si aspetta, o se non resta nessuno, la stanza viene chiusa per tutti
  var close=false;
  try{var st=cdrState();close=(st.phase==="lobby"&&st.leader===CDR.me)||st.lobby.filter(function(n){return n!==CDR.me;}).length===0;}catch(e){}
  var code=CDR.code;
  if(close){try{fbRemove(fbRef(fbDB,"rooms/"+code));}catch(e){}}
  else{try{fbSet(fbRef(fbDB,cdrPath("left/"+cdrKey(CDR.me))),true);}catch(e){}}
 }
 cdrDetach();
 CDR.code=null;CDR.me=null;CDR.data=null;CDR.sig="";CDR.entry=[];CDR.closed=false;
}
window.addEventListener("pagehide",function(e){if(CDR.code&&!(e&&e.persisted))cdrLeave();});

// ── Azioni ──
function cdrStart(){
 var st=cdrState();if(st.leader!==CDR.me||st.lobby.length<2||CDR.busy)return;
 CDR.busy=true;
 cdrNet(fbSet(fbRef(fbDB,cdrPath("meta")),{phase:"secret",order:st.lobby.slice(0,CDR_MAX_PLAYERS),round:st.round})).then(function(){CDR.busy=false;}).catch(function(){CDR.busy=false;cdrToast(T("connErr"));});
}
function cdrSaveSecret(arr){
 var st=cdrState();if(arr.length!==4||CDR.busy)return;
 CDR.busy=true;
 cdrNet(fbSet(fbRef(fbDB,cdrPath("r"+st.round+"/st/"+cdrKey(CDR.me))),fbNow()).then(function(){return fbSet(fbRef(fbDB,cdrPath("r"+st.round+"/secrets/"+cdrKey(CDR.me))),cdrEnc(arr,st.round));})).then(function(){CDR.busy=false;CDR.entry=[];cdrRender(true);}).catch(function(){CDR.busy=false;cdrToast(T("connErr"));});
}
function cdrGuess(target,arr){
 var st=cdrState();
 if(st.phase!=="play"||st.ended||st.turn!==CDR.me||arr.length!==4||CDR.busy)return;
 if(target===CDR.me||st.active.indexOf(target)<0)return;
 CDR.busy=true;var n=st.nextMove;
 var ref=fbRef(fbDB,cdrPath("r"+st.round+"/moves/"+n));
 // Il tentativo n viene scritto una volta sola: se esiste già (doppio tocco o rete lenta) non si riscrive
 cdrNet(fbGet(ref)).then(function(snap){
  if(snap.exists()){CDR.busy=false;return;}
  return cdrNet(fbSet(ref,{by:CDR.me,target:target,guess:arr.join(""),t:fbNow()})).then(function(){CDR.busy=false;CDR.entry=[];cdrRender(true);});
 }).catch(function(){CDR.busy=false;cdrToast(T("connErr"));CDR.sig="";cdrRender(true);});
}
var CDR_TURN_MS=90000; // tempo per ogni turno
function cdrSkip(who,auto){
 var st=cdrState();if((!auto&&st.leader!==CDR.me)||st.turn!==who||st.phase!=="play"||st.ended||CDR.busy)return;
 if(st.active.indexOf(CDR.me)<0)return;
 CDR.busy=true;var ref=fbRef(fbDB,cdrPath("r"+st.round+"/moves/"+st.nextMove));
 fbGet(ref).then(function(snap){if(snap.exists()){CDR.busy=false;return;}return fbSet(ref,{by:who,pass:true,t:fbNow()}).then(function(){CDR.busy=false;});}).catch(function(){CDR.busy=false;});
}
function cdrRematch(){
 var st=cdrState();if(st.leader!==CDR.me||CDR.busy)return;
 var still=st.order.filter(function(n){return !st.isLeft(n);});
 if(still.length<2){fbSet(fbRef(fbDB,cdrPath("meta")),{phase:"lobby",order:[],round:st.round+1});return;}
 CDR.busy=true;
 fbSet(fbRef(fbDB,cdrPath("meta")),{phase:"secret",order:still,round:st.round+1}).then(function(){CDR.busy=false;CDR.entry=[];CDR.target=null;}).catch(function(){CDR.busy=false;});
}
function cdrInvite(silent){
 if(!fbDB||!CDR.code)return;
 var inv={from:CDR.me,game:"CODICE",kind:"codice",cat:"relax",roomCode:CDR.code,dev:(typeof filosDevId==="function"?filosDevId():null),pubCode:(typeof FILOS_PUB_CODE!=="undefined"?FILOS_PUB_CODE:null)||null,ts:Date.now()};
 var key="inv_"+Date.now();
 try{fbSet(fbRef(fbDB,"filos_invites/"+key),inv);setTimeout(function(){try{fbRemove(fbRef(fbDB,"filos_invites/"+key));}catch(e){}},30000);if(!silent)cdrToast(T("cdrInviteSent"));}catch(e){}
}
function cdrToast(msg){
 cdrStrings();
 var t=document.getElementById("cdr-toast");if(!t){t=document.createElement("div");t.id="cdr-toast";document.body.appendChild(t);}
 t.textContent=msg;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("on");},2200);
}
function cdrExit(){cdrLeave();goBackToGames();}

// ── Schermate ──
function renderCodiceRemote(){cdrRender(true);}
function cdrTrackTurn(st){var k=st.round+"|"+st.phase+"|"+st.turn+"|"+st.moves.length;if(CDR.turnKey!==k){CDR.turnKey=k;CDR.turnSince=Date.now();if(st.phase==="play")CDR.entry=[];}}
function cdrSignature(st){
 return JSON.stringify([CDR.closed,st.phase,st.lobby,st.active,Object.keys(st.secrets),st.moves.length,st.turn,st.winner,st.round,st.leader,LANG]);
}
function cdrRender(force){
 if(String(S.screen||"").indexOf("cdr")!==0)return;
 cdrStrings();
 var st=CDR.code?cdrState():null;
 if(st)cdrTrackTurn(st);
 var sig=CDR.code?cdrSignature(st):"none";
 // Non ridisegnare mentre si scrive il codice, a meno che cambi qualcosa di importante
 if(!force&&sig===CDR.sig)return;
 CDR.sig=sig;
 clr();
 addBackArrow(cdrExit);
 var wrap=div("codice-wrap cdr");wrap.style.textAlign="center";
 document.getElementById("root").appendChild(wrap);
 if(!CDR.code){cdrScreenStart(wrap);return;}
 if(CDR.closed){
  wrap.appendChild(div("codice-big",T("cdrClosed")));
  wrap.appendChild(div("codice-sub",T("cdrClosedSub")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),function(){cdrLeave();goBackToGames();}));
  return;
 }
 if(!CDR.data){wrap.appendChild(div("codice-sub",T("cdrConnecting")));return;}
 if(st.isLeft(CDR.me)){
  wrap.appendChild(div("codice-big",T("cdrYouLeft")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),function(){cdrLeave();goBackToGames();}));
  return;
 }
 if(st.phase==="lobby"){cdrScreenLobby(wrap,st);return;}
 if(st.order.indexOf(CDR.me)<0){
  // Entrato mentre la partita era già partita: guarda soltanto
  wrap.appendChild(div("codice-big",T("cdrAlreadyStarted")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),function(){cdrLeave();goBackToGames();}));
  return;
 }
 if(st.ended){cdrScreenEnd(wrap,st);return;}
 if(st.phase==="secret"){cdrScreenSecret(wrap,st);return;}
 cdrScreenPlay(wrap,st);
}
function cdrHeader(wrap,eyebrow,title,sub){
 var h=div("codice-head");if(eyebrow)h.appendChild(div("codice-eyebrow",eyebrow));h.appendChild(div("codice-big",title));wrap.appendChild(h);
 if(sub)wrap.appendChild(div("codice-sub",sub));
}
function cdrScreenStart(wrap){
 cdrHeader(wrap,T("cdrRemote"),T("codiceTitle"),T("cdrIntro"));
 if(!fbDB){wrap.appendChild(div("codice-sub",T("firebaseErr")));return;}
 var err=div("cdr-err");
 // Come in Quanto vale: si crea la stanza e parte subito la notifica agli altri dispositivi
 var sfida=btn("codice-cta",T("ui_sfida_un_altro_tavolo"),function(){
  if(sfida.disabled)return;
  sfida.disabled=true;sfida.textContent=T("ui_invio_sfida");err.textContent="";
  cdrCreate(function(ok,msg){
   if(!ok){sfida.disabled=false;sfida.textContent=T("ui_sfida_un_altro_tavolo");err.textContent=msg||T("connErr");return;}
   cdrInvite(true);
   S.screen="cdr";cdrRender(true);
  });
 });
 wrap.appendChild(sfida);
 wrap.appendChild(div("codice-legend",T("ui_gli_altri_dispositivi_riceveranno_una")));
 wrap.appendChild(err);
}
function cdrScreenLobby(wrap,st){
 var lead=st.leader===CDR.me;
 cdrHeader(wrap,lead?T("ui_in_attesa_degli_altri"):T("ui_connesso"),T("codiceTitle"),lead?null:T("cdrWaitHost").replace("{n}",st.leader||""));
 wrap.appendChild(div("codice-section",T("playersInRoom")+" "+st.lobby.length+"/"+CDR_MAX_PLAYERS));
 var list=div("cdr-list");
 st.lobby.forEach(function(n){var r=div("cdr-row");r.appendChild(div("cdr-dot on"));r.appendChild(div("cdr-name",n+(n===CDR.me?" "+T("cdrYou"):"")));if(n===st.leader)r.appendChild(div("cdr-tag",T("cdrHost")));list.appendChild(r);});
 wrap.appendChild(list);
 if(lead){
  var go=btn("codice-cta",T("qvStart"),cdrStart);
  go.disabled=st.lobby.length<2;
  wrap.appendChild(go);
  if(st.lobby.length<2)wrap.appendChild(div("codice-legend",T("ui_aspetta_che_si_colleghi_almeno")));
  // La notifica dura 30 secondi: se qualcuno se l'è persa si può rimandare
  if(st.lobby.length<CDR_MAX_PLAYERS)wrap.appendChild(btn("cdr-link",T("cdrResend"),function(){cdrInvite();}));
  wrap.appendChild(btn("cdr-link muted",T("ui_annulla_sfida"),cdrExit));
 } else {
  wrap.appendChild(btn("cdr-link muted",T("ui_esci_dalla_stanza"),cdrExit));
 }
}
function cdrScreenSecret(wrap,st){
 var mine=st.secrets[CDR.me];
 if(!mine){
  cdrHeader(wrap,T("cdrRound").replace("{n}",st.round),CDR.me+T("codiceChooseSecret"),T("cdrSecretSub"));
  var ok;
  var keep=CDR.entry.slice();
  var otp=codiceOtp(function(a){CDR.entry=a;if(ok)ok.disabled=a.length!==4;});
  wrap.appendChild(otp);
  if(keep.length){otp._input.value=keep.join("");CDR.entry=keep;}
  ok=btn("codice-cta",T("codiceSave"),function(){cdrSaveSecret(CDR.entry.slice());});
  ok.disabled=CDR.entry.length!==4;wrap.appendChild(ok);
 } else {
  cdrHeader(wrap,T("cdrRound").replace("{n}",st.round),T("cdrSecretSaved"),T("cdrWaitSecrets"));
  wrap.appendChild(codiceSlots(["•","•","•","•"],"big"));
 }
 var list=div("cdr-list");
 st.active.forEach(function(n){var r=div("cdr-row");r.appendChild(div("cdr-dot"+(st.secrets[n]?" on":"")));r.appendChild(div("cdr-name",n+(n===CDR.me?" "+T("cdrYou"):"")));r.appendChild(div("cdr-tag light",st.secrets[n]?T("cdrReady"):T("cdrChoosing")));list.appendChild(r);});
 wrap.appendChild(list);
}
function cdrHistory(wrap,st,target){
 var hist=st.tries.filter(function(m){return m.target===target;});
 if(!hist.length){wrap.appendChild(div("codice-sub",T("codiceNoTries")));return;}
 wrap.appendChild(div("codice-section",T("codiceTries")));
 var hd=div("codice-hist");
 hist.forEach(function(h){var r=div("codice-hist-row");r.appendChild(div("codice-hist-by",h.by));r.appendChild(div("codice-hist-guess",h.guess.join(" ")));r.appendChild(codiceFeedback(h.g,h.y,false));hd.appendChild(r);});
 wrap.appendChild(hd);
}
function cdrScreenPlay(wrap,st){
 var myTurn=st.turn===CDR.me;
 var opps=st.active.filter(function(p){return p!==CDR.me;});
 var others=st.active;
 // Ultima mossa: riassunto compatto (in basso, non distrae da tempo e tentativo)
 var lastAny=st.moves[st.moves.length-1];
 function lastBox(){
  if(!lastAny)return null;
  if(lastAny.pass)return div("cdr-last cdr-last-pass",T("cdrSkipped").replace("{n}",lastAny.by));
  var last=lastAny;
  var lb=div("cdr-last");
  var lt=last.by===CDR.me?T("cdrTriedMine").replace("{t}",last.target):last.target===CDR.me?T("cdrTriedYours").replace("{b}",last.by):T("cdrTriedOther").replace("{b}",last.by).replace("{t}",last.target);
  lb.appendChild(div("cdr-last-t",lt));
  var lr=div("cdr-last-r");lr.appendChild(codiceSlots(last.guess,""));lr.appendChild(codiceFeedback(last.g,last.y,false));lb.appendChild(lr);
  lb.appendChild(div("cdr-last-s",codiceFeedbackText(last.g,last.y)));
  return lb;
 }
 // Tempo del turno, uguale per tutti: allo scadere il turno passa al giocatore successivo
 function timer(into){if(st.turnStart){var who=st.turn;rlTimer(into,st.turnStart,CDR_TURN_MS,function(){cdrSkip(who,true);});}}
 if(myTurn){
  if(!CDR.target||opps.indexOf(CDR.target)<0)CDR.target=opps[0];
  var target=CDR.target;
  cdrHeader(wrap,null,T("cdrYourTurn"),null);
  var histOf=function(p){return st.tries.filter(function(m){return m.target===p;});};
  if(opps.length>1)wrap.appendChild(codicePicker(opps,target,histOf,function(p){CDR.target=p;cdrRender(true);}));
  wrap.appendChild(div("codice-target",T("codiceGuessShort")+target));
  // Tempo e casella del tentativo vicini
  var play=div("cdr-play");wrap.appendChild(play);
  timer(play);
  var tryB;var keep2=CDR.entry.slice();
  var otp2=codiceOtp(function(a){CDR.entry=a;if(tryB)tryB.disabled=a.length!==4;});
  play.appendChild(otp2);
  if(keep2.length){otp2._input.value=keep2.join("");CDR.entry=keep2;}
  tryB=btn("codice-cta",T("codiceTry"),function(){if(CDR.entry.length!==4)return;tryB.disabled=true;cdrGuess(target,CDR.entry.slice());});
  tryB.disabled=CDR.entry.length!==4;play.appendChild(tryB);
  cdrHistory(wrap,st,target);
  wrap.appendChild(div("codice-legend",T("codiceLegend")));
  var lb1=lastBox();if(lb1){lb1.classList.add("cdr-last-low");wrap.appendChild(lb1);}
 } else {
  cdrHeader(wrap,T("cdrWaiting"),T("cdrTurnOf").replace("{n}",st.turn||""),null);
  timer(wrap);
  var lb2=lastBox();if(lb2)wrap.appendChild(lb2);
  // Intanto si possono guardare i tentativi su ogni codice (anche sul proprio)
  if(!CDR.view||others.indexOf(CDR.view)<0)CDR.view=opps[0]||CDR.me;
  wrap.appendChild(codicePicker(others,CDR.view,function(p){return st.tries.filter(function(m){return m.target===p;});},function(p){CDR.view=p;cdrRender(true);},function(p){return p===CDR.me?T("cdrYourCode"):p;}));
  cdrHistory(wrap,st,CDR.view);
  wrap.appendChild(div("codice-legend",T("codiceLegend")));
  // Se chi deve giocare non risponde (telefono spento, app chiusa), chi guida può saltare il suo turno
  if(st.leader===CDR.me&&!st.turnStart){
   var waited=Date.now()-(CDR.turnSince||Date.now());
   if(waited>=60000){
    wrap.appendChild(btn("ebtn out cdr-skip",T("cdrSkip").replace("{n}",st.turn),function(){cdrSkip(st.turn);}));
   } else {
    clearTimeout(CDR.skipTimer);CDR.skipTimer=setTimeout(function(){CDR.sig="";cdrRender(true);},60000-waited+200);
   }
  }
 }
 var mineRow=div("cdr-mine");mineRow.appendChild(div("cdr-mine-l",T("cdrMySecret")));var ms=st.secrets[CDR.me]||[];
 var mv=div("cdr-mine-v");mv.textContent="• • • •";var shown=false;
 mineRow.onclick=function(){shown=!shown;mv.textContent=shown?ms.join(" "):"• • • •";};
 mineRow.appendChild(mv);wrap.appendChild(mineRow);
}
function cdrScreenEnd(wrap,st){
 if(st.interrupted){
  wrap.appendChild(div("end-title",T("cdrInterrupted")));
  wrap.appendChild(div("end-sub",T("cdrInterruptedSub")));
 } else {
  wrap.appendChild(div("end-title",(st.winner===CDR.me?T("cdrYouWon"):winTxt(st.winner))));
  var ws=st.winner===CDR.me?T("cdrWonMine").replace("{t}",st.winnerTarget):st.winnerTarget===CDR.me?T("cdrWonYours"):T("cdrWonOther").replace("{t}",st.winnerTarget);
  wrap.appendChild(div("end-sub",ws+" · "+st.tries.length+" "+T("cdrTries")));
 }
 var rev=div("dado-players");
 st.order.forEach(function(n){
  var row=div("dado-player-row");
  var ne=div("dado-player-name");ne.textContent=n+(st.isLeft(n)?" · "+T("cdrLeftTag"):"");row.appendChild(ne);
  var ce=div("dado-player-score");ce.textContent=(st.secrets[n]||[]).join(" ");ce.style.fontSize="18px";row.appendChild(ce);
  rev.appendChild(row);
 });
 wrap.appendChild(rev);
 var btns=div("endbtns");
 if(st.leader===CDR.me)btns.appendChild(btn("ebtn",T("qvPlayAgain"),cdrRematch));
 else wrap.appendChild(div("cdr-wait",T("cdrWaitRematch").replace("{n}",st.leader||"")));
 btns.appendChild(btn("ebtn out",T("exitBtn"),function(){cdrLeave();goHome();}));
 wrap.appendChild(btns);
}


// ── Ora del server: uguale su tutti i telefoni anche se gli orologi sono diversi ──
var FB_OFF=0,FB_OFF_ON=false;
function fbNow(){
 if(!FB_OFF_ON&&typeof fbDB!=="undefined"&&fbDB&&typeof fbOnValue==="function"){
  FB_OFF_ON=true;
  try{fbOnValue(fbRef(fbDB,".info/serverTimeOffset"),function(s){var v=s&&s.val?s.val():0;if(typeof v==="number"&&isFinite(v))FB_OFF=v;});}catch(e){}
 }
 return Date.now()+FB_OFF;
}
// Timer condiviso: secondi e barra, aggiornati da soli; onEnd viene chiamato una volta allo scadere
function rlTimer(wrap,start,ms,onEnd){
 var box=div("rl-timer");var num=div("rl-timer-n");var bar=div("rl-timer-bar");var fill=div("rl-timer-fill");
 bar.appendChild(fill);box.appendChild(num);box.appendChild(bar);wrap.appendChild(box);
 clearInterval(window._rlTimerIv);var fired=false;
 function tick(){
  if(!document.body.contains(box)){clearInterval(window._rlTimerIv);return;}
  var left=Math.max(0,Math.min(ms,start+ms-fbNow()));var sec=Math.ceil(left/1000);
  num.textContent=Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");
  fill.style.width=(left/ms*100)+"%";
  box.classList.toggle("low",sec<=5);
  if(left<=0&&!fired){fired=true;clearInterval(window._rlTimerIv);if(onEnd)try{onEnd();}catch(e){}}
 }
 tick();window._rlTimerIv=setInterval(tick,250);
 return box;
}
// ── Livelli dei giochi a distanza (Facile / Media / Difficile) ──
// Chi guida sceglie il livello nella sala d'attesa (e a fine partita per la rivincita):
// si salva in meta.lvl e tutti i telefoni lo vedono.
var RL_LEVELS=["facile","media","difficile"];
function rlLevel(meta){var l=meta&&meta.lvl;return RL_LEVELS.indexOf(l)>=0?l:"facile";}
function rlLevelName(l){var t=String(T(l==="facile"?"ui_facile":l==="media"?"ui_media":"ui_difficile")).trim();return t.charAt(0).toUpperCase()+t.slice(1).toLowerCase();}
// Divide un elenco in tre parti uguali, come nei quiz al tavolo: prima parte facile, poi media, poi difficile
function rlThirds(n,l){var t=Math.floor(n/3);var a=l==="facile"?0:l==="media"?t:2*t,b=l==="facile"?t:l==="media"?2*t:n;var o=[];for(var i=a;i<b;i++)o.push(i);return o;}
function rlLevelPicker(wrap,cur,canEdit,onPick){
 wrap.appendChild(div("codice-section",T("rlLevel")));
 if(!canEdit){wrap.appendChild(div("rl-level-ro",rlLevelName(cur)));return;}
 var tabs=div("codice-tabs rl-level");
 RL_LEVELS.forEach(function(l){tabs.appendChild(btn("codice-tab"+(l===cur?" on":""),rlLevelName(l),function(){if(l!==cur)onPick(l);}));});
 wrap.appendChild(tabs);
}
// ── Ritmo dei giochi a domande a distanza ──
// 30 secondi per rispondere, poi la risposta giusta e la classifica restano 20 secondi e si passa da soli
// alla domanda dopo: nessun pulsante. Ogni telefono calcola gli stessi tempi dagli stessi dati,
// quindi chiunque scriva il passaggio scrive esattamente la stessa cosa.
// Niente pareggi: se alla fine c'è parità in testa si giocano 3 domande più difficili (solo chi è pari),
// e se si è ancora pari altre 3, finché non c'è un vincitore.
var RL_ANS_MS=30000,RL_REV_MS=20000,RL_MAIN=10,RL_TB=3;
function rlBlock(meta,r){var t=(meta&&meta.tbs)||[];for(var i=0;i<t.length;i++){if(r>=t[i].f&&r<t[i].f+RL_TB)return t[i];}return null;}
function rlElig(meta,active,r){var b=rlBlock(meta,r);if(!b)return active.slice();return active.filter(function(n){return (b.p||[]).indexOf(n)>=0;});}
function rlMain(meta){return (meta&&meta.main)||((meta&&meta.qs)||[]).length;}
// Momento in cui si mostrano le risposte: quando hanno risposto tutti, o allo scadere dei 30 secondi
function rlRevealAt(meta,cur,elig,allIn){
 var qt=(meta&&meta.qt)||0;if(!qt)return 0;var lim=qt+RL_ANS_MS;if(!allIn)return lim+1500;
 var mx=0;elig.forEach(function(n){var a=cur[n];var t=a&&+a.t||0;if(t>mx)mx=t;});
 return mx?Math.min(lim,Math.max(qt,mx)):lim;
}
// Chi è in testa (fra chi gioca la domanda r) e se serve uno spareggio
function rlTop(meta,r,active,scores){
 var b=rlBlock(meta,r);var group=b?active.filter(function(n){return (b.p||[]).indexOf(n)>=0;}):active.slice();
 var mx=-1;group.forEach(function(n){if((scores[n]||0)>mx)mx=scores[n]||0;});
 return group.filter(function(n){return (scores[n]||0)===mx;});
}
// Nuovo stato della partita dopo la domanda q: domanda successiva, spareggio o fine
function rlNextMeta(meta,q,rt,active,scores){
 var m=JSON.parse(JSON.stringify(meta));var qs=m.qs||[];var nt=rt+RL_REV_MS;
 if(q<qs.length-1){m.q=q+1;m.rv=-1;m.qt=nt;return m;}
 var top=rlTop(meta,q,active,scores);
 var pool=m.tbp||[];
 if(top.length>1&&pool.length){
  var used=qs.length-rlMain(m);var add=[],addo=[];
  for(var i=0;i<RL_TB;i++){var k=(used+i)%pool.length;add.push(pool[k]);if(m.tbo)addo.push(m.tbo[k]);}
  m.tbs=(m.tbs||[]).concat([{f:qs.length,p:top}]);
  m.qs=qs.concat(add);if(m.tbo)m.opts=(m.opts||[]).concat(addo);
  m.q=qs.length;m.rv=-1;m.qt=nt;return m;
 }
 m.end=true;return m;
}
// Intestazione della domanda: "Domanda 3 di 10" oppure "Spareggio · 1 di 3"
function rlRoundLabel(meta,q,label){
 var b=rlBlock(meta,q);
 if(b)return T("rlTbRound").replace("{n}",q-b.f+1).replace("{t}",RL_TB);
 return label.replace("{n}",q+1).replace("{t}",rlMain(meta));
}
function rlNames(list,me){var a=list.map(function(n){return n===me?T("rlYouIn"):n;});return a.length>1?a.slice(0,-1).join(", ")+" "+T("intesaAnd")+" "+a[a.length-1]:(a[0]||"");}
// Avviso di spareggio sopra la domanda
function rlTbNote(wrap,meta,q,me){
 var b=rlBlock(meta,q);if(!b)return;
 wrap.appendChild(div("rl-tb",T("rlTbBetween").replace("{n}",rlNames(b.p||[],me))));
}
// Conto alla rovescia della schermata dei risultati (20 secondi), uguale per tutti
function rlRevealCountdown(wrap,st,rt,onEnd){
 var willTb=false;
 if(st.last){var top=rlTop(st.meta,st.q,st.active,st.scores);willTb=top.length>1&&((st.meta.tbp||[]).length>0);}
 var lbl=st.last?(willTb?T("rlNextTb"):T("rlNextFinal")):T("rlNextQ");
 var box=div("rl-next");box.appendChild(div("rl-next-l",lbl));wrap.appendChild(box);
 rlTimer(box,rt||fbNow(),RL_REV_MS,onEnd);
}
// Stringhe del gioco a distanza (aggiunte quando l'interfaccia è pronta)
function cdrStrings(){
 if(typeof STRINGS==="undefined"||STRINGS.it.cdrRemote)return;
 Object.assign(STRINGS.it,{rlLevel:"Livello",qvrIntro:"Ognuno risponde dal proprio telefono, anche da tavoli diversi. Lancia la sfida: agli altri arriva una notifica e toccando Gioca entrano nella partita.",cdrTriedMine:"Hai provato il codice di {t}",cdrTriedYours:"{b} ha provato il tuo codice",cdrTriedOther:"{b} ha provato il codice di {t}",cdrWonMine:"Hai indovinato il codice di {t}",cdrWonYours:"Ha indovinato il tuo codice",cdrWonOther:"Ha indovinato il codice di {t}",cdrRemote:"A distanza",cdrIntro:"Ognuno gioca dal proprio telefono, anche da tavoli diversi. Lancia la sfida: agli altri arriva una notifica e toccando Gioca entrano nella partita.",cdrResend:"Invia di nuovo la notifica",cdrCreate:"Crea una partita",cdrJoinLabel:"Hai un codice?",cdrJoin:"Entra",cdrRoomCode:"Codice della partita",cdrShareHint:"Fallo inserire ai tuoi amici in Indovina il codice, nella categoria A distanza.",cdrShare:"Condividi",cdrInviteNear:"Invita i tavoli vicini",cdrInviteSent:"Invito inviato",cdrShareText:"Giochiamo a Indovina il codice su Filòs! Codice partita: {c}",cdrYou:"(tu)",cdrYou2:"Tu",cdrYou3:"te",cdrHost:"Guida",cdrWaitHost:"Aspetta che {n} avvii la partita",cdrRound:"Partita {n}",cdrSecretSub:"Scegli 4 cifre. Gli altri non le vedono: scoprono solo quante ne hanno indovinate.",cdrOr:"oppure",cdrSkip:"Salta il turno di {n}",cdrSkipped:"{n} ha saltato il turno",cdrSecretSaved:"Codice salvato",cdrWaitSecrets:"Aspettiamo che tutti scelgano il loro codice.",cdrReady:"pronto",cdrChoosing:"sta scegliendo",cdrYourTurn:"Tocca a te",cdrWaiting:"Aspetta il tuo turno",cdrTurnOf:"Tocca a {n}",cdrYourCode:"il tuo codice",cdrMySecret:"Il tuo codice (tocca per vederlo)",cdrYouWon:"Hai vinto!",cdrTries:"tentativi",cdrInterrupted:"Partita interrotta",cdrInterruptedSub:"Sono usciti troppi giocatori per continuare.",cdrLeftTag:"uscito",cdrWaitRematch:"Aspetta che {n} avvii un'altra partita",cdrClosed:"La partita non c'è più",cdrClosedSub:"È stata chiusa o è scaduta.",cdrConnecting:"Collegamento…",cdrYouLeft:"Sei uscito dalla partita",cdrAlreadyStarted:"La partita è già iniziata",cdrRoomFull:"La partita è al completo (massimo 6 giocatori)"});
 Object.assign(STRINGS.en,{rlLevel:"Level",qvrIntro:"Everyone answers on their own phone, even from different tables. Send the challenge: the others get a notification and tap Play to join.",cdrTriedMine:"You tried {t}’s code",cdrTriedYours:"{b} tried your code",cdrTriedOther:"{b} tried {t}’s code",cdrWonMine:"You cracked {t}’s code",cdrWonYours:"Cracked your code",cdrWonOther:"Cracked {t}’s code",cdrRemote:"Remote",cdrIntro:"Everyone plays on their own phone, even from different tables. Send the challenge: the others get a notification and tap Play to join.",cdrResend:"Send the notification again",cdrCreate:"Create a game",cdrJoinLabel:"Got a code?",cdrJoin:"Join",cdrRoomCode:"Game code",cdrShareHint:"Ask your friends to enter it in Crack the code, in the Remote category.",cdrShare:"Share",cdrInviteNear:"Invite nearby tables",cdrInviteSent:"Invite sent",cdrShareText:"Let's play Crack the code on Filòs! Game code: {c}",cdrYou:"(you)",cdrYou2:"You",cdrYou3:"you",cdrHost:"Host",cdrWaitHost:"Waiting for {n} to start the game",cdrRound:"Game {n}",cdrSecretSub:"Pick 4 digits. The others can’t see them: they only find out how many they got right.",cdrOr:"or",cdrSkip:"Skip {n}’s turn",cdrSkipped:"{n} skipped a turn",cdrSecretSaved:"Code saved",cdrWaitSecrets:"Waiting for everyone to pick their code.",cdrReady:"ready",cdrChoosing:"choosing",cdrYourTurn:"Your turn",cdrWaiting:"Wait for your turn",cdrTurnOf:"{n}'s turn",cdrYourCode:"your code",cdrMySecret:"Your code (tap to see it)",cdrYouWon:"You won!",cdrTries:"tries",cdrInterrupted:"Game interrupted",cdrInterruptedSub:"Too many players left to carry on.",cdrLeftTag:"left",cdrWaitRematch:"Waiting for {n} to start another game",cdrClosed:"This game no longer exists",cdrClosedSub:"It was closed or has expired.",cdrConnecting:"Connecting…",cdrYouLeft:"You left the game",cdrAlreadyStarted:"The game has already started",cdrRoomFull:"The game is full (maximum 6 players)"});
 Object.assign(STRINGS.es,{rlLevel:"Nivel",qvrIntro:"Cada uno responde desde su móvil, incluso desde mesas distintas. Lanza el desafío: a los demás les llega una notificación y al tocar Jugar entran en la partida.",cdrTriedMine:"Has probado el código de {t}",cdrTriedYours:"{b} ha probado tu código",cdrTriedOther:"{b} ha probado el código de {t}",cdrWonMine:"Has adivinado el código de {t}",cdrWonYours:"Ha adivinado tu código",cdrWonOther:"Ha adivinado el código de {t}",cdrRemote:"A distancia",cdrIntro:"Cada uno juega desde su móvil, incluso desde mesas distintas. Lanza el desafío: a los demás les llega una notificación y al tocar Jugar entran en la partida.",cdrResend:"Enviar otra vez la notificación",cdrCreate:"Crear una partida",cdrJoinLabel:"¿Tienes un código?",cdrJoin:"Entrar",cdrRoomCode:"Código de la partida",cdrShareHint:"Pide a tus amigos que lo introduzcan en Adivina el código, en la categoría A distancia.",cdrShare:"Compartir",cdrInviteNear:"Invitar a mesas cercanas",cdrInviteSent:"Invitación enviada",cdrShareText:"¡Juguemos a Adivina el código en Filòs! Código de la partida: {c}",cdrYou:"(tú)",cdrYou2:"Tú",cdrYou3:"ti",cdrHost:"Anfitrión",cdrWaitHost:"Esperando a que {n} empiece la partida",cdrRound:"Partida {n}",cdrSecretSub:"Elige 4 cifras. Los demás no las ven: solo saben cuántas han acertado.",cdrOr:"o",cdrSkip:"Saltar el turno de {n}",cdrSkipped:"{n} ha perdido el turno",cdrSecretSaved:"Código guardado",cdrWaitSecrets:"Esperando a que todos elijan su código.",cdrReady:"listo",cdrChoosing:"eligiendo",cdrYourTurn:"Te toca",cdrWaiting:"Espera tu turno",cdrTurnOf:"Le toca a {n}",cdrYourCode:"tu código",cdrMySecret:"Tu código (toca para verlo)",cdrYouWon:"¡Has ganado!",cdrTries:"intentos",cdrInterrupted:"Partida interrumpida",cdrInterruptedSub:"Se han ido demasiados jugadores para seguir.",cdrLeftTag:"se fue",cdrWaitRematch:"Esperando a que {n} empiece otra partida",cdrClosed:"Esta partida ya no existe",cdrClosedSub:"Se cerró o ha caducado.",cdrConnecting:"Conectando…",cdrYouLeft:"Has salido de la partida",cdrAlreadyStarted:"La partida ya ha empezado",cdrRoomFull:"La partida está completa (máximo 6 jugadores)"});
}

// ══════════════════════════════════════════
// QUANTO VALE A DISTANZA — stessa interfaccia di collegamento di Indovina il codice
// (la partita vera e propria resta quella di Quanto vale)
// ══════════════════════════════════════════
var QVR={code:null,unsub:null,players:null};
function qvrInLobby(){return S.screen==="qv_setup"&&S.qvMode==="distanza"&&!!fbRoomCode;}
function qvrDetach(){if(QVR.unsub){try{QVR.unsub();}catch(e){}}QVR.unsub=null;QVR.code=null;QVR.players=null;}
function qvrLeave(){
 if(!fbRoomCode){qvrDetach();S.qvMode="locale";return;}
 var code=fbRoomCode,me=S.qvMyName;
 qvrDetach();
 if(!fbIsHost&&me&&fbDB){try{fbRemove(fbRef(fbDB,"rooms/"+code+"/qv_players/"+cdrKey(me)));}catch(e){}}
 fbLeaveRoom();
 S.qvMode="locale";
}
function qvrExit(){qvrLeave();goBackToGames();}
function qvrResend(){
 if(!fbDB||!fbRoomCode)return;
 var inv={from:S.qvMyName||FILOS_NAME||"Anonimo",game:"Quanto Vale?",cat:"quantovale",roomCode:fbRoomCode,dev:(typeof filosDevId==="function"?filosDevId():null),pubCode:(typeof FILOS_PUB_CODE!=="undefined"?FILOS_PUB_CODE:null)||null,ts:Date.now()};
 var key="inv_"+Date.now();
 try{fbSet(fbRef(fbDB,"filos_invites/"+key),inv);setTimeout(function(){try{fbRemove(fbRef(fbDB,"filos_invites/"+key));}catch(e){}},30000);cdrToast(T("cdrInviteSent"));}catch(e){}
}
// Chi accetta l'invito: nome unico e niente ingresso a partita già iniziata
function qvrJoin(code,done){
 cdrStrings();
 if(!fbDB){done(false,T("firebaseErr"));return;}
 // Prima si controlla la stanza, poi ci si collega: così non si finisce mai dentro una partita già partita
 cdrNet(Promise.all([fbGet(fbRef(fbDB,"rooms/"+code+"/qv_players")),fbGet(fbRef(fbDB,"rooms/"+code+"/screen"))])).then(function(r){
  var pl=r[0].val()||{},scr=r[1].val()||{};
  if(!Object.keys(pl).length){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
  if(/^qv_/.test(scr.type||"")){done(false,T("cdrAlreadyStarted"));return;}
  var nick=cdrKey(cdrUniqueName(cdrMyName(),Object.keys(pl)));
  fbJoinRoom(code,function(ok){
   if(!ok){done(false,T("ui_stanza_non_trovata_o_scaduta"));return;}
   S.qvMyName=nick;
   cdrNet(fbSet(fbRef(fbDB,"rooms/"+code+"/qv_players/"+nick),{joined:Date.now()})).then(function(){done(true);}).catch(function(){fbLeaveRoom();done(false,T("connErr"));});
  });
 }).catch(function(){done(false,T("connErr"));});
}
function qvrAttach(){
 if(QVR.code===fbRoomCode&&QVR.unsub)return;
 qvrDetach();
 QVR.code=fbRoomCode;
 QVR.unsub=fbOnValue(fbRef(fbDB,"rooms/"+fbRoomCode+"/qv_players"),function(snap){
  if(!qvrInLobby()){qvrDetach();return;}
  QVR.players=snap&&snap.val?(snap.val()||{}):{};
  renderQvSetup();
 });
}
function qvrPlayers(){
 var pl=QVR.players||{};
 var names=Object.keys(pl).sort(function(a,b){if(pl[a].isHost)return -1;if(pl[b].isHost)return 1;return (pl[a].joined||0)-(pl[b].joined||0);});
 var host=names.filter(function(n){return pl[n].isHost;})[0]||(fbIsHost?(S.qvMyName||null):null);
 return {names:names,host:host};
}
function qvrStartScreen(){
 cdrStrings();
 clr();
 addBackArrow(goBackToGames);
 var wrap=div("codice-wrap cdr");wrap.style.textAlign="center";
 document.getElementById("root").appendChild(wrap);
 cdrHeader(wrap,T("cdrRemote"),T("qvTitle"),T("qvrIntro"));
 if(!fbDB){wrap.appendChild(div("codice-sub",T("firebaseErr")));return;}
 var err=div("cdr-err");
 var sfida=btn("codice-cta",T("ui_sfida_un_altro_tavolo"),function(){
  if(sfida.disabled)return;
  sfida.disabled=true;sfida.textContent=T("ui_invio_sfida");err.textContent="";
  S.qvMyName=cdrKey(cdrMyName());
  var guard=setTimeout(function(){sfida.disabled=false;sfida.textContent=T("ui_sfida_un_altro_tavolo");err.textContent=T("connErr");},10000);
  sendQvChallenge(function(){
   clearTimeout(guard);
   if(S.screen!=="qv_setup"){fbLeaveRoom();return;}
   S.qvMode="distanza";renderQvSetup();
  });
 });
 wrap.appendChild(sfida);
 wrap.appendChild(div("codice-legend",T("ui_gli_altri_dispositivi_riceveranno_una")));
 wrap.appendChild(err);
}
function qvrLobby(){
 cdrStrings();
 qvrAttach();
 clr();
 addBackArrow(qvrExit);
 var wrap=div("codice-wrap cdr");wrap.style.textAlign="center";
 document.getElementById("root").appendChild(wrap);
 if(QVR.players===null){cdrHeader(wrap,T("cdrRemote"),T("qvTitle"),T("cdrConnecting"));return;}
 var p=qvrPlayers(),me=S.qvMyName,lead=fbIsHost;
 // La stanza non c'è più (chi ha lanciato la sfida l'ha annullata)
 if(!lead&&(!p.names.length||!p.host)){
  qvrDetach();fbLeaveRoom();S.qvMode="locale";
  wrap.appendChild(div("codice-big",T("cdrClosed")));
  wrap.appendChild(div("codice-sub",T("cdrClosedSub")));
  wrap.appendChild(btn("codice-cta",T("backToGames"),goBackToGames));
  addBackArrow(goBackToGames);
  return;
 }
 cdrHeader(wrap,lead?T("ui_in_attesa_degli_altri"):T("ui_connesso"),T("qvTitle"),lead?null:T("cdrWaitHost").replace("{n}",p.host||""));
 wrap.appendChild(div("codice-section",T("playersInRoom")+" "+p.names.length));
 var list=div("cdr-list");
 p.names.forEach(function(n){var r=div("cdr-row");r.appendChild(div("cdr-dot on"));r.appendChild(div("cdr-name",n+(n===me?" "+T("cdrYou"):"")));if(n===p.host)r.appendChild(div("cdr-tag",T("cdrHost")));list.appendChild(r);});
 wrap.appendChild(list);
 if(lead){
  var go=btn("codice-cta",T("qvStart"),function(){
   var names=qvrPlayers().names;if(names.length<2||go.disabled)return;
   go.disabled=true;qvrDetach();window._qvPlayersListening=false;
   startQuantoValeDistanza(names);
  });
  go.disabled=p.names.length<2;
  wrap.appendChild(go);
  if(p.names.length<2)wrap.appendChild(div("codice-legend",T("ui_aspetta_che_si_colleghi_almeno")));
  wrap.appendChild(btn("cdr-link",T("cdrResend"),qvrResend));
  wrap.appendChild(btn("cdr-link muted",T("ui_annulla_sfida"),qvrExit));
 } else {
  wrap.appendChild(btn("cdr-link muted",T("ui_esci_dalla_stanza"),qvrExit));
 }
}
window.addEventListener("pagehide",function(e){if(e.persisted)return;try{if(qvrInLobby())qvrLeave();}catch(err){}});
