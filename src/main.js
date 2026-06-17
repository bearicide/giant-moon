
import * as THREE from "three";
import "./style.css";
import {MoonTerrain} from "./terrain.js";
import {Landmarks} from "./landmarks.js";
import {Controls} from "./controls.js";
import {Achievements} from "./achievements.js";

const $=s=>document.querySelector(s);
const ui={
 canvas:$("#game"),mainMenu:$("#mainMenu"),settingsMenu:$("#settingsMenu"),creditsMenu:$("#creditsMenu"),pauseMenu:$("#pauseMenu"),
 newMoonBtn:$("#newMoonBtn"),continueBtn:$("#continueBtn"),settingsBtn:$("#settingsBtn"),creditsBtn:$("#creditsBtn"),
 backFromSettings:$("#backFromSettings"),backFromCredits:$("#backFromCredits"),resumeBtn:$("#resumeBtn"),saveBtn:$("#saveBtn"),mainMenuBtn:$("#mainMenuBtn"),
 invertToggle:$("#invertToggle"),sensitivityRange:$("#sensitivityRange"),camDistanceRange:$("#camDistanceRange"),
 xpValue:$("#xpValue"),distanceValue:$("#distanceValue"),seedValue:$("#seedValue"),landmarkValue:$("#landmarkValue"),achievement:$("#achievement"),
 stick:$("#stick"),nub:$("#nub"),jumpBtn:$("#jumpBtn")
};
const STORAGE="giantMoonSave_v03";
let state={seed:"42069",xp:0,distanceKm:0,achievements:[],player:{x:0,y:50,z:0},settings:{invert:true,sensitivity:5,camDistance:120}};
try{state={...state,...JSON.parse(localStorage.getItem(STORAGE)||"{}")}}catch{}
ui.invertToggle.checked=state.settings.invert;ui.sensitivityRange.value=state.settings.sensitivity;ui.camDistanceRange.value=state.settings.camDistance;ui.seedValue.textContent=state.seed;

const renderer=new THREE.WebGLRenderer({canvas:ui.canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x030307);scene.fog=new THREE.Fog(0x030307,900,3400);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,6500);

scene.add(new THREE.AmbientLight(0xffffff,.62));
const sun=new THREE.DirectionalLight(0xffffff,2.5);sun.position.set(250,380,140);scene.add(sun);

const terrain=new MoonTerrain(state.seed);scene.add(terrain.group);

const giant=new THREE.Group();
const mat=new THREE.MeshLambertMaterial({color:0x1d1d22,flatShading:true});
const body=new THREE.Mesh(new THREE.CapsuleGeometry(9,34,6,10),mat);body.position.y=30;giant.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(11,12,8),mat);head.position.y=58;giant.add(head);
const armGeo=new THREE.BoxGeometry(8,34,8),legGeo=new THREE.BoxGeometry(8,28,8);
for(const x of [-15,15]){const a=new THREE.Mesh(armGeo,mat);a.position.set(x,31,0);giant.add(a)}
for(const x of [-6,6]){const l=new THREE.Mesh(legGeo,mat);l.position.set(x,9,0);giant.add(l)}
giant.position.set(state.player.x,state.player.y,state.player.z);scene.add(giant);

const earth=new THREE.Mesh(new THREE.SphereGeometry(72,32,24),new THREE.MeshBasicMaterial({color:0x3b82f6}));
earth.position.set(-520,320,-1350);scene.add(earth);

const stars=new THREE.Group();
for(let i=0;i<350;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshBasicMaterial({color:0xffffff}));s.position.set((Math.random()-.5)*5000,Math.random()*2200+400,(Math.random()-.5)*5000);stars.add(s)}
scene.add(stars);

const landmarks=new Landmarks(state.seed,terrain);scene.add(landmarks.group);
const controls=new Controls(ui.canvas,ui);
const achievements=new Achievements(state,ui);

let mode="menu",velY=0,jumps=0,still=0,lastPos=giant.position.clone(),last=performance.now();
function show(screen){[ui.mainMenu,ui.settingsMenu,ui.creditsMenu,ui.pauseMenu].forEach(s=>s.classList.remove("active"));screen?.classList.add("active")}
function startNew(){mode="play";show(null);achievements.unlock("goodmorning","Good Morning Moon",250)}
function save(){state.player={x:giant.position.x,y:giant.position.y,z:giant.position.z};state.settings={invert:ui.invertToggle.checked,sensitivity:Number(ui.sensitivityRange.value),camDistance:Number(ui.camDistanceRange.value)};localStorage.setItem(STORAGE,JSON.stringify(state));achievements.unlock("saved","Filed Paperwork On The Moon",750)}
ui.newMoonBtn.onclick=()=>{localStorage.removeItem(STORAGE);state.xp=0;state.distanceKm=0;state.achievements=[];giant.position.set(0,50,0);startNew()};
ui.continueBtn.onclick=startNew;ui.settingsBtn.onclick=()=>show(ui.settingsMenu);ui.creditsBtn.onclick=()=>show(ui.creditsMenu);
ui.backFromSettings.onclick=()=>show(ui.mainMenu);ui.backFromCredits.onclick=()=>show(ui.mainMenu);
ui.resumeBtn.onclick=()=>{mode="play";show(null)};ui.saveBtn.onclick=save;ui.mainMenuBtn.onclick=()=>{mode="menu";save();show(ui.mainMenu)};
addEventListener("keydown",e=>{if(e.key==="Escape"&&mode==="play"){mode="pause";show(ui.pauseMenu)}});

function tick(){
 requestAnimationFrame(tick);
 const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
 if(mode==="play"){
  terrain.update(giant.position.x,giant.position.z);
  const mv=controls.movement(),speed=105*dt;
  if(mv.active){
    giant.position.x+=mv.x*speed;giant.position.z+=mv.z*speed;
    giant.rotation.y=Math.atan2(mv.x,mv.z);
  }
  const g=terrain.height(giant.position.x,giant.position.z)+33;
  if(controls.jump()&&Math.abs(giant.position.y-g)<1){velY=34;jumps++;achievements.unlock("boing","Boing",500)}
  velY-=38*dt;giant.position.y+=velY*dt;
  if(giant.position.y<g){giant.position.y=g;velY=0}
  const moved=giant.position.distanceTo(lastPos);
  state.distanceKm+=moved/1000;still= moved<.04 ? still+dt : 0;lastPos.copy(giant.position);
  const lm=landmarks.check(giant,achievements);
  achievements.tick({distanceKm:state.distanceKm,jumps,stillSeconds:still,lookSeconds:controls.lookSeconds});
  const r=Number(ui.camDistanceRange.value),yaw=controls.yaw,pitch=controls.pitch;
  const target=new THREE.Vector3(giant.position.x,giant.position.y+34,giant.position.z);
  camera.position.lerp(new THREE.Vector3(target.x+Math.sin(yaw)*Math.cos(pitch)*r,target.y+Math.sin(pitch)*r,target.z+Math.cos(yaw)*Math.cos(pitch)*r),.14);
  camera.lookAt(target);
  ui.xpValue.textContent=state.xp;ui.distanceValue.textContent=state.distanceKm.toFixed(2);ui.landmarkValue.textContent=lm;
 }
 renderer.render(scene,camera);
}
tick();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
