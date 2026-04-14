import { loadFragment } from '../fragment/fragment.js';
import { getMetadata } from '../../scripts/aem.js';

function buildAccordionItems(ul, currentPath) {
  ul.querySelectorAll(':scope > li').forEach((li) => {
    const link = li.querySelector(':scope > a');
    const sublist = li.querySelector(':scope > ul');

    if (link) {
      link.classList.add('accordion-nav-link');
      const linkPath = new URL(link.href, window.location).pathname;
      if (linkPath === currentPath) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    }

    if (sublist) {
      const trigger = document.createElement('button');
      trigger.className = 'accordion-nav-trigger';
      trigger.setAttribute('aria-expanded', 'false');
      if (link) {
        trigger.textContent = link.textContent;
        link.remove();
      } else {
        trigger.textContent = li.firstChild.textContent;
        li.firstChild.remove();
      }

      const panel = document.createElement('div');
      panel.className = 'accordion-nav-panel';
      panel.setAttribute('role', 'region');
      panel.hidden = true;
      sublist.remove();
      panel.append(sublist);

      li.prepend(trigger);
      li.append(panel);

      const containsActive = sublist.querySelector('.active, [aria-current="page"]')
        || [...sublist.querySelectorAll('a')].some(
          (a) => new URL(a.href, window.location).pathname === currentPath,
        );

      if (containsActive || li.classList.contains('force-open')) {
        trigger.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        li.classList.remove('force-open');
      }

      trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        panel.hidden = expanded;
      });

      buildAccordionItems(sublist, currentPath);
    }
  });
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav/header';
  const fragment = await loadFragment(navPath);

  if (!fragment) return;

  const nav = document.createElement('nav');
  nav.className = 'accordion-nav-content';
  nav.setAttribute('aria-label', 'Section navigation');

  const sections = fragment.querySelector('.nav-sections, .section:nth-child(2)');
  if (!sections) return;

  const ul = sections.querySelector('ul');
  if (!ul) return;

  const navList = ul.cloneNode(true);
  navList.className = 'accordion-nav-list';

  const firstItem = navList.querySelector(':scope > li');
  if (firstItem && firstItem.textContent.trim() === 'Home') firstItem.remove();

  const sectionFilter = getMetadata('left-nav-section');
  if (sectionFilter) {
    const match = [...navList.querySelectorAll(':scope > li')].find((li) => {
      const link = li.querySelector(':scope > a');
      const text = link ? link.textContent.trim() : li.firstChild?.textContent?.trim();
      return text && text.toLowerCase() === sectionFilter.toLowerCase();
    });
    if (match) {
      navList.textContent = '';
      navList.append(match);
      match.classList.add('force-open');
    }
  }

  buildAccordionItems(navList, window.location.pathname);

  nav.append(navList);
  block.textContent = '';
  block.append(nav);
}
