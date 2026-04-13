import { fetchPlaceholders } from '../../scripts/placeholders.js';

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    const button = indicator.querySelector('button');
    if (idx !== slideIndex) {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-current');
    } else {
      button.setAttribute('disabled', true);
      button.setAttribute('aria-current', true);
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

function decorateAccordion(block, rows, id) {
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');
  block.dataset.activeSlide = 0;

  const accordionPanel = document.createElement('div');
  accordionPanel.classList.add('carousel-accordion-panel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');

  rows.forEach((row, idx) => {
    const contentCol = row.querySelector(':scope > div:first-child');
    const imageCol = row.querySelector(':scope > div:last-child');

    const titleEl = contentCol.querySelector('strong');
    const title = titleEl ? titleEl.textContent : `Slide ${idx + 1}`;

    const descParts = [];
    contentCol.querySelectorAll('p').forEach((p) => {
      if (!p.querySelector('strong')) {
        descParts.push(p.innerHTML);
      }
    });
    const description = descParts.join('');

    const item = document.createElement('div');
    item.classList.add('carousel-accordion-item');
    if (idx === 0) item.classList.add('active');
    item.dataset.slideIndex = idx;

    const trigger = document.createElement('button');
    trigger.classList.add('carousel-accordion-trigger');
    trigger.setAttribute('type', 'button');
    trigger.setAttribute('aria-expanded', idx === 0 ? 'true' : 'false');
    trigger.setAttribute('aria-controls', `carousel-${id}-accordion-content-${idx}`);
    trigger.textContent = title;

    const content = document.createElement('div');
    content.classList.add('carousel-accordion-content');
    content.setAttribute('id', `carousel-${id}-accordion-content-${idx}`);
    content.setAttribute('role', 'region');
    if (description) content.innerHTML = `<p>${description}</p>`;

    item.append(trigger, content);
    accordionPanel.append(item);

    const slide = document.createElement('li');
    slide.dataset.slideIndex = idx;
    slide.setAttribute('id', `carousel-${id}-slide-${idx}`);
    slide.classList.add('carousel-slide');
    slide.setAttribute('aria-hidden', idx !== 0);

    imageCol.classList.add('carousel-slide-image');
    slide.append(imageCol);
    slidesWrapper.append(slide);

    row.remove();
  });

  accordionPanel.addEventListener('click', (e) => {
    const trigger = e.target.closest('.carousel-accordion-trigger');
    if (!trigger) return;

    const item = trigger.closest('.carousel-accordion-item');
    const slideIdx = parseInt(item.dataset.slideIndex, 10);

    accordionPanel.querySelectorAll('.carousel-accordion-item').forEach((it, i) => {
      const isActive = i === slideIdx;
      it.classList.toggle('active', isActive);
      it.querySelector('.carousel-accordion-trigger').setAttribute('aria-expanded', isActive);
    });

    showSlide(block, slideIdx);
  });

  const slideNavButtons = document.createElement('div');
  slideNavButtons.classList.add('carousel-navigation-buttons');
  slideNavButtons.innerHTML = `
    <button type="button" class="slide-prev" aria-label="Previous Slide"></button>
    <button type="button" class="slide-next" aria-label="Next Slide"></button>
  `;
  container.append(slideNavButtons);
  container.append(slidesWrapper);

  block.append(accordionPanel, container);

  slideNavButtons.querySelector('.slide-prev').addEventListener('click', () => {
    const next = parseInt(block.dataset.activeSlide, 10) - 1;
    const wrapped = next < 0 ? rows.length - 1 : next;
    accordionPanel.querySelector(`[data-slide-index="${wrapped}"] .carousel-accordion-trigger`).click();
  });
  slideNavButtons.querySelector('.slide-next').addEventListener('click', () => {
    const next = parseInt(block.dataset.activeSlide, 10) + 1;
    const wrapped = next >= rows.length ? 0 : next;
    accordionPanel.querySelector(`[data-slide-index="${wrapped}"] .carousel-accordion-trigger`).click();
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = parseInt(entry.target.dataset.slideIndex, 10);
        block.dataset.activeSlide = idx;
        accordionPanel.querySelectorAll('.carousel-accordion-item').forEach((it, i) => {
          const isActive = i === idx;
          it.classList.toggle('active', isActive);
          it.querySelector('.carousel-accordion-trigger').setAttribute('aria-expanded', isActive);
        });
      }
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-slide').forEach((slide) => slideObserver.observe(slide));
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isAccordion = block.classList.contains('accordion');

  if (isAccordion) {
    decorateAccordion(block, rows, carouselId);
    return;
  }

  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute(
      'aria-label',
      placeholders.carouselSlideControls || 'Carousel Slide Controls',
    );
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class="slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;

    container.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
  }
}
