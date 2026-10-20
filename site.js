(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const svgNS = 'http://www.w3.org/2000/svg';
  const hours = $('#dial-hours'), thermal = $('#dial-temp'), ticks = $('#dial-ticks'), labels = $('#dial-labels');
  const slider = $('#hour-slider');
  const temperatures = [58,56,54,53,52,53,56,59,62,65,68,71,73,75,76,76,75,72,68,64,62,61,60,59];
  const rainChances = [0,0,0,0,0,0,5,5,5,5,10,10,10,10,10,10,10,15,15,10,5,5,0,0];
  const sunrise = 7.25, sunset = 18.75;
  const polar = (radius, angle) => { const a = (angle - 90) * Math.PI / 180; return [250 + radius * Math.cos(a),250 + radius * Math.sin(a)]; };
  const mix = (a,b,t) => '#' + a.match(/[\da-f]{2}/gi).map((v,i) => Math.round(parseInt(v,16)+(parseInt(b.match(/[\da-f]{2}/gi)[i],16)-parseInt(v,16))*t).toString(16).padStart(2,'0')).join('');
  function node(name, attrs, parent) { const el = document.createElementNS(svgNS,name); Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v)); if(parent) parent.append(el); return el; }
  function arc(radius,start,end) { const a=polar(radius,start),b=polar(radius,end);return `M${a[0]} ${a[1]} A${radius} ${radius} 0 0 1 ${b[0]} ${b[1]}`; }
  // Canonical 17D palette: one color per hour, shared with Frost’s brand ring.
  const hourColors = ["#1D265A", "#20295F", "#222C63", "#252F68", "#303872", "#815D82", "#E29480", "#F3BD88", "#E5D2A9", "#C8D9D7", "#B2D7EC", "#A3CEE7", "#94C5E2", "#90C2E0", "#99C6E1", "#A2CAE2", "#C0C9BF", "#F4C27A", "#EE8A5B", "#A14A70", "#433774", "#2A2F68", "#242B62", "#1F275B"];
  function skyColor(h) { return hourColors[Math.floor(h)%24]; }
  function temperature(h) { const whole=Math.floor(h);return temperatures[whole]+(temperatures[(whole+1)%24]-temperatures[whole])*(h-whole); }
  // Fine geometry preserves clean hourly gaps; each hour retains its canonical color.
  for(let i=0;i<288;i++) {
    const h=i/12,start=i*1.25+(i%12===0?.6:-.03),end=(i+1)*1.25+((i+1)%12===0?-.6:.03);
    node('path',{d:arc(182,start,end),fill:'none',stroke:skyColor(h),'stroke-width':35},hours);
    const value=(temperature(h)-52)/24;
    node('path',{d:arc(157,start,end),fill:'none',stroke:`hsl(${210-value*176} ${33+value*15}% ${64-value*11}%)`,'stroke-width':4},thermal);
  }
  for(let i=0;i<96;i++) {
    const major=i%4===0,a=polar(major?209:213,i*3.75),b=polar(major?217:216,i*3.75);
    node('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],class:major?'dial-tick major':'dial-tick'},ticks);
  }
  for(let h=0;h<24;h+=3) {
    const el=node('text',{'text-anchor':'middle','dominant-baseline':'central',class:'dial-label','data-hour':h},labels);
    el.textContent=h%12||12;
  }
  function clock(h) { const whole=Math.floor(h),minute=Math.round((h-whole)*60);return `${whole%12||12}:${String(minute).padStart(2,'0')} ${whole>=12?'PM':'AM'}`; }
  function phase(h) {
    if(h<6.2) return {name:'BEFORE THE DAY',mood:'night',title:['The quiet before','the light.'],description:'Cool air and a still sky. The morning is taking its time.',condition:'Clear night',light:'Sunrise at 7:15 AM'};
    if(h<sunrise) return {name:'FIRST LIGHT',mood:'morning',title:['A new day','is taking shape.'],description:'The horizon is brightening. A cool morning is on the way.',condition:'First light',light:'Sunrise at 7:15 AM'};
    if(h<10) return {name:'MORNING LIGHT',mood:'morning',title:['A bright start.','A fresh outlook.'],description:'The sun is up. Clear skies and cool air ease into the morning.',condition:'Clear skies',light:'Sunrise at 7:15 AM'};
    if(h<16.5) return {name:'IN THE DAYLIGHT',mood:'day',title:['The day is','wide open.'],description:'A warm afternoon under a clear sky. Take a moment to look up.',condition:'Clear skies',light:remaining(h)};
    if(h<sunset) return {name:'GOLDEN HOUR',mood:'golden',title:['A little daylight.','A little longer.'],description:'Clear skies and a softer sun. There’s still time to step outside.',condition:'Clear skies',light:remaining(h)};
    if(h<20) return {name:'AFTERGLOW',mood:'twilight',title:['The light fades.','The color stays.'],description:'The sun has slipped below the horizon. The air is cooling down.',condition:'Twilight',light:'Sunset at 6:45 PM'};
    return {name:'UNDER THE STARS',mood:'night',title:['A slower pace.','A deeper blue.'],description:'A clear, cool evening. The day gives way to a quieter sky.',condition:'Clear night',light:'Sunset at 6:45 PM'};
  }
  function remaining(h) { const minutes=Math.round((sunset-h)*60),hr=Math.floor(minutes/60),min=minutes%60;return `${hr?`${hr} hr`:''}${hr&&min?' ':''}${min?`${min} min`:''} until sunset`; }
  function renderHour(value) {
    const h=Number(value),angle=-h*15,time=clock(h),temp=Math.round(temperature(h)),state=phase(h);
    [hours,thermal,ticks].forEach(el=>el.setAttribute('transform',`rotate(${angle} 250 250)`));
    for(const el of labels.children) { const [x,y]=polar(235,Number(el.dataset.hour)*15+angle);el.setAttribute('x',x);el.setAttribute('y',y); }
    $('#dial-time').textContent=time;$('#dial-temp-text').textContent=`${temp}°`;$('#dial-condition').textContent=state.condition;
    $('#scrub-time').textContent=time;slider.setAttribute('aria-valuetext',`${time}, ${temp} degrees, ${state.condition.toLowerCase()}`);
    $('#feels').textContent=`${temp}°`;$('#rain').textContent=`${rainChances[Math.floor(h)]}%`;
    const wind=$('#wind');wind.replaceChildren(document.createTextNode(h>=10&&h<19?'NW 5 ':'N 3 '));const unit=document.createElement('span');unit.textContent='mph';wind.append(unit);
    $('#sky-phase').textContent=state.name;
    $('#sky-line').replaceChildren(document.createTextNode(state.title[0]+' '),document.createElement('br'),document.createTextNode(state.title[1]));
    $('#sky-description').textContent=state.description;$('#light').textContent=state.light;$('.product-stage').dataset.phase=state.mood;
    const day=h>=sunrise&&h<sunset,progress=Math.max(0,Math.min(1,(h-sunrise)/(sunset-sunrise)));
    $('#sun-dot').setAttribute('cx',188+124*progress);$('#sun-dot').setAttribute('cy',206-45*Math.sin(progress*Math.PI));$('#sun-dot').setAttribute('opacity',day?'1':'0');
    $('#moon-dot').setAttribute('opacity',state.mood==='night'?'1':'0');
    const colors=state.mood==='night'?['#aaabc3','#d5d3df']:state.mood==='twilight'?['#c8b5c7','#e7d1c8']:state.mood==='day'||state.mood==='morning'?['#b8d4df','#e1e9e6']:['#e8c39c','#f4e4ce'];
    $('#dome-top').setAttribute('stop-color',colors[0]);$('#dome-bottom').setAttribute('stop-color',colors[1]);
    document.querySelectorAll('.presets button').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.hour)===h)));
  }
  slider.addEventListener('input',()=>renderHour(slider.value));
  document.querySelectorAll('.presets button').forEach(button=>button.addEventListener('click',()=>{slider.value=button.dataset.hour;renderHour(slider.value);}));
  renderHour(slider.value);

  // Fictional, compressed scenarios: each sequence moves from a forecast to observations and a revised call.
  const rooms={
    hurricanes:{posts:[
      ['Maya','8:10 AM','Euro turns it north earlier; GFS stays west longer. That timing gap is the whole forecast for the coast.','Forecast'],
      ['Eli','8:18 AM','Maya, the ensembles still spread both ways. I’d keep a wider track envelope than either headline run.','Forecast'],
      ['Jordan','8:26 AM','And intensity is its own puzzle. Warm water helps, but that pocket of dry air could slow the strengthening.','Forecast'],
      ['Eli','1:05 PM','The center has edged north over the last few hours. Interesting—but one wobble isn’t the turn yet.','Nowcast'],
      ['Maya','1:14 PM','Agreed. If that motion holds through another advisory, I’d lean toward the earlier-turn solution.','Nowcast'],
      ['Chris','3:40 PM','First band just hit. Hard rain for five minutes—now blue sky. Anyone else getting these sudden breaks?','On the ground'],
      ['Jordan','3:48 PM','There’s our band! Almost on the morning timing. The center is still offshore; the weather clearly isn’t.','Nowcast'],
      ['Chris','4:15 PM','Wind picked up again with the next band. The gaps between them are getting shorter from my window.','On the ground'],
      ['Maya','4:24 PM','My next call: earlier bands, slower clearing. Still watching whether that northward turn becomes sustained.','Next call']
    ]},
    tornadoes:{posts:[
      ['Rae','9:05 AM','HRRR fires discrete cells around 4; NAM holds the cap longer. Plenty of shear, but will anything get going?','Forecast'],
      ['Dev','9:13 AM','Rae, I’m leaning later. The warm layer is stubborn. A little more surface heating could change that fast.','Forecast'],
      ['Sam','9:22 AM','If cells stay isolated, they’ll have room to organize. If they merge early, we’re looking at a different setup.','Forecast'],
      ['Jo','3:32 PM','There it is. A tower west of me is finally holding. Anyone else watching that one?','On the ground'],
      ['Rae','3:45 PM','Yes—first echo is up! Still isolated. That earlier initiation window is looking more plausible.','Nowcast'],
      ['Dev','4:06 PM','The updraft looks organized across a few scans. There’s rotation aloft; that alone doesn’t confirm a tornado.','Nowcast'],
      ['Sam','4:18 PM','Second cell just popped south of it. Now the big question: do they stay separate?','Nowcast'],
      ['Jo','4:27 PM','Sky has gone dark from the house. I’ve switched from model watching to the official local updates.','On the ground'],
      ['Rae','4:35 PM','I’m leaning toward a line forming next. If those cells merge, the wind threat could become more widespread.','Next call']
    ]},
    blizzards:{posts:[
      ['Nora','8:20 AM','Euro is colder; GFS keeps a warm layer longer. That puts the rain–snow line right through our forecast area.','Forecast'],
      ['Alex','8:29 AM','Nora, I’d split the difference for now. The changeover time matters more than the big snowfall map.','Forecast'],
      ['Jamie','8:38 AM','My wildcard is the narrow band northwest of the low. If it stalls, totals could jump over just a few miles.','Forecast'],
      ['Nora','5:12 PM','Called the changeover too late. Wet flakes already! 34° on the porch thermometer.','On the ground'],
      ['Alex','5:25 PM','Radar’s heavier band is pivoting toward us. If cooling continues under it, the changeover could speed up.','Nowcast'],
      ['Jamie','6:02 PM','That band has barely moved in three scans. This is where the county-to-county totals start to separate.','Nowcast'],
      ['Nora','6:18 PM','There it is—all snow. Huge flakes in the porch light. Grass turned white in twenty minutes.','On the ground'],
      ['Alex','6:31 PM','That answers the changeover question. Next is wind: loose snow could keep visibility poor after the band moves.','Nowcast'],
      ['Jamie','6:45 PM','I’d raise totals under that stalled band, not everywhere. Still a sharp cutoff if it shifts ten miles east.','Next call']
    ]},
    wildfires:{posts:[
      ['Tess','8:15 AM','The smoke model brings the plume east by noon. Surface winds turn later, though—some could stay above us.','Forecast'],
      ['Morgan','8:24 AM','Tess, that timing is my question too. A plume overhead doesn’t automatically mean the same smoke at ground level.','Forecast'],
      ['Chris','8:33 AM','I’d watch for more mixing this afternoon. If smoke reaches the surface, the monitors should help show it.','Forecast'],
      ['Tess','12:40 PM','Anyone else losing the ridgeline? Blue sky overhead, but the light down here has gone oddly warm.','On the ground'],
      ['Morgan','12:52 PM','Yes, I see it too. The satellite plume is over the valley, but surface readings haven’t risen together yet.','Nowcast'],
      ['Chris','1:35 PM','There’s the wind shift. West at the local station now—almost an hour later than the morning run.','Nowcast'],
      ['Tess','2:08 PM','Haze is thicker down here now. I’m checking AirNow rather than guessing air quality from the view.','On the ground'],
      ['Morgan','2:19 PM','Two nearby monitors are climbing. That fits smoke mixing down, though the valley still looks patchy.','Nowcast'],
      ['Chris','2:30 PM','If the west wind holds, I’d expect the plume farther east next. Clearing here is still a timing question.','Next call']
    ]}
  };
  const roomPhotos={
    hurricanes:{file:'room-hurricane.jpg',alt:'The cloud-lined eye of Hurricane Isabel photographed from the International Space Station in 2003.',caption:'Hurricane Isabel · 2003',credit:'NASA / Ed Lu',url:'https://commons.wikimedia.org/wiki/File:Hurricane_Isabel_eye_from_ISS.jpg'},
    tornadoes:{file:'room-tornado.jpg',alt:'An archival NOAA photograph of a tornado beneath a dark storm cloud, partly obscured by rain and mist.',caption:'Tornado · NOAA archive',credit:'NOAA Photo Library',url:'https://commons.wikimedia.org/wiki/File:Nssl0090_-_Flickr_-_NOAA_Photo_Library.jpg'},
    blizzards:{file:'room-blizzard.jpg',alt:'Snow falling heavily over a Washington, D.C. street during the January 2016 blizzard.',caption:'Washington, D.C. · 2016',credit:'Joe Flood · CC BY 2.0',url:'https://commons.wikimedia.org/wiki/File:Blizzard3_-_NOAA.jpg'},
    wildfires:{file:'room-wildfire.jpg',alt:'A tall smoke plume rises above a forested mountain during Utah’s East Fork Fire in 2020.',caption:'East Fork Fire · 2020',credit:'U.S. Forest Service',url:'https://commons.wikimedia.org/wiki/File:East_Fork_fire_in_Ashley_National_Forest.jpg'}
  };
  function showRoomPhoto(key) {
    const photo=roomPhotos[key],image=$('#room-photo');
    image.src=`assets/${photo.file}`;image.alt=photo.alt;
    $('#photo-caption').textContent=photo.caption;
    $('#photo-source').textContent=`${photo.credit} · Archive ↗`;
    $('#photo-source').setAttribute('title',`${photo.caption} — ${photo.credit}. View photo source.`);
    $('#photo-source').href=photo.url;
  }
  const note=$('#room-note'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let current='hurricanes',postIndex=0,paused=reduced.matches,visible=false,timer=null;
  const chapterNames=['The forecast','The shift','Right outside'];
  function renderMoment(animate=false,announce=false) {
    const data=rooms[current].posts[postIndex],chapter=Math.floor(postIndex/3);
    const article=document.createElement('article');article.className=animate&&!reduced.matches?'room-comment arriving':'room-comment';
    const avatar=document.createElement('span');avatar.className='room-avatar';avatar.setAttribute('aria-hidden','true');avatar.textContent=data[0][0];
    const body=document.createElement('div'),meta=document.createElement('div'),name=document.createElement('strong'),time=document.createElement('span'),text=document.createElement('p');
    meta.className='room-meta';name.textContent=data[0];time.textContent=data[1];text.textContent=data[2];meta.append(name,time);body.append(meta,text);article.append(avatar,body);note.replaceChildren(article);
    document.querySelectorAll('[data-chapter]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.chapter)===chapter)));
    const replay=postIndex===rooms[current].posts.length-1;
    $('#next-post').replaceChildren(document.createTextNode(replay?'Replay story ':'Next moment '));
    const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent=replay?'↻':'→';$('#next-post').append(arrow);
    if(announce)$('#post-status').textContent=`${chapterNames[chapter]}. ${data[0]}, ${data[1]}: ${data[2]}`;
  }
  function advance(announce=false) {
    postIndex=(postIndex+1)%rooms[current].posts.length;renderMoment(true,announce);
  }
  function schedule() {
    clearInterval(timer);timer=null;
    if(!paused&&visible&&!document.hidden)timer=setInterval(()=>advance(),6000);
  }
  function selectRoom(key) {
    current=key;postIndex=0;$('.room-story').dataset.topic=key;
    document.querySelectorAll('[data-room]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.room===key)));
    showRoomPhoto(key);renderMoment();schedule();
  }
  function reflectPause() {
    const button=$('#pause-posts');button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Resume':'Pause';
    button.setAttribute('aria-label',paused?'Resume automatic story moments':'Pause automatic story moments');
  }
  document.querySelectorAll('[data-room]').forEach(button=>button.addEventListener('click',()=>selectRoom(button.dataset.room)));
  document.querySelectorAll('[data-chapter]').forEach(button=>button.addEventListener('click',()=>{postIndex=Number(button.dataset.chapter)*3;renderMoment(true,true);schedule();}));
  $('#pause-posts').addEventListener('click',()=>{paused=!paused;reflectPause();schedule();});
  $('#next-post').addEventListener('click',()=>{advance(true);schedule();});
  reduced.addEventListener('change',event=>{if(event.matches)paused=true;reflectPause();schedule();});
  document.addEventListener('visibilitychange',schedule);
  // The photograph can be on screen while the conversation is still below the fold.
  // Observe the comment itself so autoplay begins only once the reader reaches it.
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.65;schedule();},{threshold:[0,.65]}).observe(note);
  reflectPause();selectRoom(current);
})();
