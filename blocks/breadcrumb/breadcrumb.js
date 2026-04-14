import { loadFragment } from '../fragment/fragment.js';
import { getMetadata } from '../../scripts/aem.js';

function buildPathMap(ul, map, basePath = '') {
  ul.querySelectorAll(':scope > li').forEach((li) => {
    const link = li.querySelector(':scope > a');
    const sublist = li.querySelector(':scope > ul');
    if (link) {
      const path = new URL(link.href, window.location).pathname;
      map.set(path, link.textContent.trim());
    }
    if (sublist) {
      const parentPath = link
        ? new URL(link.href, window.location).pathname
        : basePath;
      buildPathMap(sublist, map, parentPath);
    }
  });
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav/header';
  const fragment = await loadFragment(navPath);

  if (!fragment) return;

  const sections = fragment.querySelector('.nav-sections, .section:nth-child(2)');
  const titleMap = new Map();
  if (sections) {
    const ul = sections.querySelector('ul');
    if (ul) buildPathMap(ul, titleMap);
  }

  const currentPath = window.location.pathname;
  const segments = currentPath.replace(/^\/|\/$/g, '').split('/');

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');

  const homeLi = document.createElement('li');
  const homeLink = document.createElement('a');
  homeLink.href = '/';
  homeLink.textContent = 'Home';
  homeLi.append(homeLink);
  ol.append(homeLi);

  let builtPath = '';
  segments.forEach((segment, i) => {
    builtPath += `/${segment}`;
    const li = document.createElement('li');
    const isLast = i === segments.length - 1;

    if (isLast) {
      const span = document.createElement('span');
      span.setAttribute('aria-current', 'page');
      span.textContent = document.title || titleMap.get(builtPath) || segment;
      li.append(span);
    } else {
      const link = document.createElement('a');
      link.href = builtPath;
      link.textContent = titleMap.get(builtPath) || segment;
      li.append(link);
    }

    ol.append(li);
  });

  block.textContent = '';
  block.append(nav);
  nav.append(ol);
}
