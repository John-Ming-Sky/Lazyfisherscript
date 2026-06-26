// ==UserScript==
// @name         LazyFisher 环境显示
// @namespace    https://lazyfisher.toogle.club/
// @version      4.2.2
// @description  环境显示
// @author       天雨灵泽
// @match        https://lazyfisher.toogle.club/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function(){
'use strict';
var T='ws/game';
var E={},P=[],U=null,LU=null;

function S(k,v){try{localStorage.setItem('lz_'+k,JSON.stringify(v))}catch(e){}}
function L(k,f){try{var r=localStorage.getItem('lz_'+k);return r===null?JSON.parse(f):JSON.parse(r)}catch(e){return JSON.parse(f)}}

function ts(){var d=new Date();return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0')}

function chk(){return document.querySelector('.fishing-compact-card')&&document.querySelector('.lucide-anchor')&&document.querySelector('.fishing-overview-grid')}

function uAI(d){
var as=document.querySelectorAll('.lucide-anchor');
for(var i=0;i<as.length;i++){
var r=as[i].closest('.flex.items-center.justify-between');
if(!r)r=as[i].closest('.flex');if(!r)continue;
var o=r.querySelector('.lz-ai');if(o)o.remove();
var se=r.querySelector('.text-sm.text-muted');
var n=document.createElement('span');n.className='lz-ai';
n.style.cssText='display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8;margin-right:4px';
var ip=d.li||'--',sf=d.sb?'已软封':'正常',sc=d.sb?'#f87171':'#94a3b8',t=LU||ts();
n.innerHTML='<span>关联:'+(d.ap||0)+'</span><span style="color:'+sc+'">'+sf+'</span><span>IP:'+ip+'</span><span style="color:#64748b">'+t+'</span>';
if(se)se.parentNode.insertBefore(n,se);else r.appendChild(n);break}}

function gEI(){var is=document.querySelectorAll('.fishing-overview-item');for(var i=0;i<is.length;i++){if(is[i].querySelector('.weather-icon-row'))return is[i]}return null}
function cEC(){var ei=gEI();if(!ei)return false;if(document.getElementById('lz-ec'))return true;
var c=document.createElement('div');c.id='lz-ec';c.className='fishing-overview-item';
c.innerHTML='<span class="text-xs text-muted">水流/湿度</span><strong id="lz-ev" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:0.875rem"></strong>';
ei.parentNode.insertBefore(c,ei.nextSibling);return true}

function uEC(d){cEC();var v=document.getElementById('lz-ev');if(!v)return;var h='';
if(d.wf!==undefined){h+='<span title="水流" style="color:#38bdf8;display:inline-flex;align-items:center;gap:2px;font-weight:600"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h2M6 8h2M10 16h2M14 4h2M18 20h2M22 12h2"/></svg>'+Number(d.wf).toFixed(1)+'</span>'}
if(d.wt!==undefined){h+='<span title="湿度" style="color:#818cf8;display:inline-flex;align-items:center;gap:2px;font-weight:600"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>'+Number(d.wt).toFixed(1)+'</span>'}
if(d.rs!==undefined){var rh=Number(d.rs);if(rh>0){h+='<span title="连雨时长" style="color:#818cf8;display:inline-flex;align-items:center;gap:2px;font-weight:600"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9M16 14v6M8 14v6M12 16v6"/></svg>连'+rh.toFixed(1)+'h</span>'}else{h+='<span title="连雨时长" style="color:#94a3b8;display:inline-flex;align-items:center;gap:2px;font-weight:600"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>无雨</span>'}}
v.innerHTML=h}

function gOG(){return document.querySelector('.fishing-overview-grid')}
function cPC(){var g=gOG();if(!g)return false;if(document.getElementById('lz-pw'))return true;
var w=document.createElement('div');w.id='lz-pw';w.style.cssText='margin-top:6px';
w.innerHTML='<div class="text-xs text-muted" style="margin-bottom:3px">附近玩家</div><div id="lz-pc" class="fishing-overview-grid"></div>';
g.parentNode.insertBefore(w,g.nextSibling);return true}

function uPC(pl){cPC();var c=document.getElementById('lz-pc');if(!c)return;
if(!pl||!pl.length){c.innerHTML='<div class="fishing-overview-item"><span class="text-xs text-muted" style="color:#64748b">暂无其他玩家</span></div>';return}
var sm={REELING:'上鱼中',FIGHTING:'搏斗中',FISHING:'守钓中',IDLE:'空闲'};var h='';
pl.forEach(function(p){var st=p.st||'IDLE',sl=sm[st]||st;var g=p.gs||'';var nm=g?'['+g+'] '+p.nm:p.nm;var cl=(st==='REELING'||st==='FIGHTING')?'#f87171':(st==='FISHING'?'#38bdf8':'#94a3b8');
h+='<div class="fishing-overview-item" style="padding:3px 0"><strong style="display:flex;align-items:center;gap:4px;font-size:0.8rem"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">'+nm+'</span><span style="color:'+cl+';font-weight:600;white-space:nowrap">'+sl+'</span></strong></div>'});
c.innerHTML=h}

var RT=null;
function rA(){if(!chk())return;var e=L('env','{}');var p=L('players','[]');if(!Array.isArray(p))p=[];LU=L('lt','""')||null;uEC(e);if(e._a)uAI(e._a);uPC(p)}

function wD(){new MutationObserver(function(){if(chk()&&!document.getElementById('lz-ec'))rA()}).observe(document.body,{childList:true,subtree:true})}
function tI(){if(chk()){rA();if(!RT)RT=setInterval(rA,10000);return}setTimeout(tI,500)}

function oR(d){
if(d.water_flow!==undefined)E.wf=d.water_flow;if(d.wind!==undefined)E.wd=d.wind;
if(d.cloud!==undefined)E.cd=d.cloud;if(d.rain!==undefined)E.rn=d.rain;
if(d._rain_streak_wetness!==undefined)E.wt=d._rain_streak_wetness;if(d._rain_streak_hours!==undefined)E.rs=d._rain_streak_hours;
if(d.region_time!==undefined)E.rt=d.region_time;if(d.region_id!==undefined)E.ri=d.region_id;
LU=ts();S('lt',LU);S('env',E)}

function oT(d){var e=d.environment;if(!e)return;
if(e.water_flow!==undefined)E.wf=e.water_flow;if(e.wind!==undefined)E.wd=e.wind;
if(e.cloud!==undefined)E.cd=e.cloud;if(e.rain!==undefined)E.rn=e.rain;
if(e.region_time!==undefined)E.rt=e.region_time;LU=ts();S('lt',LU);S('env',E)}

function oP(d,pd){
if(pd){E._a={ap:pd.association_points,sb:pd.soft_banned,li:pd.last_known_ip};S('env',E)}
if(!U&&pd&&pd.id)U=pd.id;if(d.region_name!==undefined){E.rn=d.region_name;S('env',E)}
var l=[];(d.players||[]).forEach(function(p){if(p.id!==U)l.push({nm:p.username||'?',st:p.state||p.status||'IDLE',gs:p.guild_short_name})});
P=l;S('players',P);LU=ts();S('lt',LU)}

function ps(raw){if(typeof raw!=='string')return;try{var m=JSON.parse(raw);
if(m.type==='region_update'&&m.data)oR(m.data);
else if(m.type==='fishing_tick'&&m.data&&m.data.environment)oT(m.data);
else if(m.type==='action_result'&&m.action==='get_pond_view'&&m.data)oP(m.data,m.player)}catch(e){}}

function hk(){if(typeof WebSocket==='undefined'){setTimeout(hk,100);return}
var O=WebSocket;WebSocket=function(u,p){var w=new O(u,p);if(u&&u.indexOf(T)!==-1)w.addEventListener('message',function(e){ps(e.data)});return w};
WebSocket.prototype=O.prototype;WebSocket.CONNECTING=O.CONNECTING;WebSocket.OPEN=O.OPEN;WebSocket.CLOSING=O.CLOSING;WebSocket.CLOSED=O.CLOSED}

function mn(){hk();tI();wD()}mn();
})();