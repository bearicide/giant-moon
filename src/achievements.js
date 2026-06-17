
export class Achievements{
  constructor(state,ui){this.state=state;this.ui=ui;this.unlocked=new Set(state.achievements||[]);this.queue=[];this.showing=false}
  unlock(id,title,xp){
    if(this.unlocked.has(id))return;
    this.unlocked.add(id);this.state.achievements=[...this.unlocked];this.state.xp+=xp;
    this.queue.push({title,xp});this.showNext();
  }
  showNext(){
    if(this.showing||!this.queue.length)return;
    this.showing=true;
    const item=this.queue.shift();
    this.ui.achievement.innerHTML=`<strong>🏆 ${item.title}</strong><span>+${item.xp} XP</span>`;
    this.ui.achievement.style.display="block";
    setTimeout(()=>{this.ui.achievement.style.display="none";this.showing=false;this.showNext()},2500);
  }
  tick(s){
    if(s.distanceKm>=.1)this.unlock("walk100","A Pleasant Walk",50);
    if(s.distanceKm>=1)this.unlock("walk1k","Another Pleasant Walk",75);
    if(s.distanceKm>=5)this.unlock("walk5k","A Reasonable Amount Of Moon",100);
    if(s.jumps>=1)this.unlock("jump","Boing",500);
    if(s.stillSeconds>=20)this.unlock("still20","Standing Around",1500);
    if(s.lookSeconds>=45)this.unlock("look45","Looking At Things",2000);
  }
}
