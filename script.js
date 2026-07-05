const body = document.body;
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const modal = document.querySelector('.modal');
const modalClose = document.querySelector('.modal__close');

function syncHeader() {
  header?.classList.toggle('is-scrolled', window.scrollY > 24);
}

syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

menuToggle?.addEventListener('click', () => {
  const open = body.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(open));
});

nav?.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    body.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }
});

function openModal() {
  modal?.classList.add('is-open');
  modal?.setAttribute('aria-hidden', 'false');
  body.classList.add('modal-open');
}

function closeModal() {
  modal?.classList.remove('is-open');
  modal?.setAttribute('aria-hidden', 'true');
  body.classList.remove('modal-open');
}

document.querySelectorAll('[data-open-modal]').forEach((button) => {
  button.addEventListener('click', openModal);
});

modalClose?.addEventListener('click', closeModal);

modal?.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});

document.querySelectorAll('form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    closeModal();
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach((node) => revealObserver.observe(node));

const panelObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    entry.target.classList.toggle('is-current', entry.isIntersecting);
  });
}, { threshold: 0.42 });

document.querySelectorAll('.panel').forEach((panel) => panelObserver.observe(panel));

function createSimpleSlider({ trackSelector, prevSelector, nextSelector, countSelector, autoMs = 0 }) {
  const figures = [...document.querySelectorAll(`${trackSelector} figure`)];
  const prev = document.querySelector(prevSelector);
  const next = document.querySelector(nextSelector);
  const count = countSelector ? document.querySelector(countSelector) : null;
  const scope = figures[0]?.closest('section');
  let active = 0;
  let timerId;

  if (!figures.length) return null;

  function render(index) {
    active = (index + figures.length) % figures.length;
    const nextIndex = (active + 1) % figures.length;
    figures.forEach((figure, figureIndex) => {
      figure.classList.toggle('is-active', figureIndex === active);
      figure.classList.toggle('is-next', figureIndex === nextIndex);
    });
    if (count) count.textContent = `${active + 1} / ${figures.length}`;
  }

  function stopAuto() {
    if (timerId) window.clearInterval(timerId);
  }

  function startAuto() {
    if (!autoMs || figures.length < 2) return;
    stopAuto();
    timerId = window.setInterval(() => render(active + 1), autoMs);
  }

  function goTo(index) {
    render(index);
    startAuto();
  }

  prev?.addEventListener('click', () => goTo(active - 1));
  next?.addEventListener('click', () => goTo(active + 1));
  scope?.addEventListener('mouseenter', stopAuto);
  scope?.addEventListener('mouseleave', startAuto);
  render(0);
  startAuto();

  return {
    figures,
    goTo,
    next: () => goTo(active + 1),
    prev: () => goTo(active - 1),
    getActive: () => active
  };
}

createSimpleSlider({
  trackSelector: '[data-plan-track]',
  prevSelector: '[data-plan-prev]',
  nextSelector: '[data-plan-next]',
  countSelector: '[data-plan-count]'
});

const gallerySlider = createSimpleSlider({
  trackSelector: '[data-gallery-track]',
  prevSelector: '[data-gallery-prev]',
  nextSelector: '[data-gallery-next]',
  autoMs: 5200
});

const infraPanels = [...document.querySelectorAll('[data-infra-panel]')];
const infraBackgrounds = [...document.querySelectorAll('.infra-bg figure')];

function activateInfra(panel) {
  const activeIndex = Number(panel.dataset.infraIndex || 0);
  infraPanels.forEach((item) => item.classList.toggle('is-active', item === panel));
  infraBackgrounds.forEach((item, index) => item.classList.toggle('is-active', index === activeIndex));
}

infraPanels.forEach((panel) => {
  panel.addEventListener('mouseenter', () => activateInfra(panel));
  panel.addEventListener('click', () => activateInfra(panel));
});

/* ---------- Modern interaction layer ---------- */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Scroll progress bar */
const scrollProgress = document.querySelector('[data-scroll-progress]');

function syncScrollProgress() {
  if (!scrollProgress) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  scrollProgress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}

syncScrollProgress();
window.addEventListener('scroll', syncScrollProgress, { passive: true });
window.addEventListener('resize', syncScrollProgress);

/* Dot navigation built from the primary nav */
const dotNav = document.querySelector('.dot-nav');
const navLinks = [...document.querySelectorAll('.nav a')];

if (dotNav) {
  navLinks.forEach((link) => {
    const label = link.textContent.trim();
    const target = link.getAttribute('href');
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.dataset.target = target;
    dot.setAttribute('aria-label', label);
    const tooltip = document.createElement('span');
    tooltip.className = 'dot-nav__tooltip';
    tooltip.textContent = label;
    dot.appendChild(tooltip);
    dot.addEventListener('click', () => {
      document.querySelector(target)?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
    dotNav.appendChild(dot);
  });
}

/* Scrollspy: highlight nav links + dots for the section in view.
   Picks the last section (in DOM order) whose top has crossed the trigger
   line, so exactly one section is ever active, even when a section (like
   the footer) is shorter than the viewport. */
const spySections = [...document.querySelectorAll('main section[id], footer[id]')];

function updateActiveSection() {
  if (!spySections.length) return;
  const triggerLine = window.innerHeight * 0.4;
  let currentId = spySections[0].id;
  for (const section of spySections) {
    if (section.getBoundingClientRect().top <= triggerLine) {
      currentId = section.id;
    } else {
      break;
    }
  }
  navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${currentId}`));
  dotNav?.querySelectorAll('button').forEach((dot) => dot.classList.toggle('is-active', dot.dataset.target === `#${currentId}`));
}

updateActiveSection();
window.addEventListener('scroll', updateActiveSection, { passive: true });
window.addEventListener('resize', updateActiveSection);

/* Split-word heading reveal */
function splitHeadingWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words
    .map((word, i) => `<span class="word" style="--i:${i}"><span class="word-inner">${word}</span></span>`)
    .join(' ');
  el.classList.add('split');
}

const splitTargets = [...document.querySelectorAll('main h2')];
splitTargets.forEach(splitHeadingWords);

const splitObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      splitObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

splitTargets.forEach((el) => splitObserver.observe(el));

/* Count-up numbers for stat figures */
function animateCountUp(el) {
  const original = el.textContent;
  const matches = [...original.matchAll(/\d+/g)];
  if (!matches.length) return;
  const duration = 1300;
  const start = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    let result = '';
    let lastIndex = 0;
    matches.forEach((match) => {
      const target = parseInt(match[0], 10);
      const current = Math.round(target * eased);
      result += original.slice(lastIndex, match.index) + current;
      lastIndex = match.index + match[0].length;
    });
    result += original.slice(lastIndex);
    el.textContent = result;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = original;
  }

  requestAnimationFrame(tick);
}

const countTargets = [...document.querySelectorAll('.about__facts strong, .location__metrics strong, .map__distances strong')];

if (prefersReducedMotion) {
  // Leave static values as authored.
} else {
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCountUp(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  countTargets.forEach((el) => countObserver.observe(el));
}

/* Cursor-reactive spotlight glow on cards */
if (isFinePointer) {
  const spotlightCards = document.querySelectorAll('.about__facts > div, .location__metrics > div, .map__distances > div, .infra-accordion article');
  spotlightCards.forEach((card) => {
    card.classList.add('spotlight');
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
  });
}

/* Gallery lightbox */
const lightbox = document.querySelector('.lightbox');
const lightboxImg = lightbox?.querySelector('.lightbox__img');
const galleryFigures = [...document.querySelectorAll('[data-gallery-track] figure')];

function updateLightboxImage() {
  if (!gallerySlider || !lightboxImg) return;
  const figure = gallerySlider.figures[gallerySlider.getActive()];
  const img = figure?.querySelector('img');
  if (img) {
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt;
  }
}

function openLightbox(index) {
  if (!lightbox || !gallerySlider) return;
  gallerySlider.goTo(index);
  updateLightboxImage();
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  body.classList.add('modal-open');
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  body.classList.remove('modal-open');
}

galleryFigures.forEach((figure, index) => {
  figure.setAttribute('tabindex', '0');
  figure.setAttribute('role', 'button');
  figure.setAttribute('aria-label', `Открыть фото ${index + 1} на весь экран`);
  figure.addEventListener('click', () => openLightbox(index));
  figure.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLightbox(index);
    }
  });
});

lightbox?.querySelector('.lightbox__close')?.addEventListener('click', closeLightbox);
lightbox?.querySelector('.lightbox__prev')?.addEventListener('click', () => {
  gallerySlider?.prev();
  updateLightboxImage();
});
lightbox?.querySelector('.lightbox__next')?.addEventListener('click', () => {
  gallerySlider?.next();
  updateLightboxImage();
});
lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (event) => {
  if (!lightbox?.classList.contains('is-open')) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') { gallerySlider?.prev(); updateLightboxImage(); }
  if (event.key === 'ArrowRight') { gallerySlider?.next(); updateLightboxImage(); }
});

/* Custom cursor + magnetic buttons (desktop, motion-safe only) */
if (isFinePointer && !prefersReducedMotion) {
  body.classList.add('has-cursor');

  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  if (cursorDot) {
    cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate3d(-50%, -50%, 0)`;
  }

  window.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    if (cursorDot) {
      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate3d(-50%, -50%, 0)`;
    }
  });

  function trackRing() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    if (cursorRing) {
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate3d(-50%, -50%, 0)`;
    }
    requestAnimationFrame(trackRing);
  }
  requestAnimationFrame(trackRing);

  const hoverTargets = document.querySelectorAll('a, button, [role="button"]');
  hoverTargets.forEach((el) => {
    el.addEventListener('mouseenter', () => body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => body.classList.remove('cursor-hover'));
  });

  const magneticTargets = document.querySelectorAll('.primary-btn, .header-call, .text-button');
  magneticTargets.forEach((el) => {
    el.classList.add('magnetic');
    el.addEventListener('mousemove', (event) => {
      const rect = el.getBoundingClientRect();
      const relX = event.clientX - (rect.left + rect.width / 2);
      const relY = event.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate3d(${relX * 0.28}px, ${relY * 0.4}px, 0)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate3d(0, 0, 0)';
    });
  });

  /* Subtle mouse-parallax on the hero logo */
  const heroTitle = document.querySelector('.hero__title');
  const heroSection = document.querySelector('.hero');
  if (heroTitle && heroSection) {
    heroSection.addEventListener('mousemove', (event) => {
      const rect = heroSection.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width - 0.5;
      const relY = (event.clientY - rect.top) / rect.height - 0.5;
      heroTitle.style.transform = `translate3d(${relX * 18}px, ${relY * 14}px, 0)`;
    });
    heroSection.addEventListener('mouseleave', () => {
      heroTitle.style.transform = 'translate3d(0, 0, 0)';
    });
  }
}
