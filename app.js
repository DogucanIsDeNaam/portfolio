// Typewriter/backspace (rustig, roles cyclisch)
(function typewriter(){
  const el = document.getElementById('typewriter');
  if(!el) return;
  const roles = ['Software Developer', 'Cybersecurity Student', 'Beveiliger'];
  const typeDelay = 70, eraseDelay = 40, hold = 1400;
  let idx = 0, pos = 0, erasing = false;

  function tick(){
    const word = roles[idx];
    if(!erasing){
      el.textContent = word.slice(0, ++pos);
      if(pos === word.length){ erasing = true; setTimeout(tick, hold); return; }
      setTimeout(tick, typeDelay);
    }else{
      el.textContent = word.slice(0, --pos);
      if(pos === 0){ erasing = false; idx = (idx+1)%roles.length; setTimeout(tick, 320); return; }
      setTimeout(tick, eraseDelay);
    }
  }
  tick();
})();

// Scroll reveal (IntersectionObserver, subtiel)
(function revealBlocks(){
  const blocks = document.querySelectorAll('#xp .list-group-item, #edu .list-group-item');
  if(!blocks.length) return;
  const io = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.animate(
          [{transform:'translateY(10px)', opacity:0},{transform:'translateY(0)', opacity:1}],
          {duration:360, easing:'cubic-bezier(.2,.6,.2,1)', fill:'forwards'}
        );
        io.unobserve(entry.target);
      }
    });
  }, {threshold:.12});
  blocks.forEach(b=>io.observe(b));
})();

// Navbar active link on scroll (Bootstrap anchors)
(function activeLinks(){
  const links = Array.from(document.querySelectorAll('.navbar .nav-link'));
  if(!links.length) return;

  const map = new Map();
  links.forEach(l=>{
    const href = l.getAttribute('href');
    if(href && href.startsWith('#')){
      const sec = document.querySelector(href);
      if(sec) map.set(sec, l);
    }
  });

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      const link = map.get(entry.target);
      if(!link) return;
      if(entry.isIntersecting){
        links.forEach(a=>a.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, {rootMargin:'-45% 0px -45% 0px', threshold:0.01});

  map.forEach((_, sec)=>io.observe(sec));
})();

// Footer jaar
document.getElementById('year').textContent = new Date().getFullYear();

// ======= HACKY FLASHY HERO: MATRIX RAIN (langzamer) =======
(function matrixRain(){
  const canvas = document.getElementById('matrix');
  if(!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); // cap DPR for perf
  let width = 0, height = 0;

  // settings
  const glyphs = 'アイウエオカキクケコｱｲｳｴｵｶｷｸｹｺ0123456789{}[]()<>=+-*/#$_%&@';
const fontSizeBase = 32; // CSS pixels (was 16)
  let fontSize = fontSizeBase;
  let columns = 0;

  // per-column state
  let drops = [];     // y index (float)
  let speeds = [];    // per-column speed multiplier

  // timing
  const speedFactor = 0.5; // <— maak kleiner voor nóg langzamer, groter voor sneller
  let lastTime = performance.now();

  let running = true;
  let prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    const hero = document.getElementById('home');
    const rect = hero.getBoundingClientRect();

    width = Math.ceil(rect.width);
    height = Math.ceil(rect.height);

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

fontSize = Math.max(24, Math.min(44, Math.round(width / 30)));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

    columns = Math.floor(width / fontSize);
    drops = new Array(columns).fill(0).map(()=> Math.random()*(-40));
    speeds = new Array(columns).fill(0).map(()=> 0.6 + Math.random()*0.9); // tussen 0.6x en 1.5x
  }

  function randChar(){
    return glyphs[Math.floor(Math.random()*glyphs.length)];
  }

  function step(now){
    if(!running || prefersReduce) return;
    const dt = Math.min(0.05, (now - lastTime) / 1000); // seconds, clamp spike
    lastTime = now;

    // trail
    ctx.fillStyle = 'rgba(0, 16, 8, 0.14)';
    ctx.fillRect(0, 0, width, height);

    for(let i=0;i<columns;i++){
      const x = i * fontSize + (Math.random()<0.02? 1 : 0);
      const y = drops[i] * fontSize;

      // head
      ctx.fillStyle = 'rgba(0,255,123,0.95)';
      ctx.fillText(randChar(), x, y);
      // tail glow
      ctx.fillStyle = 'rgba(68,255,166,0.6)';
      ctx.fillText(randChar(), x, y - fontSize);

      // advance y with time-based speed
      drops[i] += speeds[i] * speedFactor * (60 * dt) / 1.0; // normalize naar ~60fps baseline

      // reset random
      if(y > height + Math.random()*200){
        drops[i] = Math.random()*(-20);
        speeds[i] = 0.6 + Math.random()*0.9;
      }
    }

    // vignette voor diepte
    const grd = ctx.createRadialGradient(width/2, height*0.6, Math.min(width,height)*0.2, width/2, height*0.6, Math.max(width,height));
    grd.addColorStop(0,'rgba(0,0,0,0)');
    grd.addColorStop(1,'rgba(0,0,0,0.25)');
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,width,height);

    requestAnimationFrame(step);
  }

  const hero = document.getElementById('home');
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      running = e.isIntersecting && !document.hidden;
      if(running && !prefersReduce){
        lastTime = performance.now();
        requestAnimationFrame(step);
      }
    });
  }, { threshold: 0.05 });
  io.observe(hero);

  document.addEventListener('visibilitychange', ()=>{
    running = !document.hidden;
    if(running && !prefersReduce){
      lastTime = performance.now();
      requestAnimationFrame(step);
    }
  });

  window.addEventListener('resize', ()=>{
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    resize();
  });

  resize();
  if(!prefersReduce){
    lastTime = performance.now();
    requestAnimationFrame(step);
  }
})();


// ===== Owl-achtige carousel (infinite, slow, pause, drag/swipe) =====
(function owlish(){
  const carousels = document.querySelectorAll('.owlish');
  if(!carousels.length) return;

  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  carousels.forEach(root=>{
    const track = root.querySelector('.owlish-track');
    const prev  = root.querySelector('.owlish-btn.prev');
    const next  = root.querySelector('.owlish-btn.next');

    const interval = parseInt(root.dataset.interval || '5000', 10); // 5s default
    const autoplay = (root.dataset.autoplay || 'true') === 'true' && !prefersReduce;

    const getStep = ()=> {
      const slide = track.querySelector('.owlish-slide');
      if(!slide) return 160;
      const gap = parseFloat(getComputedStyle(track).gap || '0');
      return slide.getBoundingClientRect().width + gap;
    };

    // === Infinite: clone slides at start + end
    const slides = Array.from(track.children);
    slides.forEach(slide=>{
      const cloneStart = slide.cloneNode(true);
      const cloneEnd   = slide.cloneNode(true);
      cloneStart.classList.add('clone');
      cloneEnd.classList.add('clone');
      track.insertBefore(cloneStart, track.firstChild);
      track.appendChild(cloneEnd);
    });

    const step = getStep();
    const totalSlides = slides.length;
    const scrollStart = step * totalSlides; // offset for real start
    track.scrollLeft = scrollStart;

    const normalizeScroll = ()=>{
      const max = step * totalSlides * 2;
      if(track.scrollLeft <= step * 0.5){
        // jump to end clones
        track.scrollLeft = track.scrollLeft + totalSlides * step;
      }
      if(track.scrollLeft >= max - step * 0.5){
        // jump back to start clones
        track.scrollLeft = track.scrollLeft - totalSlides * step;
      }
    };

    const stepBy = (dir=1)=>{
      track.scrollBy({ left: dir * step, behavior:'smooth' });
      setTimeout(normalizeScroll, 600); // after smooth
    };

    // Buttons
    prev?.addEventListener('click', ()=> stepBy(-1));
    next?.addEventListener('click', ()=> stepBy(1));

    // Keyboard
    track.addEventListener('keydown', (e)=>{
      if(e.key === 'ArrowRight'){ e.preventDefault(); stepBy(1); }
      if(e.key === 'ArrowLeft'){  e.preventDefault(); stepBy(-1); }
    });

    // Drag / swipe + pause
    let isDown=false, startX=0, startScroll=0;
    track.addEventListener('pointerdown', (e)=>{
      isDown=true;
      startX=e.clientX;
      startScroll=track.scrollLeft;
      track.setPointerCapture(e.pointerId);
      stop();
    });
    track.addEventListener('pointermove', (e)=>{
      if(!isDown) return;
      const dx=e.clientX-startX;
      track.scrollLeft=startScroll-dx;
      normalizeScroll();
    });
    const endDrag = (e)=>{
      if(!isDown) return;
      isDown=false;
      track.releasePointerCapture?.(e.pointerId);
      // snap naar dichtstbijzijnde tegel
      const snapped = Math.round(track.scrollLeft / step) * step;
      track.scrollTo({ left: snapped, behavior:'smooth' });
      normalizeScroll();
      start();
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    // Autoplay (slow, infinite)
    let timer=null;
    const start = ()=>{
      if(!autoplay) return;
      stop();
      timer=setInterval(()=>{
        stepBy(1);
      }, Math.max(3500, interval)); // minimaal 3.5s
    };
    const stop = ()=>{ if(timer){ clearInterval(timer); timer=null; } };

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    track.addEventListener('focusin', stop);
    track.addEventListener('focusout', start);

    // Normalize scroll bij scroll events
    track.addEventListener('scroll', ()=>{
      normalizeScroll();
    });

    start();
  });
})();
