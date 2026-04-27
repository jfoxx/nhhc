import {
  buildBlock,
  createOptimizedPicture,
  getMetadata,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  toClassName,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

const EDS_MEDIA_PATH = /^\/assets\/media_[a-f0-9]+/i;
const EDS_MEDIA_HOSTS = /\.(?:aem\.live|aem\.page|hlx\.live|hlx\.page)$/i;
const EDS_MEDIA_URL_RE = /https?:\/\/[^\s<>"')]*\.(?:aem|hlx)\.(?:live|page)\/assets\/media_[a-f0-9]+(?:\.[a-z0-9]+)?(?:\?[^\s<>"')]*)?/gi;
const SKIP_TEXT_ANCESTORS = 'a, picture, script, style, code, pre, textarea, title, noscript';

/**
 * Accepts any href whose path is /assets/media_<hex>..., whether the href is
 * a bare path (e.g. `/assets/media_abc.jpg`) or an absolute URL on an EDS
 * host (`*.aem.live`, `*.aem.page`, `*.hlx.live`, `*.hlx.page`).
 * @param {string} href
 * @returns {boolean}
 */
function isEdsMediaAssetReference(href) {
  if (!href) return false;
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#') || /^(?:mailto:|tel:|javascript:)/i.test(trimmed)) return false;
  if (trimmed.startsWith('/')) {
    return EDS_MEDIA_PATH.test(trimmed.split('?')[0]);
  }
  try {
    const u = new URL(trimmed);
    if (!EDS_MEDIA_HOSTS.test(u.hostname)) return false;
    return EDS_MEDIA_PATH.test(u.pathname);
  } catch {
    return false;
  }
}

/**
 * @param {string} href
 * @returns {string}
 */
function stripUrlQuery(href) {
  try {
    const u = new URL(href, window.location.href);
    u.search = '';
    return href.startsWith('/') && !/^https?:/i.test(href) ? u.pathname : u.toString();
  } catch {
    const i = href.indexOf('?');
    return i >= 0 ? href.slice(0, i) : href;
  }
}

/**
 * Turns pasted live EDS media URLs (in links or in plain text) into the same
 * picture markup createOptimizedPicture produces for local media. Handles
 * URLs whether they sit inside an anchor, are the only content of a
 * paragraph, or appear inline with surrounding text.
 * @param {Element} main
 */
function decorateLiveAssetMediaUrls(main) {
  const breakpoints = [
    { media: '(min-width: 600px)', width: '2000' },
    { width: '750' },
  ];

  [...main.querySelectorAll('a[href]')].forEach((a) => {
    if (a.closest('picture')) return;
    const raw = a.getAttribute('href');
    if (!isEdsMediaAssetReference(raw)) return;
    const href = stripUrlQuery(raw);
    const linkText = (a.textContent || '').trim();
    const alt = linkText && linkText !== raw.split('?')[0] && linkText !== href ? linkText : '';
    a.replaceWith(createOptimizedPicture(href, alt, false, breakpoints));
  });

  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !/\/assets\/media_[a-f0-9]/i.test(node.nodeValue)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (node.parentElement && node.parentElement.closest(SKIP_TEXT_ANCESTORS)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const textNodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) textNodes.push(n);

  textNodes.forEach((node) => {
    const text = node.nodeValue;
    const matches = [...text.matchAll(EDS_MEDIA_URL_RE)]
      .filter((m) => isEdsMediaAssetReference(m[0]));
    if (!matches.length) return;
    const frag = document.createDocumentFragment();
    let idx = 0;
    matches.forEach((m) => {
      if (m.index > idx) frag.append(text.slice(idx, m.index));
      frag.append(createOptimizedPicture(stripUrlQuery(m[0]), '', false, breakpoints));
      idx = m.index + m[0].length;
    });
    if (idx < text.length) frag.append(text.slice(idx));
    node.parentNode.replaceChild(frag, node);
  });
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    // Check if h1 or picture is already inside a hero block
    if (h1.closest('.hero') || picture.closest('.hero')) {
      return; // Don't create a duplicate hero block
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateLiveAssetMediaUrls(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

async function loadTemplate(doc) {
  const template = toClassName(getMetadata('template'));
  if (!template) return;
  try {
    const cssLoaded = loadCSS(`${window.hlx.codeBasePath}/templates/${template}/${template}.css`);
    const mod = await import(`../templates/${template}/${template}.js`);
    if (mod.default) {
      await mod.default(doc);
    }
    await cssLoaded;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to load template: ${template}`, error);
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  await loadTemplate(doc);

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
