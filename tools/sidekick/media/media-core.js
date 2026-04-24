/**
 * Fetches all rows from a Helix query index (paginated JSON API).
 * @param {string} indexPath e.g. /media-index.json
 * @returns {Promise<object[]>}
 */
export async function fetchMediaIndex(indexPath) {
  const rows = [];
  let offset = 0;
  const limit = 512;
  const { origin } = window.location;

  for (;;) {
    const url = `${origin}${indexPath}?offset=${offset}&limit=${limit}`;
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Could not load index (${res.status}): ${url}`);
    }
    // eslint-disable-next-line no-await-in-loop
    const json = await res.json();
    const data = json.data || [];
    rows.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return rows;
}

/**
 * Map preview / dev hosts to the published EDS live host authors expect for assets.
 * @param {string} origin window.location.origin from the palette iframe
 * @param {string} path site path starting with /
 * @returns {string}
 */
export function toPublishedAssetUrl(origin, path) {
  if (!path || path[0] !== '/') {
    return path;
  }
  try {
    const u = new URL(origin);
    if (u.hostname.endsWith('.aem.page')) {
      u.hostname = u.hostname.replace(/\.aem\.page$/i, '.aem.live');
    }
    return `${u.origin}${path}`;
  } catch {
    return `${origin}${path}`;
  }
}

/**
 * @param {object[]} rows
 * @param {string} query
 * @returns {object[]}
 */
export function filterRows(rows, query) {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => {
    const title = String(r.title || '').toLowerCase();
    const p = String(r.path || '').toLowerCase();
    return title.includes(q) || p.includes(q);
  });
}

/**
 * @param {HTMLElement} container
 * @param {object} [options]
 * @param {string} [options.indexPath]
 * @param {string} [options.initialQuery]
 * @param {(msg: string, variant?: string) => void} [options.onToast]
 */
export async function mountMediaPicker(container, options = {}) {
  const {
    indexPath = '/media-index.json',
    initialQuery = '',
    onToast,
  } = options;

  const toast = (message, variant = 'positive') => {
    if (onToast) onToast(message, variant);
  };

  container.replaceChildren();
  container.className = 'media-picker';

  const header = document.createElement('div');
  header.className = 'media-picker-header';
  const title = document.createElement('h1');
  title.className = 'media-picker-title';
  title.textContent = 'Published media';
  const hint = document.createElement('p');
  hint.className = 'media-picker-hint';
  hint.textContent = 'Search your media index and copy the published EDS URL (.aem.live).';
  header.append(title, hint);

  const search = document.createElement('input');
  search.className = 'media-picker-search';
  search.type = 'search';
  search.placeholder = 'Filter by title or path…';
  search.setAttribute('aria-label', 'Filter media');
  search.value = initialQuery;

  const status = document.createElement('p');
  status.className = 'media-picker-status';
  status.setAttribute('role', 'status');

  const list = document.createElement('ul');
  list.className = 'media-picker-list';

  container.append(header, search, status, list);

  let rows = [];
  try {
    status.textContent = 'Loading index…';
    rows = await fetchMediaIndex(indexPath);
    status.textContent = `${rows.length} asset${rows.length === 1 ? '' : 's'} indexed`;
  } catch (e) {
    status.textContent = e instanceof Error ? e.message : 'Failed to load index';
    toast(status.textContent, 'negative');
    return;
  }

  const render = (query) => {
    const filtered = filterRows(rows, query);
    list.replaceChildren();
    if (filtered.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'media-picker-empty';
      empty.textContent = 'No matches.';
      list.append(empty);
      return;
    }

    const { origin } = window.location;
    filtered.forEach((row) => {
      const path = row.path || '';
      const label = row.title || path || 'Untitled';
      const published = toPublishedAssetUrl(origin, path);

      const li = document.createElement('li');
      li.className = 'media-picker-item';

      const textWrap = document.createElement('div');
      textWrap.className = 'media-picker-item-text';
      const nameEl = document.createElement('span');
      nameEl.className = 'media-picker-item-title';
      nameEl.textContent = label;
      const pathEl = document.createElement('span');
      pathEl.className = 'media-picker-item-path';
      pathEl.textContent = path;
      textWrap.append(nameEl, pathEl);

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'media-picker-copy';
      copyBtn.textContent = 'Copy URL';
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(published);
          toast('Copied published URL');
        } catch {
          toast('Copy failed', 'negative');
        }
      });

      li.append(textWrap, copyBtn);
      list.append(li);
    });
  };

  let t = null;
  search.addEventListener('input', () => {
    clearTimeout(t);
    t = window.setTimeout(() => render(search.value), 150);
  });

  render(search.value);
}
