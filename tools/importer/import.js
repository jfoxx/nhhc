/* global WebImporter */

const extractInlineMetadata = (main) => {
  const meta = {};
  const metaDiv = main.querySelector('div.meta');
  if (!metaDiv) return meta;

  const groups = metaDiv.querySelectorAll(':scope > div');
  groups.forEach((group) => {
    const titleEl = group.querySelector('.title');
    if (titleEl) {
      const key = titleEl.textContent.trim();
      titleEl.remove();
      const value = group.textContent.trim();
      if (key) {
        meta[key] = value;
      }
    }
  });

  metaDiv.remove();
  return meta;
};

const createMetadataBlock = (main, document, url) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.textContent.replace(/[\n\t]/gm, '');
  }

  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  const heroImg = main.querySelector('img');
  if (heroImg) {
    const el = document.createElement('img');
    el.src = heroImg.src;
    meta.Image = el;
  }

  const inlineMeta = extractInlineMetadata(main);
  Object.assign(meta, inlineMeta);

  meta.template = main.querySelector('#textImageHeader') ? 'interior-landing' : 'left-aside';

  if (meta.template === 'interior-landing' && url) {
    const segments = new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '').split('/').filter(Boolean);
    if (segments.length >= 2) {
      meta['Left Nav Section'] = segments[segments.length - 2];
    } else if (segments.length === 1) {
      meta['Left Nav Section'] = segments[0];
    }
  }

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
};

export default {
  transformDOM: ({ document, url }) => {
    const main = document.getElementById('mainContainer');

    WebImporter.DOMUtils.remove(main, [
      'header',
      'footer',
      'div.header',
      'div.topNav',
      'div.footerWrap',
      'div.bottomFooter',
      'div.modal',
      '#breadcrumbContainer',
      '.lnavWrapper',
      '.one:has(.breadcrumb)',
      '.descriptionText',
      '#textImageTitle',
    ]);

    main.querySelectorAll('div.altCap > p').forEach((p) => {
      const em = document.createElement('em');
      em.textContent = p.textContent;
      p.textContent = '';
      p.append(em);
    });

    const titleP = main.querySelector('div.titleContainer p');
    if (titleP) {
      const h1 = document.createElement('h1');
      h1.textContent = titleP.textContent;
      titleP.replaceWith(h1);
    }

    const rollup = main.querySelector('#pageRollupListContainer');
    if (rollup) {
      const cells = rollup.querySelectorAll('.tableCell');
      const rows = [];
      cells.forEach((cell) => {
        const img = cell.querySelector('img');
        const link = cell.querySelector('a');
        if (link) {
          const imgCol = document.createElement('div');
          if (img) imgCol.append(img);
          const textCol = document.createElement('div');
          textCol.append(link);
          rows.push([imgCol, textCol]);
        }
      });
      if (rows.length) {
        const table = WebImporter.DOMUtils.createTable(
          [['Cards'], ...rows],
          document,
        );
        rollup.replaceWith(table);
      }
    }

    createMetadataBlock(main, document, url);

    return main;
  },

  // eslint-disable-next-line no-unused-vars
  generateDocumentPath: ({ document, url }) => {
    let p = new URL(url).pathname;
    if (p.endsWith('/')) {
      p = `${p}index`;
    }
    return WebImporter.FileUtils.sanitizePath(p);
  },
};
