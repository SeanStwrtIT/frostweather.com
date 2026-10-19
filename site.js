
(() => {
  const root=document.getElementById('frost-premium');
  const topics={
    sunset:{category:'Local skies',title:'The sky after the rain.',body:'The clouds finally broke this evening and the light changed in minutes. What did the sky look like where you were?',reply:'That moment when the rain has passed but the clouds are still catching the sun is my favorite. I’d love to compare views from nearby.'},
    radar:{category:'Weather questions',title:'What does the radar actually show?',body:'I’m learning to read radar and would love a simple explanation of the colors and the time shown on each scan. What should a beginner look at first?',reply:'Start with the layer name, its legend, and the scan timestamp. Those tell you what the image represents and when it was measured. Different layers can use colors for very different things.'},
    photos:{category:'Photography',title:'Your favorite hour to look up.',body:'First light or blue hour? I keep returning to the quiet stretch just after sunset. Share your favorite time of day to photograph the sky.',reply:'Blue hour for me. Keeping a little of the horizon in the frame helps show how the sky changes from one place to another.'},
    frost:{category:'Building Frost',title:'Help shape what comes next.',body:'What would make Frost part of your day? Tell us about a weather question, a community feature, or a small detail you would love to see.',reply:'I’d like to follow the same conversation on my phone and on the website. Being able to return to a useful explanation later would make Rooms especially valuable.'}
  };
  const state={category:'All Rooms',topic:null};
  const list=root.querySelector('.fp-thread-list');
  const view=root.querySelector('.fp-topic-view');
  function render(){
    root.querySelectorAll('[data-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===state.category)));
    list.hidden=!!state.topic;view.hidden=!state.topic;
    root.querySelectorAll('[data-topic]').forEach(button=>{button.hidden=state.category!=='All Rooms'&&topics[button.dataset.topic].category!==state.category;});
    if(state.topic){const topic=topics[state.topic];view.querySelector('[data-detail-category]').textContent=topic.category.toUpperCase();view.querySelector('[data-detail-title]').textContent=topic.title;view.querySelector('[data-detail-body]').textContent=topic.body;view.querySelector('[data-detail-reply]').textContent=topic.reply;}
  }

  function announce(){
    const count=[...root.querySelectorAll('[data-topic]')].filter(button=>!button.hidden).length;
    root.querySelector('#room-status').textContent=`${count} sample ${count===1?'discussion':'discussions'} in ${state.category}.`;
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
  render();
})();
