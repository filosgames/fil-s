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
  if(m.pass){moves.push({n:n,by:m.by,pass:true});return;}
  if(!m.target||!m.guess)return;
  var g=String(m.guess).split("");var sec=secrets[m.target];if(!sec||g.length!==4)return;
  var sc=codiceScore(sec,g);moves.push({n:n,by:m.by,target:m.target,guess:g,g:sc.g,y:sc.y});
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
 return {tries:tries,meta:meta,phase:phase,players:players,lobby:lobby,order:order,active:active,secrets:secrets,moves:moves,turn:turn,winner:winner,winnerTarget:winnerTarget,ended:ended,interrupted:interrupted,leader:leader,round:round,isLeft:isLeft,nextMove:Object.keys(movesRaw).length};
}

// ── Stanza: crea, entra, esci ──
function cdrUniqueName(base,taken){var n=base,c=2;var low=taken.map(function(x){return String(x).toLowerCase();});while(low.indexOf(n.toLowerCase())>=0){n=base+" "+c++;}return n;}
function cdrMyName(){var n=(typeof FILOS_NAME!=="undefined"&&FILOS_NAME)?String(FILOS_NAME).trim():"";return (n||T("qvPlayer")+"1").slice(0,16);}
function cdrCreate(done){
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
  try{fbSet(fbRef(fbDB,cdrPath("left/"+cdrKey(CDR.me))),true);}catch(e){}
    // Se dopo l'uscita non resta nessuno, la stanza viene cancellata
  try{var st=cdrState();if(st.lobby.filter(function(n){return n!==CDR.me;}).length===0){fbRemove(fbRef(fbDB,"rooms/"+CDR.code));}}catch(e){}
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
 cdrNet(fbSet(fbRef(fbDB,cdrPath("r"+st.round+"/secrets/"+cdrKey(CDR.me))),cdrEnc(arr,st.round))).then(function(){CDR.busy=false;CDR.entry=[];cdrRender(true);}).catch(function(){CDR.busy=false;cdrToast(T("connErr"));});
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
  return cdrNet(fbSet(ref,{by:CDR.me,target:target,guess:arr.join(""),t:Date.now()})).then(function(){CDR.busy=false;CDR.entry=[];cdrRender(true);});
 }).catch(function(){CDR.busy=false;cdrToast(T("connErr"));CDR.sig="";cdrRender(true);});
}
function cdrSkip(who){
 var st=cdrState();if(st.leader!==CDR.me||st.turn!==who||st.phase!=="play"||st.ended||CDR.busy)return;
 CDR.busy=true;var ref=fbRef(fbDB,cdrPath("r"+st.round+"/moves/"+st.nextMove));
 fbGet(ref).then(function(snap){if(snap.exists()){CDR.busy=false;return;}return fbSet(ref,{by:who,pass:true,t:Date.now()}).then(function(){CDR.busy=false;});}).catch(function(){CDR.busy=false;});
}
function cdrRematch(){
 var st=cdrState();if(st.leader!==CDR.me||CDR.busy)return;
 var still=st.order.filter(function(n){return !st.isLeft(n);});
 if(still.length<2){fbSet(fbRef(fbDB,cdrPath("meta")),{phase:"lobby",order:[],round:st.round+1});return;}
 CDR.busy=true;
 fbSet(fbRef(fbDB,cdrPath("meta")),{phase:"secret",order:still,round:st.round+1}).then(function(){CDR.busy=false;CDR.entry=[];CDR.target=null;}).catch(function(){CDR.busy=false;});
}
function cdrShare(){
 var txt=T("cdrShareText").replace("{c}",CDR.code);
 try{if(navigator.share){navigator.share({text:txt}).catch(function(){});return;}}catch(e){}
 try{navigator.clipboard.writeText(CDR.code);cdrToast(T("nfcCopied"));}catch(e){}
}
function cdrInvite(){
 if(!fbDB||!CDR.code)return;
 var inv={from:CDR.me,game:"CODICE",kind:"codice",cat:"relax",roomCode:CDR.code,pubCode:(typeof FILOS_PUB_CODE!=="undefined"?FILOS_PUB_CODE:null)||null,ts:Date.now()};
 var key="inv_"+Date.now();
 try{fbSet(fbRef(fbDB,"filos_invites/"+key),inv);setTimeout(function(){try{fbRemove(fbRef(fbDB,"filos_invites/"+key));}catch(e){}},30000);cdrToast(T("cdrInviteSent"));}catch(e){}
}
function cdrToast(msg){
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
 var create=btn("codice-cta",T("cdrCreate"),function(){
  create.disabled=true;err.textContent="";
  cdrCreate(function(ok,msg){create.disabled=false;if(!ok){err.textContent=msg||T("connErr");return;}S.screen="cdr";cdrRender(true);});
 });
 wrap.appendChild(create);
 var sep=div("cdr-sep");sep.appendChild(div("cdr-sep-line"));sep.appendChild(div("cdr-sep-txt",T("cdrOr")));sep.appendChild(div("cdr-sep-line"));wrap.appendChild(sep);
 wrap.appendChild(div("codice-section",T("cdrJoinLabel")));
 var entry=[];var joinB;
 var otp=codiceOtp(function(a){entry=a;if(joinB)joinB.disabled=a.length!==4;});
 wrap.appendChild(otp);
 joinB=btn("codice-cta secondary",T("cdrJoin"),function(){
  if(entry.length!==4)return;joinB.disabled=true;err.textContent="";
  cdrJoin(entry.join(""),function(ok,msg){joinB.disabled=false;if(!ok){err.textContent=msg||T("connErr");return;}S.screen="cdr";cdrRender(true);});
 });
 joinB.disabled=true;
 wrap.appendChild(joinB);
 wrap.appendChild(err);
}
function cdrScreenLobby(wrap,st){
 cdrHeader(wrap,T("cdrRoomCode"),"",null);
 var codeEl=div("cdr-code");CDR.code.split("").forEach(function(c){codeEl.appendChild(div("cdr-code-d",c));});
 wrap.querySelector(".codice-big").replaceWith(codeEl);
 wrap.appendChild(div("codice-sub",T("cdrShareHint")));
 var acts=div("cdr-actions");
 acts.appendChild(btn("ebtn out",T("cdrShare"),cdrShare));
 acts.appendChild(btn("ebtn out",T("cdrInviteNear"),cdrInvite));
 wrap.appendChild(acts);
 wrap.appendChild(div("codice-section",T("playersInRoom")+" "+st.lobby.length+"/"+CDR_MAX_PLAYERS));
 var list=div("cdr-list");
 st.lobby.forEach(function(n){var r=div("cdr-row");r.appendChild(div("cdr-dot on"));r.appendChild(div("cdr-name",n+(n===CDR.me?" "+T("cdrYou"):"")));if(n===st.leader)r.appendChild(div("cdr-tag",T("cdrHost")));list.appendChild(r);});
 wrap.appendChild(list);
 if(st.leader===CDR.me){
  var go=btn("codice-cta",T("qvStart"),cdrStart);
  go.disabled=st.lobby.length<2;
  wrap.appendChild(go);
  if(st.lobby.length<2)wrap.appendChild(div("codice-legend",T("ui_aspetta_che_si_colleghi_almeno")));
 } else {
  wrap.appendChild(div("cdr-wait",T("cdrWaitHost").replace("{n}",st.leader||"")));
 }
}
function cdrScreenSecret(wrap,st){
 var mine=st.secrets[CDR.me];
 if(!mine){
  cdrHeader(wrap,T("cdrRound").replace("{n}",st.round),CDR.me+T("codiceChooseSecret"),T("cdrSecretSub"));
  var ok;
  var keep=CDR.entry.slice();
  var otp=codiceOtp(function(a){CDR.entry=a;if(ok)ok.disabled=a.length!==4||CDR.busy;});
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
 // Ultimo tentativo, visibile a tutti
 var lastAny=st.moves[st.moves.length-1];
 if(lastAny&&lastAny.pass){wrap.appendChild(div("cdr-last cdr-last-pass",T("cdrSkipped").replace("{n}",lastAny.by)));}
 var last=lastAny&&!lastAny.pass?lastAny:null;
 if(last){
  var lb=div("cdr-last");
  var lt=last.by===CDR.me?T("cdrTriedMine").replace("{t}",last.target):last.target===CDR.me?T("cdrTriedYours").replace("{b}",last.by):T("cdrTriedOther").replace("{b}",last.by).replace("{t}",last.target);
  lb.appendChild(div("cdr-last-t",lt));
  var lr=div("cdr-last-r");lr.appendChild(codiceSlots(last.guess,""));lr.appendChild(codiceFeedback(last.g,last.y,true));lb.appendChild(lr);
  lb.appendChild(div("cdr-last-s",codiceFeedbackText(last.g,last.y)));
  wrap.appendChild(lb);
 }
 if(myTurn){
  if(!CDR.target||opps.indexOf(CDR.target)<0)CDR.target=opps[0];
  var target=CDR.target;
  cdrHeader(wrap,T("cdrYourTurn"),T("codiceGuessShort")+target,null);
  if(opps.length>1){
   var tabs=div("codice-tabs");
   opps.forEach(function(p){tabs.appendChild(btn("codice-tab"+(p===target?" on":""),p,function(){CDR.target=p;CDR.entry=[];cdrRender(true);}));});
   wrap.appendChild(tabs);
  }
  cdrHistory(wrap,st,target);
  var tryB;var keep2=CDR.entry.slice();
  var otp2=codiceOtp(function(a){CDR.entry=a;if(tryB)tryB.disabled=a.length!==4;});
  wrap.appendChild(otp2);
  if(keep2.length){otp2._input.value=keep2.join("");CDR.entry=keep2;}
  tryB=btn("codice-cta",T("codiceTry"),function(){if(CDR.entry.length!==4)return;tryB.disabled=true;cdrGuess(target,CDR.entry.slice());});
  tryB.disabled=CDR.entry.length!==4;wrap.appendChild(tryB);
  wrap.appendChild(div("codice-legend",T("codiceLegend")));
 } else {
  cdrHeader(wrap,T("cdrWaiting"),T("cdrTurnOf").replace("{n}",st.turn||""),null);
  // Si possono guardare i tentativi su ogni giocatore (anche sul proprio codice)
  if(!CDR.view||others.indexOf(CDR.view)<0)CDR.view=opps[0]||CDR.me;
  var tabs2=div("codice-tabs");
  others.forEach(function(p){tabs2.appendChild(btn("codice-tab"+(p===CDR.view?" on":""),p===CDR.me?T("cdrYourCode"):p,function(){CDR.view=p;cdrRender(true);}));});
  wrap.appendChild(tabs2);
  cdrHistory(wrap,st,CDR.view);
  wrap.appendChild(div("codice-legend",T("codiceLegend")));
  // Se chi deve giocare non risponde (telefono spento, app chiusa), chi guida può saltare il suo turno
  if(st.leader===CDR.me){
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
  wrap.appendChild(div("end-title",(st.winner===CDR.me?T("cdrYouWon"):st.winner+" "+T("qvWon"))));
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

// Stringhe del gioco a distanza (aggiunte quando l'interfaccia è pronta)
function cdrStrings(){
 if(typeof STRINGS==="undefined"||STRINGS.it.cdrRemote)return;
 Object.assign(STRINGS.it,{cdrTriedMine:"Hai provato il codice di {t}",cdrTriedYours:"{b} ha provato il tuo codice",cdrTriedOther:"{b} ha provato il codice di {t}",cdrWonMine:"Hai indovinato il codice di {t}",cdrWonYours:"Ha indovinato il tuo codice",cdrWonOther:"Ha indovinato il codice di {t}",cdrRemote:"A distanza",cdrIntro:"Ognuno gioca dal proprio telefono, anche da tavoli o città diverse. Crea una partita e condividi il codice, oppure entra con il codice di un amico.",cdrCreate:"Crea una partita",cdrJoinLabel:"Hai un codice?",cdrJoin:"Entra",cdrRoomCode:"Codice della partita",cdrShareHint:"Fallo inserire ai tuoi amici in Indovina il codice, nella categoria A distanza.",cdrShare:"Condividi",cdrInviteNear:"Invita i tavoli vicini",cdrInviteSent:"Invito inviato",cdrShareText:"Giochiamo a Indovina il codice su Filòs! Codice partita: {c}",cdrYou:"(tu)",cdrYou2:"Tu",cdrYou3:"te",cdrHost:"Guida",cdrWaitHost:"Aspetta che {n} avvii la partita",cdrRound:"Partita {n}",cdrSecretSub:"Scegli 4 cifre. Gli altri non le vedono: scoprono solo quante ne hanno indovinate.",cdrOr:"oppure",cdrSkip:"Salta il turno di {n}",cdrSkipped:"{n} ha saltato il turno",cdrSecretSaved:"Codice salvato",cdrWaitSecrets:"Aspettiamo che tutti scelgano il loro codice.",cdrReady:"pronto",cdrChoosing:"sta scegliendo",cdrYourTurn:"Tocca a te",cdrWaiting:"Aspetta il tuo turno",cdrTurnOf:"Tocca a {n}",cdrYourCode:"il tuo codice",cdrMySecret:"Il tuo codice (tocca per vederlo)",cdrYouWon:"Hai vinto!",cdrTries:"tentativi",cdrInterrupted:"Partita interrotta",cdrInterruptedSub:"Sono usciti troppi giocatori per continuare.",cdrLeftTag:"uscito",cdrWaitRematch:"Aspetta che {n} avvii un'altra partita",cdrClosed:"La partita non c'è più",cdrClosedSub:"È stata chiusa o è scaduta.",cdrConnecting:"Collegamento…",cdrYouLeft:"Sei uscito dalla partita",cdrAlreadyStarted:"La partita è già iniziata",cdrRoomFull:"La partita è al completo (massimo 6 giocatori)"});
 Object.assign(STRINGS.en,{cdrTriedMine:"You tried {t}’s code",cdrTriedYours:"{b} tried your code",cdrTriedOther:"{b} tried {t}’s code",cdrWonMine:"You cracked {t}’s code",cdrWonYours:"Cracked your code",cdrWonOther:"Cracked {t}’s code",cdrRemote:"Remote",cdrIntro:"Everyone plays on their own phone, even from different tables or cities. Create a game and share the code, or join with a friend's code.",cdrCreate:"Create a game",cdrJoinLabel:"Got a code?",cdrJoin:"Join",cdrRoomCode:"Game code",cdrShareHint:"Ask your friends to enter it in Crack the code, in the Remote category.",cdrShare:"Share",cdrInviteNear:"Invite nearby tables",cdrInviteSent:"Invite sent",cdrShareText:"Let's play Crack the code on Filòs! Game code: {c}",cdrYou:"(you)",cdrYou2:"You",cdrYou3:"you",cdrHost:"Host",cdrWaitHost:"Waiting for {n} to start the game",cdrRound:"Game {n}",cdrSecretSub:"Pick 4 digits. The others can’t see them: they only find out how many they got right.",cdrOr:"or",cdrSkip:"Skip {n}’s turn",cdrSkipped:"{n} skipped a turn",cdrSecretSaved:"Code saved",cdrWaitSecrets:"Waiting for everyone to pick their code.",cdrReady:"ready",cdrChoosing:"choosing",cdrYourTurn:"Your turn",cdrWaiting:"Wait for your turn",cdrTurnOf:"{n}'s turn",cdrYourCode:"your code",cdrMySecret:"Your code (tap to see it)",cdrYouWon:"You won!",cdrTries:"tries",cdrInterrupted:"Game interrupted",cdrInterruptedSub:"Too many players left to carry on.",cdrLeftTag:"left",cdrWaitRematch:"Waiting for {n} to start another game",cdrClosed:"This game no longer exists",cdrClosedSub:"It was closed or has expired.",cdrConnecting:"Connecting…",cdrYouLeft:"You left the game",cdrAlreadyStarted:"The game has already started",cdrRoomFull:"The game is full (maximum 6 players)"});
 Object.assign(STRINGS.es,{cdrTriedMine:"Has probado el código de {t}",cdrTriedYours:"{b} ha probado tu código",cdrTriedOther:"{b} ha probado el código de {t}",cdrWonMine:"Has adivinado el código de {t}",cdrWonYours:"Ha adivinado tu código",cdrWonOther:"Ha adivinado el código de {t}",cdrRemote:"A distancia",cdrIntro:"Cada uno juega desde su móvil, incluso desde mesas o ciudades distintas. Crea una partida y comparte el código, o entra con el código de un amigo.",cdrCreate:"Crear una partida",cdrJoinLabel:"¿Tienes un código?",cdrJoin:"Entrar",cdrRoomCode:"Código de la partida",cdrShareHint:"Pide a tus amigos que lo introduzcan en Adivina el código, en la categoría A distancia.",cdrShare:"Compartir",cdrInviteNear:"Invitar a mesas cercanas",cdrInviteSent:"Invitación enviada",cdrShareText:"¡Juguemos a Adivina el código en Filòs! Código de la partida: {c}",cdrYou:"(tú)",cdrYou2:"Tú",cdrYou3:"ti",cdrHost:"Anfitrión",cdrWaitHost:"Esperando a que {n} empiece la partida",cdrRound:"Partida {n}",cdrSecretSub:"Elige 4 cifras. Los demás no las ven: solo saben cuántas han acertado.",cdrOr:"o",cdrSkip:"Saltar el turno de {n}",cdrSkipped:"{n} ha perdido el turno",cdrSecretSaved:"Código guardado",cdrWaitSecrets:"Esperando a que todos elijan su código.",cdrReady:"listo",cdrChoosing:"eligiendo",cdrYourTurn:"Te toca",cdrWaiting:"Espera tu turno",cdrTurnOf:"Le toca a {n}",cdrYourCode:"tu código",cdrMySecret:"Tu código (toca para verlo)",cdrYouWon:"¡Has ganado!",cdrTries:"intentos",cdrInterrupted:"Partida interrumpida",cdrInterruptedSub:"Se han ido demasiados jugadores para seguir.",cdrLeftTag:"se fue",cdrWaitRematch:"Esperando a que {n} empiece otra partida",cdrClosed:"Esta partida ya no existe",cdrClosedSub:"Se cerró o ha caducado.",cdrConnecting:"Conectando…",cdrYouLeft:"Has salido de la partida",cdrAlreadyStarted:"La partida ya ha empezado",cdrRoomFull:"La partida está completa (máximo 6 jugadores)"});
}
