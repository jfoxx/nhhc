import {
  buildBlock, decorateBlock, loadBlock,
} from '../../scripts/aem.js';

export default async function decorate(doc) {
  const main = doc.querySelector('main');
  if (!main) return;

  const breadcrumbBand = document.createElement('div');
  breadcrumbBand.className = 'breadcrumb-band';
  const breadcrumbBlockWrapper = document.createElement('div');
  const breadcrumb = buildBlock('breadcrumb', '');
  breadcrumbBlockWrapper.append(breadcrumb);
  breadcrumbBand.append(breadcrumbBlockWrapper);
  decorateBlock(breadcrumb);

  const aside = document.createElement('div');
  aside.className = 'aside';

  const navBlockWrapper = document.createElement('div');
  const accordionNav = buildBlock('accordion-nav', '');
  navBlockWrapper.append(accordionNav);
  aside.append(navBlockWrapper);
  decorateBlock(accordionNav);

  const metaTags = doc.head.querySelectorAll('meta[name]');
  const skip = [
    'viewport', 'template', 'theme', 'description',
    'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image',
  ];

  const dl = document.createElement('dl');
  metaTags.forEach((tag) => {
    const { name } = tag;
    if (skip.includes(name) || name.startsWith('og:')) return;

    const dt = document.createElement('dt');
    dt.textContent = name;
    dl.append(dt);

    if (tag.content) {
      const dd = document.createElement('dd');
      dd.textContent = tag.content;
      dl.append(dd);
    }
  });

  if (dl.children.length > 0) {
    aside.append(dl);
  }

  const columnsWrapper = document.createElement('div');
  columnsWrapper.className = 'left-aside-columns';

  columnsWrapper.append(aside);
  [...main.querySelectorAll(':scope > .section')].forEach((section) => {
    columnsWrapper.append(section);
  });

  main.textContent = '';
  main.append(breadcrumbBand);
  main.append(columnsWrapper);

  await loadBlock(breadcrumb);
  await loadBlock(accordionNav);
}
