/*!
 * Filòs — © 2026 i titolari del progetto Filòs. Tutti i diritti riservati.
 * Codice e contenuti (giochi, regole, domande, testi, traduzioni) sono opere protette
 * dalla legge sul diritto d'autore (L. 633/1941). È vietata qualsiasi copia, riproduzione,
 * modifica, ridistribuzione o estrazione automatica, anche parziale, e l'uso per addestrare
 * sistemi di intelligenza artificiale, senza autorizzazione scritta dei titolari.
 * Contenuti marcati con filigrana digitale per l'identificazione di copie non autorizzate.
 */
try{console.log("%cFilòs — © 2026 Tutti i diritti riservati.%c\nCodice e contenuti protetti dal diritto d'autore. Copia e riuso vietati senza autorizzazione scritta. Contenuti protetti da filigrana digitale.","font-weight:700;font-size:14px","font-size:12px");}catch(e){}
var ANALYTICS={plays:[],ratings:{},menuClicks:{}};
try{var _d=localStorage.getItem("filos13");if(_d){var _p=JSON.parse(_d);ANALYTICS.plays=_p.plays||[];ANALYTICS.ratings=_p.ratings||{};ANALYTICS.menuClicks=_p.menuClicks||{};}}catch(e){}
function getPubCode(){try{return localStorage.getItem("filos_pub_code")||"";}catch(e){return "";}}
function fbUniqueKey(){return Date.now()+"_"+Math.random().toString(36).slice(2,7);}
function fbLogPlay(cat,game){
 var code=getPubCode();if(!code||!window.fbDB||!window.fbSet||!window.fbRef)return;
 try{window.fbSet(window.fbRef(window.fbDB,"filos_stats/"+code+"/plays/"+fbUniqueKey()),{cat:cat,game:game,ts:Date.now(),device:FILOS_NAME||"anonimo"});}catch(e){}
}
function fbLogRating(game,stars){
 var code=getPubCode();if(!code||!window.fbDB||!window.fbSet||!window.fbRef)return;
 try{window.fbSet(window.fbRef(window.fbDB,"filos_stats/"+code+"/ratings/"+fbUniqueKey()),{game:game,stars:stars,ts:Date.now(),device:FILOS_NAME||"anonimo"});}catch(e){}
}
function saveA(){try{localStorage.setItem("filos13",JSON.stringify(ANALYTICS));}catch(e){}}
function logPlay(cat,game){S._playStart=Date.now();ANALYTICS.plays.push({cat:cat,game:game,ts:Date.now(),dur:0});saveA();fbLogPlay(cat,game);}
function logPlayEnd(){
 if(!S._playStart)return;
 var dur=Math.round((Date.now()-S._playStart)/1000);
 if(dur<2||dur>7200)return; // ignora <2s o >2h (outlier)
 if(ANALYTICS.plays.length){
 var last=ANALYTICS.plays[ANALYTICS.plays.length-1];
 if(!last.dur||last.dur===0)last.dur=dur;
 }
 S._playStart=null;
 saveA();
}
function logRating(game,stars){if(!ANALYTICS.ratings[game])ANALYTICS.ratings[game]={t:0,c:0};ANALYTICS.ratings[game].t+=stars;ANALYTICS.ratings[game].c++;saveA();fbLogRating(game,stars);}
function logMenuClick(tab,itemName){
 var key=tab+":"+itemName;
 ANALYTICS.menuClicks[key]=(ANALYTICS.menuClicks[key]||0)+1;
 saveA();
 var code=getPubCode();if(!code||!window.fbDB||!window.fbSet||!window.fbRef)return;
 try{window.fbSet(window.fbRef(window.fbDB,"filos_stats/"+code+"/menu/"+fbUniqueKey()),{tab:tab,item:itemName,ts:Date.now()});}catch(e){}
}

var PIN="1234";
var logoTaps=0,logoTimer=null,idleTimer=null,IDLE_MS=5*60*1000;

// Join existing room


// Listen to room changes











// ── NOME GIOCATORE ──────────────────────────────
var FILOS_NAME = "";
var _savedName = "";
try { _savedName = localStorage.getItem("filos_player_name") || ""; } catch(e){}
var FILOS_PUB_CODE = "";
try { FILOS_PUB_CODE = localStorage.getItem("filos_pub_code") || ""; } catch(e){}
var FILOS_PUB_NAME = "";
try { FILOS_PUB_NAME = localStorage.getItem("filos_pub_name") || ""; } catch(e){}

// ── TOKEN NFC ────────────────────────────────────
var NFC_TOKEN_DURATION = 2 * 60 * 60 * 1000; // 2 ore in ms
function getNfcToken(){try{return localStorage.getItem("filos_nfc_token")||"";}catch(e){return "";}}
function getNfcExpiry(){try{return parseInt(localStorage.getItem("filos_nfc_expiry")||"0",10);}catch(e){return 0;}}
function isNfcValid(){var t=getNfcToken();if(!t)return false;return Date.now()<getNfcExpiry();}
function setNfcToken(token){try{localStorage.setItem("filos_nfc_token",token);localStorage.setItem("filos_nfc_expiry",String(Date.now()+NFC_TOKEN_DURATION));}catch(e){}}
// ── SBLOCCO CON TAG NFC (verifica online) ─────────
// Il tag contiene un link ...?p=CODICE_LOCALE&t=CODICE_TAG.
// Su Firebase si salva solo l'impronta SHA-256 del codice tag (nfc_h/<locale>/h):
// leggerla non permette di sbloccare l'app.
var NFC_STATE={status:"idle",venue:"",tok:""}; // idle | checking | invalid | offline
function nfcRandom(n){var a="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789",out="";try{var b=new Uint8Array(n);crypto.getRandomValues(b);for(var i=0;i<n;i++)out+=a[b[i]%a.length];}catch(e){for(var j=0;j<n;j++)out+=a[Math.floor(Math.random()*a.length)];}return out;}
function nfcHash(venue,tok){
 var data=new TextEncoder().encode("filos:"+venue+":"+tok);
 return crypto.subtle.digest("SHA-256",data).then(function(buf){return Array.prototype.map.call(new Uint8Array(buf),function(x){return("0"+x.toString(16)).slice(-2);}).join("");});
}
function nfcCleanVenue(v){return String(v||"").toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,40);}
// Telefono del gestore (locale configurato dal pannello protetto da PIN): mai bloccato
function nfcIsOwnerDevice(){try{return !!localStorage.getItem("filos_pub_code");}catch(e){return false;}}
// INTERRUTTORE: metti true per riattivare il blocco con tag NFC
var CHEV='\u203a';
var STAR_SVG='<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" style="display:block"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>';
var NFC_LOCK_ENABLED=false;
function nfcGateNeeded(){
 if(!NFC_LOCK_ENABLED)return false;
 if(NFC_STATE.status==="checking")return true;
 if(nfcIsOwnerDevice())return false;
 return !isNfcValid();
}
function nfcVerify(){
 var v=NFC_STATE.venue,t=NFC_STATE.tok;
 if(!v||!t){NFC_STATE.status="invalid";return;}
 NFC_STATE.status="checking";
 if(!fbDB||!fbGet||!fbRef||!window.crypto||!crypto.subtle){NFC_STATE.status="offline";if(typeof render==="function")render();return;}
 var done=false;
 var timer=setTimeout(function(){if(done)return;done=true;NFC_STATE.status="offline";if(typeof render==="function")render();},12000);
 Promise.all([nfcHash(v,t),fbGet(fbRef(fbDB,"nfc_h/"+v+"/h"))]).then(function(r){
  if(done)return;done=true;clearTimeout(timer);
  var saved=r[1]&&r[1].val?r[1].val():null;
  if(saved&&saved===r[0]){
   setNfcToken(t);try{localStorage.setItem("filos_nfc_venue",v);}catch(e){}
   NFC_STATE.status="idle";NFC_STATE.tok="";
  } else {NFC_STATE.status="invalid";}
  if(typeof render==="function")render();
 }).catch(function(){
  if(done)return;done=true;clearTimeout(timer);
  NFC_STATE.status="offline";if(typeof render==="function")render();
 });
}
// Legge il link del tag al caricamento e lo toglie dalla barra degli indirizzi
(function(){
 try{
  var params=new URLSearchParams(window.location.search);
  var t=params.get("t"),p=nfcCleanVenue(params.get("p"));
  if(t&&p&&/^[A-Za-z0-9]{8,64}$/.test(t)){
   NFC_STATE.venue=p;NFC_STATE.tok=t;
   params.delete("t");params.delete("p");
   var q=params.toString();
   try{history.replaceState(null,"",window.location.pathname+(q?"?"+q:"")+window.location.hash);}catch(e){}
   nfcVerify();
  }
 }catch(e){}
})();
// Pannello gestore: registra il locale e pubblica l'impronta del codice tag
function nfcOwnerKey(){try{return localStorage.getItem("filos_nfc_owner_key")||"";}catch(e){return "";}}
function nfcPublish(venue,cb){
 venue=nfcCleanVenue(venue);
 if(!venue){cb(false,"nopub");return;}
 if(!fbDB||!fbSet||!fbRef){cb(false,"offline");return;}
 var key=nfcOwnerKey();
 if(!key){key=nfcRandom(24);try{localStorage.setItem("filos_nfc_owner_key",key);}catch(e){}}
 var tok=nfcRandom(24);
 nfcHash(venue,tok).then(function(h){
  return fbSet(fbRef(fbDB,"nfc_owner/"+venue+"/"+key),true).catch(function(){/* già registrato: va bene se la chiave è giusta */}).then(function(){
   return fbSet(fbRef(fbDB,"nfc_h/"+venue),{h:h,k:key,at:Date.now()});
  });
 }).then(function(){
  try{localStorage.setItem("filos_nfc_master_token",tok);localStorage.setItem("filos_nfc_master_venue",venue);}catch(e){}
  cb(true);
 }).catch(function(){cb(false,"denied");});
}
function nfcTagUrl(){
 var tok="",venue="";try{tok=localStorage.getItem("filos_nfc_master_token")||"";venue=localStorage.getItem("filos_nfc_master_venue")||"";}catch(e){}
 if(!tok||!venue)return "";
 return window.location.origin+window.location.pathname+"?p="+encodeURIComponent(venue)+"&t="+tok;
}

var S={screen: "onboarding",players:0,cat:null,game:null,stars:0,prevScreen:"home",rFilter:"tutti",revealed:{},pinOK:false,pinInput:"",pinErr:false,lastGame:"",menuTab:"drink",menuEdTab:"drink",quizGame:null,quizIdx:0,quizRevealed:false,quizScore:0,quizQuestions:[],quizLevel:null,starterGame:null,starterIdx:0,fromStarter:false,bFilter:"gruppo",mwWord:"",mwSimilar:"",mwWhiteIdx:-1,mwSeen:[],mwRevealing:-1,mwNumPlayers:0,intesaLevel:"facile",intesaWords:[],intesaIdx:0,intesaScore:0,intesaTimer:0,intesaRunning:false,intesaRound:1,intesaTeamScores:[],alfaLetter:"",alfaTimer:0,alfaRunning:false,alfaScores:{},alfaNumPlayers:0,alfaTarget:5,ncLetterN:"",ncLetterC:"",ncScores:{},ncNumPlayers:0,ncTarget:5,dadoValue:0,dadoPlayers:[],dadoScores:{},dadoCurrentIdx:0,dadoTarget:15,dadoRolled:false,dadoNumPlayers:0,dadoPlayerNames:[],codicePlayers:[],codiceCodes:{},codiceFound:{},codiceAsked:{},codiceCurrentIdx:0,codiceQuestion:null,codiceWaiting:false};

function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
function div(cls,txt){return el("div",cls,txt);}
function btn(cls,txt,fn){var b=el("button",cls,txt);b.onclick=fn;return b;}
function clr(){document.getElementById("root").innerHTML="";var _l=document.getElementById("hdrLeft");if(_l)_l.innerHTML="";document.body.style.overflow='';document.body.style.userSelect='';document.body.style.webkitUserSelect='';}
function getCatById(id){for(var i=0;i<CATS.length;i++){if(CATS[i].id===id)return CATS[i];}return null;}
// Lista giochi della lingua attiva (ricade sull'italiano se manca la traduzione della categoria)
function gameTable(){var t=(LANG==="en"&&typeof GAMES_EN!=="undefined")?GAMES_EN:(LANG==="es"&&typeof GAMES_ES!=="undefined")?GAMES_ES:null;return (t&&S.cat&&t[S.cat])?t:GAMES;}
// Gioco selezionato: S.game è la posizione nella lista completa della lingua attiva
// Domande di ANNO GIUSTO nella lingua attiva
function agData(){return (LANG==="en"&&typeof ANNO_GIUSTO_DATA_EN!=="undefined")?ANNO_GIUSTO_DATA_EN:(LANG==="es"&&typeof ANNO_GIUSTO_DATA_ES!=="undefined")?ANNO_GIUSTO_DATA_ES:ANNO_GIUSTO_DATA;}
function curGame(){if(S.game===null||S.game===undefined||!S.cat)return null;var l=gameTable()[S.cat]||[];return l[S.game]||null;}
function resetIdle(){clearTimeout(idleTimer);if(S.screen==="home"||S.screen==="onboarding")return;idleTimer=setTimeout(function(){S.screen="home";S.cat=null;S.game=null;render();},IDLE_MS);}
document.addEventListener("touchstart",resetIdle);
document.addEventListener("click",resetIdle);
function isAvail(c){if(S.players===0)return true;var p=S.players===7?6:S.players;if(c.min&&p<c.min)return false;if(c.max&&p>c.max)return false;return true;}
function setCatBg(){
 if(S.cat&&CAT_PASTEL&&CAT_PASTEL[S.cat]){
 document.body.style.background=CAT_PASTEL[S.cat];
 document.body.style.transition="background 0.3s ease";
 }
}
function stopAllTimers(){["_appelloTimer","_cicTimer","_csdTimer","_lexTimer","_mimoTimer","_pubTimer","_robotTimer","_sculTimer","_sinonTimer","_sopTimer","_specTimer","_superTimer","alfaInterval"].forEach(function(n){try{if(window[n]){clearInterval(window[n]);window[n]=null;}}catch(e){}});if(typeof QZ!=="undefined"&&QZ&&QZ.timer){clearInterval(QZ.timer);QZ.timer=null;}["pubRunning","lexRunning","mimoRunning","robotRunning","sculRunning","sinonRunning","sopRunning","specRunning","superRunning","appelloRunning","cicRunning","csdRunning","alfaRunning","intesaRunning"].forEach(function(k){if(S[k])S[k]=false;});if(typeof intesaInterval!=='undefined'&&intesaInterval){clearInterval(intesaInterval);intesaInterval=null;}if(window._qvAutoTimer){clearTimeout(window._qvAutoTimer);window._qvAutoTimer=null;}if(window._qvCountdownInterval){clearInterval(window._qvCountdownInterval);window._qvCountdownInterval=null;}if(window._qvRevealTimer){clearTimeout(window._qvRevealTimer);window._qvRevealTimer=null;}if(window._qvRevealInterval){clearInterval(window._qvRevealInterval);window._qvRevealInterval=null;}if(window._qvNextTimer){clearTimeout(window._qvNextTimer);window._qvNextTimer=null;}if(window._qvNextInterval){clearInterval(window._qvNextInterval);window._qvNextInterval=null;}}
function goHome(){if(typeof fgrLeave==="function"&&typeof FGR!=="undefined"&&FGR.code)fgrLeave();if(typeof pdrLeave==="function"&&typeof PDR!=="undefined"&&PDR.code)pdrLeave();if(typeof agrLeave==="function"&&typeof AGR!=="undefined"&&AGR.code)agrLeave();if(typeof qvrInLobby==="function"&&qvrInLobby())qvrLeave();if(typeof cdrLeave==="function"&&typeof CDR!=="undefined"&&CDR.code)cdrLeave();stopAllTimers();S.screen="home";S.cat=null;S.game=null;render();fbSync();}
function addBackArrow(action){
 var left=document.getElementById("hdrLeft");
 if(!left) return;
 left.innerHTML="";
 var b=document.createElement("button");
 b.className="back-arrow";
 b.textContent=T("back");
 b.onclick=action;
 left.appendChild(b);
}
function goBackToGames(){if(typeof fgrLeave==="function"&&typeof FGR!=="undefined"&&FGR.code)fgrLeave();if(typeof pdrLeave==="function"&&typeof PDR!=="undefined"&&PDR.code)pdrLeave();if(typeof agrLeave==="function"&&typeof AGR!=="undefined"&&AGR.code)agrLeave();if(typeof qvrInLobby==="function"&&qvrInLobby())qvrLeave();if(typeof cdrLeave==="function"&&typeof CDR!=="undefined"&&CDR.code)cdrLeave();stopAllTimers();logPlayEnd();S.screen="games";S.game=null;render();}
function endGame(name){stopAllTimers();logPlayEnd();S.lastGame=name;S.screen="end";S.stars=0;S.menuTab="drink";render();}
function getMsg(n){return n>=4?T("endMsg4"):n===3?T("endMsg3"):T("endMsgElse");}

function updateHdr(){
 var right=document.getElementById("hdrRight");
 if(!right)return;
 right.innerHTML="";
 
 // Header right
 {
 if(S.screen==="connect"){
 right.innerHTML="";
 var left=document.getElementById("hdrLeft");
 if(left){
 left.innerHTML="";
 var bb=document.createElement("button");
 bb.style.cssText="background:none;border:none;cursor:pointer;color:#aaa;font-family:inherit;font-size:13px;font-weight:600;padding:4px 8px;display:flex;align-items:center;gap:4px;";
 bb.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg> '+T('backBtn');
 bb.onclick=function(){fbLeaveRoom();S.screen=S.prevScreen||"home";render();};
 left.appendChild(bb);
 }
 } else if(S.screen==="quizzone_lobby"||S.screen==="quizzone_game"||S.screen==="quizzone_leaderboard"||S.screen==="quizzone_end"){
 // Header dark per quizzone
 var hdrEl=document.querySelector('.hdr');
 if(hdrEl) hdrEl.style.background='#1a1a2e';
 right.innerHTML="";
 var left2=document.getElementById("hdrLeft");
 if(left2){
 left2.innerHTML="";
 var bb2=document.createElement("button");
 bb2.style.cssText="background:none;border:none;cursor:pointer;color:#888;font-family:inherit;font-size:13px;font-weight:600;padding:4px 8px;display:flex;align-items:center;gap:4px;";
 bb2.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg> '+T('exitBtn');
 bb2.onclick=function(){
 clearInterval(QZ.timer); qzFbUnlisten();
 var hdrEl2=document.querySelector('.hdr');
 if(hdrEl2) hdrEl2.style.background='';
 S.screen=S.prevScreen||"games"; render();
 };
 left2.appendChild(bb2);
 }
 } else {
 // Ripristina colore header
 var hdrEl3=document.querySelector('.hdr');
 if(hdrEl3) hdrEl3.style.background='';
 right.innerHTML="";
 }
 }
}


function renderLangPill(){
 var slot=document.getElementById('hdrLang');
 if(!slot)return;
 slot.innerHTML='';
 var pill=document.createElement('div');
 pill.className='lang-pill';
 [['it','ITA'],['en','ENG'],['es','ESP']].forEach(function(p){
 var b=document.createElement('button');
 b.textContent=p[1];
 if(LANG===p[0])b.className='active';
 b.onclick=(function(l){return function(){setLang(l);};})(p[0]);
 pill.appendChild(b);
 });
 slot.appendChild(pill);
}
// ── SCHERMATA ONBOARDING (nome giocatore) ────────
function renderNfcGate(){
 clr();
 var root=document.getElementById("root");
 var wrap=div("");
 wrap.style.cssText="min-height:calc(100vh - 68px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 32px;gap:24px;text-align:center;";
 var icon=div("");icon.style.cssText="width:80px;height:80px;border-radius:24px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;margin:0 auto;";
 icon.innerHTML='<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><circle cx="12" cy="12" r="1" fill="#fff" stroke="none"/></svg>';
 wrap.appendChild(icon);
 var title=div("");title.style.cssText="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:800;color:#111;letter-spacing:-0.5px;";title.textContent=T("nfcGateTitle");
 wrap.appendChild(title);
 var sub=div("");sub.style.cssText="font-size:15px;color:#636366;line-height:1.6;max-width:280px;";sub.textContent=T("nfcGateSub");
 wrap.appendChild(sub);
 // Animazione onda NFC
 var nfcAnim=div("");nfcAnim.style.cssText="position:relative;width:80px;height:80px;margin:8px auto;";
 nfcAnim.innerHTML='<style>@keyframes nfc-ring{0%{transform:scale(0.4);opacity:0.8}100%{transform:scale(1.6);opacity:0}}.nfc-ring{position:absolute;inset:0;border-radius:50%;border:2px solid #FF7A45;animation:nfc-ring 1.6s ease-out infinite;}.nfc-ring:nth-child(2){animation-delay:0.5s}.nfc-ring:nth-child(3){animation-delay:1s}</style><div class="nfc-ring"></div><div class="nfc-ring"></div><div class="nfc-ring"></div>';
 wrap.appendChild(nfcAnim);
 if(NFC_STATE.status==="checking"){wrap.appendChild(div("",T("nfcChecking")));}
 else if(NFC_STATE.status==="invalid"){var m=div("",T("nfcInvalid"));m.style.cssText="color:#ff3b30;font-weight:600;max-width:300px;";wrap.appendChild(m);}
 else if(NFC_STATE.status==="offline"){var m2=div("",T("nfcOffline"));m2.style.cssText="color:#ff9f0a;font-weight:600;max-width:300px;";wrap.appendChild(m2);
  var rb=document.createElement("button");rb.className="ebtn";rb.textContent=T("nfcRetry");rb.onclick=function(){nfcVerify();render();};wrap.appendChild(rb);}
 root.appendChild(wrap);
}

function renderOnboarding(){
 clr();
 var root=document.getElementById("root");
 var wrap=div("splash");
 wrap.style.cssText="min-height:calc(100vh - 68px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 32px;background:#fff;gap:0;";

 // Logo
 var logo=div("","Filòs");
 logo.setAttribute("translate","no");
 logo.style.cssText="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:14px;letter-spacing:4px;color:#FF7A45;text-transform:uppercase;margin-bottom:40px;";
 wrap.appendChild(logo);

 // Titolo
 var hd=div("");
 hd.style.cssText="text-align:center;margin-bottom:36px;";
 var h1=el("h1","",T("ui_come_ti_fai_chiamare"));
 h1.style.cssText="font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;letter-spacing:-0.6px;line-height:1.2;margin-bottom:10px;color:#111;";
 var sub=div("",T("ui_gli_altri_tavoli_ti_vedranno"));
 sub.style.cssText="font-size:15px;color:#8E8E93;line-height:1.55;";
 hd.appendChild(h1);hd.appendChild(sub);
 wrap.appendChild(hd);

 // Input
 var inputWrap=div("");
 inputWrap.style.cssText="width:100%;max-width:390px;background:#fff;border-radius:12px;overflow:hidden;margin-bottom:28px;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 0 0 1px rgba(0,0,0,0.06);";
 var inputRow=div("");
 inputRow.style.cssText="display:flex;align-items:center;padding:0 16px;min-height:52px;gap:12px;";
 var icon=div("");
 icon.style.cssText="flex-shrink:0;color:#FF7A45;display:flex;align-items:center;";
 icon.innerHTML='<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="8" r="4.5" stroke="currentColor" stroke-width="1.8"/><circle cx="15" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8" opacity="0.5"/><path d="M1 17c0-3 3.5-5 8-5s8 2 8 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.5"/><path d="M13.5 12.5c2 .3 4 1.5 4 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
 var inp=el("input","");
 inp.type="text";inp.placeholder=T("ui_il_tuo_nome_o_soprannome");inp.maxLength=24;
 inp.autocomplete="off";inp.autocorrect="off";inp.spellcheck=false;
 if(_savedName){inp.value=_savedName;}
 inp.style.cssText="flex:1;border:none;outline:none;background:transparent;font-size:17px;font-family:'DM Sans',sans-serif;color:#111;padding:14px 0;-webkit-appearance:none;";
 inputRow.appendChild(icon);inputRow.appendChild(inp);
 inputWrap.appendChild(inputRow);
 wrap.appendChild(inputWrap);

 // Bottone
 var startBtn=btn("splash-btn",T("ui_inizia_a_giocare"),function(){
  var name=inp.value.trim();
  if(name.length<2)return;
  try{localStorage.setItem("filos_player_name",name);}catch(e){}
  FILOS_NAME=name;
  S.screen="home";render();
  startInviteListener();
 });
 startBtn.style.cssText="background:#FF7A45;border:none;border-radius:12px;color:#fff;font-weight:700;font-size:17px;cursor:pointer;padding:15px 0;width:100%;max-width:390px;letter-spacing:-0.2px;opacity:0.45;pointer-events:none;transition:opacity 0.1s,background 0.1s;font-family:'Space Grotesk',sans-serif;";

 var _updateBtn=function(){
  var ok=inp.value.trim().length>=2;
  startBtn.style.opacity=ok?"1":"0.45";
  startBtn.style.pointerEvents=ok?"all":"none";
 };
 inp.addEventListener("input",_updateBtn);
 _updateBtn();
 inp.addEventListener("keydown",function(e){if(e.key==="Enter")startBtn.click();});

 wrap.appendChild(startBtn);
 var note=div("",_savedName?T("ui_puoi_cambiare_il_tuo_nome"):T("ui_il_nome_verra_chiesto_ogni"));
 note.style.cssText="margin-top:18px;font-size:13px;color:#8E8E93;line-height:1.5;text-align:center;max-width:310px;";
 wrap.appendChild(note);
 root.appendChild(wrap);
 setTimeout(function(){inp.focus();},200);
}

function renderSplash(){
 clr();
 var wrap=div("splash");
 (function(){var sl=div("splash-logo","Filòs");sl.setAttribute("translate","no");wrap.appendChild(sl);})();
 wrap.appendChild(div("splash-tagline",T("tagline")));
 
 wrap.appendChild(div("splash-divider"));
 wrap.appendChild(div("splash-desc",T("splashDesc")));
 wrap.appendChild(btn("splash-btn",T("splashBtn"),function(){S.screen="home";render();}));
 wrap.appendChild(div("splash-foot",T("splashFoot")));
 document.getElementById("root").appendChild(wrap);
}

function renderHome(){
 clr();
 var wrap=div("home");
 wrap.appendChild(div("home-title",T("homeTitle")));
 // challenge rimosso

 var grid1=div("cgrid"),grid2=div("cgrid"),gridM=div("cgrid-mobile");
 for(var i=0;i<CATS.length;i++){
 (function(cat,idx){
 var avail=isAvail(cat);
 function makeCb(){
 var cb=div("cb "+cat.cls+((!avail&&S.players)?" locked":""));
 if(CAT_ICONS&&CAT_ICONS[cat.id]){
 var ciWrap=div("ci");
 var ciImg=document.createElement("img");
 ciImg.src=CAT_ICONS[cat.id];
 ciImg.alt=getCatName(cat.id);
 ciImg.style.cssText="width:120px;height:120px;object-fit:contain;display:block;margin-top:16px;";
 ciWrap.appendChild(ciImg);
 cb.appendChild(ciWrap);
 }else if(CAT_SVGS&&CAT_SVGS[cat.id]){
 var ciSvg=div("ci");ciSvg.innerHTML=CAT_SVGS[cat.id];cb.appendChild(ciSvg);
 }
 cb.appendChild(el("span","cn",getCatName(cat.id)));
 if(avail||!S.players){cb.onclick=function(){S.cat=cat.id;S.screen="games";render();};}
 return cb;
 }
 if(idx<5)grid1.appendChild(makeCb());else grid2.appendChild(makeCb());
 gridM.appendChild(makeCb());
 })(CATS[i],i);
 }
 wrap.appendChild(grid1);wrap.appendChild(grid2);wrap.appendChild(gridM);
 // Chi paga il conto? — scheda in home (non copre più i giochi)
 var pay=document.createElement("button");pay.className="home-pay";pay.type="button";
 pay.innerHTML='<span class="home-pay-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg></span><span class="home-pay-tx"><span class="home-pay-t"></span><span class="home-pay-s"></span></span><span class="home-pay-chev"></span>';
 pay.querySelector(".home-pay-t").textContent=T("ui_chi_paga_il_conto");
 pay.querySelector(".home-pay-s").textContent=T("ui_chi_paga_sub");
 pay.onclick=function(){if(typeof openChiPaga==="function")openChiPaga();};
 wrap.appendChild(pay);
 var lf=div("legal-foot");lf.appendChild(div("",T("legalFooter")));
 lf.appendChild(btn("",T("legalLink"),function(){S.prevScreen="home";S.screen="terms";render();window.scrollTo(0,0);}));
 wrap.appendChild(lf);

 document.getElementById("root").appendChild(wrap);
}
function renderTerms(){
 clr();
 addBackArrow(goHome);
 var w=div("terms-wrap");
 w.appendChild(el("h1","",T("legalTitle")));
 var secs=(typeof LEGAL_TERMS!=="undefined"&&(LEGAL_TERMS[LANG]||LEGAL_TERMS.it))||[];
 secs.forEach(function(x){var c=div("terms-sec");c.appendChild(el("h2","",x[0]));c.appendChild(el("p","",x[1]));w.appendChild(c);});
 w.appendChild(div("legal-foot",T("legalFooter")));
 var b=btn("codice-cta",T("legalBack"),goHome);b.style.marginTop="18px";w.appendChild(b);
 document.getElementById("root").appendChild(w);
}

function renderGames(){
 clr();
 addBackArrow(goHome);
 var cat=getCatById(S.cat);
 var panel=div("panel");
 panel.appendChild(el("h2","sec-title",getCatName(cat.id)));
 
 if(S.cat==="bambini"){
 var bfrow=div("filter-row");
 [["gruppo",T("ui_rompighiaccio")],["coppia",T("ui_primo_appuntamento")]].forEach(function(f){
 var t=div("ftag "+(S.bFilter===f[0]?"on":""));t.textContent=f[1];t.onclick=function(){S.bFilter=f[0];render();};bfrow.appendChild(t);
 });
 panel.appendChild(bfrow);
 }
 
 if(S.cat==="indovinelli"){
 var frow=div("filter-row");
 ["tutti","facile","media","difficile"].forEach(function(f){
 var lbl=f==="facile"?T("filterEasy"):f==="media"?T("filterMed"):f==="difficile"?T("filterHard"):T("filterAll");
 var t=div("ftag "+(S.rFilter===f?"on":""));t.textContent=lbl;t.onclick=function(){S.rFilter=f;render();};frow.appendChild(t);
 });
 panel.appendChild(frow);
 var arr=S.rFilter==="tutti"?RIDDLES.facile.concat(RIDDLES.media).concat(RIDDLES.difficile):RIDDLES[S.rFilter]||[];
 var list=div("glist");
 for(var i=0;i<arr.length;i++){(function(r){
 var diff=RIDDLES.facile.indexOf(r)>=0?"facile":RIDDLES.media.indexOf(r)>=0?"media":"difficile";
 var ri=(RIDDLES[diff]||[]).indexOf(r);
 var stars=diff==="facile"?T("filterEasy"):diff==="media"?T("filterMed"):T("filterHard");stars=" \u00b7 "+stars.charAt(0)+stars.slice(1).toLowerCase();
 var row=div("grow");var info=div("");
 var rqq=rq(r).q;var q=rqq.length>70?rqq.substring(0,70)+"...":rqq;
 info.appendChild(div("gn",q));info.appendChild(div("gm",T("ui_indovinello")+stars));
 row.appendChild(info);row.appendChild(div("garr",CHEV));
 row.onclick=(function(d,ri2){return function(){S.rDiff=d;S.rIdx=ri2;S.curRiddle=RIDDLES[d][ri2];logPlay("indovinelli",q.substring(0,30));S.screen="riddle";render();};})(diff,ri);
 list.appendChild(row);
 })(arr[i]);}
 panel.appendChild(list);
 } else {
 var _gtable=gameTable();var _allGames=_gtable[S.cat]||[];var games=_allGames;
 if(S.cat==="bambini"){
 games=games.filter(function(g){
 if(S.bFilter==="coppia")return g.players==="2";
 return g.players!=="2";
 });
 }
 var _qzOn=false;try{_qzOn=localStorage.getItem("filos_quizzone")==="1";}catch(e){}
 games=games.filter(function(g){return !g.quizzone||_qzOn;});
 games=games.filter(function(g){return !g.hidden;});
 var list=div("glist");
 var lastSection="";
 for(var i=0;i<games.length;i++){(function(g,idx){
 if(g.section&&g.section!==lastSection){
 lastSection=g.section;
 var sec=div("gsection");sec.textContent=g.section;list.appendChild(sec);
 }
 var row=div("grow");var info=div("");
 var nameWrap=div("gn");nameWrap.textContent=g.name;
  if(g.isnew)nameWrap.appendChild(el("span","gbadge new",T("ui_nuovo")));
 info.appendChild(nameWrap);info.appendChild(div("gm",g.players+" "+T("players")+" \u00b7 "+g.time));
 row.appendChild(info);row.appendChild(div("garr",CHEV));
 row.onclick=(function(i2){return function(){
 S.game=i2;logPlay(S.cat,g._it||g.name);
 var gname=g._it||g.name; // nome italiano: chiave di QUIZ_DATA
 if(g.quizzone){
 // Quizzone richiede una stanza Firebase — vai alla connect screen dedicata o avvia direttamente
 S.prevScreen='games';
 if(fbIsHost && fbRoomCode){
 qzStart();
 } else if(!fbRoomCode){
 // Non connesso: vai alla connect screen
 S.screen='connect'; render();
 } else {
 // Client connesso: vai in lobby quizzone
 QZ.questions=[]; QZ.qIdx=0; QZ.answered=false; QZ.myAnswer=null; QZ.showAnswer=false; QZ.myNickname='';
 S.screen='quizzone_lobby'; render();
 }
 return;
 }
 if(g.mrwhite){
 S.screen="game";render();return;
 }
 if(g.intesa){
 S.screen="intesa_setup";render();return;
 }
 if(g.alfabeto){
 S.screen="alfabeto_setup";render();return;
 }
 if(g.nomecognome){
 S.screen="nc_setup";render();return;
 }
 if(g.quindici){
 S.screen="dado_setup";render();return;
 }
 if(g.codice){
 S.screen="codice_setup";render();return;
 }
 if(g.chipaga){
 S.screen="chipaga";render();return;
 }
 if(g.quantovale){
 S.screen="qv_setup";render();return;
 }
 if(g.annogiusto){
 S.screen="ag_setup";render();return;
 }
 if(g.confessionianonime){
 S.screen="ca_setup";render();return;
 }
 if(g.lex){
 S.screen="lex";S.lexQ=null;S.lexTime=120;S.lexRunning=false;render();return;
 }
 if(g.pub){ S.screen="pub";S.pubTime=120;S.pubRunning=false;render();return; }
 if(g.robot){ S.screen="robot";S.robotTime=120;S.robotRunning=false;render();return; }
 if(g.specchio){
 S.screen="specchio";S.specTime=120;S.specRunning=false;render();return;
 }
 if(g.scultura){
 S.screen="scultura";S.sculTime=60;S.sculRunning=false;render();return;
 }
 if(g.mimo){
 S.screen="mimo";S.mimoTime=180;S.mimoRunning=false;render();return;
 }
 if(g.soprannome){
 S.screen="soprannome";S.sopTime=300;S.sopRunning=false;render();return;
 }
 if(g.cosaincomune){
 S.screen="cosaincomune";S.cicTime=240;S.cicRunning=false;render();return;
 }
 if(g.chiseidavvero){
 S.screen="chiseidavvero";S.csdQ=null;S.csdTime=20;S.csdRunning=false;render();return;
 }
 if(g.superpotere){
 S.screen="superpotere";S.superTime=30;S.superRunning=false;render();return;
 }
 if(g.appello){
 S.screen="appello";S.appelloTime=60;S.appelloRunning=false;render();return;
 }
 if(g.sinon){
 S.screen="sinon";S.sinonTime=180;render();return;
 }
 if(g.cosanonsa){
 S.screen="cns_write";S.cnsPlayer=1;S.cnsItems=[["","","","",""],["","","","",""]];S.cnsIdx=0;S.cnsGuess=null;S.cnsReveal=false;render();return;
 }
 if(g.viaggiosogni){
 S.screen="viaggio_plan";S.viaggioData={dest:"",quando:"",durata:"",alloggio:"",attivita:"",cibo:"",momento:"",budget:""};render();return;
 }
 if(g.codiceremote){
 S.screen="cdr";render();return;
 }
 if(g.annoremote){
 S.screen="agr";render();return;
 }
 if(g.primadoporemote){
 S.screen="pdr";render();return;
 }
 if(g.bandieraremote){
 S.screen="fgr";render();return;
 }
 if(g.traditore){
 S.screen="traditore_setup";render();return;
 }
 if(S.cat==="cultura"&&QUIZ_DATA[gname]){
 S.quizGame=gname;S.quizLevel=null;S.screen="quizlevel";render();
 } else if(spDeck(g.name,g._it)){
 S.starterGame=g.name;S.starterGameIt=g._it;S.starterIdx=0;S.screen="starter";render();
 } else {S.screen="game";render();}
 };})(idx);
 list.appendChild(row);
 })(games[i],_allGames.indexOf(games[i]));}
 panel.appendChild(list);
 }
 document.getElementById("root").appendChild(panel);
}

function renderRiddle(){
 clr();
 var cat=getCatById("indovinelli");var r=S.curRiddle;var diff=S.rDiff;
 var stars=diff==="facile"?T("filterEasy"):diff==="media"?T("filterMed"):T("filterHard");
 var key=diff+"_"+S.rIdx;
 var panel=div("panel");var card=div("dcard");panel.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;card.appendChild(hdr);
 var dhdrTop2=div("dhdr-top");hdr.appendChild(dhdrTop2);
 dhdrTop2.appendChild(btn("card-nav-btn back",T("backToGames"),goBackToGames));
 dhdrTop2.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 hdr.appendChild(el("span","dbadge",stars));
 hdr.appendChild(div("riddle-q",rq(r).q));
 var body=div("dbody");card.appendChild(body);
 var revBtn=btn("reveal-btn",S.revealed[key]?T("ui_nascondi"):T("revealAnswer"),function(){S.revealed[key]=!S.revealed[key];renderRiddle();});
 body.appendChild(revBtn);
 if(S.revealed[key])body.appendChild(div("riddle-ans",rq(r).a));
 var ew=div("");ew.style.cssText="text-align:center;margin-top:24px;";
 ew.appendChild(btn("ebtn",T("endBtn"),function(){endGame(T("riddleLabel"));}));
 body.appendChild(ew);
 document.getElementById("root").appendChild(panel);
}


// ── HELPER: tastierino numerico riutilizzabile ──
// onConfirm(n) chiamato quando si preme o si clicca Conferma
// minVal / maxVal per validazione (maxVal=0 = nessun limite)
function makeStepperWidget(initVal, minVal, maxVal, onConfirm){
 var current = initVal||minVal||2;
 var wrap = document.createElement('div');
 wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:16px;';

 var row = document.createElement('div');
 row.style.cssText = 'display:flex;align-items:center;gap:20px;';

 var btnMinus = document.createElement('button');
 btnMinus.textContent = '−';
 btnMinus.className = 'trad-num-btn minus';
 btnMinus.style.fontSize = '32px';

 var display = document.createElement('div');
 display.className = 'trad-num-disp';
 display.textContent = current;

 var btnPlus = document.createElement('button');
 btnPlus.textContent = '+';
 btnPlus.className = 'trad-num-btn plus';
 btnPlus.style.fontSize = '32px';

 function refresh(){
  display.textContent = current;
  btnMinus.disabled = current <= minVal;
  btnMinus.style.opacity = current <= minVal ? '0.3' : '1';
  btnPlus.disabled = maxVal > 0 && current >= maxVal;
  btnPlus.style.opacity = (maxVal > 0 && current >= maxVal) ? '0.3' : '1';
  onConfirm(current);
 }

 btnMinus.onclick = function(){ if(current > minVal){ current--; refresh(); } };
 btnPlus.onclick  = function(){ if(maxVal===0||current < maxVal){ current++; refresh(); } };

 row.appendChild(btnMinus);
 row.appendChild(display);
 row.appendChild(btnPlus);
 wrap.appendChild(row);

 var hint = document.createElement('div');
 hint.style.cssText = 'font-size:12px;color:var(--muted);';
 hint.textContent = minVal ? T("ui_minimo")+minVal+(maxVal?T("ui_massimo")+maxVal:'') : '';
 if(hint.textContent) wrap.appendChild(hint);

 refresh();
 return wrap;
}

function startMrWhite(numPlayers){
 var g=curGame()||{};
 var _itMw=(GAMES[S.cat]||[]).filter(function(x){return x.mrwhite;})[0]||{};
 var words=g.words||_itMw.words||[{secret:"Spiaggia",similar:"Piscina"}];
 var pair=words[Math.floor(Math.random()*words.length)];
 S.mwWord=pair.secret;
 S.mwSimilar=pair.similar;
 S.mwWhiteIdx=Math.floor(Math.random()*numPlayers);
 S.mwSeen=[];
 S.mwNumPlayers=numPlayers;
 S.mwRevealing=-1;
 render();
}


function renderMrWhiteSetup(){
 clr();
 if(!S.mwNumPlayers||S.mwNumPlayers<3)S.mwNumPlayers=4;
 var wrap=div("mw-wrap");
 wrap.appendChild(div("mw-title","MR. WHITE"));
 wrap.appendChild(div("mw-sub",T("mrWhiteHowMany")));

 // Stepper stile altri giochi
 var stepper=div("");stepper.style.cssText="display:flex;align-items:center;justify-content:center;gap:24px;margin:24px 0;";
 var numDisp=div("");numDisp.style.cssText="font-size:52px;font-weight:800;min-width:64px;text-align:center;font-family:'Space Grotesk',sans-serif;color:var(--dark);";numDisp.textContent=String(S.mwNumPlayers);
 var minusBtn=document.createElement("button");
 minusBtn.style.cssText="width:48px;height:48px;border-radius:50%;border:2px solid #e0e0e0;background:#fff;font-size:24px;font-weight:300;cursor:pointer;color:#555;display:flex;align-items:center;justify-content:center;font-family:inherit;";
 minusBtn.textContent="−";
 minusBtn.onclick=function(){if(S.mwNumPlayers>3){S.mwNumPlayers--;numDisp.textContent=String(S.mwNumPlayers);}};
 var plusBtn=document.createElement("button");
 plusBtn.style.cssText="width:48px;height:48px;border-radius:50%;border:2px solid #e0e0e0;background:#fff;font-size:24px;font-weight:300;cursor:pointer;color:#555;display:flex;align-items:center;justify-content:center;font-family:inherit;";
 plusBtn.textContent="+";
 plusBtn.onclick=function(){if(S.mwNumPlayers<12){S.mwNumPlayers++;numDisp.textContent=String(S.mwNumPlayers);}};
 stepper.appendChild(minusBtn);stepper.appendChild(numDisp);stepper.appendChild(plusBtn);
 wrap.appendChild(stepper);

 wrap.appendChild(btn("ebtn",T("ui_inizia"),function(){S.screen="mrwhite";startMrWhite(S.mwNumPlayers);}));
 wrap.appendChild(btn("ebtn out",T("backToGames"),goBackToGames));
 document.getElementById("root").appendChild(wrap);
}

function renderMrWhite(){
 clr();
 addBackArrow(goBackToGames);
 var g=curGame()||{};
 var wrap=div("mw-wrap");

 // Reveal overlay
 if(S.mwRevealing>=0){
 var overlay=div("mw-reveal-screen");
 var isWhite=(S.mwRevealing===S.mwWhiteIdx);
 if(isWhite){
 overlay.appendChild(div("mw-reveal-msg",T("ui_sei_mr_white")));
 overlay.appendChild(div("mw-reveal-word",S.mwSimilar));
 overlay.appendChild(div("mw-reveal-sub",T("mrWhiteBluff")));
 } else {
 overlay.appendChild(div("mw-reveal-msg",T("mrWhiteYourWord")));
 overlay.appendChild(div("mw-reveal-word",S.mwWord));
 overlay.appendChild(div("mw-reveal-sub",T("ui_ricordatela_non_mostrarla_agli_altri")));
 }
 var closeBtn=btn("mw-reveal-btn",T("ui_ho_visto"),function(){
 S.mwSeen.push(S.mwRevealing);
 S.mwRevealing=-1;
 render();
 });
 overlay.appendChild(closeBtn);
 document.getElementById("root").appendChild(overlay);
 return;
 }

 // Header
 var hdr=div("dhdr");hdr.style.background=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:getCatById(S.cat).bg;
 var dhdrTop=div("dhdr-top");hdr.appendChild(dhdrTop);
 dhdrTop.appendChild(btn("card-nav-btn back",T("backBtn"),goBackToGames));
 dhdrTop.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 hdr.appendChild(div("dtitle","MR. WHITE"));

 var card=div("dcard");card.appendChild(hdr);
 wrap.appendChild(card);

 // Players section
 var body=div("dbody");card.appendChild(body);
 body.appendChild(div("mw-sub",T("mrWhitePass")));

 var playerList=div("mw-players");
 for(var i=0;i<S.mwNumPlayers;i++){
 (function(idx){
 var seen=S.mwSeen.indexOf(idx)>=0;
 var pb=div("mw-player-btn"+(seen?" seen":""));
 pb.innerHTML=seen?"<span>"+T("mrWhitePlayer")+(idx+1)+T("ui_visto"):"<span>"+T("mrWhitePlayer")+(idx+1)+"</span><span>"+T("mrWhiteLookWord")+"</span>";
 if(!seen){pb.onclick=function(){S.mwRevealing=idx;render();};}
 playerList.appendChild(pb);
 })(i);
 }
 body.appendChild(playerList);

 // All seen - start game
 if(S.mwSeen.length===S.mwNumPlayers){
 var startBox=div("");startBox.style.cssText="text-align:center;margin-top:8px;";
 startBox.appendChild(div("mw-sub",T("mrWhiteStart")));
 startBox.appendChild(btn("ebtn",T("starterStart"),function(){S.screen="game";render();}));
 body.appendChild(startBox);
 }

 document.getElementById("root").appendChild(wrap);
}


function startIntesa(level){
 var words=INTESA_WORDS[level].slice();
 // Shuffle
 for(var i=words.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=words[i];words[i]=words[j];words[j]=t;}
 S.intesaLevel=level;
 S.intesaWords=words;
 S.intesaIdx=0;
 S.intesaScore=0;
 S.intesaTimer=60;
 S.intesaRunning=false;
 S.screen="intesa";
 render();
}

var intesaInterval=null;
function startIntesaTimer(){
 S.intesaRunning=true;
 intesaInterval=setInterval(function(){
 S.intesaTimer--;
 if(S.intesaTimer<=0){
 clearInterval(intesaInterval);
 S.intesaRunning=false;
 S.screen="intesa_end";
 render();
 return;
 }
 // Update timer display without full re-render
 var tf=document.getElementById("intesaTimerFill");
 var tn=document.getElementById("intesaTimerNum");
 if(tf){tf.style.width=(S.intesaTimer/60*100)+"%"; if(S.intesaTimer<=10)tf.classList.add("danger"); else tf.classList.remove("danger");}
 if(tn){tn.textContent=S.intesaTimer; if(S.intesaTimer<=10)tn.classList.add("danger"); else tn.classList.remove("danger");}
 },1000);
}

function renderIntesaSetup(){
 clr();
 if(intesaInterval){clearInterval(intesaInterval);}
 var cat=getCatById(S.cat);
 var wrap=div("intesa-wrap intesa-setup");

 // Header card
 var hdr=div("dhdr");hdr.style.background=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var dhdrTop=div("dhdr-top");hdr.appendChild(dhdrTop);
 dhdrTop.appendChild(btn("card-nav-btn back",T("backBtn"),goBackToGames));
 dhdrTop.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 hdr.appendChild(div("dtitle",T("intesaTitle")));
 var card=div("dcard");card.appendChild(hdr);
 var body=div("dbody");card.appendChild(body);
 body.appendChild(div("rlabel",T("intesaDifficulty")));
 body.appendChild(div("rtext",T("intesaDesc")));

 var grid=div("intesa-level-grid");
 var levels=[
 {id:"facile",name:T("ui_facile"),desc:T("ui_parole_di_tutti_i_giorni"),stars:"",cls:"il-facile"},
 {id:"media",name:T("ui_media"),desc:T("intesaHard"),stars:"",cls:"il-media"},
 {id:"difficile",name:T("ui_difficile"),desc:T("ui_solo_per_coraggiosi"),stars:"",cls:"il-difficile"}
 ];
 for(var i=0;i<levels.length;i++){
 (function(lv){
 var lcard=div("intesa-level-card "+lv.cls);
 lcard.appendChild(el("span","",lv.stars));
 lcard.appendChild(el("span","il-name",lv.name));
 lcard.appendChild(el("span","il-desc",lv.desc));
 lcard.onclick=function(){startIntesa(lv.id);};
 grid.appendChild(lcard);
 })(levels[i]);
 }
 body.appendChild(grid);
 wrap.appendChild(card);
 document.getElementById("root").appendChild(wrap);
}

function renderIntesa(){
 clr();
 addBackArrow(goBackToGames);
 if(intesaInterval){clearInterval(intesaInterval);}
 var cat=getCatById(S.cat);
 var wrap=div("intesa-wrap");

 // Score + timer header
 var scoreboard=div("intesa-score-board");
 var rb=div("intesa-round-badge");rb.textContent=T("intesaLevel")+S.intesaLevel.toUpperCase();scoreboard.appendChild(rb);
 var sn=div("intesa-score-num");sn.textContent=S.intesaScore;scoreboard.appendChild(sn);
 var sl=div("intesa-score-label");sl.textContent=T("intesaResult");scoreboard.appendChild(sl);
 wrap.appendChild(scoreboard);

 // Word card
 var wcard=div("intesa-game-card");

 // Timer bar
 var tbar=div("intesa-timer-bar");
 var tfill=div("intesa-timer-fill"+(S.intesaTimer<=10?" danger":""));
 tfill.id="intesaTimerFill";
 tfill.style.width=(S.intesaTimer/60*100)+"%";
 tbar.appendChild(tfill);
 wcard.appendChild(tbar);

 // Word area
 var warea=div("intesa-word-area");
 var timerNum=div("intesa-timer-num"+(S.intesaTimer<=10?" danger":""));
 timerNum.id="intesaTimerNum";
 timerNum.textContent=S.intesaTimer;
 warea.appendChild(timerNum);

 var currentWord=S.intesaWords[S.intesaIdx]||"—";
 var wword=div("intesa-word");wword.textContent=currentWord;warea.appendChild(wword);
 var wnum=div("intesa-word-num");wnum.textContent=T("intesaWord")+(S.intesaIdx+1)+T("ui_di")+S.intesaWords.length;warea.appendChild(wnum);
 wcard.appendChild(warea);

 // Controls
 var ctrl=div("intesa-controls");
 if(!S.intesaRunning){
 var startBtn=btn("ebtn",T("intesaStart"),function(){startIntesaTimer();render();});
 ctrl.appendChild(startBtn);
 } else {
 var okBtn=btn("ebtn",T("intesaGuessed"),function(){
 S.intesaScore++;
 S.intesaIdx++;
 if(S.intesaIdx>=S.intesaWords.length){
 clearInterval(intesaInterval);
 S.intesaRunning=false;
 S.screen="intesa_end";
 render();
 return;
 }
 var ww=document.getElementById("intesaWord");
 if(ww)ww.textContent=S.intesaWords[S.intesaIdx];
 else render();
 var wn=document.getElementById("intesaWordNum");
 if(wn)wn.textContent=T("intesaWord")+(S.intesaIdx+1)+T("ui_di")+S.intesaWords.length;
 var snn=document.getElementById("intesaScoreNum");
 if(snn)snn.textContent=S.intesaScore;
 });
 var skipBtn=btn("ebtn out",T("ui_passa"),function(){
 S.intesaIdx++;
 if(S.intesaIdx>=S.intesaWords.length){
 clearInterval(intesaInterval);
 S.intesaRunning=false;
 S.screen="intesa_end";
 render();
 return;
 }
 var ww=document.getElementById("intesaWord");
 if(ww)ww.textContent=S.intesaWords[S.intesaIdx];
 else render();
 });
 ctrl.appendChild(okBtn);
 ctrl.appendChild(skipBtn);
 }
 wcard.appendChild(ctrl);
 wrap.appendChild(wcard);

 // Give IDs for live update
 wword.id="intesaWord";
 wnum.id="intesaWordNum";
 sn.id="intesaScoreNum";

 // Start timer immediately if already running
 if(S.intesaRunning){startIntesaTimer();}

 document.getElementById("root").appendChild(wrap);
}

function renderIntesaEnd(){
 clr();
 addBackArrow(goBackToGames);
 if(intesaInterval){clearInterval(intesaInterval);}
 var wrap=div("intesa-wrap");wrap.style.textAlign="center";
  var title=div("end-title",T("ui_tempo"));wrap.appendChild(title);
 var sub=div("end-sub",T("intesaGuessedN")+S.intesaScore+T("ui_parole_su")+S.intesaIdx+T("intesaLevelOf")+S.intesaLevel.toUpperCase());wrap.appendChild(sub);

 // Score
 var sb=div("intesa-score-board");sb.style.maxWidth="400px";sb.style.margin="24px auto";
 var sn=div("intesa-score-num");sn.textContent=S.intesaScore;sb.appendChild(sn);
 var sl=div("intesa-score-label");sl.textContent=T("intesaResult");sb.appendChild(sl);
 wrap.appendChild(sb);

 var btns=div("endbtns");
 btns.appendChild(btn("ebtn",T("qvPlayAgain"),function(){startIntesa(S.intesaLevel);}));
 btns.appendChild(btn("ebtn out",T("changeLevel"),function(){S.screen="intesa_setup";render();}));
 btns.appendChild(btn("ebtn out",T("exitBtn"),goHome));
 wrap.appendChild(btns);
 document.getElementById("root").appendChild(wrap);
}


var alfaInterval=null;
var LETTERE="ABCDEFGHILMNOPRSTV".split("");

function getRandomLetter(exclude){
 var pool=LETTERE.filter(function(l){return l!==exclude;});
 return pool[Math.floor(Math.random()*pool.length)];
}

function startAlfa(numPlayers,names){
 S.alfaNumPlayers=numPlayers;
 S.alfaScores={};
 var playerNames=names||S.alfaPlayerNames;
 if(playerNames&&playerNames.length){
 playerNames.forEach(function(n){S.alfaScores[n]=0;});
 } else {
 for(var i=1;i<=numPlayers;i++) S.alfaScores["G"+i]=0;
 }
 S.alfaLetter=getRandomLetter("");
 S.alfaTimer=30;
 S.alfaRunning=false;
 S.screen="alfabeto";
 render();
}

function newAlfaRound(){
 S.alfaLetter=getRandomLetter(S.alfaLetter);
 S.alfaTimer=30;
 S.alfaRunning=false;
 if(alfaInterval){clearInterval(alfaInterval);}
 render();
}

function startAlfaTimer(){
 S.alfaRunning=true;
 alfaInterval=setInterval(function(){
 S.alfaTimer--;
 var tf=document.getElementById("alfaTimerFill");
 var tn=document.getElementById("alfaTimerNum");
 if(tf){tf.style.width=(S.alfaTimer/30*100)+"%";if(S.alfaTimer<=10)tf.classList.add("danger");else tf.classList.remove("danger");}
 if(tn){tn.textContent=S.alfaTimer;if(S.alfaTimer<=10)tn.classList.add("danger");else tn.classList.remove("danger");}
 if(S.alfaTimer<=0){
 clearInterval(alfaInterval);
 S.alfaRunning=false;
 // Nobody won this round - new letter
 render();
 }
 },1000);
}

function renderAlfaSetup(){
 clr();
 if(alfaInterval){clearInterval(alfaInterval);}
 var cat=getCatById(S.cat);
 var wrap=div("intesa-wrap intesa-setup");

 var hdr=div("dhdr");hdr.style.background=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var dhdrTop=div("dhdr-top");hdr.appendChild(dhdrTop);
 dhdrTop.appendChild(btn("card-nav-btn back",T("backBtn"),goBackToGames));
 dhdrTop.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 hdr.appendChild(div("dtitle",T("ui_caccia_all_oggetto")));
 var card=div("dcard");card.appendChild(hdr);
 var body=div("dbody");card.appendChild(body);
 body.appendChild(div("rlabel",T("howMany")));
 body.appendChild(div("rtext",T("dadoInsert")));

 var inputs=[];
 var namesGrid=div("player-names-grid");

 function buildAlfaNamesGrid(n){
 namesGrid.innerHTML=''; inputs=[];
 for(var i=0;i<n;i++){
 (function(idx){
 var row=div("player-name-row");
 var lbl=div("player-name-label");lbl.textContent=T("qvPlayer")+(idx+1);row.appendChild(lbl);
 var inp=document.createElement("input");
 inp.type="text";inp.className="player-name-input";
 inp.placeholder=T("playerNamePH")+(idx+1);inp.maxLength=20;
 if(S.alfaPlayerNames&&S.alfaPlayerNames[idx]) inp.value=S.alfaPlayerNames[idx];
 row.appendChild(inp);inputs.push(inp);
 namesGrid.appendChild(row);
 })(i);
 }
 }

 var startWrap=div("");startWrap.style.cssText="text-align:center;margin-top:20px;";
 var startB=btn("ebtn",T("qvStart"),function(){
 var names=inputs.map(function(inp,i){return inp.value.trim()||(T("qvPlayer")+(i+1));});
 S.alfaPlayerNames=names;
 startAlfa(S.alfaNumPlayers,names);
 });
 startWrap.appendChild(startB);

 body.appendChild(makeStepperWidget(S.alfaNumPlayers||2, 2, 20, function(n){
 S.alfaNumPlayers=n;
 buildAlfaNamesGrid(n);
 }));
 body.appendChild(namesGrid);
 body.appendChild(startWrap);
 buildAlfaNamesGrid(S.alfaNumPlayers||2);

 wrap.appendChild(card);
 document.getElementById("root").appendChild(wrap);
}

function renderAlfabeto(){
 clr();
 addBackArrow(goBackToGames);
 if(alfaInterval){clearInterval(alfaInterval);}
 var wrap=div("alfa-wrap");

 // Check if someone won
 var winner=null;
 var scores=S.alfaScores;
 for(var p in scores){
 if(scores[p]>=S.alfaTarget){winner=p;break;}
 }

 if(winner){
 // Win screen
  var wt=div("end-title");wt.textContent=winner+" "+T("qvWon");wrap.appendChild(wt);
 wrap.appendChild(div("end-sub",T("firstTo")+S.alfaTarget+T("pointsHunter")));
 var btns=div("endbtns");
 btns.appendChild(btn("ebtn",T("qvPlayAgain"),function(){startAlfa(S.alfaNumPlayers);}));
 btns.appendChild(btn("ebtn out",T("exitBtn"),goHome));
 wrap.appendChild(btns);
 document.getElementById("root").appendChild(wrap);
 return;
 }

 // Scores
 var scoresDiv=div("alfa-scores");
 var players=Object.keys(scores).sort();
 var maxScore=Math.max.apply(null,players.map(function(p){return scores[p];}));
 players.forEach(function(p){
 var chip=div("alfa-score-chip"+(scores[p]===maxScore&&maxScore>0?" leader":""));
 chip.textContent=p+": "+scores[p];
 scoresDiv.appendChild(chip);
 });
 wrap.appendChild(scoresDiv);

 // Big letter
 var letterDiv=div("alfa-letter");letterDiv.textContent=S.alfaLetter;wrap.appendChild(letterDiv);
 wrap.appendChild(div("alfa-hint",T("alfabetoHint")));

 // Timer
 var timerNum=div("alfa-timer"+(S.alfaTimer<=10?" danger":""));
 timerNum.id="alfaTimerNum";timerNum.textContent=S.alfaTimer;wrap.appendChild(timerNum);
 var tbar=div("alfa-timer-bar");
 var tfill=div("alfa-timer-fill"+(S.alfaTimer<=10?" danger":""));
 tfill.id="alfaTimerFill";tfill.style.width=(S.alfaTimer/30*100)+"%";
 tbar.appendChild(tfill);wrap.appendChild(tbar);

 // Buttons
 var btns=div("endbtns");
 if(!S.alfaRunning){
 btns.appendChild(btn("ebtn",T("ui_via"),function(){startAlfaTimer();}));
 } else {
 // Point buttons for each player
 players.forEach(function(p){
 (function(player){
 var pb=btn("ebtn"," "+player+T("ui_ha_trovato"),function(){
 if(alfaInterval){clearInterval(alfaInterval);}
 S.alfaRunning=false;
 S.alfaScores[player]++;
 newAlfaRound();
 });
 btns.appendChild(pb);
 })(p);
 });
 btns.appendChild(btn("ebtn out"," "+T("ncNobody"),function(){
 if(alfaInterval){clearInterval(alfaInterval);}
 S.alfaRunning=false;
 newAlfaRound();
 }));
 }
 wrap.appendChild(btns);

 if(S.alfaRunning){startAlfaTimer();}
 document.getElementById("root").appendChild(wrap);
}


function startNomeCognome(numPlayers,names){
 S.ncNumPlayers=numPlayers;
 S.ncScores={};
 var playerNames=names||S.ncPlayerNames;
 if(playerNames&&playerNames.length){
 playerNames.forEach(function(n){S.ncScores[n]=0;});
 } else {
 for(var i=1;i<=numPlayers;i++) S.ncScores["G"+i]=0;
 }
 S.ncLetterN=getRandomLetter("");
 S.ncLetterC=getRandomLetter(S.ncLetterN);
 S.screen="nomecognome";
 render();
}

function newNcRound(){
 var oldN=S.ncLetterN;
 S.ncLetterN=getRandomLetter(S.ncLetterC);
 S.ncLetterC=getRandomLetter(S.ncLetterN);
 render();
}

function renderNcSetup(){
 clr();
 var cat=getCatById(S.cat);
 var wrap=div("intesa-wrap intesa-setup");
 var hdr=div("dhdr");hdr.style.background=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var dhdrTop=div("dhdr-top");hdr.appendChild(dhdrTop);
 dhdrTop.appendChild(btn("card-nav-btn back",T("backBtn"),goBackToGames));
 dhdrTop.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 var gObjNcCur=curGame()||{};hdr.appendChild(div("dtitle",gObjNcCur.name||T("ncTitle")));
 var card=div("dcard");card.appendChild(hdr);
 var body=div("dbody");card.appendChild(body);
 body.appendChild(div("rlabel",T("howMany")));
 body.appendChild(div("rtext",T("dadoInsert")));

 var inputs=[];
 var namesGrid=div("player-names-grid");

 function buildNcNamesGrid(n){
 namesGrid.innerHTML=''; inputs=[];
 for(var i=0;i<n;i++){
 (function(idx){
 var row=div("player-name-row");
 var lbl=div("player-name-label");lbl.textContent=T("qvPlayer")+(idx+1);row.appendChild(lbl);
 var inp=document.createElement("input");
 inp.type="text";inp.className="player-name-input";
 inp.placeholder=T("playerNamePH")+(idx+1);inp.maxLength=20;
 if(S.ncPlayerNames&&S.ncPlayerNames[idx]) inp.value=S.ncPlayerNames[idx];
 row.appendChild(inp);inputs.push(inp);
 namesGrid.appendChild(row);
 })(i);
 }
 }

 var startWrap=div("");startWrap.style.cssText="text-align:center;margin-top:20px;";
 var startB=btn("ebtn",T("qvStart"),function(){
 var names=inputs.map(function(inp,i){return inp.value.trim()||(T("qvPlayer")+(i+1));});
 S.ncPlayerNames=names;
 S.ncScores={};
 names.forEach(function(n){S.ncScores[n]=0;});
 S.ncLetterN=getRandomLetter("");
 S.ncLetterC=getRandomLetter(S.ncLetterN);
 S.screen="nomecognome";
 render();
 });
 startWrap.appendChild(startB);

 body.appendChild(makeStepperWidget(S.ncNumPlayers||2, 2, 20, function(n){
 S.ncNumPlayers=n;
 buildNcNamesGrid(n);
 }));
 body.appendChild(namesGrid);
 body.appendChild(startWrap);
 buildNcNamesGrid(S.ncNumPlayers||2);

 wrap.appendChild(card);
 document.getElementById("root").appendChild(wrap);
}

function renderNomeCognome(){
 clr();
 addBackArrow(goBackToGames);
 var wrap=div("nc-wrap");

 // Check winner
 var players=Object.keys(S.ncScores).sort();
 var winner=null;
 for(var p in S.ncScores){if(S.ncScores[p]>=S.ncTarget){winner=p;break;}}

 if(winner){
  var wt=div("end-title");wt.textContent=winner+" "+T("qvWon");wrap.appendChild(wt);
 wrap.appendChild(div("end-sub",T("firstTo")+S.ncTarget+T("pointsWin")));
 var btns2=div("endbtns");
 btns2.appendChild(btn("ebtn",T("qvPlayAgain"),function(){startNomeCognome(S.ncNumPlayers);}));
 btns2.appendChild(btn("ebtn out",T("exitBtn"),goHome));
 wrap.appendChild(btns2);
 document.getElementById("root").appendChild(wrap);
 return;
 }

 // Scores
 var maxScore=Math.max.apply(null,players.map(function(p){return S.ncScores[p];}));
 var scoresDiv=div("nc-scores");
 players.forEach(function(p){
 var chip=div("nc-score-chip"+(S.ncScores[p]===maxScore&&maxScore>0?" leader":""));
 chip.textContent=p+": "+S.ncScores[p];
 scoresDiv.appendChild(chip);
 });
 wrap.appendChild(scoresDiv);

 // Two big letters
 var lettersDiv=div("nc-letters");
 var boxN=div("nc-letter-box");
 var labelN=div("ncl-label");labelN.textContent=T("ncLabelName");boxN.appendChild(labelN);
 var charN=div("ncl-char");charN.textContent=S.ncLetterN;boxN.appendChild(charN);
 lettersDiv.appendChild(boxN);
 var boxC=div("nc-letter-box");
 var labelC=div("ncl-label");labelC.textContent=T("ncLabelSurname");boxC.appendChild(labelC);
 var charC=div("ncl-char");charC.textContent=S.ncLetterC;boxC.appendChild(charC);
 lettersDiv.appendChild(boxC);
 wrap.appendChild(lettersDiv);

 wrap.appendChild(div("nc-hint",T("nomeCognomeDesc")));

 // Point buttons
 var btns=div("endbtns");
 btns.style.flexWrap="wrap";
 players.forEach(function(p){
 (function(player){
 var pb=btn("ebtn"," "+player+" "+T("ncSaidFirst"),function(){
 S.ncScores[player]++;
 newNcRound();
 });
 btns.appendChild(pb);
 })(p);
 });
 btns.appendChild(btn("ebtn out"," "+T("ncNobody"),function(){newNcRound();}));
 wrap.appendChild(btns);

 document.getElementById("root").appendChild(wrap);
}


var DADO_PIPS={1:[4],2:[2,6],3:[2,4,6],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function dadoFill(face,n){face.innerHTML="";var on=DADO_PIPS[n]||[];for(var k=0;k<9;k++){var c=document.createElement("span");if(on.indexOf(k)>=0)c.className="dado-pip";face.appendChild(c);}face.setAttribute("aria-label",String(n));}

function startDado(names){
 S.dadoPlayerNames=names;
 S.dadoScores={};
 names.forEach(function(n){S.dadoScores[n]=0;});
 S.dadoCurrentIdx=0;
 S.dadoValue=0;
 S.dadoRolled=false;
 S.screen="dado";
 render();
}

function rollDado(){
 S.dadoValue=Math.floor(Math.random()*6)+1;
 S.dadoRolled=true;
 render();
}

function dadoAction(action,targetName){
 // Will sync after render
 var currentName=S.dadoPlayerNames[S.dadoCurrentIdx];
 if(action==="add"){
 var newScore=S.dadoScores[currentName]+S.dadoValue;
 if(newScore===S.dadoTarget){
 // Exact 15 — win!
 S.dadoScores[currentName]=newScore;
 S.screen="dado_win";render();return;
 } else if(newScore>S.dadoTarget){
 // Bust — go back to 0
 S.dadoScores[currentName]=0;
 S.dadoBust=currentName;
 } else {
 S.dadoScores[currentName]=newScore;
 S.dadoBust=null;
 }
 } else if(action==="sub"){
 S.dadoScores[targetName]=Math.max(0,S.dadoScores[targetName]-S.dadoValue);
 S.dadoBust=null;
 }
 // Next player
 S.dadoCurrentIdx=(S.dadoCurrentIdx+1)%S.dadoPlayerNames.length;
 S.dadoValue=0;
 S.dadoRolled=false;
 render();
}

function renderDadoSetup(){
 clr();
 var cat=getCatById(S.cat);
 var wrap=div("intesa-wrap intesa-setup");
 var hdr=div("dhdr");hdr.style.background=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var dhdrTop=div("dhdr-top");hdr.appendChild(dhdrTop);
 dhdrTop.appendChild(btn("card-nav-btn back",T("backBtn"),goBackToGames));
 dhdrTop.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 var gObjCur=curGame()||{};hdr.appendChild(div("dtitle",gObjCur.name||T("ui_fifteen")));
 var card=div("dcard");card.appendChild(hdr);
 var body=div("dbody");card.appendChild(body);
 var gObjR=curGame()||{};
 if(gObjR.rules){var rulesDiv=div("rtext");rulesDiv.style.cssText="margin-bottom:16px;";rulesDiv.textContent=gObjR.rules;body.appendChild(rulesDiv);}
 body.appendChild(div("rlabel",T("howMany")));
 body.appendChild(div("rtext",T("dadoInsert15")));

 var inputs=[];
 var namesGrid=div("player-names-grid");

 function buildDadoNamesGrid(n){
 namesGrid.innerHTML=''; inputs=[];
 for(var i=0;i<n;i++){
 (function(idx){
 var row=div("player-name-row");
 var lbl=div("player-name-label");lbl.textContent=T("qvPlayer")+(idx+1);row.appendChild(lbl);
 var inp=document.createElement("input");
 inp.type="text";inp.className="player-name-input";
 inp.placeholder=T("playerNamePH")+(idx+1);inp.maxLength=16;
 if(S.dadoPlayerNames&&S.dadoPlayerNames[idx])inp.value=S.dadoPlayerNames[idx];
 row.appendChild(inp);inputs.push(inp);
 namesGrid.appendChild(row);
 })(i);
 }
 }

 var startWrap=div("");startWrap.style.cssText="text-align:center;margin-top:20px;";
 startWrap.appendChild(btn("ebtn",T("qvStart"),function(){
 var names=inputs.map(function(inp,i){return inp.value.trim()||(T("qvPlayer")+(i+1));});
 startDado(names);
 }));

 body.appendChild(makeStepperWidget(S.dadoNumPlayers||2, 2, 20, function(n){
 S.dadoNumPlayers=n;
 buildDadoNamesGrid(n);
 }));
 body.appendChild(namesGrid);
 body.appendChild(startWrap);
 buildDadoNamesGrid(S.dadoNumPlayers||2);
 wrap.appendChild(card);
 document.getElementById("root").appendChild(wrap);
}

function renderDado(){
 clr();
 addBackArrow(goBackToGames);
 var wrap=div("dado-wrap");
 var currentName=S.dadoPlayerNames[S.dadoCurrentIdx];

 // Turn indicator
 var turnDiv=div("dado-turn");turnDiv.textContent=T("codiceTurn")+currentName;wrap.appendChild(turnDiv);

 // Dice
 var dadoBox=div("dado-box"+(S.dadoRolled?" rolled":""));
 var face=div("dado-face"+(S.dadoValue>0?"":" idle"));
 dadoFill(face,S.dadoValue>0?S.dadoValue:5);
 dadoBox.appendChild(face);
 if(!S.dadoRolled){
 var _rolling=false;
 dadoBox.onclick=function(){
 if(_rolling)return;_rolling=true;
 face.classList.remove("idle");dadoBox.classList.add("rolling");
 var n=0,last=0;
 var spin=setInterval(function(){var v;do{v=Math.floor(Math.random()*6)+1;}while(v===last);last=v;dadoFill(face,v);if(++n>=7){clearInterval(spin);if(S.screen==="dado")rollDado();}},85);
 };
 }
 wrap.appendChild(dadoBox);

 if(!S.dadoRolled){
 wrap.appendChild(div("dado-hint",T("dadoRoll")));
 } else {
 var hintEl=div("dado-value");hintEl.textContent=T("dadoGot")+S.dadoValue;wrap.appendChild(hintEl);
 wrap.appendChild(div("dado-hint",T("dadoWhat")));
 }

 // Players scores
 var playersDiv=div("dado-players");
 S.dadoPlayerNames.forEach(function(name,i){
 var isBust=S.dadoBust===name;
 var row=div("dado-player-row"+(i===S.dadoCurrentIdx?" current":"")+(S.dadoScores[name]>=S.dadoTarget?" winner":""));
 if(isBust) row.style.borderColor="var(--red)";
 var nameEl=div("dado-player-name");
 nameEl.textContent=name+(isBust?" · "+T("dadoBust"):"");
 row.appendChild(nameEl);
 var scoreEl=div("dado-player-score"+(S.dadoScores[name]>=12?" close":"")+(S.dadoScores[name]>=S.dadoTarget?" win":""));
 scoreEl.textContent=S.dadoScores[name]+"/15";row.appendChild(scoreEl);
 playersDiv.appendChild(row);
 });
 wrap.appendChild(playersDiv);

 // Actions (only show after rolling)
 if(S.dadoRolled){
 var actDiv=div("dado-actions");

 // Add to self - show preview
 var myScore=S.dadoScores[currentName];
 var myNew=myScore+S.dadoValue;
 var addLabel;
 if(myNew===S.dadoTarget){addLabel="+"+S.dadoValue+" "+T("dadoAddMe")+" · "+T("dadoWinMe");}
 else if(myNew>S.dadoTarget){addLabel="+"+S.dadoValue+" "+T("dadoAddMe")+" · "+T("dadoBustMe");}
 else{addLabel="+"+S.dadoValue+" "+T("dadoAddMe")+" ("+myNew+"/15)";}
 var addBtn=btn("ebtn",addLabel,function(){dadoAction("add",null);});
 if(myNew===S.dadoTarget) addBtn.style.background="var(--green)";
 if(myNew>S.dadoTarget) addBtn.style.background="var(--red)";
 actDiv.appendChild(addBtn);

 // Subtract from others - show preview
 S.dadoPlayerNames.forEach(function(name,i){
 if(i!==S.dadoCurrentIdx){
 (function(targetName){
 var theirScore=S.dadoScores[targetName];
 var theirNew=Math.max(0,theirScore-S.dadoValue);
 var subBtn=btn("ebtn out","\u2212"+S.dadoValue+" "+T("dadoSubTo")+targetName+" ("+theirNew+"/15)",function(){dadoAction("sub",targetName);});
 actDiv.appendChild(subBtn);
 })(name);
 }
 });
 wrap.appendChild(actDiv);
 }

 document.getElementById("root").appendChild(wrap);
}

function renderDadoWin(){
 clr();
 addBackArrow(goBackToGames);
 // Find winner
 var winner="";
 S.dadoPlayerNames.forEach(function(n){if(S.dadoScores[n]>=S.dadoTarget)winner=n;});
 var wrap=div("dado-wrap");
  var wt=div("end-title");wt.textContent=winner+" "+T("qvWon");wrap.appendChild(wt);
 wrap.appendChild(div("end-sub",T("dadoFirst15")));
 // Final scores
 var pd=div("dado-players");
 S.dadoPlayerNames.forEach(function(name){
 var row=div("dado-player-row"+(name===winner?" winner":""));
 var ne=div("dado-player-name");ne.textContent=name;row.appendChild(ne);
 var se=div("dado-player-score");se.textContent=S.dadoScores[name];row.appendChild(se);
 pd.appendChild(row);
 });
 wrap.appendChild(pd);
 var btns=div("endbtns");
 btns.appendChild(btn("ebtn",T("qvPlayAgain"),function(){startDado(S.dadoPlayerNames);}));
 btns.appendChild(btn("ebtn out",T("exitBtn"),goHome));
 wrap.appendChild(btns);
 document.getElementById("root").appendChild(wrap);
}


function renderCodiceSetup(){
 clr();
 var cat=getCatById(S.cat);
 var wrap=div("codice-wrap");
 var hdr=div("dhdr");hdr.style.background=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var dhdrTop=div("dhdr-top");hdr.appendChild(dhdrTop);
 dhdrTop.appendChild(btn("card-nav-btn back",T("backBtn"),goBackToGames));
 dhdrTop.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 hdr.appendChild(div("dtitle",T("codiceTitle")));
 var card=div("dcard");card.appendChild(hdr);
 var body=div("dbody");card.appendChild(body);
 body.appendChild(div("rlabel",T("howMany")));
 body.appendChild(div("rtext",T("codiceDesc")));

 if(!S.codiceNumPlayers) S.codiceNumPlayers=2;

 var nameInputs=[];
 var grid=div("codice-setup-grid");

 function buildCodiceGrid(n){
 grid.innerHTML=''; nameInputs=[];
 for(var i=0;i<n;i++){
 (function(idx){
 var pcard=div("codice-player-setup");
 var h3=document.createElement("h3");
 h3.textContent=T("qvPlayer")+(idx+1);
 pcard.appendChild(h3);
 var nameInp=document.createElement("input");
 nameInp.type="text";nameInp.className="player-name-input";
 nameInp.placeholder=T("playerNamePH")+(idx+1);nameInp.maxLength=16;
 nameInp.style.marginBottom="12px";nameInp.style.width="100%";
 if(S.codicePlayerNames&&S.codicePlayerNames[idx]) nameInp.value=S.codicePlayerNames[idx];
 pcard.appendChild(nameInp);
 nameInputs.push(nameInp);
 grid.appendChild(pcard);
 })(i);
 }
 }

 var startWrap=div("");startWrap.style.cssText="text-align:center;margin-top:20px;";
 startWrap.appendChild(btn("ebtn",T("qvStart"),function(){
 var names=nameInputs.map(function(inp,i){return inp.value.trim()||(T("qvPlayer")+(i+1));});
 var seen={};names=names.map(function(n){var b=n,c=2;while(seen[n]){n=b+" "+c++;}seen[n]=1;return n;});
 S.codicePlayerNames=names;
 startCodice(names);
 }));
 body.appendChild(makeStepperWidget(S.codiceNumPlayers||2, 2, 20, function(n){
 S.codiceNumPlayers=n;
 buildCodiceGrid(n);
 }));
 body.appendChild(grid);
 body.appendChild(startWrap);
 buildCodiceGrid(S.codiceNumPlayers||2);
 wrap.appendChild(card);
 document.getElementById("root").appendChild(wrap);
}

// ══════════════════════════════════════════
// INDOVINA IL CODICE — codici segreti salvati dall'app,
// tentativi con la sequenza completa e risposta automatica
// (verde = cifra giusta al posto giusto, giallo = cifra giusta al posto sbagliato)
// ══════════════════════════════════════════
function codiceScore(code,guess){
 var g=0,y=0,cc={},gc={};
 for(var k=0;k<4;k++){if(code[k]===guess[k])g++;else{cc[code[k]]=(cc[code[k]]||0)+1;gc[guess[k]]=(gc[guess[k]]||0)+1;}}
 Object.keys(gc).forEach(function(d){if(cc[d])y+=Math.min(cc[d],gc[d]);});
 return {g:g,y:y};
}
function startCodice(players){
 S.codicePlayers=players;
 S.codiceCodes={};
 S.codiceHist={};
 players.forEach(function(p){S.codiceHist[p]=[];});
 S.codiceSecretIdx=0;S.codiceSecretShown=false;S.codiceEntry=[];
 S.codiceCurrentIdx=0;S.codiceTarget=null;S.codiceLast=null;
 S.screen="codice_secret";
 render();
}
// Campo di 4 cifre che usa la tastiera numerica del telefono (niente freccette)
function codiceOtp(onChange){
 var box=div("codice-otp");
 var inp=document.createElement("input");
 inp.type="text";inp.setAttribute("inputmode","numeric");inp.setAttribute("pattern","[0-9]*");
 inp.setAttribute("autocomplete","one-time-code");inp.maxLength=4;inp.className="codice-otp-input";
 inp.setAttribute("aria-label","Codice");
 var slots=[];var row=div("codice-slots big");
 for(var k=0;k<4;k++){var sl=div("codice-slot");slots.push(sl);row.appendChild(sl);}
 function paint(){
  var v=inp.value;
  for(var k=0;k<4;k++){slots[k].textContent=v[k]||"";slots[k].className="codice-slot"+(v[k]?" filled":"")+(document.activeElement===inp&&k===Math.min(v.length,3)?" active":"");}
  onChange(v.split(""));
 }
 inp.oninput=function(){var c=inp.value.replace(/[^0-9]/g,"").slice(0,4);if(c!==inp.value)inp.value=c;paint();};
 inp.onfocus=paint;inp.onblur=paint;
 box.onclick=function(){inp.focus();};
 box.appendChild(row);box.appendChild(inp);
 box._input=inp;box._paint=paint;
 setTimeout(function(){try{inp.focus({preventScroll:true});}catch(e){}paint();},60);
 return box;
}
function codiceSlots(arr,cls){
 var row=div("codice-slots"+(cls?" "+cls:""));
 for(var k=0;k<4;k++){var v=arr[k];var sl=div("codice-slot"+(v!==undefined?" filled":""));sl.textContent=v===undefined?"":v;row.appendChild(sl);}
 return row;
}
function renderCodiceSecret(){
 clr();
 addBackArrow(goBackToGames);
 var wrap=div("codice-wrap");wrap.style.textAlign="center";
 var name=S.codicePlayers[S.codiceSecretIdx];
 if(!S.codiceSecretShown){
  wrap.appendChild(div("codice-step",(S.codiceSecretIdx+1)+" / "+S.codicePlayers.length));
  wrap.appendChild(div("codice-big",T("codicePassTo")+name));
  wrap.appendChild(div("codice-sub",T("codicePassSub")));
  wrap.appendChild(btn("codice-cta",T("codiceIAm")+name,function(){S.codiceSecretShown=true;S.codiceEntry=[];render();}));
  document.getElementById("root").appendChild(wrap);return;
 }
 wrap.appendChild(div("codice-big",name+T("codiceChooseSecret")));
 wrap.appendChild(div("codice-sub",T("codiceSecretSub")));
 var ok;S.codiceEntry=[];
 var otp=codiceOtp(function(arr){S.codiceEntry=arr;if(ok){ok.disabled=arr.length!==4;}});
 wrap.appendChild(otp);
 ok=btn("codice-cta",T("codiceSave"),function(){
  if(S.codiceEntry.length!==4)return;
  S.codiceCodes[name]=S.codiceEntry.slice();
  S.codiceEntry=[];S.codiceSecretShown=false;S.codiceSecretIdx++;
  if(S.codiceSecretIdx>=S.codicePlayers.length){S.codiceCurrentIdx=0;S.codiceTarget=null;S.codiceLast=null;S.screen="codice";}
  render();
 });
 ok.disabled=S.codiceEntry.length!==4;
 wrap.appendChild(ok);
 document.getElementById("root").appendChild(wrap);
}
function codiceOpponents(){var me=S.codicePlayers[S.codiceCurrentIdx];return S.codicePlayers.filter(function(p){return p!==me;});}
function codiceFeedback(g,y,big){
 var f=div("codice-fb"+(big?" big":""));
 for(var k=0;k<4;k++){f.appendChild(div("codice-peg"+(k<g?" g":k<g+y?" y":"")));}
 return f;
}
function codiceFeedbackText(g,y){
 return T("codiceFbG").replace("{n}",g)+" · "+T("codiceFbY").replace("{n}",y);
}
function renderCodice(){
 clr();
 addBackArrow(goBackToGames);
 var wrap=div("codice-wrap");
 var me=S.codicePlayers[S.codiceCurrentIdx];
 var opps=codiceOpponents();
 if(!S.codiceTarget||opps.indexOf(S.codiceTarget)<0)S.codiceTarget=opps[0];
 var target=S.codiceTarget;
 if(!S.codiceEntry)S.codiceEntry=[];
 // Esito dell'ultimo tentativo e passaggio del turno
 if(S.codiceLast){
  var L=S.codiceLast;
  wrap.style.textAlign="center";
  wrap.appendChild(div("codice-sub",L.by+T("codiceTriedOn")+L.target+":"));
  wrap.appendChild(codiceSlots(L.guess,"big"));
  wrap.appendChild(codiceFeedback(L.g,L.y,true));
  wrap.appendChild(div("codice-result",codiceFeedbackText(L.g,L.y)));
  var next=S.codicePlayers[(S.codiceCurrentIdx+1)%S.codicePlayers.length];
  wrap.appendChild(btn("codice-cta",T("codicePassTurn")+next,function(){
   S.codiceLast=null;S.codiceCurrentIdx=(S.codiceCurrentIdx+1)%S.codicePlayers.length;S.codiceTarget=null;S.codiceEntry=[];render();
  }));
  document.getElementById("root").appendChild(wrap);return;
 }
 var th=div("codice-head");th.appendChild(div("codice-eyebrow",T("codiceTurn")+me));th.appendChild(div("codice-big",T("codiceGuessShort")+target));wrap.appendChild(th);
 if(opps.length>1){
  var tabs=div("codice-tabs");
  opps.forEach(function(p){tabs.appendChild(btn("codice-tab"+(p===target?" on":""),p,function(){S.codiceTarget=p;S.codiceEntry=[];render();}));});
  wrap.appendChild(tabs);
 }
 // Storico dei tentativi su questo avversario
 var hist=S.codiceHist[target]||[];
 if(hist.length){
  wrap.appendChild(div("codice-section",T("codiceTries")));
  var hd=div("codice-hist");
  hist.forEach(function(h){
   var r=div("codice-hist-row");
   r.appendChild(div("codice-hist-by",h.by));
   r.appendChild(div("codice-hist-guess",h.guess.join(" ")));
   r.appendChild(codiceFeedback(h.g,h.y,false));
   hd.appendChild(r);
  });
  wrap.appendChild(hd);
 } else {
  wrap.appendChild(div("codice-sub",T("codiceNoTries")));
 }
 var box=div("");box.style.textAlign="center";
 var tryB;S.codiceEntry=[];
 box.appendChild(codiceOtp(function(arr){S.codiceEntry=arr;if(tryB)tryB.disabled=arr.length!==4;}));
 tryB=btn("codice-cta",T("codiceTry"),function(){
  var guess=S.codiceEntry.slice();if(guess.length!==4)return;
  var sc=codiceScore(S.codiceCodes[target],guess);
  S.codiceHist[target].push({by:me,guess:guess,g:sc.g,y:sc.y});
  S.codiceEntry=[];
  if(sc.g===4){S.codiceWinner=me;S.codiceWinnerTarget=target;S.screen="codice_win";render();return;}
  S.codiceLast={by:me,target:target,guess:guess,g:sc.g,y:sc.y};
  render();
 });
 tryB.disabled=S.codiceEntry.length!==4;
 box.appendChild(tryB);
 box.appendChild(div("codice-legend",T("codiceLegend")));
 wrap.appendChild(box);
 document.getElementById("root").appendChild(wrap);
}

function renderCodiceWin(){
 clr();
 addBackArrow(goBackToGames);
 var wrap=div("codice-wrap");wrap.style.textAlign="center";
  var wt=div("end-title");wt.textContent=S.codiceWinner+" "+T("qvWon");wrap.appendChild(wt);
 wrap.appendChild(div("end-sub",T("codiceWonBy")+S.codiceWinnerTarget+"!"));
 // Reveal all codes
 var revDiv=div("dado-players");
 S.codicePlayers.forEach(function(name){
 var row=div("dado-player-row");
 var ne=div("dado-player-name");ne.textContent=name;row.appendChild(ne);
 var ce=div("dado-player-score");ce.textContent=(S.codiceCodes[name]||[]).join(" - ");ce.style.fontSize="18px";row.appendChild(ce);
 revDiv.appendChild(row);
 });
 wrap.appendChild(revDiv);
 var btns=div("endbtns");
 btns.appendChild(btn("ebtn",T("qvPlayAgain"),function(){S.screen="codice_setup";render();}));
 btns.appendChild(btn("ebtn out",T("exitBtn"),goHome));
 wrap.appendChild(btns);
 document.getElementById("root").appendChild(wrap);
}


// Quanto vale: il punto va a chi si avvicina di più; a pari distanza, a tutti i pari merito
function agYear(v){v=Number(v)||0;return v<0?Math.abs(v)+" "+T("ui_bc"):String(v);}
function qvWinners(q,answers,players){
 var best=Infinity,w=[];
 (players||Object.keys(answers||{})).forEach(function(p){
  var a=answers?answers[p]:undefined;if(typeof a!=="number"||isNaN(a))return;
  var d=Math.abs(a-q.risposta);
  if(d<best){best=d;w=[p];}else if(d===best){w.push(p);}
 });
 return w;
}
function qvScoreRound(q,players){
 // Un solo conteggio per round, anche se il pulsante viene toccato due volte
 if(S.qvScoredRound===S.qvRound&&S.qvRoundWinner)return S.qvRoundWinner;
 S.qvScoredRound=S.qvRound;
 var w=qvWinners(q,S.qvAnswers,players);
 w.forEach(function(p){S.qvScores[p]=(S.qvScores[p]||0)+1;});
 S.qvRoundWinner=w;
 return w;
}
// Le domande si ricordano per numero: l'elenco ha lo stesso ordine in tutte le lingue,
// così ognuno (anche a distanza, o cambiando lingua) le legge nella propria lingua
function qvPickIdx(n){
 var tot=(typeof QUANTO_VALE_DATA!=="undefined")?QUANTO_VALE_DATA.length:qvData().length;
 var idx=[];for(var i=0;i<tot;i++)idx.push(i);
 for(var k=idx.length-1;k>0;k--){var j=Math.floor(Math.random()*(k+1));var t=idx[k];idx[k]=idx[j];idx[j]=t;}
 return idx.slice(0,n);
}
function qvSetQuestions(idx){
 var L=qvData();
 S.qvQIdx=idx.slice();
 S.qvQuestions=idx.map(function(i){return L[i]||(typeof QUANTO_VALE_DATA!=="undefined"?QUANTO_VALE_DATA[i]:null);}).filter(Boolean);
}
function qvRefreshLang(){if(S.qvQIdx&&S.qvQIdx.length)qvSetQuestions(S.qvQIdx);}
function startQuantoVale(players){
 S.qvPlayers=players;
 S.qvScores={};
 players.forEach(function(p){S.qvScores[p]=0;});
 S.qvRound=0;S.qvScoredRound=-1;S.qvRoundWinner=null;
 S.qvTotalRounds=10;
 // Domande a caso (per numero)
 qvSetQuestions(qvPickIdx(S.qvTotalRounds));
 S.qvAnswers={};
 S.qvCurrentPlayerIdx=0;
 S.qvPhase="answer"; // answer -> reveal -> scores
 S.qvRoundWinner=null; // track winner per round (to avoid double scoring)
 S.screen="quantovale";
 render();
}

function startQuantoValeDistanza(playerNames){
 var qi=qvPickIdx(10);
 qvSetQuestions(qi);
 var qs=S.qvQuestions;
 var scores={};
 playerNames.forEach(function(p){scores[p]=0;});
 S.qvPlayers=playerNames;
 S.qvScores=scores;
 S.qvRound=0;S.qvScoredRound=-1;S.qvRoundWinner=null;
 S.qvTotalRounds=10;
 S.qvQuestions=qs;
 S.qvAnswers={};
 S.qvPhase="answer";
 S.qvRoundWinner=null;
 S.qvDistanza=true;
 S.screen="quantovale";
 // Sync to Firebase
 if(fbDB && fbRoomCode && fbIsHost){
 fbSet(fbRef(fbDB,'rooms/'+fbRoomCode+'/screen'),{
 type:'qv_question',
 round:0,
 totalRounds:10,
 players:playerNames,
 scores:scores,
 qi:qi,
 questions:qs
 });
 }
 render();
}


// ══════════════════════════════════════════
// IL SOPRANNOME — timer 5 minuti
// ══════════════════════════════════════════

// ══════════════════════════════════════════
// IL MIMO — timer 3 minuti
// ══════════════════════════════════════════

// ══════════════════════════════════════════
// SCULTURA UMANA — timer 1 minuto
// ══════════════════════════════════════════

// ══════════════════════════════════════════
// SPECCHIO — timer 2 minuti
// ══════════════════════════════════════════

var _pubTimer=null;
function renderPub(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var timeLeft=S.pubTime!==undefined?S.pubTime:120;
 var running=S.pubRunning||false;
 var gameName=(curGame()||{}).name||T("ui_pubblicita_assurda");

 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("backToGames"),function(){
  if(_pubTimer){clearInterval(_pubTimer);_pubTimer=null;}
  goBackToGames();
 }));
 top.appendChild(btn("card-nav-btn",T("exitBtn"),function(){
  if(_pubTimer){clearInterval(_pubTimer);_pubTimer=null;}
  goHome();
 }));
 hdr.appendChild(div("intesa-title",gameName));
 hdr.appendChild(div("intesa-desc",T("ui_2_minuti_per_convincere_tutti")));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 16px;";

 var mins=Math.floor(timeLeft/60);
 var secs=timeLeft%60;
 var timerEl=div("");
 timerEl.style.cssText="font-size:90px;font-weight:900;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums;color:"+(timeLeft<=15?"#e53935":timeLeft<=30?"#f57c00":"var(--dark)")+";";
 timerEl.textContent=mins+":"+(secs<10?"0":"")+secs;
 body.appendChild(timerEl);

 var barWrap=div("");barWrap.style.cssText="width:100%;max-width:260px;height:12px;background:var(--border);border-radius:10px;overflow:hidden;";
 var barFill=div("");barFill.style.cssText="height:100%;border-radius:10px;width:"+(timeLeft/120*100)+"%;background:"+(timeLeft<=15?"#e53935":timeLeft<=30?"#f57c00":"#388E3C")+";transition:width .4s;";
 barWrap.appendChild(barFill);body.appendChild(barWrap);

 var rule=div("rtext");rule.style.cssText="text-align:center;font-size:14px;max-width:280px;";
 rule.textContent=T("ui_presenta_il_tuo_prodotto_assurdo");
 body.appendChild(rule);

 if(timeLeft<=0){
  var scaduto=div("");scaduto.style.cssText="font-size:22px;font-weight:700;color:#388E3C;text-align:center;";
  scaduto.textContent=T("ui_votate_lo_spot_migliore");
  body.appendChild(scaduto);
  var fineBtn=btn("ebtn out",T("endGame"),function(){
   if(_pubTimer){clearInterval(_pubTimer);_pubTimer=null;}
   endGame(gameName);
  });fineBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(fineBtn);
  var riBtn=btn("ebtn",T("ui_prossimo_giocatore"),function(){
   S.pubTime=120;S.pubRunning=false;renderPub();
  });riBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(riBtn);
 } else if(!running){
  var startBtn=btn("ebtn",timeLeft===120?T("ui_inizia_lo_spot"):T("ui_riprendi"),function(){
   S.pubRunning=true;
   _pubTimer=setInterval(function(){
    S.pubTime=(S.pubTime||1)-1;
    if(S.pubTime<=0){S.pubTime=0;S.pubRunning=false;clearInterval(_pubTimer);_pubTimer=null;}
    renderPub();
   },1000);
   renderPub();
  });startBtn.style.cssText="width:100%;max-width:280px;font-size:18px;padding:18px;";
  body.appendChild(startBtn);
  if(timeLeft<120){
   var resetBtn=btn("ebtn out",T("ui_ricomincia"),function(){
    if(_pubTimer){clearInterval(_pubTimer);_pubTimer=null;}
    S.pubTime=120;S.pubRunning=false;renderPub();
   });resetBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(resetBtn);
  }
 } else {
  var pauseBtn=btn("ebtn out",T("ui_pausa"),function(){
   S.pubRunning=false;
   if(_pubTimer){clearInterval(_pubTimer);_pubTimer=null;}
   renderPub();
  });pauseBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(pauseBtn);
 }

 document.getElementById("root").appendChild(wrap);
}
var _robotTimer=null;
function renderRobot(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var timeLeft=S.robotTime!==undefined?S.robotTime:120;
 var running=S.robotRunning||false;
 var gameName=(curGame()||{}).name||T("ui_il_robot");

 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("backToGames"),function(){
  if(_robotTimer){clearInterval(_robotTimer);_robotTimer=null;}
  goBackToGames();
 }));
 top.appendChild(btn("card-nav-btn",T("exitBtn"),function(){
  if(_robotTimer){clearInterval(_robotTimer);_robotTimer=null;}
  goHome();
 }));
 hdr.appendChild(div("intesa-title",gameName));
 hdr.appendChild(div("intesa-desc",T("ui_2_minuti_per_completare_la")));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 16px;";

 var mins=Math.floor(timeLeft/60);
 var secs=timeLeft%60;
 var timerEl=div("");
 timerEl.style.cssText="font-size:90px;font-weight:900;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums;color:"+(timeLeft<=15?"#e53935":timeLeft<=30?"#f57c00":"var(--dark)")+";";
 timerEl.textContent=mins+":"+(secs<10?"0":"")+secs;
 body.appendChild(timerEl);

 var barWrap=div("");barWrap.style.cssText="width:100%;max-width:260px;height:12px;background:var(--border);border-radius:10px;overflow:hidden;";
 var barFill=div("");barFill.style.cssText="height:100%;border-radius:10px;width:"+(timeLeft/120*100)+"%;background:"+(timeLeft<=15?"#e53935":timeLeft<=30?"#f57c00":"#388E3C")+";transition:width .4s;";
 barWrap.appendChild(barFill);body.appendChild(barWrap);

 var rule=div("rtext");rule.style.cssText="text-align:center;font-size:14px;max-width:280px;";
 rule.textContent=T("ui_il_programmatore_da_comandi_precisi");
 body.appendChild(rule);

 if(timeLeft<=0){
  var scaduto=div("");scaduto.style.cssText="font-size:22px;font-weight:700;color:#388E3C;text-align:center;";
  scaduto.textContent=T("ui_cambiate_ruolo");
  body.appendChild(scaduto);
  var fineBtn=btn("ebtn out",T("endGame"),function(){
   if(_robotTimer){clearInterval(_robotTimer);_robotTimer=null;}
   endGame(gameName);
  });fineBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(fineBtn);
  var riBtn=btn("ebtn",T("ui_nuovo_turno"),function(){
   S.robotTime=120;S.robotRunning=false;renderRobot();
  });riBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(riBtn);
 } else if(!running){
  var startBtn=btn("ebtn",timeLeft===120?T("ui_inizia_il_turno"):T("ui_riprendi"),function(){
   S.robotRunning=true;
   _robotTimer=setInterval(function(){
    S.robotTime=(S.robotTime||1)-1;
    if(S.robotTime<=0){S.robotTime=0;S.robotRunning=false;clearInterval(_robotTimer);_robotTimer=null;}
    renderRobot();
   },1000);
   renderRobot();
  });startBtn.style.cssText="width:100%;max-width:280px;font-size:18px;padding:18px;";
  body.appendChild(startBtn);
  if(timeLeft<120){
   var resetBtn=btn("ebtn out",T("ui_ricomincia"),function(){
    if(_robotTimer){clearInterval(_robotTimer);_robotTimer=null;}
    S.robotTime=120;S.robotRunning=false;renderRobot();
   });resetBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(resetBtn);
  }
 } else {
  var pauseBtn=btn("ebtn out",T("ui_pausa"),function(){
   S.robotRunning=false;
   if(_robotTimer){clearInterval(_robotTimer);_robotTimer=null;}
   renderRobot();
  });pauseBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(pauseBtn);
 }

 document.getElementById("root").appendChild(wrap);
}
var _specTimer=null;

function renderSpecchio(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var timeLeft=S.specTime!==undefined?S.specTime:120;
 var running=S.specRunning||false;
 var gameName=(curGame()||{}).name||T("ui_specchio");

 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("backToGames"),function(){
  if(_specTimer){clearInterval(_specTimer);_specTimer=null;}
  goBackToGames();
 }));
 top.appendChild(btn("card-nav-btn",T("exitBtn"),function(){
  if(_specTimer){clearInterval(_specTimer);_specTimer=null;}
  goHome();
 }));
 hdr.appendChild(div("intesa-title",gameName));
 hdr.appendChild(div("intesa-desc",T("ui_2_minuti_come_riflesso_poi")));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 16px;";

 var mins=Math.floor(timeLeft/60);
 var secs=timeLeft%60;
 var timerEl=div("");
 timerEl.style.cssText="font-size:90px;font-weight:900;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums;color:"+(timeLeft<=15?"#e53935":timeLeft<=30?"#f57c00":"var(--dark)")+";";
 timerEl.textContent=mins+":"+(secs<10?"0":"")+secs;
 body.appendChild(timerEl);

 var barWrap=div("");barWrap.style.cssText="width:100%;max-width:260px;height:12px;background:var(--border);border-radius:10px;overflow:hidden;";
 var barFill=div("");barFill.style.cssText="height:100%;border-radius:10px;width:"+(timeLeft/120*100)+"%;background:"+(timeLeft<=15?"#e53935":timeLeft<=30?"#f57c00":"#00838F")+";transition:width .4s;";
 barWrap.appendChild(barFill);body.appendChild(barWrap);

 var rule=div("rtext");rule.style.cssText="text-align:center;font-size:14px;max-width:280px;";
 rule.textContent=T("ui_uno_guida_l_altro_imita");
 body.appendChild(rule);

 if(timeLeft<=0){
  var scaduto=div("");scaduto.style.cssText="font-size:22px;font-weight:700;color:#00838F;text-align:center;";
  scaduto.textContent=T("ui_scambiate_i_ruoli");
  body.appendChild(scaduto);
  var fineBtn=btn("ebtn out",T("endGame"),function(){
   if(_specTimer){clearInterval(_specTimer);_specTimer=null;}
   endGame(gameName);
  });fineBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(fineBtn);
  var riBtn=btn("ebtn",T("ui_nuovo_turno"),function(){
   S.specTime=120;S.specRunning=false;renderSpecchio();
  });riBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(riBtn);
 } else if(!running){
  var startBtn=btn("ebtn",timeLeft===120?T("ui_inizia_il_turno"):T("ui_riprendi"),function(){
   S.specRunning=true;
   _specTimer=setInterval(function(){
    S.specTime=(S.specTime||1)-1;
    if(S.specTime<=0){S.specTime=0;S.specRunning=false;clearInterval(_specTimer);_specTimer=null;}
    renderSpecchio();
   },1000);
   renderSpecchio();
  });startBtn.style.cssText="width:100%;max-width:280px;font-size:18px;padding:18px;";
  body.appendChild(startBtn);
  if(timeLeft<120){
   var resetBtn=btn("ebtn out",T("ui_ricomincia"),function(){
    if(_specTimer){clearInterval(_specTimer);_specTimer=null;}
    S.specTime=120;S.specRunning=false;renderSpecchio();
   });resetBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(resetBtn);
  }
 } else {
  var pauseBtn=btn("ebtn out",T("ui_pausa"),function(){
   S.specRunning=false;
   if(_specTimer){clearInterval(_specTimer);_specTimer=null;}
   renderSpecchio();
  });pauseBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(pauseBtn);
 }

 document.getElementById("root").appendChild(wrap);
}

var _sculTimer=null;

function renderScultura(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var timeLeft=S.sculTime!==undefined?S.sculTime:60;
 var running=S.sculRunning||false;
 var gameName=(curGame()||{}).name||T("ui_scultura_umana");

 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("backToGames"),function(){
  if(_sculTimer){clearInterval(_sculTimer);_sculTimer=null;}
  goBackToGames();
 }));
 top.appendChild(btn("card-nav-btn",T("exitBtn"),function(){
  if(_sculTimer){clearInterval(_sculTimer);_sculTimer=null;}
  goHome();
 }));
 hdr.appendChild(div("intesa-title",gameName));
 hdr.appendChild(div("intesa-desc",T("ui_1_minuto_per_indovinare_la")));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 16px;";

 var timerEl=div("");
 timerEl.style.cssText="font-size:110px;font-weight:900;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums;color:"+(timeLeft<=10?"#e53935":timeLeft<=20?"#f57c00":"var(--dark)")+";";
 timerEl.textContent=timeLeft;
 body.appendChild(timerEl);

 var barWrap=div("");barWrap.style.cssText="width:100%;max-width:260px;height:12px;background:var(--border);border-radius:10px;overflow:hidden;";
 var barFill=div("");barFill.style.cssText="height:100%;border-radius:10px;width:"+(timeLeft/60*100)+"%;background:"+(timeLeft<=10?"#e53935":timeLeft<=20?"#f57c00":"#5E35B1")+";transition:width .4s;";
 barWrap.appendChild(barFill);body.appendChild(barWrap);

 var rule=div("rtext");rule.style.cssText="text-align:center;font-size:14px;max-width:280px;";
 rule.textContent=T("ui_le_statue_non_possono_muoversi");
 body.appendChild(rule);

 if(timeLeft<=0){
  var scaduto=div("");scaduto.style.cssText="font-size:22px;font-weight:700;color:#5E35B1;text-align:center;";
  scaduto.textContent=T("ui_tempo_rivelate_la_scena");
  body.appendChild(scaduto);
  var fineBtn=btn("ebtn out",T("endGame"),function(){
   if(_sculTimer){clearInterval(_sculTimer);_sculTimer=null;}
   endGame(gameName);
  });fineBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(fineBtn);
  var riBtn=btn("ebtn",T("ui_prossimo_scultore"),function(){
   S.sculTime=60;S.sculRunning=false;renderScultura();
  });riBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(riBtn);
 } else if(!running){
  var startBtn=btn("ebtn",timeLeft===60?T("ui_inizia_il_timer"):T("ui_riprendi"),function(){
   S.sculRunning=true;
   _sculTimer=setInterval(function(){
    S.sculTime=(S.sculTime||1)-1;
    if(S.sculTime<=0){S.sculTime=0;S.sculRunning=false;clearInterval(_sculTimer);_sculTimer=null;}
    renderScultura();
   },1000);
   renderScultura();
  });startBtn.style.cssText="width:100%;max-width:280px;font-size:18px;padding:18px;";
  body.appendChild(startBtn);
  if(timeLeft<60){
   var resetBtn=btn("ebtn out",T("ui_ricomincia"),function(){
    if(_sculTimer){clearInterval(_sculTimer);_sculTimer=null;}
    S.sculTime=60;S.sculRunning=false;renderScultura();
   });resetBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(resetBtn);
  }
 } else {
  var pauseBtn=btn("ebtn out",T("ui_pausa"),function(){
   S.sculRunning=false;
   if(_sculTimer){clearInterval(_sculTimer);_sculTimer=null;}
   renderScultura();
  });pauseBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(pauseBtn);
 }

 document.getElementById("root").appendChild(wrap);
}

var _mimoTimer=null;

function renderMimo(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var timeLeft=S.mimoTime!==undefined?S.mimoTime:180;
 var running=S.mimoRunning||false;
 var gameName=(curGame()||{}).name||T("ui_il_mimo");

 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("backToGames"),function(){
  if(_mimoTimer){clearInterval(_mimoTimer);_mimoTimer=null;}
  goBackToGames();
 }));
 top.appendChild(btn("card-nav-btn",T("exitBtn"),function(){
  if(_mimoTimer){clearInterval(_mimoTimer);_mimoTimer=null;}
  goHome();
 }));
 hdr.appendChild(div("intesa-title",gameName));
 hdr.appendChild(div("intesa-desc",T("ui_3_minuti_per_far_indovinare")));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 16px;";

 var mins=Math.floor(timeLeft/60);
 var secs=timeLeft%60;
 var timerEl=div("");
 timerEl.style.cssText="font-size:90px;font-weight:900;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums;color:"+(timeLeft<=15?"#e53935":timeLeft<=30?"#f57c00":"var(--dark)")+";";
 timerEl.textContent=mins+":"+(secs<10?"0":"")+secs;
 body.appendChild(timerEl);

 var barWrap=div("");barWrap.style.cssText="width:100%;max-width:260px;height:12px;background:var(--border);border-radius:10px;overflow:hidden;";
 var barFill=div("");barFill.style.cssText="height:100%;border-radius:10px;width:"+(timeLeft/180*100)+"%;background:"+(timeLeft<=15?"#e53935":timeLeft<=30?"#f57c00":"#1565C0")+";transition:width .4s;";
 barWrap.appendChild(barFill);body.appendChild(barWrap);

 var rule=div("rtext");rule.style.cssText="text-align:center;font-size:14px;max-width:280px;";
 rule.textContent=T("ui_mima_senza_parlare_fare_suoni");
 body.appendChild(rule);

 if(timeLeft<=0){
  var scaduto=div("");scaduto.style.cssText="font-size:22px;font-weight:700;color:#1565C0;text-align:center;";
  scaduto.textContent=T("ui_tempo_prossimo_giocatore");
  body.appendChild(scaduto);
  var fineBtn=btn("ebtn out",T("endGame"),function(){
   if(_mimoTimer){clearInterval(_mimoTimer);_mimoTimer=null;}
   endGame(gameName);
  });fineBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(fineBtn);
  var riBtn=btn("ebtn",T("ui_prossimo_mimo"),function(){
   S.mimoTime=180;S.mimoRunning=false;renderMimo();
  });riBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(riBtn);
 } else if(!running){
  var startBtn=btn("ebtn",timeLeft===180?T("ui_inizia_il_mimo"):T("ui_riprendi"),function(){
   S.mimoRunning=true;
   _mimoTimer=setInterval(function(){
    S.mimoTime=(S.mimoTime||1)-1;
    if(S.mimoTime<=0){S.mimoTime=0;S.mimoRunning=false;clearInterval(_mimoTimer);_mimoTimer=null;}
    renderMimo();
   },1000);
   renderMimo();
  });startBtn.style.cssText="width:100%;max-width:280px;font-size:18px;padding:18px;";
  body.appendChild(startBtn);
  if(timeLeft<180){
   var resetBtn=btn("ebtn out",T("ui_ricomincia"),function(){
    if(_mimoTimer){clearInterval(_mimoTimer);_mimoTimer=null;}
    S.mimoTime=180;S.mimoRunning=false;renderMimo();
   });resetBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(resetBtn);
  }
 } else {
  var pauseBtn=btn("ebtn out",T("ui_pausa"),function(){
   S.mimoRunning=false;
   if(_mimoTimer){clearInterval(_mimoTimer);_mimoTimer=null;}
   renderMimo();
  });pauseBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(pauseBtn);
 }

 document.getElementById("root").appendChild(wrap);
}

var _sopTimer=null;

function renderSoprannome(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var timeLeft=S.sopTime!==undefined?S.sopTime:300;
 var running=S.sopRunning||false;
 var gameName=(curGame()||{}).name||T("ui_il_soprannome");

 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("backToGames"),function(){
  if(_sopTimer){clearInterval(_sopTimer);_sopTimer=null;}
  goBackToGames();
 }));
 top.appendChild(btn("card-nav-btn",T("exitBtn"),function(){
  if(_sopTimer){clearInterval(_sopTimer);_sopTimer=null;}
  goHome();
 }));
 hdr.appendChild(div("intesa-title",gameName));
 hdr.appendChild(div("intesa-desc",T("ui_5_minuti_di_conversazione_libera")));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 16px;";

 var mins=Math.floor(timeLeft/60);
 var secs=timeLeft%60;
 var timerEl=div("");
 timerEl.style.cssText="font-size:90px;font-weight:900;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums;color:"+(timeLeft<=30?"#e53935":timeLeft<=60?"#f57c00":"var(--dark)")+";";
 timerEl.textContent=mins+":"+(secs<10?"0":"")+secs;
 body.appendChild(timerEl);

 var barWrap=div("");barWrap.style.cssText="width:100%;max-width:260px;height:12px;background:var(--border);border-radius:10px;overflow:hidden;";
 var barFill=div("");barFill.style.cssText="height:100%;border-radius:10px;width:"+(timeLeft/300*100)+"%;background:"+(timeLeft<=30?"#e53935":timeLeft<=60?"#f57c00":"#6a1b9a")+";transition:width .4s;";
 barWrap.appendChild(barFill);body.appendChild(barWrap);

 var rule=div("rtext");rule.style.cssText="text-align:center;font-size:14px;max-width:280px;";
 rule.textContent=T("ui_chiacchierate_liberamente_allo_scadere_del");
 body.appendChild(rule);

 if(timeLeft<=0){
  var scaduto=div("");scaduto.style.cssText="font-size:22px;font-weight:700;color:#6a1b9a;text-align:center;";
  scaduto.textContent=T("ui_tempo_rivelate_i_soprannomi");
  body.appendChild(scaduto);
  var fineBtn=btn("ebtn out",T("endGame"),function(){
   if(_sopTimer){clearInterval(_sopTimer);_sopTimer=null;}
   endGame(gameName);
  });fineBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(fineBtn);
  var riBtn=btn("ebtn",T("ui_nuovo_giro"),function(){
   S.sopTime=300;S.sopRunning=false;renderSoprannome();
  });riBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(riBtn);
 } else if(!running){
  var startBtn=btn("ebtn",timeLeft===300?T("ui_inizia_la_conversazione"):T("ui_riprendi"),function(){
   S.sopRunning=true;
   _sopTimer=setInterval(function(){
    S.sopTime=(S.sopTime||1)-1;
    if(S.sopTime<=0){S.sopTime=0;S.sopRunning=false;clearInterval(_sopTimer);_sopTimer=null;}
    renderSoprannome();
   },1000);
   renderSoprannome();
  });startBtn.style.cssText="width:100%;max-width:280px;font-size:18px;padding:18px;";
  body.appendChild(startBtn);
  if(timeLeft<300){
   var resetBtn=btn("ebtn out",T("ui_ricomincia"),function(){
    if(_sopTimer){clearInterval(_sopTimer);_sopTimer=null;}
    S.sopTime=300;S.sopRunning=false;renderSoprannome();
   });resetBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(resetBtn);
  }
 } else {
  var pauseBtn=btn("ebtn out",T("ui_pausa"),function(){
   S.sopRunning=false;
   if(_sopTimer){clearInterval(_sopTimer);_sopTimer=null;}
   renderSoprannome();
  });pauseBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(pauseBtn);
 }

 document.getElementById("root").appendChild(wrap);
}

// ══════════════════════════════════════════
// COSA HAI IN COMUNE? — timer 4 minuti
// ══════════════════════════════════════════

var _cicTimer=null;

function renderCosaInComune(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var timeLeft=S.cicTime!==undefined?S.cicTime:240;
 var running=S.cicRunning||false;
 var gameName=(curGame()||{}).name||T("ui_cosa_hai_in_comune");

 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("backToGames"),function(){
  if(_cicTimer){clearInterval(_cicTimer);_cicTimer=null;}
  goBackToGames();
 }));
 top.appendChild(btn("card-nav-btn",T("exitBtn"),function(){
  if(_cicTimer){clearInterval(_cicTimer);_cicTimer=null;}
  goHome();
 }));
 hdr.appendChild(div("intesa-title",gameName));
 hdr.appendChild(div("intesa-desc",T("ui_4_minuti_per_scoprirlo")));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 16px;";

 // Timer mm:ss
 var mins=Math.floor(timeLeft/60);
 var secs=timeLeft%60;
 var timerEl=div("");
 timerEl.style.cssText="font-size:90px;font-weight:900;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums;color:"+(timeLeft<=30?"#e53935":timeLeft<=60?"#f57c00":"var(--dark)")+";";
 timerEl.textContent=mins+":"+(secs<10?"0":"")+secs;
 body.appendChild(timerEl);

 // Barra progresso
 var barWrap=div("");barWrap.style.cssText="width:100%;max-width:260px;height:12px;background:var(--border);border-radius:10px;overflow:hidden;";
 var barFill=div("");barFill.style.cssText="height:100%;border-radius:10px;width:"+(timeLeft/240*100)+"%;background:"+(timeLeft<=30?"#e53935":timeLeft<=60?"#f57c00":"#2e7d32")+";transition:width .4s;";
 barWrap.appendChild(barFill);body.appendChild(barWrap);

 var rule=div("rtext");rule.style.cssText="text-align:center;font-size:14px;max-width:280px;";
 rule.textContent=T("ui_trovate_almeno_3_cose_inaspettate");
 body.appendChild(rule);

 if(timeLeft<=0){
  var scaduto=div("");scaduto.style.cssText="font-size:22px;font-weight:700;color:#2e7d32;text-align:center;";
  scaduto.textContent=T("ui_tempo_presentatevi_al_gruppo");
  body.appendChild(scaduto);
  var nextBtn=btn("ebtn",T("ui_nuova_coppia"),function(){
   S.cicTime=240;S.cicRunning=false;renderCosaInComune();
  });nextBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(nextBtn);
  var fineBtn=btn("ebtn out",T("endGame"),function(){
   if(_cicTimer){clearInterval(_cicTimer);_cicTimer=null;}
   endGame(gameName);
  });fineBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(fineBtn);
 } else if(!running){
  var startBtn=btn("ebtn",timeLeft===240?T("ui_inizia_2"):T("ui_riprendi"),function(){
   S.cicRunning=true;
   _cicTimer=setInterval(function(){
    S.cicTime=(S.cicTime||1)-1;
    if(S.cicTime<=0){S.cicTime=0;S.cicRunning=false;clearInterval(_cicTimer);_cicTimer=null;}
    renderCosaInComune();
   },1000);
   renderCosaInComune();
  });startBtn.style.cssText="width:100%;max-width:280px;font-size:18px;padding:18px;";
  body.appendChild(startBtn);
  if(timeLeft<240){
   var resetBtn=btn("ebtn out",T("ui_ricomincia"),function(){
    if(_cicTimer){clearInterval(_cicTimer);_cicTimer=null;}
    S.cicTime=240;S.cicRunning=false;renderCosaInComune();
   });resetBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(resetBtn);
  }
 } else {
  var pauseBtn=btn("ebtn out",T("ui_pausa"),function(){
   S.cicRunning=false;
   if(_cicTimer){clearInterval(_cicTimer);_cicTimer=null;}
   renderCosaInComune();
  });pauseBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(pauseBtn);
 }

 document.getElementById("root").appendChild(wrap);
}

// ══════════════════════════════════════════
// CHI SEI DAVVERO? — timer 20 s per risposta
// ══════════════════════════════════════════

var _csdTimer=null;

function renderChiSeiDavvero(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var timeLeft=S.csdTime!==undefined?S.csdTime:20;
 var running=S.csdRunning||false;
 var gameName=(curGame()||{}).name||T("ui_chi_sei_davvero");

 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("backToGames"),function(){
  if(_csdTimer){clearInterval(_csdTimer);_csdTimer=null;}
  goBackToGames();
 }));
 top.appendChild(btn("card-nav-btn",T("exitBtn"),function(){
  if(_csdTimer){clearInterval(_csdTimer);_csdTimer=null;}
  goHome();
 }));
 hdr.appendChild(div("intesa-title",gameName));
 hdr.appendChild(div("intesa-desc",T("ui_20_secondi_per_rispondere")));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 16px;";

 // Timer grande
 var timerEl=div("");
 timerEl.style.cssText="font-size:120px;font-weight:900;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums;color:"+(timeLeft<=5?"#e53935":timeLeft<=10?"#f57c00":"var(--dark)")+";";
 timerEl.textContent=timeLeft;
 body.appendChild(timerEl);

 // Barra progresso
 var barWrap=div("");barWrap.style.cssText="width:100%;max-width:260px;height:12px;background:var(--border);border-radius:10px;overflow:hidden;";
 var barFill=div("");barFill.style.cssText="height:100%;border-radius:10px;width:"+(timeLeft/20*100)+"%;background:"+(timeLeft<=5?"#e53935":timeLeft<=10?"#f57c00":"#1565c0")+";transition:width .4s;";
 barWrap.appendChild(barFill);body.appendChild(barWrap);

 var rule=div("rtext");rule.style.cssText="text-align:center;font-size:14px;max-width:280px;";
 rule.textContent=T("ui_il_moderatore_fa_una_domanda");
 body.appendChild(rule);
 var _aq=adultiPick("csdQ");
 if(_aq){
  rule.style.display="none";
  var qc=div("adulti-q");qc.appendChild(div("adulti-q-text",_aq));
  if(!running){var cb=btn("adulti-q-next",T("adultiOther"),function(){adultiNext("csdQ");render();});qc.appendChild(cb);}
  body.appendChild(qc);
 }


 if(timeLeft<=0){
  var scaduto=div("");scaduto.style.cssText="font-size:22px;font-weight:700;color:#1565c0;text-align:center;";
  scaduto.textContent=T("ui_tempo_prossima_domanda");
  body.appendChild(scaduto);
  var nextBtn=btn("ebtn",T("ui_nuova_domanda"),function(){
   S.csdTime=20;adultiNext("csdQ");S.csdRunning=false;renderChiSeiDavvero();
  });nextBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(nextBtn);
  var fineBtn=btn("ebtn out",T("endGame"),function(){
   if(_csdTimer){clearInterval(_csdTimer);_csdTimer=null;}
   endGame(gameName);
  });fineBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(fineBtn);
 } else if(!running){
  var startBtn=btn("ebtn",timeLeft===20?T("ui_inizia_il_round"):T("ui_riprendi"),function(){
   S.csdRunning=true;
   _csdTimer=setInterval(function(){
    S.csdTime=(S.csdTime||1)-1;
    if(S.csdTime<=0){S.csdTime=0;S.csdRunning=false;clearInterval(_csdTimer);_csdTimer=null;}
    renderChiSeiDavvero();
   },1000);
   renderChiSeiDavvero();
  });startBtn.style.cssText="width:100%;max-width:280px;font-size:18px;padding:18px;";
  body.appendChild(startBtn);
  if(timeLeft<20){
   var resetBtn=btn("ebtn out",T("ui_ricomincia"),function(){
    if(_csdTimer){clearInterval(_csdTimer);_csdTimer=null;}
    S.csdTime=20;S.csdRunning=false;renderChiSeiDavvero();
   });resetBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(resetBtn);
  }
 } else {
  var pauseBtn=btn("ebtn out",T("ui_pausa"),function(){
   S.csdRunning=false;
   if(_csdTimer){clearInterval(_csdTimer);_csdTimer=null;}
   renderChiSeiDavvero();
  });pauseBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(pauseBtn);
 }

 document.getElementById("root").appendChild(wrap);
}

// ══════════════════════════════════════════
// IL SUPERPOTERE — timer 30 s per turno
// ══════════════════════════════════════════

var _superTimer=null;

function renderSuperpotere(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var timeLeft=S.superTime!==undefined?S.superTime:30;
 var running=S.superRunning||false;
 var gameName=(curGame()||{}).name||T("ui_il_superpotere");

 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("backToGames"),function(){
  if(_superTimer){clearInterval(_superTimer);_superTimer=null;}
  goBackToGames();
 }));
 top.appendChild(btn("card-nav-btn",T("exitBtn"),function(){
  if(_superTimer){clearInterval(_superTimer);_superTimer=null;}
  goHome();
 }));
 hdr.appendChild(div("intesa-title",gameName));
 hdr.appendChild(div("intesa-desc",T("ui_30_secondi_per_convincerli_tutti")));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 16px;";

 // Timer grande
 var timerEl=div("");
 timerEl.style.cssText="font-size:120px;font-weight:900;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums;color:"+(timeLeft<=5?"#e53935":timeLeft<=10?"#f57c00":"var(--dark)")+";";
 timerEl.textContent=timeLeft;
 body.appendChild(timerEl);

 // Barra progresso
 var barWrap=div("");barWrap.style.cssText="width:100%;max-width:260px;height:12px;background:var(--border);border-radius:10px;overflow:hidden;";
 var barFill=div("");barFill.style.cssText="height:100%;border-radius:10px;width:"+(timeLeft/30*100)+"%;background:"+(timeLeft<=5?"#e53935":timeLeft<=10?"#f57c00":"#7b1fa2")+";transition:width .4s;";
 barWrap.appendChild(barFill);body.appendChild(barWrap);

 var rule=div("rtext");rule.style.cssText="text-align:center;font-size:14px;max-width:280px;";
 rule.textContent=T("ui_scegli_un_superpotere_e_spiega");
 body.appendChild(rule);

 if(timeLeft<=0){
  var scaduto=div("");scaduto.style.cssText="font-size:22px;font-weight:700;color:#7b1fa2;text-align:center;";
  scaduto.textContent=T("ui_tempo_scaduto");
  body.appendChild(scaduto);
  var nextBtn=btn("ebtn",T("ui_prossimo_giocatore_2"),function(){
   S.superTime=30;S.superRunning=false;renderSuperpotere();
  });nextBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(nextBtn);
  var fineBtn=btn("ebtn out",T("endGame"),function(){
   if(_superTimer){clearInterval(_superTimer);_superTimer=null;}
   endGame(gameName);
  });fineBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(fineBtn);
 } else if(!running){
  var startBtn=btn("ebtn",timeLeft===30?T("ui_inizia_il_turno"):T("ui_riprendi"),function(){
   S.superRunning=true;
   _superTimer=setInterval(function(){
    S.superTime=(S.superTime||1)-1;
    if(S.superTime<=0){S.superTime=0;S.superRunning=false;clearInterval(_superTimer);_superTimer=null;}
    renderSuperpotere();
   },1000);
   renderSuperpotere();
  });startBtn.style.cssText="width:100%;max-width:280px;font-size:18px;padding:18px;";
  body.appendChild(startBtn);
  if(timeLeft<30){
   var resetBtn=btn("ebtn out",T("ui_ricomincia"),function(){
    if(_superTimer){clearInterval(_superTimer);_superTimer=null;}
    S.superTime=30;S.superRunning=false;renderSuperpotere();
   });resetBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(resetBtn);
  }
 } else {
  var pauseBtn=btn("ebtn out",T("ui_pausa"),function(){
   S.superRunning=false;
   if(_superTimer){clearInterval(_superTimer);_superTimer=null;}
   renderSuperpotere();
  });pauseBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(pauseBtn);
 }

 document.getElementById("root").appendChild(wrap);
}

// ══════════════════════════════════════════
// APPELLO / ROLL CALL / LISTA — timer 60 s
// ══════════════════════════════════════════

var _appelloTimer=null;

function renderAppello(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var timeLeft=S.appelloTime!==undefined?S.appelloTime:60;
 var running=S.appelloRunning||false;
 var gameName=(curGame()||{}).name||T("ui_appello");

 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("backToGames"),function(){
  if(_appelloTimer){clearInterval(_appelloTimer);_appelloTimer=null;}
  goBackToGames();
 }));
 top.appendChild(btn("card-nav-btn",T("exitBtn"),function(){
  if(_appelloTimer){clearInterval(_appelloTimer);_appelloTimer=null;}
  goHome();
 }));
 hdr.appendChild(div("intesa-title",gameName));
 hdr.appendChild(div("intesa-desc",T("ui_memorizza_tutti_i_nomi_in")));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 16px;";

 // Timer display
 var timerEl=div("");
 timerEl.style.cssText="font-size:100px;font-weight:900;letter-spacing:-.02em;color:"+(timeLeft<=10?"#e53935":timeLeft<=20?"#f57c00":"var(--dark)")+";line-height:1;font-variant-numeric:tabular-nums;";
 timerEl.textContent=timeLeft;
 body.appendChild(timerEl);

 // Barra progresso
 var barWrap=div("");barWrap.style.cssText="width:100%;max-width:260px;height:10px;background:var(--border);border-radius:10px;overflow:hidden;";
 var barFill=div("");barFill.style.cssText="height:100%;border-radius:10px;transition:width .4s;width:"+(timeLeft/60*100)+"%;background:"+(timeLeft<=10?"#e53935":timeLeft<=20?"#f57c00":"#43a047")+";";
 barWrap.appendChild(barFill);body.appendChild(barWrap);

 // Regola breve
 var rule=div("rtext");rule.style.cssText="text-align:center;font-size:14px;max-width:280px;";
 rule.textContent=T("ui_il_moderatore_punta_il_dito");
 body.appendChild(rule);

 if(timeLeft<=0){
  var scaduto=div("");scaduto.style.cssText="font-size:20px;font-weight:700;color:#2E7D32;text-align:center;";
  scaduto.textContent=T("ui_via_iniziate_a_giocare");
  body.appendChild(scaduto);
  var riBtn=btn("ebtn",T("ui_nuovo_giro_2"),function(){
   S.appelloTime=60;S.appelloRunning=false;renderAppello();
  });riBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(riBtn);
  var fineBtn=btn("ebtn out",T("endGame"),function(){
   if(_appelloTimer){clearInterval(_appelloTimer);_appelloTimer=null;}
   endGame(gameName);
  });fineBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(fineBtn);
 } else if(!running){
  var startBtn=btn("ebtn",timeLeft===60?T("ui_inizia_memorizzazione"):T("ui_riprendi"),function(){
   S.appelloRunning=true;
   _appelloTimer=setInterval(function(){
    S.appelloTime=(S.appelloTime||1)-1;
    if(S.appelloTime<=0){S.appelloTime=0;S.appelloRunning=false;clearInterval(_appelloTimer);_appelloTimer=null;}
    renderAppello();
   },1000);
   renderAppello();
  });startBtn.style.cssText="width:100%;max-width:280px;font-size:18px;padding:18px;";
  body.appendChild(startBtn);
  if(timeLeft<60){
   var resetBtn=btn("ebtn out",T("ui_ricomincia"),function(){
    if(_appelloTimer){clearInterval(_appelloTimer);_appelloTimer=null;}
    S.appelloTime=60;S.appelloRunning=false;renderAppello();
   });resetBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(resetBtn);
  }
 } else {
  var pauseBtn=btn("ebtn out",T("ui_pausa"),function(){
   S.appelloRunning=false;
   if(_appelloTimer){clearInterval(_appelloTimer);_appelloTimer=null;}
   renderAppello();
  });pauseBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(pauseBtn);
 }

 document.getElementById("root").appendChild(wrap);
}

// ══════════════════════════════════════════
// SÌ, NO, NON — timer 3 minuti
// ══════════════════════════════════════════

var _sinonTimer=null;

function renderSiNon(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var timeLeft=S.sinonTime!==undefined?S.sinonTime:180;
 var running=S.sinonRunning||false;

 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("backToGames"),function(){
  if(_sinonTimer){clearInterval(_sinonTimer);_sinonTimer=null;}
  goBackToGames();
 }));
 top.appendChild(btn("card-nav-btn",T("exitBtn"),function(){
  if(_sinonTimer){clearInterval(_sinonTimer);_sinonTimer=null;}
  goHome();
 }));
 hdr.appendChild(div("intesa-title",T("ui_si_no_non")));
 hdr.appendChild(div("intesa-desc",T("ui_rispondi_senza_mai_dire_si")));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 16px;";

 // Timer display
 var mins=Math.floor(timeLeft/60);
 var secs=timeLeft%60;
 var timeStr=mins+":"+(secs<10?"0":"")+secs;
 var timerEl=div("");
 timerEl.style.cssText="font-size:80px;font-weight:900;letter-spacing:-.02em;color:"+(timeLeft<=10?"#e53935":timeLeft<=30?"#f57c00":"var(--dark)")+";line-height:1;font-variant-numeric:tabular-nums;";
 timerEl.textContent=timeStr;
 body.appendChild(timerEl);

 // Parole vietate
 var forbidWrap=div("");forbidWrap.style.cssText="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;";
 [T("ui_si"),T("ui_no"),T("ui_non")].forEach(function(w){
  var badge=div("");badge.style.cssText="font-size:18px;font-weight:900;padding:8px 20px;border-radius:30px;background:#e53935;color:#fff;letter-spacing:.06em;text-decoration:line-through;";
  badge.textContent=w;
  forbidWrap.appendChild(badge);
 });
 body.appendChild(forbidWrap);

 // Stato
 if(timeLeft<=0){
  // Tempo scaduto
  var scaduto=div("");scaduto.style.cssText="font-size:18px;font-weight:700;color:#2E7D32;text-align:center;";
  scaduto.textContent=T("ui_tempo_scaduto_hai_resistito");
  body.appendChild(scaduto);
  var riBtn=btn("ebtn",T("ui_prossimo_giocatore_2"),function(){
   S.sinonTime=180;S.sinonRunning=false;renderSiNon();
  });riBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(riBtn);
  var fineBtn=btn("ebtn out",T("endGame"),function(){
   if(_sinonTimer){clearInterval(_sinonTimer);_sinonTimer=null;}
   endGame(T("ui_si_no_non"));
  });fineBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(fineBtn);
 } else if(!running){
  var startBtn=btn("ebtn",timeLeft===180?T("ui_inizia_2"):T("ui_riprendi"),function(){
   S.sinonRunning=true;
   _sinonTimer=setInterval(function(){
    S.sinonTime=(S.sinonTime||1)-1;
    if(S.sinonTime<=0){S.sinonTime=0;S.sinonRunning=false;clearInterval(_sinonTimer);_sinonTimer=null;}
    renderSiNon();
   },1000);
   renderSiNon();
  });startBtn.style.cssText="width:100%;max-width:280px;font-size:18px;padding:18px;";
  body.appendChild(startBtn);
  if(timeLeft<180){
   var resetBtn=btn("ebtn out",T("ui_ricomincia"),function(){
    S.sinonTime=180;S.sinonRunning=false;renderSiNon();
   });resetBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(resetBtn);
  }
  // Bottone "ha sbagliato" per azzerare
  if(timeLeft<180){
   var errBtn=btn("ebtn out",T("ui_ha_detto_si_no_non"),function(){
    S.sinonTime=180;S.sinonRunning=false;renderSiNon();
   });errBtn.style.cssText="width:100%;max-width:280px;font-size:13px;";body.appendChild(errBtn);
  }
 } else {
  // In esecuzione — mostra pausa e pulsante "ha sbagliato"
  var pauseBtn=btn("ebtn out",T("ui_pausa"),function(){
   S.sinonRunning=false;
   if(_sinonTimer){clearInterval(_sinonTimer);_sinonTimer=null;}
   renderSiNon();
  });pauseBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(pauseBtn);
  var errBtn2=btn("ebtn",T("ui_ha_detto_si_no_non_2"),function(){
   S.sinonRunning=false;
   if(_sinonTimer){clearInterval(_sinonTimer);_sinonTimer=null;}
   S.sinonTime=180;renderSiNon();
  });errBtn2.style.cssText="width:100%;max-width:280px;background:#e53935;";body.appendChild(errBtn2);
 }

 document.getElementById("root").appendChild(wrap);
}

// ══════════════════════════════════════════
// IL TRADITORE (Lupus in Tabula)
// ══════════════════════════════════════════

var TRAD_ROLES = [
 {id:"lupo", name:" LUPO", plural:"Lupi", color:"#8B0000",
  power:"Ogni notte, insieme agli altri lupi (senza parlare), indicate chi eliminare.",
  win:"Vincete quando i lupi sono in parità numerica con i villici."},
 {id:"veggente", name:" VEGGENTE", plural:"Veggente", color:"#4B0082",
  power:"Ogni notte puoi indicare un giocatore: il narratore ti rivelerà in silenzio se è un lupo o un villico.",
  win:"Vinci con i villici se vengono eliminati tutti i lupi."},
 {id:"medico", name:" MEDICO", plural:"Medico", color:"#006400",
  power:"Ogni notte puoi salvare una persona dall'eliminazione (anche te stesso, ma non la stessa persona due notti di fila).",
  win:"Vinci con i villici se vengono eliminati tutti i lupi."},
 {id:"strega", name:" STREGA", plural:"Strega", color:"#556B2F",
  power:"Hai due pozioni: una per salvare la vittima della notte, una per uccidere un giocatore. Puoi usarne una per notte, ciascuna una sola volta in tutta la partita.",
  win:"Vinci con i villici se vengono eliminati tutti i lupi."},
 {id:"cacciatore", name:" CACCIATORE", plural:"Cacciatore", color:"#8B4513",
  power:"Se vieni eliminato (di notte o di giorno), puoi subito indicare un giocatore da eliminare insieme a te.",
  win:"Vinci con i villici se vengono eliminati tutti i lupi."},
 {id:"cupido", name:" CUPIDO", plural:"Cupido", color:"#C71585",
  power:"La prima notte, indica due giocatori: diventano gli innamorati. Gli innamorati vincono insieme (e muoiono insieme: se uno muore, l'altro muore di crepacuore).",
  win:"Vinci con i villici, salvo che tu sia un innamorato: in quel caso vinci solo se entrambi gli innamorati sopravvivono."},
 {id:"serpe", name:" SERPE", plural:"Serpe", color:"#8B0000",
  power:"Sei un lupo travestito. Il veggente ti vede come villico. Agisci di notte con gli altri lupi.",
  win:"Vinci con i lupi."},
 {id:"guardiaboschi", name:" GUARDIA DEL BOSCO", plural:"Guardia del Bosco", color:"#2E8B57",
  power:"Ogni notte puoi proteggere un giocatore: se i lupi lo attaccano, non viene eliminato. Non puoi proteggere la stessa persona due notti consecutive.",
  win:"Vinci con i villici se vengono eliminati tutti i lupi."},
 {id:"villico", name:" VILLICO", plural:"Villici", color:"#4A4A4A",
  power:"Non hai poteri speciali. Di giorno discuti, ragiona e vota con gli altri per eliminare i sospettati.",
  win:"Vinci se vengono eliminati tutti i lupi."}
];

// Quanti di ogni ruolo in base al numero di giocatori
// [n_giocatori] → {lupo, veggente, medico, strega, cacciatore, cupido, serpe, guardiaboschi, villico}
function tradGetDistribution(n){
 if(n<=6) return {lupo:1,veggente:1,medico:0,strega:0,cacciatore:0,cupido:0,serpe:0,guardiaboschi:0,villico:n-2};
 if(n<=8) return {lupo:2,veggente:1,medico:1,strega:0,cacciatore:0,cupido:0,serpe:0,guardiaboschi:0,villico:n-4};
 if(n<=10) return {lupo:2,veggente:1,medico:1,strega:1,cacciatore:0,cupido:0,serpe:0,guardiaboschi:0,villico:n-5};
 if(n<=12) return {lupo:2,veggente:1,medico:1,strega:1,cacciatore:1,cupido:1,serpe:0,guardiaboschi:0,villico:n-7};
 if(n<=15) return {lupo:3,veggente:1,medico:1,strega:1,cacciatore:1,cupido:1,serpe:1,guardiaboschi:0,villico:n-9};
 return {lupo:3,veggente:1,medico:1,strega:1,cacciatore:1,cupido:1,serpe:1,guardiaboschi:1,villico:n-10};
}

function tradBuildDeck(n){
 var dist=tradGetDistribution(n);
 var deck=[];
 TRAD_ROLES.forEach(function(r){
  var count=dist[r.id]||0;
  for(var i=0;i<count;i++) deck.push(r);
 });
 // Fisher-Yates shuffle
 for(var i=deck.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=deck[i];deck[i]=deck[j];deck[j]=t;}
 return deck;
}

// Ordine dei turni di notte
var TRAD_NIGHT_ORDER=["cupido","serpe","lupo","veggente","medico","strega","cacciatore","guardiaboschi"];

function renderTradSetup(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("ui_indietro"),goBackToGames));
 top.appendChild(btn("card-nav-btn","Esci",goHome));
 hdr.appendChild(div("intesa-title","IL TRADITORE"));
 hdr.appendChild(div("intesa-desc","Quanti giocatori siete?\n(escluso il Narratore)"));
 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:20px;padding:24px 16px;";

 var numWrap=div("");numWrap.style.cssText="display:flex;align-items:center;gap:20px;";
 var minus=btn("trad-num-btn","−",function(){if((S.tradN||6)>6){S.tradN=(S.tradN||6)-1;renderTradSetup();}});
 var numDisp=div("trad-num-disp");numDisp.textContent=(S.tradN||6)+"";
 var plus=btn("trad-num-btn plus","+",function(){S.tradN=(S.tradN||6)+1;renderTradSetup();});
 numWrap.appendChild(minus);numWrap.appendChild(numDisp);numWrap.appendChild(plus);
 body.appendChild(numWrap);

 // Preview ruoli
 var n=S.tradN||6;
 var dist=tradGetDistribution(n);
 var previewWrap=div("");previewWrap.style.cssText="width:100%;max-width:340px;";
 var previewTitle=div("");previewTitle.style.cssText="font-size:12px;font-weight:700;letter-spacing:.08em;color:var(--fg);opacity:.6;text-align:center;margin-bottom:10px;";
 previewTitle.textContent="RUOLI IN GIOCO";
 previewWrap.appendChild(previewTitle);
 TRAD_ROLES.forEach(function(r){
  var count=dist[r.id]||0;
  if(!count)return;
  var row=div("");row.style.cssText="display:flex;justify-content:space-between;align-items:center;padding:6px 12px;border-radius:8px;margin-bottom:4px;background:var(--bg2,rgba(128,128,128,.08));";
  var label=div("");label.style.cssText="font-size:14px;color:"+r.color+";font-weight:600;";
  label.textContent=r.name+" × "+count;
  row.appendChild(label);
  previewWrap.appendChild(row);
 });
 body.appendChild(previewWrap);

 var startBtn=btn("ebtn","DISTRIBUISCI I RUOLI",function(){
  S.tradN=n;
  var deck=tradBuildDeck(n);
  S.tradDeck=deck;
  S.tradPlayers=deck.map(function(r){return {role:r,alive:true};});
  S.tradRound=1;S.tradLastElim=null;S.tradLastElim2=null;S.tradWin=null;S.tradPlayerIdx=0;S.tradRevealed=false;
  S.screen="traditore_role";render();
 });
 startBtn.style.cssText="margin-top:8px;width:100%;max-width:300px;";
 body.appendChild(startBtn);
 document.getElementById("root").appendChild(wrap);
}

function renderTradRole(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var deck=S.tradDeck||[];
 var idx=S.tradPlayerIdx||0;
 var total=deck.length;
 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);

 // Se abbiamo distribuito tutti i ruoli → schermata del narratore
 if(idx>=total){
  var hdr2=div("dhdr");hdr2.style.background=bg;card.appendChild(hdr2);
  var top2=div("dhdr-top");hdr2.appendChild(top2);
  top2.appendChild(btn("card-nav-btn back",T("ui_indietro"),function(){S.tradPlayerIdx=total-1;S.screen="traditore_role";render();}));
  top2.appendChild(btn("card-nav-btn","Esci",goHome));
  hdr2.appendChild(div("intesa-title","NARRATORE"));
  hdr2.appendChild(div("intesa-desc","Tutti i ruoli sono stati distribuiti.\nOra leggi la filastrocca per iniziare la prima notte."));
  var body2=div("dbody");card.appendChild(body2);
  body2.style.cssText="display:flex;flex-direction:column;align-items:center;gap:18px;padding:24px 16px;";

  // Filastrocca
  var filWrap=div("");filWrap.style.cssText="background:rgba(0,0,0,.06);border-radius:14px;padding:20px 18px;width:100%;max-width:400px;";
  var filTitle=div("");filTitle.style.cssText="font-size:11px;font-weight:800;letter-spacing:.1em;opacity:.5;margin-bottom:12px;text-transform:uppercase;";
  filTitle.textContent=" FILASTROCCA DEL NARRATORE";
  filWrap.appendChild(filTitle);
  var filText=div("");filText.style.cssText="font-size:15px;line-height:1.8;font-style:italic;white-space:pre-line;";
  filText.textContent="Cala la notte sul villaggio...\nOgni abitante chiude gli occhi\ne il silenzio avvolge ogni cosa.\n\nMa nell'oscurità si muovono i lupi.\nChi sopravviverà all'alba?";
  filWrap.appendChild(filText);
  body2.appendChild(filWrap);

  // Ordine turni di notte
  var ordWrap=div("");ordWrap.style.cssText="width:100%;max-width:400px;";
  var ordTitle=div("");ordTitle.style.cssText="font-size:11px;font-weight:800;letter-spacing:.1em;opacity:.5;margin-bottom:10px;text-transform:uppercase;";
  ordTitle.textContent=" ORDINE DEI TURNI DI NOTTE";
  ordWrap.appendChild(ordTitle);
  // Solo i ruoli presenti in questa partita
  var dist=tradGetDistribution(total);
  var nightSteps=[];
  TRAD_NIGHT_ORDER.forEach(function(rid){
   if((dist[rid]||0)>0){
    var r=TRAD_ROLES.find(function(x){return x.id===rid;});
    if(r) nightSteps.push(r);
   }
  });
  nightSteps.forEach(function(r,i){
   var row=div("");row.style.cssText="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;margin-bottom:4px;background:var(--bg2,rgba(128,128,128,.08));";
   var num=div("");num.style.cssText="font-size:12px;font-weight:800;opacity:.4;min-width:20px;";num.textContent=(i+1)+".";
   var label=div("");label.style.cssText="font-size:14px;font-weight:700;color:"+r.color+";";label.textContent=r.name;
   row.appendChild(num);row.appendChild(label);
   ordWrap.appendChild(row);
  });
  body2.appendChild(ordWrap);

  var nightBtn=btn("ebtn"," INIZIA LA PRIMA NOTTE",function(){S.screen="traditore_night";render();});
  nightBtn.style.cssText="margin-top:8px;width:100%;max-width:300px;";
  body2.appendChild(nightBtn);
  document.getElementById("root").appendChild(wrap);
  return;
 }

 // Schermata: "Passa il telefono al giocatore N"
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn","Esci",goHome));
 hdr.appendChild(div("intesa-title","GIOCATORE "+(idx+1)+" di "+total));
 hdr.appendChild(div("intesa-desc","Passa il telefono in segreto al giocatore "+(idx+1)+".\nSolo tu guarda il tuo ruolo."));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:20px;padding:24px 16px;";

 if(!S.tradRevealed){
  // Bottone per rivelare il ruolo
  var revBtn=btn("ebtn"," GUARDA IL TUO RUOLO",function(){S.tradRevealed=true;renderTradRole();});
  revBtn.style.cssText="width:100%;max-width:280px;font-size:16px;padding:18px;";
  body.appendChild(revBtn);
 } else {
  // Mostra il ruolo
  var role=deck[idx];
  var roleCard=div("");roleCard.style.cssText="width:100%;max-width:360px;border-radius:18px;padding:24px 20px;text-align:center;background:"+role.color+";color:#fff;";
  var roleName=div("");roleName.style.cssText="font-size:28px;font-weight:900;letter-spacing:.04em;margin-bottom:12px;";
  roleName.textContent=role.name;
  roleCard.appendChild(roleName);
  var rolePow=div("");rolePow.style.cssText="font-size:14px;line-height:1.6;margin-bottom:14px;opacity:.95;";
  rolePow.textContent=" "+role.power;
  roleCard.appendChild(rolePow);
  var roleWin=div("");roleWin.style.cssText="font-size:13px;line-height:1.5;padding-top:12px;border-top:1px solid rgba(255,255,255,.3);opacity:.85;";
  roleWin.textContent=" "+role.win;
  roleCard.appendChild(roleWin);
  body.appendChild(roleCard);

  // Avviso lupi (si conoscono tra loro)
  if(role.id==="lupo"||role.id==="serpe"){
   var lupiInDeck=deck.filter(function(r){return r.id==="lupo"||r.id==="serpe";});
   if(lupiInDeck.length>1){
    var lupoNote=div("");lupoNote.style.cssText="font-size:13px;background:rgba(139,0,0,.12);border-radius:10px;padding:10px 14px;max-width:360px;text-align:center;color:var(--fg);";
    lupoNote.textContent=" Ricordati: questa notte, quando il narratore chiama i lupi, apri gli occhi e guarda in silenzio chi sono i tuoi compagni.";
    body.appendChild(lupoNote);
   }
  }

  var nextBtn=btn("ebtn",idx+1<total?"FATTO — PASSA AL GIOCATORE "+(idx+2)+"":"FATTO — VAI AL NARRATORE",function(){
   S.tradRevealed=false;
   S.tradPlayerIdx=idx+1;
   renderTradRole();
  });
  nextBtn.style.cssText="margin-top:4px;width:100%;max-width:300px;";
  body.appendChild(nextBtn);
 }

 document.getElementById("root").appendChild(wrap);
}

// Helper: conteggio lupi e villici vivi
function tradCountTeams(players){
 var lupi=0,villici=0;
 players.forEach(function(p){
  if(!p.alive) return;
  if(p.role.id==="lupo"||p.role.id==="serpe") lupi++;
  else villici++;
 });
 return {lupi:lupi,villici:villici};
}

// Controlla vittoria: restituisce "lupi","villici","innamorati" o null
function tradCheckWin(players){
 var t=tradCountTeams(players);
 if(t.lupi===0) return "villici";
 if(t.lupi>=t.villici) return "lupi";
 // Innamorati: se sono gli unici due vivi
 var vivi=players.filter(function(p){return p.alive;});
 if(vivi.length===2&&vivi[0].innamorato&&vivi[1].innamorato) return "innamorati";
 return null;
}

function tradPlayerName(i){return "Giocatore "+(i+1);}

// ── NOTTE ──
function renderTradNight(){
 clr();
 var players=S.tradPlayers;
 var round=S.tradRound||1;
 var isFirst=round===1;
 // Costruisci nightSteps dai ruoli vivi in questa partita
 var NIGHT_SCRIPTS={
  cupido:function(){return " Cupido, apri gli occhi. Indica due giocatori: diventeranno gli innamorati — vinceranno e moriranno insieme. Cupido, chiudi gli occhi.";},
  lupo:function(){
   var lupiVivi=players.filter(function(p){return p.alive&&(p.role.id==="lupo"||p.role.id==="serpe");});
   return " Lupi, aprite gli occhi."+(lupiVivi.length>1?" Guardatevi in silenzio.":"")+" Indicate chi volete eliminare stanotte. Lupi, chiudete gli occhi.";
  },
  veggente:function(){return " Veggente, apri gli occhi. Indica un giocatore: annuirò se è un lupo , scuoterò la testa se è innocente. Veggente, chiudi gli occhi.";},
  medico:function(){return " Medico, apri gli occhi. Indica chi vuoi salvare stanotte (anche te stesso, ma non la stessa persona due notti di fila). Medico, chiudi gli occhi.";},
  strega:function(){return " Strega, apri gli occhi. [Mostrali chi è stato attaccato.] Vuoi usare la pozione salvavita? Vuoi usare la pozione della morte su qualcun altro? Strega, chiudi gli occhi.";},
  guardiaboschi:function(){return " Guardia del Bosco, apri gli occhi. Indica chi vuoi proteggere stanotte (non la stessa persona due notti di fila). Guardia del Bosco, chiudi gli occhi.";}
 };
 var nightOrder=isFirst?["cupido","lupo","veggente","medico","strega","guardiaboschi"]:["lupo","veggente","medico","strega","guardiaboschi"];
 var steps=[];
 nightOrder.forEach(function(rid){
  var alive=players.some(function(p){return p.alive&&p.role.id===rid;});
  // serpe conta come lupo
  if(rid==="lupo"){
   var hasLupo=players.some(function(p){return p.alive&&(p.role.id==="lupo"||p.role.id==="serpe");});
   if(hasLupo) steps.push({rid:"lupo",script:NIGHT_SCRIPTS.lupo()});
  } else if(NIGHT_SCRIPTS[rid]&&alive){
   steps.push({rid:rid,script:NIGHT_SCRIPTS[rid]()});
  }
 });

 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background="#1a1a2e";card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn","Esci",goHome));
 hdr.appendChild(div("intesa-title"," NOTTE "+(round)));
 hdr.appendChild(div("intesa-desc","Tutti chiudono gli occhi.\nLeggi ad alta voce ogni passo."));
 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;gap:10px;padding:20px 16px;";

 // Giocatori vivi
 var viviWrap=div("");viviWrap.style.cssText="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px;";
 players.forEach(function(p,i){
  if(!p.alive) return;
  var badge=div("");badge.style.cssText="font-size:12px;padding:4px 10px;border-radius:20px;background:rgba(255,255,255,.1);color:#fff;";
  badge.textContent=tradPlayerName(i);
  viviWrap.appendChild(badge);
 });
 body.appendChild(viviWrap);

 steps.forEach(function(s,i){
  var roleObj=TRAD_ROLES.find(function(x){return x.id===s.rid;})||{color:"#888",plural:s.rid};
  var step=div("");step.style.cssText="border-radius:12px;padding:14px 16px;background:rgba(255,255,255,.05);border-left:4px solid "+roleObj.color+";";
  var stepNum=div("");stepNum.style.cssText="font-size:11px;font-weight:800;letter-spacing:.08em;opacity:.5;margin-bottom:6px;color:#fff;";
  stepNum.textContent="PASSO "+(i+1)+(roleObj.plural?" · "+roleObj.plural.toUpperCase():"");
  step.appendChild(stepNum);
  var sc=div("");sc.style.cssText="font-size:14px;line-height:1.65;color:#eee;";
  sc.textContent=s.script;
  step.appendChild(sc);
  body.appendChild(step);
 });

 var hasCupido=players.some(function(p){return p.alive&&p.role.id==="cupido";});
 var albaLabel=(round===1&&hasCupido&&!S.tradInnamoratiSet)?" CUPIDO HA SCELTO — SEGNA GLI INNAMORATI":" ALBA — CHI È STATO ELIMINATO?";
 var albaBtn=btn("ebtn",albaLabel,function(){
  if(round===1&&hasCupido&&!S.tradInnamoratiSet){S.screen="traditore_cupido";render();}
  else{S.screen="traditore_dawn";render();}
 });
 albaBtn.style.cssText="margin-top:12px;width:100%;max-width:340px;align-self:center;";
 body.appendChild(albaBtn);
 document.getElementById("root").appendChild(wrap);
}

// ── CUPIDO: segna i due innamorati (solo notte 1) ──
function renderTradCupido(){
 clr();
 var players=S.tradPlayers;
 if(!S.tradCupidoSel) S.tradCupidoSel=[];
 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background="#C71585";card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn","Esci",goHome));
 hdr.appendChild(div("intesa-title"," CUPIDO"));
 hdr.appendChild(div("intesa-desc","Seleziona i due giocatori che Cupido ha indicato come innamorati."));
 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;gap:8px;padding:20px 16px;";
 players.forEach(function(p,i){
  if(!p.alive) return;
  var sel=S.tradCupidoSel.indexOf(i)>=0;
  var b=btn("ebtn"+(sel?" ":" out"),tradPlayerName(i)+(sel?" ":""),function(idx){return function(){
   var s=S.tradCupidoSel;
   var pos=s.indexOf(idx);
   if(pos>=0){s.splice(pos,1);}
   else if(s.length<2){s.push(idx);}
   renderTradCupido();
  };}(i));
  b.style.cssText="width:100%;max-width:340px;";
  body.appendChild(b);
 });
 var confBtn=btn("ebtn","CONFERMA GLI INNAMORATI",function(){
  var s=S.tradCupidoSel;
  if(s.length===2){
   players[s[0]].innamorato=s[1];
   players[s[1]].innamorato=s[0];
   S.tradInnamoratiSet=true;
   S.tradCupidoSel=[];
   S.screen="traditore_dawn";render();
  }
 });
 confBtn.style.cssText="margin-top:8px;width:100%;max-width:340px;"+(S.tradCupidoSel.length===2?"":"opacity:.45;pointer-events:none;");
 body.appendChild(confBtn);
 document.getElementById("root").appendChild(wrap);
}

// ── ALBA: scelta di chi è stato eliminato ──
function renderTradDawn(){
 clr();
 var players=S.tradPlayers;
 var round=S.tradRound||1;
 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background="#b5400a";card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn","Esci",goHome));
 hdr.appendChild(div("intesa-title"," ALBA — Notte "+round));
 hdr.appendChild(div("intesa-desc","Chi è stato eliminato stanotte?\n(nessuno se il medico ha salvato)"));
 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;gap:8px;padding:20px 16px;";

 // Bottone "Nessuno eliminato"
 var nessuno=btn("ebtn out","Nessuno — tutti salvi",function(){
  S.tradLastElim=null;
  S.screen="traditore_day";render();
 });
 nessuno.style.cssText="width:100%;max-width:340px;margin-bottom:8px;";
 body.appendChild(nessuno);

 var sep=div("");sep.style.cssText="font-size:11px;font-weight:700;letter-spacing:.08em;opacity:.5;text-align:center;margin:4px 0;";
 sep.textContent="OPPURE SELEZIONA IL GIOCATORE ELIMINATO";
 body.appendChild(sep);

 players.forEach(function(p,i){
  if(!p.alive) return;
  var b=btn("ebtn out",tradPlayerName(i),function(idx){return function(){
   players[idx].alive=false;
   S.tradLastElim=idx;
   // Se innamorato muore, muore anche l'altro
   if(players[idx].innamorato!==undefined){
    var partner=players[idx].innamorato;
    if(players[partner]&&players[partner].alive){
     players[partner].alive=false;
     S.tradLastElim2=partner;
    }
   }
   var win=tradCheckWin(players);
   if(win){S.tradWin=win;S.screen="traditore_win";render();}
   else{S.screen="traditore_day";render();}
  };}(i));
  b.style.cssText="width:100%;max-width:340px;";
  body.appendChild(b);
 });
 document.getElementById("root").appendChild(wrap);
}

// ── GIORNO: dibattito e voto ──
function renderTradDay(){
 clr();
 var players=S.tradPlayers;
 var round=S.tradRound||1;
 var lastElim=S.tradLastElim;
 var lastElim2=S.tradLastElim2;
 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background="#c8a84b";card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn","Esci",goHome));
 hdr.appendChild(div("intesa-title"," GIORNO "+(round)));

 // Annuncio eliminati
 var msg="";
 if(lastElim===null||lastElim===undefined){msg="Nessuno è stato eliminato stanotte.";}
 else{
  msg="Questa notte è stato eliminato: "+tradPlayerName(lastElim)+".";
  if(lastElim2!==undefined&&lastElim2!==null) msg+=" Di crepacuore muore anche "+tradPlayerName(lastElim2)+".";
 }
 hdr.appendChild(div("intesa-desc",msg));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;gap:10px;padding:20px 16px;";

 // Giocatori vivi
 var viviTitle=div("");viviTitle.style.cssText="font-size:11px;font-weight:800;letter-spacing:.08em;opacity:.5;";viviTitle.textContent="GIOCATORI ANCORA IN GIOCO";
 body.appendChild(viviTitle);
 var viviWrap=div("");viviWrap.style.cssText="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;";
 players.forEach(function(p,i){
  if(!p.alive) return;
  var badge=div("");badge.style.cssText="font-size:13px;padding:6px 12px;border-radius:20px;background:var(--dark);color:#fff;font-weight:600;";
  badge.textContent=tradPlayerName(i);
  viviWrap.appendChild(badge);
 });
 body.appendChild(viviWrap);

 var dibTitle=div("");dibTitle.style.cssText="font-size:14px;line-height:1.6;padding:12px 16px;background:rgba(200,168,75,.12);border-radius:10px;border-left:4px solid #c8a84b;";
 dibTitle.textContent=" Apri il dibattito: ognuno ha la parola per accusare, difendersi e convincere. Quando siete pronti, votate a maggioranza chi eliminare.";
 body.appendChild(dibTitle);

 var votoTitle=div("");votoTitle.style.cssText="font-size:11px;font-weight:800;letter-spacing:.08em;opacity:.5;margin-top:8px;";votoTitle.textContent="VOTO — CHI VIENE ELIMINATO DAL VILLAGGIO?";
 body.appendChild(votoTitle);

 players.forEach(function(p,i){
  if(!p.alive) return;
  var b=btn("ebtn out",tradPlayerName(i)+" viene eliminato",function(idx){return function(){
   players[idx].alive=false;
   S.tradLastElim=null;S.tradLastElim2=null;
   // Morte per crepacuore innamorato
   if(players[idx].innamorato!==undefined){
    var partner=players[idx].innamorato;
    if(players[partner]&&players[partner].alive){
     players[partner].alive=false;
     S.tradDayElim2=partner;
    }
   }
   // Cacciatore: se il cacciatore viene eliminato di giorno, mostra schermata cacciatore
   if(players[idx].role.id==="cacciatore"){
    S.tradCacciatore=idx;
    S.tradDayElim=idx;
    S.screen="traditore_cacciatore";render();return;
   }
   var win=tradCheckWin(players);
   if(win){S.tradWin=win;S.screen="traditore_win";render();}
   else{S.tradRound=(S.tradRound||1)+1;S.tradLastElim=null;S.tradLastElim2=null;S.screen="traditore_night";render();}
  };}(i));
  b.style.cssText="width:100%;max-width:340px;";
  body.appendChild(b);
 });

 // Patta: nessuno viene eliminato
 var patta=btn("ebtn out","Nessuno — il villaggio non trova accordo",function(){
  S.tradRound=(S.tradRound||1)+1;
  S.tradLastElim=null;S.tradLastElim2=null;
  S.screen="traditore_night";render();
 });
 patta.style.cssText="width:100%;max-width:340px;margin-top:4px;font-size:13px;opacity:.7;";
 body.appendChild(patta);
 document.getElementById("root").appendChild(wrap);
}

// ── CACCIATORE eliminato: sceglie chi portare con sé ──
function renderTradCacciatore(){
 clr();
 var players=S.tradPlayers;
 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background="#8B4513";card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn","Esci",goHome));
 hdr.appendChild(div("intesa-title"," CACCIATORE"));
 hdr.appendChild(div("intesa-desc","Il Cacciatore è stato eliminato!\nPuò portare con sé un altro giocatore."));
 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;gap:8px;padding:20px 16px;";

 var skip=btn("ebtn out","Rinuncia al colpo finale",function(){
  var win=tradCheckWin(players);
  if(win){S.tradWin=win;S.screen="traditore_win";render();}
  else{S.tradRound=(S.tradRound||1)+1;S.tradLastElim=null;S.tradLastElim2=null;S.screen="traditore_night";render();}
 });
 skip.style.cssText="width:100%;max-width:340px;margin-bottom:6px;";
 body.appendChild(skip);

 players.forEach(function(p,i){
  if(!p.alive||i===S.tradCacciatore) return;
  var b=btn("ebtn out","Elimina "+tradPlayerName(i),function(idx){return function(){
   players[idx].alive=false;
   if(players[idx].innamorato!==undefined){
    var partner=players[idx].innamorato;
    if(players[partner]&&players[partner].alive) players[partner].alive=false;
   }
   var win=tradCheckWin(players);
   if(win){S.tradWin=win;S.screen="traditore_win";render();}
   else{S.tradRound=(S.tradRound||1)+1;S.tradLastElim=null;S.tradLastElim2=null;S.screen="traditore_night";render();}
  };}(i));
  b.style.cssText="width:100%;max-width:340px;";
  body.appendChild(b);
 });
 document.getElementById("root").appendChild(wrap);
}

// ── VITTORIA ──
function renderTradWin(){
 clr();
 var win=S.tradWin;
 var players=S.tradPlayers;
 var bgMap={villici:"#2E7D32",lupi:"#8B0000",innamorati:"#C71585"};
 var titleMap={villici:" VINCONO I VILLICI!",lupi:" VINCONO I LUPI!",innamorati:" VINCONO GLI INNAMORATI!"};
 var msgMap={
  villici:"I lupi sono stati smascherati. Il villaggio è salvo!",
  lupi:"I lupi hanno conquistato il villaggio. Il traditore ha vinto!",
  innamorati:"Gli innamorati sono sopravvissuti insieme. L'amore ha trionfato!"
 };
 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bgMap[win]||"#333";card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn","Esci",goHome));
 hdr.appendChild(div("intesa-title",titleMap[win]||"FINE PARTITA"));
 hdr.appendChild(div("intesa-desc",msgMap[win]||""));
 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;gap:10px;padding:20px 16px;";

 // Rivela i ruoli di tutti
 var revTitle=div("");revTitle.style.cssText="font-size:11px;font-weight:800;letter-spacing:.08em;opacity:.5;margin-bottom:4px;";revTitle.textContent="I RUOLI DI TUTTI";
 body.appendChild(revTitle);
 players.forEach(function(p,i){
  var row=div("");row.style.cssText="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-radius:10px;margin-bottom:4px;background:var(--bg2,rgba(128,128,128,.08));opacity:"+(p.alive?"1":".5")+";";
  var name=div("");name.style.cssText="font-size:14px;font-weight:600;";name.textContent=tradPlayerName(i)+(p.alive?"":" ");
  var roleLabel=div("");roleLabel.style.cssText="font-size:13px;font-weight:700;color:"+p.role.color+";";roleLabel.textContent=p.role.name+(p.innamorato!==undefined?" ":"");
  row.appendChild(name);row.appendChild(roleLabel);
  body.appendChild(row);
 });

 var rigiocaBtn=btn("ebtn","GIOCA ANCORA",function(){
  S.tradDeck=tradBuildDeck(players.length);
  S.tradPlayers=null;S.tradRound=1;S.tradLastElim=null;S.tradLastElim2=null;S.tradWin=null;S.tradPlayerIdx=0;S.tradRevealed=false;
  S.screen="traditore_role";render();
 });
 rigiocaBtn.style.cssText="margin-top:12px;width:100%;max-width:300px;align-self:center;";
 body.appendChild(rigiocaBtn);
 document.getElementById("root").appendChild(wrap);
}

// ══════════════════════════════════════════

function renderQvSetup(){
 // Collegamento a distanza: stessa interfaccia di Indovina il codice
 if(typeof qvrLobby==="function"){
  if(S.qvMode==='distanza'&&fbRoomCode){qvrLobby();return;}
  if(S.cat==='relax'){S.qvMode='locale';qvrStartScreen();return;}
 }
 clr();
 var cat=getCatById(S.cat);
 var wrap=div("intesa-wrap intesa-setup");
 var hdr=div("dhdr");hdr.style.background=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var dhdrTop=div("dhdr-top");hdr.appendChild(dhdrTop);
 dhdrTop.appendChild(btn("card-nav-btn back",T("backBtn"),goBackToGames));
 dhdrTop.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 hdr.appendChild(div("dtitle",T("qvTitle")));
 var card=div("dcard");card.appendChild(hdr);
 var body=div("dbody");card.appendChild(body);

 // ── STATO DISTANZA: HOST in attesa ──
 if(S.qvMode==='distanza' && fbRoomCode && fbIsHost){
  var waitTitle=document.createElement("div");
  waitTitle.style.cssText="font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#aaa;text-align:center;margin:20px 0 6px;";
  waitTitle.textContent=T("ui_in_attesa_degli_altri");
  body.appendChild(waitTitle);

  var playersDiv=document.createElement("div");
  playersDiv.id="qv-players-list";
  playersDiv.style.cssText="text-align:center;font-size:15px;color:#444;min-height:32px;margin-bottom:20px;font-weight:500;";
  playersDiv.textContent=T("ui_nessun_giocatore_ancora");
  body.appendChild(playersDiv);

  if(fbDB && !window._qvPlayersListening){
   window._qvPlayersListening=true;
   fbOnValue(fbRef(fbDB,'rooms/'+fbRoomCode+'/qv_players'),function(snap){
    var pl=snap.val();
    var el=document.getElementById("qv-players-list");
    if(!el){window._qvPlayersListening=false;return;}
    if(pl){
     var names=Object.keys(pl);
     el.innerHTML='<span style="font-weight:700;color:var(--dark);">'+names.join(" · ")+'</span>';
    } else {
     el.textContent=T("ui_nessun_giocatore_ancora");
    }
   });
  }

  var startBtn=document.createElement("button");
  startBtn.style.cssText="width:100%;padding:16px;background:var(--dark);color:#fff;border:none;border-radius:16px;font-family:inherit;font-weight:800;font-size:18px;cursor:pointer;margin-top:4px;";
  startBtn.textContent=T("ui_inizia_3");
  startBtn.onclick=function(){
   if(!fbDB||!fbRoomCode)return;
   fbGet(fbRef(fbDB,'rooms/'+fbRoomCode+'/qv_players')).then(function(snap){
    var pl=snap.val()||{};
    var playerNames=Object.keys(pl);
    if(playerNames.length<2){alert(T("ui_aspetta_che_si_colleghi_almeno"));return;}
    window._qvPlayersListening=false;
    startQuantoValeDistanza(playerNames);
   });
  };
  body.appendChild(startBtn);

  var leaveBtn=document.createElement("button");
  leaveBtn.style.cssText="width:100%;padding:10px;background:transparent;border:none;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;color:#bbb;margin-top:14px;";
  leaveBtn.textContent=T("ui_annulla_sfida");
  leaveBtn.onclick=function(){window._qvPlayersListening=false;fbLeaveRoom();S.qvMode='locale';renderQvSetup();};
  body.appendChild(leaveBtn);

 // ── STATO DISTANZA: CLIENT in attesa ──
 } else if(S.qvMode==='distanza' && fbRoomCode && !fbIsHost){
  var clientTitle=document.createElement("div");
  clientTitle.style.cssText="font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#aaa;text-align:center;margin:20px 0 6px;";
  clientTitle.textContent=T("ui_connesso");
  body.appendChild(clientTitle);

  var waitMsg=document.createElement("div");
  waitMsg.style.cssText="text-align:center;font-size:16px;color:#666;margin-bottom:24px;";
  waitMsg.textContent=T("ui_aspetta_che_l_altro_giocatore");
  body.appendChild(waitMsg);

  var discBtn=document.createElement("button");
  discBtn.style.cssText="width:100%;padding:10px;background:transparent;border:none;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;color:#bbb;margin-top:8px;";
  discBtn.textContent=T("ui_esci_dalla_stanza");
  discBtn.onclick=function(){fbLeaveRoom();S.qvMode='locale';renderQvSetup();};
  body.appendChild(discBtn);

 // ── SCHERMATA PRINCIPALE: selezione giocatori ──
 } else {
  // Numero giocatori: stepper
  if(!S.qvNumPlayers)S.qvNumPlayers=1;
  var selectedNum=S.qvNumPlayers;

  var numLabel=document.createElement("div");
  numLabel.style.cssText="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#aaa;text-align:center;margin:20px 0 14px;";
  numLabel.textContent=T("ui_quanti_siete");
  body.appendChild(numLabel);

  var stepper=document.createElement("div");
  stepper.style.cssText="display:flex;align-items:center;justify-content:center;gap:0;margin-bottom:24px;";

  var minusBtn=document.createElement("button");
  minusBtn.style.cssText="width:48px;height:48px;border-radius:50%;border:2px solid #e0e0e0;background:#fff;font-size:24px;font-weight:300;cursor:pointer;color:#555;display:flex;align-items:center;justify-content:center;font-family:inherit;";
  minusBtn.textContent="−";
  minusBtn.onclick=function(){if(S.qvNumPlayers>1){S.qvNumPlayers--;renderQvSetup();}};

  var numDisp=document.createElement("div");
  numDisp.style.cssText="width:72px;text-align:center;font-size:40px;font-weight:900;color:var(--dark);font-family:'Space Grotesk',sans-serif;";
  numDisp.textContent=selectedNum;

  var plusBtn=document.createElement("button");
  plusBtn.style.cssText="width:48px;height:48px;border-radius:50%;border:2px solid #e0e0e0;background:#fff;font-size:24px;font-weight:300;cursor:pointer;color:#555;display:flex;align-items:center;justify-content:center;font-family:inherit;";
  plusBtn.textContent="+";
  plusBtn.onclick=function(){S.qvNumPlayers++;renderQvSetup();};

  stepper.appendChild(minusBtn);stepper.appendChild(numDisp);stepper.appendChild(plusBtn);
  body.appendChild(stepper);

  // Nomi giocatori
  var namesGrid=div("player-names-grid");
  var inputs=[];
  for(var i=0;i<selectedNum;i++){
   (function(pidx){
    var row=div("player-name-row");
    var lbl=div("player-name-label");lbl.textContent=T("qvPlayer")+(pidx+1);row.appendChild(lbl);
    var inp=document.createElement("input");
    inp.type="text";inp.className="player-name-input";
    inp.placeholder=T("playerNamePH")+(pidx+1);inp.maxLength=16;
    if(S.qvPlayerNames&&S.qvPlayerNames[pidx])inp.value=S.qvPlayerNames[pidx];
    row.appendChild(inp);inputs.push(inp);
    namesGrid.appendChild(row);
   })(i);
  }
  body.appendChild(namesGrid);

  // INIZIA (locale)
  var startWrap=div("");startWrap.style.cssText="text-align:center;margin-top:20px;";
  startWrap.appendChild(btn("ebtn",T("qvStart"),function(){
   var names=inputs.map(function(inp,i){return inp.value.trim()||(T("qvPlayer")+(i+1));});
   S.qvPlayerNames=names;
   S.qvNumPlayers=selectedNum;
   S.qvDistanza=false;
   startQuantoVale(names);
  }));
  body.appendChild(startWrap);

  // SFIDA UN ALTRO TAVOLO
  if(fbDB){
   var sfidaSep=document.createElement("div");
   sfidaSep.style.cssText="display:flex;align-items:center;gap:10px;margin:20px 0 16px;";
   sfidaSep.innerHTML='<div style="flex:1;height:1px;background:#eee;"></div><span style="font-size:12px;color:#ccc;font-weight:600;white-space:nowrap;">'+T("ui_oppure_qv")+'</span><div style="flex:1;height:1px;background:#eee;"></div>';
   body.appendChild(sfidaSep);

   var sfidaBtn=document.createElement("button");
   sfidaBtn.style.cssText="width:100%;padding:14px;background:#fff;color:#555;border:1.5px solid #e0e0e0;border-radius:14px;font-family:inherit;font-weight:700;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;";
   sfidaBtn.innerHTML='<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2a8 8 0 1 1 0 16A8 8 0 0 1 10 2z" stroke="#aaa" stroke-width="1.8"/><path d="M6 10h8M10 6v8" stroke="#aaa" stroke-width="1.8" stroke-linecap="round"/></svg><span></span>';sfidaBtn.querySelector("span").textContent=T("ui_sfida_un_altro_tavolo");

   var sfidaHint=document.createElement("div");
   sfidaHint.style.cssText="font-size:12px;color:#c0c0c0;text-align:center;margin-top:8px;margin-bottom:4px;";
   sfidaHint.textContent=T("ui_gli_altri_dispositivi_riceveranno_una");

   sfidaBtn.onclick=function(){
    sfidaBtn.disabled=true;
    sfidaBtn.style.opacity="0.5";
    sfidaBtn.querySelector("span").textContent=T("ui_invio_sfida");
    sendQvChallenge(function(code){
     S.qvMode='distanza';
     renderQvSetup();
    });
   };
   body.appendChild(sfidaBtn);
   body.appendChild(sfidaHint);
  }
 }

 wrap.appendChild(card);
 document.getElementById("root").appendChild(wrap);
}
function renderChiPaga(){
 clr();
 document.body.style.overflow='hidden';
 document.body.style.userSelect='none';
 document.body.style.webkitUserSelect='none';

 var wrap=document.createElement('div');
 wrap.style.cssText='position:fixed;inset:0;background:#1a0000;touch-action:none;overflow:hidden;font-family:inherit;';
 document.getElementById('root').appendChild(wrap);

 // Canvas per esplosione
 var canvas=document.createElement('canvas');
 canvas.width=window.innerWidth;canvas.height=window.innerHeight;
 canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
 wrap.appendChild(canvas);
 var ctx=canvas.getContext('2d');
 window.addEventListener('resize',function(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;});

 // Messaggio centrale
 var msgEl=document.createElement('div');
 msgEl.style.cssText='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:clamp(18px,4.5vw,28px);font-weight:700;text-align:center;color:rgba(255,255,255,0.25);line-height:1.4;white-space:pre-line;pointer-events:none;transition:opacity 0.4s;width:80%;';
 msgEl.textContent=T('chiPagaInstr');
 wrap.appendChild(msgEl);

 // Conto alla rovescia
 var cdEl=document.createElement('div');
 cdEl.style.cssText='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:clamp(100px,30vw,180px);font-weight:900;color:#cc0000;opacity:0;transition:opacity 0.2s;pointer-events:none;font-family:"Space Grotesk",sans-serif;text-shadow:0 0 60px rgba(200,0,0,0.8);';
 wrap.appendChild(cdEl);

 // Back button
 var backBtn2=document.createElement('button');
 backBtn2.style.cssText='position:absolute;top:env(safe-area-inset-top,16px);left:16px;padding:10px 16px;background:transparent;color:rgba(255,255,255,0.3);border:none;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:.05em;z-index:20;';
 backBtn2.textContent=T('chiPagaBack');
 backBtn2.onclick=function(){cleanup();document.body.style.overflow='';document.body.style.userSelect='';document.body.style.webkitUserSelect='';S.screen='games';render();};
 wrap.appendChild(backBtn2);

 // Banner perdente
 var banner=document.createElement('div');
 banner.style.cssText='position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.88);opacity:0;pointer-events:none;transition:opacity 0.6s;gap:12px;padding:40px;z-index:15;';
 wrap.appendChild(banner);

 var bLabel=document.createElement('div');
 bLabel.style.cssText='font-size:13px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,0.4);';
 bLabel.textContent=T('chiPagaLoser');
 banner.appendChild(bLabel);

 var bName=document.createElement('div');
 bName.style.cssText='font-size:clamp(60px,18vw,120px);font-weight:900;color:#ff2222;text-align:center;line-height:1;letter-spacing:-.03em;text-shadow:0 0 40px rgba(255,30,30,0.7);';
 banner.appendChild(bName);

 var bSub=document.createElement('div');
 bSub.style.cssText='font-size:clamp(16px,4vw,22px);color:rgba(255,255,255,0.6);text-align:center;margin-top:8px;';
 bSub.textContent=T('chiPagaSub');
 banner.appendChild(bSub);

 var rBtn=document.createElement('button');
 rBtn.style.cssText='margin-top:28px;padding:16px 44px;background:#cc0000;color:#fff;border:none;border-radius:100px;font-family:inherit;font-size:17px;font-weight:800;cursor:pointer;pointer-events:auto;letter-spacing:.05em;';
 rBtn.textContent=T('chiPagaRestart');
 rBtn.onclick=resetGame;
 rBtn.ontouchend=function(ev){ev.stopPropagation();resetGame();};
 banner.appendChild(rBtn);

 // Stato
 var phase='waiting';
 var touches2={};
 var cdVal=4;
 var cdTimer=null;
 var loserTouchId=null;
 var animId=null;
 var particles=[];
 var shakeT=0;

 // — Bottoni DOM per ogni touch —
 var btns={}; // id → elemento DOM

 function makeBtnEl(id, x, y){
  var outer=document.createElement('div');
  var R=56; // raggio base
  outer.dataset.tid=id;
  outer.style.cssText='position:absolute;left:'+(x-R)+'px;top:'+(y-R)+'px;width:'+(R*2)+'px;height:'+(R*2*1.35)+'px;pointer-events:none;';

  // Cilindro corpo (parte superiore rossa)
  var body=document.createElement('div');
  body.className='cpbody';
  body.style.cssText=[
   'position:absolute;left:0;right:0;',
   'top:0;height:'+Math.round(R*0.55)+'px;',
   'background:radial-gradient(ellipse at 35% 30%, #ff4444 0%, #cc0000 55%, #880000 100%);',
   'border-radius:'+R+'px '+R+'px 0 0;',
   'box-shadow:inset 0 6px 14px rgba(255,120,120,0.35), inset 0 -4px 8px rgba(0,0,0,0.4);',
   'transition:height 0.08s, top 0.08s;'
  ].join('');
  outer.appendChild(body);

  // Ellisse top
  var top=document.createElement('div');
  top.className='cptop';
  top.style.cssText=[
   'position:absolute;left:0;right:0;',
   'top:-'+Math.round(R*0.22)+'px;',
   'height:'+Math.round(R*0.44)+'px;',
   'background:radial-gradient(ellipse at 40% 30%, #ff6666 0%, #dd1111 60%, #990000 100%);',
   'border-radius:50%;',
   'box-shadow:0 4px 18px rgba(200,0,0,0.7), inset 0 3px 8px rgba(255,150,150,0.4);',
   'transition:top 0.08s;'
  ].join('');
  outer.appendChild(top);

  // Pedana base scura
  var base=document.createElement('div');
  base.style.cssText=[
   'position:absolute;left:-6px;right:-6px;',
   'bottom:0;height:'+Math.round(R*0.55)+'px;',
   'background:linear-gradient(180deg,#3a0000 0%,#1a0000 100%);',
   'border-radius:0 0 '+(R+6)+'px '+(R+6)+'px;',
   'box-shadow:0 8px 24px rgba(0,0,0,0.8);'
  ].join('');
  outer.appendChild(base);

  wrap.insertBefore(outer,canvas);
  return outer;
 }

 function pressBtnEl(el, pressed){
  var body=el.querySelector('.cpbody');
  var top=el.querySelector('.cptop');
  var R=56;
  if(pressed){
   body.style.height=Math.round(R*0.35)+'px';
   body.style.top=Math.round(R*0.18)+'px';
   top.style.top='-'+Math.round(R*0.13)+'px';
  } else {
   body.style.height=Math.round(R*0.55)+'px';
   body.style.top='0px';
   top.style.top='-'+Math.round(R*0.22)+'px';
  }
 }

 function removeBtnEl(id){
  if(btns[id]){btns[id].remove();delete btns[id];}
 }

 function onTouchStart(ev){
  ev.preventDefault();
  if(phase==='result')return;
  for(var i=0;i<ev.changedTouches.length;i++){
   var t=ev.changedTouches[i];
   if(!touches2[t.identifier]){
    touches2[t.identifier]={x:t.clientX,y:t.clientY,alive:true,name:'P'+(Object.keys(touches2).length+1)};
    btns[t.identifier]=makeBtnEl(t.identifier,t.clientX,t.clientY);
    pressBtnEl(btns[t.identifier],true);
   }
  }
  if(phase==='countdown'){resetCd();phase='waiting';}
  updateMsg();
 }

 function onTouchMove(ev){
  ev.preventDefault();
  for(var i=0;i<ev.changedTouches.length;i++){
   var t=ev.changedTouches[i];
   if(touches2[t.identifier]){
    touches2[t.identifier].x=t.clientX;
    touches2[t.identifier].y=t.clientY;
    if(btns[t.identifier]){
     var R=56;
     btns[t.identifier].style.left=(t.clientX-R)+'px';
     btns[t.identifier].style.top=(t.clientY-R)+'px';
    }
   }
  }
 }

 function onTouchEnd(ev){
  ev.preventDefault();
  if(phase==='result')return;
  for(var i=0;i<ev.changedTouches.length;i++){
   var id=ev.changedTouches[i].identifier;
   removeBtnEl(id);
   delete touches2[id];
  }
  if(phase==='countdown'){resetCd();phase='waiting';}
  updateMsg();
 }

 wrap.addEventListener('touchstart',onTouchStart,{passive:false});
 wrap.addEventListener('touchmove',onTouchMove,{passive:false});
 wrap.addEventListener('touchend',onTouchEnd,{passive:false});
 wrap.addEventListener('touchcancel',onTouchEnd,{passive:false});

 function updateMsg(){
  var n=Object.keys(touches2).length;
  if(n===0){msgEl.textContent=T('chiPagaInstr');msgEl.style.opacity='1';cdEl.style.opacity='0';}
  else if(n===1){msgEl.textContent=T('chiPagaWait');msgEl.style.opacity='1';}
  else{msgEl.style.opacity='0';startCd();}
 }

 function startCd(){
  if(phase==='countdown')return;
  phase='countdown';cdVal=4;cdEl.style.opacity='1';cdEl.textContent=cdVal;tickCd();
 }
 function tickCd(){
  cdTimer=setTimeout(function(){
   cdVal--;
   if(cdVal>0){cdEl.textContent=cdVal;tickCd();}
   else{cdEl.style.opacity='0';pickLoser();}
  },1000);
 }
 function resetCd(){clearTimeout(cdTimer);cdEl.style.opacity='0';cdEl.textContent='';cdVal=4;}

 function pickLoser(){
  phase='result';
  var ids=Object.keys(touches2);
  if(!ids.length){resetGame();return;}
  var loserId=ids[Math.floor(Math.random()*ids.length)];
  loserTouchId=loserId;
  // Rimuovi tutti tranne il perdente
  for(var id in btns){
   if(id!=loserId){removeBtnEl(id);}
   else{
    // Il perdente: animazione shake + rimane su
    pressBtnEl(btns[id],false);
   }
  }
  // Scatta esplosione dopo 0.6s
  setTimeout(function(){
   var lt=touches2[loserId];
   if(lt){spawnExplosion(lt.x,lt.y);}
   shakeT=1;
   setTimeout(function(){
    removeBtnEl(loserId);
    banner.style.opacity='1';banner.style.pointerEvents='auto';
    var idx2=1;for(var id in touches2){touches2[id].name='P'+idx2;idx2++;}
    if(touches2[loserId]) bName.textContent=touches2[loserId].name;
   },600);
  },600);
 }

 function spawnExplosion(cx,cy){
  for(var i=0;i<120;i++){
   var angle=Math.random()*Math.PI*2;
   var speed=60+Math.random()*260;
   var size=3+Math.random()*10;
   var hue=Math.random()<0.7?(Math.random()*30):(180+Math.random()*60);
   particles.push({
    x:cx,y:cy,
    vx:Math.cos(angle)*speed,
    vy:Math.sin(angle)*speed,
    size:size,life:1,
    decay:0.012+Math.random()*0.018,
    color:'hsl('+hue+',90%,'+(45+Math.random()*25)+'%)',
    gravity:120+Math.random()*80
   });
  }
 }

 function animate(ts){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  var dt=0.016;

  // Sfondo che pulsa rosso durante il countdown
  if(phase==='countdown'){
   var fl=(Math.sin(Date.now()/140)+1)/2;
   ctx.fillStyle='rgba(180,0,0,'+(fl*0.12)+')';
   ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  // Particles esplosione
  for(var i=particles.length-1;i>=0;i--){
   var p=particles[i];
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   p.vy+=p.gravity*dt;
   p.vx*=0.97;p.vy*=0.97;
   p.life-=p.decay;
   if(p.life<=0){particles.splice(i,1);continue;}
   ctx.globalAlpha=Math.max(0,p.life);
   ctx.fillStyle=p.color;
   ctx.beginPath();
   ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);
   ctx.fill();
  }
  ctx.globalAlpha=1;

  // Shake del wrap durante esplosione
  if(shakeT>0){
   shakeT-=0.04;
   var sx=(Math.random()-0.5)*shakeT*14;
   var sy=(Math.random()-0.5)*shakeT*14;
   canvas.style.transform='translate('+sx+'px,'+sy+'px)';
  } else {
   canvas.style.transform='';
   shakeT=0;
  }

  animId=requestAnimationFrame(animate);
 }
 animId=requestAnimationFrame(animate);

 function resetGame(){
  banner.style.opacity='0';banner.style.pointerEvents='none';
  for(var id in btns){removeBtnEl(id);}
  touches2={};loserTouchId=null;phase='waiting';
  particles=[];shakeT=0;canvas.style.transform='';
  resetCd();
  msgEl.textContent=T('chiPagaInstr');msgEl.style.opacity='1';
 }

 function cleanup(){
  cancelAnimationFrame(animId);
  wrap.removeEventListener('touchstart',onTouchStart);
  wrap.removeEventListener('touchmove',onTouchMove);
  wrap.removeEventListener('touchend',onTouchEnd);
  wrap.removeEventListener('touchcancel',onTouchEnd);
 }
}

function renderQuantoVale(){
 clr();
 addBackArrow(function(){fbLeaveRoom();goBackToGames();});
 qvRefreshLang();
 var wrap=div("qv-wrap");
 var q=S.qvQuestions[S.qvRound];
 var players=S.qvPlayers;

 // Round indicator
 wrap.appendChild(div("qv-round",T("qvQuestion")+" "+(S.qvRound+1)+" "+T("qvOf")+" "+S.qvTotalRounds));

 // Scores
 var maxScore=Math.max.apply(null,players.map(function(p){return S.qvScores[p];}));
 var scoresDiv=div("qv-scores");
 players.forEach(function(p){
 var chip=div("qv-score-chip"+(S.qvScores[p]===maxScore&&maxScore>0?" leader":""));
 chip.textContent=p+": "+S.qvScores[p];
 scoresDiv.appendChild(chip);
 });
 wrap.appendChild(scoresDiv);

 // Question
 wrap.appendChild(div("qv-question",q.q));

 if(S.qvPhase==="answer"){
 if(S.qvDistanza && fbIsHost && !S.qvHostAnswered){
 // HOST distanza: risponde anche lui col cursore
 var midVal2=Math.round((q.min+q.max)/2);
 var currentVal2=midVal2;
 var turnDiv2=div("dado-turn");turnDiv2.textContent=T("qvYourAnswer")+S.qvMyName+"):";wrap.appendChild(turnDiv2);
 var sliderWrap2=div("qv-slider-wrap");
 var valDisp2=div("qv-slider-val");valDisp2.textContent=currentVal2.toLocaleString(LANG==="en"?"en-US":LANG==="es"?"es-ES":"it-IT");
 sliderWrap2.appendChild(valDisp2);
 sliderWrap2.appendChild(el("span","qv-slider-unit",q.unit));
 var slider2=document.createElement("input");
 slider2.type="range";slider2.className="qv-slider";
 slider2.min=q.min;slider2.max=q.max;
 slider2.step=Math.max(1,Math.round((q.max-q.min)/200));
 slider2.value=midVal2;
 slider2.oninput=function(){currentVal2=parseInt(this.value);valDisp2.textContent=currentVal2.toLocaleString(LANG==="en"?"en-US":LANG==="es"?"es-ES":"it-IT");};
 sliderWrap2.appendChild(slider2);
 var labels2=div("qv-slider-labels");
 labels2.innerHTML="<span>"+q.min.toLocaleString(LANG==="en"?"en-US":LANG==="es"?"es-ES":"it-IT")+"</span><span>"+q.max.toLocaleString(LANG==="en"?"en-US":LANG==="es"?"es-ES":"it-IT")+"</span>";
 sliderWrap2.appendChild(labels2);
 wrap.appendChild(sliderWrap2);
 wrap.appendChild(btn("ebtn",T("qvConfirm"),function(){
 var ansVal=parseInt(slider2.value);
 if(fbDB&&fbRoomCode)fbSet(fbRef(fbDB,'rooms/'+fbRoomCode+'/qv_answers/'+S.qvMyName),ansVal);
 S.qvHostAnswered=true;
 // Ora mostra attesa
 clr();
 var ww=div("qv-wrap");
 ww.appendChild(div("qv-round",T("qvQuestion")+" "+(S.qvRound+1)+" "+T("qvOf")+" "+S.qvTotalRounds));
 ww.appendChild(div("qv-question",q.q));
 var waitDiv=document.createElement("div");
 waitDiv.style.cssText="text-align:center;padding:24px;";
 waitDiv.innerHTML='<div style="width:56px;height:56px;border-radius:50%;background:#34c759;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><div style="font-weight:700;font-size:18px;color:var(--dark);">'+T("qvAnswerSent")+'</div><div style="font-size:14px;color:#888;margin-top:8px;">'+T("qvWaitingOthers")+'</div>';
 ww.appendChild(waitDiv);
 var qvRoundId="qv-ac-"+S.qvRound;
 var ansCountDiv=div("qv-scores");ansCountDiv.id=qvRoundId;ww.appendChild(ansCountDiv);
 document.getElementById("root").appendChild(ww);
 if(fbDB&&fbRoomCode){
 fbOnValue(fbRef(fbDB,'rooms/'+fbRoomCode+'/qv_answers'),function(snap){
 var ans=snap.val()||{};
 var el2=document.getElementById(qvRoundId);if(!el2)return;
 el2.innerHTML="";
 players.forEach(function(p){
 var chip=div("qv-score-chip"+(ans[p]!==undefined?" leader":""));
 chip.textContent=p;if(ans[p]===undefined)chip.style.opacity="0.45";
 el2.appendChild(chip);
 });
 var allDone=players.every(function(p){return ans[p]!==undefined;});
 if(allDone&&!document.getElementById("qv-rb")){
 S.qvAnswers=ans;
 var rb=btn("ebtn",T("qvRevealAnswers"),function(){
 if(window._qvRevealTimer)clearTimeout(window._qvRevealTimer);
 if(window._qvRevealInterval){clearInterval(window._qvRevealInterval);window._qvRevealInterval=null;}
 qvScoreRound(q,players);
 S.qvPhase="reveal";S.qvHostAnswered=false;
 if(fbDB&&fbRoomCode){
 fbSet(fbRef(fbDB,'rooms/'+fbRoomCode+'/screen'),{type:'qv_reveal',answers:S.qvAnswers,scores:S.qvScores});
 fbRemove(fbRef(fbDB,'rooms/'+fbRoomCode+'/qv_answers'));
 }
 render();
 });
 rb.id="qv-rb";rb.style.marginTop="20px";ww.appendChild(rb);
 // Timer automatico 40s per rivelare (conta da quando tutti hanno risposto)
 if(!window._qvRevealTimer){
  var _timerEl=document.createElement("div");
  _timerEl.id="qv-reveal-timer";
  _timerEl.style.cssText="text-align:center;font-size:12px;color:#aaa;margin-top:8px;";
  _timerEl.textContent=T("ui_rivelazione_automatica_tra_40s");
  ww.appendChild(_timerEl);
  var _revSec=40;
  if(window._qvRevealInterval)clearInterval(window._qvRevealInterval);
  window._qvRevealInterval=setInterval(function(){
   _revSec--;
   var tel=document.getElementById("qv-reveal-timer");
   if(tel)tel.textContent=T("ui_rivelazione_automatica_tra")+_revSec+"s";
   if(_revSec<=0)clearInterval(window._qvRevealInterval);
  },1000);
  window._qvRevealTimer=setTimeout(function(){
   clearInterval(window._qvRevealInterval);
   window._qvRevealTimer=null;
   rb.click();
  },40000);
 }
 }
 });
 }
 }));
 } else if(S.qvDistanza && fbIsHost && S.qvHostAnswered){
 // HOST ha già risposto: mostra attesa
 var waitDiv=document.createElement("div");
 waitDiv.style.cssText="text-align:center;padding:24px;";
 waitDiv.innerHTML='<div style="width:56px;height:56px;border-radius:50%;background:#34c759;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><div style="font-weight:700;font-size:18px;color:var(--dark);">'+T("qvAnswerSent")+'</div><div style="font-size:14px;color:#888;margin-top:8px;">'+T("qvWaitingOthers2")+'</div>';
 wrap.appendChild(waitDiv);
 var qvRoundId="qv-ac-"+S.qvRound;
 var ansCountDiv=div("qv-scores");ansCountDiv.id=qvRoundId;wrap.appendChild(ansCountDiv);
 if(fbDB&&fbRoomCode){
 fbOnValue(fbRef(fbDB,'rooms/'+fbRoomCode+'/qv_answers'),function(snap){
 var ans=snap.val()||{};
 var el2=document.getElementById(qvRoundId);if(!el2)return;
 el2.innerHTML="";
 players.forEach(function(p){
 var chip=div("qv-score-chip"+(ans[p]!==undefined?" leader":""));
 chip.textContent=p;if(ans[p]===undefined)chip.style.opacity="0.45";
 el2.appendChild(chip);
 });
 var allDone=players.every(function(p){return ans[p]!==undefined;});
 if(allDone&&!document.getElementById("qv-rb")){
 S.qvAnswers=ans;
 var rb=btn("ebtn",T("qvRevealAnswers"),function(){
 qvScoreRound(q,players);
 S.qvPhase="reveal";S.qvHostAnswered=false;
 if(fbDB&&fbRoomCode){
 fbSet(fbRef(fbDB,'rooms/'+fbRoomCode+'/screen'),{type:'qv_reveal',answers:S.qvAnswers,scores:S.qvScores});
 fbRemove(fbRef(fbDB,'rooms/'+fbRoomCode+'/qv_answers'));
 }
 render();
 });
 rb.id="qv-rb";rb.style.marginTop="20px";wrap.appendChild(rb);
 }
 });
 }
 } else {
 // Current player answers (local mode)
 var currentPlayer=players[S.qvCurrentPlayerIdx];
 var alreadyAnswered=Object.keys(S.qvAnswers).length;

 if(alreadyAnswered<players.length){
 // Show whose turn it is
 var turnDiv=div("dado-turn");turnDiv.textContent=(S.qvDistanza&&!fbIsHost)?T("qvYourAnswer")+S.qvMyName+"):":T("qvPassTablet")+currentPlayer;wrap.appendChild(turnDiv);
 // Timer automatico 40 secondi
 var timerDiv=div("");timerDiv.id="qv-timer";timerDiv.style.cssText="text-align:center;font-size:13px;color:#aaa;margin-bottom:8px;";
 timerDiv.textContent=T("ui_risposta_automatica_tra_40s");wrap.appendChild(timerDiv);
 if(window._qvAutoTimer)clearTimeout(window._qvAutoTimer);
 var _qvSecondi=40;
 if(window._qvCountdownInterval)clearInterval(window._qvCountdownInterval);
 window._qvCountdownInterval=setInterval(function(){
  _qvSecondi--;
  var el=document.getElementById("qv-timer");
  if(!el){clearInterval(window._qvCountdownInterval);return;}
  el.textContent=T("ui_risposta_automatica_tra")+_qvSecondi+"s";
  if(_qvSecondi<=0){clearInterval(window._qvCountdownInterval);}
 },1000);
 window._qvAutoTimer=setTimeout(function(){
  clearInterval(window._qvCountdownInterval);
  window._qvCountdownInterval=null;
  window._qvAutoTimer=null;
  // A distanza: invia la risposta del cursore come se avessi confermato
  if(S.qvDistanza&&!fbIsHost){var cb=document.getElementById("qv-confirm");if(cb)cb.click();return;}
  // Registra risposta del giocatore corrente con il valore attuale dello slider
  var sliderEl=document.querySelector(".qv-slider");
  var autoVal=sliderEl?parseInt(sliderEl.value):Math.round((q.min+q.max)/2);
  S.qvAnswers[currentPlayer]=autoVal;
  S.qvCurrentPlayerIdx++;
  if(S.qvCurrentPlayerIdx>=players.length){
   // Calcola vincitore round
   var _q2=S.qvQuestions[S.qvRound];
   qvScoreRound(_q2,players);
   S.qvPhase="reveal";
  }
  render();
 },40000);

 // Slider
 var sliderWrap=div("qv-slider-wrap");
 var valDisp=div("qv-slider-val");
 var midVal=Math.round((q.min+q.max)/2);
 var currentVal=midVal;
 valDisp.textContent=currentVal.toLocaleString(LANG==="en"?"en-US":LANG==="es"?"es-ES":"it-IT");
 sliderWrap.appendChild(valDisp);
 var unitEl=el("span","qv-slider-unit",q.unit);sliderWrap.appendChild(unitEl);

 var slider=document.createElement("input");
 slider.type="range";slider.className="qv-slider";
 slider.min=q.min;slider.max=q.max;
 slider.step=Math.max(1,Math.round((q.max-q.min)/200));
 slider.value=midVal;
 slider.oninput=function(){
 currentVal=parseInt(this.value);
 valDisp.textContent=currentVal.toLocaleString(LANG==="en"?"en-US":LANG==="es"?"es-ES":"it-IT");
 };
 sliderWrap.appendChild(slider);

 var labels=div("qv-slider-labels");
 labels.innerHTML="<span>"+q.min.toLocaleString(LANG==="en"?"en-US":LANG==="es"?"es-ES":"it-IT")+"</span><span>"+q.max.toLocaleString(LANG==="en"?"en-US":LANG==="es"?"es-ES":"it-IT")+"</span>";
 sliderWrap.appendChild(labels);
 wrap.appendChild(sliderWrap);

 var _qvConfirmBtn=btn("ebtn",T("qvConfirm"),function(){
 if(window._qvAutoTimer){clearTimeout(window._qvAutoTimer);window._qvAutoTimer=null;}
 if(window._qvCountdownInterval){clearInterval(window._qvCountdownInterval);window._qvCountdownInterval=null;}
 var ansVal=parseInt(slider.value);
 if(S.qvDistanza && !fbIsHost){
 // Client: invia risposta via Firebase
 if(fbDB&&fbRoomCode){
 fbSet(fbRef(fbDB,'rooms/'+fbRoomCode+'/qv_answers/'+S.qvMyName),ansVal);
 }
 // Mostra schermata attesa
 clr();
 var ww=div("qv-wrap");
 ww.appendChild(div("qv-round",T("qvQuestion")+" "+(S.qvRound+1)+" "+T("qvOf")+" "+S.qvTotalRounds));
 ww.appendChild(div("qv-question",q.q));
 var sentDiv=document.createElement("div");
 sentDiv.style.cssText="text-align:center;margin-top:40px;font-size:18px;color:var(--dark);";
 sentDiv.innerHTML='<div style="width:56px;height:56px;border-radius:50%;background:#34c759;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><div style="font-weight:700;">'+T("qvAnswerSent")+'</div><div style="font-size:14px;color:#888;margin-top:8px;">'+T("qvWaitingOthers2")+'</div><div style="font-size:48px;font-weight:900;color:var(--orange);margin-top:20px;font-family:\'Space Grotesk\',sans-serif;">'+ansVal.toLocaleString(LANG==="en"?"en-US":LANG==="es"?"es-ES":"it-IT")+'</div><div style="font-size:13px;color:#888;">'+q.unit+'</div>';
 ww.appendChild(sentDiv);
 document.getElementById("root").appendChild(ww);
 return;
 }
 S.qvAnswers[currentPlayer]=ansVal;
 S.qvCurrentPlayerIdx++;
 if(S.qvCurrentPlayerIdx>=players.length){
 // Calcola vincitore round (locale)
 if(window._qvAutoTimer){clearTimeout(window._qvAutoTimer);window._qvAutoTimer=null;}
 if(window._qvCountdownInterval){clearInterval(window._qvCountdownInterval);window._qvCountdownInterval=null;}
 var q2=S.qvQuestions[S.qvRound];
 qvScoreRound(q2,players);
 S.qvPhase="reveal";
 if(S.qvDistanza && fbIsHost && fbDB && fbRoomCode){
 fbSet(fbRef(fbDB,'rooms/'+fbRoomCode+'/screen'),{
 type:'qv_reveal',
 answers:S.qvAnswers,
 scores:S.qvScores
 });
 }
 }
 render();
 });
 _qvConfirmBtn.id="qv-confirm";
 wrap.appendChild(_qvConfirmBtn);
 }

 // Show confirmed players
 if(alreadyAnswered>0){
 var answeredDiv=div("qv-players-answers");
 players.forEach(function(p){
 if(S.qvAnswers[p]!==undefined){
 var row=div("qv-player-answer");
 row.appendChild(el("span","qv-answer-name",p+" "));
 var val=div("qv-answer-val confirmed");val.textContent=T("qvAnswerSentShort");row.appendChild(val);
 answeredDiv.appendChild(row);
 }
 });
 wrap.appendChild(answeredDiv);
 }

 } // end else local

 } else if(S.qvPhase==="reveal"){
 // Show all answers and correct value
 var revealBox=div("qv-reveal-box");
 revealBox.appendChild(el("div","qv-reveal-label",T("qvCorrectAnswer")));
 revealBox.appendChild(el("div","qv-reveal-answer",q.risposta.toLocaleString(LANG==="en"?"en-US":LANG==="es"?"es-ES":"it-IT")+" "+q.unit));
 revealBox.appendChild(el("div","qv-reveal-curiosita",q.curiosita));
 wrap.appendChild(revealBox);

 // Usa il vincitore già calcolato (evita doppio incremento)
 var roundWinners=Array.isArray(S.qvRoundWinner)?S.qvRoundWinner:(S.qvRoundWinner?[S.qvRoundWinner]:[]);

 // Show all answers
 var answersDiv=div("qv-players-answers");
 players.forEach(function(p){
 var diff=Math.abs(S.qvAnswers[p]-q.risposta);
 var isW=roundWinners.indexOf(p)>=0;var row=div("qv-player-answer"+(isW?" winner":""));
 var nameEl=div("qv-answer-name");nameEl.textContent=p+(isW?" +1":"");row.appendChild(nameEl);
 var valEl=div("qv-answer-val");
 valEl.textContent=S.qvAnswers[p].toLocaleString(LANG==="en"?"en-US":LANG==="es"?"es-ES":"it-IT")+" ("+T("ui_scarto")+" "+diff.toLocaleString(LANG==="en"?"en-US":LANG==="es"?"es-ES":"it-IT")+")";
 row.appendChild(valEl);
 answersDiv.appendChild(row);
 });
 wrap.appendChild(answersDiv);

 // A distanza solo chi ha creato la stanza fa avanzare il gioco: gli altri aspettano la domanda successiva
 if(S.qvDistanza&&!fbIsHost){
  if(window._qvNextTimer){clearTimeout(window._qvNextTimer);window._qvNextTimer=null;}
  if(window._qvNextInterval){clearInterval(window._qvNextInterval);window._qvNextInterval=null;}
  var _wt=div("");_wt.style.cssText="text-align:center;font-size:14px;color:var(--muted);margin:10px 0;";
  _wt.textContent=T("ui_attesa_host_domanda");wrap.appendChild(_wt);
  document.getElementById("root").appendChild(wrap);
  return;
 }
 // Next round or end
 var isLast=(S.qvRound>=S.qvTotalRounds-1);
 // Timer automatico 40s
 var _ntDiv=div("");_ntDiv.id="qv-next-timer";_ntDiv.style.cssText="text-align:center;font-size:12px;color:#aaa;margin-bottom:6px;";
 var _ntSec=40;_ntDiv.textContent=T("ui_avanzamento_automatico_tra")+_ntSec+"s";wrap.appendChild(_ntDiv);
 if(window._qvNextInterval)clearInterval(window._qvNextInterval);
 if(window._qvNextTimer)clearTimeout(window._qvNextTimer);
 window._qvNextInterval=setInterval(function(){_ntSec--;var te=document.getElementById("qv-next-timer");if(te)te.textContent=T("ui_avanzamento_automatico_tra")+_ntSec+"s";if(_ntSec<=0)clearInterval(window._qvNextInterval);},1000);
 var _ntBtn=btn("ebtn",isLast?T("qvFinalScore"):T("qvNextQuestion"),function(){
 if(window._qvNextTimer){clearTimeout(window._qvNextTimer);window._qvNextTimer=null;}
 if(window._qvNextInterval){clearInterval(window._qvNextInterval);window._qvNextInterval=null;}
 if(isLast){
 if(S.qvDistanza && fbIsHost && fbDB && fbRoomCode){
 fbSet(fbRef(fbDB,'rooms/'+fbRoomCode+'/screen'),{type:'qv_end',scores:S.qvScores});
 }
 S.screen="qv_end";render();return;
 }
 S.qvRound++;
 S.qvAnswers={};
 S.qvCurrentPlayerIdx=0;
 S.qvPhase="answer";
 S.qvRoundWinner=null;
 if(S.qvDistanza && fbIsHost && fbDB && fbRoomCode){
 fbSet(fbRef(fbDB,'rooms/'+fbRoomCode+'/screen'),{
 type:'qv_question',
 round:S.qvRound,
 totalRounds:S.qvTotalRounds,
 players:S.qvPlayers,
 scores:S.qvScores,
 qi:S.qvQIdx||null,
 questions:S.qvQuestions
 });
 // Also clear previous answers on Firebase
 fbRemove(fbRef(fbDB,'rooms/'+fbRoomCode+'/qv_answers'));
 }
 render();
 });
 wrap.appendChild(_ntBtn);
 window._qvNextTimer=setTimeout(function(){
  clearInterval(window._qvNextInterval);window._qvNextInterval=null;
  window._qvNextTimer=null;
  _ntBtn.click();
 },40000);
 }

 document.getElementById("root").appendChild(wrap);
}

function renderQvEnd(){
 clr();
 addBackArrow(function(){fbLeaveRoom();goBackToGames();});
 var wrap=div("qv-wrap");
 // Find overall winner
 var maxScore=Math.max.apply(null,S.qvPlayers.map(function(p){return S.qvScores[p];}));
 var _winners=S.qvPlayers.filter(function(p){return S.qvScores[p]===maxScore;});
 var winner=_winners[0];
  var wt=div("end-title");wt.textContent=_winners.length>1?T("qvTie")+" "+_winners.join(", "):winner+" "+T("qvWon");wrap.appendChild(wt);
 wrap.appendChild(div("end-sub",T("qvPoints")+" "+maxScore+" "+T("qvPointsOf")+" "+S.qvTotalRounds));
 var pd=div("qv-players-answers");
 S.qvPlayers.sort(function(a,b){return S.qvScores[b]-S.qvScores[a];}).forEach(function(p,i){
 var row=div("qv-player-answer"+(S.qvScores[p]===maxScore?" winner":""));
 row.appendChild(el("span","qv-answer-name",p));
 row.appendChild(el("span","qv-answer-val",S.qvScores[p]+" pt"));
 pd.appendChild(row);
 });
 wrap.appendChild(pd);
 var btns=div("endbtns");
 btns.appendChild(btn("ebtn",T("qvPlayAgain"),function(){
  if(S.qvDistanza && fbIsHost){startQuantoValeDistanza(S.qvPlayers);}
  else if(S.qvDistanza && !fbIsHost){/* client attende che host riavvii */}
  else{startQuantoVale(S.qvPlayers);}
 }));
 btns.appendChild(btn("ebtn out",T("exitBtn"),function(){fbLeaveRoom();goHome();}));
 wrap.appendChild(btns);
 document.getElementById("root").appendChild(wrap);
}

function renderAgSetup(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var wrap=div("intesa-wrap intesa-setup");
 var hdr=div("dhdr");hdr.style.background=bg;
 var dhdrTop=div("dhdr-top");hdr.appendChild(dhdrTop);
 dhdrTop.appendChild(btn("card-nav-btn back",T("backToGames"),goBackToGames));
 dhdrTop.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 hdr.appendChild(div("dtitle",T("ui_anno_giusto")));
 var card=div("dcard");card.appendChild(hdr);
 var body=div("dbody");card.appendChild(body);
 if(!S.agNumPlayers)S.agNumPlayers=2;
 var selectedNum=S.agNumPlayers;
 var numLabel=document.createElement("div");
 numLabel.style.cssText="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#aaa;text-align:center;margin:20px 0 14px;";
 numLabel.textContent=T("ui_quanti_siete");
 body.appendChild(numLabel);
 var stepper=document.createElement("div");
 stepper.style.cssText="display:flex;align-items:center;justify-content:center;gap:0;margin-bottom:24px;";
 var minusBtn=document.createElement("button");
 minusBtn.style.cssText="width:48px;height:48px;border-radius:50%;border:2px solid #e0e0e0;background:#fff;font-size:24px;font-weight:300;cursor:pointer;color:#555;display:flex;align-items:center;justify-content:center;font-family:inherit;";
 minusBtn.textContent="−";
 minusBtn.onclick=function(){if(S.agNumPlayers>2){S.agNumPlayers--;renderAgSetup();}};
 var numDisp=document.createElement("div");
 numDisp.style.cssText="width:72px;text-align:center;font-size:40px;font-weight:900;color:var(--dark);font-family:'Space Grotesk',sans-serif;";
 numDisp.textContent=selectedNum;
 var plusBtn=document.createElement("button");
 plusBtn.style.cssText="width:48px;height:48px;border-radius:50%;border:2px solid #e0e0e0;background:#fff;font-size:24px;font-weight:300;cursor:pointer;color:#555;display:flex;align-items:center;justify-content:center;font-family:inherit;";
 plusBtn.textContent="+";
 plusBtn.onclick=function(){if(S.agNumPlayers<8){S.agNumPlayers++;renderAgSetup();}};
 stepper.appendChild(minusBtn);stepper.appendChild(numDisp);stepper.appendChild(plusBtn);
 body.appendChild(stepper);
 var namesGrid=div("player-names-grid");
 var inputs=[];
 for(var i=0;i<selectedNum;i++){
  (function(pidx){
   var row=div("player-name-row");
   var lbl=div("player-name-label");lbl.textContent=T("ui_giocatore")+(pidx+1);row.appendChild(lbl);
   var inp=document.createElement("input");
   inp.type="text";inp.className="player-name-input";
   inp.placeholder=T("ui_giocatore")+(pidx+1);inp.maxLength=16;
   if(S.agPlayerNames&&S.agPlayerNames[pidx])inp.value=S.agPlayerNames[pidx];
   row.appendChild(inp);inputs.push(inp);
   namesGrid.appendChild(row);
  })(i);
 }
 body.appendChild(namesGrid);
 var startWrap=div("");startWrap.style.cssText="text-align:center;margin-top:20px;";
 startWrap.appendChild(btn("ebtn",T("ui_inizia_2"),function(){
  var names=inputs.map(function(inp,i){return inp.value.trim()||T("ui_giocatore")+(i+1);});
  S.agPlayerNames=names;
  S.agNumPlayers=selectedNum;
  startAnnoGiusto(names);
 }));
 body.appendChild(startWrap);
 wrap.appendChild(card);
 document.getElementById("root").appendChild(wrap);
}

function startAnnoGiusto(players){
 S.agPlayers=players;
 S.agScores={};
 players.forEach(function(p){S.agScores[p]=0;});
 S.agRound=0;S.agScoredKey=null;S.agGameId=Date.now();
 S.agTotalRounds=10;
 var _agData=agData().slice();
 for(var i=_agData.length-1;i>0;i--){
  var j=Math.floor(Math.random()*(i+1));
  var t=_agData[i];_agData[i]=_agData[j];_agData[j]=t;
 }
 S.agQuestions=_agData.slice(0,10);
 S.agAnswers={};
 S.agCurrentPlayerIdx=0;
 S.agPhase="answer";
 S.agRoundWinner=null;
 S.screen="annogiusto";
 render();
}

function renderAnnoGiusto(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("backToGames"),goBackToGames));
 top.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 hdr.appendChild(div("intesa-title",T("ui_anno_giusto")));
 hdr.appendChild(div("intesa-desc",T("ui_round")+(S.agRound+1)+" / "+S.agTotalRounds));
 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:20px;padding:24px 16px;";
 var q=S.agQuestions[S.agRound];
 // Domanda
 var qbox=div("");
 qbox.style.cssText="background:var(--surface2,#f5f5f5);border-radius:16px;padding:20px;text-align:center;width:100%;max-width:340px;";
 var qtext=div("");qtext.style.cssText="font-size:18px;font-weight:700;line-height:1.3;";qtext.textContent=q.q;
 qbox.appendChild(qtext);
 body.appendChild(qbox);
 if(S.agPhase==="answer"){
  var curPlayer=S.agPlayers[S.agCurrentPlayerIdx];
  var turnLbl=div("");
  turnLbl.style.cssText="font-size:15px;color:var(--muted,#888);text-align:center;";
  turnLbl.textContent=T("ui_turno_di")+curPlayer;
  body.appendChild(turnLbl);
  // Slider anno
  var sliderVal=S.agCurrentSlider!==undefined?S.agCurrentSlider:1000;
  var sliderWrap=div("");
  sliderWrap.style.cssText="width:100%;max-width:340px;display:flex;flex-direction:column;align-items:center;gap:8px;";
  var yearDisp=div("");
  yearDisp.style.cssText="font-size:56px;font-weight:900;font-variant-numeric:tabular-nums;color:var(--dark);";
  yearDisp.textContent=agYear(sliderVal);
  sliderWrap.appendChild(yearDisp);
  var slider=document.createElement("input");
  slider.type="range";slider.min=-3000;slider.max=new Date().getFullYear();slider.value=sliderVal;
  slider.style.cssText="width:100%;accent-color:"+bg+";height:6px;";
  slider.oninput=function(){
   S.agCurrentSlider=parseInt(this.value);
   var v=parseInt(this.value);
   yearDisp.textContent=agYear(v);
  };
  sliderWrap.appendChild(slider);
  // Regolazione fine dell'anno
  var fine=div("");fine.style.cssText="display:flex;gap:8px;width:100%;";
  [-10,-1,1,10].forEach(function(dv){
   var fb=btn("ebtn out",(dv>0?"+":"\u2212")+Math.abs(dv),function(){
    var nv=Math.max(-3000,Math.min(new Date().getFullYear(),(S.agCurrentSlider!==undefined?S.agCurrentSlider:1000)+dv));
    S.agCurrentSlider=nv;slider.value=nv;yearDisp.textContent=agYear(nv);
   });
   fb.style.cssText="flex:1;padding:10px 0;min-height:44px;font-size:16px;";
   fine.appendChild(fb);
  });
  sliderWrap.appendChild(fine);
  var rangeRow=div("");
  rangeRow.style.cssText="display:flex;justify-content:space-between;width:100%;font-size:12px;color:var(--muted,#999);";
  rangeRow.appendChild(el("span","",agYear(-3000)));
  rangeRow.appendChild(el("span","",String(new Date().getFullYear())));
  sliderWrap.appendChild(rangeRow);
  body.appendChild(sliderWrap);
  var confirmBtn=btn("ebtn",T("ui_conferma_risposta"),function(){
   if(!S.agAnswers)S.agAnswers={};
   var v=S.agCurrentSlider!==undefined?S.agCurrentSlider:1000;
   S.agAnswers[curPlayer]=v;
   S.agCurrentSlider=undefined;
   S.agCurrentPlayerIdx++;
   if(S.agCurrentPlayerIdx>=S.agPlayers.length){
    S.agPhase="reveal";
   }
   renderAnnoGiusto();
  });
  confirmBtn.style.cssText="width:100%;max-width:340px;font-size:16px;padding:16px;";
  body.appendChild(confirmBtn);
 } else {
  // Fase reveal
  var risposta=q.risposta;
  var rispostaText=agYear(risposta);
  var answerBox=div("");
  answerBox.style.cssText="background:var(--surface2,#f0f0f0);border-radius:16px;padding:16px;width:100%;max-width:340px;text-align:center;";
  var ansLbl=div("");ansLbl.style.cssText="font-size:13px;color:var(--muted,#888);margin-bottom:4px;";ansLbl.textContent=T("ui_risposta_corretta");
  answerBox.appendChild(ansLbl);
  var ansVal=div("");ansVal.style.cssText="font-size:36px;font-weight:900;color:#388E3C;";ansVal.textContent=rispostaText;
  answerBox.appendChild(ansVal);
  if(q.curiosita){
   var cur=div("");cur.style.cssText="font-size:13px;color:var(--muted,#666);margin-top:8px;line-height:1.4;";cur.textContent=q.curiosita;
   answerBox.appendChild(cur);
  }
  body.appendChild(answerBox);
  // Classifica risposte
  var ranked=S.agPlayers.map(function(p){
   var ans=S.agAnswers[p];
   var diff=Math.abs(ans-risposta);
   return{p:p,ans:ans,diff:diff};
  }).sort(function(a,b){return a.diff-b.diff;});
  // Un punto a chi si avvicina di più (a pari distanza, a tutti i più vicini); assegnato una sola volta per round
  var bestD=ranked[0].diff;
  var agKey=S.agGameId+"|"+S.agRound;
  if(S.agScoredKey!==agKey){
   S.agScoredKey=agKey;
   ranked.forEach(function(r){if(r.diff===bestD)S.agScores[r.p]=(S.agScores[r.p]||0)+1;});
  }
  var rankDiv=div("");rankDiv.style.cssText="width:100%;max-width:340px;display:flex;flex-direction:column;gap:8px;";
  ranked.forEach(function(r,i){
   var row=div("qv-player-answer"+(i===0?" winner":""));
   var pname=el("span","qv-answer-name",(i===0?" ":i===1?" ":i===2?" ":"")+r.p);
   var pval=el("span","qv-answer-val",agYear(r.ans)+" (±"+r.diff+")");
   row.appendChild(pname);row.appendChild(pval);
   rankDiv.appendChild(row);
  });
  body.appendChild(rankDiv);
  // Punteggi
  var scoreDiv=div("");scoreDiv.style.cssText="width:100%;max-width:340px;display:flex;flex-direction:column;gap:4px;";
  var scoreLbl=div("");scoreLbl.style.cssText="font-size:13px;font-weight:700;color:var(--muted,#888);";scoreLbl.textContent=T("ui_punteggi_totali");
  scoreDiv.appendChild(scoreLbl);
  S.agPlayers.slice().sort(function(a,b){return S.agScores[b]-S.agScores[a];}).forEach(function(p){
   var r=div("");r.style.cssText="display:flex;justify-content:space-between;font-size:14px;";
   r.appendChild(el("span","",p));
   r.appendChild(el("span","",S.agScores[p]+" pt"));
   scoreDiv.appendChild(r);
  });
  body.appendChild(scoreDiv);
  var nextBtn;
  if(S.agRound+1>=S.agTotalRounds){
   nextBtn=btn("ebtn",T("ui_risultati_finali"),function(){
    S.screen="ag_end";render();
   });
  } else {
   nextBtn=btn("ebtn",T("ui_prossima_domanda"),function(){
    S.agRound++;
    S.agAnswers={};
    S.agCurrentPlayerIdx=0;
    S.agPhase="answer";
    S.agCurrentSlider=undefined;
    renderAnnoGiusto();
   });
  }
  nextBtn.style.cssText="width:100%;max-width:340px;font-size:16px;padding:16px;";
  body.appendChild(nextBtn);
 }
 document.getElementById("root").appendChild(wrap);
}

function renderAgEnd(){
 clr();
 addBackArrow(goBackToGames);
 var wrap=div("qv-wrap");
 var maxScore=Math.max.apply(null,S.agPlayers.map(function(p){return S.agScores[p];}));
 var winner=S.agPlayers.filter(function(p){return S.agScores[p]===maxScore;})[0];
 var wt=div("end-title");wt.textContent=winner+T("ui_ha_vinto");wrap.appendChild(wt);
 wrap.appendChild(div("end-sub",T("ui_con")+maxScore+T("ui_punti_su")+S.agTotalRounds+" round"));
 var pd=div("qv-players-answers");
 S.agPlayers.slice().sort(function(a,b){return S.agScores[b]-S.agScores[a];}).forEach(function(p,i){
  var row=div("qv-player-answer"+(i===0?" winner":""));
  row.appendChild(el("span","qv-answer-name",(i===0?" ":i===1?" ":i===2?" ":"")+p));
  row.appendChild(el("span","qv-answer-val",S.agScores[p]+" pt"));
  pd.appendChild(row);
 });
 wrap.appendChild(pd);
 var btns=div("endbtns");
 btns.appendChild(btn("ebtn",T("ui_gioca_ancora"),function(){startAnnoGiusto(S.agPlayers);}));
 btns.appendChild(btn("ebtn out",T("exitBtn"),goHome));
 wrap.appendChild(btns);
 document.getElementById("root").appendChild(wrap);
}

/* ============================================================
   L'EX — timer 2 minuti
   ============================================================ */
var _lexTimer=null;
function renderLex(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var timeLeft=S.lexTime!==undefined?S.lexTime:120;
 var running=S.lexRunning||false;
 var gameName=(curGame()||{}).name||T("ui_l_ex");

 var wrap=div("panel");
 var card=div("dcard");wrap.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=bg;card.appendChild(hdr);
 var top=div("dhdr-top");hdr.appendChild(top);
 top.appendChild(btn("card-nav-btn back",T("backToGames"),function(){
  if(_lexTimer){clearInterval(_lexTimer);_lexTimer=null;}
  goBackToGames();
 }));
 top.appendChild(btn("card-nav-btn",T("exitBtn"),function(){
  if(_lexTimer){clearInterval(_lexTimer);_lexTimer=null;}
  goHome();
 }));
 hdr.appendChild(div("intesa-title",gameName));
 hdr.appendChild(div("intesa-desc",T("ui_2_minuti_per_raccontare_la")));

 var body=div("dbody");card.appendChild(body);
 body.style.cssText="display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 16px;";

 var mins=Math.floor(timeLeft/60);
 var secs=timeLeft%60;
 var timerEl=div("");
 timerEl.style.cssText="font-size:90px;font-weight:900;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums;color:"+(timeLeft<=15?"#e53935":timeLeft<=30?"#f57c00":"var(--dark)")+";";
 timerEl.textContent=mins+":"+(secs<10?"0":"")+secs;
 body.appendChild(timerEl);

 var barWrap=div("");barWrap.style.cssText="width:100%;max-width:260px;height:12px;background:var(--border);border-radius:10px;overflow:hidden;";
 var barFill=div("");barFill.style.cssText="height:100%;border-radius:10px;width:"+(timeLeft/120*100)+"%;background:"+(timeLeft<=15?"#e53935":timeLeft<=30?"#f57c00":"#c2185b")+";transition:width .4s;";
 barWrap.appendChild(barFill);body.appendChild(barWrap);

 var rule=div("rtext");rule.style.cssText="text-align:center;font-size:14px;max-width:280px;";
 rule.textContent=T("ui_racconta_la_storia_piu_assurda");
 body.appendChild(rule);
 var _aq=adultiPick("lexQ");
 if(_aq){
  rule.style.display="none";
  var qc=div("adulti-q");qc.appendChild(div("adulti-q-text",_aq));
  if(!running){var cb=btn("adulti-q-next",T("adultiOther"),function(){adultiNext("lexQ");render();});qc.appendChild(cb);}
  body.appendChild(qc);
 }


 if(timeLeft<=0){
  var scaduto=div("");scaduto.style.cssText="font-size:22px;font-weight:700;color:#c2185b;text-align:center;";
  scaduto.textContent=T("ui_votate_la_storia_migliore");
  body.appendChild(scaduto);
  var fineBtn=btn("ebtn out",T("endGame"),function(){
   if(_lexTimer){clearInterval(_lexTimer);_lexTimer=null;}
   endGame(gameName);
  });fineBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(fineBtn);
  var riBtn=btn("ebtn",T("ui_prossimo_giocatore"),function(){
   S.lexTime=120;adultiNext("lexQ");S.lexRunning=false;renderLex();
  });riBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(riBtn);
 } else if(!running){
  var startBtn=btn("ebtn",timeLeft===120?T("ui_inizia_2"):T("ui_riprendi"),function(){
   S.lexRunning=true;
   _lexTimer=setInterval(function(){
    S.lexTime=(S.lexTime||1)-1;
    if(S.lexTime<=0){S.lexTime=0;S.lexRunning=false;clearInterval(_lexTimer);_lexTimer=null;}
    renderLex();
   },1000);
   renderLex();
  });startBtn.style.cssText="width:100%;max-width:280px;font-size:18px;padding:18px;";
  body.appendChild(startBtn);
  if(timeLeft<120){
   var resetBtn=btn("ebtn out",T("ui_ricomincia"),function(){
    if(_lexTimer){clearInterval(_lexTimer);_lexTimer=null;}
    S.lexTime=120;S.lexRunning=false;renderLex();
   });resetBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(resetBtn);
  }
 } else {
  var pauseBtn=btn("ebtn out",T("ui_pausa"),function(){
   S.lexRunning=false;
   if(_lexTimer){clearInterval(_lexTimer);_lexTimer=null;}
   renderLex();
  });pauseBtn.style.cssText="width:100%;max-width:280px;";body.appendChild(pauseBtn);
 }

 document.getElementById("root").appendChild(wrap);
}

/* ============================================================
   CONFESSIONI ANONIME
   ============================================================ */
function renderCaSetup(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var wrap=div("intesa-wrap intesa-setup");
 var hdr=div("dhdr");hdr.style.background=bg;
 var dhdrTop=div("dhdr-top");hdr.appendChild(dhdrTop);
 dhdrTop.appendChild(btn("card-nav-btn back",T("backToGames"),goBackToGames));
 dhdrTop.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 hdr.appendChild(div("dtitle",T("ui_confessioni_anonime")));
 var card=div("dcard");card.appendChild(hdr);
 var body=div("dbody");card.appendChild(body);
 if(!S.caNumPlayers)S.caNumPlayers=3;
 var selectedNum=S.caNumPlayers;
 var numLabel=document.createElement("div");
 numLabel.style.cssText="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#aaa;text-align:center;margin:20px 0 14px;";
 numLabel.textContent=T("ui_quanti_siete");
 body.appendChild(numLabel);
 var stepper=document.createElement("div");
 stepper.style.cssText="display:flex;align-items:center;justify-content:center;gap:0;margin-bottom:24px;";
 var minusBtn=document.createElement("button");
 minusBtn.style.cssText="width:48px;height:48px;border-radius:50%;border:2px solid #e0e0e0;background:#fff;font-size:24px;font-weight:300;cursor:pointer;color:#555;display:flex;align-items:center;justify-content:center;font-family:inherit;";
 minusBtn.textContent="−";
 minusBtn.onclick=function(){if(S.caNumPlayers>3){S.caNumPlayers--;renderCaSetup();}};
 var numDisp=document.createElement("div");
 numDisp.style.cssText="width:72px;text-align:center;font-size:40px;font-weight:900;color:var(--dark);font-family:'Space Grotesk',sans-serif;";
 numDisp.textContent=selectedNum;
 var plusBtn=document.createElement("button");
 plusBtn.style.cssText="width:48px;height:48px;border-radius:50%;border:2px solid #e0e0e0;background:#fff;font-size:24px;font-weight:300;cursor:pointer;color:#555;display:flex;align-items:center;justify-content:center;font-family:inherit;";
 plusBtn.textContent="+";
 plusBtn.onclick=function(){if(S.caNumPlayers<10){S.caNumPlayers++;renderCaSetup();}};
 stepper.appendChild(minusBtn);stepper.appendChild(numDisp);stepper.appendChild(plusBtn);
 body.appendChild(stepper);
 var namesGrid=div("player-names-grid");
 var inputs=[];
 for(var i=0;i<selectedNum;i++){
  (function(pidx){
   var row=div("player-name-row");
   var lbl=div("player-name-label");lbl.textContent=T("ui_giocatore")+(pidx+1);row.appendChild(lbl);
   var inp=document.createElement("input");
   inp.type="text";inp.className="player-name-input";
   inp.placeholder=T("ui_giocatore")+(pidx+1);inp.maxLength=20;
   if(S.caPlayerNames&&S.caPlayerNames[pidx])inp.value=S.caPlayerNames[pidx];
   row.appendChild(inp);inputs.push(inp);
   namesGrid.appendChild(row);
  })(i);
 }
 body.appendChild(namesGrid);
 var startWrap=div("");startWrap.style.cssText="text-align:center;margin-top:20px;";
 startWrap.appendChild(btn("ebtn",T("ui_inizia_2"),function(){
  var names=inputs.map(function(inp,i){return inp.value.trim()||T("ui_giocatore")+(i+1);});
  S.caPlayerNames=names;
  S.caNumPlayers=selectedNum;
  startCa(names);
 }));
 body.appendChild(startWrap);
 wrap.appendChild(card);
 document.getElementById("root").appendChild(wrap);
}

function startCa(players){
 S.caPlayers=players;
 S.caConfessioni=[];
 S.caCurrentPlayer=0;
 S.caOrder=null;
 S.caReadIdx=0;
 S.screen="ca_write";
 render();
}

function renderCaWrite(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var wrap=div("intesa-wrap");
 var hdr=div("dhdr");hdr.style.background=bg;
 var dhdrTop=div("dhdr-top");hdr.appendChild(dhdrTop);
 dhdrTop.appendChild(btn("card-nav-btn back",T("backToGames"),goBackToGames));
 dhdrTop.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 hdr.appendChild(div("dtitle",T("ui_confessioni_anonime")));
 var card=div("dcard");card.appendChild(hdr);
 var body=div("dbody");card.appendChild(body);
 var pidx=S.caCurrentPlayer;
 var total=S.caPlayers.length;
 /* Indicatore turno */
 var stepDiv=document.createElement("div");
 stepDiv.style.cssText="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#aaa;text-align:center;margin:18px 0 6px;";
 stepDiv.textContent=(pidx+1)+" / "+total;
 body.appendChild(stepDiv);
 var nameDiv=document.createElement("div");
 nameDiv.style.cssText="font-size:22px;font-weight:900;text-align:center;margin-bottom:4px;color:var(--dark);";
 nameDiv.textContent=S.caPlayers[pidx];
 body.appendChild(nameDiv);
 var instrDiv=document.createElement("div");
 instrDiv.style.cssText="font-size:14px;text-align:center;color:#888;margin-bottom:20px;line-height:1.4;padding:0 12px;";
 instrDiv.textContent=T("ui_scrivi_una_confessione_anonima_qualcosa");
 body.appendChild(instrDiv);
 var _sq=adultiPick("caQ");
 if(_sq){
  var qc=div("adulti-q");qc.appendChild(div("adulti-q-label",T("adultiIdea")));
  var qt=div("adulti-q-text",_sq);qc.appendChild(qt);
  qc.appendChild(btn("adulti-q-next",T("adultiOtherIdea"),function(){adultiNext("caQ");qt.textContent=adultiPick("caQ");}));
  body.appendChild(qc);
 }
 var ta=document.createElement("textarea");
 ta.placeholder=T("ui_la_mia_confessione");
 ta.style.cssText="width:100%;min-height:120px;border:2px solid #e0e0e0;border-radius:14px;padding:14px;font-size:16px;font-family:inherit;resize:none;box-sizing:border-box;outline:none;color:var(--dark);background:var(--bg);";
 ta.onfocus=function(){this.style.borderColor=bg;};
 ta.onblur=function(){this.style.borderColor="#e0e0e0";};
 body.appendChild(ta);
 var hint=document.createElement("div");
 hint.style.cssText="font-size:12px;color:#aaa;text-align:center;margin:8px 0 20px;";
 hint.textContent=T("ui_tieni_il_telefono_verso_di");
 body.appendChild(hint);
 var btnLabel=pidx<total-1?T("ui_passa_al_prossimo"):T("ui_mescola_e_inizia");
 var submitWrap=div("");submitWrap.style.cssText="text-align:center;";
 submitWrap.appendChild(btn("ebtn",btnLabel,function(){
  var txt=ta.value.trim();
  if(!txt){ta.style.borderColor="#e44";ta.focus();return;}
  S.caConfessioni.push(txt);
  if(S.caCurrentPlayer<total-1){
   S.caCurrentPlayer++;
   render();
  } else {
   /* mescola */
   var arr=S.caConfessioni.slice();
   for(var i=arr.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=arr[i];arr[i]=arr[j];arr[j]=t;}
   S.caOrder=arr;
   S.caReadIdx=0;
   S.screen="ca_read";
   render();
  }
 }));
 body.appendChild(submitWrap);
 wrap.appendChild(card);
 document.getElementById("root").appendChild(wrap);
}

function renderCaRead(){
 clr();
 var cat=getCatById(S.cat);
 var bg=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;
 var wrap=div("intesa-wrap");
 var hdr=div("dhdr");hdr.style.background=bg;
 var dhdrTop=div("dhdr-top");hdr.appendChild(dhdrTop);
 dhdrTop.appendChild(btn("card-nav-btn back",T("backToGames"),goBackToGames));
 dhdrTop.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 hdr.appendChild(div("dtitle",T("ui_confessioni_anonime")));
 var card=div("dcard");card.appendChild(hdr);
 var body=div("dbody");card.appendChild(body);
 var idx=S.caReadIdx;
 var total=S.caOrder.length;
 /* Contatore */
 var stepDiv=document.createElement("div");
 stepDiv.style.cssText="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#aaa;text-align:center;margin:18px 0 14px;";
 stepDiv.textContent=T("ui_confessione")+(idx+1)+T("ui_di_2")+total;
 body.appendChild(stepDiv);
 /* Bolla confessione */
 var bubble=document.createElement("div");
 bubble.style.cssText="background:"+bg+";border-radius:20px;padding:24px 20px;margin:0 8px 24px;font-size:18px;line-height:1.5;font-weight:600;text-align:center;color:#fff;min-height:80px;display:flex;align-items:center;justify-content:center;";
 bubble.textContent=S.caOrder[idx];
 body.appendChild(bubble);
 var voteDiv=document.createElement("div");
 voteDiv.style.cssText="font-size:14px;color:#888;text-align:center;margin-bottom:24px;";
 voteDiv.textContent=T("ui_il_gruppo_vota_di_chi");
 body.appendChild(voteDiv);
 var btnsWrap=div("endbtns");
 if(idx<total-1){
  btnsWrap.appendChild(btn("ebtn",T("ui_prossima_confessione"),function(){
   S.caReadIdx++;
   render();
  }));
 } else {
  btnsWrap.appendChild(btn("ebtn",T("ui_risultati_finali_2"),function(){
   S.screen="ca_end";render();
  }));
 }
 body.appendChild(btnsWrap);
 wrap.appendChild(card);
 document.getElementById("root").appendChild(wrap);
}

function renderCaEnd(){
 clr();
 addBackArrow(goBackToGames);
 var wrap=div("qv-wrap");
 var wt=div("end-title");wt.textContent=T("ui_fine_del_gioco");wrap.appendChild(wt);
 wrap.appendChild(div("end-sub",T("ui_tutte_le")+S.caOrder.length+T("ui_confessioni_sono_state_svelate")));
 var btns=div("endbtns");
 btns.appendChild(btn("ebtn",T("ui_gioca_ancora"),function(){startCa(S.caPlayers);}));
 btns.appendChild(btn("ebtn out",T("exitBtn"),goHome));
 wrap.appendChild(btns);
 document.getElementById("root").appendChild(wrap);
}

function renderGame(){
 clr();
 var cat=getCatById(S.cat);
 var g=curGame();
 if(!g){S.screen="games";S.game=null;render();return;}
 var panel=div("panel");var card=div("dcard");panel.appendChild(card);
 var hdr=div("dhdr");hdr.style.background=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:cat.bg;card.appendChild(hdr);
 var dhdrTop=div("dhdr-top");hdr.appendChild(dhdrTop);
 dhdrTop.appendChild(btn("card-nav-btn back",T("backToGames"),goBackToGames));
 dhdrTop.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 hdr.appendChild(div("dtitle",g.name));
 var bdg=div("dbadges");hdr.appendChild(bdg);
 bdg.appendChild(el("span","dbadge",g.players+" "+T("players")));
 bdg.appendChild(el("span","dbadge",g.time));
 bdg.appendChild(el("span","dbadge",getCatName(cat.id)));
 var body=div("dbody");card.appendChild(body);
 
 body.appendChild(div("rlabel",T("howToPlay")));body.appendChild(div("rtext",g.rules));
 if(g.tip){var tip=div("tip");tip.innerHTML="<strong>"+T("tipLabel")+"</strong> \u2014 "+g.tip;body.appendChild(tip);}
 if(g.questions){
 // Domande una alla volta, a schede
 var flat=[];g.questions.forEach(function(rd){(rd.items||[]).forEach(function(it){flat.push({label:rd.label,text:it});});});
 var qKey=(g._it||g.name);
 if(S.qCardKey!==qKey){S.qCardKey=qKey;S.qCardIdx=0;}
 if(S.qCardIdx>=flat.length)S.qCardIdx=flat.length-1;if(S.qCardIdx<0)S.qCardIdx=0;
 var cur=flat[S.qCardIdx];
 body.appendChild(div("rlabel",T("theQuestions")));
 var qc=div("qcard");body.appendChild(qc);
 qc.appendChild(div("qcard-round",cur.label));
 qc.appendChild(div("qcard-text",cur.text));
 qc.appendChild(div("qcard-count",(S.qCardIdx+1)+" / "+flat.length));
 var qn=div("qcard-nav");body.appendChild(qn);
 var prev=btn("ebtn out",T("ui_precedente"),function(){S.qCardIdx--;renderGame();});
 if(S.qCardIdx===0)prev.disabled=true;
 qn.appendChild(prev);
 if(S.qCardIdx<flat.length-1)qn.appendChild(btn("ebtn",T("qvNextQuestion"),function(){S.qCardIdx++;renderGame();}));
 }
 var ew=div("");ew.style.cssText="text-align:center;margin-top:26px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;";
 if(S.fromStarter){
 ew.appendChild(btn("ebtn out",T("backToGame"),function(){S.fromStarter=false;S.screen="starter";render();}));
 }
 if(g.mrwhite){
 ew.appendChild(btn("ebtn",T("startMrWhite"),function(){S.screen="mrwhite_setup";render();}));
 }
 ew.appendChild(btn("ebtn",T("endGame"),function(){S.fromStarter=false;endGame(g.name);}));
 body.appendChild(ew);
 document.getElementById("root").appendChild(panel);
}

function renderEnd(){
 clr();
 addBackArrow(goHome);
 var panel=div("panel");var screen=div("endscreen");panel.appendChild(screen);
  screen.appendChild(div("end-title",T("gameOver")));
 screen.appendChild(div("end-sub",T("rateGame")+S.lastGame));
 var sw=div("stars");screen.appendChild(sw);
 var rMsg=div("rating-msg",T("rateStars"));screen.appendChild(rMsg);
 for(var i=1;i<=5;i++){(function(n){
 var s=div("star "+(S.stars>=n?"lit":""));s.innerHTML=STAR_SVG;
 s.onclick=function(){S.stars=n;logRating(S.lastGame,n);var all=document.querySelectorAll(".star");for(var j=0;j<all.length;j++)all[j].className="star"+(j<n?" lit":"");rMsg.textContent=getMsg(n);};
 sw.appendChild(s);
 })(i);}
 var ms=div("menu-section");screen.appendChild(ms);
 var toast=div("order-toast","");ms.appendChild(toast);
 var tabs=div("menu-tabs");ms.appendChild(tabs);
 var tD=div("menu-tab "+(S.menuTab==="drink"?"on":""));tD.textContent=T("menuDrink");tabs.appendChild(tD);
 var tF=div("menu-tab "+(S.menuTab==="food"?"on":""));tF.textContent=T("menuFood");tabs.appendChild(tF);
 var mgrid=div("menu-grid");ms.appendChild(mgrid);
 function buildMenu(tab){
 mgrid.innerHTML="";
 var items=MENU[tab]||[];
 for(var i=0;i<items.length;i++){(function(item,idx){
 var card=div("menu-card");
 card.style.padding="0";card.style.overflow="hidden";card.style.textAlign="center";
 if(item.photo){
  var img=document.createElement("img");
  img.src=item.photo;
  img.style.cssText="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;border-radius:14px 14px 0 0;";
  card.appendChild(img);
  var inner=document.createElement("div");inner.style.cssText="padding:6px 6px 10px;";
  inner.appendChild(el("span","mc-name",item.name));
  inner.appendChild(el("span","mc-desc",item.desc));
  inner.appendChild(el("span","mc-price","\u20ac "+item.price));
  card.appendChild(inner);
 } else {
  var inner2=document.createElement("div");inner2.style.cssText="padding:18px 12px;";
  inner2.appendChild(el("span","mc-emoji",String(item.name||"?").trim().charAt(0).toUpperCase()));
  inner2.appendChild(el("span","mc-name",item.name));
  inner2.appendChild(el("span","mc-desc",item.desc));
  inner2.appendChild(el("span","mc-price","\u20ac "+item.price));
  card.appendChild(inner2);
 }
 card.onclick=(function(iname,itab){return function(){toast.textContent=iname+" (\u20ac "+item.price+") \u2014 "+T("menuCallWaiter");toast.style.display="block";setTimeout(function(){toast.style.display="none";},4000);logMenuClick(itab,iname);};})(item.name,tab);
 mgrid.appendChild(card);
 })(items[i],i);}
 }
 tD.onclick=function(){S.menuTab="drink";tD.className="menu-tab on";tF.className="menu-tab";buildMenu("drink");};
 tF.onclick=function(){S.menuTab="food";tF.className="menu-tab on";tD.className="menu-tab";buildMenu("food");};
 buildMenu(S.menuTab);
 ms.appendChild(div("menu-note",T("menuNote")));;
 var eb=div("endbtns");screen.appendChild(eb);
 eb.appendChild(btn("ebtn out",T("otherGames"),function(){S.screen="games";render();}));
 eb.appendChild(btn("ebtn out",T("ui_chi_paga_il_conto"),function(){if(typeof openChiPaga==="function")openChiPaga();}));
 eb.appendChild(btn("ebtn",T("exitBtn"),goHome));
 document.getElementById("root").appendChild(panel);
}


function startQuizWithLevel(level){
 S.quizLevel=level;
 S.quizIdx=0;S.quizRevealed=false;S.quizScore=0;S.quizCountedIdx=-1;
 if(!S.quizPlayers||!S.quizPlayers.length)S.quizPlayers=[(typeof FILOS_NAME!=="undefined"&&FILOS_NAME)||(T("qvPlayer")+"1")];
 S.quizScores={};S.quizPlayers.forEach(function(p){S.quizScores[p]=0;});S.quizPick={};
 var allQ=quizDataFor(S.quizGame).questions;
 var total=allQ.length;
 // Split into thirds: facile=first third, media=middle, difficile=last third
 var third=Math.floor(total/3);
 var pool;
 if(level==="facile") pool=allQ.slice(0,third);
 else if(level==="media") pool=allQ.slice(third,third*2);
 else pool=allQ.slice(third*2);
 // Shuffle
 pool=pool.slice();
 for(var ii=pool.length-1;ii>0;ii--){var jj=Math.floor(Math.random()*(ii+1));var tmp=pool[ii];pool[ii]=pool[jj];pool[jj]=tmp;}
 S.quizQuestions=pool.slice(0,10);
 S.screen="quiz";render();
}

function renderQuizLevel(){
 clr();
 addBackArrow(goBackToGames);
 var cat=getCatById(S.cat);
 var wrap=div("quiz-level-wrap");
 var gameName=(curGame()||{}).name||S.quizGame;
 var title=div("quiz-level-title",gameName);wrap.appendChild(title);
 // Giocatori: ognuno ha il suo punteggio
 var pw=div("quiz-players");wrap.appendChild(pw);
 pw.appendChild(div("rlabel",T("howMany")));
 var qInputs=[];var qGrid=div("player-names-grid");
 function buildQNames(n){
  var prev=qInputs.map(function(i){return i.value;});
  qGrid.innerHTML="";qInputs=[];
  for(var i=0;i<n;i++){(function(idx){
   var row=div("player-name-row");
   var lbl=div("player-name-label");lbl.textContent=T("qvPlayer")+(idx+1);row.appendChild(lbl);
   var inp=document.createElement("input");inp.type="text";inp.className="player-name-input";
   inp.placeholder=T("playerNamePH")+(idx+1);inp.maxLength=20;
   inp.value=prev[idx]!==undefined?prev[idx]:((S.quizPlayers&&S.quizPlayers[idx])||(idx===0&&typeof FILOS_NAME!=="undefined"&&FILOS_NAME?FILOS_NAME:""));
   row.appendChild(inp);qInputs.push(inp);qGrid.appendChild(row);
  })(i);}
 }
 pw.appendChild(makeStepperWidget(S.quizNumPlayers||(S.quizPlayers?S.quizPlayers.length:2),1,10,function(n){S.quizNumPlayers=n;buildQNames(n);}));
 pw.appendChild(qGrid);
 window._quizReadPlayers=function(){
  var seen={};return qInputs.map(function(inp,i){var v=inp.value.trim()||(T("qvPlayer")+(i+1));while(seen[v])v=v+" "+(i+1);seen[v]=1;return v;});
 };
 wrap.appendChild(div("quiz-level-sub",T("quizChooseLevel")));
 var grid=div("quiz-level-grid");wrap.appendChild(grid);

 var levels=[
 {id:"facile",stars:"",name:T("ui_facile"),desc:T("ui_domande_accessibili_per_tutti"),cls:"ql-facile"},
 {id:"media",stars:"",name:T("ui_media"),desc:T("ui_qualche_sfida_in_piu"),cls:"ql-media"},
 {id:"difficile",stars:"",name:T("ui_difficile"),desc:T("ui_solo_per_esperti"),cls:"ql-difficile"}
 ];

 for(var i=0;i<levels.length;i++){
 (function(lv){
 var card=div("quiz-level-card "+lv.cls);
 card.appendChild(el("span","ql-stars",lv.stars));
 card.appendChild(el("span","ql-name",lv.name));
 card.appendChild(el("span","ql-desc",lv.desc));
 card.onclick=function(){if(window._quizReadPlayers)S.quizPlayers=window._quizReadPlayers();startQuizWithLevel(lv.id);};
 grid.appendChild(card);
 })(levels[i]);
 }

 // back button
 var bw=div("endbtns");wrap.appendChild(bw);
 bw.appendChild(btn("ebtn out",T("backToGames"),goBackToGames));
 document.getElementById("root").appendChild(wrap);
}

function renderQuiz(){
 clr();
 addBackArrow(goBackToGames);
 var qdata=quizDataFor(S.quizGame);var total=S.quizQuestions.length;
 if(S.quizIdx>=total){
 var wrap=div("quiz-wrap");var sc=div("quiz-score");wrap.appendChild(sc);
 
 sc.appendChild(div("quiz-score-title",T("ui_quiz_terminato")));
 var pl=S.quizPlayers||[];
 if(pl.length<=1){
  var my=pl.length?(S.quizScores[pl[0]]||0):S.quizScore;
  sc.appendChild(div("quiz-score-num",my+"/"+total));
  sc.appendChild(div("quiz-score-sub",T("ui_domande_corrette_su")+total));
  var pct=my/total;
  var msg=pct>=0.9?T("ui_fenomenale"):pct>=0.7?T("ui_ottimo"):pct>=0.5?T("ui_non_male"):T("ui_riprova");
  var msgEl=div("quiz-score-msg",msg);msgEl.style.color=pct>=0.7?"var(--orange)":"var(--muted)";sc.appendChild(msgEl);
 } else {
  var best=Math.max.apply(null,pl.map(function(p){return S.quizScores[p]||0;}));
  var winners=pl.filter(function(p){return (S.quizScores[p]||0)===best;});
  sc.appendChild(div("quiz-score-msg",best===0?T("ui_nessuno_ha_indovinato"):winners.length>1?T("qvTie")+" "+winners.join(", "):winners[0]+" "+T("qvWon")));
  var lb=div("quiz-board");sc.appendChild(lb);
  pl.slice().sort(function(a,b){return (S.quizScores[b]||0)-(S.quizScores[a]||0);}).forEach(function(p,i){
   var r=div("quiz-board-row"+((S.quizScores[p]||0)===best&&best>0?" win":""));
   r.appendChild(el("span","quiz-board-pos",String(i+1)));
   r.appendChild(el("span","quiz-board-name",p));
   r.appendChild(el("span","quiz-board-pts",(S.quizScores[p]||0)+" / "+total));
   lb.appendChild(r);
  });
 }
 var btns=div("endbtns");sc.appendChild(btns);
 btns.appendChild(btn("ebtn",T("changeLevel"),function(){S.screen="quizlevel";render();}));
 btns.appendChild(btn("ebtn out",T("qvPlayAgain"),function(){startQuizWithLevel(S.quizLevel);}));
 btns.appendChild(btn("ebtn out",T("exitBtn"),goHome));
 document.getElementById("root").appendChild(wrap);return;
 }
 var q=S.quizQuestions[S.quizIdx];
 var wrap=div("quiz-wrap");
 var hdr=div("quiz-header");wrap.appendChild(hdr);
 hdr.appendChild(div("quiz-title",(curGame()||{}).name||S.quizGame));hdr.appendChild(div("quiz-counter",T("quizQuestion")+(S.quizIdx+1)+" / "+total));
 var prog=div("quiz-progress");wrap.appendChild(prog);
 var bar=div("quiz-progress-bar");bar.style.width=Math.round((S.quizIdx/total)*100)+"%";prog.appendChild(bar);
 var sb=div("qv-scores");wrap.appendChild(sb);
 var _pl=S.quizPlayers||[];var _mx=Math.max.apply(null,_pl.map(function(p){return S.quizScores[p]||0;}).concat([0]));
 _pl.forEach(function(p){var c=div("qv-score-chip"+((S.quizScores[p]||0)===_mx&&_mx>0?" leader":""));c.textContent=p+": "+(S.quizScores[p]||0);sb.appendChild(c);});
 var card=div("quiz-card");wrap.appendChild(card);
 var chdr=div("quiz-card-hdr");chdr.style.background=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:qdata.bg;card.appendChild(chdr);
 // Bandiere: sfondo bianco, così i colori delle bandiere si vedono bene
 if(S.quizGame==="CHE BANDIERA \u00c8?"){chdr.style.background="#fff";chdr.classList.add("light");}
 var qnav=div("dhdr-top");chdr.appendChild(qnav);
 qnav.appendChild(btn("card-nav-btn back",T("backToGames"),goBackToGames));
 qnav.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 var qqEl=document.createElement("div");qqEl.className="quiz-q";
 if(q.q.indexOf("<img")>=0||q.q.indexOf("data:image")>=0||q.q.indexOf("flagcdn")>=0){qqEl.innerHTML=q.q;}else{qqEl.textContent=q.q;}
 chdr.appendChild(qqEl);chdr.appendChild(div("quiz-hint",qdata.hint));
 var body=div("quiz-body");card.appendChild(body);
 if(!S.quizRevealed){
 body.appendChild(btn("quiz-reveal-btn",T("quizReveal"),function(){S.quizRevealed=true;renderQuiz();}));
 } else {
 var ans=div("quiz-answer correct");ans.textContent=q.a;body.appendChild(ans);
 if(q.extra){body.appendChild(div("quiz-answer-sub",q.extra));}
 var pl=S.quizPlayers||[];
 body.appendChild(div("quiz-who",pl.length>1?T("ui_chi_ha_indovinato"):T("ui_hai_indovinato")));
 var picks=div("quiz-picks");body.appendChild(picks);
 if(!S.quizPick)S.quizPick={};
 pl.forEach(function(p){
  var b=btn("quiz-pick"+(S.quizPick[p]?" on":""),p,function(){S.quizPick[p]=!S.quizPick[p];b.className="quiz-pick"+(S.quizPick[p]?" on":"");});
  picks.appendChild(b);
 });
 var nav=div("quiz-nav");body.appendChild(nav);
 var last=S.quizIdx+1>=total;
 var nb=btn("ebtn",last?T("ui_risultati_finali"):T("qvNextQuestion"),function(){
  if(S.quizCountedIdx!==S.quizIdx){S.quizCountedIdx=S.quizIdx;pl.forEach(function(p){if(S.quizPick[p]){S.quizScores[p]=(S.quizScores[p]||0)+1;}});}
  S.quizPick={};S.quizIdx++;S.quizRevealed=false;render();
 });
 nb.style.cssText="flex:1;";
 nav.appendChild(nb);
 }
 document.getElementById("root").appendChild(wrap);
}

function renderStarter(){
 clr();
 addBackArrow(goBackToGames);
 var gameName=S.starterGame;var allPhrases=spDeck(gameName,S.starterGameIt)||[];
 // Shuffle and pick random phrases each session (10 for IL SUSSURRO, 25 for others)
 // Mescola una volta sola per partita (prima si rimescolava a ogni frase e alcune si ripetevano)
 var _dk=gameName+"|"+LANG;
 if(!S.starterDeck||S.starterDeck.key!==_dk||S.starterIdx===0||S.starterDeck.src!==allPhrases.length){
  var sh=allPhrases.slice();
  for(var si=sh.length-1;si>0;si--){var sj=Math.floor(Math.random()*(si+1));var st=sh[si];sh[si]=sh[sj];sh[sj]=st;}
  S.starterDeck={key:_dk,list:sh,src:allPhrases.length};
 }
 var shuffled=S.starterDeck.list;
 var maxPhrases=(gameName==="IL SUSSURRO"||gameName==="THE WHISPER"||gameName==="EL SUSURRO")?10:(gameName==="CHI È PIÙ PROBABILE? (COPPIA)"||gameName==="WHO'S MORE LIKELY? (COUPLE)"||gameName==="¿QUIÉN ES MÁS PROBABLE? (PAREJA)")?15:(gameName==="SCALA DA 1 A 10"||gameName==="SCALE OF 1 TO 10"||gameName==="ESCALA DEL 1 AL 10")?20:25;
 var phrases=shuffled.slice(0,Math.min(maxPhrases,shuffled.length));var total=phrases.length;
 if(S.starterIdx>=total){
 var wrap=div("starter-wrap");var final=div("starter-final");wrap.appendChild(final);
 
 final.appendChild(div("starter-final-title",T("starterNowYou")));
 final.appendChild(div("starter-final-sub",T("starterContinue")));
 var btns=div("endbtns");final.appendChild(btns);
 btns.appendChild(btn("ebtn",T("starterStart"),function(){S.screen="game";render();}));
 btns.appendChild(btn("ebtn out",T("starterEnd"),function(){endGame(S.starterGame);}));
 btns.appendChild(btn("ebtn out",T("exitBtn"),goHome));
 document.getElementById("root").appendChild(wrap);return;
 }
 var phrase=phrases[S.starterIdx];var cat=getCatById(S.cat);
 var wrap=div("starter-wrap");
 var hdr=div("starter-header");wrap.appendChild(hdr);
 hdr.appendChild(div("starter-title",gameName));hdr.appendChild(div("starter-counter",T("ui_frase")+(S.starterIdx+1)+" / "+total));
 var prog=div("starter-progress");wrap.appendChild(prog);
 var bar=div("starter-bar");bar.style.width=Math.round((S.starterIdx/total)*100)+"%";prog.appendChild(bar);
 var card=div("starter-card");wrap.appendChild(card);
 var chdr=div("starter-card-hdr");chdr.style.background=(CAT_PASTEL&&CAT_PASTEL[S.cat])?CAT_PASTEL[S.cat]:(cat?cat.bg:"linear-gradient(135deg,#1C1208,#3a2a10)");card.appendChild(chdr);
 var snav=div("dhdr-top");chdr.appendChild(snav);
 snav.appendChild(btn("card-nav-btn back",T("backToGames"),goBackToGames));
 snav.appendChild(btn("card-nav-btn",T("exitBtn"),goHome));
 chdr.appendChild(div("starter-phrase",phrase));
 var body=div("starter-body");card.appendChild(body);
 body.appendChild(div("starter-hint",T("starterInstruct")));
 var nav=div("starter-nav");body.appendChild(nav);
 if(S.starterIdx<total-1){nav.appendChild(btn("ebtn",T("starterNext"),function(){S.starterIdx++;renderStarter();}));}
 else{nav.appendChild(btn("ebtn",T("starterDone"),function(){S.starterIdx++;renderStarter();}));}
 nav.appendChild(btn("ebtn out",T("ui_vedi_le_regole"),function(){S.fromStarter=true;S.screen="game";render();}));
 document.getElementById("root").appendChild(wrap);
}

function renderMenuEditor(panel){
 var me=div("");me.style.marginTop="28px";
 var metitle=div("");metitle.style.cssText="font-family:'Space Grotesk',sans-serif;font-size:28px;letter-spacing:2px;color:var(--dark);margin-bottom:16px;";metitle.textContent=T("ui_modifica_menu");me.appendChild(metitle);
 var mtabs=div("me-tabs");me.appendChild(mtabs);
 var tD=div("me-tab "+(S.menuEdTab==="drink"?"on":""));tD.textContent=T("menuDrink");
 var tF=div("me-tab "+(S.menuEdTab==="food"?"on":""));tF.textContent=T("menuFood");
 mtabs.appendChild(tD);mtabs.appendChild(tF);
 var mContent=div("");me.appendChild(mContent);

 var ALLERGENI=["Glutine","Latte","Uova","Arachidi","Frutta a guscio","Soia","Pesce","Molluschi","Sedano","Senape","Sesamo","Lupini","Anidride solforosa"];

 function makeProductCard(tab,idx){
  var it=MENU[tab][idx];
  var card=document.createElement("div");
  card.style.cssText="background:#fff;border-radius:16px;margin-bottom:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);";

  // FOTO
  var photoZone=document.createElement("div");
  photoZone.style.cssText="position:relative;width:100%;background:#f0f0f0;min-height:140px;display:flex;align-items:center;justify-content:center;";

  function refreshPhoto(){
   photoZone.innerHTML="";
   var cur=MENU[tab][idx];
   if(cur&&cur.photo){
    var imgEl=document.createElement("img");
    imgEl.src=cur.photo;
    imgEl.style.cssText="width:100%;height:180px;object-fit:cover;display:block;";
    photoZone.appendChild(imgEl);
    var rmBtn=document.createElement("button");
    rmBtn.innerHTML=T("ui_rimuovi_foto");
    rmBtn.style.cssText="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:20px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;";
    rmBtn.onclick=function(){MENU[tab][idx].photo=null;saveMenu();refreshPhoto();};
    photoZone.appendChild(rmBtn);
   } else {
    var addLbl=document.createElement("label");
    addLbl.style.cssText="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:140px;cursor:pointer;gap:8px;";
    var ic=document.createElement("div");ic.style.fontSize="36px";ic.textContent="";
    var lt=document.createElement("div");lt.style.cssText="font-size:13px;font-weight:700;letter-spacing:1px;color:#aaa;text-transform:uppercase;";lt.textContent=T("ui_tocca_per_aggiungere_foto");
    var fi=document.createElement("input");fi.type="file";fi.accept="image/*";fi.style.display="none";
    fi.onchange=function(){
     var file=this.files[0];if(!file)return;
     var reader=new FileReader();
     reader.onload=function(e){
      var img=new Image();
      img.onload=function(){
       var mW=800,mH=600,w=img.width,h=img.height;
       if(w>mW){h=Math.round(h*mW/w);w=mW;}
       if(h>mH){w=Math.round(w*mH/h);h=mH;}
       var c=document.createElement("canvas");c.width=w;c.height=h;
       c.getContext("2d").drawImage(img,0,0,w,h);
       MENU[tab][idx].photo=c.toDataURL("image/jpeg",0.75);
       saveMenu();refreshPhoto();
      };
      img.src=e.target.result;
     };
     reader.readAsDataURL(file);
    };
    addLbl.appendChild(ic);addLbl.appendChild(lt);addLbl.appendChild(fi);
    photoZone.appendChild(addLbl);
   }
  }
  refreshPhoto();
  card.appendChild(photoZone);

  // CAMPI
  var body=document.createElement("div");
  body.style.cssText="padding:14px 16px;display:flex;flex-direction:column;gap:10px;";

  function mkLabel(t){var l=document.createElement("div");l.style.cssText="font-size:11px;font-weight:700;letter-spacing:1px;color:#aaa;text-transform:uppercase;margin-bottom:2px;";l.textContent=t;return l;}
  function mkInput(val,ph,w){var i=document.createElement("input");i.type="text";i.value=val||"";i.placeholder=ph;i.style.cssText="width:"+(w||"100%")+";border:none;border-bottom:1.5px solid #e0e0e0;padding:4px 0;font-size:15px;font-family:'DM Sans',sans-serif;background:transparent;outline:none;box-sizing:border-box;";return i;}

  var inName=mkInput(it.name,T("ui_nome_prodotto"),"100%");
  var inDesc=document.createElement("textarea");inDesc.value=it.desc||"";inDesc.placeholder=T("ui_descrizione");inDesc.rows=2;
  inDesc.style.cssText="width:100%;border:none;border-bottom:1.5px solid #e0e0e0;padding:4px 0;font-size:14px;font-family:'DM Sans',sans-serif;background:transparent;outline:none;resize:none;box-sizing:border-box;";
  var inPrice=mkInput(it.price,"0.00","100px");

  // Allergeni
  var algGrid=document.createElement("div");algGrid.style.cssText="display:flex;flex-wrap:wrap;gap:6px;";
  var itAllergeni=it.allergeni||[];
  ALLERGENI.forEach(function(a){
   var chip=document.createElement("div");
   var on=itAllergeni.indexOf(a)>=0;
   chip.textContent=a;
   chip.style.cssText="padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;"+(on?"background:#E8571A;color:#fff;":"background:#f0f0f0;color:#888;");
   chip.onclick=function(){
    var cur=MENU[tab][idx].allergeni||[];
    var pos=cur.indexOf(a);
    if(pos>=0){cur.splice(pos,1);}else{cur.push(a);}
    MENU[tab][idx].allergeni=cur;
    saveMenu();
    var isOn=cur.indexOf(a)>=0;
    chip.style.background=isOn?"#E8571A":"#f0f0f0";
    chip.style.color=isOn?"#fff":"#888";
   };
   algGrid.appendChild(chip);
  });

  function saveFields(){
   MENU[tab][idx].name=inName.value.toUpperCase();
   MENU[tab][idx].desc=inDesc.value;
   MENU[tab][idx].price=inPrice.value;
   saveMenu();
  }
  inName.onblur=saveFields;inDesc.onblur=saveFields;inPrice.onblur=saveFields;

  var delBtn=document.createElement("button");
  delBtn.textContent=T("ui_elimina_prodotto");
  delBtn.style.cssText="margin-top:4px;border:none;background:none;color:#ccc;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;cursor:pointer;text-align:left;padding:0;";
  delBtn.onclick=function(){if(confirm(T("ui_eliminare_questo_prodotto"))){MENU[tab].splice(idx,1);saveMenu();buildEditor(tab);}};

  body.appendChild(mkLabel(T("ui_titolo")));body.appendChild(inName);
  body.appendChild(mkLabel(T("ui_descrizione")));body.appendChild(inDesc);
  body.appendChild(mkLabel(T("ui_prezzo")));body.appendChild(inPrice);
  body.appendChild(mkLabel(T("ui_allergeni")));body.appendChild(algGrid);
  body.appendChild(delBtn);
  card.appendChild(body);
  return card;
 }

 function buildEditor(tab){
  mContent.innerHTML="";
  var items=MENU[tab]||[];
  var list=document.createElement("div");list.style.marginTop="16px";
  mContent.appendChild(list);
  for(var i=0;i<items.length;i++){list.appendChild(makeProductCard(tab,i));}
  var addBtn=document.createElement("button");
  addBtn.textContent=T("ui_aggiungi_prodotto");
  addBtn.style.cssText="width:100%;padding:14px;margin-top:4px;border:2px dashed #ddd;border-radius:14px;background:none;font-size:14px;font-weight:700;letter-spacing:1px;color:#aaa;cursor:pointer;";
  addBtn.onclick=function(){if(MENU[tab].length>=10){alert(T("ui_massimo_10_prodotti_per_categoria"));return;}MENU[tab].push({name:T("ui_nuovo_prodotto"),desc:"",price:"0.00",photo:null,allergeni:[]});saveMenu();buildEditor(tab);};
  list.appendChild(addBtn);
  var resetBtn=document.createElement("button");
  resetBtn.textContent=T("ui_ripristina_menu_default");
  resetBtn.style.cssText="margin-top:12px;width:100%;padding:10px;border:1px solid #eee;border-radius:10px;background:none;font-size:12px;color:#bbb;cursor:pointer;";
  resetBtn.onclick=function(){if(confirm(T("ui_ripristinare_il_menu")+tab+T("ui_predefinito"))){MENU[tab]=MENU_DEFAULT[tab].map(function(x){return Object.assign({},x,{photo:null,allergeni:[]});});saveMenu();buildEditor(tab);}};
  list.appendChild(resetBtn);
 }

 tD.onclick=function(){S.menuEdTab="drink";tD.className="me-tab on";tF.className="me-tab";buildEditor("drink");};
 tF.onclick=function(){S.menuEdTab="food";tF.className="me-tab on";tD.className="me-tab";buildEditor("food");};
 buildEditor(S.menuEdTab);panel.appendChild(me);
}

function renderAnalytics(){
 clr();
 addBackArrow(goHome);
 var root=document.getElementById("root");

 // ── PIN SCREEN ──
 if(!S.pinOK){
  var panel=div("panel");root.appendChild(panel);
  // Schermata PIN stile Apple — usa tastiera nativa del telefono
  var ps=div("");
  ps.style.cssText="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:20px;padding:40px 32px;";
  panel.appendChild(ps);

  var lockIcon=div("");lockIcon.style.cssText="width:60px;height:60px;border-radius:16px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;margin-bottom:4px;";
  lockIcon.innerHTML='<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  ps.appendChild(lockIcon);

  var titleEl=div("");titleEl.style.cssText="font-family:-apple-system,'Helvetica Neue',sans-serif;font-size:22px;font-weight:700;color:var(--dark,#111);letter-spacing:-0.4px;";titleEl.textContent=T("pinTitle");ps.appendChild(titleEl);
  var subEl=div("");subEl.style.cssText="font-size:14px;color:#8e8e93;margin-top:-8px;";subEl.textContent=T("pinSub");ps.appendChild(subEl);

  var pinInp=document.createElement("input");
  pinInp.type="password";pinInp.inputMode="numeric";pinInp.pattern="[0-9]*";
  pinInp.maxLength=4;pinInp.placeholder="• • • •";
  pinInp.autocomplete="off";
  pinInp.style.cssText=[
   "width:160px;text-align:center;font-size:32px;letter-spacing:12px;",
   "padding:14px 16px;border-radius:14px;border:1.5px solid "+(S.pinErr?"#ff3b30":"rgba(0,0,0,0.12)")+";",
   "background:var(--surface,#fff);color:var(--dark,#111);outline:none;",
   "font-family:-apple-system,sans-serif;-webkit-appearance:none;",
   "box-shadow:0 1px 4px rgba(0,0,0,0.06);"
  ].join("");
  ps.appendChild(pinInp);

  if(S.pinErr){
   var errEl=div("");errEl.style.cssText="font-size:13px;color:#ff3b30;font-weight:600;margin-top:-8px;";errEl.textContent=T("pinError");ps.appendChild(errEl);
  }

  // Auto-submit quando si raggiungono 4 cifre
  pinInp.addEventListener("input",function(){
   this.value=this.value.replace(/[^0-9]/g,"").slice(0,4);
   if(this.value.length===4){
    if(this.value===PIN){S.pinOK=true;S.pinErr=false;S.pinInput="";render();}
    else{S.pinErr=true;S.pinInput="";setTimeout(function(){S.pinErr=false;renderAnalytics();},900);renderAnalytics();}
   }
  });

  // Focus automatico → apre tastiera numerica sul telefono
  setTimeout(function(){try{pinInp.focus();}catch(e){}},120);
  return;
 }

 // ── ONBOARDING PRIMO ACCESSO ──
 var _pubNameOB="";try{_pubNameOB=localStorage.getItem("filos_pub_name")||"";}catch(e){}
 var _pubCodeOB="";try{_pubCodeOB=localStorage.getItem("filos_pub_code")||"";}catch(e){}
 if(!_pubNameOB||!_pubCodeOB){
  // Prima volta — schermata di benvenuto e configurazione
  var ob=div("");ob.style.cssText="max-width:480px;margin:0 auto;padding:32px 24px 48px;display:flex;flex-direction:column;gap:28px;";root.appendChild(ob);
  // Header benvenuto
  var obHdr=div("");obHdr.style.cssText="display:flex;flex-direction:column;align-items:center;gap:12px;padding-top:8px;";
  var obIcon=div("");obIcon.style.cssText="width:72px;height:72px;border-radius:20px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;";
  obIcon.innerHTML='<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  obHdr.appendChild(obIcon);
  var obTitle=div("");obTitle.style.cssText="font-size:24px;font-weight:800;color:var(--dark,#111);letter-spacing:-0.5px;text-align:center;";obTitle.textContent=T("obTitle");obHdr.appendChild(obTitle);
  var obSub=div("");obSub.style.cssText="font-size:15px;color:#636366;text-align:center;line-height:1.5;max-width:300px;";obSub.textContent=T("obSub");obHdr.appendChild(obSub);
  ob.appendChild(obHdr);
  // Form card
  var obCard=div("");obCard.style.cssText="background:var(--surface,#fff);border-radius:18px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);";
  function obField(label,placeholder,value,maxLen,filterFn){
   var wrap=div("");wrap.style.cssText="padding:14px 18px;display:flex;flex-direction:column;gap:6px;border-bottom:1px solid rgba(0,0,0,0.07);";
   var lbl=div("");lbl.style.cssText="font-size:11px;font-weight:700;color:#8e8e93;text-transform:uppercase;letter-spacing:0.6px;";lbl.textContent=label;
   var inp=document.createElement("input");inp.type="text";inp.value=value||"";inp.placeholder=placeholder;inp.maxLength=maxLen||40;
   inp.style.cssText="border:none;outline:none;background:transparent;font-size:17px;color:var(--dark,#111);font-family:inherit;width:100%;padding:0;";
   if(filterFn){inp.addEventListener("input",function(){var c=this.selectionStart;this.value=filterFn(this.value);this.selectionStart=this.selectionEnd=c;});}
   wrap.appendChild(lbl);wrap.appendChild(inp);inp._isField=true;
   return wrap;
  }
  var fNome=obField(T("obFieldName"),T("obFieldNamePH"),"",40);
  var fCode=obField(T("obFieldCode"),T("obFieldCodePH"),"",30,function(v){return v.toLowerCase().replace(/[^a-z0-9_.\-]/g,"");});
  // rimuovi bordo ultimo
  fCode.style.borderBottom="none";
  obCard.appendChild(fNome);obCard.appendChild(fCode);
  ob.appendChild(obCard);
  var obHint=div("");obHint.style.cssText="font-size:12px;color:#aeaeb2;text-align:center;margin-top:-12px;";obHint.textContent=T("ui_il_codice_pub_identifica_il");ob.appendChild(obHint);
  // Bottone
  var obErr=div("");obErr.style.cssText="font-size:13px;color:#ff3b30;font-weight:600;text-align:center;min-height:18px;";ob.appendChild(obErr);
  var obBtn=document.createElement("button");
  obBtn.style.cssText="width:100%;padding:16px;border-radius:14px;border:none;background:#1c1c1e;color:#fff;font-size:17px;font-weight:700;font-family:inherit;cursor:pointer;letter-spacing:-0.2px;";
  obBtn.textContent=T("obBtn");
  obBtn.onclick=function(){
   var nome=fNome.querySelector("input").value.trim();
   var code=fCode.querySelector("input").value.trim();
   if(!nome){obErr.textContent=T("obErrName");return;}
   if(!code||code.length<3){obErr.textContent=T("obErrCode");return;}
   try{localStorage.setItem("filos_pub_name",nome);}catch(e){}
   try{localStorage.setItem("filos_pub_code",code);}catch(e){}
   // Azzera analytics alla prima configurazione
   ANALYTICS={plays:[],ratings:{},menuClicks:{}};saveA();
   // Mostra conferma
   obBtn.textContent=T("obBtnDone");obBtn.style.background="#34c759";
   setTimeout(function(){S.settingsTab="profilo";renderAnalytics();},800);
  };
  ob.appendChild(obBtn);
  return;
 }

 // ── APPLE-STYLE SETTINGS ──
 if(!S.settingsTab) S.settingsTab="analytics";

 // Stili globali Apple Settings
 var style=document.createElement("style");
 style.textContent=[
  ".as-page{max-width:640px;margin:0 auto;padding:0 0 40px 0;font-family:-apple-system,'SF Pro Text','Helvetica Neue',sans-serif;}",
  ".as-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 4px;position:sticky;top:0;z-index:10;background:var(--bg,#f2f2f7);}",
  ".as-title{font-size:28px;font-weight:700;letter-spacing:-0.5px;color:var(--dark,#111);}",
  ".as-close{background:none;border:none;width:32px;height:32px;border-radius:50%;background:rgba(120,120,128,0.16);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--dark,#111);}",
  ".as-tabs{display:flex;gap:0;overflow-x:auto;padding:8px 16px;-webkit-overflow-scrolling:touch;scrollbar-width:none;}",
  ".as-tabs::-webkit-scrollbar{display:none;}",
  ".as-tab{flex-shrink:0;padding:7px 16px;border-radius:20px;border:none;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:#888;transition:all .18s;}",
  ".as-tab.on{background:#111;color:#fff;}",
  ".as-section{margin:20px 16px 0;}",
  ".as-section-title{font-size:12px;font-weight:600;color:#8e8e93;text-transform:uppercase;letter-spacing:.5px;padding:0 8px;margin-bottom:6px;}",
  ".as-group{background:var(--surface,#fff);border-radius:12px;overflow:hidden;}",
  ".as-row{display:flex;align-items:center;padding:13px 16px;gap:12px;border-bottom:1px solid rgba(0,0,0,.07);cursor:default;}",
  ".as-row:last-child{border-bottom:none;}",
  ".as-row-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}",
  ".as-row-body{flex:1;min-width:0;}",
  ".as-row-label{font-size:16px;color:var(--dark,#111);font-weight:400;}",
  ".as-row-sub{font-size:13px;color:#8e8e93;margin-top:2px;}",
  ".as-row-right{color:#8e8e93;font-size:15px;font-weight:400;flex-shrink:0;}",
  ".as-row-chevron{color:#c7c7cc;font-size:13px;flex-shrink:0;}",
  ".as-input{width:100%;background:none;border:none;outline:none;font-family:inherit;font-size:16px;color:var(--dark,#111);padding:0;}",
  ".as-input::placeholder{color:#c7c7cc;}",
  ".as-toggle{width:52px;height:32px;border-radius:16px;border:none;cursor:pointer;position:relative;transition:background .22s;flex-shrink:0;}",
  ".as-toggle-knob{position:absolute;top:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:left .22s;}",
  ".as-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 16px 0;}",
  ".as-stat{background:var(--surface,#fff);border-radius:12px;padding:14px 16px;}",
  ".as-stat-val{font-size:28px;font-weight:700;color:var(--dark,#111);letter-spacing:-1px;line-height:1;}",
  ".as-stat-label{font-size:12px;color:#8e8e93;margin-top:4px;font-weight:500;}",
  ".as-bar-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(0,0,0,.05);}",
  ".as-bar-row:last-child{border-bottom:none;}",
  ".as-bar-rank{width:18px;font-size:12px;color:#8e8e93;text-align:right;flex-shrink:0;}",
  ".as-bar-name{font-size:14px;color:var(--dark,#111);min-width:80px;max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;}",
  ".as-bar-track{flex:1;height:5px;background:rgba(0,0,0,.07);border-radius:3px;overflow:hidden;}",
  ".as-bar-fill{height:100%;border-radius:3px;background:#007aff;}",
  ".as-bar-val{font-size:12px;color:#8e8e93;flex-shrink:0;min-width:40px;text-align:right;}",
  ".as-btn{display:block;width:100%;padding:14px;border:none;border-radius:12px;font-family:inherit;font-size:16px;font-weight:600;cursor:pointer;text-align:center;margin-top:10px;}",
  ".as-btn-primary{background:#007aff;color:#fff;}",
  ".as-btn-destructive{background:none;border:1.5px solid #ff3b30;color:#ff3b30;}",
  ".as-btn-pdf{background:#34c759;color:#fff;}",
  "@media(prefers-color-scheme:dark){.as-page .as-group{background:#1c1c1e;}.as-page .as-row{border-color:rgba(255,255,255,.07);}.as-page .as-stat{background:#1c1c1e;}.as-page .as-bar-track{background:rgba(255,255,255,.1);}}"
 ].join("");
 root.appendChild(style);

 var page=div("as-page");root.appendChild(page);

 // Header
 var hdr=div("as-header");page.appendChild(hdr);
 hdr.appendChild(div("as-title",T("ui_impostazioni")));
 var closeX=document.createElement("button");closeX.className="as-close";closeX.innerHTML="&#10005;";
 closeX.onclick=function(){S.screen="home";S.pinOK=false;render();};hdr.appendChild(closeX);

 // Tab bar
 var tabsEl=div("as-tabs");page.appendChild(tabsEl);
 var TAB_DEFS=[
  {id:"profilo",label:T("tabProfilo")},
  {id:"analytics",label:T("tabAnalytics")},
  {id:"menu",label:T("ui_menu")},
  {id:"report",label:T("tabReport")},
  {id:"speciali",label:T("tabSerate")},
  {id:"admin",label:T("tabAdmin")}
 ];
 TAB_DEFS.forEach(function(td){
  var t=document.createElement("button");t.className="as-tab"+(S.settingsTab===td.id?" on":"");
  t.textContent=td.label;t.onclick=function(){S.settingsTab=td.id;renderAnalytics();};tabsEl.appendChild(t);
 });

 // ─────────────────────────────────────────────
 // Helper: crea un gruppo di righe
 function section(title,rows){
  var sec=div("as-section");page.appendChild(sec);
  if(title){var tl=div("as-section-title");tl.textContent=title;sec.appendChild(tl);}
  var grp=div("as-group");sec.appendChild(grp);
  rows.forEach(function(r){grp.appendChild(r);});
  return grp;
 }
 function row(icon,iconBg,label,sub,right,chevron){
  var r=div("as-row");
  if(icon){var ic=div("as-row-icon");ic.style.background=iconBg||"#e5e5ea";ic.textContent=icon;r.appendChild(ic);}
  var body=div("as-row-body");body.appendChild(Object.assign(div("as-row-label"),{textContent:label}));
  if(sub){body.appendChild(Object.assign(div("as-row-sub"),{textContent:sub}));}
  r.appendChild(body);
  if(right!=null){var rv=div("as-row-right");rv.textContent=right;r.appendChild(rv);}
  if(chevron){var ch=div("as-row-chevron");ch.innerHTML="&#8250;";r.appendChild(ch);}
  return r;
 }
 function inputRow(icon,iconBg,label,placeholder,value,maxlen,filter){
  var r=div("as-row");
  if(icon){var ic=div("as-row-icon");ic.style.background=iconBg||"#e5e5ea";ic.textContent=icon;r.appendChild(ic);}
  var body=div("as-row-body");body.appendChild(Object.assign(div("as-row-label"),{textContent:label}));
  var inp=document.createElement("input");inp.className="as-input";inp.placeholder=placeholder;inp.value=value||"";inp.maxLength=maxlen||50;
  if(filter)inp.oninput=function(){this.value=filter(this.value);};
  body.appendChild(inp);r.appendChild(body);
  r._input=inp;return r;
 }
 function toggleRow(icon,iconBg,label,sub,isOn,onChange){
  var r=div("as-row");
  if(icon){var ic=div("as-row-icon");ic.style.background=iconBg||"#e5e5ea";ic.textContent=icon;r.appendChild(ic);}
  var body=div("as-row-body");body.appendChild(Object.assign(div("as-row-label"),{textContent:label}));
  if(sub){body.appendChild(Object.assign(div("as-row-sub"),{textContent:sub}));}
  r.appendChild(body);
  var tog=document.createElement("button");tog.className="as-toggle";
  tog.style.background=isOn?"#34c759":"#e5e5ea";
  var knob=div("as-toggle-knob");knob.style.left=isOn?"23px":"3px";tog.appendChild(knob);
  tog.onclick=function(){isOn=!isOn;tog.style.background=isOn?"#34c759":"#e5e5ea";knob.style.left=isOn?"23px":"3px";if(onChange)onChange(isOn);};
  r.appendChild(tog);return r;
 }
 function savedBanner(parent){
  var b=div("");b.style.cssText="font-size:13px;color:#34c759;font-weight:600;padding:0 16px 4px;min-height:20px;";parent.appendChild(b);return b;
 }

 // ═══════════════════════════════════════════════
 // TAB PROFILO
 // ═══════════════════════════════════════════════
 if(S.settingsTab==="profilo"){
  var pubName="";var pubCode="";
  try{pubName=localStorage.getItem("filos_pub_name")||"";}catch(e){}
  try{pubCode=localStorage.getItem("filos_pub_code")||"";}catch(e){}

  var rName=inputRow("","#ff9f0a",T("obFieldName"),T("ui_es_osteria_mario"),pubName,40);
  var rCode=inputRow("","#636366",T("obFieldCode"),"Es. osteria_mario",pubCode,30,function(v){return v.toLowerCase().replace(/[^a-z0-9_]/g,"");});
  section(T("settingsIlTuoLocale"),[rName,rCode]);

  var banner=savedBanner(page);
  var sec2=div("as-section");page.appendChild(sec2);
  var saveB=document.createElement("button");saveB.className="as-btn as-btn-primary";saveB.textContent=T("settingsSave");
  saveB.onclick=function(){
   var name=rName._input.value.trim();var code=rCode._input.value.trim();
   try{localStorage.setItem("filos_pub_name",name);}catch(e){}
   try{localStorage.setItem("filos_pub_code",code);}catch(e){}
   banner.textContent=T("settingsSaved");setTimeout(function(){banner.textContent="";},2500);
  };
  sec2.appendChild(saveB);

  if(pubCode){
   section(T("settingsStato"),[row("","#34c759",T("settingsLocaleConf"),pubCode,"","")]);
  }

  // ── SEZIONE TAG NFC (verifica online) ──
  (function(){
   var BTN="margin-top:4px;padding:8px 14px;border-radius:8px;background:transparent;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;width:fit-content;";
   var box=div("");box.style.cssText="padding:12px 16px;display:flex;flex-direction:column;gap:8px;";
   var info=div("",T("nfcInfo"));info.style.cssText="font-size:13px;color:#636366;line-height:1.5;";box.appendChild(info);
   var msg=div("");msg.style.cssText="font-size:13px;font-weight:600;";
   var cleanPub=nfcCleanVenue(pubCode);
   function publish(){
    msg.style.color="#636366";msg.textContent=T("nfcSaving");
    nfcPublish(cleanPub,function(ok,why){
     if(ok){renderAnalytics();return;}
     msg.style.color="#ff3b30";msg.textContent=T(why==="offline"?"nfcOffline":why==="nopub"?"nfcNeedPub":"nfcDenied");
    });
   }
   if(!cleanPub){
    var np=div("",T("nfcNeedPub"));np.style.cssText="font-size:13px;color:#ff9f0a;font-weight:600;";box.appendChild(np);
   } else {
    var url="";var mv="";try{mv=localStorage.getItem("filos_nfc_master_venue")||"";}catch(e){}
    if(mv===cleanPub)url=nfcTagUrl();
    if(url){
     var lbl=div("",T("nfcUrlLabel"));lbl.style.cssText="font-size:11px;font-weight:700;color:#8e8e93;text-transform:uppercase;letter-spacing:0.6px;";box.appendChild(lbl);
     var uv=div("",url);uv.style.cssText="font-size:13px;color:#3478f6;word-break:break-all;font-family:monospace;";box.appendChild(uv);
     var cb=document.createElement("button");cb.style.cssText=BTN+"border:1.5px solid #3478f6;color:#3478f6;";cb.textContent=T("nfcCopyBtn");
     cb.onclick=function(){try{navigator.clipboard.writeText(url);cb.textContent=T("nfcCopied");setTimeout(function(){cb.textContent=T("nfcCopyBtn");},2000);}catch(e){}};
     box.appendChild(cb);
     var rb=document.createElement("button");rb.style.cssText=BTN+"border:1.5px solid #ff3b30;color:#ff3b30;";rb.textContent=T("nfcRegenBtn");
     rb.onclick=function(){if(confirm(T("nfcRegenConfirm")))publish();};
     box.appendChild(rb);
    } else {
     var gb=document.createElement("button");gb.style.cssText=BTN+"border:1.5px solid #34c759;color:#34c759;";gb.textContent=T("nfcGenerate");
     gb.onclick=publish;box.appendChild(gb);
    }
    // Chiave del gestore: serve per gestire i tag da un altro telefono
    var key=nfcOwnerKey();
    var kl=div("",T("nfcKeyLabel"));kl.style.cssText="font-size:11px;font-weight:700;color:#8e8e93;text-transform:uppercase;letter-spacing:0.6px;margin-top:8px;";box.appendChild(kl);
    if(key){var kv=div("",key);kv.style.cssText="font-size:13px;font-family:monospace;color:#111;word-break:break-all;";box.appendChild(kv);
     var kh=div("",T("nfcKeyHint"));kh.style.cssText="font-size:12px;color:#8e8e93;";box.appendChild(kh);}
    var ki=document.createElement("input");ki.placeholder=T("nfcKeyPlaceholder");ki.maxLength=64;
    ki.style.cssText="padding:8px 10px;border:1.5px solid #d1d1d6;border-radius:8px;font-family:monospace;font-size:13px;";
    var kb=document.createElement("button");kb.style.cssText=BTN+"border:1.5px solid #636366;color:#636366;";kb.textContent=T("nfcKeyUse");
    kb.onclick=function(){var v=(ki.value||"").trim();if(!/^[A-Za-z0-9]{16,64}$/.test(v)){msg.style.color="#ff3b30";msg.textContent=T("nfcKeyBad");return;}
     try{localStorage.setItem("filos_nfc_owner_key",v);}catch(e){}renderAnalytics();};
    box.appendChild(ki);box.appendChild(kb);
   }
   box.appendChild(msg);
   section(T("nfcSection"),[box]);
  })();

 // ═══════════════════════════════════════════════
 // TAB ANALYTICS
 // ═══════════════════════════════════════════════
 } else if(S.settingsTab==="analytics"){
  var total=ANALYTICS.plays.length;
  var todayStr=new Date().toDateString();
  var today=0;for(var i=0;i<ANALYTICS.plays.length;i++){if(new Date(ANALYTICS.plays[i].ts).toDateString()===todayStr)today++;}
  
  // Sessioni uniche (per giorno diverso)
  var days={};for(var i=0;i<ANALYTICS.plays.length;i++){days[new Date(ANALYTICS.plays[i].ts).toDateString()]=1;}
  var dayCount=Object.keys(days).length;

  // Tempo totale
  var totalSec=0;for(var i=0;i<ANALYTICS.plays.length;i++){totalSec+=(ANALYTICS.plays[i].dur||0);}
  function fmtTime(s){if(!s||s===0)return"0s";if(s<60)return s+"s";if(s<3600)return Math.floor(s/60)+"m";return Math.floor(s/3600)+"h "+Math.floor((s%3600)/60)+"m";}
  
  // Valutazione media
  var rVals=[];for(var k in ANALYTICS.ratings)rVals.push(ANALYTICS.ratings[k]);
  var avgR=rVals.length?(rVals.reduce(function(s,r){return s+r.t/r.c;},0)/rVals.length).toFixed(1):"—";
  
  // Menu clicks totali
  var totalMenuClicks=0;for(var k in ANALYTICS.menuClicks)totalMenuClicks+=ANALYTICS.menuClicks[k];

  // Stat grid
  var grid=div("as-stat-grid");page.appendChild(grid);
  function stat(val,label){var c=div("as-stat");c.appendChild(Object.assign(div("as-stat-val"),{textContent:String(val)}));c.appendChild(Object.assign(div("as-stat-label"),{textContent:label}));return c;}
  grid.appendChild(stat(total,T("ui_partite_totali")));
  grid.appendChild(stat(today,T("ui_oggi")));
  grid.appendChild(stat(fmtTime(totalSec),T("ui_tempo_totale")));
  grid.appendChild(stat(avgR,T("ui_valutazione")));

  // Giochi top
  var gc={};for(var i=0;i<ANALYTICS.plays.length;i++){var p=ANALYTICS.plays[i];gc[p.game]=(gc[p.game]||0)+1;}
  var topGames=[];for(var k in gc)topGames.push([k,gc[k]]);topGames.sort(function(a,b){return b[1]-a[1];});topGames=topGames.slice(0,8);
  var maxG=topGames.length?topGames[0][1]:1;

  if(topGames.length){
   var gSec=div("as-section");page.appendChild(gSec);
   gSec.appendChild(Object.assign(div("as-section-title"),{textContent:T("ui_giochi_piu_giocati")}));
   var gGrp=div("as-group");gGrp.style.padding="10px 16px";gSec.appendChild(gGrp);
   topGames.forEach(function(g,idx){
    var br=div("as-bar-row");
    br.appendChild(Object.assign(div("as-bar-rank"),{textContent:String(idx+1)}));
    br.appendChild(Object.assign(div("as-bar-name"),{textContent:g[0]}));
    var track=div("as-bar-track");var fill=div("as-bar-fill");fill.style.width=Math.round(g[1]/maxG*100)+"%";track.appendChild(fill);br.appendChild(track);
    br.appendChild(Object.assign(div("as-bar-val"),{textContent:g[1]+" pt"}));
    gGrp.appendChild(br);
   });
  }

  // Menu click
  if(totalMenuClicks>0){
   var menuArr=[];for(var k in ANALYTICS.menuClicks){var parts=k.split(":");menuArr.push({tab:parts[0],name:parts[1]||k,count:ANALYTICS.menuClicks[k]});}
   menuArr.sort(function(a,b){return b.count-a.count;});menuArr=menuArr.slice(0,8);
   var maxM=menuArr[0].count;
   var mSec=div("as-section");page.appendChild(mSec);
   mSec.appendChild(Object.assign(div("as-section-title"),{textContent:T("ui_menu_piu_richiesti")+totalMenuClicks+T("ui_click_totali")}));
   var mGrp=div("as-group");mGrp.style.padding="10px 16px";mSec.appendChild(mGrp);
   menuArr.forEach(function(m,idx){
    var br=div("as-bar-row");
    br.appendChild(Object.assign(div("as-bar-rank"),{textContent:String(idx+1)}));
    var nm=div("as-bar-name");nm.textContent=(m.tab==="drink"?"":"")+" "+m.name;nm.style.maxWidth="160px";br.appendChild(nm);
    var track=div("as-bar-track");var fill=div("as-bar-fill");fill.style.background="#ff9f0a";fill.style.width=Math.round(m.count/maxM*100)+"%";track.appendChild(fill);br.appendChild(track);
    br.appendChild(Object.assign(div("as-bar-val"),{textContent:m.count+"x"}));
    mGrp.appendChild(br);
   });
  } else {
   section(T("ui_menu"),[row("","#e5e5ea",T("ui_nessun_click_menu_ancora"),T("ui_i_click_verranno_tracciati_quando"),"","")]);
  }

  // Ultimi 10
  var recent=ANALYTICS.plays.slice().reverse().slice(0,10);
  if(recent.length){
   var rSec=div("as-section");page.appendChild(rSec);
   rSec.appendChild(Object.assign(div("as-section-title"),{textContent:T("ui_recenti")}));
   var rGrp=div("as-group");rSec.appendChild(rGrp);
   recent.forEach(function(p){
    var d=new Date(p.ts);var hm=d.getHours().toString().padStart(2,"0")+":"+d.getMinutes().toString().padStart(2,"0");
    var dateStr=d.toLocaleDateString("it-IT",{day:"2-digit",month:"short"});
    rGrp.appendChild(row("","#5856d6",p.game,p.cat,dateStr+" "+hm,""));
   });
  }

  // Reset
  var resetSec=div("as-section");page.appendChild(resetSec);
  var resetB=document.createElement("button");resetB.className="as-btn as-btn-destructive";resetB.textContent=T("ui_reset_tutti_i_dati");
  resetB.onclick=function(){if(confirm(T("ui_cancellare_tutti_i_dati_analytics"))){ANALYTICS={plays:[],ratings:{},menuClicks:{}};saveA();renderAnalytics();}};
  resetSec.appendChild(resetB);

 // ═══════════════════════════════════════════════
 // TAB MENU
 // ═══════════════════════════════════════════════
 } else if(S.settingsTab==="menu"){
  var mWrap=div("as-section");page.appendChild(mWrap);
  renderMenuEditor(mWrap);

 // ═══════════════════════════════════════════════
 // TAB REPORT PDF
 // ═══════════════════════════════════════════════
 } else if(S.settingsTab==="report"){
  var pubName2="";try{pubName2=localStorage.getItem("filos_pub_name")||T("ui_il_tuo_locale");}catch(e){}

  section(T("ui_periodo"),[ 
   (function(){var r=div("as-row");var body=div("as-row-body");body.appendChild(Object.assign(div("as-row-label"),{textContent:T("ui_seleziona_periodo")}));
   var sel=document.createElement("select");sel.className="as-input";sel.style.cssText="font-size:15px;background:transparent;color:var(--dark,#111);border:none;outline:none;width:100%;";
   [["oggi",T("ui_oggi")],["settimana",T("ui_questa_settimana")],["mese",T("ui_questo_mese")],["trimestre",T("ui_ultimo_trimestre")],["tutto",T("ui_tutto")]].forEach(function(o){var op=document.createElement("option");op.value=o[0];op.textContent=o[1];sel.appendChild(op);});
   body.appendChild(sel);r.appendChild(body);r._sel=sel;return r;})()
  ]);

  var periodRow=page.querySelector(".as-group .as-row");

  var repSec=div("as-section");page.appendChild(repSec);
  var genBtn=document.createElement("button");genBtn.className="as-btn as-btn-pdf";genBtn.textContent=T("ui_genera_e_scarica_pdf");
  genBtn.onclick=function(){
   var period=periodRow&&periodRow._sel?periodRow._sel.value:"tutto";
   generatePDFReport(pubName2,period);
  };
  repSec.appendChild(genBtn);

  section(T("ui_cosa_include_il_report"),[
   row("","#5856d6",T("ui_partite_totali_e_giornaliere"),T("ui_conteggio_per_periodo"),"",""),
   row("","#ff9f0a",T("ui_giochi_piu_popolari"),T("ui_top_10_con_barra_di"),"",""),
   row("","#34c759",T("ui_menu_piu_richiesti_2"),T("ui_click_su_drink_e_food"),"",""),
   row("","#ff9f0a",T("ui_valutazioni_medie"),T("ui_per_gioco"),"",""),
   row("","#636366",T("ui_tempo_di_gioco"),T("ui_totale_e_per_gioco"),"","")
  ]);

 // ═══════════════════════════════════════════════
 // TAB SERATE SPECIALI
 // ═══════════════════════════════════════════════
 } else if(S.settingsTab==="speciali"){
  var qzEnabled=false;try{qzEnabled=localStorage.getItem("filos_quizzone")==="1";}catch(e){}
  section(T("ui_giochi_speciali"),[
   toggleRow("","#ff3b30","Quizzone",T("ui_quiz_multiplayer_per_la_serata"),qzEnabled,function(on){try{localStorage.setItem("filos_quizzone",on?"1":"0");}catch(e){}})
  ]);

 // ═══════════════════════════════════════════════
 // TAB ADMIN
 // ═══════════════════════════════════════════════
 } else if(S.settingsTab==="admin"){
  if(!fbDB){
   section(T("ui_stato"),[row("","#ff3b30",T("ui_firebase_non_disponibile"),T("ui_controlla_la_connessione"),"","")]);
  } else {
   var eventoRef=fbRef(fbDB,"filos_admin/evento");
   fbGet(eventoRef).then(function(snap){
    var ev=snap.val()||{attivo:false,nome:"",pubs:[]};
    var rEvNome=inputRow("","#ff9f0a",T("ui_nome_evento"),T("ui_es_quizzone_del_mercoledi"),ev.nome||"",50);
    var pubsRow=div("as-row");var pubBody=div("as-row-body");pubBody.appendChild(Object.assign(div("as-row-label"),{textContent:T("ui_codici_pub_partecipanti")}));
    var ta=document.createElement("textarea");ta.style.cssText="width:100%;background:none;border:none;outline:none;font-family:'SF Mono',monospace;font-size:13px;color:var(--dark,#111);resize:none;padding:6px 0;";ta.rows=4;ta.value=(ev.pubs||[]).join("\n");ta.placeholder="osteria_mario\nbar_centrale";
    pubBody.appendChild(ta);pubsRow.appendChild(pubBody);

    var isAttivo=ev.attivo||false;
    var togEv=toggleRow("","#34c759",T("ui_evento_attivo"),T("ui_visibile_a_tutti_i_pub"),isAttivo,function(on){isAttivo=on;});

    section(T("ui_evento_in_corso"),[rEvNome,pubsRow,togEv]);

    var adminBanner=savedBanner(page);
    var adminSec=div("as-section");page.appendChild(adminSec);
    var saveAdminB=document.createElement("button");saveAdminB.className="as-btn as-btn-primary";saveAdminB.textContent=T("adminSave");
    saveAdminB.onclick=function(){
     var pubList=ta.value.split("\n").map(function(s){return s.trim().toLowerCase();}).filter(Boolean);
     fbSet(eventoRef,{attivo:isAttivo,nome:rEvNome._input.value.trim(),pubs:pubList,ts:Date.now()}).then(function(){
      adminBanner.textContent=T("adminSaved");setTimeout(function(){adminBanner.textContent="";},2500);
     }).catch(function(){adminBanner.style.color="#ff3b30";adminBanner.textContent=T("ui_errore_salvataggio");});
    };
    adminSec.appendChild(saveAdminB);
   }).catch(function(){section(T("ui_errore"),[row("","#ff3b30",T("ui_impossibile_leggere_firebase"),"","","")]);});
  }
 }
}

function generatePDFReport(pubName, period){
 // Calcola range temporale
 var now=Date.now();var fromTs=0;
 var periodLabel=T("ui_tutto_il_periodo");
 if(period==="oggi"){fromTs=new Date().setHours(0,0,0,0);periodLabel=T("ui_oggi_2")+new Date().toLocaleDateString("it-IT",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});}
 else if(period==="settimana"){var d=new Date();d.setDate(d.getDate()-d.getDay()+1);d.setHours(0,0,0,0);fromTs=d.getTime();periodLabel=T("ui_settimana_corrente");}
 else if(period==="mese"){var d=new Date();d.setDate(1);d.setHours(0,0,0,0);fromTs=d.getTime();periodLabel=T("ui_mese")+new Date().toLocaleDateString("it-IT",{month:"long",year:"numeric"});}
 else if(period==="trimestre"){var d=new Date();d.setMonth(d.getMonth()-2);d.setDate(1);d.setHours(0,0,0,0);fromTs=d.getTime();periodLabel=T("ui_ultimo_trimestre");}

 // Filtra dati
 var plays=ANALYTICS.plays.filter(function(p){return p.ts>=fromTs;});
 var total=plays.length;
 var days={};plays.forEach(function(p){days[new Date(p.ts).toDateString()]=1;});
 var dayCount=Object.keys(days).length;

 // Tempo totale
 var totalSec=0;plays.forEach(function(p){totalSec+=(p.dur||0);});
 function fmtT(s){if(!s||s===0)return"0 min";if(s<60)return s+"s";if(s<3600)return Math.floor(s/60)+"m "+Math.floor(s%60)+"s";return Math.floor(s/3600)+"h "+Math.floor((s%3600)/60)+"m";}

 // Giochi top
 var gc={};plays.forEach(function(p){gc[p.game]=(gc[p.game]||0)+1;});
 var topGames=[];for(var k in gc)topGames.push([k,gc[k]]);topGames.sort(function(a,b){return b[1]-a[1];});
 var maxG=topGames.length?topGames[0][1]:1;

 // Valutazioni
 var allRatings={};for(var k in ANALYTICS.ratings){if(ANALYTICS.ratings[k].c>0)allRatings[k]=ANALYTICS.ratings[k];}
 var rVals=Object.values(allRatings);
 var avgR=rVals.length?(rVals.reduce(function(s,r){return s+r.t/r.c;},0)/rVals.length).toFixed(1):"—";

 // Menu clicks
 var menuArr=[];for(var k in ANALYTICS.menuClicks){var parts=k.split(":");menuArr.push({tab:parts[0],name:parts[1]||k,count:ANALYTICS.menuClicks[k]});}
 menuArr.sort(function(a,b){return b.count-a.count;});
 var totalClicks=menuArr.reduce(function(s,m){return s+m.count;},0);

 // Orari di punta
 var hourMap={};plays.forEach(function(p){var h=new Date(p.ts).getHours();hourMap[h]=(hourMap[h]||0)+1;});
 var peakHour="—";var peakCount=0;for(var h in hourMap){if(hourMap[h]>peakCount){peakCount=hourMap[h];peakHour=h+":00–"+(parseInt(h)+1)+":00";}}

 // Ora report
 var reportDate=new Date().toLocaleDateString("it-IT",{weekday:"long",day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"});

 // Bar SVG
 function bar(pct,color){return '<div style="height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;flex:1;"><div style="width:'+Math.round(pct)+'%;height:100%;background:'+(color||"#007aff")+';border-radius:4px;"></div></div>';}

 // HTML del report
 var html='<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>Report '+pubName+'</title><style>';
 html+='*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,"Helvetica Neue",sans-serif;color:#111;background:#fff;padding:32px;max-width:800px;margin:0 auto;}';
 html+='h1{font-size:28px;font-weight:700;margin-bottom:4px;}h2{font-size:16px;font-weight:600;color:#333;margin:28px 0 10px;border-bottom:1.5px solid #e0e0e0;padding-bottom:6px;}';
 html+='.sub{font-size:14px;color:#666;margin-bottom:20px;}.header-meta{font-size:12px;color:#999;margin-top:4px;}';
 html+='.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:8px;}';
 html+='.stat-box{background:#f7f7f7;border-radius:10px;padding:14px 16px;}.stat-val{font-size:26px;font-weight:700;line-height:1;}.stat-label{font-size:11px;color:#888;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;}';
 html+='.bar-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f0f0f0;font-size:13px;}';
 html+='.bar-row:last-child{border-bottom:none;}.bar-rank{width:18px;color:#aaa;text-align:right;flex-shrink:0;}.bar-name{min-width:120px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;}';
 html+='.bar-val{min-width:48px;text-align:right;color:#666;flex-shrink:0;}';
 html+='.footer{margin-top:36px;padding-top:16px;border-top:1px solid #e0e0e0;font-size:11px;color:#aaa;text-align:center;}';
 html+='@media print{body{padding:16px;}button{display:none!important;}}';
 html+='</style></head><body>';

 html+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">';
 html+='<div><h1>'+pubName+'</h1><div class="sub">'+periodLabel+'</div></div>';
 html+=T("ui_generato_il")+reportDate+'</div></div>';

 html+='<div class="stat-grid">';
 html+='<div class="stat-box"><div class="stat-val">'+total+T("ui_partite");
 html+='<div class="stat-box"><div class="stat-val">'+dayCount+T("ui_giorni_attivi");
 html+='<div class="stat-box"><div class="stat-val">'+fmtT(totalSec)+T("ui_tempo_totale_2");
 html+='<div class="stat-box"><div class="stat-val">'+avgR+T("ui_valutazione_2");
 html+='</div>';

 html+='<div class="stat-grid" style="grid-template-columns:1fr 1fr;margin-top:12px;">';
 html+='<div class="stat-box"><div class="stat-val">'+totalClicks+T("ui_click_menu");
 html+='<div class="stat-box"><div class="stat-val">'+peakHour+T("ui_ora_di_punta");
 html+='</div>';

 if(topGames.length){
  html+=T("ui_giochi_piu_giocati_2");
  topGames.slice(0,10).forEach(function(g,i){
   html+='<div class="bar-row"><span class="bar-rank">'+(i+1)+'</span><span class="bar-name">'+g[0]+'</span>'+bar(g[1]/maxG*100,"#007aff")+'<span class="bar-val">'+g[1]+T("ui_pt");
  });
 }

 if(menuArr.length){
  var maxM=menuArr[0].count;
  html+=T("ui_menu_piu_richiesti_3");
  menuArr.slice(0,10).forEach(function(m,i){
   var icon="";
   html+='<div class="bar-row"><span class="bar-rank">'+(i+1)+'</span><span class="bar-name">'+icon+' '+m.name+'</span>'+bar(m.count/maxM*100,"#ff9f0a")+'<span class="bar-val">'+m.count+T("ui_x");
  });
 }

 if(Object.keys(allRatings).length){
  var ratArr=[];for(var k in allRatings)ratArr.push([k,allRatings[k]]);
  ratArr.sort(function(a,b){return (b[1].t/b[1].c)-(a[1].t/a[1].c);});var maxRat=5;
  html+=T("ui_valutazioni_per_gioco");
  ratArr.slice(0,10).forEach(function(r,i){
   var avg=(r[1].t/r[1].c).toFixed(1);
   html+='<div class="bar-row"><span class="bar-rank">'+(i+1)+'</span><span class="bar-name">'+r[0]+'</span>'+bar(r[1].t/r[1].c/5*100,"#ff9f0a")+'<span class="bar-val">&nbsp;'+avg+'</span></div>';
  });
 }

 html+=T("ui_fil_s_report_analitico_i");
 html+='<br><button onclick="window.print()" style="display:block;margin:0 auto;padding:12px 32px;background:#007aff;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;">Stampa / Salva PDF</button>';
 html+='</body></html>';

 var win=window.open("","_blank","width=860,height=700");
 if(win){win.document.write(html);win.document.close();}
 else{alert(T("ui_il_popup_e_stato_bloccato"));}
}


function pinPress(d){
 if(S.pinInput.length>=4)return;S.pinInput+=String(d);
 if(S.pinInput.length===4){
 if(S.pinInput===PIN){S.pinOK=true;S.pinErr=false;render();}
 else{S.pinErr=true;setTimeout(function(){S.pinInput="";S.pinErr=false;renderAnalytics();},800);renderAnalytics();}
 }else{renderAnalytics();}
}


function renderConnect(){
 clr();
 // Schermata a tutto schermo, layout fisso, no scroll
 // Misura header reale
 var hdrEl=document.querySelector(".hdr");
 var hdrH=hdrEl?hdrEl.offsetHeight:76;
 var availH=window.innerHeight-hdrH;

 var wrap=document.createElement("div");
 wrap.style.cssText="width:100%;height:"+availH+"px;background:#faf7f2;display:flex;flex-direction:column;";

 // ── CONTENT ── (occupa tutto lo spazio rimasto)
 var content=document.createElement("div");
 content.style.cssText="flex:1;display:flex;flex-direction:column;height:100%;";

 if(fbIsHost && fbRoomCode){
 // ── HOST: codice grande centrato ──
 var hostWrap=document.createElement("div");
 hostWrap.style.cssText="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:12px;";
 var lbl=document.createElement("div");
 lbl.style.cssText="font-size:11px;font-weight:700;letter-spacing:2px;color:#999;text-transform:uppercase;";
 lbl.textContent=T("codeRoomLabel");
 var codeEl=document.createElement("div");
 codeEl.style.cssText="font-size:72px;font-weight:900;letter-spacing:16px;color:var(--orange);font-family:'Space Grotesk',sans-serif;line-height:1;";
 codeEl.textContent=fbRoomCode;
 var sub=document.createElement("div");
 sub.style.cssText="font-size:14px;color:#888;text-align:center;max-width:260px;line-height:1.5;";
 sub.textContent=T("otherDevicesCode");
 var disc=document.createElement("button");
 disc.style.cssText="margin-top:24px;padding:12px 28px;background:transparent;border:2px solid #ddd;border-radius:20px;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;color:#888;";
 disc.textContent=T("closeRoom");
 disc.onclick=function(){fbLeaveRoom();render();};
 hostWrap.appendChild(lbl);
 hostWrap.appendChild(codeEl);
 hostWrap.appendChild(sub);
 hostWrap.appendChild(disc);
 content.appendChild(hostWrap);

 } else if(!fbIsHost && fbRoomCode){
 // ── CLIENT: connesso ──
 var clientWrap=document.createElement("div");
 clientWrap.style.cssText="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:12px;";
 var lbl2=document.createElement("div");
 lbl2.style.cssText="font-size:11px;font-weight:700;letter-spacing:2px;color:#999;text-transform:uppercase;";
 lbl2.textContent=T("connectedRoom");
 var codeEl2=document.createElement("div");
 codeEl2.style.cssText="font-size:72px;font-weight:900;letter-spacing:16px;color:var(--teal);font-family:'Space Grotesk',sans-serif;line-height:1;";
 codeEl2.textContent=fbRoomCode;
 var sub2=document.createElement("div");
 sub2.style.cssText="font-size:14px;color:#888;text-align:center;";
 sub2.textContent=T("syncedHost");
 var disc2=document.createElement("button");
 disc2.style.cssText="margin-top:24px;padding:12px 28px;background:transparent;border:2px solid #ddd;border-radius:20px;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;color:#888;";
 disc2.textContent=T("disconnectBtn");
 disc2.onclick=function(){fbLeaveRoom();render();};
 clientWrap.appendChild(lbl2);
 clientWrap.appendChild(codeEl2);
 clientWrap.appendChild(sub2);
 clientWrap.appendChild(disc2);
 content.appendChild(clientWrap);

 } else {
 // ── NON CONNESSO: due pannelli affiancati/sovrapposti ──
 // Su schermo largo: side by side. Su mobile: top/bottom al 50% ciascuno
 var panels=document.createElement("div");
 panels.style.cssText="flex:1;display:flex;flex-direction:row;overflow:hidden;min-height:0;height:100%;width:100%;";
 if(window.innerWidth<600) panels.style.flexDirection="column";

 // Stile comune per i blocchi interni — stessa altezza fissa per ogni riga
 // Struttura: [label 20px] [desc 44px] [elemento centrale 80px] [bottone 52px]
 // Tutto allineato alla stessa baseline tra i due pannelli

 function makePanel(bg,border){
 var p=document.createElement("div");
 p.style.cssText="flex:1;height:100%;display:flex;align-items:center;justify-content:center;padding:0 40px;background:"+bg+";"+border;
 return p;
 }
 function makeInner(){
 var i=document.createElement("div");
 i.style.cssText="display:flex;flex-direction:column;align-items:center;gap:24px;width:100%;max-width:300px;";
 return i;
 }
 function makeRow(h){
 var r=document.createElement("div");
 r.style.cssText="display:flex;align-items:center;justify-content:center;width:100%;"+(h?"min-height:"+h+"px;":"");
 return r;
 }

 var panelA=makePanel("#fff","border-right:1px solid #e8e4dc;");
 var panelB=makePanel("#f5f1eb","");

 // ── RIGA 1: label ──
 var rowA1=makeRow(24); var rowB1=makeRow(24);
 var lA=document.createElement("div");
 lA.style.cssText="font-size:11px;font-weight:700;letter-spacing:2.5px;color:#c0bab0;text-transform:uppercase;";
 lA.textContent=T("iAmHost");
 var lB=document.createElement("div");
 lB.style.cssText="font-size:11px;font-weight:700;letter-spacing:2.5px;color:#c0bab0;text-transform:uppercase;";
 lB.textContent=T("iJoin");
 rowA1.appendChild(lA); rowB1.appendChild(lB);

 // ── RIGA 2: descrizione ──
 var rowA2=makeRow(48); var rowB2=makeRow(48);
 var dA=document.createElement("div");
 dA.style.cssText="font-size:16px;color:#555;text-align:center;line-height:1.4;";
 dA.textContent=T("creatingRoom");
 var dB=document.createElement("div");
 dB.style.cssText="font-size:16px;color:#555;text-align:center;line-height:1.4;";
 dB.textContent=T("enterHostCode");
 rowA2.appendChild(dA); rowB2.appendChild(dB);

 // ── RIGA 3: elemento centrale (bottone→codice / input) ──
 var rowA3=makeRow(90); var rowB3=makeRow(90);

 // Pannello A: zona che passa da bottone a codice
 var codeZone=document.createElement("div");
 codeZone.style.cssText="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;height:90px;";
 var createBtn=document.createElement("button");
 createBtn.style.cssText="padding:18px 42px;background:var(--dark);color:#fff;border:none;border-radius:50px;font-family:inherit;font-weight:800;font-size:17px;letter-spacing:1px;cursor:pointer;white-space:nowrap;";
 createBtn.textContent=T("createRoom");
 createBtn.onclick=function(){
 createBtn.textContent="";
 createBtn.disabled=true;
 fbCreateRoom(function(code,err){
 if(err){ createBtn.textContent=T("createRoom"); createBtn.disabled=false; return; }
 codeZone.innerHTML="";
 var codeNum=document.createElement("div");
 codeNum.style.cssText="font-size:62px;font-weight:900;letter-spacing:12px;color:var(--orange);font-family:'Space Grotesk',sans-serif;line-height:1;";
 codeNum.textContent=code;
 codeZone.appendChild(codeNum);
 });
 };
 codeZone.appendChild(createBtn);
 rowA3.appendChild(codeZone);

 // Pannello B: input codice
 var joinStatus=null;
 var codeInput=document.createElement("input");
 codeInput.type="tel"; codeInput.inputMode="numeric";
 codeInput.placeholder="· · · ·"; codeInput.maxLength=4;
 codeInput.style.cssText="width:200px;height:72px;padding:0 12px;font-size:40px;font-weight:900;text-align:center;letter-spacing:10px;border:3px solid #ddd;border-radius:16px;font-family:'Space Grotesk',sans-serif;outline:none;background:#fff;color:var(--dark);transition:border-color 0.2s;box-sizing:border-box;";
 codeInput.oninput=function(){
 this.value=this.value.replace(/[^0-9]/g,"").slice(0,4);
 var full=this.value.length===4;
 this.style.borderColor=full?"var(--teal)":"var(--orange)";
 joinBtn.style.cssText=joinBtn.style.cssText.replace(/background:[^;]+/,"background:"+(full?"var(--teal)":"#ccc"));
 if(joinStatus) joinStatus.textContent="";
 };
 codeInput.onfocus=function(){ if(this.value.length!==4) this.style.borderColor="var(--orange)"; };
 codeInput.onblur=function(){ if(this.value.length!==4) this.style.borderColor="#ddd"; };
 rowB3.appendChild(codeInput);

 // ── RIGA 4: bottone azione ──
 var rowA4=makeRow(56); var rowB4=makeRow(56);

 // A: T("closeRoom") — appare dopo creazione
 var closeBtnRow=document.createElement("div");
 closeBtnRow.style.cssText="height:56px;display:flex;align-items:center;justify-content:center;width:100%;";
 // (inizialmente vuoto, appare dopo crea)
 // aggiunto dinamicamente nel click di createBtn
 rowA4.appendChild(closeBtnRow);

 // Aggiorno createBtn per mostrare anche chiudi
 var _origClick=createBtn.onclick;
 createBtn.onclick=function(){
 createBtn.textContent=""; createBtn.disabled=true;
 fbCreateRoom(function(code,err){
 if(err){ createBtn.textContent=T("createRoom"); createBtn.disabled=false; return; }
 codeZone.innerHTML="";
 var codeNum=document.createElement("div");
 codeNum.style.cssText="font-size:62px;font-weight:900;letter-spacing:12px;color:var(--orange);font-family:'Space Grotesk',sans-serif;line-height:1;";
 codeNum.textContent=code;
 codeZone.appendChild(codeNum);
 // mostra sottotitolo in riga 2 e chiudi in riga 4
 dA.textContent=T("othersInsertCode");
 closeBtnRow.innerHTML="";
 var cb=document.createElement("button");
 cb.style.cssText="padding:10px 24px;background:transparent;border:2px solid #ddd;border-radius:20px;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;color:#aaa;";
 cb.textContent=T("closeRoom");
 cb.onclick=function(){fbLeaveRoom();render();};
 closeBtnRow.appendChild(cb);
 });
 };

 var joinBtn=document.createElement("button");
 joinBtn.style.cssText="padding:18px 42px;background:#ccc;color:#fff;border:none;border-radius:50px;font-family:inherit;font-weight:800;font-size:17px;letter-spacing:1px;cursor:pointer;transition:background 0.2s;white-space:nowrap;";
 joinBtn.textContent=T("enterRoom");
 joinBtn.onclick=function(){
 var code=codeInput.value.trim();
 if(code.length<4){ codeInput.focus(); return; }
 joinBtn.textContent=""; joinBtn.disabled=true; codeInput.disabled=true;
 fbJoinRoom(code,function(ok,err){
 if(ok){ setTimeout(function(){render();},600); }
 else {
 codeInput.value=""; codeInput.style.borderColor="#ddd";
 joinBtn.textContent=T("enterRoom"); joinBtn.disabled=false;
 joinBtn.style.cssText=joinBtn.style.cssText.replace(/background:[^;]+/,"background:#ccc");
 codeInput.disabled=false; codeInput.focus();
 if(!joinStatus){ joinStatus=document.createElement("div"); joinStatus.style.cssText="font-size:13px;color:#c62828;text-align:center;position:absolute;bottom:16px;"; rowB4.style.position="relative"; rowB4.appendChild(joinStatus); }
 joinStatus.textContent=" "+err;
 }
 });
 };
 rowB4.appendChild(joinBtn);

 // Assembla pannelli
 var innerA=makeInner(); innerA.appendChild(rowA1); innerA.appendChild(rowA2); innerA.appendChild(rowA3); innerA.appendChild(rowA4); panelA.appendChild(innerA);
 var innerB=makeInner(); innerB.appendChild(rowB1); innerB.appendChild(rowB2); innerB.appendChild(rowB3); innerB.appendChild(rowB4); panelB.appendChild(innerB);
 panels.appendChild(panelA);
 panels.appendChild(panelB);
 content.appendChild(panels);
 }

 wrap.appendChild(content);
 document.getElementById("app").appendChild(wrap);
}

// ═══════════════════════════════════════════════════════════════
// QUIZZONE — Clone Kahoot con Firebase multiplayer
// ═══════════════════════════════════════════════════════════════

var QZ = {
 questions: [], // domande mescolate per questa partita
 qIdx: 0, // indice domanda corrente
 players: {}, // { nickname: { score, lastPoints, answered } }
 myNickname: '', // nickname del giocatore locale
 timer: null, // interval del countdown
 timerSec: 0, // secondi rimasti
 timerMax: 20, // secondi totali per risposta
 qStartTime: 0, // timestamp inizio domanda
 myAnswer: null, // risposta scelta dal giocatore locale
 answered: false, // ha già risposto questa domanda
 showAnswer: false, // host sta mostrando la risposta
 phase: 'lobby', // lobby | question | answer | leaderboard | end
};

// Il resto della logica (Quizzone, render(), Chi paga, inviti) vive in index.html.
