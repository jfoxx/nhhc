import {
  buildBlock, decorateBlock, getMetadata, loadBlock,
} from '../../scripts/aem.js';

export default async function decorate(doc) {
  const main = doc.querySelector('main');
  if (!main) return;

  const firstSection = main.querySelector('.section');
  if (!firstSection) return;

  const picture = firstSection.querySelector('picture');
  const h1 = firstSection.querySelector('h1');

  const hero = document.createElement('div');
  hero.className = 'interior-landing-hero';
  if (picture) {
    hero.append(picture.closest('p') || picture);
  }

  const heroOverlay = document.createElement('div');
  heroOverlay.className = 'interior-landing-hero-overlay';
  const sectionName = getMetadata('left-nav-section');
  const breadcrumbLabel = document.createElement('span');
  breadcrumbLabel.className = 'hero-breadcrumb-label';
  breadcrumbLabel.textContent = 'NHHC /';
  heroOverlay.append(breadcrumbLabel);
  const heroTitle = document.createElement('span');
  heroTitle.className = 'hero-breadcrumb-title';
  const rawTitle = h1 ? h1.textContent : sectionName || doc.title;
  heroTitle.textContent = rawTitle.replace(/\b\w/g, (c) => c.toUpperCase());
  heroOverlay.append(heroTitle);
  if (h1) h1.remove();

  hero.append(heroOverlay);

  const defaultWrapper = firstSection.querySelector('.default-content-wrapper');
  if (defaultWrapper && !defaultWrapper.children.length) {
    defaultWrapper.remove();
  }
  if (!firstSection.children.length) {
    firstSection.remove();
  }

  const aside = document.createElement('div');
  aside.className = 'aside';

  const navBlockWrapper = document.createElement('div');
  const accordionNav = buildBlock('accordion-nav', '');
  navBlockWrapper.append(accordionNav);
  aside.append(navBlockWrapper);
  decorateBlock(accordionNav);

  const columnsWrapper = document.createElement('div');
  columnsWrapper.className = 'interior-landing-columns';

  columnsWrapper.append(aside);
  [...main.querySelectorAll(':scope > .section')].forEach((section) => {
    columnsWrapper.append(section);
  });

  main.textContent = '';
  main.append(hero);
  main.append(columnsWrapper);

  await loadBlock(accordionNav);
}
