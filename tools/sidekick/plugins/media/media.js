// Loaded at runtime from aem.live (Sidekick Library); not resolved by ESLint.
// eslint-disable-next-line import/no-unresolved
import { PLUGIN_EVENTS } from 'https://www.aem.live/tools/sidekick/library/events/events.js';

import { mountMediaPicker } from '../../media/media-core.js';

/**
 * Sidekick Library plugin: browse published media URLs from a query index.
 * Register in library.config.plugins.media with { src, indexPath }.
 * @param {HTMLElement} container
 * @param {object} _data rows from helix-media sheet (optional; index drives the UI)
 * @param {string} query search query from library chrome
 * @param {object} context plugin registration options
 */
export async function decorate(container, _data, query, context) {
  container.replaceChildren();
  const indexPath = context?.indexPath || '/media-index.json';

  const onToast = (message, variant = 'positive') => {
    container.dispatchEvent(new CustomEvent(PLUGIN_EVENTS.TOAST, {
      detail: { message, variant },
    }));
  };

  container.dispatchEvent(new CustomEvent(PLUGIN_EVENTS.SHOW_LOADER));
  try {
    await mountMediaPicker(container, {
      indexPath,
      initialQuery: query || '',
      onToast,
    });
  } finally {
    container.dispatchEvent(new CustomEvent(PLUGIN_EVENTS.HIDE_LOADER));
  }
}

export default {
  title: 'Media',
  searchEnabled: true,
};
