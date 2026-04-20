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

  const publishedDate = main.querySelector('#publishedDate');
  if (publishedDate) {
    const dateText = publishedDate.textContent.replace(/^Published:\s*/i, '').trim();
    if (dateText) {
      meta['Published Date'] = dateText;
    }
    publishedDate.remove();
  }

  const inlineMeta = extractInlineMetadata(main);
  Object.assign(meta, inlineMeta);

  if (main.dataset.tihDetected) {
    meta.template = 'today-in-history';
    const synopsis = main.querySelector('.synopsis');
    if (synopsis) {
      meta.Description = synopsis.textContent.trim();
    }
  } else if (url && new URL(url).pathname.includes('/danfs/')) {
    meta.template = 'danfs';
  } else if (main.querySelector('#textImageHeader')) {
    meta.template = 'interior-landing';
  } else {
    meta.template = 'left-aside';
  }

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

    const tihCheck = main.querySelector('div.title');
    if (tihCheck && tihCheck.textContent.trim() === 'Today in Naval History') {
      main.dataset.tihDetected = 'true';
    }

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

    main.querySelectorAll('.annotation-popup').forEach((el) => {
      const clone = el.cloneNode(true);
      const hideLink = clone.querySelector('a');
      if (hideLink && hideLink.textContent.trim().toLowerCase() === 'hide') {
        hideLink.remove();
      }
      if (!clone.textContent.trim()) {
        el.remove();
      }
    });

    main.querySelectorAll('.footnotes').forEach((el) => {
      const clone = el.cloneNode(true);
      const header = clone.querySelector('.footnoteHeader');
      if (header) header.remove();
      if (!clone.textContent.trim()) {
        el.remove();
      }
    });

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

    const tihTitleDiv = main.querySelector('div.title');
    if (tihTitleDiv && tihTitleDiv.textContent.trim() === 'Today in Naval History') {
      const h1 = document.createElement('h1');
      h1.textContent = tihTitleDiv.textContent.trim();
      tihTitleDiv.replaceWith(h1);

      const dateDiv = main.querySelector('div.date');
      if (dateDiv) {
        const h2 = document.createElement('h2');
        h2.textContent = dateDiv.textContent.trim();
        const hr = document.createElement('hr');
        dateDiv.replaceWith(h2, hr);
      }

      const rightContent = main.querySelector('.rightContent');
      if (rightContent) rightContent.remove();

      main.querySelectorAll('.todayInHistoryListDate').forEach((el) => {
        const h3 = document.createElement('h3');
        h3.textContent = el.textContent.trim();
        el.replaceWith(h3);
      });

      const leftContent = main.querySelector('.leftContent');
      if (leftContent) {
        const firstCol = leftContent.querySelector('.column.first');
        const lastCol = leftContent.querySelector('.column.last');
        if (firstCol && lastCol) {
          const firstDiv = document.createElement('div');
          while (firstCol.firstChild) firstDiv.append(firstCol.firstChild);
          const lastDiv = document.createElement('div');
          while (lastCol.firstChild) lastDiv.append(lastCol.firstChild);
          const cells = [['Columns'], [firstDiv, lastDiv]];
          const block = WebImporter.DOMUtils.createTable(cells, document);
          firstCol.after(block);
          firstCol.remove();
          lastCol.remove();
        }
      }
    }

    createMetadataBlock(main, document, url);

    return main;
  },

  // eslint-disable-next-line no-unused-vars
  generateDocumentPath: ({ document, url }) => {
    let p = new URL(url).pathname;
    p = p.replace(/\.html$/, '');
    if (p.endsWith('/')) {
      p = `${p}index`;
    }
    return WebImporter.FileUtils.sanitizePath(p);
  },
};
