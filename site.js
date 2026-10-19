
(() => {
  const root=document.getElementById('frost-premium');
  const topics={
    hurricane:{category:'Hurricanes',title:'The next turn changes everything.',body:'Imagine following a hurricane as a new forecast track arrives. Which part changed: the center line, the timing, or the area of uncertainty? This room brings those questions into one conversation.',reply:'I’d put successive official forecasts side by side and compare their issue times. Coastal photos could add perspective, while the official advisory stays clearly separate from everyone’s interpretation.'},
    tornado:{category:'Tornadoes',title:'When the atmosphere comes together.',body:'A fictional outbreak is developing across the Plains. The satellite view shows the bigger picture; the radar reveals individual storms. What changed between the last two scans?',reply:'I’d love a room that follows a storm’s evolution without treating every screenshot as a confirmed tornado. Keep observations timestamped and official warnings distinguishable from discussion.'},
    blizzard:{category:'Winter storms',title:'One storm. A thousand different winters.',body:'In this scenario, one town sees wet flakes while another is buried under a persistent snow band. How would you compare the same storm from both places?',reply:'A window view, a location at town level, and the time it was taken would tell a great story. It would be fascinating to watch the snow line move through everyone’s observations.'},
    wildfire:{category:'Wildfires',title:'The story doesn’t stop at the fireline.',body:'Imagine a smoke plume stretching far beyond a wildfire. The sky looks different hundreds of miles away. How do satellite imagery, official air-quality readings, and local observations connect?',reply:'I’d compare the source and timestamp of each reading before interpreting a photo. The room could help explain the changing sky, with evacuation instructions and health guidance linked to the responsible authorities.'}
  };
  const state={category:'All Rooms',topic:null};
  const list=root.querySelector('.fp-thread-list');
  const view=root.querySelector('.fp-topic-view');
  function render(){
    root.querySelectorAll('[data-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===state.category)));
    list.hidden=!!state.topic;view.hidden=!state.topic;
    root.querySelectorAll('[data-topic]').forEach(button=>{button.hidden=state.category!=='All Rooms'&&topics[button.dataset.topic].category!==state.category;});
    if(state.topic){const topic=topics[state.topic];view.querySelector('[data-detail-image]').src=`assets/room-${state.topic}.svg`;view.querySelector('[data-detail-category]').textContent=topic.category.toUpperCase();view.querySelector('[data-detail-title]').textContent=topic.title;view.querySelector('[data-detail-body]').textContent=topic.body;view.querySelector('[data-detail-reply]').textContent=topic.reply;}
  }

  function announce(){
    const count=[...root.querySelectorAll('[data-topic]')].filter(button=>!button.hidden).length;
    root.querySelector('#room-status').textContent=`${count} scenario ${count===1?'discussion':'discussions'} in ${state.category}.`;
  }
  root.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{
    state.category=button.dataset.category;state.topic=null;render();announce();
  }));
  root.querySelectorAll('[data-topic]').forEach(button=>button.addEventListener('click',()=>{
    state.topic=button.dataset.topic;render();view.querySelector('h3').focus({preventScroll:true});
    view.scrollIntoView({block:'nearest',behavior:'auto'});
  }));
  root.querySelector('.fp-back').addEventListener('click',()=>{
    const previous=state.topic;state.topic=null;render();
    root.querySelector(`[data-topic="${previous}"]`).focus({preventScroll:true});
  });
  const screens={
    forecast:{src:'frost-mac.jpg',title:'A little more certainty about your day.',description:'Hourly conditions, the days ahead, and the details that help you decide when to head outside.',alt:'Frost for Mac showing the hourly and ten-day forecast beside the weather map.'},
    map:{src:'frost-mac.jpg',title:'Put the forecast in perspective.',description:'Explore the weather map and radar timeline, with the forecast close at hand. This captured view shows clear conditions around Atlanta.',alt:'The Frost weather map around Atlanta, with radar and forecast timeline controls.'},
    feed:{src:'frost-feed.jpg',title:'Another window on the same sky.',description:'Find nearby perspectives and people to follow. This development screen shows example photography while the community takes shape.',alt:'The actual Frost Feed screen with Nearby selected and clearly labeled example weather photographs.'},
    rooms:{src:'frost-rooms.jpg',title:'Find your people. Follow the weather.',description:'A place for local conversations and weather stories that cross borders. Explore the scenario previews below to see where Rooms could go.',alt:'The actual Frost Rooms development screen showing its local Atlanta room and search controls.'}
  };
  const tabs=[...root.querySelectorAll('[data-screen]')],panel=root.querySelector('#showcase-panel'),screenImage=root.querySelector('#showcase-image');
  function selectScreen(tab){
    const key=tab.dataset.screen, screen=screens[key];
    tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;});
    panel.setAttribute('aria-labelledby',tab.id);panel.dataset.view=key;
    screenImage.src=`assets/${screen.src}`;screenImage.alt=screen.alt;
    root.querySelector('#showcase-title').textContent=screen.title;root.querySelector('#showcase-description').textContent=screen.description;
  }
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectScreen(tab));tab.addEventListener('keydown',e=>{
    let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;else if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;
    e.preventDefault();selectScreen(tabs[next]);tabs[next].focus();
  });});
  root.querySelector('#privacy-link').addEventListener('click',()=>{root.querySelector('#privacy').open=true;});
  // A lightweight atmospheric scene. No video downloads, live-weather claims, or tracking.
  const canvas=root.querySelector('#weather-scene'),ctx=canvas.getContext('2d'),hero=root.querySelector('.fp-atmosphere'),motion=root.querySelector('#motion-toggle');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused=reduced.matches,mode='rain',raf=0,last=0,w=0,h=0,inView=true,particles=[];
  function resize(){w=hero.clientWidth;h=hero.clientHeight;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx?.setTransform(dpr,0,0,dpr,0,0);particles=Array.from({length:w<600?55:100},()=>({x:Math.random()*w,y:Math.random()*h,z:.25+Math.random()*.75}));}
  function syncMotion(){hero.classList.toggle('fp-motion-paused',paused);motion.textContent=paused?'Play motion':'Pause motion';motion.setAttribute('aria-pressed',String(paused));if(paused){cancelAnimationFrame(raf);raf=0;hero.style.setProperty('--parallax','0px');}else start();}
  function start(){if(!raf&&!paused&&inView&&!document.hidden&&ctx){last=0;raf=requestAnimationFrame(draw);}}
  function draw(time){raf=0;if(paused||!inView||document.hidden||!ctx)return;const dt=last?Math.min((time-last)/16.7,2):1;last=time;ctx.clearRect(0,0,w,h);
    if(mode!=='clear') for(const p of particles){p.y+=(mode==='rain'?8:0.7)*p.z*dt;p.x+=(mode==='rain'?-2:Math.sin(time*.0004+p.z*9)*.55)*dt;if(p.y>h+20){p.y=-20;p.x=Math.random()*w;}if(p.x<0)p.x=w;if(p.x>w)p.x=0;
      ctx.beginPath();if(mode==='rain'){ctx.strokeStyle=`rgba(225,238,250,${.10+p.z*.18})`;ctx.lineWidth=.6+p.z*.6;ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-3*p.z,p.y+18*p.z);ctx.stroke();}else{ctx.fillStyle=`rgba(245,248,255,${.25+p.z*.4})`;ctx.arc(p.x,p.y,1+p.z*1.6,0,Math.PI*2);ctx.fill();}}
    const y=Math.min(window.scrollY,hero.offsetHeight);hero.style.setProperty('--parallax',`${y*.16}px`);raf=requestAnimationFrame(draw);
  }
  root.querySelectorAll('[data-weather]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.weather;root.querySelectorAll('[data-weather]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));ctx?.clearRect(0,0,w,h);start();}));
  motion.addEventListener('click',()=>{paused=!paused;syncMotion();});
  reduced.addEventListener('change',e=>{paused=e.matches;syncMotion();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else start();});
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(!inView){cancelAnimationFrame(raf);raf=0;}else start();}).observe(hero);
  window.addEventListener('resize',resize,{passive:true});resize();syncMotion();
  render();
})();
