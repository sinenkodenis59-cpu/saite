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

  if (!figures.length) return;

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

  prev?.addEventListener('click', () => {
    render(active - 1);
    startAuto();
  });
  next?.addEventListener('click', () => {
    render(active + 1);
    startAuto();
  });
  scope?.addEventListener('mouseenter', stopAuto);
  scope?.addEventListener('mouseleave', startAuto);
  render(0);
  startAuto();
}

createSimpleSlider({
  trackSelector: '[data-plan-track]',
  prevSelector: '[data-plan-prev]',
  nextSelector: '[data-plan-next]',
  countSelector: '[data-plan-count]'
});

createSimpleSlider({
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
