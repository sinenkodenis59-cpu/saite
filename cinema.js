/* Cinematic introduction and persistent navigation; existing forms/CRM stay in script.js. */
(() => {
  const q = s => document.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slides = [...document.querySelectorAll('.cinema-slides img')];
  const dots = [...document.querySelectorAll('[data-cinema-slide]')];
  let active = 0, timer, touchX, automatic = false;
  const auto = q('[data-cinema-auto]');
  function render(index) {
    active = (index + slides.length) % slides.length;
    slides.forEach((img,i)=>{img.classList.toggle('active',i===active);img.setAttribute('aria-hidden',String(i!==active));});
    dots.forEach((b,i)=>{if(i===active)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
  }
  function stop() { clearInterval(timer); }
  function start() {stop();if(automatic&&!reduced&&!document.hidden)timer=setInterval(()=>render(active+1),6500);}
  function manual(index) {automatic=false;stop();auto.setAttribute('aria-label','Запустить слайд-шоу');auto.textContent='▷';render(index);}
  q('[data-cinema-prev]').addEventListener('click',()=>manual(active-1));
  q('[data-cinema-next]').addEventListener('click',()=>manual(active+1));
  dots.forEach((b,i)=>b.addEventListener('click',()=>manual(i)));
  auto.addEventListener('click',()=>{automatic=!automatic;auto.textContent=automatic?'Ⅱ':'▷';auto.setAttribute('aria-label',automatic?'Остановить слайд-шоу':'Запустить слайд-шоу');start();});
  const slider=q('.cinema-slides');
  slider.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();manual(active+1);}if(e.key==='ArrowLeft'){e.preventDefault();manual(active-1);}});
  slider.addEventListener('touchstart',e=>touchX=e.touches[0].clientX,{passive:true});
  slider.addEventListener('touchend',e=>{if(touchX!==undefined){const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>45)manual(active+(dx<0?1:-1));touchX=undefined;}},{passive:true});
  q('.cinema-hero').addEventListener('mouseenter',stop);q('.cinema-hero').addEventListener('mouseleave',start);
  q('.cinema-hero').addEventListener('focusin',stop);q('.cinema-hero').addEventListener('focusout',start);
  const menu=q('.nav'),toggle=q('.menu-toggle');
  toggle.setAttribute('aria-controls','site-navigation');menu.id='site-navigation';menu.inert=true;
  function closeMenu(){document.body.classList.remove('menu-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню');menu.inert=true;toggle.focus();}
  toggle.addEventListener('click',()=>{const opened=document.body.classList.contains('menu-open');menu.inert=!opened;toggle.setAttribute('aria-label',opened?'Закрыть меню':'Открыть меню');if(opened)menu.querySelector('a').focus();});
  menu.addEventListener('click',e=>{if(e.target.closest('a')){menu.inert=true;toggle.setAttribute('aria-label','Открыть меню');}});
  document.addEventListener('keydown',e=>{if(document.body.classList.contains('menu-open')){if(e.key==='Escape')closeMenu();if(e.key==='Tab'){const links=[toggle,...menu.querySelectorAll('a')];let i=links.indexOf(document.activeElement);e.preventDefault();links[(i+(e.shiftKey?-1:1)+links.length)%links.length].focus();}}});
  const player=q('.cinema-player'),v=player.querySelector('video'),play=q('[data-film-play]'),sound=q('[data-film-sound]'),full=q('[data-film-full]'),seek=q('[data-film-seek]');
  let loaded=false,pausedByUser=false;
  function load(){if(loaded)return;v.querySelectorAll('source').forEach(s=>s.src=s.dataset.src);v.load();loaded=true;}
  function error(){q('[data-film-error]').hidden=false;}
  function run(){load();v.play().catch(()=>{player.classList.add('paused');});}
  function sync(){player.classList.toggle('paused',v.paused);play.textContent=v.paused?'▷':'Ⅱ';play.setAttribute('aria-label',v.paused?'Воспроизвести':'Пауза');sound.textContent=v.muted?'Без звука':'Звук включён';sound.setAttribute('aria-label',v.muted?'Включить звук':'Выключить звук');sound.setAttribute('aria-pressed',String(!v.muted));}
  play.addEventListener('click',()=>{pausedByUser=!v.paused;if(v.paused)run();else v.pause();});
  sound.addEventListener('click',()=>{v.muted=!v.muted;sync();if(v.paused){pausedByUser=false;run();}});
  const fmt=n=>`${Math.floor((n||0)/60)}:${String(Math.floor((n||0)%60)).padStart(2,'0')}`;
  v.addEventListener('play',sync);v.addEventListener('pause',sync);v.addEventListener('volumechange',sync);v.addEventListener('error',error);
  v.addEventListener('loadedmetadata',()=>seek.max=v.duration);
  v.addEventListener('timeupdate',()=>{seek.value=v.currentTime;q('[data-film-time]').textContent=fmt(v.currentTime)+' / '+fmt(v.duration);});
  seek.addEventListener('input',()=>{if(loaded&&Number.isFinite(v.duration))v.currentTime=Number(seek.value);});
  function expanded(on){player.classList.toggle('expanded',on);document.body.classList.toggle('cinema-full',on);full.setAttribute('aria-label',on?'Выйти из полного экрана':'На весь экран');}
  async function fullscreen(){if(player.classList.contains('expanded')){expanded(false);if(document.fullscreenElement)await document.exitFullscreen();return;}expanded(true);try{if(document.fullscreenEnabled)await player.requestFullscreen();}catch{/* viewport fallback */}}
  full.addEventListener('click',fullscreen);document.addEventListener('fullscreenchange',()=>expanded(Boolean(document.fullscreenElement)));
  q('[data-cinema-watch]').addEventListener('click',()=>{v.muted=false;pausedByUser=false;run();sync();fullscreen();});
  player.addEventListener('keydown',e=>{if(e.target!==player)return;if(e.key===' '){e.preventDefault();play.click();}if(e.key==='m')sound.click();if(e.key==='f')full.click();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.fullscreenElement)expanded(false);});
  new IntersectionObserver(([e])=>{if(e.isIntersecting){load();if(!pausedByUser&&!reduced&&!document.hidden)run();}else{v.pause();v.muted=true;sync();}},{threshold:.45}).observe(player);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();v.pause();}else start();});
  sync();
})();
